extends Node
## Проверка главной сцены без экрана (ход игры, 01_concept/anger_meter.md):
## пустой пуск — неудача и злость +1; тот же пуск без изменений не засчитывается;
## решение — победа и 3 мурчика; злость 4 — видео погрома, после него злость 1; звуки запрошены.
## Запуск: godot --headless --path . --fixed-fps 60 res://tests/test_main.tscn

var failures := 0
var main: Node


func _ready() -> void:
	main = (load("res://main.tscn") as PackedScene).instantiate()
	main.set("save_enabled", false)
	add_child(main)
	await get_tree().process_frame
	main.call("start_level", 0)
	var runner: LevelRunner = main.get("runner")

	main.call("_on_run_pressed")
	_check(_state() == "RUN", "Пуск → идёт пуск")
	var r: Dictionary = await runner.run_finished
	await get_tree().process_frame
	_check(not r["win"] and is_equal_approx(CatMood.anger, 1.0), "пустой пуск — %s, злость %.1f" % [r["reason"], CatMood.anger])
	_check(_state() == "WAIT", "итог показан, сборка ждёт")
	await get_tree().create_timer(1.8).timeout
	_check(_state() == "BUILD", "через 1,6 с — снова сборка")

	main.call("_on_run_pressed")
	_check(_state() == "BUILD" and is_equal_approx(CatMood.anger, 1.0), "тот же пуск без изменений не засчитан")

	runner.layout = runner.level.solution.duplicate(true)
	runner.back_to_build()
	main.call("_on_layout_changed")
	main.call("_on_run_pressed")
	r = await runner.run_finished
	await get_tree().process_frame
	_check(r["win"] and _state() == "WIN", "решение — %s (кадр %d)" % [r["reason"], r["frame"]])
	_check(CatMood.purrs() == 3, "злость 1 — 3 мурчика (%d)" % CatMood.purrs())
	var cat_win := runner.level.cat
	var yarn_win := runner.level.yarn
	var start_yarn := yarn_win.global_position
	var result_yarn: Vector2 = r["yarn"]
	var fixed_body := cat_win.body_rect()
	await get_tree().create_timer(0.9).timeout
	_check(cat_win.get("_catch_time") > 0.0 and yarn_win.global_position.distance_to(start_yarn) > 1.0 and not (main.get("hud") as Hud).modal_open(), "Кот тянет клубок до появления окна победы")
	_check(cat_win.body_rect() == fixed_body and r["yarn"] == result_yarn, "сцена победы не меняет коллизию Кота и сохранённый результат")
	await get_tree().create_timer(2.8).timeout
	_check((main.get("hud") as Hud).modal_open(), "окно победы открывается после сцены")

	main.call("start_level", 1)
	_check(_state() == "BUILD" and runner.level.number == 2 and is_equal_approx(CatMood.anger, 0.0), "«Дальше» — уровень 2, злость 0")
	CatMood.anger = 3.0
	main.call("_on_run_pressed")
	r = await runner.run_finished
	await get_tree().process_frame
	_check(_state() == "RAGE" and CatMood.is_raging(), "неудача на злости 3 — погром")
	_check(Sfx.music_paused, "музыка на паузе во время погрома")
	await get_tree().create_timer(1.5).timeout
	var rage: RageVideo = (main.get("hud") as Hud).rage
	_check(rage.is_playing(), "видео погрома идёт")
	rage.call("_finish")
	await get_tree().process_frame
	_check(_state() == "BUILD" and is_equal_approx(CatMood.anger, 1.0), "после видео — сборка, злость %.1f" % CatMood.anger)
	_check(not Sfx.music_paused, "музыка возобновляется после погрома")

	main.call("start_level", 5)
	main.set("fail_count", 2)
	main.call("_sync_mode")
	var hud: Hud = main.get("hud")
	var builder: Builder = main.get("builder")
	_check(hud.btn_hint.visible, "после двух неудач доступна подсказка")
	var before := CatMood.anger
	var count := runner.layout.size()
	builder.show_help()
	_check(builder.help_ghost.get("type") == "beam" and runner.layout.size() == count and CatMood.anger == before, "подсказка показывает балку без штрафа и изменений")
	var b: Dictionary = runner.level.solution[0].duplicate(true)
	b["nail"] = -1
	runner.layout = [b]
	runner.rebuild()
	builder.show_help()
	_check(builder.help_ghost.get("type") == "nail", "подсказка показывает точку гвоздя")
	main.call("start_level", 0)
	_check(not hud.btn_hint.visible and builder.help_ghost.is_empty(), "подсказка сбрасывается с уровнем")

	# Две настоящие неудачи, а не только ручная подстановка счётчика.
	runner.layout = []
	runner.back_to_build()
	main.call("_on_layout_changed")
	main.call("_on_run_pressed")
	await runner.run_finished
	await get_tree().create_timer(1.8).timeout
	runner.layout = [{"type": "beam", "a": Vector2(320, 320), "step": 0, "cells": 2, "nail": -1}]
	runner.back_to_build()
	main.call("_on_layout_changed")
	main.call("_on_run_pressed")
	await runner.run_finished
	await get_tree().create_timer(1.8).timeout
	_check(hud.btn_hint.visible and main.get("fail_count") == 2, "кнопка появляется после двух реальных неудач")

	_check(main.call("_progress_index", 4, 1) == Levels.count() - 1 and main.call("_progress_index", 4, 2) == 4, "сохранение v0.4 переносит песочницу, не подменяя уровень 5")

	main.call("start_level", 2)
	var c := {"type": "cube", "pos": Vector2(400, 160)}
	_check(builder.why(c, -1) == "", "кубик для проверки отмены размещается допустимо")
	builder.call("_add", c)
	var one := runner.layout.duplicate(true)
	var anger_before := CatMood.anger
	_check(builder.can_undo() and not hud.btn_undo.disabled and runner.inventory_left()["cube"] == 0, "постановку можно отменить, инвентарь обновлён")
	builder.clear_all()
	_check(runner.layout.is_empty() and builder.can_undo(), "сброс попадает в историю")
	main.call("_on_undo_pressed")
	_check(runner.layout == one and CatMood.anger == anger_before, "отмена сброса восстанавливает детали без изменения злости")
	main.call("_on_undo_pressed")
	_check(runner.layout.is_empty() and not builder.can_undo() and runner.inventory_left()["cube"] == 1, "вторая отмена возвращает деталь в инвентарь")
	builder.call("_add", c)
	main.call("start_level", 3)
	_check(not builder.can_undo() and hud.btn_undo.disabled, "история отмены не переходит в другой уровень")

	# Гвоздь и правка существующей детали тоже сохраняют отдельные снимки.
	var beam: Dictionary = runner.level.solution[0].duplicate(true)
	beam["nail"] = -1
	builder.call("_add", beam)
	builder.call("_add", {"type": "nail", "idx": 0, "cell": 0})
	_check(int(runner.layout[0]["nail"]) == 0, "гвоздь добавлен к балке")
	builder.undo()
	_check(int(runner.layout[0]["nail"]) == -1 and runner.inventory_left()["nail"] == 1, "отмена вынимает гвоздь и возвращает его в инвентарь")
	var original: Dictionary = runner.layout[0].duplicate(true)
	runner.layout[0]["step"] = 11
	builder.call("_commit")
	builder.undo()
	_check(runner.layout[0] == original, "отмена восстанавливает изменённую балку")
	main.call("start_level", 3)

	var cat := runner.level.cat
	var hit_box := cat.body_rect()
	cat.watch_yarn(cat.global_position + Vector2(-100, -40))
	cat.startle()
	cat.call("_process", 0.1)
	_check(cat.get("_paw") > 0.0 and cat.get("_flinch") > 0.0 and cat.body_rect() == hit_box, "слежение и испуг анимируют Кота, не меняя коллизию")

	# Старая расстановка с феном вне досягаемости не должна молча запускаться.
	main.call("start_level", 9)
	runner.layout = [{"type": "fan", "pos": Vector2(850, 180), "dir": 0}]
	runner.back_to_build()
	var anger_before_bad_fan := CatMood.anger
	main.call("_on_run_pressed")
	_check(_state() == "BUILD" and CatMood.anger == anger_before_bad_fan, "неподключённый фен из старого сохранения блокирует пуск без штрафа")

	var player: AudioStreamPlayer = Sfx.get("_music")
	var master_before: bool = Sfx.muted
	Sfx.music_muted = true
	_check(Sfx.music_muted and Sfx.muted == master_before and (AudioServer.get_driver_name() == "Dummy" or player.stream_paused), "музыку можно отключить отдельно от звуков")
	Sfx.music_muted = false
	_check(not player.stream_paused and (player.stream as AudioStreamOggVorbis).loop, "музыкальная петля включена и повторяется")

	var need := ["fail", "win", "pogrom"]
	var heard := need.filter(func(id): return Sfx.heard.has(id))
	_check(heard.size() == need.size(), "звуки неудачи, победы и погрома: %s" % ", ".join(heard))

	print("ИТОГ: %s, ошибок проверки: %d" % ["OK" if failures == 0 else "ПРОВАЛ", failures])
	get_tree().quit(1 if failures > 0 else 0)


func _state() -> String:
	return ["BUILD", "RUN", "WAIT", "WIN", "RAGE"][int(main.get("state"))]


func _check(ok: bool, text: String) -> void:
	if not ok:
		failures += 1
	print(("  ok    " if ok else "  FAIL  ") + text)
