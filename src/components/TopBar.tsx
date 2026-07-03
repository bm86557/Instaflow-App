import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, Bell, User, Instagram } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { MOCK_ACCOUNT } from '../constants';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface UserStatus {
  connected: boolean;
  instagramUsername?: string;
  instagramUserId?: string;
  instagramProfilePictureUrl?: string;
}

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const res = await fetch('/api/user/status', {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            console.log('[TopBar] User status:', data);
            setUserStatus(data);
          } else {
            console.error('[TopBar] Failed to fetch user status');
          }
        } catch (err) {
          console.error('[TopBar] Error fetching user status:', err);
        }
      } else {
        setUserStatus(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className="h-20 glass m-4 rounded-2xl px-8 flex items-center justify-between sticky top-4 z-40 transition-all duration-300">
      <div className="relative w-96 hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input 
          type="text" 
          placeholder="Search analytics, posts, or users..."
          className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm outline-none text-white/80 placeholder:text-white/20 focus:bg-white/10 transition-colors"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 glass rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">AI Engine: Online</span>
        </div>

        <button 
          onClick={toggleTheme}
          className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-white/60"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        
        <div className="h-6 w-[1px] bg-white/10 mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            {userStatus?.connected && userStatus.instagramUsername ? (
              <>
                <div className="flex items-center gap-1.5 justify-end">
                  <Instagram className="w-3.5 h-3.5 text-pink-400" />
                  <p className="text-sm font-bold text-white">@{userStatus.instagramUsername}</p>
                </div>
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest leading-none mt-1">Connected</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-white">@{MOCK_ACCOUNT.username}</p>
                <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest leading-none mt-1">Not Connected</p>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl border-2 border-white/20 p-0.5 overflow-hidden">
            <img 
              src={userStatus?.connected && userStatus.instagramProfilePictureUrl ? userStatus.instagramProfilePictureUrl : MOCK_ACCOUNT.profilePictureUrl} 
              className="w-full h-full object-cover rounded-[7px]" 
              alt={userStatus?.instagramUsername ? `@${userStatus.instagramUsername}` : MOCK_ACCOUNT.username}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
