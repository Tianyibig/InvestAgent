import { afterEach, expect, test } from "@rstest/core";
import { cleanup, render, screen } from "@testing-library/react";

import { ResearchQuoteCard } from "@/components/workspace/artifacts/research-quote-card";
import { I18nContext } from "@/core/i18n/context";
import { enUS } from "@/core/i18n/locales/en-US";

afterEach(() => {
  cleanup();
});

test("shows source, tier, and delayed on the provenance badge", () => {
  render(
    <I18nContext.Provider
      value={{ locale: "en-US", setLocale: () => undefined, t: enUS }}
    >
      <ResearchQuoteCard
        quotes={[
          {
            ticker: "hk00700",
            name: "Tencent",
            last: "380.2",
            changePct: "-0.4",
            asOf: "2026-11-28T15:00:00+08:00",
            source: "akshare",
            sourceClass: "data",
            sourceTier: 80,
            delayed: true,
          },
        ]}
      />
    </I18nContext.Provider>,
  );

  const badge = screen.getByTestId("research-quote-provenance");
  expect(badge.textContent).toContain("akshare");
  expect(badge.textContent).toContain("Tier 80");
  expect(badge.textContent).toContain("Delayed");
  expect(badge.textContent).toContain("Data, not official");
  const row = screen.getByTestId("research-quote-row");
  expect(row.textContent).toContain("hk00700");
  expect(row.textContent).toContain("-0.4%");
});
