extends Node

# Time
signal game_year_ticked(year: float)

# Tech + Research
signal tech_node_unlocked(planet_id: String, node_id: String)
signal tech_node_available(planet_id: String, node_id: String)
signal research_track_started(track_id: String)
signal research_track_completed(track_id: String)
signal spillover_unlocked(tech_id: String)

# Terraforming
signal terraforming_phase_changed(planet_id: String, phase: int)
signal terraforming_path_chosen(planet_id: String, path_id: String)
signal planet_visual_params_changed(planet_id: String, params: Dictionary)
signal planet_selected(planet_id: String)

# Bio phase
signal bio_phase_started(planet_id: String, phase_id: String)
signal bio_phase_completed(planet_id: String, phase_id: String)
signal bio_phase_collapsed(planet_id: String, phase_id: String)
signal emergent_discovery_found(planet_id: String, slot_index: int, discovery: Variant)

# Resources (Mercury)
signal resource_accumulated(resource_type: String, amount: float)
signal component_queued(component_id: String)
signal component_completed(component_id: String)

# Dyson
signal dyson_panel_produced(count: int)
signal dyson_energy_updated(watts: float)

# Culture Events
signal culture_event_triggered(event_id: String)
signal culture_event_dismissed(event_id: String)

# Kardashev
signal kardashev_milestone_reached(milestone_id: String)
signal kardashev_tag_applied(tag: String)

# Game lifecycle
signal game_started
signal game_saved
signal game_loaded
