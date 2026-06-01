# Helioscape — Cursor Prompts: Bio-Phase Management + Tech Tree Updates
> Supplement to cursor_prompts_v2.md.
> Keep ARCHITECTURE.md, bio-phase-management.md,
> and earth-tech-tree-options.md in Cursor context for every prompt in this file.

---

# PART A — TECH TREE UPDATES

Two prompts. Both are partial rewrites of sections already in v2. Replace, don't merge.

---

## A1 — `data/tech_tree.json` (Earth section rewrite)

```
Rewrite the Earth and Moon sections of data/tech_tree.json. The Mars, Venus, and Mercury
sections from the previous version remain unchanged — only modify the Earth and Moon entries.

--- SHARED / NEUTRAL NODES ---

earth_launch_mercury_mission
  prerequisites: [], rp_cost: 0, duration_years: 0 (instant)

earth_advanced_renewables
  prerequisites: [earth_launch_mercury_mission]
  rp_cost: 25, duration_years: 20

earth_dome_habitat
  prerequisites: [earth_launch_mercury_mission]
  rp_cost: 20, duration_years: 15

earth_deuterium_extraction
  prerequisites: [earth_advanced_renewables]
  rp_cost: 40, duration_years: 30

earth_fusion_ignition_theory
  prerequisites: [earth_deuterium_extraction]
  rp_cost: 50, duration_years: 40

earth_automated_food_systems
  prerequisites: [earth_arcology_framework OR earth_advanced_renewables]
  [→ Cursor: prerequisites accept an OR condition — implement as an array with a "mode": "any"
   flag on the prerequisites object, e.g. { "mode": "any", "ids": ["earth_arcology_framework",
   "earth_advanced_renewables"] }. TechTreeSystem.can_unlock() will need to read this flag.]
  rp_cost: 40, duration_years: 25
  effects: [
    {
      "type": "present_fork",
      "fork_id": "food_systems_fork",
      "choices": [
        {
          "id": "rewild_freed_land",
          "label": "Rewild the freed land",
          "tag": "naturalist",
          "effects": [
            { "type": "tag_decision", "tag": "naturalist" },
            { "type": "emit_event", "event_id": "ce_food_fork_rewild" },
            { "type": "apply_colonist_bonus", "bonus": "open_environment" }
          ]
        },
        {
          "id": "develop_freed_land",
          "label": "Develop the freed land",
          "tag": "architect",
          "effects": [
            { "type": "tag_decision", "tag": "architect" },
            { "type": "emit_event", "event_id": "ce_food_fork_develop" },
            { "type": "rp_capacity_boost", "amount": 5 }
          ]
        }
      ]
    }
  ]
  [→ Cursor: add a comment explaining that "present_fork" is a new effect type. Unlike a normal
   tech that completes and applies effects automatically, a fork tech opens a choice dialog in
   TechTreeUI once the research duration completes. The player must choose before the node is
   marked completed. Neither choice can be undone. TechTreeSystem.gd handles this via a new
   _present_fork(fork_data) function.]

--- NATURALIST BRANCH ---

earth_ocean_cleanup
  prerequisites: [earth_launch_mercury_mission]
  spillover_prerequisites: ["mercury_phase_1_complete"]
  spillover_gate: { "mode": "min_naturalist_nodes", "count": 2 }
  [→ Cursor: spillover_gate is a new field. TechTreeSystem checks this in can_unlock(): if
   spillover condition fires but GameState.naturalist_decisions < gate.count, the node stays
   locked and a notification is pushed to culture_event_queue (not an error — a narrative reason
   is given). The node unlocks automatically once the gate is also met.]
  rp_cost: 30, duration_years: 25
  effects: [{ "type": "tag_decision", "tag": "naturalist" }]

earth_co2_drawdown
  spillover_prerequisites: ["venus_carbonate_process_started"]
  spillover_gate: { "mode": "min_naturalist_nodes", "count": 2 }
  rp_cost: 35, duration_years: 30
  effects: [{ "type": "tag_decision", "tag": "naturalist" }]

earth_soil_restoration
  spillover_prerequisites: ["mars_bio_2_complete"]
  spillover_gate: { "mode": "min_naturalist_nodes", "count": 2 }
  rp_cost: 35, duration_years: 25
  effects: [
    { "type": "tag_decision", "tag": "naturalist" },
    { "type": "apply_colonist_bonus", "bonus": "open_environment" }
  ]

earth_ocean_acidification_reversal
  prerequisites: [earth_co2_drawdown]
  spillover_prerequisites: ["venus_carbonate_process_started"]
  rp_cost: 40, duration_years: 30
  effects: [{ "type": "tag_decision", "tag": "naturalist" }]

earth_rewilding
  prerequisites: [earth_soil_restoration]
  spillover_prerequisites: ["mars_bio_3_complete"]
  rp_cost: 40, duration_years: 35
  effects: [
    { "type": "tag_decision", "tag": "naturalist" },
    { "type": "set_flag", "flag": "earth_rewilding_done" }
  ]
  [→ Cursor: the "earth_rewilding_done" flag in GameState is checked by BioPhaseSystem to
   automatically apply the Restored Earth Seedbank passive stability bonus (+5%) to bio phase
   compositions on any planet. No booster slot consumed.]

--- ARCHITECT BRANCH ---

earth_vertical_megacity
  prerequisites: [earth_launch_mercury_mission]
  rp_cost: 30, duration_years: 20
  effects: [
    { "type": "tag_decision", "tag": "architect" },
    { "type": "emit_event", "event_id": "ce_megacity_50m" }
  ]
  [→ Cursor: available at the same tier as earth_advanced_renewables — early game. Consolidates
   population. Frees peripheral land for development. Note in data: "tier": 1]

earth_arcology_framework
  prerequisites: [earth_vertical_megacity]
  rp_cost: 40, duration_years: 30
  effects: [
    { "type": "tag_decision", "tag": "architect" },
    { "type": "apply_colonist_bonus", "bonus": "dense_living" },
    { "type": "emit_event", "event_id": "ce_first_arcology" }
  ]
  [→ Cursor: dense_living bonus stored in GameState.colonist_bonuses["dense_living"] = true.
   BioPhaseSystem reads this to improve stability in Mars dome seeding phases and Venus sky
   city habitability. Also unlocks the food_systems prerequisite path.]

earth_subsurface_expansion
  prerequisites: [earth_arcology_framework]
  rp_cost: 45, duration_years: 35
  effects: [
    { "type": "tag_decision", "tag": "architect" },
    { "type": "spillover_unlock", "target_planet": "mars", "target_tech": "mars_subsurface_dome_design" },
    { "type": "emit_event", "event_id": "ce_subsurface_life" }
  ]

earth_planetary_resource_grid
  prerequisites: [earth_arcology_framework]
  rp_cost: 50, duration_years: 30
  effects: [
    { "type": "tag_decision", "tag": "architect" },
    { "type": "rp_capacity_boost", "amount": 8 },
    { "type": "emit_event", "event_id": "ce_grid_prevents_famine" }
  ]

earth_geoengineering_bureau
  prerequisites: [earth_planetary_resource_grid]
  rp_cost: 50, duration_years: 35
  effects: [
    { "type": "tag_decision", "tag": "architect" },
    { "type": "set_flag", "flag": "geoengineering_active" }
  ]
  [→ Cursor: geoengineering_active flag is checked by TerraformingSystem to reduce variance
   in terraforming timeline estimates (not speed — accuracy). Comment this in the data.]

earth_neural_digital_integration
  prerequisites: [earth_planetary_resource_grid, earth_fusion_ignition_theory]
  rp_cost: 60, duration_years: 45
  effects: [
    { "type": "tag_decision", "tag": "architect" },
    { "type": "rp_capacity_boost", "amount": 12 },
    { "type": "emit_event", "event_id": "ce_neural_digital_debate" },
    { "type": "set_flag", "flag": "neural_digital_active" }
  ]
  [→ Cursor: neural_digital_active is checked by CultureEventSystem when the Fermi Silence
   event fires — it adds a third choice option: "Broadcast enhanced" (humanity with extended
   lifespans and human-system integration sends a much richer signal). Comment this link.]

earth_planetary_coordination_network
  prerequisites: [earth_neural_digital_integration]
  rp_cost: 70, duration_years: 50
  effects: [
    { "type": "tag_decision", "tag": "architect" },
    { "type": "rp_capacity_boost", "amount": 15 },
    { "type": "emit_event", "event_id": "ce_coordination_network_online" }
  ]
  [→ Cursor: this is the Architect endgame capstone — equivalent in narrative weight to
   earth_rewilding on the Naturalist side. Both paths reach their endpoint by mid-late game.
   Comment this symmetry.]

--- MOON RESEARCH TRACKS ---
(Unchanged from v2. Include all moon_* nodes exactly as before.)
```

---

## A2 — `src/autoloads/GameState.gd` additions (append to existing file)

