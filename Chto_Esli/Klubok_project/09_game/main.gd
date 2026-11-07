extends Node2D
## Главная сцена «Клубка»: уровень (LevelRunner), сборка (Builder), зерно и виньетка, интерфейс (Hud).
## Ход: сборка → «Пуск» → итог. Неудача — злость +1 и назад к сборке; злость 4 — видео погрома;
## победа — «мурчики». Правила злости — 01_concept/anger_meter.md, сборка — 02_physics/construction.md.

enum State { BUILD, RUN, WAIT, WIN, RAGE }

const PROGRESS := "user://progress.cfg"
const GRAIN := preload("res://fx/grain.gdshader")
## Варианты погрома для локации: первый погром — вариант 1, повторный — следующий.
const RAGE_VIDEOS: PackedStringArray = ["res://video/rage_livingroom_tree_01.ogv"]

var runner: LevelRunner
var builder: Builder
var hud: Hud
var state := State.BUILD
var level_index := 0
var layouts := {}
var best := {}
var last_fail_key := ""
var fail_count := 0
## false — не читать и не писать user://progress.cfg (автотест).
var save_enabled := true
var _wait_id := 0


func _ready() -> void:
	runner = LevelRunner.new()
	runner.name = "Runner"
	add_child(runner)
	builder = Builder.new()
	builder.name = "Builder"
	add_child(builder)
	builder.setup(runner)
	_add_grain()
	hud = Hud.new()
	hud.name = "Hud"
	add_child(hud)

	runner.run_finished.connect(_on_run_finished)
	runner.run_error.connect(_on_run_error)
	builder.changed.connect(_on_layout_changed)
	builder.message.connect(func(t: String) -> void:
		hud.toast(t, Pal.TERRACOTTA)
		Sfx.play("remove" if t == "Гвоздь вынут" else "nope"))
	runner.impact.connect(_on_impact)
	runner.note.connect(_on_note)
	runner.run_started.connect(func() -> void:
		for node in runner.level.nodes_in("fan"):
			if (node as Fan).on:
				Sfx.play("whoosh")
				break)
	builder.hint.connect(hud.tip)
	builder.pet_cat.connect(_on_pet_cat)
	builder.hand_changed.connect(hud.set_hand)
	hud.run_pressed.connect(_on_run_pressed)
	hud.reset_pressed.connect(_on_reset_pressed)
	hud.undo_pressed.connect(_on_undo_pressed)
	hud.levels_pressed.connect(_on_levels_pressed)
	hud.hint_pressed.connect(builder.show_help)
	hud.speed_toggled.connect(func(fast: bool) -> void: Engine.time_scale = 2.0 if fast else 1.0)
	hud.levels_closed.connect(_sync_mode)
	hud.slot_grabbed.connect(builder.begin_carry)
	hud.next_pressed.connect(_on_next)
	hud.retry_pressed.connect(func() -> void: start_level(level_index))
	hud.level_chosen.connect(start_level)
	hud.rage_done.connect(_on_rage_done)
	_load_progress()
	Sfx.muted_changed.connect(func(_on: bool) -> void: _save_progress())
	Sfx.music_muted_changed.connect(func(_on: bool) -> void: _save_progress())
	start_level(level_index)


func _add_grain() -> void:
	var layer := CanvasLayer.new()
	layer.name = "Grain"
	layer.layer = 5
	var r := ColorRect.new()
	r.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var m := ShaderMaterial.new()
	m.shader = GRAIN
	r.material = m
	layer.add_child(r)
	add_child(layer)


# ── уровни ─────────────────────────────────────────────────────────

func start_level(i: int) -> void:
	_wait_id += 1
	if runner.level != null:
		layouts[level_index] = runner.layout.duplicate(true)
	level_index = clampi(i, 0, Levels.count() - 1)
	hud.hide_win()
	hud.hide_levels()
	CatMood.start_level()
	runner.abort()
	runner.trail.clear()
	runner.layout = (layouts.get(level_index, []) as Array).duplicate(true)
	runner.load_level(Levels.scene(level_index), true)
	runner.level.set_build_view(true)
	last_fail_key = ""
	fail_count = 0
	builder.reset_level()
	hud.setup_level(runner.level)
	hud.show_banner(runner.level)
	_set_state(State.BUILD)
	_save_progress()


