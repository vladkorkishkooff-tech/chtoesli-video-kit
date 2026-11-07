# Передача: канал «Что если?», эпизод «свет отключат зимой» (состояние v7.1)

Распаковать архив в /data. Пути внутри: chtoesli/…, work/…, shotlog.cjs.
Что читать первым: chtoesli/SKILL.md (как делать ролики), chtoesli/CRAFT.md (правила стиля и ремесла), chtoesli/PROJECT.md (история решений и замечания владельца по версиям, последняя — v7.1).

## Статус
- Последняя сданная версия — v7.1: review/blackout_stil_kanala_v7_1.mp4 (стиль канала) и review/blackout_svetly_v7_1.mp4 (светлый вариант), 56,7 с, −16,04 LUFS, true peak −1,49 dBTP. Видео в архив не входят — они отправлены владельцу в чат. Листы кадров: review/v7_1_8kadrov.jpg, review/v7_1_do_posle.jpg.
- v7.1 исправила два замечания владельца: плед на плечах накрывал кота; у героя были обрезаны локти (подробно — в PROJECT.md, пункт v7.1).
- Открытых задач нет.

## Где что
- Эпизод: chtoesli/studio/ep_blackout_calm_paper.html. По умолчанию рендерится стиль канала, светлый вариант — параметр &look=light.
- Герой: chtoesli/studio/lib/paperhero.js — PH.person (стиль 'sosed'), PH.back (со спины, для общих планов). Позы и ключи описаны в шапке файла.
- Озвучка и тайминги: chtoesli/episodes/blackout_calm/ (voice/*.mp3, timings.json, words.json, script.json, sources.csv).
- Звуки: studio/foley/*.wav, studio/sfx.js. Текстуры: studio/tex (генерирует tools/make_textures.py).
- Инструменты: studio/tools/prender.cjs (кадры → MP4), finish_mix.py (сведение звука и громкость), text_check.cjs (весь ли текст в кадре), shot.cjs (один кадр); /data/shotlog.cjs (несколько кадров с логом консоли).
- Рабочие скрипты: work/full_v71.sh (полный рендер обоих вариантов), work/tmp/tune.cjs + spec_*.js (кадры с вырезкой и замерами в странице), work/tmp/shots.cjs, work/tmp/patch_v71.py (правка v7.1).
- Копии прошлых состояний: studio/data/ (paperhero.v7.js, paperhero.v6.js, ep_blackout_calm_paper.v6.html, *.before_sosed.* и более ранние).

## Как проверять и рендерить (команды из прежнего окружения)
- cd /data/chtoesli/studio; export NODE_PATH=/vercel/sandbox/node_modules PW_CHROMIUM=/usr/local/bin/chromium
- Один кадр: node tools/shot.cjs ep_blackout_calm_paper.html out.png 13.5
- Текст: node tools/text_check.cjs ep_blackout_calm_paper.html → «OK: весь текст в кадре».
- В консоли страницы допустим только 404 favicon.
- Полный рендер: скопировать work/full_v71.sh под новую версию (заменить имена _r_*71 и *_v7_1), запуск: cd /data/work && nohup setsid ./full_vX.sh > /dev/null 2>&1 & ; лог — work/full_vX.log. Около 10 мин на вариант (1701 кадр) плюс сведение. Не использовать pkill -f.
- После рендера: ffprobe, кадры из MP4 (ffmpeg -ss t), оба вида.

## Правила
- Не менять скелет и длины конечностей героя (бедро .24H, голень .23H, плечо .17H, предплечье .16H): под них подогнаны руки у вилки, крана, холодильника, дивана.
- Сюжет, озвучка и тайминг в v6–v7.1 не менялись; правки шли во внешний вид и жесты.
- Проверять оба вида: стиль канала и светлый.
- Фильтр «кипения» линии #inkRough считает свою область по габариту без толщины линий — толстые линии на краю фигуры могут обрезаться. У героя это решено невидимой рамкой bbx (v7.1); для новых персонажей и предметов помнить об этом.

## Другое (не трогать без запроса)
Черновик агента «Morning brief» ждёт подключения Slack, Calendar, Mail: https://app.notion.com/agent/8a44da2ca4764a1a9a3b4e9d358c58e5?wfv=settings — не публиковать, триггеры выключены.

## Пожелания пользователя
Отвечать по-русски, очень кратко и строго правдиво, без выдуманных причин и преувеличений. Писать, что проверено (кадры) и что нет (видео целиком со звуком).
