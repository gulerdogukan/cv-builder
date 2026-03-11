const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// PDF generation endpoint
app.post('/generate', async (req, res) => {
  const { template = 'modern', data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'CV data is required' });
  }

  let browser;
  try {
    // HTML template yükle
    const templatePath = path.join(__dirname, 'templates', `${template}.html`);
    if (!fs.existsSync(templatePath)) {
      return res.status(400).json({ error: `Template '${template}' not found` });
    }

    let html = fs.readFileSync(templatePath, 'utf-8');

    // Template değişkenlerini doldur
    html = populateTemplate(html, data);

    // Puppeteer ile PDF oluştur
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    // Base64 olarak döndür
    const pdfBase64 = pdfBuffer.toString('base64');
    res.json({ pdf: pdfBase64, format: 'base64' });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'PDF oluşturulurken bir hata oluştu' });
  } finally {
    if (browser) await browser.close();
  }
});

function populateTemplate(html, data) {
  const personal = data.personal || {};
  const summary = data.summary || '';
  const experiences = data.experience || [];
  const educations = data.education || [];
  const skills = data.skills || [];
  const languages = data.languages || [];
  const certifications = data.certifications || [];

  // Basit template replacement
  html = html.replace(/\{\{fullName\}\}/g, personal.fullName || '');
  html = html.replace(/\{\{email\}\}/g, personal.email || '');
  html = html.replace(/\{\{phone\}\}/g, personal.phone || '');
  html = html.replace(/\{\{location\}\}/g, personal.location || '');
  html = html.replace(/\{\{linkedin\}\}/g, personal.linkedin || '');
  html = html.replace(/\{\{github\}\}/g, personal.github || '');
  html = html.replace(/\{\{website\}\}/g, personal.website || '');
  html = html.replace(/\{\{summary\}\}/g, summary);

  // Experience listesi
  const expHtml = experiences.map(exp => `
    <div class="experience-item">
      <div class="item-header">
        <strong>${exp.position}</strong> — ${exp.company}
        ${exp.location ? `<span class="location">${exp.location}</span>` : ''}
      </div>
      <div class="item-date">${exp.startDate} — ${exp.isCurrent ? 'Devam Ediyor' : (exp.endDate || '')}</div>
      <p class="item-desc">${exp.description || ''}</p>
    </div>
  `).join('');
  html = html.replace('{{experienceList}}', expHtml);

  // Education listesi
  const eduHtml = educations.map(edu => `
    <div class="education-item">
      <div class="item-header">
        <strong>${edu.school}</strong>
      </div>
      <div class="item-subtitle">${edu.degree} — ${edu.field}</div>
      <div class="item-date">${edu.startDate} — ${edu.endDate || 'Devam Ediyor'}</div>
      ${edu.gpa ? `<div class="item-gpa">GPA: ${edu.gpa}</div>` : ''}
    </div>
  `).join('');
  html = html.replace('{{educationList}}', eduHtml);

  // Skills
  const skillsHtml = skills.map(s => `<span class="skill-tag">${s.name}</span>`).join('');
  html = html.replace('{{skillsList}}', skillsHtml);

  // Languages
  const langHtml = languages.map(l => `<span class="lang-item">${l.name} (${l.level})</span>`).join(' · ');
  html = html.replace('{{languagesList}}', langHtml);

  // Certifications
  const certHtml = certifications.map(c => `
    <div class="cert-item">${c.name} — ${c.issuer} (${c.date})</div>
  `).join('');
  html = html.replace('{{certificationsList}}', certHtml);

  return html;
}

app.listen(PORT, () => {
  console.log(`PDF Service running on port ${PORT}`);
});
