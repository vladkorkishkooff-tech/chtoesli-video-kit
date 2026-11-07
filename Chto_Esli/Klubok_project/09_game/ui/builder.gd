class_name Builder
extends Node2D
## Сборка: балки рисуются пальцем от точки к точке, остальные детали (core/items.gd) ставятся из инвентаря,
## гвоздь вбивается в точку-клетку своей балки. Правила — 02_physics/construction.md.

signal changed                       ## расстановка изменилась
signal message(text: String)         ## короткое сообщение (почему нельзя и т. п.)
signal hint(text: String)            ## подсказка в панели инвентаря
signal pet_cat
signal hand_changed(kind: String)    ## что «в руке» — для подсветки слота

enum Mode { IDLE, DRAW, END_DRAG, MOVE, CARRY }

const DRAG_START := 8.0
const HANDLE_R := 24.0
const BTN_R := 24.0
const BAR_TOP := 624.0
const MAX_UNDO := 30
const SETTLE_UP := 16.0              ## деталь «садится» на опору: ищем её от низа −16 px…
const SETTLE_DOWN := 40.0            ## …до +40 px

var runner: LevelRunner
var enabled := true:
	set(v):
		enabled = v
		_reset()
		_apply_selection()
		queue_redraw()
var mode := Mode.IDLE
var armed := ""
var carry := ""
var selected := -1
var ghost: Dictionary = {}
var ghost_why := ""
var help_ghost: Dictionary = {}
var _help_serial := 0

var _press := Vector2.ZERO
var _pointer := Vector2.ZERO
var _dragging := false
var _orig: Dictionary = {}
var _which := 1
var _warned := false
var _undo: Array = []
var _committed_layout: Array = []
var _suppress_ghost_label_until := 0


func setup(r: LevelRunner) -> void:
	runner = r
	runner.rebuilt.connect(_apply_selection)
	z_index = 20


func reset_level() -> void:
	clear_help()
	_undo.clear()
	_committed_layout = runner.layout.duplicate(true)
	selected = -1
	armed = ""
	_reset()


func _reset() -> void:
	mode = Mode.IDLE
	carry = ""
	ghost = {}
	ghost_why = ""
	_dragging = false
	hand_changed.emit(armed)


# ── данные ─────────────────────────────────────────────────────────

func _item(i: int) -> Dictionary:
	return runner.layout[i]


func _type(i: int) -> String:
	return String(runner.layout[i]["type"]) if i >= 0 and i < runner.layout.size() else ""


func _end(it: Dictionary) -> Vector2:
	return Phys.beam_end(it["a"], int(it["step"]), int(it["cells"]))


func _nail_pos(it: Dictionary) -> Vector2:
	var a: Vector2 = it["a"]
	return a + Phys.dir(int(it["step"])) * Phys.CELL * int(it.get("nail", -1))


func left(kind: String) -> int:
	return int(runner.inventory_left().get(kind, 0))


func _beam_toward(a: Vector2, p: Vector2) -> Dictionary:
	var v := p - a
	if v.length() < 24.0:
		return {}
	var step := posmod(int(round(rad_to_deg(v.angle()) / 15.0)), 24)
	var cells := clampi(int(round(v.length() / Phys.CELL)), 1, Phys.MAX_CELLS)
	return {"type": "beam", "a": a, "step": step, "cells": cells, "nail": -1}


## Гвоздь остаётся, если его точка — по-прежнему точка-клетка балки.
func _keep_nail(old: Dictionary, nb: Dictionary) -> int:
	if int(old.get("nail", -1)) < 0:
		return -1
	var np := _nail_pos(old)
	var a: Vector2 = nb["a"]
	for k in int(nb["cells"]) + 1:
		if (a + Phys.dir(int(nb["step"])) * Phys.CELL * k).distance_to(np) < 1.0:
			return k
	return -1


# ── проверка «можно ли поставить» ───────────────────────────────────

