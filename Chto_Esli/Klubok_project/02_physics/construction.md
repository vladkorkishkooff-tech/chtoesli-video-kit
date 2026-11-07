# Конструктор: простые детали

Основа каждого уровня — четыре простые детали. Из них игрок строит путь для клубка, а бытовые предметы (`parts.md`) добавляют характер.
Макеты: `04_mockups/mockup_06_simple_parts.jpg` (детали), `04_mockups/mockup_07_beam_building.jpg` (рисование балки).

## Детали
| Деталь | Как ставить | Что делает | Принцип для игрока | Как в Godot |
|---|---|---|---|---|
| Балка | провести пальцем от точки к точке сетки | неподвижная доска: наклон, мостик, стенка | «По наклону клубок катится вниз» | `RigidBody2D` с `freeze` (ведёт себя как `StaticBody2D`), прямоугольник 1–6 клеток × 12 px |
| Гвоздь | перетащить на балку → встаёт в ближайшую точку сетки | балка вращается вокруг гвоздя: в середине — качели и рычаг, с краю — маятник | «Гвоздь в середине — качели, с краю — маятник» | `freeze = false` + `PinJoint2D` к опоре уровня |
| Кубик | перетащить из инвентаря | свободный: падает и толкает, опора, груз для качелей, стопки | «Тяжёлое давит и толкает» | `RigidBody2D`, квадрат 1×1 клетка |
| Клин | перетащить; кнопка ↔ — отразить | неподвижный: плавный въезд, трамплин, упор | «Клин — мягкий въезд и трамплин» | `StaticBody2D`, прямоугольный треугольник 2×1 клетки |

## Правила
- **Сетка:** клетка — 64 px. Видна только во время сборки (точки), во время пуска скрыта.
- **Балка:** начало — в точке сетки; длина — целое число клеток, от 1 до 6; угол — через 15°. Пока ведёшь пальцем, виден пунктирный «призрак» и подпись «30° · 4 клетки».
- **Правка:** нажал на свою балку — на концах появляются ручки, их можно тянуть; кнопка «×» убирает балку обратно в инвентарь. Во время сборки всё бесплатно — злость не растёт.
- **Гвоздь:** один на балку. Нажал на гвоздь — вынул.
- **Кубик и клин:** привязка 16 px, как у бытовых предметов (`06_manuals/02_physics_setup.md`).
- **Нельзя:** балкой пересекать предметы, мебель, клубок и Кота — «призрак» сереет, пунктир и подпись «почему» — Терракота, балка не ставится. Касаться концами можно. «Тревогу» здесь не используем: по стайлгайду (правило 3) она только у ключевого предмета и у шкалы злости на 4.
- **Зоны запрета:** заштрихованные места, где строить нельзя, — чтобы уровень не решался одной балкой «от клубка до Кота».
- **Количество деталей ограничено уровнем**, например: Балка ×3, Гвоздь ×1, Кубик ×2, Клин ×1. Мало деталей — головоломка, много — песочница.
- **Балки уровня** (поставил дизайнер) — холодного цвета, их не изменить. Балки игрока — с тёплой каймой #EDC193.

## Физика деталей
| Деталь | Размер | Масса | Трение | Упругость |
|---|---|---|---|---|
| Балка | 1–6 клеток × 12 px | без гвоздя — неподвижна; с гвоздём — 0,5 на клетку | 0,6 | 0,1 |
| Кубик | 64 × 64 px | 1 | 0,7 | 0,05 |
| Клин | 128 × 64 px, уклон ≈ 27° | неподвижен | 0,5 | 0,1 |

Если качели переворачиваются — ограничить наклон: у `PinJoint2D` включить **Angular Limit** (например, от −30° до +30°).

## Как в Godot

### Балка — `res://parts/beam.tscn`
```
Beam  (RigidBody2D, скрипт beam.gd)
├── Shape (CollisionShape2D)
├── Art   (NinePatchRect — картинка доски; края не растягиваются)
└── Nail  (Sprite2D — шляпка гвоздя)
```

