import { useEffect, useState } from "react";

import StatusBadge from "../components/ui/StatusBadge";
import QuotationForm, { emptyQuotationForm } from "../forms/QuotationForm";
import { createQuotation, listQuotations, selectQuotationForApproval, submitQuotation } from "../services/quotationService";
import { listRFQs } from "../services/rfqService";
import { listVendors } from "../services/vendorService";
import { useAuth } from "../store/auth";
import { canManageProcurement } from "../utils/roles";

export default function QuotationsPage() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState(emptyQuotationForm);

  const load = () => {
    listQuotations().then(setQuotations);
    listRFQs().then(setRfqs);
    listVendors().then(setVendors);
  };
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    await createQuotation(form);
    setForm(emptyQuotationForm);
    load();
  };

  const action = async (id, endpoint) => {
    if (endpoint === "submit") {
      await submitQuotation(id);
    } else {
      await selectQuotationForApproval(id);
    }
    load();
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
          <h2 className="font-page-title text-page-title text-on-background m-0">Quotations</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            Review supplier bids, submit Quotations, and select preferred bids for approval.
          </p>
        </div>
      </div>

      <QuotationForm value={form} rfqs={rfqs} vendors={vendors} onChange={setForm} onSubmit={submit} />

      {/* Quotations List Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow overflow-hidden">
        <div className="p-5 border-b border-[#E9ECEF] bg-surface-bright flex justify-between items-center">
          <h3 className="font-card-title text-base font-bold text-on-surface m-0">Supplier Quotations</h3>
          <span className="text-xs text-on-surface-variant font-semibold bg-surface-container px-2.5 py-1 rounded-full">
            {quotations.length} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F3F5] text-on-surface-variant font-semibold text-xs border-b border-[#E9ECEF]">
                <th className="p-4">Quote Number</th>
                <th className="p-4">RFQ Number</th>
                <th className="p-4">Supplier</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-right">Tax</th>
                <th className="p-4 text-right">Total Offer</th>
                <th className="p-4 text-center">Delivery time</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-main text-xs">
              {quotations.map((quote) => (
                <tr key={quote.id} className="border-b border-[#E9ECEF] hover:bg-surface-container-low transition-colors min-h-[48px]">
                  <td className="p-4 font-bold text-primary">{quote.quotation_number}</td>
                  <td className="p-4 font-semibold text-on-surface-variant">{quote.rfq_number || "N/A"}</td>
                  <td className="p-4 text-on-surface font-semibold">{quote.vendor_name}</td>
                  <td className="p-4 text-right text-on-surface-variant font-mono">{formatCurrency(quote.price || 0)}</td>
                  <td className="p-4 text-right text-on-surface-variant font-mono">{formatCurrency(quote.tax || 0)}</td>
                  <td className="p-4 text-right text-on-surface font-bold font-mono">{formatCurrency(quote.total || 0)}</td>
                  <td className="p-4 text-center text-on-surface font-medium">{quote.delivery_days} days</td>
                  <td className="p-4 text-center">
                    <StatusBadge value={quote.status} />
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    {quote.status === "draft" && (
                      <button 
                        onClick={() => action(quote.id, "submit")} 
                        className="bg-primary text-on-primary rounded-lg py-1.5 px-3 hover:bg-[#5E3F57] transition-all text-xs font-semibold active:scale-95 duration-200"
                      >
                        Submit
                      </button>
                    )}
                    {canManageProcurement(user) && quote.status === "submitted" && (
                      <button 
                        onClick={() => action(quote.id, "select-for-approval")} 
                        className="bg-secondary text-on-secondary rounded-lg py-1.5 px-3 hover:bg-[#623958] transition-all text-xs font-semibold active:scale-95 duration-200"
                      >
                        Select for Approval
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!quotations.length && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-on-surface-variant font-medium">
                    No quotations found.
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
