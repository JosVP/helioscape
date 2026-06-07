# HELIOSCAPE — Compressed GDD for AI Context
**v0.3 basis + session updates. Solo dev (Jos). Godot 4 / GDScript. Steam PC.**

---

## CONCEPT
Peaceful civilisation-scale strategy. No combat, no aliens, no game over. Player is architect of humanity's multi-planet future. Spans ~2000-3000 in-game years. Emotional register: cosmic wonder + quiet optimism + weight of deep time. Primary inspiration: Kurzgesagt terraforming/Dyson sphere videos. Closest comp games: Terraformers, Oxygen Not Included (systems depth), Suzerain (decision weight).

**Core fantasy:** Game opens with Earth alone. Ends with transformed solar system, faintly dimmed star, multiple living worlds. The contrast between those two images is the entire game summarised.

**NOT:** military, city builder, survival, Dyson Sphere Program clone.

---

## VOICE / NARRATOR
Single most important writing principle. Narrator = accumulated civilisation record. Present tense, first person plural ("we"), human not clinical, optimism from presence not spin. Wrong: *"Scientists noted the first measurable pressure increase."* Right: *"It's working. The atmospheric monitors just recorded the first measurable pressure increase. 0.008 atmospheres. Not enough to breathe. Not for three hundred more years. But it's there."*

---

## GAME START
Year 2033. Artemis base at Shackleton Crater (Moon south pole) already operational — inherited, not built. Europa Clipper data returned: organic chemistry confirmed, no definitive biosignatures. Mercury mission is player's first action. Earth at ~Kardashev 0.73 (fission + renewables).

**Probe missions:**
Before Mars and Venus unlock, Earth can send unmanned probes. Send probe to Mars: 3-4 year transit, 3-4 year return, data arrives as culture event giving small bonus to chosen Mars path. Send probe to Venus: same structure. Send probe to Europa: data returns as first hint of biological status. Optional, gives player agency over what information they're gathering before major decisions arrive.

---

## KARDASHEV MILESTONES (game spine)
| Milestone | Trigger | ~Year |
|---|---|---|
| Type 1 | Deuterium fusion online on Earth (needs Mercury proof-of-concept + Dyson 15%) | 80-120 |
| First Era Complete | 2 habitable worlds + first self-sustaining colony + Dyson 50% | 400-700 |
| Type 2 | Dyson sphere 100% | 800-1200 |
| Type 3 Gesture | First interstellar seed ship launched | 1000-1500+ |

**First Era Complete** is V1 endpoint (game continues into second era but this is the narrative climax).

---

## PLANETS & UNLOCK SEQUENCE
Earth (always) → Mercury (launch from Earth tech tree) → Moon unlocks once Mercury phase 0 operational → Mars + Venus unlock at Mercury year 20 (phase 2) → Jupiter/outer system after fusion drives (post-V1 or late V1)

**Planet panel shows all planets from start** with "humanity hasn't reached this far yet" for locked ones.

---

## EARTH
Role: civilisation brain, research hub, tech tree, launch facility. Not a factory.

**Earth Tech Tree** (gated by prerequisites + spillover unlocks from other planets):
- Launch Mercury Mission (always available, game-start action)
- Advanced Renewables Integration → req: Mercury launched
- Dome Habitat Technology → req: Mercury launched  
- Deuterium Extraction from Seawater → req: Renewables done
- Ocean Macro-Plastic Cleanup → req: Mercury phase 1
- Fusion Ignition Theory → req: Deuterium done
- Atmospheric CO₂ Drawdown → req: venus_carbonate spillover
- Soil Restoration Network → req: mars_soil spillover
- Ocean Acidification Reversal → req: venus_carbonate spillover + CO₂ Drawdown done
- Rewilding at Scale → req: mars_coastal spillover + Soil Restoration done

**Spillover mechanic:** Completing terraforming steps on Mars/Venus unlocks relevant Earth tech tree items. Notification fires, player goes to Earth, clicks to initiate. Keeps Earth active throughout game.

