import { LandingNavbar } from './components/LandingNavbar';
import { LandingHero } from './components/LandingHero';
import { ExamMetricsBanner } from './components/ExamMetricsBanner';
import { SpeedBoosterWidget } from './components/SpeedBoosterWidget';
import { CutoffPredictorWidget } from './components/CutoffPredictorWidget';
import { ExamCountdownWidget } from './components/ExamCountdownWidget';
import { TcsWeightageTable } from './components/TcsWeightageTable';
import {
  PrepIntro,
  ExamProcess,
  SyllabusBoard,
  TierGuide,
  RailwaySection,
  OverlapSection,
  PrepGuide,
  PracticePointers,
} from './components/ExamGuideSections';
import { ExamSelectorTabs } from './components/ExamSelectorTabs';
import { BentoFeatures } from './components/BentoFeatures';
import { HowTheAppWorks } from './components/HowTheAppWorks';
import { StudyLoopSection } from './components/StudyLoopSection';
import { AspirantSuccessStories } from './components/AspirantSuccessStories';
import { FaqAccordion } from './components/FaqAccordion';
import { LandingCta } from './components/LandingCta';
import { LandingFooter } from './components/LandingFooter';
import { StickyMobileCta } from './components/StickyMobileCta';
import type { LandingProps } from './types/landing.types';
import './landing.css';
import './skin.css';

export function LandingPage({ onGoToDashboard }: LandingProps) {
  return (
    <div className="lp-root">
      <LandingNavbar onGoToDashboard={onGoToDashboard} />
      <main id="main-content">
        <LandingHero onGoToDashboard={onGoToDashboard} />
        <ExamMetricsBanner />
        
        {/* Interactive Speed Calculation & Math Challenge */}
        <SpeedBoosterWidget onGoToDashboard={onGoToDashboard} />

        {/* Live Exam Countdown Radar */}
        <ExamCountdownWidget onGoToDashboard={onGoToDashboard} />

        {/* TCS Normalization & Cut-off Simulator */}
        <CutoffPredictorWidget onGoToDashboard={onGoToDashboard} />

        {/* Official TCS Subject Weightage & PYQ Hotspots */}
        <TcsWeightageTable onGoToDashboard={onGoToDashboard} />

        {/* Comprehensive Exam Guides & Pattern Deep Dive */}
        <PrepIntro />
        <ExamSelectorTabs onGoToDashboard={onGoToDashboard} />
        <ExamProcess onGoToDashboard={onGoToDashboard} />
        <SyllabusBoard onGoToDashboard={onGoToDashboard} />
        <TierGuide />
        <RailwaySection onGoToDashboard={onGoToDashboard} />
        <OverlapSection />
        <PrepGuide onGoToDashboard={onGoToDashboard} />

        {/* Feature Highlights & Study Loop */}
        <BentoFeatures onGoToDashboard={onGoToDashboard} />
        <HowTheAppWorks onGoToDashboard={onGoToDashboard} />
        <PracticePointers onGoToDashboard={onGoToDashboard} />
        <StudyLoopSection onGoToDashboard={onGoToDashboard} />

        {/* Social Proof & Verified Aspirant Reviews */}
        <AspirantSuccessStories />

        {/* Comprehensive High-Traffic SEO FAQs */}
        <FaqAccordion />

        {/* High-Converting Final Call to Action */}
        <LandingCta onGoToDashboard={onGoToDashboard} />
      </main>

      <LandingFooter onGoToDashboard={onGoToDashboard} />
      <StickyMobileCta onGoToDashboard={onGoToDashboard} />
    </div>
  );
}

export default LandingPage;
