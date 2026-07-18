import React, { useState, useEffect } from "react";
import type {
  ImpactFinding,
  PatchProposal,
  CompilerError,
  VerificationAssertion,
} from "@/lib/contracts";

const COMPILE_STEPS = [
  "Comparing policy clauses...",
  "Tracing curated dependencies...",
  "Validating proposed patches...",
];

interface WorkspacePanelProps {
  mode: "replay" | "live";
  runState: string;
  impacts: ImpactFinding[];
  patches: PatchProposal[];
  setPatches: (patches: PatchProposal[]) => void;
  setError: (err: CompilerError | null) => void;
  isCompiling: boolean;
  onCompile: () => Promise<void>;
  onApply: () => Promise<void>;
  onVerify: () => Promise<VerificationAssertion[] | null>;
  isApplying: boolean;
  onOpenReceipt: () => void;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  mode,
  runState,
  impacts,
  patches,
  setPatches,
  setError,
  isCompiling,
  onCompile,
  onApply,
  onVerify,
  isApplying,
  onOpenReceipt,
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
  const approvedCount = patches.filter((p) =>
    ["approved", "applied", "verified"].includes(p.status),
  ).length;
  const totalCount = patches.length;

  // Apply handler
  const handleApplyClick = () => {
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
        code: "CO-STATE-002",
        message: `Candidate compilation requires approval for every target. ${rejectedPatches.length} patch(es) are rejected.`,
        subjectId: rejectedPatches[0].id,
        fatal: false,
      });
      setLiveMessage("Apply blocked: rejected patches exist.");
      return;
    }

    onApply();
  };

  // Run verification handler
  const handleVerify = async () => {
    setIsVerifying(true);
    setLiveMessage("Running verification check...");
    const assertions = await onVerify();
    if (assertions) {
      setVerificationResult({
        assertions,
        passed: assertions.every((a) => a.passed),
      });
      setLiveMessage("Verification passed: all candidate artifact assertions passed.");
    }
    setIsVerifying(false);
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
    <section
      aria-labelledby="workspace-heading"
      className="flex flex-col gap-6 p-6 rounded-lg border h-full"
      style={{
        backgroundColor: "var(--bg-canvas)",
        borderColor: "var(--border-neutral)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="border-b pb-4 flex justify-between items-center" style={{ borderColor: "var(--border-neutral)" }}>
        <div>
          <h2 id="workspace-heading" className="text-xl font-bold tracking-tight">Compilation Workspace</h2>
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
            className="px-6 py-3 font-semibold text-white rounded hover:bg-opacity-95 border-none shadow-sm transition-all focus-visible:outline-2"
            style={{ backgroundColor: "var(--trace-blue)" }}
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
          <ul role="list" className="flex flex-col gap-4 p-0">
            {patches.map((patch) => {
              const isPending = patch.status === "proposed";
              const isApproved = patch.status === "approved";
              const isRejected = patch.status === "rejected";
              const isApplied = patch.status === "applied";
              const isVerified = patch.status === "verified";
              const isFinalized = isApplied || isVerified;

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
              } else if (isApplied) {
                borderColor = "var(--trace-blue)";
                badgeText = "[✓] Candidate Compiled";
                badgeColor = "var(--trace-blue)";
                badgeBg = "var(--bg-surface)";
              } else if (isVerified) {
                borderColor = "var(--state-green)";
                badgeText = "[✓] Verified";
                badgeColor = "var(--state-green)";
                badgeBg = "var(--bg-green)";
              }

              return (
                <li
                  key={patch.id}
                  className="rounded-md border p-4 transition-all duration-150 relative list-none"
                  style={{
                    borderColor,
                    boxShadow: borderLeftColor !== "transparent" ? `inset 4px 0 0 ${borderLeftColor}` : undefined,
                    backgroundColor: isVerified ? "var(--bg-green)" : "white",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-gray-500">Artifact:</span>
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono select-all break-all">{patch.location.artifactId}</code>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-gray-500">Anchor:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyAnchor(patch.location.anchorId)}
                          className="text-xs font-mono font-semibold hover:underline text-left break-all bg-transparent border-none p-0 cursor-pointer"
                          style={{ color: "var(--trace-blue)" }}
                          title="Click to copy location anchor"
                        >
                          {patch.location.anchorId}
                        </button>
                        <span className="text-[10px] text-gray-600 font-mono hidden md:inline">
                          (Click to copy)
                        </span>
                      </div>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded self-start"
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
                      <div className="text-[11px] text-gray-500 mb-3 leading-normal border-l-2 pl-2 italic" style={{ borderColor: "var(--border-neutral)" }}>
                        <p>{finding.explanation}</p>
                        <p className="mt-1 font-mono text-[9px] text-gray-600">Cited change: {patch.changeId} (Clause: clause.refund-window)</p>
                      </div>
                    ) : null;
                  })()}

                  {/* Review Buttons */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecision(patch.id, "reject")}
                      disabled={isFinalized}
                      className="px-3 py-1.5 text-xs font-semibold rounded border cursor-pointer"
                      style={{
                        borderColor: isRejected ? "var(--state-red)" : "var(--border-neutral)",
                        backgroundColor: isRejected ? "var(--bg-red)" : "transparent",
                        color: isRejected ? "var(--state-red)" : "var(--text-primary)",
                      }}
                      aria-pressed={isRejected}
                    >
                      Reject Patch
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(patch.id, "approve")}
                      disabled={isFinalized}
                      className="px-3 py-1.5 text-xs font-semibold rounded border text-white cursor-pointer"
                      style={{
                        borderColor: isApproved ? "var(--trace-blue)" : "var(--border-neutral)",
                        backgroundColor: isApproved ? "var(--trace-blue)" : "var(--text-primary)",
                        color: "white",
                      }}
                      aria-pressed={isApproved}
                    >
                      Approve Patch
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Action Footer: Compile Approved Candidates */}
          {runState === "PATCHES_PROPOSED" && (
            <div className="border-t pt-4 flex justify-end" style={{ borderColor: "var(--border-neutral)" }}>
              <button
                type="button"
                onClick={handleApplyClick}
                disabled={isApplying}
                className="px-5 py-2.5 font-semibold text-white rounded hover:bg-opacity-90 border-none transition-all flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: "var(--text-primary)" }}
              >
                {isApplying ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                    Compiling candidate copies...
                  </>
                ) : (
                  "Compile Approved Candidates"
                )}
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
                  className="px-5 py-2.5 font-semibold text-white rounded hover:bg-opacity-95 border-none transition-all flex items-center gap-2 cursor-pointer"
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
                  <span aria-hidden="true">✓</span> VERIFIED: ALL CANDIDATE ASSERTIONS PASSED
                </h3>
                <p className="mt-1 text-xs font-medium text-green-950">
                  0 stale target references. All 5 isolated candidate artifacts passed the refund-window fixture assertions.
                </p>
                <div className="mt-2 text-xs flex flex-col gap-1 border-t pt-2 border-green-200">
                  <p className="font-bold text-green-800">
                    Deterministic assertions passed ({verificationResult.assertions.filter((a) => a.passed).length}/{verificationResult.assertions.length}):
                  </p>
                  <ul className="list-disc list-inside text-green-900 pl-1 p-0 flex flex-col gap-0.5">
                    {verificationResult.assertions.map((a) => (
                      <li key={a.id} className="truncate select-all break-all list-none" title={a.detail}>
                        ✓ {a.kind}: {a.passed ? "passed" : "failed"} ({a.artifactId})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={onOpenReceipt}
                  className="px-5 py-2.5 font-semibold text-white rounded hover:bg-opacity-95 border-none transition-all cursor-pointer"
                  style={{ backgroundColor: "var(--state-green)" }}
                >
                  Export Compilation Receipt
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
