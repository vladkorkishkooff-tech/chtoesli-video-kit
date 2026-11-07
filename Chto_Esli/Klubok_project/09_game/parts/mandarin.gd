@tool
class_name Mandarin
extends Item
## Мандарин: лёгкий (0,25) и упругий шар — скачет и отскакивает от стен.
## Отскок по закону отражения: как упал на наклон — так и отлетел, только зеркально.

const R := 20.0


func _setup() -> void:
	kind = "mandarin"
	dynamic = true
	var s := CircleShape2D.new()
	s.radius = R
	_add_shape(s)
	mass = 0.25
	physics_material_override = Phys.material(0.5, 0.6)
	continuous_cd = RigidBody2D.CCD_MODE_CAST_SHAPE
	linear_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	linear_damp = 0.05
	angular_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	angular_damp = 0.3
	z_index = 3
	add_to_group("dynamic")


static func outline() -> PackedVector2Array:
	return Phys.circle_poly(Vector2.ZERO, R, 18)


static func footprint(item: Dictionary) -> PackedVector2Array:
	var p: Vector2 = item["pos"]
	return Phys.circle_poly(p, R, 18)


func local_poly() -> PackedVector2Array:
	return outline()


func paint(ci: CanvasItem) -> void:
	var peel := Pal.mix(Pal.TERRACOTTA, Pal.WARM, 0.3)
	var dark := Pal.mix(Pal.TERRACOTTA, Pal.INK, 0.25)
	ci.draw_circle(Vector2.ZERO, R, peel)
	ci.draw_arc(Vector2.ZERO, R - 5.0, 0.15, 1.7, 12, Pal.alpha(dark, 0.55), 5.0, true)
	ci.draw_arc(Vector2.ZERO, R - 6.0, PI * 1.08, PI * 1.45, 8, Pal.alpha(Pal.PAPER, 0.6), 2.5, true)
	for i in 8:
		var q := Vector2(Ink.hash01(i * 5 + 3) - 0.5, Ink.hash01(i * 5 + 4) - 0.5) * R * 1.4
		if q.length() < R - 5.0:
			ci.draw_circle(q, 1.1, Pal.alpha(dark, 0.45))
	var leaf := Pal.mix(Pal.OLIVE, Pal.NIGHT, 0.4)
	ci.draw_colored_polygon(PackedVector2Array([Vector2(1, -R + 3), Vector2(8, -R - 6), Vector2(16, -R - 5), Vector2(9, -R + 1)]), leaf)
	ci.draw_line(Vector2(1, -R + 3), Vector2(13, -R - 4), Pal.alpha(Pal.INK, 0.5), 1.0, true)
	ci.draw_line(Vector2(-1, -R + 4), Vector2(1, -R - 3), Pal.INK, 2.2, true)
	Ink.closed_line(ci, Ink.wobble(outline(), 0.5, 9.0, 4), Pal.INK, 2.2)
