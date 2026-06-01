## RESOURCE ECONOMY — ORE RATES AND COSTS

### Ore Types
- **Common ore (C):** iron, silicon, aluminium. Abundant, all standard construction.
- **Rare metals (R):** titanium, chromium. Specific crater deposits, advanced components.
- **Polar volatiles (V):** water ice, carbon compounds. Life support, organic chemistry, rocket propellant.

### Base Mining Rates (per miner, per game year)
| Ore type | Rate |
|---|---|
| Common ore | 150 units |
| Rare metals | 30 units |
| Polar volatiles | 25 units |

Additional miners multiply linearly. Maximum 5 of each building type on Mercury.

### Refinery / Fabricator Bottleneck
One refinery saturates at roughly 3 miners worth of input. One fabricator saturates at roughly 2 refineries worth of output. Effective miner cap is therefore 15 (5 refineries × 3 miners each) — mining beyond this produces ore that cannot be processed. UI shows warning when miners exceed refinery capacity.

Fabricator build speed (diminishing returns on multiples):
| Fabricators | Build speed multiplier |
|---|---|
| 1 | 1.0× (base) |
| 2 | 1.4× |
| 3 | 1.8× |
| 4 | 2.1× |
| 5 | 2.3× |

### Component Ore Costs (all V1 buildables)
C = common ore, R = rare metals, V = polar volatiles.

**Mercury Phase 0**
| Component | C | R | V | Notes |
|---|---|---|---|---|
| Landing pad | 200 | 20 | 0 | Partially pre-seeded by rocket payload |
| Power cell (fission reactor) | 300 | 80 | 0 | High rare metals for reactor vessel |
| Mining drone (per unit) | 150 | 30 | 0 | First unit arrives with mission |

**Mercury Phase 1**
| Component | C | R | V | Notes |
|---|---|---|---|---|
| Refinery | 800 | 120 | 0 | Large structure, mostly common ore |
| Fabricator | 600 | 200 | 20 | Precision machinery, high rare metals |
| Solar array expansion (per unit, max 5) | 400 | 60 | 0 | Supplements fission reactor |
| Rare metals mine | 300 | 40 | 0 | Costs ore to access more ore |

**Mercury Phase 2**
| Component | C | R | V | Notes |
|---|---|---|---|---|
| Mass driver | 2000 | 500 | 100 | Most important single structure in the game |
| Polar volatiles drill | 400 | 80 | 0 | Unlocks V income + propellant production |

**Dyson Panels**
| Tier | C | R | V | Notes |
|---|---|---|---|---|
| Basic (per 1000) | 600 | 200 | 0 | Available from production start. CME-vulnerable. |
| Mid-tier (per 1000) | 700 | 300 | 0 | Unlocks at Type 1 milestone (fusion online). More durable. |
| Hardened (per 1000) | 700 | 300 | 150 | Unlocks when Jupiter He-3 mining established. CME-immune. |

Existing panels are not retrofitted — they degrade naturally and are replaced at the current tier. Swarm composition stat visible to player (% basic / mid / hardened). Player can deliberately queue replacement over expansion to accelerate hardening — tradeoff against swarm growth rate.

**Terraforming Components**
| Component | C | R | V | Notes |
|---|---|---|---|---|
| Orbital laser satellite (per unit, ~12 for full array) | 300 | 150 | 0 | Each unit added accelerates Mars warming rate |
| Statite / shade mirror panels (per 100) | 200 | 50 | 0 | Gossamer-thin, low material cost per unit |
| Magnetic umbrella coil segment (per unit, ~8 for full array) | 400 | 600 | 80 | Most rare-metal-intensive V1 component. Superconducting coil requirements. |
| Skyhook (per planet) | 1500 | 400 | 100 | Built in orbit, assembled from segments. First unit at each planet is rocket-bootstrapped. |
| Venus vortex engine (per unit, ~4 needed) | 500 | 300 | 40 | Assembled in upper atmosphere by orbital robots. No sky cities required. |
| Europa impactor package | 800 | 400 | 200 | Path C Venus only. One-time cost. |
| Solar sail tug (per unit, ~6 for Europa redirect) | 600 | 100 | 0 | Mostly common ore, thin sail structure. |

### Rocket Propellant
Chemical rockets use volatiles as propellant source. Water electrolysis on Mercury (H₂ and O₂ from polar ice) produces propellant in-situ. Volatiles are consumed by rocket launches as a light ongoing cost alongside their other uses. Not a separate tracked fuel resource. Once mass driver is operational, rockets are reserved for crew transfers and precision cargo only — bulk cargo moves via mass driver.

