const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer  = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set up file upload directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Initialize SQLite database
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to the in-memory SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Create Hospitals table
        db.run(`CREATE TABLE hospitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact TEXT,
            lat REAL,
            lng REAL,
            directionsLink TEXT
        )`);

        // Create Oncologists table
        db.run(`CREATE TABLE oncologists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            specialty TEXT,
            phone TEXT,
            hospital TEXT
        )`);

        // Create Appointments table
        db.run(`CREATE TABLE appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientName TEXT NOT NULL,
            patientPhone TEXT,
            oncologistId INTEGER,
            date TEXT,
            time TEXT,
            status TEXT
        )`);

        // Seed Hospitals
        const stmtHospitals = db.prepare("INSERT INTO hospitals (name, contact, lat, lng, directionsLink) VALUES (?, ?, ?, ?, ?)");
        stmtHospitals.run("Apollo Hospitals Greams Road", "+91 44 2829 0200", 13.0617, 80.2541, "https://maps.google.com/?q=Apollo+Hospitals+Greams+Road+Chennai");
        stmtHospitals.run("Adyar Cancer Institute", "+91 44 2220 9150", 13.0116, 80.2443, "https://maps.google.com/?q=Adyar+Cancer+Institute+Chennai");
        stmtHospitals.run("MIOT International", "+91 44 4200 2288", 13.0191, 80.1834, "https://maps.google.com/?q=MIOT+International+Chennai");
        stmtHospitals.run("Fortis Malar Hospital", "+91 44 4289 2222", 13.0116, 80.2573, "https://maps.google.com/?q=Fortis+Malar+Hospital+Chennai");
        stmtHospitals.finalize();

        // Seed Oncologists
        const stmtOncologists = db.prepare("INSERT INTO oncologists (name, specialty, phone, hospital) VALUES (?, ?, ?, ?)");
        stmtOncologists.run("Dr. T. G. Sagar", "Medical Oncology", "+91 98765 43210", "Apollo Hospitals");
        stmtOncologists.run("Dr. Raja T", "Surgical Oncology", "+91 98765 43211", "Apollo Hospitals");
        stmtOncologists.run("Dr. Bellarmine V", "Radiation Oncology", "+91 98765 43212", "MIOT International");
        stmtOncologists.run("Dr. Rejiv Rajendranath", "Medical Oncology", "+91 98765 43213", "Apollo Hospitals");
        stmtOncologists.run("Dr. Suresh N.S.", "Surgical Oncology", "+91 98765 43214", "Fortis Malar");
        stmtOncologists.run("Dr. Aravanan T", "Radiation Oncology", "+91 98765 43215", "Adyar Cancer Institute");
        stmtOncologists.run("Dr. Venkataramanan M", "Pediatric Oncology", "+91 98765 43216", "Apollo Hospitals");
        stmtOncologists.run("Dr. Kanthilal M", "Gynaecological Oncology", "+91 98765 43217", "MIOT International");
        stmtOncologists.finalize();
        
        console.log('Database seeded with 4 Hospitals and 8 Oncologists in Chennai.');
    });
}

// API Routes

// 1. Symptom Checker Analysis
app.post('/api/symptoms', (req, res) => {
    const { symptoms } = req.body;
    if (!symptoms) return res.status(400).json({ error: "No symptoms provided" });
    
    // Mock AI Analysis based on symptoms
    const lowerTokens = symptoms.toLowerCase();
    let riskLevel = "Low";
    let message = "Your symptoms do not immediately suggest high risk, but always consult a doctor if they persist.";
    
    if (lowerTokens.includes("lump") || lowerTokens.includes("blood") || lowerTokens.includes("weight loss") || lowerTokens.includes("cough")) {
        riskLevel = "Moderate to High";
        message = "These symptoms can be associated with serious conditions including cancer. Please schedule an appointment with an oncologist for thorough screening.";
    }

    res.json({ analysis: message, riskLevel });
});

// 2. Upload Report (Mock AI Analysis)
app.post('/api/upload', upload.single('report'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Mock response after simulating processing
    setTimeout(() => {
        res.json({
            message: "Report analyzed successfully.",
            findings: "No significant malignancies detected in this generic scan. However, clinical correlation is recommended.",
            confidentScore: "92%"
        });
    }, 1500); // 1.5s delay to mock AI processing
});

// 3. Risk Calculator
app.post('/api/risk', (req, res) => {
    const { age, smoking, familyHistory, alcohol, diet } = req.body;
    
    let riskPercentage = 5; // Base risk
    if (age > 50) riskPercentage += 15;
    if (smoking === 'yes') riskPercentage += 30;
    if (familyHistory === 'yes') riskPercentage += 20;
    if (alcohol === 'yes') riskPercentage += 10;
    if (diet === 'poor') riskPercentage += 10;

    // Cap at 95%
    if (riskPercentage > 95) riskPercentage = 95;

    res.json({
        riskPercentage,
        level: riskPercentage < 20 ? "Low Risk" : (riskPercentage < 60 ? "Moderate Risk" : "High Risk"),
        recommendation: riskPercentage >= 60 ? "Immediate screening is recommended based on your risk profile." : "Continue regular checkups and maintain a healthy lifestyle."
    });
});

// 4. Get Hospitals
app.get('/api/hospitals', (req, res) => {
    db.all("SELECT * FROM hospitals", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ hospitals: rows });
    });
});

// 5. Get Oncologists
app.get('/api/oncologists', (req, res) => {
    const { specialty } = req.query;
    let query = "SELECT * FROM oncologists";
    let params = [];
    
    if (specialty && specialty !== 'All') {
        query += " WHERE specialty = ?";
        params.push(specialty);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ oncologists: rows });
    });
});

// 6. Book Appointment
app.post('/api/appointment', (req, res) => {
    const { patientName, patientPhone, oncologistId, date, time } = req.body;
    
    if (!patientName || !oncologistId || !date || !time) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const stmt = db.prepare("INSERT INTO appointments (patientName, patientPhone, oncologistId, date, time, status) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(patientName, patientPhone, oncologistId, date, time, 'Confirmed', function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            message: "Appointment confirmed successfully!",
            appointmentId: this.lastID,
            status: "Confirmed"
        });
    });
    stmt.finalize();
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
