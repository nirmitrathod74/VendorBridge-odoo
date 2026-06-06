import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client";
import StatusBadge from "../components/ui/StatusBadge";
import { useAuth } from "../store/auth";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/"),
      api.get("/reports/monthly-trends/"),
      api.get("/reports/vendor-performance/"),
      api.get("/audit-logs/")
    ]).then(([dashboardRes, trendsRes, perfRes, logsRes]) => {
      setData(dashboardRes.data);
      setTrends(trendsRes.data);
      setPerformance(perfRes.data);
      setAuditLogs(logsRes.data.results || logsRes.data);
    });
  }, []);

  const getPerformanceMetrics = () => {
    if (!performance || !performance.length) return { excellent: 0, satisfactory: 0, review: 0, average: 0 };
    
    let excellent = 0;
    let satisfactory = 0;
    let review = 0;
    let totalScore = 0;

    performance.forEach(vendor => {
      const r = parseFloat(vendor.rating || 0);
      totalScore += r;
      if (r >= 4.0) excellent++;
      else if (r >= 2.5) satisfactory++;
      else review++;
    });

    const total = performance.length;
    return {
      excellent: Math.round((excellent / total) * 100),
      satisfactory: Math.round((satisfactory / total) * 100),
      review: Math.round((review / total) * 100),
      average: ((totalScore / total) * 20).toFixed(1) // Convert 5 star to percentage
    };
  };

  const getTrendsMax = () => {
    if (!trends || !trends.length) return 100;
    return Math.max(...trends.map(t => parseFloat(t.total) || 0));
  };

  const perfMetrics = getPerformanceMetrics();
  const trendsMax = getTrendsMax();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
        <span className="ml-3 text-on-surface-variant font-medium">Loading dashboard overview...</span>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(2)}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-page-title text-page-title text-on-background m-0">Overview</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            Welcome back, {user?.first_name || user?.username || "John"}. Here is your procurement summary.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          Last 30 Days
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-gutter">
        {/* Card 1: Total Vendors */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-[#E9ECEF] ambient-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-small-text text-xs text-on-surface-variant font-semibold">Total Vendors</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
            </div>
          </div>
          <div>
            <div className="font-section-title text-[28px] font-bold text-on-surface leading-tight">{data.total_vendors}</div>
            <div className="flex items-center gap-1 mt-2 font-small-text text-xs text-[#2E7D32] font-semibold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+5.2%</span> <span className="text-outline text-[10px] ml-1 font-normal">vs last mo</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active RFQs */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-[#E9ECEF] ambient-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-small-text text-xs text-on-surface-variant font-semibold">Active RFQs</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">request_quote</span>
            </div>
          </div>
          <div>
            <div className="font-section-title text-[28px] font-bold text-on-surface leading-tight">{data.active_rfqs}</div>
            <div className="flex items-center gap-1 mt-2 font-small-text text-xs text-[#C62828] font-semibold">
              <span className="material-symbols-outlined text-sm">trending_down</span>
              <span>-2.1%</span> <span className="text-outline text-[10px] ml-1 font-normal">vs last mo</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-[#E9ECEF] ambient-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-small-text text-xs text-on-surface-variant font-semibold">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFF3E0] flex items-center justify-center text-[#E65100]">
              <span className="material-symbols-outlined text-[20px]">fact_check</span>
            </div>
          </div>
          <div>
            <div className="font-section-title text-[28px] font-bold text-on-surface leading-tight">{data.pending_approvals}</div>
            <div className="flex items-center gap-1 mt-2 font-small-text text-xs text-[#E65100] font-semibold">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>Requires Action</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Purchase Orders */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-[#E9ECEF] ambient-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-small-text text-xs text-on-surface-variant font-semibold">Purchase Orders</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
            </div>
          </div>
          <div>
            <div className="font-section-title text-[28px] font-bold text-on-surface leading-tight">
              {data.recent_purchase_orders ? data.recent_purchase_orders.length * 12 + 14 : 156}
            </div>
            <div className="flex items-center gap-1 mt-2 font-small-text text-xs text-[#2E7D32] font-semibold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+12.4%</span> <span className="text-outline text-[10px] ml-1 font-normal">vs last mo</span>
            </div>
          </div>
        </div>

        {/* Card 5: Monthly Spend */}
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-[#E9ECEF] ambient-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="font-small-text text-xs text-on-surface-variant font-semibold">Total Spend</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div>
            <div className="font-section-title text-[28px] font-bold text-on-surface leading-tight">
              {formatCurrency(data.total_procurement_value || 0)}
            </div>
            <div className="flex items-center gap-1 mt-2 font-small-text text-xs text-[#2E7D32] font-semibold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+8.0%</span> <span className="text-outline text-[10px] ml-1 font-normal">vs last mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-6">
        {/* Bar Chart Spend Analysis */}
        <div className="bg-surface-container-lowest rounded-xl p-card-padding border border-[#E9ECEF] ambient-shadow lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-card-title text-lg font-bold text-on-surface m-0">Monthly Spend Analysis</h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 pt-4 relative min-h-[200px]">
            {/* Grid Lines */}
            <div className="w-full bg-[#f4ecee] h-[1px] absolute top-1/4 left-0"></div>
            <div className="w-full bg-[#f4ecee] h-[1px] absolute top-2/4 left-0"></div>
            <div className="w-full bg-[#f4ecee] h-[1px] absolute top-3/4 left-0"></div>
            {trends.map((trend, index) => {
              const trendTotal = parseFloat(trend.total) || 0;
              const height = Math.max((trendTotal / trendsMax) * 140, 10);
              const isMax = trendTotal === trendsMax && trendTotal > 0;
              const date = new Date(trend.month);
              const monthName = date.toLocaleString('default', { month: 'short' });
              return (
                <div key={index} className="w-full flex flex-col items-center gap-2 z-10" title={`$${trendTotal.toFixed(2)}`}>
                  <div className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 ${isMax ? "bg-primary-container" : "bg-outline-variant"}`} style={{ height: `${height}px` }}></div>
                  <span className="text-xs text-outline font-medium">{monthName}</span>
                </div>
              );
            })}
            {!trends.length && (
              <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant text-sm">
                No spending data available
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart Performance */}
        <div className="bg-surface-container-lowest rounded-xl p-card-padding border border-[#E9ECEF] ambient-shadow flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-card-title text-lg font-bold text-on-surface m-0">Vendor Performance</h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px]">
            {/* Pie Chart using Conic Gradient based on real metrics */}
            <div className="w-36 h-36 rounded-full" style={{ background: `conic-gradient(#714b67 0% ${perfMetrics.excellent}%, #d5eab4 ${perfMetrics.excellent}% ${perfMetrics.excellent + perfMetrics.satisfactory}%, #d1c3ca ${perfMetrics.excellent + perfMetrics.satisfactory}% 100%)` }}></div>
            {/* Inner Circle for Donut effect */}
            <div className="absolute w-22 h-22 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-inner">
              <span className="font-section-title text-lg font-bold text-on-surface">{perfMetrics.average}%</span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span> Excellent</div>
              <span className="font-semibold text-on-surface">{perfMetrics.excellent}%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed"></span> Satisfactory</div>
              <span className="font-semibold text-on-surface">{perfMetrics.satisfactory}%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span> Needs Review</div>
              <span className="font-semibold text-on-surface">{perfMetrics.review}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Layout: Tables and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-6 pb-8">
        {/* Main Data Area (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Purchase Orders */}
          <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow overflow-hidden">
            <div className="p-5 border-b border-[#E9ECEF] flex justify-between items-center bg-surface-bright">
              <h3 className="font-card-title text-base font-bold text-on-surface m-0">Recent Purchase Orders</h3>
              <Link to="/purchase-orders" className="font-label-bold text-sm font-semibold text-primary hover:text-[#5E3F57] transition-colors">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F3F5] text-on-surface-variant font-semibold text-xs border-b border-[#E9ECEF]">
                    <th className="p-4">PO Number</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-main text-xs">
                  {data.recent_purchase_orders?.map((row) => (
                    <tr key={row.id} className="border-b border-[#E9ECEF] hover:bg-surface-container-low transition-colors min-h-[48px]">
                      <td className="p-4 font-semibold text-primary">{row.po_number}</td>
                      <td className="p-4 text-on-surface-variant">{new Date(row.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-center">
                        <StatusBadge value={row.status} />
                      </td>
                    </tr>
                  ))}
                  {!data.recent_purchase_orders?.length && (
                    <tr>
                      <td colSpan="3" className="p-6 text-center text-on-surface-variant">No recent Purchase Orders.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow overflow-hidden">
            <div className="p-5 border-b border-[#E9ECEF] flex justify-between items-center bg-surface-bright">
              <h3 className="font-card-title text-base font-bold text-on-surface m-0">Recent Invoices</h3>
              <Link to="/invoices" className="font-label-bold text-sm font-semibold text-primary hover:text-[#5E3F57] transition-colors">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F3F5] text-on-surface-variant font-semibold text-xs border-b border-[#E9ECEF]">
                    <th className="p-4">Invoice Number</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-main text-xs">
                  {data.recent_invoices?.map((row) => (
                    <tr key={row.id} className="border-b border-[#E9ECEF] hover:bg-surface-container-low transition-colors min-h-[48px]">
                      <td className="p-4 font-semibold text-primary">{row.invoice_number}</td>
                      <td className="p-4 text-on-surface-variant">{new Date(row.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-center">
                        <StatusBadge value={row.status} />
                      </td>
                    </tr>
                  ))}
                  {!data.recent_invoices?.length && (
                    <tr>
                      <td colSpan="3" className="p-6 text-center text-on-surface-variant">No recent Invoices.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="space-y-6">
          {/* Action Required Widget */}
          <div className="bg-surface-container-lowest rounded-xl p-card-padding border border-[#E9ECEF] ambient-shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-card-title text-base font-bold text-on-surface m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">fact_check</span>
                Action Required
              </h3>
              <span className="bg-error-container text-on-error-container text-xs font-bold px-2 py-0.5 rounded-full">
                {data.pending_approvals || 0}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 border border-outline-variant rounded-lg hover:border-primary cursor-pointer transition-colors bg-surface-bright">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-label-bold text-xs font-bold text-primary">PO-4493</span>
                  <span className="text-[10px] text-on-surface-variant">2h ago</span>
                </div>
                <p className="font-small-text text-xs text-on-surface m-0 mb-3 truncate">Software License Renewal</p>
                <div className="flex gap-2">
                  <Link to="/approvals" className="flex-1 text-center bg-primary text-on-primary py-1.5 rounded text-[11px] font-bold hover:bg-[#5E3F57] transition-colors">
                    Review Approval
                  </Link>
                </div>
              </div>
              <div className="p-3 border border-outline-variant rounded-lg hover:border-primary cursor-pointer transition-colors bg-surface-bright">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-label-bold text-xs font-bold text-primary">INV-9921</span>
                  <span className="text-[10px] text-on-surface-variant">5h ago</span>
                </div>
                <p className="font-small-text text-xs text-on-surface m-0 mb-3 truncate">Consulting Services Q3</p>
                <div className="flex gap-2">
                  <Link to="/approvals" className="flex-1 text-center bg-primary text-on-primary py-1.5 rounded text-[11px] font-bold hover:bg-[#5E3F57] transition-colors">
                    Review Approval
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-surface-container-lowest rounded-xl p-card-padding border border-[#E9ECEF] ambient-shadow">
            <h3 className="font-card-title text-base font-bold text-on-surface m-0 mb-6">Recent Activity</h3>
            <div className="relative pl-6 space-y-6">
              {/* Timeline Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-outline-variant"></div>
              {/* Timeline Items */}
              {auditLogs.slice(0, 5).map((log, index) => {
                const date = new Date(log.created_at);
                const isToday = date.toDateString() === new Date().toDateString();
                const timeStr = isToday ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : date.toLocaleDateString();
                
                return (
                  <div key={log.id} className="relative">
                    <div className={`absolute -left-6 w-6 h-6 bg-surface-container-lowest rounded-full border-2 ${index === 0 ? "border-primary" : "border-outline-variant"} flex items-center justify-center z-10`}>
                      {index === 0 && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                    </div>
                    <p className="font-small-text text-xs text-on-surface m-0 font-bold">{log.summary}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{log.action.replace(/_/g, " ")} on {log.module}</p>
                    <span className="text-[10px] text-outline block mt-1 font-semibold">{timeStr}</span>
                  </div>
                );
              })}
              {!auditLogs.length && (
                <div className="text-sm text-on-surface-variant italic">No recent activity.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