### Power Economy
Each Dyson panel generates **10 GW** continuously. Power consumption is tracked once Dyson production begins. Two values shown in HUD: generated watts and consumed watts. Surplus is available for new construction and expansion.

**Power consumption by component:**
| Component | Draw | Notes |
|---|---|---|
| Mercury mining drone (per unit) | 1 MW | Covered by fission reactor entirely in early game |
| Mercury refinery (per unit) | 500 MW (0.5 GW) | |
| Mercury fabricator (per unit) | 300 MW (0.3 GW) | |
| Mercury mass driver | 5 GW during launch, 0.1 GW idle | Spike during launch only |
| Orbital laser satellite (active, per unit) | 50 GW | Only during warming phase, then drops |
| Orbital laser satellite (idle) | 0.05 GW | Station-keeping only |
| L1 magnetic umbrella (full array) | 80 GW | Continuous once deployed |
| Venus shade mirror | 0 | Passive reflective structure |
| Vortex engine (per unit, 4 needed) | 200 GW each / 800 GW total | Largest V1 power consumer. Path A Venus vs carbonate seeding (Path B, no vortex engines) is therefore also a power economy decision. |
| Mars dome life support (per dome) | 2 GW | |
| Venus sky city (per city) | 15 GW | Active lift not yet required |
| Sky city active lift (per city, as atmosphere thins) | 60 GW | Powered by Dyson swarm, no fusion required |
| Railed city drive system | 40 GW | Continuous, permanent |
| Ion tug (per vessel) | 0.5 GW | |
| Skyhook reboost (periodic) | 3 GW during cycle | Not continuous |
| Stellar engine (full operation) | ~10²⁵ GW | Post-V1 |

**Power shortage handling:** shortage is an edge case, not a designed failure state. Priority allocation if it occurs:
- Always on (never cut): railed city drive systems, sky city life support, dome life support, L1 magnetic umbrella, Mercury base operations.
- Reduced first: ion tug fleet speed, mass driver launch rate, vortex engine output.
- Idle immediately: orbital lasers once warming phase complete, non-critical construction robots.

Power microwave / laser transmission from Dyson swarm to planet receiving stations is background infrastructure — not a mechanic, acknowledged in one culture event when first Mars transmission occurs.

---

## ORBITAL INFRASTRUCTURE STACK

### Bootstrap Principle
Each infrastructure tier makes the next tier cheaper to build. The player feels this progression — early game everything is rocket-dependent and expensive, late game the system runs itself.

### How Components Reach Orbit and Transit Between Planets

**Rockets (Era 1 — always available)**
Used for: first Mercury skyhook construction, first planetary skyhooks at Mars and Venus, crew transfers throughout the game, precision cargo. Consume volatiles as propellant. Once mass driver is operational, rockets are reserved for these specific use cases only. Nuclear thermal rockets are **not** a separate transport era — the four-era transport table is canonical.

**Mass driver (available after Mercury Phase 2)**
Launches small-to-medium components to Mercury orbit: Dyson panels, orbital laser satellites, mirror segments, solar sail tugs, Europa impactor packages, maintenance craft. Cannot launch components too heavy or dense to survive the acceleration profile (superconducting coil segments, large machinery). Ion drive tugs carry mass-driver-launched components from Mercury orbit to their destination over months to years of transit time.

**Mercury skyhook (rocket-bootstrapped, mid-game)**
Lifts heavy components from Mercury surface to Mercury orbit: magnetic umbrella coil segments, vortex engine sections, anything too dense for the mass driver. One-time expensive rocket-bootstrapped construction. After it exists, all subsequent heavy lift from Mercury surface is cheap. The bootstrapping cost — building the first skyhook without a skyhook — is the single largest one-time Mercury investment in the game.

**Planetary skyhooks at Mars and Venus (rocket-bootstrapped per planet)**
Mass driver launches components to Mercury orbit. Rocket transfer stage carries them to Mars or Venus orbit. Once a planetary skyhook exists, local surface-to-orbit at that planet is cheap. Enables colonist rotation and cargo export from planetary surfaces.

### Assembly at Destination
Large orbital structures (orbital laser array, L1 magnetic umbrella, Venus shade mirror, Venus L1 shade structure) are assembled in situ by construction robots. Components arrive individually via ion tug over months to years. Structures come online incrementally as components arrive — first unit starts the terraforming phase, each additional unit increases effectiveness or rate. Assembly happens at the destination orbit, not at Mercury.

