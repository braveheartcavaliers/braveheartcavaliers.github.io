/**
 * Brave Heart Cavaliers: puppy application emails.
 *
 * When someone submits the application on the website, this script:
 *   1. adds the application as a new row in the "Applications" sheet,
 *   2. emails the full application to the breeder,
 *   3. emails the applicant a confirmation with a copy of their answers.
 *
 * Setup instructions: SETUP.md, step 5.
 * After changing this code, publish it again with
 * Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy,
 * so the website address stays the same.
 */

const BREEDER_EMAIL = 'braveheartcavaliers@gmail.com';
const KENNEL_NAME = 'Brave Heart Cavaliers';
const SHEET_NAME = 'Applications';
const MIN_SECONDS_TO_FILL = 8; // faster than this is almost certainly a bot

const SECTIONS = [
  ['Contact', [['fullName', 'Full name'], ['phone', 'Phone'], ['street', 'Street address'], ['cityStateZip', 'City, state, ZIP'], ['email', 'Email'], ['social', 'Social media']]],
  ['Housing', [['homeType', 'Home type'], ['homeOther', 'Home details'], ['ownRent', 'Own or rent'], ['rentPermission', 'Landlord permission'], ['rentRestrictions', 'Pet restrictions'], ['fenced', 'Fenced yard'], ['fenceDetails', 'Fence'], ['noFencePlan', 'Plan without a fence']]],
  ['Family', [['adults', 'Adults'], ['childCount', 'Children'], ['childAges', "Children's ages"], ['childHandling', 'Children handle small dogs'], ['allergies', 'Dog allergies'], ['hoursAlone', 'Hours alone a day']]],
  ['Experience', [['hasPets', 'Other pets'], ['otherPets', 'Pet details'], ['dogExperience', 'Dog experience'], ['pastDogs', 'Past dogs'], ['vet', 'Established vet']]],
  ['Preferences', [['puppy', 'Puppy applied for'], ['colour', 'Color'], ['gender', 'Gender'], ['purpose', 'Purpose'], ['temperament', 'Temperament'], ['waitLitter', 'Willing to wait for a future litter']]],
  ['Agreement', [['dailyCare', 'Daily affection and attention'], ['returnContract', 'Return to Breeder clause']]],
  ['Anything else', [['message', 'Message']]]
];
const ALL_FIELDS = SECTIONS.reduce((all, s) => all.concat(s[1]), []);

/** Receives applications from the website. */
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.company) return respond({ ok: true }); // hidden spam trap was filled in: ignore quietly
    if (body.startedAt && Date.now() - Number(body.startedAt) < MIN_SECONDS_TO_FILL * 1000) {
      return respond({ ok: false, error: 'too_fast' });
    }
    const a = clean(body.answers || {});
    if (!a.fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email || '')) {
      return respond({ ok: false, error: 'missing_fields' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try { saveRow(a); } finally { lock.releaseLock(); }

    notifyBreeder(a);
    confirmApplicant(a);
    return respond({ ok: true });
  } catch (err) {
    console.error(err);
    return respond({ ok: false, error: 'server_error' });
  }
}

/** Opening the web app address in a browser shows this, which confirms it is running. */
function doGet() {
  return respond({ ok: true, service: 'Brave Heart puppy applications' });
}

/** Run this once from the editor to grant permissions and send yourself two sample emails. */
function sendTestEmails() {
  const sample = {
    fullName: 'Test Applicant', phone: '253-555-0123', street: '1 Main St', cityStateZip: 'Bonney Lake, WA 98391',
    email: BREEDER_EMAIL, homeType: 'Single-family home', ownRent: 'Own', fenced: 'Yes', fenceDetails: '5 ft wood fence',
    adults: '2', childCount: '0', allergies: 'No', hoursAlone: '2 to 4', hasPets: 'No',
    dogExperience: 'Yes, other breeds', pastDogs: 'Passed away of old age', vet: 'Yes',
    colour: 'Blenheim', gender: 'Female', purpose: 'Family companion / pet', waitLitter: 'Yes',
    dailyCare: 'Yes', returnContract: 'Yes', message: 'This is a test application.'
  };
  saveRow(sample);
  notifyBreeder(sample);
  confirmApplicant(sample);
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Keeps only the known questions and trims overly long answers. */
function clean(raw) {
  const a = {};
  ALL_FIELDS.forEach(([key]) => {
    if (raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim() !== '') {
      a[key] = String(raw[key]).trim().slice(0, 2000);
    }
  });
  return a;
}

function saveRow(a) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    const header = ['Received', 'Status'].concat(ALL_FIELDS.map(f => f[1]));
    sheet.appendRow(header);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
  }
  sheet.appendRow([new Date(), 'New'].concat(ALL_FIELDS.map(([key]) => safeCell(a[key] || ''))));
}

