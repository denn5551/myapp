// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const disableThreadReuse = process.env.DISABLE_THREAD_REUSE === 'true';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    message,
    assistant_id,
    thread_id,
    attachments = [],
  } = req.body as {
    message: string;
    assistant_id: string;
    thread_id?: string;
    attachments?: string[];
  };

  if (!message || !assistant_id) {
    if (!assistant_id) console.log('assistant_id отсутствует');
    return res.status(400).json({ error: 'Missing message or assistant_id' });
  }

  let threadId = disableThreadReuse ? null : thread_id;
  const userId = (req as any).session?.userId || 'anonymous';
  console.log('[CHAT REQ]', {
    userId,
    agentId: assistant_id,
    threadId,
    messagesLength: 1,
    hasAttachments: Array.isArray(attachments) && attachments.length > 0,
  });
  try {

    if (!threadId) {
      const threadRes = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          'Content-Type': 'application/json',
        },
      });
      const thread = await threadRes.json();
      threadId = thread.id;
      console.log('✅ Thread создан:', threadId);
    } else {
      console.log('ℹ️ Используем существующий thread:', threadId);
    }

    const content: any[] = [{ type: 'text', text: message }];
    if (Array.isArray(attachments)) {
      for (const url of attachments) {
        content.push({ type: 'image_url', image_url: { url } });
      }
    }

    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'user',
        content,
      }),
    });
    console.log('✉️ Сообщение добавлено');

    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assistant_id }),
    });

    if (!runRes.ok) {
      console.error('❌ Run не запущен', {
        assistant_id,
        thread_id: threadId,
        user_message: message,
        status: runRes.status,
        statusText: runRes.statusText,
      });
      return res
        .status(500)
        .json({ error: 'assistant_unavailable', details: 'run failed to start' });
    }

    const run = await runRes.json();
    console.log('▶️ Run запущен:', { id: run.id, status: run.status });

    if (run.status === 'failed') {
      console.error('Assistant run failed', {
        assistant_id,
        thread_id: threadId,
        user_message: message,
        run_status: run.status,
        last_error: run.last_error,
      });
      return res.status(500).json({
        error: 'assistant_unavailable',
        details: run.last_error,
      });
    }

    let status = run.status;
    let lastError = run.last_error;
    let attempts = 0;
    while (status !== 'completed' && status !== 'failed' && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const statusRes = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        }
      );
      const statusData = await statusRes.json();
      status = statusData.status;
      lastError = statusData.last_error;
      console.log(`⏳ Статус выполнения: ${status}`);
      attempts++;
    }

    if (status !== 'completed') {
      console.error('Assistant run failed', {
        assistant_id,
        thread_id: threadId,
        user_message: message,
        run_status: status,
        last_error: lastError,
      });
      return res.status(500).json({
        error: 'assistant_unavailable',
        details: lastError,
      });
    }

    console.log('✅ Run завершён', {
      assistant_id,
      thread_id: threadId,
      status,
    });

    const messagesRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      }
    );

    const messagesData = await messagesRes.json();
    // API returns messages in descending order; take first assistant message without reversing
    const lastAssistantMessage = messagesData.data.find(
      (msg: any) => msg.role === 'assistant'
    );

    if (!lastAssistantMessage) {
      return res.status(200).json({
        role: 'assistant',
        content: 'Ассистент не дал ответа.',
        thread_id: threadId,
        attachments,
      });
    }

    return res.status(200).json({
      role: 'assistant',
      content: lastAssistantMessage.content[0].text.value,
      thread_id: threadId,
      attachments,
    });
  } catch (error: any) {
    console.error('[CHAT ERROR]', error.stack || error);
    return res.status(200).json({
      errorId: 'assistant_unavailable',
      message: error.message || 'assistant_unavailable',
    });
  }
};

export default handler;
