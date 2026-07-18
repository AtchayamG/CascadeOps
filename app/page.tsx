"use client";

import { useState } from "react";
import type {
  ProviderMode,
  ImpactFinding,
  PatchProposal,
  OperationalArtifact,
  CompilerError,
  VerificationAssertion,
  CompilationReceipt,
  ApprovalDecision,
} from "@/lib/contracts";
import { POLICY_V1, POLICY_V2, ARTIFACTS, EXPECTED_IMPACTS, EXPECTED_PATCHES } from "@/lib/fixtures";
import {
  buildReplayReceipt,
  compileReplayCandidates,
  verifyReplayCandidates,
} from "@/lib/replay-client";
import { PolicyPanel } from "@/components/PolicyPanel";
import { WorkspacePanel } from "@/components/WorkspacePanel";
import { ReceiptModal } from "@/components/ReceiptModal";
import { ErrorBanner } from "@/components/ErrorBanner";

// Browser-safe policy diffing helper matching the core compiler diff logic
function computePolicyDiff(v1: typeof POLICY_V1, v2: typeof POLICY_V2) {
  const changes = [];
  const toById = new Map(v2.clauses.map((c) => [c.id, c]));
  for (const before of v1.clauses) {
    const after = toById.get(before.id);
    if (!after) {
      changes.push({
        id: before.id.replace(/^clause\./, "change."),
        clauseId: before.id,
        changeType: "removed" as const,
        beforeText: before.text,
        afterText: null,
      });
    } else if (after.text !== before.text) {
      changes.push({
        id: before.id.replace(/^clause\./, "change."),
        clauseId: before.id,
        changeType: "modified" as const,
        beforeText: before.text,
        afterText: after.text,
      });
    }
  }
  const fromIds = new Set(v1.clauses.map((c) => c.id));
  for (const added of v2.clauses) {
    if (!fromIds.has(added.id)) {
      changes.push({
        id: added.id.replace(/^clause\./, "change."),
        clauseId: added.id,
        changeType: "added" as const,
        beforeText: null,
        afterText: added.text,
      });
    }
  }
  return changes;
}

