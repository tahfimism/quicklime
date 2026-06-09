# Quicklime — Frontend PRD
**Version:** 1.0.0
**Date:** 2026-06-08
**Scope:** Mobile UI/UX — iOS (Swift/SwiftUI) & Android (Kotlin/Compose)

---

## 1. Design Philosophy

> **Less, but better.**

Quicklime's UI is built on one principle: every element must earn its place. If it doesn't communicate something essential, it doesn't exist.

The aesthetic is **Swiss editorial minimalism** — the kind you see in high-end print design applied to a mobile interface. Precision over decoration. Silence over noise. Structure over ornamentation.

### Pillars

**Restraint** — One accent color. One font family. Thin lines over filled shapes. The UI never competes with the content.

**Hierarchy through space** — Relationships between elements are expressed through whitespace and size, not color or borders.

**Purposeful motion** — Transitions communicate navigation direction. Animations confirm actions. Nothing animates just to look clever.

**Content-first** — Course names, times, and dates are the hero. UI chrome is a whisper.

---

## 2. Color System

The palette is near-monochrome. The accent is used sparingly — never decoratively.

### Light Mode (Primary)

| Token | Hex | Usage |
|---|---|---|
| `color.bg.base` | `#F7F6F3` | App background — warm off-white, not pure white |
| `color.bg.surface` | `#FFFFFF` | Cards, sheets, input fields |
| `color.bg.sunken` | `#EEECE8` | Tab bar, section backgrounds |
| `color.text.primary` | `#111110` | Headings, primary labels |
| `color.text.secondary` | `#6B6860` | Subtitles, metadata, placeholders |
| `color.text.tertiary` | `#AEADA8` | Disabled, hints |
| `color.line` | `#E4E2DD` | Dividers, borders |
| `color.accent` | `#2D6A4F` | Single accent — deep sage green |
| `color.accent.muted` | `#EAF1ED` | Accent backgrounds (tags, chips) |
| `color.destructive` | `#C0392B` | Delete, error states only |

### Dark Mode

| Token | Hex | Usage |
|---|---|---|
| `color.bg.base` | `#111110` | App background |
| `color.bg.surface` | `#1C1C1A` | Cards, sheets |
| `color.bg.sunken` | `#0C0C0B` | Tab bar, section backgrounds |
| `color.text.primary` | `#F0EFE9` | Headings, primary labels |
| `color.text.secondary` | `#8A8880` | Subtitles, metadata |
| `color.text.tertiary` | `#4A4845` | Disabled, hints |
| `color.line` | `#2A2A27` | Dividers, borders |
| `color.accent` | `#52B788` | Sage green, lighter for dark mode |
| `color.accent.muted` | `#1A2E23` | Accent backgrounds |
| `color.destructive` | `#E55A4E` | Error states |

### Rules
- Accent `color.accent` is used **only** on: the active tab indicator, primary CTA buttons, the event type dot/chip, and the CR badge.
- Never use accent as a background fill on anything larger than a chip or badge.
- No gradients. No shadows with color. Shadows are pure black at low opacity: `rgba(0,0,0,0.06)`.

---

## 3. Typography

One typeface. Two weights. One monospace for time values.

### Typeface: **Instrument Sans**

A refined grotesque with warmth. Not sterile like Helvetica, not tech-bro like Inter.

| Role | Weight | Size | Line Height | Tracking |
|---|---|---|---|---|
| Screen title | Semibold (600) | 28pt | 34pt | -0.5pt |
| Section header | Semibold (600) | 13pt | 18pt | 0.4pt uppercase |
| Course name | Medium (500) | 16pt | 22pt | -0.2pt |
| Body / description | Regular (400) | 15pt | 22pt | 0pt |
| Label / metadata | Regular (400) | 13pt | 18pt | 0pt |
| Caption | Regular (400) | 11pt | 16pt | 0.1pt |

### Monospace: **Geist Mono** (times and codes only)

Used exclusively for: class start/end times, slot time ranges, course codes.

| Role | Weight | Size |
|---|---|---|
| Time display | Regular (400) | 13pt |
| Course code | Regular (400) | 12pt |

