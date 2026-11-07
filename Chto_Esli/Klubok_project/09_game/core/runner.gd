class_name LevelRunner
extends Node2D
## Запуск уровня. Каждый пуск — с чистого листа: уровень создаётся заново из расстановки
## (06_manuals/02_physics_setup.md), поэтому одинаковая расстановка даёт одинаковый результат.

signal run_finished(result: Dictionary)
signal run_error(reason: String, where: Vector2)
signal rebuilt
signal run_started
## Удар для звука: kind — yarn, cube, gift, mandarin, domino, boing (батут), puff (подушка); strength 0–1.
## Только чтение скоростей — на физику не влияет.
signal impact(kind: String, strength: float, where: Vector2)
## Событие пуска для подсказки и звука: kind — burn («Нитка перегорела») или blow («Фен задул свечу»).
signal note(kind: String, text: String, where: Vector2)

const STILL_V := 5.0          ## px/с — «стоит»
const STILL_W := 0.25         ## рад/с
const STUCK_FRAMES := 75      ## клубок стоит 1,25 с и всё вокруг замерло — застрял
const STUCK_ALONE := 300      ## клубок стоит 5 с, даже если что-то ещё качается
const IMPACT := 380.0         ## резкая потеря скорости тяжёлого (кубик, подарок), px/с — «громкий удар»
const HIT_CAT := {
	"cube": "Кубик попал в Кота", "gift": "Подарок попал в Кота",
	"mandarin": "Мандарин попал в Кота", "domino": "Домино попало в Кота",
}

var level_scene: PackedScene
var level: Level
## Расстановка игрока: [{"type": "beam", "a": Vector2, "step": int, "cells": int, "nail": int}, …]
var layout: Array = []
var running := false
var finished := false
var frame := 0
var result: Dictionary = {}
## Траектория клубка в последнем пуске (для отрисовки в сборке).
var trail: PackedVector2Array = []

var _pending := false
var _space := RID()
var _yarn_still := 0
var _trace: Array = []
var _world_still := 0
var _prev_speed: Dictionary = {}
var _loud_cooldown: Dictionary = {}
var _hit_cat: Dictionary = {}
var _prev_v: Dictionary = {}
var _impact_cd: Dictionary = {}


func load_level(scene: PackedScene, keep_layout := false) -> void:
	level_scene = scene
	trail.clear()
	if not keep_layout:
		layout = []
	rebuild()


## Собрать уровень заново из сцены и расстановки (сборка: всё заморожено).
func rebuild() -> void:
	running = false
	finished = false
	if level != null:
		remove_child(level)
		level.free()
		level = null
	level = level_scene.instantiate() as Level
	add_child(level)
	if level.cat != null:
		level.cat.set_mood_face(CatMood.face())
	for i in layout.size():
		spawn(layout[i], i)
	_update_hot()
	_update_power()
	_fresh_space()
	rebuilt.emit()


## Своё физическое пространство на каждую сборку. В общем пространстве Godot переиспользует
## внутренние номера тел, и повторные пуски расходятся в последних знаках. В новом — совпадают бит в бит.
func _fresh_space() -> void:
	var old := _space
	_space = PhysicsServer2D.space_create()
	PhysicsServer2D.space_set_active(_space, true)
	PhysicsServer2D.area_set_param(_space, PhysicsServer2D.AREA_PARAM_GRAVITY, ProjectSettings.get_setting("physics/2d/default_gravity", 980.0))
	PhysicsServer2D.area_set_param(_space, PhysicsServer2D.AREA_PARAM_GRAVITY_VECTOR, ProjectSettings.get_setting("physics/2d/default_gravity_vector", Vector2.DOWN))
	PhysicsServer2D.area_set_param(_space, PhysicsServer2D.AREA_PARAM_LINEAR_DAMP, ProjectSettings.get_setting("physics/2d/default_linear_damp", 0.1))
	PhysicsServer2D.area_set_param(_space, PhysicsServer2D.AREA_PARAM_ANGULAR_DAMP, ProjectSettings.get_setting("physics/2d/default_angular_damp", 1.0))
	_adopt(level)
	if old.is_valid():
		PhysicsServer2D.free_rid(old)


