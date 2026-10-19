/**
 * Brave Heart Cavaliers: puppy application emails.
 *
 * When someone submits the application on the website, this script:
 *   1. adds the application as a new row in the "Brave Heart Applications" Google Sheet,
 *   2. emails the full application to the breeder,
 *   3. emails the applicant a confirmation with a copy of their answers.
 *
 * The questions themselves are edited in Pages CMS (Website text > 9. Application questions).
 * The website sends each answer together with its question, so new or changed questions
 * appear in the emails and get their own column in the sheet automatically.
 *
 * The confirmation email's subject and opening come from Pages CMS
 * (Website text > 8. Application), read from the live website.
 *
 * Setup instructions: SETUP.md, step 5.
 * After changing this code, publish it again with
 * Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy,
 * so the website address stays the same.
 */

const BREEDER_EMAIL = 'braveheartcavaliers@gmail.com';
const KENNEL_NAME = 'Brave Heart Cavaliers';
const SITE_URL = 'https://braveheartcavaliers.github.io';
const SHEET_FILE_NAME = 'Brave Heart Applications';
const SHEET_NAME = 'Applications';
const MIN_SECONDS_TO_FILL = 8; // faster than this is almost certainly a bot
const MAX_ITEMS = 80;

const DEFAULT_SUBJECT = 'We received your puppy application';
const DEFAULT_INTRO = 'Thank you for your interest in our Cavalier King Charles Spaniel puppies! ' +
  'We have received your application and will get back to you within 48 hours.';
const NOTE = 'Please note: Completing this application does not guarantee a placement or obligate you to purchase a puppy. ' +
  'It helps us match the right puppy with the right family and ensures our dogs go to safe, loving forever homes.';
const CONTACT_LINE = 'If you have questions in the meantime, simply reply to this email, call or text Eugene at 206-255-2007, or text Laura at 360-702-2367.';

/** Receives applications from the website. */
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.company) return respond({ ok: true }); // hidden spam trap was filled in: ignore quietly
    if (body.startedAt && Date.now() - Number(body.startedAt) < MIN_SECONDS_TO_FILL * 1000) {
      return respond({ ok: false, error: 'too_fast' });
    }
    const app = clean(body);
    if (!app.name || !isEmail(app.email) || !app.items.length) {
      return respond({ ok: false, error: 'missing_fields' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try { saveRow(app); } finally { lock.releaseLock(); }

    notifyBreeder(app);
    confirmApplicant(app);
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

/** Run this once from the editor to grant permissions, create the sheet, and send yourself two sample emails. */
function sendTestEmails() {
  const app = clean({
    contact: { name: 'Test Applicant', email: BREEDER_EMAIL, phone: '253-555-0123' },
    items: [
      { section: 'Contact', label: 'Full name', value: 'Test Applicant' },
      { section: 'Contact', label: 'Phone number', value: '253-555-0123' },
      { section: 'Contact', label: 'Email address', value: BREEDER_EMAIL },
      { section: 'Housing', label: 'What type of home do you live in?', value: 'Single-family home' },
      { section: 'Preferences', label: 'Color preference', value: 'Blenheim' },
      { section: 'Anything else', label: 'Anything else you would like us to know?', value: 'This is a test application.' }
    ]
  });
  saveRow(app);
  notifyBreeder(app);
  confirmApplicant(app);
  console.log('Test emails sent. Sheet: ' + getSheet().getParent().getUrl());
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ''));
}

function str(v, max) {
  return String(v === undefined || v === null ? '' : v).trim().slice(0, max);
}

/** Keeps only well-formed answers and trims overly long text. */
function clean(body) {
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, MAX_ITEMS)
    .map(it => ({ section: str(it && it.section, 80) || 'Application', label: str(it && it.label, 300), value: str(it && it.value, 2000) }))
    .filter(it => it.label && it.value);
  const c = body.contact || {};
  return {
    name: str(c.name, 150),
    email: str(c.email, 254),
    phone: str(c.phone, 40),
    puppy: str(body.answers && body.answers.puppy, 100),
    items: items
  };
}

/** The sheet lives in the Brave Heart Google Drive. It is created on first use. */
function getSheet() {
  let ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; }
  if (!ss) {
    const props = PropertiesService.getScriptProperties();
    const id = props.getProperty('SHEET_ID');
    if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
    if (!ss) {
      ss = SpreadsheetApp.create(SHEET_FILE_NAME);
      props.setProperty('SHEET_ID', ss.getId());
    }
  }
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    const first = ss.getSheets()[0];
    sheet = (first && first.getLastRow() === 0 && ss.getSheets().length === 1) ? first.setName(SHEET_NAME) : ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