### Rules
- No bold in body text. Hierarchy is size and color, not weight changes mid-sentence.
- Times are always displayed in `Geist Mono` — never in the main typeface.
- Section header labels are uppercase, 0.4pt tracked, `color.text.tertiary`.
- Never mix more than two sizes in a single card.

---

## 4. Spacing & Grid

Base unit: **4pt**.

| Token | Value | Usage |
|---|---|---|
| `space.xs` | 4pt | Icon-to-label gaps |
| `space.sm` | 8pt | Internal card padding (tight) |
| `space.md` | 16pt | Standard padding, list item insets |
| `space.lg` | 24pt | Section spacing |
| `space.xl` | 32pt | Top-of-screen to first content |
| `space.xxl` | 48pt | Between major sections |

### Screen Margins
- Horizontal content margin: **20pt** on all screens
- List rows: full-bleed background, content inset **20pt**

### Card Anatomy
- Corner radius: **12pt** (cards), **8pt** (chips/tags), **16pt** (bottom sheets)
- Card padding: `16pt` vertical, `16pt` horizontal
- Border: `1pt` solid `color.line` — no shadow on cards in light mode
- In dark mode: no border, use `color.bg.surface` elevation alone

---

## 5. Iconography

- Library: **SF Symbols** (iOS) / **Material Symbols — Outlined** (Android)
- Weight: match text weight in context (Regular for body, Medium for nav)
- Size: 20pt for inline icons, 22pt for navigation bar, 18pt for list accessories
- Color: always `color.text.secondary` unless interactive (then `color.accent`) or destructive

No custom illustrations. No emoji in UI chrome. No filled icons except for the active tab bar state.

---

## 6. Navigation Structure

```
App
├── Auth Flow (unauthenticated)
│   ├── Welcome Screen
│   └── Sign In Screen
│
├── Onboarding Flow (post-auth, no workspace)
│   ├── Create Workspace
│   └── Join Workspace
│
└── Main Tab Bar (authenticated + workspace joined)
    ├── Tab 1: Today
    ├── Tab 2: Routine
    ├── Tab 3: Events
    └── Tab 4: Settings
```

### Tab Bar
- 4 tabs, no labels — icon only
- Active tab: icon filled + `color.accent` dot indicator (2pt, below icon)
- Inactive tab: outlined icon, `color.text.tertiary`
- Background: `color.bg.sunken`
- Top border: `1pt color.line`
- Height: 49pt (iOS standard) / 56pt (Android)
- No tab bar visible during: auth flow, onboarding, full-screen event detail sheet

---

## 7. Screen Specifications

### 7.1 Welcome Screen

**Layout:** Full screen. Vertically centered content block.

**Elements:**
- Quicklime wordmark — `Instrument Sans Semibold`, 32pt, `color.text.primary`, centered
- Tagline — `"Your class. Organized."` — 15pt Regular, `color.text.secondary`, centered, 8pt below wordmark
- 48pt gap
- `Continue with Google` button — full width, outlined style (see Button spec)
- 12pt gap
- `Sign in with Email` — text-only link button, `color.text.secondary`

**Background:** `color.bg.base`. No illustration, no pattern.

**Transition:** Fade in content block on appear, 300ms ease-out. No logo animation.

---

### 7.2 Onboarding — Workspace Selection

Shown after first sign-in when user has no workspace.

**Layout:** Single screen, top-aligned.

**Elements:**
- Back button (if applicable) — top left, chevron icon, `color.text.secondary`
- Title — `"Get started"` — 28pt Semibold, `color.text.primary`, 32pt top margin
- Subtitle — `"Create a new workspace or join one with an invite code."` — 15pt Regular, `color.text.secondary`, 8pt below title
- 32pt gap
- `Create a workspace` — primary button, full width
- 12pt gap
- `Join with invite code` — secondary button, full width

---

### 7.3 Onboarding — Create Workspace

**Elements:**
- Title: `"Name your workspace"`
- Subtitle: `"This is usually your class or batch name."`
- Text input: workspace name (see Input spec)
- Below input, `color.text.tertiary` 11pt: `"e.g. CSE Batch 25, Section A"`
- Primary button: `"Create workspace"` — disabled until input non-empty

---