## Перенести все тела узла (по порядку дерева) в текущее пространство.
func _adopt(root: Node) -> void:
	for n in root.find_children("*", "CollisionObject2D", true, false):
		var rid := (n as CollisionObject2D).get_rid()
		if PhysicsServer2D.body_get_space(rid) != _space:
			PhysicsServer2D.body_set_space(rid, _space)
	for n in root.get_children(true):
		if n is CollisionObject2D:
			var rid2 := (n as CollisionObject2D).get_rid()
			if PhysicsServer2D.body_get_space(rid2) != _space:
				PhysicsServer2D.body_set_space(rid2, _space)


func _exit_tree() -> void:
	if level != null:
		remove_child(level)
		level.free()
		level = null
	if _space.is_valid():
		PhysicsServer2D.free_rid(_space)
		_space = RID()


func spawn(item: Dictionary, idx: int) -> Node2D:
	var t := String(item.get("type", ""))
	var n: Node2D = null
	if t == "beam":
		var b := Beam.new()
		b.position = item["a"]
		b.angle_step = int(item.get("step", 0))
		b.cells = int(item.get("cells", 1))
		b.nail_cell = int(item.get("nail", -1))
		n = b
	else:
		n = Items.spawn(item)
	if n == null:
		return null
	n.name = "P%d_%s" % [idx, t]
	n.set("player", true)
	n.set_meta("layout_index", idx)
	level.parts.add_child(n)
	return n


## Старые сохранённые расстановки тоже перепроверяются: отключённый фен не дует.
func _update_power() -> void:
	for node in level.nodes_in("fan"):
		var fan := node as Fan
		fan.outlet = level.nearest_outlet(fan.to_global(Fan.CORD_END))
		fan.queue_redraw()


## В сборке: пламя свечи уже касается нитки — нитка светится.
func _update_hot() -> void:
	var candles := level.nodes_in("candle")
	for h in level.nodes_in("hanger"):
		var hg := h as Hanger
		var hot := false
		for c in candles:
			if (c as Candle).heats(hg.thread_a(), hg.thread_b()):
				hot = true
		hg.hot = hot
		hg.queue_redraw()


func part_node(idx: int) -> Node2D:
	if level == null:
		return null
	for n in level.parts.get_children():
		if n.has_meta("layout_index") and int(n.get_meta("layout_index")) == idx:
			return n as Node2D
	return null


## Сколько деталей каждого вида ещё в инвентаре.
func inventory_left() -> Dictionary:
	var inv := level.inventory()
	for it in layout:
		var t := String(it["type"])
		inv[t] = int(inv.get(t, 0)) - 1
		if t == "beam" and int(it.get("nail", -1)) >= 0:
			inv["nail"] = int(inv.get("nail", 0)) - 1
	return inv


func layout_key() -> String:
	return var_to_str(layout)


## Пуск. Сам запуск — в начале следующего кадра физики: так пуск из любого места
## (кнопка, сигнал, тест) начинается одинаково и результат повторяется кадр в кадр.
func start_run() -> void:
	running = false
	finished = false
	_pending = true


## Уровень заново, гвозди вбиты, кубики и клубок отпущены.
func _launch() -> void:
	rebuild()
	level.set_build_view(false)
	CatMood.start_run()
	running = true
	frame = 0
	_yarn_still = 0
	_world_still = 0
	_prev_speed.clear()
	_loud_cooldown.clear()
	_hit_cat.clear()
	_prev_v.clear()
	_impact_cd.clear()
	_trace.clear()
	trail.clear()
	result = {}
	for b in level.nodes_in("beam"):
		(b as Beam).activate()
	for c in level.nodes_in("cube"):
		(c as Cube).activate()
	for it in level.nodes_in("item"):
		(it as Item).activate()
	for h in level.nodes_in("hanger"):
		(h as Hanger).activate()
	level.yarn.launch(level)
	_adopt(level)
	run_started.emit()


## Стоп / после результата — обратно к сборке, детали на местах.
func back_to_build() -> void:
	_pending = false
	rebuild()
	level.set_build_view(true)


