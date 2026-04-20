# Design System: Play a Vinyl

## 1. Visual Theme & Atmosphere

Play a Vinyl is a cinematic, warm-dark experience that merges Apple's controlled drama with the intimate atmosphere of a late-night record shop. The interface is built around a single hero moment — the 3D turntable — with everything else retreating into the darkness to let album art and the vinyl experience take center stage.

The design borrows Apple's reductive philosophy but replaces its clinical precision with analog warmth. Where Apple uses pure black and cold neutrals, Play a Vinyl wraps its darkness in warm undertones — deep charcoals with brown and amber inflections that evoke wood-paneled listening rooms, dimly lit vinyl stores, and the glow of a tube amplifier in a dark room.

The signature interaction is Cover Flow — the iconic Apple carousel of tilted album covers, reimagined in 3D. Albums fan out in perspective, the centered record facing forward while neighbors angle away, inviting the user to flip through a collection as if thumbing through a physical crate of records. This is not a grid. This is browsing.

Typography is bold and white, cutting through the darkness with confidence. Headlines are tight, heavy, and unapologetic — billboard-style statements that feel carved rather than typeset. Body text softens into warm off-whites that are comfortable to read against dark surfaces without the harshness of pure white on pure black.

**Key Characteristics:**

- Dark-first with warm undertones — never clinical, never cold
- Cover Flow as the primary navigation pattern for browsing albums/vinyls
- Album art as the only source of color — the UI provides the dark frame, the music provides the vibrancy
- Single warm accent color: Amber (`#D4851F`) for interactive elements, evoking the glow of a vacuum tube
- 3D turntable as the immersive centerpiece — the UI orbits around it
- Bold white headlines with tight tracking, lighter warm grays for secondary text
- Generous negative space — let the darkness breathe, like silence between tracks
- Subtle depth through warm glows and soft shadows, never hard edges

## 2. Color Palette & Roles

### Primary Surfaces

- **Vinyl Black** (`#0A0A0A`): Primary background. Not pure black — a hair warmer, preventing the screen from feeling like a void.
- **Deep Charcoal** (`#141414`): Secondary background, card surfaces, elevated areas. The subtle lift from Vinyl Black creates depth without borders.
- **Warm Dark** (`#1A1816`): Tertiary surface with visible brown warmth. Used for panels, sidebars, and areas that should feel like dark wood.
- **Smoke** (`#1E1E1E`): Neutral dark surface for inputs, search bars. Slightly cooler than Warm Dark for functional elements.

### Interactive & Accent

- **Amber** (`#D4851F`): Primary accent. CTA buttons, active states, progress indicators, "now playing" highlights. Evokes vacuum tube glow, warm stage lighting.
- **Amber Light** (`#E8A84C`): Hover state for Amber elements. Slightly brighter and more golden.
- **Amber Dim** (`#B36D14`): Active/pressed state. Deeper, richer.
- **Amber Glow** (`rgba(212, 133, 31, 0.15)`): Subtle background glow behind active elements, now-playing indicators. The "warmth" that bleeds from interactive elements.
- **Deezer Link** (`#A238FF`): Used exclusively for "Listen on Deezer" attribution links. Matches Deezer's brand purple.

### Text

- **Pure White** (`#FFFFFF`): Hero headlines only. Reserved for maximum impact moments — the turntable view, the currently playing track name.
- **Cream** (`#F5F0EB`): Primary readable text. Warmer than white, easier on the eyes against dark backgrounds. The default body text color.
- **Warm Gray** (`#A89F95`): Secondary text — artist names, metadata, descriptions. Clearly readable but recedes behind primary content.
- **Muted** (`#6B635B`): Tertiary text, timestamps, fine print. Present but quiet.
- **Faint** (`#3D3832`): Disabled states, placeholder text. Barely visible, like text embossed into dark leather.

### Album Art Integration

