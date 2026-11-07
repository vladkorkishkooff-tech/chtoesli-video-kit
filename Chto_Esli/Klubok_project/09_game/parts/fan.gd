@tool
class_name Fan
extends Item
## Фен: струя воздуха на 5 клеток. Толкает любое тело одинаковой силой — значит, лёгкое
## сдувает сильнее тяжёлого (ускорение = сила / масса). Дальше от сопла — слабее. Стенка струю загораживает.
## Повернуть — кнопкой «⟳», шаг 45°.

const REACH := 320.0
const W0 := 48.0
const W1 := 128.0
const POWER := 260.0
const NOZZLE := 30.0
## Шесть клеток по прямой от выхода провода до розетки.
const CORD_LENGTH := 6.0 * Phys.CELL
const CORD_END := Vector2(-14, 38)

var on := false
var outlet := Vector2.INF


func _setup() -> void:
	kind = "fan"
	var barrel := RectangleShape2D.new()
	barrel.size = Vector2(60, 30)
	_add_shape(barrel)
	var handle := RectangleShape2D.new()
	handle.size = Vector2(14, 24)
	_add_shape(handle, Vector2(-14, 26))
	physics_material_override = Phys.material(0.6, 0.1)
	add_to_group("fan")


func _on_dir() -> void:
	rotation = deg_to_rad(45.0 * dir)
	queue_redraw()


static func outline() -> PackedVector2Array:
	return PackedVector2Array([Vector2(-30, -15), Vector2(30, -15), Vector2(30, 15), Vector2(-7, 15), Vector2(-7, 38), Vector2(-21, 38), Vector2(-21, 15), Vector2(-30, 15)])


static func zone_local() -> PackedVector2Array:
	return PackedVector2Array([Vector2(NOZZLE, -W0 * 0.5), Vector2(NOZZLE + REACH, -W1 * 0.5), Vector2(NOZZLE + REACH, W1 * 0.5), Vector2(NOZZLE, W0 * 0.5)])


static func xform(item: Dictionary) -> Transform2D:
	var p: Vector2 = item["pos"]
	return Transform2D(deg_to_rad(45.0 * int(item.get("dir", 0))), p)


static func cord_end_at(item: Dictionary) -> Vector2:
	return xform(item) * CORD_END


func connected() -> bool:
	return outlet != Vector2.INF and to_global(CORD_END).distance_to(outlet) <= CORD_LENGTH + 0.01


static func footprint(item: Dictionary) -> PackedVector2Array:
	return xform(item) * outline()


func local_poly() -> PackedVector2Array:
	return outline()


func nozzle() -> Vector2:
	return to_global(Vector2(NOZZLE, 0))


func zone() -> PackedVector2Array:
	return global_transform * zone_local()


## Сила струи в точке p (без учёта стенок): по оси фена, слабеет к концу до 30 %.
func force_at(p: Vector2) -> Vector2:
	if not on or not connected():
		return Vector2.ZERO
	var q := to_local(p)
	var x := q.x - NOZZLE
	if x < 0.0 or x > REACH:
		return Vector2.ZERO
	var half := lerpf(W0 * 0.5, W1 * 0.5, x / REACH)
	if absf(q.y) > half:
		return Vector2.ZERO
	return Vector2.from_angle(rotation) * POWER * (1.0 - 0.7 * x / REACH)


func _process(delta: float) -> void:
	_t += delta
	queue_redraw()