```
Add the following fields to the existing GameState.gd. Do not rewrite the whole file.
Open the file, locate the existing var declarations, and append these new sections.

After the existing kardashev/tagging section, add:

# Colony bonuses derived from Earth tech choices
var colonist_bonuses: Dictionary = {
    "dense_living": false,     # Architect: improves Mars dome + Venus sky city habitability
    "open_environment": false, # Naturalist: improves colonist wellbeing in open terrain
}
# [→ Cursor: these are set to true by TechTreeSystem when the relevant tech effects fire.
# BioPhaseSystem reads dense_living to add stability buffs in appropriate bio phases.
# Both can be true simultaneously — they apply to different contexts.]

# Earth flags set by tech effects
var earth_flags: Dictionary = {
    "earth_rewilding_done": false,
    "geoengineering_active": false,
    "neural_digital_active": false,
}

# Bio phase state — keyed by planet_id ("mars" / "venus")
var bio_phases: Dictionary = {}
# Per-planet structure (initialised by BioPhaseSystem on first bio phase unlock):
# {
#   "current_phase_index": int,       # 0-3 (Bio I-IV)
#   "phases": Array,                  # one entry per phase:
#   # {
#   #   "status": "locked"|"available"|"composing"|"running"|"complete"|"collapsed",
#   #   "composition": Dictionary,    # slot_id -> organism_id (or package_id)
#   #   "boosters": Array,            # booster ids in optional slots
#   #   "stability_percent": float,
#   #   "duration_years": float,      # computed at commit
#   #   "progress_years": float,      # how far through the running phase we are
#   #   "started_year": float,
#   #   "completed_year": float,
#   #   "collapse_count": int,        # 0 normally; history book uses this
#   #   "tag": "naturalist"|"architect"|"neutral",
#   #   "emergent_discoveries": Array # organism ids of organisms discovered this phase
#   # }
#   "discovered_organisms": Array,    # global per-planet: all emergent discoveries made
#   "fauna_requested": bool,
#   "seeds_requested": bool,
#   "odn_built": bool,                # Orbital Dispersal Network
#   "bioreactor_batches_active": int, # number of active Bioreactor Lander batches
#   "precipitation_engines_built": int,
#   "atmospheric_catalyst_ships_built": int,  # Venus only
#   "regolith_cultivators_built": int,         # Mars only, Path B/C
# }
```

---

## A3 — `src/systems/TechTreeSystem.gd` additions (append/extend existing file)

```
Extend the existing TechTreeSystem.gd with the following new logic. Do not rewrite the file.
Add these functions and extend _apply_effect() and can_unlock() as described.

--- can_unlock() additions ---

After existing prerequisite checks, add:

# Handle OR prerequisite mode
var prereq_data = tech_node.get("prerequisites_data", null)
if prereq_data and prereq_data.get("mode") == "any":
    var ids: Array = prereq_data.get("ids", [])
    var any_met: bool = false
    for id in ids:
        if id in GameState.completed_techs:
            any_met = true
            break
    if not any_met:
        return false

# Handle spillover gate
var gate = tech_node.get("spillover_gate", null)
if gate:
    if gate.get("mode") == "min_naturalist_nodes":
        if GameState.naturalist_decisions < gate.get("count", 2):
            return false

--- _apply_effect() additions ---

Add handling for new effect types:

"present_fork":
    # Store the fork data in GameState so TechTreeUI knows to show the fork dialog.
    # The tech node is NOT marked completed yet — only marked completed after the player
    # chooses a fork option.
    GameState.pending_fork = effect.get("fork")
    EventBus.tech_fork_presented.emit(source_planet, node_id)
    # [→ Cursor: add signal tech_fork_presented(planet_id: String, node_id: String) to
    # EventBus.gd. TechTreeUI listens for this and opens the fork choice modal.]
    return  # don't mark completed yet

"apply_colonist_bonus":
    var bonus_id: String = effect.get("bonus", "")
    if bonus_id in GameState.colonist_bonuses:
        GameState.colonist_bonuses[bonus_id] = true

"rp_capacity_boost":
    GameState.total_rp_capacity += effect.get("amount", 0)

"set_flag":
    var flag: String = effect.get("flag", "")
    if flag in GameState.earth_flags:
        GameState.earth_flags[flag] = true

--- New function: complete_fork_choice ---

func complete_fork_choice(planet_id: String, node_id: String, choice_id: String) -> void:
    # Called by TechTreeUI when the player selects a fork option.
    # Applies the chosen fork's effects, then marks the parent tech node completed.
    var tech_node: Dictionary = DataManager.get_tech_node(node_id)
    var fork_data = tech_node.get("effects", []).filter(func(e): return e.get("type") == "present_fork")
    if fork_data.is_empty():
        return
    var choices: Array = fork_data[0].get("choices", [])
    for choice in choices:
        if choice.get("id") == choice_id:
            for effect in choice.get("effects", []):
                _apply_effect(effect, planet_id)
            break
    # Now mark completed.
    GameState.completed_techs.append(node_id)
    if not GameState.planets[planet_id]["unlocked_techs"].has(node_id):
        GameState.planets[planet_id]["unlocked_techs"].append(node_id)
    GameState.pending_fork = {}
    EventBus.tech_node_unlocked.emit(planet_id, node_id)

Also add to GameState.gd (in the reset() function additions):
    pending_fork: Dictionary = {}  # stores fork data when a fork is being presented
```

---

# PART B — BIO-PHASE MANAGEMENT (ALL NEW)

Eight data files, one new system, one new Mercury queue system, and the Ecosystem Composer UI.
Work in this order — data first, systems second, UI last.

---

## B1 — `data/organisms.json`

```
Create data/organisms.json for Helioscape.

This file defines every organism in the palette. Each entry is referenced by id throughout
the bio phase system.

Each organism entry:
{
  "id": "string",
  "display_name": "string",
  "category": "pioneer_bacteria"|"chemolithotroph"|"nitrogen_fixer"|"aquatic_microbe"|
               "aquatic_plant"|"decomposer"|"early_plant"|"insect",
  "ecological_role": "string — one sentence describing the function in the ecosystem",
  "requires": ["plain-English condition strings — shown in the organism card"],
  "outputs": ["plain-English output strings"],
  "compatible_with": ["organism_id array"],
  "incompatible_with": ["organism_id array"],
  "tag": "naturalist"|"architect"|"neutral",
  "unlock_source": "base"|"moon_t1"|"moon_t2",
  "planet_applicability": "both"|"mars"|"venus",
  "silhouette_hint": "string — shown when locked. e.g. 'A hardy soil pioneer. Requires Moon Tier 1 research.'"
}

Include every organism from the GDD tables:

PIONEER BACTERIA:
- cyanobacteria (naturalist, base, both)
- iron_oxidising_bacteria (naturalist, base, mars — iron-rich)
- uv_hardened_photosynthesizers (architect, moon_t1, both)
- engineered_perchlorate_destroyers (architect, moon_t1, mars)
  incompatible_with: ["methanogens"]

CHEMOLITHOTROPHS:
- perchlorate_reducers (naturalist, base, mars)
  incompatible_with: ["methanogens", "engineered_perchlorate_destroyers"]
- methanogens (naturalist, base, both)
  compatible_with: ["sulphur_reducing_bacteria"]
  incompatible_with: ["perchlorate_reducers", "engineered_perchlorate_destroyers"]
- sulphur_reducing_bacteria (naturalist, base, both — especially venus early)
  compatible_with: ["methanogens", "aquatic_microbes_general"]
  incompatible_with: ["cyanobacteria", "uv_hardened_photosynthesizers"]
  [→ Cursor: note the O₂ conflict — sulphur reducers die in oxygen-rich environments.
   Placing them with photosynthesizers in Bio II or later adds +5yr and −10% stability.
   Add a "conflict_notes" string field for this nuance.]

NITROGEN-FIXERS:
- free_living_fixers (naturalist, base, both)
  [→ Cursor: note "fails silently" if no organic matter is present yet — this is not flagged
   as incompatible but IS a stability risk. Add "dependency_warning": "Requires some organic
   matter already present — risky in Bio I before pioneer bacteria establish."]
- symbiotic_fixers (naturalist, base, both)
  dependency_warning: "Requires a host plant already in the composition — fails silently without one."
- engineered_nitrogen_factories (architect, moon_t1, both)
  incompatible_with: [] (most compatible; instability note with naturalist packages)
  [→ Cursor: add "package_incompatibility_note": "Placing alongside naturalist organism packages
   reduces overall stability by 8% — engineered nitrogen chemistry interferes with native-chemistry
   packages."]

AQUATIC MICROBES:
- phytoplankton_analogue (naturalist, base, both)
  compatible_with: ["freshwater_algae_mats", "kelp_analogue"]
- aquatic_microbes_general (naturalist, base, both)
  compatible_with: ["phytoplankton_analogue", "sulphur_reducing_bacteria"]

AQUATIC PLANTS:
- freshwater_algae_mats (naturalist, base, both)
  compatible_with: ["phytoplankton_analogue", "aquatic_microbes_general"]
- kelp_analogue (naturalist, base, both)
  compatible_with: ["phytoplankton_analogue", "mosses"]

DECOMPOSERS:
- fungal_networks (naturalist, base, both)
  compatible_with: ["saprotrophic_bacteria", "mosses"]
- saprotrophic_bacteria (naturalist, base, both)
  compatible_with: ["fungal_networks", "decomposer_insects"]

EARLY PLANTS:
- lichens (naturalist, base, both)
  compatible_with: ["mosses", "free_living_fixers"]
- mosses (naturalist, base, both)
  compatible_with: ["lichens", "free_living_fixers", "fungal_networks", "symbiotic_fixers"]
- ferns (naturalist, base, both)
  compatible_with: ["earthworm_analogues", "pollinators"]
  requires: ["Basic soil present", "Moisture"]

INSECTS:
- decomposer_insects (naturalist, base, both)
  compatible_with: ["saprotrophic_bacteria", "earthworm_analogues"]
  incompatible_with: ["predator_insects"]
  [→ Cursor: incompatible_with here means "risky without prey base" — add "conditional_incompatible":
   "predator_insects causes instability unless prey insects are also present."]
- pollinators (naturalist, base, both)
  dependency_warning: "Requires flowering plants in the composition — fails without them."
- predator_insects (naturalist, base, both)
  dependency_warning: "Requires prey insects already in the composition. Composition collapses if no prey present."

Also include the Moon Tier 2 organism references (these are used in ecosystem packages;
individual organisms in those packages are listed in ecosystem_packages.json, not here):
- cold_optimised_pioneer (architect, moon_t1, mars)
  [→ Cursor: this is the "cold-optimised strain" referenced in the Frost-Hardy Pioneer
   emergent discovery. Include it as an individual organism from Moon T1.]

Output only JSON.
```

