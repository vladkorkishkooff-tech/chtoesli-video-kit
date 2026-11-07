class_name PaperButton
extends Button
## Кнопка-«бумажка»: Бумага + неровный контур Чернила, контур «кипит» 7 раз в секунду.
## primary — главная кнопка цвета Терракота («Пуск», «Дальше»).

var primary := false:
	set(v):
		primary = v
		queue_redraw()
var label := "":
	set(v):
		label = v
		queue_redraw()
## Значок слева: play, stop, reset, levels, next, retry, close — или пусто.
var glyph := "":
	set(v):
		glyph = v
		queue_redraw()
var font_size := 22
## Лапки-«мурчики» под надписью (карточки уровней): −1 — не рисовать.
var paws := -1:
	set(v):
		paws = v
		queue_redraw()
var _v := 0


static func make(text: String, g := "", is_primary := false, min_size := Vector2(130, 52)) -> PaperButton:
	var b := PaperButton.new()
	b.label = text
	b.glyph = g
	b.primary = is_primary
	b.custom_minimum_size = min_size
	return b


func _init() -> void:
	flat = true
	focus_mode = Control.FOCUS_NONE
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	custom_minimum_size = Vector2(130, 52)
	pressed.connect(func() -> void: Sfx.play("click"))


func _process(_d: float) -> void:
	var v := int(Time.get_ticks_msec() / 140) % 3
	if v != _v:
		_v = v
		queue_redraw()


func _draw() -> void:
	var mode := get_draw_mode()
	var off := Vector2(0, 2) if mode == DRAW_PRESSED or mode == DRAW_HOVER_PRESSED else Vector2.ZERO
	var r := Rect2(Vector2(2, 2) + off, size - Vector2(4, 6))
	var fill := Pal.TERRACOTTA if primary else Pal.PAPER
	if mode == DRAW_HOVER:
		fill = fill.lerp(Pal.WARM, 0.25)
	if disabled:
		fill = Pal.mix(fill, Pal.DUSK, 0.35)
	Ink.paper(self, r, _v, fill, Pal.INK, 2.0, 10.0)
	var ink := Pal.PAPER if primary else Pal.INK
	var f := Fonts.SERIF_BOLD
	var gw := 26.0 if glyph != "" else 0.0
	# длинная подпись — шрифт помельче, чтобы влезла в кнопку
	var fs := font_size
	var tw := f.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
	while fs > 12 and tw + gw > r.size.x - 18.0:
		fs -= 1
		tw = f.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
	var x := r.position.x + (r.size.x - tw - gw) * 0.5
	var cy := r.position.y + r.size.y * (0.34 if paws >= 0 else 0.5)
	if paws >= 0:
		Paw.row(self, Vector2(r.position.x + r.size.x * 0.5, r.position.y + r.size.y * 0.72), 20.0, paws)
	if glyph != "":
		_draw_glyph(Vector2(x + 9, cy), ink)
		x += gw
	draw_string(f, Vector2(x, cy + fs * 0.36), label, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, ink)


func _draw_glyph(c: Vector2, ink: Color) -> void:
	match glyph:
		"play":
			draw_colored_polygon(PackedVector2Array([c + Vector2(-6, -9), c + Vector2(9, 0), c + Vector2(-6, 9)]), ink)
		"stop":
			draw_rect(Rect2(c - Vector2(7, 7), Vector2(14, 14)), ink)
		"reset", "retry":
			draw_arc(c, 8.5, -PI * 0.15, PI * 1.45, 16, ink, 3.0, true)
			var t := c + Vector2.from_angle(-PI * 0.15) * 8.5
			draw_colored_polygon(PackedVector2Array([t + Vector2(-6, -4), t + Vector2(5, -6), t + Vector2(2, 5)]), ink)
		"levels":
			for i in 3:
				draw_rect(Rect2(c + Vector2(-8, -8 + i * 6), Vector2(16, 3.5)), ink)
		"next":
			draw_line(c + Vector2(-4, -8), c + Vector2(4, 0), ink, 3.0, true)
			draw_line(c + Vector2(4, 0), c + Vector2(-4, 8), ink, 3.0, true)
		"music", "music_off":
			draw_line(c + Vector2(2, -10), c + Vector2(2, 7), ink, 2.5, true)
			draw_line(c + Vector2(2, -10), c + Vector2(10, -12), ink, 3.0, true)
			draw_circle(c + Vector2(-2, 7), 4.5, ink)
			if glyph == "music_off":
				draw_line(c + Vector2(-10, -11), c + Vector2(11, 11), Pal.TERRACOTTA, 3.0, true)
		"sound", "mute":
			var sp := PackedVector2Array([c + Vector2(-9, -4), c + Vector2(-4, -4), c + Vector2(2, -9), c + Vector2(2, 9), c + Vector2(-4, 4), c + Vector2(-9, 4)])
			draw_colored_polygon(sp, ink)
			if glyph == "sound":
				draw_arc(c + Vector2(3, 0), 6.0, -0.9, 0.9, 8, ink, 2.2, true)
				draw_arc(c + Vector2(3, 0), 11.0, -0.9, 0.9, 10, ink, 2.2, true)
			else:
				draw_line(c + Vector2(6, -5), c + Vector2(14, 5), ink, 2.6, true)
				draw_line(c + Vector2(14, -5), c + Vector2(6, 5), ink, 2.6, true)
		"close":
			draw_line(c + Vector2(-7, -7), c + Vector2(7, 7), ink, 3.0, true)
			draw_line(c + Vector2(7, -7), c + Vector2(-7, 7), ink, 3.0, true)
