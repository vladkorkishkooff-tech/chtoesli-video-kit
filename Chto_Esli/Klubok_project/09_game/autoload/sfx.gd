extends Node
## Звуки игры — автозагрузка Sfx. Файлы синтезированы `tools/make_sfx.py` (свои, без чужих лицензий).
## Sfx.play("knock"), громкость в дБ поверх базовой, высота тона. Выключить всё — Sfx.muted = true (клавиша M).

const STREAMS := {
	"knock": preload("res://audio/knock.ogg"),
	"knock_heavy": preload("res://audio/knock_heavy.ogg"),
	"thud": preload("res://audio/thud.ogg"),
	"nail": preload("res://audio/nail.ogg"),
	"place": preload("res://audio/place.ogg"),
	"remove": preload("res://audio/remove.ogg"),
	"click": preload("res://audio/click.ogg"),
	"nope": preload("res://audio/nope.ogg"),
	"fail": preload("res://audio/fail.ogg"),
	"win": preload("res://audio/win.ogg"),
	"purr": preload("res://audio/purr.ogg"),
	"hiss": preload("res://audio/hiss.ogg"),
	"pogrom": preload("res://audio/pogrom.ogg"),
	"boing": preload("res://audio/boing.ogg"),
	"burn": preload("res://audio/burn.ogg"),
	"whoosh": preload("res://audio/whoosh.ogg"),
	"tick": preload("res://audio/tick.ogg"),
	"plop": preload("res://audio/plop.ogg"),
}
## Базовая громкость, дБ: интерфейс тише, события громче.
const BASE := {
	"knock": -8.0, "knock_heavy": -6.0, "thud": -5.0, "nail": -9.0, "place": -10.0, "remove": -12.0,
	"click": -14.0, "nope": -10.0, "fail": -7.0, "win": -6.0, "purr": -4.0, "hiss": -7.0, "pogrom": -3.0,
	"boing": -7.0, "burn": -6.0, "whoosh": -10.0, "tick": -9.0, "plop": -8.0,
}
const MUSIC := preload("res://audio/livingroom.ogg")
const VOICES := 10

signal muted_changed(on: bool)
signal music_muted_changed(on: bool)

var muted := false:
	set(v):
		muted = v
		AudioServer.set_bus_mute(0, v)
		muted_changed.emit(v)
## Музыка отключается отдельно от общих звуков и временно ставится на паузу в погроме.
var music_muted := false:
	set(v):
		music_muted = v
		_apply_music_pause()
		music_muted_changed.emit(v)
var music_paused := false
var _music: AudioStreamPlayer
## Последние запрошенные звуки (для автотестов и отладки), не больше 32.
var heard: Array[String] = []
## Без звуковой карты (--headless, драйвер Dummy) звук не играем: только записываем в heard.
var _silent := false
var _pool: Array[AudioStreamPlayer] = []
var _next := 0
var _last := {}


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_silent = AudioServer.get_driver_name() == "Dummy"
	_music = AudioStreamPlayer.new()
	_music.name = "LivingroomMusic"
	var track := MUSIC.duplicate() as AudioStreamOggVorbis
	track.loop = true
	_music.stream = track
	_music.volume_db = -20.0
	add_child(_music)
	_apply_music_pause()
	if not _silent:
		_music.play()
	for i in VOICES:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_pool.append(p)


func set_music_paused(on: bool) -> void:
	music_paused = on
	_apply_music_pause()


func _apply_music_pause() -> void:
	if _music != null:
		_music.stream_paused = music_muted or music_paused


func play(id: String, gain_db := 0.0, pitch := 1.0) -> void:
	if not STREAMS.has(id):
		return
	var now := Time.get_ticks_msec()
	if now - int(_last.get(id, -1000)) < 45:
		return
	_last[id] = now
	heard.append(id)
	if heard.size() > 32:
		heard.pop_front()
	if _silent:
		return
	var p := _pool[_next]
	_next = (_next + 1) % _pool.size()
	p.stream = STREAMS[id]
	p.volume_db = float(BASE.get(id, -8.0)) + gain_db
	p.pitch_scale = pitch
	p.play()


## Заглушить всё, что звучит (перед выходом и в тестах — чтобы не оставались «висящие» воспроизведения).
func stop_all() -> void:
	if _music != null:
		_music.stop()
	for p in _pool:
		p.stop()
		p.stream = null


func _exit_tree() -> void:
	stop_all()
