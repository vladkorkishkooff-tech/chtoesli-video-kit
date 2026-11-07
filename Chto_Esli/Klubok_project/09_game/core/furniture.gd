@tool
class_name Furniture
extends StaticBody2D
## Мебель и подставки уровня. Начало — левый верхний угол; верх — поверхность, по которой катится клубок.
## Фон холодный и тусклый, без толстых линий (03_style/style_guide.md, правило 1).

@export_enum("shelf", "dresser", "step", "books", "box", "block") var kind := "shelf":
	set(v):
		kind = v
		_rebuild()
@export var size := Vector2(256, 16):
	set(v):
		size = v
		_rebuild()

var _shape: CollisionShape2D
var _rect: RectangleShape2D


func _init() -> void:
	_rect = RectangleShape2D.new()
	_shape = CollisionShape2D.new()
	_shape.shape = _rect
	add_child(_shape, false, Node.INTERNAL_MODE_FRONT)
	z_index = -2
	add_to_group("solid")
	_rebuild()


func _rebuild() -> void:
	if _rect == null:
		return
	_rect.size = size
	_shape.position = size * 0.5
	physics_material_override = Phys.material(0.9 if kind == "step" else 0.8, 0.0)
	queue_redraw()


func solid_polys() -> Array:
	return [global_transform * Phys.rect_poly(Rect2(Vector2.ZERO, size))]


func solid_strict() -> bool:
	return false


func solid_name() -> String:
	return {"shelf": "полку", "dresser": "комод", "step": "ступеньку", "books": "книги", "box": "коробку"}.get(kind, "мебель")


func _draw() -> void:
	var line := Pal.alpha(Pal.INK, 0.55)
	var top_light := Pal.alpha(Pal.WARM, 0.35)
	var r := Rect2(Vector2.ZERO, size)
	match kind:
		"shelf":
			for x in [size.x * 0.18, size.x * 0.82]:
				draw_colored_polygon(PackedVector2Array([Vector2(x - 3, size.y), Vector2(x + 3, size.y), Vector2(x + 3, size.y + 24), Vector2(x - 16, size.y)]), Pal.mix(Pal.DUSK, Pal.INK, 0.25))
			draw_rect(r, Pal.mix(Pal.DUSK, Pal.PAPER, 0.14))
			draw_rect(Rect2(0, size.y - 4, size.x, 4), Pal.alpha(Pal.INK, 0.25))
		"dresser":
			draw_rect(r, Pal.DUSK)
			draw_rect(Rect2(0, 0, size.x, 12), Pal.mix(Pal.DUSK, Pal.PAPER, 0.16))
			var n := clampi(int((size.y - 12) / 60.0), 1, 4)
			var dh := (size.y - 16) / n
			for i in n:
				var dr := Rect2(10, 16 + i * dh, size.x - 20, dh - 8)
				draw_rect(dr, Pal.mix(Pal.DUSK, Pal.NIGHT, 0.25))
				draw_rect(dr, line, false, 1.0)
				for kx in [dr.position.x + dr.size.x * 0.3, dr.position.x + dr.size.x * 0.7]:
					draw_circle(Vector2(kx, dr.get_center().y), 3.5, Pal.alpha(Pal.WARM, 0.45))
		"step":
			draw_rect(r, Pal.mix(Pal.DUSK, Pal.TERRACOTTA, 0.12))
			var rug := Rect2(0, 0, size.x, minf(14.0, size.y))
			draw_rect(rug, Pal.mix(Pal.BLUSH, Pal.DUSK, 0.5))
			var stripes := int(size.x / 24.0)
			for i in stripes:
				draw_line(Vector2(12 + i * 24, 3), Vector2(12 + i * 24, rug.size.y - 3), Pal.alpha(Pal.PAPER, 0.18), 3.0)
			for i in 6:
				draw_line(Vector2(0, 2 + i * 2), Vector2(-7, 4 + i * 2), Pal.alpha(Pal.BLUSH, 0.5), 1.0)
		"books":
			var cols := [Pal.mix(Pal.NIGHT, Pal.PAPER, 0.18), Pal.mix(Pal.DUSK, Pal.BLUSH, 0.3), Pal.mix(Pal.DUSK, Pal.OLIVE, 0.3), Pal.mix(Pal.NIGHT, Pal.TERRACOTTA, 0.3)]
			var y := 0.0
			var i := 0
			while y < size.y - 0.5:
				var h := minf(size.y - y, 14.0 + 6.0 * Ink.hash01(i + 3))
				draw_rect(Rect2(0, y, size.x, h), cols[i % cols.size()])
				draw_line(Vector2(6, y + h * 0.5), Vector2(size.x * 0.35, y + h * 0.5), Pal.alpha(Pal.PAPER, 0.25), 1.0)
				draw_line(Vector2(0, y + h), Vector2(size.x, y + h), line, 1.0)
				y += h
				i += 1
		"box":
			draw_rect(r, Pal.mix(Pal.WOOD_DARK, Pal.DUSK, 0.45))
			draw_line(Vector2(0, 14), Vector2(size.x, 14), line, 1.0)
			draw_rect(Rect2(size.x * 0.5 - 8, 0, 16, size.y), Pal.alpha(Pal.PAPER, 0.12))
		_:
			draw_rect(r, Pal.DUSK)
	draw_line(Vector2(1, 1), Vector2(size.x - 1, 1), top_light, 2.0)
	draw_rect(r, line, false, 1.5)
