# HELIOSCAPE — GDD (caveman-compressed)
v0.3 + session updates. Solo dev (Jos). Godot 4 / GDScript. Steam PC.

---

## CONCEPT
Peaceful civilisation-scale strategy. No combat, no aliens, no game over. Player = architect of humanity's multi-planet future. ~2000-3000 in-game years. Tone: cosmic wonder + quiet optimism + weight of deep time. Inspiration: Kurzgesagt terraforming/Dyson sphere videos. Comps: Terraformers, Oxygen Not Included, Suzerain.

Core fantasy: opens Earth alone → ends transformed solar system, dimmed star, multiple living worlds. Contrast between those two images = game.

NOT: military, city builder, survival, Dyson Sphere Program clone.

---

## VOICE / NARRATOR
Most important writing principle. Narrator = accumulated civilisation record. Present tense, first person plural ("we"), human not clinical, optimism from presence not spin.

Wrong: *"Scientists noted first measurable pressure increase."*
Right: *"It's working. Atmospheric monitors recorded first measurable pressure increase. 0.008 atmospheres. Not enough to breathe. Not for three hundred more years. But it's there."*

---

## GAME START
Year 2033. Artemis base at Shackleton Crater (Moon south pole) already operational — inherited. Europa Clipper data: organic chemistry confirmed, no definitive biosignatures. Mercury mission = player's first action. Earth ~Kardashev 0.73 (fission + renewables).

Probe missions (before Mars/Venus unlock): send unmanned probe to Mars (3-4yr transit, 3-4yr return → data bonus for chosen Mars path), Venus (same), Europa (hints at biological status). Optional, gives agency over info-gathering before major decisions.

---

## KARDASHEV MILESTONES (game spine)
| Milestone | Trigger | ~Year |
|---|---|---|
| Type 1 | Deuterium fusion online (needs Mercury proof-of-concept + Dyson 15%) | 80-120 |
| First Era Complete | 2 habitable worlds + first self-sustaining colony + Dyson 50% | 400-700 |
| Type 2 | Dyson sphere 100% | 800-1200 |
| Type 3 Gesture | First interstellar seed ship launched | 1000-1500+ |

First Era Complete = V1 endpoint (game continues into second era but this is narrative climax).

---

## PLANETS & UNLOCK SEQUENCE
Earth (always) → Mercury (Earth tech tree) → Moon unlocks once Mercury phase 0 operational → Mars + Venus unlock at Mercury year 20 (phase 2) → Jupiter/outer system after fusion drives (post-V1 or late V1).

Planet panel shows all planets from start; locked ones show "humanity hasn't reached this far yet."

---

## EARTH
Role: civilisation brain, research hub, tech tree, launch facility. Not factory.

Tech tree (gated by prereqs + spillover unlocks):
- Launch Mercury Mission — always available (game start)
- Advanced Renewables Integration — req: Mercury launched
- Dome Habitat Technology — req: Mercury launched
- Deuterium Extraction from Seawater — req: Renewables done
- Ocean Macro-Plastic Cleanup — req: Mercury phase 1
- Fusion Ignition Theory — req: Deuterium done
- Atmospheric CO₂ Drawdown — req: venus_carbonate spillover
- Soil Restoration Network — req: mars_soil spillover
- Ocean Acidification Reversal — req: venus_carbonate + CO₂ Drawdown done
- Rewilding at Scale — req: mars_coastal + Soil Restoration done

Spillover mechanic: Mars/Venus terraforming steps unlock Earth tech nodes. Notification fires, player goes to Earth, clicks to initiate. Keeps Earth active throughout game.

Earth vignette arc: 5 states per inspectable location (city skyline, coastline, forest/farmland, night sky). Each evolves independently based on tech nodes completed.

Research Points: RP = capacity, not currency. Total capacity = population-based, grows as Earth + colony populations grow. Running track occupies capacity until complete. Early (~60 RP): 2-3 simultaneous tracks. Late (150+): many simultaneous. Constraint eases naturally.

Public support meter: DROPPED.

Moon = TAB inside Earth view (not separate planet destination).

---

## MOON (under Earth)
Role: research outpost + organism library (proving ground for Mars/Venus biology). Not factory, not terraformed.