- **No fixed color for album art** — the UI must gracefully frame any album cover, from bright pop art to dark metal covers.
- **Art Glow** (`dynamic`): An optional subtle glow extracted from the dominant color of the current album art, applied as a `box-shadow` or radial gradient behind the vinyl/turntable. This makes each record feel like it's casting its own light.

### Shadows & Depth

- **Vinyl Shadow** (`rgba(0, 0, 0, 0.5) 0px 8px 32px 0px`): Deep, soft shadow beneath the turntable and Cover Flow elements. Simulates a physical object resting on a surface.
- **Card Shadow** (`rgba(0, 0, 0, 0.3) 0px 4px 20px 0px`): Lighter elevation for cards, panels.
- **Inner Warmth** (`inset 0 1px 0 rgba(255, 255, 255, 0.05)`): Extremely subtle top-edge highlight on dark surfaces, simulating light catching the edge of a shelf or surface.
- **Amber Glow Shadow** (`0 0 20px rgba(212, 133, 31, 0.2)`): Soft warm glow around active/playing elements.

## 3. Typography Rules

### Font Family

- **Display**: `Inter`, with fallbacks: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`
- **Body**: `Inter`, same fallbacks.
- Inter is chosen for its optical sizing, tight spacing at large sizes, excellent legibility at small sizes, and free availability (unlike SF Pro which is Apple-proprietary). Its slightly humanist construction adds warmth that geometric fonts like Helvetica lack.

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Color | Notes |
|------|------|--------|-------------|----------------|-------|-------|
| Hero Title | 56px (3.50rem) | 700 | 1.05 | -0.02em | `#FFFFFF` | Currently playing track. Maximum drama. |
| Section Heading | 36px (2.25rem) | 700 | 1.10 | -0.015em | `#FFFFFF` | "Trending", "Your Collection", "Discover" |
| Album Title | 24px (1.50rem) | 600 | 1.20 | -0.01em | `#F5F0EB` | Album name in detail view, Cover Flow center |
| Card Title | 18px (1.13rem) | 600 | 1.25 | -0.005em | `#F5F0EB` | Track name on cards |
| Artist Name | 16px (1.00rem) | 400 | 1.40 | 0 | `#A89F95` | Always lighter than track/album name |
| Body | 15px (0.94rem) | 400 | 1.55 | 0 | `#F5F0EB` | Descriptions, about text |
| Button | 15px (0.94rem) | 600 | 1.00 | 0.01em | varies | Slightly tracked out for button clarity |
| Caption | 13px (0.81rem) | 400 | 1.40 | 0.005em | `#A89F95` | Duration, release year, genre tags |
| Micro | 11px (0.69rem) | 500 | 1.35 | 0.02em | `#6B635B` | "Listen on Deezer" attribution, legal |

### Principles

- **Headlines hit hard**: Weight 700, extremely tight line-height (1.05-1.10), negative letter-spacing. They should feel like the text on a concert poster — bold, compressed, immediate.
- **Body text breathes**: Weight 400, generous line-height (1.55), neutral spacing. Comfortable long-form reading against dark backgrounds.
- **Warm color cascade**: Headlines in pure white, primary text in cream, secondary in warm gray. This creates a natural visual hierarchy through temperature, not just size.
- **No light weights on dark backgrounds**: Minimum weight 400 for body, 600 for headings. Thin fonts on dark backgrounds create halation (optical blurring) and are hard to read.

## 4. Component Stylings

### Buttons

**Primary (Amber CTA)**
- Background: `#D4851F`
- Text: `#FFFFFF`, 15px, weight 600
- Padding: 12px 24px
- Radius: 8px
- Hover: `#E8A84C`, subtle `0 0 12px rgba(212, 133, 31, 0.3)` glow
- Active: `#B36D14`
- Use: "Play", "Add to Collection", primary actions

**Secondary (Ghost)**
- Background: transparent
- Text: `#F5F0EB`, 15px, weight 600
- Border: 1px solid `rgba(245, 240, 235, 0.25)`
- Padding: 12px 24px
- Radius: 8px
- Hover: `rgba(245, 240, 235, 0.08)` background fill, border brightens to `rgba(245, 240, 235, 0.4)`
- Use: "Share", "Listen on Deezer", secondary actions

