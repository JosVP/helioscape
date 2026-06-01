# HELIOSCAPE — GDD: BIOLOGICAL PHASE MANAGEMENT
v0.1 — May 2026. Replaces placeholder section in main GDD.

---

## OVERVIEW

Bio phases cover the living layer of terraforming — the part that cannot be fully engineered. Long
wait split into sequential committed sub-steps. Once committed, step runs, cannot reverse. While
step runs, player designs the next composition. No dome trial mechanic (removed).

**Mars total:** ~110yr nominal across 4 phases
**Venus total:** ~130yr nominal across 4 phases

Bio I and Bio II can overlap on both planets: Bio II may start once Bio I is ≥50% complete.
Two compositions running simultaneously during that window.

---

## THE ECOSYSTEM COMPOSER

Three-panel interface that opens when a bio phase becomes available.

### Left panel — Current Conditions
Planet's current state as readable parameters: atmospheric pressure, temperature range,
ocean chemistry, radiation level, soil state. Each shows a plain-English status tag:
*"Soil: raw regolith — no organic matter, extreme pH"*. These are the constraints your organisms
must survive. Parameters update between phases as the planet changes.

### Centre panel — Composition Slots
- **3 Required slots** — must be filled before committing. Each labelled by ecological role:
  *Foundation / Catalyst / Stabiliser*. Labels are hints toward what function is missing,
  not category locks. Any organism can go in any slot.
- **2 Optional booster slots** — improve speed, stability, or tag. See Booster Slots section.
- **1 Emergent slot** — locked, lights up mid-phase if a discovery triggers. Not accessible
  at composition time.

Incompatible pairs show a warning icon on the card: *"these two compete for the same soil
chemistry — adds ~5yr and reduces stability."* Visible before commit, so the player can adjust.

### Right panel — Organism Palette
Scrollable, categorised list. Categories visible even when empty (builds anticipation for
unlocks). Locked organisms show as silhouettes with unlock hint. Selection adds organism to
a composition slot via drag or click.

Before committing, right panel transforms into **Projected Outcome**:
- Small rendered scene of projected biosphere state at phase end (pixel art, matches game style)
- **Stability Meter** (0–100%) with annotated failure modes in plain English:
  - 🟡 *"No decomposers — organic matter will accumulate and choke photosynthesis around Year 12"*
  - 🟡 *"Nitrogen-fixers present but no anchor plant — nitrogen disperses before it's usable"*
  - 🟢 *"Aquatic microbes + chemolithotrophs cover the foundation well"*
- **Duration estimate** — calculated from compatibility data + booster slots (see Duration section)
- **Naturalist/Architect lean** — *"This composition leans Architect"*

---

## ORGANISM PALETTE

Choice within categories: most phases have 2–3 options per ecological role. Some organisms are
near-mandatory for specific conditions (perchlorate reducers on Mars, sulphur-reducers on
Venus early phases) — don't pretend there's a choice where there isn't. The meaningful choices
are in the other slots: speed vs tag, native vs synthetic, early vs safe.

Slot count (3 required + 2 optional) with 20+ palette entries means the player can never
add everything. Selection is always a choice.

### PIONEER BACTERIA

| Organism | Role | Requires | Outputs | Compatible with | Incompatible with | Tag |
|---|---|---|---|---|---|---|
| Cyanobacteria | Photosynthesis, O₂ seed | Water + trace CO₂ | O₂, organic carbon | UV-hardened photosyn., nitrogen free-living | — | Naturalist |
| Iron-oxidising bacteria | Regolith chemistry primer | Iron-rich surface | Organic acids, early minerals | Perchlorate reducers | — | Naturalist |
| UV-hardened photosynthesizers | Photosynthesis under high radiation | High UV, water | O₂, organic matter | Cyanobacteria | — | Architect (Moon T1) |
| Engineered perchlorate destroyers | Fast soil toxin removal | Any surface | Cleared soil | Iron-oxidising bacteria | Methanogens | Architect (Moon T1) |

### CHEMOLITHOTROPHS

