import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from "./lib/firebase";
import { useStore, AppUser } from "./hooks/useStore";

import Layout from "./components/layout/Layout";
import AuthGuard from "./components/layout/AuthGuard";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Sales from "./pages/Sales";
import Finance from "./pages/Finance";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Admin from "./pages/Admin";
import Designer from "./pages/Designer";
import Marketer from "./pages/Marketer";

export default function App() {
  const { setCurrentUser, setAppUser, setLoading, theme } = useStore();

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = () => {
      if (theme === "system") {
        const systemDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        root.setAttribute("data-theme", systemDark ? "dark" : "light");
      } else {
        root.setAttribute("data-theme", theme);
      }
    };

    applyTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data() as AppUser;
            setAppUser(data);
            // Log session start if they were missing or recently reloaded
            const currentAppUser = useStore.getState().appUser;
            if (!currentAppUser?.uid || currentAppUser.uid !== user.uid) {
              import("./lib/activity").then(({ logActivity }) => {
                logActivity("logged into the system", "user");
              });
            }
          } else {
            // User needs to onboard
            setAppUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile", error);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/designer" element={<Designer />} />
          <Route path="/marketer" element={<Marketer />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
