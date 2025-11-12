# Design Notes

## /links
- Hero: stacked mobile-first layout featuring portrait of Caroline (`assets/raw-site/links/imagem.webp`), name heading, emoji-rich bio.
- CTA Tiles: grid of wide banner cards linking to flagship offers (Verso e Reverso, Guia Iluminação, Mentorias, Workshops). Each tile pairs bold typography with photography/product mockups, captured under `assets/raw-site/links/*.png|*.webp` and referenced screenshots `docs/reference/screenshots/links-desktop.png` / `links-mobile.png`.
- WhatsApp Buttons: multiple banners dedicated to direct `api.whatsapp.com` contact, ensuring continuity between budget requests and mentorship.
- Visual Pattern: consistent warm beige/pink gradients with serif and sans-serif pairings; mobile section duplicates CTAs with optimized aspect ratios (mobile-specific banners).

## /verso-reverso
- Immersive 3D hero featuring Discord-inspired container and layered depth effects (see `verso-reverso-desktop.png`). Scroll produces zoom transforms; pricing ribbon anchors call-to-action around `#preco` anchor.
- Sections: testimonial carousel, module breakdown cards, benefit icons, timeline; color palette mixes dark charcoal backgrounds with copper gradients.
- Pricing: tier block shows parceling (`R$ 199,31`) and full investment (`R$ 1.997,00`). Multiple Elementor popups trigger form captures.

## /verso-e-reverso (legacy)
- WordPress blog style layout with simple navigation clone. Static hero replicates `/` default but retains CTA anchors.
- Uses same asset stack as `/verso-reverso` but without interactive 3D container; good reference for fallback states.

## Product Landing Pages
- `Guia Iluminação`: monochrome studio photography backgrounds with bold uppercase H2, orange accent CTA `QUERO O GUIA`. Pricing captured at `R$147`.
- `Guia Gestantes`: pastel gradients featuring maternity posing imagery, focus on lighting diagrams and PDF deliverables. CTA to Hotmart checkout.
- `Guia Fotografia Corporativa`: corporate teal/neutral palette, heavy text blocks, CTA `COMPRE AGORA`, price `R$197`.

## Shared Observations
- Typography: mix of Playfair Display for headings and Montserrat/Manrope for body; uppercase headings provide rhythm.
- Buttons: Pill-shaped CTA banners, often implemented as full-width image tiles rather than standard button elements.
- Social Proof: repeated use of client quotes and module lists, suggesting reusable component for testimonials/benefits.
- Asset Inventory: consolidated within `assets/raw-site/` and `assets/raw-site/links/` with manifest files for traceability.

Use these notes to align new layouts with the Verso Reverso aesthetic—favor layered depth, cinematic imagery, copper/pink gradients, and CTA density that smoothly transitions mobile journeys.
