import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, CheckCircle2, Mail } from 'lucide-react';
import { EXCELLENCE_CELLS, ExcellenceCellData } from '../../data/excellenceCells';


/** Shown as its own page, so its title is the page heading. */
export const ExcellenceCellsSection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCell, setSelectedCell] = useState<ExcellenceCellData | null>(null);


  return (
    <section id="our-ecosystem" className="py-16 sm:py-24 bg-[#faf7f0] scroll-mt-20">
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf4f0] text-[#063028] text-xs font-semibold tracking-wide">
            Excellence Cells
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#063028] tracking-tight leading-tight font-serif">
            Driving Innovation Through Specialized Excellence
          </h1>
          <p className="text-stone-700 text-base sm:text-lg leading-relaxed">
            The CII Industry–Academia Excellence Initiative brings together specialized Excellence Cells hosted by leading partner institutions. Each Excellence Cell focuses on a specific domain, enabling industries to collaborate with the right academic expertise and student talent.
          </p>
        </div>

        {/* Cells Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-8">
          {EXCELLENCE_CELLS.map((cell) => (
            <button
              type="button"
              key={cell.id}
              onClick={() => setSelectedCell(cell)}
              aria-label={`${cell.name}: open the cell profile`}
              className="group h-full text-left bg-white border border-stone-200/90 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md hover:border-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#063028] transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-4">
                {/* Cell Image Frame - natural height to prevent cropping infographic text */}
                <div className="w-full overflow-hidden relative bg-white border-b border-stone-100">
                  <img 
                    src={cell.image} 
                    alt={cell.name} 
                    width={1200}
                    height={1200}
                    className="w-full h-auto block group-hover:scale-[1.01] transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                {/* Card Content - Partner label placed inline above title to prevent overlapping */}
                <div className="px-5 sm:px-6 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-600 uppercase tracking-wider">
                    {cell.icon}
                    <span>{cell.partner}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#063028] font-serif group-hover:text-[#c48825] transition-colors leading-snug">
                    {cell.name}
                  </h3>
                  <p className="text-sm text-stone-700 leading-relaxed font-normal">
                    {cell.brief}
                  </p>
                  {cell.email && (
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-[#063028] break-all">
                      <Mail className="h-4 w-4 shrink-0 text-[#c48825]" aria-hidden="true" />
                      {cell.contactName ? `${cell.contactName} · ` : ''}
                      {cell.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6 pt-2 mt-4 flex items-center gap-1.5 text-sm font-bold text-[#063028] group-hover:text-[#c48825] transition-colors">
                <span>Explore Cell Details</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          ))}
        </div>

        {/* Explore All Excellence Cells Button */}
        <div className="mt-16 text-center">
          <Link
            to="/institutions"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#063028] hover:bg-[#04201a] text-white rounded-xl text-sm sm:text-base font-bold shadow-xs transition-all duration-200 cursor-pointer"
          >
            See participating institutions
          </Link>
        </div>

      </div>

      {/* Slide-Over Drawer/Modal for Cell Details */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-[#04201a]/70 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCell(null)}
          ></div>

          {/* Centered Modal Card Container */}
          <div className="relative w-full max-w-5xl bg-white rounded-3xl border border-stone-200 shadow-2xl flex flex-col justify-between z-10 max-h-[90vh] overflow-hidden">
            
            {/* Header Block - Sticky top */}
            <div className="border-b border-stone-100 p-6 flex justify-between items-center bg-[#faf7f0] shrink-0">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase text-[#a6711c] tracking-wider">
                  Excellence Cell Profile
                </span>
                <h3 className="text-2xl font-bold text-[#063028] font-serif">
                  {selectedCell.name}
                </h3>
                <p className="text-sm text-stone-600 font-medium">
                  Partner Institution: {selectedCell.partner}
                </p>
                {selectedCell.email && (
                  <p className="text-sm text-stone-700">
                    Contact: {selectedCell.contactName ? `${selectedCell.contactName}, ` : ''}
                    <a href={`mailto:${selectedCell.email}`} className="font-semibold text-[#063028] underline underline-offset-2 hover:text-[#c48825]">
                      {selectedCell.email}
                    </a>
                  </p>
                )}
              </div>
              <button 
                onClick={() => setSelectedCell(null)}
                className="p-2.5 bg-white hover:bg-stone-100 text-stone-600 rounded-full border border-stone-200 shadow-xs transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Left Column: Profile Image */}
                <div className="w-full rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-xs md:sticky md:top-0">
                  <img 
                    src={selectedCell.image} 
                    alt={selectedCell.name} 
                    width={1200}
                    height={1200}
                    className="w-full h-auto block"
                    loading="lazy"
                  />
                </div>

                {/* Right Column: Text descriptions */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-stone-600 uppercase tracking-wider">About the Cell</h4>
                    <p className="text-base text-stone-800 leading-relaxed font-semibold">
                      {selectedCell.brief}
                    </p>
                    <p className="text-base text-stone-700 leading-relaxed">
                      {selectedCell.details}
                    </p>
                  </div>

                  {/* Extended Details */}
                  {selectedCell.extended && (
                    <div className="space-y-6 pt-6 border-t border-stone-100">
                      {selectedCell.extended.vision && (
                        <div className="bg-[#faf7f0] border border-stone-200/80 p-5 rounded-2xl space-y-2">
                          <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Our Vision</h4>
                          <p className="text-base text-stone-800 font-medium leading-relaxed">
                            {selectedCell.extended.vision}
                          </p>
                        </div>
                      )}

                      {/* Who This Is For */}
                      {selectedCell.extended.whoThisIsFor && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-stone-600 uppercase tracking-wider">Who This Is For</h4>
                          <ul className="space-y-2.5">
                            {selectedCell.extended.whoThisIsFor.map((item, idx) => (
                              <li key={idx} className="flex gap-2.5 items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#063028] mt-2 shrink-0" />
                                <span className="text-sm sm:text-base text-stone-700 leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Problems We Help Solve */}
                      {selectedCell.extended.problemsWeHelpSolve && (
                        <div className="space-y-3 pt-4 border-t border-stone-100">
                          <h4 className="text-sm font-bold text-stone-600 uppercase tracking-wider">Problems We Help Solve</h4>
                          <ul className="space-y-2.5">
                            {selectedCell.extended.problemsWeHelpSolve.map((item, idx) => (
                              <li key={idx} className="flex gap-2.5 items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#c48825] mt-2 shrink-0" />
                                <span className="text-sm sm:text-base text-stone-700 leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* How We Work Together */}
                      {selectedCell.extended.howWeWorkTogether && (
                        <div className="space-y-3 pt-4 border-t border-stone-100">
                          <h4 className="text-sm font-bold text-stone-600 uppercase tracking-wider">How We Work Together</h4>
                          <div className="bg-[#edf4f0] text-[#063028] px-4 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold inline-block">
                            {selectedCell.extended.howWeWorkTogether.flow}
                          </div>
                          <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
                            {selectedCell.extended.howWeWorkTogether.description}
                          </p>
                        </div>
                      )}

                      {/* What You Walk Away With */}
                      {selectedCell.extended.whatYouWalkAwayWith && (
                        <div className="space-y-3 pt-4 border-t border-stone-100">
                          <h4 className="text-sm font-bold text-stone-600 uppercase tracking-wider">What You Walk Away With</h4>
                          <ul className="space-y-2.5">
                            {selectedCell.extended.whatYouWalkAwayWith.map((item, idx) => (
                              <li key={idx} className="flex gap-2.5 items-start">
                                <CheckCircle2 className="h-5 w-5 text-[#063028] shrink-0 mt-0.5" />
                                <span className="text-sm sm:text-base text-stone-700 font-medium leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Why an Academic AI Partner / Why Partner */}
                      {selectedCell.extended.whyPartner && (
                        <div className="space-y-3 pt-4 border-t border-stone-100">
                          <h4 className="text-sm font-bold text-stone-600 uppercase tracking-wider">
                            {selectedCell.extended.whyPartnerTitle || 'Why Partner with Us?'}
                          </h4>
                          <ul className="space-y-2.5">
                            {selectedCell.extended.whyPartner.map((item, idx) => (
                              <li key={idx} className="flex gap-2.5 items-start">
                                <CheckCircle2 className="h-5 w-5 text-[#063028] shrink-0 mt-0.5" />
                                <span className="text-sm sm:text-base text-stone-700 font-medium leading-normal">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* What We Offer - Structured with icons */}
                      {selectedCell.extended.structuredOfferings && (
                        <div className="space-y-4 pt-4 border-t border-stone-100">
                          <h4 className="text-sm font-bold text-stone-600 uppercase tracking-wider">What We Offer</h4>
                          <div className="space-y-4">
                            {selectedCell.extended.structuredOfferings.map((offering, idx) => (
                              <div key={idx} className="bg-[#faf7f0] border border-stone-200/80 p-4 rounded-xl space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{offering.icon}</span>
                                  <h5 className="font-bold text-[#063028] text-sm sm:text-base">{offering.title}</h5>
                                </div>
                                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed pl-7">
                                  {offering.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fallback legacy offerings if any */}
                      {selectedCell.extended.offerings && !selectedCell.extended.structuredOfferings && (
                        <div className="space-y-4 pt-4 border-t border-stone-100">
                          <h4 className="text-sm font-bold text-stone-600 uppercase tracking-wider">What We Offer</h4>
                          <div className="grid grid-cols-1 gap-3">
                            {selectedCell.extended.offerings.map((offering, idx) => {
                              const [title, desc] = offering.split(': ');
                              return (
                                <div key={idx} className="flex gap-3 items-start">
                                  <span className="h-6 w-6 rounded-full bg-[#edf4f0] text-[#063028] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <div className="text-sm sm:text-base">
                                    <strong className="font-bold text-[#063028]">{title}:</strong>
                                    <span className="text-stone-700 ml-1 leading-relaxed">{desc}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-stone-100 p-6 bg-[#faf7f0] flex justify-end gap-3">
              <button
                onClick={() => setSelectedCell(null)}
                className="px-5 py-3 border border-stone-300 hover:bg-stone-100 rounded-xl text-sm font-bold text-stone-700 cursor-pointer"
              >
                Close Profile
              </button>
              <button
                onClick={() => {
                  setSelectedCell(null);
                  navigate('/#get-involved');
                }}
                className="px-6 py-3 bg-[#063028] hover:bg-[#04201a] text-white rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                Connect &amp; Collaborate
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};