```gdscript
# beam.gd
class_name Beam
extends RigidBody2D

const CELL := 64.0
const THICKNESS := 12.0
const MASS_PER_CELL := 0.5

@export_range(1, 6) var cells := 2:
	set(value):
		cells = value
		if is_node_ready():
			_rebuild()

@export var nail_cell := -1:  # -1 — без гвоздя; 0…cells — точка сетки на балке
	set(value):
		nail_cell = value
		if is_node_ready():
			_rebuild()

@onready var shape: CollisionShape2D = $Shape
@onready var art: NinePatchRect = $Art
@onready var nail: Sprite2D = $Nail

func _ready() -> void:
	freeze_mode = RigidBody2D.FREEZE_MODE_STATIC
	freeze = true  # без гвоздя балка неподвижна
	_rebuild()

func _rebuild() -> void:
	var length := cells * CELL
	var rect := RectangleShape2D.new()  # новая форма: общая поменяла бы длину всем балкам сразу
	rect.size = Vector2(length, THICKNESS)
	shape.shape = rect
	art.size = Vector2(length, THICKNESS)
	art.position = -art.size / 2.0
	nail.visible = nail_cell >= 0
	nail.position = nail_point()

func nail_point() -> Vector2:  # точка гвоздя в координатах балки
	return Vector2((nail_cell - cells / 2.0) * CELL, 0.0)

# В начале пуска: с гвоздём балка становится подвижной и вращается вокруг него.
func activate(anchor: PhysicsBody2D) -> void:
	if nail_cell < 0:
		return
	mass = cells * MASS_PER_CELL
	freeze = false
	var pin := PinJoint2D.new()
	get_parent().add_child(pin)
	pin.global_position = to_global(nail_point())  # сначала место гвоздя…
	pin.node_a = pin.get_path_to(anchor)           # …потом тела
	pin.node_b = pin.get_path_to(self)
```

`Anchor` — пустой `StaticBody2D` без формы в сцене каждого уровня: к нему «прибиты» все гвозди.

### Рисование — `beam_builder.gd`
Узел `Node2D` в сцене уровня, позиция (0, 0); внутри — `Ghost` (`Line2D` с пунктирной текстурой).
Касания приходят как мышь: **Project Settings → Input Devices → Pointing → Emulate Mouse From Touch** (включено по умолчанию).

```gdscript
# beam_builder.gd
extends Node2D
signal beam_drawn(part: Dictionary)  # level_runner добавляет part в расстановку

const CELL := 64.0
const ANGLE_STEP := PI / 12.0  # 15°

@export var beams_left := 3  # сколько балок даёт уровень
@export var max_cells := 6
@onready var ghost: Line2D = $Ghost
var start := Vector2.ZERO
var drawing := false

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed and beams_left > 0:
			start = get_global_mouse_position().snapped(Vector2(CELL, CELL))
			drawing = true
		elif not event.pressed and drawing:
			drawing = false
			ghost.clear_points()
			if start.distance_to(get_global_mouse_position()) > CELL * 0.5:  # простое касание — не балка
				_place(start, _end_point())
	elif event is InputEventMouseMotion and drawing:
		ghost.points = PackedVector2Array([start, _end_point()])

func _end_point() -> Vector2:
	var v := get_global_mouse_position() - start
	var n := clampi(roundi(v.length() / CELL), 1, max_cells)
	return start + Vector2.from_angle(snappedf(v.angle(), ANGLE_STEP)) * n * CELL

func _place(a: Vector2, b: Vector2) -> void:
	beams_left -= 1
	beam_drawn.emit({
		"scene": "res://parts/beam.tscn",
		"pos": (a + b) / 2.0,
		"rot": (b - a).angle(),
		"cells": roundi(a.distance_to(b) / CELL),
		"nail": -1,
	})
```

Проверка «нельзя пересекать»: перед `_place` — `get_world_2d().direct_space_state.intersect_shape()` с прямоугольником балки, укороченным на 8 px (чтобы концы могли касаться). Есть пересечение — «призрак» красный, балку не ставим.

### Пуск — дополнение к `level_runner.gd`
Расстановка из `06_manuals/02_physics_setup.md`; у балки в записи ещё `"cells"` и `"nail"`.

```gdscript
	for p in layout:
		var part: Node2D = load(p["scene"]).instantiate()
		if part is Beam:
			part.cells = p["cells"]
			part.nail_cell = p["nail"]
		part.position = p["pos"]
		part.rotation = p["rot"]
		level.get_node("Parts").add_child(part)
	for part in level.get_node("Parts").get_children():
		if part is Beam:
			part.activate(level.get_node("Anchor"))  # вбить гвозди
	CatMood.start_run()
```

