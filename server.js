const express = require('express');
const path = require('path');
const app = express();

const port = process.env.SERVER_PORT || 24585;

// 1. SICHERHEITS-BLOCKADE LÖSEN (Wichtig!)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy", 
    "default-src 'self' * data: blob: 'unsafe-inline' 'unsafe-eval';"
  );
  next();
});

// 2. Den 'dist' Ordner bereitstellen
app.use(express.static(path.join(__dirname, 'dist')));

// 3. Fallback für React (Alle anderen Anfragen gehen an index.html)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send("Fehler: Der 'dist' Ordner fehlt! Bitte 'npm run build' ausführen.");
    }
  });
});

app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});