| Organism | Role | Requires | Outputs | Compatible with | Incompatible with | Tag |
|---|---|---|---|---|---|---|
| Perchlorate reducers | Neutralise Martian soil toxins | Perchlorate-heavy soil | Chloride + O₂ | Iron-oxidising bacteria | Methanogens | Naturalist |
| Methanogens | Add greenhouse warming via CH₄ | CO₂ + H₂ | Methane (warming bonus) | Sulphur-reducing bacteria | Perchlorate reducers, engineered destroyers | Naturalist |
| Sulphur-reducing bacteria | Ocean floor stability; Venus acid chemistry | Low-O₂ environment | Sulphides (food chain foundation) | Methanogens, aquatic microbes | Early photosynthesizers (O₂ conflict) | Naturalist |

### NITROGEN-FIXERS

| Organism | Role | Requires | Outputs | Compatible with | Incompatible with | Tag |
|---|---|---|---|---|---|---|
| Free-living fixers (Azotobacter-analogue) | Atmospheric N into soil — independent | Some organic matter present | Bioavailable nitrogen | Cyanobacteria, mosses | — | Naturalist |
| Symbiotic fixers (Rhizobium-analogue) | Efficient N fixing via host plant | Host plant already in composition | Higher nitrogen yield | Mosses, ferns, early plants | — (fails silently without host) | Naturalist |
| Engineered nitrogen factories | Maximum N efficiency, no dependencies | Any soil | High bioavailable N yield | Most organisms | Naturalist ecosystem packages (instability) | Architect (Moon T1) |

### AQUATIC MICROBES

| Organism | Role | Requires | Outputs | Compatible with | Incompatible with | Tag |
|---|---|---|---|---|---|---|
| Phytoplankton-analogue | Ocean O₂ + biomass | Liquid water + light | O₂, organic matter | Freshwater algae mats, kelp-analogue | — | Naturalist |
| Aquatic microbes (general) | Ocean foundation, broad chemistry buffer | Liquid water | Stabilised ocean chemistry | Phytoplankton, sulphur-reducers | — | Naturalist |

### AQUATIC PLANTS

| Organism | Role | Requires | Outputs | Compatible with | Incompatible with | Tag |
|---|---|---|---|---|---|---|
| Freshwater algae mats | Shallow water coverage | Freshwater, light | O₂, early soil organic matter | Phytoplankton, aquatic microbes | — | Naturalist |
| Kelp-analogue | Deep water biomass + coastline anchor | Saltwater, light, moderate temp | Biomass, coastal stabilisation | Phytoplankton, mosses (at coastline) | — | Naturalist |

### DECOMPOSERS

| Organism | Role | Requires | Outputs | Compatible with | Incompatible with | Tag |
|---|---|---|---|---|---|---|
| Fungal networks | Organic matter breakdown, soil nutrient cycling | Dead organic matter | Soil nutrients | Saprotrophic bacteria, mosses | — | Naturalist |
| Saprotrophic bacteria | Rapid decomposition | Dead biomass | Nutrient cycling, available minerals | Fungal networks, decomposer insects | — | Naturalist |

### EARLY PLANTS

| Organism | Role | Requires | Outputs | Compatible with | Incompatible with | Tag |
|---|---|---|---|---|---|---|
| Lichens | Bare rock coloniser, extremely hardy | Rock surface, any temp | Thin organic layer | Mosses, free-living fixers | — | Naturalist |
| Mosses / liverworts | Ground cover pioneer, moisture retention | Minimal soil, moisture | Organic soil layer, moisture retention | Lichens, free-living fixers, fungal networks, symbiotic fixers | — | Naturalist |
| Ferns | First vascular plants, root-driven soil deepening | Basic soil, moisture | Deeper soil formation, habitat | Earthworm-analogues, pollinators (later) | — | Naturalist |

### INSECTS

| Organism | Role | Requires | Outputs | Compatible with | Incompatible with | Tag |
|---|---|---|---|---|---|---|
| Decomposer insects (beetle/fly-analogue) | Macro decomposition, soil aeration | Dead plant matter | Nutrient cycling, loose soil | Saprotrophic bacteria, earthworm-analogues | Predator insects (without prey base) | Naturalist |
| Pollinators (bee-analogue) | Enable plant reproduction and spread | Flowering plants present | Accelerated plant spread, ecosystem diversity | Ferns, early plants | — (fails without flowering plants) | Naturalist |
| Predator insects | Population balance, prevents decomposer explosion | Prey insects present | Stable decomposer population | Decomposer insects (with existing base) | Any composition without prey insects → collapse risk | Naturalist |

