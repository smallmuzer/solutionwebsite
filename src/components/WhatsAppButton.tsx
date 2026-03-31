import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/localClient";

type Msg = { role: "user" | "assistant"; content: string };

const WhatsAppButton = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const [waNumber, setWaNumber] = useState("9603011355");
  const [contactEmail, setContactEmail] = useState("info@solutions.com.mv");
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem("bss_chat_session");
    if (saved) return saved;
    const fresh = `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("bss_chat_session", fresh);
    return fresh;
  });
  const [messages, setMessages] = useState<Msg[]>(() => {
    const saved = localStorage.getItem("bss_chat_history");
    return saved ? JSON.parse(saved) : [
      { role: "assistant", content: "Hi! 👋 I'm the Brilliant System Solutions virtual assistant.\n\nI can help you with:\n• HR & Payroll software\n• ERP & CRM systems\n• Web & Mobile development\n• Pricing, demos & trials\n\nWhat can I help you with today?" },
    ];
  });

  useEffect(() => {
    localStorage.setItem("bss_chat_history", JSON.stringify(messages));
  }, [messages]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("site_content").select("content").eq("section_key", "settings").maybeSingle()
      .then(({ data }) => {
        if (!data?.content) return;
        const c = data.content as any;
        if (c.whatsapp_number) setWaNumber(c.whatsapp_number);
        if (c.contact_email || c.hr_email) setContactEmail(c.contact_email || c.hr_email);
      });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const openChat = () => { setChatMounted(true); setTimeout(() => setChatOpen(true), 10); };
  const closeChat = () => { setChatOpen(false); setTimeout(() => setChatMounted(false), 300); };

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const resp = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          session_id: sessionId,
          from: "website-widget",
          history: updatedMessages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
        }),
      });
      const json = await resp.json();
      const reply = json?.data?.bot_message?.reply;
      if (reply) {
        setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      } else {
        throw new Error("No reply");
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `I'm having trouble connecting right now. Please contact us directly:\n📧 ${contactEmail}\n📱 WhatsApp: ${waNumber}`,
      }]);
    }
    setIsLoading(false);
  };

  const [showWAModal, setShowWAModal] = useState(false);

  const handleWAOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowWAModal(true);
  };

  return (
    <>
      {/* Floating buttons */}
      <div id="tour-float-btns" className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        {/* Bot */}
        <button
          id="tour-bot-btn"
          onClick={chatOpen ? closeChat : openChat}
          title="Chat with us"
          style={{ width: 48, height: 48, borderRadius: "50%", background: "hsl(217 91% 60%)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", cursor: "pointer", transition: "transform 0.2s ease" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Bot size={22} />
        </button>

        {/* WhatsApp */}
        <button
          id="tour-wa-btn"
          onClick={handleWAOpen}
          aria-label="Chat on WhatsApp"
          style={{ width: 48, height: 48, borderRadius: "50%", background: "#25D366", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", cursor: "pointer", transition: "transform 0.2s ease" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <svg viewBox="0 0 32 32" width="24" height="24" fill="white">
            <path d="M16.004 2.667A13.26 13.26 0 002.667 15.89a13.16 13.16 0 001.907 6.848L2.667 29.333l6.81-1.786a13.3 13.3 0 006.527 1.706h.006c7.32 0 13.323-5.953 13.323-13.27a13.19 13.19 0 00-3.9-9.41 13.24 13.24 0 00-9.43-3.906zm0 24.29a11.04 11.04 0 01-5.627-1.54l-.404-.24-4.184 1.097 1.117-4.08-.263-.418a10.96 10.96 0 01-1.683-5.886c0-6.075 4.946-11.02 11.044-11.02a10.96 10.96 0 017.8 3.23 10.95 10.95 0 013.23 7.8c0 6.08-4.953 11.027-11.03 11.027v.03zm6.05-8.26c-.332-.166-1.963-.969-2.268-1.08-.305-.11-.527-.165-.749.167-.222.332-.86 1.08-1.054 1.302-.194.222-.388.25-.72.083-.332-.166-1.402-.517-2.67-1.648-.988-.88-1.654-1.966-1.848-2.298-.194-.332-.02-.512.146-.677.149-.149.332-.388.498-.582.166-.194.222-.332.332-.555.111-.222.056-.416-.028-.582-.083-.166-.748-1.804-1.025-2.47-.27-.648-.544-.56-.748-.57-.194-.01-.416-.012-.638-.012a1.224 1.224 0 00-.887.416c-.305.332-1.164 1.136-1.164 2.77 0 1.635 1.192 3.214 1.358 3.436.166.222 2.346 3.58 5.685 5.02.794.343 1.414.548 1.898.701.797.253 1.523.217 2.096.132.64-.095 1.963-.803 2.24-1.578.277-.775.277-1.44.194-1.578-.083-.138-.305-.222-.637-.388z" />
          </svg>
        </button>
      </div>

      {/* WhatsApp Interceptor Modal */}
      {showWAModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowWAModal(false)} />
          <div className="relative glass-card p-8 max-w-sm w-full text-center shadow-2xl scale-in-center">
            <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 32 32" width="32" height="32" fill="#25D366">
                <path d="M16.004 2.667A13.26 13.26 0 002.667 15.89a13.16 13.16 0 001.907 6.848L2.667 29.333l6.81-1.786a13.3 13.3 0 006.527 1.706h.006c7.32 0 13.323-5.953 13.323-13.27a13.19 13.19 0 00-3.9-9.41 13.24 13.24 0 00-9.43-3.906zm0 24.29a11.04 11.04 0 01-5.627-1.54l-.404-.24-4.184 1.097 1.117-4.08-.263-.418a10.96 10.96 0 01-1.683-5.886c0-6.075 4.946-11.02 11.044-11.02a10.96 10.96 0 017.8 3.23 10.95 10.95 0 013.23 7.8c0 6.08-4.953 11.027-11.03 11.027v.03zm6.05-8.26c-.332-.166-1.963-.969-2.268-1.08-.305-.11-.527-.165-.749.167-.222.332-.86 1.08-1.054 1.302-.194.222-.388.25-.72.083-.332-.166-1.402-.517-2.67-1.648-.988-.88-1.654-1.966-1.848-2.298-.194-.332-.02-.512.146-.677.149-.149.332-.388.498-.582.166-.194.222-.332.332-.555.111-.222.056-.416-.028-.582-.083-.166-.748-1.804-1.025-2.47-.27-.648-.544-.56-.748-.57-.194-.01-.416-.012-.638-.012a1.224 1.224 0 00-.887.416c-.305.332-1.164 1.136-1.164 2.77 0 1.635 1.192 3.214 1.358 3.436.166.222 2.346 3.58 5.685 5.02.794.343 1.414.548 1.898.701.797.253 1.523.217 2.096.132.64-.095 1.963-.803 2.24-1.578.277-.775.277-1.44.194-1.578-.083-.138-.305-.222-.637-.388z" />
              </svg>
            </div>
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">WhatsApp Redirect</h3>
            <p className="text-muted-foreground text-sm mb-6">You're about to be redirected to WhatsApp to chat with our expert team.</p>
            <div className="flex flex-col gap-3">
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowWAModal(false)}
                className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl hover:opacity-90 shadow-lg transition-all"
              >
                Continue to WhatsApp
              </a>
              <button
                onClick={() => setShowWAModal(false)}
                className="w-full py-2.5 text-muted-foreground font-medium text-sm hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* This closing div and a tag were misplaced, removing them to fix syntax */}
      {/* </a> */}
      {/* </div> */}

      {/* Chat window */}
      {chatMounted && (
        <div
          style={{
            position: "fixed", bottom: 80, right: 16, zIndex: 50,
            width: 370, maxWidth: "calc(100vw - 2rem)",
            height: 520, maxHeight: "75vh",
            opacity: chatOpen ? 1 : 0,
            transform: chatOpen ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
            pointerEvents: chatOpen ? "all" : "none",
          }}
          className="glass-card flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-secondary text-secondary-foreground rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <div className="font-heading font-semibold text-sm">BSS Assistant</div>
                <div className="text-[0.625rem] opacity-80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block" />
                  Online · Replies instantly
                </div>
              </div>
            </div>
            <button onClick={closeChat} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={13} className="text-secondary" />
                  </div>
                )}
                <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm shadow-sm ${msg.role === "user"
                    ? "bg-secondary text-secondary-foreground rounded-br-sm"
                    : "bg-card text-foreground border border-border/50 rounded-bl-sm"
                  }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none [&>p]:m-0 [&>p+p]:mt-1 [&>ul]:mt-1 [&>ul]:pl-4 [&>ul>li]:text-[0.8125rem]">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span>{msg.content}</span>
                  )}
                  <div className={`text-[0.625rem] mt-1 ${msg.role === "user" ? "text-secondary-foreground/60 text-right" : "text-muted-foreground"}`}>
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={13} className="text-secondary" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                  <Bot size={13} className="text-secondary" />
                </div>
                <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-secondary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-secondary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-secondary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick replies */}
          {messages.length === 1 && (
            <div className="px-3 py-2 flex gap-1.5 flex-wrap border-t border-border/50 bg-background/50">
              {["HR Software", "ERP Demo", "Pricing", "Contact Us"].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-[0.6875rem] px-2.5 py-1 rounded-full border border-secondary/40 text-secondary hover:bg-secondary hover:text-secondary-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border bg-background/80">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 rounded-full bg-muted border border-border text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-50 shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default WhatsAppButton;
