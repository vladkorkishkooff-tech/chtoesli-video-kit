class_name Paw
extends RefCounted
## «Мурчик» — кошачья лапка, награда за победу (1–3). Терракота с контуром Чернила; пустая — бледная.


static func draw(ci: CanvasItem, c: Vector2, s: float, filled: bool) -> void:
	var fill := Pal.TERRACOTTA if filled else Pal.alpha(Pal.DUSK, 0.16)
	var line := Pal.INK if filled else Pal.alpha(Pal.INK, 0.4)
	var w := maxf(1.4, s * 0.05)
	var pad := c + Vector2(0, s * 0.16)
	var pr := s * 0.27
	var pts := PackedVector2Array()
	for i in 24:
		var a := TAU * i / 24.0
		# подушечка чуть шире книзу
		var k := 1.0 + 0.12 * maxf(0.0, sin(a))
		pts.append(pad + Vector2(cos(a) * pr * 1.12 * k, sin(a) * pr * 0.88))
	ci.draw_colored_polygon(pts, fill)
	pts.append(pts[0])
	ci.draw_polyline(pts, line, w, true)
	for t in 4:
		var ang := deg_to_rad(-148.0 + t * 38.67)
		var tc := pad + Vector2(cos(ang) * 1.05, sin(ang)) * s * 0.43
		var tr := s * (0.11 if t == 0 or t == 3 else 0.125)
		ci.draw_circle(tc, tr, fill)
		ci.draw_arc(tc, tr, 0.0, TAU, 16, line, w, true)


## Ряд лапок: n из total, по центру c.
static func row(ci: CanvasItem, c: Vector2, s: float, n: int, total := 3, gap := 1.3) -> void:
	var step := s * gap
	var x0 := c.x - step * (total - 1) * 0.5
	for i in total:
		draw(ci, Vector2(x0 + step * i, c.y), s, i < n)
