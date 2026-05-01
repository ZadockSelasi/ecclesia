import { useState, useRef, useEffect } from "react";
import { MessageSquarePlus, X, Send, Bot, Zap } from "lucide-react";
import { clsx } from "clsx";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Hello! I am your Ecclesia AI assistant. Whether you need task descriptions, marketing copy, or technical support, I am here to help. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Create context string from previous messages (simple approach)
      let historyText = messages
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");
      historyText += `\nUser: ${userMessage.content}\nAssistant:`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  "You are the AI assistant for Ecclesia Brands, a creative/design agency. Keep your answers concise, professional, and helpful.\n" +
                  historyText,
              },
            ],
          },
        ],
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.text || "I could not process that request.",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          "fixed bottom-6 right-6 w-14 h-14 bg-brand-green rounded-full shadow-lg shadow-brand-green/20 flex items-center justify-center text-black hover:bg-brand-green-dark transition-all z-50",
          isOpen ? "scale-0" : "scale-100",
        )}
      >
        <Zap size={24} fill="currentColor" />
      </button>

      {/* Chat Window */}
      <div
        className={clsx(
          "fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] flex flex-col bg-secondary-bg border border-primary-text/10 rounded-2xl shadow-2xl z-50 transition-all duration-300 origin-bottom-right transform",
          isOpen
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0 pointer-events-none",
        )}
      >
        {/* Header */}
        <div className="h-16 border-b border-primary-text/10 flex items-center justify-between px-4 shrink-0 bg-primary-text/5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Ecclesia AI</h3>
              <p className="text-[10px] text-primary-text/40">Always active</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-primary-text/40 hover:text-primary-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={clsx(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-brand-green text-black rounded-br-sm font-medium"
                    : "bg-primary-text/10 text-primary-text/90 rounded-bl-sm",
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-primary-text/10 text-primary-text/90 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary-text/40 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-primary-text/40 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-primary-text/40 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-primary-text/10 bg-secondary-bg rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-primary-text/5 border border-primary-text/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green text-primary-text placeholder-white/30"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-brand-green text-black flex items-center justify-center disabled:opacity-50 hover:bg-brand-green-dark transition-colors shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
