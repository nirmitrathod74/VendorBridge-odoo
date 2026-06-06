const colors = {
  draft: "bg-[#FFF3E0] text-[#E65100]",
  published: "bg-[#E3F2FD] text-[#1565C0]",
  pending_quotations: "bg-[#FFF3E0] text-[#E65100]",
  pending: "bg-[#FFF3E0] text-[#E65100]",
  under_review: "bg-[#F3E5F5] text-[#7B1FA2]",
  approved: "bg-[#E8F5E9] text-[#2E7D32]",
  confirmed: "bg-[#E8F5E9] text-[#2E7D32]",
  paid: "bg-[#E8F5E9] text-[#2E7D32]",
  submitted: "bg-[#E3F2FD] text-[#1565C0]",
  selected: "bg-[#F3E5F5] text-[#7B1FA2]",
  sent: "bg-[#E3F2FD] text-[#1565C0]",
  rejected: "bg-[#FFEBEE] text-[#C62828]",
  overdue: "bg-[#FFEBEE] text-[#C62828]",
  cancelled: "bg-[#ECEFF1] text-[#37474F]",
  closed: "bg-[#ECEFF1] text-[#37474F]"
};

export default function StatusBadge({ value }) {
  const normValue = String(value || "").toLowerCase();
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold select-none ${colors[normValue] || "bg-slate-100 text-slate-700"}`}>
      {String(value || "-").replaceAll("_", " ")}
    </span>
  );
}