### ECOSYSTEM PACKAGES (Moon Tier 2 only)

Pre-validated multi-organism combinations. Each occupies a single composition slot but
counts as 3 organisms for compatibility and emergent discovery checks.

| Package | Contains | Planet applicability | Effect |
|---|---|---|---|
| Tundra Pioneer Community | Cold-optimised pioneer bacteria + free-living fixers + mosses | Mars (Bio II/III cold regions) | +12% stability in sub-zero conditions |
| Coastal Transition Package | Kelp-analogue + mosses + decomposers | Both | Stable coast → land bridge, reduces Bio III instability |
| Acidic Soil Remediation Package | Sulphur-reducers + saprotrophic bacteria + early chemolithotrophs | Venus (Bio II/III) | Hard to replicate manually. Near-mandatory for Venus without it. |

---

## COMPATIBILITY AND DURATION CALCULATION

Base duration per phase is fixed (see phase tables below). Actual duration calculated at commit:

| Modifier | Effect |
|---|---|
| Compatible pair in composition | −2 to −3yr per pair |
| Incompatible pair in composition | +5yr, −10% stability (warning shown before commit) |
| Each booster slot filled | −3 to −5yr (varies by booster type) |
| Low stability overall (<75%) | +0–15yr random — the RNG element |

Compatibility is stored per organism as data: `compatible: [orgB, orgD]` / `incompatible: [orgC]`.
Duration estimate on the projection panel is derived from this data, fully calculable before commit.

---

## STABILITY TIERS AND OUTCOMES

| Stability | Duration modifier | Outcome |
|---|---|---|
| Stable (>75%) | ±5yr random | No disruption events. Phase completes cleanly. |
| Unstable (40–75%) | +5–20yr random | 1–2 instability CEs fire mid-phase. Completes, but slower. History book records the disruption. |
| Collapsed (<40%) or flagged incompatible combo | Phase halts ~15yr in | See Collapse section below |

**This is the only system in the game with RNG.** All other mechanics are deterministic.
The ±5yr variance on stable runs prevents veteran optimisation of every timeline.

### Collapse

Triggers at <40% stability, or if predator insects are placed with no prey insects present.

- Phase halts ~15yr in
- CE fires — narrator is understated: *"The bloom didn't take. We seeded too early, or too thin, or with the wrong partners. The soil is still there. The water is still there. We try again."*
- Planet vignette shifts to degraded state (withered coastal margin, dead plant matter, no movement) — the one moment in the game where the planet looks worse than before intervention
- Player returns to Ecosystem Composer. Previous composition shown with failure modes annotated.
- Player redesigns and commits. Phase continues from degraded state, not from scratch.
- Additional +15–20yr added to phase duration.
- History Book entry created: *"Year [X]: first attempt at coastal pioneers failed. Second composition committed."*

Collapse is rare if the player reads the stability annotations. It's a consequence of ignoring
visible warnings. Clean runs have a cleaner history book — that asymmetry is the consequence.

---

## EMERGENT DISCOVERIES

Certain organism combinations, when running together under the right planetary conditions,
produce an organism that wasn't designed — an unexpected emergent from the ecosystem.

**Discoveries trigger during the phase, not at composition time.** ~10–15yr in, if the right
3-organism combination is present and conditions are met, a CE fires and the new organism is
added to the palette. Available from the next phase onward.

Cannot be brute-forced at the composition stage. Experienced players can aim for known
combinations on subsequent playthroughs.

~8 discoveries across both planets. Not all are reachable in a single playthrough (some require
Moon Tier 1 or Tier 2 organisms to be in the combination).

