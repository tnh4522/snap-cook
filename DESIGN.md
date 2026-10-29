---
name: SnapCook AI
description: Camera-first ingredient-to-recipe AI cooking assistant and smart kitchen companion
colors:
  primary: "#2d6a4f"
  primary-dark: "#52b788"
  primary-subtle: "#eaf4ee"
  primary-subtle-dark: "#193325"
  bg-light: "#f8f9fa"
  bg-dark: "#121415"
  surface-light: "#ffffff"
  surface-dark: "#1a1d1f"
  surface-hover-light: "#e8ecea"
  surface-hover-dark: "#2d3336"
  border-light: "#e2e6e3"
  border-dark: "#2a3033"
  text-light: "#1c2420"
  text-dark: "#edf2ee"
  text-secondary-light: "#546359"
  text-secondary-dark: "#9ca9a1"
  text-muted-light: "#84948a"
  text-muted-dark: "#68746d"
  accent-amber: "#b45309"
  accent-amber-dark: "#f59e0b"
  accent-sky: "#2563eb"
  accent-sky-dark: "#60a5fa"
  accent-purple: "#7c3aed"
  accent-purple-dark: "#c084fc"
  danger: "#be123c"
  danger-dark: "#f43f5e"
typography:
  display:
    fontFamily: "Spline Sans, Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Spline Sans, Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.35
  title:
    fontFamily: "Spline Sans, Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Spline Sans, Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Spline Sans, Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
  button-primary-dark:
    backgroundColor: "{colors.primary-dark}"
    textColor: "#0d2319"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
  card-primary:
    backgroundColor: "{colors.surface-light}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  chip-meta:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
---

# Design System: SnapCook AI

## Overview

**Creative North Star: "The Kitchen Atelier"**

SnapCook AI is designed for real kitchen counters, cutting boards, and refrigerators. The atmosphere bridges professional culinary precision with organic warmth: deep mineral slate (`#121415`) and crisp porcelain light (`#f8f9fa`) canvases, grounded by fresh herb emerald accents (`#2d6a4f` / `#52b788`) and warm pantry amber highlights. It rejects both clinical medical sterile aesthetics and toy-like cartoon gamification.

The interface prioritizes glanceability, high contrast, and tactile ease. Cooking is a hands-busy activity: screens are structured with generous touch targets (≥44pt/48dp), high contrast typography readable from arm's length, clear progress indicators, and bottom thumb-zone controls.

**Key Characteristics:**
- **Culinary Grounding**: Colors, icons, and metaphors reflect fresh produce, natural fire, and pantry staples.
- **Countertop Ergonomics**: High-contrast, large touch targets, glanceable hierarchy designed for one-handed operation.
- **Tonal Layering & Restraint**: Flush 24px cards bounded by crisp 1px borders rather than noisy floating drop shadows.
- **Local-First Fluidity**: Instant feedback states, subtle transitions, and persistent cooking memory.

## Colors

The palette draws directly from the kitchen: fresh botanical herbs, warm oven embers, clean water, and cool slate countertops.

### Primary
- **Culinary Emerald** (`#2d6a4f` light / `#52b788` dark): The hero brand color. Used for primary CTAs, active step highlights, camera shutter buttons, and completed task indicators. Represents freshness, vitality, and successful culinary actions.
- **Subtle Emerald Tint** (`#eaf4ee` light / `#193325` dark): Used for secondary container backgrounds, active cooking card rings, and filter pills.

### Secondary
- **Pantry Amber** (`#b45309` light / `#f59e0b` dark): Used for caloric metrics, torch/flashlight indicators, and cooking warnings. Evokes golden baked crusts and simmering warmth.

### Tertiary
- **Chef Sky Blue** (`#2563eb` light / `#60a5fa` dark): Used for cooking time chips, hydration tracking, and weekly reports.
- **Plum Purple** (`#7c3aed` light / `#c084fc` dark): Used for serving count badges and portion scaling indicators.