Vortex engines for Venus are assembled in the upper atmosphere (50km altitude band) by orbital construction robots. No sky cities required. Sky cities are a parallel colonisation track, not a terraforming prerequisite.

### Era Summary
| Era | Heavy lift method | Primary use |
|---|---|---|
| Pre-mass driver | Rockets only, volatile fuel cost | Bootstrap equipment, first structures |
| Post-mass driver | Mass driver + ion tugs | Dyson panels, laser satellites, mirror segments |
| Post-Mercury skyhook | Skyhook for heavy components, mass driver for standard | Magnetic umbrella, vortex engines |
| Post-planetary skyhooks | Local cheap lift at Mars and Venus | Colonist rotation, surface cargo export |
| Fusion drive era | Anywhere to anywhere quickly | All cargo, windows irrelevant, He-3 fuel |

**The mass driver is the most important single piece of infrastructure in the game.** Everything before it is rocket-dependent. Everything after it is primarily mass-driver-based.

### The Mass Driver Queue
Visible to player at all times. Shows what is being launched and in what priority order. Dyson panels auto-queue as the permanent lowest-priority item. Everything manually queued above panels gets priority first. When manual queue empties, panel production resumes automatically. Player can pause auto-queue to accumulate resources for a large construction. The queue is the core Mercury management decision made concrete — not an abstract slider, a literal launch schedule the player prioritises.

---

## INFRASTRUCTURE HEALTH

### Scope
Applies to orbital infrastructure: L1 magnetic umbrella, orbital mirror arrays, skyhooks, vortex engines, railed city drive system. Does **not** apply to terraformed planet biospheres (self-sustaining once established) or to Mercury base buildings (handled via production rate, not health stat).

### Display
Effectiveness stat visible in the relevant planet's inspect view alongside atmospheric data. Example: **L1 UMBRELLA — 94% EFFECTIVENESS**. Slow-moving indicator, decades per meaningful tick. Player does not need to monitor constantly.

### Notification Thresholds
| Effectiveness | Response |
|---|---|
| Below 60% | Ping-and-queue warning fires |
| Below 30% | Pause-and-present decision fires |

At 30% the player chooses: queue a maintenance mission from Mercury (resets effectiveness to 100%, costs ore) or dismiss and accept consequences.

### Consequences of Neglect
Atmospheric erosion or reduced component effectiveness shows in planetary stats. At 0% L1 umbrella, Mars atmosphere loses approximately **0.5% pressure per game century** — visible and meaningful but never instantly catastrophic. Population growth stalls on affected planet. Culture events reflect decline. Colonists leave voluntarily over time — colony shrinks, does not die catastrophically. No evacuation mechanic required.

**Degradation floor:** atmosphere built over centuries does not vanish within any realistic session even at 20× speed. Player always has time to respond. This is consistent with the quiet failure philosophy — poor decisions diminish the game, they do not end it.

### CME Interaction
CME events compound with degradation. A hardened infrastructure component ignores CMEs entirely. Mid-tier takes partial CME damage. A basic or already-degraded component hit by a CME takes compounding damage — the two systems interact to create genuine crisis if both neglected simultaneously. This is the primary scenario where infrastructure health becomes urgent rather than merely something to monitor.

### Mandatory Maintenance
**Not implemented.** The pause-and-present notification at 30% is the designed intervention point. If dismissed and ignored, the game resolves the neglect gracefully through stat drift and culture events. No recurring maintenance tasks, no mandatory repair obligations. Consistent with quiet failure philosophy.

### Three Maintenance Scales
| Scale | Mechanic | Cadence |
|---|---|---|
| Background rate | Dyson panel entropy, invisible to player, resolved by tier upgrades not tasks | Continuous |
| Periodic allocation decision | Orbital mirrors, fusion reactor efficiency — slow indicator drifts, player chooses when to queue maintenance mission from Mercury | Every 80–150 game years roughly |
| One-time narrative event | Terminator rail system age event, Venus sky city descent decision, Mercury base 200-year event — fires once per infrastructure type, multiple meaningful outcomes | Once per game |

Maintenance never appears as a recurring identical task. Each maintenance moment either resolves permanently via upgrade (stops happening) or is a unique narrative event that changes the infrastructure permanently (never repeats).

### Maintenance Mission Cost (approximate)
Queuing a maintenance mission from Mercury costs common ore and occupies mass driver capacity for one launch cycle. Exact costs scale with the infrastructure being maintained — a skyhook maintenance run costs more than an orbital mirror check. These costs are small relative to component construction costs. Maintenance is never a resource crisis, just a periodic allocation decision.
