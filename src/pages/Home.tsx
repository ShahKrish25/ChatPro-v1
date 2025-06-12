import { ArrowRight, MessageSquare, Sparkles, Bot, Users, User, Code, Brain, Zap, Ellipsis } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(90vh-140px)] px-4 py-6">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-2 w-full">
          <div className="text-center space-y-12">
            <div className="relative inline-block animate-bounce-in">
              <Bot className="w-20 h-20 text-indigo-600 dark:text-indigo-400 mx-auto" />
              <div className="absolute inset-0 animate-ping-slow opacity-30">
                <Bot className="w-20 h-20 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 animate-gradient mb-6">
              ChatPro
            </h1>
            <p className="text-sm md:text-lg text-gray-700 dark:text-gray-200 text-center mb-8 max-w-4xl mx-auto animate-fade-in-up">
              Experience the future of interaction, where every question leads to profound understanding. <br/>
              The AI chatbot that transforms your queries into insightful dialogues.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
              <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                <MessageSquare className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-4">Smart Chat</h3>
                <p className="text-gray-600 dark:text-gray-300">Engage in natural conversations with our advanced AI assistant</p>
              </div>
              
              <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <Brain className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-4">AI Powered</h3>
                <p className="text-gray-600 dark:text-gray-300">Cutting-edge language model for accurate and helpful responses</p>
              </div>
              
              <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-slide-in-right" style={{ animationDelay: '0.6s' }}>
                <Code className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-4">Vast LLM Support</h3>
                <p className="text-gray-600 dark:text-gray-300">Get expert help with wide range of LLM models for every specific tasks </p>
              </div>
            </div>
            
            {/* Interactive Demo Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 lg:p-12 shadow-lg mb-16 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <h2 className="text-4xl font-bold mb-8">See it in Action</h2>
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                <div className="flex-1 text-left">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
                        <p className="text-lg">How can you help me with coding?</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-lg mb-3">I can help you with:</p>
                        <ul className="list-none space-y-3">
                          <li className="flex items-center gap-2">
                            <Code className="w-5 h-5 text-indigo-500" />
                            <span>Code explanations and reviews</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            <span>Debugging and problem-solving</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-500" />
                            <span>Best practices and patterns</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-green-500" />
                            <span>Performance optimization</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-6 bg-gray-50 dark:bg-gray-900/50 p-8 rounded-xl">
                  <h3 className="text-2xl font-semibold mb-6">Key Features</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg transform hover:scale-105 transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Real-time Responses</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Get instant, accurate answers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg transform hover:scale-105 transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Natural Conversations</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Chat like you're talking to a human</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg transform hover:scale-105 transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Advanced AI</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Powered by cutting-edge technology</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '1s' }}>
              <Link
                to="/chat"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-lg"
              >
                Start Chatting
                <ArrowRight className="ml-2 w-6 h-6" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center px-8 py-4 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}