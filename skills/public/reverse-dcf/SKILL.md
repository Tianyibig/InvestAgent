---
name: reverse-dcf
description: >
  Reverse DCF valuation: back out the market-implied growth rate from today's
  enterprise value instead of forcing a forward DCF to a desired price. Trigger
  on reverse DCF, 反推 DCF, implied growth, 市场隐含增速, price in, or when the
  user asks what growth the market is pricing. Requires positive base-year FCFF;
  for negative FCFF use the PS-implied revenue fallback described inside.
---

# Reverse DCF

## Core idea

Forward DCF: assume growth → fair value (easy to tune to a conclusion).

**Reverse DCF: take market price → solve implied explicit-period CAGR**, then
translate that CAGR into plain-English requirements (size in 10 years, share of
TAM, vs history).

## Applicability

- **Required:** base-year FCFF > 0.
- If FCFF is negative (early hyper-growth / heavy capex), use **PS-implied
  revenue back-solve** instead of two-stage FCFF DCF.

## Steps

1. **Enterprise value**  
   `EV = market cap + net debt` (treat trading financial assets carefully for
   A-shares; note net-cash cases).

2. **Base-year FCFF** (cross-check both)  
   - A: `CFO - Capex + after-tax interest`  
   - B: `NOPAT + D&A - Capex - ΔNWC`  
   State whether the base year is cycle-peak, trough, or mid-cycle.

3. **WACC**  
   `Re = Rf + β × ERP`; document Rf, β source (prefer industry unlevered →
   relever), ERP, Rd, tax.

4. **Two-stage model**  
   Solve `g1` (10y explicit CAGR) given EV and terminal `g2` (~2.5–3%).

5. **Sensitivity table**  
   Grid of `g1` × `g2` EV outcomes; highlight the cell nearest actual EV.

6. **Translate g1**  
   FCFF₁₀, implied revenue, required share of TAM, vs historical CAGR.

7. **Limits**  
   High terminal-value share, base-year choice, and D&A/Capex disclosure
   quality. Reverse DCF states market expectations — not whether markets are
   right.

## Negative-FCFF fallback

```text
Implied Revenue_10 ≈ Market Cap / terminal PE / assumed net margin
Implied CAGR = (Implied Revenue_10 / current revenue)^(1/10) - 1
```

Disclose every assumed PE and margin.

## Data hygiene

Pull prices and statements with dated sources (`stock-quote`, filings pages, or
`web_fetch`). Do not invent financial statement lines.

## Output

Write `/mnt/user-data/outputs/{ticker}-reverse-dcf.md` with EV build, FCFF
bridge, WACC table, sensitivity grid, translation paragraph, and limits.
