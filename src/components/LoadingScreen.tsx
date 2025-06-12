import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsVisible(false), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 transition-opacity duration-500 ${
        progress === 100 ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-8 animate-bounce-slow">
          <Bot className="w-full h-full text-white" />
          <div className="absolute inset-0 animate-ping-slow opacity-50">
            <Bot className="w-full h-full text-white" />
          </div>
        </div>
        <div className="w-64 h-2 mb-4 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white text-lg font-medium">Loading ChatPro...</p>
      </div>
    </div>
  );
}