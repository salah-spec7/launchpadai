/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudentProfile, RecruiterProfile, Match, Meeting, Job } from '../types';
import { 
  Plus, Calendar, Briefcase, Award, TrendingUp, Sparkles, 
  MapPin, HelpCircle, ExternalLink, Settings, Clock, CheckSquare, RefreshCw, 
  Trash2, Edit3, Check, AlertTriangle, MessageSquare, BookOpen, Sliders
} from 'lucide-react';

interface DashboardProps {
  userType: 'student' | 'recruiter';
  userProfile: StudentProfile | RecruiterProfile | null;
  matches: Match[];
  meetings: Meeting[];
  jobs: Job[];
  onAddNewJob: (job: Job) => void;
  onRefreshProfile: () => void;
  onUpdateMeeting?: (updatedMeeting: Meeting) => void;
  onCancelMeeting?: (meetingId: string) => void;
  onDeleteMeeting?: (meetingId: string) => void;
}

export function Dashboard({ 
  userType, 
  userProfile, 
  matches, 
  meetings, 
  jobs,
  onAddNewJob,
  onRefreshProfile,
  onUpdateMeeting,
  onCancelMeeting,
  onDeleteMeeting
}: DashboardProps) {
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobType, setNewJobType] = useState<'Internship' | 'Full-time' | 'Contract'>('Internship');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobSkills, setNewJobSkills] = useState('');
  const [newJobSalary, setNewJobSalary] = useState(115000);

  // States to manage scheduled interviews directly
  const [selectedMeetingToManage, setSelectedMeetingToManage] = useState<Meeting | null>(null);
  const [mEditDate, setMEditDate] = useState('');
  const [mEditTime, setMEditTime] = useState('');
  const [mEditDuration, setMEditDuration] = useState<number>(30);
  const [mEditLink, setMEditLink] = useState('');
  const [mEditAgenda, setMEditAgenda] = useState('');
  const [mEditStatus, setMEditStatus] = useState<'scheduled' | 'completed' | 'cancelled'>('scheduled');
  const [mEditNotes, setMEditNotes] = useState('');

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle || !newJobDesc) return;

    const parsedSkills = newJobSkills
      ? newJobSkills.split(',').map((s) => s.trim())
      : ['TypeScript', 'React', 'Node.js'];

    const declaredJob: Job = {
      id: `job-${Date.now()}`,
      recruiterId: userProfile?.id || 'recruiter-default',
      title: newJobTitle,
      companyName: (userProfile as RecruiterProfile)?.companyName || 'LaunchPad Partner',
      companyLogoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80',
      jobType: newJobType,
      location: (userProfile as RecruiterProfile)?.location || 'San Francisco, CA',
      isRemote: newJobType === 'Full-time',
      salaryMin: newJobSalary,
      salaryMax: newJobSalary + 30000,
      description: newJobDesc,
      requirements: ['Enrolled in standard technical tracks', 'Passionate about structural code elegance'],
      requiredSkills: parsedSkills,
      compatibilityTags: ['Fast-paced', 'Custom stack']
    };

    onAddNewJob(declaredJob);
    setShowAddJobModal(false);
    
    // Clear form
    setNewJobTitle('');
    setNewJobDesc('');
    setNewJobSkills('');
  };

  const getMatchedStudentName = (m: Match) => {
    if (m.studentId === 'student-alex-chen') return 'Alex Chen';
    if (m.studentId === 'student-priya-patel') return 'Priya Patel';
    if (m.studentId === 'student-marcus-vance') return 'Marcus Vance';
    return 'Candidate Match';
  };

  const getMatchedJobTitle = (m: Match) => {
    if (m.jobId === 'job-stripe-frontend') return 'Frontend Engineering Intern (Stripe)';
    if (m.jobId === 'job-vercel-fullstack') return 'Developer Advocate & Next.js Intern (Vercel)';
    if (m.jobId === 'job-stripe-backend') return 'Distributed Systems Intern (Stripe)';
    return 'Engineering Role';
  };

  // Helper calculation for beautiful, smart countdown labels
  const getCountdownString = (scheduledAt: string, status: string) => {
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'completed') return 'Completed';
    const now = new Date().getTime();
    const scheduled = new Date(scheduledAt).getTime();
    const diff = scheduled - now;
    if (diff < 0) {
      const minutesAgo = Math.floor(Math.abs(diff) / (60 * 1000));
      if (minutesAgo < 60) {
        return `Started ${minutesAgo}m ago`;
      }
      return 'Happening now / Finished';
    }
    const mins = Math.floor(diff / (60 * 1000));
    const hrs = Math.floor(mins / 60);
    const dys = Math.floor(hrs / 24);

    if (dys > 0) return `Starts in ${dys}d ${hrs % 24}h`;
    if (hrs > 0) return `Starts in ${hrs}h ${mins % 60}m`;
    return `Starts in ${mins}m`;
  };

  const handleOpenManageModal = (meet: Meeting) => {
    setSelectedMeetingToManage(meet);
    const dateObj = new Date(meet.scheduledAt);
    setMEditDate(dateObj.toISOString().split('T')[0]);
    const hrs = String(dateObj.getHours()).padStart(2, '0');
    const mins = String(dateObj.getMinutes()).padStart(2, '0');
    setMEditTime(`${hrs}:${mins}`);
    setMEditDuration(meet.durationMinutes || 30);
    setMEditLink(meet.googleMeetLink);
    setMEditAgenda(meet.agenda);
    setMEditStatus(meet.status);
    setMEditNotes(userType === 'student' ? (meet.studentNotes || '') : (meet.recruiterNotes || ''));
  };

  const handleSaveMeetingEdits = () => {
    if (!selectedMeetingToManage || !onUpdateMeeting) return;
    
    const newScheduledAt = new Date(`${mEditDate}T${mEditTime}:00`);
    const finalScheduledAt = isNaN(newScheduledAt.getTime()) 
      ? selectedMeetingToManage.scheduledAt 
      : newScheduledAt.toISOString();

    const updated: Meeting = {
      ...selectedMeetingToManage,
      scheduledAt: finalScheduledAt,
      durationMinutes: mEditDuration,
      googleMeetLink: mEditLink.trim(),
      agenda: mEditAgenda,
      status: mEditStatus,
      studentNotes: userType === 'student' ? mEditNotes : selectedMeetingToManage.studentNotes,
      recruiterNotes: userType === 'recruiter' ? mEditNotes : selectedMeetingToManage.recruiterNotes
    };

    onUpdateMeeting(updated);
    setSelectedMeetingToManage(null);
  };

  return (
    <div className="w-full space-y-6">
      
      {/* 1. WELCOME BANNER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-zinc-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-violet-500/20 rounded-full blur-2xl opacity-50" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-violet-400 font-bold font-mono">
              Matching Dashboard Console
            </span>
            <h2 className="text-2xl font-black mt-1">
              Welcome Back, {userProfile?.fullName || 'User'}!
            </h2>
            <p className="text-xs text-zinc-300 mt-1 max-w-md leading-relaxed">
              {userType === 'student'
                ? `Active Student Dashboard for Computer Science at ${(userProfile as StudentProfile)?.university || 'State University'}`
                : `Recruiter Dashboard for building core talent networks at ${(userProfile as RecruiterProfile)?.companyName}`}
            </p>
          </div>

          <div className="flex gap-2">
            {userType === 'recruiter' ? (
              <button
                onClick={() => setShowAddJobModal(true)}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-zinc-50 font-bold text-xs rounded-xl transition shadow flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Post New Job Deck
              </button>
            ) : (
              <button
                onClick={onRefreshProfile}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-zinc-300 border border-slate-700/80 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Adjust Profile Info
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">MUTUAL MATCHES</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{matches.length}</span>
            <span className="text-xs text-emerald-600 font-bold">Passed Vetting</span>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">INTERVIEWS HELD</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800">
              {meetings.filter(m => m.status === 'completed').length}
            </span>
            <span className="text-xs text-slate-400">Archived sessions</span>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm col-span-2 md:col-span-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PENDING SCHEDULES</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-violet-700">
              {meetings.filter(m => m.status === 'scheduled').length}
            </span>
            <span className="text-xs text-violet-600 font-semibold">Active Google Meet slots</span>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC METRIC SECTIONS & MEETS MANAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scheduled Meet Timeline List */}
        <div className="lg:col-span-2 bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-violet-600" />
              Your Scheduled Interviews Timeline
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border px-2 py-0.5 rounded">
              LaunchPad Auto-Sync v2.0
            </span>
          </div>

          {meetings.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 border border-dashed rounded-2xl p-4 text-slate-400 text-xs">
              <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              Interview listings are currently empty.<br/>Mutual right-swipes will register here to schedule instant Google Meet rooms.
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meet) => {
                const dateObj = new Date(meet.scheduledAt);
                const formattedTime = dateObj.toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                const countdown = getCountdownString(meet.scheduledAt, meet.status);

                return (
                  <div key={meet.id} className="border border-slate-100 rounded-2xl p-4.5 hover:border-violet-200 bg-slate-50/40 hover:bg-slate-50/80 transition space-y-3.5 relative overflow-hidden">
                    {/* Status accent bar */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                      meet.status === 'completed' 
                        ? 'bg-slate-300' 
                        : meet.status === 'cancelled' 
                          ? 'bg-rose-400' 
                          : 'bg-violet-600'
                    }`} />

                    <div className="pl-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        {/* Title details */}
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-800 text-sm">
                            {meet.agenda.split('kickoff')[0] || 'Technical Sync Session'}
                          </h4>
                          
                          {/* Live Status Badge */}
                          <span className={`px-2 py-0.5 font-mono text-[9px] font-extrabold rounded uppercase tracking-wider ${
                            meet.status === 'completed'
                              ? 'bg-slate-100 text-slate-600 border'
                              : meet.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse'
                          }`}>
                            {meet.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-1">
                          {meet.agenda}
                        </p>
                      </div>
                      
                      <div className="text-right flex flex-col items-end gap-1 shrink-0">
                        <span className="px-3 py-1 bg-violet-50 text-violet-700 border border-violet-100 font-mono text-[10px] font-bold rounded-lg w-fit">
                          🕒 {formattedTime} ({meet.durationMinutes || 30} mins)
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {countdown}
                        </span>
                      </div>
                    </div>

                    {/* Prep Guideline widget */}
                    <div className="pl-1.5 text-xs bg-white border border-slate-200/80 p-3 rounded-xl space-y-1">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                        💡 AI Prep Telemetry guidelines:
                      </span>
                      <p className="text-slate-600 leading-relaxed font-sans">
                        {userType === 'student' 
                          ? 'Review complex API rate limiting structures, database indices, and custom algorithms. Be ready to explain your resume highlights.'
                          : 'Probe candidate on performance scaling, reactive layout states, and their container configuration experience.'}
                      </p>
                    </div>

                    {/* Shared Meeting Notes Container */}
                    {(meet.studentNotes || meet.recruiterNotes) && (
                      <div className="pl-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
                        {meet.studentNotes && (
                          <div className="bg-slate-100/60 p-2.5 rounded-lg border">
                            <span className="font-bold text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Student Remarks</span>
                            <p className="italic text-slate-600">{meet.studentNotes}</p>
                          </div>
                        )}
                        {meet.recruiterNotes && (
                          <div className="bg-violet-50/40 p-2.5 rounded-lg border border-violet-100">
                            <span className="font-bold text-violet-600 block text-[9px] uppercase tracking-wider mb-0.5">Recruiter Remarks</span>
                            <p className="italic text-slate-600">{meet.recruiterNotes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Direct actionable workspace controls */}
                    <div className="pl-1.5 flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        {meet.status === 'scheduled' && (
                          <a
                            href={meet.googleMeetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
                          >
                            Launch Meet Room 🚀
                          </a>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => handleOpenManageModal(meet)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-zinc-100 font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5 text-violet-400" />
                          Manage & Reschedule
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-slate-400 font-mono uppercase bg-slate-100 px-2 py-0.5 rounded">
                          Meet Link: {meet.googleMeetLink.replace('https://', '')}
                        </span>
                        
                        {onDeleteMeeting && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Are you sure you want to permanently clear this scheduled interview record?')) {
                                onDeleteMeeting(meet.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-200/50 transition cursor-pointer"
                            title="Purge session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Matches lists and pipelines */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
            <Award className="w-5 h-5 text-violet-600" />
            Vetted Pipeline Matches
          </h3>

          {matches.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Swipe candidates or positions. When mutual right clicks take place, matches are compiled here.
            </div>
          ) : (
            <div className="space-y-3.5">
              {matches.map((m) => (
                <div key={m.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">
                        {userType === 'student' ? getMatchedJobTitle(m) : getMatchedStudentName(m)}
                      </h4>
                      <p className="text-[10px] text-slate-400">Matched {new Date(m.matchedAt).toLocaleDateString()}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                      {m.matchScore}% Fit
                    </span>
                  </div>

                  <ul className="text-[10px] text-slate-500 space-y-0.5 list-disc list-inside">
                    {m.matchReasons.slice(0, 2).map((reason, idx) => (
                      <li key={idx} className="truncate">{reason}</li>
                    ))}
                  </ul>
                  
                  {m.meetingScheduled ? (
                    <span className="inline-flex text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Interview Room Booked
                    </span>
                  ) : (
                    <span className="inline-flex text-[10px] text-zinc-400 font-semibold bg-slate-100 border px-2 py-0.5 rounded-full">
                      ⊘ Waiting Booking Setup
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 4. HIGH FIDELITY MANAGE MEETING MODAL */}
      {selectedMeetingToManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-violet-50 text-violet-600 rounded">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Interviews Manager Console
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Reschedule, edit meeting parameters, or append notes</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMeetingToManage(null)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editing Form */}
            <div className="space-y-4 text-xs select-none">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                  <input 
                    type="date"
                    value={mEditDate}
                    onChange={(e) => setMEditDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Slot</label>
                  <input 
                    type="time"
                    value={mEditTime}
                    onChange={(e) => setMEditTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</label>
                  <select 
                    value={mEditDuration}
                    onChange={(e) => setMEditDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    <option value={15}>15 Minutes (Brief introduction)</option>
                    <option value={30}>30 Minutes (Standard loop)</option>
                    <option value={45}>45 Minutes (Technical systems)</option>
                    <option value={60}>60 Minutes (Deep architecture)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status state</label>
                  <select 
                    value={mEditStatus}
                    onChange={(e) => setMEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    <option value="scheduled">Scheduled (Active)</option>
                    <option value="completed">Completed (Archived)</option>
                    <option value="cancelled">Cancelled (Red)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Google Meet Code / Link</label>
                <input 
                  type="text"
                  value={mEditLink}
                  onChange={(e) => setMEditLink(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agenda Details</label>
                <input 
                  type="text"
                  value={mEditAgenda}
                  onChange={(e) => setMEditAgenda(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold"
                />
              </div>

              {/* Shared remarks */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {userType === 'student' ? 'My Student Preparation Remarks / Notes' : 'My Recruiter Technical Evaluation Notes'}
                </label>
                <textarea 
                  rows={3}
                  value={mEditNotes}
                  onChange={(e) => setMEditNotes(e.target.value)}
                  placeholder={userType === 'student' ? "e.g. Remember to talk about Docker containers and ask for React feedback..." : "e.g. Strong candidate for distributed cache. Highlight compensation plan."}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-sans leading-normal"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleSaveMeetingEdits}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Schedule Updates
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMeetingToManage(null)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Recruiter vacancy add Modal */}
      {showAddJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-slate-800">
                Post New Engineering Spec
              </h3>
              <button 
                onClick={() => setShowAddJobModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs select-none">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Vacancy Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Infrastructure Intern"
                  required
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="w-full px-4.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Type of Position
                </label>
                <select
                  value={newJobType}
                  onChange={(e) => setNewJobType(e.target.value as any)}
                  className="w-full px-4.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="Internship">Internship</option>
                  <option value="Full-time">Full-time (Fresher)</option>
                  <option value="Contract">Contract Spec</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Base Salary ($ / yr)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 110000"
                  required
                  value={newJobSalary}
                  onChange={(e) => setNewJobSalary(Number(e.target.value))}
                  className="w-full px-4.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Required Skill Chips (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Go, Kubernetes, Protobuf, Kafka"
                  value={newJobSkills}
                  onChange={(e) => setNewJobSkills(e.target.value)}
                  className="w-full px-4.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Role Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Refine company expectations. Mentally challenge applicants."
                  value={newJobDesc}
                  onChange={(e) => setNewJobDesc(e.target.value)}
                  className="w-full px-4.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Post Job Card Spec
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddJobModal(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
