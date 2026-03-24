const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Symptom Checker & Voice Input
    const symInput = document.getElementById('symptom-input');
    const btnVoice = document.getElementById('btn-voice');
    const btnAnalyzeSym = document.getElementById('btn-analyze-symptoms');
    const symResult = document.getElementById('symptom-result');

    // Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        btnVoice.addEventListener('click', () => {
            btnVoice.classList.add('pulse');
            recognition.start();
        });

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            symInput.value += (symInput.value ? ' ' : '') + transcript;
            btnVoice.classList.remove('pulse');
        };

        recognition.onerror = () => btnVoice.classList.remove('pulse');
        recognition.onend = () => btnVoice.classList.remove('pulse');
    } else {
        btnVoice.style.display = 'none'; // Not supported
    }

    btnAnalyzeSym.addEventListener('click', async () => {
        const symptoms = symInput.value.trim();
        if (!symptoms) return alert("Please enter your symptoms.");

        btnAnalyzeSym.disabled = true;
        btnAnalyzeSym.innerText = 'Analyzing...';
        symResult.classList.add('hidden');

        try {
            const res = await fetch(`${API_BASE}/symptoms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms })
            });
            const data = await res.json();

            symResult.innerHTML = `
                <h4 class="text-primary mb-1">AI Analysis</h4>
                <p>${data.analysis}</p>
                <div class="mt-1"><strong>Risk Indicator:</strong> <span class="${data.riskLevel.includes('High') ? 'text-accent' : 'text-success'}">${data.riskLevel}</span></div>
            `;
            symResult.classList.remove('hidden');
        } catch (e) {
            console.error(e);
            alert("Failed to analyze symptoms.");
        } finally {
            btnAnalyzeSym.disabled = false;
            btnAnalyzeSym.innerHTML = 'Analyze Symptoms <i class="fa-solid fa-arrow-right"></i>';
        }
    });

    // 2. Report Upload
    const uploadForm = document.getElementById('upload-form');
    const reportFile = document.getElementById('report-file');
    const fileNameDisplay = document.getElementById('file-name');
    const uploadArea = document.getElementById('upload-area');
    const uploadResult = document.getElementById('upload-result');

    reportFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.innerText = "Selected: " + e.target.files[0].name;
        }
    });

    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = "var(--primary-dark)"; });
    uploadArea.addEventListener('dragleave', (e) => { e.preventDefault(); uploadArea.style.borderColor = "var(--primary)"; });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = "var(--primary)";
        if (e.dataTransfer.files.length) {
            reportFile.files = e.dataTransfer.files;
            fileNameDisplay.innerText = "Selected: " + reportFile.files[0].name;
        }
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (reportFile.files.length === 0) return alert("Please select a file.");

        const btn = uploadForm.querySelector('button');
        btn.disabled = true;
        btn.innerText = "Processing...";
        uploadResult.classList.add('hidden');

        const formData = new FormData();
        formData.append('report', reportFile.files[0]);

        try {
            const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            uploadResult.innerHTML = `
                <p><strong>Status:</strong> ${data.message}</p>
                <p><strong>Findings:</strong> ${data.findings}</p>
                <p><strong>AI Confidence:</strong> ${data.confidentScore}</p>
            `;
            uploadResult.classList.remove('hidden');
        } catch (e) {
            console.error(e);
            alert("Upload failed.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Analyze Report <i class="fa-solid fa-robot"></i>';
        }
    });

    // 3. Risk Calculator
    const riskForm = document.getElementById('risk-form');
    const riskResult = document.getElementById('risk-result');
    riskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            age: document.getElementById('risk-age').value,
            smoking: document.getElementById('risk-smoking').value,
            familyHistory: document.getElementById('risk-history').value,
            alcohol: document.getElementById('risk-alcohol').value,
            diet: document.getElementById('risk-diet').value
        };

        const btn = riskForm.querySelector('button');
        btn.disabled = true;
        btn.innerText = "Calculating...";

        try {
            const res = await fetch(`${API_BASE}/risk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            document.getElementById('risk-percentage').innerText = data.riskPercentage + "%";
            document.getElementById('risk-percentage').style.color = data.riskPercentage >= 60 ? "var(--accent)" : "var(--primary)";
            document.getElementById('risk-level').innerText = "Assessed Level: " + data.level;
            document.getElementById('risk-recommendation').innerText = data.recommendation;

            riskResult.classList.remove('hidden');
        } catch (e) {
            console.error(e);
        } finally {
            btn.disabled = false;
            btn.innerText = "Calculate Risk %";
        }
    });

    // 4. Digital Twin Body
    const organs = document.querySelectorAll('.organ');
    const bodyInfo = document.getElementById('body-info');
    const organTitle = document.getElementById('organ-title');
    const organDetails = document.getElementById('organ-details');

    organs.forEach(o => {
        o.addEventListener('click', function () {
            // Reset stroke
            organs.forEach(org => org.querySelectorAll('path, circle, ellipse').forEach(el => el.style.fill = "#E8F0FE"));
            // Highlight current
            this.querySelectorAll('path, circle, ellipse').forEach(el => el.style.fill = "var(--accent)");

            organTitle.innerText = this.getAttribute('data-name');
            organDetails.innerText = this.getAttribute('data-info');
            bodyInfo.classList.remove('hidden');
        });
    });

    // 5. Emergency Hospitals & Oncologists Loader
    loadHospitals();
    loadOncologists();

    async function loadHospitals() {
        try {
            const res = await fetch(`${API_BASE}/hospitals`);
            const data = await res.json();
            const container = document.getElementById('hospitals-list');
            container.innerHTML = '';

            data.hospitals.forEach(h => {
                container.innerHTML += `
                    <div class="card hospital-card bg-white mt-3">
                        <h3>${h.name}</h3>
                        <p><i class="fa-solid fa-phone"></i> ${h.contact}</p>
                        <a href="${h.directionsLink}" target="_blank" class="mt-2 d-inline-block"><i class="fa-solid fa-map-location-dot"></i> Get Directions</a>
                    </div>
                `;
            });
        } catch (e) { console.error("Error loading hospitals", e); }
    }

    async function loadOncologists(specialty = 'All') {
        try {
            const res = await fetch(`${API_BASE}/oncologists?specialty=${encodeURIComponent(specialty)}`);
            const data = await res.json();
            const container = document.getElementById('oncologists-list');
            container.innerHTML = '';

            data.oncologists.forEach(doc => {
                container.innerHTML += `
                    <div class="card doc-card">
                        <i class="fa-solid fa-user-doctor fa-3x mb-2 text-primary"></i>
                        <h4>${doc.name}</h4>
                        <p class="specialty">${doc.specialty}</p>
                        <p class="hospital"><i class="fa-solid fa-hospital"></i> ${doc.hospital}</p>
                        <a href="tel:${doc.phone.replace(/\s+/g, '')}" class="btn-secondary w-100 mb-2"><i class="fa-solid fa-phone"></i> ${doc.phone}</a>
                        <button class="btn-primary w-100 btn-book" data-id="${doc.id}" data-name="${doc.name}"><i class="fa-solid fa-calendar-check"></i> Book Now</button>
                    </div>
                `;
            });

            // Booking Modal triggers
            document.querySelectorAll('.btn-book').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('button').getAttribute('data-id');
                    const name = e.target.closest('button').getAttribute('data-name');
                    document.getElementById('book-doc-id').value = id;
                    document.getElementById('booking-doc-name').innerText = `Consultation with ${name}`;
                    document.getElementById('booking-modal').classList.remove('hidden');
                    document.getElementById('booking-form').classList.remove('hidden');
                    document.getElementById('booking-success').classList.add('hidden');
                });
            });

        } catch (e) { console.error("Error loading oncologists", e); }
    }

    document.getElementById('specialty-filter').addEventListener('change', (e) => {
        loadOncologists(e.target.value);
    });

    // 6. Booking Modal Logic
    const modal = document.getElementById('booking-modal');
    const closeBtn = document.querySelector('.close-modal');
    const closeSuccessBtn = document.getElementById('btn-close-success');

    closeBtn.onclick = () => modal.classList.add('hidden');
    closeSuccessBtn.onclick = () => modal.classList.add('hidden');
    window.onclick = (e) => { if (e.target == modal) modal.classList.add('hidden'); }

    document.getElementById('booking-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            patientName: document.getElementById('book-name').value,
            patientPhone: document.getElementById('book-phone').value,
            oncologistId: document.getElementById('book-doc-id').value,
            date: document.getElementById('book-date').value,
            time: document.getElementById('book-time').value
        };

        const btn = document.getElementById('booking-form').querySelector('button');
        btn.disabled = true;
        btn.innerText = "Booking...";

        try {
            const res = await fetch(`${API_BASE}/appointment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            document.getElementById('booking-form').classList.add('hidden');
            document.getElementById('booking-success').classList.remove('hidden');
        } catch (e) {
            console.error(e);
            alert("Booking failed. Please try again.");
        } finally {
            btn.disabled = false;
            btn.innerText = "Confirm Booking";
        }
    });

});
