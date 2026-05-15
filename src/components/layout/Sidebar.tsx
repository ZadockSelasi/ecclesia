import { NavLink } from "react-router-dom";
import { useStore, ThemeMode } from "../../hooks/useStore";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  DollarSign,
  MessageSquare,
  Settings,
  LogOut,
  Hexagon,
  Sun,
  Moon,
  Monitor,
  Palette,
  Megaphone,
  X,
} from "lucide-react";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { appUser, theme, setTheme, hasNotification } = useStore();

  const handleLogout = async () => {
    const { logActivity } = await import("../../lib/activity");
    await logActivity("logged out", "user");
    signOut(auth);
  };

  const navItems = [
    {
      to: "/",
      icon: LayoutDashboard,
      label: "Command Center",
      roles: ["admin", "designer", "marketer", "sales", "finance"],
    },
    {
      to: "/designer",
      icon: Palette,
      label: "My Department",
      roles: ["admin", "designer"],
    },
    {
      to: "/marketer",
      icon: Megaphone,
      label: "My Department",
      roles: ["admin", "marketer"],
    },
    {
      to: "/sales",
      icon: Users,
      label: "My Department",
      roles: ["admin", "sales"],
    },
    {
      to: "/finance",
      icon: DollarSign,
      label: "My Department",
      roles: ["admin", "finance"],
    },
    {
      to: "/tasks",
      icon: CheckSquare,
      label: "Tasks Board",
      roles: ["admin", "designer", "marketer", "sales", "finance"],
    },
    {
      to: "/chat",
      icon: MessageSquare,
      label: "Messages",
      roles: ["admin", "designer", "marketer", "sales", "finance"],
    },
    { to: "/admin", icon: Settings, label: "Admin Tools", roles: ["admin"] },
  ];

  const visibleItems = navItems
    .filter((item) => appUser?.role && item.roles.includes(appUser.role))
    .map((item) => ({
      ...item,
      label:
        appUser?.role === "admin" && item.label === "My Department"
          ? item.to.split("/")[1].charAt(0).toUpperCase() +
            item.to.split("/")[1].slice(1)
          : item.label,
    }));

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-40 bg-primary-bg border-r border-primary-text/10 flex flex-col w-64 shrink-0 transition-transform duration-300 ease-in-out
        md:static md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="h-16 flex items-center justify-between px-6 border-b border-primary-text/10 overflow-hidden">
        <div className="flex items-center gap-2 text-brand-green font-bold text-lg tracking-wider">
          {/* Logo placeholder - upload logo.png to the public folder */}
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-brand-green/20">
            <img
              src="/logo.png"
              alt=""
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement!.innerHTML =
                  '<span class="text-brand-green">EB</span>';
              }}
            />
          </div>
          <span className="truncate">Ecclesiabranx</span>
        </div>
        <button 
          onClick={onClose}
          className="md:hidden text-primary-text/60 hover:text-primary-text"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "bg-brand-green/10 text-brand-green"
                  : "text-primary-text/60 hover:text-primary-text hover:bg-primary-text/5"
              }`
            }
          >
            <div className="relative">
              <item.icon size={18} />
              {item.to === "/chat" && hasNotification && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-primary-bg"></span>
              )}
            </div>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-2 border-t border-primary-text/10 flex justify-center gap-2">
        {(["light", "dark", "system"] as ThemeMode[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`p-2 rounded-lg transition-colors ${
              theme === t
                ? "bg-brand-green/20 text-brand-green"
                : "text-primary-text/40 hover:text-primary-text hover:bg-primary-text/5"
            }`}
            title={`Switch to ${t} mode`}
          >
            {t === "light" && <Sun size={16} />}
            {t === "dark" && <Moon size={16} />}
            {t === "system" && <Monitor size={16} />}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-primary-text/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-colors text-sm font-medium text-primary-text/60 hover:text-red-500 hover:bg-red-500/10"
        >
          <LogOut size={18} />
          Sign Out
        </button>
        <button
          onClick={async () => {
            const { deleteDoc, doc } = await import("firebase/firestore");
            const { db } = await import("../../lib/firebase");
            if (appUser) {
              await deleteDoc(doc(db, "users", appUser.uid));
            }
            await signOut(auth);
          }}
          className="mt-2 flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-colors text-sm font-medium text-primary-text/60 hover:text-orange-500 hover:bg-orange-500/10"
          title="Deletes your profile so you can register again"
        >
          <LogOut size={18} />
          Reset Profile
        </button>
      </div>
    </aside>
  );
}
