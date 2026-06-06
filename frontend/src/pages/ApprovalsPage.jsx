import { useEffect, useState } from "react";

import StatusBadge from "../components/ui/StatusBadge";
import { listApprovals } from "../services/listService";
import { approveApproval, rejectApproval } from "../services/workflowService";
import { useAuth } from "../store/auth";
import { canApprove } from "../utils/roles";

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const load = () => listApprovals().then(setApprovals);
  useEffect(() => { load(); }, []);

  const decide = async (id, endpoint) => {
    if (endpoint === "approve") {
      await approveApproval(id);
    } else {
      await rejectApproval(id);
    }
    load();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="font-page-title text-page-title text-on-background m-0">Approval Workflow</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            Review and decide on pending quotations to authorize purchase order generation.
          </p>
        </div>
      </div>

      {/* Approvals Table Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow overflow-hidden">
        <div className="p-5 border-b border-[#E9ECEF] bg-surface-bright flex justify-between items-center">
          <h3 className="font-card-title text-base font-bold text-on-surface m-0">Pending Reviews</h3>
          <span className="text-xs text-on-surface-variant font-semibold bg-surface-container px-2.5 py-1 rounded-full">
            {approvals.length} Requests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F3F5] text-on-surface-variant font-semibold text-xs border-b border-[#E9ECEF]">
                <th className="p-4">Approval ID</th>
                <th className="p-4">Quotation Ref</th>
                <th className="p-4">Approver Assigned</th>
                <th className="p-4">Reviewed Date</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-main text-xs">
              {approvals.map((approval) => (
                <tr key={approval.id} className="border-b border-[#E9ECEF] hover:bg-surface-container-low transition-colors min-h-[48px]">
                  <td className="p-4 font-bold text-primary">{approval.approval_number}</td>
                  <td className="p-4 font-semibold text-on-surface-variant">{approval.quotation}</td>
                  <td className="p-4 text-on-surface font-semibold">{approval.approver || "Manager Assigned"}</td>
                  <td className="p-4 text-on-surface-variant font-mono">{approval.reviewed_at || "-"}</td>
                  <td className="p-4 text-center">
                    <StatusBadge value={approval.status} />
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    {canApprove(user) && approval.status === "pending" && (
                      <>
                        <button 
                          onClick={() => decide(approval.id, "approve")} 
                          className="bg-primary text-on-primary rounded-lg py-1.5 px-3 hover:bg-[#5E3F57] transition-all text-xs font-semibold active:scale-95 duration-200"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => decide(approval.id, "reject")} 
                          className="border border-outline text-on-surface rounded-lg py-1.5 px-3 hover:bg-surface-variant transition-all text-xs font-semibold active:scale-95 duration-200"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {!approvals.length && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-on-surface-variant font-medium">
                    No approval workflow tasks found.
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
