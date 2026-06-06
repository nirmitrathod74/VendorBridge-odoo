import api from "../api/client";

export async function approveApproval(id, remarks = "Approved") {
  const { data } = await api.post(`/approvals/${id}/approve/`, { remarks });
  return data;
}

export async function rejectApproval(id, remarks = "Rejected") {
  const { data } = await api.post(`/approvals/${id}/reject/`, { remarks });
  return data;
}

export async function generateInvoice(purchaseOrderId) {
  const { data } = await api.post(`/purchase-orders/${purchaseOrderId}/generate-invoice/`);
  return data;
}

export async function sendInvoiceEmail(invoiceId) {
  const { data } = await api.post(`/invoices/${invoiceId}/send-email/`);
  return data;
}

export async function confirmPO(id) {
  const { data } = await api.post(`/purchase-orders/${id}/confirm/`);
  return data;
}

export async function cancelPO(id) {
  const { data } = await api.post(`/purchase-orders/${id}/cancel/`);
  return data;
}

export async function markInvoicePaid(id) {
  const { data } = await api.post(`/invoices/${id}/mark-paid/`);
  return data;
}

export async function markInvoiceOverdue(id) {
  const { data } = await api.post(`/invoices/${id}/mark-overdue/`);
  return data;
}

export async function cancelInvoice(id) {
  const { data } = await api.post(`/invoices/${id}/cancel/`);
  return data;
}
