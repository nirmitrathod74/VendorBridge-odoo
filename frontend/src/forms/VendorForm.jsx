export const emptyVendorForm = {
  name: "",
  company_name: "",
  email: "",
  phone: "",
  gst_number: "",
  category: "goods"
};

export default function VendorForm({ value, onChange, onSubmit }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-card-padding border border-[#E9ECEF] ambient-shadow mb-6">
      <h3 className="font-card-title text-base font-bold text-on-surface mb-4">Register New Vendor</h3>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {["name", "company_name", "email", "phone", "gst_number"].map((field) => (
          <div key={field} className="flex flex-col">
            <label className="font-label-bold text-xs font-semibold text-on-surface mb-1.5 capitalize">
              {field.replace("_", " ")}
            </label>
            <input
              required={field === "name" || field === "company_name" || field === "email"}
              placeholder={`Enter ${field.replace("_", " ")}`}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-on-surface placeholder:text-outline/50"
              value={value[field]}
              onChange={(event) => onChange({ ...value, [field]: event.target.value })}
              type={field === "email" ? "email" : "text"}
            />
          </div>
        ))}
        <div className="md:col-span-3 flex justify-end">
          <button className="bg-primary text-on-primary rounded-lg py-2 px-5 hover:bg-[#5E3F57] transition-all text-sm font-semibold active:scale-95 duration-200 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">person_add</span> Register Vendor
          </button>
        </div>
      </form>
    </div>
  );
}
