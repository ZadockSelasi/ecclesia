import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { Hexagon } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useStore } from "../hooks/useStore";

export default function Login() {
  const { currentUser } = useStore();
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    try {
      setErrorMsg("");
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Failed to sign in. Please try opening the app in a new tab if you are seeing this inside AI Studio.");
    }
  };

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-bg relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-green/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="glass-panel p-10 max-w-sm w-full mx-4 flex flex-col items-center relative z-10 border-primary-text/5 bg-secondary-bg/40">
        <div className="w-20 h-20 mb-6 rounded-full overflow-hidden flex items-center justify-center bg-brand-green/10">
          <img
            src="/logo.png"
            alt=""
            className="w-full h-full object-contain p-2"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.innerHTML =
                '<span class="text-brand-green text-3xl font-bold">EB</span>';
            }}
          />
        </div>
        <h1 className="text-3xl font-bold tracking-widest text-center mb-2">
          Ecclesiabranx
        </h1>
        <p className="text-primary-text/40 text-sm text-center mb-10">
          Business Management Platform
        </p>

        <button
          onClick={handleLogin}
          className="w-full btn-primary font-medium tracking-wide py-3"
        >
          <span>Sign In with Google</span>
        </button>

        {errorMsg && (
          <p className="mt-4 text-xs text-red-500 text-center max-w-xs">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
