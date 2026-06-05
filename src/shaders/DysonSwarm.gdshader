shader_type spatial;
render_mode blend_mix, depth_draw_never, cull_disabled, unshaded;

// DysonSystem.gd updates dyson_coverage every game year, where 0.0 means no swarm panels and 1.0 means the procedural swarm is fully built out.
uniform float dyson_coverage : hint_range(0.0, 1.0) = 0.0;
// panel_color stays nearly black because the visible clusters represent dark light-absorbing harvest panels rather than glowing emissive objects.
uniform vec4 panel_color : source_color = vec4(0.03, 0.03, 0.06, 1.0);
uniform float panel_cluster_size : hint_range(0.005, 0.05) = 0.018;
uniform float randomness : hint_range(0.0, 1.0) = 0.7;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void fragment() {
	vec2 uv = UV;
	vec2 cell = floor(uv / panel_cluster_size);
	vec2 cell_uv = fract(uv / panel_cluster_size);

	float cell_threshold = hash(cell);
	float gradient_threshold = fract((uv.x + uv.y) * 0.5);
	float fill_threshold = mix(cell_threshold, gradient_threshold, 1.0 - randomness);

	bool panel_present = dyson_coverage > fill_threshold;

	float edge_gap = 0.12;
	// edge_gap keeps visible spacing between clusters so the swarm reads as discrete construction units instead of a sealed shell.
	bool in_panel = cell_uv.x > edge_gap && cell_uv.x < (1.0 - edge_gap) && cell_uv.y > edge_gap && cell_uv.y < (1.0 - edge_gap);

	if (panel_present && in_panel) {
		ALBEDO = panel_color.rgb;
		ALPHA = panel_color.a * 0.92;
	} else {
		ALBEDO = vec3(0.0);
		ALPHA = 0.0;
	}
}

// Sun dimming is handled on the separate Sun material through sun_dim_factor so DysonSystem.gd can coordinate both visuals without mixing responsibilities into this swarm shader.