### Neutral
- **Deep Mineral Slate** (`#121415` dark background): Primary canvas in dark appearance. Provides deep contrast against food photography.
- **Slate Surface** (`#1a1d1f` dark surface): Primary card and modal background in dark appearance.
- **Porcelain Light** (`#f8f9fa` light background): Primary canvas in light appearance. Clean, glare-resistant, and bright.
- **Pure White** (`#ffffff` light surface): Primary card and sheet container in light appearance.
- **Border Subtle** (`#e2e6e3` light / `#2a3033` dark): 1px structural boundary on all interactive cards.
- **Text Primary** (`#1c2420` light / `#edf2ee` dark): High-contrast reading text achieving ≥16:1 contrast ratio.
- **Text Secondary** (`#546359` light / `#9ca9a1` dark): Contextual metadata and step descriptions achieving ≥4.5:1 contrast ratio.

### Named Rules
**The Natural Produce Rule.** Accent colors must map to real culinary states (herb green, baked amber, water blue, berry purple). Never introduce arbitrary neon or synthetic hues outside this botanical spectrum.

**The 10% Herb Rule.** High-saturation emerald is used on ≤10% of any screen viewport. Its rarity gives hero buttons and active steps immediate visual authority.

## Typography

**Display Font:** Spline Sans (fallback: Inter, -apple-system, sans-serif)  
**Body Font:** Inter (fallback: system-ui, sans-serif)  
**Label/Mono Font:** ui-monospace, SFMono-Regular, Menlo  

**Character:** Clean modern grotesk with open apertures, robust vertical metrics, and geometric clarity for effortless legibility across uneven lighting.

### Hierarchy
- **Display** (Bold 800, 24–28px, line-height 1.2, tracking -0.025em): Used for primary screen branding, scan titles, and hero congratulations.
- **Headline** (Bold 700, 18–20px, line-height 1.35): Used for recipe names, section headings, and calorie budget numbers.
- **Title** (Bold 700, 15–16px, line-height 1.4): Used for ingredient titles, modal headers, and component labels.
- **Body** (Medium 500, 13–14px, line-height 1.5): Used for step-by-step cooking instructions, ingredient items, and conversational coach responses.
- **Label** (SemiBold 600, 11–12px, line-height 1.25, uppercase tracking 0.05em): Used for step counters ("STEP 1"), dietary chip tags, and difficulty badges.

### Named Rules
**The Arm's Length Rule.** Active instruction steps and ingredient quantities must never fall below 13px (font size) and 500 (font weight). If a cook cannot read it from 60cm away while holding a spoon, the typography has failed.

## Layout

- **Grid & Rhythm**: 8pt base spatial system (4px, 8px, 12px, 16px, 24px, 32px).
- **Gutter**: 20–24px horizontal screen margins on mobile devices.
- **Thumb-Zone Discipline**: Primary camera shutters, photo pickers, recipe navigation, and bottom tabs sit exclusively within the bottom 35% of the screen.
- **Tablet / Large Screen Centering**: Content containers clamp to `max-w-sm` (modals) and `max-w-md` (cards) with centered alignment on iPads and Android tablets.
- **Safe Area Insets**: Status bar and bottom navigation insets are dynamically handled with zero content occlusion.

## Elevation & Depth

SnapCook AI uses a **Tactile & Grounded** elevation model. Surfaces mimic solid stone countertops and wooden prep surfaces: flat at rest, distinguished by subtle 1px borders and gentle tonal contrast rather than exaggerated drop shadows.

### Shadow Vocabulary
- **Resting Surface** (`cardShadow: rgba(28, 36, 32, 0.04)` light / `rgba(0, 0, 0, 0.3)` dark): Minimal ambient depth anchoring cards to the background canvas.
- **Elevated Interactive** (`box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12)`): Active step cards, scanner overlays, and floating action bars.