### Клин — `wedge.gd`
Отражать — заменой точек формы, а не отрицательным `scale`: физические тела в Godot плохо работают с масштабом.

```gdscript
# wedge.gd — StaticBody2D, внутри Shape (CollisionPolygon2D) и Art (Sprite2D)
extends StaticBody2D
@export var flipped := false

func _ready() -> void:
	var pts := PackedVector2Array([Vector2(-64, 32), Vector2(64, 32), Vector2(64, -32)])  # подъём вправо
	if flipped:
		for i in pts.size():
			pts[i] = Vector2(-pts[i].x, pts[i].y)
	$Shape.polygon = pts
	$Art.flip_h = flipped
```

## Проверка
1. Нарисовать балку под 30° на 4 клетки — клубок скатывается, результат 10 из 10.
2. Балка с гвоздём в середине + кубик на край — качели подбрасывают клубок одинаково при каждом пуске.
3. Клубок не цепляется на стыке двух балок. Если цепляется — скруглить концы (`CapsuleShape2D` вместо прямоугольника).
4. На телефоне балка рисуется пальцем, «призрак» не прячется под пальцем (кольцо касания — `mockup_07`).

## Как сделано в прототипе v0.4 (`09_game/`)
Правила выше работают в игре; ниже — точные числа и места, где прототип уточнил план.

| Что | В прототипе | Файл |
|---|---|---|
| Сетка | 64 px, точки видны только в сборке; кубик и клин — шаг 16 px | `core/phys.gd` |
| Балка | капсула 12 px со скруглёнными концами (клубок не цепляется на стыках, п. 3 «Проверки»), 1–6 клеток, 24 направления через 15° | `parts/beam.gd` |
| Балка с гвоздём | `RigidBody2D`, 0,5 на клетку, `PinJoint2D` к неподвижному якорю; без гвоздя — `freeze` | `parts/beam.gd` |
| «Нельзя» | сердцевина балки (без 8 px на концах) не заходит в мебель и балки уровня — касаться концами можно; клубок, Кот, кубик, клин и зоны запрета — строго | `ui/builder.gd` |
| Клин | 128 × 64 px, уклон ≈ 27°, «↔» — отразить (клавиша F) | `parts/wedge.gd` |
| Кубик | 64 × 64 px, масса 1, трение 0,7, упругость 0,05 | `parts/cube.gd` |
| Клубок | радиус 26 px, к концу нитки худеет до 65 %; масса 0,4; непрерывная проверка столкновений; нитка 1800 px (в песочнице 3000) | `parts/yarn.gd` |
| Пуск | уровень создаётся заново из расстановки **в новом физическом пространстве** и стартует в начале кадра физики — повторы совпадают бит в бит | `core/runner.gd` |
| Победа | клубок коснулся Кота (зазор ≤ 8 px) | `parts/cat.gd` |
| Неудачи (+1) | «Клубок упал», «Клубок упал на пол» (там, где пол — проигрыш), «Кончилась нитка», «Клубок застрял» (стоит 1,25 с и всё замерло; или стоит 5 с; или ползёт < 8 px за 4 с), «Время вышло» (15 с, в песочнице 20 с) | `core/runner.gd` |
| Ошибки (+½) | «Громкий удар рядом с Котом» — кубик резко теряет > 380 px/с в 260 px от Кота; «Кубик попал в Кота» | `core/runner.gd` |

Повторяемость проверяет автотест `09_game/tests/test_runner.tscn` на решениях уровней 1–4: 10 побед из 10, все пуски совпадают бит в бит, при любой позе Кота (`06_manuals/08_prototype.md`). Качели (п. 2 «Проверки») — пока без уровня и без теста; рисование пальцем на телефоне (п. 4) — ещё не проверяли.

## Источники
- RigidBody2D, режим `freeze`: https://docs.godotengine.org/en/stable/classes/class_rigidbody2d.html
- PinJoint2D: https://docs.godotengine.org/en/stable/classes/class_pinjoint2d.html
- Ввод с касаний: https://docs.godotengine.org/en/stable/tutorials/inputs/input_examples.html
