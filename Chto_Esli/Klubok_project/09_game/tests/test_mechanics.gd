extends Node
## Изолированные проверки взаимодействий новых деталей, без подмены физики уровня.
## godot --headless --path . --fixed-fps 60 res://tests/test_mechanics.tscn

var failures := 0
var runner: LevelRunner
var errors: Array[String] = []
var notes: Array[String] = []


func _ready() -> void:
	runner = LevelRunner.new()
	add_child(runner)
	runner.run_error.connect(func(reason: String, _where: Vector2) -> void: errors.append(reason))
	runner.note.connect(func(kind: String, _text: String, _where: Vector2) -> void: notes.append(kind))
	await get_tree().process_frame
	var scene := Levels.scene(8)
	var candle := {"type": "candle", "pos": Vector2(480, 216)}
	var fan := {"type": "fan", "pos": Vector2(380, 180), "dir": 0}
	CatMood.start_level()
	runner.layout = [candle]
	runner.load_level(scene, true)
	var h: Hanger = runner.level.nodes_in("hanger")[0]
	var c: Candle = runner.level.nodes_in("candle")[0]
	_check(c.heats(h.thread_a(), h.thread_b()), "пламя касается нитки")
	for i in Candle.BURN_FRAMES - 1:
		runner.call("_systems")
	_check(not h.burnt, "нитка не перегорает раньше положенного")
	runner.call("_systems")
	_check(h.burnt and notes.has("burn"), "через 24 кадра нитка перегорает")

	notes.clear()
	runner.layout = [candle, fan]
	runner.load_level(scene, true)
	h = runner.level.nodes_in("hanger")[0]
	c = runner.level.nodes_in("candle")[0]
	var f: Fan = runner.level.nodes_in("fan")[0]
	f.activate()
	_check(not f.on and f.force_at(c.flame_point()) == Vector2.ZERO, "без розетки фен не работает, даже в старой расстановке")
	var socket := PowerOutlet.new()
	socket.position = Vector2(360, 150)
	runner.level.add_child(socket)
	runner.call("_update_power")
	f.activate()
	_check(f.connected() and f.on, "фен подключается к ближайшей розетке")
	var force := f.force_at(c.flame_point())
	_check(force.x > 0.0 and absf(force.y) < 0.01, "фен создаёт направленный поток")
	var obstacle := Node.new()
	var walls := [[obstacle, Phys.rect_poly(Rect2(430, 150, 15, 60))]]
	_check(runner.call("_wind", f, c.flame_point(), c, walls) == Vector2.ZERO, "стенка перекрывает поток")
	obstacle.free()
	for i in Candle.WIND_FRAMES:
		runner.call("_systems")
	_check(not c.lit and not h.burnt and notes.has("blow"), "фен гасит свечу раньше, чем сгорит нитка")
	for i in Candle.BURN_FRAMES:
		runner.call("_systems")
	_check(not h.burnt, "погасшая свеча не пережигает нитку")

	# Граница провода измеряется от повернутого выхода провода по прямой.
	var plug := f.to_global(Fan.CORD_END)
	f.outlet = plug + Vector2(Fan.CORD_LENGTH, 0)
	_check(f.connected(), "провод достаёт ровно на 6 клеток")
	f.outlet = plug + Vector2(Fan.CORD_LENGTH + 1, 0)
	f.activate()
	_check(not f.connected() and not f.on and f.force_at(c.flame_point()) == Vector2.ZERO, "на 1 пиксель дальше провод не достаёт и ветер выключен")
	var turned := {"type": "fan", "pos": Vector2(400, 300), "dir": 2}
	_check(Fan.cord_end_at(turned).distance_to(Vector2(362, 286)) < 0.01, "выход провода поворачивается вместе с феном")
	var builder := Builder.new()
	add_child(builder)
	builder.setup(runner)
	runner.layout = []
	runner.load_level(Levels.scene(9), true)
	var near: Dictionary = runner.level.solution[0]
	var far := {"type": "fan", "pos": Vector2(850, 180), "dir": 0}
	_check(builder.why(near, -1) == "", "правильный фен уровня 10 можно поставить")
	_check(builder.why(far, -1) == "Провод не дотянется до розетки", "конструктор не ставит фен слишком далеко")
	runner.layout = [far]
	runner.rebuild()
	var old_fan: Fan = runner.level.nodes_in("fan")[0]
	old_fan.activate()
	_check(not old_fan.on and old_fan.force_at(old_fan.nozzle() + Vector2(40, 0)) == Vector2.ZERO, "старый сохранённый фен за пределом провода не дует")
	builder.queue_free()

	# Имитируем измеренную резкую потерю скорости тяжёлого тела у Кота.
	# Это тест правил слышимости, не утверждение о конкретной траектории падения.
	var cube := {"type": "cube", "pos": Vector2(900, 504)}
	var pillow := {"type": "pillow", "pos": Vector2(900, 556)}
	for soft in [false, true]:
		errors.clear()
		runner.layout = [cube, pillow] if soft else [cube]
		runner.load_level(scene, true)
		var body: Cube = runner.level.nodes_in("cube")[0]
		body.freeze = false
		body.linear_velocity = Vector2.ZERO
		runner.set("_prev_speed", {body.get_instance_id(): 600.0})
		runner.set("_loud_cooldown", {})
		runner.call("_check_errors")
		var heard := errors.has("Громкий удар рядом с Котом")
		_check(heard != soft, "тяжёлый удар %s" % ("приглушён подушкой" if soft else "слышен Коту"))

	print("ИТОГ: %s, ошибок проверки: %d" % ["OK" if failures == 0 else "ПРОВАЛ", failures])
	get_tree().quit(1 if failures > 0 else 0)


func _check(ok: bool, text: String) -> void:
	if not ok:
		failures += 1
	print(("  ok    " if ok else "  FAIL  ") + text)
