import { useRouter } from 'next/router';
import { useEffect, useState, useRef, ReactElement } from 'react';
import { useSidebarState } from '@/hooks/useSidebarState';
import Link from 'next/link';
import React from 'react';

import { GetServerSideProps } from 'next';
import { getAgentBySlug } from '@/lib/getAgentBySlug';

import Sidebar from '@/components/Sidebar';
import HamburgerIcon from '@/components/HamburgerIcon';
import CloseIcon from '@/components/CloseIcon';
import FavoriteButton from '@/components/FavoriteButton';


const disableThreadReuse = process.env.NEXT_PUBLIC_DISABLE_THREAD_REUSE === 'true';
const debugMode = process.env.NEXT_PUBLIC_DEBUG === 'true';

// Функция для форматирования текста с абзацами
const formatMessageText = (text: string): ReactElement[] => {
  // Разбиваем текст на абзацы по двойным переносам строки
  const paragraphs = text.split(/\n\s*\n/);
  
  return paragraphs.map((paragraph, index) => {
    // Убираем лишние пробелы и переносы в начале и конце
    const trimmedParagraph = paragraph.trim();
    
    if (!trimmedParagraph) return <React.Fragment key={index}></React.Fragment>;
    
    // Обрабатываем списки (строки, начинающиеся с -, *, цифры)
    if (trimmedParagraph.includes('\n-') || trimmedParagraph.includes('\n*') || /\n\d+\./.test(trimmedParagraph)) {
      const lines = trimmedParagraph.split('\n');
      const elements: ReactElement[] = [];
      let currentList: string[] = [];
      let currentListType: 'ul' | 'ol' | null = null;
      
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          if (currentListType !== 'ul') {
            if (currentList.length > 0) {
              elements.push(
                <ol key={`ol-${index}-${elements.length}`}>
                  {currentList.map((item, i) => <li key={i}>{item}</li>)}
                </ol>
              );
              currentList = [];
            }
            currentListType = 'ul';
          }
          currentList.push(trimmedLine.substring(1).trim());
        } else if (/^\d+\./.test(trimmedLine)) {
          if (currentListType !== 'ol') {
            if (currentList.length > 0) {
              elements.push(
                <ul key={`ul-${index}-${elements.length}`}>
                  {currentList.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              );
              currentList = [];
            }
            currentListType = 'ol';
          }
          currentList.push(trimmedLine.replace(/^\d+\.\s*/, ''));
        } else if (trimmedLine) {
          if (currentList.length > 0) {
            const ListComponent = currentListType === 'ul' ? 'ul' : 'ol';
            elements.push(
              React.createElement(
                ListComponent,
                { key: `${currentListType}-${index}-${elements.length}` },
                currentList.map((item, i) => <li key={i}>{item}</li>)
              )
            );
            currentList = [];
            currentListType = null;
          }
          elements.push(<p key={`p-${index}-${lineIndex}`}>{trimmedLine}</p>);
        }
      });
      
      if (currentList.length > 0) {
        const ListComponent = currentListType === 'ul' ? 'ul' : 'ol';
        elements.push(
          React.createElement(
            ListComponent,
            { key: `${currentListType}-${index}-final` },
            currentList.map((item, i) => <li key={i}>{item}</li>)
          )
        );
      }
      
      return <div key={index}>{elements}</div>;
    }
    
    // Обычный абзац
    return <p key={index}>{trimmedParagraph}</p>;
  });
};

interface PageProps {
  slug: string;
}

