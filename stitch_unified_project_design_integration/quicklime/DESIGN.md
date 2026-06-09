---
name: Quicklime
colors:
  surface: '#FFFFFF'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#404943'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#707973'
  outline-variant: '#bfc9c1'
  surface-tint: '#2c694e'
  primary: '#0f5238'
  on-primary: '#ffffff'
  primary-container: '#2d6a4f'
  on-primary-container: '#a8e7c5'
  inverse-primary: '#95d4b3'
  secondary: '#5f5e5d'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfdd'
  on-secondary-container: '#636261'
  tertiary: '#4a4740'
  on-tertiary: '#ffffff'
  tertiary-container: '#625f57'
  on-tertiary-container: '#ded9cf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b1f0ce'
  primary-fixed-dim: '#95d4b3'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#0e5138'
  secondary-fixed: '#e5e2e0'
  secondary-fixed-dim: '#c9c6c4'
  on-secondary-fixed: '#1c1c1a'
  on-secondary-fixed-variant: '#474745'
  tertiary-fixed: '#e7e2d8'
  tertiary-fixed-dim: '#cbc6bc'
  on-tertiary-fixed: '#1d1c16'
  on-tertiary-fixed-variant: '#49473f'
  background: '#faf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e3e2df'
  sunken: '#EEECE8'
  line: '#E4E2DD'
  accent-muted: '#EAF1ED'
  destructive: '#C0392B'
  text-tertiary: '#AEADA8'
typography:
  display-wordmark:
    fontFamily: Instrument Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.5px
  headline-lg:
    fontFamily: Instrument Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.5px
  headline-lg-mobile:
    fontFamily: Instrument Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.5px
  event-title:
    fontFamily: Instrument Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.2px
  course-name:
    fontFamily: Instrument Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.2px
  body-md:
    fontFamily: Instrument Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0px
  section-header:
    fontFamily: Instrument Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.4px
  label-md:
    fontFamily: Instrument Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0px
  data-mono:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0px
  code-mono:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.1px
  caption:
    fontFamily: Instrument Sans
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.1px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  margin-h: 20px
  button-height: 50px
---

## Brand & Style

The design system is rooted in **Swiss Editorial Minimalism**, prioritizing clarity, mathematical precision, and a disciplined hierarchy. It is designed for an academic environment where information density must be balanced with extreme legibility. The brand personality is professional, organized, and quietly authoritative—avoiding decorative flair in favor of functional utility.

The aesthetic utilizes "whitespace as a structural element" and a "UI-as-a-whisper" philosophy, ensuring the interface recedes so that critical data—schedules, course codes, and deadlines—remains the primary focus. 

**Design Principles:**
- **Grid-Driven:** Every element aligns to a strict 4pt rhythmic grid.
- **Typographic Priority:** Hierarchy is established through weight and scale rather than color or shadows.
- **Functional Color:** Color is never used for decoration; it is reserved strictly for high-priority signaling and interactivity.
- **Materiality:** The interface feels like a digital broadsheet—flat, structured, and tactile through subtle use of borders.

## Colors

The palette is anchored by a warm off-white neutral that reduces eye strain compared to pure white, paired with a sophisticated deep sage green for primary actions. 

- **Primary BG (#F7F6F3):** Used for the main application canvas to create a soft, paper-like feel.
- **Surface (#FFFFFF):** Reserved for interactive cards, input fields, and elevated sheets.
- **Accent (#2D6A4F):** The deep sage green is used exclusively for CTAs, active states, and high-priority indicators. 
- **Typography:** Primary text uses a near-black (#111110) for maximum contrast, while secondary text uses a muted grey (#6B6860) to recede.
- **Lines (#E4E2DD):** Used for hair-line borders (1pt) that define structure without adding visual weight.

## Typography

This system employs a dual-typeface strategy to separate prose from technical data. 

**Instrument Sans** handles all interface labels, headlines, and body copy. It provides a contemporary, clean Grotesque aesthetic that scales elegantly. **Geist Mono** is utilized strictly for technical data, including timestamps (HH:mm), course codes, and invite keys, creating a visual "data-layer" that is instantly distinguishable from narrative text.

**Hierarchy Rules:**
- **Section Headers:** Always uppercase with increased letter spacing for clear grouping.
- **Monospace Usage:** Use `data-mono` for any numerical strings or time-based metadata.
- **Weight:** Avoid using weights below 400 for legibility; use 600 (Semibold) for all structural titles.

## Layout & Spacing

The layout follows a strict **4pt grid system**. On mobile, the system uses a **fluid layout** with fixed horizontal margins of **20pt**.

**Spacing Rhythm:**
- **Internal Card Padding:** Use `md` (16px) for standard cards and `sm` (8px) for tighter, nested elements.
- **Vertical Rhythm:** Use `lg` (24px) between distinct sections and `xxl` (48px) between major content groups.
- **Interactive Elements:** All buttons and text inputs must maintain a height of exactly **50pt** to ensure a consistent touch target and visual rhythm across forms.
- **Top Margin:** Always leave `xl` (32px) of space from the status bar/navigation to the first header.

## Elevation & Depth

In alignment with the Swiss Editorial style, the system is **primarily flat**. Depth is communicated through **tonal layers** and **low-contrast outlines** rather than shadows.

- **Layering:** The base layer is `color.bg.base`. Cards and active surfaces sit on `color.bg.surface`. Sunken elements (like search bars or tab bar backgrounds) use `color.bg.sunken`.
- **Borders:** A **1pt solid border** using `color.line` is the primary method of defining container boundaries.
- **Shadows:** Use shadows only when a border is visually inappropriate (e.g., floating action buttons or over image content). When used, they must be extremely diffused: `rgba(0, 0, 0, 0.06)` with a 4-8px blur.
- **Active States:** For the "current" class or active event, use a **2pt vertical accent line** of `color.accent` on the left edge of the row.

## Shapes

The shape language is "Soft-Modern," using intentional corner radii to balance the rigidity of the typography.

- **16pt (rounded-xl):** Reserved for bottom sheets and large modal containers.
- **12pt (rounded-lg):** The standard for cards and primary buttons.
- **10pt (standard):** Used for text inputs and the 6-character invite code boxes.
- **8pt (rounded-sm):** Used for chips, tags, and small utility buttons.

All buttons should maintain their specific radii; avoid pill-shaped buttons to maintain the editorial, structured feel.

## Components

### Buttons & Inputs
- **Primary Button:** `color.text.primary` background with inverted white text. No shadow. 12pt radius.
- **Secondary Button:** Transparent background with a `1.5pt` border of `color.line`.
- **Invite Code Input:** A series of six individual 10pt-radius boxes. Focused state uses a `1.5pt` border of `color.accent`.
- **Text Fields:** 50pt height, `color.bg.surface`, with a 1pt `color.line` border.

### Cards & Rows
- **Event Card:** White background, 12pt radius, 1pt `color.line` border. Titles in `event-title`, metadata (times) in `data-mono`.
- **Class Row:** Full-bleed background (`color.bg.base`). Use a 2pt vertical `color.accent` line on the left to indicate "Now." 
- **Chips:** `color.accent.muted` background with `color.accent` text. 8pt radius. Use for category tags like "Test" or "Assignment."

### Lists & Navigation
- **Navigation Bar:** Minimalist. Use `22pt` outlined icons. Active states should use filled icons.
- **Dividers:** 1pt solid `color.line`. Avoid full-width dividers; inset them by `margin-h` (20px).
- **Empty States:** Use `color.text.tertiary` for messaging with center-aligned Geist Mono labels for technical codes.