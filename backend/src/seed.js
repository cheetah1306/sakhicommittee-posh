import { initDb, dbRun, dbGet } from './db.js';

const daysAgo = (d) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date.toISOString();
};

const daysAhead = (baseDateStr, d) => {
  const date = new Date(baseDateStr);
  date.setDate(date.getDate() + d);
  return date.toISOString();
};

export async function seedDatabase() {
  console.log('Initializing database tables...');
  await initDb();

  console.log('Clearing old seed data...');
  await dbRun('DELETE FROM case_events');
  await dbRun('DELETE FROM documents');
  await dbRun('DELETE FROM training_logs');
  await dbRun('DELETE FROM cases');
  await dbRun('DELETE FROM users');
  await dbRun('DELETE FROM ic_members');
  await dbRun('DELETE FROM companies');
  await dbRun('UPDATE demo_settings SET time_offset_days = 0 WHERE id = 1');

  console.log('Seeding company...');
  const companyInsert = await dbRun(
    'INSERT INTO companies (name, sector, state, employee_count) VALUES (?, ?, ?, ?)',
    ['Vardhman Textiles Ltd.', 'Manufacturing', 'Punjab', 18]
  );
  const companyId = companyInsert.id;

  console.log('Seeding IC Committee members...');
  // 1 Presiding Officer (Female)
  // 2 Employee members (1 Female, 1 Male)
  // 1 External member (Female)
  // Total = 4 members, 75% women (3 out of 4). Valid IC.
  const termStart = daysAgo(365); // 1 year ago
  const termEnd = daysAhead(termStart, 3 * 365); // 3-year term

  const priyaInsert = await dbRun(
    'INSERT INTO ic_members (company_id, name, role, gender, term_start, term_end) VALUES (?, ?, ?, ?, ?, ?)',
    [companyId, 'Mrs. Priya Sharma', 'presiding', 'female', termStart, termEnd]
  );
  const ananyaInsert = await dbRun(
    'INSERT INTO ic_members (company_id, name, role, gender, term_start, term_end) VALUES (?, ?, ?, ?, ?, ?)',
    [companyId, 'Ms. Ananya Sen', 'employee', 'female', termStart, termEnd]
  );
  const rajeshInsert = await dbRun(
    'INSERT INTO ic_members (company_id, name, role, gender, term_start, term_end) VALUES (?, ?, ?, ?, ?, ?)',
    [companyId, 'Mr. Rajesh Kumar', 'employee', 'male', termStart, termEnd]
  );
  const sunitaInsert = await dbRun(
    'INSERT INTO ic_members (company_id, name, role, gender, term_start, term_end) VALUES (?, ?, ?, ?, ?, ?)',
    [companyId, 'Dr. Sunita Deshmukh', 'external', 'female', termStart, termEnd]
  );

  console.log('Seeding users...');
  // Company Admin
  await dbRun(
    'INSERT INTO users (email, name, role, company_id) VALUES (?, ?, ?, ?)',
    ['admin@vardhman.com', 'Harsh Vardhman (CEO)', 'admin', companyId]
  );

  // IC Members
  await dbRun(
    'INSERT INTO users (email, name, role, company_id, ic_member_id) VALUES (?, ?, ?, ?, ?)',
    ['priya@vardhman.com', 'Priya Sharma (Presiding Officer)', 'ic_member', companyId, priyaInsert.id]
  );
  await dbRun(
    'INSERT INTO users (email, name, role, company_id, ic_member_id) VALUES (?, ?, ?, ?, ?)',
    ['ananya@vardhman.com', 'Ananya Sen (IC Member)', 'ic_member', companyId, ananyaInsert.id]
  );
  await dbRun(
    'INSERT INTO users (email, name, role, company_id, ic_member_id) VALUES (?, ?, ?, ?, ?)',
    ['rajesh@vardhman.com', 'Rajesh Kumar (IC Member)', 'ic_member', companyId, rajeshInsert.id]
  );
  await dbRun(
    'INSERT INTO users (email, name, role, company_id, ic_member_id) VALUES (?, ?, ?, ?, ?)',
    ['sunita@vardhman.com', 'Dr. Sunita Deshmukh (External Member)', 'ic_member', companyId, sunitaInsert.id]
  );

  // District Officer
  await dbRun(
    'INSERT INTO users (email, name, role, company_id) VALUES (?, ?, ?, NULL)',
    ['district.officer@gov.in', 'Smt. Renuka Das (District Magistrate Officer)', 'district_officer']
  );

  console.log('Seeding cases...');
  
  // Case 1: Received (2 days ago)
  const receivedAt1 = daysAgo(2);
  const case1Insert = await dbRun(`
    INSERT INTO cases (
      company_id, tracking_code, status, received_at, incident_date, location, description, 
      is_anonymous, complainant_name, complainant_contact, deadline_90, deadline_100, deadline_160
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    companyId, 'CASE-9821-RECEIVED', 'Received', receivedAt1, daysAgo(5), 'Head Office, Ludhiana',
    'Inappropriate remarks and verbal intimidation were made during the weekly review meeting.',
    0, 'Meera Nair', 'meera.nair@vardhman.com',
    daysAhead(receivedAt1, 90), daysAhead(receivedAt1, 100), daysAhead(receivedAt1, 160)
  ]);
  
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case1Insert.id, 'Received', receivedAt1, 'Complaint filed and timestamped. Legal clock initiated.', 'System Intake']);

  // Case 2: Under Inquiry (50 days ago)
  const receivedAt2 = daysAgo(50);
  const case2Insert = await dbRun(`
    INSERT INTO cases (
      company_id, tracking_code, status, received_at, incident_date, location, description, 
      is_anonymous, complainant_name, complainant_contact, deadline_90, deadline_100, deadline_160,
      has_conciliation_offered, has_conciliation_agreed, has_hearing_given, has_evidence_reviewed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    companyId, 'CASE-4390-INQUIRY', 'Under Inquiry', receivedAt2, daysAgo(53), 'Dispatch Department',
    'Repeated unwelcome text messages and late-night calls after working hours, despite explicit requests to stop.',
    1, null, null,
    daysAhead(receivedAt2, 90), daysAhead(receivedAt2, 100), daysAhead(receivedAt2, 160),
    1, 0, 1, 0
  ]);
  
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case2Insert.id, 'Received', receivedAt2, 'Anonymous complaint submitted online.', 'System Intake']);
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case2Insert.id, 'Acknowledged', daysAhead(receivedAt2, 2), 'Complaint reviewed and formally acknowledged by IC Presiding Officer.', 'Mrs. Priya Sharma']);
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case2Insert.id, 'Under Inquiry', daysAhead(receivedAt2, 5), 'Formal inquiry started. Respondent notified. Conciliation was offered but declined by complainant.', 'Mrs. Priya Sharma']);
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case2Insert.id, 'Inquiry Note', daysAhead(receivedAt2, 20), 'First hearing conducted. Recorded testimonies from both complainant (via secure channel) and respondent.', 'Ms. Ananya Sen']);

  // Case 3: Awaiting Employer Action (95 days ago)
  const receivedAt3 = daysAgo(95);
  const case3Insert = await dbRun(`
    INSERT INTO cases (
      company_id, tracking_code, status, received_at, incident_date, location, description, 
      is_anonymous, complainant_name, complainant_contact, deadline_90, deadline_100, deadline_160,
      has_conciliation_offered, has_conciliation_agreed, has_hearing_given, has_evidence_reviewed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    companyId, 'CASE-1203-AWAITING', 'Awaiting Employer Action', receivedAt3, daysAgo(98), 'Finance Office',
    'Unwelcome physical gestures and verbal intimidation by a senior manager during the annual audit.',
    0, 'Kirti Roy', 'kirti.roy@vardhman.com',
    daysAhead(receivedAt3, 90), daysAhead(receivedAt3, 100), daysAhead(receivedAt3, 160),
    1, 0, 1, 1
  ]);

  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case3Insert.id, 'Received', receivedAt3, 'Complaint filed and timestamped.', 'System Intake']);
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case3Insert.id, 'Acknowledged', daysAhead(receivedAt3, 1), 'Complaint acknowledged.', 'Mrs. Priya Sharma']);
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case3Insert.id, 'Under Inquiry', daysAhead(receivedAt3, 6), 'Inquiry initiated after conciliation was rejected.', 'Mrs. Priya Sharma']);
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case3Insert.id, 'Report Drafted', daysAhead(receivedAt3, 85), 'Inquiry completed (Day 85). Report draft finalized. Found allegations substantiated by witness testimonies.', 'Mrs. Priya Sharma']);
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case3Insert.id, 'Awaiting Employer Action', daysAhead(receivedAt3, 92), 'Inquiry report formally submitted to the employer recommending disciplinary actions and transfer of the respondent.', 'Mrs. Priya Sharma']);

  // Pre-generate report document for Case 3
  const reportContent3 = JSON.stringify({
    title: 'Inquiry Report - CASE-1203-AWAITING',
    caseTrackingCode: 'CASE-1203-AWAITING',
    complainant: 'Kirti Roy',
    respondent: 'Suresh Mehta (Finance Manager)',
    incidentDetails: 'Unwelcome physical gestures and verbal intimidation during annual audit.',
    findings: 'After conducting 3 hearings and reviewing email correspondences (exhibits A-D), the IC finds the respondent in violation of the company code of conduct and POSH guidelines. The allegations of physical gestures and intimidation are substantiated by witness testimonies from finance executives.',
    recommendations: '1. Strict written warning placed in respondent\'s service file.\n2. Transfer of respondent to the Ludhiana manufacturing unit to prevent any direct or indirect professional interaction.\n3. Mandatory POSH sensitization training for the finance department.',
    signatories: ['Mrs. Priya Sharma (Presiding Officer)', 'Ms. Ananya Sen', 'Mr. Rajesh Kumar', 'Dr. Sunita Deshmukh (External)']
  });
  await dbRun(`
    INSERT INTO documents (company_id, case_id, type, generated_at, content)
    VALUES (?, ?, ?, ?, ?)
  `, [companyId, case3Insert.id, 'inquiry_report', daysAhead(receivedAt3, 92), reportContent3]);

  // Case 4: Resolved / Closed (380 days ago - last year)
  const receivedAt4 = daysAgo(380);
  const case4Insert = await dbRun(`
    INSERT INTO cases (
      company_id, tracking_code, status, received_at, incident_date, location, description, 
      is_anonymous, complainant_name, complainant_contact, deadline_90, deadline_100, deadline_160,
      has_conciliation_offered, has_conciliation_agreed, has_hearing_given, has_evidence_reviewed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    companyId, 'CASE-8841-RESOLVED', 'Resolved', receivedAt4, daysAgo(385), 'Cafeteria',
    'Stalking in the parking lot and cafeteria area by a contract worker.',
    0, 'Ritu Goel', 'ritu.goel@vardhman.com',
    daysAhead(receivedAt4, 90), daysAhead(receivedAt4, 100), daysAhead(receivedAt4, 160),
    1, 0, 1, 1
  ]);

  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case4Insert.id, 'Received', receivedAt4, 'Complaint filed.', 'System Intake']);
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case4Insert.id, 'Acknowledged', daysAhead(receivedAt4, 1), 'Complaint acknowledged.', 'Mrs. Priya Sharma']);
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case4Insert.id, 'Under Inquiry', daysAhead(receivedAt4, 5), 'Inquiry initiated.', 'Mrs. Priya Sharma']);
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case4Insert.id, 'Report Drafted', daysAhead(receivedAt4, 45), 'Inquiry finished. Found respondent guilty. Recommended contract termination.', 'Mrs. Priya Sharma']);
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case4Insert.id, 'Awaiting Employer Action', daysAhead(receivedAt4, 47), 'Report submitted to employer.', 'Mrs. Priya Sharma']);
  await dbRun(`
    INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
    VALUES (?, ?, ?, ?, ?)
  `, [case4Insert.id, 'Resolved', daysAhead(receivedAt4, 60), 'Employer terminated the contract of the respondent worker. Case closed successfully.', 'Harsh Vardhman (CEO)']);

  const reportContent4 = JSON.stringify({
    title: 'Inquiry Report - CASE-8841-RESOLVED',
    caseTrackingCode: 'CASE-8841-RESOLVED',
    complainant: 'Ritu Goel',
    respondent: 'Karan Singh (Contractor)',
    incidentDetails: 'Stalking in parking lot and cafeteria.',
    findings: 'Inquiry confirmed persistent stalking behavior through CCTV footage of the parking lot and statements of security personnel.',
    recommendations: 'Immediate termination of the contract worker\'s gate pass and blacklist recommendation.',
    signatories: ['Mrs. Priya Sharma (Presiding Officer)', 'Dr. Sunita Deshmukh']
  });
  await dbRun(`
    INSERT INTO documents (company_id, case_id, type, generated_at, content)
    VALUES (?, ?, ?, ?, ?)
  `, [companyId, case4Insert.id, 'inquiry_report', daysAhead(receivedAt4, 47), reportContent4]);

  console.log('Seeding training logs...');
  await dbRun(`
    INSERT INTO training_logs (company_id, date, attendee_count, topic)
    VALUES (?, ?, ?, ?)
  `, [companyId, daysAgo(300), 15, 'POSH Act Awareness & Zero Tolerance Policy']);
  await dbRun(`
    INSERT INTO training_logs (company_id, date, attendee_count, topic)
    VALUES (?, ?, ?, ?)
  `, [companyId, daysAgo(120), 18, 'Internal Committee Roles and Inquiry Guidelines']);

  console.log('Seeding compliance documents...');
  // Seed a sample POSH Policy document for Vardhman Textiles
  const policyContent = JSON.stringify({
    companyName: 'Vardhman Textiles Ltd.',
    effectiveDate: termStart,
    sector: 'Manufacturing',
    state: 'Punjab',
    presidingOfficer: 'Mrs. Priya Sharma',
    externalMember: 'Dr. Sunita Deshmukh',
    membersList: ['Ms. Ananya Sen', 'Mr. Rajesh Kumar'],
    text: `Vardhman Textiles Ltd. is committed to providing a work environment free from harassment, including sexual harassment. This policy is formulated in compliance with the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 (POSH Act)...`
  });
  await dbRun(`
    INSERT INTO documents (company_id, case_id, type, generated_at, content)
    VALUES (?, NULL, ?, ?, ?)
  `, [companyId, 'policy', termStart, policyContent]);

  // Seed annual report for last year (2025)
  const annualReport2025 = JSON.stringify({
    year: 2025,
    companyName: 'Vardhman Textiles Ltd.',
    complaintsReceived: 1,
    complaintsResolved: 1,
    complaintsPending: 0,
    trainingsConducted: 1,
    narrative: 'One case concerning a contract worker was received. The inquiry was completed within 45 days, and the contract worker was terminated. One training workshop was conducted.'
  });
  await dbRun(`
    INSERT INTO documents (company_id, case_id, type, generated_at, content)
    VALUES (?, NULL, ?, ?, ?)
  `, [companyId, 'annual_report', daysAgo(180), annualReport2025]);

  console.log('Seed completed successfully!');
}

// Support executing directly if run via CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch((err) => {
    console.error('Error seeding database:', err);
    process.exit(1);
  });
}
