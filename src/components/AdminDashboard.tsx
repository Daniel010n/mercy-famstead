import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, LayoutDashboard, ShoppingBag, Plus, Edit3, Trash2, 
  CheckCircle2, AlertTriangle, MessageSquare, Mail, Bell, ShieldCheck, 
  Settings, Key, Eye, EyeOff, RotateCw, X, ZoomIn, FileText, Trash, FileCheck,
  ChevronDown, Megaphone, Search, Printer, Upload, BarChart3,
  Sun, Moon
} from 'lucide-react';
import { Product, Order, ChatSession, Announcement, ContactMessage, AppNotification } from '../types';
import ReportsDashboard from './ReportsDashboard';

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  status?: 'success' | 'failed' | 'simulated';
  errorDetail?: string;
  smtpUser?: string;
  smtpHost?: string;
}

interface AdminDashboardProps {
  products: Product[];
  onRefreshProducts: () => void;
  announcements: Announcement[];
  onRefreshAnnouncements: () => void;
}

export default function AdminDashboard({
  products,
  onRefreshProducts,
  announcements,
  onRefreshAnnouncements
}: AdminDashboardProps) {
  // Security validation
  const [adminEmail, setAdminEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  // Core administrative states
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'chats' | 'announcements' | 'messages' | 'emails' | 'security' | 'notifications' | 'reports'>('inventory');
  const [adminStatus, setAdminStatus] = useState<'active' | 'away'>('away');
  
  // Data sets tracked locally for live operations
  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Refresh loading flags
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Edit/Add product modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState<string>('Pigs');
  const [customCategoryEnabled, setCustomCategoryEnabled] = useState(false);
  const [customCategoryValue, setCustomCategoryValue] = useState('');
  const [prodFormDesc, setProdFormDesc] = useState('');
  const [prodFormPrice, setProdFormPrice] = useState('');
  const [prodFormUnit, setProdFormUnit] = useState('head');
  const [prodFormStock, setProdFormStock] = useState('10');
  const [prodFormImage, setProdFormImage] = useState('');
  const [prodFormAvailable, setProdFormAvailable] = useState<boolean>(true);

  // Live catalog filtering states
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [invCategoryFilter, setInvCategoryFilter] = useState<string>('All');

  // Edit announcements
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<'alert' | 'news' | 'promo' | 'arrival'>('news');

  // Dispatch custom manual notifications
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'order' | 'announcement' | 'alert' | 'general'>('general');
  const [notifTargetType, setNotifTargetType] = useState<'all' | 'specific'>('all');
  const [notifTargetEmail, setNotifTargetEmail] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccessMsg, setNotifSuccessMsg] = useState<string | null>(null);

  // Chat conversation transcript emailing states
  const [emailingTranscriptSessionId, setEmailingTranscriptSessionId] = useState<string | null>(null);
  const [transcriptEmailFeedback, setTranscriptEmailFeedback] = useState<string | null>(null);

  // Manual chat reply overriding text
  const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Image zoom popups
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  // Password toggle settings
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passStatus, setPassStatus] = useState<string | null>(null);

  // Secure payment confirmation modal states
  const [selectedVerifyOrder, setSelectedVerifyOrder] = useState<Order | null>(null);
  const [verifyActionPayState, setVerifyActionPayState] = useState<string>('');
  const [verifyActionOrderState, setVerifyActionOrderState] = useState<string>('');
  const [verifyActionShippingState, setVerifyActionShippingState] = useState<string>('Pending');
  const [adminChallengePin, setAdminChallengePin] = useState<string>('');
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [challengeIsLoading, setChallengeIsLoading] = useState<boolean>(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Intercept global fetch calls to automatically attach cyber-security authorization token
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async function (resource, config) {
      const token = sessionStorage.getItem('mercy_admin_token');
      const isApiRequest = typeof resource === 'string' && resource.startsWith('/api/');
      const isLogin = typeof resource === 'string' && resource.includes('/login');

      if (token && isApiRequest && !isLogin) {
        config = config || {};
        config.headers = config.headers || {};
        if (config.headers instanceof Headers) {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else if (Array.isArray(config.headers)) {
          config.headers.push(['Authorization', `Bearer ${token}`]);
        } else {
          (config.headers as any)['Authorization'] = `Bearer ${token}`;
        }
      }
      return originalFetch(resource, config);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Try session autologin
  useEffect(() => {
    const ses = sessionStorage.getItem('mercy_admin_token');
    if (ses) setIsAuthenticated(true);
  }, []);

  // Fetch administrative datasets on login
  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
      // Periodically poll active client chats to intercept
      const pId = setInterval(() => {
        pollChatsSilently();
      }, 5000);
      return () => clearInterval(pId);
    }
  }, [isAuthenticated]);

  const pollChatsSilently = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        // Sync selected chat session if active
        if (selectedChatSession) {
          const matched = data.find((c: any) => c.id === selectedChatSession.id);
          if (matched) setSelectedChatSession(matched);
        }
      }
    } catch (err) {
      console.warn('Silent chat poll dropped');
    }
  };

  const fetchAdminData = async () => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    setLoadingChats(true);
    setLoadingMessages(true);
    setLoadingEmails(true);
    setLoadingNotifications(true);

    try {
      // Refresh products via prop bubble
      onRefreshProducts();

      // Fetch bookings, contact, email logs, notifications, and status
      const [ordRes, chatRes, msgRes, emailRes, notifRes, statusRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/chats'),
        fetch('/api/messages'),
        fetch('/api/admin/emails'),
        fetch('/api/notifications'),
        fetch('/api/admin/status')
      ]);

      if (ordRes.ok) setOrders(await ordRes.json());
      if (chatRes.ok) setChats(await chatRes.json());
      if (msgRes.ok) setContactMessages(await msgRes.json());
      if (emailRes.ok) setEmailLogs(await emailRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setAdminStatus(sData.adminStatus);
      }

    } catch (err) {
      console.error('Failed to parse administrative datasets', err);
    } finally {
      setLoadingOrders(false);
      setLoadingChats(false);
      setLoadingMessages(false);
      setLoadingEmails(false);
      setLoadingNotifications(false);
    }
  };

  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, email: adminEmail })
      });

      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem('mercy_admin_token', data.token);
        setIsAuthenticated(true);
      } else {
        setAuthError(data.error || 'Access Denied. Passcode pin is incorrect.');
      }
    } catch (err) {
      setAuthError('Connection boundary blocked verification.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('mercy_admin_token');
    setIsAuthenticated(false);
    setAdminEmail('');
    setPasscode('');
  };

  // Product manipulations
  const openProductForm = (prod: Product | null) => {
    if (prod) {
      setEditingProduct(prod);
      setProdFormName(prod.name);
      
      const isStandard = ['Pigs', 'Eggs', 'Layers', 'Fish', 'Broilers'].includes(prod.category);
      if (isStandard) {
        setProdFormCategory(prod.category);
        setCustomCategoryEnabled(false);
        setCustomCategoryValue('');
      } else {
        setProdFormCategory('__CUSTOM__');
        setCustomCategoryEnabled(true);
        setCustomCategoryValue(prod.category);
      }
      
      setProdFormDesc(prod.description);
      setProdFormPrice(prod.price.toString());
      setProdFormUnit(prod.unit);
      setProdFormStock(prod.stock.toString());
      setProdFormImage(prod.imageUrl);
      setProdFormAvailable(prod.available !== undefined ? prod.available : true);
    } else {
      setEditingProduct(null);
      setProdFormName('');
      setProdFormCategory('Pigs');
      setCustomCategoryEnabled(false);
      setCustomCategoryValue('');
      setProdFormDesc('');
      setProdFormPrice('');
      setProdFormUnit('head');
      setProdFormStock('10');
      setProdFormImage('');
      setProdFormAvailable(true);
    }
    setShowProductModal(true);
  };

  const saveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCategory = customCategoryEnabled ? customCategoryValue.trim() : prodFormCategory;
    if (!finalCategory) {
      alert('Please provide a valid category!');
      return;
    }

    const payload = {
      name: prodFormName,
      category: finalCategory,
      description: prodFormDesc,
      price: Number(prodFormPrice),
      unit: prodFormUnit,
      stock: Number(prodFormStock),
      imageUrl: prodFormImage,
      available: prodFormAvailable
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowProductModal(false);
        onRefreshProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProductItem = async (id: string) => {
    if (!window.confirm('Delete this livestock product from catalog entries?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  // Booking verification actions
  const modifyOrderToggles = async (id: string, payState: string, orderState: string) => {
    setUpdatingOrderId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: payState, orderStatus: orderState })
      });
      if (res.ok) {
        // Refresh orders queue
        const u = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === id ? u : o)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Secure manual verification intercept or trigger
  const initiateSecureVerification = (order: Order, payState: string, orderState: string) => {
    setSelectedVerifyOrder(order);
    setVerifyActionPayState(payState);
    setVerifyActionOrderState(orderState);
    setVerifyActionShippingState(order.shippingStatus || 'Pending');
    setAdminChallengePin('');
    setChallengeError(null);
  };

  const handleSecureVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerifyOrder) return;
    setChallengeError(null);
    setChallengeIsLoading(true);

    try {
      // Validate secure admin passcode using the real admin/login endpoint
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: adminChallengePin, email: 'mercyfarms01@gmail.com' })
      });

      if (!res.ok) {
        setChallengeError('⚠️ Access Denied: Incorrect administrator confirmation PIN. Your attempt has been logged under local security compliance rules.');
        setChallengeIsLoading(false);
        return;
      }

      // PIN is valid! Proceed with changing state
      const updateRes = await fetch(`/api/orders/${selectedVerifyOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentStatus: verifyActionPayState, 
          orderStatus: verifyActionOrderState,
          shippingStatus: verifyActionShippingState
        })
      });

      if (updateRes.ok) {
        const updatedOrder = await updateRes.json();
        setOrders((prev) => prev.map((o) => (o.id === selectedVerifyOrder.id ? updatedOrder : o)));
        setSelectedVerifyOrder(null); // Close modal
      } else {
        setChallengeError('Database recorded an error processing this request.');
      }
    } catch (err) {
      console.error(err);
      setChallengeError('Underlying connection error check.');
    } finally {
      setChallengeIsLoading(false);
    }
  };

  // Chat override reply triggers
  const executeChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatSession || !adminReplyText.trim()) return;

    try {
      const res = await fetch('/api/chats/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedChatSession.id, messageText: adminReplyText })
      });

      if (res.ok) {
        const updatedSes = await res.json();
        setSelectedChatSession(updatedSes);
        setChats((prev) => prev.map((c) => (c.id === updatedSes.id ? updatedSes : c)));
        setAdminReplyText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update admin active/away status
  const updateAdminStatus = async (newStatus: 'active' | 'away') => {
    try {
      const res = await fetch('/api/admin/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminStatus: newStatus })
      });
      if (res.ok) {
        setAdminStatus(newStatus);
      }
    } catch (err) {
      console.error('Failed to change admin status:', err);
    }
  };

  // Toggle individual session chatbot AI silencing
  const toggleSessionChatbot = async (id: string, currentlyDisabled: boolean) => {
    try {
      const res = await fetch('/api/chats/toggle-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, chatbotDisabled: !currentlyDisabled })
      });
      if (res.ok) {
        setChats((prev) =>
          prev.map((c) => (c.id === id ? { ...c, chatbotDisabled: !currentlyDisabled } : c))
        );
        if (selectedChatSession?.id === id) {
          setSelectedChatSession((prev) =>
            prev ? { ...prev, chatbotDisabled: !currentlyDisabled } : null
          );
        }
      }
    } catch (err) {
      console.error('Failed to toggle session chatbot:', err);
    }
  };

  // Mark chat as read
  const markChatAsRead = async (id: string) => {
    try {
      await fetch('/api/chats/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id })
      });
      setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unreadByAdmin: false } : c)));
    } catch (err) {
      console.error(err);
    }
  };

  // Compile and dispatch chat conversation transcript by email
  const emailChatTranscript = async (id: string, recipient?: string) => {
    setEmailingTranscriptSessionId(id);
    setTranscriptEmailFeedback(null);
    try {
      const res = await fetch('/api/chats/email-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, recipientEmail: recipient })
      });
      const data = await res.json();
      if (res.ok) {
        setTranscriptEmailFeedback(`✓ Compiled & emailed successfully to ${data.recipient || 'recipient'}. Check the "Outbound Email Logs" tab to view delivery status!`);
      } else {
        setTranscriptEmailFeedback(`⚠ Error: ${data.details || data.error || 'SMTP dispatch failure'}`);
      }
    } catch (err: any) {
      setTranscriptEmailFeedback(`⚠ Connection error: ${err.message || String(err)}`);
    } finally {
      setEmailingTranscriptSessionId(null);
      setTimeout(() => setTranscriptEmailFeedback(null), 10000);
    }
  };

  // Announcement addition
  const publishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: annTitle, content: annContent, type: annType })
      });

      if (res.ok) {
        onRefreshAnnouncements();
        setAnnTitle('');
        setAnnContent('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) onRefreshAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintOrder = (order: Order) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow || iframe.contentDocument;
    if (!doc) return;

    const htmlContent = `
      <html>
        <head>
          <title>Reservation Summary - ${order.id}</title>
          <style>
            body {
              font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
              color: #171717;
              padding: 40px;
              margin: 0;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #e5e5e5;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #047857;
              margin: 0;
              letter-spacing: -0.025em;
            }
            .subtitle {
              font-size: 11px;
              color: #525252;
              margin-top: 4px;
              font-weight: 500;
            }
            .meta {
              text-align: right;
              font-size: 12px;
              color: #737373;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 11px;
              text-transform: uppercase;
              font-weight: 900;
              letter-spacing: 0.05em;
              color: #737373;
              border-bottom: 1px solid #f5f5f5;
              padding-bottom: 5px;
              margin-bottom: 15px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
            }
            .label {
              font-size: 10px;
              font-weight: 800;
              color: #737373;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 2px;
            }
            .value {
              font-size: 13px;
              font-weight: 600;
              color: #171717;
              margin-bottom: 15px;
            }
            .price-box {
              background-color: #f0fdf4;
              border: 1px solid #dcfce7;
              padding: 15px;
              border-radius: 8px;
              margin-top: 15px;
            }
            .total-price {
              font-size: 20px;
              font-weight: 800;
              color: #065f46;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #e5e5e5;
              padding-top: 20px;
              font-size: 11px;
              color: #a3a3a3;
              text-align: center;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">MERCY FARMSTEAD</h1>
              <div class="subtitle">RC Number: 9289785 | Ibadan, Nigeria</div>
            </div>
            <div class="meta">
              <div style="font-weight: 800; font-size: 13px; color: #171717; margin-bottom: 4px;">RESERVATION RECEIPT</div>
              <div>ID: <strong>${order.id}</strong></div>
              <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
            </div>
          </div>

          <div class="grid">
            <div class="section">
              <h2 class="section-title">Client Profile</h2>
              <div class="label">Customer Name</div>
              <div class="value">${order.customerName}</div>
              
              <div class="label">Phone Number</div>
              <div class="value">${order.customerPhone}</div>
              
              <div class="label">Email Address</div>
              <div class="value">${order.customerEmail}</div>
              
              <div class="label">Collection/Delivery Address</div>
              <div class="value">${order.customerAddress}</div>
            </div>

            <div class="section">
              <h2 class="section-title">Livestock Order Details</h2>
              <div class="label">Selected Listings</div>
              <div class="value">${order.productName}</div>
              
              <div class="label">Quantity Ordered</div>
              <div class="value">${order.quantity} units</div>

              <div class="label">Bank Target Account</div>
              <div class="value">${order.paymentBank || 'N/A'}</div>

              <div class="price-box">
                <div class="label" style="color: #047857;">Total Payment Settled / Due</div>
                <div class="total-price">₦${order.totalPrice.toLocaleString()}</div>
              </div>
            </div>
          </div>

          ${order.notes ? `
          <div class="section" style="margin-top: 20px;">
            <h2 class="section-title">Client Notes</h2>
            <div style="font-size: 12px; color: #404040; background: #fafafa; padding: 12px; border-radius: 6px; border: 1px solid #e5e5e5; font-style: italic;">
              "${order.notes}"
            </div>
          </div>
          ` : ''}

          <div class="section" style="margin-top: 20px;">
            <h2 class="section-title">Current Status Checks</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="width: 50%; padding: 4px 0;"><strong>Payment Audit Status:</strong> <span style="text-transform: uppercase;">${order.paymentStatus || 'Pending'}</span></td>
                <td style="width: 50%; padding: 4px 0;"><strong>Dispatch tracking list:</strong> <span style="text-transform: uppercase;">${order.orderStatus || 'Pending'}</span></td>
              </tr>
            </table>
          </div>

          <div class="footer">
            Mercy Farmstead - Premium bio-secured agricultural operations and validated stock compliance index.
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() {
                window.parent.document.body.removeChild(window.frameElement);
              }, 1000);
            };
          </script>
        </body>
      </html>
    `;

    const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iDoc) {
      iDoc.open();
      iDoc.write(htmlContent);
      iDoc.close();
    }
  };

  // Password modification
  const handlePassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassStatus(null);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPasscode: oldPass, newPasscode: newPass })
      });
      if (res.ok) {
        setPassStatus('Admin Access passcode modified successfully!');
        setOldPass('');
        setNewPass('');
      } else {
        const error = await res.json();
        setPassStatus('Error: ' + error.error);
      }
    } catch (arr) {
      setPassStatus('Passcode override failure.');
    }
  };

  // Notification Management Handlers
  const handleMarkNotifRead = async (notifId: string) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notifId })
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    } catch (err) {
      console.warn('Failed to mark notification as read', err);
    }
  };

  const handleDeleteNotif = async (notifId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this notification? Users will no longer see it.')) return;
    try {
      const res = await fetch(`/api/notifications/${notifId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notifId));
      }
    } catch (err) {
      console.warn('Failed to delete notification', err);
    }
  };

  const handleSendCustomNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setSendingNotif(true);
    setNotifSuccessMsg(null);

    const targetUser = notifTargetType === 'all' ? 'all' : notifTargetEmail.trim();

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          targetUser
        })
      });

      if (res.ok) {
        const newNotif = await res.json();
        setNotifications(prev => [newNotif, ...prev]);
        setNotifTitle('');
        setNotifMessage('');
        setNotifTargetEmail('');
        setNotifSuccessMsg(`Alert dispatched successfully to target: "${targetUser}"!`);
        setTimeout(() => setNotifSuccessMsg(null), 5000);
      } else {
        alert('Failed to dispatch customized notification. Please check values.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingNotif(false);
    }
  };

  // Clear email logs cache
  const clearEmailHistory = async () => {
    if (!window.confirm('Wipe out all outbound simulated email histories?')) return;
    try {
      const res = await fetch('/api/admin/emails/clear', { method: 'POST' });
      if (res.ok) setEmailLogs([]);
    } catch (err) {
      console.error(err);
    }
  };

  /* IF NOT AUTHENTICATED: SHOW LOCKED SCREEN */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-20 relative" id="admin-login-screen">
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800 text-slate-100 p-8 rounded-3xl border border-slate-700 w-full max-w-sm shadow-2xl relative z-10"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Lock size={28} />
            </div>
            
            <h2 className="text-xl font-black tracking-tight uppercase">Admin Core Security</h2>
            <p className="text-xs text-slate-400 mt-1">
              Mercy Farmstead private operational backdoor portal. Authorization pin required.
            </p>
          </div>

          <form onSubmit={handleAdminVerify} className="space-y-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Owner Email Identity</label>
              <input
                id="admin-email-input"
                type="email"
                required
                autoComplete="off"
                placeholder="Enter authorized administrator email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full text-base font-extrabold p-3 bg-slate-900 border border-slate-600 focus:ring-2 focus:ring-emerald-500 rounded-xl text-white placeholder-slate-500 block font-sans outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Backdoor Passcode Key</label>
              <div className="relative">
                <input
                  id="admin-passcode-input"
                  type={showPasscode ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full text-base font-black p-3 bg-slate-900 border border-slate-600 focus:ring-2 focus:ring-emerald-500 rounded-xl text-white placeholder-slate-550 block pr-12 font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 rounded-xl font-medium tracking-wide">
                ✖ {authError}
              </div>
            )}

            <button
              id="admin-unlock-btn"
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 transition-colors font-bold text-xs uppercase text-white rounded-xl shadow-lg shadow-emerald-600/10 cursor-pointer"
            >
              Verify System clearance
            </button>
          </form>

          <div className="text-center mt-5">
            <a href="/" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider">
              ← Return to Customer Website
            </a>
          </div>

          <div className="text-center mt-6">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Security compliance terminal v1.2</span>
          </div>
        </motion.div>
      </div>
    );
  }

  /* AUTHENTICATED CONTROL ROOM VIEW */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-stone-950 pb-20 flex flex-col" id="admin-control-dashboard">
      
      {/* HEADER BAR */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 text-white shrink-0 shadow-lg flex flex-col sm:flex-row gap-4 justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-700 text-white rounded-xl">
            <LayoutDashboard size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider leading-none">MERCY FARM OPERATIONAL CABIN</h2>
            <p className="text-[10px] text-slate-400 mt-1 leading-none font-semibold">Authorized session link active</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {adminStatus === 'active' ? (
            <div 
              onClick={() => updateAdminStatus('away')}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/35 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wide rounded-lg flex items-center gap-1.5 cursor-pointer select-none transition-colors"
              title="You are ACTIVE. AI Chatbot is stopped. Click to switch to AWAY."
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>ADMIN ACTIVE (Bot Paused)</span>
            </div>
          ) : (
            <div 
              onClick={() => updateAdminStatus('active')}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wide rounded-lg flex items-center gap-1.5 cursor-pointer select-none transition-colors"
              title="You are AWAY. AI Chatbot responds automatically. Click to switch to ACTIVE."
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>ADMIN AWAY (Bot Active)</span>
            </div>
          )}

          {/* Admin Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-slate-800 text-slate-350 text-slate-300 hover:text-amber-400 rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Late-night Dark Theme"}
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            onClick={fetchAdminData}
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Refresh database collections"
          >
            <RotateCw size={15} />
          </button>
          
          <a
            href="/"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 text-xs font-bold rounded-lg text-slate-300 flex items-center"
            title="View consumer storefront"
          >
            Customer Website
          </a>
          
          <button
            id="admin-logout-btn"
            onClick={handleAdminLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-700/60 transition-colors border border-slate-700 hover:border-rose-400 text-xs font-bold rounded-lg text-slate-300 cursor-pointer"
          >
            Terminal logout
          </button>
        </div>
      </div>

      {/* BODY PANEL LAYOUT GRID */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* NAV SELECTION PANEL COLUMN */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-xs space-y-2">
            <div className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3 px-1">Menu selections</div>
            
            <button
              id="admin-tab-inventory"
              onClick={() => setActiveTab('inventory')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-colors ${
                activeTab === 'inventory' ? 'bg-emerald-50 text-emerald-800' : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={14} />
                <span>Live Catalog Editor</span>
              </span>
              <span className="bg-neutral-100 text-[10px] font-mono px-2 py-0.5 rounded text-neutral-600 font-bold">{products.length}</span>
            </button>

            <button
              id="admin-tab-orders"
              onClick={() => setActiveTab('orders')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-colors ${
                activeTab === 'orders' ? 'bg-emerald-50 text-emerald-800' : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText size={14} />
                <span>Verification / Bookings</span>
              </span>
              <span className="bg-emerald-100 text-[10px] font-mono px-2 py-0.5 rounded text-emerald-800 font-black">
                {orders.filter(o => o.orderStatus === 'Pending').length} pending
              </span>
            </button>

            <button
              id="admin-tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-colors ${
                activeTab === 'reports' ? 'bg-emerald-50 text-emerald-800' : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart3 size={14} />
                <span>Reports & Insights</span>
              </span>
              <span className="bg-neutral-100 text-[10px] font-mono px-2 py-0.5 rounded text-neutral-600 font-bold">Live</span>
            </button>

            <button
              id="admin-tab-chats"
              onClick={() => setActiveTab('chats')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-colors ${
                activeTab === 'chats' ? 'bg-emerald-50 text-emerald-800' : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageSquare size={14} />
                <span>AI Chat Intercepts</span>
              </span>
              {chats.some(c => c.unreadByAdmin) && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse ml-auto" />
              )}
            </button>

            <button
              id="admin-tab-announcements"
              onClick={() => setActiveTab('announcements')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'announcements' ? 'bg-emerald-50 text-emerald-800' : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Megaphone size={14} />
              <span>Broadcast Bulletin</span>
            </button>

            <button
              id="admin-tab-notifications"
              onClick={() => {
                fetchAdminData();
                setActiveTab('notifications');
              }}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-colors ${
                activeTab === 'notifications' ? 'bg-emerald-50 text-emerald-800' : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bell size={14} />
                <span>Customer Live Alerts</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                notifications.some(n => !n.read) 
                  ? 'bg-amber-500 text-white animate-pulse' 
                  : 'bg-neutral-100 text-neutral-600'
              }`}>
                {notifications.filter(n => !n.read).length}
              </span>
            </button>

            <button
              id="admin-tab-messages"
              onClick={() => setActiveTab('messages')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-colors ${
                activeTab === 'messages' ? 'bg-emerald-50 text-emerald-800' : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Mail size={14} />
                <span>Inquiries Inbox</span>
              </span>
              <span className="bg-neutral-100 text-[10px] font-mono px-2 py-0.5 rounded text-neutral-600 font-bold">{contactMessages.length}</span>
            </button>

            <button
              id="admin-tab-emails"
              onClick={() => setActiveTab('emails')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'emails' ? 'bg-emerald-50 text-emerald-800' : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <FileCheck size={14} />
              <span>Outbound Email Logs</span>
            </button>

            <button
              id="admin-tab-security"
              onClick={() => setActiveTab('security')}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold text-left flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'security' ? 'bg-emerald-50 text-emerald-800' : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Settings size={14} />
              <span>Security Settings</span>
            </button>
          </div>
        </div>

        {/* DETAILS DATA DISPLAY SECTOR (3 Columns) */}
        <div className="md:col-span-3 min-h-[500px]">
          
          {/* ================ LIVE CATALOG EDITOR ================ */}
          {activeTab === 'inventory' && (() => {
            const filteredInventory = products.filter(p => {
              const matchesSearch = p.name.toLowerCase().includes(invSearchQuery.toLowerCase()) || 
                                    (p.description || '').toLowerCase().includes(invSearchQuery.toLowerCase());
              const matchesCategory = invCategoryFilter === 'All' || p.category === invCategoryFilter;
              return matchesSearch && matchesCategory;
            });
            return (
              <div className="space-y-6 animate-fade-in" id="admin-inventory-panel">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-neutral-200 dark:border-stone-800 gap-3">
                  <div>
                    <h3 className="text-xl font-bold font-sans text-neutral-900">Live Catalog Management</h3>
                    <p className="text-xs text-neutral-500 mt-1">Configure active prices, vaccine-approved animal counts, and catalog stock values.</p>
                  </div>
                  <button
                    id="admin-add-product-btn"
                    onClick={() => openProductForm(null)}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors self-start sm:self-auto"
                  >
                    <Plus size={15} />
                    <span>Add Farm Entry</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Products Stream */}
                  <div className={showProductModal ? "xl:col-span-5 space-y-4 max-h-[750px] overflow-y-auto pr-1" : "xl:col-span-12 space-y-6"}>
                    
                    {/* Search & Category Filter Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-2xl" id="admin-product-search-filters">
                      <div className="sm:col-span-2 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                          <Search size={14} />
                        </span>
                        <input
                          type="text"
                          placeholder="Type to search..."
                          value={invSearchQuery}
                          onChange={(e) => setInvSearchQuery(e.target.value)}
                          className="w-full text-sm font-bold pl-9 pr-12 py-2 bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-emerald-700 rounded-xl transition-all"
                        />
                        {invSearchQuery && (
                          <button
                            onClick={() => setInvSearchQuery('')}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600 text-xs font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-neutral-500 shrink-0">Filter:</span>
                        <select
                          value={invCategoryFilter}
                          onChange={(e) => setInvCategoryFilter(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-neutral-300 text-black font-extrabold focus:ring-2 focus:ring-emerald-700 focus:border-transparent rounded-xl outline-none"
                        >
                          <option value="All" className="text-black font-bold">All Classifications</option>
                          {Array.from(new Set(['Pigs', 'Eggs', 'Layers', 'Fish', 'Broilers', ...products.map(p => p.category)])).map(cat => (
                            <option key={cat} value={cat} className="text-black font-bold">{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {filteredInventory.length === 0 ? (
                      <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200" id="admin-inventory-empty">
                        <p className="text-xs text-neutral-500">No matching livestock entries found.</p>
                      </div>
                    ) : (
                      <div className={showProductModal ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                        {filteredInventory.map((p) => {
                          const isSelected = editingProduct?.id === p.id && showProductModal;
                          return (
                            <div 
                              key={p.id} 
                              onClick={() => {
                                if (showProductModal) {
                                  openProductForm(p);
                                }
                              }}
                              className={`p-5 rounded-2xl border flex gap-4 transition-all ${
                                isSelected 
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500 shadow-md scale-[0.99] cursor-pointer' 
                                  : p.stock <= 5 
                                    ? 'bg-rose-50/20 border-rose-300 shadow-sm ring-1 ring-rose-300 cursor-pointer' 
                                    : 'bg-white border-neutral-150 dark:border-stone-850 shadow-sm hover:border-emerald-300 cursor-pointer'
                              }`}
                            >
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-20 h-20 object-cover rounded-xl border border-neutral-150 shrink-0 bg-neutral-100"
                              />
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="flex flex-wrap justify-between items-start gap-2">
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                      <span className="bg-slate-100 text-neutral-600 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest">{p.category}</span>
                                      {p.stock <= 5 && (
                                        <span className="bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs tracking-wide uppercase animate-pulse">
                                          <AlertTriangle size={8} />
                                          <span>LOW STOCK</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => openProductForm(p)}
                                        className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                        title="Edit Product Details"
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                      <button
                                        onClick={() => deleteProductItem(p.id)}
                                        className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                        title="Delete Product"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  <h4 className="font-bold text-neutral-905 text-neutral-900 border-0 text-sm mt-1 truncate">{p.name}</h4>
                                  
                                  <div className="flex items-baseline gap-1 mt-0.5 text-xs">
                                    <span className="font-black text-emerald-800 text-base">₦{p.price.toLocaleString()}</span>
                                    <span className="text-neutral-500 font-semibold">/{p.unit}</span>
                                  </div>
                                </div>

                                <div className="mt-2 space-y-1 pt-2 border-t border-neutral-100 dark:border-stone-800 text-[10px] font-medium">
                                  <div className="flex items-center justify-between">
                                    <span className="text-neutral-500">Stock Volume:</span>
                                    <span className={`font-mono font-black text-xs ${p.stock <= 5 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}`}>
                                      {p.stock} units
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>

                  {/* Right Column: Dynamic Form Parameters side pane */}
                  {showProductModal && (
                    <div className="xl:col-span-7 bg-white dark:bg-stone-900 border border-neutral-100 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xl sticky top-4" id="product-edit-form-modal">
                      <div className="p-4 text-white flex justify-between items-center bg-gradient-to-r from-emerald-950 to-slate-900">
                        <div className="flex items-center gap-2">
                          <Edit3 size={16} className="text-emerald-400" />
                          <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">{editingProduct ? 'Modify Farm Entry' : 'Create Farm Entry'}</h4>
                        </div>
                        <button
                          onClick={() => setShowProductModal(false)}
                          className="p-1 text-slate-400 hover:text-rose-455 transition-colors cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <form onSubmit={saveProductSubmit} className="p-5 space-y-4 max-h-[650px] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Product Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Swine"
                              value={prodFormName}
                              onChange={(e) => setProdFormName(e.target.value)}
                              className="w-full text-base font-extrabold p-2.5 bg-white border border-neutral-400 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Classification Category</label>
                            <select
                              value={customCategoryEnabled ? '__CUSTOM__' : prodFormCategory}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '__CUSTOM__') {
                                  setCustomCategoryEnabled(true);
                                  setProdFormCategory('__CUSTOM__');
                                } else {
                                  setCustomCategoryEnabled(false);
                                  setProdFormCategory(val);
                                }
                              }}
                              className="w-full text-base font-extrabold p-2.5 bg-white border border-neutral-400 text-neutral-900 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                            >
                              <option value="Pigs">Pigs</option>
                              <option value="Eggs">Eggs</option>
                              <option value="Layers">Layers</option>
                              <option value="Fish">Fish</option>
                              <option value="Broilers">Broilers</option>
                              <option value="__CUSTOM__">+ Create Custom Category...</option>
                            </select>
                            {customCategoryEnabled && (
                              <div className="mt-2 animate-fade-in" id="custom-category-input-container">
                                <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">New Custom Category Name</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Turkey..."
                                  value={customCategoryValue}
                                  onChange={(e) => setCustomCategoryValue(e.target.value)}
                                  className="w-full text-base font-extrabold p-2.5 bg-emerald-50/50 border border-emerald-400 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Price per unit (₦)</label>
                            <input
                              type="number"
                              required
                              placeholder="5000"
                              value={prodFormPrice}
                              onChange={(e) => setProdFormPrice(e.target.value)}
                              className="w-full text-base font-extrabold p-2.5 bg-white border border-neutral-400 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Sales Unit Type</label>
                            <input
                              type="text"
                              required
                              placeholder="crate/head/kg"
                              value={prodFormUnit}
                              onChange={(e) => setProdFormUnit(e.target.value)}
                              className="w-full text-base font-extrabold p-2.5 bg-white border border-neutral-400 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Stock Vol.</label>
                            <input
                              type="number"
                              required
                              placeholder="150"
                              value={prodFormStock}
                              onChange={(e) => setProdFormStock(e.target.value)}
                              className="w-full text-base font-extrabold p-2.5 bg-white border border-neutral-400 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-stone-950 border border-neutral-100 dark:border-stone-850 rounded-xl">
                          <input
                            type="checkbox"
                            id="prodFormAvailable"
                            checked={prodFormAvailable}
                            onChange={(e) => setProdFormAvailable(e.target.checked)}
                            className="w-4.5 h-4.5 text-emerald-700 bg-white border-neutral-300 rounded focus:ring-emerald-700 cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-neutral-800 dark:text-slate-200">Available & Active Listing</span>
                            <span className="text-[9px] text-neutral-500 leading-none mt-0.5">Toggle status listing instantly.</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Description</label>
                          <textarea
                            rows={2}
                            placeholder="Provide product descriptions or standard specs..."
                            value={prodFormDesc}
                            onChange={(e) => setProdFormDesc(e.target.value)}
                            className="w-full text-base font-extrabold p-2.5 bg-white border border-neutral-400 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl resize-none outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Illustration Cover Image</label>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 dark:bg-stone-950 p-2 rounded-2xl border border-neutral-150 dark:border-stone-850">
                            <div>
                              <span className="block text-[8px] font-black uppercase text-neutral-400 mb-1">Option A: Upload</span>
                              <div
                                onClick={() => document.getElementById('product-pic-uploader')?.click()}
                                className="border border-dashed border-neutral-300 hover:border-emerald-500 bg-white dark:bg-stone-900 p-2 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[72px]"
                              >
                                <input
                                  type="file"
                                  id="product-pic-uploader"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const b64 = event.target?.result as string;
                                        setProdFormImage(b64);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                <Upload size={14} className="text-neutral-400 mb-1" />
                                <span className="text-[9px] font-extrabold text-neutral-700 dark:text-slate-300">Select File</span>
                              </div>
                            </div>

                            <div>
                              <span className="block text-[8px] font-black uppercase text-neutral-400 mb-1">Option B: URL link</span>
                              <textarea
                                rows={2}
                                placeholder="Paste static image URL..."
                                value={prodFormImage.startsWith('data:') ? '' : prodFormImage}
                                onChange={(e) => setProdFormImage(e.target.value)}
                                className="w-full text-[10px] font-semibold p-2 bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none resize-none h-[72px] leading-tight"
                              />
                            </div>
                          </div>

                          {prodFormImage && (
                            <div className="mt-2.5 p-2 bg-emerald-50/30 border border-emerald-100 dark:border-stone-800 rounded-xl flex items-center justify-between gap-3 animate-fade-in" id="product-pic-preview">
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={prodFormImage}
                                  alt="Thumbnail preview"
                                  className="w-8 h-8 object-cover rounded-md border shadow-xs bg-white"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="min-w-0">
                                  <div className="text-[8px] font-extrabold text-emerald-800 uppercase tracking-wider">Picture Selected</div>
                                  <div className="text-[8px] text-neutral-500 truncate font-mono max-w-[100px] sm:max-w-[150px]">
                                    {prodFormImage.startsWith('data:') ? 'Local Base64 File' : prodFormImage}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setProdFormImage('')}
                                className="px-1.5 py-0.5 text-[8px] font-black text-rose-700 bg-rose-50 hover:bg-rose-100 rounded cursor-pointer transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-neutral-100 dark:border-stone-800 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowProductModal(false)}
                            className="px-3 py-1.5 hover:bg-neutral-150 text-neutral-605 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Discard
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            Commit Listing
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>
              </div>
            );
          })()}

          {/* ================ VERIFICATION / BOOKINGS ================ */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in" id="admin-orders-panel">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-stone-800">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 font-sans">Reservations / Payment Approvals</h3>
                  <p className="text-xs text-neutral-500 mt-1 font-mono">Verify transferred sums alongside user uploads to validate direct livestock reservations.</p>
                </div>
                {selectedVerifyOrder && (
                  <button 
                    onClick={() => setSelectedVerifyOrder(null)} 
                    className="px-3 py-1.5 text-xs text-neutral-600 dark:text-stone-300 bg-neutral-100 dark:bg-stone-800 hover:bg-neutral-200 dark:hover:bg-stone-700 border border-neutral-200 dark:border-stone-700 rounded-lg shrink-0"
                  >
                    Close Details View
                  </button>
                )}
              </div>

              {loadingOrders ? (
                <div className="text-center py-12"><RotateCw className="animate-spin mx-auto text-neutral-400" /></div>
              ) : orders.length === 0 ? (
                <div className="bg-white dark:bg-stone-900 p-8 rounded-2xl text-center border dark:border-stone-800">Empty reservations stream.</div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: orders list list */}
                  <div className={selectedVerifyOrder ? "xl:col-span-5 space-y-4 max-h-[750px] overflow-y-auto pr-1" : "xl:col-span-12 space-y-4"}>
                    {orders.map((o) => {
                      const isSelected = selectedVerifyOrder?.id === o.id;
                      return (
                        <div 
                          key={o.id} 
                          onClick={() => {
                            setSelectedVerifyOrder(o);
                            setVerifyActionPayState(o.paymentStatus || 'Pending Verification');
                            setVerifyActionOrderState(o.orderStatus || 'Pending');
                            setVerifyActionShippingState(o.shippingStatus || 'Pending');
                            setAdminChallengePin('');
                            setChallengeError(null);
                          }}
                          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500 shadow-md scale-[0.99]' 
                              : 'bg-white dark:bg-stone-900 border-neutral-100 dark:border-stone-850 shadow-sm hover:border-emerald-300'
                          } space-y-3`}
                        >
                          {/* Booking meta row */}
                          <div className="flex flex-wrap gap-2 items-center justify-between pb-2 border-b border-neutral-50 dark:border-stone-800">
                            <div>
                              <span className="text-xs font-mono font-extrabold text-neutral-900 dark:text-stone-100">{o.id}</span>
                              <span className="text-[10px] text-neutral-400 ml-2">{new Date(o.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex gap-2 items-center">
                              {updatingOrderId === o.id && (
                                <RotateCw size={10} className="animate-spin text-emerald-600" />
                              )}
                              
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                o.paymentStatus === 'Verified' 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' 
                                  : o.paymentStatus === 'Failed Verification' 
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400' 
                                    : 'bg-amber-100 text-amber-900 dark:bg-amber-955 dark:text-amber-400'
                              }`}>
                                Pay: {o.paymentStatus || 'Pending'}
                              </span>

                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                o.shippingStatus === 'Delivered' 
                                  ? 'bg-emerald-500 text-white dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-500/20' 
                                  : o.shippingStatus === 'Dispatched' 
                                    ? 'bg-blue-500 text-white dark:bg-blue-900/60 dark:text-blue-300 border border-blue-500/20' 
                                    : 'bg-amber-550 bg-amber-500 text-white dark:bg-amber-950/65 dark:text-amber-400 border border-amber-500/20'
                              }`}>
                                Ship: {o.shippingStatus || 'Pending'}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="font-bold text-neutral-800 dark:text-slate-200">{o.customerName}</span>
                              <span className="font-black text-emerald-800 dark:text-emerald-400">₦{o.totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate">{o.productName} (QTY: {o.quantity})</div>
                          </div>

                          {!selectedVerifyOrder && (
                            <div className="pt-2 border-t border-neutral-50 dark:border-stone-800 flex justify-end">
                              <span className="text-[10px] text-emerald-600 font-bold hover:underline">Click to view verification terminal & side-by-side details →</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Reservation Details / Payment Verification Terminal */}
                  {selectedVerifyOrder && (
                    <div className="xl:col-span-7 bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl overflow-hidden shadow-2xl sticky top-4">
                      {/* Terminal Header */}
                      <div className="p-4 bg-gradient-to-r from-emerald-950 to-slate-900 border-b border-slate-800 flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-emerald-400 animate-pulse" />
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Payment Verification Terminal</h4>
                            <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Transaction Security Protocol: MANUAL_CONFIRM</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedVerifyOrder(null)}
                          className="p-1 hover:text-rose-455 text-slate-400 transition-colors cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Content Form */}
                      <form onSubmit={handleSecureVerifySubmit} className="p-5 space-y-5 max-h-[650px] overflow-y-auto">
                        
                        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-emerald-500/15 flex items-start gap-2.5">
                          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                          <div className="text-[10px] leading-relaxed text-slate-300">
                            <strong>Verification Alert:</strong> This action manually validates direct-banking transferred payments. Confirm receipt matching of the funds in the Mercy Farms official deposit account.
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Left Column: Transaction Details */}
                          <div className="space-y-3">
                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-2.5">
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/60 pb-1">Order Details</div>
                              
                              <div className="space-y-0.5">
                                <span className="text-[9px] text-slate-500 block uppercase font-black">Record Index</span>
                                <span className="text-xs font-mono font-bold text-emerald-400">{selectedVerifyOrder.id}</span>
                              </div>

                              <div className="space-y-0.5">
                                <span className="text-[9px] text-slate-500 block uppercase font-black">Client customer</span>
                                <div className="text-xs font-bold text-slate-200">{selectedVerifyOrder.customerName}</div>
                                <div className="text-[10px] text-slate-400">{selectedVerifyOrder.customerPhone}</div>
                                <div className="text-[10px] text-slate-450 truncate">{selectedVerifyOrder.customerEmail}</div>
                              </div>

                              <div className="space-y-0.5">
                                <span className="text-[9px] text-slate-500 block uppercase font-black">Booked Live Stock</span>
                                <div className="text-xs font-bold text-slate-200">
                                  {selectedVerifyOrder.productName} <span className="text-emerald-400 font-mono">(QTY: {selectedVerifyOrder.quantity})</span>
                                </div>
                              </div>

                              <div className="space-y-0.5 pt-1 border-t border-slate-850">
                                <span className="text-[9px] text-slate-500 block uppercase font-black">Total Payable Sum</span>
                                <span className="text-base font-black text-emerald-400 font-sans">
                                  ₦{selectedVerifyOrder.totalPrice.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1 text-xs">
                              <span className="text-[9px] text-slate-500 block uppercase font-black">Bank Target</span>
                              <div className="font-bold text-slate-300">{selectedVerifyOrder.paymentBank}</div>
                            </div>
                          </div>

                          {/* Right Column: Wire Receipt Image Check */}
                          <div className="space-y-3">
                            <span className="text-[9px] text-slate-400 block uppercase font-black tracking-wider">Submitted Receipt Voucher Snapshot</span>
                            
                            {selectedVerifyOrder.paymentProofUrl ? (
                              <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-850 h-[180px] relative overflow-hidden flex items-center justify-center group select-none">
                                <img 
                                  src={selectedVerifyOrder.paymentProofUrl} 
                                  alt="manual receipt deposit check" 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-contain rounded-lg"
                                />
                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setZoomedImageUrl(selectedVerifyOrder.paymentProofUrl || null);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1 px-2.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <ZoomIn size={11} />
                                    <span>Inspect Fullscreen</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-950 rounded-xl border border-dashed border-slate-850 h-[180px] flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                                <AlertTriangle className="text-rose-500/85 mb-1.5" size={20} />
                                <span className="text-[10px] italic">No confirmation proof screenshot attached.</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Shipping Status Selection Segment */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold uppercase text-slate-400">Configure Delivery/Shipping State</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-400">
                              Active selection: {verifyActionShippingState}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {(['Pending', 'Dispatched', 'Delivered'] as const).map((status) => {
                              const isActive = verifyActionShippingState === status;
                              let activeStyles = 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800';
                              if (isActive) {
                                if (status === 'Pending') activeStyles = 'bg-amber-600 text-white ring-1 ring-amber-500 font-black';
                                if (status === 'Dispatched') activeStyles = 'bg-blue-600 text-white ring-1 ring-blue-500 font-black';
                                if (status === 'Delivered') activeStyles = 'bg-emerald-600 text-white ring-1 ring-emerald-500 font-black';
                              }
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => setVerifyActionShippingState(status)}
                                  className={`py-2 px-1 rounded-lg text-[9px] font-sans tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${activeStyles}`}
                                >
                                  {status === 'Pending' && <span>⏳</span>}
                                  {status === 'Dispatched' && <span>🚚</span>}
                                  {status === 'Delivered' && <span>✅</span>}
                                  <span>{status}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Audit Verification PIN input inside form */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold uppercase text-slate-400">Security Access Override PIN</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
                              {verifyActionPayState} / {verifyActionOrderState}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-black tracking-wider text-slate-500 block">Passcode PIN authorization</label>
                              <input
                                type="password"
                                required
                                value={adminChallengePin}
                                onChange={(e) => setAdminChallengePin(e.target.value)}
                                placeholder="Enter coordinator passcode"
                                className="w-full text-base font-mono font-black p-2.5 bg-slate-900 border border-slate-600 focus:ring-2 focus:ring-emerald-500 rounded-lg text-white placeholder-slate-650 outline-none"
                              />
                            </div>
                            
                            <div className="flex gap-2 justify-end self-end">
                              <button
                                type="submit"
                                disabled={challengeIsLoading}
                                className="w-full py-2.5 text-center bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 transition-colors rounded-lg font-bold text-[10px] text-white uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                {challengeIsLoading ? <RotateCw size={11} className="animate-spin" /> : <ShieldCheck size={11} />}
                                <span>Commit Override</span>
                              </button>
                            </div>
                          </div>

                          {challengeError && (
                            <p className="text-[9px] text-rose-400 leading-relaxed font-bold bg-rose-950/30 p-2 rounded-lg border border-rose-500/20">{challengeError}</p>
                          )}
                        </div>

                        {/* Layout details actions & printer option */}
                        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handlePrintOrder(selectedVerifyOrder)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 px-3 rounded text-[10px] flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer size={12} className="text-emerald-400" />
                              <span>Print Summary</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const cleanPhone = selectedVerifyOrder.customerPhone.replace(/\D/g, '');
                                const formattedPhone = cleanPhone.startsWith('0') && cleanPhone.length === 11 
                                  ? '234' + cleanPhone.substring(1) 
                                  : cleanPhone;
                                
                                const baseLink = `${window.location.origin}/#track?ref=${selectedVerifyOrder.id}&email=${encodeURIComponent(selectedVerifyOrder.customerEmail)}`;
                                
                                const messageText = `Hello *${selectedVerifyOrder.customerName}*,\n\nThank you for choosing Mercy Farmstead! 🌾\nHere is the summary of your livestock reservation under reference token *${selectedVerifyOrder.id}*:\n\n• *Product:* ${selectedVerifyOrder.productName}\n• *Quantity:* ${selectedVerifyOrder.quantity} units\n• *Total Amount:* ₦${selectedVerifyOrder.totalPrice.toLocaleString()}\n• *Payment Bank:* ${selectedVerifyOrder.paymentBank}\n• *Payment Status:* ${verifyActionPayState || selectedVerifyOrder.paymentStatus}\n• *Shipping Status:* ${verifyActionShippingState || selectedVerifyOrder.shippingStatus || 'Pending'}\n\nYou can live-track your verification status and delivery stages using this direct tracking portal link:\n${baseLink}\n\nBest regards,\nThe Mercy Farmstead Team 🤠`;
                                
                                const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(messageText)}`;
                                window.open(whatsappUrl, '_blank');
                              }}
                              className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-1.5 px-3 rounded text-[10px] flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <MessageSquare size={12} className="text-white" />
                              <span>Open in WhatsApp</span>
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setVerifyActionPayState('Verified');
                                setVerifyActionOrderState('Confirmed');
                              }}
                              className={`py-1 px-2.5 rounded-lg text-[9px] font-bold ${verifyActionPayState === 'Verified' && verifyActionOrderState === 'Confirmed' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setVerifyActionPayState('Verified');
                                setVerifyActionOrderState('Shipped');
                              }}
                              className={`py-1 px-2.5 rounded-lg text-[9px] font-bold ${verifyActionPayState === 'Verified' && verifyActionOrderState === 'Shipped' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            >
                              Ship
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setVerifyActionPayState('Failed Verification');
                                setVerifyActionOrderState('Cancelled');
                              }}
                              className={`py-1 px-2.5 rounded-lg text-[9px] font-bold ${verifyActionPayState === 'Failed Verification' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            >
                              Reject
                            </button>
                          </div>
                        </div>

                      </form>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* ================ AI CHAT INTERCEPTS ================ */}
          {activeTab === 'chats' && (
            <div className="space-y-6" id="admin-chats-panel">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 font-sans">AI Chat Integrations Panel</h3>
                  <p className="text-xs text-neutral-500 mt-1">Review live robotic customer conversations. Take manual control and post responses directly.</p>
                </div>
              </div>

              {/* Operational status toggle card */}
              <div className="bg-white border border-neutral-150 p-4 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <h4 className="text-xs font-black uppercase text-neutral-700 tracking-wider">Administrative Status (Chatbot Assistant Mode)</h4>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-snug">
                    Toggle active presence status. When you are <span className="text-amber-700 font-extrabold font-mono">ACTIVE (ONLINE)</span>, the AI chatbot stops automatic replies to let you reply manually. When you are <span className="text-emerald-700 font-extrabold font-mono">AWAY (OFFLINE)</span>, the AI automatically manages customer inquiries.
                  </p>
                </div>
                <div className="flex flex-wrap sm:justify-end gap-2 shrink-0">
                  <button
                    onClick={() => updateAdminStatus('active')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      adminStatus === 'active'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm ring-2 ring-amber-500/20'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${adminStatus === 'active' ? 'bg-amber-300 animate-pulse' : 'bg-neutral-400'}`}></span>
                    <span>Admin Active (Mute Bot)</span>
                  </button>
                  <button
                    onClick={() => updateAdminStatus('away')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      adminStatus === 'away'
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${adminStatus === 'away' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-400'}`}></span>
                    <span>Admin Away (AI Specialist)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Conversations List side panel (5 Columns) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden min-h-[400px]">
                  <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">Sessions stream</div>
                  <div className="divide-y divide-neutral-100 max-h-[450px] overflow-y-auto">
                    {chats.map((c) => {
                      const active = selectedChatSession?.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedChatSession(c);
                            markChatAsRead(c.id);
                          }}
                          className={`p-4 cursor-pointer hover:bg-neutral-50 transition-colors text-xs relative ${
                            active ? 'bg-emerald-50 text-emerald-950 font-bold' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="font-extrabold text-neutral-950 max-w-[120px] truncate">{c.customerName}</h4>
                            <span className="text-[9px] text-neutral-400 font-mono font-bold">
                              {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-neutral-500 truncate mt-1">
                            {c.messages[c.messages.length - 1]?.text || 'No messages.'}
                          </p>

                          {/* unread indicators */}
                          {c.unreadByAdmin && (
                            <div className="absolute right-4 bottom-4 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chat window detailed (8 Columns) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col min-h-[400px] max-h-[500px]">
                  {selectedChatSession ? (
                    <>
                      <div className="p-4 bg-neutral-900 border-b border-neutral-800 text-white flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shadow-xs">
                        <div>
                          <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
                            <span>{selectedChatSession.customerName}</span>
                            {selectedChatSession.chatbotDisabled && (
                              <span className="px-1.5 py-0.5 text-[8px] font-mono bg-rose-650/40 text-rose-300 rounded border border-rose-500/30">Muted AI</span>
                            )}
                          </h4>
                          <span className="text-[9px] text-neutral-400">Phone: {selectedChatSession.customerPhone || 'Not logged'} | Email: {selectedChatSession.customerEmail || 'Not logged'}</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-700">
                            <span className="text-[8px] text-neutral-300 font-bold uppercase tracking-wider">Bot Responder:</span>
                            <button
                              type="button"
                              onClick={() => toggleSessionChatbot(selectedChatSession.id, !!selectedChatSession.chatbotDisabled)}
                              className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide rounded transition-colors cursor-pointer ${
                                selectedChatSession.chatbotDisabled
                                  ? 'bg-rose-950/60 text-rose-400 border border-rose-800'
                                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                              }`}
                              title={selectedChatSession.chatbotDisabled ? "Let AI respond for this session" : "Mute AI chatbot for this session"}
                            >
                              {selectedChatSession.chatbotDisabled ? 'MUTED' : 'ON (ACTIVE)'}
                            </button>
                          </div>
                          <span className="text-[9px] font-mono text-emerald-300 uppercase tracking-widest font-black shrink-0">Interception active</span>
                        </div>
                      </div>
                      {/* Transcript log scroll */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                        {selectedChatSession.messages.map((m) => {
                          const isBot = m.sender === 'bot';
                          const isUser = m.sender === 'user';
                          const isAdmin = m.sender === 'admin';
                          
                          return (
                            <div key={m.id} className={`flex ${isUser ? '' : 'justify-end'}`}>
                              <div className={`p-3 rounded-2xl max-w-[80%] text-xs shadow-xs leading-relaxed ${
                                isAdmin
                                  ? 'bg-amber-50 text-neutral-900 border border-amber-200'
                                  : isBot
                                  ? 'bg-neutral-200/50 text-neutral-900'
                                  : 'bg-emerald-700 text-white'
                              }`}>
                                <div className="text-[8px] uppercase tracking-widest text-neutral-400 mb-0.5 font-extrabold">
                                  {m.sender}
                                </div>

                                {m.imageUrl && (
                                  <div className="mb-2 max-w-full overflow-hidden rounded-xl border border-neutral-200/85 bg-neutral-100 p-1">
                                    <img 
                                      src={m.imageUrl} 
                                      alt="Attached Receipt" 
                                      referrerPolicy="no-referrer"
                                      className="max-w-[200px] max-h-48 object-contain rounded-lg cursor-zoom-in"
                                      onClick={() => {
                                        const win = window.open();
                                        if (win) {
                                          win.document.write(`<img src="${m.imageUrl}" style="max-width:100%; height:auto; display:block; margin:auto;" />`);
                                        }
                                      }}
                                    />
                                    <div className="text-[8px] font-bold text-neutral-400 mt-1 px-1">
                                      <span>Transfer Receipt 💳</span>
                                    </div>
                                  </div>
                                )}

                                <p className="whitespace-pre-line">{m.text}</p>
                                <span className="text-[7px] block text-neutral-400 text-right mt-1 font-semibold">
                                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply override form layout */}
                      <form onSubmit={executeChatReply} className="p-3 border-t border-neutral-100 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type manual response directly overriding the AI..."
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          className="flex-1 text-xs p-2.5 bg-neutral-50 border-0 focus:ring-2 focus:ring-amber-500 rounded-xl"
                        />
                        <button
                          type="submit"
                          className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl transition-all hover:scale-105 cursor-pointer shadow-sm"
                        >
                          Overriding Reply
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="m-auto text-center text-xs text-neutral-500 py-12">
                      Select a customer thread on the panel to intercept chats.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ================ BROADCAST BULLETIN ================ */}
          {activeTab === 'announcements' && (
            <div className="space-y-6" id="admin-broadcast-panel">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 font-sans">Campaign Board Bulletin</h3>
                <p className="text-xs text-neutral-500 mt-1">Publish new farm announcements, vaccination clearances, or price discount alerts directly on the homepage banner streams.</p>
              </div>

              {/* Creator form */}
              <form onSubmit={publishAnnouncement} className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                <div className="text-xs font-black text-emerald-800 uppercase tracking-wider">Publish New Broadcast</div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Broadcasting Header Banner</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Swine Section Sanitized & Vaccination Cleared"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full text-sm font-bold p-3 bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Bulletin Classification</label>
                    <select
                      value={annType}
                      onChange={(e) => setAnnType(e.target.value as any)}
                      className="w-full text-sm font-bold p-3 bg-white border border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                    >
                      <option value="news">Standard News</option>
                      <option value="arrival">New Arrivals</option>
                      <option value="promo">Promotional Rate</option>
                      <option value="alert">Critical Alerts</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Announcement details</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide explicit operational details, pricing discounts, or dates..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="w-full text-sm font-bold p-3 bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Publish Broadcast
                </button>
              </form>

              {/* Listing bulletin */}
              <div className="space-y-3">
                <div className="text-xs font-black text-neutral-400 uppercase tracking-widest">Active Broadcasting banners</div>
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a.id} className="bg-white p-5 rounded-xl border border-neutral-100 shadow-xs flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded tracking-widest">{a.type}</span>
                          <span className="text-[9px] text-neutral-400 font-medium">{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-neutral-900 text-sm mt-1.5">{a.title}</h4>
                        <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">{a.content}</p>
                      </div>
                      <button
                        onClick={() => deleteAnnouncement(a.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================ INQUIRIES INBOX ================ */}
          {activeTab === 'messages' && (
            <div className="space-y-6" id="admin-messages-panel">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 font-sans">Contact Inquiries Inbox</h3>
                <p className="text-xs text-neutral-500 mt-1">Review inquiries compiled directly from physical contact forms.</p>
              </div>

              {loadingMessages ? (
                <div className="text-center py-12"><RotateCw className="animate-spin mx-auto text-neutral-400" /></div>
              ) : contactMessages.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center border">Empty inquiries.</div>
              ) : (
                <div className="space-y-4">
                  {contactMessages.map((m) => (
                    <div key={m.id} className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-2">
                      <div className="flex justify-between gap-4 items-start border-b border-neutral-50 pb-2">
                        <div>
                          <h4 className="font-bold text-neutral-900 text-sm">{m.name}</h4>
                          <span className="text-[10px] text-neutral-500">Email: {m.email} | Phone: {m.phone || 'no phone'}</span>
                        </div>
                        <span className="text-[9px] text-neutral-400 font-mono">{new Date(m.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-neutral-700 leading-relaxed italic bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                        "{m.message}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================ OUTBOUND EMAIL LOGS ================ */}
          {activeTab === 'emails' && (
            <div className="space-y-6" id="admin-emails-panel">
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 font-sans">Outbound Simulated Email Histories</h3>
                  <p className="text-xs text-neutral-500 mt-1">Review alerts transmitted to <strong>mercyfarms01@gmail.com</strong> and customers without configuring real setups.</p>
                </div>
                <button
                  onClick={clearEmailHistory}
                  className="px-3.5 py-2 hover:bg-rose-600 border border-slate-350 bg-rose-50 border-rose-200 text-rose-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Trash size={13} />
                  <span>Wipe out email list</span>
                </button>
              </div>

              {loadingEmails ? (
                <div className="text-center py-12"><RotateCw className="animate-spin mx-auto text-neutral-450" /></div>
              ) : emailLogs.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl text-center text-xs text-neutral-500 border border-neutral-100">
                  No outgoing mail alerts.
                </div>
              ) : (
                <div className="space-y-4">
                  {emailLogs.map((l) => (
                    <div key={l.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-slate-100 font-mono space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 text-[10px] text-slate-400">
                        <div>To: <span className="text-emerald-400 font-bold">{l.to}</span></div>
                        <div className="flex items-center gap-2">
                          {l.status === 'success' && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-sans text-[9px] font-bold">
                              ✓ Real SMTP Dispatched
                            </span>
                          )}
                          {l.status === 'failed' && (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-sans text-[9px] font-bold animate-pulse">
                              ⚠ Real SMTP Failed
                            </span>
                          )}
                          {(!l.status || l.status === 'simulated') && (
                            <span className="px-2 py-0.5 bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 rounded font-sans text-[9px] font-bold">
                              ℹ Simulated Log Only
                            </span>
                          )}
                          <span>{new Date(l.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-100">Subject: {l.subject}</div>
                      <p className="text-[11px] text-slate-400 whitespace-pre-wrap bg-slate-950 p-3 rounded-lg border border-slate-800/50 leading-relaxed select-all">
                        {l.body}
                      </p>
                      
                      {l.status === 'failed' && l.errorDetail && (
                        <div className="bg-rose-950/40 border border-rose-800/50 p-4 rounded-xl space-y-2 mt-2 font-sans text-left">
                          <div className="flex gap-2 text-rose-400 text-xs font-bold items-center">
                            <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                            <span>SMTP Error Diagnostics & Troubleshooting Guide</span>
                          </div>
                          <div className="text-[11px] text-rose-200 whitespace-pre-wrap font-mono bg-rose-950/70 p-3 rounded-lg border border-rose-900/40 select-all leading-relaxed">
                            {l.errorDetail}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================ CUSTOMER WEBSITE LIVE ALERTS MANAGEMENT ================ */}
          {activeTab === 'notifications' && (
            <div className="space-y-8" id="admin-notifications-tab-panel">
              <div className="bg-gradient-to-r from-teal-900 to-emerald-950 p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4">
                  <Bell size={180} />
                </div>
                <div className="relative z-10 font-sans">
                  <span className="bg-amber-400 text-emerald-950 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider">
                    Administrative Core
                  </span>
                  <h3 className="text-xl font-black mt-2 uppercase tracking-wide">Customer Live Alerts Hub</h3>
                  <p className="text-xs text-emerald-100/80 max-w-xl mt-1">
                    Direct real-time notification controller. Monitor system status updates, direct swines or layering rate announcements, or transmit custom targeted notifications to individual client emails dynamically.
                  </p>
                </div>
              </div>

              {/* TWO COLUMN GRID: Dispatch Form on side, List of notifications on other side */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                
                {/* COLUMN 1: DISPATCH NEW CUSTOM ALERTS FORM */}
                <div className="xl:col-span-2 space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider">Dispatch Custom Alert</h4>
                    
                    {notifSuccessMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-xl animate-fade-in animate-pulse">
                        ✓ {notifSuccessMsg}
                      </div>
                    )}

                    <form onSubmit={handleSendCustomNotif} className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider">Alert Heading / Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Swine reservation updated"
                          value={notifTitle}
                          onChange={(e) => setNotifTitle(e.target.value)}
                          className="w-full text-xs p-3 bg-neutral-50 border border-neutral-200 focus:border-emerald-600 focus:outline-none rounded-xl font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider">Alert Message content</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Provide descriptive details the customer will read..."
                          value={notifMessage}
                          onChange={(e) => setNotifMessage(e.target.value)}
                          className="w-full text-xs p-3 bg-neutral-50 border border-neutral-200 focus:border-emerald-600 focus:outline-none rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider">Alert Type / Accent</label>
                          <select
                            value={notifType}
                            onChange={(e: any) => setNotifType(e.target.value)}
                            className="w-full text-xs p-2.5 bg-white border border-neutral-300 text-black font-extrabold focus:ring-2 focus:ring-emerald-700 focus:border-transparent rounded-xl outline-none cursor-pointer"
                          >
                            <option value="general" className="text-black font-bold">General (Standard)</option>
                            <option value="order" className="text-black font-bold">Order (Amber)</option>
                            <option value="announcement" className="text-black font-bold">Announcement (Emerald)</option>
                            <option value="alert" className="text-black font-bold">Alert (Crimson)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider">Target Destination</label>
                          <select
                            value={notifTargetType}
                            onChange={(e: any) => setNotifTargetType(e.target.value)}
                            className="w-full text-xs p-2.5 bg-white border border-neutral-300 text-black font-extrabold focus:ring-2 focus:ring-emerald-700 focus:border-transparent rounded-xl outline-none cursor-pointer"
                          >
                            <option value="all" className="text-black font-bold">Everyone (All visitor drawers)</option>
                            <option value="specific" className="text-black font-bold">Specific Customer Email</option>
                          </select>
                        </div>
                      </div>

                      {notifTargetType === 'specific' && (
                        <div className="space-y-1 animate-fade-in">
                          <label className="block text-[10px] font-black uppercase text-rose-600 tracking-wider">Customer Email Address</label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. daniel@gmail.com"
                            value={notifTargetEmail}
                            onChange={(e) => setNotifTargetEmail(e.target.value)}
                            className="w-full text-xs p-3 bg-rose-50/10 border border-rose-200 focus:border-rose-500 focus:outline-none rounded-xl font-mono text-neutral-850"
                          />
                          <p className="text-[9px] text-neutral-400 leading-snug">
                            The user must bind this email address in their alerts sliding tab to view this private alert.
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={sendingNotif}
                        className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs uppercase font-black tracking-wider transition-colors shrink-0 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {sendingNotif ? (
                          <>
                            <RotateCw size={13} className="animate-spin" />
                            <span>Dispatching alert...</span>
                          </>
                        ) : (
                          <>
                            <Bell size={13} />
                            <span>Dispatch Alert to Website</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* COLUMN 2: LIST AND HISTORY OF DISPATCHED NOTIFICATIONS */}
                <div className="xl:col-span-3 space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider">
                      Live Notification Archives ({notifications.length})
                    </h4>
                    <button 
                      onClick={fetchAdminData}
                      className="text-[10px] text-emerald-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw size={10} />
                      Sync feeds
                    </button>
                  </div>

                  {loadingNotifications ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100 shadow-xs">
                      <RotateCw size={24} className="animate-spin text-neutral-400 mx-auto mb-2" />
                      <p className="text-xs text-neutral-500 font-medium">Re-indexing notification caches...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl text-center text-xs text-neutral-400 border border-neutral-100 shadow-xs space-y-3">
                      <Bell size={36} className="mx-auto text-neutral-200" />
                      <p className="font-bold text-neutral-700">No live notification alerts logged yet.</p>
                      <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
                        Any system alert logs, order verifications, payment confirmations, or custom bulletins dispatched to customer interfaces will manifest in this feed.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                      {notifications.map((notif) => {
                        const dateStr = new Date(notif.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                        let typeStyles = 'bg-neutral-100 text-neutral-800 border-neutral-200';
                        if (notif.type === 'order') typeStyles = 'bg-amber-150 text-amber-900 border-amber-300';
                        else if (notif.type === 'alert') typeStyles = 'bg-rose-50 text-rose-800 border-rose-250';
                        else if (notif.type === 'announcement') typeStyles = 'bg-emerald-50 text-emerald-800 border-emerald-250';

                        return (
                          <div 
                            key={notif.id}
                            className={`p-4 bg-white border rounded-2xl shadow-xs transition-colors hover:border-neutral-300 relative ${
                              notif.read ? 'opacity-80' : 'border-emerald-250 bg-emerald-50/15'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-black text-neutral-900 leading-snug">{notif.title}</span>
                                  <span className={`text-[8.5px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 border rounded-md whitespace-nowrap ${typeStyles}`}>
                                    {notif.type || 'general'}
                                  </span>
                                  {notif.read ? (
                                    <span className="text-[8.5px] font-mono text-neutral-400 uppercase font-black">Read</span>
                                  ) : (
                                    <span className="text-[8.5px] font-mono text-emerald-600 uppercase font-bold animate-pulse">Unread</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-neutral-600 leading-relaxed font-normal">{notif.message}</p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {!notif.read && (
                                  <button
                                    onClick={() => handleMarkNotifRead(notif.id)}
                                    className="p-1 px-1.5 text-[9px] font-bold uppercase text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                    title="Mark read"
                                  >
                                    Mark Read
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteNotif(notif.id)}
                                  className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete alert permanently"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-neutral-100 flex flex-wrap justify-between items-center text-[9px] text-neutral-400 font-mono gap-y-1">
                              <div>Target: <span className="font-bold text-neutral-600">{notif.targetUser}</span></div>
                              {notif.referenceId && <div>Reference ID: <span className="font-bold text-indigo-600">{notif.referenceId}</span></div>}
                              <div>{dateStr}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ================ REPORTS & INSIGHTS ================ */}
          {activeTab === 'reports' && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-6" id="admin-reports-panel">
              <ReportsDashboard orders={orders} products={products} />
            </div>
          )}

          {/* ================ SECURITY SETTINGS ================ */}
          {activeTab === 'security' && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-6" id="admin-security-panel">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 font-sans flex items-center gap-2">
                  <Key size={20} className="text-emerald-700" />
                  <span>Security & Passcode pin settings</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1">Alter operational backdoor access passcode keys to encrypt details cleanly.</p>
              </div>

              <form onSubmit={handlePassChange} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Current Passcode Pin</label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Enter previous pin"
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    className="w-full text-sm font-bold p-3 bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">New Access Passcode</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Enter fresh passcode pin"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full text-sm font-bold p-3 bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                  />
                </div>

                {passStatus && (
                  <div className={`text-xs p-3 rounded-xl font-semibold border ${
                    passStatus.toLowerCase().includes('error') 
                      ? 'bg-rose-50 text-rose-900 border-rose-200' 
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  }`}>
                    {passStatus}
                  </div>
                )}

                <button
                  type="submit"
                  className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Save pin change
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* ================ ZOOMEABLE RECEIPT MODAL ================ */}
      <AnimatePresence>
        {zoomedImageUrl && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <button
              onClick={() => setZoomedImageUrl(null)}
              className="absolute top-6 right-6 p-2 bg-slate-900/80 border border-slate-700 text-white rounded-full hover:bg-rose-700 transition-all cursor-pointer"
              title="Exit zoom display"
            >
              <X size={20} />
            </button>
            <div className="max-w-3xl w-full h-[85vh] flex flex-col justify-center select-none" id="zoomed-receipt-frame">
              <img
                src={zoomedImageUrl}
                alt="receipt detail zoom panel"
                className="w-full h-full object-contain filter drop-shadow-2xl"
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ================ ADD/EDIT PRODUCT MODAL ================ */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-neutral-100 overflow-hidden w-full max-w-lg shadow-2xl relative"
              id="product-edit-form-modal"
            >
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-widest">{editingProduct ? 'Modify Farm Entry' : 'Create Farm Entry'}</h4>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="p-1 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={saveProductSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Swine"
                      value={prodFormName}
                      onChange={(e) => setProdFormName(e.target.value)}
                      className="w-full text-sm font-bold p-3 bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Classification Category</label>
                    <select
                      value={customCategoryEnabled ? '__CUSTOM__' : prodFormCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__CUSTOM__') {
                          setCustomCategoryEnabled(true);
                          setProdFormCategory('__CUSTOM__');
                        } else {
                          setCustomCategoryEnabled(false);
                          setProdFormCategory(val);
                        }
                      }}
                      className="w-full text-sm font-bold p-3 bg-white border border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                    >
                      <option value="Pigs">Pigs</option>
                      <option value="Eggs">Eggs</option>
                      <option value="Layers">Layers</option>
                      <option value="Fish">Fish</option>
                      <option value="Broilers">Broilers</option>
                      <option value="__CUSTOM__">+ Create Custom Category...</option>
                    </select>
                    {customCategoryEnabled && (
                      <div className="mt-2 animate-fade-in" id="custom-category-input-container">
                        <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">New Custom Category Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Snail, Turkey, Feed, Vet..."
                          value={customCategoryValue}
                          onChange={(e) => setCustomCategoryValue(e.target.value)}
                          className="w-full text-sm font-bold p-3 bg-emerald-50/50 border border-emerald-300 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Price per unit (₦)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={prodFormPrice}
                      onChange={(e) => setProdFormPrice(e.target.value)}
                      className="w-full text-sm font-bold p-3 bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Sales Unit Type</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. crate, head, kg"
                      value={prodFormUnit}
                      onChange={(e) => setProdFormUnit(e.target.value)}
                      className="w-full text-sm font-bold p-3 bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Stock Vol.</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 150"
                      value={prodFormStock}
                      onChange={(e) => setProdFormStock(e.target.value)}
                      className="w-full text-sm font-bold p-3 bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                  <input
                    type="checkbox"
                    id="prodFormAvailable"
                    checked={prodFormAvailable}
                    onChange={(e) => setProdFormAvailable(e.target.checked)}
                    className="w-4.5 h-4.5 text-emerald-700 bg-white border-neutral-300 rounded focus:ring-emerald-700 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-neutral-800">Available & Active Listing</span>
                    <span className="text-[10px] text-neutral-500 leading-none mt-0.5">Toggle to instantly mark this product as in-stock/active or hide it as out-of-stock.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Provide vaccine descriptions or feeds standards..."
                    value={prodFormDesc}
                    onChange={(e) => setProdFormDesc(e.target.value)}
                    className="w-full text-sm font-bold p-3 bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl resize-none outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-550 tracking-wider mb-1">Illustration Cover Image</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-3 rounded-2xl border border-neutral-150">
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black uppercase text-neutral-400">Option A: Upload Local Picture</span>
                      <div
                        onClick={() => document.getElementById('product-pic-uploader')?.click()}
                        className="border-2 border-dashed border-neutral-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 p-4 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[92px]"
                      >
                        <input
                          type="file"
                          id="product-pic-uploader"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const b64 = event.target?.result as string;
                                setProdFormImage(b64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Upload size={18} className="text-neutral-400 mb-1" />
                        <span className="text-[10px] font-extrabold text-neutral-700">Select File</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[9px] font-black uppercase text-neutral-400">Option B: Graphic URL link</span>
                      <textarea
                        rows={3}
                        placeholder="Paste static image web URL..."
                        value={prodFormImage.startsWith('data:') ? '' : prodFormImage}
                        onChange={(e) => setProdFormImage(e.target.value)}
                        className="w-full text-xs font-semibold p-2 bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-700 rounded-xl outline-none resize-none h-[92px] leading-tight"
                      />
                    </div>
                  </div>

                  {prodFormImage && (
                    <div className="mt-2.5 p-2 bg-emerald-50/30 border border-emerald-100 rounded-xl flex items-center justify-between gap-3 animate-fade-in" id="product-pic-preview">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={prodFormImage}
                          alt="Thumbnail preview"
                          className="w-10 h-10 object-cover rounded-md border shadow-xs bg-white"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider">Picture Selected</div>
                          <div className="text-[9px] text-neutral-500 truncate font-mono max-w-[150px] sm:max-w-[200px]">
                            {prodFormImage.startsWith('data:') ? 'Local Base64 File' : prodFormImage}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProdFormImage('')}
                        className="px-2 py-1 text-[9px] font-black text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <div className="text-[9px] text-neutral-400 mt-1">If blank, standard imagery of this category will be automatically used.</div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 hover:bg-neutral-100 text-neutral-600 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Commit Configuration
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