**Earth vignette arc:** 5 states per inspectable location (city skyline, coastline, forest/farmland, night sky). Each location evolves independently based on which tech nodes completed.

**Research points:**
Research Points (RP) function as capacity, not currency. Total RP capacity determined by population — grows as Earth and colony populations grow. Running a research track occupies capacity until complete. Early game capacity (~60 RP) allows 2-3 simultaneous tracks. Late game capacity (150+) allows many simultaneous tracks. Constraint naturally eases as game progresses. Choice of which tracks to run first has meaningful consequences.

**Public support meter: DROPPED.**

**Moon is a TAB inside Earth view** (not a separate planet destination). See Moon section.

---

## MOON (under Earth)
Role: research outpost + organism library (proving ground for Mars/Venus biology). Not a factory, not terraformed.

**Research tracks** (~20-35 game-years each, multiple can run simultaneously):
- Low-Gravity Medicine → Mars colonists healthier
- Closed-Loop Life Support → cheaper colony infrastructure
- Regolith Construction → reduces import costs
- Organism Library Tier 1 (Pioneer Species) → more seeding options + better stability projections
- Radiation Resilience → req: Low-Grav Med done
- Isolation Psychology → req: Closed Loop done
- Early He-3 Extraction → req: Regolith done; bridges deuterium era
- Organism Library Tier 2 (Ecosystem Packages) → req: Tier 1 + mars_ocean spillover

First 4 tracks unlock when Mercury launches. Rest unlock at Mercury year 20.

**Culture events:** intimate crew-scale. First birthday off-Earth, someone refusing to return to Earth, 10th anniversary traditions.

**Visual:** appears as Moon tab in Earth view. Still visible as orbiting body in solar system orrery; clicking it in orrery opens Earth view at Moon tab.

---

## MERCURY
Role: industrial heartland of solar system. Primary Dyson swarm component source. Only planet with isometric base view (planned — spatial placement of buildings).

