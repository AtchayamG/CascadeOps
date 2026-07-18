import React from "react";
import type { PolicyDocument, ClauseChange } from "@/lib/contracts";

interface PolicyPanelProps {
  originalPolicy: PolicyDocument;
  revisedPolicy: PolicyDocument;
  changes: ClauseChange[];
}

export const PolicyPanel: React.FC<PolicyPanelProps> = ({
  originalPolicy,
  revisedPolicy,
  changes,
}) => {
  const windowChange = changes.find((c) => c.clauseId === "clause.refund-window");
  const originalText = originalPolicy.clauses.find((c) => c.id === "clause.refund-window")?.text ?? "";
  const revisedText = revisedPolicy.clauses.find((c) => c.id === "clause.refund-window")?.text ?? "";

  const renderHighlighted = (text: string, target: string, revised: boolean) => {
    const [before, after] = text.split(target);
    const Tag = revised ? "ins" : "del";
    return (
      <p>
        {before}
        <Tag
          className={`px-1 py-0.5 rounded no-underline ${revised ? "font-semibold" : "line-through"}`}
          style={{
            backgroundColor: revised ? "#D1FAE5" : "#FEE2E2",
            color: revised ? "#065F46" : "#991B1B",
          }}
        >
          {target}
        </Tag>
        {after}
      </p>
    );
  };

  return (
    <section
      aria-labelledby="policy-comparator-heading"
      className="flex flex-col gap-6 p-6 rounded-lg border h-full"
      style={{
        backgroundColor: "var(--bg-canvas)",
        borderColor: "var(--border-neutral)",
      }}
    >
      <div className="border-b pb-4" style={{ borderColor: "var(--border-neutral)" }}>
        <h2 id="policy-comparator-heading" className="text-xl font-bold tracking-tight">
          Source Policy Revision
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Active Project: <span className="font-semibold text-gray-900">Refund Policy Amendment (M0 Golden Path)</span>
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Original Clause */}
        <div
          className="p-4 rounded-md border"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-neutral)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm text-gray-800">Original — clause.refund-window</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
              {originalPolicy.version.toUpperCase()}
            </span>
          </div>
          <div className="p-3 bg-white rounded border font-mono text-sm leading-relaxed" style={{ borderColor: "var(--border-neutral)" }}>
            {windowChange ? (
              renderHighlighted(originalText, "30 days", false)
            ) : (
              <p>{originalPolicy.clauses.find((c) => c.id === "clause.refund-window")?.text}</p>
            )}
          </div>
        </div>

        {/* Revised Clause */}
        <div
          className="p-4 rounded-md border"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-neutral)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm text-gray-800">Revised — clause.refund-window</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800" style={{ backgroundColor: "#E6F4EA", color: "#137333" }}>
              {revisedPolicy.version.toUpperCase()}
            </span>
          </div>
          <div className="p-3 bg-white rounded border font-mono text-sm leading-relaxed" style={{ borderColor: "var(--border-neutral)" }}>
            {windowChange ? (
              renderHighlighted(revisedText, "14 days", true)
            ) : (
              <p>{revisedPolicy.clauses.find((c) => c.id === "clause.refund-window")?.text}</p>
            )}
          </div>
        </div>

        {/* Policy Metadata & Details */}
        <div className="mt-2 text-xs flex flex-col gap-2 p-3 bg-gray-50 rounded border border-dashed" style={{ borderColor: "var(--border-neutral)" }}>
          <p className="font-semibold text-gray-700">Affected Clause Information (Click to Copy):</p>
          <div
            className="grid gap-1"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(5rem, auto) minmax(0, 1fr)",
            }}
          >
            <span className="text-gray-500 font-mono">Clause ID:</span>
            <span
              onClick={() => navigator.clipboard.writeText("clause.refund-window")}
              className="font-mono break-all cursor-pointer hover:underline text-gray-800"
              title="Click to copy Clause ID"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { navigator.clipboard.writeText("clause.refund-window"); } }}
            >
              clause.refund-window
            </span>

            <span className="text-gray-500 font-mono">Change ID:</span>
            <span
              onClick={() => navigator.clipboard.writeText("change.refund-window")}
              className="font-mono break-all cursor-pointer hover:underline text-gray-800"
              title="Click to copy Change ID"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { navigator.clipboard.writeText("change.refund-window"); } }}
            >
              change.refund-window
            </span>

            <span className="text-gray-500 font-mono">Change type:</span>
            <span className="font-mono text-gray-700">modified</span>
          </div>
        </div>
      </div>
    </section>
  );
};