| Discovery | Combination required | Condition | Effect | Planet |
|---|---|---|---|---|
| Proto-Soil Community | Iron-oxidising bacteria + perchlorate reducers + free-living fixers | Mars Bio I or II | Composite organism replacing all three; faster and more stable in subsequent soil phases | Mars |
| UV-Hardened Bloom | Cyanobacteria + UV-hardened photosynthesizers + phytoplankton-analogue | High UV, Bio I | Radiation-thriving strain; accelerates O₂ output. Especially valuable Venus Bio I | Both |
| Hybrid Adaptives | Any Synthetic Pioneer (Moon T1) + any Moon T2 native-chemistry organism | Any bio phase | Half-engineered, half-native. Naturalist tag credit for an otherwise Architect approach. Resolves the tension. | Both |
| First Soil Fauna | Early plants + decomposer insects + high decomposer coverage (fungal + saprotrophic) | Mars Bio III | Macro-invertebrates appear early. CE: *"Something moved in the dirt. Not bacteria. Not a plant. Something with segments."* | Mars |
| Deep Chemosynthetic Community | Sulphur-reducers + methanogens + aquatic microbes | Bio I ocean floor, low-O₂ | Anaerobic deep-ocean ecosystem; stabilises ocean chemistry independent of surface. Reduces ocean instability events. | Both |
| Frost-Hardy Pioneer | Cold-optimised strain (Moon T1) + mosses + decomposers | Bio II/III, sub-zero regions | Plant variant that colonises beyond temperate zone; accelerates Bio IV inland spread in cold regions | Mars |
| Coastal Web | Kelp-analogue + decomposer insects + mosses near coastline | Bio III | Self-sustaining coastal food web that propagates inward without active seeding. Reduces Bio IV duration ~10yr. | Both |
| Atmospheric Fixer | UV-hardened photosynthesizers + sulphur-reducers + free-living fixers | Venus Bio II | Converts residual sulphur compounds to nitrogen while photosynthesising. Venus-specific. Reduces catalyst ship requirement by 1 unit. | Venus only |

---

## BOOSTER SLOTS

2 optional slots per phase. Can be used every phase. Not limited use.
Boosters are engineering interventions, not organisms. Architect-lean if synthetic.

| Booster | Effect | Cost | Tag |
|---|---|---|---|
| Precipitation Enhancement | −5yr to duration. Requires Precipitation Engine already built. | Precipitation Engine component (Mercury queue) | Architect |
| Nutrient Orbital Drop | +8% stability. Small volatiles draw. | Polar volatiles (small) | Neutral |
| UV Amplification | +6% stability, boosts photosynthetic rate. | 3 GW continuous Dyson draw during phase | Architect |
| Atmospheric Micro-Adjustment | +6% stability, fine-tunes local CO₂/O₂ for current phase organisms. | 20 RP capacity, 10yr research track running simultaneously | Architect |
| Dome-Accelerated Pre-Seeding | Reduces instability chance by ~10%. Releases dome-raised organisms ahead of orbital dispersal. | Active biodome on planet required | Naturalist |
| Restored Earth Seedbank | Passive +5% stability. No booster slot required — applies automatically if condition met. | Earth Rewilding tech done | Naturalist |

---

## NATURALIST / ARCHITECT TAGGING

Each bio phase commit generates a tag based on composition:

- Synthetic organism majority → Architect
- Earth-analogue / native-chemistry organism majority → Naturalist
- Ecosystem Package (Moon T2) used → Naturalist
- Precipitation Enhancement, UV Amplification, Atmospheric Micro-Adjustment boosters → Architect
- Dome-Accelerated Pre-Seeding booster → Naturalist
- Hybrid Adaptives discovery → Neutral (resolves the tension explicitly)

6–8 bio commits across Mars + Venus contribute meaningfully to the First Era Complete ratio.
Pattern of small engineering decisions can contradict the large path-choice philosophy — intentional.

---

## FAUNA DELIVERY (BIODOME PIPELINE — SEPARATE FROM COMPOSER)

Fauna does not appear in the Ecosystem Composer palette. Handled entirely by the existing
biodome system.

- Embryos + fertilised eggs shipped from Earth (or Moon after Moon T1 research) via standard
  transport routes. No dedicated Mercury component.
- On-planet: arrive in biodomes. Complete food chains established in enclosed conditions before
  any open release.
- Mars-born / Venus-born generations raised in domes. Dome walls open gradually (sections, not
  all at once) as exterior ecosystem reaches threshold.
- Small fauna (earthworm-analogues, small rodents, seed-dispersal birds): available from Bio IV.
- Large fauna (anything above small mammal): post-terraforming discovery events only. Not
  during the active terraforming arc.