## Пустая строка — можно; иначе — почему нельзя.
func why(item: Dictionary, ignore: int) -> String:
	var t := String(item.get("type", ""))
	var lvl := runner.level
	var rect := Phys.BUILD_RECT.grow(1.0)
	var strict_poly := PackedVector2Array()
	var zone_poly := PackedVector2Array()
	var core_a := Vector2.ZERO
	var core_b := Vector2.ZERO
	var nailed := false
	match t:
		"beam":
			var a: Vector2 = item["a"]
			var b := _end(item)
			if not rect.has_point(a) or not rect.has_point(b):
				return "Слишком высоко" if minf(a.y, b.y) < rect.position.y else "За краем поля"
			var d := (b - a).normalized()
			core_a = a + d * 8.0
			core_b = b - d * 8.0
			strict_poly = Phys.capsule_poly(core_a, core_b, 5.0)
			zone_poly = Phys.capsule_poly(a + d * 2.0, b - d * 2.0, 6.0)
			nailed = int(item.get("nail", -1)) >= 0
		_:
			if not Items.KINDS.has(t):
				return "?"
			var poly := Items.footprint(item)
			for q in poly:
				if not rect.has_point(q):
					return "Слишком высоко" if q.y < rect.position.y else "За краем поля"
			strict_poly = Phys.shrink(poly, 1.0)
			zone_poly = strict_poly
	for z in lvl.nodes_in("nobuild"):
		for zp in (z as NoBuildZone).polys():
			if Phys.overlap(zone_poly, zp):
				return "Здесь строить нельзя"
	for s in lvl.nodes_in("solid"):
		if (s as Node).has_meta("layout_index") and int(s.get_meta("layout_index")) == ignore:
			continue
		var strict: bool = s.solid_strict()
		for sp in s.solid_polys():
			var hit := false
			if t == "beam" and not strict and not nailed:
				hit = Phys.segment_inside(core_a, core_b, Phys.shrink(sp, 1.0))
			else:
				hit = Phys.overlap(strict_poly, sp)
			if hit:
				return "Нельзя: задевает " + String(s.solid_name())
	if t == "fan":
		var end := Fan.cord_end_at(item)
		var socket := lvl.nearest_outlet(end)
		if socket == Vector2.INF:
			return "Для фена нужна розетка"
		if end.distance_to(socket) > Fan.CORD_LENGTH + 0.01:
			return "Провод не дотянется до розетки"
	if Items.SETTLE.get(t, false):
		var drop := _support_drop(item, ignore, true)
		if is_nan(drop) or absf(drop) > 0.5:
			return "Свече нужна опора: полка, балка или пол"
	return ""


## Опора под деталью: вертикальные лучи из низа детали. Сдвиг вниз до опоры (−16…+40 px) или NAN — опоры нет.
## only_static — опора только неподвижная (свеча на кубике уехала бы вместе с ним).
func _support_drop(item: Dictionary, ignore: int, only_static: bool) -> float:
	var poly := Items.footprint(item)
	if poly.is_empty():
		return NAN
	var bottom := -INF
	var x0 := INF
	var x1 := -INF
	for q in poly:
		bottom = maxf(bottom, q.y)
		x0 = minf(x0, q.x)
		x1 = maxf(x1, q.x)
	var best := INF
	for s in runner.level.nodes_in("solid"):
		if (s as Node).has_meta("layout_index") and int(s.get_meta("layout_index")) == ignore:
			continue
		if s is Yarn or s is Cat:
			continue
		if only_static and (s.is_in_group("dynamic") or (s is Beam and (s as Beam).has_nail())):
			continue
		for sp in s.solid_polys():
			for x in [x0 + 3.0, (x0 + x1) * 0.5, x1 - 3.0]:
				var y := _surface_y(sp, x, bottom - SETTLE_UP, bottom + SETTLE_DOWN)
				if y < best:
					best = y
	return NAN if best == INF else best - bottom


## Самая верхняя точка контура poly на вертикали x в пределах [y0, y1] (INF — нет).
static func _surface_y(poly: PackedVector2Array, x: float, y0: float, y1: float) -> float:
	var best := INF
	for i in poly.size():
		var p := poly[i]
		var q := poly[(i + 1) % poly.size()]
		var y := INF
		if absf(q.x - p.x) < 0.001:
			if absf(p.x - x) < 0.5:
				y = minf(p.y, q.y)
		elif (p.x - x) * (q.x - x) <= 0.0:
			y = p.y + (x - p.x) / (q.x - p.x) * (q.y - p.y)
		if y >= y0 and y <= y1 and y < best:
			best = y
	return best