---

## B2 — `data/ecosystem_packages.json`

```
Create data/ecosystem_packages.json for Helioscape.

Ecosystem packages are Moon Tier 2 unlocks. Each package occupies a single composition slot
but counts as 3 organisms for compatibility and emergent discovery checks.

Each entry:
{
  "id": "string",
  "display_name": "string",
  "contains_organisms": ["organism_id", "organism_id", "organism_id"],
  "planet_applicability": "both"|"mars"|"venus",
  "bio_phases": ["bio_1", "bio_2", "bio_3", "bio_4"] (which phases the package can be used in),
  "stability_bonus_percent": float,
  "stability_condition": "string — plain-English condition required for the bonus to apply",
  "tag": "naturalist",
  "unlock_source": "moon_t2",
  "description": "string — shown in the palette. One sentence."
}

Three packages:

tundra_pioneer_community
  contains: [cold_optimised_pioneer, free_living_fixers, mosses]
  planet_applicability: "mars"
  bio_phases: ["bio_2", "bio_3"]
  stability_bonus_percent: 12.0
  stability_condition: "Sub-zero surface temperature in current conditions"
  description: "Cold-optimised pioneers, nitrogen-fixers, and mosses. Validated for below-zero soil."

coastal_transition_package
  contains: [kelp_analogue, mosses, saprotrophic_bacteria]
  planet_applicability: "both"
  bio_phases: ["bio_2", "bio_3"]
  stability_bonus_percent: 8.0
  stability_condition: "Coastline present (ocean + land interface)"
  description: "A validated coast-to-land transition community."

acidic_soil_remediation_package
  contains: [sulphur_reducing_bacteria, saprotrophic_bacteria, perchlorate_reducers]
  planet_applicability: "venus"
  bio_phases: ["bio_2", "bio_3"]
  stability_bonus_percent: 15.0
  stability_condition: "Residual acid chemistry present — high value in Venus Bio II/III"
  description: "Near-mandatory for Venus without it. Neutralises residual sulphur/acid chemistry."
  [→ Cursor: add a "near_mandatory" flag: true — BioPhaseSystem uses this to add a
   soft warning in the CompositionPanel if this package is not used during Venus Bio II.]
```

---

## B3 — `data/emergent_discoveries.json`

```
Create data/emergent_discoveries.json for Helioscape.

Each discovery:
{
  "id": "string",
  "display_name": "string",
  "trigger_organisms": ["organism_id", "organism_id", "organism_id"],
  "trigger_condition": "string — plain-English planetary condition required",
  "trigger_condition_key": "string — GameState key or expression BioPhaseSystem checks",
  "planet": "both"|"mars"|"venus",
  "bio_phases": ["bio_1"] etc,
  "fires_at_year_into_phase": int,  // ~10-15 as per GDD
  "discovered_organism_id": "string — the new organism added to the palette",
  "ce_id": "string — culture event that fires when discovered",
  "description": "string — one sentence explaining what emerged and why it's useful"
}

The discovered organism itself must also exist as an entry in organisms.json
(add a stub entry for each with "unlock_source": "emergent_discovery" and the relevant stats).

Eight discoveries:

proto_soil_community
  trigger_organisms: [iron_oxidising_bacteria, perchlorate_reducers, free_living_fixers]
  trigger_condition_key: "mars_bio_phase_index <= 1"  // Bio I or II
  planet: "mars", bio_phases: ["bio_1", "bio_2"]
  fires_at_year_into_phase: 12
  discovered_organism_id: "proto_soil_community_organism"
  ce_id: "ce_discovery_proto_soil"
  description: "A composite community replacing all three. Faster and more stable in subsequent soil phases."

uv_hardened_bloom
  trigger_organisms: [cyanobacteria, uv_hardened_photosynthesizers, phytoplankton_analogue]
  trigger_condition: "High UV environment"
  trigger_condition_key: "planet_uv_level == 'high'"
  planet: "both", bio_phases: ["bio_1"]
  fires_at_year_into_phase: 10
  discovered_organism_id: "uv_hardened_bloom_organism"
  ce_id: "ce_discovery_uv_bloom"
  description: "Radiation-thriving photosynthetic strain. Especially valuable for Venus Bio I."

hybrid_adaptives
  trigger_organisms: ["any_moon_t1_synthetic", "any_moon_t2_native_chemistry"]
  [→ Cursor: trigger_organisms here use wildcard ids. BioPhaseSystem must check by organism
   tag/source rather than exact id. Add a "trigger_type": "wildcard_category" field with
   category rules: { "slot_a": { "tag": "architect", "unlock_source": "moon_t1" },
   "slot_b": { "unlock_source": "moon_t2" } }]
  planet: "both", bio_phases: ["bio_1", "bio_2", "bio_3", "bio_4"]
  fires_at_year_into_phase: 12
  discovered_organism_id: "hybrid_adaptives_organism"
  ce_id: "ce_discovery_hybrid_adaptives"
  description: "Half-engineered, half-native. Awards Naturalist tag credit for an otherwise Architect approach."
  [→ Cursor: the discovered organism itself has "tag": "neutral" and a note: "resolves_tension: true"
   — KardashevSystem checks this flag when computing the First Era Complete naturalist ratio.]

first_soil_fauna
  trigger_organisms: [ferns, decomposer_insects, fungal_networks, saprotrophic_bacteria]
  [→ Cursor: this discovery requires 4 organisms in the composition (3 required + at least
   one optional slot). BioPhaseSystem checks for all 4 across all filled slots.]
  trigger_condition: "High decomposer coverage — both fungal and bacterial decomposers present"
  trigger_condition_key: "decomposer_coverage_high"
  planet: "mars", bio_phases: ["bio_3"]
  fires_at_year_into_phase: 14
  discovered_organism_id: "first_soil_fauna_organism"
  ce_id: "ce_discovery_first_soil_fauna"
  description: "Macro-invertebrates appear early. Something with segments."

deep_chemosynthetic_community
  trigger_organisms: [sulphur_reducing_bacteria, methanogens, aquatic_microbes_general]
  trigger_condition: "Bio I ocean floor, low-oxygen environment"
  trigger_condition_key: "ocean_oxygen_level == 'low'"
  planet: "both", bio_phases: ["bio_1"]
  fires_at_year_into_phase: 11
  discovered_organism_id: "deep_chemosynthetic_community_organism"
  ce_id: "ce_discovery_deep_chemo"
  description: "Anaerobic deep-ocean ecosystem. Stabilises ocean chemistry independent of surface."

frost_hardy_pioneer
  trigger_organisms: [cold_optimised_pioneer, mosses, decomposer_insects]
  trigger_condition: "Sub-zero surface temperature"
  trigger_condition_key: "surface_temp_celsius < 0"
  planet: "mars", bio_phases: ["bio_2", "bio_3"]
  fires_at_year_into_phase: 13
  discovered_organism_id: "frost_hardy_pioneer_organism"
  ce_id: "ce_discovery_frost_pioneer"
  description: "Colonises beyond the temperate zone. Accelerates inland spread in cold regions."

coastal_web
  trigger_organisms: [kelp_analogue, decomposer_insects, mosses]
  trigger_condition: "Coastline present in current conditions"
  trigger_condition_key: "coastline_present"
  planet: "both", bio_phases: ["bio_3"]
  fires_at_year_into_phase: 12
  discovered_organism_id: "coastal_web_organism"
  ce_id: "ce_discovery_coastal_web"
  description: "Self-sustaining coastal food web that propagates inward. Reduces Bio IV duration ~10yr."
  effects_on_discover: [{ "type": "reduce_phase_duration", "phase": "bio_4", "years": 10 }]

atmospheric_fixer
  trigger_organisms: [uv_hardened_photosynthesizers, sulphur_reducing_bacteria, free_living_fixers]
  trigger_condition: "Venus Bio II residual sulphur compounds present"
  trigger_condition_key: "planet_id == 'venus' and bio_phase_index == 1"
  planet: "venus", bio_phases: ["bio_2"]
  fires_at_year_into_phase: 11
  discovered_organism_id: "atmospheric_fixer_organism"
  ce_id: "ce_discovery_atmospheric_fixer"
  description: "Converts residual sulphur to nitrogen while photosynthesising."
  effects_on_discover: [{ "type": "reduce_component_requirement", "component": "atmospheric_catalyst_ships", "amount": 1 }]
  [→ Cursor: effects_on_discover is evaluated immediately when the discovery fires in
   BioPhaseSystem. "reduce_component_requirement" reduces GameState bio_phases["venus"]
   .atmospheric_catalyst_ships_built minimum by 1 — this is informational (the ships are
   already built by now). It reduces the required count going forward if the player hasn't
   built all of them yet, or records a surplus if they have.]
```

