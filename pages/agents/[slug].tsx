// pages/agents/[slug].tsx
import React, { useEffect, useMemo, useRef, useState, ReactElement } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { Trash2 as TrashIcon, Heart, HeartOff, HelpCircle, User } from "lucide-react"; // или "@heroicons/react/24/outline" и т.п.


import Sidebar from "@/components/Sidebar";
import FavoriteButton from "@/components/FavoriteButton";
import ChatInput from "@/components/chat/ChatInput";

import { useSidebarState } from "@/hooks/useSidebarState";
import { isSubscriptionValid } from "@/lib/subscription";
import { getAgentBySlug } from "@/lib/getAgentBySlug";

const disableThreadReuse = process.env.NEXT_PUBLIC_DISABLE_THREAD_REUSE === "true";
const debugMode = process.env.NEXT_PUBLIC_DEBUG === "true";

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
          fill="currentColor"/>
  </svg>
);

const BotIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M12 2a1 1 0 0 1 1 1v1.06A8 8 0 0 1 20 12v5a3 3 0 0 1-3 3h-2v2h-6v-2H7a3 3 0 0 1-3-3v-5a8 8 0 0 1 7-7.94V3a1 1 0 0 1 1-1Zm-4 9a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 8 11Zm8 0a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 16 11Z"
          fill="currentColor"/>
  </svg>
);

type PageProps = { slug: string };

// Простой рендер текста с абзацами.
function renderMessage(text: string): ReactElement[] {
  return text
    .split(/\n\s*\n/)
    .map((p, i) => (
      <p key={i} className="leading-6 whitespace-pre-wrap">
        {p}
      </p>
    ));
}

