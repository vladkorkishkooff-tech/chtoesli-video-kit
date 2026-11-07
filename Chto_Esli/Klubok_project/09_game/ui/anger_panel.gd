class_name AngerPanel
extends Control
## Шкала «Злость Кота»: портрет в круге (5 лиц), 4 деления Олива → Тёплый свет → Терракота → Тревога,
## штриховка Чернила 25 %. Движение мягкое и пружинистое, контур «кипит» (03_style/style_guide.md).

const FACES := [
	preload("res://art/ui/face_0.png"), preload("res://art/ui/face_1.png"), preload("res://art/ui/face_2.png"),
	preload("res://art/ui/face_3.png"), preload("res://art/ui/face_4.png"),
]
const COLORS := [Pal.OLIVE, Pal.WARM, Pal.TERRACOTTA, Pal.ALARM]

var shown := 0.0:
	set(v):
		shown = v
		queue_redraw()
var target := 0.0
var _shake := 0.0
var _shake_amp := 5.0
var _shake_decay := 2.2
var _caption := ""
var _caption_t := 0.0
var _caption_color := Pal.INK
var _v := 0
var _t := 0.0
var _face := 0
var _squash := 0.0
var _heart := 0.0
var _tween: Tween


func _init() -> void:
	custom_minimum_size = Vector2(376, 68)
	size = custom_minimum_size
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func set_anger(value: float, delta: float, reason: String) -> void:
	target = value
	if _tween != null:
		_tween.kill()
	_tween = create_tween()
	_tween.tween_property(self, "shown", value, 0.6).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
	if delta > 0.0:
		# ошибка (+½) — короткая сильная тряска, неудача (+1) — слабее и дольше
		_shake = 1.0
		_shake_amp = 6.0 if delta < 1.0 else 3.5
		_shake_decay = 3.6 if delta < 1.0 else 2.0
	elif delta < 0.0:
		_heart = 1.0          # злость снизилась: панель «выдыхает», сердечко
		_squash = 1.0
	if reason != "" and absf(delta) > 0.001:
		_caption = "%s%s · %s" % ["+" if delta > 0.0 else "−", _amount(absf(delta)), reason]
		_caption_color = Pal.TERRACOTTA if delta > 0.0 else Pal.mix(Pal.OLIVE, Pal.INK, 0.35)
		_caption_t = 2.6


func _amount(d: float) -> String:
	if is_equal_approx(d, 0.5):
		return "½"
	if is_equal_approx(fmod(d, 1.0), 0.5):
		return "%d½" % int(d)
	return "%d" % int(round(d))


func _process(delta: float) -> void:
	_t += delta
	_v = int(Time.get_ticks_msec() / 140) % 3
	_shake = maxf(0.0, _shake - delta * _shake_decay)
	_squash = maxf(0.0, _squash - delta / 0.25)
	_heart = maxf(0.0, _heart - delta / 1.6)
	if _caption_t > 0.0:
		_caption_t -= delta
	var face := clampi(int(floor(shown + 0.001)), 0, 4)
	if face != _face:
		_face = face
		_squash = 1.0         # смена лица — «сплющить-растянуть» 0,25 с
	queue_redraw()            # портрет дышит всё время


