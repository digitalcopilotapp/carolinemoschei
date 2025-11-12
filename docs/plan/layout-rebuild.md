# Layout Rebuild Blueprint

## Design Principles
- Maintain `verso-reverso` aesthetic language: noir backgrounds, warm beige gradients, uppercase headlines, smooth motion inspired by the existing 3D container.
- Responsive grid system: 12-column desktop (≥1280px), 8-column tablet (768–1279px), stacked mobile (≤767px) with padding rhythm of `6rem/4rem/2.5rem`.
- Scroll-triggered reveals (opacity + vertical offset) limited to key sections to keep performance tight.

## Shared Banner System
- `HeroFullBleed`: background image/video with gradient overlay, central or side-aligned headline, subtitle, dual CTA group.
- `SplitHighlight`: two-column storytelling block with portrait imagery and supporting copy.
- Typographic hierarchy: `h1` 56/64 desktop (40/48 mobile), `h2` 36/44 (28/36 mobile), body 18/28 (16/26 mobile).

## Page Blueprints

### `/links`
1. Hero: Caroline portrait + intro copy, WhatsApp redirect CTA.
2. Mentorias & Workshops: 2×2 card grid (carousel on mobile) linking to flagship programs.
3. Produtos Digitais: responsive card matrix for guides and presets.
4. Footer: social icons, contact microcopy.

### `/verso-reverso`
1. Hero video with audio toggle and primary CTA strip.
2. Overview stats (duration, format, bonuses).
3. Program Journey timeline grouped by phases.
4. Community spotlight with 3D tilt container adapted for responsive scaling.
5. Pricing comparison + guarantee ribbon + FAQ.

### `/verso-e-reverso-2025`
- Leverage same structure as `/verso-reverso` but mark as edição anterior; CTA points to 2026 cohort.

### `/wsp-2026`
1. Numeric hero with gradient overlay.
2. Experience gallery (testimonials + photo grid).
3. Agenda timeline with icons.
4. Pricing block (sold out state) + waitlist CTA driving to WhatsApp redirect.
5. FAQ accordion.

### `/guia-iluminacao`
- Hero mockup, feature grid, lighting setup tutorials, equipment list, bonus strip, sticky CTA.

### `/guia-fotografia-corporativa`
- Hero collage, pose flow tabs (standing/seated/props), asset bundle summary, testimonials, pricing, FAQ.

### `/presets`
1. Hero emphasizing professional Lightroom presets.
2. Pack catalog: each card implements before/after slider (drag handle desktop, tap toggle mobile).
3. Bonus lessons module.
4. Testimonials carousel.
5. FAQ and support.

### `/curso-de-fotografia-de-celular`
- Lifestyle hero, module breakdown grid, before/after gallery with phone frames, persona spotlight, pricing CTA.

### Upcoming Pages
- `Curso Photoshop` & `Curso Lightroom`: course template with module list, sample edits, testimonials, CTA linking to bundle.
- `Combo Photoshop + Lightroom`: highlight savings, compare modules, bundle-only bonuses.

## WhatsApp Redirect Flow
- Create `/redirect/whatsapp` endpoint logging CTA metadata, firing Google Analytics + Meta Conversion API, then forwarding to `wa.me` link.

## Implementation Next Steps
1. Build component library under `src/components/site/` (Hero, Timeline, Slider, FAQ, Testimonials).
2. Extract shared tokens into `src/styles/site-theme.css` (colors, spacing, typography, shadows).
3. Implement before/after slider module (`pointerdown` + `requestAnimationFrame`).
4. Document analytics requirements for WhatsApp redirect integration.
