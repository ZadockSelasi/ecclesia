import { useStore } from "../../hooks/useStore";
import { Bell, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { appUser } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const workspaces = [
    { name: "Designer View", path: "/designer" },
    { name: "Marketer View", path: "/marketer" },
    { name: "Sales View", path: "/sales" },
    { name: "Finance View", path: "/finance" },
  ];

  return (
    <header className="h-16 border-b border-primary-text/10 bg-brand-black flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-4">
        {appUser?.role === "admin" && (
          <div className="relative z-50" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-sm font-medium bg-primary-text/5 hover:bg-primary-text/10 px-3 py-1.5 rounded-lg border border-primary-text/10 transition-colors"
            >
              Switch Workspace <ChevronDown size={14} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-primary-bg border border-primary-text/10 rounded-xl shadow-xl overflow-hidden py-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws.path}
                    onClick={() => {
                      navigate(ws.path);
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-primary-text/5 transition-colors"
                  >
                    {ws.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <button className="text-primary-text/60 hover:text-primary-text transition-colors relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-green rounded-full"></span>
        </button>
        <div className="flex items-center gap-3 pl-6 border-l border-primary-text/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{appUser?.displayName}</p>
            <p className="text-xs text-primary-text/40 capitalize">
              {appUser?.role}
            </p>
          </div>
          {appUser?.photoURL ? (
            <img
              src={appUser.photoURL}
              alt="Avatar"
              className="w-9 h-9 rounded-full border border-primary-text/20"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-green text-[#050505] flex items-center justify-center font-bold">
              {appUser?.displayName?.[0] || "U"}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
