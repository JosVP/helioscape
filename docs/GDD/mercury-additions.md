# MERCURY — ADDITIONS & UPDATES
v0.4 session additions. Supersedes conflicting values in main-gdd.md + economy-logistics.md where noted.

---

## MAP (supersedes main-gdd "small map, 3 mining locations, hexagon grid")

**Map size: 64×64 tiles.** Square grid, isometric diamond visual orientation.
With 2×2 building footprints, this provides ample space (equivalent to a small Red Alert 1 map).
The canvas is scrollable — the viewport shows a portion of the full map at a time.

8 mining locations spread across map (not 3).
Each mining location has:
- 2+ ore types, always (player is never locked out of an ore type)
- **Density skew** per location: one ore type is more abundant than the others (e.g. 70% common/30% rare). This means you mine all types at any location, but faster for the dominant type.
- 2-3 predetermined **refinery slots** adjacent to the mine (fixed positions). Refineries can ONLY be built on these specific slots. Other buildings cannot occupy refinery slots.

Factory slots: placeable near any operational refinery OR near mass driver.
1 mass driver slot: fixed position, far end of map from starting zones.
Solar array slots: fixed positions across map (free choice within solar-eligible terrain).
**Fusion reactor slot**: reserved inside the deep polar crater. ONLY the fusion reactor can be placed here. No other building can occupy this slot.
Other buildings: free placement on any non-reserved, unlocked slot of the correct terrain type.

Grid is square for implementation simplicity.

---

## STARTING ZONE SELECTION

First Mercury visit: player chooses 1 of 3 starting zones. Permanent.
Each zone described by nearby ore composition, e.g.:
- "Common + Rare Metals cluster"
- "All three ore types, spread out"
- "Volatiles-heavy, near mass driver site"

Chosen zone nodes unlock immediately. All other nodes start LOCKED.
Panel hidden permanently after selection.

---

## NODE STATES + ORGANIC EXPANSION

Every placeable slot has a state:
- LOCKED — not yet reachable
- AVAILABLE — adjacent operational building exists, can build
- BUILDING — construction timer running
- OPERATIONAL — active

Building a refinery at a mining location unlocks adjacent nodes.
Player decides which direction to expand based on current resource needs.
Expansion = primary reason to return to Mercury mid/late game.

---

## MINER SYSTEM (supersedes "static paths, miners have no pathfinding")

Max 4 miners per refinery slot. (Note: economic saturation still ~3 per
refinery per economy-logistics.md — 4th miner marginal gain, player
choice whether to fill.)

Miner states: IDLE (reserve) / WALKING_TO_MINE / WALKING_TO_REFINERY /
REASSIGNING.

Movement: static waypoint array per refinery slot (refinery pos → mine
pos → refinery pos). Lerp/tween between waypoints.

Reassignment mid-route: miner finishes current waypoint segment →
walks straight line to new refinery → begins new slot's waypoint loop.
Miner does not contribute to resource ticks while REASSIGNING.

Miner pool: player starts with small reserve. New miners built via
production queue (cost: common ore). Miners are assigned to a refinery,
not directly to a mine (refinery slot defines both).

Miner assignment UI:
- Click operational refinery → shows assigned miners + available slots
- Empty slot + reserve miners available → Assign button
- Click assigned miner → Reassign option → click destination refinery

---

## PLAYER-DRAWN INFRASTRUCTURE PATHS

Player draws paths between buildings using waypoints (90° corners or
straight lines only — no diagonal). Paths required for resources to
flow between buildings. Binary: connected = resources flow,
unconnected = no flow. **Path length does not affect throughput** —
the flow rate is determined by the buildings at each end, not the distance between them.

Note on geographic strategy: zone proximity matters via the **slot unlock cascade**, not
path performance. To reach a distant mining deposit, you must build a chain of
intermediate buildings to unlock adjacent slots. Each intermediate building costs
resources and time, creating a natural expansion cost. Far deposits are reachable —
but require more investment, making nearby starting deposits consistently valuable.

