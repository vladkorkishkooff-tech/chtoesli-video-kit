# 3. Экспорт на Android

## Подготовка (один раз)
1. Установите **OpenJDK 17** (например, Temurin: https://adoptium.net).
2. Установите **Android SDK** — пакеты и версии берите из официальной инструкции для вашей версии Godot (раздел «Download the Android SDK»).
3. В Godot: **Editor → Editor Settings → Export → Android**:
   - **Java SDK Path** — папка, куда установлен OpenJDK 17;
   - **Android SDK Path** — папка SDK (на Windows обычно `%LOCALAPPDATA%\Android\Sdk\`).
4. Начиная с Godot 4.8 (сейчас бета) это можно сделать автоматически: **Project → Setup Android Build…**.

## Пробная сборка на телефон
1. **Project → Export → Add… → Android**.
2. На телефоне включите «Для разработчиков» → «Отладка по USB», подключите кабелем.
3. В правом верхнем углу редактора появится кнопка запуска на устройстве — нажмите.

## Релизная сборка (AAB)
1. **Project → Install Android Build Template…**, затем в пресете Android включите **Gradle Build → Use Gradle Build** и выберите формат **AAB** (для RuStore подойдёт и APK).
2. Создайте релизный ключ (в терминале):
   `keytool -v -genkey -keystore mygame.keystore -alias mygame -keyalg RSA -validity 10000`
   - пароль — только латинские буквы и цифры; пароль хранилища и пароль ключа должны совпадать;
   - ключ подтверждает, что вы автор игры, — храните файл и пароль в двух надёжных местах.
3. В пресете Android, раздел Keystore: **Release** — путь к файлу, **Release User** — alias (`mygame`), **Release Password** — пароль.
4. При экспорте снимите галочку **Export With Debug**.

## RuStore (бесплатно)
1. Зарегистрируйтесь в консоли разработчика RuStore.
2. Создайте приложение, загрузите подписанный APK или AAB, заполните карточку.
3. Отправьте на проверку.
4. Монетизация (платная игра, покупки) — только для ИП и юрлиц.

## Google Play
Разовый взнос $25, принимает только AAB.

## Альтернатива
В Godot-редакторе для Android (на планшете) экспорт работает без OpenJDK и Android SDK.

## Источники
- https://docs.godotengine.org/en/latest/tutorials/export/exporting_for_android.html
- https://www.rustore.ru/help/developers/publishing-and-verifying-apps
- https://www.rustore.ru/help/developers/developer-account