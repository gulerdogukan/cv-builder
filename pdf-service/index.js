const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — restrict to known origins; ALLOWED_ORIGINS env var is a comma-separated list
const rawOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5000';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server calls from the .NET backend)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// ── Auth middleware ────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) {
    console.warn('WARNING: INTERNAL_SECRET is not set. PDF generation is unprotected.');
    return next();
  }
  
  const incomingSecret = req.headers['x-internal-secret'];
  if (incomingSecret !== secret) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid internal secret' });
  }
  next();
};

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/generate', authMiddleware);

// ── PDF generation ────────────────────────────────────────────────────────────
app.post('/generate', async (req, res) => {
  const { template: rawTemplate = 'modern', data } = req.body;
  const template = (typeof rawTemplate === 'string' ? rawTemplate : 'modern').toLowerCase().trim();

  if (!data) {
    return res.status(400).json({ error: 'CV data is required' });
  }

  const ALLOWED_TEMPLATES = ['modern', 'classic', 'minimal', 'creative-canvas', 'startup'];
  if (!ALLOWED_TEMPLATES.includes(template)) {
    return res.status(400).json({ error: `Template '${template}' not found. Allowed: ${ALLOWED_TEMPLATES.join(', ')}` });
  }

  const templatePath = path.join(__dirname, 'templates', `${template}.html`);
  if (!fs.existsSync(templatePath)) {
    return res.status(400).json({ error: `Template file '${template}.html' not found` });
  }

  let browser;
  try {
    let html = fs.readFileSync(templatePath, 'utf-8');
    html = populateTemplate(html, data);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    // Puppeteer v22+ returns Uint8Array, not Buffer.
    // Uint8Array.toString('base64') doesn't exist — use Buffer.from() to convert first.
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
    res.json({ pdf: pdfBase64, format: 'base64' });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'PDF oluşturulurken bir hata oluştu', detail: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

// ── Template population ───────────────────────────────────────────────────────

/** XSS — HTML özel karakterlerini kaçır */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** YYYY-MM → "Oca 2023" formatına çevir. Geçersiz girdi "" döner. */
function fmtDate(ym) {
  if (!ym || typeof ym !== 'string') return '';
  const parts = ym.trim().split('-');
  const year = parts[0];
  if (!year || !/^\d{4}$/.test(year)) return esc(ym); // fallback: escape as-is
  if (parts.length < 2) return year; // year-only
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const m = parseInt(parts[1], 10);
  if (isNaN(m) || m < 1 || m > 12) return year; // invalid month → year only
  return `${months[m - 1]} ${year}`;
}

function populateTemplate(html, data) {
  const personal       = data.personal       || {};
  const summary        = data.summary        || '';
  const experiences    = data.experience     || [];
  const educations     = data.education      || [];
  const skills         = data.skills         || [];
  const languages      = data.languages      || [];
  const certifications = data.certifications || [];

  // Kişisel bilgiler
  const firstName = esc(personal.fullName);
  html = html.replace(/\{\{fullName\}\}/g,    firstName);
  html = html.replace(/\{\{firstLetter\}\}/g, firstName.charAt(0) || 'S');
  html = html.replace(/\{\{profession\}\}/g,  esc(personal.profession || ''));
  html = html.replace(/\{\{email\}\}/g,       esc(personal.email));
  html = html.replace(/\{\{phone\}\}/g,       esc(personal.phone));
  html = html.replace(/\{\{location\}\}/g,    esc(personal.location));
  html = html.replace(/\{\{linkedin\}\}/g,    esc(personal.linkedin));
  html = html.replace(/\{\{github\}\}/g,      esc(personal.github));
  html = html.replace(/\{\{website\}\}/g,     esc(personal.website));
  html = html.replace(/\{\{summary\}\}/g,     esc(summary));

  // Deneyim — uses template-aware classes
  const expHtml = experiences.map(exp => {
    const dateRange = `${fmtDate(exp.startDate)} — ${exp.isCurrent ? 'Devam Ediyor' : fmtDate(exp.endDate)}`;
    return `
      <div class="experience-item">
        <div class="exp-dot"></div>
        <table class="exp-header-table"><tr>
          <td><span class="exp-pos">${esc(exp.position)}</span></td>
          <td><span class="exp-date">${esc(dateRange)}</span></td>
        </tr></table>
        <div class="exp-company">${esc(exp.company)}${exp.location ? ` <span class="exp-location">| ${esc(exp.location)}</span>` : ''}</div>
        ${exp.description ? `<p class="item-desc">${esc(exp.description)}</p>` : ''}
        <!-- legacy aliases for modern/classic/minimal -->
        <div class="item-header" style="display:none"></div>
      </div>`;
  }).join('');
  html = html.replace('{{experienceList}}', expHtml || '<p class="empty-section">—</p>');

  // Eğitim
  const eduHtml = educations.map(edu => {
    const dateRange = `${fmtDate(edu.startDate)} — ${edu.endDate ? fmtDate(edu.endDate) : 'Devam Ediyor'}`;
    return `
      <div class="education-item">
        <div class="edu-school">${esc(edu.school)}</div>
        <div class="edu-degree">${esc(edu.degree)}${edu.field ? ` — ${esc(edu.field)}` : ''}</div>
        <table class="edu-bottom-table"><tr>
          <td><span class="edu-date">${esc(dateRange)}</span></td>
          ${edu.gpa ? `<td><span class="edu-gpa">GPA: ${esc(String(edu.gpa))}</span></td>` : '<td></td>'}
        </tr></table>
        ${edu.description ? `<p class="item-desc">${esc(edu.description)}</p>` : ''}
        <!-- legacy aliases -->
        <div class="item-header" style="display:none"></div>
        <div class="item-subtitle" style="display:none"></div>
        <div class="item-date" style="display:none"></div>
      </div>`;
  }).join('');
  html = html.replace('{{educationList}}', eduHtml || '<p class="empty-section">—</p>');

  // Beceriler
  const skillsHtml = skills.map(s =>
    `<div class="skill-row">
      <table class="skill-row-table"><tr>
        <td><span class="skill-name skill-tag" data-level="${esc(s.level)}">${esc(s.name)}</span></td>
        <td><span class="skill-level">${esc(s.level)}</span></td>
      </tr></table>
    </div>`
  ).join('');
  html = html.replace('{{skillsList}}', skillsHtml);

  // Diller
  const langHtml = languages.map(l =>
    `<span class="lang-item"><span class="lang-name">${esc(l.name)}</span> <span class="lang-level">(${esc(l.level)})</span></span>`
  ).join(' ');
  html = html.replace('{{languagesList}}', langHtml);

  // Sertifikalar
  const certHtml = certifications.map(c => `
    <div class="cert-item">
      <div class="cert-name">${esc(c.name)}</div>
      ${c.issuer ? `<div class="cert-issuer">${esc(c.issuer)}</div>` : ''}
      ${c.date ? `<div class="cert-date">${fmtDate(c.date)}</div>` : ''}
    </div>`
  ).join('');
  html = html.replace('{{certificationsList}}', certHtml);

  return html;
}

app.listen(PORT, () => {
  console.log(`PDF Service running on port ${PORT}`);
});
