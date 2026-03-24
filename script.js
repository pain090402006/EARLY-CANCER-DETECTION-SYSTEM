const API_BASE = "http://localhost:3000/api";

// ================= SYMPTOM CHECK =================
async function analyzeSymptoms() {
    const input = document.getElementById("symptom-input").value;

    try {
        const res = await fetch(`${API_BASE}/symptom-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symptoms: input })
        });

        const data = await res.json();

        document.getElementById("symptom-result").innerHTML =
            `<p>${data.analysis}</p><strong>${data.riskLevel}</strong>`;

    } catch (err) {
        console.error(err);
        alert("Backend not connected");
    }
}

// ================= HOSPITALS =================
async function loadHospitals() {
    try {
        const res = await fetch(`${API_BASE}/hospitals`);
        const data = await res.json();

        const container = document.getElementById("hospitals-list");
        container.innerHTML = "";

        data.hospitals.forEach(h => {
            container.innerHTML += `
                <div>
                    <h3>${h.name}</h3>
                    <p>${h.contact}</p>
                </div>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}

// ================= ONCOLOGISTS =================
async function loadOncologists() {
    try {
        const res = await fetch(`${API_BASE}/oncologists`);
        const data = await res.json();

        const container = document.getElementById("oncologists-list");
        container.innerHTML = "";

        data.oncologists.forEach(o => {
            container.innerHTML += `
                <div>
                    <h3>${o.name}</h3>
                    <p>${o.specialty}</p>
                    <p>${o.phone}</p>
                </div>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}

// ================= RISK =================
async function calculateRisk() {
    try {
        const res = await fetch(`${API_BASE}/risk`, {
            method: "POST"
        });

        const data = await res.json();

        document.getElementById("risk-result").innerText =
            data.riskPercentage + "% - " + data.level;

    } catch (err) {
        console.error(err);
    }
}

// ================= UPLOAD =================
async function uploadReport() {
    try {
        const res = await fetch(`${API_BASE}/upload`, {
            method: "POST"
        });

        const data = await res.json();

        document.getElementById("upload-result").innerHTML =
            `<p>${data.findings}</p>`;

    } catch (err) {
        console.error(err);
    }
}

// ================= LOAD INIT =================
window.onload = () => {
    loadHospitals();
    loadOncologists();
};