class_name AudioManager
extends Node

const MUSIC_SOLAR_SYSTEM: String = "res://assets/audio/music/solar_system_ambient.wav"
const MUSIC_PLANET_EARTH: String = "res://assets/audio/music/earth_theme.wav"
const MUSIC_PLANET_MARS: String = "res://assets/audio/music/mars_theme.wav"
const MUSIC_PLANET_VENUS: String = "res://assets/audio/music/venus_theme.wav"
const MUSIC_BIO_PHASE_ACTIVE: String = "res://assets/audio/music/bio_phase_layer.wav"

const SFX_TECH_UNLOCKED: String = "res://assets/audio/sfx/tech_unlocked.wav"
const SFX_BIO_PHASE_COMMIT: String = "res://assets/audio/sfx/bio_commit.wav"
const SFX_BIO_COLLAPSE: String = "res://assets/audio/sfx/bio_collapse.wav"
const SFX_DISCOVERY: String = "res://assets/audio/sfx/emergent_discovery.wav"
const SFX_MILESTONE: String = "res://assets/audio/sfx/milestone.wav"
const SFX_CULTURE_EVENT: String = "res://assets/audio/sfx/culture_event_chime.wav"
const SFX_BUTTON_CLICK: String = "res://assets/audio/sfx/button_click.wav"
const SFX_PANEL_OPEN: String = "res://assets/audio/sfx/panel_open.wav"

const SFX_POOL_SIZE: int = 8
const MUSIC_BUS_NAME: String = "Music"
const AMBIENT_BUS_NAME: String = "Ambient"
const SFX_BUS_NAME: String = "SFX"
const SILENT_DB: float = -80.0
const DEFAULT_MUSIC_DB: float = 0.0
const DEFAULT_LAYER_FADE_DURATION: float = 3.0

var _music_layer_a: AudioStreamPlayer
var _music_layer_b: AudioStreamPlayer
var _music_ambient: AudioStreamPlayer
var _sfx_pool: Array[AudioStreamPlayer] = []
var _stream_cache: Dictionary[String, AudioStream] = {}
var _sfx_cursor: int = 0
var _music_tween: Tween
var _music_layer_tween: Tween
var _ambient_tween: Tween

func _ready() -> void:
	# Centralising audio keeps volume control, fade timing, and layered crossfades consistent.
	# If each scene owned its own players, coordinating planet themes, ambient beds, and bio-phase overlays would become brittle quickly.
	_process_mode = Node.PROCESS_MODE_ALWAYS
	_music_layer_a = _create_music_player("MusicLayerA")
	_music_layer_b = _create_music_player("MusicLayerB")
	_music_ambient = _create_music_player("MusicAmbient", AMBIENT_BUS_NAME)
	_build_sfx_pool()
	_connect_event_bus_signals()
	play_music(MUSIC_SOLAR_SYSTEM, 0.0)

func play_music(stream_path: String, crossfade_duration: float = 2.0) -> void:
	var stream: AudioStream = _load_stream(stream_path)
	if stream == null:
		return

	_stop_tween(_music_tween)
	if not _music_layer_a.playing or is_zero_approx(crossfade_duration):
		_music_layer_a.stream = stream
		_music_layer_a.volume_db = DEFAULT_MUSIC_DB
		_music_layer_a.play()
		return

	_music_tween = create_tween()
	_music_tween.tween_property(_music_layer_a, "volume_db", SILENT_DB, crossfade_duration * 0.5)
	_music_tween.tween_callback(Callable(self, "_swap_primary_music").bind(stream))
	_music_tween.tween_property(_music_layer_a, "volume_db", DEFAULT_MUSIC_DB, crossfade_duration * 0.5)

func play_music_layer(stream_path: String, volume_db: float = -6.0) -> void:
	var stream: AudioStream = _load_stream(stream_path)
	if stream == null:
		return

	_stop_tween(_music_layer_tween)
	_music_layer_b.stream = stream
	_music_layer_b.volume_db = SILENT_DB
	if not _music_layer_b.playing:
		_music_layer_b.play()
	_music_layer_tween = create_tween()
	_music_layer_tween.tween_property(_music_layer_b, "volume_db", volume_db, DEFAULT_LAYER_FADE_DURATION)

