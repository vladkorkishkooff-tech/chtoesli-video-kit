class_name Hud
extends CanvasLayer
## Интерфейс поверх уровня (макет 04_mockups/mockup_07_beam_building.jpg): шкала злости слева вверху,
## «Уровни», «Сброс», «Пуск» справа вверху; внизу — полоса инвентаря и подсказка уровня.
## Окна: заставка уровня, победа, выбор уровня, видео погрома.

signal run_pressed
signal reset_pressed
signal undo_pressed
signal levels_pressed
signal slot_grabbed(kind: String, at: Vector2)
signal next_pressed
signal retry_pressed
signal level_chosen(index: int)
signal rage_done
signal levels_closed
signal hint_pressed
signal speed_toggled(fast: bool)

const KINDS: PackedStringArray = ["beam", "nail", "cube", "wedge", "mandarin", "domino", "trampoline", "pillow", "candle", "fan"]
const BAR_TOP := 624.0
const SOSED := preload("res://art/sosed.png")

var anger: AngerPanel
var btn_levels: PaperButton
var btn_reset: PaperButton
var btn_undo: PaperButton
var btn_speed: PaperButton
var btn_run: PaperButton
var btn_sound: PaperButton
var btn_music: PaperButton
var btn_hint: PaperButton
var slots := {}
var rage: RageVideo
var speed_fast := false:
	set(v):
		speed_fast = v
		if btn_speed != null:
			btn_speed.label = "2×" if speed_fast else "1×"
		speed_toggled.emit(speed_fast)

var _root: Control
var _slot_box: HBoxContainer
var _level_label: Label
var _hint_label: Label
var _toast: PaperPanel
var _toast_label: Label
var _toast_tw: Tween
var _tip: PaperPanel
var _tip_label: Label
var _tip_tw: Tween
var _nudge: PaperPanel
var _nudge_label: Label
var _nudge_tw: Tween
var _banner: PaperPanel
var _banner_place: Label
var _banner_title: Label
var _banner_principle: Label
var _banner_tw: Tween
var _win: Control
var _win_paws: PawRow
var _win_caption: Label
var _win_best: Label
var _win_retry: PaperButton
var _win_next: PaperButton
var _levels: Control
var _level_grid: GridContainer


## Полоса инвентаря: бумага во всю ширину, неровный верхний край.
class Bar extends Control:
	var _v := 0

	func _process(_d: float) -> void:
		var v := int(Time.get_ticks_msec() / 140) % 3
		if v != _v:
			_v = v
			queue_redraw()

	func _draw() -> void:
		Ink.paper(self, Rect2(Vector2(-14, 0), size + Vector2(28, 40)), _v, Pal.PAPER, Pal.INK, 2.0, 4.0)


## Ряд «мурчиков».
class PawRow extends Control:
	var n := 0:
		set(v):
			n = v
			queue_redraw()
	var s := 52.0

	func _draw() -> void:
		Paw.row(self, size * 0.5, s, n)


func _init() -> void:
	layer = 10


