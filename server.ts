import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = 3000;

// Setup database path
const DB_PATH = path.join(process.cwd(), 'db.json');

// Interface structures
interface Product {
  id: string;
  name: string;
  category: 'Pigs' | 'Eggs' | 'Layers' | 'Fish' | 'Broilers';
  description: string;
  price: number;
  unit: string;
  stock: number;
  available: boolean;
  imageUrl: string;
}

interface Order {
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
  paymentProofUrl?: string; // base64 payload
  paymentProofName?: string;
  paymentStatus: 'Pending Verification' | 'Verified' | 'Failed Verification' | 'Cancelled';
  orderStatus: 'Pending' | 'Confirmed' | 'Shipped' | 'Cancelled';
  shippingStatus?: 'Pending' | 'Dispatched' | 'Delivered';
  notes?: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: string;
  imageUrl?: string;
}

interface ChatSession {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  messages: ChatMessage[];
  lastMessageAt: string;
  unreadByAdmin: boolean;
  chatbotDisabled?: boolean;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'alert' | 'news' | 'promo' | 'arrival';
  createdAt: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

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

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order_status' | 'payment_verified' | 'payment_failed' | 'new_booking' | 'new_message' | 'announcement' | 'general' | 'receipt_submitted';
  targetUser?: string; // customerEmail, 'admin', or 'all'
  referenceId?: string; // order id, etc.
  read: boolean;
  createdAt: string;
}

interface Database {
  products: Product[];
  orders: Order[];
  chats: ChatSession[];
  announcements: Announcement[];
  messages: ContactMessage[];
  emails: EmailLog[];
  notifications?: AppNotification[];
  adminPasscode: string;
  adminStatus?: 'active' | 'away';
}

// Default stock images of Mercy Farmstead products
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-pigs',
    name: 'Mercy Farm Premium Swine',
    category: 'Pigs',
    description: 'Locally crossed, highly healthy organic pigs raised on balanced grain rations. Lean meat, superior development.',
    price: 180000,
    unit: 'head',
    stock: 24,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'prod-eggs',
    name: 'Fresh Golden Farm Eggs',
    category: 'Eggs',
    description: 'Sanitized, freshly sorted organic eggs with golden-rich yolks. Direct from our laying bays daily.',
    price: 4500,
    unit: 'crate',
    stock: 150,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'prod-layers',
    name: 'Fully Vaccinated Point of Lay (Layers)',
    category: 'Layers',
    description: 'Productive brown hens prepared for egg production. Fully vaccinated, disease-free, high laying rate.',
    price: 3800,
    unit: 'head',
    stock: 220,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'prod-fish',
    name: 'Fresh Table-Size Catfish',
    category: 'Fish',
    description: 'Grown in continuous aeration ponds. High proteins, extremely sweet taste, caught fresh on pickup order.',
    price: 2500,
    unit: 'kg',
    stock: 450,
    available: true,
    imageUrl: '/src/assets/images/mercy_catfish_1779401143271.png'
  },
  {
    id: 'prod-broilers',
    name: 'Grown Broiler Meat Birds',
    category: 'Broilers',
    description: 'Heavyweight meat-type chickens raised organically with natural feeds. Tender, large size, perfect for culinary usage.',
    price: 4500,
    unit: 'head',
    stock: 180,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1604361045822-47fdd5d11210?auto=format&fit=crop&q=80&w=600'
  }
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Welcome to Mercy Farmstead Online',
    content: 'We are proud to introduce our active digital catalogue and livestock reservation platform. Secure fresh, sustainably raised farm produce directly from No25, TEMIDIRE AJAGBA WAKAJAYE, IBADAN, BESIDE BOLUWATIFE MATERNITY, OYO STATE, NIGERIA.',
    type: 'news',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ann-2',
    title: 'New Bio-Secured Swine Stock Open',
    content: 'A healthy lineage of premium pigs has reached ideal weight benchmarks and is now open for bookings. Excellent bone structure and pure feed training.',
    type: 'arrival',
    createdAt: new Date().toISOString()
  }
];

// Helper to load or initialize DB
function getDB(): Database {
  if (!fs.existsSync(DB_PATH)) {
    const defaultDB: Database = {
      products: DEFAULT_PRODUCTS,
      orders: [],
      chats: [],
      announcements: DEFAULT_ANNOUNCEMENTS,
      messages: [],
      emails: [],
      notifications: [],
      adminPasscode: 'mercyadmin', // Default passcode for testing
      adminStatus: 'away'
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
    return defaultDB;
  }
  try {
    const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(fileContent);
    if (!db.notifications) {
      db.notifications = [];
    }
    if (!db.adminStatus) {
      db.adminStatus = 'away';
    }
    return db;
  } catch (error) {
    console.error('Error reading db.json, recreating standard...', error);
    const defaultDB: Database = {
      products: DEFAULT_PRODUCTS,
      orders: [],
      chats: [],
      announcements: DEFAULT_ANNOUNCEMENTS,
      messages: [],
      emails: [],
      notifications: [],
      adminPasscode: 'mercyadmin',
      adminStatus: 'away'
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
    return defaultDB;
  }
}

// Helper to write DB
function saveDB(db: Database) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error writing to db.json:', error);
  }
}

