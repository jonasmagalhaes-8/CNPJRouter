'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import styles from './UsageProgressBar.module.css';

interface UsageProgressBarProps {
  viewsCount: number;
  planLimit: number;
  percentage: number;
}

export default function UsageProgressBar({ viewsCount, planLimit, percentage }: UsageProgressBarProps) {
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 100;
  const barColor = isCritical ? 'var(--destructive)' : isWarning ? '#f59e0b' : 'var(--primary)';

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.labelRow}>
          <span className={styles.label}>
            {isCritical ? (
              <><AlertTriangle className="w-3 h-3" /> Limite atingido!</>
            ) : (
              `Hoje: ${viewsCount}/${planLimit} resultados`
            )}
          </span>
          <span className={styles.percentage}>{percentage}%</span>
        </div>
        <div className={styles.track}>
          <motion.div
            className={styles.fill}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ backgroundColor: barColor }}
          />
        </div>
        {isWarning && !isCritical && (
          <span className={styles.warningText}>
            Você já usou {percentage}% dos seus resultados de hoje
          </span>
        )}
      </div>
    </div>
  );
}
