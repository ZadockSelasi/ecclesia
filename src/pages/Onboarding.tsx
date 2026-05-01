import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useStore, AppUser, UserRole } from "../hooks/useStore";
import { Hexagon } from "lucide-react";

export default function Onboarding() {
  const { currentUser, appUser, setAppUser } = useStore();

  const [name, setName] = useState(currentUser?.displayName || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!currentUser) return <Navigate to="/login" replace />;
  if (appUser) return <Navigate to="/" replace />; // Already onboarded

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !phoneNumber || !role) {
      setError("Please fill in all fields");
      return;
    }

    if (role === "admin" && adminCode !== "ECCLESIA2026") {
      setError("Invalid admin code");
      return;
    }

    setLoading(true);
    try {
      const newUser: AppUser = {
        uid: currentUser.uid,
        email: email,
        displayName: name,
        phoneNumber,
        photoURL: currentUser.photoURL || "",
        role: role as UserRole,
        createdAt: Date.now(),
      };

      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, newUser);

      import("../lib/activity").then(({ logActivity }) => {
        logActivity(`registered as ${role}`, "user");
      });

      setAppUser(newUser);
    } catch (err) {
      console.error(err);
      setError("Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold tracking-widest text-center mb-2">
          COMPLETE PROFILE
        </h1>
        <p className="text-primary-text/40 text-sm text-center mb-8">
          Please provide your details below.
        </p>

        {error && (
          <div className="w-full bg-red-500/10 text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="text-xs text-primary-text/60 mb-1 block">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="text-xs text-primary-text/60 mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="text-xs text-primary-text/60 mb-1 block">
              Phone Number
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="glass-input"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="text-xs text-primary-text/60 mb-1 block">
              Your Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="glass-input !bg-secondary-bg/50 cursor-pointer appearance-none"
            >
              <option value="" disabled>
                Select your role
              </option>
              <option value="designer">Designer</option>
              <option value="marketer">Marketer</option>
              <option value="sales">Sales</option>
              <option value="finance">Finance</option>
              <option value="admin">System Admin</option>
            </select>
          </div>

          {role === "admin" && (
            <div>
              <label className="text-xs text-brand-green mb-1 block">
                Admin Verification Code
              </label>
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="glass-input !border-brand-green/50 focus:!border-brand-green"
                placeholder="Enter Code"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary font-medium tracking-wide py-3 mt-6 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Complete Registration"}
          </button>
        </form>

        <button
          onClick={() => {
            import("firebase/auth").then(({ signOut }) => {
              import("../lib/firebase").then(({ auth }) => {
                signOut(auth);
              });
            });
          }}
          className="mt-6 text-sm text-primary-text/60 hover:text-primary-text transition-colors"
        >
          Sign Out & Use Different Account
        </button>
      </div>
    </div>
  );
}
