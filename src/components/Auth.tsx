import React, { useState } from 'react';
import { registerUser, loginUser } from '../lib/firebase.js';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, Loader2, Layers, CheckCircle2 } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFriendlyErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Try again later';
    default:
      return 'Authentication failed. Please try again';
  }
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

   try {
  let result;
  
  if (isLogin) {
    // Firebase Login
    result = await loginUser(email, password);
  } else {
    // Firebase Register
    result = await registerUser(email, password);
  }

  if (result.success) {
    console.log('[Auth] Firebase auth successful:', result.user.uid);
    // Small delay to ensure Firebase auth state propagates
    setTimeout(() => {
      onSuccess();
    }, 500);
  } else {
    // Handle Firebase-specific errors
    const errorMessage = getFriendlyErrorMessage(result.error);
    throw new Error(errorMessage);
  }
} catch (err: any) {
  setError(err.message);
} finally {
  setIsLoading(false);
}

  };

  return (
    <div className="fixed inset-0 z-[100] mesh-bg flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass rounded-[2.5rem] p-10 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center glow transform -rotate-6">
              <Layers className="text-white w-8 h-8" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-white/40 text-center mb-8 text-sm">
            {isLogin ? 'Login to your InstaFlow dashboard' : 'Join the elite Instagram managers'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="email" 
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all shadow-inner"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all shadow-inner"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-white hover:scale-[1.02] active:scale-[0.98] transition-all py-4 rounded-xl flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/20 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-indigo-900 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 text-indigo-900" />
              )}
              <span className="text-indigo-900 font-black uppercase tracking-widest text-xs">
                {isLogin ? 'Access Dashboard' : 'Register Now'}
              </span>
            </button>
          </form>

          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 text-red-400 text-[10px] font-bold uppercase tracking-widest text-center"
            >
              {error}
            </motion.p>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-white/30 text-[10px] font-bold uppercase tracking-wider hover:text-indigo-400 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
