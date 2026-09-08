import React from 'react';
import { FieldKey, VerifiedField } from '../../types';
import { FieldStatusPill } from '../common/Badge';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Check,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
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

  return (
    <div className="space-y-3" id="field-checklist-container">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span>Statutory Declarations Audit</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            6 of 6 Verified
          </span>
        </h3>
        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          Legal Metrology (Packaged Commodities) Rules, 2011
        </span>
      </div>

      <div className="space-y-2.5">
        {fieldList.map((field) => {
          const isSelected = activeFieldKey === field.key;
          const isFlagged = field.status !== 'DETECTED';

          let borderClass = 'border-slate-200 hover:border-slate-300 bg-white';
          if (isSelected) {
            borderClass = 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/20';
          } else if (field.status === 'LOW_CONFIDENCE') {
            borderClass = 'border-amber-200 bg-amber-50/20';
          } else if (field.status === 'NOT_DETECTED') {
            borderClass = 'border-rose-200 bg-rose-50/20';
          }

          return (
            <div
              key={field.key}
              id={`field-card-${field.key}`}
              onClick={() => onSelectField && onSelectField(field.key)}
              className={`rounded-xl border p-3.5 sm:p-4 transition-all duration-150 cursor-pointer ${borderClass}`}
            >
              {/* Row Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {field.title}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {field.legalRule}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{field.description}</p>
                </div>

                <div className="shrink-0">
                  <FieldStatusPill status={field.status} confidence={field.confidence} />
                </div>
              </div>

              {/* Extracted Declaration Snippet */}
              <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/80 my-2 text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                  Extracted Declaration Text:
                </span>
                {field.extractedText ? (
                  <p className="font-mono text-slate-800 font-medium text-xs break-words">
                    &ldquo;{field.extractedText}&rdquo;
                  </p>
                ) : (
                  <p className="text-rose-600 font-mono text-xs font-semibold">
                    [NO MATCHING TEXT REGION DETECTED]
                  </p>
                )}
                {field.detectedFormat && (
                  <div className="mt-1 text-[10px] text-slate-500 font-medium">
                    Pattern Match: <span className="font-semibold text-slate-700">{field.detectedFormat}</span>
                  </div>
                )}
              </div>

              {/* Three Levels of Verification Matrix */}
              <div className="grid grid-cols-3 gap-2 py-1.5 border-t border-slate-100 mt-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  {field.level1Presence ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  )}
                  <span className={field.level1Presence ? 'text-slate-700 font-medium' : 'text-rose-700 font-bold'}>
                    Level 1: Presence
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {field.level2FormatValid ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  )}
                  <span className={field.level2FormatValid ? 'text-slate-700 font-medium' : 'text-rose-700 font-bold'}>
                    Level 2: Format
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {field.level3ReadabilityGood ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className={field.level3ReadabilityGood ? 'text-slate-700 font-medium' : 'text-amber-700 font-bold'}>
                    Level 3: Readability
                  </span>
                </div>
              </div>

              {/* Plain Language Explanation */}
              <div className="mt-2 pt-2 border-t border-slate-100 text-xs">
                <p className="text-slate-600 leading-relaxed font-normal">
                  <strong className="text-slate-800 font-semibold">Assessment:</strong> {field.explanation}
                </p>

                {field.warning && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-amber-800 bg-amber-50/70 p-2 rounded border border-amber-200 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Inspector Alert: </span>
                      {field.warning}
                      {field.remedy && (
                        <span className="block mt-0.5 text-slate-700 font-medium">
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