## Деталь, которая встаёт на опору (домино, свеча), опускаем на неё.
func _settle(it: Dictionary, ignore: int) -> Dictionary:
	var t := String(it.get("type", ""))
	if not Items.SETTLE.has(t):
		return it
	var d := _support_drop(it, ignore, bool(Items.SETTLE[t]))
	if not is_nan(d):
		it["pos"] = (it["pos"] as Vector2) + Vector2(0, d)
	return it


## Куда вбить гвоздь: ближайшая точка-клетка своей балки без гвоздя.
func _nail_target(p: Vector2) -> Dictionary:
	var best := {"type": "nail", "pos": p, "idx": -1, "cell": -1}
	var bd := 26.0
	for i in runner.layout.size():
		var it := _item(i)
		if String(it["type"]) != "beam" or int(it.get("nail", -1)) >= 0:
			continue
		var a: Vector2 = it["a"]
		for k in int(it["cells"]) + 1:
			var q := a + Phys.dir(int(it["step"])) * Phys.CELL * k
			if q.distance_to(p) < bd:
				bd = q.distance_to(p)
				best = {"type": "nail", "pos": q, "idx": i, "cell": k}
	return best


func _why_any(g: Dictionary, ignore: int) -> String:
	if String(g.get("type", "")) == "nail":
		if int(g["idx"]) < 0:
			return "Гвоздь вбивают в точку-клетку своей балки"
		var nb := _item(int(g["idx"])).duplicate(true)
		nb["nail"] = int(g["cell"])
		var w := why(nb, int(g["idx"]))
		return "" if w == "" else "С гвоздём балке не повернуться: " + w.trim_prefix("Нельзя: ")
	return why(g, ignore)


func _carry_item(kind: String, p: Vector2) -> Dictionary:
	if kind == "nail":
		return _nail_target(p)
	if Items.KINDS.has(kind):
		return _settle(Items.new_item(kind, p), -1)
	return {}


# ── действия ───────────────────────────────────────────────────────

func _add(g: Dictionary) -> void:
	Sfx.play("nail" if String(g["type"]) == "nail" else "place")
	if String(g["type"]) == "nail":
		_item(int(g["idx"]))["nail"] = int(g["cell"])
		selected = int(g["idx"])
	else:
		runner.layout.append(g)
		selected = runner.layout.size() - 1
	_commit()


func _commit() -> void:
	if runner.layout != _committed_layout:
		_undo.append(_committed_layout.duplicate(true))
		if _undo.size() > MAX_UNDO:
			_undo.pop_front()
		_committed_layout = runner.layout.duplicate(true)
	runner.back_to_build()
	changed.emit()
	queue_redraw()


## Отмена последнего изменения — включая «Сброс», но не злость или результат пуска.
func can_undo() -> bool:
	return not _undo.is_empty()


func undo() -> void:
	if not enabled or _undo.is_empty():
		return
	runner.layout = (_undo.pop_back() as Array).duplicate(true)
	_committed_layout = runner.layout.duplicate(true)
	selected = -1
	armed = ""
	_reset()
	clear_help()
	runner.back_to_build()
	Sfx.play("remove")
	changed.emit()
	queue_redraw()


## Внешняя замена расстановки (отладочное решение) тоже становится обратимой.
func commit_external() -> void:
	_commit()


func remove_selected() -> void:
	if selected < 0:
		return
	runner.layout.remove_at(selected)
	selected = -1
	Sfx.play("remove")
	_commit()


## Клин — отразить, фен — повернуть на 45° (кнопка у детали или клавиша F).
func flip_selected() -> void:
	var t := _type(selected)
	if not Items.TURN.has(t):
		return
	var g := _item(selected).duplicate(true)
	if t == "wedge":
		g["flip"] = not bool(g.get("flip", false))
	else:
		g["dir"] = posmod(int(g.get("dir", 0)) + 1, 8)
	var w := why(g, selected)
	if w != "":
		message.emit(w)
		return
	runner.layout[selected] = g
	Sfx.play("place")
	_commit()


