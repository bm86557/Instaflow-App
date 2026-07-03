import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import PostScheduler from './components/PostScheduler';
import AutomationManager from './components/AutomationManager';
import EngagementGrid from './components/EngagementGrid';
import AnalyticsDetailed from './components/AnalyticsDetailed';
import NotificationsCenter from './components/NotificationsCenter';
import SecurityCenter from './components/SecurityCenter';
import HelpCenter from './components/HelpCenter';
import Onboarding from './components/Onboarding';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import { ThemeProvider } from './components/ThemeProvider';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
  // Firebase auth state listener
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    console.log('[App] Firebase auth state changed:', user?.uid);
    
    if (user) {
      // User is logged in with Firebase
      setFirebaseUser(user);
      setIsGuest(false);
      setShowAuth(false);
      
      // Now check if Instagram is connected
      await checkInstagramConnection(user);
    } else {
      // User is logged out
      setFirebaseUser(null);
      setIsGuest(true);
      setIsConnected(false);
    }
  });

  // Cleanup listener on unmount
  return () => unsubscribe();
}, []);


 const checkInstagramConnection = async (user: any) => {
  console.log('[App] Checking Instagram connection for user:', user.uid);
  try {
    // Get Firebase ID token to send to backend
    const idToken = await user.getIdToken();
    
    const response = await fetch('/api/user/status', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[App] Instagram status:', data);
      setIsConnected(data.connected ?? data.isConnected);
    } else {
      console.error('[App] Failed to fetch Instagram status');
      setIsConnected(false);
    }
  } catch (err) {
    console.error('[App] Error checking Instagram connection:', err);
    setIsConnected(false);
  }
};


  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'scheduler': return <PostScheduler />;
      case 'automation': return <AutomationManager />;
      case 'engagement': return <EngagementGrid />;
      case 'analytics': return <AnalyticsDetailed />;
      case 'notifications': return <NotificationsCenter />;
      case 'security': return <SecurityCenter />;
      case 'help': return <HelpCenter />;
      case 'settings': return <div className="p-12 text-center text-neutral-500">Settings Page Placeholder</div>;
      default: return <Dashboard />;
    }
  };

  if (isConnected === null) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen text-white font-sans overflow-x-hidden">
        <AnimatePresence mode="wait">
          {isGuest ? (
            !showAuth ? (
              <motion.div 
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LandingPage 
                  onGetStarted={() => setShowAuth(true)} 
                  onLogin={() => setShowAuth(true)} 
                />
              </motion.div>
            ) : (
              <motion.div 
                key="auth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
               <Auth onSuccess={() => {
  console.log('[App] Auth success, waiting for Firebase state change...');
  // Firebase onAuthStateChanged will handle the rest
}} />

              </motion.div>
            )
          ) : !isConnected ? (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Onboarding onSuccess={async () => {
                console.log('[App] Instagram connected, rechecking status...');
                if (firebaseUser) {
                  await checkInstagramConnection(firebaseUser);
                }
              }} />
            </motion.div>
          ) : (
            <div key="app-layout" className="min-h-screen">
              <Sidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isCollapsed={isSidebarCollapsed} 
                setIsCollapsed={setIsSidebarCollapsed} 
              />
              
              <div className={`transition-all duration-500 ${isSidebarCollapsed ? 'pl-20' : 'pl-[260px]'} min-h-screen flex flex-col`}>
                <TopBar />
                
                <main className="p-8 flex-1 max-w-[1600px] w-full mx-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      {renderContent()}
                    </motion.div>
                  </AnimatePresence>
                </main>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}
