@tool
class_name Hanger
extends Node2D
## Подарок на нитке — деталь уровня. Крючок — в точке узла, подарок висит на length px ниже.
## На пуске нитка держит подарок (PinJoint2D у крючка): его можно раскачать. Свеча пережгла нитку — подарок падает.

@export var length := 140.0:
	set(v):
		length = v
		_place()

var gift: Gift
var anchor: StaticBody2D
var joint: PinJoint2D
var burnt := false
var heat := 0
var hot := false              ## в сборке: пламя свечи уже касается нитки
var _burn_fx := 0.0
var _burn_at := Vector2.ZERO


func _ready() -> void:
	add_to_group("hanger")
	gift = Gift.new()
	gift.name = "Gift"
	add_child(gift)
	_place()


func _place() -> void:
	if gift != null:
		gift.position = Vector2(0, length + Gift.S.y * 0.5)
	queue_redraw()


func activate() -> void:
	anchor = StaticBody2D.new()
	anchor.name = "Hook"
	add_child(anchor)
	joint = PinJoint2D.new()
	joint.name = "Thread"
	joint.disable_collision = true
	joint.node_a = NodePath("../Gift")
	joint.node_b = NodePath("../Hook")
	add_child(joint)
	gift.freeze = false


func thread_a() -> Vector2:
	return global_position


func thread_b() -> Vector2:
	return gift.tie_point() if gift != null else global_position + Vector2(0, length)


## Нитка перегорела: подарок свободен.
func burn(at: Vector2) -> void:
	if burnt:
		return
	burnt = true
	_burn_fx = 1.0
	_burn_at = to_local(at)
	if joint != null:
		remove_child(joint)
		joint.free()
		joint = null
	queue_redraw()


func _process(delta: float) -> void:
	if _burn_fx > 0.0:
		_burn_fx = maxf(0.0, _burn_fx - delta / 1.2)
	queue_redraw()


func _draw() -> void:
	var hook := Vector2.ZERO
	var tie := to_local(thread_b())
	var thread := Pal.mix(Pal.PAPER, Pal.WARM, 0.25)
	if not burnt:
		if hot:
			draw_line(hook, tie, Pal.alpha(Pal.WARM, 0.45), 7.0, true)
		draw_line(hook, tie, thread, 2.0, true)
		if heat > 0:
			var k := clampf(float(heat) / Candle.BURN_FRAMES, 0.0, 1.0)
			draw_line(hook, tie, Pal.alpha(Pal.TERRACOTTA, k), 2.6, true)
	else:
		var cut := _burn_at
		var up := cut.y - hook.y
		draw_line(hook, hook + Vector2(0, clampf(up, 6.0, 18.0)), thread, 2.0, true)
		draw_circle(hook + Vector2(0, clampf(up, 6.0, 18.0)), 2.0, Pal.INK)
		draw_line(tie, tie + (cut - tie).normalized() * 10.0, thread, 2.0, true)
		if _burn_fx > 0.0:
			for i in 3:
				var ph := fmod((1.0 - _burn_fx) * 1.4 + i * 0.3, 1.0)
				draw_circle(cut + Vector2(sin(ph * 5.0 + i) * 4.0, -ph * 34.0), 3.0 + ph * 6.0, Pal.alpha(Pal.STEEL, (1.0 - ph) * 0.6 * _burn_fx))
	# крючок
	draw_arc(hook + Vector2(0, -6), 6.0, -PI * 0.1, PI * 1.1, 10, Pal.STEEL, 2.5, true)
	draw_circle(hook + Vector2(0, -13), 3.0, Pal.STEEL)
