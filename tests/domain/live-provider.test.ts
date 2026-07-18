import { describe, expect, it, vi } from "vitest";
import { LiveProvider, type ResponsesClient } from "@/lib/live-provider";
import { ARTIFACTS, DEPENDENCIES, EXPECTED_IMPACTS, EXPECTED_PATCHES, POLICY_V1, POLICY_V2 } from "@/lib/fixtures";
import { diffPolicies } from "@/lib/compiler";

describe("Live GPT-5.6 provider contract", () => {
  it("uses Responses Structured Outputs, gpt-5.6, store:false, and no fallback", async () => {
    const parse = vi
      .fn()
      .mockResolvedValueOnce({ output_parsed: { items: structuredClone(EXPECTED_IMPACTS) } })
      .mockResolvedValueOnce({ output_parsed: { items: structuredClone(EXPECTED_PATCHES) } });
    const provider = new LiveProvider({ responses: { parse } } as unknown as ResponsesClient);
    const change = diffPolicies(POLICY_V1, POLICY_V2)[0]!;
    const impacts = await provider.proposeImpacts({ change, artifacts: ARTIFACTS, dependencies: DEPENDENCIES });
    const patches = await provider.proposePatches({ findings: impacts.payload, artifacts: ARTIFACTS });

    expect(impacts).toMatchObject({ mode: "live", simulated: false, model: "gpt-5.6" });
    expect(patches.payload).toHaveLength(5);
    expect(parse).toHaveBeenCalledTimes(2);
    for (const [request] of parse.mock.calls) {
      expect(request).toMatchObject({ model: "gpt-5.6", store: false });
      expect(request.text.format).toBeDefined();
    }
  });
});