func _ready() -> void:
	_root = _full(Control.new())
	_root.name = "Ui"
	add_child(_root)

	anger = AngerPanel.new()
	anger.position = Vector2(12, 10)
	_root.add_child(anger)
	CatMood.anger_changed.connect(anger.set_anger)

	btn_levels = PaperButton.make("Уровни", "levels", false, Vector2(146, 52))
	btn_reset = PaperButton.make("Сброс", "reset", false, Vector2(140, 52))
	btn_run = PaperButton.make("Пуск", "play", true, Vector2(150, 52))
	var x := Phys.VIEW.x - 12.0
	for b in [btn_run, btn_reset, btn_levels]:
		x -= (b as Control).custom_minimum_size.x
		(b as Control).position = Vector2(x, 10)
		x -= 10.0
		_root.add_child(b)
	btn_sound = PaperButton.make("", "mute" if Sfx.muted else "sound", false, Vector2(52, 52))
	btn_sound.position = Vector2(x - 52.0, 10)
	btn_sound.tooltip_text = "Звук (M)"
	btn_sound.pressed.connect(func() -> void: Sfx.muted = not Sfx.muted)
	Sfx.muted_changed.connect(func(on: bool) -> void: btn_sound.glyph = "mute" if on else "sound")
	_root.add_child(btn_sound)
	btn_music = PaperButton.make("", "music_off" if Sfx.music_muted else "music", false, Vector2(52, 52))
	btn_music.position = Vector2(684, 10)
	btn_music.tooltip_text = "Музыка вкл./выкл."
	btn_music.pressed.connect(func() -> void: Sfx.music_muted = not Sfx.music_muted)
	Sfx.music_muted_changed.connect(func(off: bool) -> void: btn_music.glyph = "music_off" if off else "music")
	_root.add_child(btn_music)
	btn_undo = PaperButton.make("Отменить", "", false, Vector2(116, 52))
	btn_undo.position = Vector2(396, 10)
	btn_undo.tooltip_text = "Отменить последнее действие (Ctrl+Z)"
	btn_undo.disabled = true
	btn_undo.pressed.connect(func() -> void: undo_pressed.emit())
	_root.add_child(btn_undo)
	btn_speed = PaperButton.make("1×", "", false, Vector2(56, 52))
	btn_speed.position = Vector2(330, 10)
	btn_speed.tooltip_text = "Скорость пуска (1× / 2×) [Tab]"
	btn_speed.pressed.connect(toggle_speed)
	_root.add_child(btn_speed)
	btn_hint = PaperButton.make("Подсказка", "", false, Vector2(150, 52))
	btn_hint.position = Vector2(520, 10)
	btn_hint.visible = false
	btn_hint.pressed.connect(func() -> void: hint_pressed.emit())
	_root.add_child(btn_hint)
	btn_levels.pressed.connect(func() -> void: levels_pressed.emit())
	btn_reset.pressed.connect(func() -> void: reset_pressed.emit())
	btn_run.pressed.connect(func() -> void: run_pressed.emit())

	var bar := Bar.new()
	bar.position = Vector2(0, BAR_TOP)
	bar.size = Vector2(Phys.VIEW.x, Phys.VIEW.y - BAR_TOP)
	bar.mouse_filter = Control.MOUSE_FILTER_STOP
	_root.add_child(bar)
	_slot_box = HBoxContainer.new()
	_slot_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_slot_box.add_theme_constant_override("separation", 12)
	_slot_box.position = Vector2(16, 8)
	bar.add_child(_slot_box)
	for k in KINDS:
		var s := InvSlot.new()
		s.kind = k
		s.grabbed.connect(func(kind: String, at: Vector2) -> void: slot_grabbed.emit(kind, at))
		_slot_box.add_child(s)
		slots[k] = s
	_level_label = PaperPanel.label("", Fonts.SERIF_BOLD, 18)
	bar.add_child(_level_label)
	_hint_label = PaperPanel.label("", Fonts.SERIF_ITALIC, 16, Pal.alpha(Pal.INK, 0.75))
	_hint_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bar.add_child(_hint_label)

	_tip = PaperPanel.new()
	_tip_label = PaperPanel.label("", Fonts.SERIF_ITALIC, 18)
	_tip.add_child(_tip_label)
	_tip.position = Vector2(16, 570)
	_tip.modulate.a = 0.0
	_root.add_child(_tip)

	_toast = PaperPanel.new()
	_toast_label = PaperPanel.label("", Fonts.SERIF_BOLD, 22)
	_toast.add_child(_toast_label)
	_toast.modulate.a = 0.0
	_root.add_child(_toast)

	_nudge = PaperPanel.new()
	_nudge_label = PaperPanel.label("", Fonts.hand(), 26, Pal.TERRACOTTA)
	_nudge.add_child(_nudge_label)
	_nudge.modulate.a = 0.0
	_root.add_child(_nudge)

	_build_banner()
	_build_win()
	_build_levels()

	rage = RageVideo.new()
	rage.name = "RageVideo"
	rage.finished.connect(func() -> void: rage_done.emit())
	add_child(rage)


