class_name InvSlot
extends Control
## Слот инвентаря: значок детали и «Балка ×3». Нажал — взял деталь (тяни на поле или коснись поля).

signal grabbed(kind: String, at: Vector2)

const ICONS := {
	"beam": preload("res://art/ui/icon_beam.png"),
	"nail": preload("res://art/ui/icon_nail.png"),
	"cube": preload("res://art/ui/icon_cube.png"),
	"wedge": preload("res://art/ui/icon_wedge.png"),
}
## Значки новых деталей рисуются самой деталью (Items.draw_icon): масштаб и сдвиг под слот.
const ICON_SCALE := {"mandarin": 0.8, "domino": 0.62, "trampoline": 0.46, "pillow": 0.46, "candle": 0.6, "fan": 0.62}
const ICON_SHIFT := {"candle": Vector2(0, 9), "fan": Vector2(4, -7), "trampoline": Vector2(0, 2)}

var kind := "beam"
var count := 0:
	set(v):
		count = v
		queue_redraw()
var active := false:
	set(v):
		active = v
		queue_redraw()
var _v := 0


func _init() -> void:
	custom_minimum_size = Vector2(150, 80)
	mouse_filter = Control.MOUSE_FILTER_STOP
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND


func _gui_input(e: InputEvent) -> void:
	if e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT and e.pressed:
		Sfx.play("click")
		grabbed.emit(kind, get_global_mouse_position())
		accept_event()


func _process(_d: float) -> void:
	var v := int(Time.get_ticks_msec() / 140) % 3
	if v != _v:
		_v = v
		queue_redraw()


func _draw() -> void:
	var r := Rect2(Vector2(2, 2), size - Vector2(4, 6))
	if active:
		Ink.glow(self, Ink.round_rect(r, 10.0), Pal.WARM, 1.2)
	Ink.paper(self, r, _v, Pal.PAPER, Pal.INK, 2.0, 10.0)
	var c := Vector2(size.x * 0.5, 30)
	if ICONS.has(kind):
		var tex: Texture2D = ICONS[kind]
		var isz := tex.get_size() * minf(0.5, (size.x - 20.0) / tex.get_size().x)
		var dim := Color(1, 1, 1, 0.4) if count <= 0 else Color.WHITE
		draw_texture_rect(tex, Rect2(c - isz * 0.5, isz), false, dim)
	else:
		Items.draw_icon(self, kind, c + ICON_SHIFT.get(kind, Vector2.ZERO), float(ICON_SCALE.get(kind, 0.5)))
		if count <= 0:
			draw_rect(Rect2(Vector2(8, 6), Vector2(size.x - 16, 44)), Pal.alpha(Pal.PAPER, 0.6))
	var text := "%s ×%d" % [Items.TITLE.get(kind, kind), count]
	var f := Fonts.SERIF_BOLD
	var fs := 18
	var tw := f.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
	while fs > 13 and tw > size.x - 14.0:
		fs -= 1
		tw = f.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
	draw_string(f, Vector2((size.x - tw) * 0.5, size.y - 14), text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Pal.alpha(Pal.INK, 0.45 if count <= 0 else 1.0))