Path drawing UI:
- Click source building → click waypoints → click destination building
- UI draws straight line preview from last waypoint to mouse position
- If path segment passes through a placed building: segment highlights red
- Must reroute around obstacle before path can be confirmed

Power lines exempt: go underground. Visual only — power line sprite
emerges from ground immediately adjacent to each building. No player
routing required.

Resource transport between buildings is automatic once path exists.
No physical transport simulation — global counters tick, path is
confirmation that connection exists.

Benefit: solves routing problem on medium map with scattered buildings.
Scales naturally if map size increases in future.

---

## OVERDRIVE SYSTEM

Unlocked by Dyson swarm energy milestones. Per-building upgrade required
before that building can run in overdrive. Upgrade queued as Mercury
production item (cost: rare metals, takes game-time).

| Milestone | Overdrive tier | Throughput multiplier |
|---|---|---|
| 25% swarm | Tier 1 | 1.5× |
| 50% swarm | Tier 2 | 2.5× |

Unupgraded buildings cannot run in overdrive — they would break.
Upgrading entire base = deliberate multi-session project.
Prioritise which buildings get upgraded first based on current bottleneck.

Feedback loop: more panels → more energy → overdrive unlocks →
faster production → more panels. Mercury and swarm become interdependent.

---

## PANEL TIER FACTORY UPGRADE (supersedes implied auto-switch on research)

Panel tier unlock (Type 1 / Jupiter He-3) provides knowledge only —
factories do not automatically switch to new tier.

Player must queue single Mercury item: "Retrofit Production Lines."
Applies to ALL factories simultaneously. One queue item, not per-factory.
Cost: moderate rare metals. Duration: ~15-20 game-years.
Until complete: factories continue producing previous tier.

Decision: retrofit now (brief production slowdown, better panels forward)
OR delay retrofit and keep expanding at current tier.
Tradeoff echoes existing "replacement vs expansion" panel decision.

---

## DUAL PARALLEL MASS DRIVERS (supersedes single mass driver)

Second mass driver built as separate Mercury production project.
Significant rare metals cost. Queued by player when ready.

Effect: doubles standard launch throughput (parallel independent tracks).
NOT inline/staged — two separate side-by-side launchers.

Rockets retained for: oversized components that exceed mass driver
acceleration profile + urgent component delivery (emergency launches,
player-initiated, volatile cost).
Skyhook still handles heavy-lift Mercury surface → orbit.

Visual: twin launchers as prominent landmark on map, visible from
across base. CE fires when second driver comes online.

---

## PRODUCTION QUEUE (detail additions)

Default item "Dyson Panel" sits permanently at queue bottom.
Cannot be removed or reordered. Produces continuously when no manual
items queued above it.

Player or game systems insert component orders above default.
Player can reorder non-default items (up/down or drag).
Active item (top of queue) runs first. Resources deducted on start,
not on queue entry.

Queue always visible in Mercury sidebar. Each row: label / resource
cost icons / progress bar if active / reorder controls.
Default row visually distinct (locked, greyed).

Mass driver launches completed items automatically. No player action
required per launch. Second mass driver doubles launch cadence once built.

---

## BUILDING LIMITS (supersedes "max 5 of each building type")

No hard global cap per building type. Expansion limited by:
- Available slots on map (fixed positions per building type)
- Resource cost to build
- Path infrastructure connecting new building to existing network

Effective ceiling set by map slot count (~8 mining locations →
up to ~16-24 refinery slots total across map). Factory slots ~6-8.
Solar array slots ~4-6.

This replaces the "max 5 of each" rule from economy-logistics.md.
Economy rates and saturation values (3 miners per refinery, fabricator
diminishing returns table) remain valid.

---

## LATE MERCURY: MACHINE WORLD / GARDEN WORLD (unchanged, for reference)
Still valid per main-gdd. No changes from session.

---

## MERCURY VIEW LAYOUT (supersedes Block 9.2 prompt)

Mercury is a **full-screen RTS-style view**, not a side panel.