func clear_all() -> void:
	runner.layout.clear()
	if runner != null:
		runner.trail.clear()
	selected = -1
	armed = ""
	_reset()
	_commit()


func deselect() -> void:
	selected = -1
	armed = ""
	_reset()
	_apply_selection()
	queue_redraw()


## Нажатие на слот инвентаря (из интерфейса).
func begin_carry(kind: String, at: Vector2) -> void:
	if not enabled:
		return
	if kind == "beam":
		armed = ""
		hand_changed.emit("")
		hint.emit("Проведи пальцем от точки к точке — получится балка")
		return
	if left(kind) <= 0:
		message.emit("%s кончились" % Items.PLURAL.get(kind, "Детали"))
		return
	selected = -1
	_apply_selection()
	mode = Mode.CARRY
	carry = kind
	_press = at
	_pointer = at
	_dragging = false
	ghost = {}
	hand_changed.emit(kind)
	queue_redraw()


func _apply_selection() -> void:
	if runner == null or runner.level == null:
		return
	for n in runner.level.parts.get_children():
		if n.has_meta("layout_index"):
			n.set("selected", enabled and int(n.get_meta("layout_index")) == selected)


func _hide_selected(on: bool) -> void:
	var n := runner.part_node(selected)
	if n != null:
		n.visible = not on


func _select(i: int) -> void:
	selected = i
	_apply_selection()
	queue_redraw()


func _part_at(p: Vector2) -> int:
	for i in range(runner.layout.size() - 1, -1, -1):
		var n := runner.part_node(i)
		if n != null and n.call("hit_test", p):
			return i
	return -1


## Кнопки у выделенной детали: «×» убрать, «↔» отразить клин, «⟳» повернуть фен.
func buttons() -> Array:
	if not enabled or selected < 0 or mode != Mode.IDLE or selected >= runner.layout.size():
		return []
	var it := _item(selected)
	var out := []
	var t := String(it["type"])
	if t == "beam":
		var a: Vector2 = it["a"]
		var b := _end(it)
		var n := (b - a).normalized().orthogonal()
		if n.y > 0.0:
			n = -n
		out.append({"id": "remove", "pos": (a + b) * 0.5 + n * 44.0})
	else:
		var box := _bbox(Items.footprint(it))
		out.append({"id": "remove", "pos": Vector2(box.end.x + 18.0, box.position.y - 18.0)})
		if Items.TURN.has(t):
			out.append({"id": String(Items.TURN[t]), "pos": Vector2(box.end.x - 40.0, box.position.y - 18.0)})
	for b in out:
		var q: Vector2 = b["pos"]
		b["pos"] = Vector2(clampf(q.x, 30, Phys.VIEW.x - 30), clampf(q.y, 110, BAR_TOP - 30))
	return out


static func _bbox(poly: PackedVector2Array) -> Rect2:
	if poly.is_empty():
		return Rect2()
	var r := Rect2(poly[0], Vector2.ZERO)
	for q in poly:
		r = r.expand(q)
	return r


# ── ввод ───────────────────────────────────────────────────────────

func _local(e: InputEvent) -> Vector2:
	return (make_input_local(e) as InputEventMouse).position


func _unhandled_input(e: InputEvent) -> void:
	if not enabled or runner == null or runner.level == null:
		return
	if e is InputEventMouseButton and e.pressed:
		if e.button_index == MOUSE_BUTTON_LEFT:
			_on_press(_local(e))
			get_viewport().set_input_as_handled()
		elif e.button_index == MOUSE_BUTTON_RIGHT:
			deselect()


func _input(e: InputEvent) -> void:
	if not enabled or mode == Mode.IDLE:
		return
	if e is InputEventMouseMotion:
		_on_move(_local(e))
	elif e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT and not e.pressed:
		# Отпускание не «съедаем»: если палец пришёл со слота инвентаря, интерфейс должен
		# увидеть отпускание, иначе слот так и останется «нажатым» и перехватит следующее касание.
		_on_release(_local(e))


