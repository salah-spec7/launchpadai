/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserType, StudentProfile, Job, SwipeDirection } from '../types';
import { 
  X, Heart, Info, MapPin, Briefcase, DollarSign, 
  Github, Sparkles, AlertCircle, RefreshCw, Trophy, Zap, Keyboard, ArrowRight
} from 'lucide-react';

interface SwipeDeckProps {
  userType: UserType;
  currentUserId: string;
  cards: (StudentProfile | Job)[];
  onSwipe: (targetId: string, direction: SwipeDirection) => void;
  onResetDeck: () => void;
}

export function SwipeDeck({ userType, currentUserId, cards, onSwipe, onResetDeck }: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState<StudentProfile | Job | null>(null);
  const [swipeActionMessage, setSwipeActionMessage] = useState<{ text: string; dir: SwipeDirection } | null>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentIndex >= cards.length || showDetailModal) return;

      if (e.key === 'ArrowLeft') {
        triggerLocalSwipe('left');
      } else if (e.key === 'ArrowRight') {
        triggerLocalSwipe('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards, showDetailModal]);

  const activeCard = currentIndex < cards.length ? cards[currentIndex] : null;

  const triggerLocalSwipe = (direction: SwipeDirection) => {
    if (!activeCard) return;

    // Show temporary floating text banner overlay before proceeding
    setSwipeActionMessage({
      text: direction === 'right' ? 'SHORTLISTED' : 'PASSED',
      dir: direction
    });

    const targetId = activeCard.id;
    
    setTimeout(() => {
      setSwipeActionMessage(null);
      setCurrentIndex((prev) => prev + 1);
      onSwipe(targetId, direction);
    }, 450);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-indigo-600 bg-indigo-50 border-indigo-100';
  };

  const renderCardInner = () => {
    if (!activeCard) return null;

    const isStudentCard = 'major' in activeCard; // Heuristics checking

    if (isStudentCard) {
      // 1. CANDIDATE PROFILE SCREEN (For Recruiter swipers)
      const cand = activeCard as StudentProfile;
      // Synthesize a dummy score
      const simScore = Math.floor(Math.random() * 20) + 76;

      return (
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-4">
            {/* Top Badge Indicators layout */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-violet-100">
                {cand.university}
              </span>
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {cand.location}
              </div>
            </div>

            {/* Candidate Header */}
            <div className="flex items-start gap-4">
              <img 
                src={cand.avatarUrl} 
                alt={cand.fullName} 
                className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-slate-100"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight truncate">
                  {cand.fullName}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Class of {cand.graduationYear} • {cand.major}
                </p>
                {cand.gpa && (
                  <p className="text-[10px] text-emerald-600 font-bold font-mono mt-1">
                    GPA: {cand.gpa} / 4.00
                  </p>
                )}
              </div>
            </div>

            {/* Smart Score Gauging Bar */}
            <div className="p-3 bg-violet-50 border border-violet-100/50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-violet-800">
                <Sparkles className="w-4 h-4 fill-violet-400 text-violet-600" />
                AI MATCH RATING
              </div>
              <span className="text-sm font-extrabold text-violet-700 font-mono">
                {simScore}% Match
              </span>
            </div>

            {/* Catchy headline */}
            <p className="text-sm text-slate-800 font-semibold leading-snug">
              &ldquo;{cand.headline}&rdquo;
            </p>

            {/* AI Summary digest */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-dashed border-slate-200">
              <p className="text-xs text-slate-600 italic leading-relaxed line-clamp-3">
                {cand.aiSummary}
              </p>
            </div>

            {/* Chip rows */}
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-2">Featured Skill Stack</span>
              <div className="flex flex-wrap gap-1">
                {cand.skills.slice(0, 6).map((skill, index) => (
                  <span key={index} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Trigger Details footer */}
          <button 
            type="button"
            onClick={() => setShowDetailModal(cand)}
            className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-slate-400" /> Inspect Projects & GitHub statistics
          </button>
        </div>
      );
    } else {
      // 2. JOB DECK SPEC CARD (For Student swipers)
      const job = activeCard as Job;
      const computedScore = Math.floor(Math.random() * 15) + 82;

      return (
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-4">
            {/* Top Info Layout */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-violet-100">
                {job.jobType}
              </span>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {job.location}
              </div>
            </div>

            {/* Corporate Header */}
            <div className="flex items-start gap-4">
              <img 
                src={job.companyLogoUrl} 
                alt={job.companyName} 
                className="w-16 h-16 rounded-xl object-cover shadow-sm border border-slate-100"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight truncate leading-snug">
                  {job.title}
                </h3>
                <p className="text-sm font-semibold text-violet-600">
                  {job.companyName}
                </p>
                {job.salaryMin && (
                  <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <span>${job.salaryMin.toLocaleString()} - ${job.salaryMax?.toLocaleString()} / yr</span>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Score rating bar */}
            <div className="p-3 bg-violet-50 border border-violet-100/50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-violet-800">
                <Sparkles className="w-4 h-4 fill-violet-400 text-violet-600" />
                DOCK COMPATIBILITY
              </div>
              <span className="text-sm font-extrabold text-violet-700 font-mono">
                {computedScore}% Match
              </span>
            </div>

            {/* Description digest */}
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Company Description</span>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {job.description}
              </p>
            </div>

            {/* Requirements bullet snippet */}
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">Desired Skill Stack</span>
              <div className="flex flex-wrap gap-1">
                {job.requiredSkills.map((skill, index) => (
                  <span key={index} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium rounded-md">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-1">
              {job.compatibilityTags.map((tag, index) => (
                <span key={index} className="px-2 py-0.5 bg-violet-50 text-violet-700 font-semibold rounded text-[9px] uppercase tracking-wide">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Trigger Details footer */}
          <button 
            type="button"
            onClick={() => setShowDetailModal(job)}
            className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-slate-400" /> See Full Requirements & Details
          </button>
        </div>
      );
    }
  };

  // Details expand overlay modal block
  const renderDetailModal = () => {
    if (!showDetailModal) return null;

    const isStudent = 'major' in showDetailModal;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-slate-900/40 backdrop-blur-md">
        <div className="w-full max-w-xl bg-white border border-slate-200/85 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
          
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h3 className="text-lg font-extrabold text-slate-800">
              {isStudent ? 'Candidate Academic Summary' : 'Role Specifications'}
            </h3>
            <button 
              onClick={() => setShowDetailModal(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isStudent ? (
            /* Detailed Candidate Modal Info */
            <div className="space-y-4 text-xs select-none">
              {/* Core header info */}
              {(() => {
                const s = showDetailModal as StudentProfile;
                return (
                  <>
                    <div className="flex gap-4 items-center bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <img src={s.avatarUrl} alt="avatar" className="w-14 h-14 rounded-full object-cover" />
                      <div>
                        <h4 className="text-base font-extrabold text-slate-800">{s.fullName}</h4>
                        <p className="text-slate-500 font-medium">{s.university} • {s.major}</p>
                        <p className="text-[10px] text-violet-700 font-bold uppercase mt-1">Class of {s.graduationYear}</p>
                      </div>
                    </div>

                    <div>
                      <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider block mb-1">AI Analytical Bio</span>
                      <p className="text-slate-600 leading-relaxed text-xs bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                        {s.aiSummary}
                      </p>
                    </div>

                    {s.githubStats && (
                      <div>
                        <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider block mb-2 flex items-center gap-1">
                          <Github className="w-4 h-4" /> Live GitHub Repository Analytics
                        </span>
                        
                        <div className="grid grid-cols-3 gap-2 bg-slate-900 text-zinc-100 rounded-xl p-4 text-center font-mono">
                          <div>
                            <span className="text-[9px] text-zinc-400 block">REPOS</span>
                            <span className="text-base font-extrabold text-violet-400">{s.githubStats.publicRepos}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-400 block">STARS</span>
                            <span className="text-base font-extrabold text-violet-400">{s.githubStats.stars}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-400 block">FOLLOWERS</span>
                            <span className="text-base font-extrabold text-violet-400">{s.githubStats.followers}</span>
                          </div>
                        </div>

                        {/* Languages list */}
                        <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <span className="font-bold text-[10px] text-slate-500 block mb-2">Codebase Language Split (%)</span>
                          <div className="flex gap-2.5 flex-wrap">
                            {Object.entries(s.githubStats.languages).map(([lang, pct]) => (
                              <div key={lang} className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                                <span className="font-mono text-[10px] text-slate-600 font-bold">{lang} ({pct}%)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {s.portfolioUrl && (
                      <div className="pt-2">
                        <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider block mb-1">Affiliated Links</span>
                        <div className="flex gap-3 text-violet-600 font-semibold font-mono">
                          <a href={`https://${s.portfolioUrl}`} target="_blank" rel="noreferrer" className="hover:underline">🌐 {s.portfolioUrl}</a>
                          {s.githubUrl && <a href={`https://${s.githubUrl}`} target="_blank" rel="noreferrer" className="hover:underline">💻 {s.githubUrl}</a>}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            /* Detailed Job Modal Info */
            <div className="space-y-4 text-xs select-none">
              {(() => {
                const j = showDetailModal as Job;
                return (
                  <>
                    <div className="flex gap-4 items-center bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <img src={j.companyLogoUrl} alt="logo" className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <h4 className="text-base font-extrabold text-slate-800">{j.title}</h4>
                        <p className="text-violet-600 font-bold">{j.companyName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{j.location} • {j.jobType}</p>
                      </div>
                    </div>

                    <div>
                      <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider block mb-1">Company & Role Overview</span>
                      <p className="text-slate-600 leading-relaxed text-xs">
                        {j.description}
                      </p>
                    </div>

                    <div>
                      <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider block mb-2">Qualifications & Requirements</span>
                      <ul className="space-y-1.5 list-disc list-inside text-slate-600 font-medium">
                        {j.requirements.map((req, index) => (
                          <li key={index} className="leading-snug">{req}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider block mb-2 font-mono">Target Compensation Spec</span>
                      <div className="p-3 bg-violet-50 text-violet-800 font-bold rounded-xl flex justify-between items-center text-xs">
                        <span>Expected Base Salary Range:</span>
                        <span className="font-mono text-sm">${j.salaryMin?.toLocaleString()} - ${j.salaryMax?.toLocaleString()} / year</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <button
            onClick={() => setShowDetailModal(null)}
            className="w-full mt-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs tracking-wider cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center py-4 select-none">
      
      {/* Keyboard guide tool */}
      <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-semibold tracking-wider uppercase mb-5 border border-slate-200/80">
        <Keyboard className="w-3.5 h-3.5 text-slate-400" />
        Keyboard shortcuts enabled: Press <kbd className="bg-white border rounded px-1 text-slate-700">← Reject</kbd> or <kbd className="bg-white border rounded px-1 text-slate-700">→ Shortlist</kbd>
      </div>

      <div className="relative w-full max-w-sm h-[530px]">
        {/* Swipe animation banners */}
        {swipeActionMessage && (
          <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 mx-auto w-48 text-center py-4 rounded-2xl font-extrabold text-lg tracking-widest border shadow-xl animate-bounce ${
            swipeActionMessage.dir === 'right'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-600 text-shadow shadow-emerald-100'
              : 'bg-rose-50 border-rose-300 text-rose-600 text-shadow shadow-rose-100'
          }`}>
            {swipeActionMessage.text}
          </div>
        )}

        {/* Dynamic layered card lists */}
        {activeCard ? (
          <div className="absolute inset-0 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl shadow-slate-100/60 flex flex-col justify-between transition-transform duration-300 hover:scale-[1.01]">
            {renderCardInner()}
          </div>
        ) : (
          /* Empty/Completed stack view */
          <div className="absolute inset-x-0 top-12 flex flex-col items-center text-center p-8 bg-white border border-slate-200 rounded-3xl shadow-lg">
            <div className="p-4 bg-violet-50 text-violet-600 rounded-full mb-4">
              <Trophy className="w-8 h-8 fill-violet-200/55 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">You&apos;ve cleared the deck!</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
              No more candidates or positions left in your immediately hydrated queue. Click below to recycle the stack and swipe again.
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0);
                onResetDeck();
              }}
              className="mt-5 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-violet-400" /> Recycle swipe cards
            </button>
          </div>
        )}
      </div>

      {/* Manual Swiping Buttons control panel */}
      {activeCard && (
        <div className="flex items-center gap-6 mt-6">
          <button
            onClick={() => triggerLocalSwipe('left')}
            className="p-4 bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50/50 text-rose-500 rounded-full shadow-md active:scale-90 transition cursor-pointer"
            title="Reject (Or left arrow)"
          >
            <X className="w-6 h-6 stroke-[3]" />
          </button>
          <button
            onClick={() => triggerLocalSwipe('right')}
            className="p-4 bg-white border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 text-emerald-500 rounded-full shadow-md active:scale-90 transition cursor-pointer"
            title="Shortlist (Or right arrow)"
          >
            <Heart className="w-6 h-6 fill-emerald-100 stroke-[3]" />
          </button>
        </div>
      )}

      {renderDetailModal()}
    </div>
  );
}
