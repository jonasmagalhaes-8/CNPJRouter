import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import styles from './FilterDropdown.module.css';

interface FilterDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  single?: boolean;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  placeholder = "Selecionar...",
  single = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (single) {
      onChange([option]);
      setIsOpen(false);
      return;
    }
    
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeTag = (e: React.MouseEvent, option: string) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== option));
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <label className={styles.label}>{label}</label>
      
      <div 
        className={clsx(styles.trigger, isOpen && styles.triggerActive)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.selectionArea}>
          {selected.length === 0 ? (
            <span className={styles.placeholder}>{placeholder}</span>
          ) : (
            <div className={styles.tagsArea}>
              {single ? (
                <span className={styles.singleValue}>{selected[0]}</span>
              ) : (
                selected.map(val => (
                  <span key={val} className={styles.tag}>
                    {val}
                    <X 
                      className="w-2.5 h-2.5 ml-1 hover:text-white cursor-pointer" 
                      onClick={(e) => removeTag(e, val)}
                    />
                  </span>
                ))
              )}
            </div>
          )}
        </div>
        <ChevronDown className={clsx("w-4 h-4 text-emerald-500 transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={styles.dropdown}
          >
            <div className={styles.optionsList}>
              {options.length === 0 ? (
                <div className={styles.emptyState}>Nenhuma opção disponível</div>
              ) : (
                options.map(option => {
                  const isSelected = selected.includes(option);
                  return (
                    <div 
                      key={option} 
                      className={clsx(styles.option, isSelected && styles.optionSelected)}
                      onClick={() => toggleOption(option)}
                    >
                      <span className={styles.optionLabel}>{option}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