func _set_state(s: State) -> void:
	state = s
	Sfx.set_music_paused(s == State.RAGE)
	if s == State.WIN or s == State.RAGE:
		Engine.time_scale = 1.0
	else:
		Engine.time_scale = 2.0 if (hud != null and hud.speed_fast) else 1.0
	_sync_mode()


## Режим сборки и вид кнопок — по состоянию и открытым окнам.
func _sync_mode() -> void:
	var modal := hud.modal_open() or state == State.WIN or state == State.RAGE
	var build := state == State.BUILD and not modal
	hud.btn_hint.visible = build and fail_count >= 2 and not runner.level.solution.is_empty()
	if builder.enabled != build:
		builder.enabled = build
	if modal:
		hud.set_mode("modal")
	elif state == State.RUN:
		hud.set_mode("run")
	elif state == State.WAIT:
		hud.set_mode("wait")
	else:
		hud.set_mode("build")
	hud.set_inventory(runner.inventory_left())
	hud.btn_undo.disabled = not build or not builder.can_undo()


func _on_layout_changed() -> void:
	builder.clear_help()
	layouts[level_index] = runner.layout.duplicate(true)
	hud.set_inventory(runner.inventory_left())
	hud.btn_undo.disabled = not builder.enabled or not builder.can_undo()
	_save_progress()


## Вызвать fn через t секунд, если за это время ничего не сменилось (новый уровень, «Стоп» и т. п.).
func _later(t: float, fn: Callable) -> void:
	var id := _wait_id
	get_tree().create_timer(t).timeout.connect(func() -> void:
		if id == _wait_id:
			fn.call())


# ── кнопки ─────────────────────────────────────────────────────────

func _on_run_pressed() -> void:
	match state:
		State.BUILD:
			if hud.modal_open():
				return
			# Расстановки, сохранённые до появления розеток, не должны молча запускать неподключённый фен.
			for node in runner.level.nodes_in("fan"):
				if not (node as Fan).connected():
					hud.nudge("Фен не подключён: подвинь его ближе к розетке")
					Sfx.play("nope")
					return
			if runner.layout_key() == last_fail_key:
				# Пуск без изменений после неудачи не засчитывается.
				hud.nudge("Сначала что-нибудь поменяй")
				Sfx.play("nope")
				runner.level.cat.say("…", Pal.INK, 1.4)
				return
			builder.deselect()
			hud.hide_banner()
			_set_state(State.RUN)
			runner.start_run()
		State.RUN, State.WAIT:
			# «Стоп» — без штрафа: обратно к сборке, детали на местах.
			_back_to_build()


func _back_to_build() -> void:
	_wait_id += 1
	runner.abort()
	runner.back_to_build()
	_set_state(State.BUILD)


func _on_undo_pressed() -> void:
	if state != State.BUILD or hud.modal_open() or not builder.can_undo():
		return
	builder.undo()
	hud.toast("Действие отменено")


func _on_reset_pressed() -> void:
	if state != State.BUILD or runner.layout.is_empty():
		return
	builder.clear_all()
	hud.toast("Детали вернулись в коробку")


func _on_levels_pressed() -> void:
	if state == State.RUN or state == State.WAIT:
		_back_to_build()
	hud.show_levels(best, level_index)
	_sync_mode()


func _on_next() -> void:
	if level_index + 1 < Levels.count():
		start_level(level_index + 1)
	else:
		start_level(level_index)
		_on_levels_pressed()


# ── итог пуска ─────────────────────────────────────────────────────

func _on_run_finished(result: Dictionary) -> void:
	if state != State.RUN:
		return
	if bool(result.get("win", false)):
		_win()
	else:
		_fail(String(result.get("reason", "Неудача")))


