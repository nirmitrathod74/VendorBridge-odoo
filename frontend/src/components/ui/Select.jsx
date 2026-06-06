import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

export default function Select({ 
  value, 
  onChange, 
  options = [], 
  multiple = false, 
  placeholder = "Select...", 
  required = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    if (multiple) {
      const newValue = Array.isArray(value) ? [...value] : [];
      if (newValue.includes(optionValue)) {
        onChange(newValue.filter((v) => v !== optionValue));
      } else {
        onChange([...newValue, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const getDisplayValue = () => {
    if (multiple) {
      if (!Array.isArray(value) || value.length === 0) return placeholder;
      return `${value.length} selected`;
    }
    const selectedOption = options.find((opt) => opt.value === value);
    return selectedOption ? selectedOption.label : placeholder;
  };

  // Render the dropdown via portal to avoid overflow clipping issues
  const renderDropdown = () => {
    if (!isOpen || !containerRef.current) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    return ReactDOM.createPortal(
      <div 
        className="fixed z-50 bg-surface-container-lowest border border-outline-variant rounded-lg mt-1 overflow-hidden shadow-[0px_8px_24px_rgba(0,0,0,0.1)] py-1 flex flex-col max-h-64"
        style={{ 
          top: rect.bottom + window.scrollY, 
          left: rect.left + window.scrollX, 
          width: rect.width 
        }}
      >
        {true && (
          <div className="px-2 py-1.5 border-b border-outline-variant sticky top-0 bg-surface-container-lowest z-10">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs focus:outline-none focus:border-primary text-on-surface"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <div className="overflow-y-auto flex-1">
          {options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase())).map((opt) => {
            const isSelected = multiple 
              ? Array.isArray(value) && value.includes(opt.value)
              : value === opt.value;
              
            return (
              <div 
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected ? "bg-primary-container/20 text-primary font-medium" : "text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="material-symbols-outlined text-sm">check</span>
                )}
              </div>
            );
          })}
          {options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="px-3 py-2 text-sm text-on-surface-variant italic">No options found</div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-surface-container-lowest border rounded-lg px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors min-h-[38px] ${
          isOpen ? "border-primary ring-1 ring-primary" : "border-outline-variant hover:border-outline"
        }`}
      >
        <span className={(!multiple && !value) || (multiple && (!value || value.length === 0)) ? "text-outline/50" : "text-on-surface"}>
          {getDisplayValue()}
        </span>
        <span className={`material-symbols-outlined text-outline transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </div>
      
      {/* Hidden input for form validation compatibility */}
      {required && (
        <input 
          type="text" 
          tabIndex={-1} 
          required={required} 
          value={multiple ? (value && value.length > 0 ? "set" : "") : value} 
          onChange={() => {}} 
          className="absolute opacity-0 w-0 h-0 pointer-events-none" 
        />
      )}

      {renderDropdown()}
    </div>
  );
}
