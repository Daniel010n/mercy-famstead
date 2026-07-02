export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string; // e.g., "crate", "kg", "head", "batch"
  stock: number;
  available: boolean;
  imageUrl: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  totalPrice: number;
  paymentBank: 'United Bank of Africa' | 'Moniepoint MFB';
  paymentProofUrl?: string; // Base64 image
  paymentProofName?: string;
  paymentStatus: 'Pending Verification' | 'Verified' | 'Failed Verification' | 'Cancelled';
  orderStatus: 'Pending' | 'Confirmed' | 'Shipped' | 'Cancelled';
  shippingStatus?: 'Pending' | 'Dispatched' | 'Delivered';
  notes?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: string;
  imageUrl?: string;
}

export interface ChatSession {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  messages: ChatMessage[];
  lastMessageAt: string;
  unreadByAdmin: boolean;
  chatbotDisabled?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'alert' | 'news' | 'promo' | 'arrival';
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order_status' | 'payment_verified' | 'payment_failed' | 'new_booking' | 'new_message' | 'announcement' | 'general' | 'receipt_submitted';
  targetUser?: string; // customerEmail, 'admin', or 'all'
  referenceId?: string; // order id, etc.
  read: boolean;
  createdAt: string;
}