**Pill Link**
- Background: transparent
- Text: `#D4851F`
- Radius: 980px (full pill)
- Border: 1px solid `rgba(212, 133, 31, 0.4)`
- Padding: 8px 20px
- Hover: `rgba(212, 133, 31, 0.1)` background fill
- Use: Genre tags, filter options, "See All" links

**Icon Button (Controls)**
- Background: `rgba(255, 255, 255, 0.08)`
- Icon color: `#F5F0EB`
- Radius: 50% (circular)
- Size: 44px × 44px minimum
- Hover: `rgba(255, 255, 255, 0.15)`
- Active: `rgba(212, 133, 31, 0.2)` with amber icon
- Use: Play/pause, skip, volume, Cover Flow navigation arrows

### Cards & Containers

**Album Card**
- Background: `#141414`
- Radius: 8px
- Shadow: `rgba(0, 0, 0, 0.3) 0px 4px 20px 0px`
- Inner highlight: `inset 0 1px 0 rgba(255, 255, 255, 0.05)`
- Padding: 0 (image flush to edges), 16px bottom for text
- Hover: slight Y-axis lift (`translateY(-4px)`), shadow intensifies
- Album art: flush to top of card, square aspect ratio, radius matches card top corners

**Search Input**
- Background: `#1E1E1E`
- Text: `#F5F0EB`
- Placeholder: `#6B635B`
- Border: 1px solid `rgba(255, 255, 255, 0.08)`
- Radius: 12px
- Padding: 12px 16px 12px 44px (room for search icon)
- Focus: border becomes `rgba(212, 133, 31, 0.5)`, subtle amber glow
- Icon: magnifying glass in `#6B635B`, transitions to `#A89F95` on focus

### Cover Flow

**Center Album (Active)**
- Scale: 1.0 (full size)
- Rotation: 0deg (facing forward)
- Z-index: highest
- Shadow: full Vinyl Shadow + optional Art Glow
- Opacity: 1.0
- Album title and artist visible below

**Adjacent Albums (±1)**
- Scale: 0.85
- Rotation: ±35deg on Y-axis (angled away)
- Z-index: lower
- Shadow: reduced
- Opacity: 0.85

**Distant Albums (±2+)**
- Scale: 0.7
- Rotation: ±45deg on Y-axis
- Z-index: lowest
- Shadow: minimal
- Opacity: 0.5, fading further with distance
- Stack/overlap slightly to create the characteristic Cover Flow depth

**Interaction**: Horizontal swipe/scroll/drag to browse. Momentum-based physics — flick to spin through quickly, gentle drag to browse slowly. Click center album to select/play.

### Turntable (3D Scene)

- **Vinyl record**: Circular, dark with concentric groove texture. Album art as the center label.
- **Tonearm**: Metallic finish, moves from rest position to record edge on play. Movement is slow and deliberate — it has weight.
- **Platter**: Slightly reflective dark surface. Rotates at 33⅓ RPM when playing.
- **Surface**: Dark wood or matte black base, grounding the turntable as a physical object.
- **Lighting**: Warm key light from upper-left, subtle ambient. The vinyl should have a slight sheen. The scene should feel like a turntable on a shelf in a dimly lit room.
- **Background**: Deep gradient from `#0A0A0A` to `#141414`, or a subtle radial gradient using the album's dominant color at very low opacity.

### Now Playing Bar

- Background: `#141414` with `backdrop-filter: blur(20px)` and `rgba(10, 10, 10, 0.85)` overlay
- Position: fixed bottom
- Height: 72px
- Content: album art thumbnail (48px square, radius 4px) | track info | playback controls | progress bar
- Progress bar: thin (3px), `#6B635B` track, `#D4851F` fill, 6px circular thumb on hover
- Border-top: `1px solid rgba(255, 255, 255, 0.06)`

