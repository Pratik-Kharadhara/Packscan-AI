import React from 'react';
import { FieldKey, VerifiedField } from '../../types';
import { FieldStatusPill } from '../common/Badge';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Check,
  HelpCircle,
} from 'lucide-react';

interface FieldChecklistProps {
  fields: Record<FieldKey, VerifiedField>;
  activeFieldKey?: FieldKey | null;
  onSelectField?: (key: FieldKey) => void;
}

export const FieldChecklist: React.FC<FieldChecklistProps> = ({
  fields,
  activeFieldKey,
  onSelectField,
}) => {
  const fieldList: VerifiedField[] = (Object.keys(fields) as FieldKey[]).map(
    (key) => fields[key]
  );

  const detectedCount = fieldList.filter((f) => f.status === 'DETECTED').length;
  const reviewCount = fieldList.filter((f) => f.status === 'LOW_CONFIDENCE').length;
  const notCapturedCount = fieldList.filter((f) => f.status === 'NOT_CAPTURED').length;
  const notDetectedCount = fieldList.filter((f) => f.status === 'NOT_DETECTED').length;
  const totalCount = fieldList.length;

  return (
    <div className="space-y-3" id="field-checklist-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <h3 className="text-sm font-extrabold text-[#1F2937] uppercase tracking-wider flex items-center gap-2 flex-wrap">
          <span>Statutory Declarations Audit</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
            {detectedCount} / {totalCount} Verified
          </span>
          {reviewCount > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
              {reviewCount} Review Required
            </span>
          )}
          {notCapturedCount > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
              {notCapturedCount} Insufficient Evidence
            </span>
          )}
          {notDetectedCount > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
              {notDetectedCount} Missing
            </span>
          )}
        </h3>
        <span className="text-[11px] text-[#4B5563] font-medium hidden sm:inline">
          Legal Metrology (Packaged Commodities) Rules, 2011
        </span>
      </div>

      <div className="space-y-2.5">
        {fieldList.map((field) => {
          const isSelected = activeFieldKey === field.key;

          let borderClass = 'border-[#D1D5DB] hover:border-stone-400 bg-white';
          if (isSelected) {
            borderClass = 'border-[#166534] ring-1 ring-[#166534] bg-[#F0FDF4]/30';
          } else if (field.status === 'LOW_CONFIDENCE') {
            borderClass = 'border-[#FDE68A] bg-[#FFFBEB]/40';
          } else if (field.status === 'NOT_CAPTURED') {
            borderClass = 'border-[#BFDBFE] bg-[#EFF6FF]/40';
          } else if (field.status === 'NOT_DETECTED') {
            borderClass = 'border-[#FECACA] bg-[#FEF2F2]/40';
          }

          return (
            <div
              key={field.key}
              id={`field-card-${field.key}`}
              onClick={() => onSelectField && onSelectField(field.key)}
              className={`rounded-xl border p-3.5 sm:p-4 transition-all duration-150 cursor-pointer shadow-2xs ${borderClass}`}
            >
              {/* Row Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-[#1F2937]">
                      {field.title}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#F7F8F5] text-[#4B5563] border border-[#D1D5DB]">
                      {field.legalRule}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4B5563] mt-0.5">{field.description}</p>
                </div>

                <div className="shrink-0">
                  <FieldStatusPill status={field.status} confidence={field.confidence} />
                </div>
              </div>

              {/* Extracted Declaration Snippet */}
              <div className="bg-[#F7F8F5] rounded-lg p-2.5 border border-[#D1D5DB] my-2 text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] font-bold block mb-0.5">
                  Extracted Declaration Text:
                </span>
                {field.extractedText ? (
                  <p className="font-mono text-[#1F2937] font-medium text-xs break-words">
                    &ldquo;{field.extractedText}&rdquo;
                  </p>
                ) : field.status === 'NOT_CAPTURED' ? (
                  <p className="text-[#1D4ED8] font-mono text-xs font-semibold">
                    [DECLARATION PANEL NOT CAPTURED IN SUBMITTED IMAGES]
                  </p>
                ) : (
                  <p className="text-[#B91C1C] font-mono text-xs font-semibold">
                    [NO MATCHING TEXT REGION DETECTED]
                  </p>
                )}
                {field.detectedFormat && (
                  <div className="mt-1 text-[10px] text-[#4B5563] font-medium">
                    Pattern Match: <span className="font-semibold text-[#1F2937]">{field.detectedFormat}</span>
                  </div>
                )}
              </div>

              {/* Three Levels of Verification Matrix */}
              <div className="grid grid-cols-3 gap-2 py-1.5 border-t border-[#D1D5DB] mt-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  {field.level1Presence ? (
                    <Check className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                  ) : field.status === 'NOT_CAPTURED' ? (
                    <HelpCircle className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
                  )}
                  <span className={field.level1Presence ? 'text-[#1F2937] font-medium' : field.status === 'NOT_CAPTURED' ? 'text-[#1D4ED8] font-semibold' : 'text-[#B91C1C] font-bold'}>
                    Level 1: {field.status === 'NOT_CAPTURED' ? 'Uncaptured' : 'Presence'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {field.level2FormatValid ? (
                    <Check className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
                  )}
                  <span className={field.level2FormatValid ? 'text-[#1F2937] font-medium' : 'text-[#B91C1C] font-bold'}>
                    Level 2: Format
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {field.level3ReadabilityGood ? (
                    <Check className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                  )}
                  <span className={field.level3ReadabilityGood ? 'text-[#1F2937] font-medium' : 'text-[#B45309] font-bold'}>
                    Level 3: Readability
                  </span>
                </div>
              </div>

              {/* Plain Language Explanation */}
              <div className="mt-2 pt-2 border-t border-[#D1D5DB] text-xs">
                <p className="text-[#4B5563] leading-relaxed font-normal">
                  <strong className="text-[#1F2937] font-semibold">Assessment:</strong> {field.explanation}
                </p>

                {field.warning && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-[#B45309] bg-[#FFFBEB] p-2 rounded-lg border border-[#FDE68A] text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#B45309] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Inspector Alert: </span>
                      {field.warning}
                      {field.remedy && (
                        <span className="block mt-0.5 text-[#1F2937] font-medium">
                          <strong>Recommended Action: </strong>
                          {field.remedy}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
