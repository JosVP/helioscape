# HELIOSCAPE — TECH TREE (caveman-compressed)
*Separate from main GDD. Reference when working on tech tree only.*
*Source: helioscape-gdd-v03.md + session discussions May 2026.*

---

## SCOPE
Tech tree = Earth + Moon only. Mars/Venus have no tech trees.
Mars/Venus progression = TerraformingSystem. Choices made directly in planet dialog, sequential — player cannot see future choices until current phase completes. No extra click-through to Earth panel.
TechTreeUI.gd is Earth + Moon only. TechTreeSystem.gd accepts planet_id "earth" or "moon".

---

## LAYOUT
Left-to-right timeline. Vertical swim lanes by theme: Energy, Naturalist, Architect, Shared.
Gateway markers (see below) placed at approximate x-position for their expected game stage.
Partial visibility: unlocked = full colour. 1 step away = muted. 2 steps = silhouette. Beyond = hidden.
Distance computed from minimum graph distance from any completed node.

---

## GATEWAY MARKERS
Spillover nodes have no Earth parent. Gateway markers = synthetic read-only tree nodes that become their parent when a cross-planet event fires. Not researchable. Visual: small planet icon + phase label. State: waiting (grey italic) → active (full colour, brief pulse).

When event fires: marker activates. Its children drop to "muted" visibility. Prerequisites now checkable.
Implemented as: event writes synthetic node ID to GameState.completed_techs. Dependent node checks it as prerequisite.

| Marker ID | Fires when | Unlocks |
|---|---|---|
| gateway_venus_carbonate | Venus Step 2→3 complete | CO₂ Drawdown, Ocean Acidification Reversal |
| gateway_mars_ocean | Mars Step 4→5 complete | Moon Organism Library Tier 2 |
| gateway_mars_soil | Mars Step 5→6 complete | Soil Restoration Network |
| gateway_mars_coastal | Mars Step 6→7 complete | Rewilding at Scale |

---

## NODE COMPLETION FEEDBACK
All CEs queued. Game does NOT pause (exception: Europa crash — see GDD).
- Standard node: toast notification only.
- Fork node: queued CE card with narrative flavour + two choice buttons inline.
- Capstone node: queued CE card with full narrative prose.

Fork choice buttons worded as values/philosophy. Mechanical effect = secondary text or revealed post-choice.

---

## EARTH TECH TREE

### SHARED / NEUTRAL
- Launch Mercury Mission — always available (game start). Completion: toast.
- Advanced Renewables Integration — req: Mercury launched.
- Dome Habitat Technology — req: Mercury launched.
- Deuterium Extraction from Seawater — req: Renewables done.
- Fusion Ignition Theory — req: Deuterium done.
- Automated Food Systems — req: Arcology Framework OR Renewables done. FORK. CE card: two options — Rewild freed land (Naturalist tag, better organism candidates) / Develop freed land (Architect tag, population + RP boost). Tags increment naturalist_decisions or architect_decisions.

### NATURALIST BRANCH
- Ocean Macro-Plastic Cleanup — req: Mercury phase 1. Tags: naturalist.
- Atmospheric CO₂ Drawdown — req: gateway_venus_carbonate + 2 naturalist nodes. Tags: naturalist.
  Soft gate: if player has zero naturalist nodes when gateway fires, notification appears but node stays locked. Narrative reason given.
- Soil Restoration Network — req: gateway_mars_soil + 2 naturalist nodes. Tags: naturalist.
- Ocean Acidification Reversal — req: gateway_venus_carbonate + CO₂ Drawdown done. Tags: naturalist.
- Rewilding at Scale — req: gateway_mars_coastal + Soil Restoration done. Tags: naturalist. Capstone CE.
  Cascade: better pioneer organism candidates for Mars/Venus seeding. Colonist psychological baseline improved for open-environment living.

### ARCHITECT BRANCH
- Vertical Megacity Initiative — early (same tier as Renewables). Tags: architect. CE: first city hits 50M within boundary. Raises RP ceiling.
- Arcology Framework — req: Vertical Megacity. Tags: architect. Effect: self-contained city ecosystems, reduced resource throughput per capita. Narrative echo: dense urban living → CE flavour for Mars dome colonists + Venus sky cities (no mechanical tag).
- Subsurface City Expansion — req: Arcology. Tags: architect. Cascade: Mars subsurface dome design improved, radiation shielding research transfers.
- Planetary Resource Grid — req: Arcology (mid-game). Tags: architect. Small permanent RP efficiency bonus. CE: grid prevents first famine.
- Geoengineering Coordination Bureau — req: Resource Grid. Tags: architect. Research insights transfer to terraforming timeline accuracy.
- Neural-Digital Integration Research — req: Resource Grid + Fusion Ignition Theory (late). Tags: architect. RP ceiling increase + extended active lifespans. Major CE chain. Naturalist communities push back.
- Planetary Coordination Network — req: Neural-Digital (endgame). Tags: architect. Significant RP ceiling increase. Capstone CE. Architect endpoint equivalent to Rewilding at Scale.

### TENSION
Same node both paths want: Automated Food Systems (fork). Mutual exclusivity is temporal not permanent — early RP scarcity forces prioritisation, not lockout. Naturalist/Architect benefits are contextually different (open environments vs dense environments) — complementary late game, competing early game.

---

## MOON RESEARCH TRACKS
Shown as tab within Earth panel. planet_id = "moon". Same TechTreeSystem.
Not a branching tree — parallel research tracks (list UI, not graph). All tracks use RP capacity same as Earth nodes.

First 4 unlock when Mercury launches. Remaining unlock at Mercury year 20.

| Track | Req | Effect |
|---|---|---|
| Low-Gravity Medicine | Mercury launched | Mars colonists healthier |
| Closed-Loop Life Support | Mercury launched | Cheaper colony infra |
| Regolith Construction | Mercury launched | Reduces import costs |
| Organism Library Tier 1 — Pioneer Species | Mercury launched | More seeding options + better stability projections |
| Radiation Resilience | Low-Grav Med done | — |
| Isolation Psychology | Closed Loop done | — |
| Early He-3 Extraction | Regolith done | Bridges deuterium era |
| Organism Library Tier 2 — Ecosystem Packages | Tier 1 + gateway_mars_ocean | Improved seeding packages |

---

## TAGGING SYSTEM
naturalist_decisions and architect_decisions counters in GameState. Auto-incremented by tag_decision effect on node unlock. No mechanical penalty/bonus — shapes CE content + First Era Complete summary. Valid at any ratio.

---

## DROPPED / PARKED
- dense_living tag: removed from data model. Architect narrative echoes (dense living → dome colonists) live in CE writing only, not in GameState.
- Mars/Venus TechTreeSystem planet_ids: do not exist.
