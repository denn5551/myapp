// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';


const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, assistant_id } = req.body;

  if (!assistant_id) {
    console.log('assistant_id отсутствует');
  } else {
    console.log('assistant_id:', assistant_id);
  }

  if (!message || !assistant_id) {
    return res.status(400).json({ error: 'Missing message or assistant_id' });
  }

  let thread: any = null
  try {
    // Создаём thread
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json'
      }
    });

    thread = await threadRes.json();
    console.log('✅ Thread создан:', thread.id);

    // Добавляем сообщение
    await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
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

    const run = await runRes.json();
    console.log('▶️ Run запущен:', run);

    // Ожидаем завершения run
    let status = 'queued';
    let attempts = 0;
    while (status !== 'completed' && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      const statusData = await statusRes.json();
      status = statusData.status;
      console.log(`⏳ Статус выполнения: ${status}`);
      attempts++;
    }

    // Получаем сообщения после выполнения
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const messagesData = await messagesRes.json();
    const lastAssistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant');

    if (!lastAssistantMessage) {
      return res.status(200).json({ role: 'assistant', content: 'Ассистент не дал ответа.' });
    }

    return res.status(200).json({ role: 'assistant', content: lastAssistantMessage.content[0].text.value });
  } catch (error: any) {
    console.error('Ошибка OpenAI', error.response?.data || error.message || error, {
      assistant_id,
      message,
      thread_id: thread?.id,
    })
    return res.status(500).json({ error: 'assistant_unavailable' })
  }
};

export default handler;
