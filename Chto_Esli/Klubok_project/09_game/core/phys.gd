@tool
class_name Phys
extends RefCounted
## Общие числа физики и геометрии. Правила — 02_physics/construction.md.

const CELL := 64.0          ## клетка сетки
const SNAP := 16.0          ## привязка кубика и клина
const VIEW := Vector2(1280, 720)
const FLOOR_Y := 576.0      ## верх пола
## Где можно строить: выше — панели интерфейса, ниже — пол.
const BUILD_RECT := Rect2(0, 80, 1280, 496)
const MAX_CELLS := 6


static func material(friction: float, bounce: float) -> PhysicsMaterial:
	var m := PhysicsMaterial.new()
	m.friction = friction
	m.bounce = bounce
	return m


## Направление балки: шаг — 15°, по часовой стрелке (ось Y экрана смотрит вниз).
static func dir(step: int) -> Vector2:
	var s := posmod(step, 24)
	match s:
		0: return Vector2.RIGHT
		6: return Vector2.DOWN
		12: return Vector2.LEFT
		18: return Vector2.UP
	return Vector2.from_angle(deg_to_rad(15.0 * s))


static func beam_end(a: Vector2, step: int, cells: int) -> Vector2:
	return a + dir(step) * CELL * cells


## Угол балки к горизонту для подписи «30° · 4 клетки».
static func slope_deg(step: int) -> int:
	var s := posmod(step, 12)
	return 15 * (s if s <= 6 else 12 - s)


static func cells_word(n: int) -> String:
	var m10 := n % 10
	var m100 := n % 100
	if m10 == 1 and m100 != 11:
		return "%d клетка" % n
	if m10 >= 2 and m10 <= 4 and (m100 < 12 or m100 > 14):
		return "%d клетки" % n
	return "%d клеток" % n


## Капсула (балка) как многоугольник: отрезок a→b, радиус r.
static func capsule_poly(a: Vector2, b: Vector2, r: float, seg := 6) -> PackedVector2Array:
	var d := b - a
	var ang := d.angle() if d.length() > 0.001 else 0.0
	var pts := PackedVector2Array()
	for i in seg + 1:
		pts.append(b + Vector2.from_angle(ang - PI * 0.5 + PI * float(i) / seg) * r)
	for i in seg + 1:
		pts.append(a + Vector2.from_angle(ang + PI * 0.5 + PI * float(i) / seg) * r)
	return pts


static func rect_poly(r: Rect2) -> PackedVector2Array:
	return PackedVector2Array([r.position, Vector2(r.end.x, r.position.y), r.end, Vector2(r.position.x, r.end.y)])


static func circle_poly(c: Vector2, r: float, seg := 16) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in seg:
		pts.append(c + Vector2.from_angle(TAU * float(i) / seg) * r)
	return pts


static func overlap(a: PackedVector2Array, b: PackedVector2Array) -> bool:
	if a.size() < 3 or b.size() < 3:
		return false
	return not Geometry2D.intersect_polygons(a, b).is_empty()


static func shrink(poly: PackedVector2Array, by: float) -> PackedVector2Array:
	var res := Geometry2D.offset_polygon(poly, -by)
	if res.is_empty():
		return PackedVector2Array()
	return res[0]


## Проходит ли отрезок через внутренность многоугольника.
static func segment_inside(a: Vector2, b: Vector2, poly: PackedVector2Array) -> bool:
	if poly.size() < 3:
		return false
	return not Geometry2D.intersect_polyline_with_polygon(PackedVector2Array([a, b]), poly).is_empty()


## Точка сетки 64 px, ближайшая к p.
static func grid_point(p: Vector2) -> Vector2:
	return (p / CELL).round() * CELL


static func snap16(p: Vector2) -> Vector2:
	return (p / SNAP).round() * SNAP
