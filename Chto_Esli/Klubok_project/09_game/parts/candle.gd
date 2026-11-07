@tool
class_name Candle
extends Item
## Свеча: пламя пережигает нитку, если та побудет в огне 0,4 с. Фен задувает свечу.
## Зона жара — над фитилём (рисуется пунктиром, пока строим).

const W := 20.0
const H := 48.0
const BURN_FRAMES := 24      ## столько кадров нитка должна быть в огне
const WIND_FRAMES := 6       ## столько кадров под струёй фена — и свеча гаснет

var lit := true
var wind := 0
var _smoke := 0.0
var _glow: Glow


func _setup() -> void:
	kind = "candle"
	var s := RectangleShape2D.new()
	s.size = Vector2(W, H)
	_add_shape(s)
	physics_material_override = Phys.material(0.8, 0.0)
	_glow = Glow.new()
	_glow.kind = "pool"
	_glow.size = Vector2(170, 150)
	_glow.energy = 0.55
	_glow.position = Vector2(0, -H * 0.5 - 16)
	add_child(_glow, false, Node.INTERNAL_MODE_FRONT)
	add_to_group("candle")


static func outline() -> PackedVector2Array:
	return Phys.rect_poly(Rect2(-W * 0.5, -H * 0.5, W, H))


static func footprint(item: Dictionary) -> PackedVector2Array:
	var p: Vector2 = item["pos"]
	return Transform2D(0.0, p) * outline()


## Зона жара в своих координатах: от фитиля вверх на 44 px.
static func heat_rect() -> Rect2:
	return Rect2(-13, -H * 0.5 - 44, 26, 46)


static func heat_poly_at(p: Vector2) -> PackedVector2Array:
	return Transform2D(0.0, p) * Phys.rect_poly(heat_rect())


func local_poly() -> PackedVector2Array:
	return outline()


func heat_poly() -> PackedVector2Array:
	return global_transform * Phys.rect_poly(heat_rect())


func flame_point() -> Vector2:
	return to_global(Vector2(0, -H * 0.5 - 12))


## Греет ли пламя отрезок нитки a–b.
func heats(a: Vector2, b: Vector2) -> bool:
	return lit and Phys.segment_inside(a, b, heat_poly())


func blow_out() -> void:
	if not lit:
		return
	lit = false
	_smoke = 1.0
	_glow.visible = false
	queue_redraw()


func _process(delta: float) -> void:
	_t += delta
	if _smoke > 0.0:
		_smoke = maxf(0.0, _smoke - delta / 1.6)
	if lit or _smoke > 0.0:
		queue_redraw()
	if lit and _glow != null:
		_glow.energy = 0.5 + 0.06 * sin(_t * 11.0) + 0.04 * sin(_t * 23.0)


func paint(ci: CanvasItem) -> void:
	var wax := Pal.mix(Pal.PAPER, Pal.WARM, 0.3)
	var body := Ink.round_rect(Rect2(-W * 0.5, -H * 0.5, W, H), 3.0)
	ci.draw_colored_polygon(body, wax)
	ci.draw_colored_polygon(PackedVector2Array([Vector2(W * 0.5 - 5, -H * 0.5 + 4), Vector2(W * 0.5 - 1, -H * 0.5 + 4), Vector2(W * 0.5 - 1, H * 0.5 - 2), Vector2(W * 0.5 - 5, H * 0.5 - 2)]), Pal.alpha(Pal.DUSK, 0.3))
	# потёки воска
	ci.draw_colored_polygon(PackedVector2Array([Vector2(-W * 0.5, -H * 0.5 + 2), Vector2(-W * 0.5 + 6, -H * 0.5 + 2), Vector2(-W * 0.5 + 5, -H * 0.5 + 15), Vector2(-W * 0.5 + 2, -H * 0.5 + 17)]), Pal.PAPER)
	Ink.closed_line(ci, Ink.wobble(body, 0.4, 10.0, 12), Pal.INK, 2.0)
	# фитиль
	ci.draw_line(Vector2(0, -H * 0.5), Vector2(1, -H * 0.5 - 7), Pal.INK, 2.0, true)
	if lit:
		var f := 1.0 + 0.08 * sin(_t * 13.0) + 0.05 * sin(_t * 29.0)
		var sway := 1.5 * sin(_t * 7.0)
		var base := Vector2(0, -H * 0.5 - 5)
		var outer := PackedVector2Array()
		var inner := PackedVector2Array()
		for i in 17:
			var a := TAU * i / 16.0
			var r := 7.0
			var q := Vector2(sin(a) * r, cos(a) * r)
			if q.y < 0.0:
				q.y *= 2.6 * f
				q.x += sway * (-q.y / 18.0)
			outer.append(base + q)
			inner.append(base + Vector2(q.x * 0.5, q.y * 0.55 + 2.0))
		ci.draw_colored_polygon(outer, Pal.alpha(Pal.WARM, 0.95))
		ci.draw_colored_polygon(inner, Pal.PAPER)
		ci.draw_polyline(outer, Pal.alpha(Pal.TERRACOTTA, 0.8), 1.4, true)
	elif _smoke > 0.0:
		for i in 3:
			var ph := fmod((1.0 - _smoke) * 1.6 + i * 0.33, 1.0)
			var p := Vector2(sin(ph * 6.0 + i) * 4.0, -H * 0.5 - 10 - ph * 40.0)
			ci.draw_circle(p, 3.0 + ph * 6.0, Pal.alpha(Pal.STEEL, (1.0 - ph) * 0.55 * _smoke))
