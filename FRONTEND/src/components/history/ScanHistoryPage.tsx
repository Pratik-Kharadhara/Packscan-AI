import React, { useState } from 'react';
import { ScanResult, ComplianceStatus } from '../../types';
import { StatusBadge } from '../common/Badge';
import {
  Search,
  Filter,
  History,
  Eye,
  Calendar,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

interface ScanHistoryPageProps {
  scans: ScanResult[];
  onSelectScan: (scan: ScanResult) => void;
  onResetScans: () => void;
  onNewScan: () => void;
}

export const ScanHistoryPage: React.FC<ScanHistoryPageProps> = ({
  scans,
  onSelectScan,
  onResetScans,
  onNewScan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ComplianceStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Filter logic
  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      scan.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.brandName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || scan.finalStatus === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || scan.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // KPI counts
  const totalCount = scans.length;
  const compliantCount = scans.filter((s) => s.finalStatus === 'COMPLIANT').length;
  const reviewCount = scans.filter((s) => s.finalStatus === 'NEEDS_REVIEW').length;
  const nonCompliantCount = scans.filter((s) => s.finalStatus === 'NON_COMPLIANT').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12" id="scan-history-page-root">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Package Scan History &amp; Audit Logs
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Audit trail of scanned packaged commodities, OCR confidence scores, and Legal Metrology 2011 compliance records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNewScan}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>+ New Package Scan</span>
            </button>
            <button
              onClick={onResetScans}
              className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-medium"
              title="Reset Demo Dataset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Total Audited Scans
            </span>
            <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
              {totalCount}
            </span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 uppercase block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Compliant (Pass)
            </span>
            <span className="text-xl font-black text-emerald-900 font-mono mt-0.5 block">
              {compliantCount}
            </span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 uppercase block flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Needs Review
            </span>
            <span className="text-xl font-black text-amber-900 font-mono mt-0.5 block">
              {reviewCount}
            </span>
          </div>

          <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200">
            <span className="text-[11px] font-bold text-rose-800 uppercase block flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              Non-Compliant
            </span>
            <span className="text-xl font-black text-rose-900 font-mono mt-0.5 block">
              {nonCompliantCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product, ID, brand..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </span>
          {(['ALL', 'COMPLIANT', 'NEEDS_REVIEW', 'NON_COMPLIANT'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All Records' : status.replace('_', ' ')}
            </button>
          ))}

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Personal Care">Personal Care</option>
            <option value="Food & Beverages">Food &amp; Beverages</option>
            <option value="Household Goods">Household Goods</option>
          </select>
        </div>
      </div>

      {/* Scans List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredScans.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800 mb-1">No matching scan logs found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Try adjusting your search criteria or status filter.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
              }}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Specimen / Package</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Audit Timestamp</th>
                  <th className="py-3 px-4">Detected Fields</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Statutory Outcome</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScans.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectScan(item)}
                  >
                    {/* Thumbnail & Product */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-contain p-0.5"
                          />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs sm:text-[13px] group-hover:text-blue-700 transition-colors">
                            {item.productName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {item.id} • {item.brandName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {item.category}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {item.timestamp}
                    </td>

                    {/* Detected count */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {item.detectedCount} / 6 Fields
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-4 font-mono font-bold">
                      <span
                        className={
                          item.overallConfidence >= 90
                            ? 'text-emerald-700'
                            : item.overallConfidence >= 75
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }
                      >
                        {item.overallConfidence.toFixed(1)}%
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <StatusBadge status={item.finalStatus} size="sm" />
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectScan(item);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold transition-all shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
