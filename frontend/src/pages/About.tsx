import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { AboutSection } from '../components/landing/AboutSection';
import { WhyCiiSection } from '../components/landing/WhyCiiSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { usePageTitle } from '../lib/usePageTitle';

export const About: React.FC = () => {
  usePageTitle('About');
  return (
    <div className="bg-[#faf8f4] overflow-x-hidden">
      <HeroSection />
      <AboutSection />
      <WhyCiiSection />
      <TestimonialsSection />
    </div>
  );
};
