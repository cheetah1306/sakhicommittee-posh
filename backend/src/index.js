import express from 'express';
import cors from 'cors';
import { dbAll, dbGet, dbRun, initDb, getSystemDate, getTimeOffset } from './db.js';
import { seedDatabase } from './seed.js';
import { transitionCase, STATUS_STATES } from './stateMachine.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Auto-seed if database is empty on start
const checkAndSeed = async () => {
  try {
    await initDb();
    const company = await dbGet('SELECT id FROM companies LIMIT 1');
    if (!company) {
      console.log('No data found in database. Seeding demo data...');
      await seedDatabase();
    } else {
      console.log('Database already initialized with data.');
    }
  } catch (error) {
    console.error('Error during database startup check:', error);
  }
};

// ---------------------------------------------------------------------
// DEMO / TIME TRAVEL ENDPOINTS
// ---------------------------------------------------------------------

app.get('/api/demo/settings', async (req, res) => {
  try {
    const offset = await getTimeOffset();
    const systemDate = await getSystemDate();
    res.json({ timeOffsetDays: offset, systemDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/demo/travel', async (req, res) => {
  try {
    const { days } = req.body;
    if (typeof days !== 'number') {
      return res.status(400).json({ error: 'Days must be a number' });
    }
    
    // Update the offset
    await dbRun('UPDATE demo_settings SET time_offset_days = time_offset_days + ? WHERE id = 1', [days]);
    
    const offset = await getTimeOffset();
    const systemDate = await getSystemDate();
    
    res.json({ success: true, timeOffsetDays: offset, systemDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/demo/reset', async (req, res) => {
  try {
    await seedDatabase();
    const offset = await getTimeOffset();
    const systemDate = await getSystemDate();
    res.json({ success: true, message: 'Database reset to seed data', timeOffsetDays: offset, systemDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ---------------------------------------------------------------------
// AUTH ENDPOINTS (Simple demo selectors)
// ---------------------------------------------------------------------

app.get('/api/users', async (req, res) => {
  try {
    const users = await dbAll(`
      SELECT u.*, c.name as company_name, im.role as ic_role
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN ic_members im ON u.ic_member_id = im.id
    `);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await dbGet(`
      SELECT u.*, c.name as company_name, c.employee_count, im.role as ic_role
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN ic_members im ON u.ic_member_id = im.id
      WHERE u.email = ?
    `, [email]);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ---------------------------------------------------------------------
// COMPANY & IC MODULE ENDPOINTS
// ---------------------------------------------------------------------

app.get('/api/companies', async (req, res) => {
  try {
    const companies = await dbAll('SELECT id, name, sector, state, employee_count FROM companies ORDER BY id ASC');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/company/:id', async (req, res) => {
  try {
    const company = await dbGet('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    const icMembers = await dbAll('SELECT * FROM ic_members WHERE company_id = ?', [req.params.id]);
    res.json({ ...company, icMembers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/company', async (req, res) => {
  try {
    const { name, sector, state, employee_count } = req.body;
    if (!name || !sector || !state || employee_count === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await dbRun(
      'INSERT INTO companies (name, sector, state, employee_count) VALUES (?, ?, ?, ?)',
      [name, sector, state, employee_count]
    );

    // Create an admin user for this company automatically for demo convenience
    const companyId = result.id;
    const adminEmail = `admin@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    await dbRun(
      'INSERT INTO users (email, name, role, company_id) VALUES (?, ?, ?, ?)',
      [adminEmail, 'HR Administrator', 'admin', companyId]
    );

    res.status(201).json({ id: companyId, adminEmail, name, sector, state, employee_count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configure IC Wizard
app.post('/api/company/:id/ic', async (req, res) => {
  try {
    const companyId = req.params.id;
    const { members } = req.body; // Array of { name, role, gender }
    
    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Invalid members list' });
    }

    const company = await dbGet('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Validate 50% women rule and member count if employees >= 10
    if (company.employee_count >= 10) {
      const womenCount = members.filter(m => m.gender === 'female').length;
      const womenRatio = womenCount / members.length;
      const hasPresiding = members.some(m => m.role === 'presiding' && m.gender === 'female');
      const hasExternal = members.some(m => m.role === 'external');
      const hasMinMembers = members.length >= 4;

      let validationError = null;
      if (womenRatio < 0.5) {
        validationError = 'The Internal Committee must contain at least 50% women members.';
      } else if (!hasPresiding) {
        validationError = 'The IC must have 1 Presiding Officer (senior woman).';
      } else if (!hasExternal) {
        validationError = 'The IC must have 1 External Member (from NGO or legal background).';
      } else if (!hasMinMembers) {
        validationError = 'The IC must have at least 4 members (Presiding, 2+ Employees, 1 External).';
      }

      if (validationError) {
        return res.status(400).json({ error: validationError, isValid: false });
      }
    }

    const normalizeName = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Update existing committee seats in place so members keep their login link
    const existingMembers = await dbAll('SELECT * FROM ic_members WHERE company_id = ?', [companyId]);
    const existingByName = new Map(existingMembers.map((m) => [normalizeName(m.name), m]));

    const termStart = (await getSystemDate()).toISOString();
    const termEnd = new Date(new Date(termStart).setFullYear(new Date(termStart).getFullYear() + 3)).toISOString();

    const keptMemberIds = [];

    for (const member of members) {
      const existing = existingByName.get(normalizeName(member.name));
      let memberId;

      if (existing) {
        // Same person on the committee: keep the row (and its id) rather than recreating it
        existingByName.delete(normalizeName(member.name));
        await dbRun(
          'UPDATE ic_members SET name = ?, role = ?, gender = ?, term_start = ?, term_end = ? WHERE id = ?',
          [member.name, member.role, member.gender, termStart, termEnd, existing.id]
        );
        memberId = existing.id;
      } else {
        const mResult = await dbRun(
          'INSERT INTO ic_members (company_id, name, role, gender, term_start, term_end) VALUES (?, ?, ?, ?, ?, ?)',
          [companyId, member.name, member.role, member.gender, termStart, termEnd]
        );
        memberId = mResult.id;
      }

      keptMemberIds.push(memberId);

      // Reuse the login already attached to this seat, otherwise create one from the name
      const linkedUser = await dbGet('SELECT id FROM users WHERE ic_member_id = ? LIMIT 1', [memberId]);
      if (linkedUser) {
        await dbRun(
          'UPDATE users SET name = ?, role = ?, company_id = ? WHERE id = ?',
          [member.name, 'ic_member', companyId, linkedUser.id]
        );
      } else {
        const slug = normalizeName(member.name) || `member${memberId}`;
        const email = `${slug}@vardhman.com`;
        await dbRun(
          'INSERT OR IGNORE INTO users (email, name, role, company_id, ic_member_id) VALUES (?, ?, ?, ?, ?)',
          [email, member.name, 'ic_member', companyId, memberId]
        );
        // Link the row even when that email already existed
        await dbRun(
          'UPDATE users SET ic_member_id = ?, name = ?, role = ?, company_id = ? WHERE email = ?',
          [memberId, member.name, 'ic_member', companyId, email]
        );
      }
    }

    // Drop members who left the committee, detaching their logins first
    for (const stale of existingMembers) {
      if (keptMemberIds.includes(stale.id)) continue;
      await dbRun('UPDATE users SET ic_member_id = NULL WHERE ic_member_id = ?', [stale.id]);
      await dbRun('DELETE FROM ic_members WHERE id = ?', [stale.id]);
    }

    res.json({ success: true, message: 'Internal Committee successfully constituted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ---------------------------------------------------------------------
// CASE WORKFLOW ENDPOINTS
// ---------------------------------------------------------------------

// Get cases
app.get('/api/cases', async (req, res) => {
  try {
    const { company_id } = req.query;
    let query = 'SELECT * FROM cases';
    let params = [];
    if (company_id) {
      query += ' WHERE company_id = ?';
      params.push(company_id);
    }
    const cases = await dbAll(query, params);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single case
app.get('/api/cases/:id', async (req, res) => {
  try {
    const kase = await dbGet('SELECT * FROM cases WHERE id = ?', [req.params.id]);
    if (!kase) {
      return res.status(404).json({ error: 'Case not found' });
    }
    const events = await dbAll('SELECT * FROM case_events WHERE case_id = ? ORDER BY timestamp ASC', [req.params.id]);
    res.json({ ...kase, events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File complaint (Intake)
app.post('/api/cases', async (req, res) => {
  try {
    const {
      company_id, incident_date, location, description,
      is_anonymous, complainant_name, complainant_contact
    } = req.body;

    if (!company_id || !incident_date || !location || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const codeSuffix = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `CASE-${codeSuffix}-RECEIVED`;

    const receivedAt = (await getSystemDate()).toISOString();
    
    // Deadlines
    const deadline90 = new Date(new Date(receivedAt).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const deadline100 = new Date(new Date(receivedAt).getTime() + 100 * 24 * 60 * 60 * 1000).toISOString();
    const deadline160 = new Date(new Date(receivedAt).getTime() + 160 * 24 * 60 * 60 * 1000).toISOString();

    const result = await dbRun(`
      INSERT INTO cases (
        company_id, tracking_code, status, received_at, incident_date, location, description, 
        is_anonymous, complainant_name, complainant_contact, deadline_90, deadline_100, deadline_160
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      company_id, trackingCode, STATUS_STATES.RECEIVED, receivedAt, incident_date, location, description,
      is_anonymous ? 1 : 0, is_anonymous ? null : complainant_name, is_anonymous ? null : complainant_contact,
      deadline90, deadline100, deadline160
    ]);

    // Initial event log
    await dbRun(`
      INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
      VALUES (?, ?, ?, ?, ?)
    `, [result.id, STATUS_STATES.RECEIVED, receivedAt, 'Complaint filed and timestamped. 90-day inquiry clock initiated.', 'System Intake']);

    res.status(201).json({
      id: result.id,
      tracking_code: trackingCode,
      received_at: receivedAt,
      deadline_90: deadline90
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public status tracking (Confidential)
app.get('/api/cases/track/:code', async (req, res) => {
  try {
    const kase = await dbGet(`
      SELECT id, status, received_at, deadline_90, deadline_100, deadline_160,
             has_conciliation_offered, has_conciliation_agreed, has_hearing_given, has_evidence_reviewed
      FROM cases WHERE UPPER(tracking_code) = UPPER(?)
    `, [req.params.code]);

    if (!kase) {
      return res.status(404).json({ error: 'Invalid tracking code' });
    }

    // Expose only basic, public milestones
    const events = await dbAll(`
      SELECT event_type, timestamp, note
      FROM case_events 
      WHERE case_id = ? AND event_type IN ('Received', 'Acknowledged', 'Under Inquiry', 'Report Drafted', 'Awaiting Employer Action', 'Resolved', 'Appealed')
      ORDER BY timestamp ASC
    `, [kase.id]);

    res.json({ case: kase, events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update checklists
app.post('/api/cases/:id/checklist', async (req, res) => {
  try {
    const { type, value } = req.body;
    const allowed = ['has_conciliation_offered', 'has_conciliation_agreed', 'has_hearing_given', 'has_evidence_reviewed'];
    
    if (!allowed.includes(type)) {
      return res.status(400).json({ error: 'Invalid checklist item type' });
    }

    const intVal = value ? 1 : 0;
    await dbRun(`UPDATE cases SET ${type} = ? WHERE id = ?`, [intVal, req.params.id]);

    // Log event
    const sysDateStr = (await getSystemDate()).toISOString();
    let label = '';
    if (type === 'has_conciliation_offered') label = 'Conciliation option offered';
    if (type === 'has_conciliation_agreed') label = 'Conciliation agreement state updated';
    if (type === 'has_hearing_given') label = 'Hearing sessions conducted';
    if (type === 'has_evidence_reviewed') label = 'Evidence files reviewed';

    await dbRun(`
      INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
      VALUES (?, ?, ?, ?, ?)
    `, [req.params.id, 'Checklist Update', sysDateStr, `${label}: ${value ? 'Yes' : 'No'}`, 'Internal Committee']);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log custom notes / findings
app.post('/api/cases/:id/notes', async (req, res) => {
  try {
    const { note, actor_name } = req.body;
    if (!note) {
      return res.status(400).json({ error: 'Note content cannot be empty' });
    }

    const sysDateStr = (await getSystemDate()).toISOString();
    await dbRun(`
      INSERT INTO case_events (case_id, event_type, timestamp, note, actor_name) 
      VALUES (?, ?, ?, ?, ?)
    `, [req.params.id, 'Inquiry Note', sysDateStr, note, actor_name || 'IC Member']);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transition case state
app.post('/api/cases/:id/transition', async (req, res) => {
  try {
    const { nextStatus, note, actorName } = req.body;
    if (!nextStatus) {
      return res.status(400).json({ error: 'Missing next status' });
    }

    const result = await transitionCase(req.params.id, nextStatus, note, actorName);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// ---------------------------------------------------------------------
// DOCUMENT GENERATION ENDPOINTS
// ---------------------------------------------------------------------

app.get('/api/company/:id/documents', async (req, res) => {
  try {
    const docs = await dbAll('SELECT * FROM documents WHERE company_id = ? ORDER BY generated_at DESC', [req.params.id]);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save / Update documents
app.post('/api/company/:id/documents', async (req, res) => {
  try {
    const { type, content, case_id } = req.body;
    if (!type || !content) {
      return res.status(400).json({ error: 'Missing required document fields' });
    }

    const sysDateStr = (await getSystemDate()).toISOString();
    const result = await dbRun(
      'INSERT INTO documents (company_id, case_id, type, generated_at, content) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, case_id || null, type, sysDateStr, JSON.stringify(content)]
    );

    res.status(201).json({ id: result.id, type, generated_at: sysDateStr });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get case documents
app.get('/api/cases/:caseId/documents', async (req, res) => {
  try {
    const docs = await dbAll('SELECT * FROM documents WHERE case_id = ?', [req.params.caseId]);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ---------------------------------------------------------------------
// TRAINING LOG ENDPOINTS
// ---------------------------------------------------------------------

app.get('/api/company/:id/trainings', async (req, res) => {
  try {
    const logs = await dbAll('SELECT * FROM training_logs WHERE company_id = ? ORDER BY date DESC', [req.params.id]);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/company/:id/trainings', async (req, res) => {
  try {
    const { date, attendee_count, topic } = req.body;
    if (!date || attendee_count === undefined || !topic) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await dbRun(
      'INSERT INTO training_logs (company_id, date, attendee_count, topic) VALUES (?, ?, ?, ?)',
      [req.params.id, date, attendee_count, topic]
    );

    res.status(201).json({ id: result.id, date, attendee_count, topic });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Express Server
checkAndSeed().then(() => {
  app.listen(port, () => {
    console.log(`SakhiCommittee API Server listening on port ${port}`);
  });
});
