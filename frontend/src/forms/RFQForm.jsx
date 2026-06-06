import Select from "../components/ui/Select";

export const emptyRFQForm = {
  title: "",
  description: "",
  deadline: "",
  assigned_vendors: [],
  items: [{ product_name: "", quantity: 1, unit: "Units", description: "" }]
};

export default function RFQForm({ value, vendors, onChange, onSubmit }) {
  const item = value.items[0];
  const updateItem = (patch) => onChange({ ...value, items: [{ ...item, ...patch }] });

  return (
    <div className="bg-surface-container-lowest rounded-xl p-card-padding border border-[#E9ECEF] ambient-shadow mb-6">
      <h3 className="font-card-title text-base font-bold text-on-surface mb-4">Create Request For Quotation (RFQ)</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* RFQ Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="font-label-bold text-xs font-semibold text-on-surface mb-1.5">RFQ Title</label>
            <input 
              required
              placeholder="e.g. Office IT Equipment Restock" 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-on-surface placeholder:text-outline/50" 
              value={value.title} 
              onChange={(event) => onChange({ ...value, title: event.target.value })} 
            />
          </div>
          
          <div className="flex flex-col">
            <label className="font-label-bold text-xs font-semibold text-on-surface mb-1.5">Submission Deadline</label>
            <input 
              required
              type="date" 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-on-surface min-h-[38px] cursor-text" 
              value={value.deadline} 
              onChange={(event) => onChange({ ...value, deadline: event.target.value })} 
            />
          </div>

          <div className="flex flex-col">
            <label className="font-label-bold text-xs font-semibold text-on-surface mb-1.5">Assign Vendors</label>
            <Select 
              multiple
              placeholder="Select Vendors..."
              value={value.assigned_vendors}
              onChange={(val) => onChange({ ...value, assigned_vendors: val })}
              options={vendors.map(v => ({ label: v.company_name, value: v.id }))}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="font-label-bold text-xs font-semibold text-on-surface mb-1.5">Detailed RFQ Description</label>
          <textarea 
            placeholder="Write detailed requirements, scopes, terms, and delivery instructions..." 
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-on-surface placeholder:text-outline/50 h-20" 
            value={value.description} 
            onChange={(event) => onChange({ ...value, description: event.target.value })} 
          />
        </div>

        {/* Item Section */}
        <div className="pt-2 border-t border-outline-variant">
          <h4 className="font-card-title text-sm font-bold text-on-surface mb-3">Line Items</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="font-label-bold text-xs font-semibold text-on-surface-variant mb-1.5">Product / Service</label>
              <input 
                required
                placeholder="Product name" 
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-on-surface placeholder:text-outline/50" 
                value={item.product_name} 
                onChange={(event) => updateItem({ product_name: event.target.value })} 
              />
            </div>

            <div className="flex flex-col">
              <label className="font-label-bold text-xs font-semibold text-on-surface-variant mb-1.5">Quantity</label>
              <input 
                required
                type="number" 
                min="1"
                placeholder="Quantity" 
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-on-surface placeholder:text-outline/50" 
                value={item.quantity} 
                onChange={(event) => updateItem({ quantity: Number(event.target.value) })} 
              />
            </div>

            <div className="flex flex-col">
              <label className="font-label-bold text-xs font-semibold text-on-surface-variant mb-1.5">Unit</label>
              <input 
                placeholder="e.g. Units, Hours, Liters" 
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-on-surface placeholder:text-outline/50" 
                value={item.unit} 
                onChange={(event) => updateItem({ unit: event.target.value })} 
              />
            </div>

            <div className="flex flex-col">
              <label className="font-label-bold text-xs font-semibold text-on-surface-variant mb-1.5">Line Description</label>
              <input 
                placeholder="Specifications..." 
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-on-surface placeholder:text-outline/50" 
                value={item.description} 
                onChange={(event) => updateItem({ description: event.target.value })} 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button className="bg-primary text-on-primary rounded-lg py-2.5 px-6 hover:bg-[#5E3F57] transition-all text-sm font-semibold active:scale-95 duration-200 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">post_add</span> Create &amp; Send RFQ
          </button>
        </div>
      </form>
    </div>
  );
}
