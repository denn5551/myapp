import type { JSX } from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import React from 'react';
import Sidebar from '@/components/Sidebar';

// Функция для форматирования текста с абзацами
const formatMessageText = (text: string) => {
  // Разбиваем текст на абзацы по двойным переносам строки
  const paragraphs = text.split(/\n\s*\n/);
  
  return paragraphs.map((paragraph, index) => {
    // Убираем лишние пробелы и переносы в начале и конце
    const trimmedParagraph = paragraph.trim();
    
    if (!trimmedParagraph) return null;
    
    // Обрабатываем списки (строки, начинающиеся с -, *, цифры)
    if (trimmedParagraph.includes('\n-') || trimmedParagraph.includes('\n*') || /\n\d+\./.test(trimmedParagraph)) {
      const lines = trimmedParagraph.split('\n');
      const elements: JSX.Element[] = [];
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
    } else {
      // Обычный абзац
      return <p key={index}>{trimmedParagraph}</p>;
    }
  }).filter(Boolean);
};

export default function AgentChat() {
  const router = useRouter();
  const { slug } = router.query;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [assistantName, setAssistantName] = useState('');
  const [assistantId, setAssistantId] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Автоматический скролл к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch('/api/me')
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
    if (router.isReady && typeof slug === 'string' && !messagesLoaded) {
      const saved = localStorage.getItem(`chat_${slug}`);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch {
          setMessages([]);
        }
      }
      setMessagesLoaded(true);
    }
  }, [router.isReady, slug, messagesLoaded]);

  // Сохранение сообщений при каждом изменении
  useEffect(() => {
    if (typeof slug === 'string' && messagesLoaded) {
      localStorage.setItem(`chat_${slug}`, JSON.stringify(messages));
    }
  }, [messages, slug, messagesLoaded]);

  // Получение информации об ассистенте
  useEffect(() => {
    if (router.isReady && typeof slug === 'string') {
      fetch(`/api/agents?slug=${slug}`)
        .then(res => res.json())
        .then(data => {
          const agent = (data.agents && data.agents[0]) || data.agent;
          if (agent) {
            setAssistantName(agent.name);
            setAssistantId(agent.id);
          }
        });
    }
  }, [router.isReady, slug]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  async function sendMessage() {
    if (!input.trim() || !assistantId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, assistant_id: assistantId }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'user', content: input }, data]);
      setInput('');
    } catch (error) {
      console.error('Ошибка при общении с ассистентом:', error);
      alert('Произошла ошибка. Проверь API ключ или ID ассистента.');
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
        <div className="chat-header">
          <h1 className="chat-title">Чат с {assistantName}</h1>
          <button
            className="clear-chat-button"
            onClick={() => {
              setMessages([]);
              if (typeof slug === 'string') {
                localStorage.removeItem(`chat_${slug}`);
              }
            }}
          >
            Очистить чат
          </button>
        </div>

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
      </main>
    </div>
  );
}
