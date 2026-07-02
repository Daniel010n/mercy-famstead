import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShoppingCart, Info, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface ProductsProps {
  products: Product[];
  isLoading: boolean;
  onAddToCart: (product: Product, quantity: number) => void;
  onInstantBook: (product: Product, quantity: number) => void;
  cartCountById: (productId: string) => number;
}

export default function Products({ products, isLoading, onAddToCart, onInstantBook, cartCountById }: ProductsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [alertMsg, setAlertMsg] = useState<{ id: string; text: string } | null>(null);

  const categories = ['All', ...Array.from(new Set(['Pigs', 'Eggs', 'Layers', 'Fish', 'Broilers', ...products.map(p => p.category)]))];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleQtyChange = (productId: string, val: number, maxStock: number) => {
    const freshQty = Math.max(1, Math.min(val, maxStock));
    setQuantities((prev) => ({ ...prev, [productId]: freshQty }));
  };

  const triggerAlert = (productId: string, text: string) => {
    setAlertMsg({ id: productId, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 2500);
  };

  return (
    <div className="bg-neutral-50 dark:bg-stone-950 py-12 sm:py-16 transition-colors duration-300" id="products-catalog-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title & Introduction */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-stone-100 tracking-tight font-sans">
            Live Farm Produce Directory
          </h2>
          <p className="text-neutral-600 dark:text-stone-400 mt-2 text-sm leading-relaxed">
            All livestock listings, eggs crate tallies, and aquatic weights are continuously synchronized from the Mercy Farmstead manager. Book your supplies today.
          </p>
        </div>

        {/* Controls Layout: Search bar & Filters */}
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-neutral-100 dark:border-stone-850 shadow-xs mb-10 space-y-4 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400 pointer-events-none">
                <Search size={18} />
              </span>
              <input
                id="product-search-input"
                type="text"
                placeholder="Search premium pigs, organic eggs, layers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-950 border border-neutral-300 dark:border-stone-800 hover:border-neutral-400 text-sm font-bold text-neutral-900 dark:text-stone-100 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-emerald-600 rounded-xl transition-all"
              />
            </div>

            {/* Quick Status Notifications */}
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-1.5 rounded-full" id="live-sync-indicator">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Direct Link Stable — Live Feed Checked 2s ago</span>
            </div>
          </div>

          {/* Category Dropdown Selector */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-neutral-100 dark:border-stone-850" id="product-category-filter-container">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={14} />
                <span>Filter Category:</span>
              </span>
              <select
                id="product-category-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs p-2.5 bg-white dark:bg-stone-900 border border-neutral-300 dark:border-stone-800 text-neutral-900 dark:text-stone-100 font-bold focus:ring-2 focus:ring-emerald-600 rounded-xl outline-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="text-neutral-900 dark:text-stone-150 font-bold">
                    {cat === 'All' ? 'All Classifications' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading Feed */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-stone-900 rounded-2xl border border-neutral-100 dark:border-stone-850 shadow-xs" id="products-loading">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-neutral-600 dark:text-stone-400 animate-pulse">Checking fresh stock levels...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-neutral-100 dark:border-stone-850 shadow-xs" id="products-empty">
            <Info size={40} className="mx-auto text-neutral-400 mb-3" />
            <h3 className="text-lg font-bold text-neutral-800 dark:text-stone-105">No Farm Listings Found</h3>
            <p className="text-sm text-neutral-500 dark:text-stone-400 max-w-xs mx-auto mt-1">
              We couldn't find any products matching your configuration. Try adjusting filters or searching other products.
            </p>
          </div>
        ) : (
          /* Products Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="products-grid">
            {filteredProducts.map((prod) => {
              const qty = quantities[prod.id] || 1;
              const hasStock = prod.stock > 0 && prod.available;
              const cartCount = cartCountById(prod.id);
              
              return (
                <motion.div
                  key={prod.id}
                  id={`product-card-${prod.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-stone-850 shadow-sm hover:shadow-md hover:border-emerald-100 dark:hover:border-emerald-950 transition-all flex flex-col group relative"
                >
                  {/* Category overlay label */}
                  <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest text-white uppercase">
                    {prod.category}
                  </div>

                  {/* Stock tag status */}
                  <div className="absolute top-4 right-4 z-10">
                    {hasStock ? (
                      prod.stock <= 10 ? (
                        <div className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                          <AlertTriangle size={12} className="text-amber-700 animate-bounce" />
                          <span>LOW STOCK: {prod.stock} left</span>
                        </div>
                      ) : (
                        <div className="bg-emerald-100 text-emerald-950 border border-emerald-300 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>ACTIVE: {prod.stock} {prod.unit}(s)</span>
                        </div>
                      )
                    ) : (
                      <div className="bg-rose-100 text-rose-950 border border-rose-300 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                        <span>OUT OF STOCK</span>
                      </div>
                    )}
                  </div>

                  {/* Product Header Image */}
                  <div className="w-full h-48 bg-neutral-200 overflow-hidden relative">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
                  </div>

                  {/* Body Info */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-neutral-900 group-hover:text-emerald-800 transition-colors leading-snug">
                      {prod.name}
                    </h3>
                    
                    <p className="text-xs text-neutral-600 mt-2 flex-1 leading-relaxed">
                      {prod.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-neutral-100 flex items-baseline justify-between">
                      <div className="text-xs text-neutral-500 font-medium">Price level</div>
                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-800">₦{prod.price.toLocaleString()}</span>
                        <span className="text-xs font-bold text-neutral-500 ml-1">/{prod.unit}</span>
                      </div>
                    </div>

                    {/* Quantity selectors */}
                    {hasStock ? (
                      <div className="mt-4 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 flex items-center justify-between gap-4">
                        <span className="text-xs font-semibold text-neutral-600">Choose Quantity</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQtyChange(prod.id, qty - 1, prod.stock)}
                            className="w-7 h-7 bg-white border border-neutral-200 hover:border-emerald-300 rounded-lg text-sm font-extrabold flex items-center justify-center cursor-pointer text-neutral-700"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={qty}
                            onChange={(e) => handleQtyChange(prod.id, Number(e.target.value), prod.stock)}
                            className="w-12 text-center bg-transparent border-0 font-extrabold text-base focus:ring-0 text-neutral-900 p-0"
                          />
                          <button
                            onClick={() => handleQtyChange(prod.id, qty + 1, prod.stock)}
                            className="w-7 h-7 bg-white border border-neutral-200 hover:border-emerald-300 rounded-lg text-sm font-extrabold flex items-center justify-center cursor-pointer text-neutral-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Operational Actions */}
                    <div className="mt-5 space-y-2">
                      {hasStock ? (
                        <div className="grid grid-cols-2 gap-2">
                          {/* Add to Cart */}
                          <button
                            id={`add-cart-btn-${prod.id}`}
                            onClick={() => {
                              onAddToCart(prod, qty);
                              triggerAlert(prod.id, `Added ${qty} ${prod.unit}(s) to cart.`);
                            }}
                            className="py-3 px-4 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 hover:border-emerald-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <ShoppingCart size={15} />
                            <span>Add to Cart {cartCount > 0 ? `(${cartCount})` : ''}</span>
                          </button>

                          {/* Instant Booking */}
                          <button
                            id={`instant-book-btn-${prod.id}`}
                            onClick={() => onInstantBook(prod, qty)}
                            className="py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                          >
                            <span>Book Now</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled
                          className="w-full py-3.5 px-4 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-400 font-semibold text-xs cursor-not-allowed text-center"
                        >
                          Out of Stock
                        </button>
                      )}

                      {/* Add notification animation */}
                      <AnimatePresence>
                        {alertMsg && alertMsg.id === prod.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold py-2 px-3 rounded-lg flex items-center gap-2 justify-center"
                          >
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>{alertMsg.text}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
