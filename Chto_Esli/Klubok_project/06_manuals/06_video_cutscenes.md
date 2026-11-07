# 6. Видео погрома в Godot

> В прототипе v0.4 это уже сделано: `09_game/ui/rage_video.gd` (узлы создаются кодом, без отдельной сцены), ролик `09_game/video/rage_livingroom_tree_01.ogv` (`-q:v 4`, 1,8 МБ, без звуковой дорожки — в аниматике она пустая), зерно — `09_game/fx/grain.gdshader`. Ниже — как это устроено и как добавить свои ролики.

## 1. Конвертация в .ogv
Godot воспроизводит только Ogg Theora (`.ogv`) со звуком Vorbis. Конвертер — бесплатный ffmpeg; берите свежую сборку (в старых бывают ошибки записи Ogg/Theora), на Windows документация Godot советует 32-битную.

```
ffmpeg -i rage_tree.mp4 -vf "scale=-1:720" -r 30 -q:v 5 -q:a 6 -g:v 64 rage_livingroom_tree_01.ogv
```
- `-q:v 5` — качество видео 0–10 (наш баланс веса и качества);
- `-g:v 64` — ключевой кадр каждые 64 кадра;
- `-q:a 6` — качество звука.

## 2. Сцена `RageVideo.tscn`
```
RageVideo (CanvasLayer, layer = 10)
├── Back   (ColorRect, чёрный, на весь экран)
├── Player (VideoStreamPlayer, Expand = вкл., на весь экран)
├── Grain  (ColorRect на весь экран, шейдер ниже)
└── Skip   (Button «Пропустить ›», справа внизу)
```
Добавьте `RageVideo.tscn` в **Autoload**, чтобы вызывать из любого уровня.

## 3. Скрипт
```gdscript
# rage_video.gd
extends CanvasLayer
signal finished

@onready var player: VideoStreamPlayer = $Player
@onready var skip: Button = $Skip
var _done := true

func _ready() -> void:
	visible = false
	player.finished.connect(_finish)
	skip.pressed.connect(_finish)

func play_rage(path: String) -> void:
	_done = false
	player.stream = load(path)
	skip.visible = false
	visible = true
	player.play()
	await get_tree().create_timer(1.0).timeout
	if not _done:
		skip.visible = true  # пропуск — через 1 с

func _unhandled_input(event: InputEvent) -> void:
	if visible and skip.visible and event.is_pressed():
		_finish()  # нажатие в любом месте

func _finish() -> void:
	if _done:
		return
	_done = true
	player.stop()
	visible = false
	finished.emit()
```

## 4. Вызов из уровня
```gdscript
var videos: Array[String] = [
	"res://video/rage_livingroom_tree_01.ogv",
	"res://video/rage_livingroom_tree_02.ogv",
]
var rage_count := 0

func _on_run_finished() -> void:
	if CatMood.is_raging():
		RageVideo.play_rage(videos[rage_count % videos.size()])
		await RageVideo.finished
		rage_count += 1
		CatMood.after_rage()                      # злость = 1
		Bridge.advertisement.show_interstitial()  # естественная пауза
		reset_to_build()                          # ваша функция: назад к сборке
```

## 5. Зерно и виньетка поверх видео
Не «вшивайте» их в ролик — файл станет тяжелее. Шейдер для `Grain`:

```glsl
shader_type canvas_item;
uniform float grain_amount = 0.10;
uniform float vignette_amount = 0.45;

float rand(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void fragment() {
	float n = rand(floor(UV * 640.0) + floor(TIME * 12.0));
	float vig = smoothstep(0.35, 0.85, distance(UV, vec2(0.5))) * vignette_amount;
	COLOR = vec4(0.133, 0.11, 0.11, clamp(vig + n * grain_amount, 0.0, 1.0));
}
```

## 6. Пауза, звук, вес
- Пауза площадки (вкладка, реклама) → `get_tree().paused = true` (`05_publish_yandex.md`). Для надёжности в том же обработчике ставьте `RageVideo.player.paused = is_paused`.
- Звук ролика — на отдельную шину `Video` (свойство `bus`), чтобы громкость регулировалась отдельно.
- Видео декодируется процессором: в вебе и на телефонах — не больше 720p и 30 кадров/с.
- Обычно ролики лежат внутри игры (`res://video/`), их вес входит в лимит 100 МБ. Для CrazyGames — отдельный пакет с догрузкой (раздел 8).

## 7. Проверка
1. Положите `04_mockups/video/rage_livingroom_tree_01.ogv` в `res://video/`.
2. Вызовите `RageVideo.play_rage("res://video/rage_livingroom_tree_01.ogv")`.
3. Проверьте: плавно на телефоне и в веб-сборке; «Пропустить ›» появляется через 1 с; при сворачивании вкладки — пауза.

## 8. Догрузка роликов отдельным пакетом (для CrazyGames)
Нужна, чтобы стартовая загрузка была ≤ 20 МБ. Для Яндекса и VK можно не делать.

1. Основной пресет Web: **Resources → Filters to exclude files/folders** = `video/*`.
2. Второй пресет: **Export Mode = Export selected resources** → отметить папку `video/` → кнопка **Export PCK/ZIP…** → `videos.pck` рядом с `index.html`.
3. После старта игра скачивает пакет и подключает его:

```gdscript
# video_pack.gd — Autoload
extends Node
var loaded := false

func _ready() -> void:
	if ResourceLoader.exists("res://video/rage_livingroom_tree_01.ogv"):
		loaded = true  # ролики уже внутри игры: ПК, Android, Яндекс, VK
		return
	var http := HTTPRequest.new()
	add_child(http)
	http.download_file = "user://videos.pck"
	http.request_completed.connect(_on_done)
	var base := str(JavaScriptBridge.eval("location.origin + location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1)"))
	http.request(base + "videos.pck")

func _on_done(result: int, code: int, _headers: PackedStringArray, _body: PackedByteArray) -> void:
	if result == HTTPRequest.RESULT_SUCCESS and code == 200:
		loaded = ProjectSettings.load_resource_pack("user://videos.pck")
```

4. В `RageVideo.play_rage()`: если `VideoPack.loaded == false` — показать стоп-кадр погрома (картинку) с надписью «Что если?» вместо ролика.

Источники:
- https://docs.godotengine.org/en/stable/tutorials/animation/playing_videos.html
- Пакеты ресурсов: https://docs.godotengine.org/en/stable/tutorials/export/exporting_pcks.html