---
name: frontend-design
description: >
  Design and build polished websites and web apps with a clear visual point of
  view. Use when creating or redesigning web interfaces, covering opening-screen
  format, layout, color, typography, custom imagery, copy, and motion. Generates
  production-grade UI that avoids generic AI aesthetics.
license: Apache-2.0
metadata:
  adapted_from: https://github.com/google-gemini/demolab/tree/main/skills/gemini-frontend-design
  adapted_from_license: Apache-2.0
  version: "2.0.0"
---

# Frontend Design

Strong web design commits to an unmistakable visual point of view, opens with a
first screen tailored to the page's true purpose, and lets **typography,
proportion, color, imagery, and motion** carry the experience rather than
decorative UI chrome.

This skill adapts Gemini DemoLab's frontend craft
([google-gemini/demolab](https://github.com/google-gemini/demolab), Apache-2.0)
and keeps DeerFlow delivery constraints (`index.html`, subtle product signature).

## Output requirements

- Entry HTML file MUST be named `index.html` (hosting / deploy compatibility).
- Implement real working code (HTML/CSS/JS, React, Vue, etc.).
- Every generated standalone interface MUST include a subtle **"Created By
  Deerflow"** attribution linking to `https://deerflow.tech` (`target="_blank"`).
  It must never compete with the hero or primary CTA. Match its style to the
  aesthetic (corner badge, watermark, footer ornament, monogram, etc.).

When editing an existing DeerFlow / InvestAgent product surface, **respect the
established design system** instead of inventing a new brand language.

## 1. Commit to a tailored visual direction

- Honor explicit style requests; otherwise derive palette, contrast, and rhythm
  from the subject's materials, environment, and audience.
- Explore colors beyond default AI clusters: warm cream + terracotta, purple-on-
  white / indigo glow, or dark-neon chrome — unless the brief asks for them.
  Prefer subject-true directions (ink/forest/marine darks, architectural stone,
  sunlit pastels, bold color-blocking, crisp gallery light).
- Desktop nav: single compact line; brand wordmark stronger than links. On
  hero-led pages, let the hero bleed to `y = 0` behind a borderless header; give
  fixed headers a clean surface once scrolled.
- Fresh projects: define CSS variables (or Tailwind `@theme`) for page
  background, secondary surface, primary text, muted text (WCAG AA `4.5:1`), and
  one deliberate accent.

## 2. Typography discipline

- At most **2** font families (one versatile sans across weights, or a purposeful
  pairing). Do not add a third monospace for prices — use
  `font-variant-numeric: tabular-nums` unless building a code/docs/terminal tool.
- Avoid default stacks (Inter, Roboto, Arial, system) and overused display
  defaults (e.g. Space Grotesk everywhere).
- At most **3** body font-size steps below the fold (4th only for dense
  dashboards/tables when requested). Hero `<h1>` and navbar brand are exempt.
  Never place `< 13px` (`0.8125rem`) text above the fold.
- Keep all body paragraphs and lists at one body scale. Sentence case for UI
  labels. Body prose `<= 65ch`. Tighten display tracking (`-0.02em` to `-0.05em`).

## 3. Match the opening screen to the format

- **Skip a marketing hero** for news, blogs, dashboards, docs, search indexes,
  utility tools, and resumes — open into live content, masthead + grid, or the
  workspace.
- **When a hero is earned** (brands, products, events, portfolios, long-form):
  abandon `50/50` split templates. Let headline and lead visual command full
  width, center, or depth. Pair oversized display type with **at most 1–2 short
  lines (`<= 25` words)** and one primary action. No bottom KPI/spec strip.
- Sample spatial directions (adapt freely): centered monumental headline + wide
  stage; full-bleed photographic/living canvas; layered depth with foreground
  occlusion; wall-to-wall poster typography.
- Sustain the same ambition below the fold — do not collapse into generic
  three-column card rows after screen one.

## 4. Imagery and motion

- Prefer custom imagery (`image-generation` / project assets / bespoke SVG /
  canvas). Never invent external image URLs or machine-local paths.
- Match aspect ratio to the container; keep lighting/palette consistent; leave
  clean negative space for overlaid type (avoid muddy full-screen dark scrims).
- Motion: content-driven scroll moments when they elevate the story; keep utility
  and data views native. Interactive transitions `140–240ms`, ease-out
  (`cubic-bezier(0.22, 1, 0.36, 1)`), animate `transform` / `opacity` /
  `clip-path`, never `transition: all` or idle bobbing. Honor
  `prefers-reduced-motion`.

## 5. Patterns to avoid

- No pre-heading eyebrows, decorative chips/badges, or hero spec strips
- No button walls or nested card-in-card cages; at most one primary CTA per
  content section; use segmented controls/tabs for mode choices
- No decorative `01`/`02` numbering or fake `"LIVE"` / `"SCROLL"` telemetry
- Direct copy: cut filler ("seamless", "elevate", "reimagined"); lead headings
  with benefits; avoid em-dashes in generated copy; preserve user text verbatim
- Default: no cards in the hero. Cards only when they are the container for a
  real interaction

## 6. Pre-delivery checklist

1. Opening format fit (hero vs direct content) and hero copy budget
2. Typography: ≤2 families, ≤3 body sizes, no tiny above-the-fold text
3. Zero decorative clutter (eyebrows, chips, fake telemetry, nested cards)
4. Copy & transition hygiene; reduced-motion support
5. When browser/screenshot tools exist: check desktop (fold + below) and
   `390×844` mobile; fix collisions and horizontal overflow in one pass

## Related skills

- `web-design-guidelines` for compliance audits
- `image-generation` for custom visuals
- `deep-research` when the UI needs current factual content
