// pages/api/agents/by-id/[id]/favorite.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "@/lib/auth";
import openDb from "@/lib/db";

/**
 * Тоггл избранного для ассистента.
 * POST /api/agents/by-id/:id/favorite -> { ok: true, isFavorite: boolean }
 *
 * Таблица используется: user_favorite_agents(user_id TEXT, agent_id TEXT, created_at INTEGER)
 * Переименуй в коде ниже, если у тебя другое имя.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const session = await getSession(req);
  if (!session?.userId) return res.status(401).json({ ok: false, error: "unauthorized" });

  const agentId = req.query.id as string;
  if (!agentId) return res.status(400).json({ ok: false, error: "agent id required" });

  const db = await openDb();
  try {
    // есть ли уже в избранном?
    const row = await db.get(
      "SELECT 1 AS x FROM user_favorite_agents WHERE user_id = ? AND agent_id = ? LIMIT 1",
      [session.userId, agentId]
    );

    let isFavorite = false;

    if (row) {
      // снять из избранного
      await db.run(
        "DELETE FROM user_favorite_agents WHERE user_id = ? AND agent_id = ?",
        [session.userId, agentId]
      );
      isFavorite = false;
    } else {
      // добавить в избранное
      await db.run(
        "INSERT OR IGNORE INTO user_favorite_agents (user_id, agent_id, created_at) VALUES (?, ?, ?)",
        [session.userId, agentId, Date.now()]
      );
      isFavorite = true;
    }

    return res.status(200).json({ ok: true, isFavorite });
  } catch (e) {
    console.error("favorite toggle error:", e);
    return res.status(500).json({ ok: false, error: "internal" });
  } finally {
    await db.close();
  }
}
