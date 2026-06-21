# Hello-Agents Design System

> **Style: Claude-Inspired** — warm editorial · cream + coral + serif
>
> Inspired by [Anthropic Claude DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/claude/DESIGN.md).
> This document is the project's design source of truth.

## Tokens

### Colors (light)
| Token | Value | Use |
|-------|-------|-----|
| `--canvas` | `#faf9f5` | Page background (warm cream) |
| `--canvas-soft` | `#f5f0e8` | Section dividers |
| `--surface-card` | `#efe9de` | Feature cards |
| `--surface-cream-strong` | `#e8e0d2` | Emphasized bands |
| `--surface-dark` | `#181715` | Code/footer |
| `--surface-dark-elevated` | `#252320` | Elevated dark surface |
| `--surface-dark-soft` | `#1f1e1b` | Soft dark surface |
| `--hairline` | `#e6dfd8` | Borders |
| `--hairline-soft` | `#ebe6df` | Soft borders |
| `--primary` | `#cc785c` | Coral — single CTA color |
| `--primary-active` | `#a9583e` | Press state |
| `--primary-disabled` | `#e6dfd8` | Disabled state |
| `--accent-teal` | `#5db8a6` | Secondary accent |
| `--accent-amber` | `#e8a55a` | Tertiary accent |
| `--ink` | `#141413` | Primary text |
| `--body-strong` | `#252523` | Strong body text |
| `--body` | `#3d3d3a` | Default body |
| `--muted` | `#6c6a64` | Muted text |
| `--muted-soft` | `#8e8b82` | Softer muted |
| `--on-primary` | `#ffffff` | Text on primary |
| `--on-dark` | `#faf9f5` | Text on dark |
| `--on-dark-soft` | `#a09d96` | Muted on dark |
| `--success` | `#5db872` | Success state |
| `--warning` | `#d4a017` | Warning state |
| `--error` | `#c64545` | Error state |

### Colors (dark)
| Token | Value | Notes |
|-------|-------|-------|
| `--canvas` | `#0d253d` | Deep navy base |
| `--canvas-soft` | `#0a1929` | Deeper navy |
| `--surface-card` | `#1c1e54` | Purple-tinted card |
| `--surface-dark` | `#0a1929` | Same as canvas-soft |
| `--surface-dark-elevated` | `#1c2a40` | Elevated card |
| `--surface-dark-soft` | `#142235` | Soft surface |
| `--hairline` | `rgba(255,255,255,0.08)` | Subtle on dark |
| `--ink` | `#faf9f5` | Cream-tinted text |
| `--body` | `#cbd5e1` | Light slate |
| `--muted` | `#94a3b8` | Mid slate |
| `--on-dark` | `#faf9f5` | (unchanged) |
| `--on-dark-soft` | `#a09d96` | (unchanged) |
| `--primary` | `#cc785c` | (unchanged — coral pops on navy) |

### Typography
| Token | Size | Weight | Tracking | Use | Font |
|-------|------|--------|----------|-----|------|
| `display-xl` | 64px | 400 | -1.5px | Hero h1 | Source Serif 4 |
| `display-lg` | 48px | 400 | -1px | Section h2 | Source Serif 4 |
| `display-md` | 36px | 400 | -0.5px | Sub-section | Source Serif 4 |
| `display-sm` | 28px | 400 | -0.3px | Callout h2 | Source Serif 4 |
| `title-lg` | 22px | 500 | 0 | Plan title | Inter |
| `title-md` | 18px | 500 | 0 | Feature title | Inter |
| `title-sm` | 16px | 500 | 0 | List label | Inter |
| `body-md` | 16px | 400 | 0 | Default body | Inter |
| `body-sm` | 14px | 400 | 0 | Footer body | Inter |
| `caption` | 13px | 500 | 0 | Tag | Inter |
| `caption-uppercase` | 12px | 500 | 1.5px | Eyebrow | Inter |
| `code` | 14px | 400 | 0 | Code | JetBrains Mono |
| `button` | 14px | 500 | 0 | Button | Inter |
| `nav-link` | 14px | 500 | 0 | Nav | Inter |