```
┌─────────────────────────────────────────────┐
│  HUD top bar (always visible above everything)│
├───────────────────────┬─────────────────────┤
│                       │  ← Back to orrery   │
│                       │  ┌───────────────┐  │
│   MERCURY CANVAS      │  │  Mini-map     │  │
│   (isometric grid)    │  ├───────────────┤  │
│                       │  │  Build list   │  │
│                       │  │  (scrollable) │  │
│                       │  └───────────────┘  │
├───────────────────────┴─────────────────────┤
│  Production queue bar (always visible bottom)│
├─────────────────────────────────────────────┤
│  Resources + power strip    (bottom-right)   │
└─────────────────────────────────────────────┘
```

Culture event cards overlay everything. Toasts fire from bottom-left as normal.
HUD top bar (year, K-bar, time controls) remains visible at all times.
Back-to-orrery button: top-left of the sidebar or above the canvas.

View switching: signal-based `activeView: Signal<'orrery' | 'mercury'>` in
`GameShellComponent`. The orrery canvas uses `display: none` (NOT *ngIf) when
Mercury is active — preserves the Three.js scene without re-initialisation.
No routing involved. Steam build has no browser back-button; signal is correct.

---

## STARTING ZONES (design detail — supersedes placeholder list above)

Three starting zones balanced against the resource economy. Choice is permanent.
A blocking modal overlay is shown on first Mercury visit; mercury map is visible
in the background but not interactive until a zone is selected.

### Zone 1 — Infrastructure Speed
**Starting near:** Mining locations with common ore density skew + adjacent refinery slots
**Ore mix:** ~70% common ore, ~30% rare metals on nearby deposits. Never locked out of
rare metals — it is just slower here.
**Strategic advantage:** Common ore is the bottleneck for base construction
(refinery 800C, fabricator 600C, mass driver 2000C). Higher density →
refineries and fabricators come online faster → faster base growth overall.
**Trade-off:** Reaching high-density rare metals or volatiles deposits requires more
intermediate expansion (slot unlock hops to get there).

### Zone 2 — Dyson Output
**Starting near:** Mining locations with rare metals density skew + solar array slots
**Ore mix:** ~65% rare metals, ~35% common ore on nearby deposits. Never locked out of
common ore — it is just slower here.
**Strategic advantage:** Rare metals are the bottleneck for panel throughput
(basic panels: 200R per 1000; mid-tier: 300R per 1000; fabricators: 200R each).
Solar array slots = more local power for overdrive when Dyson swarm hits 25%.
**Trade-off:** Common ore is scarcer early; base construction is slower.

### Zone 3 — Balanced (default safe pick)
**Starting near:** Mining locations with no strong density skew + closest to mass driver
**Ore mix:** ~40% common, ~35% rare metals, ~25% volatiles on nearby deposits.
**Strategic advantage:** All ore types accessible early at reasonable rates. Closest to
the mass driver means fewest intermediate buildings (slot-unlock hops) to reach it —
so once built, shipping starts faster. Volatiles access earlier (rocket propellant,
hardened panels later).
**Trade-off:** No specialisation advantage; requires broader expansion to outpace Zone 1
or Zone 2 in their respective strengths.

Zone descriptions shown on selection cards. No mechanical details exposed — just
flavour text about the terrain + a brief strategic note. Player sees the backdrop
of the actual starting tiles for each zone before choosing.

---

## BUILDING FOOTPRINTS

All buildings cover multiple tiles. 2×2 (two columns, two rows) for all buildings
for the playtest build. Footprint is stored as `footprint: [colOffset, rowOffset][]`
in `mercury-buildings.json`. The anchor tile is `[0,0]`; remaining tiles are offsets.

Example 2×2 footprint: `[[0,0],[1,0],[0,1],[1,1]]`

Placement validation: ALL footprint tiles must be of the allowed `slotType` AND
all must be unoccupied. Preview shows all footprint tiles in green (valid) or red
(invalid). Building sprite rendered anchored to the visual centre of all footprint tiles.

Post-playtest: irregular footprints can be introduced per building when sprites exist.

---

## MINER UNITS