/** One row per application. A new question gets a new column at the end. */
function saveRow(app) {
  const sheet = getSheet();
  const fixed = ['Received', 'Status', 'Name', 'Email', 'Phone'];
  let header = sheet.getLastRow() === 0 ? [] : sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  if (!header.length) header = fixed.slice();
  app.items.forEach(it => { if (header.indexOf(it.label) === -1) header.push(it.label); });
  sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  const row = header.map(h => {
    if (h === 'Received') return new Date();
    if (h === 'Status') return 'New';
    if (h === 'Name') return safeCell(app.name);
    if (h === 'Email') return safeCell(app.email);
    if (h === 'Phone') return safeCell(app.phone);
    const it = app.items.find(x => x.label === h);
    return it ? safeCell(it.value) : '';
  });
  sheet.appendRow(row);
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

function groups(items) {
  const out = [];
  items.forEach(it => {
    const last = out[out.length - 1];
    if (last && last.title === it.section) last.items.push(it); else out.push({ title: it.section, items: [it] });
  });
  return out;
}

function answersHtml(app) {
  return groups(app.items).map(g =>
    '<h3 style="font:600 16px Georgia,serif;color:#33533a;margin:22px 0 6px">' + esc(g.title) + '</h3>' +
    '<table style="border-collapse:collapse;font:14px Arial,sans-serif;width:100%">' +
    g.items.map(it => '<tr><td style="padding:6px 16px 6px 0;color:#5d625c;vertical-align:top;width:45%">' + esc(it.label) +
      '</td><td style="padding:6px 0;color:#1d2320;vertical-align:top">' + esc(it.value).replace(/\n/g, '<br>') + '</td></tr>').join('') +
    '</table>').join('');
}

function answersText(app) {
  return groups(app.items).map(g => g.title.toUpperCase() + '\n' + g.items.map(it => it.label + ': ' + it.value).join('\n')).join('\n\n');
}

function wrap(inner) {
  return '<div style="max-width:620px;font:15px/1.6 Arial,sans-serif;color:#1d2320">' + inner + '</div>';
}

/** Confirmation wording edited in Pages CMS. Falls back to the defaults above. */
function siteTexts() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('application-texts');
  if (hit) return JSON.parse(hit);
  let t = {};
  try {
    const res = UrlFetchApp.fetch(SITE_URL + '/data/content/application.json', { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) t = JSON.parse(res.getContentText()) || {};
  } catch (e) { t = {}; }
  const out = {
    subject: str(t.confirmationSubject, 150) || DEFAULT_SUBJECT,
    intro: str(t.confirmationText, 2000) || DEFAULT_INTRO
  };
  cache.put('application-texts', JSON.stringify(out), 600);
  return out;
}

function notifyBreeder(app) {
  const subject = 'New puppy application: ' + app.name + (app.puppy ? ' (for ' + app.puppy + ')' : '');
  const html = wrap(
    '<p>A new puppy application arrived from the website. Reply to this email to answer ' + esc(firstName(app.name)) + ' directly.</p>' +
    '<p style="background:#f3e2d6;border-radius:8px;padding:10px 14px">Please reply within 48 hours. The applicant was told to expect an answer by then.</p>' +
    answersHtml(app) +
    '<p style="color:#5d625c;font-size:13px;margin-top:26px">It is also saved in the "' + SHEET_FILE_NAME + '" Google Sheet.</p>');
  MailApp.sendEmail({
    to: BREEDER_EMAIL,
    subject: subject,
    htmlBody: html,
    body: 'A new puppy application arrived from the website. Please reply within 48 hours.\n\n' + answersText(app),
    replyTo: app.email,
    name: 'Brave Heart website'
  });
}

function confirmApplicant(app) {
  const t = siteTexts();
  const introHtml = t.intro.split(/\n\s*\n/).map(p => '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>').join('');
  const html = wrap(
    '<p>Hi ' + esc(firstName(app.name)) + ',</p>' +
    introHtml +
    '<p style="background:#e4ebe2;border-radius:8px;padding:12px 14px">' + esc(NOTE) + '</p>' +
    '<p>' + esc(CONTACT_LINE) + '</p>' +
    '<p style="margin-top:22px;color:#5d625c">Here is a copy of your answers:</p>' +
    answersHtml(app) +
    '<p style="margin-top:28px">Warm regards,<br>Laura and Eugene<br><strong>' + KENNEL_NAME + '</strong><br>Bonney Lake, Washington</p>');
  MailApp.sendEmail({
    to: app.email,
    subject: t.subject,
    htmlBody: html,
    body: 'Hi ' + firstName(app.name) + ',\n\n' + t.intro + '\n\n' + NOTE + '\n\n' + CONTACT_LINE +
      '\n\nHere is a copy of your answers:\n\n' + answersText(app) +
      '\n\nWarm regards,\nLaura and Eugene\n' + KENNEL_NAME + '\nBonney Lake, Washington',
    replyTo: BREEDER_EMAIL,
    name: KENNEL_NAME
  });
}
