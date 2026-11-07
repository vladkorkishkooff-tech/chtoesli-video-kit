@tool
class_name Cat
extends StaticBody2D
## Кот — цель уровня. Поза по злости, всегда в пятне света.
## Клубок коснулся Кота — победа. Громкий удар в зоне слуха — ошибка (+½).

enum Pose { DOZE, CALM, ALERT, SQUINT }

const TEX := {
	Pose.DOZE: preload("res://art/cat/sleep.png"),
	Pose.CALM: preload("res://art/cat/sit.png"),
	Pose.ALERT: preload("res://art/cat/alert.png"),
	Pose.SQUINT: preload("res://art/cat/squint.png"),
}
## Тело для столкновений (ширина × высота) — повторяет силуэт позы.
const BODY := {
	Pose.DOZE: Vector2(196, 74),
	Pose.CALM: Vector2(84, 150),
	Pose.ALERT: Vector2(184, 108),
	Pose.SQUINT: Vector2(80, 140),
}
const SCALE := 0.5
const BOIL := preload("res://fx/boil.gdshader")

## −1 — смотрит влево, 1 — вправо.
@export_enum("Влево:-1", "Вправо:1") var facing: int = -1:
	set(v):
		facing = v
		_apply()
@export var pose: Pose = Pose.CALM:
	set(v):
		pose = v
		_apply()
## Радиус слуха: громкий удар ближе — ошибка.
@export var hearing := 260.0

var body_size := Vector2(84, 150)
var _sprite: Sprite2D
var _shape: CollisionShape2D
var _rect: RectangleShape2D
var _glow: Glow
var _bubble := ""
var _bubble_color := Pal.INK
var _bubble_t := 0.0
var _t := 0.0
var _hop := 0.0
## Только рисунок: наблюдение за клубком и жест лапой не меняют форму столкновения.
var _watch_goal := 0.0
var _watch := 0.0
var _paw_goal := 0.0
var _paw := 0.0
var _flinch := 0.0
var _last_watch_time := -10.0
## Победа — отдельная визуальная сцена после завершения физики, до окна результата.
const CATCH_DURATION := 3.0
var _catch_time := -1.0
var _catch_yarn: Yarn
var _catch_start := Vector2.ZERO
var _catch_target := Vector2.ZERO
var _catch_rotation := 0.0


func _init() -> void:
	_glow = Glow.new()
	_glow.kind = "pool"
	_glow.size = Vector2(300, 80)
	_glow.energy = 0.55
	_glow.position = Vector2(0, -6)
	add_child(_glow, false, Node.INTERNAL_MODE_FRONT)
	_sprite = Sprite2D.new()
	_sprite.scale = Vector2(SCALE, SCALE)
	var sm := ShaderMaterial.new()
	sm.shader = BOIL
	_sprite.material = sm
	add_child(_sprite, false, Node.INTERNAL_MODE_FRONT)
	_rect = RectangleShape2D.new()
	_shape = CollisionShape2D.new()
	_shape.shape = _rect
	add_child(_shape, false, Node.INTERNAL_MODE_FRONT)
	physics_material_override = Phys.material(0.8, 0.0)
	z_index = 2
	add_to_group("solid")
	_apply()


## Поза по лицу шкалы злости: 0 — дремлет, 1 — спокоен, 2 — насторожен, 3 — прищур.
func set_mood_face(face: int) -> void:
	pose = [Pose.DOZE, Pose.CALM, Pose.ALERT, Pose.SQUINT][clampi(face, 0, 3)]


func _apply() -> void:
	if _sprite == null:
		return
	var tex: Texture2D = TEX[pose]
	_sprite.texture = tex
	_sprite.flip_h = facing < 0
	_sprite.position = Vector2(0, -tex.get_height() * SCALE * 0.5)
	body_size = BODY[pose]
	_rect.size = body_size
	_shape.position = Vector2(0, -body_size.y * 0.5)
	queue_redraw()


func body_rect() -> Rect2:
	return Rect2(global_position + Vector2(-body_size.x * 0.5, -body_size.y), body_size)


