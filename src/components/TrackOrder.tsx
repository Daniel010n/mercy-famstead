import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, ShieldCheck, Clock, CheckCircle, Truck, Package, 
  AlertTriangle, Calendar, User, Mail, Phone, MapPin, 
  HelpCircle, FileText, ChevronRight, MessageSquare, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Order } from '../types';

interface TrackOrderProps {
  onOpenChatWithAdmin?: () => void;
}

export default function TrackOrder({ onOpenChatWithAdmin }: TrackOrderProps) {
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  const generatePDFReceipt = () => {
    if (!trackedOrder) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Elegant styling palette
    const margin = 20;
    let y = 18;

    // Background header card block in beautiful deep farmstead forest green
    doc.setFillColor(5, 46, 22);
    doc.rect(0, 0, 210, 48, 'F');

    // Title text
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('MERCY FARMSTEAD', margin, y + 5);

    // Dynamic brand statement
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(190, 242, 201); // Safe light sage green
    doc.text('Corporate Farmland & Premium Livestock Hub • Oyo / Ibadan Farmland Units', margin, y + 11);

    // Invoice/Receipt Token (Right aligned)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(251, 191, 36); // Amber Gold
    doc.text(`TRACK REFID: ${trackedOrder.id}`, 190, y + 5, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Issued: ${new Date(trackedOrder.createdAt).toLocaleDateString()} @ ${new Date(trackedOrder.createdAt).toLocaleTimeString()}`, 190, y + 11, { align: 'right' });

    y = 58;

    // Side-by-side columns: Client Details & Merchant Details
    // Column 1: Client Specifics
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text('CLIENT DELIVERY RECIPIENT', margin, y);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    y += 5;
    doc.text(`Name:       ${trackedOrder.customerName}`, margin, y);
    y += 5.5;
    doc.text(`Contact:   ${trackedOrder.customerPhone}`, margin, y);
    y += 5.5;
    doc.text(`Email:       ${trackedOrder.customerEmail}`, margin, y);
    y += 5.5;
    doc.text(`Destination:`, margin, y);
    y += 4.5;
    
    // Auto wrap address split for clean formatting
    const wrapAddress = doc.splitTextToSize(trackedOrder.customerAddress || 'Direct Pickup Outpost', 75);
    doc.text(wrapAddress, margin + 4, y);

    const leftColYEnd = y + (wrapAddress.length * 4.5);

    // Column 2: Farmstead particulars
    y = 58;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text('LEDGER & AUDIT METADATA', 115, y);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    y += 5;
    doc.text('Division:    Operations Center Hub', 115, y);
    y += 5.5;
    doc.text(`Bank Wire:   ${trackedOrder.paymentBank}`, 115, y);
    y += 5.5;
    doc.text(`Verification: Manual Audit Routing`, 115, y);
    y += 5.5;
    doc.text('Outpost:     Ibadan Swine & Poultry Breeding', 115, y);

    const rightColYEnd = y;
    y = Math.max(leftColYEnd, rightColYEnd) + 12;

    // Separation line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.line(margin, y, 190, y);
    y += 10;

    // Order current status tracking
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text('AUDIT PROGRESSION LOGS', margin, y);
    y += 6;

    const payStatus = trackedOrder.paymentStatus || 'Pending Verification';
    const deliveryStatus = trackedOrder.shippingStatus || 'Pending Outbound';
    const overallStatus = trackedOrder.orderStatus || 'Registered';

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text('Current Reservation Status:', margin, y);
    
    doc.setFont('Helvetica', 'bold');
    if (payStatus === 'Verified') {
      doc.setTextColor(16, 124, 65); // Emerald Green
    } else if (payStatus === 'Failed Verification' || overallStatus === 'Cancelled') {
      doc.setTextColor(185, 28, 28); // Rose Red
    } else {
      doc.setTextColor(217, 119, 6); // Amber Gold
    }
    doc.text(`${overallStatus.toUpperCase()} (Bank ledger: ${payStatus} / Freight: ${deliveryStatus})`, margin + 46, y);

    y += 11;

    // Catalog item tabular grid
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, 170, 8, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(margin, y, 170, 8, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text('AGRICULTURAL PRODUCES DETAILS', margin + 3.5, y + 5.5);
    doc.text('UNIT PRICE', 115, y + 5.5);
    doc.text('QTY PACKETS', 145, y + 5.5);
    doc.text('TOTAL VALUE', 186, y + 5.5, { align: 'right' });

    y += 8;

    // Render the item row
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(31, 41, 55);
    doc.rect(margin, y, 170, 12, 'S');
    doc.text(`[${trackedOrder.category || 'Livestock'}] ${trackedOrder.productName}`, margin + 3.5, y + 7.5);
    
    // Math calculating unit value
    const unitPrice = Math.round(trackedOrder.totalPrice / (trackedOrder.quantity || 1));
    doc.text(`₦${unitPrice.toLocaleString()}`, 115, y + 7.5);
    doc.text(String(trackedOrder.quantity || 1), 145, y + 7.5);
    doc.text(`₦${trackedOrder.totalPrice.toLocaleString()}`, 186, y + 7.5, { align: 'right' });

    y += 12;

    // pricing totals summary layout
    doc.setFillColor(249, 250, 251);
    doc.rect(110, y + 5, 80, 24, 'F');
    doc.rect(110, y + 5, 80, 24, 'S');

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text('Farming Subtotal:', 115, y + 11);
    doc.text(`₦${trackedOrder.totalPrice.toLocaleString()}`, 185, y + 11, { align: 'right' });
    
    doc.text('Logistics & Delivery:', 115, y + 17);
    doc.text('FREE DIRECT', 185, y + 17, { align: 'right' });

    // Highlighted Grand total
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(5, 46, 22); // Deep emerald forest
    doc.text('Grand Verified Sum:', 115, y + 23);
    doc.text(`₦${trackedOrder.totalPrice.toLocaleString()}`, 185, y + 23, { align: 'right' });

    y += 38;

    // Security check stamp
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text('AUTHENTICITY & SYSTEM CLEARANCE', margin, y);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    y += 4.5;
    doc.text('Verified through secure administrative ledger channels.', margin, y);
    y += 3.5;
    doc.text(`Audit transaction identifier token: ${trackedOrder.id.toUpperCase()}`, margin, y);

    // Official Stamp box decoration
    doc.setDrawColor(5, 46, 22);
    doc.setLineWidth(0.4);
    doc.rect(130, y - 8, 50, 18);
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 46, 22);
    doc.text('MERCY FARMSTEAD', 155, y - 3, { align: 'center' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(16, 124, 65);
    doc.text('OFFICIALLY CERTIFIED', 155, y + 1.5, { align: 'center' });
    doc.text('SECURE DISPATCH LEDGER', 155, y + 5.5, { align: 'center' });

    // Footer page margin alignment
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text('Mercy Farmstead Reserved Agriculture produces receipt document. Official corporate seal applied.', 105, 282, { align: 'center' });

    doc.save(`Receipt_Mercy_Farmstead_${trackedOrder.id}.pdf`);
  };

  // Auto-parse reference and email from URL hash query if formatted like #track?ref=MF-123456
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash.includes('?')) {
        const queryStr = hash.split('?')[1];
        const params = new URLSearchParams(queryStr);
        const refParam = params.get('ref') || params.get('reference');
        const emailParam = params.get('email');
        
        if (refParam) {
          setReference(refParam.toUpperCase());
          if (emailParam) {
            setEmail(emailParam);
          }
          fetchTrackedOrder(refParam, emailParam || '');
        }
      } else {
        // Fallback to localStorage cache
        const lastRef = localStorage.getItem('mercy_last_tracked_ref') || '';
        const lastEmail = localStorage.getItem('mercy_last_tracked_email') || '';
        if (lastRef && !trackedOrder) {
          setReference(lastRef);
          setEmail(lastEmail);
          fetchTrackedOrder(lastRef, lastEmail);
        }
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, []);

  const fetchTrackedOrder = async (refVal: string, emailVal: string) => {
    if (!refVal) return;
    setIsLoading(true);
    setError(null);
    setTrackedOrder(null);

    try {
      let url = `/api/orders/track?reference=${encodeURIComponent(refVal.trim())}`;
      if (emailVal.trim()) {
        url += `&email=${encodeURIComponent(emailVal.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to locate order.');
      }

      const orderData: Order = await res.json();
      setTrackedOrder(orderData);
      
      // Save to localStorage cache
      localStorage.setItem('mercy_last_tracked_ref', refVal.toUpperCase().trim());
      localStorage.setItem('mercy_last_tracked_email', emailVal.trim());
    } catch (err: any) {
      setError(err.message || 'System failed to fetch tracking statuses. Double check your token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      setError('Please provide a valid reservation reference token.');
      return;
    }
    fetchTrackedOrder(reference, email);
  };

  const handleClear = () => {
    setTrackedOrder(null);
    setReference('');
    setEmail('');
    setError(null);
    localStorage.removeItem('mercy_last_tracked_ref');
    localStorage.removeItem('mercy_last_tracked_email');
  };

  // Helper code to map status steps to numeric indexes
  // Step 1: Registered / Pending Verification
  // Step 2: Payment Verified
  // Step 3: Order Confirmed (Arrangements begun)
  // Step 4: Dispatched / Shipped
  // Step 5: Delivered / Completed
  const getProgressStep = (order: Order): number => {
    if (order.orderStatus === 'Cancelled' || order.paymentStatus === 'Failed Verification') {
      return -1; // Special error/cancelled state
    }

    let progress = 1;

    if (order.paymentStatus === 'Verified') {
      progress = 2;
    }
    
    if (order.orderStatus === 'Confirmed' || order.orderStatus === 'Shipped') {
      progress = 3;
    }

    if (order.shippingStatus === 'Dispatched' || order.orderStatus === 'Shipped') {
      progress = 4;
    }

    if (order.shippingStatus === 'Delivered') {
      progress = 5;
    }

    return progress;
  };

  const stepIndex = trackedOrder ? getProgressStep(trackedOrder) : 1;

  const stepsList = [
    { 
      label: 'Booking Registered', 
      desc: 'Pending verification check',
      icon: Clock,
      theme: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
    },
    { 
      label: 'Payment Verified', 
      desc: 'Wire audit completed',
      icon: ShieldCheck,
      theme: 'text-emerald-700 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
    },
    { 
      label: 'Order Confirmed', 
      desc: 'Preparation in progress',
      icon: Package,
      theme: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
    },
    { 
      label: 'Dispatched', 
      desc: 'Outbound on way to Oyo/Ibadan',
      icon: Truck,
      theme: 'text-purple-600 dark:text-purple-400',
      bgClass: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900'
    },
    { 
      label: 'Delivered', 
      desc: 'Fulfilled & closed out',
      icon: CheckCircle,
      theme: 'text-stone-700 text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-neutral-50 dark:bg-stone-900/60 border-neutral-200 dark:border-stone-800'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 shrink-0 min-h-[70vh]">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-stone-100 font-sans uppercase">
          Track Your Reservation 🌾
        </h1>
        <p className="text-xs text-neutral-500 dark:text-stone-400 mt-2 max-w-lg mx-auto">
          Input your reference token to dynamically monitor your manual bank transfer audit, live dispatch details, and livestock readiness values.
        </p>
      </div>

      {/* SEARCH CARD FORM */}
      <div className="bg-white dark:bg-stone-900 border border-neutral-100 dark:border-stone-850 rounded-2xl shadow-sm p-5 sm:p-6 mb-8">
        <form onSubmit={handleSearchSubmit} className="space-y-4 sm:space-y-0 sm:flex sm:gap-4 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-stone-400 mb-2">
              Reference Token (Required)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-stone-550">
                <FileText size={16} />
              </span>
              <input
                type="text"
                required
                placeholder="e.g. MF-782391"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-stone-950 border border-neutral-200 dark:border-stone-800 rounded-xl text-xs font-bold font-mono tracking-wider focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-600 text-neutral-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-stone-400 mb-2">
              Email Verification
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-stone-550">
                <Mail size={16} />
              </span>
              <input
                type="email"
                placeholder="e.g. adeyinka@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-stone-950 border border-neutral-200 dark:border-stone-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-600 text-neutral-900 dark:text-stone-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-750 bg-emerald-700 hover:bg-emerald-850 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-0"
          >
            {isLoading ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={15} />
            )}
            <span>Track Audit</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-750 dark:text-red-400 text-xs flex gap-2.5 items-start">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}
      </div>

      {/* TRACKED CONTENT VIEW */}
      {trackedOrder ? (
        <div className="space-y-8 animate-fadeIn">
          {/* ORDER TRACKING OVERALL STATUS HEADER BANNER */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white shadow-md border border-emerald-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span>Active Track Session</span>
              </div>
              <h2 className="text-xl font-bold font-mono tracking-wider mt-1">
                Reservation: {trackedOrder.id}
              </h2>
              <p className="text-xs text-emerald-250 mt-1">
                Booked on {new Date(trackedOrder.createdAt).toLocaleDateString()} at {new Date(trackedOrder.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between sm:justify-start md:justify-center w-full md:w-auto gap-4 md:gap-2 pt-4 md:pt-0 border-t border-emerald-900/60 md:border-t-0 text-right">
              <div className="text-left sm:text-left md:text-right">
                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest block">GRAND TOTAL</span>
                <span className="text-2xl font-black font-mono text-amber-300 block my-0.5">
                  ₦{trackedOrder.totalPrice.toLocaleString()}
                </span>
                <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                  Qty: {trackedOrder.quantity} Livestock Packets
                </span>
              </div>
              <button
                type="button"
                onClick={generatePDFReceipt}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-emerald-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:translate-y-[-1px] active:translate-y-0 shrink-0 border border-amber-300 self-stretch sm:self-auto"
              >
                <Download size={13} />
                <span>Download Receipt as PDF</span>
              </button>
            </div>
          </div>

          {/* STATUS CHANGER ERROR NOTES CHECKOUT */}
          {stepIndex === -1 && (
            <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-2">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-400 font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Exception Status Alert</span>
              </div>
              <p className="text-xs text-red-750 dark:text-red-350 leading-relaxed font-medium">
                This transaction status is flagged as <strong>{trackedOrder.orderStatus}</strong> or has failed manual confirmation checks due to incomplete transaction validation data, unmatched bank receipts or cancellation indices.
              </p>
              <div className="pt-2 text-xs text-neutral-600 dark:text-stone-400">
                Please contact Mercy Farmstead support to verify your credentials or initiate manual resolution steps.
              </div>
            </div>
          )}

          {/* STREAMLINED VISUAL STEPPER PROCESS MAP */}
          {stepIndex !== -1 && (
            <div className="bg-white dark:bg-stone-900 border border-neutral-100 dark:border-stone-850 rounded-2xl p-6 shadow-xs">
              <h3 className="text-xs font-black uppercase text-neutral-900 dark:text-stone-200 tracking-wider mb-6 flex items-center gap-2">
                <Clock size={15} className="text-emerald-700" />
                <span>Fulfillment & Audit Progression</span>
              </h3>

              {/* TIMELINE DESKTOP SIZING */}
              <div className="relative hidden md:flex justify-between items-start gap-2 pt-4">
                {/* Connector line background */}
                <div className="absolute top-8 left-12 right-12 h-1 bg-neutral-200 dark:bg-stone-800 z-0" />
                
                {/* Connector line fill */}
                <div 
                  className="absolute top-8 left-12 h-1 bg-emerald-600 z-0 transition-all duration-550"
                  style={{ width: `${((stepIndex - 1) / 4) * 85}%` }}
                />

                {stepsList.map((step, idx) => {
                  const currentIdx = idx + 1;
                  const isCompleted = currentIdx < stepIndex;
                  const isActive = currentIdx === stepIndex;
                  const StepIcon = step.icon;

                  return (
                    <div key={idx} className="flex flex-col items-center text-center z-10 w-44">
                      {/* Node circle */}
                      <div 
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md ${
                          isCompleted 
                            ? 'bg-emerald-600 border-2 border-emerald-500 text-white' 
                            : isActive 
                            ? 'bg-amber-400 border-2 border-amber-300 text-emerald-950 scale-110 animate-pulse' 
                            : 'bg-neutral-100 dark:bg-stone-950 border border-neutral-200 dark:border-stone-800 text-neutral-400 dark:text-stone-600'
                        }`}
                      >
                        <StepIcon size={16} />
                      </div>

                      {/* Labels */}
                      <p className={`text-xs font-bold tracking-tight mt-3 ${isActive ? 'text-emerald-900 dark:text-emerald-400' : 'text-neutral-800 dark:text-stone-300'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1 px-2 leading-tight">
                        {step.desc}
                      </p>

                      {isActive && (
                        <span className="mt-2 text-[8px] font-black tracking-widest bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase">
                          Current Stage
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* TIMELINE MOBILE SIZING */}
              <div className="md:hidden space-y-6 relative pl-8 pb-2">
                {/* Line connector */}
                <div className="absolute top-2 bottom-6 left-3.5 w-0.5 bg-neutral-200 dark:bg-stone-800" />
                <div 
                  className="absolute top-2 left-3.5 w-0.5 bg-emerald-600 transition-all duration-550"
                  style={{ height: `${((Math.min(stepIndex, 5) - 1) / 4) * 90}%` }}
                />

                {stepsList.map((step, idx) => {
                  const currentIdx = idx + 1;
                  const isCompleted = currentIdx < stepIndex;
                  const isActive = currentIdx === stepIndex;
                  const StepIcon = step.icon;

                  return (
                    <div key={idx} className="relative flex gap-4 items-start">
                      {/* Node circle wrapper */}
                      <div 
                        className={`absolute -left-[27px] w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-inner ${
                          isCompleted 
                            ? 'bg-emerald-600 border border-emerald-500 text-white' 
                            : isActive 
                            ? 'bg-amber-400 border-2 border-amber-300 text-emerald-950 scale-105' 
                            : 'bg-neutral-100 dark:bg-stone-950 border border-neutral-200 dark:border-stone-800 text-neutral-400 dark:text-stone-600'
                        }`}
                      >
                        <StepIcon size={12} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold leading-none ${isActive ? 'text-emerald-900 dark:text-emerald-400' : 'text-neutral-800 dark:text-stone-200'}`}>
                            {step.label}
                          </h4>
                          {isActive && (
                            <span className="text-[7px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 rounded-full px-1.5 py-0.5">
                              active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DOUBLE BENTO PANEL GRID (ITEM SUMMARY vs CONTACT COORDINATES) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ITEM SUMMARY CARD */}
            <div className="bg-white dark:bg-stone-900 border border-neutral-100 dark:border-stone-850 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-stone-200 flex items-center gap-2 border-b border-neutral-105 dark:border-stone-850 pb-3">
                <Package size={15} className="text-emerald-700" />
                <span>Reserved Agriculture Produces</span>
              </h3>

              <div className="space-y-3.5">
                <div className="flex justify-between items-start bg-neutral-50 dark:bg-stone-950 p-3 rounded-xl">
                  <div>
                    <span className="text-[9px] font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-widest">{trackedOrder.category}</span>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-stone-100 mt-0.5">{trackedOrder.productName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-neutral-900 dark:text-stone-105">Qty: {trackedOrder.quantity}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs px-1">
                  <div className="flex justify-between text-neutral-600 dark:text-stone-400">
                    <span>Payment Routing MFB</span>
                    <span className="font-bold text-neutral-900 dark:text-stone-100">{trackedOrder.paymentBank}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-stone-400">
                    <span>Receipt Clearance Status</span>
                    <span className={`font-black uppercase text-[10px] ${
                      trackedOrder.paymentStatus === 'Verified' 
                        ? 'text-emerald-700 dark:text-emerald-400' 
                        : trackedOrder.paymentStatus === 'Failed Verification'
                        ? 'text-rose-600'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {trackedOrder.paymentStatus}
                    </span>
                  </div>
                  {trackedOrder.notes && (
                    <div className="mt-3 p-3 bg-neutral-50 dark:bg-stone-950 border border-neutral-100 dark:border-stone-850 rounded-xl">
                      <span className="block text-[8px] font-black uppercase text-neutral-450 tracking-wider">RESERVATION NOTES</span>
                      <p className="text-[10px] text-neutral-600 dark:text-stone-400 mt-1 italic font-light">"{trackedOrder.notes}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CUSTOMER CONTACT & DELIVERY SPECIFICS */}
            <div className="bg-white dark:bg-stone-900 border border-neutral-100 dark:border-stone-850 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-stone-200 flex items-center gap-2 border-b border-neutral-105 dark:border-stone-850 pb-3">
                <User size={15} className="text-emerald-700" />
                <span>Customer Delivery Specifics</span>
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-neutral-50 dark:bg-stone-950 flex items-center justify-center text-neutral-505 text-emerald-700 dark:text-emerald-400"><User size={14} /></span>
                  <div>
                    <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none">RECIPIENT NAME</span>
                    <span className="font-bold text-neutral-900 dark:text-stone-100 text-xs mt-1 block">{trackedOrder.customerName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-neutral-50 dark:bg-stone-950 flex items-center justify-center text-neutral-505 text-emerald-700 dark:text-emerald-400"><Phone size={14} /></span>
                  <div>
                    <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none">CONTACT PHONE</span>
                    <span className="font-bold font-mono text-neutral-900 dark:text-stone-105 text-xs mt-1 block">{trackedOrder.customerPhone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-neutral-50 dark:bg-stone-950 flex items-center justify-center text-neutral-505 text-emerald-700 dark:text-emerald-400"><MapPin size={14} /></span>
                  <div>
                    <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none">SHIPPING TARGET ROUTE</span>
                    <span className="font-medium text-neutral-700 dark:text-stone-300 text-xs mt-1 block">{trackedOrder.customerAddress}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* DIALOG ACTION BOARD / LIVE ASSIST INTERCEPTION MAP */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-stone-900/60 border border-slate-100 dark:border-stone-850 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-stone-100 uppercase tracking-wide">
                Need immediate modifications or priority dispatch check?
              </h4>
              <p className="text-[11px] text-neutral-550 dark:text-stone-400">
                You can chat live with our Ibadan Farm stead operations manager directly from the bottom chat module.
              </p>
            </div>
            <button
              onClick={() => {
                if (onOpenChatWithAdmin) {
                  onOpenChatWithAdmin();
                } else {
                  // Fallback triggering DOM element click
                  const chatTrigger = document.getElementById('chat-icon-trigger-btn') || document.getElementById('chatbot-toggle-circle');
                  if (chatTrigger) chatTrigger.click();
                }
              }}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/45 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>Initiate Chat Check</span>
            </button>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={handleClear}
              className="text-xs text-neutral-500 hover:text-emerald-750 underline cursor-pointer"
            >
              Track an alternative order reference token
            </button>
          </div>
        </div>
      ) : (
        /* TRACK RESERVATION TUTORIAL / QUICK TIP */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-center md:text-left">
          <div className="bg-emerald-50/40 dark:bg-stone-900/40 p-5 rounded-2xl border border-emerald-100/50 dark:border-stone-850 space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-stone-800 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-xs mx-auto md:mx-0">1</div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-stone-100">Audit Reference Code</h4>
            <p className="text-[11px] text-neutral-500 dark:text-stone-400 leading-relaxed">
              Upon complete submission of your bank wire receipt we dispatch a custom token (e.g. MF-782391) to represent your order.
            </p>
          </div>

          <div className="bg-emerald-50/40 dark:bg-stone-900/40 p-5 rounded-2xl border border-emerald-100/50 dark:border-stone-850 space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-stone-800 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-xs mx-auto md:mx-0">2</div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-stone-100 font-sans">Payment Verification</h4>
            <p className="text-[11px] text-neutral-500 dark:text-stone-400 leading-relaxed">
              Our administration immediately confirms receipt on Moniepoint/UBA ledger channels and upgrades your checkout file status inside 3 hours.
            </p>
          </div>

          <div className="bg-emerald-50/40 dark:bg-stone-900/40 p-5 rounded-2xl border border-emerald-100/50 dark:border-stone-850 space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-stone-800 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-xs mx-auto md:mx-0">3</div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-stone-100 font-sans">Direct Dispatch Check</h4>
            <p className="text-[11px] text-neutral-500 dark:text-stone-400 leading-relaxed">
              Monitor real-time updates as your livestock items are prepared, certified, and loaded into local transport lines or queued for direct pickup.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
