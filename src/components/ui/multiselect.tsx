import React, { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Selecciona...",
  disabled = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú si se hace clic fuera
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = (option: MultiSelectOption) => {
    if (value.includes(option.value)) {
      onChange(value.filter(v => v !== option.value));
    } else {
      onChange([...value, option.value]);
    }
  };

  const handleRemove = (val: string) => {
    onChange(value.filter(v => v !== val));
  };

  return (
    <div
      ref={containerRef}
      className={`relative min-w-[180px] ${className}`}
    >
      {/* Cambiado de button a div para evitar anidar botones dentro de botones */}
      <div
        className={`w-full border rounded px-3 py-2 text-left bg-background flex flex-wrap gap-1 items-center min-h-[38px] ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        {value.length === 0 && (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {value.map(val => {
              const opt = options.find(o => o.value === val);
              return (
                <span key={val} className="inline-flex items-center bg-muted px-2 py-0.5 rounded text-xs mr-1">
                  {opt?.label || val}
                  {/* Usando span en lugar de button para evitar anidar botones */}
                  <span
                    role="button"
                    className="ml-1 text-muted-foreground hover:text-destructive cursor-pointer"
                    onClick={e => {
                      e.stopPropagation();
                      handleRemove(val);
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRemove(val);
                      }
                    }}
                    aria-label={`Eliminar ${opt?.label || val}`}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              );
            })}
          </div>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="absolute z-[9999] mt-1 w-full bg-popover border rounded shadow-lg max-h-56 overflow-auto">
          <ul tabIndex={-1} role="listbox">
            {options.length === 0 && (
              <li className="px-3 py-2 text-muted-foreground text-sm">Sin opciones</li>
            )}
            {options.map(opt => (
              <li
                key={opt.value}
                className={`px-3 py-2 cursor-pointer hover:bg-accent flex items-center ${value.includes(opt.value) ? "bg-primary/10 font-semibold" : ""}`}
                onClick={() => handleSelect(opt)}
                aria-selected={value.includes(opt.value)}
                role="option"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(opt);
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={value.includes(opt.value)}
                  readOnly
                  className="mr-2"
                  tabIndex={-1}
                />
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
