import { useState, useEffect } from "react";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { formatTimeAgo } from "../lib/utils";
import { LeadModal } from "../components/modals/LeadModal";

interface Deal {
  id: string;
  title: string;
  clientId: string;
  value: number;
  stage: string;
  createdAt: number;
}

interface ExternalClient {
  id: string;
  name: string;
  email: string;
}

export default function Sales() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [clients, setClients] = useState<Record<string, ExternalClient>>({});
  const [loading, setLoading] = useState(true);
  const [showLeadModal, setShowLeadModal] = useState(false);

  useEffect(() => {
    // Fetch clients
    const qClients = query(collection(db, "clients"));
    const unsubClients = onSnapshot(
      qClients,
      (snap) => {
        const cData: Record<string, ExternalClient> = {};
        snap.forEach((d) => {
          cData[d.id] = { id: d.id, ...d.data() } as ExternalClient;
        });
        setClients(cData);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "clients"),
    );

    // Fetch deals
    const qDeals = query(collection(db, "deals"));
    const unsubDeals = onSnapshot(
      qDeals,
      (snap) => {
        const dData: Deal[] = [];
        snap.forEach((d) => {
          dData.push({ id: d.id, ...d.data() } as Deal);
        });
        setDeals(dData);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "deals");
        setLoading(false);
      },
    );

    return () => {
      unsubClients();
      unsubDeals();
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales & CRM</h1>
          <p className="text-primary-text/40 text-sm mt-1">
            Manage leads, negotiations, and closed deals.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-text/40"
              size={16}
            />
            <input
              type="text"
              placeholder="Search clients..."
              className="glass-input pl-10 text-sm py-2"
            />
          </div>
          <button onClick={() => setShowLeadModal(true)} className="btn-primary text-sm py-2">
            <Plus size={16} /> New Lead
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-primary-text/5 bg-primary-text/5">
          <div className="flex gap-6 text-sm font-medium">
            <button className="text-brand-green border-b border-brand-green pb-1.5">
              All Deals
            </button>
          </div>
          <button className="text-primary-text/40 hover:text-primary-text px-2 py-1 rounded-md bg-primary-text/5 flex items-center gap-2 text-xs">
            <Filter size={14} /> Filter
          </button>
        </div>

        <div className="flex-1 overflow-auto p-0">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-primary-bg text-primary-text/40 sticky top-0 border-b border-primary-text/5">
                <tr>
                  <th className="font-medium p-4">Deal Title</th>
                  <th className="font-medium p-4">Client</th>
                  <th className="font-medium p-4">Stage</th>
                  <th className="font-medium p-4">Value</th>
                  <th className="font-medium p-4">Created</th>
                  <th className="font-medium p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-primary-text/40"
                    >
                      No deals found
                    </td>
                  </tr>
                ) : (
                  deals.map((deal) => {
                    const client = clients[deal.clientId];
                    return (
                      <tr
                        key={deal.id}
                        className="hover:bg-primary-text/5 transition-colors group"
                      >
                        <td className="p-4 font-medium">{deal.title}</td>
                        <td className="p-4 text-primary-text/50">
                          {client ? client.name : "Unknown Client"}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-brand-green/10 text-brand-green capitalize">
                            {deal.stage.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-4">${deal.value?.toLocaleString()}</td>
                        <td className="p-4 text-primary-text/50">
                          {deal.createdAt
                            ? formatTimeAgo(deal.createdAt)
                            : ""}
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-brand-green font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {showLeadModal && <LeadModal onClose={() => setShowLeadModal(false)} />}
    </div>
  );
}
