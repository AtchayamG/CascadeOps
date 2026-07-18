import type { CompilerProvider, ProviderEnvelope } from "./contracts";
import type { ImpactFinding, PatchProposal } from "./contracts";
import { EXPECTED_IMPACTS, EXPECTED_PATCHES, REPLAY_GENERATED_AT } from "./fixtures";

export class ReplayProvider implements CompilerProvider {
  readonly mode = "replay" as const;

  async proposeImpacts(): Promise<ProviderEnvelope<ImpactFinding[]>> {
    return {
      mode: "replay",
      simulated: true,
      model: null,
      generatedAt: REPLAY_GENERATED_AT,
      payload: structuredClone(EXPECTED_IMPACTS),
    };
  }

  async proposePatches(): Promise<ProviderEnvelope<PatchProposal[]>> {
    return {
      mode: "replay",
      simulated: true,
      model: null,
      generatedAt: REPLAY_GENERATED_AT,
      payload: structuredClone(EXPECTED_PATCHES),
    };
  }
}
