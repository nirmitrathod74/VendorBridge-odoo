import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import DropdownMenu from "../ui/DropdownMenu";
import { useAuth } from "../../store/auth";
import { ROLES, hasRole } from "../../utils/roles";

const nav = [
  { to: "/", label: "Dashboard", icon: "dashboard", roles: [ROLES.ADMIN, ROLES.OFFICER, ROLES.APPROVER] },
  { to: "/vendors", label: "Vendor Management", icon: "storefront", roles: [ROLES.ADMIN, ROLES.OFFICER, ROLES.APPROVER, ROLES.VENDOR] },
  { to: "/rfqs", label: "RFQs", icon: "request_quote", roles: [ROLES.ADMIN, ROLES.OFFICER, ROLES.APPROVER, ROLES.VENDOR] },
  { to: "/quotations", label: "Quotations", icon: "description", roles: [ROLES.ADMIN, ROLES.OFFICER, ROLES.APPROVER, ROLES.VENDOR] },
  { to: "/approvals", label: "Approval Workflow", icon: "fact_check", roles: [ROLES.ADMIN, ROLES.OFFICER, ROLES.APPROVER] },
  { to: "/purchase-orders", label: "Purchase Orders", icon: "shopping_cart", roles: [ROLES.ADMIN, ROLES.OFFICER, ROLES.APPROVER, ROLES.VENDOR] },
  { to: "/invoices", label: "Invoices", icon: "receipt", roles: [ROLES.ADMIN, ROLES.OFFICER, ROLES.APPROVER, ROLES.VENDOR] },
  { to: "/reports", label: "Reports", icon: "analytics", roles: [ROLES.ADMIN, ROLES.OFFICER, ROLES.APPROVER] },
  { to: "/notifications", label: "Notifications", icon: "notifications", roles: [ROLES.ADMIN, ROLES.OFFICER, ROLES.APPROVER, ROLES.VENDOR] },
  { to: "/audit-logs", label: "Audit Logs", icon: "history", roles: [ROLES.ADMIN, ROLES.OFFICER, ROLES.APPROVER] }
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/rfqs?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const userInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() || "US");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-on-background font-body-main text-body-main">
      {/* SideNavBar Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* SideNavBar */}
      <aside className={`bg-surface-container text-primary font-label-bold docked h-screen fixed lg:static top-0 left-0 w-64 border-r border-outline-variant flex flex-col py-6 px-4 space-y-2 shrink-0 z-50 transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        {/* Header */}
        <div className="mb-8 px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>corporate_fare</span>
            </div>
            <div>
              <h1 className="font-section-title text-[20px] font-bold text-primary m-0 leading-tight">VendorBridge</h1>
              <p className="font-small-text text-xs text-on-surface-variant mt-0.5 capitalize">{user?.role || "Procurement ERP"}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate("/rfqs")} 
            className="w-full bg-primary text-on-primary rounded-lg py-2.5 px-4 hover:bg-[#5E3F57] transition-colors flex items-center justify-center gap-2 text-sm font-semibold active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined text-sm">add</span> New Request
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
          {nav.filter((item) => hasRole(user, item.roles)).map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer active:scale-95 duration-200 text-sm font-medium ${
                  isActive
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-highest"
                }`
              }
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
          <button 
            onClick={logout} 
            className="w-full flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container-highest rounded-lg transition-all cursor-pointer text-sm font-medium active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TopNavBar */}
        <header className="bg-surface-container-low border-b border-outline-variant shadow-sm flex justify-between items-center w-full px-container-margin h-16 shrink-0 relative z-10">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="lg:hidden text-on-surface-variant hover:bg-surface-container-high p-2 -ml-2 rounded-lg transition-colors flex items-center justify-center"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            
            <div className="lg:hidden font-page-title-mobile text-page-title-mobile text-primary font-bold">
              VB
            </div>

            {/* Search Bar */}
            <div className="max-w-md relative hidden sm:block flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input 
                className="w-full bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface placeholder:text-outline/70" 
                placeholder="Search RFQs... (Press Enter)" 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>

          {/* Trailing Actions */}
          <div className="flex items-center gap-4 ml-auto">
            <Link 
              to="/notifications" 
              className="text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer active:opacity-80 p-2 rounded-full relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </Link>
            
            <DropdownMenu 
              align="right"
              trigger={
                <button className="hidden sm:flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#e6b3d5] transition-colors">
                  Quick Actions
                  <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                </button>
              }
              items={[
                { label: "New RFQ", icon: "request_quote", onClick: () => navigate("/rfqs") },
                { label: "Register Vendor", icon: "person_add", onClick: () => navigate("/vendors") },
                { label: "Create PO", icon: "shopping_cart", onClick: () => navigate("/purchase-orders") }
              ]}
            />
            
            <DropdownMenu 
              align="right"
              trigger={
                <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm cursor-pointer border border-outline-variant hover:opacity-95" title={user?.email}>
                  {userInitials}
                </div>
              }
              items={[
                { label: "My Profile", icon: "person", onClick: () => navigate("/profile") },
                { label: "Settings", icon: "settings", onClick: () => navigate("/settings") },
                { type: "divider" },
                { label: "Sign Out", icon: "logout", danger: true, onClick: logout }
              ]}
            />
          </div>
        </header>

        {/* Canvas / Main Content */}
        <main className="flex-1 overflow-y-auto p-container-margin bg-background space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
