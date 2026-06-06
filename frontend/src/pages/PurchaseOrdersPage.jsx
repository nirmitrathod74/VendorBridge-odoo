import { useEffect, useState } from "react";

import StatusBadge from "../components/ui/StatusBadge";
import { listPurchaseOrders } from "../services/listService";
import { generateInvoice, confirmPO, cancelPO } from "../services/workflowService";
import { useAuth } from "../store/auth";
import { canManageProcurement } from "../utils/roles";

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const load = () => listPurchaseOrders().then(setOrders);
  useEffect(() => { load(); }, []);

  const onGenerateInvoice = async (id) => {
    await generateInvoice(id);
    load();
  };

  const onConfirm = async (id) => {
    if(confirm("Confirm this Purchase Order?")) {
      await confirmPO(id);
      load();
    }
  };

  const onCancel = async (id) => {
    if(confirm("Cancel this Purchase Order?")) {
      await cancelPO(id);
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
          <h2 className="font-page-title text-page-title text-on-background m-0">Purchase Orders</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            Track official purchase commitments, validation statuses, and generate invoices.
          </p>
        </div>
      </div>

      {/* PO Table Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow overflow-hidden">
        <div className="p-5 border-b border-[#E9ECEF] bg-surface-bright flex justify-between items-center">
          <h3 className="font-card-title text-base font-bold text-on-surface m-0">Purchase Commitments</h3>
          <span className="text-xs text-on-surface-variant font-semibold bg-surface-container px-2.5 py-1 rounded-full">
            {orders.length} Solicitations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F3F5] text-on-surface-variant font-semibold text-xs border-b border-[#E9ECEF]">
                <th className="p-4">PO Number</th>
                <th className="p-4">Quotation Ref</th>
                <th className="p-4 text-right">Procurement Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-main text-xs">
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-[#E9ECEF] hover:bg-surface-container-low transition-colors min-h-[48px]">
                  <td className="p-4 font-bold text-primary">{order.po_number}</td>
                  <td className="p-4 font-semibold text-on-surface-variant">{order.quotation}</td>
                  <td className="p-4 text-right font-bold text-on-surface font-mono">{formatCurrency(order.total || 0)}</td>
                  <td className="p-4 text-center">
                    <StatusBadge value={order.status} />
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    {canManageProcurement(user) && order.status === "approved" && (
                      <button 
                        onClick={() => onGenerateInvoice(order.id)} 
                        className="bg-primary text-on-primary rounded-lg py-1.5 px-3 hover:bg-[#5E3F57] transition-all text-xs font-semibold active:scale-95 duration-200 inline-flex items-center gap-1 mr-2 align-middle"
                      >
                        <span className="material-symbols-outlined text-xs">receipt_long</span> Generate Invoice
                      </button>
                    )}
                    {canManageProcurement(user) && order.status === "approved" && (
                      <button 
                        onClick={() => onConfirm(order.id)} 
                        className="bg-[#E6F4EA] text-[#137333] rounded-lg py-1.5 px-3 hover:bg-[#CEEAD6] transition-all text-xs font-semibold active:scale-95 duration-200 inline-flex items-center gap-1 mr-2 align-middle"
                      >
                        Confirm
                      </button>
                    )}
                    {canManageProcurement(user) && ["approved", "confirmed"].includes(order.status) && (
                      <button 
                        onClick={() => onCancel(order.id)} 
                        className="text-error hover:bg-error-container p-1.5 rounded-lg inline-flex align-middle transition-colors"
                        title="Cancel PO"
                      >
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-on-surface-variant font-medium">
                    No purchase orders found.
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