- **Player action required:** request embryo shipment from Earth panel when Bio IV approaches.
  Must have biodome capacity already on planet. Shipment follows standard transit time.

---

## FLORA DELIVERY

Seeds and spores from Earth, same cargo runs as Bioreactor Landers.
Distribution at planetary scale via Orbital Dispersal Network (ODN) in seed dispersal mode.
Ground distribution: drone swarms included in Bioreactor Lander payloads — no separate
Mercury item.

Larger plants (ferns, early trees in Bio IV): drone-planted seedlings near established water
sources, propagated outward. Requires particulate surface substrate — depends on Bio II
soil preparation being complete.

**Player action required:** request seed shipment from Earth panel when Bio III approaches.
Earth Rewilding tech (if researched) automatically improves seed bank quality — passive +5%
stability bonus, no booster slot consumed.

---

## MERCURY COMPONENTS

### New queue items introduced during bio phases

| Component | Description | When queued | Notes |
|---|---|---|---|
| Orbital Dispersal Network (per planet) | Satellite constellation for planetary-scale biological payload dispersal. Freeze-dried microbes, spores, seeds delivered from orbit. | Before Bio I can begin on that planet | Built once per planet. Required for all bio phases. |
| Bioreactor Landers (per batch) | Surface-deployed units that warm and hydrate local patches to kickstart biology before open-release dispersal. | Queued repeatedly during bio phases | Each batch seeds a region. More batches = faster phase progress. Common ore + volatiles cost. |
| Precipitation Engine | Orbital weather modification satellite. Pulls moisture from established oceans, drives precipitation cycles over target land regions. | Before Bio II (Mars) or Bio III (both planets) | 1 unit standard. Queue second unit for accelerated rainfall coverage. Also enables Precipitation Enhancement booster. |
| Atmospheric Catalyst Ships (Venus only) | Large vessels cruise at mid-altitude, seeding compounds that neutralise residual acid chemistry. Temporary — decommissioned after Venus Bio II. | Before Venus Bio II | 3 ships standard. 4 if vortex engines were not built. Atmospheric Fixer emergent discovery reduces requirement to 2. |
| Regolith Cultivator (Path B/C Mars only) | Surface mechanical grinding units. Slower alternative to orbital laser pulse mode for soil preparation. | Mars Bio II, if Path A not chosen | Not needed if Path A chosen. Path A players repurpose existing orbital lasers instead. |

### Path A orbital laser repurposing (Mars Bio II)

Path A players do not queue a separate component. Orbital laser satellites are switched to
**pulse mode**: rapid on/off thermal cycling fractures surface rock to fine particulate, creating
substrate for seeding. This is the Path A mid-game payoff — infrastructure built 60+ years earlier
finding a second use.

- Power draw drops from 50 GW (active warming) to 25 GW per unit (average pulse cycle)
- Duration equivalent to Regolith Cultivators, slightly faster coverage due to existing array scale
- Temporary during Bio II only; satellites return to idle (0.05 GW station-keeping) after

### Vortex engine repurposing (Venus Bio II)

Venus players who built vortex engines do not queue additional components for Bio II.
Engines keep atmospheric chemistry mixed → Atmospheric Catalyst Ships achieve coverage
with 3 vessels instead of 4. Engines return to idle after Bio II.

---

## ENERGY DRAW — ADDITIONS TO POWER TABLE

| Component | Draw | Notes |
|---|---|---|
| Orbital Dispersal Network (per planet) | 5 GW | Continuous during active bio phases for that planet |
| Bioreactor Landers (per active batch) | 0.5 GW | Low draw; multiple batches stackable |
| Precipitation Engine (per unit) | 25 GW | 1–2 units. Temporary during relevant phases. Dyson-powered water cycle. |
| Atmospheric Catalyst Ships (per vessel, Venus Bio II) | 8 GW | 3–4 vessels × 8 GW = 24–32 GW. Temporary. |
| Orbital laser pulse mode (per unit, Mars Bio II only) | 25 GW | Down from 50 GW active. Average of on/off cycle. Path A only. Temporary. |

---

