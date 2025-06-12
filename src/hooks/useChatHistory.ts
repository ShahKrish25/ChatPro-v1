import { useState, useEffect } from 'react';

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
  id: string;
  isStreaming?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // Load sessions from session storage on mount
  useEffect(() => {
    const storedSessions = sessionStorage.getItem('chatSessions');
    const storedCurrentId = sessionStorage.getItem('currentSessionId');
    
    if (storedSessions) {
      const parsedSessions = JSON.parse(storedSessions).map((session: any) => ({
        ...session,
        timestamp: new Date(session.timestamp),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setSessions(parsedSessions);
    }
    
    if (storedCurrentId) {
      setCurrentSessionId(storedCurrentId);
    }
  }, []);

  // Save sessions to session storage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      sessionStorage.setItem('chatSessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Save current session ID to session storage
  useEffect(() => {
    if (currentSessionId) {
      sessionStorage.setItem('currentSessionId', currentSessionId);
    }
  }, [currentSessionId]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession;
  };

  const updateSessionMessages = (sessionId: string, messages: Message[]) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        // Update title based on first user message if it exists
        const firstUserMessage = messages.find(msg => msg.isUser);
        const title = firstUserMessage 
          ? firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '')
          : 'New Chat';
        
        return {
          ...session,
          messages,
          title,
          timestamp: new Date(),
        };
      }
      return session;
    }));
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remainingSessions = sessions.filter(session => session.id !== sessionId);
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id);
      } else {
        const newSession = createNewSession();
        setCurrentSessionId(newSession.id);
      }
    }
  };

  const getCurrentSession = () => {
    return sessions.find(session => session.id === currentSessionId);
  };

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createNewSession,
    updateSessionMessages,
    deleteSession,
    getCurrentSession,
  };
}