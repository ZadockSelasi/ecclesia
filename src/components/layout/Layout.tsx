import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import AIChatbot from "../AIChatbot";
import { useState, useEffect } from "react";
import { useStore } from "../../hooks/useStore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { appUser } = useStore();

  useEffect(() => {
    if (!appUser?.uid) return;
    const userRef = doc(db, "users", appUser.uid);

    const setPresence = (isOnline: boolean) => {
      updateDoc(userRef, {
        isOnline,
        lastActive: Date.now()
      }).catch(console.error);
    };

    // Mark online
    setPresence(true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setPresence(true);
      } else {
        setPresence(false);
      }
    };
    
    const handleBeforeUnload = () => {
      setPresence(false);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Keepalive every minute
    const interval = setInterval(() => setPresence(true), 60000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(interval);
    };
  }, [appUser?.uid]);

  return (
    <div className="flex h-screen bg-brand-black text-primary-text overflow-hidden relative">
      <Sidebar 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
      />
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-secondary-bg">
          <Outlet />
        </main>
      </div>
      <AIChatbot />
    </div>
  );
}
