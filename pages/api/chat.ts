// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';

// Открываем соединение с базой (путь к твоей базе данных)
const db = new Database('./data/users.db');

// Функция для поиска агента по openaiId
function getAgentByOpenaiId(openaiId: string) {
  const stmt = db.prepare('SELECT * FROM agents WHERE openaiId = ?');
  return stmt.get(openaiId);
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, assistant_id } = req.body;

  if (!message || !assistant_id) {
    return res.status(400).json({ error: 'Missing message or assistant_id' });
  }

  if (typeof assistant_id !== 'string' || !assistant_id.startsWith('asst')) {
    return res.status(400).json({ error: 'Invalid assistant_id format' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  // === Проверяем ассистента в базе ===
  const agent = getAgentByOpenaiId(assistant_id);

  if (!agent) {
    return res.status(404).json({ error: 'Агент с таким assistant_id не найден в базе' });
  }

  try {
    console.log('🚀 Начинаем работу с Assistant API');
    console.log('Assistant ID:', assistant_id);

    // Создаём thread
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json'
      }
    });

    if (!threadRes.ok) {
      const error = await threadRes.text();
      console.error('❌ Ошибка создания thread:', error);
      throw new Error(`Thread creation failed: ${error}`);
    }

    const thread = await threadRes.json();
    console.log('✅ Thread создан:', thread.id);

    // Добавляем сообщение
    const messageRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'user',
        content: message
      })
    });

    if (!messageRes.ok) {
      const error = await messageRes.text();
      console.error('❌ Ошибка добавления сообщения:', error);
      throw new Error(`Message creation failed: ${error}`);
    }

    console.log('✉️ Сообщение добавлено');

    // Запускаем ассистента
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ assistant_id })
    });

    if (!runRes.ok) {
      const error = await runRes.text();
      console.error('❌ Ошибка запуска run:', error);
      throw new Error(`Run creation failed: ${error}`);
    }

    const run = await runRes.json();
    console.log('▶️ Run запущен:', run.id);

    // Ожидаем завершения run
    let status = 'queued';
    let attempts = 0;
    const maxAttempts = 30;

    while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!statusRes.ok) {
        const error = await statusRes.text();
        console.error('❌ Ошибка получения статуса:', error);
        throw new Error(`Status check failed: ${error}`);
      }

      const statusData = await statusRes.json();
      status = statusData.status;
      console.log(`⏳ Статус выполнения: ${status} (попытка ${attempts + 1})`);

      if (status === 'failed') {
        console.error('❌ Run завершился с ошибкой:', statusData);
        throw new Error(`Assistant run failed: ${statusData.last_error?.message || 'Unknown error'}`);
      }

      attempts++;
    }

    if (status !== 'completed') {
      throw new Error(`Run timeout after ${maxAttempts} attempts. Status: ${status}`);
    }

    // Получаем сообщения после выполнения
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!messagesRes.ok) {
      const error = await messagesRes.text();
      console.error('❌ Ошибка получения сообщений:', error);
      throw new Error(`Messages fetch failed: ${error}`);
    }

    const messagesData = await messagesRes.json();
    console.log('📨 Получено сообщений:', messagesData.data?.length);

    const lastAssistantMessage = messagesData.data?.find((msg: any) => msg.role === 'assistant');

    if (!lastAssistantMessage) {
      console.log('⚠️ Ассистент не дал ответа');
      return res.status(200).json({ role: 'assistant', content: 'Ассистент не дал ответа.' });
    }

    const responseContent = lastAssistantMessage.content[0]?.text?.value || 'Пустой ответ от ассистента';
    console.log('✅ Ответ получен:', responseContent.substring(0, 100) + '...');

    return res.status(200).json({ role: 'assistant', content: responseContent });

  } catch (error: any) {
    console.error('❌ Ошибка в Assistant API:', error);
    return res.status(500).json({ error: `Ошибка в работе с OpenAI: ${error.message}` });
  }
};

export default handler;