func _on_press(p: Vector2) -> void:
	_press = p
	_pointer = p
	_dragging = false
	_warned = false
	for b in buttons():
		if p.distance_to(b["pos"]) <= BTN_R + 6.0:
			if b["id"] == "remove":
				remove_selected()
			else:
				flip_selected()
			return
	if armed != "":
		var g := _carry_item(armed, p)
		var w := _why_any(g, -1)
		if w == "":
			armed = ""
			hand_changed.emit("")
			_add(g)
		else:
			# Ошибка уже показана в toast: не накладываем вторую подпись призрака на неё.
			_suppress_ghost_label_until = Time.get_ticks_msec() + 2600
			message.emit(w)
		return
	if _type(selected) == "beam":
		var it := _item(selected)
		if p.distance_to(_end(it)) <= HANDLE_R:
			_begin_edit(Mode.END_DRAG, 1)
			return
		if p.distance_to(it["a"]) <= HANDLE_R:
			_begin_edit(Mode.END_DRAG, 0)
			return
	var idx := _part_at(p)
	if idx >= 0:
		var it2 := _item(idx)
		if String(it2["type"]) == "beam" and int(it2.get("nail", -1)) >= 0 and p.distance_to(_nail_pos(it2)) <= 16.0:
			it2["nail"] = -1
			selected = idx
			_commit()
			message.emit("Гвоздь вынут")
			return
		_select(idx)
		_begin_edit(Mode.MOVE, 0)
		return
	if runner.level.cat != null and runner.level.cat.hit_test(p):
		_select(-1)
		pet_cat.emit()
		return
	_select(-1)
	if not Phys.BUILD_RECT.grow(24.0).has_point(p):
		return
	mode = Mode.DRAW
	_orig = {"a": Phys.grid_point(p)}
	ghost = {}


func _begin_edit(m: Mode, which: int) -> void:
	mode = m
	_which = which
	_orig = _item(selected).duplicate(true)
	ghost = {}


func _on_move(p: Vector2) -> void:
	_pointer = p
	if not _dragging and p.distance_to(_press) > DRAG_START:
		_dragging = true
		if mode == Mode.MOVE or mode == Mode.END_DRAG:
			_hide_selected(true)
	if not _dragging:
		return
	match mode:
		Mode.DRAW:
			if left("beam") <= 0:
				if not _warned:
					_warned = true
					message.emit("Балки кончились" if runner.level.beams > 0 else "В этом уровне балок нет")
				ghost = {}
			else:
				ghost = _beam_toward(_orig["a"], p)
		Mode.END_DRAG:
			if _which == 1:
				ghost = _beam_toward(_orig["a"], p)
			else:
				ghost = _beam_toward(Phys.grid_point(p), _end(_orig))
			if not ghost.is_empty():
				ghost["nail"] = _keep_nail(_orig, ghost)
		Mode.MOVE:
			ghost = _orig.duplicate(true)
			if String(_orig["type"]) == "beam":
				ghost["a"] = Phys.grid_point((_orig["a"] as Vector2) + (p - _press))
			else:
				ghost["pos"] = Phys.snap16((_orig["pos"] as Vector2) + (p - _press))
				ghost = _settle(ghost, selected)
		Mode.CARRY:
			ghost = {} if p.y >= BAR_TOP else _carry_item(carry, p)
	ghost_why = "" if ghost.is_empty() else _why_any(ghost, selected if mode != Mode.CARRY else -1)
	queue_redraw()


func _on_release(p: Vector2) -> void:
	var was := mode
	mode = Mode.IDLE
	match was:
		Mode.DRAW:
			if not ghost.is_empty():
				if ghost_why == "":
					_add(ghost)
				else:
					message.emit(ghost_why)
		Mode.END_DRAG, Mode.MOVE:
			_hide_selected(false)
			if _dragging and not ghost.is_empty() and ghost != _orig:
				if ghost_why == "":
					if was == Mode.END_DRAG and int(_orig.get("nail", -1)) >= 0 and int(ghost.get("nail", -1)) < 0:
						message.emit("Гвоздь вынут")
					runner.layout[selected] = ghost
					Sfx.play("place", -4.0)
					_commit()
				else:
					message.emit(ghost_why)
		Mode.CARRY:
			if p.y >= BAR_TOP or ghost.is_empty():
				if not _dragging or p.distance_to(_press) < 40.0:
					armed = carry
					hint.emit(String(Items.HINT.get(carry, "")))
			elif ghost_why == "":
				_add(ghost)
			else:
				message.emit(ghost_why)
			carry = ""
			hand_changed.emit(armed)
	ghost = {}
	ghost_why = ""
	_apply_selection()
	queue_redraw()


