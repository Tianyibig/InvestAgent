import { describe, expect, it } from "@rstest/core";

import {
  extractResearchConclusion,
  isResearchArtifactPath,
  stripResearchConclusionFence,
} from "@/core/artifacts/research-conclusion";

describe("extractResearchConclusion", () => {
  it("parses a fenced conclusion block", () => {
    const md = `# Note

\`\`\`conclusion
rating: Buy
target_price: 120 USD
risk: Medium
as_of: 2026-11-27
evidence_score: 82
evidence_threshold: 80
subject: AAPL
\`\`\`

## Thesis
Body.
`;
    expect(extractResearchConclusion(md)).toEqual({
      rating: "Buy",
      targetPrice: "120 USD",
      risk: "Medium",
      asOf: "2026-11-27",
      evidenceScore: "82",
      evidenceThreshold: "80",
      subject: "AAPL",
    });
  });

  it("parses tilde fences and falls back to bullets", () => {
    const fence = `# X

~~~conclusion
rating: Hold
~~~

## Body
`;
    expect(extractResearchConclusion(fence)?.rating).toBe("Hold");

    const bullets = `# Co (TICK)

- Rating: Sell
- Target price (12m): 10
- As of: 2026-01-01
- Risk: High

## Thesis
`;
    expect(extractResearchConclusion(bullets)).toMatchObject({
      rating: "Sell",
      targetPrice: "10",
      asOf: "2026-01-01",
      risk: "High",
    });
  });

  it("returns null when nothing matches", () => {
    expect(extractResearchConclusion("# Hello\n\nJust prose.")).toBeNull();
  });
});

describe("stripResearchConclusionFence", () => {
  it("removes the fence and keeps the rest", () => {
    const md = `# Title

\`\`\`conclusion
rating: Buy
\`\`\`

## Body
kept
`;
    const stripped = stripResearchConclusionFence(md);
    expect(stripped).not.toContain("```conclusion");
    expect(stripped).toContain("## Body");
    expect(stripped).toContain("kept");
  });
});

describe("isResearchArtifactPath", () => {
  it("matches known research filenames", () => {
    expect(
      isResearchArtifactPath("/mnt/user-data/outputs/aapl-equity-note.md"),
    ).toBe(true);
    expect(isResearchArtifactPath("/tmp/readme.md")).toBe(false);
  });
});
