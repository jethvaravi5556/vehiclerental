import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Car, Bot, User, Minimize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChatbotWidget = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "👋 Welcome to VehicleRent! I'm here to help you find the perfect vehicle. Ask me about available cars, bikes, pricing, or your bookings!",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [messages]);

  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { 
      text: input, 
      isBot: false, 
      timestamp: new Date() 
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    simulateTyping();

    try {
      const res = await fetch("/api/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await res.json();
      const botMsg = { 
        text: data.message || "No response.", 
        isBot: true, 
        timestamp: new Date() 
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, { 
        text: "Sorry, I'm having trouble connecting right now. Please try again!", 
        isBot: true,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const quickActions = [
    "Show available vehicles",
    "Check pricing", 
    "My bookings",
    "Top rated vehicles"
  ];

  const handleQuickAction = (action) => {
    if (action === "Show available vehicles") {
      navigate("/vehicles");
      setOpen(false);
    } else if (action === "My bookings") {
      navigate("/my-bookings");
      setOpen(false);
    } else {
      setInput(action);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setOpen(!open)}
          className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white w-14 h-14 rounded-full shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 flex items-center justify-center"
        >
          <div className="relative">
            {open ? (
              <X className="w-6 h-6 transition-transform duration-200" />
            ) : (
              <MessageCircle className="w-6 h-6 transition-transform duration-200" />
            )}
            {!open && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="absolute right-full mr-3 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            {open ? 'Close Chat' : 'Need Help?'}
          </div>
        </button>
      </div>

      {/* Chat Window */}
      {open && (
        <div className={`fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 z-40 ${minimized ? 'h-16' : 'max-h-[80vh] h-[500px]'}`}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">VehicleRent Assistant</h3>
                  <p className="text-blue-100 text-sm">Online • Ready to help</p>
                </div>
              </div>
              <button
                onClick={() => setMinimized(!minimized)}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.isBot ? 'justify-start' : 'justify-end'}`}
                    >
                      {message.isBot && (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`max-w-[280px] ${message.isBot ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm ${
                            message.isBot
                              ? 'bg-white border border-gray-200 text-gray-800'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.text}
                          </p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${message.isBot ? 'text-left' : 'text-right'}`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>

                      {!message.isBot && (
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={bottomRef}></div>
              </div>

              {/* Quick Actions */}
              {messages.length === 1 && (
                <div className="px-4 py-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action)}
                        className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-full text-xs text-blue-700 hover:from-blue-100 hover:to-purple-100 transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Type your message..."
                      disabled={loading}
                      maxLength={500}
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                      {input.length}/500
                    </div>
                  </div>
                  <button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Press Enter to send • Shift + Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;