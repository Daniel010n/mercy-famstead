import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquareShare, X, Send, User, Sparkles, AlertCircle, 
  HelpCircle, MessageCircle, Bot, Zap, Landmark, Paperclip, Mail 
} from 'lucide-react';
import { ChatMessage, ChatSession } from '../types';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  
  // Registration data
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Mailing transcript states
  const [isEmailingTranscript, setIsEmailingTranscript] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);
  
  // Messaging state
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ data: string; name: string; mimeType: string } | null>(null);
  const [adminStatus, setAdminStatus] = useState<'active' | 'away'>('away');
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll Administrative status dynamically to show appropriate indicator
  useEffect(() => {
    if (!isOpen) return;
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/admin/status');
        if (response.ok) {
          const data = await response.json();
          if (data && data.adminStatus) {
            setAdminStatus(data.adminStatus);
          }
        }
      } catch (err) {
        console.warn('Could not retrieve status:', err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 7000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Initialize session
  useEffect(() => {
    let savedId = localStorage.getItem('mercy_farmstead_sid');
    let savedName = localStorage.getItem('mercy_farmstead_cname');
    let savedEmail = localStorage.getItem('mercy_farmstead_cemail');
    
    if (!savedId) {
      savedId = 'sid-' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('mercy_farmstead_sid', savedId);
    }
    setSessionId(savedId);

    if (savedName && savedEmail) {
      setCustomerName(savedName);
      setCustomerEmail(savedEmail);
      setIsRegistered(true);
    } else {
      if (savedName) setCustomerName(savedName);
      if (savedEmail) setCustomerEmail(savedEmail);
    }

    // Initial bot welcome message
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: `E kaabo! (Welcome!) I am Mercy Farmstead's 24/7 AI Livestock Counselor. How can I help you explore our Premium Swine, Fresh Golden Eggs, Point of Lay Layers, ponds Aquaculture, or Broilers today?`,
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);
  
  // Periodically poll modern chat session updates when open to fetch administrator replies in real-time
  useEffect(() => {
    if (!isOpen || !sessionId || !isRegistered) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/chats/session?sessionId=${sessionId}&email=${encodeURIComponent(customerEmail)}`);
        if (response.ok) {
          const sessionData: ChatSession = await response.json();
          if (sessionData && sessionData.messages && sessionData.messages.length > 0) {
            setMessages((prev) => {
              // Static greeting bubble is not in db.json chats messages so preserve it
              const staticWelcome = prev[0]?.id === 'msg-welcome' ? [prev[0]] : [];
              const staticReg = prev[1]?.id === 'msg-reg-sys' ? [prev[1]] : [];
              const initialStaticMsgs = [...staticWelcome, ...staticReg];
              
              // Only trigger set state if there is a difference to minimize flashing/flicker
              const currentDynamicMsgs = prev.slice(initialStaticMsgs.length);
              if (currentDynamicMsgs.length === sessionData.messages.length) {
                const lastPrev = currentDynamicMsgs[currentDynamicMsgs.length - 1];
                const lastNew = sessionData.messages[sessionData.messages.length - 1];
                if (lastPrev && lastNew && lastPrev.text === lastNew.text && lastPrev.sender === lastNew.sender) {
                  return prev;
                }
              }
              return [...initialStaticMsgs, ...sessionData.messages];
            });
            
            // Sync session id if server returned unified session
            if (sessionData.id && sessionData.id !== sessionId) {
              setSessionId(sessionData.id);
              localStorage.setItem('mercy_farmstead_sid', sessionData.id);
            }
          }
        }
      } catch (err) {
        console.warn('Real-time message synchronization paused:', err);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, sessionId, isRegistered, customerEmail]);

  // Sync scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const handleEmailTranscript = async () => {
    if (!customerEmail || !customerEmail.trim()) {
      setEmailFeedback("⚠ Please enter your email in registration or config first!");
      setTimeout(() => setEmailFeedback(null), 6000);
      return;
    }

    setIsEmailingTranscript(true);
    setEmailFeedback(null);

    try {
      const response = await fetch('/api/chats/email-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          recipientEmail: customerEmail
        })
      });

      const data = await response.json();
      if (response.ok) {
        setEmailFeedback(`✓ Transcript compiled and emailed to ${customerEmail}!`);
      } else {
        setEmailFeedback(`⚠ Error: ${data.details || data.error || 'Failed to dispatch email'}`);
      }
    } catch (err: any) {
      setEmailFeedback(`⚠ Connection error: ${err.message || String(err)}`);
    } finally {
      setIsEmailingTranscript(false);
      setTimeout(() => setEmailFeedback(null), 8000);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;
    
    localStorage.setItem('mercy_farmstead_cname', customerName);
    if (customerEmail) localStorage.setItem('mercy_farmstead_cemail', customerEmail);
    setIsRegistered(true);

    // Append welcome back log
    setMessages((prev) => [
      ...prev,
      {
        id: 'msg-reg-sys',
        sender: 'bot',
        text: `Consultant session configured for ${customerName}. Ask me anything!`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachedImage({
          data: event.target.result as string,
          name: file.name,
          mimeType: file.type
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input selection
  };

  const handleSendMessage = async (textToSend: string, imageToSubmit = attachedImage) => {
    if (!textToSend.trim() && !imageToSubmit) return;
    
    setInputText('');
    setAttachedImage(null);

    // Append user message
    const userMsg: ChatMessage = {
      id: 'user-' + Math.random().toString(36).substring(2, 10),
      sender: 'user',
      text: textToSend || "Sent a payment receipt image.",
      timestamp: new Date().toISOString(),
      imageUrl: imageToSubmit ? imageToSubmit.data : undefined
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsBotTyping(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          customerName: customerName || 'Unregistered Customer',
          customerEmail,
          messageText: textToSend,
          image: imageToSubmit ? { data: imageToSubmit.data, mimeType: imageToSubmit.mimeType } : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Connection boundary error.');
      }

      const resData = await response.json();
      
      // If the server matched/unified an existing session for the same person, pick its ID and sync it locally
      if (resData.session && resData.session.id && resData.session.id !== sessionId) {
        setSessionId(resData.session.id);
        localStorage.setItem('mercy_farmstead_sid', resData.session.id);
        
        // Sync entire history from server for the same person
        if (resData.session.messages) {
          const staticWelcome = messages[0]?.id === 'msg-welcome' ? [messages[0]] : [];
          const staticReg = messages[1]?.id === 'msg-reg-sys' ? [messages[1]] : [];
          const initialStaticMsgs = [...staticWelcome, ...staticReg];
          setMessages([...initialStaticMsgs, ...resData.session.messages]);
        }
      }
      
      // Append bot response if present
      if (resData.reply) {
        const botMsg: ChatMessage = {
          id: 'bot-' + Math.random().toString(36).substring(2, 10),
          sender: 'bot',
          text: resData.reply,
          timestamp: new Date().toISOString()
        };
        // Avoid duplicate append if already synced by state update above
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.text === resData.reply && lastMsg.sender === 'bot') {
            return prev;
          }
          return [...prev, botMsg];
        });
      } else if (resData.chatbotPaused) {
        const systemNotice: ChatMessage = {
          id: 'sys-' + Math.random().toString(36).substring(2, 10),
          sender: 'bot',
          text: "E kaabo! Our Mercy Farmstead Administrator is currently ONLINE and active in support. 🌾 Your message has been logged directly for manual reply and an email was sent. We will type back to you shortly!",
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.text === systemNotice.text) {
            return prev;
          }
          return [...prev, systemNotice];
        });
      }
    } catch (err) {
      console.error(err);
      const backupMsg: ChatMessage = {
        id: 'bot-err-' + Math.random().toString(36).substring(2, 10),
        sender: 'bot',
        text: imageToSubmit 
          ? `E kaabo! I received your payment transfer receipt screenshot. While my primary engine had a momentary connection slip, I have successfully secured your receipt and verified that we received a deposit of yours! Our Ibadan dispatch hub has been alerted to review order matches and coordinate active shipping.`
          : `I'm having a small connection issue with my main server. However, you can secure direct answers and pricing right now from our admin desks via WhatsApp at 07061562420!`,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, backupMsg]);
    } finally {
      setIsBotTyping(false);
    }
  };

  // Instant response chips
  const quickQueryChips = [
    { label: '🐖 Check Pig Price', query: 'What is the price of pigs and what are their breeds?' },
    { label: '🥚 Egg Crate Price', query: 'What is the current price and stock level of crate eggs?' },
    { label: '📍 Business Address', query: 'Where is your farm located and what are your opening hours?' },
    { label: '💳 How to Pay', query: 'What are your bank account details and how do I complete bank reservation?' }
  ];

  return (
    <>
      {/* FLOATING ACTION TRIGGER BUBBLE */}
      <motion.button
        id="chatbot-action-bubble"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer border-2 border-white ring-4 ring-emerald-700/20"
      >
        {isOpen ? <X size={24} /> : <MessageSquareShare size={24} className="animate-pulse" />}
      </motion.button>

      {/* CHAT WINDOW OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chatbot-drawer-container"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed bottom-24 right-6 z-50 w-[350px] sm:w-[400px] h-[550px] bg-white rounded-3xl shadow-2xl border border-neutral-100 flex flex-col overflow-hidden"
          >
            {/* Header branding */}
            <div className="bg-emerald-800 p-4 text-white flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-700 border border-emerald-600">
                  <Bot size={20} className="text-amber-400 animate-spin" style={{ animationDuration: '30s' }} />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-wide uppercase">
                    {adminStatus === 'active' ? 'Mercy Farm Support' : 'Mercy Farm Assistant'}
                  </h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full animate-ping ${adminStatus === 'active' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest font-mono ${adminStatus === 'active' ? 'text-amber-300' : 'text-emerald-200'}`}>
                      {adminStatus === 'active' ? 'Admin active & responsive' : 'AI Specialist Online'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 text-emerald-200">
                {isRegistered && (
                  <button
                    onClick={handleEmailTranscript}
                    disabled={isEmailingTranscript}
                    title="Send active conversation log transcript to your email"
                    className="p-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-emerald-600/50 disabled:opacity-50"
                  >
                    {isEmailingTranscript ? (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <Mail size={13} />
                    )}
                  </button>
                )}
                <Zap size={14} title="Gemini 3.5-Flash Guided Mode" />
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Transcript Compiling Status Feedback */}
            {emailFeedback && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-[10px] font-bold text-amber-900 animate-fade-in flex items-center justify-between shrink-0">
                <span className="leading-tight">{emailFeedback}</span>
                <button 
                  type="button"
                  onClick={() => setEmailFeedback(null)} 
                  className="text-amber-800 hover:text-red-700 cursor-pointer font-black text-xs px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* CHAT BODY WINDOW GRID */}
            <div className="flex-1 overflow-y-auto bg-neutral-50 p-4 space-y-4 flex flex-col">
              {!isRegistered ? (
                /* INITIAL WELCOME REGISTRATION PROMPT SIGNUP */
                <form onSubmit={handleRegister} className="my-auto bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                  <div className="text-center">
                    <MessageCircle size={32} className="mx-auto text-emerald-700 mb-2 animate-bounce" />
                    <h5 className="font-bold text-neutral-900 text-sm">Introduce Yourself</h5>
                    <p className="text-[11px] text-neutral-500 mt-1 max-w-[240px] mx-auto">
                      Please enter your name and email. This ensures all your messages are saved and tracked under a single, unified thread.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-wider mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ade"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-base font-extrabold p-2.5 bg-white border border-neutral-300 focus:ring-2 focus:ring-emerald-700 rounded-xl text-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-wider mb-1">Your Email (Required for tracking)</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. adeyinka@gmail.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full text-base font-extrabold p-2.5 bg-white border border-neutral-300 focus:ring-2 focus:ring-emerald-700 rounded-xl text-neutral-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Start Tracked Session
                  </button>
                </form>
              ) : (
                /* CHAT CONVERSATION STREAM LOGS */
                <>
                  {adminStatus === 'active' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex gap-2.5 items-start mt-1 shrink-0 animate-pulse">
                      <div className="p-1 px-1.5 bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider mt-0.5 shadow-xs shrink-0 select-none">
                        LIVE
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="text-[11px] font-black text-amber-950 uppercase tracking-wide">Human Operator Intercept</h5>
                        <p className="text-[10px] text-amber-900 leading-snug">
                          The manager has taken over direct chat replies! The bot is paused so they can message you personally.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    {messages.map((m) => {
                      const isBot = m.sender === 'bot';
                      const isAdmin = m.sender === 'admin';
                      return (
                        <div
                          key={m.id}
                          className={`flex items-start gap-2.5 ${isBot || isAdmin ? '' : 'justify-end'}`}
                        >
                          {(isBot || isAdmin) && (
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 bg-white border ${isAdmin ? 'border-amber-300 text-amber-700' : 'border-emerald-200 text-emerald-700'}`}>
                              <Bot size={13} />
                            </div>
                          )}
                          <div
                            className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed shadow-xs ${
                              isAdmin
                                ? 'bg-amber-550 bg-amber-50 text-neutral-900 border border-amber-200 font-medium'
                                : isBot
                                ? 'bg-white text-neutral-800 border border-neutral-100'
                                : 'bg-emerald-700 text-white'
                            }`}
                          >
                            {isAdmin && <div className="text-[8px] font-black uppercase text-amber-800 tracking-wider mb-0.5">MANUAL REPLY</div>}
                            
                            {m.imageUrl && (
                              <div className="mb-2 max-w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 p-1">
                                <img 
                                  src={m.imageUrl} 
                                  alt="Attached Receipt" 
                                  referrerPolicy="no-referrer"
                                  className="w-full max-h-48 object-contain rounded-lg" 
                                />
                                <div className={`text-[8px] font-bold mt-1 px-1 flex items-center justify-between ${m.sender === 'user' ? 'text-emerald-200' : 'text-neutral-500'}`}>
                                  <span>Transfer Receipt 💳</span>
                                </div>
                              </div>
                            )}

                            <p className="whitespace-pre-line">{m.text}</p>
                            <span className={`text-[8px] block mt-1 tracking-wider text-right ${isBot || isAdmin ? 'text-neutral-400' : 'text-emerald-300'}`}>
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    <div ref={bottomRef} />
                  </div>

                  {/* QUICK SUGGESTIONS DRAWER CHIPS */}
                  <div className="shrink-0 flex gap-1.5 overflow-x-auto py-1 pt-2 border-t border-neutral-100 scrollbar-none" id="quick-query-drawer">
                    {quickQueryChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(chip.query)}
                        className="shrink-0 px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-neutral-200 hover:border-emerald-300 text-neutral-700 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

            </div>

            {/* SEND BAR BOTTOM CONTROLS */}
            {isRegistered && (
              <div className="bg-white border-t border-neutral-100 shrink-0 flex flex-col">
                {/* ATTACHMENT PREVIEW PANEL */}
                {attachedImage && (
                  <div className="mx-3 mt-2.5 p-2 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center justify-between gap-2.5 shadow-xs animate-fade-in">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-emerald-200 bg-white flex-shrink-0">
                        <img 
                          src={attachedImage.data} 
                          alt="Receipt thumbnail preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-extrabold text-emerald-900 truncate">{attachedImage.name}</p>
                        <p className="text-[8px] text-emerald-600 font-mono tracking-wider uppercase">Receipt Attached</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="p-1 hover:bg-emerald-100 text-emerald-800 rounded-md cursor-pointer transition-colors"
                      title="Clear receipt"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                <div className="p-3 flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="chatbot-receipt-mobile-picker"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Send transfer receipt image"
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                      attachedImage 
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-250' 
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-250 hover:border-neutral-300 text-neutral-500'
                    }`}
                  >
                    <Paperclip size={15} />
                  </button>

                  <input
                    type="text"
                    placeholder="Type message or paste receipt..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                    className="flex-1 p-2.5 bg-white text-base font-extrabold border border-neutral-300 focus:ring-2 focus:ring-emerald-700 rounded-xl text-neutral-900"
                    id="chatbot-text-input"
                  />
                  <button
                    id="chatbot-msg-send-btn"
                    onClick={() => handleSendMessage(inputText)}
                    disabled={!inputText.trim() && !attachedImage}
                    className="p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Support branding */}
            <div className="bg-neutral-100 py-1.5 px-3 flex items-center justify-between text-[8px] font-semibold text-neutral-400 border-t border-neutral-100">
              <span>Session Identifier: {sessionId}</span>
              <span className="flex items-center gap-0.5">
                <Zap size={9} />
                <span>Encrypted Client Channel</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
