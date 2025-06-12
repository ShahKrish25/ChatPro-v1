"use client"

import { useState, useRef, useEffect } from "react"
import {
  type Wand2,
  FileText,
  Code2,
  Sparkles,
  Send,
  Loader2,
  Copy,
  Check,
  StopCircle,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Menu,
  X,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// Define types for tasks
type TaskType = "summarize" | "explain-code" | "creative-writing"

interface Task {
  id: TaskType
  title: string
  description: string
  icon: typeof Wand2
  placeholder: string
  outputFormat: "text" | "markdown" | "code"
}

// Predefined tasks for the AI Playground
const tasks: Task[] = [
  {
    id: "summarize",
    title: "Text Summarization",
    description: "Condense long texts into clear, concise summaries",
    icon: FileText,
    placeholder: "Paste your text here to get a summary...",
    outputFormat: "markdown",
  },
  {
    id: "explain-code",
    title: "Code Explanation",
    description: "Get detailed explanations of code snippets",
    icon: Code2,
    placeholder: "Paste your code here for an explanation...",
    outputFormat: "markdown",
  },
  {
    id: "creative-writing",
    title: "Creative Writing",
    description: "Get help with creative writing tasks",
    icon: Sparkles,
    placeholder: "Describe what you want to write about...",
    outputFormat: "markdown",
  },
]

// Predefined AI models
const models = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
  { id: "qwen/qwen3-32b", name: "Qwen 3 32B" },
  { id: "mistral-saba-24b", name: "Mistral Saba 24B" },
  { id: "llama3-70b-8192", name: "Llama 3 70B" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant" },
  { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 70B" },
  { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick 17B" },
]

export default function Playground() {
  const [selectedTask, setSelectedTask] = useState<TaskType>("summarize")
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile")
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isDark, setIsDark] = useState(true) // State for theme
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) // State for mobile task menu

  const abortControllerRef = useRef<AbortController | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const voicesLoaded = useRef(false) // To track if voices are loaded

  // Initialize theme from localStorage and apply it on component mount
  useEffect(() => {
    // if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme")
      if (savedTheme === "dark") {
        setIsDark(true)
        document.documentElement.classList.add("dark")
      } else {
        // Default to light if no preference or 'light'
        setIsDark(false)
        document.documentElement.classList.remove("dark")
      }

      // Initialize speech synthesis voices
      const initVoices = () => {
        if (!voicesLoaded.current) {
          window.speechSynthesis.getVoices() // Populate voices
          voicesLoaded.current = true
        }
      }

      // Listen for voiceschanged event
      window.speechSynthesis.onvoiceschanged = initVoices
      // Call immediately in case voices are already loaded
      initVoices()
    // }

    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, []) // Empty dependency array ensures this runs only once on mount

  // Effect to update document class when isDark state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isDark) {
        document.documentElement.classList.add("dark")
        localStorage.setItem("theme", "dark")
      } else {
        document.documentElement.classList.remove("dark")
        localStorage.setItem("theme", "light")
      }
    }
  }, [isDark]) // Rerun when isDark changes

  // Toggle theme function
  // const toggleTheme = () => {
  //   setIsDark((prev) => !prev)
  // }

  // Handle task change, reset input/output, stop speech
  const handleTaskChange = (taskId: TaskType) => {
    stopSpeaking()
    setSelectedTask(taskId)
    setInput("")
    setOutput("")
    setIsMobileMenuOpen(false) // Close mobile menu on task selection
  }

  const cleanAiOutput = (text: string) => {
  
    const cleanedText = text.replace(/"(text-[a-z0-9-]+(?:\s+dark:text-[a-z0-9-]+)*)">/g, '">')
    return cleanedText
  }

  // Handle form submission to fetch AI output
  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    stopSpeaking()
    setIsLoading(true)
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/playground`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: selectedTask,
          model: selectedModel,
          input: input.trim(),
        }),
        signal: abortControllerRef.current.signal,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      // Clean the output before setting it to state to fix rendering errors
      const processedOutput = cleanAiOutput(data.response || "No output received from the model.")
      setOutput(processedOutput)
    } catch (error: any) {
      if (error.name === "AbortError") {
        setOutput("Generation stopped.")
      } else {
        setOutput("❌ Error: " + (error.message || "Failed to fetch AI output."))
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  // Handle stopping the AI generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  // Handle copying output to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  // Function to strip markdown for plain text output
  const stripMarkdown = (markdownText: string) => {
    // Remove headers
    let plainText = markdownText.replace(/^#+\s.*$/gm, "")
    // Remove bold/italic/strikethrough
    plainText = plainText.replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    plainText = plainText.replace(/(\*|_)(.*?)\1/g, "$2") // italic
    plainText = plainText.replace(/~~(.*?)~~/g, "$1") // strikethrough
    // Remove links (keep link text)
    plainText = plainText.replace(/\[(.*?)\]$$.*?$$/g, "$1")
    // Remove images (keep alt text)
    plainText = plainText.replace(/!\[(.*?)\]$$.*?$$/g, "$1")
    // Remove code blocks
    plainText = plainText.replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    plainText = plainText.replace(/`([^`]+)`/g, "$1")
    // Remove blockquotes
    plainText = plainText.replace(/^>\s.*$/gm, "")
    // Remove list markers
    plainText = plainText.replace(/^(\s*[-*+]|\s*\d+\.)\s+/gm, "")
    // Replace multiple newlines with single newlines
    plainText = plainText.replace(/\n{2,}/g, "\n\n")
    // Trim whitespace from each line
    plainText = plainText
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
    // Remove leading/trailing whitespace
    plainText = plainText.trim()
    return plainText
  }

  // Handle downloading output in various formats
  const handleDownload = (format: "txt" | "md" | "json") => {
    if (!output) return

    let content = output
    let mimeType = "text/plain"
    const filename = `ai-playground-output.${format}`

    switch (format) {
      case "txt":
        content = stripMarkdown(output) // Strip markdown for plain text
        mimeType = "text/plain"
        break
      case "md":
        mimeType = "text/markdown"
        break
      case "json":
        content = JSON.stringify(
          {
            task: selectedTask,
            model: selectedModel,
            input: input,
            output: output,
            timestamp: new Date().toISOString(),
          },
          null,
          2,
        )
        mimeType = "application/json"
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Handle sharing output using Web Share API or fallback to copy
  const handleShare = async () => {
    if (navigator.share && output) {
      try {
        await navigator.share({
          title: "AI Playground Output",
          text: output.substring(0, 200) + "...", // Share a snippet
        })
      } catch (err) {
        // Fallback to copy if share fails or is not supported
        handleCopy()
      }
    } else {
      handleCopy() // Fallback for unsupported browsers
    }
  }

  // Toggle speech synthesis
  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking()
    } else {
      startSpeaking()
    }
  }

  // Start speech synthesis
  const startSpeaking = () => {
    if (!output || isSpeaking) return

    // Strip markdown for better speech readability
    const textContent = stripMarkdown(output)
    const utterance = new SpeechSynthesisUtterance(textContent)

    // Ensure voices are loaded before attempting to select
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice =
      voices.find((voice) => voice.name.includes("Microsoft Aria")) ||
      voices.find((voice) => voice.name.includes("Google") && voice.lang.startsWith("en")) ||
      voices.find((voice) => voice.lang.startsWith("en"))

    if (preferredVoice) {
      utterance.voice = preferredVoice
    } else {
      console.warn("Preferred voice not found, using default voice.")
    }

    utterance.rate = 0.9 // Slightly slower for better comprehension
    utterance.pitch = 1
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event)
      setIsSpeaking(false)
    }

    speechSynthesisRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }

  // Stop speech synthesis
  const stopSpeaking = () => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel()
    }
    speechSynthesisRef.current = null
    setIsSpeaking(false)
  }

  // Custom Markdown renderer components for ReactMarkdown
  const renderMarkdownContent = (content: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraphs with improved spacing and text color
          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-gray-800 dark:text-gray-200" {...props} />,
          // Headings with distinct sizes, bolding, and spacing
          h1: ({ node, ...props }) => (
            <h1
              className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white border-b-2 border-indigo-500 pb-2"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-white" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-900 dark:text-white" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-lg font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-200" {...props} />
          ),
          // Lists with proper indentation and item spacing
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="text-gray-800 dark:text-gray-200 leading-relaxed" {...props} />,
          // Code blocks and inline code with improved styling
          code({ inline, className, children, ...props }) {
            if (inline) {
              return (
                <code
                  className="bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded text-sm font-mono whitespace-nowrap"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            // Extract language from className (e.g., "language-javascript") for display
            const language = className?.replace("language-", "") || "text"
            return (
              <div className="relative group">
                <div className="absolute top-2 right-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {language}
                </div>
                <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-lg overflow-x-auto my-4">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            )
          },
          // Blockquotes with a distinct border and background
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 pl-4 py-2 my-4 italic text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
          // Tables with responsive overflow and clear borders
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-gray-300 dark:border-gray-600">
              <table className="min-w-full table-auto border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
          th: ({ node, ...props }) => (
            <th
              className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-semibold text-left text-gray-900 dark:text-white"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-800 dark:text-gray-200"
              {...props}
            />
          ),
          // Horizontal rule for content separation
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-t-2 border-gray-300 dark:border-gray-600" {...props} />
          ),
          // Strong and Emphasized text for semantic clarity
          strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-gray-700 dark:text-gray-300" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    )
  }

  // Render the output section based on current task and output content
  const renderOutput = () => {
    const currentTask = tasks.find((t) => t.id === selectedTask)
    if (!output) return null

    return (
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg relative">
          {/* Header with action buttons for output */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">Output Results</h3>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={toggleSpeech}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isSpeaking ? "Stop speaking" : "Read aloud"}
                aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
              >
                {isSpeaking ? (
                  <VolumeX className="w-5 h-5 text-indigo-500" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isCopied ? "Copied!" : "Copy to clipboard"}
                aria-label={isCopied ? "Copied!" : "Copy to clipboard"}
              >
                {isCopied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Share"
                aria-label="Share output"
              >
                <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Download dropdown with options */}
              <div className="relative group">
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Download output"
                >
                  <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[160px]">
                  <button
                    onClick={() => handleDownload("txt")}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white"
                  >
                    Download as TXT
                  </button>
                  <button
                    onClick={() => handleDownload("md")}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white"
                  >
                    Download as Markdown
                  </button>
                  <button
                    onClick={() => handleDownload("json")}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white"
                  >
                    Download as JSON
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Output content area */}
          <div className="p-6">
            <div className="prose dark:prose-invert max-w-none">
              {currentTask?.outputFormat === "code" ? (
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-700">
                  <code className="language-text">{output}</code> {/* Default to text language */}
                </pre>
              ) : currentTask?.outputFormat === "markdown" ? (
                <div className="overflow-x-auto">{renderMarkdownContent(output)}</div>
              ) : (
                <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">{output}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <header className="relative p-6 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">AI Playground</h1>
                <p className="text-indigo-100">Experiment with different AI-powered creative tasks</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Theme Toggle Button */}
                {/* <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
                </button> */}

                {/* Mobile Menu Toggle Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>
          </header>

          <main className="p-4">
            {/* Task Selection - Responsive with mobile menu */}
            <section
              className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "block" : "hidden md:grid"}`}
            >
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskChange(task.id)}
                  className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    selectedTask === task.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg"
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md"
                  }`}
                  aria-pressed={selectedTask === task.id}
                >
                  <task.icon
                    className={`w-8 h-8 mb-3 ${
                      selectedTask === task.id ? "text-indigo-500" : "text-gray-500 dark:text-gray-400"
                    }`}
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">{task.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{task.description}</p>
                </button>
              ))}
            </section>

            {/* Main Form Section */}
            <section className="space-y-6 ">
              {/* Model Selection */}
<div className="relative">
  <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Select Model
  </label>
  <div className="relative w-full">
    <select
      id="model"
      value={selectedModel}
      onChange={(e) => setSelectedModel(e.target.value)}
      className="block w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors appearance-none truncate pr-10"
    >
      {models.map((model) => (
        <option key={model.id} value={model.id} className="text-sm sm:text-base truncate">
          {model.name}
        </option>
      ))}
    </select>
    {/* Custom dropdown arrow */}
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
      <svg
        className="w-4 h-4 text-gray-500 dark:text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </div>
  </div>
</div>

              {/* Input Textarea */}
              <div>
                <label htmlFor="input-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Input ({input.length} characters)
                </label>
                <textarea
                  id="input-text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={tasks.find((t) => t.id === selectedTask)?.placeholder}
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none transition-colors placeholder-gray-500 dark:placeholder-gray-400"
                  aria-label="Enter text for AI processing"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                {isLoading && (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                    aria-label="Stop AI processing"
                  >
                    <StopCircle className="w-5 h-5" aria-hidden="true" />
                    Stop
                  </button>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  aria-label="Process input with AI"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" aria-hidden="true" />
                      Process
                    </>
                  )}
                </button>
              </div>
            </section>  

            {/* Output Section */}
            {renderOutput()}
          </main>
        </div>
      </div>
  )
}