### Named Rules
**The Countertop Rule.** Components sit flush like kitchen tools on a prep table. Cards do not float detached in deep space; depth is communicated through tonal surface layers and crisp 1px borders.

## Shapes

- **Hero Cards & Modals**: 24px corner radius (`rounded-3xl`). Soft, organic, and welcoming.
- **Action Buttons & List Rows**: 16px corner radius (`rounded-2xl`). Tactile, comfortable thumb landing pads.
- **Badges, Chips & Meta**: 12px (`rounded-xl`) or full pill (`rounded-full`).
- **Checkboxes & Form Selectors**: 6–8px corner radius (`rounded-md` / `rounded-lg`).

### Named Rules
**The Organic Rim Rule.** Never use sharp 90-degree corners on interactive touch surfaces. Every button, card, and chip carries rounded radii reflecting smooth ceramic dishware and culinary implements.

## Components

### Buttons
- **Shape**: 16px corner radius (`rounded-2xl`). Minimum 44×44pt touch area.
- **Primary CTA**: Emerald fill (`#2d6a4f` light / `#52b788` dark), white/dark contrast text, bold font, subtle active press feedback (`active:opacity-85` / `active:scale-95`).
- **Secondary / Action Icon**: 1px border (`border-stone-200/90` light / `border-stone-800` dark), surface background, centered 18px Lucide icon.

### Chips & Meta Badges
- **Recipe Meta Chips**: Rounded full pill with tinted pastel background (`bg-amber-50`, `bg-sky-50`, `bg-purple-50`, `bg-emerald-50`), matching border, leading 13px icon, and semibold metric text.
- **Dietary Filter Pills**: Rounded-xl pills toggling between subtle border at rest and solid emerald fill when selected.

### Cards / Containers
- **Corner Style**: 24px (`rounded-3xl`).
- **Background**: Pure white (`#ffffff`) in light appearance, dark slate (`#1a1d1f`) in dark appearance.
- **Borders**: 1px solid (`border-stone-200/90` light / `border-stone-800/80` dark).
- **Internal Padding**: 16–24px.

### Cooking Step Cards
- **Completed Step**: Muted emerald tint (`bg-emerald-50/50` / `bg-emerald-950/20`), green checkmark badge, readable line-through text.
- **Current Active Step**: Bold elevated card with subtle emerald ring (`ring-2 ring-emerald-500/20`), solid emerald step counter, and "Cooking" / "Đang nấu" badge.
- **Upcoming Step**: Crisp white/slate surface, neutral number circle, clear instructions.

### Navigation
- **Bottom Tab Bar**: 5 primary destinations (Snap, Health, History, Favorites, Settings), fixed height 52px + bottom safe-area pad, 20–22px icons with 2.1 stroke weight, active emerald tint.

## Do's and Don'ts

### Do:
- **Do** maintain a minimum of 44×44pt (iOS) / 48×48dp (Android) touch targets with `hitSlop` on all interactive buttons.
- **Do** ensure all text achieves ≥4.5:1 contrast against its background in both light (`#f8f9fa`) and dark (`#121415`) modes.
- **Do** highlight the current active step in cooking workflows so users glance and immediately know what to do next.
- **Do** virtualize list feeds (`FlatList`) with key extractors for history and bookmarks to maintain 60fps scrolling.
- **Do** provide instant cancellation and dismiss feedback on all camera scans and dialogs.

### Don't:
- **Don't** use pure black (`#000000`) for surfaces; use mineral slate (`#121415` / `#1a1d1f`) to preserve color depth and contrast.
- **Don't** render unstyled or hardcoded English/Vietnamese strings; all user-facing labels must pass through `useI18n()`.
- **Don't** use floating zero-blur block drop shadows; depth is conveyed through tonal layering and 1px borders.
- **Don't** lock primary camera or cooking controls to the top of tall phone screens; keep controls within thumb reach.
- **Don't** wash out completed step text to unreadable gray; users must still be able to reference previous temperatures or times.
