import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../shared/api/client";
import { useAuth } from "../auth";
import { Disclaimer } from "../../components/Disclaimer";

export function LoginPage() {
  const { setAuth, session } = useAuth();
  const [organizationId, setOrganizationId] = useState("");
  const [email, setEmail] = useState("");
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ email: string; organizationId: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .bootstrap()
      .then((data) => {
        setOrganizations(data.organizations);
        setUsers(data.users);
        if (data.organizations[0]) setOrganizationId(data.organizations[0].id);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to bootstrap auth."),
      );
  }, []);

  useEffect(() => {
    if (session) navigate("/dashboard");
  }, [navigate, session]);

  const filteredEmails = useMemo(
    () => users.filter((u) => u.organizationId === organizationId).map((u) => u.email),
    [users, organizationId],
  );

  const onSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.login(organizationId, email);
      setAuth(
        {
          organizationId: result.authHeaders["x-org-id"],
          userId: result.authHeaders["x-user-id"],
        },
        result.user,
      );
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">ACIP — Advisor Sign-in</h2>
      <p className="mt-1 text-sm text-slate-600">
        Sign in to the Advisor Client Intelligence Platform with your organization and role.
      </p>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-700">Organization</span>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-slate-700">Email</span>
          <input
            list="emails"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="advisor@nmaple.ca"
          />
          <datalist id="emails">
            {filteredEmails.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          disabled={loading || !organizationId || !email}
          onClick={onSubmit}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
      <div className="mt-6">
        <Disclaimer />
      </div>
    </div>
  );
}
