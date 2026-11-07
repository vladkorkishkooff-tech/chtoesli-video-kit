// «Кипящий» контур: 3 варианта линии, смена 7 раз в секунду (03_style/style_guide.md).
shader_type canvas_item;

uniform float amount = 0.0022;
uniform float fps = 7.0;

void fragment() {
	float v = floor(mod(TIME * fps, 3.0));
	vec2 n = vec2(sin(UV.y * 46.0 + v * 2.3) + sin(UV.y * 17.0 - v * 1.7),
			cos(UV.x * 41.0 + v * 1.9) + cos(UV.x * 13.0 + v * 2.9)) * 0.5;
	COLOR = texture(TEXTURE, UV + n * amount);
}