export default function Home() {
  const isStaticReplay = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
  // Provider Mode state
  const [mode, setMode] = useState<ProviderMode>("replay");

  // State machine state
  const [runState, setRunState] = useState<string>("IDLE");
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // Data state
  const [impacts, setImpacts] = useState<ImpactFinding[]>([]);
  const [patches, setPatches] = useState<PatchProposal[]>([]);
  const [candidates, setCandidates] = useState<OperationalArtifact[]>(ARTIFACTS);
  const [receipt, setReceipt] = useState<CompilationReceipt | null>(null);
  const [approvalDecisions, setApprovalDecisions] = useState<ApprovalDecision[]>([]);

  // Compilation Errors
  const [error, setError] = useState<CompilerError | null>(null);

  // Mobile navigation tabs
  const [activeTab, setActiveTab] = useState<"policy" | "workspace">("policy");

  // Receipt Modal state
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  // Compute diff on the fly
  const changes = computePolicyDiff(POLICY_V1, POLICY_V2);

  // Run compilation
  const handleCompile = async () => {
    setError(null);
    setIsCompiling(true);
    setImpacts([]);
    setPatches([]);
    setCandidates(ARTIFACTS);
    setReceipt(null);

    try {
      if (mode === "replay") {
        await new Promise((resolve) => setTimeout(resolve, 650));
        setImpacts(structuredClone(EXPECTED_IMPACTS));
        setPatches(structuredClone(EXPECTED_PATCHES));
        setRunState("PATCHES_PROPOSED");
        return;
      }
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || { code: "CO-STATE-001", message: "Compilation analysis failed.", fatal: true });
        setRunState("IDLE");
        return;
      }

      const { impactEnvelope, patchEnvelope } = data.data;
      setImpacts(impactEnvelope.payload);
      // Map patches from API into proposed status initially for UI decisions review
      setPatches(
        patchEnvelope.payload.map((p: PatchProposal) => ({
          ...p,
          status: "proposed" as const,
        }))
      );
      setRunState("PATCHES_PROPOSED");
    } catch {
      setError({
        code: "CO-STATE-001",
        message: "An unexpected error occurred during impact analysis.",
        fatal: true,
      });
      setRunState("IDLE");
    } finally {
      setIsCompiling(false);
    }
  };

  // Apply handler calling server atomic compiler
  const handleApply = async () => {
    setError(null);
    setIsApplying(true);

    const decisions: ApprovalDecision[] = patches.map((p) => ({
      patchId: p.id,
      decision: p.status === "approved" ? "approve" : "reject",
      decidedAt: new Date().toISOString(),
    }));

    try {
      if (mode === "replay") {
        const compiledCandidates = compileReplayCandidates(patches, decisions);
        setCandidates(compiledCandidates);
        setPatches(patches.map((patch) => ({ ...patch, status: "applied" as const })));
        setApprovalDecisions(decisions);
        setRunState("APPLIED");
        return;
      }
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          mode,
          impacts,
          patches,
          decisions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || { code: "CO-STATE-001", message: "Compilation apply failed.", fatal: true });
        return;
      }

      const { candidates: compiledCandidates } = data.data;
      setCandidates(compiledCandidates);
      setPatches(patches.map((p) => ({ ...p, status: "applied" as const })));
      setApprovalDecisions(decisions);
      setRunState("APPLIED");
    } catch {
      setError({
        code: "CO-STATE-001",
        message: "An unexpected error occurred while compiling patches.",
        fatal: true,
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleVerify = async (): Promise<VerificationAssertion[] | null> => {
    setError(null);
    try {
      if (mode === "replay") {
        const proposedPatches = patches.map((patch) => ({ ...patch, status: "proposed" as const }));
        const assertions = verifyReplayCandidates(candidates, proposedPatches);
        const replayReceipt = await buildReplayReceipt(
          candidates,
          proposedPatches,
          approvalDecisions,
          assertions,
        );
        setReceipt(replayReceipt);
        setPatches(patches.map((patch) => ({ ...patch, status: "verified" as const })));
        setRunState("VERIFIED");
        return assertions;
      }
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          mode,
          impacts,
          patches: patches.map((patch) => ({ ...patch, status: "proposed" as const })),
          decisions: approvalDecisions,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || { code: "CO-VER-001", message: "Verification failed closed.", fatal: true });
        return null;
      }
      setReceipt(data.data.receipt);
      setPatches(patches.map((patch) => ({ ...patch, status: "verified" as const })));
      setRunState("VERIFIED");
      return data.data.assertions;
    } catch {
      setError({ code: "CO-VER-001", message: "Verification request failed closed.", fatal: true });
      return null;
    }
  };

  // Toggle Mode helper
  const handleModeChange = (newMode: ProviderMode) => {
    setMode(newMode);
    setRunState("IDLE");
    setImpacts([]);
    setPatches([]);
    setCandidates(ARTIFACTS);
    setReceipt(null);
    setApprovalDecisions([]);
    setError(null);
  };

  return (
    <main>
      {/* Skip Link for A11y */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Global Header */}
      <header className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CascadeOps</h1>
          <p className="text-xs text-gray-500 font-medium">Policy Change Compiler</p>
        </div>

        {/* Mode switcher control */}
        <div className="flex items-center gap-3">
          <div className="switch-container">
            <button
              type="button"
              onClick={() => handleModeChange("replay")}
              className={`switch-btn ${mode === "replay" ? "active" : ""}`}
              aria-pressed={mode === "replay"}
            >
              Simulated Replay
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("live")}
              disabled={isStaticReplay}
              title={isStaticReplay ? "Live GPT-5.6 is available in the local server build." : undefined}
              className={`switch-btn ${mode === "live" ? "active" : ""}`}
              aria-pressed={mode === "live"}
            >
              Live GPT-5.6
            </button>
          </div>

          {/* Mode Badge */}
          {mode === "replay" ? (
            <span className="badge badge-simulated font-mono">Simulated</span>
          ) : (
            <span className="badge badge-live font-mono">Live — GPT-5.6</span>
          )}
        </div>
      </header>

      {/* Replay Simulated Warning Banner */}
      {mode === "replay" && (
        <div
          className="p-3 text-center text-xs font-semibold"
          style={{
            backgroundColor: "var(--bg-amber)",
            borderBottom: "1px solid var(--border-neutral)",
            color: "var(--state-amber)",
          }}
        >
          <span>ℹ️ Replay Mode — simulated data, no live model.</span>
        </div>
      )}

      {/* Live Badge Provenance Info */}
      {mode === "live" && !error && (
        <div
          className="p-3 text-center text-xs font-semibold"
          style={{
            backgroundColor: "var(--bg-green)",
            borderBottom: "1px solid var(--border-neutral)",
            color: "var(--state-green)",
          }}
        >
          <span>Live — GPT-5.6 · Responses API · store: false</span>
        </div>
      )}

      {/* Content Container */}
      <div id="main-content" className="p-6 flex-1 max-w-[1400px] w-full mx-auto">
        {/* Render fatal/compilation errors here */}
        {error && <ErrorBanner error={error} onClear={() => setError(null)} />}

        {/* Mobile Navigation Tabs */}
        <div className="tabs-nav" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "policy"}
            onClick={() => setActiveTab("policy")}
            className={`tab-btn ${activeTab === "policy" ? "active" : ""}`}
          >
            1. Source Policy
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "workspace"}
            onClick={() => setActiveTab("workspace")}
            className={`tab-btn ${activeTab === "workspace" ? "active" : ""}`}
          >
            2. Workspace {patches.length > 0 && `(${patches.length})`}
          </button>
        </div>

        {/* Layout Grid */}
        <div className="app-grid">
          {/* Column 1: Policy Comparator (Visible if tab selected on mobile, always on desktop) */}
          <div className={`${activeTab === "policy" ? "block" : "hidden"} lg:block`}>
            <PolicyPanel
              originalPolicy={POLICY_V1}
              revisedPolicy={POLICY_V2}
              changes={changes}
            />
          </div>

          {/* Column 2: Compilation Workspace (Visible if tab selected on mobile, always on desktop) */}
          <div className={`${activeTab === "workspace" ? "block" : "hidden"} lg:block`}>
            <WorkspacePanel
              mode={mode}
              runState={runState}
              impacts={impacts}
              patches={patches}
              setPatches={setPatches}
              setError={setError}
              isCompiling={isCompiling}
              onCompile={handleCompile}
              onApply={handleApply}
              onVerify={handleVerify}
              isApplying={isApplying}
              onOpenReceipt={() => setIsReceiptOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Legal Footer */}
      <footer>
        <p className="max-w-2xl mx-auto">
          CascadeOps is a management and documentation alignment aid. It does not provide legal or compliance certification.
        </p>
      </footer>

      {/* Receipt Modal */}
      {isReceiptOpen && receipt && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          receipt={receipt}
        />
      )}
    </main>
  );
}
