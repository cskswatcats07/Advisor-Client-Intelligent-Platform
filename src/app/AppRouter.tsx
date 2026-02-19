import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth } from "./auth";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ClientsPage } from "./pages/ClientsPage";
import { ClientWorkspacePage } from "./pages/ClientWorkspacePage";
import { PlansPage } from "./pages/PlansPage";
import { CompliancePage } from "./pages/CompliancePage";
import { EthicsPage } from "./pages/EthicsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PortalViewPage } from "./pages/PortalViewPage";

function Protected({ children }: { children: ReactElement }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/portal/:token" element={<PortalViewPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:clientId" element={<ClientWorkspacePage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="compliance" element={<CompliancePage />} />
        <Route path="ethics" element={<EthicsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