## Анимация — 01_concept/anger_meter.md, раздел «Анимация».
func _draw() -> void:
	var rage := shown >= 3.95
	var amp := _shake_amp * _shake + (2.0 if rage else 0.0)
	var off := Vector2(sin(_t * 62.0) * amp, cos(_t * 47.0) * amp * 0.3)
	var r := Rect2(off, Vector2(size.x, 64))
	if rage:
		Ink.glow(self, Ink.round_rect(r, 12.0), Pal.ALARM, 0.55 + 0.45 * sin(_t * 9.0))
	Ink.paper(self, r, _v, Pal.PAPER, Pal.INK, 2.0, 12.0)
	var face := _face
	var fc := off + Vector2(34, 32)
	# дыхание ±2 %: период 2 с на «дремлет» → 0,6 с на «бешенстве»; покачивание ±2°
	var period := lerpf(2.0, 0.6, clampf(shown / 4.0, 0.0, 1.0))
	var breath := 1.0 + 0.02 * sin(TAU * _t / period)
	var sway := deg_to_rad(2.0) * sin(TAU * _t / 3.3)
	var d := 0.18 * sin(PI * (1.0 - _squash)) if _squash > 0.0 else 0.0
	draw_set_transform(fc, sway, Vector2(breath * (1.0 + d), breath * (1.0 - d)))
	draw_circle(Vector2.ZERO, 27, Pal.PAPER)
	draw_texture_rect(FACES[face], Rect2(Vector2(-26, -26), Vector2(52, 52)), false)
	draw_arc(Vector2.ZERO, 26.5, 0, TAU, 32, Pal.INK, 2.2, true)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	if shown >= 3.0:
		_draw_steam(fc)
	draw_string(Fonts.SERIF_BOLD, off + Vector2(70, 26), "Злость Кота", HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Pal.INK)
	var run := fmod(_t * 14.0, 6.0)   # штриховка бежит по заполненной части
	for i in 4:
		var sr := Rect2(off + Vector2(70 + i * 49, 36), Vector2(44, 14))
		var f := clampf(shown - i, 0.0, 1.0)
		draw_rect(sr, Pal.alpha(Pal.DUSK, 0.12))
		if f > 0.0:
			var fr := Rect2(sr.position, Vector2(sr.size.x * f, sr.size.y))
			draw_rect(fr, COLORS[i])
			var x := fr.position.x - sr.size.y - 6.0 + run
			while x < fr.end.x:
				var a := Vector2(maxf(x, fr.position.x), fr.end.y - (maxf(x, fr.position.x) - x))
				var bx := minf(x + sr.size.y, fr.end.x)
				var b := Vector2(bx, fr.end.y - (bx - x))
				if b.x > a.x:
					draw_line(a, b, Pal.alpha(Pal.INK, 0.25), 1.5)
				x += 6.0
		draw_rect(sr, Pal.INK, false, 1.6)
	draw_string(Fonts.SERIF_ITALIC, off + Vector2(270, 48), CatMood.STATES[face], HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Pal.alpha(Pal.INK, 0.75))
	if _heart > 0.0:
		# всплывает справа над портретом, поверх надписи; первые 0,15 с — «выскакивает»
		var up := 1.0 - _heart
		var pop := 1.0 + 0.35 * sin(PI * clampf(up / 0.1, 0.0, 1.0))
		_draw_heart(fc + Vector2(24.0 + sin(up * 9.0) * 3.0, -16.0 - up * 20.0), 8.0 * pop, clampf(_heart * 1.6, 0.0, 1.0))
	if _caption_t > 0.0:
		var a := clampf(_caption_t / 0.6, 0.0, 1.0) * clampf((2.6 - _caption_t) / 0.15, 0.0, 1.0)
		var slide := (1.0 - clampf((2.6 - _caption_t) / 0.25, 0.0, 1.0)) * -18.0
		var y := 92.0 + slide
		var hf := Fonts.hand()
		var tw := hf.get_string_size(_caption, HORIZONTAL_ALIGNMENT_LEFT, -1, 26).x
		Ink.paper(self, Rect2(Vector2(10, y - 26), Vector2(tw + 24, 36)), _v, Pal.alpha(Pal.PAPER, a), Pal.alpha(Pal.INK, a), 1.5, 8.0)
		draw_string(hf, Vector2(22, y), _caption, HORIZONTAL_ALIGNMENT_LEFT, -1, 26, Pal.alpha(_caption_color, a))


## Пар над ушами (злость ≥ 3): три облачка поднимаются и тают.
func _draw_steam(fc: Vector2) -> void:
	for i in 3:
		var ph := fmod(_t * 0.8 + i / 3.0, 1.0)
		var side := -1.0 if i % 2 == 0 else 1.0
		var p := fc + Vector2(side * (16.0 + ph * 10.0), -20.0 - ph * 16.0)
		var rr := 3.5 + ph * 4.5
		var a := (1.0 - ph) * 0.85
		draw_circle(p, rr, Pal.alpha(Pal.PAPER, a))
		draw_arc(p, rr, 0.0, TAU, 14, Pal.alpha(Pal.INK, a * 0.6), 1.2, true)


## Сердечко (злость снизилась) — Румянец с контуром Чернил.
func _draw_heart(c: Vector2, s: float, a: float) -> void:
	_heart_shape(c, s + 1.8, Pal.alpha(Pal.INK, a * 0.9))
	_heart_shape(c, s, Pal.alpha(Pal.BLUSH, a))


func _heart_shape(c: Vector2, s: float, col: Color) -> void:
	draw_circle(c + Vector2(-s * 0.5, 0), s * 0.55, col)
	draw_circle(c + Vector2(s * 0.5, 0), s * 0.55, col)
	draw_colored_polygon(PackedVector2Array([c + Vector2(-s * 1.02, s * 0.2), c + Vector2(s * 1.02, s * 0.2), c + Vector2(0, s * 1.3)]), col)
