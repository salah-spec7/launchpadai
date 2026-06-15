/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserType } from '../types';
import { GraduationCap, Briefcase, Zap, Flame, UserCheck } from 'lucide-react';

interface RoleSelectorProps {
  onSelected: (role: UserType, name: string) => void;
}

export function RoleSelector({ onSelected }: RoleSelectorProps) {
  const [role, setRole] = useState<UserType>('student');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please provide your full name to start matching.');
      return;
    }
    onSelected(role, fullName.trim());
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-100/30 transition-all duration-300">
        
        {/* Title Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
            <Flame className="w-3.5 h-3.5 fill-violet-500 text-violet-500" />
            LaunchPad AI Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            LaunchPad <span className="text-violet-600">AI</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            The swipeable student recruiting deck with instant AI vetting and automatically scheduled Google Meets.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-2">
              Your Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Alex Chen or Dave Kim"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/85 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition text-sm"
            />
            {error && (
              <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                <span>⚠️</span> {error}
              </p>
            )}
          </div>

          {/* Role selection toggle containers */}
          <div>
            <label className="block text-xs font-bold text-slate-700 tracking-wider uppercase mb-3">
              Describe Your Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Option Student */}
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 text-center transition ${
                  role === 'student'
                    ? 'border-violet-600 bg-violet-50/40 text-violet-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <GraduationCap className={`w-8 h-8 mb-2.5 ${role === 'student' ? 'text-violet-600' : 'text-slate-400'}`} />
                <span className="font-bold text-sm block">Student</span>
                <span className="text-[11px] opacity-80 mt-1 block">Swipe internships & connect</span>
              </button>

              {/* Option Recruiter */}
              <button
                type="button"
                onClick={() => setRole('recruiter')}
                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 text-center transition ${
                  role === 'recruiter'
                    ? 'border-violet-600 bg-violet-50/40 text-violet-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <Briefcase className={`w-8 h-8 mb-2.5 ${role === 'recruiter' ? 'text-violet-600' : 'text-slate-400'}`} />
                <span className="font-bold text-sm block">Recruiter</span>
                <span className="text-[11px] opacity-80 mt-1 block">Swipe applicants & auto-meet</span>
              </button>
            </div>
          </div>

          {/* Prompt info */}
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3.5 text-xs text-slate-500 flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              {role === 'student'
                ? 'Student profiles parse projects automatically using GitHub or resume metadata, matching you with appropriate recruiters.'
                : 'Recruiters can swipe candidate decks, review AI technical summaries, and bypass outreach lag using calendar triggers.'}
            </span>
          </div>

          {/* Call to action */}
          <button
            type="submit"
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-slate-950/10 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-violet-400 transition group-hover:scale-110" />
            Proceed to Smart Setup
          </button>
        </form>
      </div>
    </div>
  );
}
