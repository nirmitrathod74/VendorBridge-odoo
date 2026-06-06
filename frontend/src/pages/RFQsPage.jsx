import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import StatusBadge from "../components/ui/StatusBadge";
import RFQForm, { emptyRFQForm } from "../forms/RFQForm";
import { createRFQ, listRFQs, publishRFQ, closeRFQ, rejectRFQ, deleteRFQ } from "../services/rfqService";
import { listVendors } from "../services/vendorService";
import { useAuth } from "../store/auth";
import { canManageProcurement } from "../utils/roles";

export default function RFQsPage() {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState(emptyRFQForm);

  const load = () => {
    listRFQs().then(setRfqs);
    listVendors().then(setVendors);
  };
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    await createRFQ(form);
    setForm(emptyRFQForm);
    load();
  };

  const publish = async (id) => {
    await publishRFQ(id);
    load();
  };

  const close = async (id) => {
    if(confirm("Are you sure you want to close this RFQ?")) {
      await closeRFQ(id);
      load();
    }
  };

  const reject = async (id) => {
    if(confirm("Are you sure you want to reject this RFQ?")) {
      await rejectRFQ(id);
      load();
    }
  };

  const remove = async (id) => {
    if(confirm("Are you sure you want to delete this draft RFQ?")) {
      await deleteRFQ(id);
      load();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="font-page-title text-page-title text-on-background m-0">Requests for Quotations</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            Create RFQs, assign vendor targets, and publish them to invite bids.
          </p>
        </div>
      </div>

      {canManageProcurement(user) && (
        <RFQForm value={form} vendors={vendors} onChange={setForm} onSubmit={submit} />
      )}

      {/* RFQ List Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow overflow-hidden">
        <div className="p-5 border-b border-[#E9ECEF] bg-surface-bright flex justify-between items-center">
          <h3 className="font-card-title text-base font-bold text-on-surface m-0">Active Solicitations</h3>
          <span className="text-xs text-on-surface-variant font-semibold bg-surface-container px-2.5 py-1 rounded-full">
            {rfqs.length} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F3F5] text-on-surface-variant font-semibold text-xs border-b border-[#E9ECEF]">
                <th className="p-4">RFQ Number</th>
                <th className="p-4">Title</th>
                <th className="p-4">Submission Deadline</th>
                <th className="p-4 text-center">Bids Received</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-main text-xs">
              {rfqs.map((rfq) => (
                <tr key={rfq.id} className="border-b border-[#E9ECEF] hover:bg-surface-container-low transition-colors min-h-[48px]">
                  <td className="p-4 font-bold text-primary">{rfq.rfq_number}</td>
                  <td className="p-4 text-on-surface font-medium">{rfq.title}</td>
                  <td className="p-4 text-on-surface-variant">{rfq.deadline}</td>
                  <td className="p-4 text-center font-bold text-on-surface">{rfq.quotation_count || 0}</td>
                  <td className="p-4 text-center">
                    <StatusBadge value={rfq.status} />
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    {canManageProcurement(user) && rfq.status === "draft" && (
                      <>
                        <button 
                          onClick={() => publish(rfq.id)} 
                          className="bg-primary text-on-primary rounded-lg py-1.5 px-3 hover:bg-[#5E3F57] transition-all text-xs font-semibold active:scale-95 duration-200 inline-block mr-2 align-middle"
                        >
                          Publish
                        </button>
                        <button 
                          onClick={() => remove(rfq.id)} 
                          className="text-error hover:bg-error-container p-1.5 rounded-lg inline-flex align-middle transition-colors mr-2"
                          title="Delete Draft"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </>
                    )}
                    {canManageProcurement(user) && rfq.status === "published" && (
                      <button 
                        onClick={() => close(rfq.id)} 
                        className="border border-outline text-on-surface rounded-lg py-1.5 px-3 hover:bg-surface-container-high transition-all text-xs font-semibold active:scale-95 duration-200 inline-block mr-2 align-middle"
                      >
                        Close RFQ
                      </button>
                    )}
                    {canManageProcurement(user) && ["draft", "published", "pending_quotations"].includes(rfq.status) && (
                      <button 
                        onClick={() => reject(rfq.id)} 
                        className="text-error hover:bg-error-container p-1.5 rounded-lg inline-flex align-middle transition-colors mr-2"
                        title="Reject RFQ"
                      >
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                      </button>
                    )}
                    {["pending_quotations", "closed"].includes(rfq.status) && (
                      <Link 
                        to={`/rfqs/${rfq.id}/compare`}
                        className="bg-secondary-container text-on-secondary-container border border-outline-variant rounded-lg py-1.5 px-3 hover:bg-[#e6b3d5] transition-all text-xs font-semibold inline-block align-middle"
                      >
                        Compare Quotes
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {!rfqs.length && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-on-surface-variant font-medium">
                    No RFQs found.
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
