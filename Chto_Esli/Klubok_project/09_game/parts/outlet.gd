@tool
class_name PowerOutlet
extends Node2D
## Настенная розетка: не препятствие. Подключение автоматическое к ближайшей доступной.

func _init() -> void:
	z_index = -2
	add_to_group("outlet")

func _draw() -> void:
	var plate := Ink.round_rect(Rect2(-20, -16, 40, 32), 7.0)
	draw_colored_polygon(plate, Pal.PAPER)
	Ink.closed_line(self, plate, Pal.INK, 2.0)
	draw_circle(Vector2.ZERO, 11, Pal.mix(Pal.PAPER, Pal.DUSK, 0.18))
	draw_arc(Vector2.ZERO, 11, 0, TAU, 24, Pal.INK, 1.4, true)
	draw_circle(Vector2(-4, 0), 2.0, Pal.INK)
	draw_circle(Vector2(4, 0), 2.0, Pal.INK)