Miners are represented as SVG sprites on the canvas (not dots).
Placeholder SVGs ship with the feature (correct size, obvious placeholder marker).
Walking animation (lerp between waypoints) is a post-playtest TODO — static sprites
for the playtest build.

Miner assignment UI:
- Click operational refinery → HTML overlay panel opens (not canvas-drawn)
- Panel shows: assigned miners (as miner SVG icons) / max slots (4) / reserve count
- Empty slot → `[+] Assign` button (disabled if reserve empty)
- Assigned miner icon → `[Reassign]` button
- Reassign: RTS-style. Click `[Reassign]` → map enters reassign mode (cursor changes,
  all other operational refineries highlight in amber) → click destination refinery →
  assignment transferred. Miner does not contribute to resource ticks while reassigning.
- Maxed refineries (4/4): amber crown icon on map tile. Tooltip: "Saturated — 4th miner
  gives ~10% marginal gain."

No separate "workers" tab. Miners are a build item in the sidebar (category: Units).

---

## SKYHOOK MECHANICS (clarification — underdocumented in main-gdd)

**What it does:** Catches mass-driver-launched payloads in Mercury orbit, transfers
them to interplanetary trajectory toward target planet. Without skyhook, the mass
driver can only launch small hardened cargo (survives high-G acceleration). With
skyhook, large/delicate components can be mass-driver-launched as segments and
assembled in orbit — dramatically reducing cost per unit shipped.

**When to build:** After mass driver is operational. Before you need to ship large
volumes of terraforming components or Dyson panel segments to other planets cheaply.

**Bootstrap cost:** First skyhook construction requires a rocket launch (significant
volatiles cost — the initial structural segments must reach Mercury orbit somehow).
After that, it self-sustains.

**Planet targeting:** Skyhook appears in the Mercury sidebar build list under
"Space Infrastructure." When selected, a target planet dropdown appears (unlocked
planets only). The queue item reads e.g. "Skyhook → Mars". Player does NOT go to
Mars to request this — Mercury is the factory, Mercury queues the build.

**Per-planet:** Each destination planet needs its own skyhook. Build once per planet.

---

## INFRASTRUCTURE PATHS — PLAYTEST DEFERRAL

For the playtest build: resource flow between buildings is **automatic** once a
building is operational. No player-drawn path required.

Post-playtest: the player-drawn path system (as described in the Paths section above)
will be added. State model reserves `mercuryPaths: MercuryPath[]` in GameStateService
as an empty array — placeholder that the future system populates.

---

## CULTURE EVENT CLICK PROTECTION

Culture event card: `pointer-events: none` for 800ms after appearance.
Prevents accidental button clicks when an event pops up mid-gameplay.
Implementation: CSS animation on the card root element, not JS logic.

```scss
.culture-event-card {
  animation: event-block-clicks 0.8s step-end forwards;
}
@keyframes event-block-clicks {
  from { pointer-events: none; }
  to   { pointer-events: auto; }
}
```

---

## RESOURCE + POWER HUD (bottom-right strip)

Always visible in both orrery and Mercury views.
Grouped with resources because they are related decisions (build = spend resources + power).

```
Ore: 4,820 (+12/yr)   Metals: 1,203 (+4/yr)   Volatiles: 340 (+1/yr)
Power: [████████░░░░] 1.2 TW / 3.0 TW available
```

Power bar colour zones:
- 0–80% consumed: green fill
- 80–100%: amber fill
- ≥100%: red fill, new builds with power draw blocked (or shown as unaffordable)

**Mercury-local power** is separate: Mercury surface draw vs Mercury solar/fission/fusion
output. Shown inside the Mercury sidebar, NOT in the global strip. The global strip shows
Dyson swarm watts vs total system consumption.

Resource reservation (anti-starvation): three number inputs above or beside the queue bar.
Player sets "keep at minimum: [Ore ____] [Metals ____] [Vol ____]". DysonService checks
`available − reserved > panel_cost` before auto-spending on Dyson panels. If reserves
not met, auto-panel-building pauses until resources recover.

---
*Additions from session: June 2026.*
