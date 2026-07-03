import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Shield, 
  Bell,
  Heart,
  Layers,
  ChevronLeft,
  ChevronRight,
  LogOut,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scheduler', label: 'Scheduler', icon: Calendar },
  { id: 'automation', label: 'Auto-Reply', icon: MessageSquare },
  { id: 'engagement', label: 'Engagement', icon: Heart },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Guide', icon: HelpCircle },
];

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }: SidebarProps) {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      window.location.reload();
    } catch (err) {
      console.error('Logout failed');
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      className={cn(
        "h-[calc(100vh-2rem)] glass m-4 rounded-2xl flex flex-col transition-all duration-500",
        "fixed left-0 top-0 z-50 overflow-hidden"
      )}
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Layers className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-white tracking-tighter">InstaFlow</span>
          </motion.div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-white/10 rounded-md transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5 text-white/70" /> : <ChevronLeft className="w-5 h-5 text-white/70" />}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-2 mt-4">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative",
              activeTab === item.id 
                ? "bg-white/15 text-white active-glow" 
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "group-hover:text-white")} />
            {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 text-white/60 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
