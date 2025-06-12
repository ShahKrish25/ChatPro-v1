import { MessageSquarePlus, Trash2 } from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
}

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSessionSelect: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

export default function ChatHistory({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
}: ChatHistoryProps) {
  return (
    <div className="w-64 h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              currentSessionId === session.id ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
            onClick={() => onSessionSelect(session.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session.timestamp.toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
                title="Delete chat"
              >
                <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}