import { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Database,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useStore } from "../hooks/useStore";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { logActivity } from "../lib/activity";

export default function Admin() {
  const { appUser } = useStore();
  const [resetting, setResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSystemReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    setResetting(true);
    try {
      // Collections to wipe (except users initially, but prompt says "Delete all: Users, Tasks... Preserve structure")
      // Being a client side wipe, we can only wipe what we can query. We'll wipe the main ones
      // except the current user to prevent them from getting locked out immediately.
      const collectionsToWipe = [
        "tasks",
        "deals",
        "transactions",
        "messages",
        "notifications",
        "clients",
        "activities",
      ];

      for (const coll of collectionsToWipe) {
        const querySnapshot = await getDocs(collection(db, coll));
        let batch = writeBatch(db);
        let count = 0;

        for (const docSnap of querySnapshot.docs) {
          batch.delete(docSnap.ref);
          count++;
          if (count % 500 === 0) {
            await batch.commit();
            batch = writeBatch(db);
          }
        }
        if (count % 500 !== 0 && count > 0) {
          await batch.commit();
        }
      }

      // Special case for users: Delete everyone except current admin
      const usersSnap = await getDocs(collection(db, "users"));
      let userBatch = writeBatch(db);
      let uCount = 0;
      for (const u of usersSnap.docs) {
        if (u.id !== appUser?.uid) {
          userBatch.delete(u.ref);
          uCount++;
          if (uCount % 500 === 0) {
            await userBatch.commit();
            userBatch = writeBatch(db);
          }
        }
      }
      if (uCount % 500 !== 0 && uCount > 0) {
        await userBatch.commit();
      }

      await logActivity("performed a FULL SYSTEM RESET", "system");
      alert("System reset complete.");
    } catch (error) {
      console.error(error);
      alert("Failed to reset system. " + String(error));
    } finally {
      setResetting(false);
      setResetConfirm(false);
    }
  };

  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    if (appUser?.role !== "admin") return;

    // Use regular getDocs or onSnapshot to strictly display DB contents only
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      const users: any[] = [];
      snap.forEach((d) => {
        users.push({ id: d.id, ...d.data() });
      });
      setStaffList(users);
      setLoadingStaff(false);
    });

    return () => unsubscribe();
  }, [appUser]);

  if (appUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Shield size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-primary-text/40 max-w-sm mt-2">
          You do not have the required permissions to view the Admin Console.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Admin</h1>
          <p className="text-primary-text/40 text-sm mt-1">
            Manage global system settings and user roles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 border-primary-text/5">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-brand-green" />
            <h2 className="font-semibold text-lg">User Management</h2>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {loadingStaff ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-brand-green" />
              </div>
            ) : staffList.length === 0 ? (
              <p className="text-sm text-primary-text/50">
                No data found in registry.
              </p>
            ) : (
              staffList.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 bg-primary-text/5 rounded-lg border border-primary-text/5"
                >
                  <div>
                    <p className="text-sm font-medium">{u.displayName}</p>
                    <p className="text-xs text-primary-text/50">{u.email}</p>
                  </div>
                  <select
                    className="bg-secondary-bg/50 border border-primary-text/20 text-xs rounded px-2 py-1 outline-none focus:border-brand-green text-primary-text/80 capitalize"
                    value={u.role}
                    onChange={async (e) => {
                      if (u.id === appUser?.uid) return; // Prevent demoting yourself simply
                      try {
                        await updateDoc(doc(db, "users", u.id), {
                          role: e.target.value,
                        });
                        await logActivity(
                          `changed role for ${u.email} to ${e.target.value}`,
                          "system",
                        );
                      } catch (err) {
                        alert("Failed to update role");
                      }
                    }}
                    disabled={u.id === appUser?.uid}
                  >
                    {["admin", "designer", "marketer", "sales", "finance"].map(
                      (r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel p-6 border-primary-text/5">
          <div className="flex items-center gap-3 mb-6">
            <Database className="text-brand-green" />
            <h2 className="font-semibold text-lg">System Metrics</h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-primary-text/5">
              <span className="text-sm text-primary-text/60">
                Total Storage Used
              </span>
              <span className="text-sm font-medium">4.2 GB / 100 GB</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 border-red-500/20 bg-red-500/5 mt-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="text-red-400" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-red-400">
              Danger Zone: System Reset
            </h2>
            <p className="text-sm text-primary-text/60 mt-1 max-w-2xl">
              This action will completely wipe all tasks, users (except you),
              chats, and financial records from the database. This is
              irreversible. Use only for fresh installs or catastrophic resets.
            </p>
            <div className="mt-4">
              <button
                onClick={handleSystemReset}
                disabled={resetting}
                className={`py-2 px-6 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                  resetConfirm
                    ? "bg-red-500 hover:bg-red-600 text-primary-text"
                    : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                }`}
              >
                <Trash2 size={16} />
                {resetting
                  ? "Resetting System..."
                  : resetConfirm
                    ? "Click again to confirm WIPING ALL DATA"
                    : "Reset System Data"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