func _exit_tree() -> void:
	Items.free_icons()


func _full(c: Control) -> Control:
	c.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return c


# ── уровень и инвентарь ────────────────────────────────────────────

func setup_level(level: Level) -> void:
	var inv := level.inventory()
	var n := 0
	for k in KINDS:
		if int(inv.get(k, 0)) > 0:
			n += 1
	# до четырёх видов — широкие слоты; больше — уже, чтобы осталось место подписи уровня
	var sw := 150.0
	var sep := 12.0
	if n > 4:
		sep = 8.0
		sw = clampf((Phys.VIEW.x - 32.0 - 300.0 - (n - 1) * sep) / n, 100.0, 132.0)
	_slot_box.add_theme_constant_override("separation", int(sep))
	for k in KINDS:
		var s: InvSlot = slots[k]
		s.visible = int(inv.get(k, 0)) > 0
		s.active = false
		s.custom_minimum_size = Vector2(sw, 80)
		s.size = s.custom_minimum_size
		s.queue_redraw()
	_slot_box.reset_size()
	var x0 := 16.0 + n * (sw + sep) + 14.0
	var w := Phys.VIEW.x - x0 - 24.0
	if level.number > 0:
		_level_label.text = "Уровень %d · %s" % [level.number, level.level_title]
	else:
		_level_label.text = level.level_title
	_level_label.position = Vector2(x0, 12)
	_level_label.size = Vector2(w, 24)
	_hint_label.text = level.hint
	_hint_label.visible = w >= 220.0
	_hint_label.position = Vector2(x0, 40)
	_hint_label.size = Vector2(w, 52)
	_tip.modulate.a = 0.0
	_toast.modulate.a = 0.0
	_nudge.modulate.a = 0.0


func set_inventory(left: Dictionary) -> void:
	for k in KINDS:
		(slots[k] as InvSlot).count = maxi(0, int(left.get(k, 0)))


func set_hand(kind: String) -> void:
	for k in KINDS:
		(slots[k] as InvSlot).active = k == kind and kind != ""


func toggle_speed() -> void:
	speed_fast = not speed_fast


## build — сборка, run — пуск идёт, wait — показываем итог, modal — открыто окно.
func set_mode(m: String) -> void:
	var running := m == "run" or m == "wait"
	btn_run.label = "Стоп" if running else "Пуск"
	btn_run.glyph = "stop" if running else "play"
	btn_run.primary = not running
	btn_run.disabled = m == "modal"
	btn_reset.disabled = m != "build"
	btn_levels.disabled = m == "modal"
	btn_speed.disabled = m == "modal"
	for k in KINDS:
		var s: InvSlot = slots[k]
		s.mouse_filter = Control.MOUSE_FILTER_STOP if m == "build" else Control.MOUSE_FILTER_IGNORE
		s.modulate.a = 1.0 if m == "build" else 0.55


# ── сообщения ──────────────────────────────────────────────────────

## Короткое сообщение вверху по центру: «Нельзя: задевает полку», итог пуска.
func toast(text: String, color := Pal.INK, time := 2.2) -> void:
	_toast_label.text = text
	_toast_label.label_settings.font_color = color
	_toast.reset_size()
	_toast.position = Vector2((Phys.VIEW.x - _toast.size.x) * 0.5, 92)
	_toast_tw = _flash(_toast, _toast_tw, time)


## Подсказка слева над инвентарём («Проведи пальцем от точки к точке…»).
func tip(text: String, time := 4.0) -> void:
	if text == "":
		return
	_tip_label.text = text
	_tip.reset_size()
	_tip_tw = _flash(_tip, _tip_tw, time)


