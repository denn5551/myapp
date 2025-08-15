// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/auth';
import { openDb } from '../../../lib/db';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    text,
    agentId,
    attachments = [],
  } = req.body as {
    text?: string;
    agentId: string;
    attachments?: string[];
  };

  // Валидация входных данных
  if (!agentId) {
    return res.status(400).json({ error: 'Missing agentId' });
  }
  
  if (!text && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Missing text or attachments' });
  }

  if (attachments && !Array.isArray(attachments)) {
    return res.status(422).json({ error: 'Invalid attachments format' });
  }

  const userId = session.userId;
  console.log('[CHAT REQ]', {
    userId,
    agentId,
    textLength: text?.length || 0,
    attachmentsCount: attachments?.length || 0,
  });

  try {
    // Получаем информацию об агенте
    const db = await openDb();
    const agent = await db.get(
      'SELECT slug, name, description FROM agents WHERE id = ?',
      [agentId]
    );
    
    if (!agent) {
      await db.close();
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Загружаем историю чата
    const historyMessages = await db.all(
      `SELECT role, text, attachments 
       FROM chat_messages 
       WHERE user_id = ? AND agent_slug = ? 
       ORDER BY created_at ASC`,
      [userId, agent.slug]
    );

    // Формируем сообщения для OpenAI
    const messages: any[] = [];
    
    // Системное сообщение с описанием агента
    if (agent.description) {
      messages.push({
        role: 'system',
        content: agent.description
      });
    }

    // История чата
    for (const msg of historyMessages) {
      const attachments = msg.attachments ? JSON.parse(msg.attachments) : [];
      
      if (attachments.length > 0) {
        // Сообщение с изображениями
        const content: any[] = [
          { type: 'text', text: msg.text }
        ];
        
        for (const url of attachments) {
          content.push({
            type: 'image_url',
            image_url: { url }
          });
        }
        
        messages.push({
          role: msg.role,
          content
        });
      } else {
        // Текстовое сообщение
        messages.push({
          role: msg.role,
          content: msg.text
        });
      }
    }

    // Текущее сообщение пользователя
    const userContent: any[] = [];
    
    if (text) {
      userContent.push({ type: 'text', text });
    }
    
    if (attachments && attachments.length > 0) {
      for (const url of attachments) {
        userContent.push({
          type: 'image_url',
          image_url: { url }
        });
      }
    }

    messages.push({
      role: 'user',
      content: userContent
    });

    // Вызываем OpenAI Chat Completions API
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('[OPENAI ERROR]', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorData
      });
      
      await db.close();
      return res.status(502).json({
        error: 'openai_error',
        details: errorData.error?.message || 'OpenAI API error'
      });
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices[0]?.message?.content || '';

    // Сохраняем сообщения в базу данных
    const userText = text || '';
    const userAttachments = JSON.stringify(attachments || []);
    const assistantAttachments = JSON.stringify([]);

    await db.run(
      `INSERT INTO chat_messages (user_id, agent_slug, role, text, attachments) 
       VALUES (?, ?, 'user', ?, ?)`,
      [userId, agent.slug, userText, userAttachments]
    );

    await db.run(
      `INSERT INTO chat_messages (user_id, agent_slug, role, text, attachments) 
       VALUES (?, ?, 'assistant', ?, ?)`,
      [userId, agent.slug, assistantMessage, assistantAttachments]
    );

    await db.close();

    console.log('[CHAT SUCCESS]', {
      userId,
      agentId,
      assistantMessageLength: assistantMessage.length
    });

    return res.status(200).json({
      role: 'assistant',
      content: assistantMessage,
      attachments: []
    });

  } catch (error: any) {
    console.error('[CHAT ERROR]', error.stack || error);
    
    // Возвращаем осмысленную ошибку
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(502).json({
        error: 'openai_unavailable',
        details: 'OpenAI service is temporarily unavailable'
      });
    }
    
    return res.status(500).json({
      error: 'internal_error',
      errorId: `chat_${Date.now()}`,
      details: 'Internal server error'
    });
  }
};

export default handler;
