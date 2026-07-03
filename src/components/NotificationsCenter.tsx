import React from 'react';
import { Bell, MessageCircle, Heart, UserPlus, Info, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const NOTIF_ICONS: Record<string, any> = {
  message: MessageCircle,
  like: Heart,
  follow: UserPlus,
  info: Info,
  alert: AlertCircle
};

const MOCK_NOTIFS = [
  { id: 1, type: 'message', title: 'Intelligent Auto-Reply', detail: 'Sent "Hi! Check out our..." to @creative_mind', time: '2 mins ago', unread: true },
  { id: 2, type: 'follow', title: 'Organic Growth', detail: '@photography_pro started following you', time: '1 hr ago', unread: true },
  { id: 3, type: 'like', title: 'New Engagement', detail: '@traveler_joe liked your scheduled post', time: '3 hrs ago', unread: false },
  { id: 4, type: 'info', title: 'System Hardened', detail: 'New security features added to your vault.', time: 'Yesterday', unread: false },
];

export default function NotificationsCenter() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Activity Log</h1>
          <p className="text-white/40 mt-1">Real-time pulses from your automation fleet.</p>
        </div>
        <button className="text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-200 transition-colors">Mark all as read</button>
      </header>

      <div className="space-y-4">
        {MOCK_NOTIFS.map((notif, i) => {
          const Icon = NOTIF_ICONS[notif.type] || Info;
          return (
            <motion.div 
              key={notif.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-6 flex gap-6 glass rounded-3xl transition-all border border-white/5 group",
                notif.unread && "border-indigo-500/30 bg-indigo-500/5 active-glow"
              )}
            >
              <div className={cn(
                "p-4 rounded-2xl flex-shrink-0 h-fit",
                notif.unread ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 text-white/20"
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{notif.title}</h3>
                  <span className="text-[10px] font-black uppercase text-white/20 tracking-tighter tabular-nums">{notif.time}</span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">{notif.detail}</p>
                
                {notif.unread && (
                    <div className="mt-4 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                         <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">New Sync</span>
                    </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
