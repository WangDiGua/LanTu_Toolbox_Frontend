import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils';
import { ChevronDown, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  value?: string | number;
  onChange?: (value: any) => void;
  options?: SelectOption[];
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  leftIcon?: React.ReactNode;
  children?: React.ReactNode;
}

type DropdownPlacement = 'bottom' | 'top';

export const Select: React.FC<SelectProps> = ({ 
  value, 
  onChange, 
  options = [], 
  label, 
  placeholder = "请选择", 
  error, 
  disabled, 
  className,
  wrapperClassName,
  leftIcon,
  children 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<DropdownPlacement>('bottom');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    width: 0,
    zIndex: 9999
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDropdownScrolling = useRef(false);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 240;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let newPlacement: DropdownPlacement = 'bottom';
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      newPlacement = 'top';
    }
    
    setPlacement(newPlacement);
    
    if (newPlacement === 'bottom') {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        maxHeight: Math.min(dropdownHeight, spaceBelow - 8)
      });
    } else {
      setDropdownStyle({
        position: 'fixed',
        bottom: viewportHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        maxHeight: Math.min(dropdownHeight, spaceAbove - 8)
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      
      const handleResize = () => calculatePosition();
      window.addEventListener('resize', handleResize);
      
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      if (!isOpen) return;
      
      const target = event.target as Node;
      
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      
      if (isDropdownScrolling.current) {
        return;
      }
      
      setIsOpen(false);
    };
    
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const effectiveOptions = options.length > 0 ? options : React.Children.toArray(children).map((child: any) => ({
      value: child.props.value,
      label: child.props.children
  }));

  const selectedOption = effectiveOptions.find(opt => String(opt.value) === String(value));

  const handleSelect = (val: string | number) => {
    if (disabled) return;
    onChange?.(val);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      calculatePosition();
    }
    setIsOpen(!isOpen);
  };

  const handleDropdownMouseEnter = () => {
    isDropdownScrolling.current = true;
  };

  const handleDropdownMouseLeave = () => {
    isDropdownScrolling.current = false;
  };

  return (
    <div className={cn("w-full relative", wrapperClassName)} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      
      <div 
        ref={triggerRef}
        onClick={handleToggle}
        className={cn(
          'relative flex items-center w-full rounded-lg border bg-white dark:bg-slate-800 py-2.5 px-3 text-sm text-left shadow-sm cursor-pointer transition-all duration-200',
          isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
          disabled ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'text-slate-700 dark:text-white',
          error && 'border-red-500 focus:ring-red-500',
          leftIcon ? 'pl-10' : '',
          className
        )}
      >
        {leftIcon && (
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${error ? 'text-red-400' : 'text-slate-400'}`}>
            {leftIcon}
          </div>
        )}
        
        <span className={cn("block truncate flex-1", !selectedOption && "text-slate-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {isOpen ? (
             <ChevronDown size={16} className="text-blue-500 transition-transform rotate-180" />
          ) : (
             <ChevronDown size={16} className="text-slate-400 transition-transform" />
          )}
        </span>
      </div>

      {isOpen && !disabled && createPortal(
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: placement === 'bottom' ? -8 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: placement === 'bottom' ? -8 : 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            ...dropdownStyle,
            overscrollBehavior: 'contain'
          }}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
          className="overflow-auto rounded-lg bg-white dark:bg-slate-800 py-1 text-base shadow-xl border border-slate-100 dark:border-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm custom-scrollbar"
        >
          {effectiveOptions.length === 0 ? (
              <div className="py-3 px-4 text-slate-400 text-center text-xs">暂无选项</div>
          ) : (
              effectiveOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                      key={opt.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(opt.value);
                      }}
                      className={cn(
                      "relative cursor-pointer select-none py-2.5 pl-3 pr-9 transition-colors flex items-center",
                      isSelected 
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium" 
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      )}
                  >
                      <span className="block truncate">{opt.label}</span>
                      {isSelected && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600 dark:text-blue-400">
                          <Check size={16} />
                      </span>
                      )}
                  </div>
                )
              })
          )}
        </motion.div>,
        document.body
      )}

      <AnimatePresence>
        {error && (
            <motion.p 
                initial={{ opacity: 0, y: -5, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -5, height: 0 }}
                className="mt-1.5 text-xs text-red-500 font-medium flex items-center"
            >
                {error}
            </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
