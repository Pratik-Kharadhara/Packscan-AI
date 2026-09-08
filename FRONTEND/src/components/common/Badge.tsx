import React from 'react';
import { ComplianceStatus, FieldStatus } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplianceStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 rounded-full font-bold tracking-wide',
    md: 'text-sm px-3.5 py-1.5 rounded-full font-bold tracking-wide shadow-xs',
    lg: 'text-base px-5 py-2.5 rounded-full font-extrabold tracking-wider shadow-sm',
  };

  if (status === 'COMPLIANT') {
    return (
      <span
        id="badge-compliant"
        className={`inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 ${sizeClasses[size]}`}
      >
        {showIcon && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
        <span>COMPLIANT</span>
      </span>
    );
  }

  if (status === 'NEEDS_REVIEW') {
    return (
      <span
        id="badge-needs-review"
        className={`inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 ${sizeClasses[size]}`}
      >
        {showIcon && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
        <span>NEEDS REVIEW</span>
      </span>
    );
  }

  return (
    <span
      id="badge-non-compliant"
      className={`inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 ${sizeClasses[size]}`}
    >
      {showIcon && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
      <span>NON-COMPLIANT</span>
    </span>
  );
};

interface FieldStatusPillProps {
  status: FieldStatus;
  confidence?: number;
}

export const FieldStatusPill: React.FC<FieldStatusPillProps> = ({ status, confidence }) => {
  if (status === 'DETECTED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Detected</span>
        {confidence !== undefined && (
          <span className="ml-1 text-[10px] text-emerald-600 font-mono">({confidence.toFixed(0)}%)</span>
        )}
      </span>
    );
  }

  if (status === 'LOW_CONFIDENCE') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <span>Low Confidence</span>
        {confidence !== undefined && (
          <span className="ml-1 text-[10px] text-amber-700 font-mono">({confidence.toFixed(0)}%)</span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
      <XCircle className="w-3.5 h-3.5 text-rose-600" />
      <span>Not Detected</span>
    </span>
  );
};