/** Stops text that starts with = + - @ from being treated as a spreadsheet formula. */
function safeCell(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function firstName(full) {
  return String(full || '').trim().split(/\s+/)[0] || 'there';
}

function answersHtml(a) {
  return SECTIONS.map(([title, fields]) => {
    const rows = fields.filter(([k]) => a[k]).map(([k, label]) =>
      '<tr><td style="padding:6px 16px 6px 0;color:#5d625c;vertical-align:top;white-space:nowrap">' + esc(label) +
      '</td><td style="padding:6px 0;color:#1d2320">' + esc(a[k]).replace(/\n/g, '<br>') + '</td></tr>').join('');
    return rows ? '<h3 style="font:600 16px Georgia,serif;color:#33533a;margin:22px 0 6px">' + esc(title) +
      '</h3><table style="border-collapse:collapse;font:14px Arial,sans-serif">' + rows + '</table>' : '';
  }).join('');
}

function answersText(a) {
  return SECTIONS.map(([title, fields]) => {
    const rows = fields.filter(([k]) => a[k]).map(([k, label]) => label + ': ' + a[k]);
    return rows.length ? title.toUpperCase() + '\n' + rows.join('\n') : '';
  }).filter(Boolean).join('\n\n');
}

function wrap(inner) {
  return '<div style="max-width:620px;font:15px/1.6 Arial,sans-serif;color:#1d2320">' + inner + '</div>';
}

function notifyBreeder(a) {
  const subject = 'New puppy application: ' + a.fullName + (a.puppy ? ' (for ' + a.puppy + ')' : '');
  const html = wrap(
    '<p>A new puppy application arrived from the website. Reply to this email to answer ' + esc(firstName(a.fullName)) + ' directly.</p>' +
    answersHtml(a) +
    '<p style="color:#5d625c;font-size:13px;margin-top:26px">It is also saved in the "' + SHEET_NAME + '" sheet.</p>');
  MailApp.sendEmail({
    to: BREEDER_EMAIL,
    subject: subject,
    htmlBody: html,
    body: 'A new puppy application arrived from the website.\n\n' + answersText(a),
    replyTo: a.email,
    name: 'Brave Heart website'
  });
}

function confirmApplicant(a) {
  const intro =
    'Thank you for your interest in our Cavalier King Charles Spaniel puppies! We have received your application and will be in touch soon.';
  const note =
    'Please note: Completing this application does not guarantee a placement or obligate you to purchase a puppy. ' +
    'It helps us match the right puppy with the right family and ensures our dogs go to safe, loving forever homes.';
  const contact =
    'If you have questions in the meantime, simply reply to this email, call or text Eugene at 206-255-2007, or text Laura at 360-702-2367.';
  const html = wrap(
    '<p>Hi ' + esc(firstName(a.fullName)) + ',</p>' +
    '<p>' + esc(intro) + '</p>' +
    '<p style="background:#e4ebe2;border-radius:8px;padding:12px 14px">' + esc(note) + '</p>' +
    '<p>' + esc(contact) + '</p>' +
    '<p style="margin-top:22px;color:#5d625c">Here is a copy of your answers:</p>' +
    answersHtml(a) +
    '<p style="margin-top:28px">Warm regards,<br>Laura and Eugene<br><strong>' + KENNEL_NAME + '</strong><br>Bonney Lake, Washington</p>');
  MailApp.sendEmail({
    to: a.email,
    subject: 'We received your puppy application',
    htmlBody: html,
    body: 'Hi ' + firstName(a.fullName) + ',\n\n' + intro + '\n\n' + note + '\n\n' + contact +
      '\n\nHere is a copy of your answers:\n\n' + answersText(a) +
      '\n\nWarm regards,\nLaura and Eugene\n' + KENNEL_NAME + '\nBonney Lake, Washington',
    replyTo: BREEDER_EMAIL,
    name: KENNEL_NAME
  });
}
