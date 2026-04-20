import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Country {
  name: string;
  code: string;
  dial_code: string;
  flag: string;
}

const countries: Country[] = [
    { name: "Argentina", code: "AR", dial_code: "+54", flag: "🇦🇷" },
    { name: "México", code: "MX", dial_code: "+52", flag: "🇲🇽" },
    { name: "España", code: "ES", dial_code: "+34", flag: "🇪🇸" },
    { name: "Estados Unidos", code: "US", dial_code: "+1", flag: "🇺🇸" },
    { name: "Uruguay", code: "UY", dial_code: "+598", flag: "🇺🇾" },
    { name: "Chile", code: "CL", dial_code: "+56", flag: "🇨🇱" },
    { name: "Colombia", code: "CO", dial_code: "+57", flag: "🇨🇴" },
    { name: "Brasil", code: "BR", dial_code: "+55", flag: "🇧🇷" },
    { name: "Perú", code: "PE", dial_code: "+51", flag: "🇵🇪" },
    { name: "Paraguay", code: "PY", dial_code: "+595", flag: "🇵🇾" },
    { name: "Bolivia", code: "BO", dial_code: "+591", flag: "🇧🇴" },
    { name: "Ecuador", code: "EC", dial_code: "+593", flag: "🇪🇨" },
    { name: "Venezuela", code: "VE", dial_code: "+58", flag: "🇻🇪" },
    { name: "Panamá", code: "PA", dial_code: "+507", flag: "🇵🇦" },
    { name: "Costa Rica", code: "CR", dial_code: "+506", flag: "🇨🇷" },
    { name: "Puerto Rico", code: "PR", dial_code: "+1", flag: "🇵🇷" },
    { name: "Italia", code: "IT", dial_code: "+39", flag: "🇮🇹" },
    { name: "Francia", code: "FR", dial_code: "+33", flag: "🇫🇷" },
    { name: "Alemania", code: "DE", dial_code: "+49", flag: "🇩🇪" },
    { name: "Reino Unido", code: "GB", dial_code: "+44", flag: "🇬🇧" },
    { name: "Canadá", code: "CA", dial_code: "+1", flag: "🇨🇦" },
];

interface CountryPhoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function CountryPhoneSelector({ value, onChange, className, disabled }: CountryPhoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = useMemo(() => {
    return countries.find(c => value.startsWith(c.dial_code)) || countries[0];
  }, [value]);

  const rawNumber = value.startsWith(selectedCountry.dial_code) 
    ? value.slice(selectedCountry.dial_code.length).trim() 
    : value;

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.dial_code.includes(search)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountrySelect = (country: Country) => {
    onChange(`${country.dial_code} ${rawNumber}`);
    setIsOpen(false);
    setSearch("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(`${selectedCountry.dial_code} ${e.target.value}`);
  };

  return (
    <div className={cn("relative flex items-center gap-2", className)} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
            "flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100",
            isOpen && "ring-2 ring-renta-500/20 border-renta-500 bg-white"
        )}
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span className="text-sm font-bold font-jakarta text-slate-700">{selectedCountry.dial_code}</span>
        <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <input
        type="tel"
        disabled={disabled}
        value={rawNumber}
        onChange={handleInputChange}
        className="flex-1 text-sm font-inter text-slate-700 bg-white border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-renta-500/20 focus:border-renta-500 transition-all placeholder:text-slate-300"
        placeholder="1234 5678"
      />

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-renta-950/10 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-left">
          <div className="sticky top-0 bg-white/50 backdrop-blur-md p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                autoFocus
                placeholder="Buscar país o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-renta-500/10 focus:border-renta-200 transition-all"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-2 custom-scrollbar">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-renta-50/50 transition-colors text-left",
                    selectedCountry.code === c.code && "bg-renta-50/80"
                  )}
                >
                  <span className="text-xl">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-jakarta font-bold text-slate-700 truncate">{c.name}</p>
                    <p className="text-[10px] font-medium text-slate-400 tracking-wider">Código {c.dial_code}</p>
                  </div>
                  {selectedCountry.code === c.code && (
                    <Check className="w-4 h-4 text-renta-600" />
                  )}
                </button>
              ))
            ) : (
                <div className="px-4 py-8 text-center">
                    <Globe className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs text-slate-400 font-medium">No se encontraron resultados</p>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
