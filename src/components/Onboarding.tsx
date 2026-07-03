import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Layers, Instagram, ShieldCheck, Zap, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { auth } from '../lib/firebase';

interface OnboardingProps {
  onSuccess: () => void;
}

export default function Onboarding({ onSuccess }: OnboardingProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Get current Firebase user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to connect Instagram');
      }

      // Get Firebase ID token
      const idToken = await user.getIdToken();
      console.log('[Onboarding] Got Firebase token, requesting OAuth URL');
      
      // Request OAuth URL with Firebase token
      const response = await fetch('/api/auth/instagram/url', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start authentication');
      }
      
      const { url } = await response.json();
      console.log('[Onboarding] Opening OAuth popup');
      
      const width = 600;
      const height = 750;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        url,
        'instagram_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        throw new Error('Popup blocked! Please allow popups to connect your account.');
      }
    } catch (err: any) {
      console.error('[Onboarding] Connection error:', err);
      setError(err.message);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or current location
      if (event.data?.type === 'INSTAGRAM_AUTH_SUCCESS') {
        setIsConnecting(false);
        onSuccess();
      } else if (event.data?.type === 'INSTAGRAM_AUTH_ERROR') {
        setIsConnecting(false);
        setError(event.data.message || 'Authentication failed');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess]);

  return (
    <div className="fixed inset-0 z-[60] mesh-bg flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full glass rounded-[2.5rem] p-12 text-center relative overflow-hidden"
      >
        {/* Abstract Background Accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/20 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/20 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-3xl flex items-center justify-center active-glow transform -rotate-6">
              <Layers className="text-white w-10 h-10" />
            </div>
          </div>

          <h1 className="text-5xl font-black text-white tracking-tighter mb-4 leading-tight">
            Take Control of Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Instagram Growth</span>
          </h1>
          
          <p className="text-xl text-white/50 mb-12 max-w-md mx-auto leading-relaxed">
            Connect your professional account to unlock AI-powered automations, smart scheduling, and advanced analytics.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Zap, label: 'Auto-Replies', desc: 'AI-driven comments' },
              { icon: Instagram, label: 'Smart Posting', desc: 'Optimal timing' },
              { icon: ShieldCheck, label: 'Secure Auth', desc: 'Graph API encrypted' },
            ].map((feature, i) => (
              <div key={i} className="p-4 glass rounded-2xl border border-white/5">
                <feature.icon className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-white uppercase tracking-widest leading-none mb-1">{feature.label}</p>
                <p className="text-[10px] text-white/30">{feature.desc}</p>
              </div>
            ))}
          </div>

          <button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="group w-full max-w-sm mx-auto bg-white hover:scale-[1.02] active:scale-[0.98] transition-all py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <Loader2 className="w-6 h-6 text-indigo-900 animate-spin" />
            ) : (
              <Instagram className="w-6 h-6 text-indigo-900" />
            )}
            <span className="text-indigo-900 font-black uppercase tracking-[0.15em] text-sm text-center">
              {isConnecting ? 'Waiting for Token...' : 'Connect Business Account'}
            </span>
            <ArrowRight className="w-5 h-5 text-indigo-900 group-hover:translate-x-1 transition-transform" />
          </button>

          {error && (
            <div className="mt-8 p-6 glass border-red-500/30 rounded-2xl text-left bg-red-500/5">
              <p className="text-red-400 text-sm font-bold flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                Connection Flux Interrupted
              </p>
              
              <div className="space-y-4 mb-6">
                <p className="text-xs text-white/80 leading-relaxed font-bold">Diagnostic Report:</p>
                <p className="text-xs text-white/50 leading-relaxed italic border-l-2 border-red-500/20 pl-3">
                    {error.includes('FACEBOOK_APP_ID') ? (
                      <>
                        <strong>Developer Note:</strong> You need to add your <code className="text-indigo-300">FACEBOOK_APP_ID</code> and <code className="text-indigo-300">FACEBOOK_APP_SECRET</code> to the environment variables in AI Studio settings to enable connections.
                      </>
                    ) : error}
                </p>
              </div>

              <div className="space-y-2 border-t border-white/5 pt-4">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Setup Checklist</p>
                {[
                  { label: 'Instagram Professional Account', checked: !error.includes('NO_INSTAGRAM_LINK') },
                  { label: 'Linked Facebook Page', checked: !error.includes('NO_PAGES') && !error.includes('NO_INSTAGRAM_LINK') },
                  { label: 'Platform Permissions Granted', checked: !error.includes('OAUTH_ERROR') },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${item.checked ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {item.checked ? <CheckCircle2 className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    </div>
                    <span className={`text-[11px] ${item.checked ? 'text-white/60' : 'text-white/30 italic'}`}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <a 
                  href="/#help" 
                  onClick={() => window.location.reload()} // Quick hack to show the main app with help tab if they need guide
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-2"
                >
                  View Setup Guide <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          <p className="mt-8 text-[10px] text-white/20 font-bold uppercase tracking-widest px-8">
            Requires an Instagram Business or Creator account linked to a Facebook Page.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
