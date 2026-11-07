@tool
class_name NoBuildZone
extends Node2D
## Заштрихованная зона, где строить нельзя: чтобы уровень не решался одной балкой.

@export var size := Vector2(128, 128):
	set(v):
		size = v
		queue_redraw()


func _init() -> void:
	z_index = 6
	add_to_group("nobuild")


func polys() -> Array:
	return [Phys.rect_poly(Rect2(global_position, size))]


func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Pal.alpha(Pal.INK, 0.14))
	var c := -size.y
	while c < size.x:
		var t0 := maxf(0.0, -c)
		var t1 := minf(size.y, size.x - c)
		if t1 > t0:
			draw_line(Vector2(c + t0, t0), Vector2(c + t1, t1), Pal.alpha(Pal.INK, 0.25), 2.0)
		c += 14.0
	var pts := Phys.rect_poly(Rect2(Vector2.ZERO, size))
	for i in 4:
		draw_dashed_line(pts[i], pts[(i + 1) % 4], Pal.alpha(Pal.PAPER, 0.35), 1.5, 8.0)
