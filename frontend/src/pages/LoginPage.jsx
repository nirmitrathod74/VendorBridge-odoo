import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../store/auth";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
    } catch {
      setError("Invalid credentials. Please check your email and password.");
    }
  };

  return (
    <main className="min-h-screen flex w-full bg-surface text-on-surface">
      {/* Left Panel: Brand & Illustration */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between overflow-hidden bg-primary">
        {/* Background Image */}
        <img 
          alt="Enterprise procurement illustration" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" 
          src="https://lh3.googleusercontent.com/aida/AP1WRLtOTDVsRxp7VzlNJ2DipS6tA24-nzY5mR6OcqEjNRU5B3_3fAoDTMHv_LQBnPeUelVmj83AcMnBCfGcwgE-RzTwcoLdlAlwYLL12UE-rMdJsfOXdKKfPoD1oPDqrhNqt-w-fpYt5_RIgTEcY27xBZYYznGc_NkrHw4oOu4XNxBtSh_zs1CzImMgVo2D8WWOKI7MCvdGsIT7xZ7HxrpMZSs25Mrk0haF_3kCvjSr-DuKAhMY-7msX7_4ses"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary-container/90 z-0"></div>
        <div className="relative z-10 p-12 flex flex-col h-full justify-between text-on-primary">
          {/* Brand Anchor */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            <h1 className="font-page-title text-page-title leading-none">VendorBridge</h1>
          </div>
          {/* Messaging */}
          <div className="max-w-lg">
            <h2 className="font-section-title text-section-title mb-6 leading-tight">
              Streamline your entire procurement lifecycle.
            </h2>
            <p className="font-body-main text-body-main text-primary-fixed-dim mb-8">
              Connect with global vendors, automate complex RFQ workflows, and gain real-time visibility into your supply chain with our enterprise-grade ERP solution.
            </p>
            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-on-primary/10 rounded-full px-4 py-2 backdrop-blur-sm border border-on-primary/20">
                <span className="material-symbols-outlined text-sm">fact_check</span>
                <span className="font-small-text text-xs font-medium">Automated Workflows</span>
              </div>
              <div className="flex items-center gap-2 bg-on-primary/10 rounded-full px-4 py-2 backdrop-blur-sm border border-on-primary/20">
                <span className="material-symbols-outlined text-sm">analytics</span>
                <span className="font-small-text text-xs font-medium">Advanced Analytics</span>
              </div>
              <div className="flex items-center gap-2 bg-on-primary/10 rounded-full px-4 py-2 backdrop-blur-sm border border-on-primary/20">
                <span className="material-symbols-outlined text-sm">security</span>
                <span className="font-small-text text-xs font-medium">Enterprise Security</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 bg-surface">
        <div className="w-full max-w-[440px]">
          {/* Mobile Logo (Hidden on Desktop) */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            <h1 className="font-page-title-mobile text-page-title-mobile text-primary leading-none">VendorBridge</h1>
          </div>

          {/* Login Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-8 md:p-10">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="font-section-title text-[22px] font-bold text-on-surface mb-2">Sign in to your account</h2>
              <p className="font-body-main text-sm text-on-surface-variant">Procurement &amp; Vendor Management ERP</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container text-sm flex items-start gap-2 border border-error/20">
                <span className="material-symbols-outlined text-lg shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block font-label-bold text-sm font-semibold text-on-surface mb-2" htmlFor="email">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm" 
                    id="email" 
                    name="email" 
                    placeholder="name@company.com" 
                    required 
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block font-label-bold text-sm font-semibold text-on-surface mb-2" htmlFor="password">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-10 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    required 
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button 
                    aria-label="Toggle password visibility" 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <input 
                    className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded bg-surface-container-lowest cursor-pointer" 
                    id="remember-me" 
                    name="remember-me" 
                    type="checkbox" 
                  />
                  <label className="ml-2 block font-small-text text-sm text-on-surface-variant cursor-pointer select-none" htmlFor="remember-me">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a className="font-label-bold text-sm font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors" href="#">
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button 
                  className="w-full flex justify-center items-center gap-2 bg-primary-container text-on-primary-container hover:bg-primary hover:text-white rounded-lg px-4 py-3 font-label-bold font-semibold shadow-sm transition-all active:scale-[0.98]" 
                  type="submit"
                >
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="mt-8 relative">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface-container-lowest text-on-surface-variant font-small-text text-xs">
                  Secure Enterprise Access
                </span>
              </div>
            </div>

            {/* Support Link & Signup Route */}
            <div className="mt-6 text-center space-y-2">
              <p className="font-small-text text-xs text-on-surface-variant">
                Need help accessing your account?{" "}
                <a className="font-label-bold font-semibold text-primary hover:underline" href="#">Contact IT Support</a>
              </p>
              <p className="font-small-text text-xs text-on-surface-variant">
                Don't have an account?{" "}
                <Link to="/signup" className="font-label-bold font-semibold text-primary hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
