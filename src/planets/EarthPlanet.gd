class_name EarthPlanet
extends PlanetBase


func _init() -> void:
	planet_id = "earth"


func get_terraforming_display_name(_phase: int) -> String:
	return "Home World"


func get_current_phase_description() -> String:
	if GameState.completed_techs.has("earth_rewilding"):
		return "We are restoring balance at home, and Earth is beginning to look like a promise we kept."
	if GameState.completed_techs.has("earth_ocean_acidification_reversal"):
		return "We have turned back ocean acidification, and coastal life is returning to waters we nearly lost."
	if GameState.completed_techs.has("earth_fusion_ignition_theory"):
		return "We proved fusion ignition in theory, and every planning horizon suddenly stretches farther than before."
	if GameState.completed_techs.has("earth_deuterium_extraction"):
		return "We are pulling fuel from the sea at scale, turning patience into a measurable energy future."
	if GameState.completed_techs.has("earth_launch_mercury_mission"):
		return "We are no longer confined to one world, and Earth now speaks in decades instead of news cycles."
	return "We are still learning to care for the world that made us while preparing to carry life beyond it."


func get_unlock_condition() -> String:
	return ""


func is_unlocked() -> bool:
	return true


func get_kardashev_description() -> String:
	var level: float = GameState.kardashev_level
	if level < 0.9:
		return "Pre-Type I: we are coordinating planetary industry, but our systems are still fragile."
	if level < 1.1:
		return "Type I threshold: we are starting to manage energy at a true planetary scale."
	if level < 1.6:
		return "Interplanetary ascent: we are stabilising multiple worlds and scaling beyond Earth alone."
	if level < 2.0:
		return "Near Type II: we are shaping the inner system with sustained, deliberate power."
	return "Type II civilisation: we harvest stellar-scale energy and plan in centuries."


func get_moon_research_summary() -> Dictionary:
	var active_count: int = 0
	var completed_count: int = 0
	var available_count: int = 0
	var moon_tracks: Array[Dictionary] = DataManager.get_research_tracks_for("moon")
	var active_track_ids: Array[String] = []

	for entry_variant: Variant in GameState.active_research:
		if not (entry_variant is Dictionary):
			continue
		var entry: Dictionary = entry_variant
		if String(entry.get("planet_id", "")) != "moon":
			continue
		active_count += 1
		active_track_ids.append(String(entry.get("track_id", "")))

	for track: Dictionary in moon_tracks:
		var track_id: String = String(track.get("id", ""))
		if track_id.is_empty():
			continue
		if GameState.completed_techs.has(track_id):
			completed_count += 1
			continue
		if active_track_ids.has(track_id):
			continue

		var prerequisite_tech: String = String(track.get("prerequisite_tech", ""))
		if prerequisite_tech.is_empty() or GameState.completed_techs.has(prerequisite_tech):
			available_count += 1

	return {"active": active_count, "completed": completed_count, "available": available_count}
