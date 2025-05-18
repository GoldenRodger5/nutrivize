import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import '../styles/Chatbot.css';
import { useUserContext } from '../context/UserContext';
import { getToken } from '../utils/auth';
import api from '../utils/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

const Chatbot: React.FC = () => {
  const { user } = useUserContext();
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m your AI nutrition assistant. I can help with meal ideas, nutrition information, and healthy eating tips. What can I help you with today?' 
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const [nutritionData, setNutritionData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = window.innerWidth < 768;

  // Scroll to the bottom of messages when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        // Create preview URL for the image
        const imageUrl = URL.createObjectURL(file);
        
        // Add a user message with the image
        const userMessage = { 
          role: 'user' as const, 
          content: 'I uploaded a nutrition label image for analysis.', 
          imageUrl 
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Process the nutrition label image
        processNutritionLabel(file);
      } else {
        alert('Please select an image file.');
      }
    }
  };

  const processNutritionLabel = async (file: File) => {
    setUploadProgress(true);
    
    try {
      // Create FormData object for the file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Add assistant message indicating processing
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I\'m analyzing the nutrition label image. This will take a moment...' 
      }]);
      
      // Upload and analyze the image
      const response = await api.post('/nutrition-label/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status === 200) {
        const extractedData = response.data;
        setNutritionData(extractedData.nutrition_info);
        
        // Format the nutrition info for display
        const nutritionSummary = formatNutritionInfo(extractedData.nutrition_info);
        
        // Add assistant response showing the extracted nutrition info
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I've analyzed the nutrition label and extracted the following information:\n\n${nutritionSummary}\n\nWould you like me to add this food to your index?` 
        }]);
      }
    } catch (error) {
      console.error('Error processing nutrition label:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I had trouble processing the nutrition label. Please make sure the image is clear and try again.' 
      }]);
    } finally {
      setUploadProgress(false);
    }
  };

  const formatNutritionInfo = (nutritionInfo: any): string => {
    if (!nutritionInfo) return 'No nutrition information found.';
    
    return `**${nutritionInfo.name || 'Food Item'}**
    
Serving Size: ${nutritionInfo.serving_size || '?'} ${nutritionInfo.serving_unit || 'g'}
Calories: ${nutritionInfo.calories || '?'} kcal
Protein: ${nutritionInfo.proteins || '?'} g
Carbs: ${nutritionInfo.carbs || '?'} g
Fat: ${nutritionInfo.fats || '?'} g
Fiber: ${nutritionInfo.fiber || '?'} g`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Check for "yes" response to adding food to index
    if (nutritionData && (input.toLowerCase().includes('yes') || 
        input.toLowerCase().includes('add') || 
        input.toLowerCase().includes('sure'))) {
      await addFoodToIndex();
      return;
    }

    // Regular chat flow
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = getToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          user_id: user?.uid
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from nutritionist AI');
      }

      const data = await response.json();
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I had trouble processing your request. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const addFoodToIndex = async () => {
    setLoading(true);
    
    try {
      if (!nutritionData) {
        throw new Error('No nutrition data available to add');
      }
      
      // Prepare food data for submission
      const foodData = {
        name: nutritionData.name || 'Scanned Food Item',
        serving_size: nutritionData.serving_size || 100,
        serving_unit: nutritionData.serving_unit || 'g',
        calories: nutritionData.calories || 0,
        proteins: nutritionData.proteins || 0,
        carbs: nutritionData.carbs || 0,
        fats: nutritionData.fats || 0,
        fiber: nutritionData.fiber || 0,
        source: 'scan'
      };
      
      // Add the food to the index
      const response = await api.post('/foods/', foodData);
      
      if (response.status === 200 || response.status === 201) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I've added "${foodData.name}" to your food index. You can now log it in your food log or use it in meal planning.` 
        }]);
        
        // Reset nutrition data
        setNutritionData(null);
      }
    } catch (error) {
      console.error('Error adding food to index:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I had trouble adding the food to your index. Please try again.' 
      }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  // Render message content with special handling for assistant messages
  const renderMessageContent = (message: Message) => {
    if (message.role === 'user') {
      return (
        <div className="message-content">
          {message.content}
          {message.imageUrl && (
            <div className="message-image">
              <img src={message.imageUrl} alt="Uploaded nutrition label" />
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="message-content markdown-content">
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
        </div>
      );
    }
  };

  // Quick prompts for common questions
  const quickPrompts = [
    "What are good high-protein breakfast options?",
    "How can I eat healthier on a budget?",
    "Can you suggest a balanced dinner?",
    "What are good foods for energy?"
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    // We need to manually create a submit event
    const event = new Event('submit') as any;
    handleSubmit(event);
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-header-content">
          <div className="ai-avatar">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L15.5 4.5M12 1L8.5 4.5M12 1V8.5M17 3L19.5 7.5M7 3L4.5 7.5M21 9L17 12M3 9L7 12M12 23C16.4183 23 20 19.4183 20 15C20 10.5817 16.4183 7 12 7C7.58172 7 4 10.5817 4 15C4 19.4183 7.58172 23 12 23Z" stroke="url(#chatAvatar)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="15" r="3" stroke="url(#chatAvatar)" strokeWidth="2"/>
              <defs>
                <linearGradient id="chatAvatar" x1="3" y1="1" x2="21" y2="23" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8E2DE2"/>
                  <stop offset="1" stopColor="#4A00E0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="chatbot-title">
            <h2>AI Nutrition Assistant</h2>
            <div className="assistant-status">
              <span className="status-dot"></span>
              <span className="status-text">Active</span>
            </div>
          </div>
        </div>
        <p className="chatbot-subtitle">Ask me about food, nutrition, meals, and healthy eating habits. You can also upload nutrition labels for analysis.</p>
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            {message.role === 'assistant' && (
              <div className="message-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1L15.5 4.5M12 1L8.5 4.5M12 1V8.5M17 3L19.5 7.5M7 3L4.5 7.5M21 9L17 12M3 9L7 12M12 23C16.4183 23 20 19.4183 20 15C20 10.5817 16.4183 7 12 7C7.58172 7 4 10.5817 4 15C4 19.4183 7.58172 23 12 23Z" stroke="url(#chatAvatar)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="15" r="3" stroke="url(#chatAvatar)" strokeWidth="2"/>
                </svg>
              </div>
            )}
            {renderMessageContent(message)}
          </div>
        ))}
        {loading && (
          <div className="message assistant-message">
            <div className="message-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L15.5 4.5M12 1L8.5 4.5M12 1V8.5M17 3L19.5 7.5M7 3L4.5 7.5M21 9L17 12M3 9L7 12M12 23C16.4183 23 20 19.4183 20 15C20 10.5817 16.4183 7 12 7C7.58172 7 4 10.5817 4 15C4 19.4183 7.58172 23 12 23Z" stroke="url(#chatAvatar)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="15" r="3" stroke="url(#chatAvatar)" strokeWidth="2"/>
              </svg>
            </div>
            <div className="message-content typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        {uploadProgress && (
          <div className="message assistant-message">
            <div className="message-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L15.5 4.5M12 1L8.5 4.5M12 1V8.5M17 3L19.5 7.5M7 3L4.5 7.5M21 9L17 12M3 9L7 12M12 23C16.4183 23 20 19.4183 20 15C20 10.5817 16.4183 7 12 7C7.58172 7 4 10.5817 4 15C4 19.4183 7.58172 23 12 23Z" stroke="url(#chatAvatar)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="15" r="3" stroke="url(#chatAvatar)" strokeWidth="2"/>
              </svg>
            </div>
            <div className="message-content uploading-indicator">
              <span>Processing image</span>
              <div className="progress-bar"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-controls">
        {(messages.length > 1 || isMobile) && (
          <div className="quick-prompts">
            {quickPrompts.map((prompt, index) => (
              <button 
                key={index}
                type="button"
                className="quick-prompt-btn"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={loading || uploadProgress}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="chat-input-form">
          <button 
            type="button" 
            className="attachment-button" 
            onClick={handleAttachmentClick}
            disabled={loading || uploadProgress}
            title="Upload nutrition label"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 5h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 16l14-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything about nutrition..."
            aria-label="Message input"
            disabled={loading || uploadProgress}
          />
          <button type="submit" disabled={loading || uploadProgress || !input.trim()} className="send-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.3009 13.6948L20.102 3.89868" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.1021 3.89868L13.0437 20.598C12.9606 20.7708 12.7202 20.8101 12.5804 20.6809L10.3009 18.5717C10.1654 18.4466 9.9569 18.4529 9.82887 18.5857L7.14218 21.3719C6.9136 21.6093 6.5246 21.435 6.55976 21.1203L7.75998 10.3621C7.77359 10.2427 7.69685 10.1322 7.58314 10.0942L3.67415 8.75031C3.34077 8.63127 3.29855 8.18107 3.60539 7.99979L20.1021 3.89868Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </form>
      </div>
    </div>
  );
};

export default Chatbot; 