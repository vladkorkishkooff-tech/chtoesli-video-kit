extends Node
## Перебор расстановок для настройки уровня: сколько вариантов выигрывает — такой у уровня допуск.
##   godot --headless --fixed-fps 60 res://tests/sweep.tscn -- <уровень|res://…tscn> <файл.json> [злость]
## Файл — массив расстановок, точки — [x, y]. На каждую строку: номер, итог, кадр, причина, ошибки, клубок.

var runner: LevelRunner
var _errs: Array = []


func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	var scene: PackedScene = load(args[0]) if args[0].ends_with(".tscn") else Levels.scene(int(args[0]) - 1)
	var data: Variant = JSON.parse_string(FileAccess.get_file_as_string(args[1]))
	var anger := float(args[2]) if args.size() > 2 else 0.0
	runner = LevelRunner.new()
	add_child(runner)
	var builder := Builder.new()
	add_child(builder)
	builder.setup(runner)
	runner.run_error.connect(func(r: String, _w: Vector2) -> void: _errs.append(r))
	await get_tree().process_frame
	var wins := 0
	for i in (data as Array).size():
		CatMood.start_level()
		CatMood.anger = anger
		_errs.clear()
		runner.layout = parse(data[i])
		runner.load_level(scene, true)
		# расстановка должна быть допустимой — как если бы её собрал игрок
		var bad := ""
		for j in runner.layout.size():
			var w := builder.why(runner.layout[j], j)
			if w != "":
				bad = "%d: %s" % [j, w]
				break
		if bad != "":
			print("%d BAD %s" % [i, bad])
			continue
		runner.start_run()
		var r: Dictionary = await runner.run_finished
		if r["win"]:
			wins += 1
		print("%d %s %d %s | %s | (%.0f, %.0f)" % [i, "WIN" if r["win"] else "---", r["frame"], r["reason"], ",".join(_errs), r["yarn"].x, r["yarn"].y])
	print("ПОБЕД: %d из %d" % [wins, (data as Array).size()])
	get_tree().quit()


static func parse(arr: Array) -> Array:
	var out := []
	for it in arr:
		var d: Dictionary = it
		var o := {}
		for k in d:
			var v: Variant = d[k]
			if typeof(v) == TYPE_ARRAY and (v as Array).size() == 2:
				o[k] = Vector2(v[0], v[1])
			elif typeof(v) == TYPE_FLOAT:
				o[k] = int(v)
			else:
				o[k] = v
		out.append(o)
	return out
