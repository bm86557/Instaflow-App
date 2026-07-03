import React from 'react';
import { Shield, Lock, EyeOff, Key, Smartphone, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const SECURITY_OPTIONS = [
  { 
    title: 'Identity Shield', 
    desc: 'Biometric and 2FA protection for your linked Instagram profiles.', 
    icon: Smartphone, 
    status: 'ACTIVE',
    color: 'text-green-400'
  },
  { 
    title: 'Auth Vault', 
    desc: "Encrypted storage for your Graph API long-lived access tokens.", 
    icon: Key, 
    status: 'ENCRYPTED',
    color: 'text-indigo-400'
  },
  { 
    title: 'Cloak Mode', 
    desc: 'Advanced proxy rotation and agent spoofing to protect your account.', 
    icon: EyeOff, 
    status: 'OPTIMAL',
    color: 'text-cyan-400'
  },
  { 
    title: 'Audit Engine', 
    desc: 'Real-time monitoring of all incoming and outgoing automation packets.', 
    icon: Lock, 
    status: 'MONITORING',
    color: 'text-purple-400'
  },
];

export default function SecurityCenter() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header>
        <h1 className="text-4xl font-bold text-white tracking-tight">Security Sanctum</h1>
        <p className="text-white/40 mt-1">Multi-layered defense protocols for your digital assets.</p>
      </header>

      <div className="glass-darker border-indigo-500/30 p-6 rounded-3xl flex gap-6 items-center shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="p-4 bg-indigo-500/20 text-indigo-400 rounded-2xl active-glow flex-shrink-0">
          <Shield className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white uppercase tracking-widest">Token Integrity Check</p>
          <p className="text-xs text-white/40 mt-1 leading-relaxed">Your primary authentication node is stable. Next routine rotation in <span className="text-indigo-400 font-bold">14 days</span>.</p>
        </div>
        <button className="px-6 py-2 glass rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all border border-white/10">Run Diagnostics</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {SECURITY_OPTIONS.map((opt, i) => (
          <motion.div
            key={opt.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 glass rounded-3xl group hover:border-white/20 transition-all cursor-pointer border border-white/5"
          >
            <div className="flex items-start justify-between mb-8">
                <div className={cn("p-4 rounded-2xl bg-white/5", opt.color)}>
                    <opt.icon className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <div className={cn("w-1.5 h-1.5 rounded-full bg-current", opt.color)} />
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">{opt.status}</span>
                </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{opt.title}</h3>
            <p className="text-sm text-white/40 leading-relaxed">{opt.desc}</p>
            
            <button className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 group-hover:gap-3 transition-all">
                Config Protocol <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="p-8 glass bg-red-500/5 border border-red-500/20 rounded-3xl">
        <h3 className="text-lg font-bold text-red-500 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" /> Emergency Protocol
        </h3>
        <p className="text-sm text-white/60 mt-4 leading-relaxed max-w-2xl">
          Instantly purge all session tokens and suspend all active automation threads. This action is irreversible and requires re-authentication of all nodes.
        </p>
        <button className="mt-8 px-8 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-red-500/30">
          Activate Zero-Trust Purge
        </button>
      </div>
    </div>
  );
}
