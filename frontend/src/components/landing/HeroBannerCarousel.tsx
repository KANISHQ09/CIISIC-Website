import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface BannerSlide {
  id: string | number;
  image: string;
  alt: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  linkText?: string;
  linkUrl?: string;
  isExternal?: boolean;
  objectPosition?: string;
}

const defaultHeroBanners: BannerSlide[] = [
  {
    id: 'launch-7-excellence-cells',
    image: '/images/Photos/Launch-of-7-Excellence-Cells-July-2026.jpeg',
    alt: 'Official Launch of 7 Industry Excellence Cells - July 2026',
    badge: 'JULY 2026',
    title: 'Official Launch of 7 Industry Excellence Cells',
    objectPosition: 'center 38%',
  },
  {
    id: 'leadership-meet-july-2026',
    image: '/images/Photos/Industry-Academia-Excellence-Cell-Leadership-Meet-July-2026.jpeg',
    alt: 'Industry Academia Excellence Cell Leadership Meet - July 2026',
    badge: 'JULY 2026',
    title: 'Industry Academia Excellence Cell Leadership Meet',
    objectPosition: 'center 46%',
  },
  {
    id: 'interaction-ps-higher-education',
    image: '/images/Photos/Interaction-with-PS-Higher-Education_-Govt-of-MP-July-2026.jpeg',
    alt: 'Interaction with PS Higher Education, Govt of MP - July 2026',
    badge: 'JULY 2026',
    title: 'Interaction with PS Higher Education, Govt of MP',
    objectPosition: 'center 38%',
  },
  {
    id: 'industry-academia-strategic-dialogue',
    image: '/images/Photos/July-2026-_2_.jpeg',
    alt: 'Industry-Academia Strategic Dialogue - July 2026',
    badge: 'JULY 2026',
    title: 'Industry-Academia Strategic Dialogue',
    objectPosition: 'center 40%',
  },
  {
    id: 'leadership-felicitation-memento',
    image: '/images/Photos/July-2026.jpeg',
    alt: 'Leadership Felicitation & Memento Presentation - July 2026',
    badge: 'JULY 2026',
    title: 'Leadership Felicitation & Memento Presentation',
    objectPosition: 'center 40%',
  },
  {
    id: 'roundtable-march-2026',
    image: encodeURI('/images/Photos/Round Table on Industry Academia Collaboration Ma 2026.jpeg'),
    alt: 'Round Table on Collaborative Innovation - March 2026',
    badge: 'MARCH 2026',
    title: 'Round Table on Collaborative Innovation',
    objectPosition: 'center 45%',
  },
  {
    id: 'survey-report-launch-feb-2026',
    image: encodeURI('/images/Photos/Industry Academia Survey Repot Launch Feb 2026.jpeg'),
    alt: 'Industry Academia Survey Report Launch - February 2026',
    badge: 'FEBRUARY 2026',
    title: 'Industry Academia Survey Report Launch',
    objectPosition: 'center 35%',
  },
  {
    id: 'roundtable-may-2025',
    image: encodeURI('/images/Photos/Round Table on Industry Academia Collaboration - May 2025 (2).jpeg'),
    alt: 'Round Table on Industry-Academia Collaboration - May 2025',
    badge: 'MAY 2025',
    title: 'Round Table on Industry-Academia Collaboration',
    objectPosition: 'center 42%',
  },
];

const AUTOPLAY_MS = 2500;
const SLIDE_MS = 800;

/**
 * Banner slideshow (a small built-in slider; it replaced the Swiper library to keep the home
 * page light). Loops and moves on by itself; pauses while hovered, while a keyboard user is on
 * it, or when the tab is hidden. With reduced motion it swaps photos without sliding.
 * Arrows, dots, keyboard arrows and swipe all work.
 * Only the photo on screen and its neighbours are downloaded; the rest load as they come up.
 */
