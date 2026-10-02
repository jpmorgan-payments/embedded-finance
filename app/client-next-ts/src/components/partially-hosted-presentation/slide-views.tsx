import type { ComponentType } from 'react';

import { PlaygroundSlide, UrlBudgetSlide } from './customize-slides';
import type { SlideViewProps } from './deck-ui';
import {
  ComponentPropertiesSlide,
  ExperiencesSlide,
} from './experience-slides';
import { OptionsSlide, SplitSlide, WelcomeSlide } from './intro-slides';
import {
  IframeSlide,
  PrerequisitesSlide,
  SequenceSlide,
  SessionApiSlide,
} from './journey-slides';
import {
  NextStepsSlide,
  ResponsibilitiesSlide,
  ResultsSlide,
  SecuritySlide,
} from './ship-slides';
import { UtilitySlide } from './utility-slides';

export const SLIDE_VIEWS: Record<string, ComponentType<SlideViewProps>> = {
  welcome: WelcomeSlide,
  split: SplitSlide,
  options: OptionsSlide,
  prerequisites: PrerequisitesSlide,
  sequence: SequenceSlide,
  'session-api': SessionApiSlide,
  iframe: IframeSlide,
  experiences: ExperiencesSlide,
  'component-properties': ComponentPropertiesSlide,
  utility: UtilitySlide,
  playground: PlaygroundSlide,
  'url-budget': UrlBudgetSlide,
  security: SecuritySlide,
  results: ResultsSlide,
  responsibilities: ResponsibilitiesSlide,
  'next-steps': NextStepsSlide,
};
