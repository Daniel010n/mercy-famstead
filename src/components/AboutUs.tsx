import { motion } from 'motion/react';
import { Leaf, Award, Compass, Tractor, Users } from 'lucide-react';
import companyLogo from '../assets/images/mercy_farms_logo_1779313335439.png';
import pigImg from '../assets/images/mercy_pigs_pen_1779313656428.png';
import catfishImg from '../assets/images/mercy_catfish_1779401143271.png';
import broilerImg from '../assets/images/mercy_broiler_chickens_1779313814744.png';

export default function AboutUs() {
  return (
    <div className="bg-white dark:bg-stone-950 py-16 sm:py-20 overflow-hidden transition-colors duration-300" id="about-us-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Prominent Logo Section - Custom Designed Agriculture Shield Emblem */}
        <div className="flex flex-col items-center justify-center text-center mb-16" id="about-logo-section">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="w-32 h-32 rounded-2xl bg-black p-1 flex items-center justify-center shadow-lg border border-neutral-200/50 relative mb-4"
          >
            {/* Embedded Visual Logo */}
            <div className="w-full h-full rounded-xl overflow-hidden relative flex items-center justify-center bg-black">
              <img 
                src={companyLogo} 
                alt="Mercy Farms Logo Badge" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 inset-x-0 mx-auto w-10 h-3 bg-amber-400 text-emerald-950 rounded-xs text-[7px] font-bold flex items-center justify-center">
                EST 2018
              </div>
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Mercy Farmstead</h2>
          <p className="text-xs text-emerald-700 uppercase tracking-widest font-semibold mt-1">Authentic Nigerian Husbandry Since 2018</p>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
              <Compass size={14} className="text-emerald-600" />
              <span>Our Story & Conviction</span>
            </div>
            
            <h3 className="text-3xl font-extrabold text-neutral-900 font-sans tracking-tight">
              A Calling We Pursue with Dedication, Passion, and Pride.
            </h3>

            <div className="text-neutral-700 space-y-4 text-base leading-relaxed">
              <p>
                Welcome to <strong className="text-emerald-800">Mercy Farmstead</strong>, where farming is not just a commercial venture, but a calling we pursue with absolute dedication, passion, and pride.
              </p>
              <p>
                We started this journey with a simple but powerful conviction: that every family deserves access to fresh, healthy, and honestly raised farm produce. Today, that conviction drives everything we do — from the way we raise our animals to the way we serve our valued clients.
              </p>
              <p>
                At Mercy Farmstead, we take immense, meticulous care in ensuring that every animal on our farm is raised in a pristine, bio-secured environment. We understand that quality at the source directly dictates quality on your plate.
              </p>
              <p>
                We do not cut corners, and we do not compromise on standards because your household deserves nothing less than the absolute best.
              </p>
              <p>
                To every client who has trusted us with their order — thank you. Your confidence in our process is what keeps us motivated. We remain unreservedly committed to earning that trust with every single delivery.
              </p>
            </div>

            <p className="text-lg font-bold text-emerald-700 italic border-l-4 border-emerald-600 pl-4 mt-6">
              "Raising quality, delivering freshness — always."
            </p>
          </motion.div>

          {/* Interactive features & Stats graphics */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 lg:pl-8"
          >
            {/* The Promise Card */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-8 rounded-2xl text-white shadow-xl border border-emerald-700 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
                <Tractor size={200} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-emerald-700 text-amber-400">
                    <Award size={24} />
                  </div>
                  <h4 className="text-lg font-bold uppercase tracking-wider text-amber-300">ADMINISTRATIVE STANDARD</h4>
                </div>

                <p className="text-xl font-bold font-sans tracking-tight mb-4 text-white leading-relaxed">
                  THE MERCY FARMSTEAD PROMISE
                </p>
                
                <blockquote className="text-emerald-100 text-lg italic mb-6 border-l-2 border-amber-400 pl-4">
                  "Every animal raised with care, every product delivered with pride."
                </blockquote>

                <p className="text-xs text-emerald-200 leading-relaxed">
                  We maintain premium biosecurity farmstead coordinates at BESIDE BOLUWATIFE MATERNITY, NO25 TEMIDIRE AJAGBA WAKAJAYE, IBADAN 200113 OYO STATE, ensuring maximum safety, premium organic development, and optimal vaccination standards for all farm stock. Approved Corporate RC No: 9289785.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 text-center">
                <div className="text-2xl font-bold text-emerald-800">100%</div>
                <div className="text-xs text-neutral-600 font-medium mt-1">Vaccinated Layers</div>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 text-center">
                <div className="text-2xl font-bold text-emerald-800">Bio-Secure</div>
                <div className="text-xs text-neutral-600 font-medium mt-1">Farm Standards</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <Users size={20} className="text-emerald-700 shrink-0" />
              <p className="text-xs text-emerald-900 leading-relaxed">
                Over <strong>850+ families</strong> and animal product wholesale buyers across Oyo State trust our weekly supply queue.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Visual Showcase - Facilities Tour Section */}
        <div className="mt-20 border-t border-neutral-100 dark:border-stone-850 pt-16" id="about-facilities-visuals">
          <div className="text-center mb-12">
            <h4 className="text-2xl font-bold text-neutral-900 dark:text-stone-100 tracking-tight font-sans">Inside our Ibadan Farmland Units</h4>
            <p className="text-xs text-neutral-500 dark:text-stone-400 mt-2 max-w-sm mx-auto">
              A stable visual tour inside our bio-clean zones. All stock undergoes persistent state inspection and sanitarium routines.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pig visual */}
            <div className="group rounded-3xl overflow-hidden border border-neutral-100 dark:border-stone-850 bg-neutral-50 dark:bg-stone-900/60 p-3 shadow-xs hover:shadow-md transition-all">
              <div className="overflow-hidden rounded-2xl aspect-square relative bg-stone-100 dark:bg-stone-950">
                <motion.div
                  className="w-full h-full animate-stable-pulse"
                  animate={{ scale: [1, 1.025, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <img src={pigImg} alt="Pigs Pen View" className="w-full h-full object-cover transition-transform duration-505 group-hover:scale-105" />
                </motion.div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 text-white">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">Division: Swine Breeding</div>
                  <div className="text-xs font-bold mt-0.5">Active Organic Pens</div>
                </div>
              </div>
            </div>

            {/* Catfish visual */}
            <div className="group rounded-3xl overflow-hidden border border-neutral-100 dark:border-stone-850 bg-neutral-50 dark:bg-stone-900/60 p-3 shadow-xs hover:shadow-md transition-all">
              <div className="overflow-hidden rounded-2xl aspect-square relative bg-stone-100 dark:bg-stone-950">
                <motion.div
                  className="w-full h-full animate-stable-drift"
                  animate={{ x: [-2, 2, -2], y: [-1, 1, -1] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <img src={catfishImg} alt="Pond Block View" className="w-full h-full object-cover transition-transform duration-505 group-hover:scale-105" />
                </motion.div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 text-white">
                  <div className="text-[10px] font-black uppercase tracking-wider text-teal-350 text-teal-300">Division: Aquaculture</div>
                  <div className="text-xs font-bold mt-0.5">Bore-aerated Ponds</div>
                </div>
              </div>
            </div>

            {/* Broiler visual */}
            <div className="group rounded-3xl overflow-hidden border border-neutral-100 dark:border-stone-850 bg-neutral-50 dark:bg-stone-900/60 p-3 shadow-xs hover:shadow-md transition-all">
              <div className="overflow-hidden rounded-2xl aspect-square relative bg-stone-100 dark:bg-stone-950">
                <motion.div
                  className="w-full h-full animate-stable-breathe"
                  animate={{ scale: [1, 1.018, 1], y: [0, 1, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <img src={broilerImg} alt="Poultry Wing View" className="w-full h-full object-cover transition-transform duration-505 group-hover:scale-105" />
                </motion.div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 text-white">
                  <div className="text-[10px] font-black uppercase tracking-wider text-orange-350 text-orange-300">Division: Poultry</div>
                  <div className="text-xs font-bold mt-0.5">Plump Broilers Wing</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