## Клубок дошёл до Кота.
func reached(yarn: Yarn) -> bool:
	var r := body_rect()
	var p := yarn.global_position
	var q := Vector2(clampf(p.x, r.position.x, r.end.x), clampf(p.y, r.position.y, r.end.y))
	return q.distance_to(p) <= yarn.radius + 8.0


func hears(p: Vector2) -> bool:
	return p.distance_to(global_position + Vector2(0, -body_size.y * 0.5)) <= hearing


func touches(poly: PackedVector2Array) -> bool:
	return Phys.overlap(poly, Phys.rect_poly(body_rect().grow(4.0)))


func hit_test(p: Vector2, pad := 14.0) -> bool:
	return body_rect().grow(pad).has_point(p)


func solid_polys() -> Array:
	return [Phys.rect_poly(body_rect())]


func solid_strict() -> bool:
	return true


func solid_name() -> String:
	return "Кота"


## Облачко над Котом: «мрр», «!», «ш-ш!».
func say(text: String, color := Pal.INK, time := 1.6) -> void:
	_bubble = text
	_bubble_color = color
	_bubble_t = time
	queue_redraw()


func hop() -> void:
	_hop = 1.0


## Просыпается, подтягивает клубок и несколько раз играет лапой. Коллизии и итог уже зафиксированы.
func catch_yarn(yarn: Yarn) -> void:
	_catch_yarn = yarn
	_catch_time = 0.0
	_catch_start = yarn.global_position
	_catch_rotation = yarn.rotation
	_catch_target = global_position + Vector2(facing * (maxf(body_size.x * 0.5, 92.0) + yarn.radius * 0.45), -yarn.radius - 3.0)
	_sprite.texture = TEX[Pose.ALERT] # только рисунок, размер коллизии остаётся прежним
	_watch_goal = 0.0
	_paw_goal = 1.0
	queue_redraw()


## Во время пуска Кот слегка поворачивается к близкому клубку и тянется лапой.
## Это визуальная реакция: она не толкает клубок и не вмешивается в физику.
func watch_yarn(world_pos: Vector2) -> void:
	_last_watch_time = _t
	var offset := world_pos - (global_position + Vector2(0, -body_size.y * 0.35))
	var in_front := offset.x * facing >= -20.0
	var distance := offset.length()
	_watch_goal = clampf(offset.y / 300.0, -1.0, 1.0) * 0.055 if in_front and distance < 350.0 else 0.0
	_paw_goal = clampf((230.0 - distance) / 100.0, 0.0, 1.0) if in_front else 0.0


## Небольшой испуг на ошибке или неудаче; коллизия не двигается.
func startle() -> void:
	_flinch = 1.0


func _process(delta: float) -> void:
	if Engine.is_editor_hint():
		return
	_t += delta
	# В сборке провожает взглядом курсор игрока в комнате
	if _catch_time < 0.0 and _t - _last_watch_time > 0.08:
		var mp := get_global_mouse_position()
		var offset := mp - (global_position + Vector2(0, -body_size.y * 0.35))
		var in_front := offset.x * facing >= -30.0
		var distance := offset.length()
		if in_front and distance < 450.0:
			_watch_goal = clampf(offset.y / 280.0, -1.0, 1.0) * 0.06
			_paw_goal = clampf((180.0 - distance) / 120.0, 0.0, 0.45)
		else:
			_watch_goal = 0.0
			_paw_goal = 0.0
	if _catch_time >= 0.0 and is_instance_valid(_catch_yarn):
		_catch_time = minf(_catch_time + delta, CATCH_DURATION)
		var pull := smoothstep(0.0, 0.65, _catch_time)
		var play := 0.0
		if _catch_time > 0.65 and _catch_time < 2.65:
			play = sin((_catch_time - 0.65) * PI * 2.0) * sin((_catch_time - 0.65) / 2.0 * PI)
		_catch_yarn.global_position = _catch_start.lerp(_catch_target, pull) + Vector2(facing * 20.0 * play, -absf(play) * 7.0)
		_catch_yarn.rotation = _catch_rotation + play * 0.8
		_catch_yarn.visual_thread_follow()
		_paw_goal = 0.65 + 0.35 * absf(play)
		if _catch_time >= CATCH_DURATION:
			_catch_time = -1.0
			_paw_goal = 0.25
	var breathe := 1.0 + 0.012 * sin(_t * 2.3)
	_flinch = maxf(0.0, _flinch - delta * 2.8)
	_watch = lerpf(_watch, _watch_goal, minf(delta * 4.0, 1.0))
	var previous_paw := _paw
	_paw = lerpf(_paw, _paw_goal, minf(delta * 7.0, 1.0))
	_sprite.rotation = _watch + sin(_t * 35.0) * 0.025 * _flinch
	_sprite.scale = Vector2(SCALE * (1.0 + _flinch * 0.04), SCALE * breathe * (1.0 - _flinch * 0.04))
	queue_redraw()
	var lift := 0.0
	if _hop > 0.0:
		_hop = maxf(0.0, _hop - delta * 1.8)
		lift = sin((1.0 - _hop) * PI) * 26.0
	var tex_h := _sprite.texture.get_height() * SCALE
	_sprite.position = Vector2(0, -tex_h * 0.5 * breathe - lift)
	if _bubble_t > 0.0:
		_bubble_t -= delta
		if _bubble_t <= 0.0:
			_bubble = ""
			queue_redraw()


