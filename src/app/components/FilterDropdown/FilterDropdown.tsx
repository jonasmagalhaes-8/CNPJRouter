'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import filterDropdownStyles from './FilterDropdown.module.css';

interface FilterDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  single?: boolean;
}

export default function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Selecionar...',
  single = false,
}: FilterDropdownProps) {
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
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeTag = (e: React.MouseEvent, option: string) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== option));
  };

  return (
    <div className={filterDropdownStyles.container} ref={containerRef}>
      <label className={filterDropdownStyles.label}>{label}</label>

      <div
        className={clsx(filterDropdownStyles.trigger, isOpen && filterDropdownStyles.triggerActive)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={filterDropdownStyles.selectionArea}>
          {selected.length === 0 ? (
            <span className={filterDropdownStyles.placeholder}>{placeholder}</span>
          ) : (
            <div className={filterDropdownStyles.tagsArea}>
              {single ? (
                <span className={filterDropdownStyles.singleValue}>{selected[0]}</span>
              ) : (
                selected.map((val) => (
                  <span key={val} className={filterDropdownStyles.tag}>
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
        <ChevronDown
          className={clsx(
            'w-4 h-4 text-emerald-500 transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={filterDropdownStyles.dropdown}
          >
            <div className={filterDropdownStyles.optionsList}>
              {options.length === 0 ? (
                <div className={filterDropdownStyles.emptyState}>
                  Nenhuma opção disponível
                </div>
              ) : (
                options.map((option) => {
                  const isSelected = selected.includes(option);
                  return (
                    <div
                      key={option}
                      className={clsx(
                        filterDropdownStyles.option,
                        isSelected && filterDropdownStyles.optionSelected,
                      )}
                      onClick={() => toggleOption(option)}
                    >
                      <span className={filterDropdownStyles.optionLabel}>{option}</span>
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
}