## 5. Layout Principles

### Spacing System

- Base unit: 8px
- Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px
- Album card gap: 16px in grids, 0px in Cover Flow (overlap is intentional)
- Section padding: 64px vertical between major sections
- Container max-width: 1200px centered, with 24px horizontal padding

### Grid

- **Cover Flow**: single horizontal band, full-width, no grid — the flow IS the layout
- **Album Grid** (fallback/collection view): responsive columns
  - Desktop: 5-6 columns
  - Tablet: 3-4 columns
  - Mobile: 2 columns
- **Detail View**: asymmetric — large album art / vinyl left (60%), metadata + track list right (40%)
- **No visible grid lines or gutters** — spacing creates structure, darkness creates separation

### Whitespace Philosophy

- **Darkness IS whitespace**: On a dark interface, empty black space serves the same role as white space on light interfaces. It provides breathing room, creates focus, and implies luxury.
- **Content islands**: UI elements should feel like illuminated objects floating in darkness — not cramped into containers, but placed with intention.
- **Vertical rhythm through content, not color blocks**: Unlike Apple's alternating black/gray sections, Play a Vinyl stays dark throughout. Rhythm comes from content density variation — the Cover Flow is dense and rich, followed by generous empty space, followed by a grid, etc.

### Border Radius Scale

- Micro (4px): Album art thumbnails, small elements
- Standard (8px): Buttons, album cards, panels
- Comfortable (12px): Search input, larger interactive areas
- Full Pill (980px): Genre tags, filter pills, pill links
- Circle (50%): Icon buttons, playback controls, user avatars

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Base (Level 0) | `#0A0A0A` flat | Page background, empty space |
| Surface (Level 1) | `#141414` + inner highlight | Cards, panels, now playing bar |
| Elevated (Level 2) | `#1A1816` + Card Shadow | Modals, dropdown menus, expanded search |
| Floating (Level 3) | Vinyl Shadow + optional Art Glow | Turntable, Cover Flow center album, hero elements |
| Navigation | `backdrop-filter: blur(20px)` on `rgba(10, 10, 10, 0.85)` | Top nav, Now Playing bar |

**Depth Philosophy**: Depth on dark interfaces is created by lightening surfaces, not by darkening shadows. Each elevation level gets a slightly lighter background. Shadows exist but serve to ground objects (the turntable sits ON something) rather than lift them. The warmest surfaces (`#1A1816`) appear closest to the viewer, reinforcing that warmth = proximity.

### Light & Glow

- **Art Glow**: The signature depth effect. A soft, diffused glow extracted from the album art's dominant color, applied behind the vinyl/turntable or the Cover Flow center album. Radius: 60-100px blur. Opacity: 0.15-0.25. This makes the currently active music feel alive and luminous.
- **Amber Indicators**: Active/playing states emit a subtle amber glow (`0 0 12px rgba(212, 133, 31, 0.3)`) that acts as a warm beacon in the dark interface.
- **Edge Highlights**: The `inset 0 1px 0 rgba(255, 255, 255, 0.05)` on surfaces simulates light catching the top edge of physical objects — shelves, turntable surfaces, card edges.

## 7. Do's and Don'ts

### Do

- Use the Cover Flow pattern as the primary browsing experience — it IS the product identity
- Let album art be the only source of vivid color — the UI is the dark frame
- Apply the Art Glow effect to the active/playing album — it brings life to the dark interface
- Use Amber (`#D4851F`) exclusively for interactive elements — it's the singular warm accent
- Keep headlines bold (700) and tight (1.05-1.10 line-height) — concert poster energy
- Use Cream (`#F5F0EB`) for body text, not pure white — reduce eye strain on dark backgrounds
- Add the inner highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.05)`) to elevated surfaces
- Make turntable animations physics-based — the vinyl has mass, the tonearm has weight
- Respect the "Listen on Deezer" attribution with proper Deezer purple (`#A238FF`) link

### Don't

