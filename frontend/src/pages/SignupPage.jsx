import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import api from "../api/client";
import { useAuth } from "../store/auth";

export default function SignupPage() {
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "vendor",
    phone: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await api.post("/auth/signup/", form);
      setMessage("Account created successfully. You can sign in now.");
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Signup failed.");
    }
  };

  return (
    <main className="min-h-screen flex w-full bg-surface text-on-surface">
      {/* Left Panel: Brand & Illustration */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between overflow-hidden bg-primary text-on-primary">
        <img 
          alt="Enterprise procurement illustration" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" 
          src="https://lh3.googleusercontent.com/aida/AP1WRLtOTDVsRxp7VzlNJ2DipS6tA24-nzY5mR6OcqEjNRU5B3_3fAoDTMHv_LQBnPeUelVmj83AcMnBCfGcwgE-RzTwcoLdlAlwYLL12UE-rMdJsfOXdKKfPoD1oPDqrhNqt-w-fpYt5_RIgTEcY27xBZYYznGc_NkrHw4oOu4XNxBtSh_zs1CzImMgVo2D8WWOKI7MCvdGsIT7xZ7HxrpMZSs25Mrk0haF_3kCvjSr-DuKAhMY-7msX7_4ses"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary-container/90 z-0"></div>
        <div className="relative z-10 p-12 flex flex-col h-full justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            <h1 className="font-page-title text-page-title leading-none">VendorBridge</h1>
          </div>
          <div className="max-w-lg">
            <h2 className="font-section-title text-section-title mb-6 leading-tight">
              Join our global procurement ecosystem.
            </h2>
            <p className="font-body-main text-body-main text-primary-fixed-dim mb-8">
              Connect with buyers, submit competitive quotations, track purchase orders, and manage digital invoices seamlessly in one single ERP portal.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Signup Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 bg-surface">
        <div className="w-full max-w-[500px]">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            <h1 className="font-page-title-mobile text-page-title-mobile text-primary leading-none">VendorBridge</h1>
          </div>

          {/* Signup Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-8 md:p-10">
            <div className="mb-6 text-center sm:text-left">
              <h2 className="font-section-title text-[22px] font-bold text-on-surface mb-2">Create an account</h2>
              <p className="font-body-main text-sm text-on-surface-variant">Procurement &amp; Vendor Management ERP</p>
            </div>

            {message && (
              <div className="mb-6 p-4 rounded-lg bg-[#E8F5E9] text-[#2E7D32] text-sm flex items-start gap-2 border border-[#2E7D32]/20">
                <span className="material-symbols-outlined text-lg shrink-0">check_circle</span>
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container text-sm flex items-start gap-2 border border-error/20">
                <span className="material-symbols-outlined text-lg shrink-0">error</span>
                <span className="break-all">{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block font-label-bold text-xs font-semibold text-on-surface mb-1.5" htmlFor="username">Username</label>
                  <input 
                    className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm" 
                    id="username" 
                    placeholder="johndoe" 
                    required 
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-label-bold text-xs font-semibold text-on-surface mb-1.5" htmlFor="email">Email</label>
                  <input 
                    className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm" 
                    id="email" 
                    placeholder="john@company.com" 
                    required 
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                {/* First Name */}
                <div>
                  <label className="block font-label-bold text-xs font-semibold text-on-surface mb-1.5" htmlFor="first_name">First Name</label>
                  <input 
                    className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm" 
                    id="first_name" 
                    placeholder="John" 
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block font-label-bold text-xs font-semibold text-on-surface mb-1.5" htmlFor="last_name">Last Name</label>
                  <input 
                    className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm" 
                    id="last_name" 
                    placeholder="Doe" 
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-label-bold text-xs font-semibold text-on-surface mb-1.5" htmlFor="phone">Phone</label>
                  <input 
                    className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm" 
                    id="phone" 
                    placeholder="+1 (555) 000-0000" 
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block font-label-bold text-xs font-semibold text-on-surface mb-1.5" htmlFor="role">Account Role</label>
                  <select 
                    className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm" 
                    id="role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="vendor">Vendor</option>
                    <option value="officer">Procurement Officer</option>
                    <option value="approver">Manager / Approver</option>
                  </select>
                </div>

                {/* Password */}
                <div className="col-span-2">
                  <label className="block font-label-bold text-xs font-semibold text-on-surface mb-1.5" htmlFor="password">Password</label>
                  <input 
                    className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm" 
                    id="password" 
                    placeholder="••••••••" 
                    required 
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button 
                  className="w-full flex justify-center items-center gap-2 bg-primary-container text-on-primary-container hover:bg-primary hover:text-white rounded-lg px-4 py-3 font-label-bold font-semibold shadow-sm transition-all active:scale-[0.98]" 
                  type="submit"
                >
                  <span>Sign Up</span>
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="font-small-text text-xs text-on-surface-variant">
                Already have an account?{" "}
                <Link to="/login" className="font-label-bold font-semibold text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
