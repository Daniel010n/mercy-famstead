import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, Send, CheckCircle2, AlertCircle, Copy, Check,
  PhoneCall, Mail, Navigation, ExternalLink, RefreshCw, MapPin
} from 'lucide-react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message })
      });

      if (!res.ok) {
        throw new Error('Could not submit contact message at this time.');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failure. Try again shortly.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-950 py-12 sm:py-16 transition-colors duration-300" id="contact-panel-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-stone-100 tracking-tight font-sans">
            Reach Out to Mercy Farmstead
          </h2>
          <p className="text-sm text-neutral-600 dark:text-stone-400 mt-2">
            Have questions about our swine stock, broiler deliveries, or custom pond orders? Send a direct dispatch to our customer desk in Ibadan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT SECTION: MAP & SOCIAL LINKS (7 Columns) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* GOOGLE MAPS CARD WITH EXACT ADRESS */}
            <div className="bg-neutral-50 p-4 rounded-3xl border border-neutral-100 shadow-sm overflow-hidden" id="google-maps-card">
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider font-mono">Farmstead Coordinates</span>
                </div>
                <a 
                  href="https://maps.google.com/?q=Boluwatife+Maternity,+Wakajaye,+Ibadan,+Oyo+State,+Nigeria" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] font-bold text-emerald-800 hover:text-emerald-900 hover:underline flex items-center gap-1"
                >
                  <span>Open Maps App</span>
                  <ExternalLink size={11} />
                </a>
              </div>

              {/* Exact Google Iframe locator targeted at coordinates */}
              <div className="w-full h-80 rounded-2xl overflow-hidden shadow-inner bg-neutral-200 relative">
                <iframe
                  title="Mercy Farmstead Physical Location Map with Pinpoint"
                  src="https://maps.google.com/maps?q=Boluwatife+Maternity,+Wakajaye,+Ibadan,+Oyo+State,+Nigeria&t=&z=16&ie=UTF8&iwloc=B&output=embed"
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="mt-4 px-2 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-neutral-100 pt-3">
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-neutral-900 flex items-center gap-1.5">
                    <Navigation size={13} className="text-emerald-700" />
                    <span>BESIDE BOLUWATIFE MATERNITY, NO25 TEMIDIRE AJAGBA WAKAJAYE</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 pl-4 font-bold">
                    IBADAN 200113, OYO STATE, NIGERIA.
                  </div>
                </div>
                
                <a 
                  href="https://www.google.com/maps/dir/?api=1&destination=Boluwatife+Maternity,+Wakajaye,+Ibadan,+Oyo+State,+Nigeria"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/10 hover:shadow-md transition-all cursor-pointer whitespace-nowrap self-end md:self-center"
                  id="get-directions-btn"
                >
                  <MapPin size={12} className="text-emerald-100" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>

            {/* SOCIAL DESK CHANNELS CONTROLS */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-neutral-900 px-1">Farm desk links</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="social-desk-grid">
                
                {/* WHATSAPP */}
                <a
                  id="whatsapp-channel-link"
                  href="https://wa.me/2347061562420?text=Hello%20Mercy%20Farmstead!%20I'm%20interested%20in%20inquiring%20about%20your%20farm%20listings."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 transition-all flex items-center gap-3.5 group cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-[#25D366] text-white transition-transform group-hover:scale-110">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-[#128C7E] tracking-wider leading-none">WhatsApp Chat</div>
                    <div className="text-sm font-black text-neutral-950 mt-1 leading-none">07061562420</div>
                    <div className="text-[10px] text-neutral-600 mt-1 flex items-center gap-1 font-semibold">
                      <span>Instant Manager Click</span>
                      <ExternalLink size={10} />
                    </div>
                  </div>
                </a>

                {/* INSTAGRAM */}
                <a
                  id="instagram-channel-link"
                  href="https://www.instagram.com/mercyfarmss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-[#E1306C]/10 hover:bg-[#E1306C]/20 border border-[#E1306C]/30 transition-all flex items-center gap-3.5 group cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white transition-transform group-hover:scale-110">
                    <ExternalLink size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-[#C13584] tracking-wider leading-none">Instagram Desk</div>
                    <div className="text-sm font-black text-neutral-950 mt-1 leading-none">@mercyfarmss</div>
                    <div className="text-[10px] text-neutral-600 mt-1 flex items-center gap-1 font-semibold">
                      <span>Visit Profile Link</span>
                      <ExternalLink size={10} />
                    </div>
                  </div>
                </a>

                {/* TIKTOK */}
                <a
                  id="tiktok-channel-link"
                  href="https://www.tiktok.com/@mercyfarmss"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-black/5 hover:bg-black/10 border border-black/10 transition-all flex items-center gap-3.5 group cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-black text-white transition-transform group-hover:scale-110">
                    <ExternalLink size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-neutral-800 tracking-wider leading-none">TikTok Feeds</div>
                    <div className="text-sm font-black text-neutral-950 mt-1 leading-none">@mercyfarmss</div>
                    <div className="text-[10px] text-neutral-600 mt-1 flex items-center gap-1 font-semibold">
                      <span>Watch Farm Reels</span>
                      <ExternalLink size={10} />
                    </div>
                  </div>
                </a>

                {/* DIRECT EMAIL */}
                <div className="p-4 rounded-2xl bg-neutral-100/70 border border-neutral-200 transition-all flex items-center justify-between gap-2.5 group">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-700 text-white shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-emerald-800 tracking-wider leading-none">Official Mailbox</div>
                      <a href="mailto:mercyfarms01@gmail.com" className="text-[11px] font-bold text-neutral-950 hover:underline mt-1 block truncate max-w-[150px]">
                        mercyfarms01@gmail.com
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy('mercyfarms01@gmail.com', 'email')}
                    className="p-1.5 text-neutral-500 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Copy Email"
                  >
                    {copiedText === 'email' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* RIGHT SECTION: CONTACT FORM SUBMISSION (5 Columns) */}
          <div className="lg:col-span-5">
            
            <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-100 shadow-sm" id="contact-form-card">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Leave a Digital Message</h3>
              <p className="text-xs text-neutral-600 mb-6">
                All submissions immediately dispatch simulated notification emails to our administrator inbox and compile live within our dashboard.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-base font-extrabold p-3 bg-white border border-neutral-300 focus:ring-2 focus:ring-emerald-700 rounded-xl transition-all text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-base font-extrabold p-3 bg-white border border-neutral-300 focus:ring-2 focus:ring-emerald-700 rounded-xl transition-all text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 08033142231"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-base font-extrabold p-3 bg-white border border-neutral-300 focus:ring-2 focus:ring-emerald-700 rounded-xl transition-all text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Message Context <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your wholesale order requests, booking inquiries, or feed questions explicitly..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-base font-extrabold p-3 bg-white border border-neutral-300 focus:ring-2 focus:ring-emerald-700 rounded-xl transition-all resize-none text-neutral-900"
                  />
                </div>

                {/* Statuses */}
                {success && (
                  <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 font-semibold">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Message sent! Thank you for writing us.</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl text-xs flex items-center gap-2 font-semibold">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  id="contact-form-submit-btn"
                  type="submit"
                  disabled={isSending}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Transmit Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Farm Operation hours summary info card */}
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex gap-2.5">
              <PhoneCall size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider leading-none">Operational hours:</div>
                <div className="text-[11px] text-amber-950 font-bold mt-1">Monday - Saturday (8:00 AM - 6:00 PM)</div>
                <div className="text-[10px] text-amber-800 mt-0.5 font-medium">Sunday closed for bio-clean sweeps.</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
