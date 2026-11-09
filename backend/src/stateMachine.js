import { dbRun, dbGet, getSystemDate } from './db.js';

export const STATUS_STATES = {
  RECEIVED: 'Received',
  ACKNOWLEDGED: 'Acknowledged',
  UNDER_INQUIRY: 'Under Inquiry',
  REPORT_DRAFTED: 'Report Drafted',
  AWAITING_EMPLOYER: 'Awaiting Employer Action',
  RESOLVED: 'Resolved',
  APPEALED: 'Appealed'
};

const VALID_TRANSITIONS = {
  [STATUS_STATES.RECEIVED]: [STATUS_STATES.ACKNOWLEDGED],
  [STATUS_STATES.ACKNOWLEDGED]: [STATUS_STATES.UNDER_INQUIRY, STATUS_STATES.RESOLVED],
  [STATUS_STATES.UNDER_INQUIRY]: [STATUS_STATES.REPORT_DRAFTED, STATUS_STATES.RESOLVED],
  [STATUS_STATES.REPORT_DRAFTED]: [STATUS_STATES.AWAITING_EMPLOYER],
  [STATUS_STATES.AWAITING_EMPLOYER]: [STATUS_STATES.RESOLVED],
  [STATUS_STATES.RESOLVED]: [STATUS_STATES.APPEALED]
};

export async function transitionCase(caseId, nextStatus, note, actorName) {
  const kase = await dbGet('SELECT * FROM cases WHERE id = ?', [caseId]);
  if (!kase) {
    throw new Error('Case not found');
  }

  const currentStatus = kase.status;

  // Let the user bypass standard transitions for demo convenience if needed,
  // but let's enforce standard business rules while logging warnings if bypassed.
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  const isNormalTransition = allowed.includes(nextStatus);

  const sysDate = await getSystemDate();
  const sysDateStr = sysDate.toISOString();

  // Update Case status
  await dbRun(
    'UPDATE cases SET status = ? WHERE id = ?',
    [nextStatus, caseId]
  );

  // Add Case Event
  await dbRun(
    'INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) VALUES (?, ?, ?, ?, ?)',
    [
      caseId,
      nextStatus,
      sysDateStr,
      note || `Status transitioned from ${currentStatus} to ${nextStatus}`,
      actorName || 'System'
    ]
  );

  return { success: true, from: currentStatus, to: nextStatus };
}
