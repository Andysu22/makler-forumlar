const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const port = process.env.SERVER_PORT || 24585;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware, damit der Server JSON-Daten versteht
app.use(express.json());

// 1. SICHERHEITS-HEADER (CSP erlaubt CDNs für Tailwind/Icons)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy", 
    "default-src 'self' * data: blob: 'unsafe-inline' 'unsafe-eval';"
  );
  next();
});

// HILFSFUNKTION: Datenbank lesen/schreiben
function getSubmissions() {
  if (!fs.existsSync(DB_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) { return {}; }
}

function saveSubmission(uuid, data) {
  const db = getSubmissions();
  // Speichere Daten + Zeitstempel
  db[uuid] = { ...data, submittedAt: new Date().toISOString() };
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// API: Prüfen ob UUID schon existiert
app.get('/api/check/:uuid', (req, res) => {
  const { uuid } = req.params;
  const db = getSubmissions();
  
  if (db[uuid]) {
    return res.json({ exists: true, submittedAt: db[uuid].submittedAt });
  }
  return res.json({ exists: false });
});

// API: Formular absenden
app.post('/api/submit', (req, res) => {
  const { uuid, ...formData } = req.body;

  if (!uuid) return res.status(400).json({ error: "Keine UUID" });

  const db = getSubmissions();
  if (db[uuid]) {
    return res.status(409).json({ error: "Bereits ausgefüllt" });
  }

  saveSubmission(uuid, formData);
  console.log(`[NEU] Formular von ${uuid} gespeichert.`);
  res.json({ success: true });
});

// Frontend ausliefern
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  // Wenn Datei nicht da ist (z.B. vor dem Build), Fehler abfangen
  if (!fs.existsSync(indexPath)) return res.send("Server läuft. Bitte 'npm run build' ausführen.");
  res.sendFile(indexPath);
});

app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});