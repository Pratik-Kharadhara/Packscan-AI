import React from 'react';
import { ThreeHeroScene } from './ThreeHeroScene';

export const ClayHeroDiorama: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <ThreeHeroScene className={className} />;
};

export default ClayHeroDiorama;