- Don't introduce light/white backgrounds anywhere — the entire app lives in darkness
- Don't use colors beyond Amber for interactive elements — album art is the color palette
- Don't make the Cover Flow static — momentum, physics, and smooth transitions are essential
- Don't add borders to separate dark elements — use subtle background differences and shadows
- Don't use thin font weights (300) on dark backgrounds — they create optical blur (halation)
- Don't make album art corners too rounded — 4-8px maximum. Album covers are traditionally square.
- Don't compete with the turntable — when the 3D scene is active, surrounding UI should dim/recede
- Don't use pure black (`#000000`) and pure white (`#FFFFFF`) together for text — too harsh. Use `#0A0A0A` and `#F5F0EB`.
- Don't autoplay audio — always wait for intentional user interaction (vinyl placement on turntable)

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | Cover Flow becomes horizontal scroll of flat cards. Turntable view simplified. Single column. |
| Tablet | 640-1024px | Cover Flow with reduced perspective depth. 2-3 column grids. Side panel collapses. |
| Desktop | 1024-1440px | Full Cover Flow with 3D perspective. Full turntable scene. Comfortable layout. |
| Large Desktop | >1440px | Expanded Cover Flow showing more albums. Centered with generous dark margins. |

### Touch Targets

- All interactive elements: minimum 44×44px
- Cover Flow albums: generous hit areas, swipe gesture zones extend beyond visible art
- Playback controls: 48×48px minimum for play/pause
- Search: full-width on mobile, prominent and easy to reach

### Mobile Adaptations

- Cover Flow: degrades to a horizontal scrolling carousel with snap points. Albums are flat (no 3D rotation) but maintain the side-peeking layout.
- Turntable: simplified top-down view or 2D representation. The 3D scene is desktop's hero moment.
- Now Playing bar: persists at bottom, simplified to art + title + play/pause
- Navigation: bottom tab bar on mobile (Browse, Search, Collection, Now Playing)

## 9. Agent Prompt Guide

### Quick Color Reference

- Background: `#0A0A0A` (primary), `#141414` (surface), `#1A1816` (warm surface)
- Accent: `#D4851F` (amber), `#E8A84C` (hover), `#B36D14` (active)
- Text: `#FFFFFF` (hero), `#F5F0EB` (body), `#A89F95` (secondary), `#6B635B` (tertiary)
- Borders: `rgba(255, 255, 255, 0.08)` default, `rgba(212, 133, 31, 0.5)` focus

### Key Prompts

"Build a full-width Cover Flow carousel on a `#0A0A0A` background. Center album faces forward at full size. Adjacent albums rotate ±35deg on Y-axis at 0.85 scale. Albums beyond ±2 positions fade to 0.5 opacity. Use momentum-based horizontal scrolling. Display album title and artist below the center album in white 24px/600 and warm gray 16px/400 Inter."

"Create a Now Playing bar: fixed bottom, 72px height, `#141414` background with `backdrop-filter: blur(20px)`. Left: 48px square album art thumbnail. Center: track title in Cream 15px/600 above artist in Warm Gray 13px/400. Right: circular play/pause button 44px with `rgba(255, 255, 255, 0.08)` background. Thin 3px progress bar spanning full width at top of bar, `#6B635B` track with `#D4851F` fill."

"Design a search overlay: full-screen dark overlay (`rgba(10, 10, 10, 0.95)` with `backdrop-filter: blur(20px)`). Large search input centered top third: `#1E1E1E` background, 12px radius, 16px Inter text in `#F5F0EB`, magnifying glass icon in `#6B635B`. Results appear below as a grid of album cards — art flush top, title and artist below — on `#141414` backgrounds with 8px radius."

"Render a 3D turntable scene: dark ambient environment. Warm key light from upper-left. Turntable base in dark matte material. Vinyl record with concentric groove texture and album art as center label. Tonearm with metallic finish. When playing: record rotates at 33⅓ RPM, tonearm rests on record. Behind the turntable, a soft radial glow using the album's dominant color at 15% opacity."