-- insert_agents.sql

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- Генерируем числа от 1 до 97
WITH RECURSIVE
  seq(n) AS (
    SELECT 1
    UNION ALL
    SELECT n+1 FROM seq WHERE n<97
  )
INSERT INTO agents (name, category_id, openai_id, short_desc, full_desc)
SELECT
  -- Имя: Агент 1 … Агент 97
  'Агент ' || n,
  -- Выбираем случайную категорию из уже существующих
  (SELECT id FROM categories ORDER BY RANDOM() LIMIT 1),
  -- Генерируем UUID-подобный идентификатор
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-4' ||
  substr(lower(hex(randomblob(2))),2) || '-' ||
  substr('89AB', 1 + abs(random()) % 4, 1) ||
  substr(lower(hex(randomblob(2))),2) || '-' ||
  lower(hex(randomblob(6))),
  -- Краткое описание
  'Краткое описание агента ' || n,
  -- Полное описание (можно убрать или оставить пустым)
  'Подробное описание агента ' || n || '.'
FROM seq;

COMMIT;
PRAGMA foreign_keys = ON;
