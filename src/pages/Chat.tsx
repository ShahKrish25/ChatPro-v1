import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Copy, Check, MessageSquare, Sparkles, Brain, Download, Volume2, VolumeX, Mic } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsPDF from 'jspdf';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface CopyState {
  [key: string]: boolean;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copyStates, setCopyStates] = useState<CopyState>({});
  const [streamedText, setStreamedText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMicMode, setIsMicMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [sessionId] = useState(uuidv4());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const lastSoundTimeRef = useRef<number>(Date.now());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { isDark } = useTheme();

  // Initialize speech synthesis
  useEffect(() => {
    speechSynthesisRef.current = new SpeechSynthesisUtterance();

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const avaVoice = voices.find(voice => 
        voice.name.includes('Ava') && 
        voice.name.includes('Online') && 
        voice.name.includes('Natural')
      );

      if (avaVoice) {
        speechSynthesisRef.current.voice = avaVoice;
        speechSynthesisRef.current.rate = 1;
        speechSynthesisRef.current.pitch = 1;
        speechSynthesisRef.current.volume = 1;
      }
    };

    setVoice();
    window.speechSynthesis.onvoiceschanged = setVoice;

    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = (text: string) => {
    if (speechSynthesisRef.current) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        speechSynthesisRef.current.text = text;
        window.speechSynthesis.speak(speechSynthesisRef.current);
        setIsSpeaking(true);

        speechSynthesisRef.current.onend = () => {
          setIsSpeaking(false);
        };
      }
    }
  };

  // Initialize SpeechRecognition and AudioContext for silence detection
  const setupSpeechRecognition = async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('SpeechRecognition API not supported in this browser.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // Setup audio context for silence detection
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const detectSilence = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const threshold = 10; // Adjust this threshold based on testing

        if (volume > threshold) {
          lastSoundTimeRef.current = Date.now();
        }

        const timeSinceLastSound = Date.now() - lastSoundTimeRef.current;
        if (timeSinceLastSound > 3000 && isRecording) { // 3 seconds of silence
          // console.log('Silence detected for 3 seconds, stopping recording...');
          stopRecording();
        } else {
          requestAnimationFrame(detectSilence);
        }
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInput(transcript);
        // console.log('Transcript updated:', transcript);

        if (event.results[0].isFinal) {
          // console.log('Final transcript received:', transcript);
          if (transcript.trim()) {
            // console.log('Submitting final transcript...');
            submitMessage(transcript);
          }
          stopRecording();
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
        setMessages(prev => [
          ...prev,
          {
            content: 'Sorry, there was an error with speech recognition. Please try again.',
            isUser: false,
            timestamp: new Date()
          }
        ]);
      };

      recognition.onend = () => {
        if (isRecording) {
          // console.log('Speech recognition ended, restarting...');
          recognition.start();
        }
      };

      speechRecognitionRef.current = recognition;
      requestAnimationFrame(detectSilence);
    } catch (error) {
      console.error('Error setting up speech recognition:', error);
    }
  };

  const startRecording = () => {
    if (!speechRecognitionRef.current) {
      setupSpeechRecognition();
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.start();
        setIsRecording(true);
        lastSoundTimeRef.current = Date.now();
        // console.log('Recording started...');
      } catch (error) {
        console.error('Failed to start recording:', error);
        setIsRecording(false);
        setIsMicMode(false); // Disable Mic Mode on failure
        setMessages(prev => [
          ...prev,
          {
            content: 'Failed to start microphone. Please try again or switch to Chat Mode.',
            isUser: false,
            timestamp: new Date()
          }
        ]);
      }
    }
  };

  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsRecording(false);
    // console.log('Recording stopped');

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Restart recording if in Mic Mode
    if (isMicMode) {
      // console.log('Mic Mode is active, restarting recording...');
      setTimeout(() => {
        startRecording();
      }, 500); // Small delay to avoid race conditions
    }
  };

  const toggleMicMode = () => {
    if (isMicMode) {
      // Switching to chat mode
      setIsMicMode(false);
      if (isRecording) {
        stopRecording();
      }
      // console.log('Switched to Chat Mode');
    } else {
      // Switching to mic mode
      setIsMicMode(true);
      startRecording();
      // console.log('Switched to Mic Mode');
    }
  };

  const submitMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) {
      // console.log('Message is empty or loading, skipping submission');
      return;
    }

    const userMessage: Message = {
      content: messageText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsThinking(true);
    setStreamedText('');
    // console.log('Message submitted:', userMessage);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: messageText.trim(),
          model: selectedModel,
          session_id: sessionId
        }),
      });

      const data = await response.json();
      const responseText = data.response_text?.replace(/<think>.*?<\/think>/g, '').trim() || 'Sorry, I encountered an error.';
      // console.log('API response:', responseText);

      setIsThinking(false);
      const streamedResponse = await simulateStreamingResponse(responseText);
      
      setMessages(prev => [
        ...prev,
        {
          content: streamedResponse,
          isUser: false,
          timestamp: new Date()
        }
      ]);
      
      setStreamedText('');
    } catch (error) {
      console.error('Submission error:', error);
      setMessages(prev => [
        ...prev,
        {
          content: 'Sorry, I encountered an error. Please check if the model is properly started.',
          isUser: false,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();
    let yPosition = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    pdf.setFontSize(20);
    pdf.text('Chat History', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    messages.forEach((message) => {
      const timestamp = message.timestamp.toLocaleString();
      const sender = message.isUser ? 'You' : 'Bot';
      const header = `${sender} - ${timestamp}`;
      
      pdf.text(header, margin, yPosition);
      yPosition += 7;

      const contentLines = pdf.splitTextToSize(message.content, maxWidth);
      contentLines.forEach((line: string) => {
        if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 7;
      });
      yPosition += 10;
    });

    pdf.save('chat-history.pdf');
  };

  const exportToMarkdown = () => {
    let markdown = '# Chat History\n\n';
    messages.forEach((message) => {
      const timestamp = message.timestamp.toLocaleString();
      const sender = message.isUser ? 'You' : 'Bot';
      markdown += `## ${sender} - ${timestamp}\n\n${message.content}\n\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-history.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const modelMap: { [key: string]: string } = {
      'all': 'llama-3.3-70b-versatile',
      'option-1': 'qwen/qwen3-32b',
      'option-2': 'mistral-saba-24b',
      'option-3': 'llama3-70b-8192',
      'option-4': 'llama-3.1-8b-instant',
      'option-5': 'deepseek-r1-distill-llama-70b',
      'option-6': 'meta-llama/llama-4-maverick-17b-128e-instruct'
    };
    setSelectedModel(modelMap[event.target.id]);
  };

  const MessageContent = useCallback(({ content, isUser, index }: { content: string; isUser: boolean; index: number }) => {
    const messageId = `message-${index}`;
    const isCopied = copyStates[messageId];

    if (isUser) {
      return (
        <div className="relative group">
          <p className="text-sm sm:text-base whitespace-pre-wrap">{content}</p>
          <button
            onClick={() => handleCopyText(content, messageId)}
            className="absolute -right-2 top-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity copy-button"
            title="Copy message"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/70 hover:text-white" />
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="relative group">
        <div className={`prose ${isDark ? 'prose-invert' : ''} max-w-none prose-sm sm:prose-base`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <CodeBlock
                    language={match[1]}
                    value={String(children).replace(/\n$/, '')}
                    index={index}
                  />
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleSpeak(content)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={isSpeaking ? "Stop speaking" : "Speak message"}
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleCopyText(content, messageId)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity copy-button"
            title="Copy message"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200" />
            )}
          </button>
        </div>
      </div>
    );
  }, [copyStates, isDark, isSpeaking]);

  const CodeBlock = useCallback(({ language, value, index }: { language: string; value: string; index: number }) => {
    const codeId = `code-${index}`;
    const isCopied = copyStates[codeId];

    return (
      <div className="relative rounded-lg overflow-hidden my-2 group">
        <div className="absolute right-2 top-2 z-10">
          <button
            onClick={() => handleCopyText(value, codeId)}
            className="p-2 rounded bg-gray-700/50 hover:bg-gray-700/70 text-white transition-colors copy-button"
            title="Copy code"
          >
            {isCopied ? (
              <Check className="w-4 h-4 copy-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="absolute left-2 top-2 z-10">
          <span className="px-2 py-1 rounded text-xs text-gray-400 bg-gray-800/50">
            {language}
          </span>
        </div>
        <SyntaxHighlighter
          language={language}
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: '2rem 1rem 1rem',
            backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5',
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    );
  }, [copyStates, isDark]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedText, scrollToBottom]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [input]);

  const handleCopyText = async (text: string, index: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStates(prev => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [index]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage(input);
    }
  };

  const simulateStreamingResponse = async (response: string) => {
    const words = response.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      setStreamedText(currentText);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10));
    }
    
    return currentText;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(input);
  };

  const ThinkingAnimation = () => (
    <div className="flex items-center gap-2 animate-pulse-subtle">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-thinking" style={{ animationDelay: '0s' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-thinking" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-thinking" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );

  const WelcomeHero = useCallback(() => (
    <div className="flex flex-col items-center justify-center h-[100%] text-center px-4 py-2 animate-fade-in">
      <h1 className="text-3xl sm:text-4xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 animate-fade-in-down">
        Hey human, how can I help you today?
      </h1>
      <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl animate-fade-in">
        I'm your AI assistant, ready to help with any questions, coding challenges, or discussions you'd like to have.
      </p>
      <div className="grid grid-cols-1 hidden lg:flex sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
          <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Chat Naturally</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Ask questions in your own words</p>
        </div>
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors animate-bounce-in" style={{ animationDelay: '0.1s' }}>
          <Brain className="w-full h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 mb-3" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Get Smart Answers</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Detailed and accurate responses</p>
        </div>
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 mb-3" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Code Support</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Get help with programming</p>
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className="w-full mt-11 max-w-7xl mx-auto h-[calc(85vh-64px)] flex flex-col overflow-hidden px-2 sm:px-4">
      <div className="h-full bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden flex flex-col">
        <div className="bg-indigo-600 dark:bg-indigo-900 p-3 sm:p-4 flex-shrink-0 animate-fade-in-down">
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
              ChatPro Chat
            </h1>
            <div className="select">
              <div
                className="selected"
                data-default="llama-3.3-70b"
                data-one="qwen/qwen3-32b"
                data-two="mistral-saba-24b"
                data-three="llama3-70b-8192"
                data-four="llama-3.1-8b-instant"
                data-five="deepseek-r1-distill-llama-70b"
                data-six="meta-llama/llama-4-maverick-17b-128e-instruct"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="1em"
                  viewBox="0 0 512 512"
                  className="arrow"
                >
                  <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"></path>
                </svg>
              </div>
              <div className="options font-normal">
                <div title="llama-3.3-70b-versatile">
                  <input id="all" name="option" type="radio" defaultChecked onChange={handleModelChange} />
                  <label className="option" htmlFor="all" data-txt="llama-3.3-70b"></label>
                </div>
                <div title="qwen/qwen3-32b">
                  <input id="option-1" name="option" type="radio" onChange={handleModelChange} />
                  <label className="option" htmlFor="option-1" data-txt="qwen/qwen3-32b"></label>
                </div>
                <div title="mistral-saba-24b">
                  <input id="option-2" name="option" type="radio" onChange={handleModelChange} />
                  <label className="option" htmlFor="option-2" data-txt="mistral-saba-24b"></label>
                </div>
                <div title="llama3-70b-8192">
                  <input id="option-3" name="option" type="radio" onChange={handleModelChange} />
                  <label className="option" htmlFor="option-3" data-txt="llama3-70b-8192"></label>
                </div>
                <div title="llama-3.1-8b-instant">
                  <input id="option-4" name="option" type="radio" onChange={handleModelChange} />
                  <label className="option" htmlFor="option-4" data-txt="llama-3.1-8b-instant"></label>
                </div>
                <div title="deepseek-r1-distill-llama-70b">
                  <input id="option-5" name="option" type="radio" onChange={handleModelChange} />
                  <label className="option" htmlFor="option-5" data-txt="deepseek-r1-distill-llama-70b"></label>
                </div>
                <div title="meta-llama/llama-4-maverick-17b-128e-instruct">
                  <input id="option-6" name="option" type="radio" onChange={handleModelChange} />
                  <label className="option" htmlFor="option-6" data-txt="meta-llama/llama-4-maverick-17b-128e-instruct"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar"
        >
          {messages.length === 0 ? (
            <WelcomeHero />
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.isUser ? 'flex-row-reverse' : ''
                  } message-enter`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.isUser
                        ? 'bg-indigo-600 dark:bg-indigo-500'
                        : 'bg-gray-600 dark:bg-gray-700'
                    }`}
                  >
                    {message.isUser ? (
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] sm:max-w-[90%] rounded-lg p-3 sm:p-4 ${
                      message.isUser
                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <MessageContent
                        content={message.content}
                        isUser={message.isUser}
                        index={index}
                      />
                    </div>
                    <span className="text-xs sm:text-sm opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex items-start gap-3 animate-fade-in">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center">
                    <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="max-w-[85%] sm:max-w-[90%] rounded-lg p-3 sm:p-4 bg-gray-100 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-300">Thinking</span>
                      <ThinkingAnimation />
                    </div>
                  </div>
                </div>
              )}
              {isLoading && streamedText && (
                <div className="flex items-start gap-3 animate-fade-in">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center">
                    <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="max-w-[85%] sm:max-w-[90%] rounded-lg p-3 sm:p-4 bg-gray-100 dark:bg-gray-800">
                    <div className={`prose ${isDark ? 'prose-invert' : ''} max-w-none prose-sm sm:prose-base`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamedText}
                      </ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Generating response...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} className="h-0" />
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="p-3 sm:p-4 border-t dark:border-gray-700 flex-shrink-0 animate-fade-in-up"
        >
          <div className="flex gap-2 sm:gap-3 items-center">
            <button
              onClick={exportToPDF}
              className={`bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors p-[0.6rem] ${messages.length === 0 ? 'hidden' : ''}`}
              title="Export as PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <div className="flex-grow relative">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isMicMode ? "Mic Mode Active - Speak to chat" : "Type your message..."}
                className="w-full px-3 py-2 text-sm sm:text-base rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none max-h-32 chat-input"
                disabled={isLoading || isMicMode}
              />
            </div>
            <button
              type="button"
              onClick={toggleMicMode}
              disabled={isLoading}
              className={`p-2 sm:p-3 rounded-lg transition-colors flex-shrink-0 ${
                isMicMode
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-600 dark:bg-gray-500 hover:bg-gray-700 dark:hover:bg-gray-600 text-white'
              }`}
              title={isMicMode ? "Switch to Chat Mode" : "Switch to Mic Mode"}
            >
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="submit"
              disabled={isLoading || !input.trim() || isMicMode}
              className="p-2 sm:p-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Mode: {isMicMode ? 'Mic Mode (Speak to chat)' : 'Chat Mode (Type to chat)'}
          </div>
        </form>
      </div>
    </div>
  );
}