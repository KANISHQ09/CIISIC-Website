/**
 * Events shown on the Events page.
 *
 * To announce an event, add it to EVENTS below. Each stage of its timeline has a date, and
 * the page marks stages as done / happening now / coming up from those dates automatically.
 * While EVENTS is empty, the page shows "coming soon" with SAMPLE_EVENT as an example.
 */

export interface EventStage {
  title: string;
  description: string;
  /** Date the stage starts, as YYYY-MM-DD (ignored for the sample) */
  date: string;
  /** Optional last day, as YYYY-MM-DD, for stages that run over several days */
  endDate?: string;
}

export interface CiisicEvent {
  id: string;
  title: string;
  type: 'Hackathon' | 'Workshop' | 'Industry Meet' | 'Showcase';
  summary: string;
  location: string;
  /** Who can take part, e.g. "Students of partner institutions" */
  eligibility: string;
  /** Link to register, when registrations are open */
  registrationUrl?: string;
  stages: EventStage[];
}

export const EVENTS: CiisicEvent[] = [];

/** Example used while no real event is announced. Dates are placeholders and not shown. */
export const SAMPLE_EVENT: CiisicEvent = {
  id: 'sample-hackathon',
  title: 'CIISIC Industry Hackathon',
  type: 'Hackathon',
  summary:
    'Student teams from partner institutions solve live industry problem statements, guided by faculty mentors and judged by industry experts.',
  location: 'Partner institutions across Bhopal and Indore',
  eligibility: 'Student teams from CII partner institutions, with a faculty mentor',
  stages: [
    {
      title: 'Registrations open',
      description: 'Institutions register their student teams and faculty mentors.',
      date: '',
    },
    {
      title: 'Problem statements released',
      description: 'CII publishes the industry problem statements teams can choose from.',
      date: '',
    },
    {
      title: 'Idea submission',
      description: 'Teams submit their proposed approach for the problem they picked.',
      date: '',
    },
    {
      title: 'Shortlisting',
      description: 'An industry and academic panel shortlists the strongest ideas.',
      date: '',
    },
    {
      title: 'Build & mentoring',
      description: 'Shortlisted teams build a working prototype with mentor check-ins.',
      date: '',
    },
    {
      title: 'Grand finale',
      description: 'Teams present to industry judges; winners are announced and recognised.',
      date: '',
    },
  ],
};

export type StageState = 'done' | 'now' | 'upcoming';

/** Where a stage stands today, from its dates. */
export function stageState(stage: EventStage, today = new Date()): StageState {
  const start = new Date(`${stage.date}T00:00:00`);
  const end = new Date(`${stage.endDate ?? stage.date}T23:59:59`);
  if (today < start) return 'upcoming';
  if (today > end) return 'done';
  return 'now';
}

/** An event is over once its last stage has ended. */
export function isEventOver(event: CiisicEvent, today = new Date()): boolean {
  const last = event.stages[event.stages.length - 1];
  return !!last && stageState(last, today) === 'done';
}
