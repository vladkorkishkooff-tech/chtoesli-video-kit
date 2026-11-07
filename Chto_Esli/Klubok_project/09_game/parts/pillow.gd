@tool
class_name Pillow
extends Item
## Подушка: мягкая — гасит удар. Упавшее на неё не отскакивает (даже мандарин),
## а громкий удар на подушке Кот не слышит.

const W := 128.0
const H := 40.0

var _squash := 0.0


func _setup() -> void:
	kind = "pillow"
	var s := ConvexPolygonShape2D.new()
	s.set_point_cloud(outline())
	_add_shape(s)
	var m := Phys.material(1.0, 1.0)
	m.absorbent = true          # отскок «вычитается»: упругость удара = 0
	physics_material_override = m
	add_to_group("soft")


static func outline() -> PackedVector2Array:
	return Ink.round_rect(Rect2(-W * 0.5, -H * 0.5, W, H), 14.0, 3)


static func footprint(item: Dictionary) -> PackedVector2Array:
	var p: Vector2 = item["pos"]
	return Transform2D(0.0, p) * outline()


func local_poly() -> PackedVector2Array:
	return outline()


## Зона «мягкой посадки»: верх подушки с запасом.
func soft_rect() -> Rect2:
	return Rect2(global_position + Vector2(-W * 0.5 - 6, -H * 0.5 - 40), Vector2(W + 12, 52))


func hit(strength: float) -> void:
	_squash = clampf(0.3 + strength, 0.3, 1.0)


func _process(delta: float) -> void:
	if _squash > 0.0:
		_squash = maxf(0.0, _squash - delta * 3.0)
		queue_redraw()


func paint(ci: CanvasItem) -> void:
	var d := 0.16 * sin(_squash * PI) if _squash > 0.0 else 0.0
	if d > 0.0:          # значок в инвентаре не сплющивается — и не сбивает свой масштаб
		ci.draw_set_transform(Vector2(0, H * 0.5 * d), 0.0, Vector2(1.0 + d * 0.5, 1.0 - d))
	var cloth := Pal.mix(Pal.BLUSH, Pal.DUSK, 0.28)
	var body := outline()
	ci.draw_colored_polygon(body, cloth)
	ci.draw_colored_polygon(Ink.round_rect(Rect2(-W * 0.5 + 6, -H * 0.5 + 4, W - 12, 12), 6.0), Pal.alpha(Pal.PAPER, 0.18))
	var inner := Ink.round_rect(Rect2(-W * 0.5 + 8, -H * 0.5 + 7, W - 16, H - 14), 9.0)
	for i in inner.size():
		ci.draw_dashed_line(inner[i], inner[(i + 1) % inner.size()], Pal.alpha(Pal.INK, 0.35), 1.2, 4.0)
	ci.draw_circle(Vector2.ZERO, 3.0, Pal.mix(cloth, Pal.INK, 0.35))
	for c in [Vector2(-W * 0.5 + 4, -H * 0.5 + 4), Vector2(W * 0.5 - 4, -H * 0.5 + 4), Vector2(-W * 0.5 + 4, H * 0.5 - 4), Vector2(W * 0.5 - 4, H * 0.5 - 4)]:
		ci.draw_circle(c, 3.5, cloth)
		ci.draw_arc(c, 3.5, 0, TAU, 10, Pal.alpha(Pal.INK, 0.7), 1.2, true)
	Ink.closed_line(ci, Ink.wobble(body, 0.6, 12.0, 9), Pal.INK, 2.2)
	if d > 0.0:
		ci.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