func stop_music_layer() -> void:
	if not _music_layer_b.playing:
		return

	_stop_tween(_music_layer_tween)
	_music_layer_tween = create_tween()
	_music_layer_tween.tween_property(_music_layer_b, "volume_db", SILENT_DB, DEFAULT_LAYER_FADE_DURATION)
	_music_layer_tween.tween_callback(Callable(self, "_stop_secondary_music"))

func play_ambient(stream_path: String, fade_duration: float = 2.0) -> void:
	var stream: AudioStream = _load_stream(stream_path)
	if stream == null:
		return

	_stop_tween(_ambient_tween)
	if not _music_ambient.playing or is_zero_approx(fade_duration):
		_music_ambient.stream = stream
		_music_ambient.volume_db = DEFAULT_MUSIC_DB
		_music_ambient.play()
		return

	_ambient_tween = create_tween()
	_ambient_tween.tween_property(_music_ambient, "volume_db", SILENT_DB, fade_duration * 0.5)
	_ambient_tween.tween_callback(Callable(self, "_swap_ambient_music").bind(stream))
	_ambient_tween.tween_property(_music_ambient, "volume_db", DEFAULT_MUSIC_DB, fade_duration * 0.5)

func stop_ambient(fade_duration: float = 2.0) -> void:
	if not _music_ambient.playing:
		return

	_stop_tween(_ambient_tween)
	_ambient_tween = create_tween()
	_ambient_tween.tween_property(_music_ambient, "volume_db", SILENT_DB, fade_duration)
	_ambient_tween.tween_callback(Callable(self, "_stop_ambient_music"))

func play_sfx(stream_path: String) -> void:
	var stream: AudioStream = _load_stream(stream_path)
	if stream == null:
		return

	var player: AudioStreamPlayer = _get_available_sfx_player()
	player.stream = stream
	player.play()

func set_master_volume(linear: float) -> void:
	_set_bus_volume("Master", linear)

func set_music_volume(linear: float) -> void:
	_set_bus_volume(MUSIC_BUS_NAME, linear)

func _on_planet_selected(planet_id: String) -> void:
	match planet_id:
		"earth":
			play_music(MUSIC_PLANET_EARTH)
		"mars":
			play_music(MUSIC_PLANET_MARS)
		"venus":
			play_music(MUSIC_PLANET_VENUS)
		_:
			play_music(MUSIC_SOLAR_SYSTEM)

func _on_tech_node_unlocked(_planet_id: String, _node_id: String) -> void:
	play_sfx(SFX_TECH_UNLOCKED)

func _on_culture_event_triggered(_event_id: String) -> void:
	play_sfx(SFX_CULTURE_EVENT)

func _on_kardashev_milestone_reached(_milestone_id: String) -> void:
	play_sfx(SFX_MILESTONE)

func _on_bio_phase_collapsed(_planet_id: String, _phase_id: String = "") -> void:
	play_sfx(SFX_BIO_COLLAPSE)

func _on_bio_phase_started(_planet_id: String, _phase_id: String = "") -> void:
	play_music_layer(MUSIC_BIO_PHASE_ACTIVE)

func _on_bio_phase_completed(_planet_id: String, _phase_id: String = "") -> void:
	stop_music_layer()

func _on_emergent_discovery_found(_planet_id: String, _slot_index: int = -1, _discovery: Variant = null) -> void:
	play_sfx(SFX_DISCOVERY)

func _create_music_player(player_name: String, bus_name: String = MUSIC_BUS_NAME) -> AudioStreamPlayer:
	var player: AudioStreamPlayer = AudioStreamPlayer.new()
	player.name = player_name
	player.bus = bus_name if _has_audio_bus(bus_name) else "Master"
	player.volume_db = SILENT_DB
	add_child(player)
	return player