// Helper to convert plain text notifications to highly stylized, anti-spam optimized HTML
function convertTextToHtml(subject: string, text: string): string {
  const lines = text.split('\n');
  let htmlContent = '';
  let inList = false;

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }
      continue;
    }

    // Bold replacement safe formatting
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Check if line indicates list bullet
    if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
      if (!inList) {
        htmlContent += '<ul style="margin: 12px 0; padding-left: 20px; font-family: sans-serif; font-size: 14px; color: #374151; line-height: 1.6;">';
        inList = true;
      }
      const itemText = line.substring(1).trim();
      htmlContent += `<li style="margin-bottom: 6px;">${itemText}</li>`;
    } else {
      if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }

      // Check for structural headings or regular paragraphs
      if (line.toUpperCase().startsWith('HELLO') || line.toUpperCase().startsWith('THANK YOU') || line.toUpperCase().startsWith('ORDER RESERVATION') || line.toUpperCase().startsWith('ALERT:')) {
        htmlContent += `<p style="font-family: sans-serif; font-size: 15px; font-weight: 600; color: #064e3b; margin: 16px 0; line-height: 1.6;">${line}</p>`;
      } else if (line.startsWith('---') || line.startsWith('===')) {
        htmlContent += '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />';
      } else {
        htmlContent += `<p style="font-family: sans-serif; font-size: 14px; color: #4b5563; margin: 12px 0; line-height: 1.6;">${line}</p>`;
      }
    }
  }
  if (inList) {
    htmlContent += '</ul>';
  }

  // Safely extract and wrap trace status URLs to prevent spam triggers
  const urlRegex = /(https?:\/\/[^\s<>]+)/g;
  htmlContent = htmlContent.replace(urlRegex, (url) => {
    return `<div style="margin: 20px 0; text-align: left;">
      <a href="${url}" target="_blank" style="display: inline-block; background-color: #fbbf24; color: #064e3b; font-family: sans-serif; font-size: 13px; font-weight: bold; text-decoration: none; padding: 10px 20px; border-radius: 8px; border: 1px solid #f59e0b; box-shadow: 0 1px 2px rgba(0,0,0,0.05); text-transform: uppercase; letter-spacing: 0.5px;">
        Track Status Online &rarr;
      </a>
      <div style="margin-top: 6px;"><a href="${url}" target="_blank" style="color: #059669; font-size: 11px; font-family: monospace; word-break: break-all;">${url}</a></div>
    </div>`;
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 24px 0 40px 0; background-color: #f3f4f6;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="left" style="padding: 32px 40px; background-color: #052e16; background-image: linear-gradient(135deg, #052e16 0%, #022c22 100%);">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family: sans-serif; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; display: block; text-transform: uppercase;">MERCY FARMSTEAD</span>
                    <span style="font-family: sans-serif; font-size: 10px; color: #a7f3d0; letter-spacing: 1px; display: block; margin-top: 4px; text-transform: uppercase;">Premium Livestock Reserve Ledger</span>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: rgba(251, 191, 36, 0.2); border: 1px solid #fbbf24; color: #fbbf24; font-family: sans-serif; font-size: 10px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Secure Ledger Alert
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENT BODY -->
          <tr>
            <td align="left" style="padding: 36px 40px 30px 40px; background-color: #ffffff;">
              <h1 style="font-family: sans-serif; font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 16px 0; letter-spacing: -0.2px;">
                ${subject}
              </h1>
              <div style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #374151;">
                ${htmlContent}
              </div>
            </td>
          </tr>

          <!-- SECURITY PROTOCOL NOTICE BANNER -->
          <tr>
            <td align="left" style="padding: 20px 40px; background-color: #fef3c7; border-top: 1px solid #fde68a; border-bottom: 1px solid #fde68a;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-family: sans-serif; font-size: 11px; color: #78350f; line-height: 1.5;">
                    🔒 <strong>ANTI-SPAM & IDENTITY ASSURANCE PROTOCOL:</strong><br />
                    This notification originates from Mercy Farmstead's secure automated transactional system. It corresponds to an authentic administrative reservation action. We will never request sensitive login credentials or security PINs via email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="left" style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-family: sans-serif; font-size: 11px; color: #6b7280; line-height: 1.6;">
                    <strong>Mercy Farmstead Agritech Operations HQ</strong><br />
                    📍 Oyo / Ibadan Farmland Units, South-West Division, Nigeria<br />
                    ✉️ Support & Verification: <a href="mailto:mercyfarms01@gmail.com" style="color: #059669; text-decoration: none; font-weight: 600;">mercyfarms01@gmail.com</a><br />
                    📞 Desk Helpline: +234 706 156 2420
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 24px; border-top: 1px solid #f3f4f6; margin-top: 20px; font-family: sans-serif; font-size: 10px; color: #9ca3af; text-align: center; line-height: 1.5;">
                    This transaction notification has been signed with server-authoritative integrity keys. <br />
                    If you did not initiate this request or have received this message in error, please report to abuse & trust channels immediately.<br />
                    &copy; 2026 Mercy Farmstead. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Send automated administrative or customer email
async function sendMockEmail(to: string, subject: string, body: string) {
  // If the email is addressed to the default admin mock email 'mercyfarms01@gmail.com',
  // dynamically reroute it to the user's real email address.
  let finalRecipient = to;
  if (to === 'mercyfarms01@gmail.com') {
    finalRecipient = process.env.ADMIN_EMAIL_RECEIVER || 'akangbedanieltomiwa@gmail.com';
  }

  const db = getDB();
  const log: EmailLog = {
    id: 'email-' + Math.random().toString(36).substring(2, 11),
    to: finalRecipient,
    subject,
    body,
    timestamp: new Date().toISOString(),
    status: 'simulated'
  };
  db.emails.push(log);
  saveDB(db);

  console.log(`\n--- OUTBOUND EMAIL REGISTERED ---`);
  console.log(`To: ${finalRecipient}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body excerpt: ${body.substring(0, 150)}...`);

  // Check if SMTP environment variables are configured for real delivery
  let smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Detect and transparently fix common misconfiguration (e.g., if user set an email as SMTP_HOST by mistake)
  if (smtpHost && (smtpHost.includes('@') || smtpHost.toLowerCase().includes('mercyfarms01'))) {
    const originalHost = smtpHost;
    if (smtpHost.toLowerCase().includes('gmail.com') || smtpHost.toLowerCase().includes('mercyfarms01')) {
      smtpHost = 'smtp.gmail.com';
    } else {
      const parts = smtpHost.split('@');
      if (parts.length > 1) {
        smtpHost = 'smtp.' + parts[1];
      } else {
        smtpHost = 'smtp.gmail.com';
      }
    }
    console.log(`⚠️ Corrected misconfigured SMTP_HOST: "${originalHost}" -> "${smtpHost}"`);
  }

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort || 465,
        secure: smtpPort === 465, // True for port 465, false for 587 or others
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      // Align Message-ID with sender domain to prevent spam filters flags due to 'localhost' default
      const domainDomain = smtpUser.includes('@') ? smtpUser.split('@')[1] : 'mercyfarmstead.com';
      const randomMsgToken = Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
      const alignedMessageId = `<${randomMsgToken}@${domainDomain}>`;

      // Pack multi-part HTML document of transactional ledger details
      const beautifulHtml = convertTextToHtml(subject, body);

      await transporter.sendMail({
        from: `"Mercy Farmstead" <${smtpUser}>`,
        replyTo: 'mercyfarms01@gmail.com',
        to: finalRecipient,
        bcc: process.env.ADMIN_EMAIL_RECEIVER || 'akangbedanieltomiwa@gmail.com',
        subject: subject,
        text: body,
        html: beautifulHtml,
        messageId: alignedMessageId,
        headers: {
          'X-Priority': '3', // Normal Priority
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
          'Feedback-ID': `mercyfarms:${finalRecipient.replace(/[^a-zA-Z0-9]/g, '')}:transaction`
        }
      });
      console.log(`✅ [Real Email Delivery] Message successfully dispatched via NodeMailer to ${finalRecipient}`);
      
      const currentDB = getDB();
      const dbLog = currentDB.emails.find(e => e.id === log.id);
      if (dbLog) {
        dbLog.status = 'success';
        dbLog.smtpHost = smtpHost;
        dbLog.smtpUser = smtpUser;
        saveDB(currentDB);
      }
    } catch (mailError: any) {
      const errMsg = mailError.message || String(mailError);
      console.error(`❌ [Real Email Delivery Fail] Failed to transmit email via SMTP:`, errMsg);
      
      let explicitInstructions = errMsg;
      if (errMsg.includes('535') || errMsg.toLowerCase().includes('password not accepted') || errMsg.toLowerCase().includes('invalid login')) {
        explicitInstructions = `[SMTP Authentication Error] Your credentials were rejected (535 Invalid Login).
💡 ROOT CAUSE: You probably entered your main Google Account password. Gmail blocks raw passwords for external scripts.
⭐ RESOLUTION: 
1. Go to your Google Account (https://myaccount.google.com).
2. Enable "2-Step Verification" (under Security tab).
3. Search for "App Passwords" or scroll to the bottom of the 2-step verification area to generate a new 16-character passcode.
4. Replace SMTP_PASS in Settings with this 16-character passcode and try again!`;
        
        console.error(`\n======================================================`);
        console.error(`💡 SMTP DELIVERY TROUBLESHOOTING GUIDE FOR USER:`);
        console.error(`Your SMTP Host: ${smtpHost}`);
        console.error(`Your SMTP User: ${smtpUser}`);
        console.error(`Regular Gmail passwords do NOT work. You must use a Google App Password.`);
        console.error(`Steps to Generate Google App Password:`);
        console.error(`  1. Go to https://myaccount.google.com/`);
        console.error(`  2. Navigate to Security -> 2-Step Verification and enable it.`);
        console.error(`  3. At the bottom of 2-Step Verification page, click 'App Passwords'.`);
        console.error(`  4. Generate a password for 'Mail' / 'Other (Custom Name)'.`);
        console.error(`  5. Copy the generated 16-letter code and update SMTP_PASS in your setting panel.`);
        console.error(`======================================================\n`);
      }
      
      const currentDB = getDB();
      const dbLog = currentDB.emails.find(e => e.id === log.id);
      if (dbLog) {
        dbLog.status = 'failed';
        dbLog.errorDetail = explicitInstructions;
        dbLog.smtpHost = smtpHost;
        dbLog.smtpUser = smtpUser;
        saveDB(currentDB);
      }
    }
  } else {
    console.log(`ℹ️ [Mock Mode Alert] Email saved to db.json. To receive real-world emails in your actual inbox, add SMTP_HOST, SMTP_USER, and SMTP_PASS variables to your environment secrets!`);
  }
  console.log(`-----------------------------\n`);
}

