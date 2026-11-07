# SDK — что это и зачем

## Простыми словами
SDK («набор разработчика», Software Development Kit) — готовый код от площадки. Его встраивают в игру, чтобы игра могла «разговаривать» с сайтом, на котором её запустили.

| Что игра делает через SDK | Пример в «Клубке» |
|---|---|
| сообщает «я загрузилась, можно играть» | сигнал `game_ready` (Яндекс требует) |
| показывает рекламу — площадка платит за показы | между локациями; за просмотр — подсказка-призрак |
| сохраняет прогресс в аккаунте игрока | пройденные уровни, «мурчики», альбом «Что если?» |
| узнаёт язык игрока | русский или английский сразу, без меню |
| ставит игру на паузу | игрок переключил вкладку или началась реклама |

Без SDK площадка не знает, что происходит в игре: Яндекс и VK такую игру не примут, CrazyGames пустит только на первый этап и без денег.

## У каждой площадки — свой SDK
| Площадка | SDK | Нужен? |
|---|---|---|
| Яндекс Игры | Yandex Games SDK | да, без него не опубликовать |
| VK Игры, Одноклассники | VK Bridge | да: подключён и инициализирован (правило 2.2.1) |
| CrazyGames | CrazyGames SDK | для Full Launch; на Basic Launch — нет |
| itch.io | — | нет |
| Poki, Playgama и другие | у каждой свой | да |

## Наше решение — Playgama Bridge
Писать код под каждый SDK отдельно — долго. **Playgama Bridge** — бесплатный плагин для Godot: код пишем один раз (`Bridge.…`), а Bridge сам подключает SDK той площадки, где запущена игра.

```
               ┌→ Яндекс Игры → Yandex Games SDK
Игра → Bridge ─┼→ VK и ОК     → VK Bridge
               └→ CrazyGames  → CrazyGames SDK
```

- Поддерживает 25 площадок, среди них `yandex`, `crazy_games`, `vk`, `ok`, `poki`, `playgama`, `y8`.
- В редакторе Godot работает «заглушкой»: реклама не показывается, методы отвечают безопасно — игру можно делать и проверять сразу. На itch.io SDK не нужен — проверить на первом тесте, что игра там работает так же, как в редакторе.
- Установка — `06_manuals/05_publish_yandex.md`, раздел 2.

## Что Bridge делает в «Клубке»
| Вызов | Когда | Зачем |
|---|---|---|
| `Bridge.platform.language` | старт | язык игры |
| `Bridge.platform.is_audio_enabled`, сигнал `audio_state_changed` | старт и дальше | выключить звук, когда просит площадка |
| сигнал `pause_state_changed` | вкладка неактивна, реклама | пауза физики и видео |
| `Bridge.storage` | старт, уровень пройден | прогресс |
| `send_message("game_ready")` | виден первый игровой кадр | обязательно для Яндекса |
| `send_message("level_started")`, `"level_completed"` | начало уровня, победа | эти сигналы принимают Яндекс, CrazyGames и Poki |
| `Bridge.advertisement.show_interstitial()` | между локациями, после видео погрома | реклама |
| `Bridge.advertisement.show_rewarded()` | кнопка «Подсказка» | реклама за награду |
| `Bridge.platform.id` | старт | особенности площадки: например, на CrazyGames — сразу в игру, без титульного экрана |

```gdscript
# дополнение к game.gd из 06_manuals/05_publish_yandex.md
func start_level() -> void:
	Bridge.platform.send_message("level_started")  # CrazyGames: здесь заканчивается «стартовая загрузка»

func on_win() -> void:
	Bridge.platform.send_message("level_completed")
```

CrazyGames меряет стартовую загрузку от начала загрузки до первого сигнала начала игры. Что этим сигналом служит `level_started` — проверить в QA-инструменте CrazyGames.

## Источники
- Playgama Bridge, Platform (площадки, сообщения): https://wiki.playgama.com/playgama/bridge-sdk/api/platform
- Playgama Bridge для Godot 4: https://github.com/Playgama/bridge-godot-4
- Yandex Games SDK: https://yandex.com/dev/games/doc/en/sdk
- VK Bridge: https://dev.vk.ru/ru/games/getting-started
- Правила VK Mini Apps (2.2.1): https://dev.vk.ru/ru/mini-apps-rules
- CrazyGames, требования Basic и Full: https://docs.crazygames.com/requirements/intro/
- CrazyGames, стартовая загрузка: https://docs.crazygames.com/requirements/technical/
