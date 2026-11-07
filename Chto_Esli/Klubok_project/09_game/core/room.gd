@tool
class_name Room
extends Node2D
## Комната: ночная стена, окно с луной, гирлянда, пол. Пол и стены — неподвижные тела.

## Центр окна по X; 0 — без окна.
@export var window_x := 1060.0:
	set(v):
		window_x = v
		queue_redraw()
@export var wreath := true:
	set(v):
		wreath = v
		queue_redraw()

var _floor_rect := Rect2(-64, Phys.FLOOR_Y, Phys.VIEW.x + 128, 256)
var _walls := [Rect2(-64, -640, 64, 1600), Rect2(Phys.VIEW.x, -640, 64, 1600)]


func _init() -> void:
	z_index = -10
	add_to_group("solid")
	var body := StaticBody2D.new()
	body.physics_material_override = Phys.material(0.8, 0.0)
	for r: Rect2 in [_floor_rect] + _walls:
		var s := RectangleShape2D.new()
		s.size = r.size
		var cs := CollisionShape2D.new()
		cs.shape = s
		cs.position = r.get_center()
		body.add_child(cs)
	add_child(body, false, Node.INTERNAL_MODE_FRONT)


func solid_polys() -> Array:
	var out := [Phys.rect_poly(_floor_rect)]
	for r: Rect2 in _walls:
		out.append(Phys.rect_poly(r))
	return out


func solid_strict() -> bool:
	return false


func solid_name() -> String:
	return "пол или стену"


func _draw() -> void:
	var w := Phys.VIEW.x
	var fy := Phys.FLOOR_Y
	# стена: холодная ночь, к полу чуть светлее
	var top := Pal.WALL_TOP
	var low := Pal.mix(Pal.NIGHT, Pal.DUSK, 0.3)
	draw_polygon(PackedVector2Array([Vector2(0, 0), Vector2(w, 0), Vector2(w, fy), Vector2(0, fy)]), PackedColorArray([top, top, low, low]))
	# обои: редкие ромбики
	for yy in range(40, int(fy) - 20, 64):
		for xx in range(32 + (yy / 64 % 2) * 32, int(w), 64):
			var c := Vector2(xx, yy)
			draw_colored_polygon(PackedVector2Array([c + Vector2(0, -4), c + Vector2(4, 0), c + Vector2(0, 4), c + Vector2(-4, 0)]), Pal.alpha(Pal.PAPER, 0.035))
	if window_x > 0.0:
		_draw_window(window_x)
	if wreath:
		_draw_wreath()
	# плинтус и пол
	draw_rect(Rect2(0, fy - 14, w, 14), Pal.mix(Pal.DUSK, Pal.INK, 0.3))
	draw_rect(Rect2(0, fy, w, Phys.VIEW.y - fy), Pal.FLOOR)
	for i in 5:
		var y := fy + 14 + i * 22
		draw_line(Vector2(0, y), Vector2(w, y), Pal.alpha(Pal.INK, 0.25), 1.0)
		var off := Ink.hash01(i * 5) * 200.0
		for k in 6:
			var x := off + k * 230.0
			draw_line(Vector2(x, y), Vector2(x, y + 22), Pal.alpha(Pal.INK, 0.2), 1.0)
	draw_line(Vector2(0, fy), Vector2(w, fy), Pal.alpha(Pal.PAPER, 0.12), 2.0)