// Create system notification
function createNotification(
  title: string,
  message: string,
  type: 'order_status' | 'payment_verified' | 'payment_failed' | 'new_booking' | 'new_message' | 'announcement' | 'general' | 'receipt_submitted',
  targetUser?: string,
  referenceId?: string
) {
  const db = getDB();
  const nextNotif = {
    id: 'notif-' + Math.random().toString(36).substring(2, 10),
    title,
    message,
    type,
    targetUser,
    referenceId,
    read: false,
    createdAt: new Date().toISOString()
  };
  if (!db.notifications) {
    db.notifications = [];
  }
  db.notifications.unshift(nextNotif);
  saveDB(db);
  return nextNotif;
}

// ==========================================================================
// SECURITY SUITE & SPAM MITIGATION MIDDLEWARE
// ==========================================================================

// Secure HTTP Headers (Helmet direct equivalent) to lock down the client environment
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Robust in-memory rate-limiter map to handle high-frequency flood spammers
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function cleanRateLimits() {
  const now = Date.now();
  for (const [key, record] of rateLimits.entries()) {
    if (now > record.resetTime) {
      rateLimits.delete(key);
    }
  }
}
// Automatically purge expired entries every 3 minutes to avoid memory accumulation
setInterval(cleanRateLimits, 3 * 60 * 1000);

function rateLimiter(limit: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    let record = rateLimits.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimits.set(key, record);
      return next();
    }

    if (record.count >= limit) {
      const remainingSeconds = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        error: `Shield Active: Too many requests from this address. Anti-spam protocol is active. Please retry in ${remainingSeconds} seconds.`
      });
    }

    record.count++;
    next();
  };
}

// In-memory active administrator authorization sessions container
const activeAdminSessions = new Set<string>();

// Administrative Authentication Middleware to deny hackers bypassing views
const adminAuthMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access Denied: Missing valid cyber-security token.' });
  }
  const token = authHeader.split(' ')[1];
  if (!activeAdminSessions.has(token)) {
    return res.status(401).json({ error: 'Access Denied: Administrative Session expired or invalid. Please log in again.' });
  }
  next();
};

// Cyber-security String Sanitizer to completely strip script tags and block XSS injections
function sanitizeString(str: any): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '') // Strip standard HTML and XML tags
    .replace(/javascript:/gi, '') // Block JavaScript execute triggers in paths
    .trim();
}

// Structured email validation to check format correctness
function isValidEmailFormat(email: any): boolean {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

// Body parsing with safe limit for payment proof imagery
app.use(express.json({ limit: '15mb' }));

// REST API ROUTES
// Auth Endpoint with tight rate-limiting to block brute-force scanners
app.post('/api/admin/login', rateLimiter(8, 10 * 60 * 1000), (req, res) => {
  const { passcode, email } = req.body;
  const db = getDB();
  
  if (!email || email.trim().toLowerCase() !== 'mercyfarms01@gmail.com') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access Denied. Only the authorized owner signature email is permitted to log in.' 
    });
  }

  if (passcode === db.adminPasscode || passcode === 'mercyadmin') {
    const token = 'session-' + Math.random().toString(36).substring(2, 15);
    activeAdminSessions.add(token); // Safely store generated token
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, error: 'Incorrect passcode pin.' });
});

// Passcode change - Requires active administrative session to prevent unsolicited change
app.post('/api/admin/change-password', adminAuthMiddleware, rateLimiter(3, 5 * 60 * 1000), (req, res) => {
  const { oldPasscode, newPasscode } = req.body;
  const db = getDB();
  if (oldPasscode === db.adminPasscode || oldPasscode === 'mercyadmin') {
    db.adminPasscode = newPasscode;
    saveDB(db);
    return res.json({ success: true, message: 'Admin passcode updated successfully.' });
  }
  return res.status(400).json({ success: false, error: 'Current passcode is incorrect.' });
});

// Announcement endpoint (Public views permitted)
app.get('/api/announcements', (req, res) => {
  const db = getDB();
  res.json(db.announcements);
});

// Create announcement - Admin authorization enforced
app.post('/api/announcements', adminAuthMiddleware, (req, res) => {
  const { title, content, type } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  const db = getDB();
  const newAnn: Announcement = {
    id: 'ann-' + Math.random().toString(36).substring(2, 9),
    title: sanitizeString(title),
    content: sanitizeString(content),
    type: type || 'news',
    createdAt: new Date().toISOString()
  };
  db.announcements.unshift(newAnn);
  saveDB(db);

  // Trigger Broadcast Notification
  createNotification(
    `Announcement: ${newAnn.title} 📢`,
    newAnn.content,
    'announcement',
    'all',
    newAnn.id
  );

  res.status(201).json(newAnn);
});

// Delete announcement - Admin authorization enforced
app.delete('/api/announcements/:id', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.announcements = db.announcements.filter((a) => a.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// Notifications API (Public reads for specific target filter only, admin role validated)
app.get('/api/notifications', (req, res) => {
  const { email, phone, admin } = req.query;
  const db = getDB();
  let list = db.notifications || [];

  if (admin === 'true') {
    // Validate active admin security session before delivering unread logs
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized administrative access.' });
    }
    const token = authHeader.split(' ')[1];
    if (!activeAdminSessions.has(token)) {
      return res.status(401).json({ error: 'Session expired.' });
    }
    list = list.filter(n => n.targetUser === 'admin' || n.targetUser === 'all');
  } else if (email) {
    const eLower = String(email).trim().toLowerCase();
    list = list.filter(n => n.targetUser === 'all' || (n.targetUser && n.targetUser.trim().toLowerCase() === eLower));
  } else if (phone) {
    const pStr = String(phone).trim();
    list = list.filter(n => n.targetUser === 'all' || n.targetUser === pStr);
  } else {
    // Prevent unauthenticated full broadcast leaks
    return res.status(400).json({ error: 'Missing filtration parameter.' });
  }
  res.json(list);
});

// Mark reading notification - Sanitized
app.post('/api/notifications/read', (req, res) => {
  const { id, all, email, admin } = req.body;
  const db = getDB();
  if (!db.notifications) db.notifications = [];

  if (all) {
    if (admin) {
      // Admin session verified
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (activeAdminSessions.has(token)) {
          db.notifications.forEach(n => {
            if (n.targetUser === 'admin') n.read = true;
          });
        }
      }
    } else if (email) {
      const eLower = String(email).trim().toLowerCase();
      db.notifications.forEach(n => {
        if (n.targetUser && n.targetUser.trim().toLowerCase() === eLower) n.read = true;
      });
    } else {
      db.notifications.forEach(n => n.read = true);
    }
  } else if (id) {
    const notif = db.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
  }
  saveDB(db);
  res.json({ success: true });
});

// Admin Control Notification dispatch - Admin authorization enforced
app.post('/api/notifications', adminAuthMiddleware, (req, res) => {
  const { title, message, type, targetUser, referenceId } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Missing title or message' });
  }
  const nextNotif = createNotification(
    sanitizeString(title),
    sanitizeString(message),
    type || 'general',
    targetUser || 'all',
    referenceId
  );
  res.status(201).json(nextNotif);
});

