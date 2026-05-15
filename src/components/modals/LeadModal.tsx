import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useStore } from "../../hooks/useStore";

interface LeadModalProps {
  onClose: () => void;
}

export function LeadModal({ onClose }: LeadModalProps) {
  const { appUser } = useStore();
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      const snap = await getDocs(collection(db, "clients"));
      const c = snap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setClients(c);
      if (c.length > 0) setClientId(c[0].id);
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !appUser) return;
    
    setLoading(true);
    try {
      let finalClientId = clientId;
      if (!finalClientId && clients.length === 0) {
        // Create a dummy client if none exists
        const clientRef = await addDoc(collection(db, "clients"), {
          name: "New Client",
          email: "client@example.com",
          createdAt: serverTimestamp(),
          createdBy: appUser.uid,
        });
        finalClientId = clientRef.id;
      }

      await addDoc(collection(db, "deals"), {
        title: title.trim(),
        clientId: finalClientId,
        value: parseFloat(value) || 0,
        stage: "lead",
        createdAt: serverTimestamp(),
        creatorId: appUser.uid,
      });
      onClose();
    } catch (error) {
      console.error("Error adding lead: ", error);
      alert("Failed to add lead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-secondary-bg border border-primary-text/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">New Lead</h2>
          <button onClick={onClose} className="text-primary-text/50 hover:text-primary-text">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text/70 mb-1">Deal Title</label>
            <input
              type="text"
              required
              className="w-full bg-primary-bg border border-primary-text/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q3 Marketing Campaign"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-primary-text/70 mb-1">Client</label>
            {clients.length > 0 ? (
              <select
                className="w-full bg-primary-bg border border-primary-text/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
             <div className="text-sm text-primary-text/50 italic">
               No clients found. A default client will be created.
             </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-primary-text/70 mb-1">Estimated Value ($)</label>
            <input
              type="number"
              className="w-full bg-primary-bg border border-primary-text/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., 5000"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-text/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-green text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-green/90 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
