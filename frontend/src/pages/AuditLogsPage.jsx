import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listAuditLogs } from "../services/listService";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    listAuditLogs().then(setLogs);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="font-page-title text-page-title text-on-background m-0">Audit Timeline</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            Review immutable system event history logs, user actions, and transaction diagnostics.
          </p>
        </div>
      </div>

      {/* Audit Logs Card Container */}
      <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow p-6">
        <div className="relative pl-8 space-y-6">
          {/* Timeline Vertical Line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-outline-variant"></div>

          {logs.map((log) => (
            <div key={log.id} className="relative flex flex-col md:flex-row md:items-start gap-4">
              {/* Timeline dot circle */}
              <div className="absolute -left-[28px] w-8 h-8 bg-surface-container-lowest rounded-full border-2 border-primary flex items-center justify-center z-10 shrink-0">
                <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {log.action?.includes("create") ? "add_circle" : log.action?.includes("delete") ? "delete" : "history"}
                </span>
              </div>

              {/* Event Content card */}
              <div className="flex-1 bg-surface-container-low p-4 rounded-xl border border-[#E9ECEF]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="font-bold text-sm text-on-surface capitalize">
                    {log.summary || `${log.module} ${log.action}`}
                  </div>
                  <div className="text-[10px] font-bold text-outline uppercase font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="mt-1 text-xs text-on-surface-variant font-medium">
                  Module: <Link to={`/${log.module?.replace('_', '-')}s`} className="text-primary font-semibold capitalize hover:underline">{log.module}</Link> | 
                  Action: <span className="text-secondary font-semibold capitalize">{log.action}</span> | 
                  User: <span className="text-on-surface font-semibold">#{log.user || "System"}</span>
                </div>

                {log.details && log.details !== "{}" && (
                  <div className="mt-3">
                    <div className="text-[10px] text-outline font-bold uppercase mb-1">JSON Payload details:</div>
                    <pre className="max-h-36 overflow-auto rounded-lg bg-surface-container-highest p-3 text-xs font-mono text-on-surface border border-outline-variant select-text">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(log.details), null, 2);
                        } catch (e) {
                          return String(log.details);
                        }
                      })()}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
          {!logs.length && (
            <div className="text-center p-8 text-on-surface-variant font-medium">
              No audit records exist.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
