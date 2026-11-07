@tool
class_name Gift
extends RigidBody2D
## Подарок — тяжёлый груз (1,2) на нитке (Hanger). Качается; нитку пережгли — падает и бьёт.

const S := Vector2(48, 44)


func _init() -> void:
	var r := RectangleShape2D.new()
	r.size = S
	var cs := CollisionShape2D.new()
	cs.shape = r
	add_child(cs, false, Node.INTERNAL_MODE_FRONT)
	mass = 1.2
	physics_material_override = Phys.material(0.7, 0.05)
	freeze = true
	freeze_mode = RigidBody2D.FREEZE_MODE_STATIC
	can_sleep = false
	angular_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	angular_damp = 0.4
	z_index = 2
	add_to_group("solid")
	add_to_group("dynamic")
	add_to_group("heavy")


func local_poly() -> PackedVector2Array:
	return Phys.rect_poly(Rect2(-S * 0.5, S))


func solid_polys() -> Array:
	return [global_transform * local_poly()]


func solid_strict() -> bool:
	return true


func solid_name() -> String:
	return "подарок"


func is_moving() -> bool:
	return not freeze and (linear_velocity.length() > 5.0 or absf(angular_velocity) > 0.2)


## Точка, где привязана нитка (верх коробки).
func tie_point() -> Vector2:
	return to_global(Vector2(0, -S.y * 0.5))


func _draw() -> void:
	var box := Ink.round_rect(Rect2(-S * 0.5, S), 4.0)
	var paper := Pal.mix(Pal.OLIVE, Pal.NIGHT, 0.32)
	draw_colored_polygon(box, paper)
	draw_colored_polygon(PackedVector2Array([Vector2(S.x * 0.5 - 8, -S.y * 0.5 + 3), Vector2(S.x * 0.5 - 2, -S.y * 0.5 + 3), Vector2(S.x * 0.5 - 2, S.y * 0.5 - 3), Vector2(S.x * 0.5 - 8, S.y * 0.5 - 3)]), Pal.alpha(Pal.INK, 0.18))
	var ribbon := Pal.WARM
	draw_rect(Rect2(-4, -S.y * 0.5, 8, S.y), ribbon)
	draw_rect(Rect2(-S.x * 0.5, -4, S.x, 8), ribbon)
	# бант
	for sx in [-1.0, 1.0]:
		draw_colored_polygon(PackedVector2Array([Vector2(0, -S.y * 0.5), Vector2(sx * 13, -S.y * 0.5 - 9), Vector2(sx * 12, -S.y * 0.5 + 1)]), ribbon)
		draw_polyline(PackedVector2Array([Vector2(0, -S.y * 0.5), Vector2(sx * 13, -S.y * 0.5 - 9), Vector2(sx * 12, -S.y * 0.5 + 1), Vector2(0, -S.y * 0.5)]), Pal.INK, 1.5, true)
	Ink.closed_line(self, Ink.wobble(box, 0.5, 12.0, 21), Pal.INK, 2.2)
