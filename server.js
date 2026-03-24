const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ================= DATABASE =================
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run(`CREATE TABLE hospitals (
        id INTEGER PRIMARY KEY,
        name TEXT,
        contact TEXT
    )`);

    db.run(`CREATE TABLE oncologists (
        id INTEGER PRIMARY KEY,
        name TEXT,
        specialty TEXT,
        phone TEXT
    )`);

    db.run(`INSERT INTO hospitals VALUES 
        (1,'Apollo Hospital','1234567890'),
        (2,'Cancer Institute','9876543210')`);

    db.run(`INSERT INTO oncologists VALUES 
        (1,'Dr Kumar','Medical Oncology','9999999999'),
        (2,'Dr Raj','Surgical Oncology','8888888888')`);
});

// ================= ROUTES =================

// Symptom Check
app.post('/api/symptom-check', (req, res) => {
    const { symptoms = "" } = req.body;

    let riskLevel = "Low";
    let message = "No serious issue detected";

    if (symptoms.toLowerCase().includes("cough") || symptoms.toLowerCase().includes("lump")) {
        riskLevel = "High";
        message = "Consult a doctor immediately";
    }

    res.json({ analysis: message, riskLevel });
});

// Hospitals
app.get('/api/hospitals', (req, res) => {
    db.all("SELECT * FROM hospitals", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ hospitals: rows });
    });
});

// Oncologists
app.get('/api/oncologists', (req, res) => {
    db.all("SELECT * FROM oncologists", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ oncologists: rows });
    });
});

// Risk Calculator
app.post('/api/risk', (req, res) => {
    res.json({
        riskPercentage: 35,
        level: "Moderate",
        recommendation: "Maintain healthy lifestyle & regular checkups"
    });
});

// Upload (mock)
app.post('/api/upload', (req, res) => {
    res.json({
        message: "Report analyzed successfully",
        findings: "No major abnormalities",
        confidentScore: "91%"
    });
});

// ================= START =================
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});