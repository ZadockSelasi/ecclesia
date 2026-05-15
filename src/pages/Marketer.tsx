import React, { useState, useEffect } from "react";
import { useStore } from "../hooks/useStore";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Loader2, Megaphone, Calendar, TrendingUp, MoreHorizontal } from "lucide-react";
import { clsx } from "clsx";

export default function Marketer() {
  const { appUser } = useStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      where("department", "==", "marketing"),
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

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
      setOpenMenuId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "tasks");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      setOpenMenuId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "tasks");
    }
  };

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
            Marketer Workspace
          </h1>
          <p className="text-primary-text/40 text-sm mt-1">
            Manage campaigns, content calendar, and scheduling.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-primary-text/50 font-medium">
              Active Campaigns
            </h3>
            <Megaphone size={16} className="text-purple-400" />
          </div>
          <p className="text-3xl font-bold">
            {tasks.filter((t) => t.status !== "completed").length}
          </p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-primary-text/50 font-medium">
              Scheduled Posts
            </h3>
            <Calendar size={16} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-primary-text/50 font-medium">
              Engagement Rate
            </h3>
            <TrendingUp size={16} className="text-brand-green" />
          </div>
          <p className="text-3xl font-bold">0%</p>
        </div>
      </div>

      <div className="glass-panel flex-1 flex flex-col overflow-hidden relative">
        {openMenuId && (
          <div 
            className="fixed inset-0 z-[80]" 
            onClick={() => setOpenMenuId(null)} 
          />
        )}
        <div className="p-4 border-b border-primary-text/10 bg-primary-bg/50">
          <h2 className="font-semibold">Marketing Tasks</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-primary-text/30">
              <Megaphone size={32} className="mb-2 opacity-50" />
              <p>No marketing tasks currently active.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={clsx(
                    "p-4 border border-primary-text/10 rounded-xl hover:border-brand-green/30 transition-colors bg-secondary-bg relative",
                    openMenuId === task.id ? "z-[85]" : "z-0"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1 items-start">
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
                    <div className="relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                        className="text-primary-text/40 hover:text-primary-text transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {openMenuId === task.id && (
                        <div className="absolute top-full right-0 mt-1 w-36 bg-secondary-bg border border-primary-text/10 rounded-lg shadow-xl z-[90] py-1 flex flex-col items-start overflow-hidden">
                          {task.status !== "todo" && (
                            <button onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, "todo"); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary-text/5 cursor-pointer relative z-10">
                              Move to To Do
                            </button>
                          )}
                          {task.status !== "in_progress" && (
                            <button onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, "in_progress"); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary-text/5 cursor-pointer relative z-10">
                              In Progress
                            </button>
                          )}
                          {task.status !== "completed" && (
                            <button onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, "completed"); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary-text/5 cursor-pointer relative z-10">
                              Completed
                            </button>
                          )}
                          <hr className="w-full border-primary-text/10 my-1 relative z-10" />
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-500/10 text-red-500 cursor-pointer relative z-10">
                            Delete Task
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <h4 className="font-medium mb-2">{task.title}</h4>
                  <p className="text-xs text-primary-text/50 line-clamp-3">
                    {task.description ||
                      "No specific details provided for this campaign/task."}
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