---

## B4 — `data/boosters.json`

```
Create data/boosters.json for Helioscape.

Each booster:
{
  "id": "string",
  "display_name": "string",
  "description": "string — one sentence including the cost/requirement",
  "duration_modifier_years": float,   // negative = faster
  "stability_modifier_percent": float,
  "tag": "naturalist"|"architect"|"neutral",
  "availability_condition": {         // evaluated by BioPhaseSystem at composition time
    "type": "string",
    ...
  },
  "ongoing_cost": {                   // cost that runs for the duration of the phase
    "type": "gw_dyson"|"rp_capacity"|"resource",
    "amount": float,
    "resource_id": "string"           // only for resource type
  }
}

Six boosters:

precipitation_enhancement
  duration_modifier_years: -5.0
  stability_modifier_percent: 0.0
  tag: "architect"
  availability_condition: { "type": "component_built", "component_id": "precipitation_engine" }
  ongoing_cost: {} (the Precipitation Engine's own power draw covers this)
  [→ Cursor: BioPhaseSystem checks availability_condition at composition time. If the condition
   isn't met, the booster slot is shown but grayed out with the unmet condition as tooltip.]

nutrient_orbital_drop
  duration_modifier_years: 0.0
  stability_modifier_percent: 8.0
  tag: "neutral"
  availability_condition: { "type": "always" }
  ongoing_cost: { "type": "resource", "amount": 20.0, "resource_id": "polar_volatiles" }

uv_amplification
  duration_modifier_years: 0.0
  stability_modifier_percent: 6.0
  tag: "architect"
  availability_condition: { "type": "always" }
  ongoing_cost: { "type": "gw_dyson", "amount": 3.0 }

atmospheric_micro_adjustment
  duration_modifier_years: 0.0
  stability_modifier_percent: 6.0
  tag: "architect"
  availability_condition: { "type": "always" }
  ongoing_cost: { "type": "rp_capacity", "amount": 20.0, "duration_years": 10 }
  [→ Cursor: this booster runs a simultaneous 10yr research track. BioPhaseSystem must
   start a pseudo-research track in GameState.active_research when this booster is active.
   Add a "pseudo_track_duration_years": 10 field for BioPhaseSystem to read.]

dome_accelerated_pre_seeding
  duration_modifier_years: 0.0
  stability_modifier_percent: 10.0
  tag: "naturalist"
  availability_condition: { "type": "component_built", "component_id": "biodome_on_planet" }
  ongoing_cost: {}

restored_earth_seedbank
  duration_modifier_years: 0.0
  stability_modifier_percent: 5.0
  tag: "naturalist"
  availability_condition: { "type": "flag_set", "flag": "earth_rewilding_done" }
  ongoing_cost: {}
  "passive": true
  [→ Cursor: passive: true means this booster is applied automatically when conditions are
   met — it does NOT occupy a booster slot. BioPhaseSystem applies it to stability calculation
   without needing the player to select it. Show it in the ProjectionPanel as "auto-applied".]
```

---

## B5 — `data/bio_phases.json`

```
Create data/bio_phases.json for Helioscape.

Two top-level keys: "mars" and "venus". Each is an array of 4 phase objects.

Each phase object:
{
  "id": "bio_1"|"bio_2"|"bio_3"|"bio_4",
  "display_name": "string",
  "job_description": "string — one sentence",
  "nominal_duration_years": int,
  "requirements_before_start": [
    { "type": "component_built"|"bio_phase_complete"|"bio_phase_progress"|
               "resource_available"|"flag_set"|"request_sent",
      ...relevant fields
    }
  ],
  "palette_categories": ["category_ids available in this phase"],
  "overlap_with_previous": true/false,
  "overlap_threshold_percent": 50,   // only on phases where overlap applies
  "spillover_on_complete": {         // nullable
    "event_id": "string",
    "unlocks_tech": "string"
  },
  "naturalist_tag_threshold": 0.5,   // fraction of required+optional slots that must be
                                      // naturalist-tagged for the phase commit to tag Naturalist
  "composition_slot_labels": {
    "required_1": "Foundation",
    "required_2": "Catalyst",
    "required_3": "Stabiliser",
    "optional_1": "Booster A",
    "optional_2": "Booster B"
  }
}

MARS:

bio_1 — "Ocean Seeding"
  nominal_duration_years: 30
  requirements_before_start: [
    { "type": "component_built", "component_id": "odn_mars" },
    { "type": "flag_set", "flag": "mars_water_delivery_complete" }
  ]
  palette_categories: ["pioneer_bacteria", "chemolithotroph", "aquatic_microbe", "aquatic_plant"]
  overlap_with_previous: false
  spillover_on_complete: { "event_id": "ce_mars_bio1_complete", "unlocks_tech": "mars_bio_1_spillover_moon_t2" }

bio_2 — "Soil Preparation"
  nominal_duration_years: 25
  requirements_before_start: [
    { "type": "bio_phase_progress", "phase": "bio_1", "min_percent": 50 },
    { "type": "component_built", "component_id": "precipitation_engine_mars" }
    // Path A: orbital lasers auto-repurposed — no extra component
    // Path B/C: { "type": "component_built", "component_id": "regolith_cultivator_mars" }
    // BioPhaseSystem checks active terraforming choices to determine which requirement applies
  ]
  palette_categories: ["nitrogen_fixer", "decomposer", "chemolithotroph", "early_plant"]
  overlap_with_previous: true
  overlap_threshold_percent: 50
  spillover_on_complete: { "event_id": "ce_mars_bio2_complete", "unlocks_tech": "earth_soil_restoration" }

bio_3 — "Coastal Pioneers"
  nominal_duration_years: 20
  requirements_before_start: [
    { "type": "bio_phase_complete", "phase": "bio_2" },
    { "type": "component_built", "component_id": "precipitation_engine_mars" },
    { "type": "request_sent", "request_id": "earth_seed_shipment" }
  ]
  palette_categories: ["early_plant", "decomposer", "insect"]
  overlap_with_previous: false
  spillover_on_complete: { "event_id": "ce_mars_bio3_complete", "unlocks_tech": "earth_rewilding" }

bio_4 — "Inland Spread"
  nominal_duration_years: 35
  requirements_before_start: [
    { "type": "bio_phase_complete", "phase": "bio_3" },
    { "type": "component_built", "component_id": "biodome_mars" },
    { "type": "request_sent", "request_id": "earth_embryo_shipment" }
  ]
  palette_categories: ["early_plant", "insect", "nitrogen_fixer"]
  overlap_with_previous: false
  spillover_on_complete: { "event_id": "ce_mars_bio4_complete", "unlocks_tech": null }

VENUS (same structure):

bio_1 — "Ocean Microbe Seeding"
  nominal_duration_years: 35
  requirements_before_start: [
    { "type": "component_built", "component_id": "odn_venus" },
    { "type": "flag_set", "flag": "venus_water_delivery_complete" }
  ]
  palette_categories: ["aquatic_microbe", "chemolithotroph", "pioneer_bacteria"]

bio_2 — "Atmospheric Oxygen"
  nominal_duration_years: 30
  requirements_before_start: [
    { "type": "bio_phase_progress", "phase": "bio_1", "min_percent": 50 },
    { "type": "component_built", "component_id": "atmospheric_catalyst_ships_venus",
      "min_count": 3 }
    // Vortex engine repurposing is auto-handled by BioPhaseSystem — no extra component
  ]
  palette_categories: ["pioneer_bacteria", "chemolithotroph", "nitrogen_fixer"]
  [→ Cursor: add a note that the Acidic Soil Remediation Package from Moon T2 is flagged
   near_mandatory for this phase — BioPhaseSystem shows a soft warning if it isn't in the
   composition at commit time.]

bio_3 — "Coastal Ecosystems"
  nominal_duration_years: 25
  requirements_before_start: [
    { "type": "bio_phase_complete", "phase": "bio_2" },
    { "type": "request_sent", "request_id": "earth_seed_shipment" }
  ]
  palette_categories: ["early_plant", "decomposer", "insect"]

bio_4 — "Inland Colonisation"
  nominal_duration_years: 40
  requirements_before_start: [
    { "type": "bio_phase_complete", "phase": "bio_3" },
    { "type": "component_built", "component_id": "biodome_venus" },
    { "type": "request_sent", "request_id": "earth_embryo_shipment" }
  ]
  palette_categories: ["early_plant", "insect", "nitrogen_fixer"]
```

---

## B6 — `data/mercury_components.json`

