import { useAuth } from "../store/auth";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="font-page-title text-page-title text-on-background m-0">My Profile</h2>
          <p className="font-body-main text-sm text-on-surface-variant mt-1">
            View your personal information and role details.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-[#E9ECEF] ambient-shadow overflow-hidden max-w-2xl">
        <div className="p-6 border-b border-[#E9ECEF] bg-surface-bright">
          <h3 className="font-card-title text-base font-bold text-on-surface m-0">User Information</h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-3xl font-bold border-2 border-primary">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase() || "US"}
            </div>
            <div>
              <h4 className="text-xl font-bold text-on-surface m-0">{user?.username || "VendorBridge User"}</h4>
              <p className="text-on-surface-variant text-sm mt-1 capitalize">Role: {user?.role || "Unknown"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E9ECEF]">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Email Address</label>
              <div className="text-on-surface font-medium">{user?.email || "N/A"}</div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Account ID</label>
              <div className="text-on-surface font-medium font-mono text-sm">{user?.id || "N/A"}</div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Account Status</label>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#137333]">
                Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
