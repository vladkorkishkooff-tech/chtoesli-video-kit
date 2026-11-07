class_name RageVideo
extends CanvasLayer
## Видео погрома (01_concept/rage_video.md, 06_manuals/06_video_cutscenes.md):
## вспышка «ПОГРОМ!», затем ролик; зерно и виньетка — шейдером, сильнее, чем в игре;
## «Пропустить ›» появляется через 1 с, нажатие в любом месте — тоже пропуск.

signal finished

const GRAIN := preload("res://fx/grain.gdshader")
const MAX_TIME := 14.0   ## страховка: ролик не дольше 8 с

var player: VideoStreamPlayer
var skip: PaperButton
var _back: ColorRect
var _title: Label
var _t := 0.0
var _done := true


func _init() -> void:
	layer = 20
	visible = false


func _ready() -> void:
	_back = ColorRect.new()
	_back.color = Pal.INK
	_back.set_anchors_preset(Control.PRESET_FULL_RECT)
	_back.mouse_filter = Control.MOUSE_FILTER_STOP
	_back.gui_input.connect(_on_back_input)
	add_child(_back)
	player = VideoStreamPlayer.new()
	player.expand = true
	player.set_anchors_preset(Control.PRESET_FULL_RECT)
	player.mouse_filter = Control.MOUSE_FILTER_IGNORE
	player.finished.connect(_finish)
	add_child(player)
	var grain := ColorRect.new()
	grain.set_anchors_preset(Control.PRESET_FULL_RECT)
	grain.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var m := ShaderMaterial.new()
	m.shader = GRAIN
	m.set_shader_parameter("grain_amount", 0.10)
	m.set_shader_parameter("vignette_amount", 0.45)
	grain.material = m
	add_child(grain)
	_title = PaperPanel.label("ПОГРОМ!", Fonts.SERIF_BOLD, 112, Pal.ALARM)
	_title.label_settings.outline_size = 10
	_title.label_settings.outline_color = Pal.INK
	_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_title.position = Vector2(0, 260)
	_title.size = Vector2(1280, 200)
	_title.pivot_offset = Vector2(640, 100)
	add_child(_title)
	skip = PaperButton.make("Пропустить", "next", false, Vector2(196, 52))
	skip.position = Vector2(1280 - 196 - 24, 720 - 52 - 24)
	skip.pressed.connect(_finish)
	add_child(skip)


func is_playing() -> bool:
	return not _done


func play_rage(path: String) -> void:
	visible = true
	_done = false
	_t = 0.0
	skip.visible = false
	player.visible = false
	player.stream = load(path) as VideoStream if ResourceLoader.exists(path) else null
	_title.visible = true
	Sfx.play("pogrom")
	_title.scale = Vector2(0.4, 0.4)
	_title.modulate = Color.WHITE
	var tw := create_tween()
	tw.tween_property(_title, "scale", Vector2.ONE, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_interval(0.45)
	tw.tween_callback(_start_video)


func _start_video() -> void:
	if _done:
		return
	_title.visible = false
	if player.stream == null:
		_finish()
		return
	player.visible = true
	player.play()


func _process(delta: float) -> void:
	if _done:
		return
	_t += delta
	if _t >= 1.0 and not skip.visible:
		skip.visible = true
	if _t >= MAX_TIME:
		_finish()


func _on_back_input(e: InputEvent) -> void:
	if _t >= 1.0 and e is InputEventMouseButton and e.pressed:
		_finish()


func _finish() -> void:
	if _done:
		return
	_done = true
	player.stop()
	visible = false
	finished.emit()
