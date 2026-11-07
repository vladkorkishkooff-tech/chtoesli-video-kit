extends Node
## Лаборатория для настройки уровней: один пуск с заданной расстановкой и след клубка.
##   godot --headless --fixed-fps 60 res://tests/lab.tscn -- 1 '[{"type":"beam","a":[256,256],"step":1,"cells":6}]' 10
## Аргументы: номер уровня (1…) или путь к сцене (res://levels/….tscn), расстановка JSON (точки — [x, y]),
## шаг следа в кадрах, злость. Расстановка «sol» — решение из сцены уровня.

var runner: LevelRunner


func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	var a0 := args[0] if args.size() > 0 else "1"
	var scene: PackedScene = load(a0) if a0.ends_with(".tscn") else Levels.scene(int(a0) - 1)
	var layout := [] if args.size() > 1 and args[1] == "sol" else _parse(args[1] if args.size() > 1 else "[]")
	var every := int(args[2]) if args.size() > 2 else 15
	var anger := float(args[3]) if args.size() > 3 else 0.0
	runner = LevelRunner.new()
	add_child(runner)
	runner.run_error.connect(func(reason: String, w: Vector2) -> void: print("  ошибка: %s в %s, кадр %d" % [reason, w, runner.frame]))
	await get_tree().process_frame
	CatMood.start_level()
	CatMood.anger = anger
	runner.layout = layout
	runner.load_level(scene, true)
	if args.size() > 1 and args[1] == "sol":
		runner.layout = runner.level.solution.duplicate(true)
		runner.rebuild()
	runner.note.connect(func(_k: String, t: String, w: Vector2) -> void: print("  событие: %s в (%.0f, %.0f), кадр %d" % [t, w.x, w.y, runner.frame]))
	runner.start_run()
	while not runner.finished:
		await get_tree().physics_frame
		if runner.frame % every == 0:
			var y := runner.level.yarn
			var extra := ""
			for c in runner.level.nodes_in("cube"):
				extra += " куб(%.0f,%.0f)" % [c.global_position.x, c.global_position.y]
			for b in runner.level.nodes_in("beam"):
				if not (b as Beam).locked or (b as Beam).has_nail():
					extra += " балка %.0f°" % rad_to_deg((b as Beam).rotation)
			for d in runner.level.nodes_in("dynamic"):
				if d is Cube:
					continue
				var k := LevelRunner.kind_of(d)
				if k == "domino":
					extra += " д%.0f°" % rad_to_deg((d as Node2D).rotation)
				else:
					extra += " %s(%.0f,%.0f)" % [k, d.global_position.x, d.global_position.y]
			print("  к%-4d клубок (%.0f, %.0f) v=(%.0f, %.0f) нитка %.0f%s" % [runner.frame, y.global_position.x, y.global_position.y, y.linear_velocity.x, y.linear_velocity.y, y.used, extra])
	print("РЕЗУЛЬТАТ: ", runner.result)
	get_tree().quit()


func _parse(s: String) -> Array:
	var data: Variant = JSON.parse_string(s)
	var out := []
	if typeof(data) != TYPE_ARRAY:
		return out
	for it in data:
		var d: Dictionary = it
		var o := {}
		for k in d:
			var v: Variant = d[k]
			if typeof(v) == TYPE_ARRAY and (v as Array).size() == 2:
				o[k] = Vector2(v[0], v[1])
			elif typeof(v) == TYPE_FLOAT and k != "a" and k != "pos":
				o[k] = int(v) if k != "flip" else bool(v)
			else:
				o[k] = v
		out.append(o)
	return out
