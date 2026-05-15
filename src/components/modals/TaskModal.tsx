import React, { useState } from "react";
import { X } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useStore } from "../../hooks/useStore";

interface TaskModalProps {
  onClose: () => void;
}

export function TaskModal({ onClose }: TaskModalProps) {
  const { appUser } = useStore();
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("design");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !appUser) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, "tasks"), {
        title: title.trim(),
        department,
        priority,
        status: "todo",
        createdAt: serverTimestamp(),
        creatorId: appUser.uid,
      });
      onClose();
    } catch (error) {
      console.error("Error adding task: ", error);
      alert("Failed to add task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-secondary-bg border border-primary-text/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">New Task</h2>
          <button onClick={onClose} className="text-primary-text/50 hover:text-primary-text">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-text/70 mb-1">Title</label>
            <input
              type="text"
              required
              className="w-full bg-primary-bg border border-primary-text/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Design new landing page"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-primary-text/70 mb-1">Department</label>
            <select
              className="w-full bg-primary-bg border border-primary-text/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="sales">Sales</option>
              <option value="finance">Finance</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-primary-text/70 mb-1">Priority</label>
            <select
              className="w-full bg-primary-bg border border-primary-text/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
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
              {loading ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
