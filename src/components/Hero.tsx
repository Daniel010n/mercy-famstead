import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Leaf } from 'lucide-react';
import pigImg from '../assets/images/mercy_pigs_pen_1779313656428.png';
import catfishImg from '../assets/images/mercy_catfish_1779401143271.png';
import broilerImg from '../assets/images/mercy_broiler_chickens_1779313814744.png';

interface HeroProps {
  onNavigate: (tab: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  // Let's create visual animations using subtle CSS indicators representing pigs, eggs, layers, fish, and broilers.
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white dark:from-emerald-950/20 dark:via-stone-950 dark:to-stone-950 py-16 sm:py-24 transition-colors duration-300">
      {/* Decorative floating farm elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {/* Floating Swine Path Simulation */}
        <div className="absolute top-[20%] left-[8%] animate-bounce text-emerald-600" style={{ animationDuration: '6s' }}>
          🐖 <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400">Swine Ready</span>
        </div>
        {/* Layer Hen / Egg Floating */}
        <div className="absolute top-[45%] right-[10%] animate-pulse text-yellow-600" style={{ animationDuration: '4s' }}>
          🥚 <span className="text-xs font-mono font-bold text-yellow-850 dark:text-yellow-350">Golden Eggs</span>
        </div>
        {/* Fish splashing animation */}
        <div className="absolute bottom-[25%] left-[15%] animate-bounce text-blue-500" style={{ animationDuration: '8s' }}>
          🐟 <span className="text-xs font-mono font-bold text-blue-800 dark:text-blue-400">Aquaculture</span>
        </div>
        {/* Poultry Broiler pecking status */}
        <div className="absolute top-[15%] right-[25%] animate-pulse text-orange-500" style={{ animationDuration: '5s' }}>
          🐓 <span className="text-xs font-mono font-bold text-orange-950 dark:text-orange-400">Broilers</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Tag badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-805 text-emerald-800 dark:text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-6"
            id="hero-badge"
          >
            <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400 animate-spin" />
            <span>Organic Agriculture Specialist</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-stone-100 mb-6 font-sans leading-none"
            id="hero-title"
          >
            Welcome to <span className="text-emerald-700 dark:text-emerald-450 bg-clip-text">Mercy Farmstead</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl sm:text-4xl font-semibold text-emerald-800 dark:text-emerald-400 tracking-tight mb-8"
            id="hero-tagline"
          >
            "Raising quality, delivering freshness."
          </motion.p>

          {/* Subtext - Promise Statement */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="max-w-2xl mx-auto mb-10 bg-white/70 dark:bg-stone-900/60 backdrop-blur-sm p-6 rounded-2xl border border-emerald-100 dark:border-emerald-950/40 shadow-md"
            id="hero-promise-card"
          >
            <p className="text-neutral-700 dark:text-stone-300 text-base sm:text-lg mb-2 leading-relaxed">
              "Every animal raised with care, every product delivered with pride."
            </p>
            <p className="text-xs font-bold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
              — THE MERCY FARMSTEAD PROMISE
            </p>
          </motion.div>

          {/* Dynamic Interactive Call-to-actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
          >
            <button
              id="hero-book-btn"
              onClick={() => onNavigate('products')}
              className="px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Book Farm Product</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              id="hero-contact-btn"
              onClick={() => onNavigate('contact')}
              className="px-8 py-4 bg-white dark:bg-stone-900 border border-emerald-200 dark:border-emerald-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-900 dark:text-emerald-450 rounded-xl font-medium shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Contact Us
            </button>
          </motion.div>
        </div>

        {/* ==========================================================================
           LIVESTOCK STABLE VISUAL SHOWCASE GRID
           ========================================================================== */}
        <div id="live-livestock-showcase-section" className="mb-20 mt-4 relative">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-stone-100 font-sans tracking-tight" id="showcase-title">
              Our Premium Cultivated Sectors
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-stone-400 mt-2 max-w-xl mx-auto">
              Explore live visual glances inside the Mercy Farmstead biosecurity divisions in Ibadan. Hover or tap each segment to view current active pens, ponds, or poultry wings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="livestock-animation-grid">
            {/* Swine Breed Card */}
            <motion.div
              id="showcase-card-pigs"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -6 }}
              className="bg-white dark:bg-stone-900 rounded-3xl border border-neutral-100 dark:border-stone-850 shadow-md hover:shadow-xl overflow-hidden group flex flex-col justify-between"
            >
              <div className="relative overflow-hidden aspect-video bg-neutral-100 dark:bg-stone-950 border-b border-neutral-100 dark:border-stone-850">
                {/* Stable heartbeat breathing animation for Pig Image */}
                <motion.div
                  className="w-full h-full"
                  animate={{
                    scale: [1, 1.025, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <img
                    src={pigImg}
                    alt="Pigs in Mercy Farmstead Pen"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                {/* Status Badge */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Swine Pen #2</span>
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-stone-100 mb-2 flex items-center gap-2">
                    <span>🐖</span>
                    <span>Superior Swine Genetics</span>
                  </h3>
                  <p className="text-xs text-neutral-605 text-neutral-600 dark:text-stone-400 leading-relaxed mb-4">
                    Our high-yield hybrid large white and local swine stocks receive standard vaccine schedules and strictly regulated organic booster meals to ensure heavy, lean weight indices.
                  </p>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-100 dark:border-stone-850 text-[10px] font-mono">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">100% HEALTH REGISTERED</span>
                  <button
                    onClick={() => onNavigate('products')}
                    className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1 transition-colors hover:underline hover:text-emerald-800 cursor-pointer"
                  >
                    <span>Pre-Order Pen</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Aquaculture Card */}
            <motion.div
              id="showcase-card-catfish"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -6 }}
              className="bg-white dark:bg-stone-900 rounded-3xl border border-neutral-100 dark:border-stone-850 shadow-md hover:shadow-xl overflow-hidden group flex flex-col justify-between"
            >
              <div className="relative overflow-hidden aspect-video bg-neutral-100 dark:bg-stone-950 border-b border-neutral-100 dark:border-stone-850">
                {/* Stable flowing swimming animation for Catfish Image */}
                <motion.div
                  className="w-full h-full"
                  animate={{
                    x: [-2, 2, -2],
                    y: [-1.5, 1.5, -1.5],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <img
                    src={catfishImg}
                    alt="African Catfish in Mercy Farmstead Ponds"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                {/* Status Badge */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  <span>Pond Block D</span>
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-stone-100 mb-2 flex items-center gap-2">
                    <span>🐟</span>
                    <span>African Aquaculture</span>
                  </h3>
                  <p className="text-xs text-neutral-650 text-neutral-600 dark:text-stone-400 leading-relaxed mb-4">
                    Our premium catfish are raised inside deep aerated earthen and concrete ponds using filtered bore feeds. They boast rich culinary grade meat weight margins.
                  </p>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-100 dark:border-stone-850 text-[10px] font-mono">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">ORGANIC FEED FORMULAS</span>
                  <button
                    onClick={() => onNavigate('products')}
                    className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1 transition-colors hover:underline hover:text-emerald-800 cursor-pointer"
                  >
                    <span>Secure Pond</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Broiler Card */}
            <motion.div
              id="showcase-card-broilers"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -6 }}
              className="bg-white dark:bg-stone-900 rounded-3xl border border-neutral-100 dark:border-stone-850 shadow-md hover:shadow-xl overflow-hidden group flex flex-col justify-between"
            >
              <div className="relative overflow-hidden aspect-video bg-neutral-100 dark:bg-stone-950 border-b border-neutral-100 dark:border-stone-850">
                {/* Stable gentle expansion breathing animation for Broiler Image */}
                <motion.div
                  className="w-full h-full"
                  animate={{
                    scale: [1, 1.018, 1],
                    y: [0, 1, 0]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <img
                    src={broilerImg}
                    alt="Plump Broilers in Mercy Farmstead Poultry Wings"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                {/* Status Badge */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>Poultry Wing 1A</span>
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-stone-100 mb-2 flex items-center gap-2">
                    <span>🐓</span>
                    <span>Plump Broiler Deliveries</span>
                  </h3>
                  <p className="text-xs text-neutral-650 text-neutral-600 dark:text-stone-400 leading-relaxed mb-4">
                    Our poultry batches are meticulously managed with automated clean water supply configurations and high-nutrition chick crumbs, ensuring sweet savory natural meats.
                  </p>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-100 dark:border-stone-850 text-[10px] font-mono">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">100% VACCINE-REGULATED</span>
                  <button
                    onClick={() => onNavigate('products')}
                    className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1 transition-colors hover:underline hover:text-emerald-800 cursor-pointer"
                  >
                    <span>Reserve Crate</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Visual Showcase (3 Features) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4 pt-8 border-t border-emerald-100 dark:border-stone-850" id="hero-features-grid">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex gap-4 p-5 rounded-xl bg-white dark:bg-stone-900 shadow-xs border border-neutral-50 dark:border-stone-850/60"
          >
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 h-fit">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-stone-100 mb-1">Bio-Secured Living</h3>
              <p className="text-xs text-neutral-600 dark:text-stone-400 leading-relaxed">
                All livestock are vaccination-regulated and fed organic standard meal formulas.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex gap-4 p-5 rounded-xl bg-white dark:bg-stone-900 shadow-xs border border-neutral-50 dark:border-stone-850/60"
          >
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 h-fit">
              <Leaf size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-stone-100 mb-1">Strict Freshness Promise</h3>
              <p className="text-xs text-neutral-600 dark:text-stone-400 leading-relaxed">
                Table fish and crate eggs are sorted and harvested on demand relative to your specific delivery queues.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex gap-4 p-5 rounded-xl bg-white dark:bg-stone-900 shadow-xs border border-neutral-50 dark:border-stone-850/60"
          >
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 h-fit">
              <Heart size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-stone-100 mb-1">Local Ibadan Growth</h3>
              <p className="text-xs text-neutral-600 dark:text-stone-400 leading-relaxed">
                Deeply integrated in Ibadan Oyo State, enhancing Nigerian agricultural reliability from source to plate.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