### 7.4 Onboarding — Join Workspace

**Elements:**
- Title: `"Enter invite code"`
- Subtitle: `"Ask your class representative for the 6-character code."`
- Code input: 6 large segmented character boxes (see Invite Code Input spec)
- Auto-submits when all 6 chars filled — no manual button tap needed
- Error state: boxes turn `color.destructive` border with shake animation, message below

---

### 7.5 Today Tab

**Purpose:** Single-view snapshot of the current day's classes and any events happening today or this week.

**Header:**
- Date string — e.g. `"Monday, 8 Jun"` — 13pt uppercase tracked, `color.text.tertiary`
- 4pt gap
- Title — `"Today"` — 28pt Semibold, `color.text.primary`

**Section: Today's Classes**
- Section label: `"CLASSES"` — uppercase, 13pt, `color.text.tertiary`
- If no classes: single row — `"No classes scheduled"` in `color.text.tertiary`, centered
- Class rows (see Class Row component)

**Section: Upcoming Events**
- Section label: `"UPCOMING"` — uppercase, 13pt, `color.text.tertiary`
- Shows next 3 events from today forward
- Event cards (see Event Card component)
- `"View all events"` text link at bottom — `color.accent`, 14pt

**Empty State (no classes, no events):**
- Single centered block: short text `"Nothing today."` in `color.text.secondary`, 15pt

---

### 7.6 Routine Tab

**Purpose:** Full weekly class schedule, day-by-day.

**Header:**
- Title: `"Routine"` — 28pt Semibold
- Day pill selector below (see Day Selector component)

**Content:**
- Selected day's slots listed vertically as Class Row components
- If no slots: empty state row `"No classes on [day]"`
- CR only: `"Edit"` text button top-right of header — navigates to Routine Edit screen

**Routine Edit Screen (CR only):**
- Full-screen modal sheet
- Lists existing slots as editable rows
- `"+ Add slot"` row at bottom — opens Add Slot bottom sheet
- Each slot row has a trailing trash icon (destructive, icon only)
- Save button in top-right of modal nav bar

**Add Slot Bottom Sheet:**
- Fields: Course Name, Course Code, Teacher Name, Room (optional)
- Time pickers: Start Time, End Time — native time picker wheels
- `"Add"` button — disabled if required fields empty or time conflict
- Conflict error: inline red text below End Time field

---

### 7.7 Events Tab

**Purpose:** Chronological list of all workspace events.

**Header:**
- Title: `"Events"` — 28pt Semibold
- CR only: `"+"` icon button — top right, 22pt, `color.text.primary` — opens Add Event sheet

**Filter Row:**
- Horizontal scroll chip row: `All`, `Tests`, `Extra Class`, `Assignments`, `Notices`
- Active chip: `color.accent.muted` background, `color.accent` text
- Inactive chip: `color.bg.sunken` background, `color.text.secondary` text

**List:**
- Events grouped by date, date as section header
- Section header format: `"Today"`, `"Tomorrow"`, or `"Mon, 9 Jun"` — 13pt uppercase, `color.text.tertiary`
- Each event renders as an Event Card

**Empty State (filtered):**
- `"No [type] events"` centered, `color.text.secondary`

---

### 7.8 Event Detail Screen

Pushes onto navigation stack (not a sheet) when an event card is tapped.

**Header (nav bar):**
- Back chevron — left
- Event type chip — center (e.g. `"Test"`)
- CR only: `"Edit"` text button — right

**Content (scrollable):**
- Event title — 24pt Semibold, `color.text.primary`
- Date + time — 15pt Regular, `color.text.secondary` — e.g. `"Monday, 9 Jun · 10:00 – 11:30"`
- Course + teacher — 13pt, `color.text.tertiary`
- Divider line
- Description — 15pt Regular, `color.text.primary` (if present), else hidden
- Divider line (if attachments present)
- **Attachments section** — label `"ATTACHMENTS"`, then file rows (see Attachment Row component)

**Bottom area (CR only):**
- `"Delete Event"` — text-only, `color.destructive`, 15pt, centered — with confirmation alert before action

---

### 7.9 Add / Edit Event Sheet

Bottom sheet, full height.

