@tool
class_name Item
extends RigidBody2D
## Деталь-предмет, которую ставят в точку: мандарин, домино, батут, подушка, свеча, фен (02_physics/parts.md).
## Неподвижные — замороженное тело (то же, что StaticBody2D); подвижные (dynamic) отпускаются на пуске.
## В расстановке: {"type": "fan", "pos": Vector2, "dir": 0…7}. Кубик и клин — свои классы с теми же методами.

var kind := ""
var player := false
var selected := false:
	set(v):
		selected = v
		queue_redraw()
## Подвижная деталь: на пуске отпускается (мандарин, домино).
var dynamic := false
## Направление (фен): 0…7, шаг 45° по часовой, 0 — вправо.
@export_range(0, 7) var dir := 0:
	set(v):
		dir = posmod(v, 8)
		_on_dir()
var _t := 0.0


func _init() -> void:
	freeze = true
	freeze_mode = RigidBody2D.FREEZE_MODE_STATIC
	can_sleep = false
	add_to_group("solid")
	add_to_group("item")
	_setup()


## Форма, масса, материал — у каждой детали свои.
func _setup() -> void:
	pass


func _on_dir() -> void:
	queue_redraw()


func apply(item: Dictionary) -> void:
	position = item["pos"]
	dir = int(item.get("dir", 0))


## Пуск: подвижные детали отпускаем.
func activate() -> void:
	if dynamic:
		freeze = false


func _add_shape(s: Shape2D, at := Vector2.ZERO) -> void:
	var cs := CollisionShape2D.new()
	cs.shape = s
	cs.position = at
	add_child(cs, false, Node.INTERNAL_MODE_FRONT)


func local_poly() -> PackedVector2Array:
	return PackedVector2Array()


func solid_polys() -> Array:
	return [global_transform * local_poly()]


func solid_strict() -> bool:
	return true


func solid_name() -> String:
	return String(Items.ACCUSATIVE.get(kind, kind))


func hit_test(p: Vector2, pad := 8.0) -> bool:
	var grown := Geometry2D.offset_polygon(local_poly(), pad)
	return not grown.is_empty() and Geometry2D.is_point_in_polygon(to_local(p), grown[0])


func is_moving() -> bool:
	return dynamic and not freeze and (linear_velocity.length() > 5.0 or absf(angular_velocity) > 0.2)


func _draw() -> void:
	if player:
		Ink.glow(self, local_poly(), Pal.WARM, 1.25 if selected else 0.8)
	paint(self)


## Рисунок детали в её координатах — им же рисуется значок в инвентаре (InvSlot).
func paint(_ci: CanvasItem) -> void:
	pass
