@tool
class_name Items
extends RefCounted
## Справочник деталей, которые ставят в точку (всё, кроме балки и гвоздя): имена, подсказки,
## создание узла и «след» на поле для проверки «можно ли поставить» (ui/builder.gd).

const KINDS: PackedStringArray = ["cube", "wedge", "mandarin", "domino", "trampoline", "pillow", "candle", "fan"]
const TITLE := {
	"beam": "Балка", "nail": "Гвоздь", "cube": "Кубик", "wedge": "Клин", "mandarin": "Мандарин",
	"domino": "Домино", "trampoline": "Батут", "pillow": "Подушка", "candle": "Свеча", "fan": "Фен",
}
const PLURAL := {
	"beam": "Балки", "nail": "Гвозди", "cube": "Кубики", "wedge": "Клинья", "mandarin": "Мандарины",
	"domino": "Костяшки домино", "trampoline": "Батуты", "pillow": "Подушки", "candle": "Свечи", "fan": "Фены",
}
## «Нельзя: задевает …»
const ACCUSATIVE := {
	"cube": "кубик", "wedge": "клин", "mandarin": "мандарин", "domino": "домино", "trampoline": "батут",
	"pillow": "подушку", "candle": "свечу", "fan": "фен",
}
const HINT := {
	"cube": "Коснись поля — там встанет кубик",
	"wedge": "Коснись поля — там встанет клин",
	"mandarin": "Коснись поля — там будет мандарин. На пуске он упадёт",
	"domino": "Коснись полки — там встанет костяшка. Ставь ближе, чем её высота",
	"trampoline": "Коснись поля — там встанет батут",
	"pillow": "Коснись поля — там ляжет подушка",
	"candle": "Свеча встаёт на опору. Пламя пережигает нитку",
	"fan": "Фен подключится к розетке: провод до 6 клеток. Кнопка рядом с феном — поворот",
	"nail": "Коснись точки-клетки своей балки — вобью гвоздь",
}
## Встаёт на опору под собой (домино можно и в воздух — упадёт на пуске; свече опора нужна).
const SETTLE := {"domino": false, "candle": true}
## Кнопка у выделенной детали: отразить или повернуть.
const TURN := {"wedge": "flip", "fan": "turn"}


static func make(t: String) -> Node2D:
	match t:
		"cube": return Cube.new()
		"wedge": return Wedge.new()
		"mandarin": return Mandarin.new()
		"domino": return Domino.new()
		"trampoline": return Trampoline.new()
		"pillow": return Pillow.new()
		"candle": return Candle.new()
		"fan": return Fan.new()
	return null


## Новая деталь в расстановке: точка (привязка 16 px) и настройки по умолчанию.
static func new_item(t: String, p: Vector2) -> Dictionary:
	var it := {"type": t, "pos": Phys.snap16(p)}
	if t == "wedge":
		it["flip"] = false
	if t == "fan":
		it["dir"] = 0
	return it


## Узел из записи расстановки.
static func spawn(it: Dictionary) -> Node2D:
	var t := String(it.get("type", ""))
	var n := make(t)
	if n == null:
		return null
	if n is Item:
		(n as Item).apply(it)
	else:
		n.position = it["pos"]
		if t == "wedge":
			n.set("flipped", bool(it.get("flip", false)))
	return n


## Контур детали на поле (координаты мира) — для проверки и призрака.
static func footprint(it: Dictionary) -> PackedVector2Array:
	var p: Vector2 = it["pos"]
	match String(it.get("type", "")):
		"cube": return Phys.rect_poly(Rect2(p - Vector2(32, 32), Vector2(64, 64)))
		"wedge": return Transform2D(0.0, p) * Wedge.points_for(bool(it.get("flip", false)))
		"mandarin": return Mandarin.footprint(it)
		"domino": return Domino.footprint(it)
		"trampoline": return Trampoline.footprint(it)
		"pillow": return Pillow.footprint(it)
		"candle": return Candle.footprint(it)
		"fan": return Fan.footprint(it)
	return PackedVector2Array()


static func is_strict(t: String) -> bool:
	return t != "wedge"


## Значок в инвентаре: деталь в уменьшенном виде (для балки, гвоздя, кубика и клина — картинки).
static var _icons := {}


static func draw_icon(ci: CanvasItem, t: String, center: Vector2, s: float) -> void:
	var n: Item = _icons.get(t)
	if n == null:
		n = make(t) as Item
		if n == null:
			return
		_icons[t] = n
	ci.draw_set_transform(center, 0.0, Vector2(s, s))
	n.paint(ci)
	ci.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


static func free_icons() -> void:
	for k in _icons:
		(_icons[k] as Node).free()
	_icons.clear()