**Nav bar:**
- `"Cancel"` — left, `color.text.secondary`
- `"Add Event"` or `"Save"` — right, `color.accent`, disabled until required fields valid

**Fields (top to bottom):**
1. Event type selector — segmented: `Test`, `Extra Class`, `Assignment`, `Notice`
2. Title input — required
3. Course selector — dropdown from workspace course list, or manual entry
4. Teacher input — optional
5. Date picker — inline compact calendar
6. Start Time / End Time — side-by-side time inputs, optional
7. Description — multiline text input, optional, max 2000 chars
8. Attachments row — `"Attach files"` button with file count badge

**Attachment picker:** System document/image picker. Allowed types shown as hint text.

---

### 7.10 Settings Tab

**Header:**
- Title: `"Settings"` — 28pt Semibold

**Sections (grouped list style):**

Section `"Workspace"`:
- Workspace name (display only)
- `"Invite Code"` row — shows code, tap to copy, CR-only visible
- `"Regenerate Code"` — CR only, destructive-adjacent, shows confirmation

Section `"Notifications"`:
- Toggle row: `"Push notifications"` — system toggle
- Toggle row: `"Event reminders"` — system toggle

Section `"Account"`:
- User avatar + name + email — non-tappable display row
- `"Sign out"` — `color.destructive` text, confirmation required

Section (CR only) `"Members"`:
- `"View members"` — navigates to member list screen
- Member list shows name, email, join date, role badge

---

## 8. Component Library

### 8.1 Class Row

Used in: Today tab, Routine tab.

```
┌─────────────────────────────────────────────┐
│  10:00   Course Name                        │
│  11:30   COURSE-101 · Mr. Rahman    Room 3B │
└─────────────────────────────────────────────┘
```

- Left column: start + end time in `Geist Mono`, 12pt, `color.text.secondary`, fixed width 44pt
- Vertical line: 2pt, `color.line`, between time column and content
- Right column: course name (Medium 500, 15pt, primary) above; code + teacher (12pt, tertiary) below
- Room: trailing, 12pt, `color.text.tertiary`
- No card border — sits as a flat list row with `16pt` left inset
- Separator: `1pt color.line` between rows, inset 20pt from left edge only

**Current class highlight:**
- Left time-line turns `color.accent`
- Course name turns `color.text.primary` with slightly higher contrast
- No background fill — only the line color changes

---

### 8.2 Event Card

Used in: Today tab (upcoming), Events tab list.

```
┌─────────────────────────────────────────────┐
│ ● Test                           Mon, 9 Jun │
│                                             │
│ Mid-Term Examination                        │
│ Data Structures · Mr. Karim                 │
│                                   10:00 AM  │
└─────────────────────────────────────────────┘
```

- Card background: `color.bg.surface`
- Border: `1pt color.line`
- Corner radius: `12pt`
- Padding: `16pt` all sides
- Top row: event type chip (left) + date (right, 13pt, `color.text.tertiary`)
- Middle: event title — 16pt Semibold, `color.text.primary`, 8pt top margin
- Bottom row: course + teacher — 13pt, `color.text.secondary` (left); time in `Geist Mono` 12pt (right)
- Event type chip: 4pt vertical, 8pt horizontal padding; `color.accent.muted` bg; `color.accent` text; 8pt radius; dot prefix (●) in `color.accent`

---

### 8.3 Buttons

**Primary Button:**
- Background: `color.text.primary` (inverted)
- Text: `color.bg.base`, 15pt Semibold
- Height: 50pt
- Corner radius: 12pt
- Full width by default
- Disabled: `color.line` background, `color.text.tertiary` text

**Secondary Button (Outlined):**
- Background: transparent
- Border: `1.5pt color.line`
- Text: `color.text.primary`, 15pt Regular
- Same height and radius as primary
- Tap state: `color.bg.sunken` background fill

**Text Button / Link:**
- No background, no border
- Text: `color.accent` or `color.text.secondary`
- No underline
- Tap state: 70% opacity

---

### 8.4 Text Input

