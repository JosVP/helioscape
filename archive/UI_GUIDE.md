# Helioscape UI Guide

## Design intent
Helioscape's UI is calm, readable, and warm. The aesthetic is "space-age paperwork" —
functional forms that have been lived in for decades. Not sterile. Not flashy.
The pixel art visual style (via post-process shader) applies to the 3D game world only.
All UI panels and overlays are NOT pixelated — they sit above the SubViewport in a
separate CanvasLayer and render at full resolution.

## Spatial system
Base unit: 8px. All padding and margins are multiples of 8.
- Tight (within a component): 8px
- Normal (between components): 16px
- Loose (between sections): 24px
- Panel internal padding: 16px on all sides
- Panel gap from screen edge: 16px

Use theme constants for all spacing — never hardcode pixel values in scene files.
If a value isn't in the theme, add it there before using it.

## Typography
Two font roles only:
- MONO: monospaced font (used for all data — numbers, years, resource counts, tech names)
- BODY: readable sans-serif (used for narrator text, descriptions, tooltips)

Size scale:
- xs: 11px (fine print, completion years in history)
- sm: 13px (secondary labels, status tags)
- md: 14px (default body, most labels)    ← base size
- lg: 16px (section headers, planet names)
- xl: 20px (panel titles, phase names)
- 2xl: 28px (year display in HUD)

Never use Godot's default Label font. Theme defines both fonts as DynamicFont resources.
Narrator text in CultureEventCard always uses BODY md. Data always uses MONO sm.

## Colour vocabulary
Define all colours as named Color constants in the theme. Never hardcode hex in scripts.

Background palette (dark, warm-tinted):
  bg_base:     #0d0d0f    (main background — near-black with slight warm tint)
  bg_surface:  #161618    (panel surfaces — one step lighter)
  bg_elevated: #1e1e22    (cards, dropdowns — two steps lighter)
  bg_overlay:  #000000aa  (modal overlays — semi-transparent)

Text palette:
  text_primary:   #e8e0d4  (primary text — warm off-white, not pure white)
  text_secondary: #8a8070  (secondary, labels, hints)
  text_disabled:  #4a4440  (disabled states)

Accent palette (warm amber — primary action, progress, highlights):
  accent:          #c8861e  (primary accent — amber)
  accent_dim:      #8a5c14  (dimmed accent — inactive progress)
  accent_glow:     #e8a030  (brighter — hover states, active elements)

Status palette:
  status_good:    #5a9e5a  (green — compatible pairs, healthy states)
  status_warn:    #c8a020  (amber-yellow — warnings, instability)
  status_bad:     #9e3a2a  (red — incompatible pairs, collapse, locked)
  status_neutral: #4a6a8a  (blue-grey — neutral info, locked-but-coming)

Planet accent colours (used in planet panel headers, orbit rings):
  planet_earth:   #3a7ab8
  planet_mercury: #8a7a5a
  planet_mars:    #b84a2a
  planet_venus:   #c8a030

Tag colours:
  tag_naturalist: #4a8a4a  (green — leaf icon)
  tag_architect:  #4a6ab8  (blue — gear icon)
  tag_neutral:    #8a8070  (grey — dot icon)

## Components

### Panels
All panels: bg_surface background, 4px corner radius, no border by default.
Active/selected panel: 1px accent border.
Locked panel: bg_base background, text_disabled text.
Panel titles: MONO lg, text_primary.

### Buttons
Primary (commit, confirm): accent background, bg_base text, 4px radius.
  Hover: accent_glow background. Disabled: bg_elevated background, text_disabled text.
Secondary (cancel, back, minor actions): bg_elevated background, text_primary text, 1px accent_dim border.
Destructive (irreversible actions — polar detonation confirm, Europa authorise):
  status_bad background. ALWAYS requires a second confirm dialog.

### Progress bars
Background: bg_elevated. Fill: accent. Height: 8px (thin) or 16px (prominent).
Stability meter in EcosystemComposer: colour-transitions —
  fill colour = lerp(status_bad, status_warn, status_good) based on percent.

