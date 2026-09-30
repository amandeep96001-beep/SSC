import { LandingNavbar } from './components/LandingNavbar';
import { LandingHero } from './components/LandingHero';
import { ExamMetricsBanner } from './components/ExamMetricsBanner';
import { PrepIntro, ExamProcess, SyllabusBoard, TierGuide, RailwaySection, OverlapSection, PrepGuide, PracticePointers } from './components/ExamGuideSections';
import { ExamSelectorTabs } from './components/ExamSelectorTabs';
import { BentoFeatures } from './components/BentoFeatures';
import { HowTheAppWorks } from './components/HowTheAppWorks';
import { StudyLoopSection } from './components/StudyLoopSection';
import { FaqAccordion } from './components/FaqAccordion';
import { LandingCta } from './components/LandingCta';
import { LandingFooter } from './components/LandingFooter';
import type { LandingProps } from './types/landing.types';
import './landing.css';

export function LandingPage({ onGoToDashboard }: LandingProps) {
  return (
    <div className="lp-root">
      <LandingNavbar onGoToDashboard={onGoToDashboard} />
      <main id="main-content">
        <LandingHero onGoToDashboard={onGoToDashboard} />
        <ExamMetricsBanner />
        <PrepIntro />
        <ExamSelectorTabs onGoToDashboard={onGoToDashboard} />
        <ExamProcess onGoToDashboard={onGoToDashboard} />
        <SyllabusBoard onGoToDashboard={onGoToDashboard} />
        <TierGuide />
        <RailwaySection onGoToDashboard={onGoToDashboard} />
        <OverlapSection />
        <PrepGuide onGoToDashboard={onGoToDashboard} />
        <BentoFeatures onGoToDashboard={onGoToDashboard} />
        <HowTheAppWorks onGoToDashboard={onGoToDashboard} />
        <PracticePointers onGoToDashboard={onGoToDashboard} />
        <StudyLoopSection onGoToDashboard={onGoToDashboard} />
        <FaqAccordion />
        <LandingCta onGoToDashboard={onGoToDashboard} />
      </main>
      <LandingFooter onGoToDashboard={onGoToDashboard} />
    </div>
  );
}

export default LandingPage;
