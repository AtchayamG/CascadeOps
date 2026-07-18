import type {
  ArtifactDependency,
  ImpactFinding,
  OperationalArtifact,
  PatchProposal,
  PolicyDocument,
} from "./contracts";

// P0 canonical fixture (blueprint §4): refund window changes 30 → 14 days.
// Data only, no logic. Fictional company, no PII.

export const POLICY_V1: PolicyDocument = {
  id: "policy.refund-policy",
  title: "Refund Policy",
  version: "v1",
  clauses: [
    {
      id: "clause.refund-window",
      heading: "Refund window",
      text: "Customers may request a refund within 30 days of purchase.",
    },
    {
      id: "clause.refund-method",
      heading: "Refund method",
      text: "Refunds are issued to the original payment method used at purchase.",
    },
    {
      id: "clause.exclusions",
      heading: "Exclusions",
      text: "Clearance items and gift cards are not eligible for refunds.",
    },
  ],
};

export const POLICY_V2: PolicyDocument = {
  ...POLICY_V1,
  version: "v2",
  clauses: POLICY_V1.clauses.map((c) =>
    c.id === "clause.refund-window"
      ? { ...c, text: "Customers may request a refund within 14 days of purchase." }
      : { ...c },
  ),
};

// Exactly five artifacts; exactly one affected anchor each (blueprint §4.2).
// Every artifact also contains blocks unrelated to the refund window.
export const ARTIFACTS: OperationalArtifact[] = [
  {
    id: "artifact.support-sop",
    title: "Support Refund SOP",
    kind: "sop",
    blocks: [
      {
        anchorId: "sop.step-1.intake",
        text: "Step 1: Open the refund ticket and confirm the customer's account details.",
      },
      {
        anchorId: "sop.step-2.eligibility",
        text: "Step 2: Confirm the purchase was made within the last 30 days before approving the refund.",
      },
      {
        anchorId: "sop.step-3.processing",
        text: "Step 3: Process the approved refund to the original payment method.",
      },
    ],
  },
  {
    id: "artifact.refund-request-form",
    title: "Refund Request Form",
    kind: "form",
    blocks: [
      {
        anchorId: "form.field.order-number.help",
        text: "Enter the order number printed on your receipt.",
      },
      {
        anchorId: "form.field.purchase-date.help",
        text: "Enter your purchase date. Purchases older than 30 days are not eligible for a refund.",
      },
    ],
  },
  {
    id: "artifact.customer-response-template",
    title: "Customer Response Template",
    kind: "template",
    blocks: [
      {
        anchorId: "template.body.greeting",
        text: "Hello, and thank you for contacting our support team.",
      },
      {
        anchorId: "template.body.window-sentence",
        text: "You may request a refund within 30 days of your purchase.",
      },
      {
        anchorId: "template.body.signoff",
        text: "Kind regards, the Customer Support team.",
      },
    ],
  },
  {
    id: "artifact.qa-checklist",
    title: "Support QA Checklist",
    kind: "checklist",
    blocks: [
      {
        anchorId: "qa.item-1.identity",
        text: "Item 1: Agent verified the customer's identity before discussing the order.",
      },
      {
        anchorId: "qa.item-4.window-check",
        text: "Item 4: Agent confirmed purchase within 30 days before issuing the refund.",
      },
    ],
  },
  {
    id: "artifact.training-guide",
    title: "New Agent Training Guide",
    kind: "guide",
    blocks: [
      {
        anchorId: "guide.section-1.overview",
        text: "Section 1: This guide introduces new support agents to the refund workflow.",
      },
      {
        anchorId: "guide.section-2.policy-summary",
        text: "Section 2: Remember that our 30-day refund window starts on the purchase date.",
      },
    ],
  },
];

export const DEPENDENCIES: ArtifactDependency[] = ARTIFACTS.map((a) => ({
  artifactId: a.id,
  clauseId: "clause.refund-window",
  rationale: `${a.title} restates the refund window rule.`,
}));

export const CHANGE_ID = "change.refund-window";

// One affected anchor per artifact, in blueprint table order.
export const AFFECTED_ANCHORS: { artifactId: string; anchorId: string }[] = [
  { artifactId: "artifact.support-sop", anchorId: "sop.step-2.eligibility" },
  { artifactId: "artifact.refund-request-form", anchorId: "form.field.purchase-date.help" },
  { artifactId: "artifact.customer-response-template", anchorId: "template.body.window-sentence" },
  { artifactId: "artifact.qa-checklist", anchorId: "qa.item-4.window-check" },
  { artifactId: "artifact.training-guide", anchorId: "guide.section-2.policy-summary" },
];

export const STALE_VALUES = ["30 days", "30-day"];
export const NEW_VALUES = ["14 days", "14-day"];

export function blockText(artifactId: string, anchorId: string): string {
  const block = ARTIFACTS.find((a) => a.id === artifactId)?.blocks.find((b) => b.anchorId === anchorId);
  if (!block) throw new Error(`fixture missing block ${artifactId}/${anchorId}`);
  return block.text;
}

function replaceWindow(text: string): string {
  return text.replaceAll("30 days", "14 days").replaceAll("30-day", "14-day");
}

export const EXPECTED_IMPACTS: ImpactFinding[] = AFFECTED_ANCHORS.map(({ artifactId, anchorId }, i) => ({
  id: `impact.${i + 1}`,
  changeId: CHANGE_ID,
  clauseId: "clause.refund-window",
  location: { artifactId, anchorId, excerpt: blockText(artifactId, anchorId) },
  severity: "must-update",
  explanation: "This location states the old 30-day refund window and must reflect the new 14-day window.",
}));

export const EXPECTED_PATCHES: PatchProposal[] = EXPECTED_IMPACTS.map((impact, i) => ({
  id: `patch.${i + 1}`,
  impactId: impact.id,
  changeId: CHANGE_ID,
  location: { ...impact.location },
  beforeText: impact.location.excerpt,
  afterText: replaceWindow(impact.location.excerpt),
  status: "proposed",
}));

// Fixed timestamp keeps Replay envelopes byte-identical across runs.
export const REPLAY_GENERATED_AT = "2026-01-01T00:00:00.000Z";
