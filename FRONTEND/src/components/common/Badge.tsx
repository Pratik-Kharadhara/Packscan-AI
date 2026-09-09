import React from 'react';
import { ComplianceStatus, FieldStatus } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

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
    sm: 'text-xs px-2.5 py-0.5 rounded-full font-semibold',
    md: 'text-xs sm:text-sm px-3 py-1 rounded-full font-semibold',
    lg: 'text-sm sm:text-base px-4 py-1.5 rounded-full font-bold',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (status === 'COMPLIANT') {
    return (
      <span
        id="badge-compliant"
        className={`inline-flex items-center gap-1.5 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] whitespace-nowrap ${sizeClasses[size]}`}
      >
        {showIcon && <CheckCircle2 className={`${iconSizes[size]} text-[#15803D] shrink-0`} />}
        <span>Compliant</span>
      </span>
    );
  }

  if (status === 'NEEDS_REVIEW') {
    return (
      <span
        id="badge-needs-review"
        className={`inline-flex items-center gap-1.5 bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] whitespace-nowrap ${sizeClasses[size]}`}
      >
        {showIcon && <AlertTriangle className={`${iconSizes[size]} text-[#B45309] shrink-0`} />}
        <span>Needs Review</span>
      </span>
    );
  }

  return (
    <span
      id="badge-non-compliant"
      className={`inline-flex items-center gap-1.5 bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] whitespace-nowrap ${sizeClasses[size]}`}
    >
      {showIcon && <XCircle className={`${iconSizes[size]} text-[#B91C1C] shrink-0`} />}
      <span>Non-Compliant</span>
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
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
        <span>Verified</span>
        {confidence !== undefined && (
          <span className="ml-1 text-[10px] text-[#15803D]/80 font-mono font-medium">({confidence.toFixed(0)}%)</span>
        )}
      </span>
    );
  }

  if (status === 'LOW_CONFIDENCE') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
        <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
        <span>Low Confidence</span>
        {confidence !== undefined && (
          <span className="ml-1 text-[10px] text-[#B45309]/80 font-mono font-medium">({confidence.toFixed(0)}%)</span>
        )}
      </span>
    );
  }

  if (status === 'NOT_CAPTURED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300">
        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
        <span>Not Captured / Other Angle</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
      <XCircle className="w-3.5 h-3.5 text-[#B91C1C]" />
      <span>Missing / Non-Compliant</span>
    </span>
  );
};
