import { useState, useEffect } from "react";
import { useStore } from "../hooks/useStore";
import {
  Users,
  CheckSquare,
  DollarSign,
  Activity,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { formatTimeAgo } from "../lib/utils";

interface ActivityLog {
  id: string;
  userName: string;
  action: string;
  createdAt: number;
}

export default function Dashboard() {
  const { appUser } = useStore();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState(0);
  const [tasksDueToday, setTasksDueToday] = useState(0);
  const [pendingSales, setPendingSales] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    // Activities
    const qActs = query(
      collection(db, "activities"),
      orderBy("createdAt", "desc"),
      limit(15),
    );
    const unsubscribeActs = onSnapshot(
      qActs,
      (snapshot) => {
        const acts: ActivityLog[] = [];
        snapshot.forEach((doc) => {
          acts.push({ id: doc.id, ...doc.data() } as ActivityLog);
        });
        setActivities(acts);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "activities");
      },
    );

    // Simple Staff fetching for "Team performance"
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const u: any[] = [];
        snapshot.forEach((doc) => u.push({ id: doc.id, ...doc.data() }));
        setTeam(u);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "users");
      },
    );

    // Tasks fetching
    const unsubscribeTasks = onSnapshot(
      collection(db, "tasks"),
      (snapshot) => {
        let activeCount = 0;
        let dueTodayCount = 0;
        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        ).getTime();
        const endOfToday = startOfToday + 86400000;

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status !== "completed") {
            activeCount++;
          }
          if (
            data.deadline &&
            data.deadline >= startOfToday &&
            data.deadline <= endOfToday
          ) {
            dueTodayCount++;
          }
        });
        setActiveProjects(activeCount);
        setTasksDueToday(dueTodayCount);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "tasks"),
    );

    // Deals fetching
    const unsubscribeDeals = onSnapshot(
      collection(db, "deals"),
      (snapshot) => {
        let pending = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.stage !== "closed_won" && data.stage !== "closed_lost") {
            pending++;
          }
        });
        setPendingSales(pending);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "deals"),
    );

    // Transactions fetching
    const unsubscribeTransactions = onSnapshot(
      collection(db, "transactions"),
      (snapshot) => {
        let rev = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.type === "income") {
            rev += data.amount;
          }
        });
        setRevenue(rev);
      },
      (error) =>
        handleFirestoreError(error, OperationType.LIST, "transactions"),
    );

    return () => {
      unsubscribeActs();
      unsubscribeUsers();
      unsubscribeTasks();
      unsubscribeDeals();
      unsubscribeTransactions();
    };
  }, []);

  const stats = [
    {
      label: "Active Projects",
      value: activeProjects.toString(),
      icon: Activity,
      color: "text-brand-green",
      bg: "bg-brand-green/10",
    },
    {
      label: "Tasks Due Today",
      value: tasksDueToday.toString(),
      icon: CheckSquare,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
    {
      label: "Pending Sales",
      value: pendingSales.toString(),
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Revenue",
      value: `$${revenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-primary-text",
      bg: "bg-primary-text/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-primary-text/40 text-sm mt-1">
            Welcome back, {appUser?.displayName}. Here's what's happening today.
          </p>
        </div>
        <div className="text-sm font-medium px-3 py-1.5 rounded-full bg-primary-text/5 border border-primary-text/10 inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
          System Online
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-primary-text/50">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div
                className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  stat.bg,
                  stat.color,
                )}
              >
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 min-h-[400px]">
          <h3 className="font-semibold mb-4">Live Activity Feed</h3>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-primary-text/40">No activity yet.</p>
            ) : (
              activities.map((feed) => (
                <div
                  key={feed.id}
                  className="flex gap-3 items-start pb-4 border-b border-primary-text/5 last:border-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center shrink-0">
                    <span className="text-brand-green text-xs font-bold">
                      {feed.userName?.[0] || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{feed.userName}</span>{" "}
                      <span className="text-primary-text/60">
                        {feed.action}
                      </span>
                    </p>
                    <p className="text-xs text-brand-green mt-0.5">
                      {feed.createdAt
                        ? formatTimeAgo(feed.createdAt)
                        : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel p-6 min-h-[400px] flex flex-col">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity size={16} className="text-brand-green" />
            Team Performance
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4">
            <p className="text-xs text-primary-text/40 mb-2">
              Staff Registry fetched from database (real records only).
            </p>
            {team.length === 0 ? (
              <p className="text-sm text-primary-text/40 p-4">
                No data found in registry.
              </p>
            ) : (
              team.map((usr) => (
                <div
                  key={usr.id}
                  className="flex gap-3 items-center p-3 bg-primary-text/5 rounded-xl border border-primary-text/5"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center overflow-hidden">
                      {usr.photoURL ? (
                        <img
                          src={usr.photoURL}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-brand-green text-sm font-bold">
                          {usr.displayName?.[0] || "?"}
                        </span>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-primary-bg bg-green-500"></span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {usr.displayName} {appUser?.uid === usr.id && "(You)"}
                    </p>
                    <p className="text-xs text-primary-text/50 capitalize">
                      {usr.role}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
