# Animation Theme Map

> 16 Canvas animations · unified to Claude palette via `this.theme()` helper
>
> All animations read colors from `getComputedStyle(document.documentElement)` and resolve at draw() time, so theme switching is reactive.

## Color replacement rules

| Original (old palette) | New (Claude palette) |
|------------------------|----------------------|
| `#7C3AED` (violet) | `t.primary` |
| `#06B6D4` (cyan) | `t.accentTeal` |
| `#EC4899` (pink) | `t.primary` |
| `#10B981` (emerald) | `t.success` |
| `#FBBF24` (amber) | `t.accentAmber` |
| `#FFFFFF` (white) | `t.canvas` or `t.onDark` (context) |
| `#000000` (black) | `t.ink` or `t.surfaceDark` |
| `#0B1220` / `#0F172A` (deep dark) | `t.surfaceDark` |
| `#F8FAFC` / `#F1F5F9` (light bg) | `t.canvas` or `t.surfaceCard` |
| `#334155` / `#475569` (slate) | `t.muted` or `t.body` |
| `#E2E8F0` / `#CBD5E1` (light gray) | `t.hairline` or `t.mutedSoft` |
| `#94A3B8` / `#64748B` (mid gray) | `t.mutedSoft` or `t.muted` |

## 16 animation semantic strategies

| File | Strategy |
|------|----------|
| ch1-agent-types.js | 5 agent types: mutedSoft → muted → body → ink → primary (progression) |
| ch2-history-timeline.js | 4 eras: mutedSoft / accentAmber / accentTeal / primary |
| ch3-attention.js | Heatmap: t.primary with alpha gradient |
| ch4-react-loop.js | 3 paradigms: primary / accentTeal / accentAmber |
| ch5-lowcode.js | 3 platforms: accentTeal / success / accentAmber; active path = primary |
| ch6-frameworks.js | 4 frameworks: accentTeal / primary / success / muted |
| ch7-framework.js | 5 layers (ink gradient) + 4 pain points (error/warning/primary/accentTeal) |
| ch8-memory.js | 3 mem layers (amber/teal/success) + 6 RAG steps (ink→primary) |
| ch9-context-window.js | 4-stage GSSC pipeline: accentTeal / primary / success / accentAmber |
| ch10-protocol.js | Timeline + events: ink / muted / primary / body / error |
| ch11-rl-feedback.js | Reward signal: primary (positive) / muted (negative) / body (neutral) / success (arrows) |
| ch12-radar.js | 6 dimensions: ink alpha gradient (0.2→1.0) + primary for current |
| ch13-travel.js | 4 agents: ink / primary / accentTeal / muted |
| ch14-task-tree.js | Task tree: surfaceCard (default) / primary (current) / muted (lines) |
| ch15-cybertown.js | Town grid: hairline / ink / primary / accentTeal / accentAmber (lit windows) |
| ch16-capstone.js | Placeholder: primary border + surfaceCard background |

## Adding a new animation

1. Define colors as `colorKey: 'primary'` etc. on data objects
2. Resolve to hex at draw() time:
   ```js
   const t = this.theme();
   ctx.fillStyle = t[item.colorKey];
   ```
3. Use only token names from `this.theme()` return value
4. Verify on warm cream canvas AND on deep navy (dark mode)
5. Run `npm test 2>&1 | tail -3` — must not regress

## Theme reactivity

`js/animations/canvas-animation.js` (base class) has:
- `theme()` — returns token values from `getComputedStyle(document.documentElement)`
- `_observeTheme()` — `MutationObserver` on `data-theme` attribute, calls `render()` / `draw()` on change
- Theme is read at draw() time, not constructor time → reactivity is automatic
