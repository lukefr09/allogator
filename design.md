# Allogator Design Philosophy

## The Problem We're Solving

This UI used to look like every other AI-generated finance dashboard: dark mode, teal/green accents, cards floating on cards, rounded corners everywhere, generic sans-serif fonts. That aesthetic is immediately recognizable as "vibe coded" — it looks like no human designer touched it. We're fixing that.

## Core Principle: This Is a Financial Document, Not a SaaS Dashboard

Allogator is a calculator. It should feel like a well-typeset financial statement or a page from the Financial Times — not a startup landing page. Every design decision flows from this.

**What this means in practice:**

- **No cards.** Don't wrap things in rounded rectangles with shadows. Use horizontal rules (`border-bottom`) and whitespace to create hierarchy. The page is flat. Information is separated by lines, not boxes.
- **No decorative elements.** No gradients, no glows, no ornamental shapes. If a visual element doesn't communicate data, it shouldn't exist.
- **Tables, not grids of cards.** Positions are rows in a table. Not cards. Not tiles. Rows. With columns that align.
- **Numbers are right-aligned and use tabular figures.** Always `font-variant-numeric: tabular-nums` and `text-align: right` for monetary values. This is how financial documents work — decimal points line up vertically.

## Typography

Two fonts. That's it. Don't add more.

- **Instrument Serif** — Used for section headings ("Positions", "Allocate", "Result") and the logo. This is the personality of the app. It says "finance, but designed by someone with taste." It is NOT used for data, labels, or body text.
- **DM Sans** — Used for everything else: data, labels, inputs, buttons, body text. Clean, readable, not overused in the AI slop ecosystem.

**Never use:** Inter, Roboto, Arial, Space Grotesk, system-ui as a visible choice. These are the fonts AI defaults to.

**Sizing hierarchy:**
- Logo: 26px serif
- Section titles: 22px serif (left column), 18px serif (right column)
- Data/values: 15px sans
- Labels/meta: 11-12px sans, uppercase, letter-spaced

## Color

### Light Theme
- Background: `#FAFAF7` (warm off-white, NOT pure white)
- Text: `#1A1A18` (warm near-black, NOT pure black)
- Secondary text: `#7A7A72`
- Tertiary/labels: `#A8A89E`
- Rules/borders: `#E2E1DB`

### Dark Theme
- Background: `#1C1B19` (warm near-black, NOT blue-tinted slate)
- Text: `#E8E6DF` (warm off-white)
- Secondary: `#9C9A90`
- Tertiary: `#6B6960`
- Rules: `#333129`

### Accent Color: Amber
- Light: `#B45309`
- Dark: `#D97706`
- Used ONLY for monetary amounts in the Allocate section and the Allocate section header border.
- This is the ONE pop of color in the entire UI (besides status indicators). Don't use it for buttons, backgrounds, or decoration.

### Status Colors (used sparingly, only for allocation drift indicators)
- On target (green): `#15803D` light / `#4ADE80` dark
- Close (yellow): `#A16207` light / `#FBBF24` dark
- Off (red): `#B91C1C` light / `#F87171` dark

**Never use:** Teal, cyan, purple, or blue as accent colors. These are the AI finance dashboard defaults.

## Layout

Two-column layout: positions table on the left (wider), allocation + results on the right (340px fixed). The right column is `position: sticky`.

On mobile (<860px), this collapses to single column with the right column flowing below.

**There are no cards.** The page is a flat surface with content organized by:
1. **2px solid borders** under section headings (strong hierarchy)
2. **1px solid borders** between rows (light separation)
3. **Whitespace** between sections (breathing room)

## Interaction Patterns

- **Editable values look like plain text until hover.** The inputs in the positions table have `border: transparent` by default. On hover, a subtle border appears. On focus, it becomes solid. This keeps the UI clean when you're reading but makes it clear things are editable when you interact.
- **Remove buttons are invisible until row hover.** Less visual clutter. The × appears at 50% opacity on row hover, full opacity + red on direct hover.
- **Buttons are outlined, not filled.** The "Add" button is a simple border + text. On hover, it inverts (filled background). This is more restrained than colored filled buttons.
- **The sell toggle highlights amber when active**, not the default blue/green that every toggle uses.

## What NOT To Do

This section exists because AI code generation has strong defaults that will fight you. Resist these:

1. **Don't add border-radius to containers.** The border-radius on this UI is 2px on inputs and small controls. That's it. No `rounded-lg`, no `rounded-xl`, no pill shapes.
2. **Don't add box shadows.** No `shadow-sm`, no `shadow-md`. Shadows create the card-on-dark-background look we're explicitly avoiding.
3. **Don't add background colors to sections.** Sections are not cards. They don't have background colors. They sit flat on the page background.
4. **Don't add icons everywhere.** The only icons are the sun/moon theme toggle and the × remove button. Don't add icons to section headers, labels, or buttons.
5. **Don't add gradients.** Anywhere. For any reason.
6. **Don't add hover color changes to rows** beyond the subtle `background: var(--bg-subtle)`. No color shifts, no scale transforms, no elevation changes.
7. **Don't make the dark theme blue-tinted.** The dark theme uses warm grays/browns (`#1C1B19`, `#252420`, `#333129`). Slate, zinc, and blue-gray are banned.
8. **Don't add padding inside section areas to create card-like containers.** The content sits directly on the page with consistent page-level padding.
9. **Don't use Tailwind's default color palette names** (slate, zinc, neutral) as a guide. Our colors are custom and intentionally warm.
10. **Don't add a hero section, marketing copy, or feature highlights.** This is a tool. It opens directly to the tool.

## File Reference

The mockup HTML file (`allogator-final.html`) is the source of truth for how every component should look. When in doubt, match the mockup exactly. The CSS variables, spacing, typography, and interaction patterns in that file are intentional and should be preserved during the React implementation.

## Summary

The aesthetic is: **editorial finance**. Think Financial Times, not Robinhood. Think printed annual report, not SaaS dashboard. The personality comes from the serif headings, the warm color palette, and the amber accent — not from visual complexity. Every element earns its place by communicating information. Nothing is decorative.