func paint(ci: CanvasItem) -> void:
	# Шнур обозначает подключение; изгиб декоративный, длина — расстояние по прямой.
	if ci == self and connected():
		var dest := to_local(outlet)
		var middle := (CORD_END + dest) * 0.5 + Vector2(0, 18).rotated(-rotation)
		var points := PackedVector2Array()
		for i in 25:
			var t := i / 24.0
			points.append(CORD_END * (1.0 - t) * (1.0 - t) + middle * 2.0 * (1.0 - t) * t + dest * t * t)
		ci.draw_polyline(points, Pal.INK, 5.0, true)
		ci.draw_polyline(points, Pal.mix(Pal.DUSK, Pal.PAPER, 0.3), 2.0, true)
		ci.draw_circle(dest, 5.0, Pal.INK)
	elif ci == self and player and not connected():
		# Старую расстановку можно исправить: показать разрыв до ближайшей розетки.
		if outlet != Vector2.INF:
			ci.draw_dashed_line(CORD_END, to_local(outlet), Pal.alpha(Pal.TERRACOTTA, 0.85), 2.5, 7.0)
		ci.draw_circle(Vector2(-18, -24), 9.0, Pal.TERRACOTTA)
		ci.draw_string(Fonts.SERIF_BOLD, Vector2(-21, -18), "!", HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Pal.PAPER)
	# струя: в сборке — бледный пунктир зоны, в пуске — бегущие штрихи
	if ci == self:
		var z := zone_local()
		if on and connected():
			for i in 5:
				var yy := lerpf(-0.8, 0.8, i / 4.0)
				var ph := fmod(_t * 2.2 + i * 0.37, 1.0)
				for k in 3:
					var t0 := fmod(ph + k / 3.0, 1.0)
					var x0 := NOZZLE + 6 + t0 * (REACH - 40)
					var half := lerpf(W0 * 0.5, W1 * 0.5, (x0 - NOZZLE) / REACH)
					var a := (1.0 - t0) * 0.55
					ci.draw_line(Vector2(x0, yy * half), Vector2(x0 + 26, yy * half * 1.04), Pal.alpha(Pal.PAPER, a), 2.0, true)
		else:
			for i in z.size():
				ci.draw_dashed_line(z[i], z[(i + 1) % z.size()], Pal.alpha(Pal.PAPER, 0.22), 1.5, 6.0)
			for i in 3:
				var yy := lerpf(-0.6, 0.6, i / 2.0)
				ci.draw_dashed_line(Vector2(NOZZLE + 10, yy * W0 * 0.5), Vector2(NOZZLE + REACH * 0.6, yy * W1 * 0.32), Pal.alpha(Pal.PAPER, 0.16), 1.5, 9.0)
	var shell := Pal.mix(Pal.DUSK, Pal.PAPER, 0.38)
	var dark := Pal.mix(shell, Pal.INK, 0.3)
	# ручка и шнур
	var handle := PackedVector2Array([Vector2(-7, 12), Vector2(-7, 38), Vector2(-21, 38), Vector2(-21, 12)])
	ci.draw_colored_polygon(handle, dark)
	Ink.closed_line(ci, handle, Pal.INK, 2.0)
	ci.draw_polyline(PackedVector2Array([Vector2(-14, 38), Vector2(-12, 46), Vector2(-18, 52), Vector2(-26, 50)]), Pal.alpha(Pal.INK, 0.6), 2.0, true)
	# корпус
	var body := Ink.round_rect(Rect2(-30, -15, 52, 30), 12.0)
	ci.draw_colored_polygon(body, shell)
	ci.draw_colored_polygon(Ink.round_rect(Rect2(-24, -11, 36, 7), 3.0), Pal.alpha(Pal.PAPER, 0.35))
	Ink.closed_line(ci, Ink.wobble(body, 0.5, 10.0, 14), Pal.INK, 2.2)
	# сопло с решёткой
	var nz := PackedVector2Array([Vector2(18, -12), Vector2(30, -14), Vector2(30, 14), Vector2(18, 12)])
	ci.draw_colored_polygon(nz, Pal.STEEL)
	for k in 3:
		ci.draw_line(Vector2(22 + k * 3, -11), Vector2(22 + k * 3, 11), Pal.alpha(Pal.INK, 0.45), 1.2)
	Ink.closed_line(ci, nz, Pal.INK, 2.0)
	ci.draw_circle(Vector2(-12, 0), 3.0, Pal.OLIVE if on else Pal.alpha(Pal.INK, 0.4))


func activate() -> void:
	on = connected()
