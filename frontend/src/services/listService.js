import api, { getResults } from "../api/client";

export async function listApprovals() {
  const { data } = await api.get("/approvals/");
  return getResults(data);
}

export async function listPurchaseOrders() {
  const { data } = await api.get("/purchase-orders/");
  return getResults(data);
}

export async function listInvoices() {
  const { data } = await api.get("/invoices/");
  return getResults(data);
}

export async function listNotifications() {
  const { data } = await api.get("/notifications/");
  return getResults(data);
}

export async function listAuditLogs() {
  const { data } = await api.get("/audit-logs/");
  return getResults(data);
}
