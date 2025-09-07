# Тестирование загрузки файлов

## Что уже сделано

✅ **Удалена Prisma**
- Папка `prisma/` удалена
- Зависимости `prisma` и `@prisma/client` удалены из `package.json`
- Все импорты `openDb` исправлены на дефолтные

✅ **Создана таблица UploadAsset**
- Таблица создана в `lib/db.ts` с правильной схемой
- Индекс по `createdAt` создан

✅ **API загрузки файлов**
- `/api/upload` реализован с поддержкой multipart/form-data
- Использует `formidable` для обработки файлов
- Сохраняет файлы в `public/uploads/`
- Записывает метаданные в таблицу `UploadAsset`
- Возвращает объекты с `id`, `url`, `name`, `size`, `mime`, `isImage`

✅ **Фронтенд компоненты**
- `ChatUploader` - drag&drop, Ctrl/Cmd+V, выбор файлов
- `ChatAttachments` - отображение загруженных файлов
- `ChatInput` - интеграция с чатом

✅ **Утилиты**
- `lib/storage.ts` - сохранение файлов локально
- `utils/mime.ts` - определение типа файлов

## Команды для проверки

### 1. Компиляция
```bash
npm run build
```

### 2. Запуск сервера
```bash
npm run dev
```

### 3. Тестирование API

#### GET запрос (должен вернуть ошибку)
```bash
curl -sS http://127.0.0.1:3000/api/upload
```

#### POST запрос с файлом
```bash
curl -sS -F "files[]=@/path/to/picture.png" http://127.0.0.1:3000/api/upload
```

### 4. Проверка в БД
```bash
sqlite3 /ABS/PATH/TO/DB.sqlite 'SELECT id,url,isImage,name,size FROM UploadAsset ORDER BY createdAt DESC LIMIT 5;'
```

### 5. Тестирование фронтенда
1. Откройте `http://127.0.0.1:3000/agents/[slug]`
2. Попробуйте:
   - Drag&drop изображения в поле ввода
   - Ctrl/Cmd+V скриншота
   - Выбор файлов через кнопку
   - Отправку сообщения с вложениями

## Переменные окружения

Создайте файл `.env.local`:
```env
STORAGE_DRIVER=local
UPLOAD_MAX_FILE_MB=20
UPLOAD_MAX_FILES=5
```

## Структура файлов

```
public/uploads/          # Загруженные файлы
├── 2024/
│   └── 12/
│       └── 1234567890_uuid-filename.jpg

lib/
├── db.ts               # SQLite подключение + создание таблицы UploadAsset
├── storage.ts          # Сохранение файлов локально

utils/
└── mime.ts            # Определение типа файлов

components/chat/
├── ChatInput.tsx      # Основной компонент ввода
├── ChatUploader.tsx   # Загрузка файлов
└── ChatAttachments.tsx # Отображение вложений

pages/api/
└── upload.ts          # API загрузки файлов
```

## Ожидаемый результат

1. ✅ `npm run build` проходит без ошибок
2. ✅ API `/api/upload` принимает файлы и возвращает метаданные
3. ✅ Файлы сохраняются в `public/uploads/`
4. ✅ Метаданные записываются в таблицу `UploadAsset`
5. ✅ Фронтенд поддерживает drag&drop и вставку
6. ✅ Вложения отображаются в чате
7. ✅ Сообщения отправляются с вложениями
