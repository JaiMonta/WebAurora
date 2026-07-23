---
name: ResidAurora
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#41484b'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#71787c'
  outline-variant: '#c1c7cb'
  surface-tint: '#3b6474'
  primary: '#002632'
  on-primary: '#ffffff'
  primary-container: '#0f3d4c'
  on-primary-container: '#7fa8b9'
  inverse-primary: '#a3cddf'
  secondary: '#1b6b4f'
  on-secondary: '#ffffff'
  secondary-container: '#a6f2cf'
  on-secondary-container: '#247155'
  tertiary: '#2c006e'
  on-tertiary: '#ffffff'
  tertiary-container: '#4500a5'
  on-tertiary-container: '#af8fff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bfe9fc'
  primary-fixed-dim: '#a3cddf'
  on-primary-fixed: '#001f29'
  on-primary-fixed-variant: '#224c5b'
  secondary-fixed: '#a6f2cf'
  secondary-fixed-dim: '#8bd6b4'
  on-secondary-fixed: '#002115'
  on-secondary-fixed-variant: '#00513a'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  unit-1: 4px
  unit-2: 8px
  unit-3: 12px
  unit-4: 16px
  unit-6: 24px
  unit-8: 32px
  unit-12: 48px
  unit-16: 64px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style
The design system is built on the pillars of efficiency, transparency, and architectural stability. It targets property managers and residents who require a friction-free experience for complex administrative tasks. 

The visual style is **Corporate / Modern** with a lean towards **Minimalism**. It utilizes expansive whitespace to reduce cognitive load during data-heavy operations. The aesthetic reflects a "Digital Concierge"—approachable yet authoritative, ensuring users feel their residential data is secure and well-organized. High-quality typography and a restrained color application create a professional atmosphere that prioritizes clarity over decoration.

## Colors
The palette is rooted in a deep **Midnight Teal** (Primary) to evoke stability and trust. This is contrasted by an **Aurora Mint** (Secondary) used sparingly for high-priority actions and success states. A **Soft Violet** (Tertiary) provides a secondary accent for data visualization or resident-specific features.

Backgrounds are strictly kept to clean whites and subtle off-whites (#F8FAFC) to maintain a sense of space. Text hierarchy is managed through shades of **Dark Slate**, ensuring high legibility and a contemporary finish.

## Typography
This design system employs **Inter** across all levels to leverage its exceptional legibility and systematic, utilitarian feel. The hierarchy relies on substantial weight differences rather than excessive size scaling to keep the interface feeling grounded and professional. 

Headlines utilize tighter letter spacing and heavier weights to anchor page sections. Body text is optimized with generous line heights to ensure long-form management reports remain readable. Labels use a slightly increased letter spacing and semi-bold weights for quick scanning of data fields and table headers.

## Layout & Spacing
The layout follows a **12-column fluid grid** for desktop, transitioning to a **4-column grid** for mobile devices. A strict 4px baseline shift ensures vertical rhythm across all components.

- **Desktop (1024px+):** 24px gutters with 64px side margins.
- **Tablet (768px - 1023px):** 20px gutters with 32px side margins.
- **Mobile (<767px):** 16px gutters with 16px side margins.

Content is organized primarily in structured sections. Data tables and management forms should occupy the central columns, while navigation is relegated to a persistent left-hand sidebar on desktop to maximize vertical workspace.

## Elevation & Depth
The system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows to maintain a clean, architectural feel. 

Depth is communicated through surface color shifts:
- **Level 0 (Background):** #F8FAFC
- **Level 1 (Cards/Content):** #FFFFFF with a 1px border in #E2E8F0.
- **Level 2 (Modals/Popovers):** #FFFFFF with a very soft, diffused ambient shadow (0px 10px 25px rgba(15, 61, 76, 0.05)).

This approach ensures the UI feels "flat-plus"—modern and streamlined but with clear interactive affordances.

## Shapes
The design system adopts a **Soft** shape language. Residential management requires a balance between the precision of a tool and the warmth of a home service. 

- **Small elements (Checkboxes, Tags):** 4px (0.25rem)
- **Standard elements (Buttons, Inputs):** 6px (0.375rem)
- **Large elements (Cards, Modals):** 8px (0.5rem)

This subtle rounding removes the clinical edge of sharp corners while maintaining a professional, structured appearance.

## Components

### Buttons
Primary buttons use the Primary Midnight Teal with white text. Secondary buttons use a subtle ghost style with a 1px border. The Aurora Mint is reserved for "Success" or "Action Confirmed" states. All buttons have a height of 40px for standard and 48px for prominent actions.

### Cards
Cards are the primary container for information. They must feature a 1px border (#E2E8F0) and no shadow unless hovered. Padding inside cards should follow the `unit-6` (24px) spacing rule.

### Data Tables
Tables should be borderless with a subtle zebra striping (Background: #F1F5F9) on even rows. Headers must be in `label-md` style with a bottom border to anchor the data.

### Input Fields
Inputs use a white background with a #CBD5E1 border. On focus, the border shifts to Primary Midnight Teal with a 2px outer glow of 10% opacity. Labels are placed above the field in `label-sm` style.

### Chips & Badges
Used for status indicators (e.g., "Paid," "Pending," "Maintenance"). These use high-chroma backgrounds at 10% opacity with 100% opacity text of the same color to ensure readability without visual noise.

### Navigation Sidebar
A dark-themed sidebar using the Primary color palette provides a strong visual anchor. Icons should be "Outline" style with a 2px stroke width for clarity.