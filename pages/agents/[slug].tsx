// pages/agents/[slug].tsx
import React, { useEffect, useMemo, useRef, useState, ReactElement } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";

import Sidebar from "@/components/Sidebar";
import HamburgerIcon from "@/components/HamburgerIcon";
import CloseIcon from "@/components/CloseIcon";
import FavoriteButton from "@/components/FavoriteButton";
import ChatInput from "@/components/chat/ChatInput";

import { useSidebarState } from "@/hooks/useSidebarState";
import { isSubscriptionValid } from "@/lib/subscription";
import { getAgentBySlug } from "@/lib/getAgentBySlug";

const disableThreadReuse = process.env.NEXT_PUBLIC_DISABLE_THREAD_REUSE === "true";
const debugMode = process.env.NEXT_PUBLIC_DEBUG === "true";

type PageProps = {
  slug: string;
};

// Форматирование ответов ассистента с абзацами и списками
function formatMessageText(text: string): ReactElement[] {
  const paragraphs = text.split(/\n\s*\n/);
  return paragraphs.map((paragraph, idx) => {
    const p = paragraph.trim();
    if (!p) return <React.Fragment key={idx} />;

    if (p.includes("\n-") || p.includes("\n*") || /\n\d+\./.test(p)) {
      const lines = p.split("\n");
      const out: ReactElement[] = [];
      let list: string[] = [];
      let listType: "ul" | "ol" | null = null;

      lines.forEach((line, i) => {
        const l = line.trim();
        if (l.startsWith("-") || l.startsWith("*")) {
          if (listType !== "ul") {
            if (list.length) {
              out.push(
                <ol key={`ol-${idx}-${out.length}`}>
                  {list.map((x, j) => (
                    <li key={j}>{x}</li>
                  ))}
                </ol>
              );
              list = [];
            }
            listType = "ul";
          }
          list.push(l.slice(1).trim());
        } else if (/^\d+\./.test(l)) {
          if (listType !== "ol") {
            if (list.length) {
              out.push(
                <ul key={`ul-${idx}-${out.length}`}>
                  {list.map((x, j) => (
                    <li key={j}>{x}</li>
                  ))}
                </ul>
              );
              list = [];
            }
            listType = "ol";
          }
          list.push(l.replace(/^\d+\.\s*/, ""));
        } else if (l) {
          if (list.length) {
            const Comp = listType === "ul" ? "ul" : "ol";
            out.push(
              React.createElement(
                Comp,
                { key: `${listType}-${idx}-${out.length}` },
                list.map((x, j) => <li key={j}>{x}</li>)
              )
            );
            list = [];
            listType = null;
          }
          out.push(<p key={`p-${idx}-${i}`}>{l}</p>);
        }
      });

      if (list.length) {
        const Comp = listType === "ul" ? "ul" : "ol";
        out.push(
          React.createElement(
            Comp,
            { key: `${listType}-${idx}-final` },
            list.map((x, j) => <li key={j}>{x}</li>)
          )
        );
      }
      return <div key={idx}>{out}</div>;
    }

    return <p key={idx}>{p}</p>;
  });
}

