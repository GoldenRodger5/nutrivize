import React, { useState, useRef, useEffect } from 'react';
import '../styles/Chatbot.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: string;
  content: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm NutriBot. I can help with nutrition questions, analyze your food log, or suggest meals based on your preferences. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check if user is authenticated
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send to API
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          fetch_context: true
        }),
      });

      if (response.status === 401) {
        // Token expired or invalid
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I couldn't connect to the server. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  // Function to render message content with markdown formatting
  const renderMessageContent = (content: string, role: string) => {
    if (role === 'user') {
      // User messages are displayed as plain text
      return <div className="message-content">{content}</div>;
    } else {
      // Assistant messages with markdown formatting
      return (
        <div className="message-content markdown-content">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Customize component rendering if needed
              h1: ({node, ...props}) => <h1 className="md-heading md-h1" {...props} />,
              h2: ({node, ...props}) => <h2 className="md-heading md-h2" {...props} />,
              h3: ({node, ...props}) => <h3 className="md-heading md-h3" {...props} />,
              ul: ({node, ...props}) => <ul className="md-list md-ul" {...props} />,
              ol: ({node, ...props}) => <ol className="md-list md-ol" {...props} />,
              li: ({node, ...props}) => <li className="md-li" {...props} />,
              p: ({node, ...props}) => <p className="md-p" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="md-blockquote" {...props} />,
              a: ({node, ...props}) => <a className="md-link" {...props} target="_blank" rel="noopener noreferrer" />,
              table: ({node, ...props}) => <table className="md-table" {...props} />,
              img: ({node, ...props}) => <img className="md-img" {...props} alt={props.alt || ''} />
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    }
  };

  return (
    <div className="chatbot">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {renderMessageContent(message.content, message.role)}
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="quick-prompts">
        <button onClick={() => handleQuickPrompt("Suggest a healthy breakfast")}>
          🍳 Breakfast ideas
        </button>
        <button onClick={() => handleQuickPrompt("What should I eat for lunch that's high in protein?")}>
          🥗 Protein lunch
        </button>
        <button onClick={() => handleQuickPrompt("Recommend a quick dinner")}>
          🍽️ Quick dinner
        </button>
        <button onClick={() => handleQuickPrompt("Suggest a healthy snack under 200 calories")}>
          🥜 Low-cal snack
        </button>
      </div>

      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about nutrition..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot; 