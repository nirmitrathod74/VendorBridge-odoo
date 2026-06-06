import { Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import ApprovalsPage from "./pages/ApprovalsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import DashboardPage from "./pages/DashboardPage";
import InvoicesPage from "./pages/InvoicesPage";
import LoginPage from "./pages/LoginPage";
import NotificationsPage from "./pages/NotificationsPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import QuotationsPage from "./pages/QuotationsPage";
import QuotationComparisonPage from "./pages/QuotationComparisonPage";
import ReportsPage from "./pages/ReportsPage";
import RFQsPage from "./pages/RFQsPage";
import SignupPage from "./pages/SignupPage";
import VendorsPage from "./pages/VendorsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

function ProtectedShell({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<ProtectedShell><DashboardPage /></ProtectedShell>} />
      <Route path="/vendors" element={<ProtectedShell><VendorsPage /></ProtectedShell>} />
      <Route path="/rfqs" element={<ProtectedShell><RFQsPage /></ProtectedShell>} />
      <Route path="/rfqs/:id/compare" element={<ProtectedShell><QuotationComparisonPage /></ProtectedShell>} />
      <Route path="/quotations" element={<ProtectedShell><QuotationsPage /></ProtectedShell>} />
      <Route path="/approvals" element={<ProtectedShell><ApprovalsPage /></ProtectedShell>} />
      <Route path="/purchase-orders" element={<ProtectedShell><PurchaseOrdersPage /></ProtectedShell>} />
      <Route path="/invoices" element={<ProtectedShell><InvoicesPage /></ProtectedShell>} />
      <Route path="/reports" element={<ProtectedShell><ReportsPage /></ProtectedShell>} />
      <Route path="/notifications" element={<ProtectedShell><NotificationsPage /></ProtectedShell>} />
      <Route path="/audit-logs" element={<ProtectedShell><AuditLogsPage /></ProtectedShell>} />
      <Route path="/profile" element={<ProtectedShell><ProfilePage /></ProtectedShell>} />
      <Route path="/settings" element={<ProtectedShell><SettingsPage /></ProtectedShell>} />
    </Routes>
  );
}
