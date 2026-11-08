import React from 'react';
import { Check } from 'lucide-react';
import { EventStage, StageState, stageState } from '../../data/events';

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Vertical timeline of an event's stages. With `sample`, stages are numbered "Step 1, 2…"
 * instead of dated, and none is marked done or current.
 */
export const EventTimeline: React.FC<{ stages: EventStage[]; sample?: boolean }> = ({ stages, sample = false }) => (
  <ol className="relative">
    {stages.map((stage, index) => {
      const state: StageState = sample ? 'upcoming' : stageState(stage);
      const isLast = index === stages.length - 1;
      const when = sample
        ? `Step ${index + 1}`
        : stage.endDate
        ? `${formatDate(stage.date)} – ${formatDate(stage.endDate)}`
        : formatDate(stage.date);
      return (
        <li key={stage.title} className="relative flex gap-4 pb-8 last:pb-0">
          {/* Connector line to the next stage */}
          {!isLast && (
            <span
              aria-hidden="true"
              className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${state === 'done' ? 'bg-[#063028]' : 'bg-stone-200'}`}
            />
          )}
          {/* Stage marker */}
          <span
            className={`relative z-10 h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
              state === 'done'
                ? 'bg-[#063028] border-[#063028] text-white'
                : state === 'now'
                ? 'bg-[#c48825] border-[#c48825] text-white ring-4 ring-[#c48825]/20'
                : 'bg-white border-stone-300 text-stone-500'
            }`}
          >
            {state === 'done' ? <Check className="h-4 w-4" /> : index + 1}
          </span>
          <div className="pt-0.5 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9a6a1b]">{when}</span>
              {state === 'now' && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-[#c48825] px-2 py-0.5 rounded-full">
                  Happening now
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#063028]">{stage.title}</h3>
            <p className="text-sm text-stone-600 leading-relaxed">{stage.description}</p>
          </div>
        </li>
      );
    })}
  </ol>
);
