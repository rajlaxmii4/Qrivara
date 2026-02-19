# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Qrivara (www.qrivara.tech) is a static website for a quantum research organization focused on circuit quantum electrodynamics (cQED). Deployed via GitHub Pages with a custom domain.

## Development

**No build tools, no frameworks, no package manager.** Pure HTML/CSS/JS served directly.

```bash
# Run local server
python3 -m http.server 8080

# View at http://localhost:8080
```

There are no tests, linters, or pre-commit hooks.

## Architecture

### Pages (7 HTML files, all in root)
- `index.html` — Home page with hero, about section, research panels (animated SVGs), quantum quote rotator, quantum circuit D3 visualization
- `research.html` — Research areas, publications list, D3 streaming area chart, D3 rotating gears
- `resources.html` — Course cards, career guidance, opportunities (has many placeholder `href="#"` links and empty iframes)
- `news.html` — Announcements placeholder, D3 interactive globe with TopoJSON
- `join.html` — Open positions with structured data (JSON-LD JobPosting schema)
- `team.html` — Team member cards with photos + open position placeholders
- `game.html` — Quantum gate memory matching game

### Shared Structure Across All Pages
Every page manually duplicates: header with `Q` logo + nav, footer with 3-column grid (bulletin, quick links, contact), hamburger toggle script, scroll reveal observer, and `simplex-noise.js` + `quantum-bg.js` script tags. There is no templating — changes to shared elements must be made in all 7 files.

### CSS (`style.css`, ~1800 lines)
Single stylesheet with CSS custom properties for theming. Key design tokens:
- `--teal: #ea580c` (primary accent — orange, despite the variable name)
- `--teal-light: #f97316`, `--cyan: #fb923c` (accent variants)
- `--copper: #b87333`, `--gold: #c49a3c` (metallic accents)
- `--surface: #ffffff`, `--surface-alt: #f8f9fb` (backgrounds)
- `--font-primary: 'Space Grotesk'`, `--font-mono: 'JetBrains Mono'`

Responsive breakpoints: 1024px (tablet), 768px (mobile), 480px (small mobile).

BEM-style naming: `.site-header__logo`, `.team-card__avatar`, `.research-panel__viz`.

### JavaScript
- `quantum-bg.js` — Canvas-based animated PCB trace background (draws in page gutters, avoids content). Uses simplex noise for organic patterns.
- `simplex-noise.js` — Perlin/simplex noise library, dependency of quantum-bg.js.
- D3.js v7 loaded from CDN — used for visualizations on index, research, and news pages.
- All other JS is inline within each HTML file.

### Images (`/images/`)
~14MB total. Team photos, research illustrations, logo. No image optimization pipeline.

## Key Conventions

- Color accent variables are named `--teal` but actually hold orange values (`#ea580c`). Do not rename — too many references.
- Scroll reveal animations use `.reveal` class + IntersectionObserver (threshold 0.12). Cascading reveals use `.stagger-children` on parent.
- Header gets `.scrolled` class on scroll > 20px (adds shadow).
- Tab titles use "Q — PageName" format.
- All "Apply" and contact links point to `mailto:qrivara.tech@gmail.com`.
- External links use `target="_blank" rel="noopener noreferrer"`.

## Known Issues

- `style.css` has `--teal` variable holding orange (#ea580c) — legacy naming from color migration
- `resources.html` has 53 placeholder `href="#"` links and 24 empty `iframe src=""` attributes
- No shared template system — header/footer/nav changes require editing all 7 HTML files
- Some images are uncompressed (largest ~1MB)
