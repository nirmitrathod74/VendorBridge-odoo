import { useState } from "react";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [message, setMessage] = useState(null);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    // Mocking the password change functionality as it's UI only for now
    setTimeout(() => {
      setMessage({ type: "success", text: "Password successfully updated." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="font-page-title text-page-title text-on-background m-0">Settings</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            Manage your account preferences and security.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Security Settings Card */}
        <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow overflow-hidden">
          <div className="p-5 border-b border-[#E9ECEF] bg-surface-bright flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">lock</span>
            <h3 className="font-card-title text-base font-bold text-on-surface m-0">Change Password</h3>
          </div>

          <div className="p-6">
            {message && (
              <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${message.type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-[#E6F4EA] text-[#137333]'}`}>
                {message.text}
              </div>
            )}
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Current Password</label>
                <input 
                  type="password" 
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="w-full bg-surface-container border border-[#E9ECEF] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">New Password</label>
                <input 
                  type="password" 
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full bg-surface-container border border-[#E9ECEF] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full bg-surface-container border border-[#E9ECEF] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
                />
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-primary text-on-primary rounded-lg py-2 px-4 hover:bg-[#5E3F57] transition-colors text-sm font-semibold active:scale-95 duration-200"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Notification Preferences Card */}
        <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow overflow-hidden">
          <div className="p-5 border-b border-[#E9ECEF] bg-surface-bright flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">notifications</span>
            <h3 className="font-card-title text-base font-bold text-on-surface m-0">Notification Preferences</h3>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-on-surface m-0">Email Notifications</h4>
                <p className="text-xs text-on-surface-variant mt-1">Receive updates about RFQs and approvals via email.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-on-surface m-0">In-App Notifications</h4>
                <p className="text-xs text-on-surface-variant mt-1">Show alerts and badges within the VendorBridge dashboard.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={inAppNotifications}
                  onChange={() => setInAppNotifications(!inAppNotifications)}
                />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
