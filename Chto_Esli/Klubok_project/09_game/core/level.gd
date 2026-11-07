@tool
class_name Level
extends Node2D
## Уровень: комната, мебель, балки уровня, клубок, Кот и лимит деталей игрока.
## Детали игрока добавляет LevelRunner в узел Parts — заново перед каждым пуском.

@export var number := 1
@export var level_title := ""
@export var location := "Гостиная"
## Принцип, которому учит уровень (02_physics/physics_pillars.md).
@export var principle := ""
@export_multiline var hint := ""
@export_group("Детали игрока")
@export_range(0, 12) var beams := 0
@export_range(0, 12) var nails := 0
@export_range(0, 12) var cubes := 0
@export_range(0, 12) var wedges := 0
@export_range(0, 12) var mandarins := 0
@export_range(0, 12) var dominoes := 0
@export_range(0, 12) var trampolines := 0
@export_range(0, 12) var pillows := 0
@export_range(0, 12) var candles := 0
@export_range(0, 12) var fans := 0
@export_group("Пуск")
## Длина нитки, px. Кончилась — неудача.
@export var thread_length := 1800.0
## Без результата дольше — неудача.
@export var time_limit := 15.0
## Клубок коснулся пола — сразу неудача (когда Кот наверху).
@export var floor_is_fail := false
@export_group("Проверка")
## Решение для автотеста и клавиши F9 (в отладке):
## [{"type": "beam", "a": Vector2, "step": 1, "cells": 6, "nail": -1}, {"type": "cube", "pos": Vector2}, {"type": "wedge", "pos": Vector2, "flip": false},
##  {"type": "fan", "pos": Vector2, "dir": 0}, {"type": "candle", "pos": Vector2} …] — детали из core/items.gd
@export var solution: Array = []
## Обходные пути, которые выигрывать не должны (автотест): [[деталь, …], [деталь, …]].
## Так проверяем, что уровень не решается «в лоб» меньшим числом деталей.
@export var must_fail: Array = []

var yarn: Yarn
var cat: Cat
var parts: Node2D


func _ready() -> void:
	yarn = get_node_or_null("Yarn") as Yarn
	cat = get_node_or_null("Cat") as Cat
	parts = get_node_or_null("Parts") as Node2D
	if parts == null:
		parts = Node2D.new()
		parts.name = "Parts"
		add_child(parts)
	if yarn != null:
		yarn.thread_length = thread_length


func inventory() -> Dictionary:
	return {
		"beam": beams, "nail": nails, "cube": cubes, "wedge": wedges, "mandarin": mandarins,
		"domino": dominoes, "trampoline": trampolines, "pillow": pillows, "candle": candles, "fan": fans,
	}


## Узлы группы внутри этого уровня.
func nodes_in(group: String) -> Array:
	var out := []
	for n in get_tree().get_nodes_in_group(group):
		if is_ancestor_of(n):
			out.append(n)
	return out


func set_build_view(on: bool) -> void:
	for z in nodes_in("nobuild"):
		(z as Node2D).visible = on


## Ближайшая розетка, либо INF. Длина измеряется по прямой от выхода провода.
func nearest_outlet(from: Vector2) -> Vector2:
	var best := Vector2.INF
	var distance := INF
	for socket in nodes_in("outlet"):
		var p: Vector2 = (socket as Node2D).global_position
		var d := from.distance_to(p)
		if d < distance:
			best = p
			distance = d
	return best