# ── рисование ──────────────────────────────────────────────────────

func _process(_d: float) -> void:
	if enabled and (mode != Mode.IDLE or armed != ""):
		queue_redraw()


func _draw() -> void:
	if not enabled or runner == null or runner.level == null:
		return
	var dot := Pal.alpha(Pal.PAPER, 0.22)
	var r := Phys.BUILD_RECT
	for gx in range(0, int(r.end.x) + 1, int(Phys.CELL)):
		for gy in range(int(ceil(r.position.y / Phys.CELL) * Phys.CELL), int(r.end.y) + 1, int(Phys.CELL)):
			draw_circle(Vector2(gx, gy), 2.2, dot)
	# След траектории клубка из прошлого пуска
	if runner != null and runner.trail.size() >= 2:
		_draw_trail(runner.trail)
	# Подсветка зоны действия розеток при работе с феном
	if _is_fan_active():
		_draw_outlets_reach()
	if mode == Mode.DRAW and ghost.is_empty() and _dragging:
		draw_circle(_orig["a"], 7.0, Pal.alpha(Pal.PAPER, 0.9))
	if armed != "" and mode == Mode.IDLE:
		_draw_ghost(_carry_item(armed, get_local_mouse_position()), _why_any(_carry_item(armed, get_local_mouse_position()), -1), 0.6)
	if selected >= 0 and selected < runner.layout.size() and mode == Mode.IDLE:
		var it := _item(selected)
		if String(it["type"]) == "beam":
			for q in [it["a"], _end(it)]:
				draw_circle(q, 12.0, Pal.alpha(Pal.WARM, 0.35))
				draw_circle(q, 8.0, Pal.PAPER)
				draw_arc(q, 8.0, 0, TAU, 18, Pal.INK, 2.0, true)
		for b in buttons():
			_draw_button(b["pos"], String(b["id"]))
	if not help_ghost.is_empty():
		_draw_ghost(help_ghost, "", 0.7)
	if not ghost.is_empty():
		_draw_ghost(ghost, ghost_why, 1.0)


