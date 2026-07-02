import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Leaf, ShoppingCart, Menu, X, Clock, HelpCircle, Phone, MapPin, 
  Trash2, ArrowRight, ShieldCheck, Heart, Megaphone, Lock, ArrowLeftRight, Bell, CheckCircle2,
  Sun, Moon
} from 'lucide-react';

// Custom sub-system imports
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import Products from './components/Products';
import Booking from './components/Booking';
import Contact from './components/Contact';
import Chatbot from './components/Chatbot';
import TrackOrder from './components/TrackOrder';
import companyLogo from './assets/images/mercy_farms_logo_1779313335439.png';

// Schema Interfaces
import { Product, Order, Announcement, AppNotification } from './types';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('mercy_farmstead_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mercy_farmstead_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  
  // Datasets
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Notification states
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [customerEmailInput, setCustomerEmailInput] = useState(() => localStorage.getItem('mercy_farmstead_cemail') || '');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Synchronize cart with current live products list. If a product is deleted from the backend, remove it from the cart to avoid crashes or checkout errors.
  useEffect(() => {
    if (products.length > 0 && cart.length > 0) {
      const updatedCart = cart.filter(item => products.some(p => p.id === item.product.id));
      if (updatedCart.length !== cart.length) {
        setCart(updatedCart);
        localStorage.setItem('mercy_farmstead_cart', JSON.stringify(updatedCart));
      }
    }
  }, [products]);

  // Direct checkout bypass
  const [directBookingItem, setDirectBookingItem] = useState<{ product: Product; quantity: number } | null>(null);

  // Order successes overlay
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);

  // Reset verification state when a new order is confirmed
  useEffect(() => {
    if (confirmedOrder) {
      setIsPaymentVerified(false);
    }
  }, [confirmedOrder]);

  // Poll order verification status when a confirmedOrder is open
  useEffect(() => {
    if (!confirmedOrder || isPaymentVerified) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/track?reference=${confirmedOrder.id}&email=${encodeURIComponent(confirmedOrder.customerEmail)}`);
        if (res.ok) {
          const updatedOrder = await res.json();
          if (updatedOrder.paymentStatus === 'Verified') {
            setIsPaymentVerified(true);
            // Save verified order tracking to localStorage immediately so TrackOrder can pick it up without prompting
            localStorage.setItem('mercy_last_tracked_ref', updatedOrder.id.toUpperCase());
            localStorage.setItem('mercy_last_tracked_email', updatedOrder.customerEmail);
          }
        }
      } catch (err) {
        // Silent block - returns 403 while payment status !== 'Verified'
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [confirmedOrder, isPaymentVerified]);

  // Initialize and track hash navigation routing
  useEffect(() => {
    const handleHashCheck = () => {
      const fullHash = window.location.hash.replace('#', '');
      const hash = fullHash.split('?')[0];
      const validTabs = ['home', 'about', 'products', 'booking', 'contact', 'track'];
      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setActiveTab('home');
      }
    };

    window.addEventListener('hashchange', handleHashCheck);
    // Trigger on initial boot load
    handleHashCheck();

    // Cache cart loading
    const savedCart = localStorage.getItem('mercy_farmstead_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.warn('Stale cart configuration dropped.');
      }
    }

    // Dynamic initial fetches
    fetchProductsListing();
    fetchAnnouncements();
    fetchNotifications();

    // Setup polling for live status notifications, products, and announcements
    const notifTimer = setInterval(() => {
      fetchNotifications();
      fetchProductsListing(true);
      fetchAnnouncements();
    }, 8000);

    return () => {
      window.removeEventListener('hashchange', handleHashCheck);
      clearInterval(notifTimer);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const savedEmail = localStorage.getItem('mercy_farmstead_cemail') || '';
      let url = '/api/notifications';
      if (savedEmail) {
        url += `?email=${encodeURIComponent(savedEmail)}`;
      } else {
        url += `?email=all`;
      }
      const res = await fetch(url);
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.warn('Notifications fetch aborted');
    }
  };

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notifId })
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const savedEmail = localStorage.getItem('mercy_farmstead_cemail') || '';
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true, email: savedEmail })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchProductsListing = async (silent = false) => {
    if (!silent) setIsLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (error) {
      console.error('Network boundary blocked product sync:', error);
    } finally {
      if (!silent) setIsLoadingProducts(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch (e) {
      console.warn('Announcement sync aborted');
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      let updated;
      if (idx !== -1) {
        updated = [...prev];
        updated[idx] = { 
          ...updated[idx], 
          quantity: Math.min(product.stock, updated[idx].quantity + quantity) 
        };
      } else {
        updated = [...prev, { product, quantity }];
      }
      localStorage.setItem('mercy_farmstead_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.product.id !== productId);
      localStorage.setItem('mercy_farmstead_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateCartQty = (productId: string, val: number, max: number) => {
    setCart((prev) => {
      const updated = prev.map((item) => {
        if (item.product.id === productId) {
          return { ...item, quantity: Math.max(1, Math.min(val, max)) };
        }
        return item;
      });
      localStorage.setItem('mercy_farmstead_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem('mercy_farmstead_cart');
  };

  // Instant Book routing
  const handleInstantBook = (product: Product, quantity: number) => {
    setDirectBookingItem({ product, quantity });
    navigateTab('booking');
  };

  const cartTotalSum = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const cartTotalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Router dispatcher
  const navigateTab = (tab: string, queryStr?: string) => {
    window.location.hash = queryStr ? `#${tab}?${queryStr}` : `#${tab}`;
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 text-neutral-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-300" id="mercy-farmstead-app">
      
      {/* 1. TOP DYNAMIC BULLETIN NEWS TICKER MARQUEE (Only on Home View) */}
      {activeTab === 'home' && announcements.length > 0 && (
        <div className="bg-emerald-900 text-white text-xs py-2.5 px-4 overflow-hidden relative" id="broadcast-bulletin-ticker">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="flex items-center gap-1 shrink-0 bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-md font-black uppercase text-[9px] tracking-wider animate-pulse">
              <Megaphone size={11} />
              <span>Broadcast</span>
            </span>
            {/* Sliding animation */}
            <div className="flex-1 overflow-hidden relative h-4">
              <div className="absolute flex gap-16 animate-marquee whitespace-nowrap font-bold">
                {announcements.map((a) => (
                  <span key={a.id} className="text-[11px] tracking-wide inline-flex items-center gap-1 hover:text-amber-300 cursor-pointer">
                    <span>📢 {a.title}:</span>
                    <span className="font-medium text-emerald-205 text-emerald-100">{a.content}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. NAVIGATION HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-neutral-100 dark:border-stone-850 shadow-xs shrink-0" id="main-navigation-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Brand Logo design */}
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigateTab('home')} id="header-brand-box">
              <img 
                src={companyLogo} 
                alt="Mercy Farms Logo" 
                className="h-11 w-auto object-contain rounded-lg border border-neutral-100 dark:border-stone-800 shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1" id="header-desktop-nav">
              {['home', 'about', 'products', 'booking', 'track', 'contact'].map((tab) => {
                const active = activeTab === tab;
                const label = tab === 'products' ? 'Catalog' : tab === 'booking' ? 'Booking' : tab === 'track' ? 'Track Order' : tab.charAt(0).toUpperCase() + tab.slice(1);
                return (
                  <button
                    key={tab}
                    id={`nav-link-${tab}`}
                    onClick={() => navigateTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      active 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 font-extrabold' 
                        : 'text-neutral-608 dark:text-stone-300 hover:text-emerald-850 dark:hover:text-emerald-400 hover:bg-neutral-50/50 dark:hover:bg-stone-900'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* Side tools: Shopping Cart & Mobile Menu triggers */}
            <div className="flex items-center gap-3">
              {/* Global Dark Mode Switch */}
              <button
                id="global-theme-toggle-btn"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-3 bg-neutral-100 dark:bg-stone-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/35 text-emerald-800 dark:text-emerald-400 border border-neutral-100 dark:border-stone-850 rounded-xl hover:border-emerald-250 transition-all cursor-pointer flex items-center justify-center shrink-0"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Late-night Dark Theme"}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Notifications Center Bell trigger with live unread counts */}
              <button
                id="notification-hub-trigger-btn"
                onClick={() => {
                  fetchNotifications();
                  setIsNotificationsOpen(true);
                }}
                className="relative p-3 bg-neutral-100 dark:bg-stone-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/35 text-emerald-800 dark:text-emerald-400 border border-neutral-100 dark:border-stone-850 rounded-xl hover:border-emerald-250 transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                <Bell size={18} className={notifications.some(n => !n.read) ? "animate-pulse text-amber-500" : "text-neutral-600 dark:text-stone-300"} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white shadow-md animate-bounce" id="notif-bubble-count">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Shopping Cart button displaying numeric counts */}
              <button
                id="cart-action-drawer-btn"
                onClick={() => setIsCartOpen(true)}
                className="relative p-3 bg-neutral-100 dark:bg-stone-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/35 text-emerald-800 dark:text-emerald-400 border border-neutral-100 dark:border-stone-850 rounded-xl hover:border-emerald-250 transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                <ShoppingCart size={18} className="text-neutral-600 dark:text-stone-300" />
                {cartTotalItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white shadow-md" id="cart-bubble-count">
                    {cartTotalItemCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger menu toggle */}
              <button
                id="mobile-hambuger-menu-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-3 bg-neutral-50 dark:bg-stone-850 text-neutral-700 dark:text-stone-300 hover:bg-neutral-100 dark:hover:bg-stone-800 border border-neutral-100 dark:border-stone-850 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

          </div>
        </div>

        {/* 3. MOBILE TRANSIT MENU DRAWER */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-drawer-inner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-neutral-100 bg-white shadow-lg overflow-hidden shrink-0"
            >
              <div className="p-4 space-y-2">
                {['home', 'about', 'products', 'booking', 'track', 'contact'].map((tab) => {
                  const active = activeTab === tab;
                  const label = tab === 'products' ? 'Catalog' : tab === 'booking' ? 'Booking' : tab === 'track' ? 'Track Order' : tab.charAt(0).toUpperCase() + tab.slice(1);
                  return (
                    <button
                      key={tab}
                      id={`mobile-nav-link-${tab}`}
                      onClick={() => navigateTab(tab)}
                      className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-colors block cursor-pointer ${
                        active ? 'bg-emerald-50 text-emerald-800 font-extrabold' : 'text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 4. MAIN DISPLAY ROUTED CONTENT WRAPPER */}
      <main className="flex-grow shrink-0">
        
        {/* Reservation confirm status card */}
        <AnimatePresence>
          {confirmedOrder && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white p-8 rounded-3xl border border-neutral-100 max-w-lg w-full shadow-2xl relative text-center"
                id="booking-success-modal"
              >
                {!isPaymentVerified ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto mb-4 animate-bounce">
                      <ShieldCheck size={32} />
                    </div>
                    
                    <h3 className="text-xl font-bold font-sans text-neutral-900">Livestock Reservation Received</h3>
                    <p className="text-xs text-rose-600 mt-1.5 uppercase tracking-widest font-black bg-rose-50 px-3 py-1 rounded-full inline-block border border-rose-100">
                      Awaiting Admin Payment Verification ⏳
                    </p>
                    
                    <p className="text-xs text-neutral-600 mt-4 leading-relaxed">
                      Thank you, <strong>{confirmedOrder.customerName}</strong>! We have logged your proof screenshot for verification.
                      <span className="block mt-2 font-semibold text-neutral-800">
                        ⚠️ CRITICAL PROTOCOL: The administrator must verify your payment first before your official Tracking Reference Code is activated or livestock can be allocated.
                      </span>
                    </p>

                    <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-neutral-900 dark:text-stone-105 flex flex-col items-center gap-2.5 animate-pulse">
                      <div className="text-[11px] font-medium leading-relaxed">
                        🌟 <strong>How to get your tracking number?</strong>
                        <p className="mt-1 text-neutral-700">Once a manager checks the <strong>₦{confirmedOrder.totalPrice.toLocaleString()}</strong> manual bank wire receipt post on our ledger, your active tracking details will be released and dispatched to: <strong className="text-emerald-800">{confirmedOrder.customerEmail}</strong>.</p>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-neutral-400 mt-2 italic">
                      Reference Token: [Hidden until payment verified by Admin]
                    </p>

                    <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono space-y-1.5 text-left">
                      <div className="font-bold text-slate-800 text-center border-b border-slate-200 pb-1.5 mb-1 text-[10px] uppercase">WIRE CONFIRMATION TARGET</div>
                      <div>Bank Selected: {confirmedOrder.paymentBank}</div>
                      <div>Account: {confirmedOrder.paymentBank === 'Moniepoint MFB' ? '6213477162' : '1030248864'}</div>
                      <div>Recipient: Mercy Farmstead</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <button
                        onClick={() => {
                          setConfirmedOrder(null);
                          navigateTab('contact');
                        }}
                        className="py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        View Coordinates map
                      </button>
                      <button
                        onClick={() => {
                          setConfirmedOrder(null);
                          navigateTab('products');
                        }}
                        className="py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        Continue cataloging
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-800 flex items-center justify-center mx-auto mb-4 scale-110 shadow-lg animate-bounce animate-none">
                      <CheckCircle2 size={36} className="text-emerald-600 font-extrabold animate-pulse" />
                    </div>

                    <h3 className="text-xl font-bold font-sans text-neutral-900">Payment Approved & Verified! 🎉</h3>
                    <p className="text-xs text-emerald-800 mt-1.5 uppercase tracking-widest font-black bg-emerald-50 px-3 py-1 rounded-full inline-block border border-emerald-250">
                      Payment Verified ✓ Active
                    </p>

                    <p className="text-xs text-neutral-600 mt-4 leading-relaxed">
                      Excellent news, <strong>{confirmedOrder.customerName}</strong>! Your manual bank wire payment of <strong>₦{confirmedOrder.totalPrice.toLocaleString()}</strong> has been audited and fully verified by our finance department.
                      <span className="block mt-2 font-bold text-emerald-700">
                        Success! Your high-grade livestock units have been locked under your allocation file.
                      </span>
                    </p>

                    <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-neutral-900 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider">OFFICIAL TRACKING TOKEN</span>
                      <span className="text-lg font-black font-mono tracking-widest text-emerald-950 bg-white/60 rounded-lg px-4 py-1.5 border border-emerald-100 select-all block my-1">
                        {confirmedOrder.id}
                      </span>
                      <p className="text-[10px] text-neutral-500 leading-normal mt-1">
                        Use this token to monitor manual dispatch clearances and scheduled collection timings inside our Ibadan/Oyo outposts.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <button
                        onClick={() => {
                          const trigger = document.getElementById('chat-icon-trigger-btn') || document.getElementById('chatbot-toggle-circle') || document.getElementById('chatbot-action-bubble');
                          if (trigger) trigger.click();
                        }}
                        className="py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Ask manager on chat
                      </button>
                      <button
                        onClick={() => {
                          localStorage.setItem('mercy_last_tracked_ref', confirmedOrder.id.toUpperCase());
                          localStorage.setItem('mercy_last_tracked_email', confirmedOrder.customerEmail);
                          navigateTab('track', `ref=${confirmedOrder.id}&email=${encodeURIComponent(confirmedOrder.customerEmail)}`);
                          setConfirmedOrder(null);
                          setIsPaymentVerified(false);
                        }}
                        className="py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer animate-pulse"
                      >
                        Track reservation status & Receipt →
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* View switching panel selectors */}
        {activeTab === 'home' && (
          <div id="home-view-group">
            <Hero onNavigate={navigateTab} />
            <Products
              products={products}
              isLoading={isLoadingProducts}
              onAddToCart={handleAddToCart}
              onInstantBook={handleInstantBook}
              cartCountById={(id) => cart.find((i) => i.product.id === id)?.quantity || 0}
            />
            {/* Hour display row */}
            <div className="bg-neutral-50 border-t border-b border-neutral-100/50 py-16 px-4" id="timetable-display-row">
              <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-neutral-905 text-neutral-900 font-sans flex items-center gap-2">
                    <Clock size={20} className="text-emerald-700" />
                    <span>Bio-Clean Timetables</span>
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Mercy Farmstead follows absolute sanitary regimes. Visitors and collection services adhere strictly to operating parameters to support biometric security indices.
                  </p>
                </div>
                <div className="bg-emerald-950 p-6 rounded-2xl text-white font-mono shadow-inner border border-emerald-900">
                  <div className="flex justify-between border-b border-emerald-900 pb-2.5 text-xs font-bold tracking-wider uppercase text-emerald-400">
                    <span>Active Days</span>
                    <span>Opening Hours</span>
                  </div>
                  <div className="flex justify-between py-2 text-xs border-b border-emerald-900/50">
                    <span>Monday — Saturday</span>
                    <span className="font-bold text-emerald-300">8:00 AM — 6:00 PM</span>
                  </div>
                  <div className="flex justify-between pt-2.5 text-xs">
                    <span>Sunday</span>
                    <span className="text-rose-455 text-rose-400 font-extrabold">CLOSED (Sanitization)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && <AboutUs />}

        {activeTab === 'products' && (
          <Products
            products={products}
            isLoading={isLoadingProducts}
            onAddToCart={handleAddToCart}
            onInstantBook={handleInstantBook}
            cartCountById={(id) => cart.find((i) => i.product.id === id)?.quantity || 0}
          />
        )}

        {activeTab === 'booking' && (
          <Booking
            cart={cart}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            products={products}
            onOrderSuccess={(ord) => setConfirmedOrder(ord)}
            directBookingItem={directBookingItem}
            onClearDirectBooking={() => setDirectBookingItem(null)}
            onNavigate={navigateTab}
          />
        )}

        {activeTab === 'contact' && <Contact />}

        {activeTab === 'track' && (
          <TrackOrder 
            onOpenChatWithAdmin={() => {
              const bubble = document.getElementById('chatbot-action-bubble');
              if (bubble) bubble.click();
            }} 
          />
        )}

      </main>

      {/* 5. SHOPPING CART OVERLAY RIGHT CABINET SLIDE-OUT PANEL */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-55 bg-black/50 backdrop-blur-xs flex justify-end" id="cart-drawer-overlay">
            {/* Backdrop cancel trigger */}
            <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
              id="cart-drawer-content"
            >
              {/* Drawer header */}
              <div className="p-5 bg-emerald-800 text-white flex items-center justify-between shadow-md shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} className="text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider">Your Booking Wagon</span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Cart Items queue body */}
              <div className="flex-grow overflow-y-auto p-5 bg-neutral-50/50 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-neutral-500 space-y-3" id="cart-drawer-empty">
                    <ShoppingCart size={36} className="mx-auto text-neutral-300 animate-pulse" />
                    <p className="text-xs font-semibold">Your compilation is completely empty.</p>
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        navigateTab('products');
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      Fill Wagon
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.product.id} className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-xs flex gap-3 items-center justify-between">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-14 h-14 object-cover rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-grow min-w-0 px-1">
                          <h4 className="text-xs font-extrabold text-neutral-900 truncate leading-snug">{item.product.name}</h4>
                          <span className="text-[10px] text-neutral-400 font-medium">₦{item.product.price.toLocaleString()}</span>
                          
                          {/* Quantity selectors */}
                          <div className="flex items-center gap-1 mt-1.5">
                            <button
                              onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1, item.product.stock)}
                              className="w-5 h-5 bg-neutral-150 rounded text-neutral-700 hover:bg-neutral-200 text-[10px] font-extrabold flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs px-2 font-mono font-bold text-neutral-800">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1, item.product.stock)}
                              className="w-5 h-5 bg-neutral-150 rounded text-neutral-700 hover:bg-neutral-200 text-[10px] font-extrabold flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-800 block">
                            ₦{(item.product.price * item.quantity).toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleRemoveFromCart(item.product.id)}
                            className="text-[10px] font-bold text-rose-600 hover:underline mt-1 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer totals panel */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-neutral-100 bg-white shadow-lg space-y-4 shrink-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Total Sum:</span>
                    <span className="text-xl font-black text-emerald-800">₦{cartTotalSum.toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        handleClearCart();
                        setIsCartOpen(false);
                      }}
                      className="py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Clear wagon
                    </button>
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setDirectBookingItem(null); // Clear direct setting
                        navigateTab('booking');
                      }}
                      className="py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Wagon Checkout</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Notifications Center Sliding Drawer */}
        {isNotificationsOpen && (
          <div className="fixed inset-0 z-55 bg-black/55 backdrop-blur-xs flex justify-end" id="notifications-drawer-overlay">
            {/* Backdrop cancel trigger */}
            <div className="absolute inset-0" onClick={() => setIsNotificationsOpen(false)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
              id="notifications-drawer-content"
            >
              {/* Drawer header */}
              <div className="p-5 bg-amber-600 text-white flex items-center justify-between shadow-md shrink-0">
                <div className="flex items-center gap-2">
                  <Bell size={20} className="text-white ring-2 ring-white/25 rounded-full p-0.5 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider">Mercy Farms Live Notifications</span>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-1 hover:text-amber-200 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Email Identification Input */}
              <div className="p-4 bg-amber-50 border-b border-amber-100/50 space-y-1.5 shrink-0">
                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Customer Alerts Binding</p>
                <div className="text-[11px] text-amber-800 leading-relaxed mb-1">
                  Private notification alerts are secured by your email address. Enter it below to fetch status updates of your swines, layers, or crate reservation bookings!
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email e.g. sam@gmail.com"
                    value={customerEmailInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerEmailInput(val);
                      localStorage.setItem('mercy_farmstead_cemail', val);
                      fetchNotifications();
                    }}
                    className="flex-grow text-base font-extrabold px-3 py-2 bg-white rounded-lg border border-amber-300 focus:outline-none focus:border-amber-600 font-mono text-neutral-900"
                  />
                  <button
                    onClick={() => {
                      fetchNotifications();
                    }}
                    className="px-3 py-1 bg-amber-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider hover:bg-amber-700 cursor-pointer"
                  >
                    Sync
                  </button>
                </div>
                {customerEmailInput && (
                  <div className="text-[9px] text-emerald-800 font-bold font-mono">
                     Listening to: {customerEmailInput}
                  </div>
                )}
              </div>

              {/* Notifications list */}
              <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-neutral-50/50">
                {notifications.length === 0 ? (
                  <div className="text-center py-24 text-neutral-500 space-y-3">
                    <Bell size={36} className="mx-auto text-neutral-300" />
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-700">No active alerts loaded</p>
                    <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                      Any point-of-lay laying rate, swine availability announcements, or verification reviews about your direct bookings will load here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                        {notifications.filter(n => !n.read).length} UNREAD MESSAGE(S)
                      </span>
                      <button
                        onClick={() => handleMarkAllAsRead()}
                        className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    </div>

                    {notifications.map((n) => {
                      const isRead = n.read;
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleMarkAsRead(n.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                            isRead 
                              ? 'bg-white border-neutral-150 shadow-xs opacity-75' 
                              : 'bg-amber-50/40 border-amber-250 shadow-sm font-semibold'
                          }`}
                        >
                          {!isRead && (
                            <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          )}
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-xs font-bold text-neutral-900 leading-snug">
                              {n.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-600 leading-relaxed">
                            {n.message}
                          </p>
                          <div className="mt-2.5 flex justify-between items-center border-t border-neutral-100/60 pt-2 text-[9px] text-neutral-400 font-mono">
                            <span>Reference: {n.referenceId || 'N/A'}</span>
                            <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. FLOATING LIVE CHATBOT ELEMENT */}
      <Chatbot />

      {/* 7. LAYOUT FOOTER */}
      <footer className="bg-neutral-100 border-t border-neutral-200/50 py-12 shrink-0 text-xs text-neutral-608" id="layout-footer-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img 
                src={companyLogo} 
                alt="Mercy Farms Logo" 
                className="h-10 w-auto object-contain rounded-lg border border-neutral-200/50 shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>
            <blockquote className="text-[11px] text-neutral-500 italic max-w-xs leading-relaxed">
              "Every animal raised with care, every product delivered with pride."
            </blockquote>
          </div>

          {/* Location details */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Corporate farmland location</div>
            <div className="space-y-1.5 text-neutral-600 dark:text-stone-400">
              <a 
                href="https://maps.google.com/?q=Boluwatife+Maternity,+Wakajaye,+Ibadan,+Oyo+State,+Nigeria" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-start gap-1 p-0.5 rounded hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors group"
                title="Pinpoint Boluwatife Maternity on Google Maps"
              >
                <MapPin size={13} className="text-emerald-700 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs group-hover:underline leading-relaxed font-semibold">
                  BESIDE BOLUWATIFE MATERNITY, NO25 TEMIDIRE AJAGBA WAKAJAYE, IBADAN 200113, OYO STATE, NIGERIA.
                </span>
              </a>
            </div>
          </div>

          {/* Socials quick navigation */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Support handles</div>
            <div className="space-y-1 text-neutral-605">
              <div>WhatsApp: 07061562420</div>
              <div>Instagram / TikTok: @mercyfarmss</div>
              <a href="mailto:mercyfarms01@gmail.com" className="hover:underline hover:text-emerald-800">mercyfarms01@gmail.com</a>
            </div>
          </div>

          {/* Copyright block */}
          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Operations System</div>
            <p className="text-neutral-500 leading-relaxed text-[11px]">
              Our agricultural operations are bio-secured under state compliance index. <br />
              <span className="font-semibold text-neutral-700">RC Number: 9289785</span>
            </p>
            <div className="text-[9px] text-neutral-400 font-mono">Copyright &copy; {new Date().getFullYear()} Mercy Farmstead. All Rights Reserved.</div>
          </div>

        </div>
      </footer>

    </div>
  );
}