```
Create data/mercury_components.json for Helioscape.

This file defines all buildable infrastructure components queued through the Mercury production
system. Each component is distinct from resources (resources are raw materials; components
are built objects).

Each entry:
{
  "id": "string",
  "display_name": "string",
  "description": "string — one sentence",
  "target_planet": "mars"|"venus"|"both"|"solar",
  "cost": { "common_ore": int, "rare_metals": int, "polar_volatiles": int },
  "energy_draw_gw": float,           // ongoing draw once built
  "build_time_years": int,           // time to build in Mercury production
  "repeatable": true/false,          // can be queued multiple times (Bioreactor Landers)
  "max_instances": int,              // -1 = unlimited for repeatable
  "unlock_condition": "string — tech or flag required before this component appears in queue",
  "notes": "string"                  // plain-English operational notes
}

Components:

odn_mars
  display_name: "Orbital Dispersal Network (Mars)"
  cost: C400 R200 V50. energy_draw_gw: 5.0 (during active bio phases)
  build_time_years: 15. repeatable: false.
  unlock_condition: "mars_bio_1_requirements_approaching"
  notes: "One-time build. Required before Mars Bio I can begin."

odn_venus
  display_name: "Orbital Dispersal Network (Venus)"
  cost: C400 R200 V50. energy_draw_gw: 5.0 (during active bio phases)
  build_time_years: 15. repeatable: false.
  unlock_condition: "venus_bio_1_requirements_approaching"
  notes: "One-time build. Required before Venus Bio I can begin."

bioreactor_landers_mars
  display_name: "Bioreactor Landers — Mars (batch)"
  cost: C150 R30 V100. energy_draw_gw: 0.5 (per active batch)
  build_time_years: 3. repeatable: true. max_instances: -1
  notes: "Each batch seeds a region. More batches = faster bio phase progress. Volatiles = freeze-dried biological payload."

bioreactor_landers_venus
  display_name: "Bioreactor Landers — Venus (batch)"
  cost: C150 R30 V100. energy_draw_gw: 0.5
  build_time_years: 3. repeatable: true. max_instances: -1
  notes: "Same as Mars batch."

precipitation_engine_mars
  display_name: "Precipitation Engine (Mars)"
  cost: C600 R200 V0. energy_draw_gw: 25.0 (temporary, during relevant phases)
  build_time_years: 20. repeatable: true. max_instances: 2
  notes: "1 unit standard. Queue second unit for accelerated rainfall coverage. Also enables Precipitation Enhancement booster slot."
  unlock_condition: "mars_bio_2_approaching"

precipitation_engine_venus
  display_name: "Precipitation Engine (Venus)"
  cost: C600 R200 V0. energy_draw_gw: 25.0
  build_time_years: 20. repeatable: true. max_instances: 2
  unlock_condition: "venus_bio_3_approaching"

atmospheric_catalyst_ships_venus
  display_name: "Atmospheric Catalyst Ship (Venus)"
  cost: C300 R100 V80. energy_draw_gw: 8.0 (per vessel, temporary during Venus Bio II)
  build_time_years: 12. repeatable: true. max_instances: 4
  notes: "3 ships standard. 4 if vortex engines were not built. Atmospheric Fixer discovery reduces requirement to 2."
  unlock_condition: "venus_bio_2_approaching"

regolith_cultivator_mars
  display_name: "Regolith Cultivator (Mars)"
  cost: C250 R50 V0. energy_draw_gw: 0.0
  build_time_years: 10. repeatable: true. max_instances: 3
  notes: "Path B/C Mars Bio II only. Not needed if Path A orbital lasers are active."
  unlock_condition: "mars_bio_2_approaching AND NOT mars_path_a_orbital_lasers_active"
```

---

## B7 — `src/systems/BioPhaseSystem.gd`

```
Create src/systems/BioPhaseSystem.gd for Helioscape.

Responsibility: manage all bio phase state for Mars and Venus. Handle phase unlocking,
composition commit, duration calculation, stability calculation, phase progress ticks,
collapse detection, emergent discovery checks, booster application. Never talks to UI.

Connects to: EventBus.game_year_ticked, EventBus.terraforming_phase_changed,
             EventBus.culture_event_choice_made (for fauna/seed request actions),
             EventBus.tech_node_unlocked.
Modifies: GameState.bio_phases.
Emits: EventBus.bio_phase_available(planet_id, phase_id),
       EventBus.bio_phase_started(planet_id, phase_id),
       EventBus.bio_phase_completed(planet_id, phase_id),
       EventBus.bio_phase_collapsed(planet_id, phase_id),
       EventBus.emergent_discovery_found(planet_id, phase_id, organism_id),
       EventBus.bio_composition_commit_required(planet_id, phase_id).

[→ Cursor: add all new signals to EventBus.gd as well.]

--- Key functions ---

func _ready() -> void:
    _initialise_bio_state()
    EventBus.game_year_ticked.connect(_on_year_ticked)
    EventBus.terraforming_phase_changed.connect(_on_terraforming_phase_changed)
    EventBus.tech_node_unlocked.connect(_on_tech_unlocked)

func _initialise_bio_state() -> void:
    for planet_id in ["mars", "venus"]:
        if not GameState.bio_phases.has(planet_id):
            GameState.bio_phases[planet_id] = _blank_planet_bio_state()

func _on_year_ticked(year: float) -> void:
    for planet_id in ["mars", "venus"]:
        _tick_planet_bio(planet_id, year)

func _tick_planet_bio(planet_id: String, year: float) -> void:
    var bio: Dictionary = GameState.bio_phases[planet_id]
    # Check availability of next locked phases.
    _check_phase_availability(planet_id, bio)
    # Tick all running phases.
    for i in range(bio.phases.size()):
        var phase: Dictionary = bio.phases[i]
        if phase.status == "running":
            _tick_running_phase(planet_id, i, phase, year)

func _tick_running_phase(planet_id: String, phase_index: int, phase: Dictionary, year: float) -> void:
    phase.progress_years += 1.0
    # Check emergent discoveries (~10-15yr mark).
    _check_emergent_discoveries(planet_id, phase_index, phase, year)
    # Check collapse (only during first 20yr of phase, after which composition is locked in).
    if phase.progress_years <= 20.0:
        _check_collapse(planet_id, phase_index, phase)
    # Check completion.
    if phase.progress_years >= phase.duration_years:
        _complete_phase(planet_id, phase_index)

func _check_phase_availability(planet_id: String, bio: Dictionary) -> void:
    var phases_data: Array = DataManager.get_bio_phases(planet_id)
    for i in range(phases_data.size()):
        var phase: Dictionary = bio.phases[i]
        if phase.status != "locked":
            continue
        var phase_data: Dictionary = phases_data[i]
        if _requirements_met(planet_id, phase_data.requirements_before_start):
            phase.status = "available"
            EventBus.bio_composition_commit_required.emit(planet_id, phase_data.id)
            EventBus.bio_phase_available.emit(planet_id, phase_data.id)

func _requirements_met(planet_id: String, requirements: Array) -> bool:
    # Check each requirement object against GameState and return false if any unmet.
    # Requirement types: component_built, bio_phase_complete, bio_phase_progress,
    # flag_set, request_sent.
    # [→ Cursor: implement each case in a match block. For bio_phase_progress, check
    # GameState.bio_phases[planet_id].phases[i].progress_years /
    # phase.duration_years >= min_percent / 100.0]
    return true  # stub

func commit_composition(planet_id: String, phase_index: int, composition: Dictionary,
                         boosters: Array) -> void:
    # Called by EcosystemComposer when the player commits.
    # composition: { slot_id -> organism_id or package_id }
    # boosters: array of booster ids
    var phase: Dictionary = GameState.bio_phases[planet_id].phases[phase_index]
    phase.composition = composition
    phase.boosters = boosters
    phase.stability_percent = _calculate_stability(planet_id, phase_index, composition, boosters)
    phase.duration_years = _calculate_duration(planet_id, phase_index, composition,
                                                boosters, phase.stability_percent)
    phase.tag = _calculate_tag(composition, boosters)
    # Tag the decision for First Era Complete ratio.
    if phase.tag == "naturalist":
        GameState.naturalist_decisions += 1
    elif phase.tag == "architect":
        GameState.architect_decisions += 1
    phase.status = "running"
    phase.started_year = GameState.game_year
    EventBus.bio_phase_started.emit(planet_id, DataManager.get_bio_phases(planet_id)[phase_index].id)

func _calculate_stability(planet_id: String, phase_index: int,
                           composition: Dictionary, boosters: Array) -> float:
    # Start from 80.0% base. Apply modifiers:
    # +/- per compatible/incompatible pairs
    # + per booster stability modifier
    # + passive restored_earth_seedbank if condition met
    # + package bonuses if condition met (e.g. tundra package in sub-zero)
    # - engineered_nitrogen_factories alongside naturalist packages
    # [→ Cursor: implement fully. Load all organisms from DataManager. Check each pair in
    # the composition for compatible_with / incompatible_with. Sum all modifiers.
    # Clamp final result to 0.0-100.0. Return float.]
    return 80.0  # stub

func _calculate_duration(planet_id: String, phase_index: int, composition: Dictionary,
                          boosters: Array, stability: float) -> float:
    var phase_data: Dictionary = DataManager.get_bio_phases(planet_id)[phase_index]
    var base: float = float(phase_data.nominal_duration_years)
    # Apply compatible pair bonuses (-2 to -3yr per pair)
    # Apply incompatible pair penalties (+5yr each)
    # Apply booster duration modifiers
    # Apply stability penalty if stability < 75%: add randf_range(0, 15) yr
    # Clamp result: never below 5yr, never above base * 2.5
    # [→ Cursor: note this is the only system in the game with RNG. The random element is added
    # at commit time and stored in phase.duration_years — it doesn't re-roll on load.]
    return base  # stub

func _calculate_tag(composition: Dictionary, boosters: Array) -> String:
    # Count naturalist vs architect organisms in composition (required + optional slots).
    # Count booster tags.
    # Majority wins. Tie → neutral.
    # Ecosystem packages count as naturalist.
    # [→ Cursor: load each organism's tag from DataManager. Count naturalist and architect.
    # If hybrid_adaptives_organism is in composition, return "neutral" regardless.]
    return "neutral"  # stub

func _check_collapse(planet_id: String, phase_index: int, phase: Dictionary) -> void:
    # Collapse triggers if stability < 40% or predator_insects in composition without prey.
    if phase.stability_percent < 40.0:
        _trigger_collapse(planet_id, phase_index)
        return
    var composition: Dictionary = phase.composition
    if "predator_insects" in composition.values():
        var has_prey: bool = false
        for org_id in composition.values():
            var org: Dictionary = DataManager.get_organism(org_id)
            if org.get("category") == "insect" and org_id != "predator_insects":
                has_prey = true
        if not has_prey:
            _trigger_collapse(planet_id, phase_index)

func _trigger_collapse(planet_id: String, phase_index: int) -> void:
    var phase: Dictionary = GameState.bio_phases[planet_id].phases[phase_index]
    phase.status = "collapsed"
    phase.collapse_count += 1
    phase.duration_years += randf_range(15.0, 20.0)
    GameState.culture_event_queue.append("ce_bio_collapse_" + planet_id)
    EventBus.bio_phase_collapsed.emit(planet_id, DataManager.get_bio_phases(planet_id)[phase_index].id)
    # Planet vignette shifts to degraded state.
    EventBus.planet_visual_params_changed.emit(planet_id, {"bio_degraded": true})

func _check_emergent_discoveries(planet_id: String, phase_index: int,
                                  phase: Dictionary, year: float) -> void:
    if phase.progress_years < 10.0:
        return
    var discoveries: Array = DataManager.get_emergent_discoveries()
    for discovery in discoveries:
        if planet_id not in [discovery.planet, "both"]:
            continue
        if DataManager.get_bio_phases(planet_id)[phase_index].id not in discovery.bio_phases:
            continue
        if discovery.id in phase.get("checked_discoveries", []):
            continue  # already fired or already checked and failed
        if _discovery_conditions_met(discovery, planet_id, phase):
            _trigger_discovery(planet_id, phase_index, discovery)
            if not phase.has("checked_discoveries"):
                phase["checked_discoveries"] = []
            phase["checked_discoveries"].append(discovery.id)

func _discovery_conditions_met(discovery: Dictionary, planet_id: String, phase: Dictionary) -> bool:
    # Check organism combination in phase.composition.
    # Check trigger_condition_key against GameState.
    # [→ Cursor: implement the wildcard category check for hybrid_adaptives as described
    # in emergent_discoveries.json. For all other discoveries, check that all organism ids
    # in trigger_organisms are present in phase.composition.values().]
    return false  # stub

func _trigger_discovery(planet_id: String, phase_index: int, discovery: Dictionary) -> void:
    var bio: Dictionary = GameState.bio_phases[planet_id]
    bio.discovered_organisms.append(discovery.discovered_organism_id)
    GameState.culture_event_queue.append(discovery.ce_id)
    # Apply effects_on_discover if present.
    for effect in discovery.get("effects_on_discover", []):
        _apply_discovery_effect(effect, planet_id)
    # Unlock the Emergent slot in the current phase's composition (visual only — slot lights up).
    GameState.bio_phases[planet_id].phases[phase_index]["emergent_discovered"] = discovery.discovered_organism_id
    EventBus.emergent_discovery_found.emit(planet_id, DataManager.get_bio_phases(planet_id)[phase_index].id, discovery.discovered_organism_id)

func _complete_phase(planet_id: String, phase_index: int) -> void:
    var phase: Dictionary = GameState.bio_phases[planet_id].phases[phase_index]
    phase.status = "complete"
    phase.completed_year = GameState.game_year
    var phase_data: Dictionary = DataManager.get_bio_phases(planet_id)[phase_index]
    if phase_data.get("spillover_on_complete"):
        var spillover = phase_data.spillover_on_complete
        GameState.culture_event_queue.append(spillover.event_id)
        if spillover.get("unlocks_tech"):
            GameState.completed_techs.append(spillover.unlocks_tech)
    EventBus.bio_phase_completed.emit(planet_id, phase_data.id)

Static typing throughout.
```