func _draw_ghost(g: Dictionary, w: String, strength: float) -> void:
	var ok := w == ""
	# «Нельзя» — серый призрак с терракотовым пунктиром: «Тревога» только у шкалы злости на 4 (стайлгайд, правило 3).
	var fill := Pal.alpha(Pal.WARM if ok else Pal.DUSK, (0.28 if ok else 0.45) * strength)
	var line := Pal.alpha(Pal.PAPER if ok else Pal.TERRACOTTA, 0.95 * strength)
	match String(g.get("type", "")):
		"beam":
			var a: Vector2 = g["a"]
			var b := _end(g)
			var poly := Phys.capsule_poly(a, b, 6.0)
			draw_colored_polygon(poly, fill)
			_dashed(poly, line)
			var deg := Phys.slope_deg(int(g["step"]))
			var d := (b - a).normalized()
			if deg != 0 and deg != 90:
				var hz := Vector2(1.0 if d.x >= 0.0 else -1.0, 0.0)
				draw_dashed_line(a, a + hz * 84.0, Pal.alpha(Pal.PAPER, 0.6), 1.5, 5.0)
				var a0 := hz.angle()
				var span := hz.angle_to(d)
				draw_arc(a, 52.0, a0, a0 + span, 18, Pal.alpha(Pal.PAPER, 0.85), 2.0, true)
				var lp := a + Vector2.from_angle(a0 + span * 0.5) * 72.0
				if absi(deg) < 30:
					# узкий угол: подпись по другую сторону горизонтали, чтобы не лезла на балку
					lp = a + hz * 66.0 + Vector2(0.0, -16.0 if d.y > 0.0 else 22.0)
				draw_string(Fonts.SERIF_BOLD, lp + Vector2(-16, 7), "%d°" % deg, HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Pal.PAPER)
			draw_circle(a, 6.0, Pal.PAPER)
			draw_arc(b, 20.0, 0, TAU, 28, Pal.alpha(Pal.PAPER, 0.9), 3.0, true)
			var n := d.orthogonal()
			if n.y > 0.0:
				n = -n
			var label := "%d° · %s" % [deg, Phys.cells_word(int(g["cells"]))] if ok else w
			_tag((a + b) * 0.5 + n * 52.0, label, ok)
			if int(g.get("nail", -1)) >= 0:
				draw_circle(_nail_pos(g), 7.0, Pal.alpha(Pal.STEEL, 0.8))
		"nail":
			var pos: Vector2 = g["pos"]
			draw_circle(pos, 9.0, fill)
			draw_arc(pos, 9.0, 0, TAU, 20, line, 2.0, true)
			if not ok:
				_tag(pos + Vector2(0, -40), w, false)
		_:
			var poly := Items.footprint(g)
			if poly.size() < 3:
				return
			var t := String(g["type"])
			# что деталь делает — видно ещё до пуска: струя фена, жар свечи
			if t == "fan":
				_dashed(Fan.xform(g) * Fan.zone_local(), Pal.alpha(Pal.PAPER, 0.5 * strength))
				var end := Fan.cord_end_at(g)
				var socket := runner.level.nearest_outlet(end)
				if socket != Vector2.INF:
					draw_dashed_line(end, socket, line, 3.0, 7.0)
					draw_arc(socket, Fan.CORD_LENGTH, 0.0, TAU, 100, Pal.alpha(Pal.PAPER if ok else Pal.TERRACOTTA, 0.25), 2.0, true)
			elif t == "candle":
				var heat := Candle.heat_poly_at(g["pos"])
				draw_colored_polygon(heat, Pal.alpha(Pal.WARM, 0.16 * strength))
				_dashed(heat, Pal.alpha(Pal.WARM, 0.7 * strength))
			draw_colored_polygon(poly, fill)
			_dashed(poly, line)
			if not ok and Time.get_ticks_msec() >= _suppress_ghost_label_until:
				var box := _bbox(poly)
				_tag(Vector2(box.get_center().x, box.position.y - 30.0), w, false)


func _dashed(poly: PackedVector2Array, c: Color) -> void:
	for i in poly.size():
		draw_dashed_line(poly[i], poly[(i + 1) % poly.size()], c, 2.0, 7.0)


func _tag(at: Vector2, text: String, ok: bool) -> void:
	var f := Fonts.SERIF_BOLD
	var fs := 18
	var w := f.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x + 24.0
	var r := Rect2(at - Vector2(w * 0.5, 18), Vector2(w, 36))
	r.position.x = clampf(r.position.x, 8, Phys.VIEW.x - r.size.x - 8)
	r.position.y = clampf(r.position.y, 84, BAR_TOP - 44)
	Ink.paper(self, r, 1, Pal.PAPER, Pal.INK if ok else Pal.TERRACOTTA, 2.0, 8.0)
	draw_string(f, r.position + Vector2(12, 25), text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Pal.INK if ok else Pal.TERRACOTTA)


func _draw_button(c: Vector2, id: String) -> void:
	draw_circle(c + Vector2(1, 3), BTN_R, Pal.alpha(Pal.INK, 0.3))
	draw_circle(c, BTN_R, Pal.PAPER)
	Ink.closed_line(self, Ink.wobble(Phys.circle_poly(c, BTN_R, 22), 0.7, 8.0, 2), Pal.INK, 2.0)
	if id == "remove":
		draw_line(c + Vector2(-8, -8), c + Vector2(8, 8), Pal.INK, 3.0, true)
		draw_line(c + Vector2(8, -8), c + Vector2(-8, 8), Pal.INK, 3.0, true)
	elif id == "turn":
		# круговая стрелка по часовой
		var a1 := PI * 1.25
		draw_arc(c, 10.0, -PI * 0.25, a1, 20, Pal.INK, 2.5, true)
		var tip := c + Vector2.from_angle(a1) * 10.0
		var tg := Vector2(-sin(a1), cos(a1))
		var nr := Vector2.from_angle(a1)
		draw_line(tip, tip - tg * 7.0 + nr * 5.0, Pal.INK, 2.5, true)
		draw_line(tip, tip - tg * 7.0 - nr * 5.0, Pal.INK, 2.5, true)
	else:
		draw_line(c + Vector2(-11, 0), c + Vector2(11, 0), Pal.INK, 2.5, true)
		for s in [-1.0, 1.0]:
			draw_line(c + Vector2(11 * s, 0), c + Vector2(5 * s, -6), Pal.INK, 2.5, true)
			draw_line(c + Vector2(11 * s, 0), c + Vector2(5 * s, 6), Pal.INK, 2.5, true)