func _fail(reason: String) -> void:
	fail_count += 1
	last_fail_key = runner.layout_key()
	CatMood.add_fail(reason)
	runner.level.cat.startle()
	Sfx.play("fail")
	hud.toast(reason, Pal.TERRACOTTA, 1.4)
	runner.level.cat.say("!" if CatMood.face() >= 2 else "…", Pal.TERRACOTTA if CatMood.face() >= 3 else Pal.INK, 1.4)
	if CatMood.is_raging():
		_start_rage()
		return
	_set_state(State.WAIT)
	_later(1.6, _back_to_build)


func _on_run_error(reason: String, _where: Vector2) -> void:
	if state != State.RUN:
		return
	if CatMood.add_error(reason):
		runner.level.cat.startle()
		runner.level.cat.say("!", Pal.TERRACOTTA, 1.2)
		Sfx.play("hiss", -6.0)
	if CatMood.is_raging():
		# Дошло до 4 — пуск сразу обрывается.
		runner.abort()
		last_fail_key = runner.layout_key()
		_start_rage()


func _win() -> void:
	_set_state(State.WIN)
	if runner != null:
		runner.trail.clear()
	var cat := runner.level.cat
	cat.catch_yarn(runner.level.yarn)
	Sfx.play("win")
	_later(1.0, func() -> void:
		cat.say("мрр", Pal.TERRACOTTA, 1.7)
		Sfx.play("purr"))
	var p := CatMood.purrs()
	var old := int(best.get(level_index, 0))
	if runner.level.number > 0 and p > old:
		best[level_index] = p
	_save_progress()
	var label := "Дальше"
	if level_index + 1 == Levels.count() - 1:
		label = "В песочницу"
	elif level_index + 1 >= Levels.count():
		label = "К уровням"
	_later(Cat.CATCH_DURATION + 0.25, func() -> void: hud.show_win(p, maxi(p, old), label))


# ── погром ─────────────────────────────────────────────────────────

func _start_rage() -> void:
	_wait_id += 1
	_set_state(State.RAGE)
	var path := RAGE_VIDEOS[CatMood.rages_this_level % RAGE_VIDEOS.size()]
	# Короткая пауза: увидеть лицо «бешенство» на шкале.
	_later(0.9, func() -> void: hud.rage.play_rage(path))


func _on_rage_done() -> void:
	CatMood.after_rage()
	_back_to_build()
	hud.toast("Ёлку подклеили скотчем. Кот выпустил пар", Pal.INK, 2.8)


## Удары во время пуска — звук: клубок мягко, кубик и подарок — деревом, мандарин шлёпает,
## домино щёлкает, батут пружинит, подушка глушит.
func _on_impact(kind: String, strength: float, _where: Vector2) -> void:
	var gain := linear_to_db(lerpf(0.3, 1.0, strength))
	match kind:
		"yarn":
			Sfx.play("thud", gain, randf_range(0.94, 1.06))
		"gift":
			Sfx.play("knock_heavy", gain, randf_range(0.8, 0.88))
		"mandarin":
			Sfx.play("plop", gain, randf_range(0.92, 1.08))
		"domino":
			Sfx.play("tick", gain, randf_range(0.9, 1.1))
		"boing":
			Sfx.play("boing", gain, randf_range(0.95, 1.05))
		"puff":
			Sfx.play("thud", gain - 6.0, randf_range(0.66, 0.74))
		_:
			Sfx.play("knock_heavy", gain, randf_range(0.92, 1.08))


## События пуска: нитка перегорела, фен задул свечу.
func _on_note(kind: String, text: String, _where: Vector2) -> void:
	Sfx.play("burn" if kind == "burn" else "whoosh", -2.0 if kind == "burn" else -8.0)
	hud.tip(text, 2.5)


# ── Кот ────────────────────────────────────────────────────────────

