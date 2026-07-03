import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Layers, 
  ShieldCheck, 
  BarChart3, 
  MessageSquare, 
  Clock, 
  Check, 
  ArrowRight,
  Star,
  Mail,
  Instagram
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen mesh-bg selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass py-4 px-8 rounded-full border-white/5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl glow transform -rotate-6">
              <Layers className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white tracking-tighter">InstaFlow</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest">Features</a>
            <a href="#pricing" className="text-sm font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest">Pricing</a>
            <button 
              onClick={onLogin}
              className="text-sm font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest"
            >
              Login
            </button>
            <button 
              onClick={onGetStarted}
              className="bg-white text-indigo-900 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <Star className="w-3 h-3 fill-indigo-400" />
            Next-Gen Automation Engine
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none"
          >
            Automate Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">Instagram Workflow</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg text-white/60 leading-relaxed font-medium"
          >
            InstaFlow brings enterprise-grade automation to creators. 
            Schedule content, auto-reply to comments, and scale your influence 
            with zero-trust security.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-white text-indigo-900 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Start Your Journey <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#features"
              className="w-full sm:w-auto glass border-white/10 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all text-center"
            >
              Explore Features
            </a>
          </motion.div>
        </div>

        {/* Backdrop Visuals */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] opacity-20" />
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[100px] opacity-10" />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl font-black text-white tracking-tight italic">Built for the Modern Creator</h2>
            <p className="text-white/40 uppercase text-xs font-bold tracking-[0.3em]">Industry Leading Tools</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: MessageSquare, title: "AI Auto-Response", desc: "Instantly reply to comments and DMs using context-aware AI brains tailored to your voice.", color: "text-indigo-400" },
              { icon: Clock, title: "Precision Scheduling", desc: "Plan your grid months in advance with pixel-perfect visual previews and optimized timing.", color: "text-purple-400" },
              { icon: BarChart3, title: "Real-time Metrics", desc: "Deep-dive into performance data with real-time analytics that show exactly what drives growth.", color: "text-pink-400" },
              { icon: ShieldCheck, title: "Zero-Trust Security", desc: "Enterprise-grade encryption for your tokens and data. We never store your passwords.", color: "text-blue-400" },
              { icon: Zap, title: "Lightning Fast", desc: "Our engine performs millions of check-syncs per second to ensure zero downtime.", color: "text-amber-400" },
              { icon: Layers, title: "Multi-Account", desc: "Seamlessly manage multiple brands or personas from a single unified command center.", color: "text-emerald-400" },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-10 rounded-[2.5rem] border-white/5 hover:border-indigo-500/30 transition-all group"
              >
                <div className={`p-4 rounded-2xl bg-white/5 mb-8 w-fit group-hover:scale-110 transition-transform ${feature.color}`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 tracking-tighter">{feature.title}</h3>
                <p className="text-white/40 leading-relaxed text-sm font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl font-black text-white tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-white/40 uppercase text-xs font-bold tracking-[0.3em]">No Hidden Fees</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Free */}
            <div className="glass p-10 rounded-[2.5rem] space-y-8 border-white/5 relative">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest text-xs">Essential</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">$0</span>
                  <span className="text-white/30 text-sm font-bold uppercase tracking-widest">/forever</span>
                </div>
              </div>
              <ul className="space-y-4">
                {['Basic Analytics', 'Manual Scheduling', '1 Connected Account', 'Public Help Center'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white/60">
                    <Check className="w-4 h-4 text-indigo-400" /> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onGetStarted}
                className="w-full py-4 rounded-xl glass border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Start For Free
              </button>
            </div>

            {/* Creator - Pro */}
            <div className="glass p-12 rounded-[3.5rem] space-y-8 border-indigo-500/50 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 relative shadow-2xl scale-110 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Most Popular</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest text-xs text-indigo-400">Creator</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">$19</span>
                  <span className="text-white/30 text-sm font-bold uppercase tracking-widest">/month</span>
                </div>
              </div>
              <ul className="space-y-4">
                {['AI Auto-Responses', 'Precision Scheduling', '3 Connected Accounts', 'Priority Support', 'Custom Reports'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white">
                    <Check className="w-4 h-4 text-indigo-400" /> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onGetStarted}
                className="w-full py-5 rounded-2xl bg-white text-indigo-900 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all"
              >
                Get Creator Pro
              </button>
            </div>

            {/* Business */}
            <div className="glass p-10 rounded-[2.5rem] space-y-8 border-white/5">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest text-xs">Business</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">$49</span>
                  <span className="text-white/30 text-sm font-bold uppercase tracking-widest">/month</span>
                </div>
              </div>
              <ul className="space-y-4">
                {['Unlimited Accounts', 'Advanced AI Flows', 'Team Collaboration', 'White-labeling', 'API Access'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white/60">
                    <Check className="w-4 h-4 text-indigo-400" /> {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onGetStarted}
                className="w-full py-4 rounded-xl glass border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto glass p-16 rounded-[4rem] border-indigo-500/20 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Mail className="w-40 h-40 transform rotate-12" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl font-black text-white tracking-tighter">Stay ahead of the Flow.</h2>
            <p className="text-white/40 max-w-lg mx-auto">Get the latest automation strategies, AI prompt tips, and Instagram algorithm updates delivered weekly.</p>
            
            {subscribed ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-indigo-500/20 text-indigo-400 py-6 rounded-3xl font-bold"
              >
                Welcome to the elite elite circle! Check your inbox.
              </motion.div>
            ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                    <input 
                        type="email" 
                        placeholder="your@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                    <button 
                        type="submit"
                        className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                        Join Newsletter
                    </button>
                </form>
            )}
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Secure · Ad-Free · Pure Strategy</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                    <Layers className="text-white/40 w-4 h-4" />
                </div>
                <span className="text-sm font-black text-white/20 tracking-tighter">InstaFlow © 2026</span>
            </div>

            <div className="flex items-center gap-8">
                <a href="#" className="text-white/20 hover:text-indigo-400 transition-colors"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="text-[10px] font-bold text-white/20 uppercase tracking-widest hover:text-white">Privacy Policy</a>
                <a href="#" className="text-[10px] font-bold text-white/20 uppercase tracking-widest hover:text-white">Terms of Service</a>
            </div>
        </div>
      </footer>
    </div>
  );
}
