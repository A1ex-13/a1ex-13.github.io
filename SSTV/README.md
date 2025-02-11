# SSTV Encoder (JavaScript)

[спасибо Sean SheepTester](https://sheeptester.github.io) 

проект позволяет кодировать изображения в SSTV (Slow Scan Television) и воспроизводить звуковой сигнал в браузере.

## 🚀 Запуск
1. Откройте `index.html` в браузере.
2. Выберите изображение.
3. Нажмите "Play" и услышите SSTV-сигнал.

## 📂 Структура проекта
- `index.html` – Главная страница.
- `index.js` – Логика кодирования в SSTV.
- `styles.css` – Стили (по желанию).

## 🔧 Разработка

[MMSSTV](https://hamsoft.ca/pages/mmsstv.php)

[Slow-scan television](https://en.wikipedia.org/wiki/Slow-scan_television)

[RadioClub EIT](https://radio.clubs.etsit.upm.es/blog/2019-08-10-sstv-scottie1-encoder/)

Для реализации SSTV-кодирования нужно добавить:
- Преобразование изображения в строки пикселей.
- Генерацию SSTV-аудиосигнала (например, Scotttie S1).
