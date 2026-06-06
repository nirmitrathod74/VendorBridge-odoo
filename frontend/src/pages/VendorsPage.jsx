import { useEffect, useState } from "react";

import StatusBadge from "../components/ui/StatusBadge";
import VendorForm, { emptyVendorForm } from "../forms/VendorForm";
import { createVendor, listVendors } from "../services/vendorService";
import { useAuth } from "../store/auth";
import { canManageProcurement } from "../utils/roles";

export default function VendorsPage() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState(emptyVendorForm);

  const load = () => listVendors().then(setVendors);
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    await createVendor(form);
    setForm(emptyVendorForm);
    load();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="font-page-title text-page-title text-on-background m-0">Vendor Management</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            Review registered supplier partnerships, onboarding verification status, and ratings.
          </p>
        </div>
      </div>

      {canManageProcurement(user) && (
        <VendorForm value={form} onChange={setForm} onSubmit={submit} />
      )}

      {/* Structured Data Table Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow overflow-hidden">
        <div className="p-5 border-b border-[#E9ECEF] bg-surface-bright flex justify-between items-center">
          <h3 className="font-card-title text-base font-bold text-on-surface m-0">All Suppliers</h3>
          <span className="text-xs text-on-surface-variant font-semibold bg-surface-container px-2.5 py-1 rounded-full">
            {vendors.length} Total
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F3F5] text-on-surface-variant font-semibold text-xs border-b border-[#E9ECEF]">
                <th className="p-4">Company</th>
                <th className="p-4">Primary Contact</th>
                <th className="p-4">Email</th>
                <th className="p-4">GST Number</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Rating</th>
              </tr>
            </thead>
            <tbody className="font-body-main text-xs">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="border-b border-[#E9ECEF] hover:bg-surface-container-low transition-colors min-h-[48px]">
                  <td className="p-4 font-bold text-primary">{vendor.company_name}</td>
                  <td className="p-4 text-on-surface font-medium">{vendor.name}</td>
                  <td className="p-4 text-on-surface-variant">{vendor.email}</td>
                  <td className="p-4 font-mono text-on-surface-variant">{vendor.gst_number || "N/A"}</td>
                  <td className="p-4 text-center">
                    <StatusBadge value={vendor.status} />
                  </td>
                  <td className="p-4 text-center font-bold text-secondary">
                    {vendor.rating ? `${vendor.rating} / 5` : "Unrated"}
                  </td>
                </tr>
              ))}
              {!vendors.length && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-on-surface-variant font-medium">
                    No vendors registered yet.
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
