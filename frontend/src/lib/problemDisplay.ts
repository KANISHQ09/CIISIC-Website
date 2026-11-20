/** Shared helpers for problem statement cards: time left and short dates. */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Time left to submit a solution, split for cards: a big figure and a small word under it. */
export function timeLeft(deadline: string | undefined, now: number): { figure: string; unit: string; urgent: boolean } {
  if (!deadline) return { figure: 'Open', unit: 'no deadline', urgent: false };
  const msLeft = new Date(deadline).getTime() - now;
  if (msLeft <= 0) return { figure: 'Closed', unit: 'deadline passed', urgent: false };
  if (msLeft < DAY_MS) return { figure: '< 1', unit: 'day left', urgent: true };
  // Round up: 2 days and 5 hours left reads "3 days left"
  const days = Math.ceil(msLeft / DAY_MS);
  return { figure: String(days), unit: days === 1 ? 'day left' : 'days left', urgent: days <= 7 };
}

/** "12 Dec 2026" */
export const shortDate = (iso: string | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
