@tool
class_name Beam
extends RigidBody2D
## Балка: 1–6 клеток × 12 px, угол через 15°, начало — в точке сетки.
## Без гвоздя — неподвижна. С гвоздём — крутится вокруг него (PinJoint2D к якорю).

const THICK := 12.0
const MASS_PER_CELL := 0.5

## Длина в клетках (клетка — 64 px).
@export_range(1, 6) var cells: int = 4:
	set(v):
		cells = clampi(v, 1, Phys.MAX_CELLS)
		_rebuild()
## Угол шагами по 15° по часовой стрелке: 1 — 15° вниз вправо, −2 — 30° вверх вправо.
@export_range(-23, 23) var angle_step: int = 0:
	set(v):
		angle_step = v
		_rebuild()
## Точка с гвоздём: 0…cells (номер клетки от начала), −1 — без гвоздя.
@export var nail_cell: int = -1:
	set(v):
		nail_cell = v
		queue_redraw()
## Балка уровня: холодная, игрок её не меняет.
@export var locked: bool = false:
	set(v):
		locked = v
		queue_redraw()

var player := false
var selected := false:
	set(v):
		selected = v
		queue_redraw()
var anchor: StaticBody2D
var joint: PinJoint2D
var _shape: CollisionShape2D
var _cap: CapsuleShape2D


func _init() -> void:
	_cap = CapsuleShape2D.new()
	_cap.radius = THICK * 0.5
	_shape = CollisionShape2D.new()
	_shape.shape = _cap
	_shape.rotation = PI * 0.5
	add_child(_shape, false, Node.INTERNAL_MODE_FRONT)
	freeze = true
	freeze_mode = RigidBody2D.FREEZE_MODE_STATIC
	physics_material_override = Phys.material(0.6, 0.1)
	angular_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	angular_damp = 0.15
	linear_damp_mode = RigidBody2D.DAMP_MODE_REPLACE
	linear_damp = 0.0
	can_sleep = false
	add_to_group("solid")
	add_to_group("beam")
	_rebuild()


func _rebuild() -> void:
	if _cap == null:
		return
	var l := length()
	_cap.height = l
	_shape.position = Vector2(l * 0.5, 0)
	rotation = deg_to_rad(15.0 * angle_step)
	mass = MASS_PER_CELL * cells
	queue_redraw()


func length() -> float:
	return Phys.CELL * cells


func a() -> Vector2:
	return global_position


func b() -> Vector2:
	return to_global(Vector2(length(), 0))


func has_nail() -> bool:
	return nail_cell >= 0 and nail_cell <= cells


func pivot() -> Vector2:
	return to_global(Vector2(nail_cell * Phys.CELL, 0))


## Точки-клетки, куда можно вбить гвоздь.
func cell_points() -> PackedVector2Array:
	var pts := PackedVector2Array()
	for k in cells + 1:
		pts.append(to_global(Vector2(k * Phys.CELL, 0)))
	return pts


## Пуск: балка с гвоздём оживает. Якорь — неподвижное тело в точке гвоздя.
func activate() -> void:
	if not has_nail():
		return
	var parent := get_parent()
	var p := pivot()
	anchor = StaticBody2D.new()
	anchor.name = String(name) + "_Anchor"
	anchor.position = parent.to_local(p) if parent is Node2D else p
	parent.add_child(anchor)
	joint = PinJoint2D.new()
	joint.name = String(name) + "_Nail"
	joint.position = anchor.position
	joint.disable_collision = true
	joint.node_a = NodePath("../" + String(name))
	joint.node_b = NodePath("../" + String(anchor.name))
	parent.add_child(joint)
	freeze = false


func solid_polys() -> Array:
	return [Phys.capsule_poly(a(), b(), THICK * 0.5)]


func solid_strict() -> bool:
	return true


func solid_name() -> String:
	return "балку уровня" if locked else "балку"


func hit_test(p: Vector2, pad := 14.0) -> bool:
	var q := Geometry2D.get_closest_point_to_segment(p, a(), b())
	return q.distance_to(p) <= THICK * 0.5 + pad


func is_moving() -> bool:
	return not freeze and absf(angular_velocity) > 0.05


func _draw() -> void:
	var l := length()
	var body := Ink.round_rect(Rect2(0, -THICK * 0.5, l, THICK), 4.0)
	var wood := Pal.WOOD_COLD if locked else Pal.WOOD
	var dark := Pal.mix(Pal.WOOD_COLD, Pal.INK, 0.25) if locked else Pal.WOOD_DARK
	if player:
		Ink.glow(self, body, Pal.WARM, 1.25 if selected else 0.8)
	draw_colored_polygon(body, wood)
	# нижняя грань темнее, верхняя — блик
	draw_rect(Rect2(3, 1.5, l - 6, 3.5), Pal.alpha(dark, 0.75))
	draw_line(Vector2(5, -3.5), Vector2(l - 5, -3.5), Pal.alpha(Pal.PAPER, 0.35), 1.2)
	# волокна дерева
	var sd := cells * 13 + angle_step * 7
	for i in 3:
		var y := -2.0 + i * 1.6
		var x0 := 12.0 + Ink.hash01(sd + i) * l * 0.3
		var x1 := minf(l - 10.0, x0 + l * (0.25 + 0.3 * Ink.hash01(sd + i + 9)))
		if x1 > x0:
			draw_line(Vector2(x0, y), Vector2(x1, y + 0.6), Pal.alpha(dark, 0.55), 1.0)
	# дырочки у концов
	for x in [9.0, l - 9.0]:
		draw_circle(Vector2(x, -0.5), 2.3, Pal.alpha(Pal.INK, 0.85))
		if locked:
			draw_line(Vector2(x - 2, -0.5), Vector2(x + 2, -0.5), Pal.alpha(Pal.STEEL, 0.9), 1.0)
	Ink.closed_line(self, Ink.wobble(body, 0.7, 14.0, sd), Pal.alpha(Pal.INK, 0.9 if locked else 1.0), 2.0)
	if has_nail():
		_draw_nail(Vector2(nail_cell * Phys.CELL, 0))


func _draw_nail(c: Vector2) -> void:
	draw_circle(c + Vector2(1.5, 2), 7.5, Pal.alpha(Pal.INK, 0.35))
	draw_circle(c, 7.0, Pal.STEEL)
	draw_arc(c, 7.0, 0, TAU, 20, Pal.INK, 2.0, true)
	draw_circle(c + Vector2(-2, -2), 2.0, Pal.alpha(Pal.PAPER, 0.9))