Research tracks (~20-35yr each, multiple simultaneous):
- Low-Gravity Medicine → Mars colonists healthier
- Closed-Loop Life Support → cheaper colony infra
- Regolith Construction → reduces import costs
- Organism Library Tier 1 (Pioneer Species) → more seeding options + better stability projections
- Radiation Resilience — req: Low-Grav Med done
- Isolation Psychology — req: Closed Loop done
- Early He-3 Extraction — req: Regolith done; bridges deuterium era
- Organism Library Tier 2 (Ecosystem Packages) — req: Tier 1 + mars_ocean spillover

First 4 unlock when Mercury launches. Rest unlock at Mercury year 20.

Culture events: intimate crew-scale. First birthday off-Earth, someone refusing to return, 10th anniversary traditions.

Visual: Moon tab in Earth view. Still visible in orrery; clicking in orrery opens Earth view at Moon tab.

---

## MERCURY
Role: industrial heartland of solar system. Primary Dyson swarm component source. Only planet with isometric base view (planned — spatial building placement).

Visual: polar crater rim. Sun permanently on horizon. One side lit, one side pitch-black crater floor (fusion reactor glow). Sun dims as Dyson swarm grows (local effect; Earth's sunlight explicitly protected).

Mercury will be "starcraft-lite" 2D isometric base builder. UI where you can select buildings miners or workers that you can add to queue. Player can rearrange queue. By default "build dyson swarm panels" is active if no other items queued.
Player can look around small map like an RTS game by moving cursor near edge of screen. 3 mining locations spaced out. Once a building is complete player can place it on map's hexagon grid. assign miners to mining location. refinery can only be placed near mining location. miners have static paths back to refinery (no pathfinding)

3 ore types:
- Common ore (iron/silicon/aluminium) — abundant, all standard construction
- Rare metals (titanium/chromium) — specific crater deposits, advanced components
- Polar volatiles (water ice, carbon compounds) — life support, organic chemistry

Base phases:
- Phase 0 (Yr 0-5): Landing pad + power cell + mining facility. All 3 required. Completion starts resource accumulation + unlocks Moon tracks.
- Phase 1 (Yr 5-20): Refinery + fabricator + solar array expansion + rare metals mining. Req: phase 0 + 5 operational years.
- Phase 2 (Yr 20+): Mass driver + Dyson panel production + polar volatiles extraction. Req: phase 1 + 20 operational years. Unlocks Mars + Venus + full Moon.

Resource economy: 3 counters accumulate continuously once mining active. Rate increases with each production building. Spent on: Dyson panel queue + components for other planet decisions.

Component routing (mid-game): terraforming decision requiring hardware (orbital lasers, magnetic umbrella, skyhooks, etc.) → component appears in Mercury production queue. Player sets priority vs Dyson panels. First component starts terraforming phase; additional same-type components accelerate it. Primary reason to return to Mercury mid-game.

Dyson swarm: panels queued via mass driver. Player prioritises panel vs component production. Displayed as energy output in watts (not %). Milestone CEs at 10%/25%/50%/100%. 50% = First Era Complete condition.

Panel tiers:
- Basic: from Dyson production start. CME-vulnerable. Low ore cost.
- Mid-tier: unlock at Type 1. Fusion shielding research transfers. More durable, moderate ore cost.
- Hardened: unlock when Jupiter He-3 established. Req volatiles input. Effectively CME-immune.

Existing panels not retrofitted — degrade naturally, replaced by new production at current tier. Swarm composition stat visible (% basic/mid/hardened). Player can queue replacement over expansion to accelerate hardening — genuine tradeoff vs swarm growth rate.

Mass driver queue: visible at all times showing launch priority order: Dyson panels, Mars laser satellites, Venus mirror segments, maintenance runs, crew capsules. Core Mercury decision made concrete.

Human presence: small rotating unnamed crew from mission start. Referenced in CEs but not individually tracked. Communication delay prevents full Earth remote control.

Dyson swarm scale: ~40 quadrillion km² at Mercury orbit. Each 1km² panel ≈ 9GW. Panel counts abstracted — player sees wattage only. Production curve: slow early, exponential once base fully scaled.

Mercury scalability (planned isometric): up to 5 of each building type. More refineries/factories = faster resources but slower Dyson output. Layout decisions matter (miners return to nearest refinery via static paths).

Solar events: CME every ~80-120 game-years. Visible 15-20yr in advance. Hit: unshielded Dyson panels damaged (maintenance cost), unshielded Mercury infra loses production. Planets with magnetic umbrellas protected. Response: reinforce before hit / accept and repair / cluster panels (reduces output during event). Damage proportional, not punishing.

Late Mercury options:
- Machine World (Builder path): sterile, optimised, permanent production bonus
- Garden World (Terraformer path): terraform using Venus nitrogen surplus + Dyson shade panels. Artificial day/night cycle.
- Stellar engine construction yard: same mass driver infra, civilisation-scale output (post-V1)


### MAP
Medium-sized map. Square grid, isometric diamond visual.
8 mining locations spread across map. Each has:
- ore_type: common / rare_metals / volatiles
- 1 predetermined adjacent refinery slot

### STARTING ZONE
First Mercury visit: player chooses 1 of 3 starting zones.
Each zone described by ore composition nearby.
Choice is permanent. Nodes in chosen zone unlock immediately.
All other nodes start locked.

### EXPANSION
Organic outward expansion. Building refinery at mining location unlocks adjacent nodes. Player decides which mining location to expand to next based on resource needs.
Factory slots placeable on any location. Resource transport between buildings automatic with straight lines (placeholder rovers) for initial draft.

### MINERS
Max 5 miners per refinery. Miners run static waypoint paths (refinery → mine → refinery). On reassignment: finish current waypoint segment, walk straight line to new refinery, begin
new path. Miners in reserve until assigned. New miners built via factory queue (cost: common ore).

### OVERDRIVE
Unlocked by Dyson swarm energy milestones. Per-building upgrade required (queued, costs rare metals).
- Tier 1 (25% swarm): 1.5× throughput
- Tier 2 (50% swarm): 2.5× throughput
Unupgraded buildings cannot run in overdrive. Feedback loop: more panels → more energy → overdrive available → faster production → more panels.

### PANEL TIER UPGRADES
Tier unlock (Type 1 / Jupiter He-3) gives knowledge, not instant production switch. Player queues single Mercury item "Retrofit Production Lines" — applies to all factories simultaneously.
Moderate rare metals cost, ~15yr. Until complete, factories produce previous tier. Decision: retrofit now (brief slowdown) or delay and keep expanding at current tier.

### MASS DRIVER
2n parallel MD available once overdrive is available, doubles standard launch throughput. Second built as separate Mercury queue project.
Rockets retained for oversized components + urgent delivery. Skyhook still handles large component orbital transfer.

---

## MARS
Role: first terraforming target. Emotional core. Clearest arc from barren to living.

Terraforming paths (chosen at game start):
- Path A — Orbital Laser Arrays: 80yr atmospheric phase. Fastest warming. Builds orbital infra.
- Path B — Statite Mirror Array: 120yr, cheaper Mercury components, no orbital infra.
- Path C — Polar Nuclear Detonations: 20yr, fastest, no reusable infra, most philosophically complex CEs.

Full step sequence:
1. Barren → choose warming path
2. Warming (Atmospheric Thickening, 80yr) → choose magnetic protection
3. Shielded (Magnetic Protection, 30yr) → choose water delivery
4. Wet (First Oceans, 70yr) → begin Bio I
5. Bio I — Ocean Seeding (30yr) → commit to Bio II
6. Bio II — Soil Preparation (25yr) → commit to Bio III
7. Bio III — Coastal Pioneers (20yr) → commit to Bio IV
8. Bio IV — Inland Spread (35yr) → declare self-sustaining
9. New Mars — complete

Bio IV initiates inland colonisation, not mature ecosystem. At complete: pioneer vegetation, early trees 3-5m, established insects, first fauna waves from coastal biodomes. Young world, not lush. Maturation continues in post-terraforming discovery events over subsequent centuries.

Animal introduction: biodomes as staging (complete food chains before open release), shipped embryos + insect colonies from Earth/Moon, Mars-born generations in domes by Bio IV. Large fauna above small mammal scale: post-terraforming discovery events only. Dome walls open gradually — sections, not all at once.

Spillover triggers:
- Step 4→5: mars_ocean → unlocks Moon Organism Library Tier 2
- Step 5→6: mars_soil → unlocks Earth Soil Restoration
- Step 6→7: mars_coastal → unlocks Earth Rewilding

Key CEs: First Dust Storm Season, First Water Ice, First Rain on Mars (14:23 local time, 2.3mm), Children of Mars census (847 Mars-born, "too blue"), First Insects, Red Season, 34,000 Martians.

Dome colonisation: available after Earth's Dome Tech researched. Player-initiated (build launch complex, assemble crew, commit). Dome teardown when atmosphere crosses breathable threshold — each dome removal is CE. Last dome = major CE.

Post-terraforming: first open-air city founding, ecosystem micro-events every ~50yr, population milestones, underground drilling → finds 3-billion-year-old fossil traces ("we're the second life on this planet").

Sub-planet bodies affecting Mars:
- Captured Jovian sky moon (Ganymede or Callisto): water delivery option (moon captured into Mars orbit, ice extracted gradually, permanent sky moon)
- Titan nitrogen: atmosphere source (strips Titan permanently, locks Titan terraforming forever)

---

## VENUS
Role: second terraforming planet. Harder emotional sell. Longer arc. More alien end state.

Shade mirror is MANDATORY — not a path choice. Prerequisite for all Venus cooling, deploys in parallel with moon transits.

Venus spin-up decision is made ON VENUS UNLOCK (~Year 20), not mid-game. Must be finalised before Year 100. Impacts happen BEFORE Phase 1 cooling, not after — a moon impact is a planetary heat event, so the correct sequence is always crash first, then begin the long cooling project from a hotter but already-watered starting point.

Terraforming paths (opening decision on Venus unlock):
- Path A — Wild Venus: no spin-up. ~117 Earth-day solar day. Terminator zone habitation, rail cities, orbital day/night mirrors. Water via asteroid belt or a captured sky moon (Ganymede/Callisto). Proceed immediately to cooling. ~400–600yr.
- Path B — Europa Spin-up: single Europa crash before Phase 1 (retrograde direction). ~10–20 Earth-day solar day result. ~35–50% ocean coverage. Water + spin delivered together. Phase 1 extended ~20–30yr from impact heat. One Hunt for Life closure (Europa). ~500–700yr.

There is no two-moon Venus path. A single Europa impact is the only moon crash in the game; Callisto and Ganymede are reserved as captured sky moons (Mars or Wild Venus).

Ocean coverage differs visibly by path (planet texture in orrery): Path A belt-only — mostly rocky, inland seas; Path A with a captured moon, or Path B — Earth-like land/ocean mix.

Spillover: venus_carbonate (CO₂ removal phase) → unlocks Earth CO₂ Drawdown + Earth Ocean Acidification Reversal.

Key CEs: The Long Cooling, Carbonate Rain Begins, Below 200°C threshold, First Rain on Venus (not acid — confirmed), Cities of the Terminator, First Green Shore, They Had Been Venusians (two generations before anyone stood on surface).

Sky cities: early colonisation at 50km altitude (near Earth-like conditions). As atmosphere thins, cities lose buoyancy. Player decision: ground the city and repurpose it as surface habitat (Naturalist), or preserve it aloft with active lift (Architect — Dyson power, expensive, beloved by Terraformers). Not fusion-dependent.

Path A → Path B mid-game pivot: permitted. Triggered by CE when railed city reaches certain age + player has sufficient Dyson capacity. Costs significant Mercury production. Once mirrors create artificial day/night, railed city becomes optional — player continues/converts/decommissions. CE acknowledges pivot honestly, not triumphantly.

Terminator rail failure: one-time narrative event, not recurring. Three outcomes: full rail replacement (Mercury ore cost) / convert to stationary / decommission with heritage acknowledgement. Stopping railed city not survivable option while Venus hostile outside terminator — only after mirrors create tolerable conditions elsewhere.

Sky cities + vortex engines are parallel tracks, not sequential dependencies.

---

## BIOLOGICAL PHASE MANAGEMENT (Mars + Venus)
Long wait split into sequential committed sub-steps. Once committed, step runs, cannot reverse. While step runs, player engineers next package. ~110yr total Mars bio phases, ~130yr Venus.

Biological composition interface (TBD full design): organism palette (8-12 categories: pioneer bacteria, nitrogen-fixers, decomposers, early plants, insects, small fauna, synthetic organisms). Each has requirements + outputs. Player drags combinations into projected ecosystem view. Stability forecast shown. Commit. Outcome differs slightly from projection. Moon organism library investment improves options + projection accuracy.

Pioneer domes: 20-30yr before open seeding, player runs live organism trials in enclosed surface domes. Results inform full seeding decision.

---

## POWER HIERARCHY
| Source | Role | Constraint |
|---|---|---|
| Mercury solar | Local Mercury only | Surface-bound |
| Dyson swarm | Civilisation-wide, infinite scaling | Requires construction + maintenance |
| Deuterium fusion | High-intensity local applications | Deuterium supply chain |
| He-3 fusion | Premium + transport drives | He-3 supply chain (Jupiter) |

Bootstrap: fusion ignition requires 15% Dyson swarm output. Cannot skip swarm to get fusion.
Earth's sunlight protected: Dyson panels distributed to avoid Earth's 0.000000045% slice. No Earth dimming.
Star-lifting: not in V1. Without it, Europa crash + Titan nitrogen strip are permanent irreversible.

---

## RESOURCE ECONOMY
| Resource | Source | Use |
|---|---|---|
| Common ore | Mercury mining | All construction |
| Rare metals | Mercury specific deposits | Advanced components, Dyson panels |
| Polar volatiles | Mercury shadowed craters | Life support |
| Deuterium | Earth oceans | Fusion fuel (early era) |
| He-3 | Jupiter/Saturn aerostats | Fusion fuel (premium era) |
| Europa ice | Europa crash | Venus water + spin (single impact, Venus only) |
| Captured moon ice | Ganymede/Callisto capture | Mars or Wild Venus water (gradual, sky moon stays) |
| Titan nitrogen | Titan strip | Mars/Venus atmosphere (permanent) |
| Research Points | Population (Earth + colonies) | Tech unlocks |

Cross-planet flows:
- Venus CO₂ → Mars rocket fuel
- Mercury components → all orbital structures
- Restored Earth ecosystems → better organism candidates for seeding

When short on resources: phase never reverts. Dialog shows current vs required + shortcut to Mercury queue. Resources visible in HUD once cross-planet flows begin.

Material sourcing: the per-construction binary choice (Earth legacy materials vs. fresh asteroid resources) is retired — all manufacturing is Mercury-based and geological resource scarcity is not a constraint within V1's scope. Earth's sustainability arc is handled instead via the **Advanced Circular Economy** tech node (Naturalist branch, mid-late game): fusion-powered atomic sorting turns Earth's industrial junkyards into refined material streams. Passive permanent bonus once researched. Not a recurring player decision — see `earth-tech-tree-options.md` for full node spec.

Entropy: Dyson panels accumulate micrometeorite damage. Processors fail. Orbital structures drift. Does NOT apply to terraformed planets. Mercury maintenance = late-game tension.

---

## TRANSPORT PROGRESSION
| Era | Speed | Unlock |
|---|---|---|
| Chemical rockets | 6-9mo Earth→Mars, 26mo windows | Game start |
| Skyhooks + Cyclers | Regular passenger service | Mid early game |
| Ion/Laser sail | 2-3mo Mars, outer solar accessible | After Dyson 20%+ |
| Fusion drives | Days anywhere, ~10%c interstellar | After He-3 fusion |

Launch windows: visual orbit alignment in orrery (not realistic orbital mechanics). Window open = normal cost + time. Window closed = mission still possible, arrives later. Time is cost — no resource/fuel penalty. Fusion drives: windows disappear permanently (UI element removed, CE fires).

Chemical rockets use volatiles as propellant (water electrolysis on Mercury — H₂/O₂ from polar ice). Light cost, not separate fuel resource. Once mass driver exists, rockets reserved for crew + precision cargo. Nuclear thermal rockets: not in game.

Ships as dots in orrery: colonist ships, ice deliveries, component runs shown as small dots on curved paths. Early game = 1-2 dots. Late game = system full. Visual density communicates civilisational scale without UI numbers.

Outer planet lock: Jupiter inaccessible until fusion drives. He-3 = meaningful mid-game unlock.

---

## NOTIFICATION SYSTEM
Three tiers:
- Pause-and-present: major decisions, irreversible choices. Game pauses (configurable).
- Ping-and-queue: CEs, milestone achievements, spillover notifications. Toast bottom-left, persists 8s, clickable. Bell icon shows unread count.
- Ambient: background state changes visible in planet visuals. No notification.

History book: every CE appended with timestamp, planet context, vignette state at time. Accessible from HUD. Clicking reconstructs vignette at that terraforming stage.

Culture events do NOT pause game. Queue. Player reads at own pace.

---

## PHILOSOPHICAL TENSION — NATURALISTS vs ARCHITECTS
Not whether to terraform (everyone terraforming) — approach to natural processes. Naturalist = working with nature, patience, wild outcomes. Architect = designed systems, control, efficiency. Neither wrong.

Tagging system, not resource mechanic. Each major decision auto-tagged by what player chose. No mechanical penalty/bonus. No repeated binary choices. At First Era Complete: summary shows ratio descriptively — "your civilisation leaned Naturalist — 11 of 17 major decisions favoured natural processes." Valid at any ratio.

Tagged examples: Path A Mars warming = Naturalist. Mirror Mars = Architect. Wild Venus end state = Naturalist. Managed Venus = Architect. Sky city preservation = Naturalist. Sky city descent = Architect. Europa preservation = Naturalist. Europa crash = Architect. Callisto + Europa sequential = Architect. Advanced Circular Economy research = Naturalist.

---

## EUROPA DECISION
Game's most morally complex moment. The Venus Europa Spin-up path (Path B) requires a single Jovian moon impact. Decision window closes Year 100 (game Year 100 = 2133) — the required multi-decade gravity assist sequence becomes geometrically unfeasible after this point. Decision is made on Venus Unlock (~Year 20); the impact arrives 20–40 years later and precedes Phase 1 cooling.

At decision time: Europa biological status formally unknown (Clipper data: organic chemistry, no definitive biosignatures).

Europa redirect + shade mirror deployment are parallel early-game activities, not sequential. Player authorises the Europa mission at Venus Unlock → Mercury queues impactor package + solar sail tugs → shade mirror proceeds in parallel → Europa impacts Venus 20–40 years later, before Phase 1 cooling begins. There is no two-moon variant; Europa is the only crash.

CE fires in two parts: warning 10-15yr before impact → impact event. Gap is where moral complexity lives.

Permanent unknowing: players who crash Europa never know in that playthrough whether life existed there.

Hunt for Life outcomes (fixed, not randomised):
- Europa (not crashed): active chemotrophic life confirmed. Game's largest revelation.
- Enceladus: active life at hydrothermal vents. Independent of Europa.
- Mars subsurface (post-terraforming): ancient fossil traces, 3 billion years old. Not alive now.
- Titan: nothing found. Knowledge bonus + philosophical CEs.

Second playthrough: if player discovered Europa life in previous run, specific CE fires when they choose to crash it again.

---

## PATH LOCKING
Permanently locked (physical irreversibility): Europa crash, Titan nitrogen strip, Mars polar detonations. Physical act cannot be undone.

Not locked (infrastructure is additive): adding orbital mirrors to Path A Venus mid-game. Adding magnetic umbrella to nuclear-warmed Mars. Any infrastructure layered on existing path. Early choices have lasting narrative consequences via CEs + history book entries — not mechanical locks preventing improvement.

Design principle: physical acts irreversible. Infrastructure decisions not.

---

## RESEARCH POINTS (RP)
RP = capacity, not spendable resource. Running track occupies capacity until complete → frees back up. Cannot start new track if insufficient free capacity.

Capacity = population-based, grows with Earth + colony populations. Early: ~60 RP (2-3 simultaneous). Late: 150+ (many simultaneous). Constraint eases naturally.

Track RP costs: simple = 20 RP. Standard = 30-40 RP. Complex = 50-80 RP. Approximate — tune for feel once content complete.

Effect: player must choose which tracks run first. Real consequences. Cannot click entire tech tree at once.

---

## FERMI SILENCE
At ~30% Dyson swarm, Sun anomalous in infrared. Humanity detectable within ~150 light years. No signals received. Three choices: Broadcast (optimistic, accelerates listening research) / Go Quiet (slows some research) / Continue as Normal (debate as cultural undercurrent). Nothing ever answers. Shapes civilisation character + CE chains. (V1 candidate — may defer to post-V1.)

---

## HUNT FOR LIFE ARC
Post-first-era research arc. Systematic search for existing/past solar system biology. Enabled by advanced probe + drilling tech developed through game. Three phases: remote sensing → deep investigation → outcomes. Information lag applies (Enceladus mission: 3-4yr data return).

---

## TIME & PACING
- 1 game-year = 2 real seconds at 1×
- Speed: 1× always. 5× after game start or in DLC. First playthrough = authored experience at base speed. Subsequent playthroughs unlock speed agency.
- Visual orbit speed decoupled from game speed
- Dead zone prevention: Moon research tracks, Earth tech tree, Mercury queue management, bio sub-step engineering, CE history browsing, multi-location vignette browsing

---

## UI PRINCIPLES
- Retro-functional. Monospaced typography. Dark backgrounds, warm amber/orange accents. Mission control aesthetic.
- All font sizes in em. Base 14px.
- Planet panel: all planets visible from start, locked = status message.
- Living planet visuals: sphere colours, atmosphere thickness, city lights driven by shader parameters from terraforming progress variables. Stats interpolate in real time.
- Tech tree partial visibility: unlocked = full colour, one ahead = muted, two ahead = silhouette, beyond = nothing.
- Vignettes: layered 2D compositions, 4-6 states per location, crossfaded at milestone triggers. Progression via palette/asset swap, not full redraws.

---

## ART DIRECTION
- Bold committed palettes per planet. Warm + vibrant.
- Workflow: AI generates variations → Jos redraws best ones in own artstyle
- Culture event cards: left portrait vignette (3:4) + text right. Shareable as PNG (post-V1). AI generates text → Jos rewrites them in "human way of writing"

---

## SOUND
Parameter-driven audio bus per planet per terraforming state. Parameters: atmospheric pressure, wind intensity, precipitation, biology level, human presence. Same base recordings shaped by processing per planet's physics. Mercury: NO ambient sound (no atmosphere) — structural/mechanical only, silence used deliberately.

---

## QUIET FAILURE / NO GAME OVER
Poor decisions diminish game, never end it. At First Era Complete: honest solar system overview. Flourishing run = three living worlds, complete swarm, seed ships. Diminished run = marginal progress, civilisation that survived but never quite reached. No failure screen.

---

## POST-V1 / DLC
Outer solar system (Jupiter, Saturn, Titan, Callisto, Ceres), Hunt for Life full arc, Dyson sphere completion → Type 2, stellar engine (Shkadov + Caplan), interstellar seed ships + information lag, Mercury redemption arc, star-lifting, black hole energy harvesting, procedural star systems, full mobile, statite resort prestige project.

---

## COMMERCIAL
€12.99 launch. Steam PC primary. Devlog from early (Reddit, X, TikTok). Steam page ~12mo before launch. Steam Next Fest. Mid-size YouTube outreach (10k-500k, space/science/strategy). Kickstarter only after 12+ months devlog with demonstrated audience.

Key differentiator: peaceful + scientifically grounded + civilisation-scale. No direct competitor hits all three simultaneously.

---

## OPENING / CLOSING IMAGE
Opening: Earth from space. Small. Blue. Alone.
Closing: Same camera. Multiple living worlds. Faintly dimmed Sun. Warm atmospheric signatures. Habitat rings near Jupiter. Faint beam toward another star. Whatever player chose not to do visible in its absence. No score. No grade. Just the view.

---
*Caveman-compressed for AI context. Source: helioscape-gdd-v03.md + session discussions April 2026.*
*For full narrative examples, tone samples, and science detail: request specific sections.*