## Укор под кнопкой «Пуск»: «Сначала что-нибудь поменяй».
func nudge(text: String) -> void:
	_nudge_label.text = text
	_nudge.reset_size()
	_nudge.position = Vector2(Phys.VIEW.x - 12.0 - _nudge.size.x, 70)
	_nudge_tw = _flash(_nudge, _nudge_tw, 2.4)
	var tw := create_tween()
	var p := btn_run.position
	for i in 3:
		tw.tween_property(btn_run, "position", p + Vector2(-6, 0), 0.05)
		tw.tween_property(btn_run, "position", p + Vector2(6, 0), 0.05)
	tw.tween_property(btn_run, "position", p, 0.05)


func _flash(c: Control, old: Tween, time: float) -> Tween:
	if old != null:
		old.kill()
	var tw := create_tween()
	tw.tween_property(c, "modulate:a", 1.0, 0.15)
	tw.tween_interval(time)
	tw.tween_property(c, "modulate:a", 0.0, 0.4)
	return tw


# ── заставка уровня ────────────────────────────────────────────────

func _build_banner() -> void:
	_banner = PaperPanel.new()
	var v := VBoxContainer.new()
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_theme_constant_override("separation", 2)
	_banner.add_child(v)
	_banner_place = PaperPanel.label("", Fonts.SERIF_ITALIC, 18, Pal.alpha(Pal.INK, 0.7))
	_banner_title = PaperPanel.label("", Fonts.SERIF_BOLD, 44)
	_banner_principle = PaperPanel.label("", Fonts.hand(), 32, Pal.TERRACOTTA)
	for l in [_banner_place, _banner_title, _banner_principle]:
		(l as Label).horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(l)
	_banner.modulate.a = 0.0
	_root.add_child(_banner)


func show_banner(level: Level) -> void:
	if level.number > 0:
		_banner_place.text = "%s · уровень %d" % [level.location, level.number]
	else:
		_banner_place.text = level.location
	_banner_title.text = level.level_title
	_banner_principle.text = level.principle
	_banner.reset_size()
	_banner.size.x = maxf(_banner.size.x, 420.0)
	_banner.position = Vector2((Phys.VIEW.x - _banner.size.x) * 0.5, 200)
	if _banner_tw != null:
		_banner_tw.kill()
	_banner_tw = create_tween()
	_banner.scale = Vector2.ONE
	_banner.modulate.a = 0.0
	_banner_tw.tween_property(_banner, "modulate:a", 1.0, 0.3)
	_banner_tw.tween_interval(2.6)
	_banner_tw.tween_property(_banner, "modulate:a", 0.0, 0.6)


func hide_banner() -> void:
	if _banner_tw != null:
		_banner_tw.kill()
	_banner.modulate.a = 0.0


# ── окна ───────────────────────────────────────────────────────────

func _modal_layer() -> Control:
	var m := _full(Control.new())
	var dim := ColorRect.new()
	dim.color = Pal.alpha(Pal.INK, 0.55)
	_full(dim)
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	m.add_child(dim)
	m.visible = false
	_root.add_child(m)
	return m


func _build_win() -> void:
	_win = _modal_layer()
	var sosed := TextureRect.new()
	sosed.texture = SOSED
	sosed.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	sosed.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT
	sosed.size = Vector2(130, 410)
	sosed.position = Vector2(300, 190)
	sosed.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_win.add_child(sosed)
	var p := PaperPanel.new()
	p.position = Vector2(440, 170)
	p.custom_minimum_size = Vector2(520, 0)
	var v := VBoxContainer.new()
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_theme_constant_override("separation", 6)
	p.add_child(v)
	var t := PaperPanel.label("Кот доволен!", Fonts.SERIF_BOLD, 44)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	_win_paws = PawRow.new()
	_win_paws.custom_minimum_size = Vector2(480, 74)
	_win_paws.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(_win_paws)
	_win_caption = PaperPanel.label("", Fonts.hand(), 32, Pal.TERRACOTTA)
	_win_caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_win_caption)
	_win_best = PaperPanel.label("", Fonts.SERIF_ITALIC, 16, Pal.alpha(Pal.INK, 0.7))
	_win_best.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_win_best)
	var h := HBoxContainer.new()
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	h.add_theme_constant_override("separation", 16)
	_win_retry = PaperButton.make("Ещё раз", "retry", false, Vector2(170, 56))
	_win_next = PaperButton.make("Дальше", "next", true, Vector2(190, 56))
	_win_retry.pressed.connect(func() -> void: retry_pressed.emit())
	_win_next.pressed.connect(func() -> void: next_pressed.emit())
	h.add_child(_win_retry)
	h.add_child(_win_next)
	var gap := Control.new()
	gap.custom_minimum_size = Vector2(0, 8)
	gap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(gap)
	v.add_child(h)
	_win.add_child(p)