export default function AgentChat({ slug }: PageProps) {
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useSidebarState();

  const [agent, setAgent] = useState<{ assistantId: string; name: string } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const [email, setEmail] = useState("");
  const [assistantName, setAssistantName] = useState("");

  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  const [subscriptionStatus, setSubscriptionStatus] =
    useState<"active" | "trial" | "expired">("trial");
  const [subscriptionEnd, setSubscriptionEnd] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const id = agent?.assistantId || "";

  // разные истории для разных ассистентов
  const storageKey = useMemo(() => `chat_${slug}`, [slug]);

  const endRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  // Загрузка данных ассистента
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
        setAgent({ assistantId: data.assistant_id, name: data.name });
        setAssistantName(data.name);
        setIsFavorite(!!data.isFavorite);
      } catch (e) {
        console.error(`Ассистент не найден по slug: ${slug}`, e);
        setErrorMsg("Ассистент не найден");
      }
    })();
  }, [router.isReady, slug]);

  // touch-событие
  useEffect(() => {
    if (!router.isReady || !id) return;
    fetch(`/api/chats/${id}/touch`, { method: "POST", credentials: "include" }).catch(() => {});
  }, [router.isReady, id]);

  // данные пользователя / подписки
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

  // Загрузка истории (по slug)
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
      JSON.stringify({
        messages,
        threadId: disableThreadReuse ? undefined : threadId,
      })
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

  return (
    <div className="chat-layout">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        userEmail={email}
        subscriptionStatus={subscriptionStatus}
      />

      <main className={`chat-main ${sidebarOpen ? "with-sidebar" : "full-width"}`}>
        <header className="lk-header">
          <button className="mobile-hamburger" onClick={toggleSidebar}>
            {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
          <div className="header__title">
            <h1>Чат с {assistantName || "ассистентом"}</h1>
          </div>
          <div className="header__actions">
            <button className="btn-clear-chat" onClick={handleClearChat}>
              Очистить чат
            </button>
            {!!id && <FavoriteButton agentId={id} initialIsFavorite={isFavorite} />}
          </div>
          <div className="header__user" onClick={toggleUserMenu}>
            <span className="user-avatar">{email ? email.charAt(0).toUpperCase() : "U"}</span>
            {userMenuOpen && (
              <ul className="dropdown-menu">
                <li>
                  <Link href="/profile">Профиль</Link>
                </li>
                <li>
                  <button onClick={handleLogout}>Выйти</button>
                </li>
              </ul>
            )}
          </div>
        </header>

        {errorMsg ? (
          <div className="error-message">
            {errorMsg}
            {debugMode && errorDetails?.message && (
              <p className="text-sm text-gray-500">{errorDetails.message}</p>
            )}
          </div>
        ) : (
          <div className="chat-container">
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="welcome-message">
                  <h3>Добро пожаловать в чат с {assistantName || "ассистентом"}!</h3>
                  <p>Начните разговор, написав ваше первое сообщение.</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`message ${msg.role}`}>
                    <div className="message-avatar">{msg.role === "user" ? "Вы" : "ИИ"}</div>
                    <div className="message-content">
                      <div className="message-author">
                        {msg.role === "user" ? "Вы" : assistantName || "Ассистент"}
                      </div>
                      <div className="message-text">
                        {/* Парсим контент для отображения изображений */}
                        {msg.role === "user" && msg.content.includes('[file]') ? (
                          <div>
                            {/* Показываем изображения из сообщения пользователя */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {msg.content.match(/\[file\]\s*([^:]+):\s*(https?:\/\/[^\s]+)/g)?.map((match, idx) => {
                                const url = match.match(/https?:\/\/[^\s]+/)?.[0];
                                const name = match.match(/\[file\]\s*([^:]+):/)?.[1];
                                console.log('Image found:', { url, name, match }); // Отладка
                                if (url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
                                  return (
                                    <div key={idx} className="relative group">
                                      <img 
                                        src={url} 
                                        alt={name || "Изображение"} 
                                        className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200 hover:scale-105 transition-transform cursor-pointer shadow-sm"
                                        style={{ width: '100px', height: '100px' }}
                                        onClick={() => window.open(url, '_blank')}
                                        onError={(e) => {
                                          console.error('Image load error:', url);
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all flex items-center justify-center">
                                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 font-medium">Открыть</span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                            {/* Текстовое содержимое без ссылок на файлы */}
                            {formatMessageText(msg.content.replace(/\[file\]\s*[^:]+:\s*https?:\/\/[^\s]+/g, '').trim())}
                          </div>
                        ) : (
                          formatMessageText(msg.content)
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={endRef} />
            </div>

            {!access ? (
              <div className="chat-locked">
                <div className="locked-message">
                  <h3>🔒 Подписка истекла</h3>
                  <p>Продлите подписку, чтобы продолжить общение с ИИ-помощниками.</p>
                  <Link href="/subscribe" className="upgrade-button">
                    Продлить подписку
                  </Link>
                </div>
              </div>
            ) : (
              <div className="chat-input-container">
                {/* ChatInput сам отправляет и возвращает данные через onMessageSent */}
                <ChatInput
                  threadId={threadId}
                  assistantId={id}
                  onMessageSent={(ok, newThreadId, response, userMessage) => {
                    if (!ok) {
                      setErrorMsg("Ошибка отправки сообщения");
                      return;
                    }
                    setErrorMsg(null);
                    setErrorDetails(null);

                    if (newThreadId && !disableThreadReuse) setThreadId(newThreadId);
                    if (userMessage) {
                      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
                    }
                    if (response) {
                      setMessages((prev) => [
                        ...prev,
                        { role: "assistant", content: response },
                      ]);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Глобальные стили для изображений в чате */}
      <style jsx global>{`
        .message-text img {
          width: 100px !important;
          height: 100px !important;
          object-fit: cover !important;
          border-radius: 12px !important;
          border: 2px solid #e5e7eb !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          cursor: pointer !important;
          transition: transform 0.2s ease !important;
        }
        .message-text img:hover {
          transform: scale(1.05) !important;
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const { slug } = ctx.params as { slug: string };
  const agent = await getAgentBySlug(slug);
  if (!agent) {
    return { notFound: true };
  }
  return { props: { slug } };
};