- Height: 50pt
- Background: `color.bg.surface`
- Border: `1pt color.line` (default), `1.5pt color.accent` (focused), `1.5pt color.destructive` (error)
- Corner radius: 10pt
- Placeholder: `color.text.tertiary`
- Text: `color.text.primary`, 15pt Regular
- Label: above input, 13pt Regular, `color.text.secondary`
- Error message: below input, 12pt, `color.destructive`
- No floating labels — label is always above, static

---

### 8.5 Invite Code Input

6 individual character boxes in a row.

- Each box: 46pt × 56pt, `color.bg.surface` background, `1pt color.line` border, `10pt` radius
- Active box: `1.5pt color.accent` border
- Character inside: 24pt Semibold, `color.text.primary`, centered
- Cursor: standard system cursor inside active box
- Error state: all boxes get `1.5pt color.destructive` border + horizontal shake animation (3 cycles, 300ms total)

---

### 8.6 Attachment Row

Used in: Event Detail, Add Event sheet.

```
  📄  Syllabus_Final.pdf              2.4 MB  ↓
```

- File icon: SF Symbol / Material icon based on MIME type — 20pt, `color.text.secondary`
- File name: 14pt Regular, `color.text.primary`, truncated with ellipsis
- File size: 12pt, `color.text.tertiary`, trailing
- Download indicator: chevron-down icon, `color.accent`, 18pt — tap initiates download
- Separator between rows: `1pt color.line`

---

### 8.7 Day Selector (Routine Tab)

Horizontal pill row for Mon–Sun.

- Each pill: abbreviated day name (Mon, Tue…) — 13pt Medium
- Width: equal, fills screen width with `20pt` outer margins
- Selected: `color.text.primary` background, `color.bg.base` text
- Unselected: transparent background, `color.text.tertiary` text
- Corner radius: 8pt
- No border on individual pills — the entire row has a `color.bg.sunken` background, `8pt` radius, `4pt` padding

---

### 8.8 Section Header

```
CLASSES                                           ↑ label style
```

- Text: uppercase, 13pt Regular, `color.text.tertiary`, `0.4pt` letter spacing
- Top margin: `32pt` from previous section's last item
- Bottom margin: `8pt` before first item

---

### 8.9 Empty State

Minimal. No illustration.

- Single text line: 15pt Regular, `color.text.tertiary`, centered
- Optional second line: 13pt, `color.text.tertiary`
- No icons, no art
- Vertically centered in the scroll view's visible area

---

## 9. Motion & Transitions

### Principles
- Duration sweet spot: **200–350ms** — fast enough to feel native, slow enough to be seen
- Easing: `easeOut` for entrances, `easeIn` for exits, `spring(damping: 0.75)` for interactive elements
- Never animate color alone — always pair with position or opacity

### Defined Transitions

| Trigger | Animation |
|---|---|
| Tab switch | Cross-fade, 200ms ease |
| Push navigation | Slide left (standard native), 300ms |
| Bottom sheet appear | Slide up from bottom, spring damping 0.8 |
| Bottom sheet dismiss | Slide down, 250ms easeIn |
| Event card tap | Scale down 0.97 on press, release to 1.0, spring 0.6 |
| Invite code error | Horizontal shake — `translate X: ±8pt`, 3 cycles, 300ms |
| List row appear | Fade in + translate Y 8pt → 0, staggered 40ms per row |
| Button disabled → enabled | Opacity 0.4 → 1.0, 200ms |
| Notification badge appear | Scale 0 → 1.0 with spring |

### What never animates
- Text color changes
- Section header labels
- Static display rows in Settings

---

## 10. Platform-Specific Notes

### iOS (SwiftUI)

- Navigation: `NavigationStack` with `.navigationBarTitleDisplayMode(.large)` on tab roots
- Bottom sheets: `sheet()` modifier with `.presentationDetents([.large])` for full-height, `.medium` for contextual
- Tab bar: native `TabView`, custom icon set
- Time pickers: `DatePicker` with `.graphical` style (inline) for date, `.wheels` for time
- Haptics: `UIImpactFeedbackGenerator(.light)` on card tap; `.medium` on primary button tap; `.error` on invite code failure
- Safe area: respect top and bottom safe areas on all screens — never draw behind home indicator
- Dynamic type: support up to `accessibility3` — use scalable font sizes via `@ScaledMetric`

