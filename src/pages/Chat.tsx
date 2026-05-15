import React, { useState, useEffect } from "react";
import { Send, Hash, Users, Plus, Loader2 } from "lucide-react";
import { useStore } from "../hooks/useStore";
import { clsx } from "clsx";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { formatTimeAgo } from "../lib/utils";

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export default function Chat() {
  const { appUser, setHasNotification } = useStore();
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState("general");
  const [isDM, setIsDM] = useState(false);
  const [dmUser, setDmUser] = useState<any>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear notifications when entering Chat
    setHasNotification(false);
    localStorage.setItem("lastSeenMessagesTime", Date.now().toString());
    
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const u: Record<string, any> = {};
        snap.forEach((d) => {
          u[d.id] = d.data();
        });
        setUsers(u);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "users"),
    );
    return () => unsubUsers();
  }, []);

  useEffect(() => {
    if (!appUser) return;
    setLoading(true);
    let channelId = activeChannel;

    if (isDM && dmUser) {
      // Create a consistent DM channel ID from two UIDs
      const ids = [appUser.uid, dmUser.uid].sort();
      channelId = `dm_${ids[0]}_${ids[1]}`;
    }

    const q = query(
      collection(db, "messages"),
      where("channelId", "==", channelId),
      orderBy("createdAt", "asc"),
    );

    const unsubMsgs = onSnapshot(
      q,
      (snap) => {
        const m: Message[] = [];
        snap.forEach((d) => {
          m.push({ id: d.id, ...d.data() } as Message);
        });
        setMessages(m);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "messages");
        setLoading(false);
      },
    );

    return () => {
      unsubMsgs();
    };
  }, [activeChannel, isDM, dmUser, appUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || !appUser) return;
    try {
      let channelId = activeChannel;
      if (isDM && dmUser) {
        const ids = [appUser.uid, dmUser.uid].sort();
        channelId = `dm_${ids[0]}_${ids[1]}`;
      }

      await addDoc(collection(db, "messages"), {
        channelId,
        senderId: appUser.uid,
        text: msg,
        createdAt: Date.now(),
      });
      setMsg("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-full gap-4 -mx-4 -my-4 md:-mx-8 md:-my-8 px-4 py-4 md:px-8 md:py-8">
      {/* Channels Sidebar */}
      <div className="w-64 glass-panel flex flex-col hidden md:flex shrink-0 border-primary-text/5">
        <div className="p-4 border-b border-primary-text/5 flex justify-between items-center bg-primary-text/5">
          <span className="font-semibold text-sm">Channels</span>
          <button className="text-primary-text/40 hover:text-primary-text">
            <Plus size={16} />
          </button>
        </div>
        <div className="p-2 space-y-1">
          {["general", "design-team", "marketing-updates", "announcements"].map(
            (ch) => (
              <button
                key={ch}
                onClick={() => {
                  setActiveChannel(ch);
                  setIsDM(false);
                  setDmUser(null);
                }}
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 transition-colors",
                  !isDM && activeChannel === ch
                    ? "bg-brand-green/10 text-brand-green font-medium"
                    : "text-primary-text/60 hover:text-primary-text hover:bg-primary-text/5",
                )}
              >
                <Hash
                  size={14}
                  className={
                    !isDM && activeChannel === ch ? "text-brand-green" : ""
                  }
                />{" "}
                {ch}
              </button>
            ),
          )}
        </div>
        <div className="p-4 border-b border-primary-text/5 flex justify-between items-center bg-primary-text/5 mt-auto">
          <span className="font-semibold text-sm flex items-center gap-2">
            <Users size={14} /> Direct Messages
          </span>
          <button className="text-primary-text/40 hover:text-primary-text">
            <Plus size={16} />
          </button>
        </div>
        <div className="p-2 space-y-1 overflow-y-auto max-h-[200px]">
          {Object.values(users)
            .filter((u: any) => u.uid !== appUser?.uid)
            .map((usr: any) => {
              const online = usr.isOnline && (Date.now() - (usr.lastActive || 0) < 120000);
              return (
                <button
                  key={usr.uid}
                  onClick={() => {
                    setIsDM(true);
                    setDmUser(usr);
                    setActiveChannel("");
                  }}
                  className={clsx(
                    "w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors",
                    isDM && dmUser?.uid === usr.uid
                      ? "bg-brand-green/10 text-brand-green font-medium"
                      : "text-primary-text/60 hover:text-primary-text hover:bg-primary-text/5",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className={clsx(
                        "w-2 h-2 rounded-full",
                        online ? "bg-brand-green shadow-[0_0_8px_rgba(20,184,101,0.8)]" : "bg-primary-text/20"
                      )}
                    ></span>{" "}
                    {usr.displayName}
                  </div>
                  {online && <span className="text-[10px] uppercase font-bold text-brand-green">Online</span>}
                </button>
              );
            })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass-panel flex flex-col border-primary-text/5">
        <div className="p-4 border-b border-primary-text/5 bg-primary-text/5 flex items-center gap-3">
          {isDM ? (() => {
            const currentDmUser = users[dmUser?.uid] || dmUser;
            const online = currentDmUser?.isOnline && (Date.now() - (currentDmUser?.lastActive || 0) < 120000);
            return (
            <>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-brand-green/20 overflow-hidden flex items-center justify-center shrink-0 border border-brand-green/30">
                  {currentDmUser?.photoURL ? (
                    <img
                      src={currentDmUser.photoURL}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-brand-green font-bold flex items-center justify-center h-full w-full">
                      {currentDmUser?.displayName?.[0] || "?"}
                    </span>
                  )}
                </div>
                <span 
                  className={clsx(
                    "absolute -bottom-1 -right-1 w-3 h-3 border-2 border-secondary-bg rounded-full",
                    online ? "bg-brand-green shadow-[0_0_8px_rgba(20,184,101,0.8)]" : "bg-primary-text/20"
                  )}
                ></span>
              </div>
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  {currentDmUser?.displayName}
                  <span className={clsx(
                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full",
                    online ? "bg-brand-green/10 text-brand-green" : "bg-primary-text/10 text-primary-text/40"
                  )}>{online ? "Online" : "Offline"}</span>
                </h2>
                <p className="text-xs text-primary-text/40 capitalize">
                  {currentDmUser?.role || "Team Member"}
                </p>
              </div>
            </>
          );})() : (
            <>
              <Hash size={20} className="text-brand-green" />
              <div>
                <h2 className="font-semibold">{activeChannel}</h2>
                <p className="text-xs text-primary-text/40">
                  {activeChannel === "general" &&
                    "Company-wide announcements and general chat."}
                  {activeChannel === "design-team" &&
                    "All things related to pixels, colors, and layouts."}
                  {activeChannel === "marketing-updates" &&
                    "Campaigns, reach, and engagement numbers."}
                  {activeChannel === "announcements" &&
                    "Important company-wide updates."}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Chat Messages */}
          {loading ? (
            <div className="flex justify-center flex-1 h-full items-center">
              <Loader2 className="animate-spin text-primary-text/50 w-8 h-8" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-primary-text/40 my-10">
              No messages in {isDM ? dmUser?.displayName : `#${activeChannel}`}
            </div>
          ) : (
            messages.map((m) => {
              const u = users[m.senderId];
              return (
                <div key={m.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-green/20 overflow-hidden flex items-center justify-center shrink-0 border border-brand-green/30">
                    {u?.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-brand-green font-bold">
                        {u?.displayName?.[0] || "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {u?.displayName || "Unknown"}
                      </span>
                      <span
                        className={clsx(
                          "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded",
                          u?.role === "admin"
                            ? "bg-red-500/20 text-red-500"
                            : "bg-primary-text/10 text-primary-text/40",
                        )}
                      >
                        {u?.role || "user"}
                      </span>
                      <span className="text-xs text-primary-text/40 ml-2">
                        {m.createdAt
                          ? formatTimeAgo(m.createdAt)
                          : ""}
                      </span>
                    </div>
                    <p className="text-sm text-primary-text/80 leading-relaxed bg-primary-text/5 p-3 rounded-2xl rounded-tl-sm inline-block">
                      {m.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-primary-text/5 bg-primary-text/5">
          <form className="flex gap-2" onSubmit={handleSend}>
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder={`Message ${isDM ? dmUser?.displayName : "#" + activeChannel}...`}
              className="glass-input !bg-secondary-bg/50"
            />
            <button
              type="submit"
              className="w-11 h-11 bg-brand-green hover:bg-brand-green-dark text-black flex items-center justify-center rounded-lg transition-colors shrink-0"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
