@tool
class_name Yarn
extends RigidBody2D
## Клубок: катится, разматывается и оставляет нитку. Нитка кончилась — неудача.

const R0 := 26.0
const MIN_SCALE := 0.65   ## к концу нитки клубок худеет до 65 %

var radius := R0
var thread_length := 1800.0
var used := 0.0
var trail: Line2D
var _last := Vector2.ZERO
var _shape: CircleShape2D


func _init() -> void:
	_shape = CircleShape2D.new()
	_shape.radius = R0
	var cs := CollisionShape2D.new()
	cs.shape = _shape
	add_child(cs, false, Node.INTERNAL_MODE_FRONT)
	mass = 0.4
	physics_material_override = Phys.material(1.0, 0.0)
	continuous_cd = RigidBody2D.CCD_MODE_CAST_SHAPE
	freeze = true
	freeze_mode = RigidBody2D.FREEZE_MODE_STATIC
	linear_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	linear_damp = 0.05
	angular_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	angular_damp = 0.4
	can_sleep = false
	z_index = 3
	add_to_group("solid")
	add_to_group("yarn")


## Пуск: клубок отпускают, нитка начинает ложиться.
func launch(trail_parent: Node2D) -> void:
	used = 0.0
	_last = global_position
	trail = Line2D.new()
	trail.name = "Thread"
	trail.width = 3.0
	trail.default_color = Pal.mix(Pal.TERRACOTTA, Pal.INK, 0.18)
	trail.joint_mode = Line2D.LINE_JOINT_ROUND
	trail.begin_cap_mode = Line2D.LINE_CAP_ROUND
	trail.end_cap_mode = Line2D.LINE_CAP_ROUND
	trail.antialiased = true
	trail.z_index = 2
	trail_parent.add_child(trail)
	var tp := trail_parent.to_local(_thread_point())
	trail.add_point(tp)
	trail.add_point(tp)
	freeze = false


## Каждый кадр физики (из LevelRunner): расход нитки, размер, след.
func track() -> void:
	var p := global_position
	used += p.distance_to(_last)
	_last = p
	var k := clampf(used / thread_length, 0.0, 1.0)
	var r := R0 * lerpf(1.0, MIN_SCALE, k)
	if absf(r - radius) > 0.25:
		radius = r
		_shape.radius = r
	if trail != null:
		var tp := trail.get_parent().to_local(_thread_point()) as Vector2
		var n := trail.get_point_count()
		trail.set_point_position(n - 1, tp)
		if trail.get_point_position(n - 2).distance_to(tp) > 8.0:
			trail.add_point(tp)
	queue_redraw()


## Двигаем только конец нарисованной нитки во время сцены победы, не изменяя расход.
func visual_thread_follow() -> void:
	if trail != null and is_instance_valid(trail) and trail.get_point_count() > 0:
		trail.set_point_position(trail.get_point_count() - 1, trail.get_parent().to_local(_thread_point()))


func thread_left() -> float:
	return thread_length - used


func _thread_point() -> Vector2:
	return global_position + Vector2(0, radius - 3.0)


func solid_polys() -> Array:
	return [Phys.circle_poly(global_position, radius, 16)]


func solid_strict() -> bool:
	return true


func solid_name() -> String:
	return "клубок"


func is_moving() -> bool:
	return not freeze and (linear_velocity.length() > 5.0 or absf(angular_velocity) > 0.25)


func _draw() -> void:
	var r := radius
	draw_circle(Vector2.ZERO, r, Pal.TERRACOTTA)
	var dark := Pal.mix(Pal.TERRACOTTA, Pal.INK, 0.3)
	var lite := Pal.mix(Pal.TERRACOTTA, Pal.WARM, 0.35)
	# обмотка: две семьи дуг, обрезанных кругом клубка
	for fam in 2:
		var base := 0.0 if fam == 0 else 2.1
		for i in 5:
			var c := Vector2.from_angle(base) * (-r * 1.55) + Vector2.from_angle(base + PI * 0.5) * ((i - 2) * r * 0.4)
			var pts := PackedVector2Array()
			for s in 33:
				var q := c + Vector2.from_angle(base - 1.1 + 2.2 * s / 32.0) * r * 1.85
				if q.length() < r - 1.8:
					pts.append(q)
				elif pts.size() > 1:
					break
			if pts.size() > 1:
				draw_polyline(pts, dark if fam == 0 else Pal.alpha(lite, 0.8), 1.5, true)
	# блик всегда слева сверху, хоть клубок и крутится
	draw_arc(Vector2.ZERO, r - 5.0, PI * 1.08 - rotation, PI * 1.5 - rotation, 10, Pal.alpha(Pal.WARM, 0.6), 2.2, true)
	Ink.closed_line(self, Ink.wobble(Phys.circle_poly(Vector2.ZERO, r, 28), 0.6, 9.0, 3), Pal.INK, 2.2)
