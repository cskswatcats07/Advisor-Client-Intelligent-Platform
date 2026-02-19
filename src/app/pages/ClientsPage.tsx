import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../../shared/api/client";
import type { BankCatalogEntry, Client } from "../../shared/advisor-types";

export function ClientsPage() {
  const { session, user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [bankCatalog, setBankCatalog] = useState<BankCatalogEntry[]>([]);
  const [households, setHouseholds] = useState<Array<{ id: string; householdName: string }>>([]);
  const [newClient, setNewClient] = useState({
    householdId: "",
    fullName: "",
    email: "",
    riskProfile: "moderate" as "low" | "moderate" | "high",
    primaryBankCode: "",
    kycCompleted: false,
  });

  const load = async () => {
    if (!session) return;
    const [nextClients, nextHouseholds, banks] = await Promise.all([
      api.listClients(session),
      api.listHouseholds(session),
      api.bankCatalog(session),
    ]);
    setClients(nextClients);
    setHouseholds(nextHouseholds);
    setBankCatalog(banks.banks);
    if (!newClient.householdId && nextHouseholds[0]) {
      setNewClient((s) => ({ ...s, householdId: nextHouseholds[0].id }));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const createDemoHouseholdIfEmpty = async () => {
    if (!session || !user || households.length > 0) return;
    await api.createHousehold(session, {
      householdName: "New Household",
      primaryAdvisorUserId: user.id,
    });
    await load();
  };

  useEffect(() => {
    void createDemoHouseholdIfEmpty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [households.length, session, user?.id]);

  const onCreateClient = async () => {
    if (!session) return;
    await api.createClient(session, {
      householdId: newClient.householdId,
      fullName: newClient.fullName,
      email: newClient.email || undefined,
      primaryBankCode: newClient.primaryBankCode || undefined,
      riskProfile: newClient.riskProfile,
      kycCompleted: newClient.kycCompleted,
    });
    setNewClient((s) => ({ ...s, fullName: "", email: "", primaryBankCode: "" }));
    await load();
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Clients</h2>
        <p className="text-sm text-slate-600">
          Create and manage client records with KYC metadata and planning workspace links.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-medium text-slate-900">Create client</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Client full name"
            value={newClient.fullName}
            onChange={(e) => setNewClient((s) => ({ ...s, fullName: e.target.value }))}
          />
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Email"
            value={newClient.email}
            onChange={(e) => setNewClient((s) => ({ ...s, email: e.target.value }))}
          />
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={newClient.householdId}
            onChange={(e) => setNewClient((s) => ({ ...s, householdId: e.target.value }))}
          >
            {households.map((h) => (
              <option key={h.id} value={h.id}>
                {h.householdName}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={newClient.riskProfile}
            onChange={(e) =>
              setNewClient((s) => ({
                ...s,
                riskProfile: e.target.value as "low" | "moderate" | "high",
              }))
            }
          >
            <option value="low">low</option>
            <option value="moderate">moderate</option>
            <option value="high">high</option>
          </select>
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={newClient.primaryBankCode}
            onChange={(e) =>
              setNewClient((s) => ({ ...s, primaryBankCode: e.target.value }))
            }
          >
            <option value="">Primary bank (optional)</option>
            {bankCatalog.map((b) => (
              <option key={b.bankCode} value={b.bankCode}>
                {b.bankName}
              </option>
            ))}
          </select>
          <button
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
            disabled={!newClient.fullName || !newClient.householdId}
            onClick={onCreateClient}
          >
            Add client
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">KYC</th>
              <th className="px-4 py-2">Risk</th>
              <th className="px-4 py-2">Workspace</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-slate-100">
                <td className="px-4 py-2">{c.fullNameMasked}</td>
                <td className="px-4 py-2">{c.emailMasked ?? "-"}</td>
                <td className="px-4 py-2">{c.kycCompleted ? "Complete" : "Pending"}</td>
                <td className="px-4 py-2">{c.riskProfile ?? "-"}</td>
                <td className="px-4 py-2">
                  <Link to={`/clients/${c.id}`} className="text-slate-800 underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No clients yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
