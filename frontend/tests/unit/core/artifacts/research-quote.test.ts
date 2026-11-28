import { describe, expect, it } from "@rstest/core";

import {
  extractResearchQuotes,
  stripResearchQuoteFence,
} from "@/core/artifacts/research-quote";

describe("extractResearchQuotes", () => {
  it("parses a fenced quote payload and keeps provenance", () => {
    const md = `# Tape

\`\`\`quote
{"quotes":[{"ticker":"sh600519","name":"Moutai","last":"1800","change_pct":"1.23","as_of":"2026-11-28T15:00:03+08:00","source":"tencent_delayed","source_class":"data","source_tier":80,"delayed":true,"market":"sh"}]}
\`\`\`

## Note
`;
    expect(extractResearchQuotes(md)).toEqual([
      {
        ticker: "sh600519",
        name: "Moutai",
        market: "sh",
        last: "1800",
        changePct: "1.23",
        asOf: "2026-11-28T15:00:03+08:00",
        source: "tencent_delayed",
        sourceClass: "data",
        sourceTier: 80,
        delayed: true,
        error: undefined,
      },
    ]);
  });

  it("parses a tilde fence and skips rows without a ticker", () => {
    const md = `~~~quote
[{"code":"00700","source":"akshare","source_class":"data","source_tier":"80","delayed":true},{"name":"no ticker"}]
~~~`;
    expect(extractResearchQuotes(md)).toEqual([
      {
        ticker: "00700",
        name: undefined,
        market: undefined,
        last: undefined,
        changePct: undefined,
        asOf: undefined,
        source: "akshare",
        sourceClass: "data",
        sourceTier: 80,
        delayed: true,
        error: undefined,
      },
    ]);
  });

  it("returns null for prose and invalid JSON", () => {
    expect(extractResearchQuotes("# Hello\n\nNo quotes.")).toBeNull();
    expect(extractResearchQuotes("```quote\nnot-json\n```")).toBeNull();
  });
});

describe("stripResearchQuoteFence", () => {
  it("removes the fence and keeps the table", () => {
    const md = `| Name | Last |
| --- | --- |
| Moutai | 1800 |

\`\`\`quote
{"quotes":[]}
\`\`\`
`;
    const stripped = stripResearchQuoteFence(md);
    expect(stripped).not.toContain("```quote");
    expect(stripped).toContain("Moutai");
  });
});