### Status tags (ConditionsPanel, organism cards)
Small pill shape: 4px radius, 4px horizontal padding, 2px vertical padding.
  status_good background + text, status_warn background + text, status_bad background + text.
Text: MONO xs, always uppercase.

### Cards (organism cards, tech nodes, culture event toasts)
bg_elevated background, 4px radius, 8px internal padding.
Hover: 1px accent_dim border. Selected: 1px accent border.
Locked: bg_surface background, text_disabled text, silhouette treatment (50% opacity image).

## Interaction patterns

### Selection
Click to select. Click again to deselect. Never require double-click.
Selected state: 1px accent border + bg_elevated background.
Keyboard: Tab cycles focus, Space/Enter confirms, Escape cancels/deselects.

### Confirmations
Any action that costs resources: show cost summary in button tooltip (hover).
Any permanent/irreversible action: show a modal confirm dialog with:
  - Action description in BODY md
  - "This cannot be undone." in status_bad sm
  - Two buttons: [Confirm — destructive style] [Cancel — secondary style]
  Examples: committing a bio phase, authorising Europa impact, polar detonation.

### Tooltips
Every element with a condition, cost, or game mechanic should have a tooltip.
Tooltip delay: 0.6 seconds. Tooltip style: bg_overlay background, 8px padding, BODY sm.
Tech nodes: show prerequisites (met = status_good, unmet = status_bad), cost, duration.
Organism cards: show full compatible_with and incompatible_with lists.
Booster slots: show availability condition if unmet.

### Loading states
Any operation that takes a frame (loading a panel): show bg_surface panel immediately,
populate content in the next frame. Never show an empty flash.

### Empty states
Categories with no available organisms (OrganismPalette): show the category header
in text_disabled, with a single line beneath in text_secondary explaining why
(e.g. "Unlock Moon Tier 1 research to access engineered organisms").
Empty research queue: "No active research. Select a track to begin." in text_secondary.

## Godot-specific conventions

### Anchors
Panels that dock to an edge (HUD elements, PlanetsPanel): use anchor presets.
  Do not set anchors manually in code — set them in the scene editor.
Fullscreen overlays (EcosystemComposer, CultureEventCard): FULL_RECT anchor preset.

### Z-ordering (CanvasLayer order in Main.tscn)
Layer 0: SolarSystemViewport (3D scene, pixelated)
Layer 1: HUD (always visible — year, kardashev, time controls, planets panel)
Layer 2: PlanetPanel, EcosystemComposer (opened on demand)
Layer 3: CultureEventCard, CultureEventQueue toasts (above everything)
Layer 4: DebugConsole (above everything, including modals)
Modals (confirm dialogs): shown within their parent layer + bg_overlay behind them.

### No magic numbers in scripts
All spacing values: use theme.get_constant() or a const referencing the theme.
All colours: use theme.get_color() or a const. Never Color("#c8861e") inline.
All fonts: use theme.get_font() or a const.

### Control node hierarchy
Prefer VBoxContainer / HBoxContainer over manual positioning.
Use MarginContainer for internal panel padding (set to 16px on all sides).
Use separation property on VBox/HBox for gaps between children (8 or 16).
ScrollContainer wraps any list that might overflow (OrganismPalette, ResearchUI tracks).

### get_node() rules (from architecture)
No get_node() paths longer than one level in UI scripts.
Cache all child node refs in _ready() using @onready.

## What Copilot must never do
- Hardcode any colour, font size, or spacing value in a script or scene property.
- Use Godot's default theme colours (the blue buttons, grey panels).
- Create a button with only icon and no accessible label (accessibility).
- Use Label nodes for narrator text (use RichTextLabel — supports wrapping and bbcode).
- Add padding by inserting empty Control nodes (use MarginContainer or theme margins).
- Place UI nodes inside the SolarSystem SubViewport.