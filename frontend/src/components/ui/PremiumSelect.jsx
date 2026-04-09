import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PremiumSelect({ label, value, options, onChange, placeholder = "Select", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => 
    typeof opt === 'string' ? opt === value : opt.value === value
  );

  const displayValue = selectedOption 
    ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
    : placeholder;

  const handleSelect = (opt) => {
    const val = typeof opt === 'string' ? opt : opt.value;
    onChange({ target: { value: val } });
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full border rounded-xl p-2.5 bg-white cursor-pointer transition-all shadow-sm
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300 hover:border-blue-400'}
        `}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {displayValue}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`h-4 w-4 ${isOpen ? 'text-blue-500' : 'text-gray-400'}`} />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[110] mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 max-h-[250px] overflow-y-auto custom-scrollbar"
          >
            {options.map((opt, idx) => {
              const optVal = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = optVal === value;

              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(opt)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between
                    ${isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  {optLabel}
                  {isSelected && (
                    <motion.div 
                      layoutId="active-check"
                      className="h-1.5 w-1.5 rounded-full bg-blue-500"
                    />
                  )}
                </div>
              );
            })}
            {options.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400 italic">No options available</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
