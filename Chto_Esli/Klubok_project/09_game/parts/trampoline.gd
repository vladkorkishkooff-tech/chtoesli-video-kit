@tool
class_name Trampoline
extends Item
## Батут: упругая сетка подбрасывает. Отскок 0,9 — клубок подлетает почти на ту же высоту, с какой упал;
## выше — никогда (энергия не берётся из ниоткуда).

const W := 128.0
const H := 32.0

var _dip := 0.0


func _setup() -> void:
	kind = "trampoline"
	var s := RectangleShape2D.new()
	s.size = Vector2(W, H)
	_add_shape(s)
	physics_material_override = Phys.material(0.6, 0.9)
	add_to_group("bouncy")


static func outline() -> PackedVector2Array:
	return Phys.rect_poly(Rect2(-W * 0.5, -H * 0.5, W, H))


static func footprint(item: Dictionary) -> PackedVector2Array:
	var p: Vector2 = item["pos"]
	return Transform2D(0.0, p) * outline()


func local_poly() -> PackedVector2Array:
	return outline()


## Над сеткой (координаты мира): тело здесь и резко сменило скорость — значит, отскочило от батута.
func top_rect() -> Rect2:
	return Rect2(global_position + Vector2(-W * 0.5 - 6, -H * 0.5 - 50), Vector2(W + 12, 56))


## Отскок: сетка прогибается (только картинка).
func hit(strength: float) -> void:
	_dip = clampf(0.35 + strength, 0.35, 1.0)


func _process(delta: float) -> void:
	if _dip > 0.0:
		_dip = maxf(0.0, _dip - delta * 3.5)
		queue_redraw()


func paint(ci: CanvasItem) -> void:
	var y0 := -H * 0.5
	var frame := Pal.mix(Pal.STEEL, Pal.NIGHT, 0.25)
	# ножки
	for sx in [-1.0, 1.0]:
		ci.draw_line(Vector2(sx * (W * 0.5 - 10), y0 + 6), Vector2(sx * (W * 0.5 - 2), H * 0.5), frame, 5.0, true)
		ci.draw_line(Vector2(sx * (W * 0.5 - 10), y0 + 6), Vector2(sx * (W * 0.5 - 22), H * 0.5), frame, 4.0, true)
	# обод
	var rim := Ink.round_rect(Rect2(-W * 0.5, y0, W, 9), 4.0)
	ci.draw_colored_polygon(rim, frame)
	# сетка с прогибом
	var sag := 7.0 * sin(_dip * PI) if _dip > 0.0 else 0.0
	var mat := PackedVector2Array()
	for i in 13:
		var x := -W * 0.5 + 12 + (W - 24) * i / 12.0
		var k := 1.0 - pow(absf(x) / (W * 0.5 - 12), 2.0)
		mat.append(Vector2(x, y0 + 3 + sag * k))
	ci.draw_polyline(mat, Pal.mix(Pal.NIGHT, Pal.INK, 0.4), 6.0, true)
	# пружинки от обода к сетке
	for i in 6:
		var x := -W * 0.5 + 16 + (W - 32) * i / 5.0
		ci.draw_line(Vector2(x - 2, y0 + 1), Vector2(x + 2, y0 + 7), Pal.alpha(Pal.PAPER, 0.7), 1.5, true)
	Ink.closed_line(ci, Ink.wobble(rim, 0.4, 12.0, 8), Pal.INK, 2.0)
	ci.draw_polyline(mat, Pal.alpha(Pal.INK, 0.6), 1.5, true)
