import { useEffect, useState } from "react";

import StatusBadge from "../components/ui/StatusBadge";
import { listInvoices } from "../services/listService";
import { sendInvoiceEmail, markInvoicePaid, markInvoiceOverdue, cancelInvoice } from "../services/workflowService";
import { useAuth } from "../store/auth";
import { canManageProcurement } from "../utils/roles";

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const load = () => listInvoices().then(setInvoices);
  useEffect(() => { load(); }, []);

  const sendEmail = async (id) => {
    try {
      await sendInvoiceEmail(id);
      setSuccessMsg("Invoice email successfully queued for delivery.");
      setTimeout(() => setSuccessMsg(""), 4000);
      load();
    } catch (err) {
      alert("Failed to queue email.");
    }
  };

  const onMarkPaid = async (id) => {
    if(confirm("Mark this invoice as Paid?")) {
      await markInvoicePaid(id);
      load();
    }
  };

  const onMarkOverdue = async (id) => {
    if(confirm("Mark this invoice as Overdue?")) {
      await markInvoiceOverdue(id);
      load();
    }
  };

  const onCancel = async (id) => {
    if(confirm("Cancel this Invoice?")) {
      await cancelInvoice(id);
      load();
    }
  };

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="font-page-title text-page-title text-on-background m-0">Invoices</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            Track transaction billing logs, payment due deadlines, and send reminders.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-[#E6F4EA] text-[#137333] px-4 py-3 rounded-lg border border-[#CEEAD6] flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Invoices Table Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow overflow-hidden">
        <div className="p-5 border-b border-[#E9ECEF] bg-surface-bright flex justify-between items-center">
          <h3 className="font-card-title text-base font-bold text-on-surface m-0">Billing Records</h3>
          <span className="text-xs text-on-surface-variant font-semibold bg-surface-container px-2.5 py-1 rounded-full">
            {invoices.length} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F3F5] text-on-surface-variant font-semibold text-xs border-b border-[#E9ECEF]">
                <th className="p-4">Invoice Number</th>
                <th className="p-4">Purchase Order</th>
                <th className="p-4">Invoice Date</th>
                <th className="p-4">Due Date</th>
                <th className="p-4 text-right">Invoice Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-main text-xs">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[#E9ECEF] hover:bg-surface-container-low transition-colors min-h-[48px]">
                  <td className="p-4 font-bold text-primary">{invoice.invoice_number}</td>
                  <td className="p-4 font-semibold text-on-surface-variant">{invoice.purchase_order}</td>
                  <td className="p-4 text-on-surface-variant">{invoice.invoice_date}</td>
                  <td className="p-4 text-on-surface-variant">{invoice.due_date || "-"}</td>
                  <td className="p-4 text-right font-bold text-on-surface font-mono">{formatCurrency(invoice.total || 0)}</td>
                  <td className="p-4 text-center">
                    <StatusBadge value={invoice.status} />
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    {invoice.pdf_file && (
                      <a 
                        href={invoice.pdf_file} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-primary hover:bg-primary-container p-1.5 rounded-lg mr-2 inline-flex align-middle"
                        title="Download PDF"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </a>
                    )}
                    {canManageProcurement(user) && (
                      <button 
                        onClick={() => sendEmail(invoice.id)} 
                        className="bg-primary text-on-primary rounded-lg py-1.5 px-3 hover:bg-[#5E3F57] transition-all text-xs font-semibold active:scale-95 duration-200 inline-flex items-center gap-1 align-middle mr-2"
                      >
                        <span className="material-symbols-outlined text-xs">mail</span> Send Email
                      </button>
                    )}
                    {canManageProcurement(user) && invoice.status !== "paid" && invoice.status !== "cancelled" && (
                      <button 
                        onClick={() => onMarkPaid(invoice.id)} 
                        className="bg-[#E6F4EA] text-[#137333] rounded-lg py-1.5 px-3 hover:bg-[#CEEAD6] transition-all text-xs font-semibold active:scale-95 duration-200 inline-flex items-center gap-1 mr-2 align-middle"
                      >
                        Mark Paid
                      </button>
                    )}
                    {canManageProcurement(user) && invoice.status === "sent" && (
                      <button 
                        onClick={() => onMarkOverdue(invoice.id)} 
                        className="bg-[#FEF7E0] text-[#B06000] rounded-lg py-1.5 px-3 hover:bg-[#FEEFC3] transition-all text-xs font-semibold active:scale-95 duration-200 inline-flex items-center gap-1 mr-2 align-middle"
                      >
                        Mark Overdue
                      </button>
                    )}
                    {canManageProcurement(user) && invoice.status !== "cancelled" && (
                      <button 
                        onClick={() => onCancel(invoice.id)} 
                        className="text-error hover:bg-error-container p-1.5 rounded-lg inline-flex align-middle transition-colors"
                        title="Cancel Invoice"
                      >
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!invoices.length && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-on-surface-variant font-medium">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
