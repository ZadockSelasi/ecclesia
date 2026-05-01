import React, { useState, useEffect } from "react";
import { useStore } from "../hooks/useStore";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Loader2, Palette, Clock, CheckCircle } from "lucide-react";
import { clsx } from "clsx";

export default function Designer() {
  const { appUser } = useStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      where("department", "==", "designer"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dbTasks: any[] = [];
        snapshot.forEach((doc) => {
          dbTasks.push({ id: doc.id, ...doc.data() });
        });
        setTasks(dbTasks);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "tasks");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-brand-green bg-brand-green/10";
      case "in_progress":
        return "text-blue-400 bg-blue-400/10";
      default:
        return "text-orange-400 bg-orange-400/10";
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Designer Workspace
          </h1>
          <p className="text-primary-text/40 text-sm mt-1">
            Manage all your design tasks, uploads, and statuses.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-primary-text/50 font-medium">Pending Tasks</h3>
            <Clock size={16} className="text-orange-400" />
          </div>
          <p className="text-3xl font-bold">
            {tasks.filter((t) => t.status === "todo").length}
          </p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-primary-text/50 font-medium">In Progress</h3>
            <Palette size={16} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold">
            {tasks.filter((t) => t.status === "in_progress").length}
          </p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-primary-text/50 font-medium">Completed</h3>
            <CheckCircle size={16} className="text-brand-green" />
          </div>
          <p className="text-3xl font-bold">
            {tasks.filter((t) => t.status === "completed").length}
          </p>
        </div>
      </div>

      <div className="glass-panel flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-primary-text/10 bg-primary-bg/50">
          <h2 className="font-semibold">My Assigned Designs</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-primary-text/30">
              <Palette size={32} className="mb-2 opacity-50" />
              <p>No design tasks currently assigned.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border border-primary-text/10 rounded-xl hover:border-brand-green/30 transition-colors bg-secondary-bg"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={clsx(
                        "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-sm",
                        getStatusColor(task.status),
                      )}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                    {task.priority === "urgent" && (
                      <span className="text-[10px] font-bold tracking-wider uppercase text-red-400 bg-red-400/10 px-2 py-0.5 rounded-sm">
                        Urgent
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium mb-2">{task.title}</h4>
                  <p className="text-xs text-primary-text/50">
                    {task.description || "No specific details provided."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
