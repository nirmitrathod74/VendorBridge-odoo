import { useEffect, useState } from "react";

import api from "../api/client";
import { listNotifications } from "../services/listService";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const load = () => listNotifications().then(setNotifications);
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/mark-read/`);
    load();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="font-page-title text-page-title text-on-background m-0">Notifications</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            Stay updated with procurement messages, workflow updates, and alerts.
          </p>
        </div>
      </div>

      {/* Notifications Container */}
      <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow p-6 space-y-4">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`flex items-start justify-between gap-4 p-4 border rounded-lg transition-colors ${
              notification.is_read 
                ? "border-outline-variant bg-surface-bright/50" 
                : "border-primary/30 bg-surface-container-low"
            }`}
          >
            <div className="flex gap-3">
              <span className={`material-symbols-outlined text-[22px] mt-0.5 shrink-0 ${
                notification.is_read ? "text-outline" : "text-primary"
              }`}>
                {notification.is_read ? "drafts" : "mail"}
              </span>
              <div>
                <div className={`font-semibold text-sm ${notification.is_read ? "text-on-surface-variant" : "text-on-surface"}`}>
                  {notification.title}
                </div>
                <div className="text-xs text-on-surface-variant mt-1">{notification.message}</div>
              </div>
            </div>
            
            <button 
              onClick={() => markRead(notification.id)} 
              disabled={notification.is_read}
              className={`rounded-lg py-1.5 px-3 transition-all text-xs font-semibold select-none ${
                notification.is_read 
                  ? "bg-surface-container text-outline cursor-not-allowed" 
                  : "bg-primary text-on-primary hover:bg-[#5E3F57] active:scale-95 duration-200"
              }`}
            >
              {notification.is_read ? "Read" : "Mark as Read"}
            </button>
          </div>
        ))}
        {!notifications.length && (
          <div className="text-center p-8 text-on-surface-variant font-medium">
            No notifications available.
          </div>
        )}
      </div>
    </div>
  );
}
