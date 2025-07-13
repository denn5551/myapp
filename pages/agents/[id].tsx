import { useRouter } from 'next/router';
import { useEffect, useState, useRef, ReactElement } from 'react';
import Link from 'next/link';
import React from 'react';

import Sidebar from '@/components/Sidebar';
import HamburgerIcon from '@/components/HamburgerIcon';
import CloseIcon from '@/components/CloseIcon';
import FavoriteButton from '@/components/FavoriteButton';


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

export default function AgentChat() {
  const router = useRouter();
  const { id } = router.query;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [assistantName, setAssistantName] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(window.innerWidth > 768);
  }, []);

  
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
    if (router.isReady && typeof id === 'string' && !messagesLoaded) {
      const saved = localStorage.getItem(`chat_${id}`);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch {
          setMessages([]);
        }
      }
      setMessagesLoaded(true);
    }
  }, [router.isReady, id, messagesLoaded]);

  // Сохранение сообщений при каждом изменении
  useEffect(() => {
    if (typeof id === 'string' && messagesLoaded) {
      localStorage.setItem(`chat_${id}`, JSON.stringify(messages));
    }
  }, [messages, id, messagesLoaded]);

  // Получение имени ассистента
  useEffect(() => {
    if (router.isReady && typeof id === 'string') {
      fetch('/api/agents?id=' + id)
        .then((r) => r.json())
        .then((a) => setAssistantName(a?.name || 'Ассистент'))
        .catch(() => setAssistantName('Ассистент'));
    }
  }, [router.isReady, id]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
    if (!input.trim() || typeof id !== 'string') return;

    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, assistant_id: id }),
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

  const handleClearChat = async () => {
    console.log('🗑️ Очистка чата: запрошено');
    try {
      const res = await fetch(`/api/agents/${id}/clear`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        console.log('🗑️ Чат очищен успешно');
        setMessages([]);
        if (typeof id === 'string') {
          localStorage.removeItem(`chat_${id}`);
        }
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
            {typeof id === 'string' && <FavoriteButton agentId={id} />}
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