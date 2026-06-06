import Select from "../components/ui/Select";

export const emptyQuotationForm = {
  rfq: "",
  vendor: "",
  price: "",
  tax: 0,
  delivery_days: 0,
  warranty: "",
  notes: ""
};

export default function QuotationForm({ value, rfqs, vendors, onChange, onSubmit }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-card-padding border border-[#E9ECEF] ambient-shadow mb-6">
      <h3 className="font-card-title text-base font-bold text-on-surface mb-4">Submit Quotation Offer</h3>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* RFQ Select */}
        <div className="flex flex-col">
          <label className="font-label-bold text-xs font-semibold text-on-surface mb-1.5">Select RFQ Solicitation</label>
          <Select 
            required
            placeholder="Choose RFQ..."
            value={value.rfq}
            onChange={(val) => onChange({ ...value, rfq: val })}
            options={rfqs.map((rfq) => ({ label: `${rfq.rfq_number} - ${rfq.title}`, value: rfq.id }))}
          />
        </div>

        {/* Vendor Select */}
        <div className="flex flex-col">
          <label className="font-label-bold text-xs font-semibold text-on-surface mb-1.5">Bidding Vendor Partner</label>
          <Select 
            required
            placeholder="Choose Supplier..."
            value={value.vendor}
            onChange={(val) => onChange({ ...value, vendor: val })}
            options={vendors.map((vendor) => ({ label: vendor.company_name, value: vendor.id }))}
          />
        </div>

        {/* Price Input */}
        <div className="flex flex-col">
          <label className="font-label-bold text-xs font-semibold text-on-surface mb-1.5">Quoted Base Price ($)</label>
          <input 
            required
            type="number"
            placeholder="0.00" 
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-on-surface placeholder:text-outline/50" 
            value={value.price} 
            onChange={(event) => onChange({ ...value, price: event.target.value })} 
          />
        </div>

        {/* Tax Input */}
        <div className="flex flex-col">
          <label className="font-label-bold text-xs font-semibold text-on-surface mb-1.5">Quoted Tax Amount ($)</label>
          <input 
            required
            type="number"
            placeholder="0.00" 
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-on-surface placeholder:text-outline/50" 
            value={value.tax} 
            onChange={(event) => onChange({ ...value, tax: event.target.value })} 
          />
        </div>

        {/* Delivery Days Input */}
        <div className="flex flex-col">
          <label className="font-label-bold text-xs font-semibold text-on-surface mb-1.5">Delivery Time (Days)</label>
          <input 
            required
            type="number"
            min="1"
            placeholder="e.g. 7" 
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-on-surface placeholder:text-outline/50" 
            value={value.delivery_days} 
            onChange={(event) => onChange({ ...value, delivery_days: event.target.value })} 
          />
        </div>

        {/* Warranty Input */}
        <div className="flex flex-col">
          <label className="font-label-bold text-xs font-semibold text-on-surface mb-1.5">Warranty Terms</label>
          <input 
            placeholder="e.g. 1 Year Parts &amp; Labor" 
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-on-surface placeholder:text-outline/50" 
            value={value.warranty} 
            onChange={(event) => onChange({ ...value, warranty: event.target.value })} 
          />
        </div>

        <div className="md:col-span-3 flex justify-end">
          <button className="bg-primary text-on-primary rounded-lg py-2.5 px-6 hover:bg-[#5E3F57] transition-all text-sm font-semibold active:scale-95 duration-200 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">local_offer</span> Register Quotation Offer
          </button>
        </div>
      </form>
    </div>
  );
}
