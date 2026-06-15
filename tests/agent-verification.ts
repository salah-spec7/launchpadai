/**
 * LaunchPad AI — Automated Agent Verification Suite
 * 
 * Tests both server-side agents (Vetting + Schedule) end-to-end.
 * Requires the dev server running on http://localhost:3000.
 * 
 * Run: npm run test:agents
 */

const BASE_URL = 'http://localhost:3000';

// ─── Test Utilities ──────────────────────────────────────────
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ${colors.green}✓${colors.reset} ${label}`);
  } else {
    failed++;
    const msg = `  ${colors.red}✗${colors.reset} ${label}${detail ? ` — ${detail}` : ''}`;
    console.log(msg);
    errors.push(label);
  }
}

async function postJSON(path: string, body: object): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function getJSON(path: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`);
  return res.json();
}

// ─── Test Data ───────────────────────────────────────────────
const TEST_STUDENT = {
  id: 'test-student-001',
  email: 'test.student@university.edu',
  fullName: 'Test Student',
  avatarUrl: 'https://example.com/avatar.jpg',
  headline: 'Full-Stack Developer & AI Enthusiast',
  location: 'San Francisco, CA',
  university: 'Stanford University',
  major: 'Computer Science',
  graduationYear: 2026,
  gpa: '3.9',
  skills: ['TypeScript', 'React', 'Node.js', 'Python', 'Docker', 'PostgreSQL'],
  githubUrl: 'github.com/test-student',
  aiSummary: 'Passionate CS student with deep expertise in modern web frameworks and microservice architecture. Built multiple open-source tools with 200+ GitHub stars.',
  githubStats: {
    publicRepos: 28,
    followers: 95,
    stars: 214,
    languages: { TypeScript: 45, Python: 30, Go: 15, CSS: 10 },
  },
  personalityTags: ['Fast Learner', 'Open-Source Contributor', 'Team Player'],
};

const TEST_JOB = {
  id: 'test-job-001',
  recruiterId: 'test-recruiter-001',
  title: 'Frontend Engineering Intern',
  companyName: 'Acme Tech Corp',
  companyLogoUrl: 'https://example.com/logo.png',
  jobType: 'Internship',
  location: 'Remote',
  isRemote: true,
  salaryMin: 90000,
  salaryMax: 120000,
  description: 'Build polished visual components for our SDK dashboards. Work with responsive layouts and real-time metrics.',
  requirements: [
    'Enrolled in BS/MS Computer Science',
    'Experience with TypeScript and React',
    'Understanding of responsive design',
    'Active GitHub presence',
  ],
  requiredSkills: ['TypeScript', 'React', 'CSS', 'Tailwind', 'Node.js'],
  compatibilityTags: ['Design-focused', 'Startup culture'],
};

// ─── Test 1: Health Check ────────────────────────────────────
async function testHealthCheck() {
  console.log(`\n${colors.cyan}${colors.bold}── Test 1: Health Check ──${colors.reset}`);
  try {
    const data = await getJSON('/api/health');
    assert(data.status === 'ok', 'Server status is "ok"');
    assert(typeof data.aiEngineActive === 'boolean', 'AI engine status is boolean');
    assert(data.environment !== undefined, 'Environment field is present');
  } catch (e: any) {
    assert(false, 'Health check reachable', e.message);
  }
}