### Android (Jetpack Compose)

- Navigation: `NavHost` with slide transitions
- Bottom sheets: `ModalBottomSheet`
- Tab bar: `NavigationBar` from Material 3, custom icon tint per state
- Time pickers: `TimePicker` composable (Material 3)
- Haptics: `HapticFeedbackConstants.VIRTUAL_KEY` on tap; `LONG_PRESS` equivalent for destructive confirm
- Edge-to-edge: enable `WindowCompat.setDecorFitsSystemWindows(window, false)`, draw behind status bar, use `WindowInsets` for padding
- Font scaling: respect system font scale, use `sp` units throughout

---

## 11. Accessibility

- Minimum tap target: **44 × 44pt** (iOS) / **48 × 48dp** (Android)
- Color contrast: all text/background combos must pass **WCAG AA** (4.5:1 for body, 3:1 for large text)
- VoiceOver / TalkBack labels: every interactive element has a meaningful accessibility label — time displays read as `"10:00 AM to 11:30 AM"` not raw string
- Icons without labels: always have `accessibilityLabel`
- Destructive actions: always announced as `"destructive button"` in the accessibility trait
- Focus order: logical top-to-bottom, left-to-right — no focus traps outside modals
- Reduce motion: when system "Reduce Motion" is on, replace spring animations with instant crossfades

---

## 12. Loading & Error States

### Loading
- No spinner on initial app launch — use skeleton screens (placeholder shimmer on cards)
- Shimmer: `color.line` to `color.bg.sunken`, horizontal sweep animation, 1.2s loop
- Inline loading (e.g. joining workspace): replace button label with a small activity indicator, same button dimensions
- Never show a full-screen loader except on first-launch auth check (max 2 seconds, then show error)

### Error States
- Network error: inline banner below the header — `color.bg.sunken` background, `color.destructive` left border (3pt), message text + retry text button
- No modal error alerts for non-critical failures
- Critical failures only (auth broken, workspace deleted): full-screen error with single CTA

### Skeleton Shimmer Spec
- Card placeholder: same dimensions as Event Card, `color.line` rounded rect fills
- Row placeholder: 3 horizontal bars at title / subtitle / metadata heights
- Animate only when loading — remove shimmer layer once data arrives

---

## 13. MVP Screen Checklist

### Auth & Onboarding
- [ ] Welcome screen
- [ ] Sign in with Google
- [ ] Sign in with Email / Password
- [ ] Create workspace screen
- [ ] Join workspace (invite code) screen
- [ ] Invite code error state

### Main App
- [ ] Today tab — classes section
- [ ] Today tab — upcoming events section
- [ ] Today tab — empty state
- [ ] Routine tab — day selector
- [ ] Routine tab — class slot list
- [ ] Routine tab — empty day state
- [ ] Routine edit screen (CR)
- [ ] Add slot bottom sheet (CR)
- [ ] Events tab — full list with date grouping
- [ ] Events tab — filter chips
- [ ] Events tab — empty filtered state
- [ ] Event detail screen
- [ ] Add event sheet (CR)
- [ ] Edit event sheet (CR)
- [ ] Delete event confirmation (CR)
- [ ] Settings tab — all sections
- [ ] Member list screen (CR)

### Components
- [ ] Class row (default + current class highlight)
- [ ] Event card (all 4 event types)
- [ ] Primary button (default + disabled)
- [ ] Secondary button
- [ ] Text input (default + focused + error)
- [ ] Invite code input (default + error)
- [ ] Attachment row
- [ ] Day selector
- [ ] Event type chip
- [ ] Skeleton shimmer (card + row variants)
- [ ] Empty state
- [ ] Error banner

---

## 14. Assets & Deliverables Expected from Design

- App icon: 1024×1024pt, single color mark on `color.bg.base` background — wordmark or minimal Q mark
- Splash screen: `color.bg.base` background, centered wordmark only — no animation
- All icons: SF Symbols names (iOS) + Material Symbols names (Android) — no custom icon set needed for MVP
- Font files: `Instrument Sans` (400, 500, 600) + `Geist Mono` (400) — bundled in app, not system fonts