func _draw_window(cx: float) -> void:
	var r := Rect2(cx - 105, 96, 210, 270)
	var glass := r.grow(-12)
	# штора слева
	var cl := r.position.x - 70
	draw_colored_polygon(PackedVector2Array([Vector2(cl - 20, 70), Vector2(r.position.x + 18, 70), Vector2(r.position.x + 6, r.end.y + 60), Vector2(cl - 34, r.end.y + 70)]), Pal.mix(Pal.DUSK, Pal.INK, 0.18))
	for i in 3:
		var x := cl - 4 + i * 26
		draw_line(Vector2(x, 76), Vector2(x - 10, r.end.y + 60), Pal.alpha(Pal.INK, 0.25), 2.0)
	draw_rect(r, Pal.mix(Pal.DUSK, Pal.PAPER, 0.12))
	var g0 := Pal.mix(Pal.NIGHT, Pal.INK, 0.45)
	var g1 := Pal.mix(Pal.NIGHT, Pal.DUSK, 0.2)
	draw_polygon(PackedVector2Array([glass.position, Vector2(glass.end.x, glass.position.y), glass.end, Vector2(glass.position.x, glass.end.y)]), PackedColorArray([g0, g0, g1, g1]))
	# звёзды и луна
	for i in 7:
		var p := glass.position + Vector2(Ink.hash01(i * 2 + 40), Ink.hash01(i * 2 + 41) * 0.5) * glass.size
		draw_circle(p, 1.3, Pal.alpha(Pal.PAPER, 0.55))
	var m := Vector2(glass.end.x - 46, glass.position.y + 44)
	draw_circle(m, 17, Pal.alpha(Pal.WARM, 0.92))
	draw_circle(m + Vector2(-7, -5), 15, g0.lerp(g1, 0.15))
	# дома
	var base := glass.end.y
	var x0 := glass.position.x
	var hs := [70.0, 110.0, 54.0, 92.0, 66.0]
	var ws := [38.0, 34.0, 30.0, 44.0, 40.0]
	var x := x0
	for i in hs.size():
		var hr := Rect2(x, base - hs[i], ws[i], hs[i])
		draw_rect(hr.intersection(glass), Pal.alpha(Pal.INK, 0.55))
		for k in 3:
			var wp := Vector2(x + 8 + (k % 2) * 14, base - hs[i] + 14 + k * 18)
			if Ink.hash01(i * 7 + k) > 0.45 and glass.has_point(wp):
				draw_rect(Rect2(wp, Vector2(5, 6)), Pal.alpha(Pal.WARM, 0.45))
		x += ws[i]
	# переплёт и подоконник
	draw_line(Vector2(glass.get_center().x, glass.position.y), Vector2(glass.get_center().x, glass.end.y), Pal.mix(Pal.DUSK, Pal.PAPER, 0.12), 6.0)
	draw_line(Vector2(glass.position.x, glass.position.y + glass.size.y * 0.42), Vector2(glass.end.x, glass.position.y + glass.size.y * 0.42), Pal.mix(Pal.DUSK, Pal.PAPER, 0.12), 6.0)
	draw_rect(Rect2(r.position.x - 12, r.end.y, r.size.x + 24, 10), Pal.mix(Pal.DUSK, Pal.PAPER, 0.2))
	draw_rect(r, Pal.alpha(Pal.INK, 0.45), false, 1.5)


func _draw_wreath() -> void:
	var a := Vector2(360, 14)
	var b := Vector2(920, 14)
	var pts := PackedVector2Array()
	for i in 41:
		var t := float(i) / 40.0
		pts.append(a.lerp(b, t) + Vector2(0, sin(t * PI) * 40.0))
	var green := Pal.mix(Pal.NIGHT, Pal.OLIVE, 0.28)
	draw_polyline(pts, Pal.mix(green, Pal.INK, 0.35), 18.0, true)
	draw_polyline(pts, green, 12.0, true)
	for i in range(0, 41, 2):
		var p := pts[i]
		draw_circle(p + Vector2(Ink.hash01(i) * 8 - 4, Ink.hash01(i + 1) * 8 - 4), 5.0, Pal.mix(green, Pal.INK, 0.2))
	var lights := [Pal.WARM, Pal.BLUSH, Pal.OLIVE]
	for i in range(2, 40, 4):
		var p := pts[i] + Vector2(0, 8)
		var c: Color = lights[(i / 4) % 3]
		draw_circle(p, 7.0, Pal.alpha(c, 0.18))
		draw_circle(p, 3.6, c)