---

## B8 — `src/systems/MercuryBuildQueue.gd`

```
Create src/systems/MercuryBuildQueue.gd for Helioscape.

Responsibility: manage the Mercury production queue for infrastructure components (as defined
in mercury_components.json). Separate from resource accumulation — this handles construction
of discrete objects. One queue, serial processing (one component builds at a time).

[→ Cursor: add a comment explaining why this is a separate system from DysonSystem and
ResourceSystem. Dyson panels accumulate continuously (resource-like). Mercury components are
discrete builds with fixed costs, build times, and named delivery targets. The queue is
first-in-first-out. The player can inspect and reorder the queue from the Mercury panel UI.]

Connects to: EventBus.game_year_ticked.
Modifies: GameState.mercury_resources (deducts costs on queue start), GameState.bio_phases
          (sets component_built flags on delivery).
Emits: EventBus.mercury_component_queued(component_id: String),
       EventBus.mercury_component_completed(component_id: String, target_planet: String).

[→ Cursor: add these signals to EventBus.gd.]

var build_queue: Array = []
# Each entry: { "component_id": String, "target_planet": String, "progress_years": float,
#               "total_years": float, "instance_index": int }

In GameState, also add:
  var mercury_build_queue: Array = []  # serialised in save/load
  var mercury_built_components: Dictionary = {}  # component_id -> count built

func _ready() -> void:
    EventBus.game_year_ticked.connect(_on_year_ticked)
    build_queue = GameState.mercury_build_queue  # restore from save

func _on_year_ticked(_year: float) -> void:
    if build_queue.is_empty():
        return
    var current: Dictionary = build_queue[0]
    current.progress_years += 1.0
    if current.progress_years >= current.total_years:
        _complete_build(current)
        build_queue.remove_at(0)
        GameState.mercury_build_queue = build_queue

func queue_component(component_id: String, target_planet: String) -> bool:
    var component: Dictionary = DataManager.get_mercury_component(component_id)
    if component.is_empty():
        push_error("Unknown component: " + component_id)
        return false
    # Check repeatable / max_instances constraint.
    var built_count: int = GameState.mercury_built_components.get(component_id, 0)
    if not component.get("repeatable", false) and built_count >= 1:
        return false
    if component.get("max_instances", -1) >= 0:
        if built_count >= component.max_instances:
            return false
    # Check unlock condition.
    if not _unlock_condition_met(component.get("unlock_condition", "")):
        return false
    # Deduct costs immediately on queue.
    if not _deduct_costs(component.cost):
        return false
    var entry: Dictionary = {
        "component_id": component_id,
        "target_planet": target_planet,
        "progress_years": 0.0,
        "total_years": float(component.build_time_years),
        "instance_index": built_count
    }
    build_queue.append(entry)
    GameState.mercury_build_queue = build_queue
    EventBus.mercury_component_queued.emit(component_id)
    return true

func _complete_build(entry: Dictionary) -> void:
    var component_id: String = entry.component_id
    var planet: String = entry.target_planet
    GameState.mercury_built_components[component_id] = GameState.mercury_built_components.get(component_id, 0) + 1
    # Set the relevant flag in GameState.bio_phases.
    _apply_component_arrival(component_id, planet)
    EventBus.mercury_component_completed.emit(component_id, planet)

func _apply_component_arrival(component_id: String, planet: String) -> void:
    match component_id:
        "odn_mars":       GameState.bio_phases["mars"]["odn_built"] = true
        "odn_venus":      GameState.bio_phases["venus"]["odn_built"] = true
        "bioreactor_landers_mars":
            GameState.bio_phases["mars"]["bioreactor_batches_active"] += 1
        "bioreactor_landers_venus":
            GameState.bio_phases["venus"]["bioreactor_batches_active"] += 1
        "precipitation_engine_mars":
            GameState.bio_phases["mars"]["precipitation_engines_built"] += 1
        "precipitation_engine_venus":
            GameState.bio_phases["venus"]["precipitation_engines_built"] += 1
        "atmospheric_catalyst_ships_venus":
            GameState.bio_phases["venus"]["atmospheric_catalyst_ships_built"] += 1
        "regolith_cultivator_mars":
            GameState.bio_phases["mars"]["regolith_cultivators_built"] += 1
    # [→ Cursor: add a comment noting that biodome components are handled by the existing
    # colonisation system and are not in mercury_components.json. The biodome_on_planet check
    # in BioPhaseSystem reads from a separate GameState flag set by that system.]

func _deduct_costs(cost: Dictionary) -> bool:
    # Check all resources sufficient before deducting.
    if GameState.mercury_resources.get("common_ore", 0.0) < cost.get("common_ore", 0):
        return false
    if GameState.mercury_resources.get("rare_metals", 0.0) < cost.get("rare_metals", 0):
        return false
    if GameState.mercury_resources.get("polar_volatiles", 0.0) < cost.get("polar_volatiles", 0):
        return false
    GameState.mercury_resources["common_ore"] -= cost.get("common_ore", 0)
    GameState.mercury_resources["rare_metals"] -= cost.get("rare_metals", 0)
    GameState.mercury_resources["polar_volatiles"] -= cost.get("polar_volatiles", 0)
    return true

func get_queue_display() -> Array:
    # Returns a copy of the queue with display-friendly data merged from DataManager.
    # Used by MercuryPanel UI.
    return []  # [→ Cursor: implement — merge component display_name and target_planet
               # into each entry from the queue array.]

Also add to DataManager.gd:
func get_mercury_component(component_id: String) -> Dictionary
func get_all_mercury_components() -> Array[Dictionary]
func get_bio_phases(planet_id: String) -> Array[Dictionary]
func get_organism(organism_id: String) -> Dictionary
func get_all_organisms() -> Array[Dictionary]
func get_ecosystem_packages() -> Array[Dictionary]
func get_emergent_discoveries() -> Array[Dictionary]
func get_boosters() -> Array[Dictionary]
And load the new data files in _ready().
```