## COMPONENT COSTS — ADDITIONS TO COST TABLE

C = common ore · R = rare metals · V = polar volatiles

| Component | C | R | V | Notes |
|---|---|---|---|---|
| Orbital Dispersal Network (per planet) | 400 | 200 | 50 | One-time per planet |
| Bioreactor Landers (per batch) | 150 | 30 | 100 | Volatiles = freeze-dried bio payload. Queued repeatedly. |
| Precipitation Engine | 600 | 200 | 0 | Queue second unit at same cost for accelerated effect |
| Atmospheric Catalyst Ships (per vessel) | 300 | 100 | 80 | Venus Bio II. 3–4 vessels. |
| Regolith Cultivator (per unit) | 250 | 50 | 0 | Path B/C Mars Bio II only. 2–3 units for full surface coverage. |

---

## PHASE BREAKDOWN: MARS

Bio I + Bio II overlap: Bio II may start once Bio I ≥50% complete.
Spillover triggers unchanged from main GDD.

| Phase | Job | Nominal duration | Key requirements before start | Palette scope |
|---|---|---|---|---|
| Bio I — Ocean Seeding | Stabilise new oceans, establish microbial foundation | 30yr | ODN built. Water delivery complete (step 4 done). | Pioneer bacteria, chemolithotrophs (perchlorate reducers near-mandatory), aquatic microbes, aquatic plants |
| Bio II — Soil Preparation | Convert regolith to basic soil. Nitrogen established. | 25yr | Bio I ≥50%. Path A: orbital lasers switched to pulse mode. Path B/C: Regolith Cultivators queued. Precipitation Engine queued. | Nitrogen-fixers, decomposers, chemolithotrophs, early plants (lichen/moss) |
| Bio III — Coastal Pioneers | First stable land ecosystems, ocean-to-land bridge | 20yr | Bio II complete. Precipitation Engine built. Earth seed shipment requested. | Early plants (moss, ferns), lichens, decomposers, decomposer insects |
| Bio IV — Inland Spread | Push life toward interior. First trees, first birds. | 35yr | Bio III complete. Biodome capacity on planet. Earth embryo shipment requested. | Ferns, pollinators, symbiotic fixers (with plant hosts now present). Fauna via Biodome Pipeline only. |

Spillover:
- Bio I complete → `mars_ocean` → unlocks Moon Organism Library Tier 2
- Bio II complete → `mars_soil` → unlocks Earth Soil Restoration
- Bio III complete → `mars_coastal` → unlocks Earth Rewilding

---

## PHASE BREAKDOWN: VENUS

Bio I + Bio II overlap: same rule.
Venus chemistry differs significantly from Mars — fewer Earth analogues transfer directly.
Moon Tier 2 Acidic Soil Remediation Package has its highest value here.

| Phase | Job | Nominal duration | Key requirements before start | Palette scope |
|---|---|---|---|---|
| Bio I — Ocean Microbe Seeding | Ocean chemistry foundation in high-residual-acid conditions | 35yr | ODN built. Water delivery complete (step 4 done). Atmospheric monitoring active. | Aquatic microbes, sulphur-reducers, phytoplankton-analogue, pioneer bacteria (UV-hardened variant recommended given Venus UV history) |
| Bio II — Atmospheric Oxygen | Neutralise residual acid chemistry. Oxygen accumulation begins. | 30yr | Bio I ≥50%. Atmospheric Catalyst Ships built (3–4). Vortex engines auto-repurposed if built. | UV-hardened photosynthesizers, cyanobacteria, free-living nitrogen-fixers. Acidic Soil Remediation Package (Moon T2) strongly recommended. |
| Bio III — Coastal Ecosystems | First stable land ecosystems under now-breathable conditions | 25yr | Bio II complete. ODN seed dispersal mode. Earth seed shipment requested. | Early plants, mosses, lichens, decomposers, decomposer insects |
| Bio IV — Inland Colonisation | Full inland spread | 40yr | Bio III complete. Biodome capacity built. Earth embryo shipment requested. | Ferns, pollinators. Fauna via Biodome Pipeline only. |

---

*Helioscape GDD — Biological Phase Management v0.1*
*For organism palette art references, emergent discovery CE text, and instability event CE text: request specific sections.*