**Visual:** Polar crater rim. Sun permanently on horizon (never rises/sets). One side lit, one side pitch-black crater floor (fusion reactor glow). Sun dims progressively as Dyson swarm grows (local effect, not global — Earth's sunlight explicitly protected).

**3 ore types:**
- Common ore (iron/silicon/aluminium) — abundant, all standard construction
- Rare metals (titanium/chromium) — specific crater deposits, advanced components
- Polar volatiles (water ice, carbon compounds) — life support, organic chemistry

**Base phases:**
- Phase 0 (Year 0-5): Landing pad + power cell + mining facility. All 3 required. Completion starts resource accumulation + unlocks Moon tracks.
- Phase 1 (Year 5-20): Refinery + fabricator + solar array expansion + rare metals mining. Requires phase 0 done + 5 operational years.
- Phase 2 (Year 20+): Mass driver + Dyson panel production + polar volatiles extraction. Requires phase 1 done + 20 operational years. Unlocks Mars + Venus + full Moon.

**Resource economy:** 3 resource counters accumulate continuously once mining active. Rate increases with each production building built. Resources spent on: Dyson panel queue + requested components for other planet decisions.

**Component routing system (mid-game):** When player makes a terraforming decision requiring hardware (orbital lasers, magnetic umbrella, skyhooks, etc.), the component appears in Mercury's production queue rather than auto-building. Player sets priority vs Dyson panel production. First component completed starts the terraforming phase; additional components of same type accelerate it. This is the primary reason to return to Mercury mid-game.

**Dyson swarm:** Panels queued via mass driver. Player chooses priority between panel production and component production. Swarm displayed as energy output in watts (not %, not panel count). Milestone CEs at 10%/25%/50%/100%. 50% = First Era Complete condition.

Panel upgrade tiers:
- Basic panels: available from Dyson production start. CME-vulnerable. Low ore cost.
- Mid-tier panels: unlock at Type 1 milestone. Fusion shielding research transfers to panel design. More durable, moderately more ore cost.
- Hardened panels: unlock when Jupiter He-3 mining established. Require volatiles input. Effectively CME-immune.

Existing panels are not retrofitted — they degrade naturally and are replaced by new production at the current tier. Swarm composition stat visible to player (% basic / mid / hardened). Player can deliberately queue replacement production over expansion production to accelerate hardening — genuine tradeoff against swarm growth rate.

**Mass driver queue:**
Queue visible to player at all times, showing what's being launched in what priority order: Dyson panels, Mars laser satellites, Venus mirror segments, maintenance runs, crew capsules. This is the core Mercury management decision made concrete — a literal launch queue the player prioritises, not an abstract slider.

**Human presense:**
Small rotating unnamed crew present on Mercury from mission start that oversees/repairs where necessary. Referenced in culture events but not individually tracked. Crew cannot direct all operations from Earth due to communication delay each way.

**Dyson swarm scale:** ~40 quadrillion km² sphere at Mercury orbit. Each 1km² panel ≈ 9GW. Internal panel counts abstracted — player sees wattage only. Production curve: slow early, exponential once base fully scaled.

**Mercury scalability (planned isometric):** Up to 5 of each building type. More refineries/factories = faster resource production but slower Dyson output. Starcraft-lite investment tradeoff: workers vs output. Layout decisions matter (miners return to nearest refinery via static paths).

**Solar events:** CME events every ~80-120 game years. Visible 15-20 years in advance. Hit: unshielded Dyson panels take damage (maintenance cost), unshielded Mercury infrastructure loses production temporarily. Planets with magnetic umbrellas protected. Response choice: reinforce infrastructure before hit, accept hit and repair after, or cluster Dyson panels into protective configuration (reduces energy output during event). Damage proportional to scale, not punishing.

**Late Mercury options:**
- Machine World (Builder path): sterile, optimised, permanent production bonus
- Garden World (Terraformer path): terraform using Venus nitrogen surplus + Dyson shade panels. Artificial day/night cycle. Strange and honest about being engineered.
- Stellar engine construction yard: same mass driver infrastructure, civilisation-scale output (post-V1)

---

## MARS
Role: first terraforming target. Emotional core of game. Clearest arc from barren to living.

**Terraforming paths (choose at game start):**
- Path A — Orbital Laser Arrays: 80yr atmospheric phase. Fastest warming. Builds orbital infrastructure.
- Path B — Statite Mirror Array: 120yr, cheaper in Mercury components, no orbital infrastructure.
- Path C — Polar Nuclear Detonations: 20yr, fastest, no reusable infrastructure, most philosophically complex culture events.

**Full step sequence:**
1. Barren Mars → choose warming path
2. Warming Mars (Atmospheric Thickening, 80yr) → choose magnetic protection
3. Shielded Mars (Magnetic Protection, 30yr) → choose water delivery
4. Wet Mars (First Oceans, 70yr) → begin Bio Phase I
5. Bio I — Ocean Seeding (30yr) → commit to Bio II
6. Bio II — Soil Preparation (25yr) → commit to Bio III
7. Bio III — Coastal Pioneers (20yr) → commit to Bio IV
8. Bio IV — Inland Spread (35yr) → declare self-sustaining
9. New Mars — terraforming complete

Bio IV "Inland Spread" (35 years) initiates inland colonisation, does not complete a mature ecosystem. At terraforming complete, Mars has: pioneer vegetation and low-growth plants, early tree species at 3-5 metres, established insects, first fauna waves released from coastal biodomes. Not a lush world — a young world. Maturation continues across post-terraforming discovery events over subsequent centuries.

Animal introduction mechanisms: biodomes as primary staging environments (complete food chains established before open release), shipped embryos and insect colonies from Earth and Moon, Mars-born generations already existing in domes by Bio IV. Large fauna above small mammal scale appears only in post-terraforming discovery events. Dome walls are not removed all at once — sections open gradually, animals find their own way into the landscape.

**Spillover triggers from Mars steps:**
- Step 4→5: mars_ocean → unlocks Moon Organism Library Tier 2
- Step 5→6: mars_soil → unlocks Earth Soil Restoration
- Step 6→7: mars_coastal → unlocks Earth Rewilding

**Key culture events:** First Dust Storm Season, First Water Ice, First Rain on Mars (14:23 local time, 2.3mm), Children of Mars census (847 Mars-born children, "too blue"), First Insects, Red Season, 34,000 Martians.

**Dome colonisation:** Available after Earth's Dome Tech researched. Player-initiated action (build launch complex, assemble crew, commit). Dome teardown sequence when atmosphere crosses breathable threshold — each dome coming down is a culture event. Last dome is a major one.

**Post-terraforming:** First open-air city founding, ecosystem micro-events every ~50 years, population milestones, underground drilling for ancient life (finds 3-billion-year-old fossil traces — "we're the second life on this planet").

**Sub-planet bodies affecting Mars:**
- Europa ice: water delivery option (disrupts Europa's ocean, reduces Hunt for Life discovery chance)
- Titan nitrogen: atmosphere source (strips Titan permanently, locks Titan terraforming forever)

---

## VENUS
Role: second terraforming planet. Harder emotional sell than Mars. Longer arc. More alien end state.

**Terraforming paths:**
- Path A — Wild Venus: atmospheric terraforming only. Slow rotation accepted. Climate bands, terminator zone cities, moving cities on rail loops. ~400-600yr.
- Path B — Managed Venus: orbital mirror array for artificial day/night. Most Earth-like climate without spin-up. Ongoing mirror maintenance permanent. ~450-650yr.
- Path C — Spun Venus: Europa impact for angular momentum + water. Must decide before Year 100 or option closes permanently. Most Earth-like Venus possible. ~700-1000yr. Moral weight: may have destroyed life on Europa.

**Full step sequence:**
1. Hell Planet → choose cooling method
2. Cooling Venus (Shade Mirror, 100yr) → choose CO₂ removal
3. Thinning Venus (CO₂ Removal, 80yr) → choose water delivery [spillover: venus_carbonate fires here]
4. Water Venus (Hydrosphere, 90yr) → begin Bio Phase I
5. Bio I — Ocean Microbe Seeding (35yr)
6. Bio II — Atmospheric Oxygen (30yr)
7. Bio III — Coastal Ecosystems (25yr)
8. Bio IV — Inland Colonisation (40yr) → declare self-sustaining
9. Living Venus — complete

**Spillover triggers from Venus:**
- Step 2→3: venus_carbonate → unlocks Earth CO₂ Drawdown + Earth Ocean Acidification Reversal

**Key culture events:** The Long Cooling, Carbonate Rain Begins, Below 200°C threshold, First Rain on Venus (not acid — confirmed), Cities of the Terminator, First Green Shore, They Had Been Venusians (two generations before anyone stood on the surface).

**Sky cities:** Early colonisation at 50km altitude where conditions are near Earth-like. As terraforming thins atmosphere, cities lose buoyancy. Player decision: controlled descent / structural conversion / preserve as heritage with active lift (expensive, beloved by Terraformers).

---

## VENUS — significant structural corrections ##
Shade mirror is mandatory, not a choice. It is the prerequisite for all Venus terraforming regardless of path. Cannot cool Venus without first reducing solar input. Not presented as an option at Venus Initial State.
Vortex engines are an accelerant, not a path alternative. They redistribute existing atmospheric heat to speed up CO₂ removal. They are a Mercury-built optional component queued during Step 2, similar to how additional orbital laser satellites accelerate Mars warming. Not a player path choice. Not mandatory.

Corrected Venus step sequence:
- Hell Planet → shade mirror deploys automatically on Venus unlock (mandatory, no choice)
- Cooling Venus (shade mirror active, 100yr) → choose CO₂ removal method:
  - Path A: Carbonate catalyst seeding (recommended) — CO₂ precipitates as limestone, byproduct exported to Mars as rocket fuel
  - Path B: CO₂ mass driver export — faster removal, higher energy cost, no byproduct
  - Vortex engines available as optional Mercury-built accelerant during this phase regardless of path choice
- Thinning Venus (CO₂ removal, 80yr) → choose water delivery [venus_carbonate spillover fires here]
- Water Venus → Bio Phase I begins 5-8. Bio phases I-IV as before
- Living Venus — complete

Sky cities and vortex engines are parallel tracks, not sequential dependencies. Sky cities arrive as colonisation option once carbonate seeding has sufficiently changed 50km altitude chemistry (acid clouds clearing). Vortex engines assembled by orbital construction robots — no sky cities required. The two systems do not block each other.
Sky city altitude management as atmosphere thins: active lift using Dyson swarm electrical power (conventional technology, no fusion required). Architect solution: keep cities floating artificially with industrial power. Naturalist solution: controlled descent to surface once temperatures allow. Heritage solution: maintain with active lift permanently at ongoing power cost. No path requires fusion technology.
Path A → Path B mid-game pivot: permitted. Triggered by a specific culture event when railed city reaches a certain age and player has sufficient Dyson capacity for mirror deployment. Costs significant Mercury production. Takes real game time. Once mirrors create artificial day/night cycle, railed city becomes optional rather than mandatory — player then chooses to continue it, convert to stationary structure, or decommission. Culture event acknowledges pivot honestly, not triumphantly.
Terminator rail system failure: one-time narrative event, not recurring maintenance task. Three outcomes when event fires: full rail replacement (Mercury ore cost, city continues), convert to stationary structure (surface temperatures now allow it), or decommission with heritage acknowledgement.
Stopping the railed city is not a survivable option while Venus is still hostile outside the terminator zone. Option only exists after mirrors have created tolerable surface conditions elsewhere.

---

## BIOLOGICAL PHASE MANAGEMENT (Mars + Venus)
Longest single wait split into sequential committed sub-steps. Once committed, a step runs and cannot reverse. While current step runs, player engineers next package. ~110yr total for Mars bio phases, ~130yr for Venus.

**Biological composition interface (TBD full design):** Organism palette (8-12 categories: pioneer bacteria, nitrogen-fixers, decomposers, early plants, insects, small fauna, synthetic organisms). Each has requirements and outputs. Player drags combinations into projected ecosystem view. Stability forecast shown. Commit. Outcome differs slightly from projection. Moon base organism library investment improves options and projection accuracy.

**Pioneer domes:** 20-30yr before open seeding, player can run live organism trials in enclosed surface domes. Results inform full seeding decision.

---

## POWER HIERARCHY
| Source | Role | Constraint |
|---|---|---|
| Mercury solar | Local Mercury only | Surface-bound |
| Dyson swarm | Civilisation-wide, infinite scaling | Requires construction + maintenance |
| Deuterium fusion | High-intensity local applications | Deuterium supply chain |
| He-3 fusion | Premium + transport drives | He-3 supply chain (Jupiter) |

**Bootstrap:** Fusion ignition requires 15% Dyson swarm output. Cannot skip swarm to get fusion.
**Earth's sunlight protected:** Dyson panels distributed to avoid Earth's 0.000000045% slice. No dimming of Earth.
**Star-lifting:** Not in V1. DLC arc. Without it, Europa crash and Titan nitrogen strip are permanent irreversible decisions.

---

## RESOURCE ECONOMY
| Resource | Source | Use |
|---|---|---|
| Common ore | Mercury mining | All construction |
| Rare metals | Mercury specific deposits | Advanced components, Dyson panels |
| Polar volatiles | Mercury shadowed craters | Life support |
| Deuterium | Earth oceans | Fusion fuel (early era) |
| He-3 | Jupiter/Saturn aerostats | Fusion fuel (premium era) |
| Europa ice | Europa redirect | Mars/Venus water (mutually exclusive) |
| Titan nitrogen | Titan strip | Mars/Venus atmosphere (permanent) |
| Research Points | Population (Earth + colonies) | Tech unlocks |

**Cross-planet flows:**
- Venus CO₂ → Mars rocket fuel
- Mercury components → all orbital structures
- Restored Earth ecosystems → better organism candidates for seeding

**When short on resources:** Phase never reverts. Dialog shows current vs required with shortcut to Mercury queue. Resources visible in HUD once cross-planet flows begin (not before).

**Material sourcing choice (Terraformer/Builder tension expression):** At each major construction commit, choose recycled Earth legacy materials (cheaper, slower, Terraformer CE, Earth restoration bonus) or fresh asteroid resources (faster, more Mercury capacity, Builder CE, efficiency bonus). ~15-20 times per playthrough. Pattern shapes culture events and late-game options.

**Entropy:** Dyson panels accumulate micrometeorite damage. Processors fail. Orbital structures drift. Does NOT apply to terraformed planets (self-sustaining once established). Mercury maintenance becomes late-game tension.

---

## TRANSPORT PROGRESSION
| Era | Speed | Unlock |
|---|---|---|
| Chemical rockets | 6-9mo Earth→Mars, 26mo windows | Game start |
| Skyhooks + Cyclers | Regular passenger service | Mid early game |
| Ion/Laser sail | 2-3mo Mars, outer solar accessible | After Dyson 20%+ |
| Fusion drives | Days anywhere, ~10%c interstellar | After He-3 fusion |

Launch windows based on visual orbit alignment in the orrery, not realistic orbital mechanics. Window open = normal cost and travel time. Window closed = mission still possible, arrives later. Time is the only cost — no resource or fuel penalty (no propellant tracked at this level). Fusion drives: windows disappear permanently, UI element removed, culture event acknowledges this.
Ships as dots in solar system orrery: colonist ships, ice deliveries, component runs shown as small dots on curved paths. Different dot types per cargo category. Paths are curved and physically plausible-looking, not straight lines. Travel time across orrery takes a few real seconds — player registers the activity, exact accuracy irrelevant. Early game = 1-2 dots. Late game = system full of them. Visual density communicates civilisational scale without UI numbers.
Rocket fuel: chemical rockets use volatiles as propellant source (water electrolysis on Mercury — H₂ and O₂ from polar ice). Volatiles are consumed by rocket launches as a light cost alongside their other uses. Not a separate fuel resource. Once mass driver exists, rockets reserved for crew transfers and precision cargo only. Nuclear thermal rockets: not in the game, not a transport era. The four-era table in the GDD (chemical → skyhooks+cyclers → ion/laser sail → fusion drives) is canonical.


**Launch windows:** Visual orbit alignment in orrery used (not realistic orbital mechanics). Window = when Earth/Mars visually align (~42 real seconds apart). Window open = normal cost. Window closed = mission still possible, arrives later (time is the cost, no extra resource). Fusion drives: windows disappear permanently (UI element removed, culture event acknowledges this).

**Ships as dots in orrery:** Colonist ships, ice deliveries, component runs shown as small dots on curved paths in solar system view. Early game = 1-2 dots. Late game = system full of them. Visual density communicates civilisational scale without UI numbers.

**Outer planet lock:** Jupiter inaccessible until fusion drives. He-3 therefore a meaningful mid-game unlock.

---

## NOTIFICATION SYSTEM
Three tiers:
- **Pause-and-present:** Major decisions, irreversible choices. Game pauses (configurable).
- **Ping-and-queue:** Culture events, milestone achievements, spillover notifications. Toast appears bottom-left, persists 6s, clickable. Bell icon in HUD shows unread count.
- **Ambient:** Background state changes visible in planet visuals. No notification.

**History book:** Every culture event appended with timestamp, planet context, vignette state at time. Accessible from HUD any time. Older entries faded. Clicking reconstructs vignette at that terraforming stage.

**Culture events do NOT pause the game.** They queue. Player reads at own pace.

---

## PHILOSOPHICAL TENSION — NATURALISTS vs ARCHITECTS
The distinction is approach and relationship with natural processes, not whether you terraform (everyone terraforming). Naturalist = working with natural processes over deep time, patience, wild outcomes. Architect = designed systems, control, efficiency, intentionality. Neither is wrong.

Expressed as a tagging system, not a resource mechanic or repeated forced choice. Each major decision is tagged automatically based on what the player chose. No mechanical penalty or bonus. No repeated binary choices. At First Era Complete, summary shows ratio descriptively: "your civilisation leaned Naturalist — 11 of 17 major decisions favoured natural processes." Valid at any ratio including mixed.

Examples of tagged decisions: Path A Mars warming = Naturalist. Mirror Mars = Architect. Wild Venus end state = Naturalist. Managed Venus = Architect. Sky city preservation = Naturalist. Sky city descent to surface = Architect. Europa preservation = Naturalist. Europa crash = Architect. Heritage materials for construction = Naturalist. Fresh asteroid resources = Architect.

---

## EUROPA DECISION
Game's most morally complex moment. Path C Venus requires Europa impact for spin-up. Decision window closes Year 100. At decision time, Europa's biological status is formally unknown (Clipper data: organic chemistry, no definitive biosignatures).

Europa redirect for Venus Path C must be decided before Year 2133 (game Year 100). This is a design rule, not a physics simulation. Justification stated in-game as: the required multi-decade gravity assist sequence and trajectory calculations become geometrically unfeasible after this point.

Europa redirect and shade mirror deployment are parallel early-game activities, not sequential. Player authorises Europa mission in opening years, Mercury queues impactor packages and solar sail tugs, shade mirror deployment proceeds normally in parallel. Europa impact arrives as dramatic mid-game event decades of game-time later.

Culture event fires in two parts: warning 10-15 game years before impact ("trajectory locked, Europa arrives in approximately 12 years"), then impact event itself. The gap between these is where moral complexity lives.

**Permanent unknowing:** Players who crash Europa never know in that playthrough whether life existed there.

**Hunt for Life outcomes (fixed, not randomised):**
- Europa (not crashed): Active chemotrophic life confirmed. Game's largest revelation.
- Enceladus: Active life at hydrothermal vents. Independent of Europa.
- Mars subsurface (post-terraforming): Ancient fossil traces, 3 billion years old. Not alive now.
- Titan: Nothing found. Knowledge bonus + philosophical CEs.

**Second playthrough:** If player discovered Europa life in a previous run, specific CE fires when they choose to crash it again.

---

## PATH LOCKING
Permanently locked (physical irreversibility): Europa crash, Titan nitrogen strip, Mars polar detonations. The physical act cannot be undone. These are locked because the act is irreversible, not because of path logic.

Not locked (infrastructure is additive): Adding orbital mirrors to Path A Venus mid-game. Adding magnetic umbrella to Path C Mars. Any infrastructure layered on top of an existing path. Early choices have lasting narrative consequences expressed through culture events and history book entries, but not mechanical locks preventing improvement.

Design principle: physical acts are irreversible, infrastructure decisions are not.

---

## RESEARCH POINTS (RP)
RP functions as research capacity, not a spendable resource. Running a research track occupies RP capacity until the track completes, then frees it back up. Player cannot start a new track if insufficient free capacity exists.

Capacity determined by population — grows as Earth and colony populations grow. Early game: ~60 total RP (2-3 simultaneous tracks). Late game: 150+ RP (many simultaneous tracks). Constraint eases naturally as game progresses.

Track RP costs reflect complexity and team size required. Simple tracks: 20 RP. Standard tracks: 30-40 RP. Complex tracks: 50-80 RP. These are approximate — tune for feel once content is complete.

Effect: player must choose which tracks to run first. Decision has real consequences. Cannot click entire tech tree simultaneously.

---

## FERMI SILENCE
At ~30% Dyson swarm, Sun anomalous in infrared. Humanity detectable within ~150 light years. No signals received. Three choices: Broadcast (optimistic, accelerates listening research) / Go Quiet (slows some research) / Continue as Normal (debate as cultural undercurrent). Nothing ever answers. Choice shapes civilisation character and CE chains. (V1 candidate — may defer to post-V1.)

---

## HUNT FOR LIFE ARC
Post-first-era research arc. Systematic search of solar system for existing/past biology. Enabled by advanced probe + drilling tech developed through game. Three phases: remote sensing → deep investigation → outcomes. Information lag applies (Enceladus mission: 3-4yr data return).

---

## TIME & PACING
- 1 game-year = 2 real seconds at 1×
- Speed controls: 1× always, 5× after game start or in DLC. First playthrough is the authored experience at base speed. Subsequent playthroughs give speed agency for players already familiar with events and vignettes.
- Visual orbit speed decoupled from game speed
- Dead zone prevention: Moon research tracks, Earth tech tree, Mercury queue management, biological sub-step engineering, culture event history browsing, multi-location vignette browsing

---

## UI PRINCIPLES
- Retro-functional. Monospaced typography. Dark backgrounds, warm amber/orange accents. Mission control aesthetic.
- All font sizes in em. Base 14px.
- Planet panel: all planets visible from start, locked ones show status message.
- Living planet visuals: sphere colours, atmosphere thickness, city lights driven by shader parameters updated from terraforming progress variables. Stats interpolate in real time during active phases.
- Partial visibility on tech trees: unlocked = full colour, one ahead = muted, two ahead = silhouette, beyond = nothing.
- Vignettes: layered 2D compositions, 4-6 states per location, crossfaded at milestone triggers. Progression via palette/asset swap, not full redraws. Placeholder CSS gradients → swap for actual images via class name.

---

## ART DIRECTION
- Pixel art filter over 3D (Godot post-processing shader on 3D viewport)
- Stepped animation at 6-8fps, variable frame hold (extreme positions held longer)
- Bold committed palettes per planet. Warm and vibrant.
- Workflow: AI generates variations from prompt → Jos redraws best ones in own artstyle
- Culture event cards: left portrait vignette (3:4 ratio) + text right. Shareable as PNG (post-V1).

---

## SOUND
Parameter-driven audio bus per planet per terraforming state. Parameters: atmospheric pressure, wind intensity, precipitation, biology level, human presence. Same base recordings shaped by processing to match each planet's physics. Mercury: NO ambient sound (no atmosphere) — structural/mechanical only, silence used deliberately.

---

## QUIET FAILURE / NO GAME OVER
Poor decisions diminish the game, never end it. At First Era Complete: honest solar system overview of what was built. Flourishing run = three living worlds, complete swarm, seed ships. Diminished run = marginal progress, a civilisation that survived but never quite reached. No failure screen.

---

## POST-V1 / DLC
Outer solar system (Jupiter, Saturn, Titan, Callisto, Ceres), Hunt for Life full arc, Dyson sphere completion → Type 2, stellar engine (Shkadov + Caplan), interstellar seed ships + information lag, Mercury redemption arc, star-lifting, black hole energy harvesting, procedural star systems, full mobile, statite resort prestige project.

---

## COMMERCIAL
€12.99 launch. Steam PC primary. Devlog from early (Reddit, X, TikTok). Steam page ~12mo before launch. Steam Next Fest. Mid-size YouTube outreach (10k-500k, space/science/strategy). Kickstarter only after 12+ months devlog with demonstrated audience.

**Key differentiator:** Peaceful + scientifically grounded + civilisation-scale. No direct competitor hits all three simultaneously.

---

## OPENING / CLOSING IMAGE
**Opening:** Earth from space. Small. Blue. Alone.
**Closing:** Same camera. Multiple living worlds. Faintly dimmed Sun. Warm atmospheric signatures. Habitat rings near Jupiter. A faint beam pointing toward another star. Whatever the player chose not to do is also visible in its absence. No score. No grade. Just the view.

---
*Compressed for AI context. Source: helioscape-gdd-v03.md + session discussions April 2026.*
*For full narrative examples, tone samples, and science detail: request specific sections.*
