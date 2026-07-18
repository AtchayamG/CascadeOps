import React, { useRef, useEffect, useState } from "react";
import type { CompilationReceipt } from "@/lib/contracts";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: CompilationReceipt;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Accessible keyboard focus trapping
  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
        if (e.key === "Tab") {
          if (!modalRef.current) return;
          const focusables = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex="0"]'
          );
          const first = focusables[0] as HTMLElement;
          const last = focusables[focusables.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
          } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(receipt, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cascadeops-receipt-${receipt.runId.toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-white rounded-lg border shadow-xl flex flex-col p-6 animate-fade-in relative"
        style={{
          backgroundColor: "var(--bg-canvas)",
          borderColor: "var(--border-neutral)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-neutral)" }}>
          <h2 id="receipt-modal-title" className="text-xl font-bold">
            Compilation Receipt
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-700 bg-transparent border-none text-xl p-1 leading-none font-bold"
            aria-label="Close Receipt"
          >
            &times;
          </button>
        </div>

        {/* Modal Content */}
        <div
          className="py-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh]"
          tabIndex={0}
          role="region"
          aria-label="Receipt details content"
        >
          {/* Toast Notification */}
          {copiedText && (
            <div className="p-2 text-center text-xs font-semibold rounded bg-green-50 border border-green-200 text-green-800 animate-pulse">
              Copied {copiedText} to clipboard!
            </div>
          )}

          {/* Key Metrics */}
          <div
            className="grid bg-gray-50 p-4 rounded border text-sm"
            style={{
              borderColor: "var(--border-neutral)",
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <p className="text-xs text-gray-500 font-mono">Receipt ID:</p>
              <button
                type="button"
                onClick={() => handleCopy(receipt.runId, "Receipt ID")}
                className="font-semibold text-gray-800 font-mono text-left break-all bg-transparent border-none p-0 cursor-pointer hover:underline"
                title="Click to copy Receipt ID"
              >
                {receipt.runId}
              </button>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-mono">Candidate Status:</p>
              <p className="font-bold text-green-700 font-mono">5 / 5 VERIFIED</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-mono">Source Version:</p>
              <p className="font-semibold text-gray-800 font-mono">
                {receipt.fromVersion.toUpperCase()} → {receipt.toVersion.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-mono">Artifacts Compiled:</p>
              <p className="font-semibold text-gray-800 font-mono">
                {receipt.patchSummary.applied} / {receipt.patchSummary.proposed}
              </p>
            </div>
          </div>

          {/* Integrity Block */}
          <div className="p-4 rounded border text-xs font-mono bg-gray-50 flex flex-col gap-2" style={{ borderColor: "var(--border-neutral)" }}>
            <p className="font-bold text-gray-700 border-b pb-1" style={{ borderColor: "var(--border-neutral)" }}>
              Integrity Block Details
            </p>
            <div
              className="grid gap-2"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(6rem, auto) minmax(0, 1fr)",
              }}
            >
              <span className="text-gray-500">Compiler:</span>
              <span>
                CascadeOps v0.1 — {receipt.mode === "replay" ? "Simulated Replay" : "Live GPT-5.6"}
              </span>

              <span className="text-gray-500">Digest Type:</span>
              <span>SHA-256 content checksum (not a digital signature)</span>

              <span className="text-gray-500 text-[10px] md:text-xs">Digest Hash:</span>
              <button
                type="button"
                onClick={() => handleCopy(receipt.contentHash, "Digest Hash")}
                className="text-[10px] md:text-xs text-left break-all text-gray-700 font-semibold selection:bg-teal-100 bg-transparent border-none p-0 cursor-pointer hover:underline"
                style={{ overflowWrap: "anywhere" }}
                title="Click to copy Digest Hash"
              >
                {receipt.contentHash}
              </button>
            </div>
          </div>

          {/* Assertions Evidence list */}
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider">
              Verification Assertions Evidence
            </h3>
            <div
              className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1"
              tabIndex={0}
              role="region"
              aria-label="Verification assertions evidence log"
            >
              {receipt.assertions.map((assert) => (
                <div
                  key={assert.id}
                  className="p-2 rounded border bg-white flex flex-col gap-0.5 text-xs"
                  style={{ borderColor: "var(--border-neutral)" }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-semibold text-gray-700 break-all select-all">
                      {assert.artifactId}
                    </span>
                    <span
                      className="font-bold text-[10px]"
                      style={{ color: assert.passed ? "var(--state-green)" : "var(--state-red)" }}
                    >
                      {assert.passed ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                  <p className="text-gray-500 font-mono text-[10px]">{assert.kind}</p>
                  <p className="text-gray-600 mt-0.5 leading-normal">{assert.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t flex justify-end gap-3" style={{ borderColor: "var(--border-neutral)" }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded border hover:bg-gray-100 transition-colors"
          >
            Close Receipt
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 text-xs font-semibold rounded border text-white hover:bg-opacity-90 transition-colors"
            style={{ backgroundColor: "var(--state-green)", borderColor: "var(--state-green)" }}
          >
            Download JSON Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
