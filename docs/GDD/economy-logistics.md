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

Additional miners multiply linearly. Max 5 of each building type on Mercury.

### Refinery / Fabricator Bottleneck
1 refinery saturates at ~3 miners input. 1 fabricator saturates at ~2 refineries output. Effective miner cap = 15 (5 refineries × 3 miners each) — mining beyond this produces unprocessable ore. UI warns when miners exceed refinery capacity.

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
| Power cell (fission reactor) | 300 | 80 | 0 | High R for reactor vessel |
| Mining drone (per unit) | 150 | 30 | 0 | First unit arrives with mission |

**Mercury Phase 1**
| Component | C | R | V | Notes |
|---|---|---|---|---|
| Refinery | 800 | 120 | 0 | Large structure, mostly C |
| Fabricator | 600 | 200 | 20 | Precision machinery, high R |
| Solar array expansion (per unit, max 5) | 400 | 60 | 0 | Supplements fission reactor |
| Rare metals mine | 300 | 40 | 0 | Costs ore to access more ore |

**Mercury Phase 2**
| Component | C | R | V | Notes |
|---|---|---|---|---|
| Mass driver | 2000 | 500 | 100 | Most important single structure in game |
| Polar volatiles drill | 400 | 80 | 0 | Unlocks V income + propellant production |

**Dyson Panels**
| Tier | C | R | V | Notes |
|---|---|---|---|---|
| Basic (per 1000) | 600 | 200 | 0 | From production start. CME-vulnerable. |
| Mid-tier (per 1000) | 700 | 300 | 0 | Unlocks at Type 1. More durable. |
| Hardened (per 1000) | 700 | 300 | 150 | Unlocks when Jupiter He-3 established. CME-immune. |

Existing panels not retrofitted — degrade naturally, replaced at current tier. Swarm composition stat visible (% basic/mid/hardened). Player can queue replacement over expansion to accelerate hardening — tradeoff vs swarm growth rate.

**Terraforming Components**
| Component | C | R | V | Notes |
|---|---|---|---|---|
| Orbital laser satellite (per unit, ~12 for full array) | 300 | 150 | 0 | Each unit added accelerates Mars warming |
| Statite / shade mirror panels (per 100) | 200 | 50 | 0 | Gossamer-thin, low material cost per unit |
| Magnetic umbrella coil segment (per unit, ~8 for full array) | 400 | 600 | 80 | Most R-intensive V1 component. Superconducting coil reqs. |
| Skyhook (per planet) | 1500 | 400 | 100 | Built in orbit from segments. First unit rocket-bootstrapped. |
| Venus vortex engine (per unit, ~4 needed) | 500 | 300 | 40 | Assembled in upper atmosphere by orbital robots. No sky cities required. |
| Europa impactor package | 800 | 400 | 200 | Path C Venus only. One-time cost. |
| Solar sail tug (per unit, ~6 for Europa redirect) | 600 | 100 | 0 | Mostly C, thin sail structure. |

### Rocket Propellant
Chemical rockets use volatiles as propellant. Water electrolysis on Mercury (H₂/O₂ from polar ice). Volatiles consumed by launches as light ongoing cost alongside other uses. Not separate tracked resource. Once mass driver operational, rockets reserved for crew transfers + precision cargo only.

### Power Economy
Each Dyson panel generates **10 GW** continuously. HUD shows generated watts vs consumed watts. Surplus available for new construction.

**Power consumption by component:**
| Component | Draw | Notes |
|---|---|---|
| Mercury mining drone (per unit) | 1 MW | Covered by fission reactor in early game |
| Mercury refinery (per unit) | 500 MW (0.5 GW) | |
| Mercury fabricator (per unit) | 300 MW (0.3 GW) | |
| Mercury mass driver | 5 GW during launch, 0.1 GW idle | Spike during launch only |
| Orbital laser satellite (active, per unit) | 50 GW | During warming phase only, then drops |
| Orbital laser satellite (idle) | 0.05 GW | Station-keeping only |
| L1 magnetic umbrella (full array) | 80 GW | Continuous once deployed |
| Venus shade mirror | 0 | Passive reflective structure |
| Vortex engine (per unit, 4 needed) | 200 GW each / 800 GW total | Largest V1 power consumer. Path A vs carbonate seeding (Path B, no vortex) = power economy decision. |
| Mars dome life support (per dome) | 2 GW | |
| Venus sky city (per city) | 15 GW | Active lift not yet required |
| Sky city active lift (per city, as atmosphere thins) | 60 GW | Dyson-powered, no fusion required |
| Railed city drive system | 40 GW | Continuous, permanent |
| Ion tug (per vessel) | 0.5 GW | |
| Skyhook reboost (periodic) | 3 GW during cycle | Not continuous |
| Stellar engine (full operation) | ~10²⁵ GW | Post-V1 |

**Power shortage handling:** edge case, not designed failure state. Priority if shortage occurs:
- Always on (never cut): railed city drive systems, sky city life support, dome life support, L1 magnetic umbrella, Mercury base operations.
- Reduced first: ion tug fleet speed, mass driver launch rate, vortex engine output.
- Idle immediately: orbital lasers once warming phase complete, non-critical construction robots.

Power microwave/laser transmission from Dyson swarm to planet receiving stations = background infrastructure. Not mechanic. Acknowledged in one CE when first Mars transmission occurs.

---

## ORBITAL INFRASTRUCTURE STACK

### Bootstrap Principle
Each infra tier makes next tier cheaper. Player feels this progression — early game everything rocket-dependent + expensive, late game system runs itself.

### How Components Reach Orbit and Transit Between Planets

