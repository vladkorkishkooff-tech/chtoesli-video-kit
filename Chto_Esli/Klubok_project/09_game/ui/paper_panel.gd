class_name PaperPanel
extends PanelContainer
## Панель-«бумажка» для подсказок, сообщений и окон. Контур «кипит».

var fill := Pal.PAPER
var line := Pal.INK
var radius := 12.0
var boil := true
var _v := 0


func _init() -> void:
	var sb := StyleBoxEmpty.new()
	sb.content_margin_left = 18
	sb.content_margin_right = 18
	sb.content_margin_top = 10
	sb.content_margin_bottom = 12
	add_theme_stylebox_override("panel", sb)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _process(_d: float) -> void:
	if not boil:
		return
	var v := int(Time.get_ticks_msec() / 140) % 3
	if v != _v:
		_v = v
		queue_redraw()


func _draw() -> void:
	Ink.paper(self, Rect2(Vector2(1, 1), size - Vector2(3, 5)), _v, fill, line, 2.0, radius)


static func label(text: String, font: Font, fs: int, color := Pal.INK) -> Label:
	var l := Label.new()
	l.text = text
	var ls := LabelSettings.new()
	ls.font = font
	ls.font_size = fs
	ls.font_color = color
	l.label_settings = ls
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l
