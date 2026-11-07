@tool
class_name Wedge
extends StaticBody2D
## Клин 2×1 клетки (128 × 64 px, уклон ≈ 27°): неподвижный въезд, трамплин, упор.
## Отразить — поменять стороны: высокая сторона справа (обычно) или слева.

const W := 128.0
const H := 64.0

@export var flipped := false:
	set(v):
		flipped = v
		_rebuild()

var player := false
var selected := false:
	set(v):
		selected = v
		queue_redraw()
var _poly: ConvexPolygonShape2D


static func points_for(flip: bool) -> PackedVector2Array:
	if flip:
		return PackedVector2Array([Vector2(W * 0.5, H * 0.5), Vector2(-W * 0.5, H * 0.5), Vector2(-W * 0.5, -H * 0.5)])
	return PackedVector2Array([Vector2(-W * 0.5, H * 0.5), Vector2(W * 0.5, H * 0.5), Vector2(W * 0.5, -H * 0.5)])


func _init() -> void:
	_poly = ConvexPolygonShape2D.new()
	var cs := CollisionShape2D.new()
	cs.shape = _poly
	add_child(cs, false, Node.INTERNAL_MODE_FRONT)
	physics_material_override = Phys.material(0.5, 0.1)
	add_to_group("solid")
	add_to_group("wedge")
	_rebuild()


func _rebuild() -> void:
	if _poly == null:
		return
	_poly.set_point_cloud(points_for(flipped))
	queue_redraw()


func solid_polys() -> Array:
	return [global_transform * points_for(flipped)]


func solid_strict() -> bool:
	return false


func solid_name() -> String:
	return "клин"


func hit_test(p: Vector2, pad := 10.0) -> bool:
	var q := to_local(p)
	if absf(q.x) > W * 0.5 + pad or absf(q.y) > H * 0.5 + pad:
		return false
	var poly := Geometry2D.offset_polygon(points_for(flipped), pad)
	return not poly.is_empty() and Geometry2D.is_point_in_polygon(q, poly[0])


func _draw() -> void:
	var pts := points_for(flipped)
	if player:
		Ink.glow(self, pts, Pal.WARM, 1.25 if selected else 0.8)
	draw_colored_polygon(pts, Pal.WOOD)
	var s := -1.0 if flipped else 1.0
	# тёмная задняя грань и полосы-волокна вдоль уклона
	var bx := s * W * 0.5
	draw_colored_polygon(PackedVector2Array([Vector2(bx, -H * 0.5 + 4), Vector2(bx, H * 0.5 - 2), Vector2(bx - s * 9, H * 0.5 - 2), Vector2(bx - s * 9, -H * 0.5 + 9)]), Pal.alpha(Pal.WOOD_DARK, 0.8))
	for i in 3:
		var t := 0.3 + i * 0.2
		var p0 := Vector2(-s * W * 0.5, H * 0.5).lerp(Vector2(s * W * 0.5, -H * 0.5), t)
		draw_line(p0 + Vector2(-s * 6, 9 + i * 5), p0 + Vector2(s * 26, -4 + i * 5), Pal.alpha(Pal.WOOD_DARK, 0.6), 1.0)
	draw_line(Vector2(-s * W * 0.5 + s * 10, H * 0.5 - 5), Vector2(s * W * 0.5 - s * 4, -H * 0.5 + 6), Pal.alpha(Pal.PAPER, 0.35), 1.2)
	Ink.closed_line(self, Ink.wobble(pts, 0.8, 16.0, 11), Pal.INK, 2.2)
