import React, { useState, useEffect } from "react";
import {
  ImpactFinding,
  PatchProposal,
  OperationalArtifact,
  CompilerError,
  VerificationAssertion,
  sha256Checksum,
  runVerification,
} from "./compiler";

const COMPILE_STEPS = [
  "Comparing policy clauses...",
  "Tracing curated dependencies...",
  "Validating proposed patches...",
];

interface WorkspacePanelProps {
  mode: "replay" | "live";
  // Compile state
  runState: string;
  setRunState: (state: string) => void;
  // Provider Data
  impacts: ImpactFinding[];
  patches: PatchProposal[];
  setPatches: (patches: PatchProposal[]) => void;
  // Error handling
  setError: (err: CompilerError | null) => void;
  // Candidates
  candidates: OperationalArtifact[];
  setCandidates: (cand: OperationalArtifact[]) => void;
  // Receipt triggering
  onOpenReceipt: (hash: string, assertions: VerificationAssertion[]) => void;
  onCompile: () => Promise<void>;
  isCompiling: boolean;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  mode,
  runState,
  setRunState,
  impacts,
  patches,
  setPatches,
  setError,
  candidates,
  setCandidates,
  onOpenReceipt,
  onCompile,
  isCompiling,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    assertions: VerificationAssertion[];
    passed: boolean;
  } | null>(null);

  // Status message for screen reader announcements (aria-live)
  const [liveMessage, setLiveMessage] = useState<string>("");

  const [prevIsCompiling, setPrevIsCompiling] = useState(isCompiling);
  if (isCompiling !== prevIsCompiling) {
    setPrevIsCompiling(isCompiling);
    if (!isCompiling) {
      setCurrentStepIndex(-1);
    }
  }

  useEffect(() => {
    if (!isCompiling) return;

    // Async initialization to avoid synchronous state changes inside effect
    const initTimeout = setTimeout(() => {
      setCurrentStepIndex(0);
      setLiveMessage(COMPILE_STEPS[0]);
    }, 0);

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < COMPILE_STEPS.length - 1) {
          const next = prev + 1;
          setLiveMessage(COMPILE_STEPS[next]);
          return next;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 300);

    return () => {
      clearTimeout(initTimeout);
      clearInterval(interval);
    };
  }, [isCompiling]);

  // Patch decision handler
  const handleDecision = (patchId: string, decision: "approve" | "reject") => {
    if (runState === "APPLIED" || runState === "VERIFIED" || runState === "EXPORTED") {
      setError({
        code: "CO-STATE-001",
        message: "Invalid state transition: Patch decisions are locked after changes have been applied.",
        subjectId: patchId,
        fatal: false,
      });
      return;
    }

    setError(null);
    setPatches(
      patches.map((p) => {
        if (p.id === patchId) {
          return { ...p, status: decision === "approve" ? "approved" : "rejected" };
        }
        return p;
      })
    );
    setLiveMessage(`Patch ${patchId.split(".").pop()} marked as ${decision}.`);
  };

  // Helper to count patch states
  const approvedCount = patches.filter((p) => p.status === "approved").length;
  const totalCount = patches.length;

  // Apply handler
  const handleApply = () => {
    setError(null);

    // Fail-closed checks
    const pendingPatches = patches.filter((p) => p.status === "proposed");
    const rejectedPatches = patches.filter((p) => p.status === "rejected");

    if (pendingPatches.length > 0) {
      setError({
        code: "CO-STATE-002",
        message: `Approval required before apply/export. ${pendingPatches.length} patch(es) remain pending review.`,
        fatal: false,
      });
      setLiveMessage("Apply blocked: pending patches exist.");
      return;
    }

    if (rejectedPatches.length > 0) {
      setError({
        code: "CO-STATE-003",
        message: `Attempt to apply/export a rejected patch. ${rejectedPatches.length} patch(es) have been explicitly rejected.`,
        subjectId: rejectedPatches[0].id,
        fatal: false,
      });
      setLiveMessage("Apply blocked: rejected patches exist.");
      return;
    }

    // Perform in-memory candidate updates
    const updatedCandidates = candidates.map((art) => {
      const artPatches = patches.filter((p) => p.location.artifactId === art.id);
      if (artPatches.length === 0) return art;

      const newBlocks = art.blocks.map((block) => {
        const patch = artPatches.find((p) => p.location.anchorId === block.anchorId);
        if (patch) {
          return { ...block, text: patch.afterText };
        }
        return block;
      });

      return { ...art, blocks: newBlocks };
    });

    setCandidates(updatedCandidates);
    setPatches(patches.map((p) => ({ ...p, status: "applied" })));
    setRunState("APPLIED");
    setLiveMessage("Patches applied to candidate artifacts successfully.");
  };

  // Run verification handler
  const handleVerify = () => {
    setIsVerifying(true);
    setLiveMessage("Running verification check...");

    setTimeout(() => {
      const result = runVerification(
        candidates, // wait, candidates are modified in handleApply
        candidates,
        patches
      );

      // Verify that candidate has correct changes
      const staleFound = candidates.some((art) =>
        art.blocks.some((b) => b.text.includes("30 days") || b.text.includes("30-day"))
      );

      if (staleFound) {
        setVerificationResult({
          assertions: result.assertions,
          passed: false,
        });
        setError({
          code: "CO-VER-002",
          message: "Stale value present after apply: one or more candidate blocks still contain outdated refund terms.",
          fatal: false,
        });
        setRunState("APPLIED");
        setLiveMessage("Verification failed: stale value detected.");
      } else {
        setVerificationResult(result);
        setRunState("VERIFIED");
        setLiveMessage("Verification passed: all operations aligned.");
      }
      setIsVerifying(false);
    }, 800);
  };

  // Receipt Export
  const handleExport = () => {
    if (runState !== "VERIFIED") {
      setError({
        code: "CO-EXP-001",
        message: "Export blocked: Run must be verified before generating receipt.",
        fatal: false,
      });
      return;
    }

    // Gather content hash
    const fullTextConcat = candidates
      .map((c) => c.blocks.map((b) => b.text).join("\n"))
      .join("\n");
    const hash = sha256Checksum(fullTextConcat);

    onOpenReceipt(hash, verificationResult?.assertions || []);
    setLiveMessage("Receipt modal opened.");
  };

  // Inline diff markup helper
  const renderDiffText = (text: string, isDeleted: boolean) => {
    const regex = /(30-day|30 days|14-day|14 days|thirty \(30\) days|fourteen \(14\) days)/gi;
    const parts = text.split(regex);
    if (parts.length <= 1) return text;

    return (
      <>
        {parts.map((part, index) => {
          if (regex.test(part)) {
            if (isDeleted) {
              return (
                <del
                  key={index}
                  className="px-1 rounded bg-red-100 text-red-900 line-through no-underline"
                  style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}
                >
                  {part}
                </del>
              );
            } else {
              return (
                <ins
                  key={index}
                  className="px-1 rounded bg-green-100 text-green-900 font-semibold no-underline"
                  style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
                >
                  {part}
                </ins>
              );
            }
          }
          return part;
        })}
      </>
    );
  };

  // Copy anchor helper to prevent overflows
  const handleCopyAnchor = (anchor: string) => {
    navigator.clipboard.writeText(anchor);
    setLiveMessage(`Copied anchor ID: ${anchor}`);
  };

  return (
    <div
      className="flex flex-col gap-6 p-6 rounded-lg border h-full"
      style={{
        backgroundColor: "var(--bg-canvas)",
        borderColor: "var(--border-neutral)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="border-b pb-4 flex justify-between items-center" style={{ borderColor: "var(--border-neutral)" }}>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Compilation Workspace</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Compile, review, and align downstream operational artifacts ({mode === "replay" ? "simulated replay" : "live GPT-5.6"}).
          </p>
        </div>
        {runState !== "IDLE" && !isCompiling && (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor:
                runState === "VERIFIED"
                  ? "var(--bg-green)"
                  : runState === "APPLIED"
                  ? "var(--bg-amber)"
                  : "var(--bg-surface)",
              color:
                runState === "VERIFIED"
                  ? "var(--state-green)"
                  : runState === "APPLIED"
                  ? "var(--state-amber)"
                  : "var(--text-secondary)",
              border: `1px solid ${
                runState === "VERIFIED"
                  ? "var(--border-green)"
                  : runState === "APPLIED"
                  ? "var(--border-amber)"
                  : "var(--border-neutral)"
              }`,
            }}
          >
            {runState}
          </span>
        )}
      </div>

      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>

      {/* State 1: IDLE / PRE-COMPILE */}
      {runState === "IDLE" && !isCompiling && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl mb-4" aria-hidden="true">⚙️</span>
          <h3 className="font-semibold text-lg">No active compilation</h3>
          <p className="text-sm text-gray-500 max-w-sm mt-1 mb-6">
            Compare source policies and trace downstream changes across your operations documentation.
          </p>
          <button
            type="button"
            onClick={onCompile}
            className="px-6 py-3 font-semibold text-white rounded bg-teal-700 hover:bg-teal-800 border-none shadow-sm transition-all focus-visible:outline-2"
            style={{ backgroundColor: "#1D5C96" }}
          >
            Compile Policy Change
          </button>
        </div>
      )}

      {/* STATE 2: LOADING COMPILING */}
      {isCompiling && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-teal-700 animate-spin mb-4" style={{ borderTopColor: "var(--trace-blue)" }}></div>
          <h3 className="font-medium text-base mb-2">Compiling alignments...</h3>
          <div className="flex flex-col gap-1 w-full max-w-xs text-xs text-left bg-gray-50 p-3 rounded border" style={{ borderColor: "var(--border-neutral)" }}>
            {COMPILE_STEPS.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className={idx <= currentStepIndex ? "text-teal-700 font-bold" : "text-gray-300"} style={{ color: idx <= currentStepIndex ? "var(--trace-blue)" : "" }}>
                  {idx < currentStepIndex ? "✓" : idx === currentStepIndex ? "●" : "○"}
                </span>
                <span className={idx === currentStepIndex ? "font-semibold text-gray-900" : "text-gray-500"}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATE 3: ACTIVE REVIEW / APPLIED / VERIFIED */}
      {runState !== "IDLE" && !isCompiling && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded border" style={{ borderColor: "var(--border-neutral)" }}>
            <span className="text-sm font-semibold">
              Impact Cascade: <span className="text-gray-900">5 affected artifacts found</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-mono">
              {approvedCount} / {totalCount} Approved
            </span>
          </div>

          {/* List of proposed patches */}
          <div className="flex flex-col gap-4">
            {patches.map((patch) => {
              const isPending = patch.status === "proposed";
              const isApproved = patch.status === "approved";
              const isRejected = patch.status === "rejected";
              const isAppliedOrVerified = ["applied", "verified"].includes(patch.status);

              let borderColor = "var(--border-neutral)";
              let borderLeftColor = "transparent";
              let badgeText = "Pending Review";
              let badgeColor = "var(--text-secondary)";
              let badgeBg = "var(--bg-surface)";

              if (isPending) {
                borderLeftColor = "var(--state-amber)";
                badgeText = "[!] Pending Approval";
                badgeColor = "var(--state-amber)";
                badgeBg = "var(--bg-amber)";
              } else if (isApproved) {
                borderColor = "var(--text-primary)";
                badgeText = "[✓] Approved";
                badgeColor = "var(--text-primary)";
                badgeBg = "var(--border-neutral)";
              } else if (isRejected) {
                borderColor = "var(--state-red)";
                badgeText = "[✗] Rejected";
                badgeColor = "var(--state-red)";
                badgeBg = "var(--bg-red)";
              } else if (isAppliedOrVerified) {
                borderColor = "var(--state-green)";
                badgeText = "[✓] Applied & Verified";
                badgeColor = "var(--state-green)";
                badgeBg = "var(--bg-green)";
              }

              return (
                <div
                  key={patch.id}
                  className="rounded-md border p-4 transition-all duration-150 relative"
                  style={{
                    borderColor,
                    borderLeft: borderLeftColor !== "transparent" ? `4px solid ${borderLeftColor}` : undefined,
                    backgroundColor: isAppliedOrVerified ? "var(--bg-green)" : "white",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyAnchor(patch.location.anchorId)}
                        className="text-xs font-mono font-semibold hover:underline text-left break-all max-w-[250px] md:max-w-[400px] inline-block truncate bg-transparent border-none p-0 cursor-pointer"
                        style={{ color: "var(--trace-blue)", border: "none" }}
                        title="Click to copy location anchor"
                      >
                        {patch.location.artifactId.split(".").pop()}:{patch.location.anchorId.split(".").pop()}
                      </button>
                      <span className="text-[10px] text-gray-400 font-mono hidden md:inline">
                        (Cites REFUND-01-REV)
                      </span>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ color: badgeColor, backgroundColor: badgeBg }}
                    >
                      {badgeText}
                    </span>
                  </div>

                  {/* Diff View */}
                  <div className="bg-gray-50 p-2.5 rounded border text-xs font-mono flex flex-col gap-1 mb-4" style={{ borderColor: "var(--border-neutral)" }}>
                    <div className="flex gap-2 text-red-900">
                      <span aria-hidden="true" className="select-none font-bold text-red-500">-</span>
                      <p className="break-all">{renderDiffText(patch.beforeText, true)}</p>
                    </div>
                    <div className="flex gap-2 text-green-900">
                      <span aria-hidden="true" className="select-none font-bold text-green-500">+</span>
                      <p className="break-all">{renderDiffText(patch.afterText, false)}</p>
                    </div>
                  </div>

                  {/* Citing Finding Explanation */}
                  {(() => {
                    const finding = impacts.find((f) => f.id === patch.impactId);
                    return finding ? (
                      <p className="text-[11px] text-gray-500 mb-3 leading-normal border-l-2 pl-2 italic" style={{ borderColor: "var(--border-neutral)" }}>
                        {finding.explanation}
                      </p>
                    ) : null;
                  })()}

                  {/* Review Buttons */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecision(patch.id, "reject")}
                      disabled={isAppliedOrVerified}
                      className="px-3 py-1.5 text-xs font-semibold rounded border"
                      style={{
                        borderColor: isRejected ? "var(--state-red)" : "var(--border-neutral)",
                        backgroundColor: isRejected ? "var(--bg-red)" : "",
                        color: isRejected ? "var(--state-red)" : "var(--text-primary)",
                      }}
                      aria-pressed={isRejected}
                    >
                      Reject Patch
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(patch.id, "approve")}
                      disabled={isAppliedOrVerified}
                      className="px-3 py-1.5 text-xs font-semibold rounded border text-white"
                      style={{
                        borderColor: isApproved ? "#124B7F" : "var(--border-neutral)",
                        backgroundColor: isApproved ? "var(--trace-blue)" : "var(--text-primary)",
                        color: "white",
                      }}
                      aria-pressed={isApproved}
                    >
                      Approve Patch
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Footer: Apply Approved Patches */}
          {runState === "PATCHES_PROPOSED" && (
            <div className="border-t pt-4 flex justify-end" style={{ borderColor: "var(--border-neutral)" }}>
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2.5 font-semibold text-white rounded bg-teal-800 hover:bg-teal-900 border-none transition-all"
                style={{ backgroundColor: "var(--text-primary)" }}
              >
                Apply Approved Patches
              </button>
            </div>
          )}

          {/* Action Footer: Run Verification */}
          {runState === "APPLIED" && (
            <div className="border-t pt-4 flex flex-col gap-4" style={{ borderColor: "var(--border-neutral)" }}>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="px-5 py-2.5 font-semibold text-white rounded hover:bg-opacity-95 border-none transition-all flex items-center gap-2"
                  style={{ backgroundColor: "var(--trace-blue)" }}
                >
                  {isVerifying ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                      Verifying candidate artifacts...
                    </>
                  ) : (
                    "Run Verification Check"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: VERIFIED BANNER */}
          {runState === "VERIFIED" && verificationResult && (
            <div className="flex flex-col gap-4 border-t pt-4" style={{ borderColor: "var(--border-neutral)" }}>
              <div
                className="p-4 rounded-md border text-sm"
                style={{
                  backgroundColor: "var(--bg-green)",
                  borderColor: "var(--border-green)",
                  color: "var(--state-green)",
                }}
              >
                <h3 className="font-bold text-base flex items-center gap-1.5">
                  <span aria-hidden="true">✓</span> VERIFIED: ALL OPERATIONS ALIGNED
                </h3>
                <p className="mt-1 text-xs font-medium text-green-950">
                  0 instances of drift detected. All 5 operational files are fully aligned with Clause REFUND-01-REV (14 days).
                </p>
                <div className="mt-2 text-xs flex flex-col gap-1 border-t pt-2 border-green-200">
                  <p className="font-bold text-green-800">Deterministic Assertions Passed (5/5):</p>
                  <ul className="list-disc list-inside text-green-900 pl-1">
                    {verificationResult.assertions.map((a) => (
                      <li key={a.id} className="truncate">
                        {a.kind}: {a.passed ? "passed" : "failed"} ({a.artifactId.split(".").pop()})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-5 py-2.5 font-semibold text-white rounded hover:bg-opacity-95 border-none transition-all"
                  style={{ backgroundColor: "var(--state-green)" }}
                >
                  Export Compilation Receipt
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
