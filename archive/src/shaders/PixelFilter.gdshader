shader_type canvas_item;

// Pixelation is a post-process only: the 3D scene still renders at full resolution,
// then this shader samples the SubViewport texture on a snapped UV grid.
// A pixel_size of 4.0 gives roughly a 480p effective look on a 1080p output.
// Tune this value for feel per platform and camera framing.
// Stepped animation (6-8 fps with variable frame hold) is controlled by animation
// playback logic, not this shader.
uniform float pixel_size : hint_range(1.0, 8.0) = 4.0;
uniform sampler2D SCREEN_TEXTURE : hint_screen_texture, repeat_disable, filter_nearest;


void fragment() {
	vec2 screen_size = 1.0 / SCREEN_PIXEL_SIZE;
	vec2 pixel_grid = vec2(pixel_size, pixel_size);

	// Quantise to a fixed pixel grid in screen space, then convert back to UV.
	vec2 snapped_px = floor(UV * screen_size / pixel_grid) * pixel_grid;
	vec2 snapped_uv = snapped_px / screen_size;

	vec4 color = texture(SCREEN_TEXTURE, snapped_uv);

	// Add subtle retro texture: alternating scanlines + very light ordered dither.
	float scanline = mod(snapped_px.y, 2.0);
	float dither = mod(snapped_px.x + snapped_px.y, 2.0);
	float pattern = (scanline * 0.5 + dither * 0.5) * 2.0 - 1.0;
	color.rgb += pattern * 0.03;

	COLOR = vec4(clamp(color.rgb, vec3(0.0), vec3(1.0)), color.a);
}
