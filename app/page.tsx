"use client";

import { useState } from "react";
import {
  ProviderMode,
  FIXTURE_POLICY_V1,
  FIXTURE_POLICY_V2,
  FIXTURE_ARTIFACTS,
  computePolicyDiff,
  REPLAY_IMPACT_FINDINGS,
  REPLAY_PATCH_PROPOSALS,
  ImpactFinding,
  PatchProposal,
  OperationalArtifact,
  CompilerError,
  VerificationAssertion,
} from "../components/compiler";
import { PolicyPanel } from "../components/PolicyPanel";
import { WorkspacePanel } from "../components/WorkspacePanel";
import { ReceiptModal } from "../components/ReceiptModal";
import { ErrorBanner } from "../components/ErrorBanner";

export default function Home() {
  // Provider Mode state
  const [mode, setMode] = useState<ProviderMode>("replay");

  // State machine state
  const [runState, setRunState] = useState<string>("IDLE");
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  // Data state
  const [impacts, setImpacts] = useState<ImpactFinding[]>([]);
  const [patches, setPatches] = useState<PatchProposal[]>([]);
  const [candidates, setCandidates] = useState<OperationalArtifact[]>(FIXTURE_ARTIFACTS);

  // Compilation Errors
  const [error, setError] = useState<CompilerError | null>(null);

  // Mobile navigation tabs
  const [activeTab, setActiveTab] = useState<"policy" | "workspace">("policy");

  // Receipt Modal state
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [receiptHash, setReceiptHash] = useState<string>("");
  const [receiptAssertions, setReceiptAssertions] = useState<VerificationAssertion[]>([]);

  // Compute diff on the fly
  const changes = computePolicyDiff(FIXTURE_POLICY_V1, FIXTURE_POLICY_V2);

  // Run compilation
  const handleCompile = async () => {
    setError(null);
    setIsCompiling(true);

    if (mode === "replay") {
      // Replay mode: local deterministic simulation
      setTimeout(() => {
        setImpacts(REPLAY_IMPACT_FINDINGS);
        // Deep copy of proposed patches
        setPatches(JSON.parse(JSON.stringify(REPLAY_PATCH_PROPOSALS)));
        setCandidates(JSON.parse(JSON.stringify(FIXTURE_ARTIFACTS)));
        setRunState("PATCHES_PROPOSED");
        setIsCompiling(false);
      }, 1000);
    } else {
      // Live mode: call server-side API (fails closed if API is not deployed on this branch)
      setTimeout(async () => {
        try {
          const res = await fetch("/api/live/propose-impacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              change: changes[0],
              artifacts: FIXTURE_ARTIFACTS,
            }),
          });

          if (!res.ok) {
            throw new Error("404 Not Found");
          }

          // If by any chance it succeeds (e.g. backend agent implemented it)
          const data = await res.json();
          setImpacts(data.payload);
          setRunState("IMPACTS_READY");
        } catch {
          setError({
            code: "CO-PROV-001",
            message: "Live provider unavailable: OpenAI API gateway or Live endpoints are not deployed in this isolated UI worktree.",
            fatal: true,
          });
          setRunState("IDLE");
        } finally {
          setIsCompiling(false);
        }
      }, 1000);
    }
  };

  // Toggle Mode helper
  const handleModeChange = (newMode: ProviderMode) => {
    // Reset state when toggling modes to enforce clean state boundary
    setMode(newMode);
    setRunState("IDLE");
    setImpacts([]);
    setPatches([]);
    setCandidates(JSON.parse(JSON.stringify(FIXTURE_ARTIFACTS)));
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
              originalPolicy={FIXTURE_POLICY_V1}
              revisedPolicy={FIXTURE_POLICY_V2}
              changes={changes}
            />
          </div>

          {/* Column 2: Compilation Workspace (Visible if tab selected on mobile, always on desktop) */}
          <div className={`${activeTab === "workspace" ? "block" : "hidden"} lg:block`}>
            <WorkspacePanel
              mode={mode}
              runState={runState}
              setRunState={setRunState}
              impacts={impacts}
              patches={patches}
              setPatches={setPatches}
              setError={setError}
              candidates={candidates}
              setCandidates={setCandidates}
              isCompiling={isCompiling}
              onCompile={handleCompile}
              onOpenReceipt={(hash, assertions) => {
                setReceiptHash(hash);
                setReceiptAssertions(assertions);
                setIsReceiptOpen(true);
              }}
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
      {isReceiptOpen && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          mode={mode}
          contentHash={receiptHash}
          assertions={receiptAssertions}
        />
      )}
    </main>
  );
}
