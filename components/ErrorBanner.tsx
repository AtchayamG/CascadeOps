import React from "react";
import { CompilerError } from "@/lib/contracts";

interface ErrorBannerProps {
  error: CompilerError;
  onClear?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, onClear }) => {
  return (
    <div
      role="alert"
      className="p-4 mb-4 rounded border bg-red-50 text-red-950 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      style={{
        backgroundColor: "var(--bg-red)",
        borderColor: "var(--border-red)",
        color: "var(--state-red)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 font-semibold">
          <span aria-hidden="true" className="text-lg">⚠️</span>
          <span>Error Code: {error.code}</span>
        </div>
        <p className="mt-1 text-sm">{error.message}</p>
        {error.subjectId && (
          <p className="mt-1 text-xs font-mono opacity-85">
            Subject ID: <code className="bg-red-100 px-1 py-0.5 rounded break-all">{error.subjectId}</code>
          </p>
        )}
      </div>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="self-start md:self-center px-3 py-1.5 text-xs font-medium rounded border hover:bg-red-100 transition-colors"
          style={{
            borderColor: "var(--state-red)",
            color: "var(--state-red)",
            backgroundColor: "transparent",
          }}
        >
          Dismiss
        </button>
      )}
    </div>
  );
};
