/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserType, StudentProfile, RecruiterProfile, Job, Match, Meeting, SwipeDirection } from './types';
import { RoleSelector } from './components/RoleSelector';
import { Onboarding } from './components/Onboarding';
import { SwipeDeck } from './components/SwipeDeck';
import { MatchModal } from './components/MatchModal';
import { Dashboard } from './components/Dashboard';
import { 
  PRESET_STUDENTS, PRESET_RECRUITERS, PRESET_JOBS, 
  INITIAL_MATCHES, INITIAL_MEETINGS 
} from './data/presets';
import { 
  Flame, Briefcase, GraduationCap, Trophy, Sparkles, LogOut, CheckCircle, Smartphone
} from 'lucide-react';

export default function App() {
  // Core Account States
  const [userRole, setUserRole] = useState<UserType | null>(null);
  const [userName, setUserName] = useState('');
  const [userProfile, setUserProfile] = useState<StudentProfile | RecruiterProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'swipe' | 'dashboard'>('swipe');

  // Database lists (Mirrored in LocalStorage)
  const [studentCards, setStudentCards] = useState<StudentProfile[]>([]);
  const [jobCards, setJobCards] = useState<Job[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Active floating modals
  const [activeCelebration, setActiveCelebration] = useState<{
    match: Match;
    student: StudentProfile;
    job: Job;
  } | null>(null);

  // Load presets or restore storage upon mounting
  useEffect(() => {
    // 1. Recover User sessions
    const storedRole = localStorage.getItem('lp_user_role') as UserType | null;
    const storedName = localStorage.getItem('lp_user_name') || '';
    const storedProfile = localStorage.getItem('lp_user_profile');

    if (storedRole) {
      setUserRole(storedRole);
      setUserName(storedName);
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      }
    }

    // 2. Recover or initialize databases
    const storedStudents = localStorage.getItem('lp_students');
    if (storedStudents) {
      setStudentCards(JSON.parse(storedStudents));
    } else {
      setStudentCards(PRESET_STUDENTS);
      localStorage.setItem('lp_students', JSON.stringify(PRESET_STUDENTS));
    }

    const storedJobs = localStorage.getItem('lp_jobs');
    if (storedJobs) {
      setJobCards(JSON.parse(storedJobs));
    } else {
      setJobCards(PRESET_JOBS);
      localStorage.setItem('lp_jobs', JSON.stringify(PRESET_JOBS));
    }

    const storedMatches = localStorage.getItem('lp_matches');
    if (storedMatches) {
      setMatches(JSON.parse(storedMatches));
    } else {
      setMatches(INITIAL_MATCHES);
      localStorage.setItem('lp_matches', JSON.stringify(INITIAL_MATCHES));
    }

    const storedMeetings = localStorage.getItem('lp_meetings');
    if (storedMeetings) {
      setMeetings(JSON.parse(storedMeetings));
    } else {
      setMeetings(INITIAL_MEETINGS);
      localStorage.setItem('lp_meetings', JSON.stringify(INITIAL_MEETINGS));
    }
  }, []);

  // Sync state helpers
  const saveUserProfile = (profile: StudentProfile | RecruiterProfile) => {
    setUserProfile(profile);
    localStorage.setItem('lp_user_profile', JSON.stringify(profile));
  };

  const handleRoleSelected = (role: UserType, name: string) => {
    setUserRole(role);
    setUserName(name);
    localStorage.setItem('lp_user_role', role);
    localStorage.setItem('lp_user_name', name);
  };

  const handleOnboardingCompleted = (profile: StudentProfile | RecruiterProfile) => {
    saveUserProfile(profile);

    // If student, let's append their profile to active, searchable student listings
    if (userRole === 'student') {
      const updatedStudents = [profile as StudentProfile, ...studentCards];
      setStudentCards(updatedStudents);
      localStorage.setItem('lp_students', JSON.stringify(updatedStudents));
    }
  };

  const handleResetAppSession = () => {
    localStorage.clear();
    setUserRole(null);
    setUserName('');
    setUserProfile(null);
    setActiveTab('swipe');
    setActiveCelebration(null);
    setStudentCards(PRESET_STUDENTS);
    setJobCards(PRESET_JOBS);
    setMatches(INITIAL_MATCHES);
    setMeetings(INITIAL_MEETINGS);
  };

  const handleSwipeInteraction = (targetId: string, direction: SwipeDirection) => {
    if (direction === 'left' || !userProfile) return;

    if (userRole === 'student') {
      // Swipe Right on a Job Card vacancy
      const swipedJob = jobCards.find(j => j.id === targetId);
      if (!swipedJob) return;

      // To make the demo immediately fascinating, swipe-right always results in a mutual match!
      const generatedMatch: Match = {
        id: `match-${Date.now()}`,
        jobId: swipedJob.id,
        studentId: userProfile.id,
        recruiterId: swipedJob.recruiterId,
        matchScore: Math.floor(Math.random() * 12) + 85, // Heuristics starting rating
        matchReasons: [
          'Excellent alignment on development stacks',
          'Candidate demonstrated strong hackathon contributions',
          'Responsive styling capabilities match project expectations'
        ],
        vettingStatus: 'pending',
        matchedAt: new Date().toISOString(),
        meetingScheduled: false
      };

      const updatedMatches = [generatedMatch, ...matches];
      setMatches(updatedMatches);
      localStorage.setItem('lp_matches', JSON.stringify(updatedMatches));

      // Trigger Celebration popup immediately!
      setActiveCelebration({
        match: generatedMatch,
        student: userProfile as StudentProfile,
        job: swipedJob
      });

    } else if (userRole === 'recruiter') {
      // Recruiter swipe right on a Student Card candidate
      const swipedStudent = studentCards.find(s => s.id === targetId);
      if (!swipedStudent) return;

      // Ensure the recruiter has at least one active job listed to match. Select first job preset:
      const targetJob = jobCards.find(j => j.recruiterId === userProfile.id) || jobCards[0];

      const generatedMatch: Match = {
        id: `match-${Date.now()}`,
        jobId: targetJob.id,
        studentId: swipedStudent.id,
        recruiterId: userProfile.id,
        matchScore: Math.floor(Math.random() * 15) + 82,
        matchReasons: [
          'Strong academic foundation matches recruitment goals',
          'Candidate possesses extensive direct technical experience',
          'Great potential for swift technical ramp-up'
        ],
        vettingStatus: 'pending',
        matchedAt: new Date().toISOString(),
        meetingScheduled: false
      };

      const updatedMatches = [generatedMatch, ...matches];
      setMatches(updatedMatches);
      localStorage.setItem('lp_matches', JSON.stringify(updatedMatches));

      setActiveCelebration({
        match: generatedMatch,
        student: swipedStudent,
        job: targetJob
      });
    }
  };

  const handleRecruiterPostNewJob = (newJob: Job) => {
    const updatedJobs = [newJob, ...jobCards];
    setJobCards(updatedJobs);
    localStorage.setItem('lp_jobs', JSON.stringify(updatedJobs));
    setActiveTab('swipe'); // Switch back to see cards
  };

  const handleBookingConfirmed = (meeting: Meeting) => {
    const updatedMeetings = [meeting, ...meetings];
    setMeetings(updatedMeetings);
    localStorage.setItem('lp_meetings', JSON.stringify(updatedMeetings));

    // Update matches list of meetingsScheduled indicator
    const updatedMatches = matches.map((m) => {
      if (m.id === meeting.matchId) {
        return { ...m, meetingScheduled: true };
      }
      return m;
    });
    setMatches(updatedMatches);
    localStorage.setItem('lp_matches', JSON.stringify(updatedMatches));
  };

  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
    const updatedMeetings = meetings.map((m) => m.id === updatedMeeting.id ? updatedMeeting : m);
    setMeetings(updatedMeetings);
    localStorage.setItem('lp_meetings', JSON.stringify(updatedMeetings));
  };

  const handleCancelMeeting = (meetingId: string) => {
    const updatedMeetings = meetings.map((m) => {
      if (m.id === meetingId) {
        return { ...m, status: 'cancelled' as const };
      }
      return m;
    });
    setMeetings(updatedMeetings);
    localStorage.setItem('lp_meetings', JSON.stringify(updatedMeetings));
  };

  const handleDeleteMeeting = (meetingId: string) => {
    const updatedMeetings = meetings.filter((m) => m.id !== meetingId);
    setMeetings(updatedMeetings);
    localStorage.setItem('lp_meetings', JSON.stringify(updatedMeetings));

    // Reset meetingScheduled flag in matches so recruiter/student can book again
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
      const updatedMatches = matches.map((m) => {
        if (m.id === meeting.matchId) {
          return { ...m, meetingScheduled: false };
        }
        return m;
      });
      setMatches(updatedMatches);
      localStorage.setItem('lp_matches', JSON.stringify(updatedMatches));
    }
  };

  const renderActiveTabContent = () => {
    if (activeTab === 'swipe') {
      return (
        <SwipeDeck
          userType={userRole!}
          currentUserId={userProfile?.id || ''}
          cards={userRole === 'student' ? jobCards : studentCards}
          onSwipe={handleSwipeInteraction}
          onResetDeck={() => {
            // Re-seed cards if they want to swipe again
            if (userRole === 'student') {
              setJobCards(PRESET_JOBS);
            } else {
              setStudentCards(PRESET_STUDENTS);
            }
          }}
        />
      );
    } else {
      return (
        <Dashboard
          userType={userRole!}
          userProfile={userProfile}
          matches={matches}
          meetings={meetings}
          jobs={jobCards}
          onAddNewJob={handleRecruiterPostNewJob}
          onRefreshProfile={() => {
            // Let them edit details again by removing user_profile marker
            setUserProfile(null);
            localStorage.removeItem('lp_user_profile');
          }}
          onUpdateMeeting={handleUpdateMeeting}
          onCancelMeeting={handleCancelMeeting}
          onDeleteMeeting={handleDeleteMeeting}
        />
      );
    }
  };

  // 1. Unselected Role screen
  if (!userRole) {
    return <RoleSelector onSelected={handleRoleSelected} />;
  }

  // 2. Hydration Onboarding screen
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="sticky top-0 bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between z-40">
          <div className="flex items-center gap-1.5 font-black text-slate-800 text-sm">
            <Flame className="w-5 h-5 text-violet-600 fill-violet-300 stroke-2" />
            LaunchPad AI
          </div>
          <button 
            onClick={handleResetAppSession}
            className="text-xs text-slate-400 hover:text-slate-600 transition flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Back
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <Onboarding 
            role={userRole} 
            userName={userName} 
            onCompleted={handleOnboardingCompleted} 
          />
        </main>

        <footer className="bg-slate-50 border-t border-slate-100 py-4 text-center text-[10px] text-slate-400 font-mono">
          LaunchPad AI • Sandbox Environment
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between select-none">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between z-40 shadow-sm shadow-slate-100/40">
        <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-base">
          <div className="p-1 px-2.5 bg-slate-900 text-violet-400 rounded-lg text-xs tracking-wider uppercase font-black flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-violet-400 shrink-0" />
            LP
          </div>
          LaunchPad <span className="text-violet-600">AI</span>
        </div>

        {/* Tab switch navigation */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/35">
          <button
            onClick={() => setActiveTab('swipe')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'swipe'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {userRole === 'student' ? 'Swipe Jobs' : 'Swipe Applicants'}
          </button>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dashboard
          </button>
        </nav>

        {/* Floating details menu */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-slate-200">
            <img 
              src={userProfile.avatarUrl} 
              alt="User profile" 
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div className="text-left font-sans">
              <span className="block font-bold text-slate-800 text-[11px] leading-tight truncate max-w-[100px]">{userProfile.fullName}</span>
              <span className="block text-[9px] text-violet-600 font-semibold leading-none uppercase tracking-wide">
                {userRole === 'student' ? 'Fresh Graduate' : 'Recruit Admin'}
              </span>
            </div>
          </div>

          <button
            onClick={handleResetAppSession}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Reset storage & switch roles"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* STAGE CONTAINER AREA */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-start">
        {renderActiveTabContent()}
      </main>

      {/* FOOTER AREA */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
        <div className="flex items-center gap-1 font-semibold text-slate-400">
          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
          Mobile-Responsive Layout Fitted
        </div>
        <span>LaunchPad AI Inc. • Vibe Coding Spec v1.0</span>
      </footer>

      {/* MUTUAL MATCH DISCOVER MODAL OVERLAY */}
      {activeCelebration && (
        <MatchModal
          match={activeCelebration.match}
          student={activeCelebration.student}
          job={activeCelebration.job}
          onClose={() => setActiveCelebration(null)}
          onBookSuccess={handleBookingConfirmed}
        />
      )}

    </div>
  );
}
