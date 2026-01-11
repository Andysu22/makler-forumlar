// server.js
const express = require('express');
const path = require('path');
const app = express();

// Den Port nehmen, den der Hoster uns gibt
const port = process.env.SERVER_PORT || 24585;

// Hier sagen wir: "Nimm die Dateien aus dem 'dist' Ordner"
// (Der 'dist' Ordner wird gleich von React gebaut)
app.use(express.static(path.join(__dirname, 'dist')));

// Egal welche Seite aufgerufen wird, gib immer die index.html zurück (für React Routing)
app.get('(.*)', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});