// ─── Test 2: Vetting Agent ───────────────────────────────────
async function testVettingAgent() {
  console.log(`\n${colors.cyan}${colors.bold}── Test 2: AI Vetting Agent (/api/matches/vetting) ──${colors.reset}`);
  try {
    const data = await postJSON('/api/matches/vetting', {
      student: TEST_STUDENT,
      job: TEST_JOB,
    });

    assert(data.success === true, 'Response success is true');
    assert(typeof data.aiProcessed === 'boolean', 'aiProcessed flag is boolean');

    const report = data.report;
    assert(report !== undefined && report !== null, 'Vetting report is present');

    // compatibilityScore (maps to compatibilityRating)
    assert(
      typeof report.compatibilityScore === 'number' &&
      report.compatibilityScore >= 0 &&
      report.compatibilityScore <= 100,
      `compatibilityScore is 0-100 (got: ${report.compatibilityScore})`
    );

    // strengths (3-bullet array)
    assert(
      Array.isArray(report.strengths) && report.strengths.length >= 3,
      `strengths has ≥3 items (got: ${report.strengths?.length})`
    );

    // talkingPoints (2 icebreakers)
    assert(
      Array.isArray(report.talkingPoints) && report.talkingPoints.length >= 2,
      `talkingPoints/icebreakers has ≥2 items (got: ${report.talkingPoints?.length})`
    );

    // overallVerdict enum
    assert(
      ['passed', 'failed', 'needs_review'].includes(report.overallVerdict),
      `overallVerdict is valid enum (got: "${report.overallVerdict}")`
    );

    // technicalFit enum
    assert(
      ['high', 'medium', 'low'].includes(report.technicalFit),
      `technicalFit is valid enum (got: "${report.technicalFit}")`
    );

    // recommendation string
    assert(
      typeof report.recommendation === 'string' && report.recommendation.length > 0,
      'recommendation is a non-empty string'
    );

    // gaps array
    assert(Array.isArray(report.gaps), 'gaps is an array');

    // interviewFocus array
    assert(Array.isArray(report.interviewFocus), 'interviewFocus is an array');

  } catch (e: any) {
    assert(false, 'Vetting agent reachable', e.message);
  }
}

// ─── Test 3: Vetting Agent Input Validation ──────────────────
async function testVettingValidation() {
  console.log(`\n${colors.cyan}${colors.bold}── Test 3: Vetting Agent Input Validation ──${colors.reset}`);
  try {
    const res = await fetch(`${BASE_URL}/api/matches/vetting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(res.status === 400, 'Empty payload returns 400');

    const data = await res.json();
    assert(typeof data.error === 'string', 'Error message is returned');
  } catch (e: any) {
    assert(false, 'Validation test reachable', e.message);
  }
}

// ─── Test 4: Schedule Agent ──────────────────────────────────
async function testScheduleAgent() {
  console.log(`\n${colors.cyan}${colors.bold}── Test 4: Meet Schedule Agent (/api/meetings/schedule) ──${colors.reset}`);
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateStr = futureDate.toISOString().split('T')[0];

    const data = await postJSON('/api/meetings/schedule', {
      studentName: TEST_STUDENT.fullName,
      recruiterName: 'Sarah Jenkins',
      companyName: TEST_JOB.companyName,
      jobTitle: TEST_JOB.title,
      customDate: dateStr,
      customTime: '14:00',
      durationMinutes: 45,
      agendaOverride: 'Technical interview kickoff session',
      studentEmail: TEST_STUDENT.email,
    });

    assert(data.success === true, 'Response success is true');
    assert(typeof data.liveIntegration === 'boolean', 'liveIntegration flag is present');
    assert(
      typeof data.googleMeetLink === 'string' && data.googleMeetLink.startsWith('https://'),
      `googleMeetLink starts with https:// (got: "${data.googleMeetLink?.substring(0, 30)}...")`
    );
    assert(
      typeof data.scheduledAt === 'string' && !isNaN(new Date(data.scheduledAt).getTime()),
      'scheduledAt is valid ISO date'
    );
    assert(data.durationMinutes === 45, `durationMinutes matches input (got: ${data.durationMinutes})`);
    assert(typeof data.googleCalendarEventId === 'string', 'googleCalendarEventId is present');
    assert(typeof data.agenda === 'string' && data.agenda.length > 0, 'agenda is non-empty');

    console.log(`  ${colors.dim}Integration mode: ${data.liveIntegration ? 'LIVE Google Calendar' : 'Simulated'}${colors.reset}`);
  } catch (e: any) {
    assert(false, 'Schedule agent reachable', e.message);
  }
}

// ─── Test 5: Schedule Agent Duration Variants ────────────────
async function testScheduleDurations() {
  console.log(`\n${colors.cyan}${colors.bold}── Test 5: Schedule Agent Duration Toggle ──${colors.reset}`);
  for (const dur of [15, 30, 45, 60]) {
    try {
      const data = await postJSON('/api/meetings/schedule', {
        studentName: 'Duration Test',
        recruiterName: 'Recruiter',
        companyName: 'TestCo',
        jobTitle: 'Engineer',
        durationMinutes: dur,
      });
      assert(data.durationMinutes === dur, `Duration ${dur}m correctly returned`);
    } catch (e: any) {
      assert(false, `Duration ${dur}m test reachable`, e.message);
    }
  }
}

