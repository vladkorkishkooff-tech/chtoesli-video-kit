# 4. Экспорт в веб

> В прототипе v0.4 пресет уже готов: `09_game/export_presets.cfg` (шаги 1–2 сделаны). Команда сборки и вес — `08_prototype.md`, раздел «Веб-сборка».

1. **Project → Export → Add… → Web**.
2. Настройки:
   - **Thread Support** — выключить: однопоточная сборка совместимее и не требует особых заголовков;
   - **Extensions Support** — выключить: расширения GDExtension не используем.
3. Для Яндекс Игр и других порталов: **HTML → Custom HTML Shell** = `res://addons/playgama_bridge/template/index.html` (см. `05_publish_yandex.md`).
4. **Export Project** → папка `build/web/`, файл `index.html`.
5. Быстрый тест: кнопка запуска в браузере появляется в редакторе рядом с кнопками запуска сцены.

## Размер
- Лимиты: Яндекс — ≤ 100 МБ; CrazyGames — стартовая загрузка ≤ 50 МБ (≤ 20 МБ для главной на телефонах), подробнее — `07_publish_crazygames_vk.md`.
- Считается всё, что лежит в папке сборки. Проверка: `du -sh build/web` (на Windows — «Свойства» папки).
- Основной вес — `index.wasm` (движок) и `index.pck` (графика, звук, видео).
- Для Яндекс Игр — ≤ 100 МБ без сжатия; все видео погрома вместе — ≤ 30 МБ.
- На своём сервере включите gzip или Brotli для `.wasm` и `.pck`: wasm сжимается примерно до четверти.

## Публикация на itch.io
С первого прототипа — закрытый тест: в **Visibility & access** выберите **Restricted** и откройте доступ тестерам (например, ссылка + пароль). Публичная страница — позже.

1. Упакуйте **содержимое** папки `build/web/` в ZIP (`index.html` — в корне архива).
2. На itch.io: Kind of project → **HTML**, загрузите ZIP, отметьте «This file will be played in the browser».
3. Размер окна 1280×720, включите кнопку полноэкранного режима и «Mobile friendly».
4. Галочка «SharedArrayBuffer support» не нужна: без потоков и расширений игра работает и так.

## Ограничения
- На телефонах веб-версия медленнее нативной — для Android лучше отдельная сборка.
- Видео в браузере декодируется процессором — не больше 720p и 30 кадров/с.

## Источники
- https://docs.godotengine.org/en/latest/tutorials/export/exporting_for_web.html
- itch.io, доступ к странице: https://itch.io/docs/creators/access-control
- https://docs.godotengine.org/en/stable/tutorials/animation/playing_videos.html