func _physics_process(_delta: float) -> void:
	if _pending:
		_pending = false
		_launch()
		return
	if not running or level == null:
		return
	frame += 1
	var y := level.yarn
	level.cat.watch_yarn(y.global_position)
	y.track()
	if frame % 2 == 0:
		trail.append(y.global_position)
	_systems()
	_check_errors()
	if not running:
		return
	_check_impacts()
	if level.cat.reached(y):
		y.freeze = true
		_finish(true, "Кот поймал клубок")
		return
	var p := y.global_position
	if p.y > Phys.VIEW.y + 80.0 or p.x < -80.0 or p.x > Phys.VIEW.x + 80.0:
		_finish(false, "Клубок упал")
		return
	if level.floor_is_fail and frame > 2 and p.y + y.radius >= Phys.FLOOR_Y - 3.0:
		_finish(false, "Клубок упал на пол")
		return
	if y.thread_left() <= 0.0:
		_finish(false, "Кончилась нитка")
		return
	if y.linear_velocity.length() < STILL_V and absf(y.angular_velocity) < STILL_W:
		_yarn_still += 1
	else:
		_yarn_still = 0
	if _world_moving():
		_world_still = 0
	else:
		_world_still += 1
	if frame % 30 == 0:
		_trace.append(p)
	var crawling := _trace.size() >= 9 and p.distance_to(_trace[_trace.size() - 9]) < 8.0
	if (_yarn_still >= STUCK_FRAMES and _world_still >= 30) or _yarn_still >= STUCK_ALONE or crawling:
		_finish(false, "Клубок застрял")
		return
	if frame >= int(level.time_limit * 60.0):
		_finish(false, "Время вышло")


func _world_moving() -> bool:
	for c in level.nodes_in("dynamic"):
		if c.call("is_moving"):
			return true
	for b in level.nodes_in("beam"):
		if (b as Beam).is_moving():
			return true
	return false


# ── фены и свечи ───────────────────────────────────────────────────

## Каждый кадр пуска: фены дуют на всё подвижное и задувают свечи, свечи пережигают нитки.
func _systems() -> void:
	var fans := level.nodes_in("fan")
	var candles := level.nodes_in("candle")
	if not fans.is_empty():
		var walls := _air_walls()
		var bodies: Array = [level.yarn]
		bodies.append_array(level.nodes_in("dynamic"))
		for f in fans:
			for node in bodies:
				var b := node as RigidBody2D
				if b.freeze:
					continue
				var force := _wind(f as Fan, b.global_position, b, walls)
				if force != Vector2.ZERO:
					b.apply_central_force(force)
		for c in candles:
			var cd := c as Candle
			if not cd.lit:
				continue
			var blown := false
			for f in fans:
				if _wind(f as Fan, cd.flame_point(), cd, walls) != Vector2.ZERO:
					blown = true
			cd.wind = cd.wind + 1 if blown else 0
			if cd.wind >= Candle.WIND_FRAMES:
				cd.blow_out()
				note.emit("blow", "Фен задул свечу", cd.flame_point())
	for h in level.nodes_in("hanger"):
		var hg := h as Hanger
		if hg.burnt:
			continue
		var a := hg.thread_a()
		var b2 := hg.thread_b()
		var at := Vector2.INF
		for c in candles:
			if (c as Candle).heats(a, b2):
				at = Geometry2D.get_closest_point_to_segment((c as Candle).flame_point(), a, b2)
				break
		if at != Vector2.INF:
			hg.heat += 1
			if hg.heat >= Candle.BURN_FRAMES:
				hg.burn(at)
				note.emit("burn", "Нитка перегорела", at)
		elif hg.heat > 0 and frame % 2 == 0:
			hg.heat -= 1          # вне пламени нитка остывает вдвое медленнее, чем греется


## Что загораживает струю: неподвижные тела (подвижные струя толкает, а не упирается в них).
func _air_walls() -> Array:
	var out := []
	for s in level.nodes_in("solid"):
		if s.is_in_group("dynamic") or s.is_in_group("yarn"):
			continue
		for sp in s.solid_polys():
			var q := Phys.shrink(sp, 2.0)
			if q.size() >= 3:
				out.append([s, q])
	return out


