-- Создание таблиц
CREATE TABLE IF NOT EXISTS agent_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  full_description TEXT,
  category_id INTEGER,
  slug TEXT,
  is_active INTEGER,
  display_on_main INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

-- Вставка категорий
INSERT OR IGNORE INTO agent_categories (name, description) VALUES 
('Здоровье', 'Агенты для поддержания здоровья и wellness'),
('Финансы', 'Финансовые консультанты и помощники'),
('Быт', 'Помощники по домашним делам'),
('Дети', 'Помощники по вопросам воспитания и развития детей');

-- Вставка агентовINSERT OR IGNORE INTO agents (id, name, description, full_description, category_id, slug, is_active, display_on_main, created_at, updated_at) VALUES
('asst_jYPLYZOj82vtSYUviIOwAbRx', 'ИИ-психолог', 'Помогает справиться со стрессом, тревогой и выгоранием', 'Профессиональный ИИ-психолог поможет справиться со стрессом, тревогой и эмоциональным выгоранием. Проведет консультацию и даст практические рекомендации.', 1, 'ai-psychologist', 1, 0, datetime('now'), datetime('now')),
('asst_2', 'Финансовый агент', 'Поможет с бюджетом семьи и подушкой безопасности', 'Опытный финансовый консультант поможет спланировать бюджет, создать финансовую подушку безопасности и разработать стратегию накоплений.', 2, 'financial-advisor', 1, 0, datetime('now'), datetime('now')),
('asst_3', 'Диетолог', 'Подберёт меню и режим питания под цель', 'Профессиональный диетолог поможет составить персональный план питания, подберет оптимальный рацион и даст рекомендации по здоровому образу жизни.', 1, 'nutritionist', 1, 0, datetime('now'), datetime('now')),
('asst_4', 'Фитнес-тренер', 'Составит план тренировок дома или в зале', 'Персональный фитнес-тренер разработает программу тренировок с учетом ваших целей, уровня подготовки и возможностей.', 1, 'fitness-trainer', 1, 0, datetime('now'), datetime('now')),
('asst_5', 'Юрист', 'Бытовые вопросы: аренда, развод, договор', 'Квалифицированный юрист проконсультирует по правовым вопросам, поможет разобраться с документами и защитит ваши интересы.', 2, 'lawyer', 1, 0, datetime('now'), datetime('now')),
('asst_6', 'Детский психолог', 'Конфликты, воспитание, развитие ребёнка', 'Опытный детский психолог поможет решить проблемы в воспитании, наладить отношения с ребенком и поддержать его развитие.', 4, 'child-psychologist', 1, 0, datetime('now'), datetime('now')),
('asst_7', 'Помощник по готовке', 'Рецепты из имеющихся продуктов и меню на неделю', 'Кулинарный помощник подберет рецепты из доступных продуктов, составит меню на неделю и поделится кулинарными советами.', 3, 'cooking-assistant', 1, 0, datetime('now'), datetime('now')),
('asst_8', 'Планировщик отпуска', 'Поможет составить маршрут и бюджет поездки', 'Туристический консультант поможет спланировать идеальный отпуск, составит маршрут путешествия и рассчитает бюджет.', 3, 'travel-planner', 1, 0, datetime('now'), datetime('now'));