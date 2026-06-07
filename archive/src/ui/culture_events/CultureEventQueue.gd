class_name CultureEventQueue
extends Control

# Toast notification system + bell icon. Coordinates with CultureEventCard.
#
# CultureEventQueue does NOT automatically open CultureEventCard — it shows
# toast notifications and updates the bell icon. The player chooses when to
# read queued events by clicking the bell or a toast. This preserves the
# "culture events do not pause the game" design: the player reads at their
# own pace.

const TOAST_DURATION: float = 8.0
const TOAST_SLIDE_DURATION: float = 0.3
const TOAST_FADE_DURATION: float = 0.5

var unread_count: int = 0
var queued_event_ids: Array[String] = []

@onready var _bell_icon: Button = $BellIcon
@onready var _unread_badge: Label = $BellIcon/UnreadBadge
@onready var _toast_container: VBoxContainer = $ToastContainer
@onready var _bell_dropdown: PanelContainer = $BellDropdown
@onready var _dropdown_list: VBoxContainer = $BellDropdown/ScrollContainer/DropdownList
@onready var _culture_event_card: CultureEventCard = $CultureEventCard


func _ready() -> void:
	EventBus.culture_event_triggered.connect(_on_event_triggered)
	EventBus.culture_event_dismissed.connect(_on_card_dismissed)

	_bell_icon.pressed.connect(_on_bell_clicked)
	_bell_dropdown.visible = false
	_update_bell_icon()


func _on_event_triggered(event_id: String) -> void:
	unread_count += 1
	queued_event_ids.append(event_id)
	_update_bell_icon()
	_show_toast(event_id)
	_rebuild_dropdown()


func _show_toast(event_id: String) -> void:
	var event: Dictionary = DataManager.get_culture_event(event_id)
	if event.is_empty():
		return

	var toast: PanelContainer = PanelContainer.new()
	var hbox: HBoxContainer = HBoxContainer.new()
	var title_label: Label = Label.new()

	title_label.text = String(event.get("title", event_id))
	title_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(title_label)
	toast.add_child(hbox)

	# Start off-screen to the left, slide in
	toast.modulate.a = 0.0
	_toast_container.add_child(toast)

	# Clicking the toast opens the event card
	var gui_input: Callable = func(input_event: InputEvent) -> void:
		if input_event is InputEventMouseButton:
			var mb: InputEventMouseButton = input_event
			if mb.pressed and mb.button_index == MOUSE_BUTTON_LEFT:
				open_event_card(event_id)
	toast.gui_input.connect(gui_input)

	# Slide-in + fade-in
	var tween: Tween = create_tween()
	tween.tween_property(toast, "modulate:a", 1.0, TOAST_SLIDE_DURATION)
	# Stay visible, then fade out and remove
	tween.tween_interval(TOAST_DURATION)
	tween.tween_property(toast, "modulate:a", 0.0, TOAST_FADE_DURATION)
	tween.tween_callback(toast.queue_free)


func _update_bell_icon() -> void:
	if unread_count > 0:
		_unread_badge.text = str(unread_count)
		_unread_badge.visible = true
	else:
		_unread_badge.text = ""
		_unread_badge.visible = false


func open_event_card(event_id: String) -> void:
	if not queued_event_ids.has(event_id):
		return
	_culture_event_card._on_event_triggered(event_id)
	queued_event_ids.erase(event_id)
	unread_count = max(0, unread_count - 1)
	_update_bell_icon()
	_bell_dropdown.visible = false
	_rebuild_dropdown()


func _on_bell_clicked() -> void:
	_bell_dropdown.visible = not _bell_dropdown.visible
	if _bell_dropdown.visible:
		_rebuild_dropdown()


func _rebuild_dropdown() -> void:
	# Clear existing rows
	for child: Node in _dropdown_list.get_children():
		child.queue_free()

	if queued_event_ids.is_empty():
		var empty_label: Label = Label.new()
		empty_label.text = "No unread events."
		_dropdown_list.add_child(empty_label)
		return

	for event_id: String in queued_event_ids:
		var event: Dictionary = DataManager.get_culture_event(event_id)
		var row: HBoxContainer = HBoxContainer.new()

		var name_label: Label = Label.new()
		name_label.text = String(event.get("title", event_id))
		name_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(name_label)

		var read_btn: Button = Button.new()
		read_btn.text = "Read"
		var eid: String = event_id  # capture for closure
		read_btn.pressed.connect(func() -> void: open_event_card(eid))
		row.add_child(read_btn)

		_dropdown_list.add_child(row)


# Called by CultureEventCard (via EventBus.culture_event_dismissed) when the player dismisses.
# No auto-next — the player controls pacing through the bell or toasts.
func _on_card_dismissed(_event_id: String) -> void:
	pass


func after_card_dismissed() -> void:
	# Intentionally empty — no auto-next by design.
	pass