func _draw() -> void:
	# Анимированный хвост: плавно колышется в покое, дергается при настороженности
	var tail_speed := 7.5 if pose >= Pose.ALERT else 2.2
	var tail_wiggle := sin(_t * tail_speed)
	var tb := Vector2(-facing * (body_size.x * 0.35), -10.0)
	var t1 := tb + Vector2(-facing * 18.0, -12.0 + tail_wiggle * 2.5)
	var t2 := t1 + Vector2(-facing * 14.0, -16.0 + tail_wiggle * 6.0)
	var t3 := t2 + Vector2(-facing * 8.0, -20.0 + tail_wiggle * 10.0)
	var tail_pts := PackedVector2Array([tb, t1, t2, t3])
	draw_polyline(tail_pts, Pal.INK, 12.0, true)
	draw_polyline(tail_pts, Color("d49870"), 8.0, true)
	draw_circle(t3, 4.5, Pal.INK)

	if _paw > 0.01:
		# Короткая сгибающаяся лапа у мордочки, без физического воздействия.
		var base := Vector2(facing * (body_size.x * 0.5 - 18.0), -15.0)
		var tip := base + Vector2(facing * (8.0 + 28.0 * _paw), -3.0 - 5.0 * _paw)
		var elbow := base.lerp(tip, 0.52) + Vector2(0, -5.0 * _paw)
		var pts := PackedVector2Array([base, elbow, tip])
		draw_polyline(pts, Pal.INK, 14.0, true)
		draw_polyline(pts, Color("e8b590"), 10.0, true)
		draw_circle(tip, 8.0, Pal.INK)
		draw_circle(tip, 6.2, Pal.PAPER)
		for k in 3:
			draw_line(tip + Vector2((k - 1) * 3.5, 1), tip + Vector2((k - 1) * 3.5, 4), Pal.alpha(Pal.INK, 0.7), 1.0)
	if _bubble == "":
		return
	var font := Fonts.hand()
	var fs := 32
	var top := -body_size.y - 34.0
	var w := font.get_string_size(_bubble, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x + 28.0
	var r := Rect2(Vector2(-w * 0.5 + facing * 34.0, top - 44.0), Vector2(w, 44))
	Ink.paper(self, r, 3, Pal.PAPER, Pal.INK, 2.0, 16.0)
	var tail := r.position + Vector2(r.size.x * 0.5 - facing * 10.0, r.size.y - 1)
	draw_colored_polygon(PackedVector2Array([tail + Vector2(-8, 0), tail + Vector2(8, 0), tail + Vector2(-facing * 14.0, 14)]), Pal.PAPER)
	draw_polyline(PackedVector2Array([tail + Vector2(-8, 0), tail + Vector2(-facing * 14.0, 14), tail + Vector2(8, 0)]), Pal.INK, 2.0, true)
	draw_string(font, r.position + Vector2(14, 32), _bubble, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, _bubble_color)
