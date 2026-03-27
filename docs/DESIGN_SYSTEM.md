# Design System — Dark Terminal Aesthetic

> **Vibe**: Dark mode, techy, terminal-inspired, not corporate

## Core Principle

This site should feel like opening a terminal into someone's mind. Dark, clean,
precise — but with personality.

## Color Palette

### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0a0a0f` | Page background |
| `--bg-secondary` | `#12121a` | Card backgrounds |
| `--bg-tertiary` | `#1a1a25` | Elevated surfaces, chat panel |
| `--bg-hover` | `#1f1f2e` | Hover states |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#e4e4e7` | Primary text |
| `--text-secondary` | `#a1a1aa` | Muted text |
| `--text-tertiary` | `#52525b` | Hints, timestamps |

### Accents
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-green` | `#22c55e` | Terminal green — primary |
| `--accent-cyan` | `#06b6d4` | Secondary — links, interactive |
| `--accent-purple` | `#a855f7` | Highlight — brain/cognitive |
| `--accent-amber` | `#f59e0b` | Emphasis — stats, numbers |

### Glow Effects
```css
--glow-green: 0 0 20px rgba(34, 197, 94, 0.3);
--glow-cyan: 0 0 20px rgba(6, 182, 212, 0.3);
--glow-purple: 0 0 20px rgba(168, 85, 247, 0.3);
```

## Typography

### Font Stack
```css
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--font-sans: 'Inter', -apple-system, sans-serif;
```

### Scale
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Hero name | Mono | 48px | 700 |
| Section heading | Mono | 24px | 600 |
| Body text | Sans | 16px | 400 |
| Code/terminal | Mono | 14px | 400 |
| Badge | Sans | 12px | 500 |
| Chat message | Sans | 14px | 400 |

## Visual Components

### Terminal Window Chrome
- Three dots: red (#ef4444), amber (#f59e0b), green (#22c55e), 8px circles
- Title bar: `--bg-tertiary`, `--text-tertiary` text
- Content: `--bg-secondary`
- Border: 1px `--border`, radius 12px

### Section Card
- Background: `--bg-secondary`, border: 1px `--border`, radius 12px, padding 32px
- Hover: border → `--border-hover`, subtle `--glow-green`
- Entry: fade-in + slide-up (20px) on scroll

### Project Card
- Collapsed: title + one-liner + stat pills + tech badges
- Expanded: full description + architecture + diagram
- Active indicator: left border (green for work, purple for personal)

### Tech Badge
- Pill shape, `--bg-tertiary`, 12px sans, hover → green glow

### Chatbot Panel
- Fixed bottom-right, trigger button with `> _` icon
- Slides up, max-height 60vh, `--bg-tertiary` with backdrop-blur
- Terminal-style input with `> ` prefix

### Generative UI Morph Effects
- **Focus**: target 102% scale, others 98% + opacity 0.4
- **Highlight**: green glow text-shadow pulse (2s)
- **Scroll**: smooth with 80px offset
- **Reset**: 0.5s transition to default

## Background Pattern

```css
background-image: radial-gradient(circle, #27272a 1px, transparent 1px);
background-size: 24px 24px;
```

## Things to Avoid

- Purple gradients, neon blue everything
- Corporate bio layout (headshot + bullet points)
- Light mode (dark only)
- Excessive animation (purposeful only)
- Generic AI aesthetics
