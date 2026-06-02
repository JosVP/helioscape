## README
## 1. Open Project Settings -> General -> GUI -> Theme -> Custom.
## 2. Set it to res://assets/theme/helioscape_theme.tres.
## This script can generate the theme resource, but Godot does not expose setting the
## project-wide default theme through this script.

@tool
extends SceneTree

const THEME_PATH: String = "res://assets/theme/helioscape_theme.tres"
const COLOR_NODE_TYPE: String = "Global"

const BG_BASE: Color = Color("#0d0d0f")
const BG_SURFACE: Color = Color("#161618")
const BG_ELEVATED: Color = Color("#1e1e22")
const BG_OVERLAY: Color = Color("#000000aa")

const TEXT_PRIMARY: Color = Color("#e8e0d4")
const TEXT_SECONDARY: Color = Color("#8a8070")
const TEXT_DISABLED: Color = Color("#4a4440")

const ACCENT: Color = Color("#c8861e")
const ACCENT_DIM: Color = Color("#8a5c14")
const ACCENT_GLOW: Color = Color("#e8a030")

const STATUS_GOOD: Color = Color("#5a9e5a")
const STATUS_WARN: Color = Color("#c8a020")
const STATUS_BAD: Color = Color("#9e3a2a")
const STATUS_NEUTRAL: Color = Color("#4a6a8a")

const PLANET_EARTH: Color = Color("#3a7ab8")
const PLANET_MERCURY: Color = Color("#8a7a5a")
const PLANET_MARS: Color = Color("#b84a2a")
const PLANET_VENUS: Color = Color("#c8a030")

const TAG_NATURALIST: Color = Color("#4a8a4a")
const TAG_ARCHITECT: Color = Color("#4a6ab8")
const TAG_NEUTRAL: Color = Color("#8a8070")

func _init() -> void:
	_ensure_theme_directory()

	var theme: Theme = Theme.new()
	_register_colors(theme)
	_register_constants(theme)
	_register_label_colors(theme)
	_register_button_colors(theme)
	_register_button_styles(theme)
	_register_progress_bar_styles(theme)
	_register_panel_styles(theme)

	var save_result: Error = ResourceSaver.save(theme, THEME_PATH)
	if save_result != OK:
		push_error("Failed to save theme to %s (error %d)." % [THEME_PATH, save_result])
		quit(save_result)
		return

	print("Theme saved.")
	quit()

func _ensure_theme_directory() -> void:
	var absolute_theme_dir: String = ProjectSettings.globalize_path("res://assets/theme")
	var dir_result: Error = DirAccess.make_dir_recursive_absolute(absolute_theme_dir)
	if dir_result != OK and dir_result != ERR_ALREADY_EXISTS:
		push_error("Failed to create theme directory %s (error %d)." % [absolute_theme_dir, dir_result])

func _register_colors(theme: Theme) -> void:
	theme.set_color("bg_base", COLOR_NODE_TYPE, BG_BASE)
	theme.set_color("bg_surface", COLOR_NODE_TYPE, BG_SURFACE)
	theme.set_color("bg_elevated", COLOR_NODE_TYPE, BG_ELEVATED)
	theme.set_color("bg_overlay", COLOR_NODE_TYPE, BG_OVERLAY)
	theme.set_color("text_primary", COLOR_NODE_TYPE, TEXT_PRIMARY)
	theme.set_color("text_secondary", COLOR_NODE_TYPE, TEXT_SECONDARY)
	theme.set_color("text_disabled", COLOR_NODE_TYPE, TEXT_DISABLED)
	theme.set_color("accent", COLOR_NODE_TYPE, ACCENT)
	theme.set_color("accent_dim", COLOR_NODE_TYPE, ACCENT_DIM)
	theme.set_color("accent_glow", COLOR_NODE_TYPE, ACCENT_GLOW)
	theme.set_color("status_good", COLOR_NODE_TYPE, STATUS_GOOD)
	theme.set_color("status_warn", COLOR_NODE_TYPE, STATUS_WARN)
	theme.set_color("status_bad", COLOR_NODE_TYPE, STATUS_BAD)
	theme.set_color("status_neutral", COLOR_NODE_TYPE, STATUS_NEUTRAL)
	theme.set_color("planet_earth", COLOR_NODE_TYPE, PLANET_EARTH)
	theme.set_color("planet_mercury", COLOR_NODE_TYPE, PLANET_MERCURY)
	theme.set_color("planet_mars", COLOR_NODE_TYPE, PLANET_MARS)
	theme.set_color("planet_venus", COLOR_NODE_TYPE, PLANET_VENUS)
	theme.set_color("tag_naturalist", COLOR_NODE_TYPE, TAG_NATURALIST)
	theme.set_color("tag_architect", COLOR_NODE_TYPE, TAG_ARCHITECT)
	theme.set_color("tag_neutral", COLOR_NODE_TYPE, TAG_NEUTRAL)