---

## B9 — `src/ui/ecosystem_composer/EcosystemComposer.gd`

```
Create src/ui/ecosystem_composer/EcosystemComposer.gd for Helioscape.

Responsibility: root controller for the three-panel Ecosystem Composer interface. Opens when
a bio phase becomes available. Coordinates the three sub-panels. Handles the commit flow.

[→ Cursor: add a comment explaining the three-panel layout: left = ConditionsPanel (current
planetary conditions), centre = CompositionPanel (slots + booster slots), right = OrganismPalette
(browsable palette OR ProjectionPanel — they share the right panel and swap on "Preview" click).]

@export var planet_id: String = ""
var phase_index: int = -1
var _showing_projection: bool = false

Cached node refs:
  @onready var conditions_panel: ConditionsPanel = $ConditionsPanel
  @onready var composition_panel: CompositionPanel = $CompositionPanel
  @onready var organism_palette: OrganismPalette = $RightPanel/OrganismPalette
  @onready var projection_panel: ProjectionPanel = $RightPanel/ProjectionPanel
  @onready var commit_button: Button = $CommitButton
  @onready var preview_toggle: Button = $PreviewToggle

func open(pid: String, p_index: int) -> void:
    planet_id = pid
    phase_index = p_index
    conditions_panel.load_conditions(planet_id)
    composition_panel.setup(planet_id, phase_index)
    organism_palette.load_palette(planet_id, phase_index)
    _update_commit_button_state()
    visible = true

func _on_preview_toggle_pressed() -> void:
    _showing_projection = not _showing_projection
    organism_palette.visible = not _showing_projection
    projection_panel.visible = _showing_projection
    if _showing_projection:
        _refresh_projection()

func _refresh_projection() -> void:
    var composition: Dictionary = composition_panel.get_current_composition()
    var boosters: Array = composition_panel.get_current_boosters()
    projection_panel.display(planet_id, phase_index, composition, boosters)

func _on_composition_changed() -> void:
    _update_commit_button_state()
    if _showing_projection:
        _refresh_projection()

func _update_commit_button_state() -> void:
    var composition: Dictionary = composition_panel.get_current_composition()
    var required_filled: bool = composition.has("required_1") and \
                                 composition.has("required_2") and \
                                 composition.has("required_3")
    commit_button.disabled = not required_filled
    commit_button.text = "Commit composition" if required_filled else "Fill all required slots to commit"

func _on_commit_pressed() -> void:
    if commit_button.disabled:
        return
    var composition: Dictionary = composition_panel.get_current_composition()
    var boosters: Array = composition_panel.get_current_boosters()
    BioPhaseSystem.commit_composition(planet_id, phase_index, composition, boosters)
    visible = false
    EventBus.culture_event_triggered.emit("ce_bio_phase_committed_" + planet_id)

Connect to: EventBus.bio_composition_commit_required → open().
Connect to: EventBus.bio_phase_collapsed → reopen in redesign mode (composition pre-filled
  with previous failed composition, failure modes annotated on each organism card).
```

---

## B10 — `src/ui/ecosystem_composer/ConditionsPanel.gd`

```
Create src/ui/ecosystem_composer/ConditionsPanel.gd for Helioscape.

Responsibility: left panel. Display current planetary conditions as plain-English status tags.
Read-only. Updates between phases as the planet changes.

func load_conditions(planet_id: String) -> void:
    var planet: Dictionary = GameState.planets.get(planet_id, {})
    # Display each condition parameter with a plain-English status tag.

Parameters to display and how to derive plain-English tags:

atmosphere_pressure (from GameState.planets[planet_id].atmosphere_pressure):
  mars: <0.01 → "Trace atmosphere — nearly vacuum"
        0.01–0.1 → "Thin atmosphere — high-altitude Earth equivalent"
        0.1–0.5 → "Building — some weather developing"
        >0.5 → "Substantial atmosphere — pressure suit optional"
  venus: >10 → "Extreme pressure — crushing at surface"
         1–10 → "High pressure — survivable in sealed habitat"
         <1 → "Approaching Earth norms"

temperature_celsius:
  < -60 → "Extreme cold — cryophilic organisms only"
  -60 to -20 → "Severe cold — adapted pioneers viable"
  -20 to 0 → "Cold — tundra-specialist organisms"
  0 to 20 → "Temperate — broad organism tolerance"
  > 20 → "Warm — full palette available"
  > 200 → "Extreme heat — most organisms non-viable"

radiation_level (derive from planet phase: mars early = high, venus early = high under dense clouds):
  Display: "Extreme — UV-hardened organisms strongly recommended" / "High" / "Moderate" / "Low"

ocean_chemistry (derive from water presence and planet):
  mars with water: "Fresh to slightly saline — broad microbial tolerance"
  venus with water: "Residual acidity — sulphur-tolerant organisms recommended"
  no water: "No liquid water — aquatic organisms unavailable"

soil_state (derive from bio_phase progress):
  bio phase 0: "Raw regolith — no organic matter, extreme pH"
  bio phase 1 in progress: "Early mineral chemistry developing"
  bio phase 2 complete: "Basic soil established"
  bio phase 3+: "Growing soil complexity"

Each parameter displayed as a label-value pair: label = parameter name, value = status tag string.
Coloured status indicators: red = hostile, yellow = challenging, green = viable.

No logic — pure display. Reads GameState and derives tags.
```

---

## B11 — `src/ui/ecosystem_composer/CompositionPanel.gd`

```
Create src/ui/ecosystem_composer/CompositionPanel.gd for Helioscape.

Responsibility: centre panel. Five composition slots (3 required, 2 optional booster) and
1 locked emergent slot. Displays current selections. Shows compatibility warnings between
placed organisms. Signals parent when composition changes.

signal composition_changed()

var _composition: Dictionary = {}  # slot_id -> organism_id or package_id
var _boosters: Array = []           # array of booster ids in optional slots

func setup(planet_id: String, phase_index: int) -> void:
    _composition = {}
    _boosters = []
    _build_slots(planet_id, phase_index)

func _build_slots(planet_id: String, phase_index: int) -> void:
    # Build 3 required slot nodes (Foundation, Catalyst, Stabiliser labels).
    # Build 2 optional booster slot nodes.
    # Build 1 locked emergent slot node (show as locked by default).
    # Each slot is a Button/Panel that, when clicked empty, signals OrganismPalette to activate.
    # Each slot when filled shows the organism card (name, tag icon, brief role).

func place_organism(slot_id: String, organism_id: String) -> void:
    _composition[slot_id] = organism_id
    _refresh_compatibility_warnings()
    composition_changed.emit()

func place_booster(slot_index: int, booster_id: String) -> void:
    if _boosters.size() <= slot_index:
        _boosters.resize(slot_index + 1)
    _boosters[slot_index] = booster_id
    composition_changed.emit()

func remove_from_slot(slot_id: String) -> void:
    _composition.erase(slot_id)
    _refresh_compatibility_warnings()
    composition_changed.emit()

func _refresh_compatibility_warnings() -> void:
    # For every pair of organisms currently in composition slots:
    # - If organism A's incompatible_with contains organism B: show warning icon on both cards.
    # - Warning text: "These two compete for the same [resource] — adds ~5yr and reduces stability."
    # - If organism has dependency_warning and dependency not met: show caution icon.
    # [→ Cursor: load organism data from DataManager for each placed organism. Check all pairs.
    # Store warnings in a Dictionary: { slot_id -> warning_text } and update slot UI.]
    pass

func get_current_composition() -> Dictionary:
    return _composition.duplicate()

func get_current_boosters() -> Array:
    return _boosters.duplicate()

func unlock_emergent_slot(organism_id: String) -> void:
    # Called by EcosystemComposer when EventBus.emergent_discovery_found fires.
    # Light up the emergent slot, show the discovered organism card (display only — not selectable).
    pass
```

---

## B12 — `src/ui/ecosystem_composer/OrganismPalette.gd`