### Spacing (4px base)
| Token | Value |
|-------|-------|
| `--space-xxs` | 4px |
| `--space-xs` | 8px |
| `--space-sm` | 12px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-xxl` | 48px |
| `--space-section` | 96px |

### Radii
| Token | Value | Use |
|-------|-------|-----|
| `--radius-xs` | 4px | Inputs |
| `--radius-sm` | 6px | Tags |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards |
| `--radius-xl` | 16px | Hero cards |
| `--radius-pill` | 9999px | Tags, pills |

### Shadows (use sparingly)
| Token | Value | Use |
|-------|-------|-----|
| `--shadow-1` | `0 1px 3px rgba(20,20,19,0.08)` | Subtle lift |
| `--shadow-2` | `0 8px 24px rgba(20,20,19,0.12), 0 2px 6px rgba(20,20,19,0.06)` | Modal/popover |

### Motion
| Token | Value |
|-------|-------|
| `--ease` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--t-fast` | `200ms` |
| `--t-base` | `400ms` |
| `--t-slow` | `600ms` |

## Components

### Buttons
- `button-primary` — coral bg, white text, 8px radius, 40px height, 12px×20px padding
- `button-secondary` — cream bg, ink text, 1px hairline border
- `button-secondary-on-dark` — dark surface elevated bg, on-dark text
- `button-text-link` — transparent, primary text

### Cards
- `feature-card` — surface-card bg, 32px padding, 12px radius, no shadow
- `product-mockup-card-dark` — surface-dark bg, on-dark text, 12px radius
- `code-window-card` — surface-dark bg, JetBrains Mono
- `model-comparison-card` — cream bg, 1px hairline border
- `callout-card-coral` — primary bg, white text, 12px radius

### Surfaces
- `hero-band` — cream bg, 96px padding, 6-6 grid
- `cta-band-coral` — primary bg, 64px padding
- `site-footer` — surface-dark bg, 4-column grid

### Overlays
- `search-panel` — cream bg, shadow-2, 12px radius, coral focus ring
- `toc-drawer` — cream bg, slides in from right, 1px hairline left border
- `keyboard-help` — cream bg, shadow-2

### Form
- `text-input` — cream bg, ink text, 10px×14px padding, 8px radius, 1px hairline
- `text-input:focus` — border → primary, 3px primary-at-15% outer ring

### Badges
- `badge-pill` — surface-card bg, ink text, pill radius, 13px
- `badge-coral` — primary bg, white text, uppercase 12px +1.5px tracking

## Adding new components — Do's and Don'ts

### Do
- Use Source Serif 4 (weight 400) for display
- Reserve coral for primary CTA + coral callout only
- Alternate cream → cream-card → dark-mockup surfaces for pacing
- Use 12px radius for cards
- Use 1px hairline for borders
- Pull all colors from the token table above

### Don't
- Don't use backdrop-filter or any glassmorphism
- Don't introduce colors outside the token table
- Don't bring Sora back as a font
- Don't use bold (weight ≥ 500) for display text
- Don't use Helvetica or Arial
- Don't add aurora gradients or multi-color mesh

## Theme switching

The theme is controlled by the `data-theme` attribute on `<html>`:
- `data-theme="light"` (default) — cream canvas
- `data-theme="dark"` — deep navy canvas

Press D key on any page to toggle. The 16 Canvas animations auto-redraw via MutationObserver.

## File responsibilities

| File | Owns |
|------|------|
| `css/main.css` | Tokens, body, typography, buttons, nav, chapter cards, hero, CTA, footer |
| `css/slides.css` | 9 slide types (cover, content, code, animation, quiz, timeline, flow, concepts, comparison) + player chrome |
| `css/themes.css` | `[data-theme="dark"]` overrides |
| `css/a11y.css` | Focus ring, contrast helpers, `prefers-reduced-motion` |
| `css/animations.css` | Keyframe animations |
| `css/print.css` | Print styles |
| `js/animations/canvas-animation.js` | Base class with `theme()` helper |
| `js/animations/ch1-16.js` | 16 chapter animations |