func _build_sfx_pool() -> void:
	# The SFX pool avoids allocating and freeing players during gameplay spikes.
	# Reusing a small fixed pool is predictable and cheap, and if all players are busy we recycle one instead of stalling playback.
	for index: int in range(SFX_POOL_SIZE):
		var player: AudioStreamPlayer = AudioStreamPlayer.new()
		player.name = "SFXPlayer%d" % index
		player.bus = SFX_BUS_NAME if _has_audio_bus(SFX_BUS_NAME) else "Master"
		add_child(player)
		_sfx_pool.append(player)

func _connect_event_bus_signals() -> void:
	if not has_node("/root/EventBus"):
		push_warning("AudioManager: EventBus autoload is not available yet.")
		return

	var event_bus: Node = get_node("/root/EventBus")
	_connect_signal_if_present(event_bus, "tech_node_unlocked", Callable(self, "_on_tech_node_unlocked"))
	_connect_signal_if_present(event_bus, "culture_event_triggered", Callable(self, "_on_culture_event_triggered"))
	_connect_signal_if_present(event_bus, "kardashev_milestone_reached", Callable(self, "_on_kardashev_milestone_reached"))
	_connect_signal_if_present(event_bus, "bio_phase_collapsed", Callable(self, "_on_bio_phase_collapsed"))
	_connect_signal_if_present(event_bus, "emergent_discovery_found", Callable(self, "_on_emergent_discovery_found"))
	_connect_signal_if_present(event_bus, "bio_phase_started", Callable(self, "_on_bio_phase_started"))
	_connect_signal_if_present(event_bus, "bio_phase_completed", Callable(self, "_on_bio_phase_completed"))
	_connect_signal_if_present(event_bus, "planet_selected", Callable(self, "_on_planet_selected"))

func _connect_signal_if_present(source: Node, signal_name: StringName, callback: Callable) -> void:
	if not source.has_signal(signal_name):
		push_warning("AudioManager: EventBus signal '%s' is not declared yet." % signal_name)
		return
	if not source.is_connected(signal_name, callback):
		source.connect(signal_name, callback)

func _load_stream(stream_path: String) -> AudioStream:
	if _stream_cache.has(stream_path):
		return _stream_cache[stream_path]
	if not ResourceLoader.exists(stream_path):
		push_warning("AudioManager: missing audio stream at %s" % stream_path)
		return null

	var stream: Resource = load(stream_path)
	if stream == null or not stream is AudioStream:
		push_warning("AudioManager: failed to load audio stream at %s" % stream_path)
		return null

	var typed_stream: AudioStream = stream as AudioStream
	_stream_cache[stream_path] = typed_stream
	return typed_stream

func _get_available_sfx_player() -> AudioStreamPlayer:
	for player: AudioStreamPlayer in _sfx_pool:
		if not player.playing:
			return player

	var fallback: AudioStreamPlayer = _sfx_pool[_sfx_cursor]
	_sfx_cursor = (_sfx_cursor + 1) % _sfx_pool.size()
	return fallback

func _swap_primary_music(stream: AudioStream) -> void:
	_music_layer_a.stop()
	_music_layer_a.stream = stream
	_music_layer_a.play()

func _swap_ambient_music(stream: AudioStream) -> void:
	_music_ambient.stop()
	_music_ambient.stream = stream
	_music_ambient.play()

func _stop_secondary_music() -> void:
	_music_layer_b.stop()
	_music_layer_b.stream = null

func _stop_ambient_music() -> void:
	_music_ambient.stop()
	_music_ambient.stream = null

func _set_bus_volume(bus_name: String, linear: float) -> void:
	if not _has_audio_bus(bus_name):
		push_warning("AudioManager: audio bus '%s' does not exist." % bus_name)
		return

	var clamped_linear: float = clampf(linear, 0.0001, 1.0)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(bus_name), linear_to_db(clamped_linear))

func _has_audio_bus(bus_name: String) -> bool:
	return AudioServer.get_bus_index(bus_name) != -1

func _stop_tween(tween: Tween) -> void:
	if tween != null and tween.is_valid():
		tween.kill()