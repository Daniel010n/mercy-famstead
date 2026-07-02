import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, CheckCircle2, ShieldAlert, UploadCloud, Trash2, 
  HelpCircle, ClipboardCheck, MailWarning, FileCheck, ArrowLeft 
} from 'lucide-react';
import { Product, Order } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
}

interface BookingProps {
  cart: CartItem[];
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  products: Product[];
  onOrderSuccess: (order: Order) => void;
  directBookingItem: { product: Product; quantity: number } | null;
  onClearDirectBooking: () => void;
  onNavigate: (tab: string) => void;
}

export default function Booking({
  cart,
  onRemoveFromCart,
  onClearCart,
  products,
  onOrderSuccess,
  directBookingItem,
  onClearDirectBooking,
  onNavigate
}: BookingProps) {
  // Define checkout state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // Bank selection
  const [selectedBank, setSelectedBank] = useState<'United Bank of Africa' | 'Moniepoint MFB'>('United Bank of Africa');
  
  // Payment proof image states
  const [proofBase64, setProofBase64] = useState<string>('');
  const [proofName, setProofName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Form submitting status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Determine items to compile
  const activeItems: CartItem[] = directBookingItem 
    ? [directBookingItem] 
    : cart;

  const totalSum = activeItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  // FileReader handler of receipt images
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Invalid file type. Please upload a receipt image screenshot.');
      return;
    }
    setErrorMsg(null);
    setProofName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeProof = () => {
    setProofBase64('');
    setProofName('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (activeItems.length === 0) {
      setErrorMsg('Your booking queue is empty. Return to the Catalog to select produce.');
      return;
    }

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setErrorMsg('Please complete all required customer fields (Name, Email, and Phone number).');
      return;
    }

    if (!proofBase64) {
      setErrorMsg('Please upload a screenshot of your bank transfer proof of payment.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Loop order creation for elements on the cart
      // To match standard endpoint expectations, we'll submit the first item or let the backend do single submissions.
      // If there are multiple items, we create them in sequence
      let lastOrder: Order | null = null;
      for (const item of activeItems) {
        const payload = {
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          productId: item.product.id,
          quantity: item.quantity,
          paymentBank: selectedBank,
          paymentProofUrl: proofBase64,
          paymentProofName: proofName,
          notes: notes + (activeItems.length > 1 ? ` [Bundle part: ${item.product.name}]` : '')
        };

        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const apiErr = await res.json();
          throw new Error(apiErr.error || 'Failed to register reservation details.');
        }

        lastOrder = await res.json();
      }

      if (lastOrder) {
        // Clear state
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setCustomerAddress('');
        setNotes('');
        setProofBase64('');
        setProofName('');
        
        if (directBookingItem) {
          onClearDirectBooking();
        } else {
          onClearCart();
        }

        onOrderSuccess(lastOrder);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected connection error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-neutral-50 dark:bg-stone-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300" id="booking-payment-page">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation override if direct booking item is present */}
        {directBookingItem && (
          <button
            onClick={onClearDirectBooking}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 mb-6 bg-emerald-100/50 dark:bg-emerald-950/40 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Discard direct booking and view general catalogue</span>
          </button>
        )}

        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-stone-100 font-sans">
            Secure Livestock Reservation
          </h2>
          <p className="text-sm text-neutral-600 dark:text-stone-400 mt-2">
            Finish reservation, complete secure manual bank deposits, and upload proof of payments to trigger manager approvals.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Checkout Items & Customer Questionnaire Form */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* BOOKING ITEMS PANEL */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
              <h3 className="text-base font-bold text-neutral-950 mb-4 pb-3 border-b border-neutral-100 flex items-center justify-between">
                <span>1. Booking Summary</span>
                <span className="text-xs bg-neutral-100 px-2.5 py-1 text-neutral-500 rounded-lg">
                  {activeItems.length} species line
                </span>
              </h3>

              {activeItems.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-neutral-500">No items selected to checkout.</p>
                  <button
                    onClick={() => onNavigate('products')}
                    className="mt-3 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Open Farm Catalog →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeItems.map((item) => (
                    <div key={item.product.id} className="flex gap-4 items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-xs font-extrabold text-neutral-900">{item.product.name}</h4>
                          <p className="text-[10px] text-neutral-500">
                            ₦{item.product.price.toLocaleString()} × {item.quantity} {item.product.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-emerald-800">
                          ₦{(item.product.price * item.quantity).toLocaleString()}
                        </span>
                        {!directBookingItem && (
                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(item.product.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove produce"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Calculation block */}
                  <div className="pt-4 border-t border-dashed border-neutral-200 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Total Grand Sum:</span>
                    <span className="text-2xl font-black text-emerald-800">₦{totalSum.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* CUSTOMER FORM */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-neutral-950 pb-3 border-b border-neutral-100">
                2. Owner / Contact Questionnaire
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kolawole Adebiyi"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-base font-extrabold p-3 bg-white border border-neutral-300 focus:bg-white focus:ring-2 focus:ring-emerald-700 rounded-xl transition-all text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08012345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-base font-extrabold p-3 bg-white border border-neutral-300 focus:bg-white focus:ring-2 focus:ring-emerald-700 rounded-xl transition-all text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. customer@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full text-base font-extrabold p-3 bg-white border border-neutral-300 focus:bg-white focus:ring-2 focus:ring-emerald-700 rounded-xl transition-all text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                  Delivery / Collection Destination
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ring Road, Ibadan, Oyo State"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full text-base font-extrabold p-3 bg-white border border-neutral-300 focus:bg-white focus:ring-2 focus:ring-emerald-700 rounded-xl transition-all text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                  Special Care / Delivery Scheduling Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Write any vaccine, feeding inquiries or specific delivery times..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-base font-extrabold p-3 bg-white border border-neutral-300 focus:bg-white focus:ring-2 focus:ring-emerald-700 rounded-xl transition-all resize-none text-neutral-900"
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: MANUAL WIRE CHANNELS & PROOF UPLOADER */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* BANK CREDENTIALS DISPLAY */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
              <h3 className="text-base font-bold text-neutral-950 mb-4 pb-3 border-b border-neutral-100 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-700" />
                <span>3. Payment Wire Channels</span>
              </h3>

              <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
                Mercy Farmstead utilizes instant direct bank manual transfers. Select your preferred account, send from your banking app, then attach your screenshot.
              </p>

              {/* Bank selector options */}
              <div className="space-y-3" id="bank-channel-selectors">
                {/* UBA */}
                <div
                  onClick={() => setSelectedBank('United Bank of Africa')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    selectedBank === 'United Bank of Africa'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedBank === 'United Bank of Africa' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-neutral-300'
                    }`}>
                      {selectedBank === 'United Bank of Africa' && <CheckCircle2 size={10} />}
                    </div>
                  </div>

                  <div className="text-[10px] font-black uppercase text-rose-700 tracking-wider">UNITED BANK OF AFRICA</div>
                  <div className="text-base font-black text-neutral-900 mt-1 font-mono tracking-tight select-all">1030248864</div>
                  <div className="text-xs text-neutral-600 mt-1 font-semibold">Account Name: <span className="text-neutral-900">Mercy Farmstead</span></div>
                </div>

                {/* Moniepoint */}
                <div
                  onClick={() => setSelectedBank('Moniepoint MFB')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    selectedBank === 'Moniepoint MFB'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50'
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedBank === 'Moniepoint MFB' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-neutral-300'
                    }`}>
                      {selectedBank === 'Moniepoint MFB' && <CheckCircle2 size={10} />}
                    </div>
                  </div>

                  <div className="text-[10px] font-black uppercase text-blue-800 tracking-wider">MONIEPOINT MFB</div>
                  <div className="text-base font-black text-neutral-900 mt-1 font-mono tracking-tight select-all">6213477162</div>
                  <div className="text-xs text-neutral-600 mt-1 font-semibold">Account Name: <span className="text-neutral-900">Mercy Farmstead</span></div>
                </div>
              </div>
            </div>

            {/* SCREENSHOT PROOF UPLOADER */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
              <h3 className="text-base font-bold text-neutral-950 mb-3 pb-3 border-b border-neutral-100 flex items-center gap-2">
                <UploadCloud size={18} className="text-emerald-700" />
                <span>4. Attachement verification</span>
              </h3>

              {proofBase64 ? (
                /* Thumb preview of uploaded screenshot receipt */
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-3" id="receipt-preview-box">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 justify-center">
                    <FileCheck size={16} className="text-emerald-600" />
                    <span>Receipt Attached Successfully</span>
                  </div>
                  <div className="w-full h-32 bg-neutral-100 rounded-lg overflow-hidden border border-emerald-100 max-w-xs mx-auto">
                    <img
                      src={proofBase64}
                      alt="receipt screenshot"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono italic truncate px-2">{proofName}</div>
                  <button
                    type="button"
                    onClick={removeProof}
                    className="text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Remove file and select another</span>
                  </button>
                </div>
              ) : (
                /* Interactive Drag and click zone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[180px] ${
                    isDragging 
                      ? 'border-emerald-600 bg-emerald-50' 
                      : 'border-neutral-200 hover:border-emerald-400 bg-neutral-50/50 hover:bg-neutral-50'
                  }`}
                  onClick={() => document.getElementById('receipt-screenshot-input')?.click()}
                  id="drag-drop-payment-proof-zone"
                >
                  <input
                    type="file"
                    id="receipt-screenshot-input"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <UploadCloud size={32} className="text-neutral-400 mb-2 group-hover:text-emerald-600 transition-colors" />
                  <p className="text-xs font-bold text-neutral-900 leading-snug">
                    Drag and drop transfer proof here
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Or click to browse your photos (JPEG, PNG formats)
                  </p>
                  <div className="mt-4 px-3 py-1.5 bg-neutral-100 hover:bg-emerald-100 rounded-lg text-[9px] font-black text-emerald-950 uppercase tracking-widest transition-colors">
                    Upload Screenshot
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2 items-start text-[10px] text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <ShieldAlert size={14} className="text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  Our internal verification unit reviews accounting entries 24/7. Your booking remains active and in line. Discrepancies may trigger booking rejection.
                </p>
              </div>

              {/* Warnings and messages */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-950 border border-rose-250 rounded-xl text-xs flex items-center gap-2 font-semibold mt-4">
                  <ShieldAlert className="text-rose-700 shrink-0" size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submission Button */}
              <button
                id="place-order-submit-btn"
                type="submit"
                disabled={isSubmitting || activeItems.length === 0}
                className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Booking Reservation & Triggering Notifications...</span>
                  </>
                ) : (
                  <>
                    <ClipboardCheck size={18} />
                    <span>Compile Booking & Confirm Payment (₦{totalSum.toLocaleString()})</span>
                  </>
                )}
              </button>

              <div className="flex justify-center items-center gap-1 text-[10px] text-neutral-500 mt-3">
                <ShieldAlert size={12} className="text-emerald-700" />
                <span>Your security and bio-sanitary protocol is permanently guaranteed.</span>
              </div>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
}
