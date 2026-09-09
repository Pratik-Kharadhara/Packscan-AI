import React from 'react';

interface ThreePackageInspectorProps {
  packageType?: string;
  onRotate?: (angle: number) => void;
}

export const ThreePackageInspector: React.FC<ThreePackageInspectorProps> = () => {
  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center rounded-2xl bg-[#F7F8F5] border border-[#D1D5DB] p-4 text-xs font-mono text-[#6B7280]">
      Package 3D Multi-Angle Surface Inspector
    </div>
  );
};
