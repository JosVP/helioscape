class_name CultureEventCard
extends PanelContainer

# Displays a single culture event: portrait vignette, title, narrator text, choices.
#
# narrator_text in culture_events.json is a single string with paragraph breaks ("\n\n").
# We render it via a single RichTextLabel — Godot 4's RichTextLabel handles "\n\n" cleanly
# without BBCode and correctly supports visible_ratio for the typewriter effect.

var _current_event_id: String = ""
var _typewriter_tween: Tween = null
var _typewriter_complete: bool = false
var _choice_buttons: Array[Button] = []

@onready var _portrait_texture: TextureRect = $HBoxContainer/PortraitTexture
@onready var _title_label: Label = $HBoxContainer/ContentColumn/TitleLabel
@onready var _narrator_text: RichTextLabel = $HBoxContainer/ContentColumn/NarratorText
@onready var _choices_container: VBoxContainer = $HBoxContainer/ContentColumn/ChoicesContainer


func _ready() -> void:
	EventBus.culture_event_triggered.connect(_on_event_triggered)
	visible = false


func _on_event_triggered(event_id: String) -> void:
	var event: Dictionary = DataManager.get_culture_event(event_id)
	if event.is_empty():
		push_warning("CultureEventCard: unknown event id '%s'" % event_id)
		return

	_current_event_id = event_id
	_typewriter_complete = false

	# Portrait
	var portrait_path: String = String(event.get("portrait", ""))
	if portrait_path != "" and ResourceLoader.exists(portrait_path):
		_portrait_texture.texture = load(portrait_path)
	else:
		_portrait_texture.texture = null

	# Title
	_title_label.text = String(event.get("title", ""))

	# Narrator text — typewriter via visible_ratio
	var narrator_text: String = String(event.get("narrator_text", ""))
	_narrator_text.text = narrator_text
	_narrator_text.visible_ratio = 0.0

	if _typewriter_tween:
		_typewriter_tween.kill()
	_typewriter_tween = create_tween()
	var duration: float = clampf(float(narrator_text.length()) * 0.03, 2.0, 8.0)
	_typewriter_tween.tween_property(_narrator_text, "visible_ratio", 1.0, duration)
	_typewriter_tween.finished.connect(func() -> void: _typewriter_complete = true)

	_build_choices(event.get("choices", []) as Array)
	visible = true


func _build_choices(choices: Array) -> void:
	# Remove previous buttons
	for btn: Button in _choice_buttons:
		btn.queue_free()
	_choice_buttons.clear()

	if choices.is_empty():
		# Show a default "Continue" button when there are no narrative choices
		var continue_btn: Button = Button.new()
		continue_btn.text = "Continue"
		continue_btn.pressed.connect(func() -> void: _on_choice_made(_current_event_id, ""))
		_choices_container.add_child(continue_btn)
		_choice_buttons.append(continue_btn)
		return

	for choice_variant: Variant in choices:
		var choice: Dictionary = choice_variant
		var btn: Button = Button.new()
		btn.text = String(choice.get("label", ""))
		var choice_id: String = String(choice.get("id", ""))
		btn.pressed.connect(func() -> void: _on_choice_made(_current_event_id, choice_id))
		_choices_container.add_child(btn)
		_choice_buttons.append(btn)

	# Focus the first choice so Tab cycles through them immediately
	if not _choice_buttons.is_empty():
		_choice_buttons[0].grab_focus()


func _on_choice_made(event_id: String, choice_id: String) -> void:
	if choice_id != "":
		EventBus.culture_event_choice_made.emit(event_id, choice_id)
	_dismiss()


func _dismiss() -> void:
	_current_event_id = ""
	if _typewriter_tween:
		_typewriter_tween.kill()
		_typewriter_tween = null
	visible = false
	EventBus.culture_event_dismissed.emit(_current_event_id)


func _skip_typewriter() -> void:
	if _typewriter_complete:
		return
	if _typewriter_tween:
		_typewriter_tween.kill()
		_typewriter_tween = null
	_narrator_text.visible_ratio = 1.0
	_typewriter_complete = true


# Clicking anywhere on the card skips the typewriter; once complete it does nothing.
func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mouse_event: InputEventMouseButton = event
		if mouse_event.pressed and mouse_event.button_index == MOUSE_BUTTON_LEFT:
			if not _typewriter_complete:
				_skip_typewriter()
				get_viewport().set_input_as_handled()


func _input(event: InputEvent) -> void:
	if not visible:
		return

	if event.is_action_pressed("ui_accept"):
		# Enter / Space: skip typewriter, or confirm first choice
		if not _typewriter_complete:
			_skip_typewriter()
		elif not _choice_buttons.is_empty():
			_choice_buttons[0].emit_signal("pressed")
		get_viewport().set_input_as_handled()
