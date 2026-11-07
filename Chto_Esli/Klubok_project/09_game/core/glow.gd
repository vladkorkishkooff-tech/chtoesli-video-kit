@tool
class_name Glow
extends Node2D
## Тёплое пятно света (сложение цветов): лужица света под Котом, луч на клубок.

@export_enum("pool", "cone") var kind := "pool":
	set(v):
		kind = v
		queue_redraw()
@export var size := Vector2(260, 70):
	set(v):
		size = v
		queue_redraw()
@export var color := Pal.WARM:
	set(v):
		color = v
		queue_redraw()
@export_range(0.0, 2.0) var energy := 0.5:
	set(v):
		energy = v
		queue_redraw()


func _init() -> void:
	var m := CanvasItemMaterial.new()
	m.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	material = m


func _draw() -> void:
	var c := Color(color.r * energy, color.g * energy, color.b * energy, 1.0)
	if kind == "pool":
		draw_texture_rect(Ink.radial(), Rect2(-size * 0.5, size), false, c)
		return
	# луч сверху вниз: вершина в (0, 0), основание шириной size.x на глубине size.y
	var top := Color(c.r, c.g, c.b, 0.55)
	var bottom := Color(c.r, c.g, c.b, 0.0)
	var w := size.x * 0.5
	draw_polygon(PackedVector2Array([Vector2(-14, 0), Vector2(14, 0), Vector2(w, size.y), Vector2(-w, size.y)]),
		PackedColorArray([top, top, bottom, bottom]))
	draw_polygon(PackedVector2Array([Vector2(-6, 0), Vector2(6, 0), Vector2(w * 0.55, size.y * 0.9), Vector2(-w * 0.55, size.y * 0.9)]),
		PackedColorArray([top, top, bottom, bottom]))
	draw_texture_rect(Ink.radial(), Rect2(Vector2(-w * 1.1, size.y - 50), Vector2(w * 2.2, 90)), false, Color(c.r, c.g, c.b, 0.8))
