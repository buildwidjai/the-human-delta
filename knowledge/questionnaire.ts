// The 20-question Performance Audit (4 TEMR pillars × 5 items + 12 probes).
// Single source of truth — re-exported by src/lib/questionnaire-data.ts.

export interface Question {
  id: number;
  text: string;
  isReversed?: boolean;
  isProbe?: boolean;
  probeLabel?: string; // e.g. "1.1", "2.3"
}

export interface GameSection {
  game: number;
  title: string;
  pillar: string; // "Tactical" | "Emotional" | "Mental" | "Relational"
  subtitle: string;
  foundational: Question[];
  probes: Question[];
}

export const REVERSE_SCORED_IDS = [10, 15, 18, 19];

export const gameSections: GameSection[] = [
  {
    game: 1,
    title: "THE INNER GAME",
    pillar: "Emotional",
    subtitle: "Game 1 of 4",
    foundational: [
      { id: 1, text: "I find it easy to remain objective when receiving critical feedback." },
      { id: 2, text: "I am aware of how my mood affects my and my team's productivity." },
      { id: 3, text: "I can separate my personal self-worth from a project's success or failure." },
      { id: 4, text: "I have a specific routine (breath, walk, or reset) to handle stress after intense meetings." },
      { id: 5, text: "I feel in control of my schedule even during high-pressure weeks." },
    ],
    probes: [
      { id: 101, text: "I notice the physical and mental shift when I am reacting vs. responding.", isProbe: true, probeLabel: "1.1" },
      { id: 102, text: "I maintain clarity and composure when high-stakes situations become messy.", isProbe: true, probeLabel: "1.2" },
      { id: 103, text: "I remain grounded in my own standards even when external praise is absent.", isProbe: true, probeLabel: "1.3" },
    ],
  },
  {
    game: 2,
    title: "THE THINKING GAME",
    pillar: "Mental",
    subtitle: "Game 2 of 4",
    foundational: [
      { id: 6, text: "I can explain complex ideas in a way that is simple and actionable." },
      { id: 7, text: "I look for root causes and systemic patterns rather than just fixing symptoms." },
      { id: 8, text: "I am comfortable making decisions with 70% of available data rather than waiting for 100%." },
      { id: 9, text: "I proactively use AI (ChatGPT/Claude) to stress-test my logic or find blind spots." },
      { id: 10, text: "I find it difficult to move forward when project instructions or data are not 100% clear.", isReversed: true },
    ],
    probes: [
      { id: 201, text: "I can hold two opposing viewpoints and shift perspective when new evidence appears.", isProbe: true, probeLabel: "2.1" },
      { id: 202, text: 'I habitually consider the "second-order effects" (long-term ripples) of my decisions.', isProbe: true, probeLabel: "2.2" },
      { id: 203, text: 'I can quickly distinguish between a "distractive trend" and a "high-impact priority."', isProbe: true, probeLabel: "2.3" },
    ],
  },
  {
    game: 3,
    title: "THE EXECUTION GAME",
    pillar: "Tactical",
    subtitle: "Game 3 of 4",
    foundational: [
      { id: 11, text: "I use AI tools or automated triggers to handle my follow-ups and repetitive admin work." },
      { id: 12, text: 'I protect 60-90 minute blocks of "Deep Work" daily by disabling all notifications.' },
      { id: 13, text: "I identify my top 3 high-impact tasks daily before opening my inbox or Slack." },
      { id: 14, text: 'I close the "Final Mile" (documentation or status updates) the same day a task begins.' },
      { id: 15, text: 'I often prioritize clearing "quick/small" tasks over working on my biggest, most important project.', isReversed: true },
    ],
    probes: [
      { id: 301, text: "I am willing to move forward and test an idea with incomplete information.", isProbe: true, probeLabel: "3.1" },
      { id: 302, text: "I am known for completing what I start without being chased for updates.", isProbe: true, probeLabel: "3.2" },
      { id: 303, text: "I stay engaged and persistent in challenging situations even without immediate rewards.", isProbe: true, probeLabel: "3.3" },
    ],
  },
  {
    game: 4,
    title: "THE LEADERSHIP GAME",
    pillar: "Relational",
    subtitle: "Game 4 of 4",
    foundational: [
      { id: 16, text: "I am proactive in building relationships with people outside my immediate team." },
      { id: 17, text: 'I navigate "workplace politics" and unspoken organisational rules with ease.' },
      { id: 18, text: 'I find it difficult to say "no" to immediate help requests during my focus time.', isReversed: true },
      { id: 19, text: 'I prioritize "being liked" and team harmony over meeting strict project timelines.', isReversed: true },
      { id: 20, text: "I express honest perspectives under pressure, even when challenging senior ideas." },
    ],
    probes: [
      { id: 401, text: 'I create my own direction and "playbook" rather than waiting for instructions.', isProbe: true, probeLabel: "4.1" },
      { id: 402, text: "I actively build psychological safety, ensuring others feel safe to speak openly.", isProbe: true, probeLabel: "4.2" },
      { id: 403, text: "I can tailor my communication style to fit different personality types and hierarchies.", isProbe: true, probeLabel: "4.3" },
    ],
  },
];

export const scaleLabels = [
  { value: 1, short: "1", full: "Never" },
  { value: 2, short: "2", full: "Rarely" },
  { value: 3, short: "3", full: "Sometimes" },
  { value: 4, short: "4", full: "Usually" },
  { value: 5, short: "5", full: "Always" },
];