extends Node


# Godot's built-in tr("KEY") handles plain translation lookups.
# For strings with placeholders like "Year {year}", use tr() first and then
# substitute the named parameters.
# Simple: tr("UI_PAUSE") -> "Pause"
# Parameterised: LocalizationManager.trf("UI_YEAR_LABEL", {"year": 2087}) -> "Year 2087"
# In scripts: always use tr() or LocalizationManager.trf() - never string literals in UI.
func trf(key: String, params: Dictionary) -> String:
	var result: String = tr(key)
	for param_key: Variant in params:
		result = result.replace("{" + str(param_key) + "}", str(params[param_key]))
	return result