```
Create src/ui/ecosystem_composer/OrganismPalette.gd for Helioscape.

Responsibility: right panel in browse mode. Categorised scrollable list of organisms.
Locked organisms shown as silhouettes. Selection places organism in active slot.

func load_palette(planet_id: String, phase_index: int) -> void:
    # Load all organisms from DataManager.
    # Filter to those available in this phase (check bio_phases.json palette_categories).
    # Group by category.
    # Render each category header (always visible even if empty — builds anticipation for unlocks).
    # For each organism in category:
    #   - If unlocked (check GameState.completed_techs / bio discovered organisms / base unlock):
    #     Show full organism card.
    #   - If locked:
    #     Show silhouette card with silhouette_hint text.
    #   - If Moon T2 package: show package card with "Counts as 3 organisms" note.
    pass

Organism card contains: display_name, tag icon (Naturalist leaf / Architect gear / neutral dot),
ecological_role (one line), requires summary, outputs summary. Compact — this is a scrollable list.

var _active_slot_id: String = ""  # set by CompositionPanel when a slot is clicked

func set_active_slot(slot_id: String) -> void:
    _active_slot_id = slot_id
    # Highlight the palette to indicate selection mode.
    pass

func _on_organism_card_clicked(organism_id: String) -> void:
    if _active_slot_id == "":
        return  # no slot selected — just browsing
    # Place organism in the active slot.
    get_parent().get_parent().composition_panel.place_organism(_active_slot_id, organism_id)
    _active_slot_id = ""  # deactivate after placement
    # Deactivate palette highlight.
    pass

# Category order in palette:
# Pioneer Bacteria → Chemolithotrophs → Nitrogen-Fixers → Aquatic Microbes →
# Aquatic Plants → Decomposers → Early Plants → Insects → Ecosystem Packages (Moon T2)
```

---

## B13 — `src/ui/ecosystem_composer/ProjectionPanel.gd`

```
Create src/ui/ecosystem_composer/ProjectionPanel.gd for Helioscape.

Responsibility: right panel in projection mode. Shows projected outcome before commit.
Shown when player clicks "Preview composition" in EcosystemComposer.

func display(planet_id: String, phase_index: int,
             composition: Dictionary, boosters: Array) -> void:
    # Compute and display all projection data.
    # All values are derived from BioPhaseSystem calculation functions.

--- Sections to display ---

PROJECTED SCENE
  A small static pixel-art image showing the biosphere at estimated phase end.
  Image path derived from planet_id + phase_index + dominant_tag:
  res://assets/textures/ui/bio_projection_{planet}_{phase}_{tag}.png
  [→ Cursor: this image is an art asset that won't exist at code time. Show a placeholder
   ColorRect or a Label saying "Biosphere projection: {planet} Phase {phase}" until art exists.]

STABILITY METER
  A progress bar from 0–100%.
  Below the bar: annotated failure modes in plain English.
  Failure mode logic:
    - No decomposers in composition → 🟡 "No decomposers — organic matter will accumulate
      and choke photosynthesis around Year ~12"
    - Symbiotic fixers with no host plant → 🟡 "Nitrogen-fixers present but no anchor plant —
      nitrogen disperses before it's usable"
    - Compatible pair → 🟢 "{organism A} + {organism B} — good pairing"
    - Incompatible pair → 🔴 "{organism A} and {organism B} compete for {chemistry} —
      adds ~5yr and reduces stability by 10%"
    - near_mandatory package not used (Venus Bio II) → 🟡 soft warning
  [→ Cursor: derive each annotation by iterating the composition. Use organism data from
   DataManager for compatibilities. The annotation system is the main value of the projection
   panel — invest in making it clear and complete.]

DURATION ESTIMATE
  "Estimated duration: ~{years} years"
  Derived from BioPhaseSystem._calculate_duration() — call it here (read-only, no side effects).

NATURALIST/ARCHITECT LEAN
  "This composition leans {tag}" — derived from BioPhaseSystem._calculate_tag().
  Show the dominant tag icon alongside.

ACTIVE BOOSTERS SUMMARY
  List each selected booster: name + effect. Show "auto-applied" for passive boosters.

Note: all calculations here are preview-only. No GameState is modified. The commit button
in EcosystemComposer is what triggers the real calculation and save.
```

---

## B14 — Culture events additions (append to `data/culture_events.json`)

```
Append the following culture events to data/culture_events.json.

These events cover bio-phase milestones, collapses, emergent discoveries, and the food fork.
Add them to the existing culture_events array — do not replace existing events.

All follow the same schema as existing events. narrator_text: 1–3 short paragraphs,
present tense, first person plural, human not clinical.

--- Bio phase milestones ---

ce_mars_bio1_complete
  trigger: { type: "bio_phase_complete", planet: "mars", phase: "bio_1" }
  No choices. Two paragraphs. The ocean isn't clear yet, but it's alive.

ce_mars_bio2_complete
  trigger: bio_phase_complete, mars, bio_2
  No choices. One paragraph. Something in the soil that wasn't there before.

ce_mars_bio3_complete (is the spillover that unlocks Earth Rewilding)
  trigger: bio_phase_complete, mars, bio_3
  No choices. Two paragraphs. The coastline holds.

ce_mars_bio4_complete
  trigger: bio_phase_complete, mars, bio_4
  No choices. Three paragraphs. This is the Mars emotional climax — the inland spread is
  complete. Something is moving that we didn't put there.

ce_venus_bio1_complete
  trigger: bio_phase_complete, venus, bio_1
  No choices. One paragraph. The ocean chemistry is stabilising.

ce_venus_bio2_complete
  trigger: bio_phase_complete, venus, bio_2
  No choices. Two paragraphs. First oxygen from Venus.

--- Collapse events ---

ce_bio_collapse_mars
  trigger: bio_phase_collapsed, mars
  No choices. One paragraph. Understated. Use the exact narrator voice from the GDD:
  "The bloom didn't take. We seeded too early, or too thin, or with the wrong partners.
  The soil is still there. The water is still there. We try again."
  [→ Cursor: this is the one case where quoting the GDD directly is appropriate — the exact
  phrasing is intentional design. Implement it as written.]

ce_bio_collapse_venus
  trigger: bio_phase_collapsed, venus
  No choices. One paragraph. Same understated voice but Venus-specific: acid chemistry,
  residual sulphur, the patience required.

--- Emergent discoveries ---
(One CE per discovery. Each: 1-2 paragraphs. Something unexpected. The narrator is surprised,
not triumphant — they observed something they didn't engineer.)

ce_discovery_proto_soil — Mars only. Quiet amazement at the three organisms working together.
ce_discovery_uv_bloom — High UV environment. Photosynthesis adapted without us asking it to.
ce_discovery_hybrid_adaptives — One paragraph. The tension between natural and designed
  dissolves briefly: "We're not sure which parts are ours anymore."
ce_discovery_first_soil_fauna — Use near-verbatim from GDD: "Something moved in the dirt.
  Not bacteria. Not a plant. Something with segments."
ce_discovery_deep_chemo — Deep ocean event. We can't see it. We read it in the data.
ce_discovery_frost_pioneer — Brief. Cold region, something growing that shouldn't survive there.
ce_discovery_coastal_web — The coast is feeding itself. We weren't expecting that.
ce_discovery_atmospheric_fixer — Venus only. The chemistry is doing something we didn't design.

--- Automated Food Systems fork events ---

ce_food_fork_rewild
  trigger: fork_choice, food_systems_fork, rewild_freed_land
  No choices (fork already made). One paragraph. The fields are still warm from the last harvest.

ce_food_fork_develop
  trigger: fork_choice, food_systems_fork, develop_freed_land
  No choices. One paragraph. The ground plans for the expansion district are already drafted.

--- Architect branch events ---

ce_megacity_50m — First city hits 50M within its boundary. One paragraph. What a city becomes.
ce_first_arcology — First arcology goes online. Architect tone. Efficient. Optimised. A city
  that regulates itself.
ce_subsurface_life — First people who prefer underground. An intimate CE about choosing depth.
ce_grid_prevents_famine — One paragraph. The data model caught it three years early. Nobody
  went hungry.
ce_neural_digital_debate — Two paragraphs + two choices: [Embrace openly] / [Research quietly].
  This is the major philosophical CE for the Architect late path. Both choices are Architect —
  the question is how visible this transformation should be.
ce_coordination_network_online — Capstone. Two paragraphs. Earth runs as designed. What that
  means. What humans do now.
```

---

## Checklist: new DataManager functions to add

```
After creating all data files above, open DataManager.gd and add the following accessor
functions. Each follows the same pattern as existing accessors: load from cached Dictionary
on _ready, return by id or return full array.

New data files to load in _ready():
  organisms.json → cached as _organisms: Dictionary
  ecosystem_packages.json → cached as _ecosystem_packages: Dictionary
  emergent_discoveries.json → cached as _emergent_discoveries: Array
  boosters.json → cached as _boosters: Dictionary
  bio_phases.json → cached as _bio_phases: Dictionary  (keyed by planet_id)
  mercury_components.json → cached as _mercury_components: Dictionary

New accessor functions:
  get_organism(id: String) -> Dictionary
  get_all_organisms() -> Array[Dictionary]
  get_organisms_by_category(category: String) -> Array[Dictionary]
  get_ecosystem_package(id: String) -> Dictionary
  get_ecosystem_packages() -> Array[Dictionary]
  get_emergent_discoveries() -> Array[Dictionary]
  get_booster(id: String) -> Dictionary
  get_all_boosters() -> Array[Dictionary]
  get_bio_phases(planet_id: String) -> Array[Dictionary]
  get_bio_phase(planet_id: String, phase_id: String) -> Dictionary
  get_mercury_component(id: String) -> Dictionary
  get_all_mercury_components() -> Array[Dictionary]
```

---

*End of bio-phase + tech tree prompts. Run Part A before Part B — bio phases depend on the
GameState additions in A2. Run B8 (DataManager additions) last, after all data files are written.*
