class_name MercuryResourceBar
extends HBoxContainer

@onready var _common_label: Label = $CommonLabel
@onready var _rare_label: Label = $RareLabel
@onready var _volatiles_label: Label = $VolatilesLabel


func _ready() -> void:
	EventBus.resource_accumulation_updated.connect(_on_resource_updated)
	_refresh_all()


func _on_resource_updated(resource_id: String, amount: float) -> void:
	match resource_id:
		"common_ore":
			_common_label.text = "Common: %.1f" % amount
		"rare_metals":
			_rare_label.text = "Rare: %.1f" % amount
		"polar_volatiles":
			_volatiles_label.text = "Volatiles: %.1f" % amount
		_:
			pass


func _refresh_all() -> void:
	_on_resource_updated("common_ore", float(GameState.mercury_resources.get("common_ore", 0.0)))
	_on_resource_updated("rare_metals", float(GameState.mercury_resources.get("rare_metals", 0.0)))
	_on_resource_updated(
		"polar_volatiles", float(GameState.mercury_resources.get("polar_volatiles", 0.0))
	)
