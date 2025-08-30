# Файлы для загрузки на сервер

## Новые файлы для создания:

### Backend API
- `lib/storage.ts` - управление загрузкой файлов
- `utils/mime.ts` - утилиты для MIME типов
- `pages/api/upload.ts` - API загрузки файлов
- `pages/api/chat/[id].ts` - мультимодальный API чата

### Frontend компоненты
- `components/chat/ChatInput.tsx` - компонент ввода с файлами
- `components/chat/ChatUploader.tsx` - загрузчик файлов
- `components/chat/ChatAttachments.tsx` - отображение вложений

### Документация
- `MULTIMODAL_CHAT_SETUP.md` - инструкции по настройке

## Файлы для обновления:

### Backend
- `lib/db.ts` - добавить таблицу upload_assets
- `package.json` - добавить зависимости
- `package-lock.json` - обновить зависимости

### Frontend
- `pages/agents/[slug].tsx` - интегрировать ChatInput

## Команды для установки на сервере:

```bash
# Установить зависимости
npm install formidable @aws-sdk/client-s3 openai @prisma/client prisma

# Создать папки
mkdir -p public/uploads
mkdir -p components/chat
mkdir -p utils

# Перезапустить приложение
npm run dev
```

## Переменные окружения для .env.local:

```env
STORAGE_DRIVER=local
UPLOAD_MAX_FILE_MB=20
UPLOAD_MAX_FILES=5
OPENAI_API_KEY=sk-***
DISABLE_THREAD_REUSE=false
NEXT_PUBLIC_DISABLE_THREAD_REUSE=false
```

## Структура папок:

```
myapp/
├── lib/
│   ├── db.ts (обновить)
│   └── storage.ts (новый)
├── utils/
│   └── mime.ts (новый)
├── pages/
│   ├── api/
│   │   ├── upload.ts (новый)
│   │   └── chat/
│   │       └── [id].ts (новый)
│   └── agents/
│       └── [slug].tsx (обновить)
├── components/
│   └── chat/ (новая папка)
│       ├── ChatInput.tsx
│       ├── ChatUploader.tsx
│       └── ChatAttachments.tsx
├── public/
│   └── uploads/ (новая папка)
└── MULTIMODAL_CHAT_SETUP.md (новый)
```