export default function AgentChat({ slug }: PageProps) {
  const router = useRouter();
  const [agent, setAgent] = useState<{ assistantId: string; name: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const id = agent?.assistantId || ''
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [assistantName, setAssistantName] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const { sidebarOpen, toggleSidebar } = useSidebarState()
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!router.isReady) return
    fetch(`/api/agents/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('not found')
        return res.json()
      })
      .then(data => {
        if (!data.assistant_id) {
          console.log('assistant_id отсутствует')
          setErrorMsg('Ассистент не найден')
          return
        }
        setAgent({ assistantId: data.assistant_id, name: data.name })
        setAssistantName(data.name)
        setIsFavorite(!!data.isFavorite)
      })
      .catch(err => {
        console.error(`Ассистент не найден по slug: ${slug}`, err)
        setErrorMsg('Ассистент не найден')
      })
  }, [router.isReady, slug])

  useEffect(() => {
    if (router.isReady && id) {
      fetch(`/api/chats/${id}/touch`, { method: 'POST', credentials: 'include' })
    }
  }, [router.isReady, id])

  
  // Автоматический скролл к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.email) {
          window.location.href = '/auth/login';
        } else {
          setEmail(data.email);
          setSubscriptionStatus(data.subscriptionStatus || 'expired');
        }
      });
  }, []);

  // Загрузка истории сообщений из localStorage (только один раз)
  useEffect(() => {
    if (router.isReady && !messagesLoaded) {
      const saved = localStorage.getItem(`chat_${id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setMessages(parsed);
          } else {
            setMessages(parsed.messages || []);
            if (parsed.threadId && !disableThreadReuse) setThreadId(parsed.threadId);
          }
        } catch {
          setMessages([]);
        }
      }
      setMessagesLoaded(true);
    }
  }, [router.isReady, id, messagesLoaded]);

  // Сохранение сообщений при каждом изменении
  useEffect(() => {
    if (messagesLoaded) {
      localStorage.setItem(
        `chat_${id}`,
        JSON.stringify({ messages, threadId: disableThreadReuse ? null : threadId })
      );
    }
  }, [messages, threadId, id, messagesLoaded]);




  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/logout', { credentials: 'include' });
      if (res.ok) {
        window.location.href = '/auth/login';
      }
    } catch (e) {
      console.error('Ошибка при выходе:', e);
    }
  };

  async function sendMessage() {
    if (!input.trim() || !id) {
      if (!id) setErrorMsg('assistant_id отсутствует');
      return;
    }

    setLoading(true);
    try {
      const body: any = { message: input, assistant_id: id };
      if (!disableThreadReuse && threadId) body.thread_id = threadId;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || data?.error) {
        console.error('Assistant response error', data);
        setErrorMsg('Ассистент не может начать работу. Попробуйте позже.');
        setErrorDetails(data?.details);
        setLoading(false);
        return;
      }

      if (!disableThreadReuse) {
        setThreadId(data.thread_id || threadId);
      }
      setMessages(prev => [...prev, { role: 'user', content: input }, { role: data.role, content: data.content }]);
      setInput('');
      setErrorMsg(null);
      setErrorDetails(null);
    } catch (error: any) {
      console.error('Ошибка при общении с ассистентом:', error);
      setErrorMsg('Ассистент не может начать работу. Попробуйте позже.');
      setErrorDetails(error?.details || { message: error.message });
    }
    setLoading(false);
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Автоматическое изменение высоты textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Автоматическое изменение высоты
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleClearChat = async () => {
    console.log('🗑️ Очистка чата: запрошено');
    if (!id) return;
    try {
      const res = await fetch(`/api/agents/${id}/clear`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        console.log('🗑️ Чат очищен успешно');
        setMessages([]);
        setThreadId(null);
        localStorage.removeItem(`chat_${id}`);
      } else {
        console.error('Ошибка при очистке чата:', res.status);
      }
    } catch (e) {
      console.error('Ошибка при очистке чата:', e);
    }
  };


  return (
    <div className="chat-layout">
      {/* Sidebar */}
          <Sidebar
  sidebarOpen={sidebarOpen}
  toggleSidebar={toggleSidebar}
  userEmail={email}
  subscriptionStatus={subscriptionStatus}  
/>

      {/* Main Chat Content */}
      <main className={`chat-main ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
        <header className="lk-header">
          <button className="mobile-hamburger" onClick={toggleSidebar}>
            {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
          <div className="header__title">
            <h1>Чат с {assistantName}</h1>
          </div>
          <div className="header__actions">
            <button className="btn-clear-chat" onClick={handleClearChat}>
              Очистить чат
            </button>
            <FavoriteButton agentId={id} initialIsFavorite={isFavorite} />
          </div>
          <div className="header__user" onClick={toggleUserMenu}>
            <span className="user-avatar">
              {email.charAt(0).toUpperCase()}
            </span>
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
                  <h3>Добро пожаловать в чат с {assistantName}!</h3>
                  <p>Начните разговор, написав ваше первое сообщение.</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === 'user' ? email.charAt(0).toUpperCase() : 'ИИ'}
                    </div>
                    <div className="message-content">
                      <div className="message-author">
                        {msg.role === 'user' ? 'Вы' : assistantName}
                      </div>
                      <div className="message-text">
                        {formatMessageText(msg.content)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {subscriptionStatus === 'expired' ? (
              <div className="chat-locked">
                <div className="locked-message">
                  <h3>🔒 Доступ к чату ограничен</h3>
                  <p>Чтобы продолжить общение с ИИ-помощниками, оформите подписку.</p>
                  <Link href="/subscribe" className="upgrade-button">
                    Оформить подписку
                  </Link>
                </div>
              </div>
            ) : (
              <div className="chat-input-container">
                <div className="chat-input-wrapper">
                  <textarea
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="chat-input"
                    placeholder="Введите сообщение..."
                    rows={1}
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="send-button"
                  >
                    {loading ? '⏳' : '↑'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
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

