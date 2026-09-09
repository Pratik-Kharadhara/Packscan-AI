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
    sm: 'text-[11px] px-2.5 py-0.5 rounded-full font-bold tracking-tight',
    md: 'text-xs px-3.5 py-1 rounded-full font-bold tracking-tight shadow-2xs',
    lg: 'text-sm px-4.5 py-1.5 rounded-full font-extrabold tracking-tight shadow-2xs',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  if (status === 'COMPLIANT') {
    return (
      <span
        id="badge-compliant"
        className={`inline-flex items-center gap-1.5 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] ${sizeClasses[size]}`}
      >
        {showIcon && <CheckCircle2 className={`${iconSizes[size]} text-[#15803D] shrink-0`} />}
        <span>COMPLIANT</span>
      </span>
    );
  }

  if (status === 'NEEDS_REVIEW') {
    return (
      <span
        id="badge-needs-review"
        className={`inline-flex items-center gap-1.5 bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] ${sizeClasses[size]}`}
      >
        {showIcon && <AlertTriangle className={`${iconSizes[size]} text-[#B45309] shrink-0`} />}
        <span>NEEDS REVIEW</span>
      </span>
    );
  }

  return (
    <span
      id="badge-non-compliant"
      className={`inline-flex items-center gap-1.5 bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] ${sizeClasses[size]}`}
    >
      {showIcon && <XCircle className={`${iconSizes[size]} text-[#B91C1C] shrink-0`} />}
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
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
        <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
        <span>Verified</span>
        {confidence !== undefined && (
          <span className="text-[10px] text-[#15803D]/80 font-mono ml-0.5">
            ({confidence.toFixed(0)}%)
          </span>
        )}
      </span>
    );
  }

  if (status === 'LOW_CONFIDENCE') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
        <AlertTriangle className="w-3 h-3 text-[#B45309]" />
        <span>Review Required</span>
        {confidence !== undefined && (
          <span className="text-[10px] text-[#B45309]/80 font-mono ml-0.5">
            ({confidence.toFixed(0)}%)
          </span>
        )}
      </span>
    );
  }

  if (status === 'NOT_CAPTURED') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
        <HelpCircle className="w-3 h-3 text-[#1D4ED8]" />
        <span>Not Captured / Insufficient Evidence</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
      <XCircle className="w-3 h-3 text-[#B91C1C]" />
      <span>Missing / Non-Compliant</span>
    </span>
  );
};