// ─── Test 6: OAuth Status Endpoint ───────────────────────────
async function testOAuthStatus() {
  console.log(`\n${colors.cyan}${colors.bold}── Test 6: OAuth Status Check (/auth/google/status) ──${colors.reset}`);
  try {
    const data = await getJSON('/auth/google/status');
    assert(typeof data.authenticated === 'boolean', 'authenticated flag is boolean');
    assert(data.provider === 'google', 'provider is "google"');
    assert(Array.isArray(data.scopes), 'scopes is an array');
  } catch (e: any) {
    assert(false, 'OAuth status endpoint reachable', e.message);
  }
}

// ─── Test 7: Pipeline Integration ────────────────────────────
async function testFullPipeline() {
  console.log(`\n${colors.cyan}${colors.bold}── Test 7: Full Pipeline (Vetting → Schedule) ──${colors.reset}`);
  try {
    // Step 1: Vetting
    console.log(`  ${colors.dim}Step 1: Running vetting agent...${colors.reset}`);
    const vetting = await postJSON('/api/matches/vetting', {
      student: TEST_STUDENT,
      job: TEST_JOB,
    });
    assert(vetting.success === true, 'Pipeline: Vetting completed successfully');
    assert(vetting.report.compatibilityScore > 0, 'Pipeline: Vetting produced a score');

    // Step 2: Schedule (triggers after vetting completes)
    console.log(`  ${colors.dim}Step 2: Running schedule agent...${colors.reset}`);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const schedule = await postJSON('/api/meetings/schedule', {
      studentName: TEST_STUDENT.fullName,
      recruiterName: 'Pipeline Recruiter',
      companyName: TEST_JOB.companyName,
      jobTitle: TEST_JOB.title,
      customDate: futureDate.toISOString().split('T')[0],
      customTime: '10:30',
      durationMinutes: 30,
      agendaOverride: `Pipeline integration test — compatibility: ${vetting.report.compatibilityScore}%`,
      studentEmail: TEST_STUDENT.email,
    });
    assert(schedule.success === true, 'Pipeline: Schedule completed successfully');
    assert(
      schedule.googleMeetLink.startsWith('https://'),
      'Pipeline: Meet link generated after vetting'
    );
    assert(
      schedule.agenda.includes(String(vetting.report.compatibilityScore)),
      'Pipeline: Schedule agenda references vetting score'
    );
  } catch (e: any) {
    assert(false, 'Pipeline integration test', e.message);
  }
}

// ─── Runner ──────────────────────────────────────────────────
async function main() {
  console.log(`\n${colors.bold}╔══════════════════════════════════════════════════╗`);
  console.log(`║  LaunchPad AI — Agent Verification Suite          ║`);
  console.log(`╚══════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.dim}Target: ${BASE_URL}${colors.reset}`);

  // Check server is reachable first
  try {
    await fetch(`${BASE_URL}/api/health`);
  } catch {
    console.error(`\n${colors.red}${colors.bold}ERROR: Server is not reachable at ${BASE_URL}`);
    console.error(`Start the dev server first: npm run dev${colors.reset}\n`);
    process.exit(1);
  }

  await testHealthCheck();
  await testVettingAgent();
  await testVettingValidation();
  await testScheduleAgent();
  await testScheduleDurations();
  await testOAuthStatus();
  await testFullPipeline();

  // Summary
  const total = passed + failed;
  console.log(`\n${colors.bold}${'─'.repeat(52)}${colors.reset}`);
  console.log(`${colors.bold}Results: ${colors.green}${passed} passed${colors.reset}, ${failed > 0 ? colors.red : colors.dim}${failed} failed${colors.reset}, ${total} total`);

  if (errors.length > 0) {
    console.log(`\n${colors.red}Failed tests:${colors.reset}`);
    errors.forEach(e => console.log(`  ${colors.red}✗${colors.reset} ${e}`));
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

main();
