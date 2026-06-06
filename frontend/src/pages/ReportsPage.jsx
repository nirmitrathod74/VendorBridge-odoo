import { useAuth } from "../store/auth";

export default function ReportsPage() {
  const { user } = useAuth();
  
  const reports = [
    { title: "Vendor Performance", description: "Export vendor ratings, delivery times, and satisfaction scores.", endpoint: "/api/reports/export-vendor-performance/" },
    { title: "Spending Summary", description: "Export total spend, aggregated by vendor and category.", endpoint: "/api/reports/export-spending-summary/" },
    { title: "Monthly Trends", description: "Export month-over-month procurement trends and volume.", endpoint: "/api/reports/export-monthly-trends/" },
    { title: "Invoices Log", description: "Export a complete list of invoices and their payment statuses.", endpoint: "/api/reports/export-invoices/" },
    { title: "Purchase Orders", description: "Export all purchase orders and tracking numbers.", endpoint: "/api/reports/export-purchase-orders/" },
    { title: "Approval Workflows", description: "Export audit trails of quotation approvals and rejections.", endpoint: "/api/reports/export-approval-workflow/" }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="font-page-title text-page-title text-on-background m-0">Reports & Analytics</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            Download comprehensive data extracts for offline analysis and auditing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, idx) => (
          <div key={idx} className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] p-card-padding flex flex-col justify-between ambient-shadow">
            <div>
              <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">analytics</span>
              </div>
              <h3 className="font-card-title text-base font-bold text-on-surface m-0 mb-2">{report.title}</h3>
              <p className="text-sm text-on-surface-variant font-body-main mb-6">{report.description}</p>
            </div>
            
            <a 
              href={`http://localhost:8000${report.endpoint}`}
              target="_blank"
              rel="noreferrer"
              className="bg-primary text-on-primary rounded-lg py-2 px-4 hover:bg-[#5E3F57] transition-all text-sm font-semibold active:scale-95 duration-200 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">download</span> Download CSV
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
