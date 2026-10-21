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
import { navigateToApp } from './config';
import './styles/landing.css';
import './styles/skin.css';

export function App() {
  const handleGoToDashboard = () => {
    navigateToApp();
  };

  return (
    <div className="lp-root">
      <LandingNavbar onGoToDashboard={handleGoToDashboard} />
      <main id="main-content">
        <LandingHero onGoToDashboard={handleGoToDashboard} />
        <ExamMetricsBanner />
        <SpeedBoosterWidget onGoToDashboard={handleGoToDashboard} />
        <ExamCountdownWidget onGoToDashboard={handleGoToDashboard} />
        <CutoffPredictorWidget onGoToDashboard={handleGoToDashboard} />
        <TcsWeightageTable onGoToDashboard={handleGoToDashboard} />
        <PrepIntro />
        <ExamSelectorTabs onGoToDashboard={handleGoToDashboard} />
        <ExamProcess onGoToDashboard={handleGoToDashboard} />
        <SyllabusBoard onGoToDashboard={handleGoToDashboard} />
        <TierGuide />
        <RailwaySection onGoToDashboard={handleGoToDashboard} />
        <OverlapSection />
        <PrepGuide onGoToDashboard={handleGoToDashboard} />
        <BentoFeatures onGoToDashboard={handleGoToDashboard} />
        <HowTheAppWorks onGoToDashboard={handleGoToDashboard} />
        <PracticePointers onGoToDashboard={handleGoToDashboard} />
        <StudyLoopSection onGoToDashboard={handleGoToDashboard} />
        <AspirantSuccessStories />
        <FaqAccordion />
        <LandingCta onGoToDashboard={handleGoToDashboard} />
      </main>

      <LandingFooter onGoToDashboard={handleGoToDashboard} />
      <StickyMobileCta onGoToDashboard={handleGoToDashboard} />
    </div>
  );
}

export default App;
