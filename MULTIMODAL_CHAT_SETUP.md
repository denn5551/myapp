# Мультимодальный чат с загрузкой файлов

## Описание

Реализован мультимодальный чат с возможностью загрузки файлов и изображений. Пользователи могут:

- Загружать файлы через drag & drop
- Вставлять скриншоты через Ctrl/Cmd+V
- Отправлять изображения в LLM как `image_url` parts
- Отправлять другие файлы как текстовые ссылки
- Все загрузки сохраняются в базе данных

## Переменные окружения

Добавьте в `.env.local`:

```env
# Storage Configuration
STORAGE_DRIVER=local
UPLOAD_MAX_FILE_MB=20
UPLOAD_MAX_FILES=5

# AWS S3 Configuration (если используете S3)
AWS_S3_BUCKET=
AWS_S3_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE=

# OpenAI Configuration
OPENAI_API_KEY=sk-***

# Thread Configuration
DISABLE_THREAD_REUSE=false
NEXT_PUBLIC_DISABLE_THREAD_REUSE=false
```

## Установленные зависимости

```bash
npm install formidable @aws-sdk/client-s3 openai @prisma/client prisma
```

## Созданные файлы

### Backend
- `lib/storage.ts` - управление загрузкой файлов (local/S3)
- `utils/mime.ts` - утилиты для работы с MIME типами
- `pages/api/upload.ts` - API для загрузки файлов
- `pages/api/chat/[id].ts` - мультимодальный API чата

### Frontend
- `components/chat/ChatInput.tsx` - компонент ввода с поддержкой файлов
- `components/chat/ChatUploader.tsx` - компонент загрузки файлов
- `components/chat/ChatAttachments.tsx` - отображение вложений

### Database
- Обновлен `lib/db.ts` - добавлена таблица `upload_assets`

## Использование

### В существующем чате агента

Компонент `ChatInput` уже интегрирован в `pages/agents/[slug].tsx`:

```tsx
<ChatInput
  threadId={threadId}
  assistantId={id}
  onMessageSent={(ok, newThreadId) => {
    // обработка ответа
  }}
/>
```

### В новом компоненте

```tsx
import ChatInput from '@/components/chat/ChatInput';

<ChatInput
  threadId="optional-thread-id"
  assistantId="assistant-id"
  onMessageSent={(success, newThreadId) => {
    if (success) {
      console.log('Сообщение отправлено', newThreadId);
    }
  }}
/>
```

## Поддерживаемые форматы файлов

- **Изображения**: все типы image/* (передаются как image_url)
- **Текстовые файлы**: .txt, .csv, .json
- **Документы**: .pdf, .doc, .docx
- **Архивы**: .zip

## Структура базы данных

```sql
CREATE TABLE upload_assets (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime TEXT NOT NULL,
  is_image INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### POST /api/upload
Загрузка файлов (multipart/form-data)

**Response:**
```json
{
  "ok": true,
  "files": [
    {
      "id": "uuid",
      "url": "/uploads/2024/08/uuid-filename.jpg",
      "name": "filename.jpg",
      "size": 12345,
      "mime": "image/jpeg",
      "isImage": true
    }
  ]
}
```

### POST /api/chat/[id]
Мультимодальный чат

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "Описание изображения"},
        {"type": "image_url", "image_url": {"url": "https://..."}}
      ]
    }
  ],
  "assistant_id": "optional",
  "thread_id": "optional"
}
```

## Безопасность

- Валидация MIME типов
- Ограничение размера файлов
- Ограничение количества файлов
- Санитизация имен файлов
- UUID для имен файлов

## Доступность (A11y)

- Поддержка клавиатуры (Enter/Space)
- ARIA метки
- Семантические роли
- Поддержка screen readers
