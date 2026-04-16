import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PremiumDatePicker({ value, onChange, label, max, min, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value);
    if (max) return new Date(max);
    return new Date();
  });
  const containerRef = useRef(null);

  const selectedDate = value ? new Date(value) : null;
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  // Reset viewDate when max changes (e.g. switches to birthday field)
  useEffect(() => {
    if (!value && max) {
      setViewDate(new Date(max));
    }
  }, [max, value]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleYearChange = (e) => {
    e.stopPropagation();
    setViewDate(new Date(parseInt(e.target.value), currentMonth, 1));
  };

  const selectDate = (day) => {
    const y = currentYear;
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    onChange({ target: { value: dateStr } });
    setIsOpen(false);
  };

  const days = [];
  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
  }

  for (let i = 1; i <= totalDays; i++) {
    const isSelected = selectedDate && 
                      selectedDate.getDate() === i && 
                      selectedDate.getMonth() === currentMonth && 
                      selectedDate.getFullYear() === currentYear;
    
    const isToday = new Date().getDate() === i && 
                    new Date().getMonth() === currentMonth && 
                    new Date().getFullYear() === currentYear;

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const isDisabled = (max && dateStr > max) || (min && dateStr < min);

    days.push(
      <button
        key={i}
        type="button"
        disabled={isDisabled}
        onClick={() => selectDate(i)}
        className={`h-9 w-9 rounded-lg text-sm font-medium transition-all flex items-center justify-center
          ${isSelected ? 'bg-blue-600 text-white shadow-lg scale-110' : 
            isDisabled ? 'text-gray-200 cursor-not-allowed' :
            isToday ? 'border-2 border-blue-500 text-blue-600' : 
            'hover:bg-blue-50 text-gray-700 hover:text-blue-600'
          }`}
      >
        {i}
      </button>
    );
  }

  const years = [];
  const limitMaxYear = max ? new Date(max).getFullYear() : currentYear + 20;
  const limitMinYear = min ? new Date(min).getFullYear() : currentYear - 80;
  
  for (let y = limitMaxYear; y >= limitMinYear; y--) {
    years.push(y);
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full border border-gray-300 rounded-xl p-2.5 bg-white cursor-pointer hover:border-blue-400 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 shadow-sm"
      >
        <CalendarIcon className="h-4 w-4 text-blue-500 shrink-0" />
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select Date'}
        </span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-[100] mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 w-[320px] left-0 md:left-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 leading-tight">
                  {MONTHS[currentMonth]}
                </span>
                <select 
                  value={currentYear} 
                  onChange={handleYearChange}
                  className="text-sm font-medium text-gray-500 border-none p-0 bg-transparent focus:ring-0 cursor-pointer hover:text-blue-600"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button type="button" onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className="text-[10px] uppercase font-bold text-gray-400 text-center tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            <motion.div 
              key={`${currentMonth}-${currentYear}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-7 gap-1"
            >
              {days}
            </motion.div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              {(() => {
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const isTodayDisabled = (max && todayStr > max) || (min && todayStr < min);
                
                if (isTodayDisabled) return <div />;
                
                return (
                  <button 
                    type="button"
                    onClick={() => {
                      onChange({ target: { value: todayStr } });
                      setIsOpen(false);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Go to Today
                  </button>
                );
              })()}
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
