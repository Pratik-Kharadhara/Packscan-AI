import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { UploadZone } from './components/scan/UploadZone';
import { PipelineStepper } from './components/scan/PipelineStepper';
import { ResultsDashboard } from './components/results/ResultsDashboard';
import { ScanHistoryPage } from './components/history/ScanHistoryPage';
import { HowItWorksPage } from './components/howItWorks/HowItWorksPage';
import { AboutImpactPage } from './components/about/AboutImpactPage';
import { PillNav, PillNavItem } from './components/common/PillNav';
import { PackScanLogo } from './components/common/PackScanLogo';
import { LayoutDashboard, Scan, FileCheck, History, Cpu, Scale } from 'lucide-react';

import { ScanResult, PipelineStageId, ScanMode } from './types';
import {
  INITIAL_MOCK_SCANS,
  SAMPLE_COMPLIANT,
  SAMPLE_NEEDS_REVIEW,
  SAMPLE_NON_COMPLIANT,
} from './data/mockScans';
import { analyzePackage, analyzeBatchPackages } from './services/analyzer';

const STORAGE_KEY = 'packscan_audit_history_v1';

export function App() {
  const [activePage, setActivePage] = useState<'home' | 'scan' | 'results' | 'history' | 'howItWorks' | 'about'>('home');
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(SAMPLE_NEEDS_REVIEW);
  const [batchResults, setBatchResults] = useState<ScanResult[]>([]);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Dark mode state persisted in localStorage (defaults to false / light mode)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('packscan_dark_theme') === 'true';
    } catch {
      return false;
    }
  });

  // Sync dark class on documentElement
  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('packscan_dark_theme', String(darkMode));
    } catch (e) {
      console.warn('Failed to save dark mode setting:', e);
    }
  }, [darkMode]);

  // Persistent scan history with localStorage hydration
  const [scanHistory, setScanHistory] = useState<ScanResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse local scan history', e);
    }
    return INITIAL_MOCK_SCANS;
  });

  // Pipeline simulation state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStageId, setCurrentStageId] = useState<PipelineStageId>('capture');
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineMessage, setPipelineMessage] = useState('');

  // Fetch history from backend SQLite on mount and merge with localStorage
  useEffect(() => {
    async function syncBackendHistory() {
      try {
        const res = await fetch('/api/history');
        if (res.ok) {
          const serverScans: ScanResult[] = await res.json();
          if (Array.isArray(serverScans) && serverScans.length > 0) {
            setScanHistory((prev) => {
              const prevIds = new Set(prev.map((s) => s.id));
              const newItems = serverScans.filter((s) => !prevIds.has(s.id));
              return [...newItems, ...prev];
            });
          }
        }
      } catch (err) {
        console.warn('Backend history sync not available:', err);
      }
    }
    syncBackendHistory();
  }, []);

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scanHistory));
    } catch (e) {
      console.warn('Failed to save scan history to localStorage', e);
    }
  }, [scanHistory]);

  const handleStartAnalysis = async (options: {
    file?: File;
    imageUrl?: string;
    images?: { file?: File; url?: string; name: string; panelLabel?: string }[];
    scanMode?: ScanMode;
    presetId?: string;
    productName?: string;
    category: 'Food & Beverages' | 'Household Goods' | 'Personal Care' | 'General Commodities';
  }) => {
    setIsAnalyzing(true);
    setPipelineProgress(5);
    setCurrentStageId('capture');
    setPipelineMessage('Initiating OpenCV image capture & quality validation...');
    setActivePage('scan');

    try {
      // Check if user requested batch screening mode across multiple different packages
      if (options.scanMode === 'batch' && options.images && options.images.length > 1) {
        const results = await analyzeBatchPackages(
          options.images,
          options.category,
          (_batchIdx, _total, stageId, progress, message) => {
            setCurrentStageId(stageId);
            setPipelineProgress(progress);
            setPipelineMessage(message);
          }
        );

        setBatchResults(results);
        setCurrentScan(results[0]);
        setScanHistory((prev) => [
          ...results,
          ...prev.filter((item) => !results.some((r) => r.id === item.id)),
        ]);
        setIsAnalyzing(false);
        setActivePage('results');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Single package or consolidated Multi-Angle package scan
      const result = await analyzePackage({
        ...options,
        onProgress: (stageId, progress, message) => {
          setCurrentStageId(stageId);
          setPipelineProgress(progress);
          setPipelineMessage(message);
        },
      });

      // Update state
      setBatchResults([]);
      setCurrentScan(result);
      setScanHistory((prev) => [result, ...prev.filter((item) => item.id !== result.id)]);
      setIsAnalyzing(false);
      setActivePage('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      alert('An error occurred during package analysis. Please try again.');
    }
  };

  const handleQuickPreset = (presetId: string) => {
    if (presetId === 'needs_review') {
      handleStartAnalysis({
        presetId: 'needs_review',
        imageUrl: SAMPLE_NEEDS_REVIEW.imageUrl,
        productName: SAMPLE_NEEDS_REVIEW.productName,
        category: SAMPLE_NEEDS_REVIEW.category,
      });
    } else if (presetId === 'compliant') {
      handleStartAnalysis({
        presetId: 'compliant',
        imageUrl: SAMPLE_COMPLIANT.imageUrl,
        productName: SAMPLE_COMPLIANT.productName,
        category: SAMPLE_COMPLIANT.category,
      });
    } else if (presetId === 'non_compliant') {
      handleStartAnalysis({
        presetId: 'non_compliant',
        imageUrl: SAMPLE_NON_COMPLIANT.imageUrl,
        productName: SAMPLE_NON_COMPLIANT.productName,
        category: SAMPLE_NON_COMPLIANT.category,
      });
    }
  };

  const handleSelectScanFromHistory = (scan: ScanResult) => {
    setCurrentScan(scan);
    setBatchResults([]);
    setActivePage('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetHistory = () => {
    setScanHistory(INITIAL_MOCK_SCANS);
    localStorage.removeItem(STORAGE_KEY);
    alert('Scan history has been reset to the default audit dataset.');
  };

  const dockItems: PillNavItem[] = [
    { label: 'Overview', href: 'home', icon: <LayoutDashboard size={14} />, onClick: () => { setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { label: 'Scan', href: 'scan', icon: <Scan size={14} />, onClick: () => { setActivePage('scan'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { label: 'Results', href: 'results', icon: <FileCheck size={14} />, onClick: () => { if (currentScan) { setActivePage('results'); window.scrollTo({ top: 0, behavior: 'smooth' }); } } },
    { label: 'History', href: 'history', icon: <History size={14} />, onClick: () => { setActivePage('history'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { label: 'Pipeline', href: 'howItWorks', icon: <Cpu size={14} />, onClick: () => { setActivePage('howItWorks'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { label: 'Legal', href: 'about', icon: <Scale size={14} />, onClick: () => { setActivePage('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FEFDFB] text-[#000000] selection:bg-[#CBD810] selection:text-[#000000] font-sans transition-colors duration-200">
      {/* Top Main Navigation */}
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
        hasActiveResult={!!currentScan}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((prev) => !prev)}
      />

      {/* Main Content Area with generous bottom scroll clearance */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-56">
        {/* Processing Pipeline Modal / Overlay (active when engine is running) */}
        {isAnalyzing && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl">
              <PipelineStepper
                currentStageId={currentStageId}
                progress={pipelineProgress}
                customMessage={pipelineMessage}
              />
            </div>
          </div>
        )}

        {/* View Router */}
        {activePage === 'home' && (
          <LandingPage
            onNavigate={(page) => {
              setActivePage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onQuickPreset={handleQuickPreset}
          />
        )}

        {activePage === 'scan' && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto mb-2">
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Digital Inspection Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Package Compliance Scanner
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Upload single or multiple packaging photos (Front, Back &amp; Side surfaces, or batch items) or test verified demonstration presets.
              </p>
            </div>

            <UploadZone onStartAnalysis={handleStartAnalysis} isAnalyzing={isAnalyzing} />
          </div>
        )}

        {activePage === 'results' && currentScan && (
          <ResultsDashboard
            scan={currentScan}
            batchResults={batchResults}
            onSelectBatchScan={(bScan) => setCurrentScan(bScan)}
            onNewScan={() => {
              setActivePage('scan');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onViewHistory={() => {
              setActivePage('history');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onInspectorOpenChange={setIsInspectorOpen}
          />
        )}

        {activePage === 'history' && (
          <ScanHistoryPage
            scans={scanHistory}
            onSelectScan={handleSelectScanFromHistory}
            onResetScans={handleResetHistory}
            onNewScan={() => {
              setActivePage('scan');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activePage === 'howItWorks' && <HowItWorksPage />}

        {activePage === 'about' && <AboutImpactPage />}
      </main>

      {/* Bottom Quick Dock - Hidden when inspector modal is open */}
      {!isInspectorOpen && (
        <div className="fixed bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-[900] pt-6 pb-2 px-4 group pointer-events-auto select-none">
          <div className="relative transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom transform scale-[0.74] sm:scale-[0.80] opacity-80 translate-y-3 group-hover:scale-100 group-hover:opacity-100 group-hover:translate-y-0 backdrop-blur-xl bg-white/75 group-hover:bg-white/95 dark:bg-[#141A26]/80 dark:group-hover:bg-[#141A26]/95 rounded-[30px] shadow-[0_6px_25px_rgba(0,0,0,0.10)] group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.22)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/80 dark:border-[#242E3F] px-2 py-1.5 will-change-transform">
            {/* Subtle expand handle indicator */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-slate-400/40 dark:bg-slate-600/40 group-hover:opacity-0 transition-opacity duration-200 pointer-events-none" />
            <PillNav
              logo={<PackScanLogo size="sm" showText={false} variant="icon-only" />}
              items={dockItems}
              activeHref={activePage}
              baseColor={darkMode ? "#166534" : "#0F2417"}
              pillColor={darkMode ? "#1C2433" : "#FFFFFF"}
              hoveredPillTextColor="#FFFFFF"
              pillTextColor={darkMode ? "#CBD5E1" : "#374151"}
              initialLoadAnimation={false}
              onSelect={(href) => {
                setActivePage(href as typeof activePage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