func _register_constants(theme: Theme) -> void:
	theme.set_constant("margin_tight", COLOR_NODE_TYPE, 8)
	theme.set_constant("margin_normal", COLOR_NODE_TYPE, 16)
	theme.set_constant("margin_loose", COLOR_NODE_TYPE, 24)
	theme.set_constant("panel_padding", COLOR_NODE_TYPE, 16)
	theme.set_constant("separation", "VBoxContainer", 16)
	theme.set_constant("separation", "HBoxContainer", 8)

func _register_label_colors(theme: Theme) -> void:
	theme.set_color("font_color", "Label", TEXT_PRIMARY)
	theme.set_color("font_color", "RichTextLabel", TEXT_PRIMARY)
	theme.set_color("default_color", "RichTextLabel", TEXT_PRIMARY)
	theme.set_color("font_color", "LineEdit", TEXT_PRIMARY)
	theme.set_color("font_placeholder_color", "LineEdit", TEXT_SECONDARY)
	theme.set_color("font_uneditable_color", "LineEdit", TEXT_DISABLED)

func _register_button_colors(theme: Theme) -> void:
	for button_type: String in ["Button", "ButtonPrimary", "ButtonDestructive"]:
		theme.set_color("font_color", button_type, TEXT_PRIMARY)
		theme.set_color("font_hover_color", button_type, TEXT_PRIMARY)
		theme.set_color("font_pressed_color", button_type, TEXT_PRIMARY)
		theme.set_color("font_disabled_color", button_type, TEXT_DISABLED)

	theme.set_color("font_color", "ButtonPrimary", BG_BASE)
	theme.set_color("font_hover_color", "ButtonPrimary", BG_BASE)
	theme.set_color("font_pressed_color", "ButtonPrimary", BG_BASE)
	theme.set_color("font_color", "ButtonDestructive", TEXT_PRIMARY)

func _register_button_styles(theme: Theme) -> void:
	theme.set_stylebox("normal", "Button", _make_button_normal())
	theme.set_stylebox("hover", "Button", _make_button_hover())
	theme.set_stylebox("pressed", "Button", _make_button_pressed())
	theme.set_stylebox("disabled", "Button", _make_button_disabled())

	theme.set_stylebox("normal", "ButtonPrimary", _make_primary_button_normal())
	theme.set_stylebox("hover", "ButtonPrimary", _make_primary_button_hover())
	theme.set_stylebox("pressed", "ButtonPrimary", _make_primary_button_pressed())
	theme.set_stylebox("disabled", "ButtonPrimary", _make_primary_button_disabled())

	theme.set_stylebox("normal", "ButtonDestructive", _make_destructive_button_normal())
	theme.set_stylebox("hover", "ButtonDestructive", _make_destructive_button_hover())
	theme.set_stylebox("pressed", "ButtonDestructive", _make_destructive_button_pressed())
	theme.set_stylebox("disabled", "ButtonDestructive", _make_destructive_button_disabled())

func _register_progress_bar_styles(theme: Theme) -> void:
	theme.set_stylebox("background", "ProgressBar", _make_progress_background())
	theme.set_stylebox("fill", "ProgressBar", _make_progress_fill())

