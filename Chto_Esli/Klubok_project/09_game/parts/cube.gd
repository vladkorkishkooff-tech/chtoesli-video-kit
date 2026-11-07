@tool
class_name Cube
extends RigidBody2D
## Кубик 1×1 клетка: свободный груз — падает, толкает, давит.

const SIZE := 64.0

var player := false
var selected := false:
	set(v):
		selected = v
		queue_redraw()


func _init() -> void:
	var s := RectangleShape2D.new()
	s.size = Vector2(SIZE, SIZE)
	var cs := CollisionShape2D.new()
	cs.shape = s
	add_child(cs, false, Node.INTERNAL_MODE_FRONT)
	mass = 1.0
	physics_material_override = Phys.material(0.7, 0.05)
	freeze = true
	freeze_mode = RigidBody2D.FREEZE_MODE_STATIC
	can_sleep = false
	add_to_group("solid")
	add_to_group("cube")
	add_to_group("dynamic")
	add_to_group("heavy")


func activate() -> void:
	freeze = false


func local_poly() -> PackedVector2Array:
	var h := SIZE * 0.5
	return Phys.rect_poly(Rect2(-h, -h, SIZE, SIZE))


func solid_polys() -> Array:
	return [global_transform * local_poly()]


func solid_strict() -> bool:
	return true


func solid_name() -> String:
	return "кубик"


func hit_test(p: Vector2, pad := 8.0) -> bool:
	var q := to_local(p)
	return absf(q.x) <= SIZE * 0.5 + pad and absf(q.y) <= SIZE * 0.5 + pad


func is_moving() -> bool:
	return not freeze and (linear_velocity.length() > 5.0 or absf(angular_velocity) > 0.1)


func _draw() -> void:
	var h := SIZE * 0.5
	var body := Ink.round_rect(Rect2(-h, -h, SIZE, SIZE), 5.0)
	if player:
		Ink.glow(self, body, Pal.WARM, 1.25 if selected else 0.8)
	draw_colored_polygon(body, Pal.TERRACOTTA)
	var top := Pal.mix(Pal.TERRACOTTA, Pal.WARM, 0.38)
	var side := Pal.mix(Pal.TERRACOTTA, Pal.INK, 0.22)
	draw_colored_polygon(PackedVector2Array([Vector2(-h + 3, -h + 3), Vector2(h - 3, -h + 3), Vector2(h - 11, -h + 11), Vector2(-h + 11, -h + 11)]), top)
	draw_colored_polygon(PackedVector2Array([Vector2(h - 3, -h + 3), Vector2(h - 3, h - 3), Vector2(h - 11, h - 11), Vector2(h - 11, -h + 11)]), side)
	for i in 6:
		var p := Vector2(Ink.hash01(i * 3 + 1) - 0.5, Ink.hash01(i * 3 + 2) - 0.5) * (SIZE - 26)
		draw_circle(p + Vector2(-3, 3), 1.3, Pal.alpha(Pal.INK, 0.25))
	Ink.closed_line(self, Ink.wobble(body, 0.8, 14.0, 5), Pal.INK, 2.2)