func _is_fan_active() -> bool:
	if armed == "fan":
		return true
	if mode == Mode.CARRY and carry == "fan":
		return true
	if selected >= 0 and selected < runner.layout.size() and _type(selected) == "fan":
		return true
	return false


## Подсветка зоны питания от всех розеток при установке или выделении фена.
func _draw_outlets_reach() -> void:
	if runner == null or runner.level == null:
		return
	var outlets := runner.level.nodes_in("outlet")
	if outlets.is_empty():
		return
	for node in outlets:
		var p: Vector2 = (node as Node2D).global_position
		draw_circle(p, Fan.CORD_LENGTH, Pal.alpha(Pal.WARM, 0.08))
		draw_arc(p, Fan.CORD_LENGTH, 0.0, TAU, 72, Pal.alpha(Pal.WARM, 0.4), 2.0, true)
		draw_circle(p, 14.0, Pal.alpha(Pal.WARM, 0.35))
		draw_arc(p, 10.0, 0.0, TAU, 20, Pal.PAPER, 1.8, true)


## Отрисовка траектории клубка из предыдущей попытки.
func _draw_trail(pts: PackedVector2Array) -> void:
	var trail_color := Pal.alpha(Pal.WARM, 0.38)
	var step := 2
	for i in range(0, pts.size() - step, step):
		draw_line(pts[i], pts[i + step], trail_color, 2.0, true)
	var last_pt := pts[pts.size() - 1]
	draw_circle(last_pt, 5.0, Pal.alpha(Pal.TERRACOTTA, 0.65))
	draw_arc(last_pt, 8.0, 0.0, TAU, 16, Pal.alpha(Pal.PAPER, 0.75), 1.5, true)


## Показать один следующий шаг образцового решения на несколько секунд, не меняя расстановку.
func show_help() -> void:
	clear_help()
	for wanted in runner.level.solution:
		var found := false
		for actual in runner.layout:
			if String(wanted["type"]) != String(actual.get("type", "")):
				continue
			var t := String(wanted["type"])
			if t == "beam":
				if (wanted["a"] as Vector2).distance_to(actual["a"]) > 1.0 or int(wanted["step"]) != int(actual["step"]) or int(wanted["cells"]) != int(actual["cells"]):
					continue
				if int(wanted.get("nail", -1)) >= 0 and int(actual.get("nail", -1)) != int(wanted["nail"]):
					help_ghost = {"type": "nail", "pos": _nail_pos(wanted)}
					hint.emit("Один из вариантов: вбей гвоздь в отмеченную точку")
					_show_help_for_a_while()
					return
			else:
				if (wanted["pos"] as Vector2).distance_to(actual["pos"]) > 8.0 or int(wanted.get("dir", 0)) != int(actual.get("dir", 0)) or bool(wanted.get("flip", false)) != bool(actual.get("flip", false)):
					continue
			found = true
			break
		if not found:
			help_ghost = wanted.duplicate(true)
			hint.emit("Один из вариантов: измени или поставь деталь по контуру")
			_show_help_for_a_while()
			return
	hint.emit("Все детали примера на месте. Нажми «Пуск»")


func clear_help() -> void:
	_help_serial += 1
	help_ghost = {}
	queue_redraw()


func _show_help_for_a_while() -> void:
	queue_redraw()
	var serial := _help_serial
	get_tree().create_timer(5.0).timeout.connect(func() -> void:
		if serial == _help_serial:
			clear_help())
