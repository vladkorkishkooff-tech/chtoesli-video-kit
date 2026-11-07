# Технологии

| Что | Выбор | Почему |
|---|---|---|
| Движок | Godot 4.7 (стабильная 4.7.2) | бесплатный, лёгкий, сильный в 2D, экспорт на ПК, Android и в веб |
| Язык | GDScript | проще всего для новичка; C# нельзя экспортировать в веб |
| Физика | встроенная Godot Physics 2D | работает на всех площадках, включая Яндекс Игры; одна физика — уровни везде ведут себя одинаково |
| Рендерер | Compatibility | рекомендован для 2D, единственный для веба, лучше всего на слабых телефонах |
| SDK площадок | Playgama Bridge (плагин для Godot 4) | один код для Яндекс Игр, CrazyGames, VK, Одноклассников и других; без площадки работает «заглушка» (`sdk.md`) |
| Видео погрома | `VideoStreamPlayer` + Ogg Theora (.ogv) | единственный формат видео, который Godot воспроизводит сам |
| Видео-прототипы | Remotion (React → MP4) + ffmpeg | быстро собрать аниматик из ключевых кадров (`08_prototypes/`) |
| Графика | Krita или Procreate → PNG | бесплатно / привычно |
| Анимация | Krita, Blender (Grease Pencil) | бесплатно; рисованная и перекладная анимация |
| Хранение | этот ZIP; позже Git + GitHub | история версий |

## Почему не Rapier
Rapier подключается как расширение GDExtension. В веб-экспорте поддержка расширений, как и потоки, требует cross-origin isolation (заголовки COOP/COEP). На Яндекс Играх у Godot 4.2 с таким требованием — ошибка «Cross Origin Isolation / SharedArrayBuffer». Встроить Rapier в сам движок можно только сборкой Godot из исходников — для новичка слишком сложно.

## Альтернатива Playgama Bridge
YandexGamesSDK4Godot (MIT, Godot 4.3+, есть режим-заглушка) — только для Яндекс Игр. Берём, если Bridge чем-то не подойдёт.

## Версии
- Godot 4.8 сейчас в бете (с 15 октября 2026). Переходить — после стабильного выпуска и проверки Playgama Bridge.
- Версии Godot и Playgama Bridge записываем в `CHANGELOG.md`.

## Почему 2D, а не 2.5D
Проще рисовать в стиле «Свет», физика нагляднее, легче для телефонов и веба.

## Источники
- Рендереры Godot: https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html
- Экспорт в веб (расширения и потоки): https://docs.godotengine.org/en/latest/tutorials/export/exporting_for_web.html
- Godot на Яндекс Играх: https://forum.godotengine.org/t/godot-v4-2-for-yandex-games/52996
- Rapier как модуль движка: https://github.com/appsinacup/godot-rapier-physics-module-2d
- Видео в Godot: https://docs.godotengine.org/en/stable/tutorials/animation/playing_videos.html
- Playgama Bridge: https://wiki.playgama.com/playgama/bridge-sdk-v1 · https://github.com/Playgama/bridge-godot-4
- YandexGamesSDK4Godot: https://github.com/ineedmypills/YandexGamesSDK4Godot
- Версии Godot: https://godotawesome.com/godot-versions/