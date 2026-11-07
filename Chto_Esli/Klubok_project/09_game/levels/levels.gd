class_name Levels
extends RefCounted
## Порядок уровней. Гостиная: знакомство с деталями и их комбинациями.

const LIST: PackedStringArray = [
	"res://levels/level_01.tscn",
	"res://levels/level_02.tscn",
	"res://levels/level_03.tscn",
	"res://levels/level_04.tscn",
	"res://levels/level_05.tscn",
	"res://levels/level_06.tscn",
	"res://levels/level_07.tscn",
	"res://levels/level_08.tscn",
	"res://levels/level_09.tscn",
	"res://levels/level_10.tscn",
	"res://levels/level_11.tscn",
	"res://levels/level_12.tscn",
	"res://levels/sandbox.tscn",
]


static func scene(i: int) -> PackedScene:
	return load(LIST[clampi(i, 0, LIST.size() - 1)]) as PackedScene


static func count() -> int:
	return LIST.size()


## Номер, название, локация и принцип уровня — без создания сцены (из SceneState корня).
static func info(i: int) -> Dictionary:
	var out := {"number": i + 1, "title": "", "location": "Гостиная", "principle": ""}
	var ps := scene(i)
	if ps == null:
		return out
	var st := ps.get_state()
	var keys := {"number": "number", "level_title": "title", "location": "location", "principle": "principle"}
	for j in st.get_node_property_count(0):
		var n := String(st.get_node_property_name(0, j))
		if keys.has(n):
			out[keys[n]] = st.get_node_property_value(0, j)
	return out
