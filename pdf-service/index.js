const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── PDF generation ────────────────────────────────────────────────────────────
app.post('/generate', async (req, res) => {
  const { template = 'modern', data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'CV data is required' });
  }

  const ALLOWED_TEMPLATES = ['modern', 'classic', 'minimal'];
  if (!ALLOWED_TEMPLATES.includes(template)) {
    return res.status(400).json({ error: `Template '${template}' not found` });
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
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    const pdfBase64 = pdfBuffer.toString('base64');
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

/** YYYY-MM → "Oca 2023" formatına çevir */
function fmtDate(ym) {
  if (!ym) return '';
  const [year, month] = ym.split('-');
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const m = parseInt(month, 10);
  return month ? `${months[m - 1] || ''} ${year}` : year;
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
  html = html.replace(/\{\{fullName\}\}/g,  esc(personal.fullName));
  html = html.replace(/\{\{email\}\}/g,     esc(personal.email));
  html = html.replace(/\{\{phone\}\}/g,     esc(personal.phone));
  html = html.replace(/\{\{location\}\}/g,  esc(personal.location));
  html = html.replace(/\{\{linkedin\}\}/g,  esc(personal.linkedin));
  html = html.replace(/\{\{github\}\}/g,    esc(personal.github));
  html = html.replace(/\{\{website\}\}/g,   esc(personal.website));
  html = html.replace(/\{\{summary\}\}/g,   esc(summary));

  // Deneyim
  const expHtml = experiences.map(exp => {
    const dateRange = `${fmtDate(exp.startDate)} — ${exp.isCurrent ? 'Devam Ediyor' : fmtDate(exp.endDate)}`;
    return `
      <div class="experience-item">
        <div class="item-header">
          <strong>${esc(exp.position)}</strong>
          <span class="separator"> — </span>
          ${esc(exp.company)}
          ${exp.location ? `<span class="location"> · ${esc(exp.location)}</span>` : ''}
        </div>
        <div class="item-date">${esc(dateRange)}</div>
        ${exp.description ? `<p class="item-desc">${esc(exp.description)}</p>` : ''}
      </div>`;
  }).join('');
  html = html.replace('{{experienceList}}', expHtml || '<p class="empty-section">—</p>');

  // Eğitim
  const eduHtml = educations.map(edu => {
    const dateRange = `${fmtDate(edu.startDate)} — ${edu.endDate ? fmtDate(edu.endDate) : 'Devam Ediyor'}`;
    return `
      <div class="education-item">
        <div class="item-header"><strong>${esc(edu.school)}</strong></div>
        <div class="item-subtitle">${esc(edu.degree)}${edu.field ? ` — ${esc(edu.field)}` : ''}</div>
        <div class="item-date">${esc(dateRange)}</div>
        ${edu.gpa ? `<div class="item-gpa">GPA: ${esc(String(edu.gpa))}</div>` : ''}
        ${edu.description ? `<p class="item-desc">${esc(edu.description)}</p>` : ''}
      </div>`;
  }).join('');
  html = html.replace('{{educationList}}', eduHtml || '<p class="empty-section">—</p>');

  // Beceriler
  const skillsHtml = skills.map(s =>
    `<span class="skill-tag" data-level="${esc(s.level)}">${esc(s.name)}</span>`
  ).join('');
  html = html.replace('{{skillsList}}', skillsHtml);

  // Diller
  const langHtml = languages.map(l =>
    `<span class="lang-item">${esc(l.name)} <span class="lang-level">(${esc(l.level)})</span></span>`
  ).join(' · ');
  html = html.replace('{{languagesList}}', langHtml);

  // Sertifikalar
  const certHtml = certifications.map(c => {
    const parts = [esc(c.name), c.issuer && esc(c.issuer), c.date && fmtDate(c.date)].filter(Boolean);
    return `<div class="cert-item">${parts.join(' — ')}${c.url ? ` <span class="cert-url">${esc(c.url)}</span>` : ''}</div>`;
  }).join('');
  html = html.replace('{{certificationsList}}', certHtml);

  return html;
}

app.listen(PORT, () => {
  console.log(`PDF Service running on port ${PORT}`);
});
