@tool
class_name Domino
extends Item
## Домино: высокая тонкая костяшка (¼ × 1 клетка, масса 0,3). Падает и роняет соседнюю —
## цепочка идёт, если костяшки стоят ближе, чем их высота.

const W := 16.0
const H := 64.0


func _setup() -> void:
	kind = "domino"
	dynamic = true
	var s := RectangleShape2D.new()
	s.size = Vector2(W, H)
	_add_shape(s)
	mass = 0.3
	physics_material_override = Phys.material(0.5, 0.0)
	angular_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	angular_damp = 0.1
	z_index = 1
	add_to_group("dynamic")


static func outline() -> PackedVector2Array:
	return Phys.rect_poly(Rect2(-W * 0.5, -H * 0.5, W, H))


static func footprint(item: Dictionary) -> PackedVector2Array:
	var p: Vector2 = item["pos"]
	return Transform2D(0.0, p) * outline()


func local_poly() -> PackedVector2Array:
	return outline()


func paint(ci: CanvasItem) -> void:
	var body := Ink.round_rect(Rect2(-W * 0.5, -H * 0.5, W, H), 3.0)
	ci.draw_colored_polygon(body, Pal.PAPER)
	ci.draw_colored_polygon(PackedVector2Array([Vector2(W * 0.5 - 4, -H * 0.5 + 3), Vector2(W * 0.5 - 1, -H * 0.5 + 3), Vector2(W * 0.5 - 1, H * 0.5 - 3), Vector2(W * 0.5 - 4, H * 0.5 - 3)]), Pal.alpha(Pal.DUSK, 0.35))
	ci.draw_line(Vector2(-W * 0.5 + 3, 0), Vector2(W * 0.5 - 3, 0), Pal.alpha(Pal.INK, 0.7), 1.5)
	for q in [Vector2(0, -H * 0.25), Vector2(-3, H * 0.15), Vector2(3, H * 0.35)]:
		ci.draw_circle(q, 2.2, Pal.INK)
	Ink.closed_line(ci, Ink.wobble(body, 0.4, 10.0, 6), Pal.INK, 2.0)