## Сила струи фена в точке p, если от сопла до неё ничего не загораживает.
func _wind(fan: Fan, p: Vector2, target: Node, walls: Array) -> Vector2:
	var force := fan.force_at(p)
	if force == Vector2.ZERO:
		return force
	var a := fan.nozzle()
	for w in walls:
		if w[0] == fan or w[0] == target:
			continue
		if Phys.segment_inside(a, p, w[1]):
			return Vector2.ZERO
	return force


# ── ошибки и удары ─────────────────────────────────────────────────

static func kind_of(b: Node) -> String:
	if b is Yarn:
		return "yarn"
	if b is Cube:
		return "cube"
	if b is Gift:
		return "gift"
	if b is Item:
		return (b as Item).kind
	return ""


func _on_soft(p: Vector2, soft: Array) -> bool:
	for s in soft:
		if (s as Pillow).soft_rect().has_point(p):
			return true
	return false


## Ошибки (+½): громкий удар тяжёлого в зоне слуха Кота (на подушке — тихо), что-то попало в Кота.
func _check_errors() -> void:
	var cat := level.cat
	var soft := level.nodes_in("soft")
	for node in level.nodes_in("dynamic"):
		var c := node as RigidBody2D
		if c.freeze:
			continue
		var id := c.get_instance_id()
		var sp := c.linear_velocity.length()
		var prev := float(_prev_speed.get(id, 0.0))
		_prev_speed[id] = sp
		var cd := int(_loud_cooldown.get(id, 0))
		if cd > 0:
			_loud_cooldown[id] = cd - 1
		elif c.is_in_group("heavy") and prev - sp > IMPACT and cat.hears(c.global_position) and not _on_soft(c.global_position, soft):
			_loud_cooldown[id] = 30
			run_error.emit("Громкий удар рядом с Котом", c.global_position)
		if not _hit_cat.has(id) and cat.touches(c.call("solid_polys")[0]):
			_hit_cat[id] = true
			run_error.emit(String(HIT_CAT.get(kind_of(c), "Попало в Кота")), c.global_position)


## Тело рядом с верхом батута или подушки (для звука и картинки).
func _landed_on(b: RigidBody2D, list: Array, method: String) -> Node:
	for n in list:
		var r: Rect2 = n.call(method)
		if r.has_point(b.global_position):
			return n
	return null


## Резкая смена скорости (без учёта тяжести) — удар: для звука.
func _check_impacts() -> void:
	var g := Vector2(0, float(ProjectSettings.get_setting("physics/2d/default_gravity", 980.0)) / 60.0)
	var bodies: Array = [level.yarn]
	bodies.append_array(level.nodes_in("dynamic"))
	var bouncy := level.nodes_in("bouncy")
	var soft := level.nodes_in("soft")
	for node in bodies:
		var b := node as RigidBody2D
		var id := b.get_instance_id()
		var v := b.linear_velocity
		var pv: Vector2 = _prev_v.get(id, v)
		_prev_v[id] = v
		var cd := int(_impact_cd.get(id, 0))
		if cd > 0:
			_impact_cd[id] = cd - 1
			continue
		var dv := (v - pv - g).length()
		if dv > 70.0:
			_impact_cd[id] = 6
			var s := clampf((dv - 70.0) / 450.0, 0.0, 1.0)
			var kind := kind_of(b)
			var t := _landed_on(b, bouncy, "top_rect")
			var pl := _landed_on(b, soft, "soft_rect") if t == null else null
			if t != null:
				(t as Trampoline).hit(s)
				kind = "boing"
			elif pl != null:
				(pl as Pillow).hit(s)
				kind = "puff"
			impact.emit(kind, s, b.global_position)


func abort() -> void:
	_pending = false
	running = false


func _finish(win: bool, reason: String) -> void:
	running = false
	finished = true
	var y := level.yarn
	if trail.is_empty() or trail[trail.size() - 1].distance_to(y.global_position) > 2.0:
		trail.append(y.global_position)
	result = {"win": win, "reason": reason, "frame": frame, "yarn": y.global_position, "used": y.used}
	run_finished.emit(result)
