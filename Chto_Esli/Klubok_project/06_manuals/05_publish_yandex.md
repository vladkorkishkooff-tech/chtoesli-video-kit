# 5. Публикация на Яндекс Играх

## 1. Аккаунт (один раз)
1. Войдите с Яндекс ID в консоль разработчика Яндекс Игр (ссылка — в документации: https://yandex.ru/dev/games).
2. Примите договор. Публикация бесплатная.
3. Условия выплат за рекламу — в договоре. Заранее решите, на кого регистрироваться (`07_plan/open_questions.md`).

## 2. Playgama Bridge (один раз)
1. Скачайте последний релиз `playgama_bridge.zip`: https://github.com/Playgama/bridge-godot-4/releases
2. Распакуйте в папку `addons` проекта → получится `res://addons/playgama_bridge/`.
3. **Project → Project Settings → Plugins** → включите Playgama Bridge.
4. **Project Settings → Globals → Autoload**: поднимите `Bridge` на первое место.
5. В пресете Web: **HTML → Custom HTML Shell** = `res://addons/playgama_bridge/template/index.html`.
6. В редакторе (без площадки) Bridge работает как «заглушка»: методы возвращают безопасные значения — можно разрабатывать сразу.

## 3. Обязательный код
```gdscript
# game.gd — главная сцена
func _ready() -> void:
	Bridge.platform.connect("pause_state_changed", Callable(self, "_on_pause"))
	Bridge.platform.connect("audio_state_changed", Callable(self, "_on_audio"))
	Bridge.advertisement.connect("rewarded_state_changed", Callable(self, "_on_rewarded"))
	_on_audio(Bridge.platform.is_audio_enabled)
	var lang: String = Bridge.platform.language  # "ru", "en"… → TranslationServer.set_locale(lang)
	# загрузить прогресс через Bridge.storage → показать первый игровой экран
	Bridge.platform.send_message("game_ready")  # только когда уже можно играть

func _on_pause(is_paused: bool) -> void:  # вкладка неактивна, реклама
	get_tree().paused = is_paused

func _on_audio(is_enabled: bool) -> void:
	AudioServer.set_bus_mute(0, not is_enabled)

# Межстраничная реклама — в естественных паузах: между локациями, после видео погрома.
# Частоту решает Bridge (по умолчанию не чаще раза в 60 с) — свои таймеры не нужны.
func on_location_finished() -> void:
	Bridge.advertisement.show_interstitial()

# Подсказка-призрак за просмотр рекламы
func ask_hint() -> void:
	Bridge.advertisement.show_rewarded()

func _on_rewarded(state: String) -> void:
	if state == "rewarded":
		show_ghost_hint()  # ваша функция
```

- Прогресс — только через `Bridge.storage`, не через свои файлы: читать все ключи одним вызовом при старте, записывать при важных изменениях (уровень пройден). Точный код — wiki Playgama, раздел Storage: у версий v1 и v2 он отличается.
- Пауза дерева сцен останавливает и физику, и видео погрома.
- Сигналы уровня (`level_started`, `level_completed`) и что Bridge делает на других площадках — `05_stack/sdk.md`.

## 4. Экспорт
1. Пресет Web (`04_export_web.md`): Thread Support и Extensions Support выключены, Custom HTML Shell — от Bridge.
2. Экспорт в `build/yandex/`.
3. Проверьте: `index.html` в корне; имена файлов — латиница без пробелов; общий размер ≤ 100 МБ.
4. Упакуйте **содержимое** папки в ZIP.

## 5. Черновик и модерация
1. В консоли создайте новую игру и загрузите ZIP в черновик.
2. Откройте черновик и проверьте на ПК и телефоне по чек-листу ниже.
3. Заполните карточку: описание, иконка, обложка, скриншоты, языки (размеры — подсказки в консоли).
4. Отправьте на модерацию. Новые версии — тем же путём; концепцию игры менять нельзя (1.24).

## Чек-лист перед модерацией
- [ ] Играть можно без входа в аккаунт; прогресс сохраняется (1.2.2).
- [ ] Вкладка неактивна — звук выключен, игра и видео на паузе (1.3).
- [ ] Телефон: полный экран, всё управление пальцем (1.6.1.1, 1.6.1.5).
- [ ] Реклама подключена: межстраничная — между локациями и после видео погрома; за просмотр — подсказка-призрак (1.12, 4.1).
- [ ] Во время рекламы — пауза игры и звука (4.7).
- [ ] Поворот экрана, сворачивание, реклама — без ошибок (1.14). В портретной ориентации — экран «Поверните телефон».
- [ ] `game_ready` отправляется, когда виден первый игровой кадр (1.19.2).
- [ ] Все файлы ≤ 100 МБ без сжатия (1.21); `index.html` в корне, имена латиницей без пробелов (1.22).
- [ ] Нет интерактивного ИИ; ИИ-материалы, если есть, — заранее сгенерированные (1.23).
- [ ] Язык — автоматически через SDK (2.14): русский и английский.

## Альтернатива Bridge
YandexGamesSDK4Godot (Godot 4.3+, MIT) — только Яндекс, есть режим-заглушка. Локальная проверка SDK — утилита Яндекса `@yandex-games/sdk-dev-proxy` (запуск через `npx`).

## Источники
- Добавление игры: https://yandex.com/dev/games/doc/en/console/add-new-game.md
- SDK: https://yandex.com/dev/games/doc/en/sdk
- Требования: https://yandex.ru/dev/games/doc/ru/concepts/requirements.md
- Playgama Bridge: https://wiki.playgama.com/playgama/bridge-sdk-v1 · https://github.com/Playgama/bridge-godot-4
- API Bridge (Platform, Interstitial, Rewarded): https://wiki.playgama.com/playgama/bridge-sdk/api
- YandexGamesSDK4Godot: https://github.com/ineedmypills/YandexGamesSDK4Godot