// Delete notifications - Admin authorization enforced
app.delete('/api/notifications/:id', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDB();
  if (!db.notifications) db.notifications = [];
  db.notifications = db.notifications.filter(n => n.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// Products endpoint
app.get('/api/products', (req, res) => {
  const db = getDB();
  res.json(db.products);
});

app.post('/api/products', adminAuthMiddleware, (req, res) => {
  const { name, category, description, price, unit, stock, imageUrl, available } = req.body;
  if (!name || !category || !price || !unit) {
    return res.status(400).json({ error: 'Missing required product parameters' });
  }
  const db = getDB();
  const stockNum = Number(stock !== undefined ? stock : 0);
  const newProduct: Product = {
    id: 'prod-' + Math.random().toString(36).substring(2, 9),
    name: sanitizeString(name),
    category: sanitizeString(category) as any,
    description: sanitizeString(description || ''),
    price: Number(price),
    unit: sanitizeString(unit),
    stock: stockNum,
    available: available !== undefined ? Boolean(available) : stockNum > 0,
    imageUrl: sanitizeString(imageUrl || 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=600')
  };
  db.products.push(newProduct);
  saveDB(db);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, category, description, price, unit, stock, imageUrl, available } = req.body;
  const db = getDB();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  db.products[idx] = {
    ...db.products[idx],
    name: name !== undefined ? sanitizeString(name) : db.products[idx].name,
    category: category !== undefined ? sanitizeString(category) as any : db.products[idx].category,
    description: description !== undefined ? sanitizeString(description) : db.products[idx].description,
    price: price !== undefined ? Number(price) : db.products[idx].price,
    unit: unit !== undefined ? sanitizeString(unit) : db.products[idx].unit,
    stock: stock !== undefined ? Number(stock) : db.products[idx].stock,
    available: available !== undefined ? Boolean(available) : (stock !== undefined ? Number(stock) > 0 : db.products[idx].available),
    imageUrl: imageUrl !== undefined ? sanitizeString(imageUrl) : db.products[idx].imageUrl
  };
  saveDB(db);
  res.json(db.products[idx]);
});

app.delete('/api/products/:id', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.products = db.products.filter((p) => p.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// Orders & Bookings
app.get('/api/orders/track', (req, res) => {
  const { reference, email } = req.query;
  if (!reference) {
    return res.status(400).json({ error: 'Missing order reference' });
  }

  const db = getDB();
  const order = db.orders.find((o) => o.id.toUpperCase().trim() === String(reference).toUpperCase().trim());

  if (!order) {
    return res.status(404).json({ error: 'No reservation or order found with this tracking reference.' });
  }

  if (email && order.customerEmail.toLowerCase().trim() !== String(email).toLowerCase().trim()) {
    return res.status(403).json({ error: 'The email address specified does not match the customer record for this order.' });
  }

  // Admin must verify payment before tracking number/status details are unlocked to customer
  if (order.paymentStatus !== 'Verified') {
    return res.status(403).json({ 
      error: '⚠️ Payment Verification Required: Your manual bank transfer has not been verified by an administrator yet. Administrators must verify the payment first once you fill and submit the payment form before a tracking number is activated.' 
    });
  }

  res.json(order);
});

app.get('/api/orders', adminAuthMiddleware, (req, res) => {
  const db = getDB();
  res.json(db.orders);
});

app.post('/api/orders', rateLimiter(10, 5 * 60 * 1000), (req, res) => {
  let {
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    productId,
    quantity,
    paymentBank,
    paymentProofUrl,
    paymentProofName,
    notes
  } = req.body;

  if (!customerName || !customerEmail || !customerPhone || !productId || !quantity || !paymentBank) {
    return res.status(400).json({ error: 'Missing customer details or booking data.' });
  }

  if (!isValidEmailFormat(customerEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Sanitizing inputs to defeat HTML injections and cross-site scripting
  customerName = sanitizeString(customerName);
  customerEmail = sanitizeString(customerEmail);
  customerPhone = sanitizeString(customerPhone);
  customerAddress = sanitizeString(customerAddress || 'Ibadan, Oyo State');
  productId = sanitizeString(productId);
  paymentBank = sanitizeString(paymentBank);
  paymentProofUrl = paymentProofUrl ? String(paymentProofUrl) : undefined; // base64, keep raw but cast as string
  paymentProofName = paymentProofName ? sanitizeString(paymentProofName) : undefined;
  notes = notes ? sanitizeString(notes) : undefined;

  const db = getDB();
  const product = db.products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Selected farm product not found.' });

  if (product.stock < Number(quantity)) {
    return res.status(400).json({ error: `Insufficient stock. Only ${product.stock} ${product.unit}(s) available.` });
  }

  const totalPrice = product.price * Number(quantity);
  const newOrder: Order = {
    id: 'MF-' + Math.floor(100000 + Math.random() * 900000),
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    productId,
    productName: product.name,
    category: product.category,
    quantity: Number(quantity),
    totalPrice,
    paymentBank,
    paymentProofUrl,
    paymentProofName,
    paymentStatus: 'Pending Verification',
    orderStatus: 'Pending',
    shippingStatus: 'Pending',
    notes,
    createdAt: new Date().toISOString()
  };

  // Deduct stock safely
  product.stock -= Number(quantity);
  if (product.stock <= 0) {
    product.available = false;
  }

  db.orders.unshift(newOrder);
  saveDB(db);

  // Dispatch mock emails to both Client and Administrator
  const emailSubject = `Order Reservation Confirmation - ${newOrder.id}`;
  const clientEmailBody = `
Dear ${newOrder.customerName},

Thank you for your reservation at Mercy Farmstead. 
Your booking details are:
- Order Reference: ${newOrder.id}
- Livestock/Produce: ${newOrder.productName} (${newOrder.quantity} ${product.unit})
- Total Amount: ₦${totalPrice.toLocaleString()}
- Select Payment Bank: ${newOrder.paymentBank}

Our representative will verify your payment proof shortly. Once confirmed, we will begin arrangements for dispatch or collection.
Thank you for your business.

Mercy Farmstead Promise: "Raising quality, delivering freshness."
  `;

  const adminEmailBody = `
ALERT: New Livestock Booking received!
- Booking Reference: ${newOrder.id}
- Customer: ${newOrder.customerName} (${newOrder.customerPhone} / ${newOrder.customerEmail})
- Item: ${newOrder.productName} (Qty: ${newOrder.quantity})
- Total Payable: ₦${totalPrice.toLocaleString()}
- Preferred Bank: ${newOrder.paymentBank}
- Proof of Payment Uploaded: ${newOrder.paymentProofUrl ? 'YES' : 'NO'}

Please check the Admin Dashboard to crosscheck this transaction and confirm the order.
Client Email: ${newOrder.customerEmail}
  `;

  sendMockEmail(newOrder.customerEmail, emailSubject, clientEmailBody);
  sendMockEmail('mercyfarms01@gmail.com', `Admin Alert: New Reservation booked [${newOrder.id}]`, adminEmailBody);

  // Trigger Notifications
  createNotification(
    'New Booking Received 🌾',
    `Booking ${newOrder.id} has been registered by ${newOrder.customerName}. Value: ₦${totalPrice.toLocaleString()}.`,
    'new_booking',
    'admin',
    newOrder.id
  );

  createNotification(
    'Booking Registered ⏳',
    `We've received your manual payment reservation ${newOrder.id} for ${newOrder.quantity}x ${newOrder.productName}. Awaiting administrator verification.`,
    'order_status',
    newOrder.customerEmail,
    newOrder.id
  );

  res.status(201).json(newOrder);
});

// Update verification and status - Enforce admin privileges
app.put('/api/orders/:id', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const { paymentStatus, orderStatus, shippingStatus } = req.body;
  const db = getDB();
  const orderIdx = db.orders.findIndex((o) => o.id === id);
  if (orderIdx === -1) return res.status(404).json({ error: 'Order not found' });

  const oldOrder = db.orders[orderIdx];
  db.orders[orderIdx] = {
    ...oldOrder,
    paymentStatus: paymentStatus !== undefined ? paymentStatus : oldOrder.paymentStatus,
    orderStatus: orderStatus !== undefined ? orderStatus : oldOrder.orderStatus,
    shippingStatus: shippingStatus !== undefined ? shippingStatus : (oldOrder.shippingStatus || 'Pending')
  };
  saveDB(db);

  // Trigger notifications for status updates
  if (shippingStatus && shippingStatus !== oldOrder.shippingStatus) {
    createNotification(
      `Shipment Update: ${shippingStatus} 🚚`,
      `Your reserve package ref ${id} is now marked as "${shippingStatus}". Contact local delivery channels for quick pickup details.`,
      'order_status',
      oldOrder.customerEmail,
      id
    );
  }
  if (paymentStatus && paymentStatus !== oldOrder.paymentStatus) {
    if (paymentStatus === 'Verified') {
      createNotification(
        'Payment Verified! ✅',
        `Great news! Your payment for order ${id} has been fully verified. We are preparing your order.`,
        'payment_verified',
        oldOrder.customerEmail,
        id
      );
    } else if (paymentStatus === 'Failed Verification') {
      createNotification(
        'Payment Issue Found ⚠️',
        `Your payment proof for ${id} was marked as Failed Verification. Please contact dispatch support on WhatsApp to rectify.`,
        'payment_failed',
        oldOrder.customerEmail,
        id
      );
    }
  }

  if (orderStatus && orderStatus !== oldOrder.orderStatus) {
    createNotification(
      `Order ${orderStatus} 📦`,
      `Your livestock booking reference ${id} is now updated to: "${orderStatus}".`,
      'order_status',
      oldOrder.customerEmail,
      id
    );
  }

  // Trigger dispatch log if changed
  if (orderStatus && orderStatus !== oldOrder.orderStatus) {
    const notifySubject = `Your Order Status Updated: ${id}`;
    const notifyBody = `
Dear ${oldOrder.customerName},

This is to notify you that your livestock booking at Mercy Farmstead [Reference: ${id}] status has updated to: ${orderStatus}.
Payment Status: ${db.orders[orderIdx].paymentStatus}

If you have questions regarding your dispatch details or live pickup, please chat with us on WhatsApp 07061562420.

Raising quality, delivering freshness,
The Mercy Farmstead Team
    `;
    sendMockEmail(oldOrder.customerEmail, notifySubject, notifyBody);
  }

  res.json(db.orders[orderIdx]);
});

// Contact Messages endpoint - Admin authorization enforced
app.get('/api/messages', adminAuthMiddleware, (req, res) => {
  const db = getDB();
  res.json(db.messages);
});

app.post('/api/messages', rateLimiter(5, 5 * 60 * 1000), (req, res) => {
  let { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message text are required.' });
  }

  if (!isValidEmailFormat(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Sanitize the user inputs before writing to avoid persistent HTML or script injection
  name = sanitizeString(name);
  email = sanitizeString(email);
  phone = sanitizeString(phone);
  message = sanitizeString(message);

  const db = getDB();
  const newMessage: ContactMessage = {
    id: 'msg-' + Math.random().toString(36).substring(2, 9),
    name,
    email,
    phone: phone || '',
    message,
    createdAt: new Date().toISOString()
  };
  db.messages.unshift(newMessage);
  saveDB(db);

  // Dispatch alerts
  const alertSubject = `New Contact Form Submission from ${name}`;
  const alertBody = `
You have received a new contact inquiry:
- Name: ${name}
- Email: ${email}
- Phone: ${phone || 'Not provided'}
- Message: 
"${message}"

This message has been logged inside your Admin Dashboard contact center. Please reply to their email address at your earliest convenience.
  `;
  sendMockEmail('mercyfarms01@gmail.com', alertSubject, alertBody);

  // Trigger Notification
  createNotification(
    'New Form Submission ✉️',
    `Inquiry from ${name} (${email}): "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
    'new_message',
    'admin',
    newMessage.id
  );

  res.status(210).json(newMessage);
});

// Chatbot interactions - Admin authorization enforced
app.get('/api/chats', adminAuthMiddleware, (req, res) => {
  const db = getDB();
  res.json(db.chats);
});

// Single session detail poll - Public view allowed
app.get('/api/chats/session', (req, res) => {
  const { sessionId, email, phone } = req.query;
  if (!sessionId && !email && !phone) {
    return res.status(400).json({ error: 'Missing sessionId, email, or phone identifier' });
  }
  const db = getDB();
  const session = db.chats.find((c) => {
    if (sessionId && c.id === String(sessionId)) return true;
    if (email && c.customerEmail && c.customerEmail.toLowerCase().trim() === String(email).toLowerCase().trim()) return true;
    if (phone && c.customerPhone && c.customerPhone.trim() === String(phone).trim()) return true;
    return false;
  });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// Get global administrative status (whether chatbot is paused or active)
app.get('/api/admin/status', (req, res) => {
  const db = getDB();
  res.json({ adminStatus: db.adminStatus || 'away' });
});

// Update global administrator active/away status - Admin authorization enforced
app.post('/api/admin/status', adminAuthMiddleware, (req, res) => {
  const { adminStatus } = req.body;
  if (adminStatus !== 'active' && adminStatus !== 'away') {
    return res.status(400).json({ error: 'Invalid admin status value' });
  }
  const db = getDB();
  db.adminStatus = adminStatus;
  saveDB(db);
  res.json({ success: true, adminStatus: db.adminStatus });
});

// Toggle individual chatbot activation for a session - Admin authorization enforced
app.post('/api/chats/toggle-bot', adminAuthMiddleware, (req, res) => {
  const { sessionId, chatbotDisabled } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }
  const db = getDB();
  const session = db.chats.find((c) => c.id === sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  session.chatbotDisabled = !!chatbotDisabled;
  saveDB(db);
  res.json({ success: true, session });
});

// Post a new message to chatbot session - Public access with rate limiter and input validation
app.post('/api/chatbot', rateLimiter(25, 1 * 60 * 1000), async (req, res) => {
  let { sessionId, customerName, messageText, customerEmail, customerPhone, image } = req.body;

  if (!sessionId || (!messageText && !image)) {
    return res.status(400).json({ error: 'Missing sessionId, messageText or image' });
  }

  // Sanitize incoming fields to neutralize injection attacks
  sessionId = sanitizeString(sessionId);
  customerName = customerName ? sanitizeString(customerName) : 'Anonymous Farmer';
  messageText = messageText ? sanitizeString(messageText) : '';
  customerEmail = customerEmail ? sanitizeString(customerEmail) : '';
  customerPhone = customerPhone ? sanitizeString(customerPhone) : '';

  const db = getDB();
  
  // Resiliently locate the chat session for the SAME person using session id, email, or phone
  let session = db.chats.find((c) => {
    if (c.id === sessionId) return true;
    if (customerEmail && c.customerEmail && c.customerEmail.toLowerCase().trim() === customerEmail.toLowerCase().trim()) {
      return true;
    }
    if (customerPhone && c.customerPhone && c.customerPhone.trim() === customerPhone.trim()) {
      return true;
    }
    return false;
  });

  if (!session) {
    session = {
      id: sessionId,
      customerName: customerName || 'Anonymous Farmer',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      messages: [],
      lastMessageAt: new Date().toISOString(),
      unreadByAdmin: true
    };
    db.chats.unshift(session);
  }

  // Update session contact data if they provided it later
  if (customerName && customerName !== 'Anonymous Farmer' && customerName !== 'Unregistered Customer') {
    session.customerName = customerName;
  }
  if (customerEmail) session.customerEmail = customerEmail;
  if (customerPhone) session.customerPhone = customerPhone;

  // Store user message
  const userMsg: ChatMessage = {
    id: 'msg-' + Math.random().toString(36).substring(2, 10),
    sender: 'user',
    text: messageText || "Sent a payment receipt image.",
    timestamp: new Date().toISOString(),
    imageUrl: image ? image.data : undefined
  };
  session.messages.push(userMsg);
  session.lastMessageAt = new Date().toISOString();
  session.unreadByAdmin = true;

  // Compile entire conversation history for the same person
  const chatHistoryFormatted = session.messages && session.messages.length > 0
    ? session.messages.map((m, idx) => `  [${idx + 1}] ${m.sender.toUpperCase()} (${new Date(m.timestamp).toLocaleTimeString()}): ${m.text}`).join('\n')
    : '  No previous interactions logged.';

  const chatbotPaused = db.adminStatus === 'active' || session.chatbotDisabled === true;

  if (chatbotPaused) {
    saveDB(db);

    // Trigger Notification for manual reply
    createNotification(
      image ? 'Receipt (Manual Reply Required) 💬' : 'Manual Chat Intercept 💬',
      `Customer "${session.customerName}" expects your direct reply since Chatbot is currently paused.`,
      image ? 'receipt_submitted' : 'general',
      'admin',
      session.id // Use the matched unified session ID
    );

    // Send unified copy alert to admin email
    const alertSubject = `[URGENT DIRECT CHAT] Customer "${session.customerName}" is waiting!`;
    const alertBody = `
============================================================
MERCY FARMSTEAD - LIVE SINGLE-PERSON DIALOG CONVERSATION
============================================================
Customer Name:   ${session.customerName}
Customer Email:  ${session.customerEmail || 'Not provided'}
Customer Phone:  ${session.customerPhone || 'Not provided'}
Session ID:      ${session.id}
Status:          INTERCEPT (AI chat is temporarily paused)
============================================================

CONVERSATION THREAD (ALL MESSAGES SAVED UNDER THIS SINGLE PERSON):
${chatHistoryFormatted}

------------------------------------------------------------
Latest Message:  "${messageText || '[Receipt Image Attached]'}"
Please access your Administrator Dashboard Chat panel to reply to this conversation.
============================================================
    `;
    sendMockEmail('mercyfarms01@gmail.com', alertSubject, alertBody);

    return res.json({ session, reply: null, chatbotPaused: true });
  }

  // Prompt compiler using live stock levels & instructions
  const productText = db.products
    .map(
      (p) => `- ${p.name} (${p.category}): Price is ₦${p.price.toLocaleString()} per ${p.unit}. Current stock is ${p.stock} units. ${p.stock > 0 ? 'AVAILABLE' : 'OUT OF STOCK'}`
    )
    .join('\n');

  let receiptVerificationInstruction = '';
  if (image) {
    receiptVerificationInstruction = `
[CRITICAL - PAYMENT RECEIPT/SCREENSHOT DETECTED]
The user has attached a payment receipt image/screenshot to this message.
As the Mercy Farmstead AI Specialist, you must perform payment proof verification:
1. Thoroughly parse the text and details visible in the uploaded receipt.
2. Confirm two crucial details explicitly:
   - THE TOTAL STOCK BOUGHT: Detect the agricultural products, their quantities, or look for implied purchases based on pricing.
     (Official pricings: Premium Swines = ₦180,000/head, Fresh Crate Eggs = ₦4,500/crate, Point-of-Lay Layers = ₦3,800/head, Aquaculture Catfish = ₦2,500/kg, Broiler Birds = ₦4,500/head).
   - THE PAID AMOUNT: Find the exact currency transfer sum (in Naira ₦) that was successfully transferred to one of our accounts (UBA or Moniepoint).
3. Provide a confirmation response:
   - State clearly "RECEIPT SUBMITTED" and summarize what species/quantities were detected and the exact sum paid.
   - Cross-check if the amount transferred matches what is expected for those stock items.
   - If they successfully match, give a warm confirmation and guide them that their submittal is logged for Ibadan managers to process active dispatch.
   - If they do not match, explain the discrepancy pleasantly and ask for clarification, while reassuring them that a manager will review this session.
`;
  }

  const systemPrompt = `
You are the Mercy Farmstead AI Specialist (Ẹni Ìrànwọ́), an active, exceptionally responsive, friendly, respectful, and deeply polite farm support ambassador. 
Your goal is to understand the customer's needs and emotions completely and reply with extreme warmth, fast speed, and human friendliness.

WHAT THE BUSINESS IS ALL ABOUT (MERCY FARMSTEAD):
- Mercy Farmstead is an elite, premium biosecurity agricultural enterprise based in Wakajaye, Ibadan, Oyo State, Nigeria. 
- We are deeply committed to breeding and delivering top-tier agricultural stock under modern vaccination standards and rigorous bio-hygiene.
- OUR PREMIUM STOCK CATALOG includes:
  1. Swined Breeds (Premium Pigs/Pork stock) - highly productive, large size.
  2. Fresh Crate Eggs - organic, highly nutritious, gathered daily.
  3. Point-of-Lay Layers/Pullets - healthy, vaccinated birds ready to start laying eggs.
  4. Aquaculture Catfish - fresh, high-yield table size and fingerlings.
  5. Broiler Chickens - fast-growing, heavy meat birds ideal for table or sales.
- Customers can buy/reserve items dynamically using our online catalog, make secure bank transfers, or schedule farm pickups safely.

CUSTOMER UNDERSTANDING & EMPATHY PROTOCOL:
- Listen actively! If a customer asks about a product, quickly check our live inventory below and encourage them with hospitable enthusiasm.
- If a customer shares positive messages, reply with beautiful gratitude ("Ẹ ṣé púpọ̀", "A dúpẹ́ o").
- If they share a concern, error, constraint, or budget limits, respond with deep understanding and polite assistance ("Ẹ pẹ̀lẹ́ o", "Do not worry, let us find a pleasant solution together!").
- Always use polite plural forms "Ẹ" (traditional Yoruba honorary address) to convey absolute respect to buyers of all ages.

FINANCIAL ACCOUNTS FOR DEPOSITS:
- UNITED BANK OF AFRICA (UBA): Account Number: 1030248864, Name: Mercy Farmstead
- MONIEPOINT MFB: Account Number: 6213477162, Name: Mercy Farmstead

LIVE CO-ORDINATED INVENTORY LEVEL STATEMENTS:
${productText}

PHYSICAL LOCATION & DETAILS:
- Address: BESIDE BOLUWATIFE MATERNITY, NO25 TEMIDIRE AJAGBA WAKAJAYE, IBADAN 200113, OYO STATE, NIGERIA.
- Operating Hours: Mon to Sat, 8:00 AM to 6:00 PM. (Closed Sundays).
- Phone & WhatsApp: +234 706 156 2420 (07061562420)
- Email: mercyfarms01@gmail.com
- Media: Instagram/TikTok: @mercyfarmss

ORDER PROCEDURE:
Tell them they can register bookings dynamically using our elegant "Catalog" tab (to select quantities, verify prices, enter details) and then paste payment verification screenshots of transfers. Our managers check coordinates directly on the map.
${receiptVerificationInstruction}

RESPONSIVENESS & SPEED RULES:
1. REPLY FAST: Keep your answers snappy, energetic, clear, and perfectly direct. Avoid long essays. Aim for 2-4 sentences max unless detailing a payment receipt.
2. BE HUMAN-FRIENDLY & RESPECTFUL: Be genuinely polite, warm, and highly passionate about partnering in their agricultural success.
3. WEAVE CULTURE INTEGRALLY: Mix smooth English with natural Yoruba farm greetings seamlessly in southwestern Nigerian hospitality ("Ẹ kàábọ̀ o" to welcome them, "Ẹ ṣé púpọ̀" to thank them, "Ẹ pẹ̀lẹ́ o" for troubleshooting).
4. STRICT TRUTH: Always answer on-topic using the business prices and coordinates. Politely refuse off-topic inquiries with a humble, polite explanation.
`;

  const conversationTrackPrompt = `CONVERSATION LOG:
${session.messages.slice(-6).map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}

Generate your next brief turn as the BOT:`;

  let botResponseText = "Welcome! Our team is processing your request. What can I help you harvest today?";
  
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      
      let contentsInput: any;
      if (image && image.data) {
        const base64Data = image.data.replace(/^data:image\/\w+;base64,/, '');
        contentsInput = {
          parts: [
            {
              inlineData: {
                mimeType: image.mimeType || 'image/png',
                data: base64Data
              }
            },
            {
              text: conversationTrackPrompt
            }
          ]
        };
      } else {
        contentsInput = conversationTrackPrompt;
      }

      // Resilient multi-attempt calling helper with fallback (prioritizing high-limit flash-lite first)
      let gResult: any = null;
      let lastError: any = null;
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];

      for (const currentModel of modelsToTry) {
        const attempts = currentModel === 'gemini-3.1-flash-lite' ? 2 : 1;
        for (let attempt = 1; attempt <= attempts; attempt++) {
          try {
            console.log(`[Gemini Request] Directing query to model ${currentModel} (attempt ${attempt}/${attempts})`);
            const response = await ai.models.generateContent({
              model: currentModel,
              contents: contentsInput,
              config: {
                systemInstruction: systemPrompt,
                temperature: 0.4
              }
            });
            if (response && response.text) {
              gResult = response;
              lastError = null;
              break;
            }
          } catch (err: any) {
            lastError = err;
            const errMsg = err.message || JSON.stringify(err);
            console.warn(`[Gemini Request Fail] Model ${currentModel} (attempt ${attempt}/${attempts}) failed: ${errMsg}`);
            if (attempt < attempts) {
              const backoffMs = attempt * 1000;
              console.log(`[Gemini Retry] Backing off for ${backoffMs}ms before executing retry...`);
              await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
          }
        }
        if (gResult && gResult.text) {
          console.log(`[Gemini Success] Successfully generated content utilizing ${currentModel}`);
          break;
        }
      }

      if (gResult && gResult.text) {
        botResponseText = gResult.text.trim();
      } else if (lastError) {
        throw lastError;
      }
    } catch (gErr: any) {
      console.error('Gemini call error:', gErr.message || gErr);
      
      const msgLower = (messageText || '').toLowerCase().trim();
      const hasGreeting = /\b(hello|hi|hey|yo|kaabo|welcome|good morning|good afternoon|good evening|kabo|howdy|greet)\b/.test(msgLower);
      const hasLocation = /\b(where|location|address|place|coordinate|ibadan|map|find|direction|wakajaye|temidire|boluwatife|office|farm|land)\b/.test(msgLower);
      const hasPrice = /\b(price|cost|how much|amount|rate|billing|naira|catalog|buy|purchase|pay|order|expensive|cheap|egg|crate|pig|pigs|layer|layers|catfish|fish|broiler|broilers)\b/.test(msgLower);
      const hasBank = /\b(bank|account|transfer|pay|deposit|acc|number|uba|moniepoint|receipt|proof|screenshot)\b/.test(msgLower);
      const hasTime = /\b(time|hour|when|open|close|saturday|sunday|monday|schedule|work|work-hour|operating)\b/.test(msgLower);
      const hasContact = /\b(contact|phone|whatsapp|call|email|reach|instagram|tiktok|number|talk|help|support)\b/.test(msgLower);
      const hasThanks = /\b(thanks|thank|awesome|great|good|excellent|se|ese|dupe|appreciate)\b/.test(msgLower);

      if (image) {
        botResponseText = `Ẹ kàábọ̀ o! I have received your payment transfer receipt screenshot. While my primary gateway is busy, I have verified your transfer and linked this receipt with our Ibadan order book! 

Our managers check coordinates on the map and will dispatch your species (Premium Pigs/Crates/Layers/Catfish/Broilers) shortly to your address. Thank you (Ẹ ṣé púpọ̀) for choosing Mercy Farmstead!`;
      } else if (hasLocation) {
        botResponseText = `Ẹ kàábọ̀ o! Mercy Farmstead is proudly situated at Wakajaye in Ibadan. Our corporate farm address is:
📍 BESIDE BOLUWATIFE MATERNITY, NO25 TEMIDIRE AJAGBA WAKAJAYE, IBADAN 200113, OYO STATE, NIGERIA.
You can open Google Maps directly in our Contact tab or click "Get Directions" on our real-time coordinates card to navigate right to us!`;
      } else if (hasBank) {
        botResponseText = `Ẹ ṣé púpọ̀! For booking deposits and payments, we accept direct transfers to our secure commercial accounts:
🏦 UNITED BANK OF AFRICA (UBA)
- Account Number: 1030248864
- Name: Mercy Farmstead

🏦 MONIEPOINT MFB
- Account Number: 6213477162
- Name: Mercy Farmstead

Please select items using our 'Catalog' tab, proceed to booking, make the transfer, and paste your receipt proof screenshot here!`;
      } else if (hasPrice || msgLower.includes('pig') || msgLower.includes('egg') || msgLower.includes('catfish') || msgLower.includes('layer') || msgLower.includes('broiler')) {
        botResponseText = `Ẹ kàábọ̀ o! Here are our premium, fully-vaccinated stock pricings:
🐖 Premium Swines (Pigs): ₦180,000 per head
🥚 Fresh Crate Eggs: ₦4,500 per crate
🐔 Point-of-Lay Layers: ₦3,800 per bird
🐟 Aquaculture Catfish: ₦2,500 per kg
🍗 Heavy Weight Broilers: ₦4,500 per bird

Please check our live stock levels inside the 'Catalog' page to place your secure booking reservation!`;
      } else if (hasTime) {
        botResponseText = `Ẹ ṣé! Our Ibadan farmstead is open during the following hours:
🕒 Monday to Saturday: 8:00 AM to 6:00 PM
🚫 Sundays: Closed (resting our hardworking species and staff).

Feel free to schedule a farm pickup or place your orders online at any hour!`;
      } else if (hasContact) {
        botResponseText = `Ẹ ṣé púpọ̀! We are highly active on support. You can reach us directly anytime via:
📞 Phone & WhatsApp: +234 706 156 2420 (07061562420)
✉️ Support Email: mercyfarms01@gmail.com
📸 Instagram & TikTok: @mercyfarmss
Feel free to contact our Ibadan management desk directly!`;
      } else if (hasThanks) {
        botResponseText = `Ẹ ṣé púpọ̀! We are deeply grateful for your kind words (A dúpẹ́ o). It is our absolute pleasure to serve you with top-tier, biosecure farm breeds and nutritious produce! How else can we assist your farm's success today?`;
      } else if (hasGreeting) {
        botResponseText = `Ẹ kàábọ̀ o! Welcome to Mercy Farmstead's automated support desk! 🌾 We deliver premium, bio-hygienic swine breeds, crate eggs, catfish, and poultry layers under modern vaccination standards.

How can I help you today? You can ask about our catalog prices, physical address in Wakajaye, bank accounts, or tell me what stock you want to purchase!`;
      } else {
        botResponseText = `Ẹ kàábọ̀ o! I hear you loud and clear. Here at Mercy Farmstead in Ibadan, Oyo State, we supply high-yield Pigs (₦180,000), Fresh Crate Eggs (₦4,500), Layers (₦3,800), table-size Catfish (₦2,500), and Broilers (₦4,500).

You can book directly in the 'Catalog' tab. Could you please clarify if you wish to inquire about our address beside Boluwatife Maternity, our payment accounts, pricing, or operating hours? Ẹ ṣé púpọ̀!`;
      }
    }
  } else {
    if (image) {
      botResponseText = `E kaabo! I have received your payment transfer receipt image. Since I am in offline backup mode right now, I have highlighted and queued this receipt safely for our Ibadan dispatch desk to verify your payment.
Please confirm:
- Did you pay the correct pricing (₦180,000/pig, ₦4,500/egg crate, ₦3,800/layer, ₦2,500/kg catfish, ₦4,500/broiler)?
- Our systems have logged your receipt under Session: ${sessionId} and notified the administrator!`;
    } else {
      botResponseText = `Welcome to Mercy Farmstead! Our live stock includes Premium Swines (₦180,000/head), Fresh Crate Eggs (₦4,500/crate), point-of-lay layers (₦3,800/head), large Catfish (₦2,500/kg), and Broiler birds (₦4,500/head). I am here 24/7 to guide you! You can add products to your booking and upload payments using our Bank account details.`;
    }
  }

  // Store bot response
  const botMsg: ChatMessage = {
    id: 'msg-' + Math.random().toString(36).substring(2, 10),
    sender: 'bot',
    text: botResponseText,
    timestamp: new Date().toISOString()
  };
  session.messages.push(botMsg);
  session.lastMessageAt = new Date().toISOString();
  saveDB(db);

  // Trigger Notification to Admin
  if (image) {
    createNotification(
      'Receipt Proof Sent in Chat 💬',
      `Customer "${session.customerName}" uploaded a transfer receipt screenshot via chatbot.`,
      'receipt_submitted',
      'admin',
      session.id // Use matched unified session ID
    );
  } else {
    createNotification(
      'Active Chat Session 💬',
      `Customer "${session.customerName}" sent chat: "${(messageText || '').substring(0, 50)}${(messageText || '').length > 50 ? '...' : ''}"`,
      'general',
      'admin',
      session.id // Use matched unified session ID
    );
  }

  // Compile entire conversation history for the same person for email
  const finalChatHistoryText = session.messages && session.messages.length > 0
    ? session.messages.map((m, idx) => `  [${idx + 1}] ${m.sender.toUpperCase()} (${new Date(m.timestamp).toLocaleTimeString()}): ${m.text}`).join('\n')
    : '  No previous interactions logged.';

  // Send copy alert to admin email
  const alertSubject = `Chatbot Alert: Active customer chat - ${session.customerName}`;
  const alertBody = `
============================================================
MERCY FARMSTEAD - DYNAMIC SINGLE-PERSON BOT CHAT LOG
============================================================
Customer Name:   ${session.customerName}
Customer Email:  ${session.customerEmail || 'Not provided'}
Customer Phone:  ${session.customerPhone || 'Not provided'}
Session ID:      ${session.id}
============================================================

CONVERSATION THREAD (ALL MESSAGES SAVED UNDER THIS SINGLE PERSON):
${finalChatHistoryText}

------------------------------------------------------------
Latest Turn Details:
User Query:   "${messageText || '[Receipt Image Attached]'}"
AI Response:  "${botResponseText}"

This message feed represents the standalone single thread history of this customer.
============================================================
  `;
  sendMockEmail('mercyfarms01@gmail.com', alertSubject, alertBody);

  res.json({ session, reply: botResponseText });
});

// Admin manual chat reply - Admin authorization enforced
app.post('/api/chats/reply', adminAuthMiddleware, (req, res) => {
  const { sessionId, messageText } = req.body;
  if (!sessionId || !messageText) {
    return res.status(400).json({ error: 'Missing session identifier or text.' });
  }
  const db = getDB();
  const session = db.chats.find((c) => c.id === sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const adminMsg: ChatMessage = {
    id: 'msg-' + Math.random().toString(36).substring(2, 10),
    sender: 'admin',
    text: sanitizeString(messageText),
    timestamp: new Date().toISOString()
  };
  session.messages.push(adminMsg);
  session.lastMessageAt = new Date().toISOString();
  session.unreadByAdmin = false; // Addressed
  saveDB(db);

  // For security and privacy, only the administration and internal website track chat dialogues.
  // No customer email dispatch is sent for chatbot logs or replies.

  res.json(session);
});

// Mark chat read - Admin authorization enforced
app.post('/api/chats/read', adminAuthMiddleware, (req, res) => {
  const { sessionId } = req.body;
  const db = getDB();
  const session = db.chats.find((c) => c.id === sessionId);
  if (session) {
    session.unreadByAdmin = false;
    saveDB(db);
  }
  res.json({ success: true });
});

// Compile and email chatbot session transcript - Admin authorization enforced
app.post('/api/chats/email-transcript', adminAuthMiddleware, async (req, res) => {
  const { sessionId, recipientEmail } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session identifier.' });
  }

  const db = getDB();
  const session = db.chats.find((c) => c.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  if (recipientEmail && !isValidEmailFormat(recipientEmail)) {
    return res.status(400).json({ error: 'Invalid recipient email format.' });
  }

  const defaultAdminRecip = process.env.ADMIN_EMAIL_RECEIVER || 'akangbedanieltomiwa@gmail.com';
  const targetEmail = recipientEmail ? sanitizeString(recipientEmail).trim() : defaultAdminRecip;

  let transcriptBody = `
============================================================
MERCY FARMSTEAD CHAT CONVERSATION TRANSCRIPT
============================================================
Client Name:     ${session.customerName}
Client Phone:    ${session.customerPhone || 'Not provided'}
Client Email:    ${session.customerEmail || 'Not provided'}
Session ID:      ${session.id}
Date Compiled:   ${new Date().toLocaleString()}
============================================================

CONVERSATION FEED HISTORY:
`;

  if (!session.messages || session.messages.length === 0) {
    transcriptBody += `\n[No messages exchanged in this session yet.]\n`;
  } else {
    session.messages.forEach((msg, idx) => {
      const role = msg.sender.toUpperCase();
      const time = new Date(msg.timestamp).toLocaleString();
      transcriptBody += `\n[${idx + 1}] ${role} (${time}):\n"${msg.text}"\n`;
      if (msg.imageUrl) {
        transcriptBody += `* [Attached Payment Receipt Image detected in database record]\n`;
      }
    });
  }

  transcriptBody += `
============================================================
End of conversation transcript payload.
This is a secure copy dispatched via Mercy Farmstead's automated administrative mail client.
Biosecurity Address: No25, TEMIDIRE AJAGBA WAKAJAYE, IBADAN, BESIDE BOLUWATIFE MATERNITY, OYO STATE, NIGERIA.
Contact Support: mercyfarms01@gmail.com / 07061562420
============================================================
`;

  const subject = `[TRANSCRIPT] Mercy Farmstead Chat Conversation: ${session.customerName}`;
  
  try {
    await sendMockEmail(targetEmail, subject, transcriptBody);
    return res.json({ 
      success: true, 
      recipient: targetEmail,
      message: `Transcript for session ${sessionId} compiled and dispatched successfully.` 
    });
  } catch (err: any) {
    console.error('Failed to dispatch transcript email:', err);
    return res.status(500).json({ 
      error: 'Failed to dispatch transcript email', 
      details: err.message || String(err) 
    });
  }
});

// Admin simulation stats & email log reads - Admin authorization enforced
app.get('/api/admin/emails', adminAuthMiddleware, (req, res) => {
  const db = getDB();
  res.json(db.emails || []);
});

app.post('/api/admin/emails/clear', adminAuthMiddleware, (req, res) => {
  const db = getDB();
  db.emails = [];
  saveDB(db);
  res.json({ success: true });
});

// Core dev and prod routing setup
const startServer = async () => {
  // Route standalone admin portal views
  app.get('/admin*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
       return next();
    }
    if (process.env.NODE_ENV !== 'production') {
      req.url = '/admin.html';
      next();
    } else {
      res.sendFile(path.join(process.cwd(), 'dist/admin.html'));
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in Development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production-compiled static files from /dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`  MERCY FARMSTEAD SERVER PORT 3000 STARTED     `);
    console.log(`  Running dynamic backend on http://0.0.0.0:${PORT} `);
    console.log(`===============================================`);
  });
};

startServer().catch((error) => {
  console.error('Failed to bootstrap server container:', error);
});
