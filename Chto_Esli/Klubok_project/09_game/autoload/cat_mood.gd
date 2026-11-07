extends Node
## Шкала «Злость Кота» — правила в 01_concept/anger_meter.md. Автозагрузка CatMood.

signal anger_changed(value: float, delta: float, reason: String)

const MAX_ANGER := 4.0
const STATES: PackedStringArray = ["дремлет", "спокоен", "насторожен", "прищур", "бешенство"]

var anger := 0.0
var errors_this_run := 0.0
var petted := false
var rages_this_level := 0


func start_level() -> void:
	anger = 0.0
	petted = false
	errors_this_run = 0.0
	rages_this_level = 0
	anger_changed.emit(anger, 0.0, "")


func start_run() -> void:
	errors_this_run = 0.0


## Неудача: застрял, упал, кончилась нитка, время вышло — +1.
func add_fail(reason: String) -> void:
	_change(1.0, reason)


## Ошибка — +½, но не больше +1 за пуск. Возвращает true, если злость выросла.
func add_error(reason: String) -> bool:
	var d := minf(0.5, 1.0 - errors_this_run)
	if d <= 0.0:
		return false
	errors_this_run += d
	_change(d, reason)
	return true


func can_pet() -> bool:
	return not petted


## Погладить: −½ раз за уровень, пока злость < 3; на «прищуре» Кот кусается: +½.
func pet() -> float:
	if petted:
		return 0.0
	petted = true
	if anger < 3.0:
		var before := anger
		_change(-0.5, "погладили")
		return anger - before
	_change(0.5, "Кот укусил")
	return 0.5


func is_raging() -> bool:
	return anger >= MAX_ANGER


## После видео погрома: предметы на местах, злость = 1.
func after_rage() -> void:
	rages_this_level += 1
	_change(1.0 - anger, "Кот выпустил пар")


## Лицо 0–4: дремлет, спокоен, насторожен, прищур, бешенство.
func face() -> int:
	return clampi(int(floor(anger + 0.001)), 0, 4)


func state_name() -> String:
	return STATES[face()]


## Мурчание за победу: 3 — злость ≤ 1, 2 — ≤ 2,5, иначе 1.
func purrs() -> int:
	if anger <= 1.0:
		return 3
	if anger <= 2.5:
		return 2
	return 1


func _change(d: float, reason: String) -> void:
	anger = clampf(anger + d, 0.0, MAX_ANGER)
	anger_changed.emit(anger, d, reason)
