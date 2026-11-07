@tool
class_name Pal
extends RefCounted
## Палитра «Свет» — 03_style/style_guide.md. Новые цвета — только смеси этих девяти.

const INK := Color("#221C1C")         ## Чернила — контуры, текст
const PAPER := Color("#F4F2EB")       ## Бумага — интерфейс
const TERRACOTTA := Color("#C96F45")  ## Терракота — клубок, кубик, главная кнопка
const WARM := Color("#EDC193")        ## Тёплый свет — свет, кайма «можно двигать»
const NIGHT := Color("#495168")       ## Ночь — тени, небо
const DUSK := Color("#655A62")        ## Сумерки — стены, фон
const BLUSH := Color("#E59F90")       ## Румянец — щёки и уши Кота
const OLIVE := Color("#D0C15C")       ## Олива — «успех», начало шкалы злости
const ALARM := Color("#D9553B")       ## Тревога — шкала злости на 4, «нельзя»

# Смеси (производные цвета)
const WOOD := Color("#E2A87C")        ## Тёплый свет 70 % + Терракота 30 %
const WOOD_DARK := Color("#B9805E")
const WOOD_COLD := Color("#9C93A0")   ## балки уровня: дерево + Ночь
const WALL_TOP := Color("#3C4258")
const FLOOR := Color("#3A3340")
const STEEL := Color("#A9AAB4")       ## гвоздь: Бумага + Ночь


static func mix(a: Color, b: Color, t: float) -> Color:
	return a.lerp(b, t)


static func alpha(c: Color, a: float) -> Color:
	return Color(c.r, c.g, c.b, a)
