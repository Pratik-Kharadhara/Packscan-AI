import React, { useState, useEffect } from 'react';
import { FieldKey, VerifiedField } from '../../types';
import { FieldStatusPill } from '../common/Badge';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Check,
  Scale,
  Eye,
} from 'lucide-react';

interface FieldChecklistProps {
  fields: Record<FieldKey, VerifiedField>;
  activeFieldKey?: FieldKey | null;
  onSelectField?: (key: FieldKey) => void;
  onOpenImageInspector?: (key?: FieldKey) => void;
}

const ORDERED_FIELD_KEYS: FieldKey[] = [
  'manufacturer',
  'commodity',
  'netQuantity',
  'mfgDate',
  'mrp',
  'consumerComplaint',
];

export const FieldChecklist: React.FC<FieldChecklistProps> = ({
  fields,
  activeFieldKey,
  onSelectField,
  onOpenImageInspector,
}) => {
  // Track expanded rows — collapsed by default as requested
  const [expandedKeys, setExpandedKeys] = useState<Set<FieldKey>>(new Set());

  // If parent selects a field (e.g. clicked from image inspector), expand it
  useEffect(() => {
    if (activeFieldKey) {
      setExpandedKeys(new Set([activeFieldKey]));
    }
  }, [activeFieldKey]);

  const toggleField = (key: FieldKey) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        // Progressive disclosure: keep focus clean by expanding one at a time
        next.clear();
        next.add(key);
      }
      return next;
    });

    if (onSelectField) {
      onSelectField(key);
    }
  };

  const handleExpandAll = () => {
    if (expandedKeys.size === ORDERED_FIELD_KEYS.length) {
      setExpandedKeys(new Set());
    } else {
      setExpandedKeys(new Set(ORDERED_FIELD_KEYS));
    }
  };

  // Compute summary stats
  const allFields = ORDERED_FIELD_KEYS.map((k) => fields[k]).filter(Boolean);
  const detectedCount = allFields.filter((f) => f.status === 'DETECTED').length;
  const reviewCount = allFields.filter((f) => f.status === 'LOW_CONFIDENCE').length;
  const missingCount = allFields.filter((f) => f.status === 'NOT_DETECTED').length;
  const allExpanded = expandedKeys.size === ORDERED_FIELD_KEYS.length;

  return (
    <div className="bg-white dark:bg-[#141A26] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden" id="field-checklist-container">
      {/* Section Header Strip */}
      <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Mandatory Declarations Audit
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              6 of 6 Evaluated
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Legal Metrology (Packaged Commodities) Rules, 2011 • Rule 6 Compliance Checklist
          </p>
        </div>

        {/* Quick summary tally & Expand All toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{detectedCount} Detected</span>
            {reviewCount > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-amber-700 dark:text-amber-400 font-bold">{reviewCount} Review</span>
              </>
            )}
            {missingCount > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-rose-700 dark:text-rose-400 font-bold">{missingCount} Missing</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleExpandAll}
            className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      {/* Accordion Rows List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {ORDERED_FIELD_KEYS.map((key, index) => {
          const field = fields[key];
          if (!field) return null;

          const isExpanded = expandedKeys.has(key);
          const isSelected = activeFieldKey === key;

          // Status indicator config
          const isDetected = field.status === 'DETECTED';
          const isReview = field.status === 'LOW_CONFIDENCE';
          const isMissing = field.status === 'NOT_DETECTED';

          const statusBorder = isSelected
            ? 'ring-2 ring-emerald-600 ring-inset bg-emerald-50/20 dark:bg-emerald-950/30'
            : isExpanded
            ? 'bg-slate-50/40 dark:bg-slate-900/40'
            : 'hover:bg-slate-50/70 dark:hover:bg-slate-900/60';

          return (
            <div
              key={field.key}
              id={`field-row-${field.key}`}
              className={`transition-colors ${statusBorder}`}
            >
              {/* Row Header — Always visible, fast-scan summary */}
              <button
                type="button"
                onClick={() => toggleField(field.key)}
                aria-expanded={isExpanded}
                className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer group select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Icon */}
                  <div className="shrink-0">
                    {isDetected && (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    {isReview && (
                      <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}
                    {isMissing && (
                      <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-700 dark:text-rose-400">
                        <XCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Field Number + Name + Rule Citation */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                        0{index + 1}.
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-400 transition-colors">
                        {field.title}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {field.legalRule}
                      </span>
                    </div>

                    {/* Collapsed single-line hint for non-detected or warnings */}
                    {!isExpanded && (isReview || isMissing) && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium truncate mt-0.5">
                        {field.warning || field.explanation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Status Pill & Chevron */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <FieldStatusPill status={field.status} confidence={field.confidence} />
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-emerald-800' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Progressive Disclosure Body — Full Technical Details */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key={`content-${field.key}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 space-y-3.5 text-xs">
                      {/* Legal requirement description */}
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        <strong className="text-slate-800 font-semibold">Statutory Rule: </strong>
                        {field.description}
                      </p>

                      {/* Extracted Declaration Snippet */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                            Extracted Declaration Text
                          </span>
                          {field.detectedFormat && (
                            <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded font-mono">
                              Pattern: {field.detectedFormat}
                            </span>
                          )}
                        </div>

                        {field.extractedText ? (
                          <p className="font-mono text-slate-900 bg-white p-2 rounded-lg border border-slate-200/90 text-xs font-medium break-words select-all">
                            &ldquo;{field.extractedText}&rdquo;
                          </p>
                        ) : (
                          <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-mono text-xs font-semibold flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>[NO MATCHING TEXT REGION DETECTED ON SCANNED SURFACES]</span>
                          </div>
                        )}
                      </div>

                      {/* Three Levels of Verification Matrix */}
                      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                          3-Level Verification Matrix (Legal Metrology Rules, 2011)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/70">
                            {field.level1Presence ? (
                              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <div>
                              <span className="font-bold block text-slate-800 text-[11px]">Level 1: Presence</span>
                              <span className="text-[10px] text-slate-500">
                                {field.level1Presence ? 'Present on label' : 'Missing declaration'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/70">
                            {field.level2FormatValid ? (
                              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <div>
                              <span className="font-bold block text-slate-800 text-[11px]">Level 2: Format</span>
                              <span className="text-[10px] text-slate-500">
                                {field.level2FormatValid ? 'Complies with syntax' : 'Invalid format'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/70">
                            {field.level3ReadabilityGood ? (
                              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <div>
                              <span className="font-bold block text-slate-800 text-[11px]">Level 3: Clarity</span>
                              <span className="text-[10px] text-slate-500">
                                {field.level3ReadabilityGood ? 'High OCR readability' : 'Needs clarification'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Plain Language Assessment */}
                      <div className="text-xs space-y-2">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                            Automated Compliance Assessment:
                          </span>
                          <p className="text-slate-600 leading-relaxed text-xs font-normal">
                            {field.explanation}
                          </p>
                        </div>

                        {/* Inspector Warning & Statutory Remedy */}
                        {field.warning && (
                          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="font-bold block text-amber-900">
                                Regulatory Alert:
                              </span>
                              <p className="text-amber-900 leading-snug">{field.warning}</p>
                              {field.remedy && (
                                <p className="text-slate-700 pt-1 text-[11px]">
                                  <strong className="text-slate-900">Statutory Action: </strong>
                                  {field.remedy}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Inspector Action: View on Scanned Image */}
                      {onOpenImageInspector && (
                        <div className="pt-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenImageInspector(field.key);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Locate Bounding Box on Image</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
