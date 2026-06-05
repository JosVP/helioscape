shader_type spatial;
// cull_front removes the shell's outward-facing polygons so the camera sees the inner rim from outside the planet, and blend_add makes that rim glow instead of covering the surface.
render_mode blend_add, depth_draw_never, cull_front, unshaded;

uniform vec4 atmosphere_color : source_color = vec4(0.4, 0.7, 1.0, 1.0);
uniform float atmosphere_density : hint_range(0.0, 1.0) = 0.3;
uniform float rim_power : hint_range(1.0, 8.0) = 3.0;

void fragment() {
	float rim = 1.0 - abs(dot(NORMAL, VIEW));
	float glow = pow(rim, rim_power) * atmosphere_density;
	EMISSION = atmosphere_color.rgb * glow;
	ALPHA = glow;
}

// Typical values:
// Mercury: atmosphere_density = 0.0.
// Mars initial: atmosphere_color = #cc6644, atmosphere_density = 0.05.
// Mars late: atmosphere_color = #4488ff, atmosphere_density = 0.25.
// Venus initial: atmosphere_color = #ffcc44, atmosphere_density = 0.95.
// Venus late: atmosphere_color = #aaddff, atmosphere_density = 0.35.
// Earth: atmosphere_color = #4488ff, atmosphere_density = 0.35.
// PlanetVisual.gd updates these with set_shader_parameter each game_year_ticked.
