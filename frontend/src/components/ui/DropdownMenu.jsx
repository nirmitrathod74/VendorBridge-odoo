import { useEffect, useRef, useState } from "react";

export default function DropdownMenu({ trigger, items = [], align = "right" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div 
          className={`absolute z-50 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-[0px_8px_24px_rgba(0,0,0,0.1)] py-1.5 flex flex-col ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, index) => {
            if (item.type === "divider") {
              return <div key={`div-${index}`} className="my-1.5 border-t border-outline-variant/50" />;
            }
            
            return (
              <button
                key={index}
                onClick={(e) => {
                  setIsOpen(false);
                  if (item.onClick) item.onClick(e);
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                  item.danger 
                    ? "text-error hover:bg-error-container/30" 
                    : "text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {item.icon && <span className="material-symbols-outlined text-[18px]">{item.icon}</span>}
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
