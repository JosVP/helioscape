shader_type spatial;

// Layer textures.
uniform sampler2D layer_surface : source_color, hint_default_white;
uniform sampler2D layer_lava : source_color, hint_default_transparent;
uniform sampler2D layer_water : source_color, hint_default_transparent;
uniform sampler2D layer_green : source_color, hint_default_transparent;
uniform sampler2D layer_cloud : source_color, hint_default_transparent;
uniform sampler2D layer_city_lights : source_color, hint_default_transparent;

// lava_hue_shift stays at 0.0 while lava is still hot red, then moves toward 1.0 as the surface cools over many game years after laser activity stops.
uniform vec2 lava_spots[8];
uniform int lava_spot_count = 0;
uniform float lava_growth_radius : hint_range(0.0, 0.8) = 0.0;
uniform float lava_opacity : hint_range(0.0, 1.0) = 0.0;
uniform float lava_hue_shift : hint_range(0.0, 1.0) = 0.0;

uniform vec2 water_spots[8];
uniform int water_spot_count = 0;
uniform float water_growth_radius : hint_range(0.0, 0.8) = 0.0;
uniform float water_opacity : hint_range(0.0, 1.0) = 0.0;

uniform vec2 green_spots[8];
uniform int green_spot_count = 0;
uniform float green_growth_radius : hint_range(0.0, 0.8) = 0.0;
uniform float green_opacity : hint_range(0.0, 1.0) = 0.0;

// PlanetVisual.gd advances cloud_uv_offset.x by cloud_rotation_speed each game-year tick so the clouds can scroll independently from the planet spin.
uniform float cloud_opacity : hint_range(0.0, 1.0) = 0.0;
uniform vec2 cloud_uv_offset = vec2(0.0, 0.0);

uniform float city_lights_intensity : hint_range(0.0, 1.0) = 0.0;
// PlanetVisual.gd sets sun_direction in world space toward the Sun so lights only appear where the local surface normal points away from the sun.
uniform vec3 sun_direction = vec3(1.0, 0.0, 0.0);

// Venus stays yellow-orange because atmosphere_tint overlays a warm haze on top of a rocky gray surface texture; TerraformingSystem reduces the tint alpha as Venus cools.
uniform vec4 atmosphere_tint : source_color = vec4(0.0, 0.0, 0.0, 0.0);

uniform float edge_softness : hint_range(0.005, 0.08) = 0.025;

float spot_coverage(vec2 uv, vec2 spots[8], int count, float radius) {
	float coverage = 0.0;
	for (int i = 0; i < count; i++) {
		float dist = distance(uv, spots[i]);
		coverage = max(coverage, 1.0 - smoothstep(radius - edge_softness, radius, dist));
	}
	return coverage;
}

vec3 rgb_to_hsv(vec3 color) {
	vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	vec4 p = mix(vec4(color.bg, k.wz), vec4(color.gb, k.xy), step(color.b, color.g));
	vec4 q = mix(vec4(p.xyw, color.r), vec4(color.r, p.yzx), step(p.x, color.r));
	float d = q.x - min(q.w, q.y);
	float e = 0.00001;
	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv_to_rgb(vec3 color) {
	vec3 rgb = clamp(abs(fract(color.x + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
	return color.z * mix(vec3(1.0), rgb, color.y);
}

// shift is normalized 0.0-1.0, which maps to a full 0-360 degree hue rotation before converting back to RGB.
vec3 hue_shift(vec3 color, float shift) {
	vec3 hsv = rgb_to_hsv(color);
	hsv.x = fract(hsv.x + shift);
	return hsv_to_rgb(hsv);
}

void fragment() {
	vec2 uv = UV;

	vec4 surface_col = texture(layer_surface, uv);
	vec4 lava_col = texture(layer_lava, uv);
	vec4 water_col = texture(layer_water, uv);
	vec4 green_col = texture(layer_green, uv);
	vec4 cloud_col = texture(layer_cloud, uv + cloud_uv_offset);
	vec4 lights_col = texture(layer_city_lights, uv);

	// 0.72 of the hue wheel is about 260 degrees, pushing hot lava toward the blue-black range used for cooled crust.
	lava_col.rgb = hue_shift(lava_col.rgb, lava_hue_shift * 0.72);

	vec4 result = surface_col;

	float lava_mask = spot_coverage(uv, lava_spots, lava_spot_count, lava_growth_radius);
	result = mix(result, lava_col, lava_mask * lava_opacity);

	float water_mask = spot_coverage(uv, water_spots, water_spot_count, water_growth_radius);
	result = mix(result, water_col, water_mask * water_opacity);

	float green_mask = spot_coverage(uv, green_spots, green_spot_count, green_growth_radius);
	result = mix(result, green_col, green_mask * green_opacity);

	result.rgb = mix(result.rgb, atmosphere_tint.rgb, atmosphere_tint.a);
	result = mix(result, cloud_col, cloud_opacity * cloud_col.a);

	float sun_dot = dot(normalize(NORMAL), normalize(sun_direction));
	// sun_dot is positive on the day side and negative on the night side; multiplying by 4.0 sharpens the terminator before city_lights_intensity scales the final brightness.
	float night_mask = clamp(-sun_dot * 4.0, 0.0, 1.0);
	result.rgb += lights_col.rgb * night_mask * city_lights_intensity;

	ALBEDO = result.rgb;
}