func _on_pet_cat() -> void:
	if state != State.BUILD:
		return
	var cat := runner.level.cat
	if not CatMood.can_pet():
		cat.say("…", Pal.INK, 1.2)
		hud.tip("Гладить Кота можно раз за уровень")
		return
	var d := CatMood.pet()
	if d > 0.0:
		cat.say("Ш-ш!", Pal.TERRACOTTA, 1.6)
		Sfx.play("hiss")
		hud.tip("На «прищуре» Кот кусается")
	else:
		cat.say("мрр", Pal.TERRACOTTA, 1.6)
		Sfx.play("purr")
	cat.set_mood_face(CatMood.face())
	if CatMood.is_raging():
		_start_rage()


# ── клавиши и мышь ─────────────────────────────────────────────────

func _unhandled_input(e: InputEvent) -> void:
	if state == State.WAIT and e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		_back_to_build()
		get_viewport().set_input_as_handled()


func _unhandled_key_input(e: InputEvent) -> void:
	var k := e as InputEventKey
	if k == null or not k.pressed or k.echo:
		return
	match k.keycode:
		KEY_TAB:
			if not hud.modal_open():
				hud.toggle_speed()
		KEY_SPACE:
			if not hud.modal_open():
				_on_run_pressed()
		KEY_ENTER, KEY_KP_ENTER:
			if state == State.WIN and hud.modal_open():
				_on_next()
			elif not hud.modal_open():
				_on_run_pressed()
		KEY_ESCAPE:
			if state == State.WAIT:
				_back_to_build()
			elif state != State.RAGE and hud.modal_open():
				hud.hide_levels()
				_sync_mode()
			else:
				builder.deselect()
		KEY_DELETE, KEY_BACKSPACE:
			if builder.enabled:
				builder.remove_selected()
		KEY_Z:
			if builder.enabled and (k.ctrl_pressed or k.meta_pressed):
				_on_undo_pressed()
			else:
				return
		KEY_F:
			if builder.enabled:
				builder.flip_selected()
		KEY_M:
			Sfx.muted = not Sfx.muted
		KEY_F9:
			# Отладка: расставить решение уровня (то же, что проверяет автотест).
			if OS.is_debug_build() and builder.enabled:
				runner.layout = runner.level.solution.duplicate(true)
				builder.deselect()
				builder.commit_external()
				hud.toast("Решение уровня (F9, отладка)")
		_:
			return
	get_viewport().set_input_as_handled()


# ── сохранение ─────────────────────────────────────────────────────

## v0.4: песочница занимала индекс 4; в v0.5 на этом месте уровень 5.
static func _progress_index(i: int, schema: int) -> int:
	return Levels.count() - 1 if schema < 2 and i == 4 else i


func _load_progress() -> void:
	var cf := ConfigFile.new()
	if not save_enabled or cf.load(PROGRESS) != OK:
		return
	var schema := int(cf.get_value("game", "schema", 1))
	level_index = clampi(_progress_index(int(cf.get_value("game", "level", 0)), schema), 0, Levels.count() - 1)
	Sfx.muted = bool(cf.get_value("game", "muted", false))
	Sfx.music_muted = bool(cf.get_value("game", "music_muted", false))
	for i in (5 if schema < 2 else Levels.count()):
		var dest := _progress_index(i, schema)
		best[dest] = int(cf.get_value("best", str(i), 0))
		var lay: Variant = cf.get_value("layouts", str(i), [])
		if lay is Array and not (lay as Array).is_empty():
			layouts[dest] = lay


func _save_progress() -> void:
	if not save_enabled:
		return
	var cf := ConfigFile.new()
	cf.set_value("game", "schema", 2)
	cf.set_value("game", "level", level_index)
	cf.set_value("game", "muted", Sfx.muted)
	cf.set_value("game", "music_muted", Sfx.music_muted)
	for i in best:
		cf.set_value("best", str(i), best[i])
	for i in layouts:
		if not (layouts[i] as Array).is_empty():
			cf.set_value("layouts", str(i), layouts[i])
	cf.save(PROGRESS)
