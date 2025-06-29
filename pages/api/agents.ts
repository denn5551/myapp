// pages/api/agents.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import { parse } from 'cookie';

const db = new Database('./data/users.db');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  if (cookies.userEmail !== 'kcc-kem@ya.ru') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  console.log(`API вызван с методом: ${req.method}`);
  console.log('Тело запроса:', req.body);

  if (req.method === 'GET') {
    const { categoryId, slug, limit, offset = 0 } = req.query as any;

    try {
      let query = 'SELECT * FROM agents';
      const params: any[] = [];

      const conditions: string[] = [];
      if (categoryId) {
        conditions.push('category_id = ?');
        params.push(Number(categoryId));
      }
      if (slug) {
        conditions.push('slug = ?');
        params.push(slug);
      }
      if (conditions.length) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      if (limit) {
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));
      }

      const agents = db.prepare(query).all(...params);
      return res.status(200).json({ agents });
    } catch (error: any) {
      console.error('Ошибка получения агентов:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    // Добавить агента
    console.log('Попытка добавить агента');
    const { id, name, description, short_description, category_id, slug, is_active } = req.body;
    
    console.log('Данные для добавления:', { id, name, description, short_description, category_id, slug, is_active });;
    
    if (!id || !name || !category_id) {
      console.log('Не все обязательные поля заполнены');
      return res.status(400).json({ 
        error: 'Не все обязательные поля заполнены (id, name, category_id)',
        received: { id, name, category_id }
      });
    }

    try {
      // Проверяем, не существует ли уже агент с таким ID
      const existingAgent = db.prepare('SELECT id FROM agents WHERE id = ?').get(id);
      if (existingAgent) {
        console.log('Агент с таким ID уже существует:', id);
        return res.status(409).json({ error: 'Агент с таким ID уже существует' });
      }

      // Генерируем slug если он не передан
      const finalSlug = slug || name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-zа-я0-9-]/gi, '')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');

      console.log('Финальный slug:', finalSlug);

      // Проверяем, не занят ли slug
      const existingSlug = db.prepare('SELECT id FROM agents WHERE slug = ?').get(finalSlug);
      if (existingSlug) {
        console.log('Slug уже занят:', finalSlug);
        return res.status(409).json({ error: 'Агент с таким slug уже существует' });
      }

      const insertQuery = `
        INSERT INTO agents (id, name, description, short_description, category_id, slug, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;

      console.log('Выполняем запрос:', insertQuery);
      
      const result = db.prepare(insertQuery).run(
        id, 
        name, 
        description || '', 
        short_description || '',
        category_id, 
        finalSlug, 
        is_active === undefined ? 1 : (is_active ? 1 : 0)
      );

      console.log('Результат вставки:', result);

      if (result.changes === 0) {
        console.log('Агент не был добавлен (changes = 0)');
        return res.status(500).json({ error: 'Агент не был добавлен' });
      }

      console.log('Агент успешно добавлен с ID:', id);
      return res.status(201).json({ 
        message: 'Агент успешно добавлен',
        agent: { id, name, slug: finalSlug }
      });
    } catch (error: any) {
      console.error('Ошибка добавления агента:', error);
      return res.status(500).json({ 
        error: 'Ошибка базы данных: ' + error.message,
        details: error
      });
    }
  }

  if (req.method === 'PUT') {
    // Обновить агента
    const { id, name, description, category_id, slug, is_active } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID агента обязателен для обновления' });
    }

    try {
      // Проверяем, существует ли агент
      const existingAgent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
      if (!existingAgent) {
        return res.status(404).json({ error: 'Агент не найден' });
      }

      const result = db.prepare(`
        UPDATE agents 
        SET name = ?, description = ?, category_id = ?, slug = ?, is_active = ?
        WHERE id = ?
      `).run(
        name || existingAgent.name, 
        description !== undefined ? description : existingAgent.description, 
        category_id || existingAgent.category_id, 
        slug || existingAgent.slug, 
        is_active !== undefined ? (is_active ? 1 : 0) : existingAgent.is_active, 
        id
      );

      if (result.changes === 0) {
        return res.status(500).json({ error: 'Агент не был обновлен' });
      }

      return res.status(200).json({ message: 'Агент успешно обновлен' });
    } catch (error: any) {
      console.error('Ошибка обновления агента:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    // Удалить агента
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID агента обязателен для удаления' });
    }

    try {
      // Проверяем, существует ли агент
      const existingAgent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
      if (!existingAgent) {
        return res.status(404).json({ error: 'Агент не найден' });
      }

      const result = db.prepare('DELETE FROM agents WHERE id = ?').run(id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Агент не найден' });
      }

      return res.status(200).json({ message: 'Агент успешно удален' });
    } catch (error: any) {
      console.error('Ошибка удаления агента:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Неизвестный метод
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