export const HeroBannerCarousel: React.FC = () => {
  const slides = defaultHeroBanners;
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  // A dot click several slides away switches instantly instead of sliding past the others
  const [jumped, setJumped] = useState(false);
  // Paused while the pointer is over it or it has keyboard focus (tracked separately)
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Visitors who turn animations off still get the photos changing, only without the slide movement
  const reducedMotion = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const paused = hovered || focused;
  // Slides whose photo has been requested (the current one and its neighbours)
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0, 1 % count, (count - 1) % count]));
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (next: number) => {
      const target = ((next % count) + count) % count;
      setIndex((current) => {
        if (current !== target) {
          const neighbour = target === (current + 1) % count || target === (current - 1 + count) % count;
          setJumped(!neighbour);
          setPrevious(current);
        }
        return target;
      });
      setLoaded((set) => {
        const updated = new Set(set);
        [target, (target + 1) % count, (target - 1 + count) % count].forEach((i) => updated.add(i));
        return updated.size === set.size ? set : updated;
      });
    },
    [count]
  );
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Autoplay
  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setTimeout(() => {
      if (!document.hidden) goTo(index + 1);
    }, AUTOPLAY_MS + SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, count, goTo]);

  // Where each slide sits: on screen (0), just right (1), just left (-1), or out of the way (2).
  // Only the slide arriving and the one leaving animate; the rest move while off screen.
  const offsetOf = (i: number) => {
    const d = (i - index + count) % count;
    if (d === 0) return 0;
    if (d === 1) return 1;
    if (d === count - 1) return -1;
    return 2;
  };

  return (
    <div
      id="hero-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Highlights"
      tabIndex={0}
      className="w-full h-full relative overflow-hidden bg-stone-950 select-none flex-1 min-h-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c48825]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(e) => {
        // Keyboard users get a pause while they're on the banner; a mouse click doesn't pause it
        if ((e.target as HTMLElement).matches(':focus-visible')) setFocused(true);
      }}
      onBlur={(e) => {
        // Moving focus between its own buttons keeps it paused
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') goNext();
        if (e.key === 'ArrowLeft') goPrev();
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (dx < -40) goNext();
        if (dx > 40) goPrev();
      }}
    >
      {slides.map((banner, i) => {
        const offset = offsetOf(i);
        const animate = !reducedMotion && !jumped && (i === index || i === previous);
        return (
          <div
            key={banner.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== index}
            className="absolute inset-0 bg-stone-950 overflow-hidden flex items-center justify-center"
            style={{
              transform: `translateX(${offset * 100}%)`,
              transition: animate ? `transform ${SLIDE_MS}ms cubic-bezier(0.25, 0.8, 0.25, 1)` : 'none',
              visibility: offset === 2 ? 'hidden' : 'visible',
            }}
          >
            {/* Full-width cover photo, downloaded once the slide is near */}
            {loaded.has(i) && (
              <img
                src={banner.image}
                alt={banner.alt}
                loading="lazy"
                fetchPriority="low"
                decoding="async"
                style={{ objectPosition: banner.objectPosition || 'center center' }}
                className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-102"
                draggable={false}
              />
            )}

            {/* Smooth, multi-stop bottom-to-top gradient that fades seamlessly with zero hard boundary */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.6) 14%, rgba(0, 0, 0, 0.3) 28%, rgba(0, 0, 0, 0.1) 42%, rgba(0, 0, 0, 0) 58%)',
              }}
            />
            {/* Soft radial fill focused around bottom-left text quadrant */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 75% 60% at 12% 92%, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.32) 40%, rgba(0, 0, 0, 0.08) 70%, rgba(0, 0, 0, 0) 100%)',
              }}
            />

            {/* Slide caption, lower left */}
            <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 pb-5 sm:pb-7 md:pb-8 lg:pb-9 z-10 text-white">
              <div className="w-full max-w-[1400px] mx-auto">
                <div className="max-w-3xl lg:max-w-5xl space-y-1 sm:space-y-1.5">
                  {banner.badge && (
                    <div className="text-[#c48825] font-bold text-xs sm:text-sm md:text-[15px] tracking-wider uppercase font-sans drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                      {banner.badge}
                    </div>
                  )}
                  {banner.title && (
                    <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-[1.85rem] xl:text-[2.1rem] font-bold font-serif text-white tracking-tight leading-[1.25] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                      {banner.title}
                    </h2>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Previous / next */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={goPrev}
        className="absolute left-3 sm:left-5 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs border border-white/30 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 stroke-[2.2]" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={goNext}
        className="absolute right-3 sm:right-5 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs border border-white/30 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 stroke-[2.2]" />
      </button>

      {/* Slide dots */}
      <div className="absolute bottom-2.5 sm:bottom-3.5 left-0 right-0 z-20 flex items-center justify-center gap-2">
        {slides.map((banner, i) => (
          <button
            key={banner.id}
            type="button"
            aria-label={`Go to slide ${i + 1}: ${banner.title ?? banner.alt}`}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => goTo(i)}
            className={`h-2.5 sm:h-[11px] rounded-full transition-all duration-300 cursor-pointer ${
              i === index
                ? 'w-8 bg-[#c48825] shadow-[0_0_12px_rgba(196,136,37,0.85)]'
                : 'w-2.5 sm:w-[11px] bg-white/45 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
