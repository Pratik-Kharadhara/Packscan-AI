import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Scan,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  History,
  Scale,
  PanelBottomClose,
  PanelBottomOpen,
} from 'lucide-react';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { UploadZone } from './components/scan/UploadZone';
import { PipelineStepper } from './components/scan/PipelineStepper';
import { ResultsDashboard } from './components/results/ResultsDashboard';
import { ScanHistoryPage } from './components/history/ScanHistoryPage';
import { AboutImpactPage } from './components/about/AboutImpactPage';
import { MagnificationDock, type DockItemData } from './components/common/MagnificationDock';

import { ScanResult, PipelineStageId, ScanMode } from './types';
import {
  INITIAL_MOCK_SCANS,
  SAMPLE_COMPLIANT,
  SAMPLE_NEEDS_REVIEW,
  SAMPLE_NON_COMPLIANT,
} from './data/mockScans';
import { analyzePackage, analyzeBatchPackages, fetchBackendHistory } from './services/analyzer';

const STORAGE_KEY = 'packscan_audit_history_v1';

export function App() {
  const [activePage, setActivePage] = useState<'home' | 'scan' | 'results' | 'history' | 'about'>('home');
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(SAMPLE_NEEDS_REVIEW);
  const [batchResults, setBatchResults] = useState<ScanResult[]>([]);

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

  // Hydrate persistent scan history from backend SQLite database on mount
  useEffect(() => {
    fetchBackendHistory().then((backendScans) => {
      if (backendScans && backendScans.length > 0) {
        setScanHistory((prev) => {
          const merged = [...backendScans, ...prev.filter((p) => !backendScans.some((b) => b.id === p.id))];
          return merged;
        });
      }
    });
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
    alert('Scan history has been reset to the default demonstration dataset.');
  };

  const [isDockMinimized, setIsDockMinimized] = useState(false);

  // Global floating MagnificationDock items for quick-access navigation & evaluation
  const dockItems: DockItemData[] = [
    {
      icon: <Home className="w-5 h-5 text-[#1F2937]" />,
      label: 'Home Overview',
      active: activePage === 'home',
      onClick: () => {
        setActivePage('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      icon: <Scan className="w-5 h-5 text-[#166534]" />,
      label: 'Verify Package',
      active: activePage === 'scan',
      onClick: () => {
        setActivePage('scan');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-[#15803D]" />,
      label: 'Demo: Compliant',
      onClick: () => handleQuickPreset('compliant'),
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-[#B45309]" />,
      label: 'Demo: Needs Review',
      onClick: () => handleQuickPreset('needs_review'),
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-[#B91C1C]" />,
      label: 'Demo: Non-Compliant',
      onClick: () => handleQuickPreset('non_compliant'),
    },
    {
      icon: <History className="w-5 h-5 text-[#4B5563]" />,
      label: 'Audit History',
      active: activePage === 'history',
      onClick: () => {
        setActivePage('history');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      icon: <Scale className="w-5 h-5 text-[#166534]" />,
      label: 'Legal Framework',
      active: activePage === 'about',
      onClick: () => {
        setActivePage('about');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F5] text-[#1F2937] selection:bg-[#DCFCE7] selection:text-[#166534] font-sans">
      {/* Top Main Navigation */}
      <Navbar activePage={activePage} onNavigate={setActivePage} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32">
        {/* Processing Pipeline Modal / Overlay (active when engine is running) */}
        {isAnalyzing && (
          <div className="fixed inset-0 z-50 bg-[#1F2937]/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-3xl">
              <PipelineStepper
                currentStageId={currentStageId}
                progress={pipelineProgress}
                customMessage={pipelineMessage}
              />
            </div>
          </div>
        )}

        {/* View Router with Smooth Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.165, 0.84, 0.44, 1] }}
          >
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
                  <span className="text-xs font-extrabold text-[#166534] uppercase tracking-wider">
                    Digital Inspection Portal
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
                    Package Compliance Scanner
                  </h1>
                  <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
                    Upload single or multi-angle packaging photos (Front, Back &amp; Side surfaces, or batch items) or test verified demonstration presets.
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

            {activePage === 'about' && <AboutImpactPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating macOS-Style Quick Navigation & Preset Magnification Dock */}
      <div className="fixed bottom-4 left-0 right-0 z-40 flex flex-col items-center pointer-events-none px-4">
        <div className="pointer-events-auto flex items-center gap-2">
          {!isDockMinimized && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <MagnificationDock
                logo={<ShieldCheck className="w-4 h-4 text-white" />}
                logoAlt="PackScan Command"
                onLogoClick={() => {
                  setActivePage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                items={dockItems}
                panelHeight={56}
                baseItemSize={44}
                magnification={68}
                distance={170}
                baseColor="#166534"
              />
            </motion.div>
          )}

          {/* Dock Minimize / Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDockMinimized(!isDockMinimized)}
            title={isDockMinimized ? 'Expand Quick Dock' : 'Minimize Quick Dock'}
            className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md border border-[#D1D5DB] shadow-md flex items-center justify-center text-[#4B5563] hover:text-[#166534] hover:border-[#166534] transition-all hover:scale-105 active:scale-95"
          >
            {isDockMinimized ? (
              <PanelBottomOpen className="w-4 h-4" />
            ) : (
              <PanelBottomClose className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export default App;