const PURR_TEXT := ["", "Кот снисходительно мурлыкнул", "Кот мурчит", "Кот мурчит во весь голос"]


func show_win(purrs: int, best: int, next_label: String) -> void:
	_win_paws.n = 0
	_win_caption.text = PURR_TEXT[clampi(purrs, 1, 3)]
	_win_best.text = "Лучший результат на уровне: %d из 3" % best if best > purrs else "Меньше злости — больше мурчиков"
	_win_next.label = next_label
	_win.visible = true
	_win.modulate.a = 0.0
	var tw := create_tween()
	tw.tween_property(_win, "modulate:a", 1.0, 0.25)
	for i in purrs:
		tw.tween_interval(0.22)
		tw.tween_callback(func() -> void: _win_paws.n += 1)


func hide_win() -> void:
	_win.visible = false


func _build_levels() -> void:
	_levels = _modal_layer()
	var p := PaperPanel.new()
	p.custom_minimum_size = Vector2(760, 0)
	var v := VBoxContainer.new()
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_theme_constant_override("separation", 14)
	p.add_child(v)
	var head := HBoxContainer.new()
	head.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var t := PaperPanel.label("Гостиная", Fonts.SERIF_BOLD, 36)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(t)
	var close := PaperButton.make("", "close", false, Vector2(52, 52))
	close.pressed.connect(func() -> void:
		hide_levels()
		levels_closed.emit())
	head.add_child(close)
	v.add_child(head)
	_level_grid = GridContainer.new()
	_level_grid.columns = 4
	_level_grid.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_level_grid.add_theme_constant_override("h_separation", 12)
	_level_grid.add_theme_constant_override("v_separation", 12)
	v.add_child(_level_grid)
	var note := PaperPanel.label("Мурчики — за победу без лишней злости: 3 — злость не выше 1.", Fonts.SERIF_ITALIC, 16, Pal.alpha(Pal.INK, 0.7))
	v.add_child(note)
	_levels.add_child(p)
	p.reset_size()
	p.position = (Phys.VIEW - p.size) * 0.5 - Vector2(0, 30)


func show_levels(best: Dictionary, current: int) -> void:
	for c in _level_grid.get_children():
		_level_grid.remove_child(c)
		c.queue_free()
	for i in Levels.count():
		var info := Levels.info(i)
		var num := int(info["number"])
		var text := "%d · %s" % [num, info["title"]] if num > 0 else String(info["title"])
		var b := PaperButton.make(text, "", false, Vector2(206, 84))
		if i == current:
			b.glyph = "play"
		b.paws = int(best.get(i, 0)) if num > 0 else -1
		b.font_size = 19
		var idx := i
		b.pressed.connect(func() -> void: level_chosen.emit(idx))
		_level_grid.add_child(b)
	_levels.visible = true
	var panel := _levels.get_child(1) as Control
	panel.reset_size()
	panel.position = (Phys.VIEW - panel.size) * 0.5 - Vector2(0, 30)


func hide_levels() -> void:
	_levels.visible = false


func modal_open() -> bool:
	return _win.visible or _levels.visible or rage.is_playing()