**Rockets (Era 1 — always available)**
Used for: first Mercury skyhook construction, first planetary skyhooks at Mars/Venus, crew transfers throughout game, precision cargo. Consume volatiles as propellant. Once mass driver operational, rockets reserved for these specific uses only. Nuclear thermal rockets not separate transport era — four-era transport table is canonical.

**Mass driver (after Mercury Phase 2)**
Launches small-to-medium components to Mercury orbit: Dyson panels, orbital laser satellites, mirror segments, solar sail tugs, Europa impactor packages, maintenance craft. Cannot launch components too heavy/dense to survive acceleration profile (superconducting coil segments, large machinery). Ion drive tugs carry mass-driver-launched components from Mercury orbit to destination over months to years.

**Mercury skyhook (rocket-bootstrapped, mid-game)**
Lifts heavy components Mercury surface → Mercury orbit: magnetic umbrella coil segments, vortex engine sections, anything too dense for mass driver. One-time expensive rocket-bootstrapped construction. After it exists, all subsequent heavy lift from Mercury surface is cheap. Bootstrapping cost = single largest one-time Mercury investment in game.

**Planetary skyhooks at Mars and Venus (rocket-bootstrapped per planet)**
Mass driver launches components to Mercury orbit. Rocket transfer stage carries to Mars/Venus orbit. Once planetary skyhook exists, local surface-to-orbit is cheap. Enables colonist rotation + cargo export from planetary surfaces.

### Assembly at Destination
Large orbital structures (orbital laser array, L1 magnetic umbrella, Venus shade mirror) assembled in situ by construction robots. Components arrive individually via ion tug over months to years. Structures come online incrementally — first unit starts terraforming phase, each additional unit increases effectiveness/rate.

Vortex engines assembled in upper atmosphere (50km) by orbital construction robots. No sky cities required. Sky cities = parallel colonisation track, not terraforming prereq.

### Era Summary
| Era | Heavy lift method | Primary use |
|---|---|---|
| Pre-mass driver | Rockets only, volatile fuel cost | Bootstrap equipment, first structures |
| Post-mass driver | Mass driver + ion tugs | Dyson panels, laser satellites, mirror segments |
| Post-Mercury skyhook | Skyhook for heavy, mass driver for standard | Magnetic umbrella, vortex engines |
| Post-planetary skyhooks | Local cheap lift at Mars + Venus | Colonist rotation, surface cargo export |
| Fusion drive era | Anywhere fast, He-3 fuel | All cargo, windows irrelevant |

**Mass driver = most important single piece of infra in game.** Everything before it: rocket-dependent. Everything after: primarily mass-driver-based.

### The Mass Driver Queue
Visible at all times. Shows launch priority order. Dyson panels auto-queue as permanent lowest-priority item. Everything manually queued above gets priority first. When manual queue empties, panel production resumes. Player can pause auto-queue to accumulate resources for large construction. Queue = core Mercury management decision made concrete — literal launch schedule, not abstract slider.

---

## INFRASTRUCTURE HEALTH

### Scope
Applies to orbital infra: L1 magnetic umbrella, orbital mirror arrays, skyhooks, vortex engines, railed city drive system. Does NOT apply to terraformed planet biospheres (self-sustaining once established) or Mercury base buildings (handled via production rate, not health stat).

### Display
Effectiveness stat visible in planet inspect view alongside atmospheric data. Example: **L1 UMBRELLA — 94% EFFECTIVENESS**. Slow-moving, decades per meaningful tick. No constant monitoring needed.

### Notification Thresholds
| Effectiveness | Response |
|---|---|
| Below 60% | Ping-and-queue warning fires |
| Below 30% | Pause-and-present decision fires |

At 30%: queue maintenance mission from Mercury (resets to 100%, costs ore) or dismiss and accept consequences.

### Consequences of Neglect
Atmospheric erosion / reduced effectiveness shows in planetary stats. At 0% L1 umbrella: Mars atmosphere loses ~**0.5% pressure per game century** — visible but never instantly catastrophic. Population growth stalls. CEs reflect decline. Colonists leave voluntarily — colony shrinks, does not die catastrophically. No evacuation mechanic.

**Degradation floor:** atmosphere built over centuries does not vanish within any realistic session even at 20× speed. Player always has time to respond. Consistent with quiet failure philosophy.

### CME Interaction
CME events compound with degradation. Hardened component ignores CMEs entirely. Mid-tier takes partial CME damage. Basic or already-degraded component hit by CME takes compounding damage. Primary scenario where infra health becomes urgent rather than merely something to monitor.

### Mandatory Maintenance
**Not implemented.** Pause-and-present at 30% = designed intervention point. If dismissed + ignored, game resolves gracefully through stat drift + CEs. No recurring maintenance tasks, no mandatory repair obligations.

### Three Maintenance Scales
| Scale | Mechanic | Cadence |
|---|---|---|
| Background rate | Dyson panel entropy, invisible, resolved by tier upgrades not tasks | Continuous |
| Periodic allocation decision | Orbital mirrors, fusion reactor efficiency — slow indicator drifts, player queues maintenance mission when ready | Every 80–150 game years roughly |
| One-time narrative event | Terminator rail age event, Venus sky city descent, Mercury base 200-year event — fires once per infra type, multiple outcomes | Once per game |

Maintenance never appears as recurring identical task. Each moment either resolves permanently via upgrade or is unique narrative event that changes infra permanently.

### Maintenance Mission Cost (approximate)
Costs common ore + occupies mass driver capacity for one launch cycle. Scales with infra being maintained — skyhook maintenance costs more than orbital mirror check. Small relative to construction costs. Maintenance = never resource crisis, just periodic allocation decision.
