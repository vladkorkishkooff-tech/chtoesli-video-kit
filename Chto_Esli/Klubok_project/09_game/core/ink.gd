@tool
class_name Ink
extends RefCounted
## Рисование «от руки»: неровный контур цвета Чернила, скруглённые формы, подсветка.


## Неровный контур: стороны режем на куски и чуть сдвигаем точки (детерминированно от sd).
static func wobble(pts: PackedVector2Array, amp := 1.1, step := 18.0, sd := 0, closed := true) -> PackedVector2Array:
	var out := PackedVector2Array()
	var n := pts.size()
	if n < 2:
		return pts
	var cnt := n if closed else n - 1
	for i in cnt:
		var a := pts[i]
		var b := pts[(i + 1) % n]
		var seg := maxi(1, int(a.distance_to(b) / step))
		var nrm := (b - a).orthogonal().normalized()
		for j in seg:
			var t := float(j) / seg
			var h := hash01(sd * 7919 + i * 131 + j * 17)
			out.append(a.lerp(b, t) + nrm * (h * 2.0 - 1.0) * amp)
	if not closed:
		out.append(pts[n - 1])
	return out


static func hash01(i: int) -> float:
	var x := (i * 374761393 + 668265263) & 0x7fffffff
	x = ((x ^ (x >> 13)) * 1274126177) & 0x7fffffff
	return float(x % 10007) / 10007.0


static func closed_line(ci: CanvasItem, pts: PackedVector2Array, color: Color, width := 2.0) -> void:
	if pts.size() < 2:
		return
	var p := pts.duplicate()
	p.append(pts[0])
	ci.draw_polyline(p, color, width, true)


## Скруглённый прямоугольник как многоугольник.
static func round_rect(r: Rect2, rad: float, seg := 3) -> PackedVector2Array:
	rad = minf(rad, minf(r.size.x, r.size.y) * 0.5)
	var pts := PackedVector2Array()
	var c := [Vector2(r.end.x - rad, r.position.y + rad), Vector2(r.end.x - rad, r.end.y - rad),
		Vector2(r.position.x + rad, r.end.y - rad), Vector2(r.position.x + rad, r.position.y + rad)]
	var start := [-PI * 0.5, 0.0, PI * 0.5, PI]
	for k in 4:
		for i in seg + 1:
			var ang: float = start[k] + PI * 0.5 * float(i) / seg
			pts.append(c[k] + Vector2.from_angle(ang) * rad)
	return pts


## Бумажка интерфейса: заливка Бумага, неровный контур, мягкая тень.
static func paper(ci: CanvasItem, r: Rect2, sd := 0, fill := Pal.PAPER, line := Pal.INK, width := 2.0, rad := 10.0) -> void:
	var shadow := round_rect(Rect2(r.position + Vector2(2, 4), r.size), rad)
	ci.draw_colored_polygon(shadow, Pal.alpha(Pal.INK, 0.28))
	var body := round_rect(r, rad)
	ci.draw_colored_polygon(body, fill)
	closed_line(ci, wobble(body, 0.9, 16.0, sd), line, width)


## Мягкое тёплое свечение вокруг формы (кайма деталей игрока).
static func glow(ci: CanvasItem, pts: PackedVector2Array, color: Color, strength := 1.0) -> void:
	var p := pts.duplicate()
	p.append(pts[0])
	ci.draw_polyline(p, Pal.alpha(color, 0.16 * strength), 14.0, true)
	ci.draw_polyline(p, Pal.alpha(color, 0.30 * strength), 8.0, true)
	ci.draw_polyline(p, Pal.alpha(color, 0.85 * strength), 3.5, true)


## Радиальный градиент (белый → прозрачный) для пятен света.
static var _radial: GradientTexture2D


static func radial() -> GradientTexture2D:
	if _radial == null:
		var g := Gradient.new()
		g.set_color(0, Color(1, 1, 1, 1))
		g.set_color(1, Color(1, 1, 1, 0))
		g.add_point(0.45, Color(1, 1, 1, 0.45))
		_radial = GradientTexture2D.new()
		_radial.gradient = g
		_radial.fill = GradientTexture2D.FILL_RADIAL
		_radial.fill_from = Vector2(0.5, 0.5)
		_radial.fill_to = Vector2(1.0, 0.5)
		_radial.width = 128
		_radial.height = 128
	return _radial
