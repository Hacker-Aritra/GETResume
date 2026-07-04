# GETResume
Full-stack AI resume builder — HTML/CSS/JS frontend, PHP + MySQL backend (XAMPP), Python (Flask) AI engine for summaries, bullet rewriting &amp; ATS scoring.


# ResumeForge — AI-Powered Resume Builder

A full-stack resume builder that helps people write, refine, store, and export professional resumes with AI assistance at every step — from summary writing to ATS scoring.

Built as an end-to-end learning/portfolio project demonstrating a classic 3-tier architecture: a vanilla **HTML/CSS/JS** frontend, a **PHP + MySQL** backend (designed for XAMPP), and a **Python (Flask)** microservice for the AI logic.

---

## ✨ Features

- **Guided 6-step builder** — Personal info → Summary → Experience → Education → Skills → Review & export
- **Live resume preview** that updates as you type, with 3 switchable templates (Classic, Modern, Minimal)
- **AI-assisted writing**
  - Generates a professional summary from your role, skills, and experience
  - Rewrites weak achievement lines into strong, quantified bullet points
  - Suggests relevant skills based on your target role
  - Runs an ATS (Applicant Tracking System) friendliness check with a score out of 100 and specific fix-it notes
- **Accounts & persistence** — register/login, resumes saved to MySQL, dashboard to manage all your drafts
- **PDF export** — download your finished resume as a PDF, client-side
- **Fully responsive** — usable on mobile, tablet, and desktop
- **Zero paid API keys required** — the AI engine works out of the box using rule-based NLP heuristics, with a documented path to plug in a real LLM (e.g. Claude) later

---

## 🏗️ Architecture

```
Browser (HTML / CSS / JS)
        │  fetch() with session cookie
        ▼
PHP backend  (Apache via XAMPP)  ──reads/writes──▶  MySQL (XAMPP)
        │  cURL request
        ▼
Python Flask AI microservice (localhost:5000)
```

The browser only ever talks to PHP. PHP proxies AI requests to the Python
service and logs every AI exchange to MySQL for auditing. This keeps a
single authentication/session layer in front of everything.

---

## 🛠️ Tech Stack

| Layer      | Technology                                              |
|------------|----------------------------------------------------------|
| Frontend   | HTML5, CSS3 (custom design system, no framework), vanilla JavaScript |
| Backend    | PHP 8 (PDO, native sessions), JSON REST-style endpoints  |
| Database   | MySQL (via XAMPP)                                        |
| AI Engine  | Python 3, Flask, Flask-CORS                              |
| PDF Export | html2pdf.js (client-side)                                |

---

## 📁 Project Structure

```
resume-builder/
├── frontend/              HTML pages, CSS, and JS
│   ├── index.html         Landing page
│   ├── login.html / register.html
│   ├── dashboard.html     List of saved resumes
│   ├── builder.html       The resume builder
│   ├── css/style.css
│   └── js/                main.js, auth.js, dashboard.js, builder.js
├── backend/               PHP API (runs inside XAMPP)
│   ├── config/            db.php, bootstrap.php
│   ├── api/                register, login, logout, save/get/delete resume, ai_generate
│   └── database.sql       MySQL schema
├── ai-service/            Python Flask AI microservice
│   ├── app.py
│   ├── ai_engine.py
│   └── requirements.txt
└── SETUP.md               Full local setup walkthrough
```

---

## 🚀 Quick Start

Full step-by-step instructions (XAMPP setup, database import, running the
Python service) are in **[SETUP.md](SETUP.md)**. Short version:

```bash
# 1. Copy this repo into your XAMPP htdocs folder, e.g.
#    C:/xampp/htdocs/resume-builder

# 2. Import backend/database.sql via phpMyAdmin

# 3. Start Apache + MySQL from the XAMPP control panel

# 4. Run the AI microservice
cd ai-service
pip install -r requirements.txt
python app.py

# 5. Open the app
# http://localhost/resume-builder/frontend/index.html
```

---

## 🔮 Roadmap Ideas

- [ ] Swap the heuristic AI engine for a real LLM call (hook already in `ai_engine.py`)
- [ ] Add more resume templates
- [ ] Add a "cover letter" tab in the builder UI (endpoint already exists)
- [ ] Add JWT-based auth for a decoupled/mobile frontend
- [ ] Dockerize the three services for one-command startup

---

## 📄 License

This project is open source and available for personal and educational use.
Add a license of your choice (MIT recommended) if you plan to publish it.
