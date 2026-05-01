import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Clock, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useStore } from "../hooks/useStore";
import { formatDistanceToNow } from "date-fns";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  department: string;
  deadline?: number;
  createdAt: number;
}

export default function Tasks() {
  const { appUser } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "tasks"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dbTasks: Task[] = [];
        snapshot.forEach((doc) => {
          dbTasks.push({ id: doc.id, ...doc.data() } as Task);
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

  const columns = [
    { id: "todo", title: "To Do", color: "border-primary-text/20" },
    { id: "in_progress", title: "In Progress", color: "border-brand-green/50" },
    { id: "completed", title: "Completed", color: "border-blue-500/50" },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-primary-text/40 text-sm mt-1">
            Manage deliverables across design and marketing.
          </p>
        </div>
        <button className="btn-primary text-sm py-2">
          <Plus size={16} /> New Task
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
        </div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div key={col.id} className="min-w-[320px] w-[320px] flex flex-col">
              <div
                className={clsx(
                  "flex items-center justify-between mb-4 border-b-2 pb-2",
                  col.color,
                )}
              >
                <h3 className="font-medium text-sm">{col.title}</h3>
                <span className="text-xs bg-primary-text/10 px-2 py-0.5 rounded-full">
                  {tasks.filter((t) => t.status === col.id).length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {tasks.filter((t) => t.status === col.id).length === 0 ? (
                  <div className="text-center p-4 border border-dashed border-primary-text/10 rounded-lg text-primary-text/30 text-sm">
                    No tasks
                  </div>
                ) : (
                  tasks
                    .filter((t) => t.status === col.id)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="glass-panel p-4 border border-primary-text/5 hover:border-brand-green/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span
                            className={clsx(
                              "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-sm",
                              task.priority === "urgent"
                                ? "bg-red-500/20 text-red-400"
                                : task.priority === "high"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-primary-text/10 text-primary-text/60",
                            )}
                          >
                            {task.priority || "NORMAL"}
                          </span>
                          <button className="text-primary-text/20 hover:text-primary-text opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                        <h4 className="font-medium leading-snug mb-3">
                          {task.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-primary-text/50 border-t border-primary-text/5 pt-3">
                          <span className="capitalize">
                            {task.department || "unassigned"}
                          </span>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {task.createdAt
                              ? formatDistanceToNow(task.createdAt, {
                                  addSuffix: true,
                                })
                              : "unknown"}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
