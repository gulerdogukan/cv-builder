const fs = require('fs');
const path = require('path');

const data = JSON.stringify({
  template: 'creative-canvas',
  data: {
    personal: {
      fullName: 'Melike Guler',
      location: 'Istanbul',
      email: 'm@example.com'
    },
    summary: 'Test summary',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: []
  }
});

fetch('http://localhost:3001/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: data
}).then(r => r.json()).then(res => {
  if (res.error) {
    console.error("Error:", res.error);
  } else if (res.pdf) {
    fs.writeFileSync(path.join(__dirname, 'test.pdf'), Buffer.from(res.pdf, 'base64'));
    console.log("PDF generated successfully: test.pdf");
  } else {
    console.log("Unknown response:", res);
  }
}).catch(e => console.error(e));
