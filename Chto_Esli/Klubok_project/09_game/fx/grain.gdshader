shader_type canvas_item;
// Зерно и виньетка поверх кадра (03_style/style_guide.md, правило 4: в игре слабее, в видео погрома — сильнее).
// Цвет — Чернила; рисуется на ColorRect во весь экран, мышь не ловит.

uniform float grain_amount = 0.05;
uniform float vignette_amount = 0.28;
uniform vec4 ink : source_color = vec4(0.133, 0.11, 0.11, 1.0);

float rand(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void fragment() {
	float n = rand(floor(UV * vec2(640.0, 360.0)) + floor(TIME * 12.0));
	float vig = smoothstep(0.35, 0.85, distance(UV, vec2(0.5))) * vignette_amount;
	COLOR = vec4(ink.rgb, clamp(vig + n * grain_amount, 0.0, 1.0));
}