func _register_panel_styles(theme: Theme) -> void:
	theme.set_stylebox("panel", "Panel", _make_panel_stylebox())
	theme.set_stylebox("panel", "PanelContainer", _make_panel_container_stylebox())

func _make_button_normal() -> StyleBoxFlat:
	return _make_stylebox(BG_ELEVATED, ACCENT_DIM, 4, 1, 8, 4)

func _make_button_hover() -> StyleBoxFlat:
	return _make_stylebox(BG_ELEVATED, ACCENT, 4, 1, 8, 4)

func _make_button_pressed() -> StyleBoxFlat:
	return _make_stylebox(BG_SURFACE, ACCENT, 4, 1, 8, 4)

func _make_button_disabled() -> StyleBoxFlat:
	return _make_stylebox(BG_ELEVATED, BG_ELEVATED, 4, 0, 8, 4)

func _make_primary_button_normal() -> StyleBoxFlat:
	return _make_stylebox(ACCENT, ACCENT, 4, 0, 8, 4)

func _make_primary_button_hover() -> StyleBoxFlat:
	return _make_stylebox(ACCENT_GLOW, ACCENT_GLOW, 4, 0, 8, 4)

func _make_primary_button_pressed() -> StyleBoxFlat:
	return _make_stylebox(ACCENT_DIM, ACCENT_DIM, 4, 0, 8, 4)

func _make_primary_button_disabled() -> StyleBoxFlat:
	return _make_stylebox(BG_ELEVATED, BG_ELEVATED, 4, 0, 8, 4)

func _make_destructive_button_normal() -> StyleBoxFlat:
	return _make_stylebox(STATUS_BAD, STATUS_BAD, 4, 0, 8, 4)

func _make_destructive_button_hover() -> StyleBoxFlat:
	return _make_stylebox(STATUS_BAD.lightened(0.08), STATUS_BAD.lightened(0.08), 4, 0, 8, 4)

func _make_destructive_button_pressed() -> StyleBoxFlat:
	return _make_stylebox(STATUS_BAD.darkened(0.12), STATUS_BAD.darkened(0.12), 4, 0, 8, 4)

func _make_destructive_button_disabled() -> StyleBoxFlat:
	return _make_stylebox(BG_ELEVATED, BG_ELEVATED, 4, 0, 8, 4)

func _make_progress_background() -> StyleBoxFlat:
	return _make_stylebox(BG_ELEVATED, BG_ELEVATED, 4, 0, 0, 0, 8)

func _make_progress_fill() -> StyleBoxFlat:
	return _make_stylebox(ACCENT, ACCENT, 4, 0, 0, 0, 8)

func _make_panel_stylebox() -> StyleBoxFlat:
	return _make_stylebox(BG_SURFACE, BG_SURFACE, 4, 0, 16, 16)

func _make_panel_container_stylebox() -> StyleBoxFlat:
	return _make_stylebox(BG_ELEVATED, BG_ELEVATED, 4, 0, 16, 16)

func _make_stylebox(
	background_color: Color,
	border_color: Color,
	radius: int,
	border_width: int,
	horizontal_padding: int,
	vertical_padding: int,
	minimum_height: int = 0
) -> StyleBoxFlat:
	var stylebox: StyleBoxFlat = StyleBoxFlat.new()
	stylebox.bg_color = background_color
	stylebox.border_color = border_color
	stylebox.border_width_left = border_width
	stylebox.border_width_top = border_width
	stylebox.border_width_right = border_width
	stylebox.border_width_bottom = border_width
	stylebox.corner_radius_top_left = radius
	stylebox.corner_radius_top_right = radius
	stylebox.corner_radius_bottom_right = radius
	stylebox.corner_radius_bottom_left = radius
	stylebox.content_margin_left = horizontal_padding
	stylebox.content_margin_top = vertical_padding
	stylebox.content_margin_right = horizontal_padding
	stylebox.content_margin_bottom = vertical_padding
	if minimum_height > 0:
		stylebox.expand_margin_top = float(minimum_height) * 0.5
		stylebox.expand_margin_bottom = float(minimum_height) * 0.5
	return stylebox