export default function AgentChat({ slug }: PageProps) {
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useSidebarState();

  const [agent, setAgent] = useState<{
    assistantId: string;
    name: string;
    description?: string;
  } | null>(null);

  const [assistantName, setAssistantName] = useState("");
  const [assistantDescription, setAssistantDescription] = useState<string | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);

  const [email, setEmail] = useState("");

  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  const [subscriptionStatus, setSubscriptionStatus] =
    useState<"active" | "trial" | "expired">("trial");
  const [subscriptionEnd, setSubscriptionEnd] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const id = agent?.assistantId || "";
  const storageKey = useMemo(() => `chat_${slug}`, [slug]);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  // Загрузка ассистента
  useEffect(() => {
    if (!router.isReady) return;
    (async () => {
      try {
        const r = await fetch(`/api/agents/${slug}`);
        if (!r.ok) throw new Error("not found");
        const data = await r.json();
        if (!data.assistant_id) {
          setErrorMsg("Ассистент не найден");
          return;
        }
        setAgent({ assistantId: data.assistant_id, name: data.name, description: data.description });
        setAssistantName(data.name);
        setAssistantDescription(data.description);
        setIsFavorite(!!data.isFavorite);
      } catch (e) {
        console.error(`Ассистент не найден по slug: ${slug}`, e);
        setErrorMsg("Ассистент не найден");
      }
    })();
  }, [router.isReady, slug]);

  // touch чата, чтобы прогревать сущности на бэкенде
  useEffect(() => {
    if (!router.isReady || !id) return;
    fetch(`/api/chats/${id}/touch`, { method: "POST", credentials: "include" }).catch(() => {});
  }, [router.isReady, id]);

  // Пользователь/подписка
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me", { credentials: "include" });
        const data = await r.json();
        if (!data.email) {
          window.location.href = "/auth/login";
          return;
        }
        setEmail(data.email);
        setSubscriptionStatus(data.subscriptionStatus || "expired");
        if (data.subscriptionEnd) setSubscriptionEnd(data.subscriptionEnd);
      } catch {}
    })();
  }, []);

  // Локальная история
  useEffect(() => {
    if (!router.isReady) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(Array.isArray(parsed) ? parsed : parsed.messages || []);
        if (parsed.threadId && !disableThreadReuse) setThreadId(parsed.threadId);
      } catch {
        setMessages([]);
      }
    }
    setMessagesLoaded(true);
  }, [router.isReady, storageKey]);

  // Сохранение истории
  useEffect(() => {
    if (!messagesLoaded) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({ messages, threadId: disableThreadReuse ? undefined : threadId })
    );
  }, [messages, threadId, messagesLoaded, storageKey]);

  const toggleUserMenu = () => setUserMenuOpen((x) => !x);

  const handleLogout = async () => {
    try {
      const r = await fetch("/api/logout", { credentials: "include" });
      if (r.ok) window.location.href = "/auth/login";
    } catch {}
  };

  const access = isSubscriptionValid(subscriptionStatus, subscriptionEnd);

  const handleClearChat = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/agents/by-id/${id}/clear`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setMessages([]);
        setThreadId(undefined);
        localStorage.removeItem(storageKey);
      }
    } catch (e) {
      console.error("Ошибка при очистке чата:", e);
    }
  };

/** 
 * Рендер содержимого сообщения (текст, markdown, ссылки и т.п.)
 * Можно расширить, если потом захочешь поддерживать изображения или HTML
 */
function renderMessageContent(content: string) {
  if (!content) return null;

  // Если есть markdown (жирный, курсив) — можно потом заменить на markdown-парсер.
  const lines = content.split(/\n+/).map((line, i) => (
    <p key={i} className="whitespace-pre-wrap leading-relaxed break-words">
      {line}
    </p>
  ));

  return <div>{lines}</div>;
}

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        userEmail={email}
        subscriptionStatus={subscriptionStatus}
      />

      {/* Основная колонка */}
      <main className="flex-1 flex flex-col">
        {/* Хедер: сервисные иконки справа */}

<header style={{
    borderBottom: "1.5px solid #e5e7eb", // или другой светло-серый #dde2e8, #f1f5f9 и т.д.
    boxShadow: "0 2px 8px rgba(30,41,59,0.05)"
  }} className="sticky top-0 z-10 bg-base-100 border-b">
  <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center justify-between">
    <h1 className="text-lg font-semibold">Чат с {assistantName || "ассистентом"}</h1>

<div className="flex items-center gap-3">
  {/* Кнопка "Очистить" */}
  <button
    title="Очистить чат"
    onClick={handleClearChat}
    className="icon-btn"
    aria-label="Очистить"
  >
    <TrashIcon className="w-5 h-5" />
  </button>

  {/* Кнопка "Избранное" */}
  {id && (
    <button className="icon-btn" aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}>
      {isFavorite
        ? <Heart className="w-5 h-5 text-primary" />
        : <HeartOff className="w-5 h-5 opacity-70" />}
    </button>
  )}

  {/* Выпадающее описание */}
  {!!assistantDescription && (
    <details className="icon-btn" style={{padding: 0}}>
      <summary className="list-none cursor-pointer icon-btn" style={{padding: 0}}>
        <HelpCircle className="w-5 h-5" />
      </summary>
      <div className="dropdown-content z-[1] min-w-[220px] max-w-xs bg-base-100 rounded-xl shadow p-3 mt-2">
        <div className="text-sm whitespace-pre-wrap">{assistantDescription}</div>
      </div>
    </details>
  )}

  {/* Пользовательское меню */}
  <div className="dropdown dropdown-end">
    <button
      tabIndex={0}
      type="button"
      onClick={toggleUserMenu}
      className="icon-btn avatar placeholder"
    >
      <div className="w-8 h-8 rounded-full bg-neutral text-neutral-content flex items-center justify-center">
        <User className="w-4 h-4" />
      </div>
    </button>
    {userMenuOpen && (
      <ul className="dropdown-content z-[2] menu p-2 shadow bg-base-200 rounded-box w-44 mt-2">
        <li><Link href="/profile">Профиль</Link></li>
        <li>
          <button onClick={handleLogout}>Выйти</button>
        </li>
      </ul>
    )}
  </div>
</div>


  </div>
</header>
        {/* Тело чата */}
        <div className="flex-1">
          <div className="max-w-[900px] mx-auto px-4 py-6">
            {errorMsg ? (
              <div className="alert alert-error">
                {errorMsg}
                {debugMode && errorDetails?.message && (
                  <p className="text-sm">{errorDetails.message}</p>
                )}
              </div>
            ) : (
              <>
                {/* Сообщения */}
                <div className="flex flex-col gap-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-base-content/70 py-10">
                      <h3 className="text-lg font-semibold">Добро пожаловать!</h3>
                      <p>Начните разговор, написав: "Привет".</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >


{/* ОДНО сообщение истории (DaisyUI chat) */}
<div className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}>
  <div
    className="chat-bubble"
    style={{
      whiteSpace: 'pre-line',
      wordBreak: 'break-word',
      overflowWrap: 'anywhere',
      background: msg.role === "user" ? "#daf0fe" : "#eeeeee",
      color: "#3b3b3b",
      maxWidth: "100%",
    }}
  >
    {renderMessageContent(
      msg.content.replace(/\[file\]\s*[^:]+:\s*https?:\/\/\S+/g, "").trim()
    )}
  </div>
</div>
                      </div>
                    ))
                  )}
                  <div ref={endRef} />
                </div>

                {/* Инпут */}
                {access ? (
                  <div className="mt-6">
                    <ChatInput
                      threadId={threadId}
                      assistantId={id}
                      onMessageSent={(ok, newThreadId, response, userMessage) => {
                        if (!ok) {
                          // Безопасно показываем алерт, не трогаем внешний вид инпута.
                          setErrorMsg("Ошибка отправки");
                          return;
                        }
                        setErrorMsg(null);
                        setErrorDetails(null);
                        if (newThreadId && !disableThreadReuse) setThreadId(newThreadId);
                        if (userMessage)
                          setMessages((p) => [...p, { role: "user", content: userMessage }]);
                        if (response)
                          setMessages((p) => [...p, { role: "assistant", content: response }]);
                      }}
                    />
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="alert alert-warning">
                      <span>Подписка истекла. Продлите, чтобы продолжить чат.</span>
                      <Link href="/subscribe" className="btn btn-primary btn-sm ml-2">
                        Продлить
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const { slug } = ctx.params as { slug: string };
  const agent = await getAgentBySlug(slug);
  if (!agent) return { notFound: true };
  return { props: { slug } };
};
