# 2. Настройка физики

Используем встроенную физику Godot — ничего устанавливать не нужно.

## Настройки проекта
1. **Project → Project Settings** → включите **Advanced Settings**.
2. **Physics → 2D → Physics Engine** = **Default** (это GodotPhysics2D).
3. **Physics → Common → Physics Ticks per Second** = **60**.
4. Если стопки дрожат: **Physics → 2D → Solver → Solver Iterations** — с 16 до 32.
5. Быстрым маленьким телам (клубок, мандарин): **RigidBody2D → Continuous CD = Cast Shape** — чтобы не пролетали сквозь тонкие предметы.
6. Упругость и трение — через **Physics Material Override** у каждого тела; значения — в `02_physics/parts.md`.

## Привязка при установке
Позиция кратна 16 px, поворот — 15°:

```gdscript
func snap(node: Node2D) -> void:
	node.position = node.position.snapped(Vector2(16, 16))
	node.rotation = snappedf(node.rotation, deg_to_rad(15.0))
```

## Каждый пуск — с чистого листа
Физика повторяема, только если старт одинаковый. Поэтому перед пуском уровень создаётся заново из сохранённой расстановки:

```gdscript
# level_runner.gd
@export var level_scene: PackedScene
var layout: Array[Dictionary] = []  # {"scene": "res://parts/spoon.tscn", "pos": Vector2(...), "rot": 0.0}
var level: Node2D

func start_run() -> void:
	if level:
		level.queue_free()
	level = level_scene.instantiate()
	add_child(level)
	for p in layout:
		var part: Node2D = load(p["scene"]).instantiate()
		part.position = p["pos"]
		part.rotation = p["rot"]
		level.get_node("Parts").add_child(part)
	CatMood.start_run()
```

## Тест «Башня»
Стопка из 10 коробок и скалка, которая в неё врежется. 10 пусков подряд — результат должен совпадать. Потом то же самое на телефоне и в веб-сборке.

## Rapier — только если встроенная физика не справится
- Rapier — расширение GDExtension. В вебе ему нужна Extensions Support, а с ней — cross-origin isolation; на Яндекс Играх это не работает.
- Ставить его только в ПК- и Android-сборки — значит проверять все уровни на двух физиках. Не рекомендуем.
- Если всё же решим: Asset Store → **Rapier Physics 2D** → **Physics → 2D → Physics Engine = Rapier2D**; у перетаскиваемых тел включить **Input → Pickable**.

Источник: https://docs.godotengine.org/en/latest/tutorials/export/exporting_for_web.html