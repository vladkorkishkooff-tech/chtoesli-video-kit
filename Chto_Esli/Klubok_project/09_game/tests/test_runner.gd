extends Node
## Автотест уровней: решение выигрывает 10 из 10 одинаково, при любой позе Кота;
## пустая расстановка проигрывает. Запуск (из папки 09_game):
##   godot --headless --fixed-fps 60 res://tests/test_runner.tscn

const RUNS := 10

var runner: LevelRunner
var builder: Builder
var failures := 0
var _errs: Array = []


func _ready() -> void:
	runner = LevelRunner.new()
	add_child(runner)
	builder = Builder.new()
	add_child(builder)
	builder.setup(runner)
	runner.run_error.connect(func(reason: String, _w: Vector2) -> void: _errs.append(reason))
	await get_tree().process_frame
	var t0 := Time.get_ticks_msec()
	for i in Levels.count():
		await _test_level(i)
	print("ИТОГ: %s, ошибок проверки: %d (%.1f с)" % ["OK" if failures == 0 else "ПРОВАЛ", failures, (Time.get_ticks_msec() - t0) / 1000.0])
	get_tree().quit(1 if failures > 0 else 0)


func _run(scene: PackedScene, layout: Array, anger: float) -> Dictionary:
	CatMood.start_level()
	CatMood.anger = anger
	_errs.clear()
	runner.layout = layout.duplicate(true)
	runner.load_level(scene, true)
	runner.start_run()
	var r: Dictionary = await runner.run_finished
	r["errors"] = _errs.duplicate()
	return r


func _test_level(i: int) -> void:
	var scene := Levels.scene(i)
	var probe := scene.instantiate() as Level
	var sol: Array = probe.solution
	var anti: Array = probe.must_fail
	var title := "%d «%s»" % [probe.number, probe.level_title]
	probe.free()
	var empty := await _run(scene, [], 0.0)
	_check(not empty["win"], "%s: без деталей — %s (кадр %d)" % [title, empty["reason"], empty["frame"]])
	for j in anti.size():
		var bad := await _run(scene, anti[j], 0.0)
		_check(not bad["win"], "%s: неполное решение %d — %s" % [title, j + 1, bad["reason"]])
	if sol.is_empty():
		print("  %s: решения нет — только пустой пуск" % title)
		return
	# Проверяем не только физику: образец действительно можно собрать игроку.
	CatMood.start_level()
	runner.layout = sol.duplicate(true)
	runner.load_level(scene, true)
	var legal := true
	var problem := ""
	for j in sol.size():
		var why := builder.why(sol[j], j)
		if why != "":
			legal = false
			problem = "%d: %s" % [j, why]
			break
	for kind in runner.inventory_left():
		if int(runner.inventory_left()[kind]) < 0:
			legal = false
			problem = "не хватает: %s" % kind
	_check(legal, "%s: решение допустимо в конструкторе %s" % [title, problem])
	var first: Dictionary = {}
	var same := 0
	var wins := 0
	for k in RUNS:
		var r := await _run(scene, sol, 0.0)
		if r["win"]:
			wins += 1
		if k == 0:
			first = r
		if OS.get_cmdline_user_args().has("-v"):
			print("    run %d: %d %s %.4f" % [k, r["frame"], str(r["yarn"]), r["used"]])
		if r["frame"] == first["frame"] and r["yarn"] == first["yarn"] and r["used"] == first["used"]:
			same += 1
	_check(wins == RUNS and same == RUNS, "%s: решение — побед %d/%d, одинаковых %d/%d, кадр %d, ошибки %s" % [title, wins, RUNS, same, RUNS, first["frame"], str(first["errors"])])
	for anger in [1.0, 2.0, 3.0]:
		var r := await _run(scene, sol, anger)
		_check(r["win"], "%s: поза Кота %d — %s, кадр %d" % [title, int(anger), r["reason"], r["frame"]])


func _check(ok: bool, text: String) -> void:
	if not ok:
		failures += 1
	print(("  ok    " if ok else "  FAIL  ") + text)
