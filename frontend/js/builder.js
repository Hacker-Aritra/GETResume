/* ==========================================================================
   Resume Builder — state, rendering, AI calls, save/load, PDF export
   ========================================================================== */

let resumeId = new URLSearchParams(window.location.search).get("id");
let currentStep = 1;
const TOTAL_STEPS = 6;

let state = {
  title: "Untitled Resume",
  template: "classic",
  personal: { name: "", role: "", email: "", phone: "", location: "", link: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
};

let idCounter = 1;
const uid = () => `item_${idCounter++}_${Date.now()}`;

/* ---------------------------- INIT ---------------------------- */
(async function init() {
  const user = await guardAuth();
  if (!user) return;

  if (resumeId) {
    await loadResume(resumeId);
  } else {
    addExperience();
    addEducation();
  }
  bindStaticEvents();
  renderAll();
})();

async function loadResume(id) {
  const res = await apiRequest(`get_resume.php?id=${id}`);
  if (res.success && res.resume) {
    state = { ...state, ...res.resume.data, template: res.resume.template, title: res.resume.title };
    document.getElementById("templateSelect").value = state.template;
  } else {
    alert(res.message || "Could not load that resume.");
  }
}

/* ---------------------------- STEP NAVIGATION ---------------------------- */
function goToStep(n) {
  currentStep = Math.min(Math.max(n, 1), TOTAL_STEPS);
  document.querySelectorAll(".step-panel").forEach((p) => {
    p.style.display = Number(p.dataset.panel) === currentStep ? "block" : "none";
  });
  document.querySelectorAll(".step-item").forEach((s) => {
    const step = Number(s.dataset.step);
    s.classList.toggle("active", step === currentStep);
    s.classList.toggle("done", step < currentStep);
  });
  document.getElementById("prevStepBtn").style.visibility = currentStep === 1 ? "hidden" : "visible";
  document.getElementById("nextStepBtn").textContent = currentStep === TOTAL_STEPS ? "Done" : "Next →";
}

function bindStaticEvents() {
  document.querySelectorAll(".step-item").forEach((el) => {
    el.addEventListener("click", () => { syncFormToState(); goToStep(Number(el.dataset.step)); renderPreview(); });
  });
  document.getElementById("prevStepBtn").addEventListener("click", () => { syncFormToState(); goToStep(currentStep - 1); renderPreview(); });
  document.getElementById("nextStepBtn").addEventListener("click", () => { syncFormToState(); goToStep(currentStep + 1); renderPreview(); });

  ["p_name", "p_role", "p_email", "p_phone", "p_location", "p_link", "s_summary"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => { syncFormToState(); renderPreview(); });
  });

  document.getElementById("addExperienceBtn").addEventListener("click", () => { addExperience(); renderExperience(); });
  document.getElementById("addEducationBtn").addEventListener("click", () => { addEducation(); renderEducation(); });

  document.getElementById("skillInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault();
      addSkill(e.target.value.trim());
      e.target.value = "";
      renderSkills();
      renderPreview();
    }
  });

  document.getElementById("templateSelect").addEventListener("change", (e) => {
    state.template = e.target.value;
    renderPreview();
  });

  document.getElementById("saveBtn").addEventListener("click", saveResume);
  document.getElementById("genSummaryBtn").addEventListener("click", onGenerateSummary);
  document.getElementById("suggestSkillsBtn").addEventListener("click", onSuggestSkills);
  document.getElementById("checkAtsBtn").addEventListener("click", onCheckAts);
  document.getElementById("exportPdfBtn").addEventListener("click", exportPdf);

  const toggleBtn = document.getElementById("togglePreviewBtn");
  if (window.innerWidth <= 1100) toggleBtn.style.display = "inline-flex";
  toggleBtn.addEventListener("click", () => {
    const shell = document.getElementById("builderShell");
    shell.classList.toggle("show-preview");
    toggleBtn.textContent = shell.classList.contains("show-preview") ? "Edit" : "Preview";
    if (shell.classList.contains("show-preview")) renderPreview();
  });
}

/* ---------------------------- SYNC FORM -> STATE ---------------------------- */
function syncFormToState() {
  state.personal.name = document.getElementById("p_name").value.trim();
  state.personal.role = document.getElementById("p_role").value.trim();
  state.personal.email = document.getElementById("p_email").value.trim();
  state.personal.phone = document.getElementById("p_phone").value.trim();
  state.personal.location = document.getElementById("p_location").value.trim();
  state.personal.link = document.getElementById("p_link").value.trim();
  state.summary = document.getElementById("s_summary").value.trim();
  state.title = state.personal.name ? `${state.personal.name} — ${state.personal.role || "Resume"}` : state.title;

  document.querySelectorAll("[data-exp-id]").forEach((block) => {
    const id = block.dataset.expId;
    const exp = state.experience.find((x) => x.id === id);
    if (!exp) return;
    exp.company = block.querySelector(".exp-company").value.trim();
    exp.role = block.querySelector(".exp-role").value.trim();
    exp.location = block.querySelector(".exp-location").value.trim();
    exp.start = block.querySelector(".exp-start").value.trim();
    exp.end = block.querySelector(".exp-end").value.trim();
    exp.bullets = Array.from(block.querySelectorAll(".exp-bullet")).map((t) => t.value.trim()).filter(Boolean);
  });

  document.querySelectorAll("[data-edu-id]").forEach((block) => {
    const id = block.dataset.eduId;
    const edu = state.education.find((x) => x.id === id);
    if (!edu) return;
    edu.school = block.querySelector(".edu-school").value.trim();
    edu.degree = block.querySelector(".edu-degree").value.trim();
    edu.start = block.querySelector(".edu-start").value.trim();
    edu.end = block.querySelector(".edu-end").value.trim();
  });
}

/* ---------------------------- EXPERIENCE ---------------------------- */
function addExperience() {
  state.experience.push({ id: uid(), company: "", role: "", location: "", start: "", end: "", bullets: [""] });
}

function renderExperience() {
  const list = document.getElementById("experienceList");
  list.innerHTML = state.experience.map((exp) => `
    <div class="repeatable-block" data-exp-id="${exp.id}">
      <button type="button" class="remove-btn" data-remove-exp="${exp.id}">✕</button>
      <div class="form-row">
        <div class="field"><label>Company</label><input class="exp-company" type="text" value="${escapeHtml(exp.company)}" placeholder="Acme Corp"></div>
        <div class="field"><label>Job title</label><input class="exp-role" type="text" value="${escapeHtml(exp.role)}" placeholder="Frontend Developer"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Location</label><input class="exp-location" type="text" value="${escapeHtml(exp.location)}" placeholder="Remote"></div>
        <div class="form-row" style="gap:8px">
          <div class="field"><label>Start</label><input class="exp-start" type="text" value="${escapeHtml(exp.start)}" placeholder="Jan 2023"></div>
          <div class="field"><label>End</label><input class="exp-end" type="text" value="${escapeHtml(exp.end)}" placeholder="Present"></div>
        </div>
      </div>
      <div class="field">
        <label>Achievements</label>
        ${exp.bullets.map((b, i) => `
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <input class="exp-bullet" data-exp-bullet-idx="${i}" type="text" value="${escapeHtml(b)}" placeholder="What did you do, and what was the result?" style="flex:1;padding:10px 12px;border-radius:8px;border:1px solid var(--ink-line);background:var(--ink-900);color:var(--text-hi)">
            <button type="button" class="btn btn-ghost btn-sm" data-improve-bullet="${exp.id}:${i}">✦</button>
          </div>`).join("")}
        <button type="button" class="btn btn-ghost btn-sm" data-add-bullet="${exp.id}">+ Add line</button>
      </div>
    </div>
  `).join("");

  list.querySelectorAll("[data-remove-exp]").forEach((btn) => {
    btn.addEventListener("click", () => {
      syncFormToState();
      state.experience = state.experience.filter((x) => x.id !== btn.dataset.removeExp);
      renderExperience(); renderPreview();
    });
  });
  list.querySelectorAll("[data-add-bullet]").forEach((btn) => {
    btn.addEventListener("click", () => {
      syncFormToState();
      const exp = state.experience.find((x) => x.id === btn.dataset.addBullet);
      exp.bullets.push("");
      renderExperience();
    });
  });
  list.querySelectorAll("[data-improve-bullet]").forEach((btn) => {
    btn.addEventListener("click", () => onImproveBullet(btn));
  });
  list.querySelectorAll(".exp-company, .exp-role, .exp-location, .exp-start, .exp-end, .exp-bullet").forEach((input) => {
    input.addEventListener("input", () => { syncFormToState(); renderPreview(); });
  });
}

/* ---------------------------- EDUCATION ---------------------------- */
function addEducation() {
  state.education.push({ id: uid(), school: "", degree: "", start: "", end: "" });
}

function renderEducation() {
  const list = document.getElementById("educationList");
  list.innerHTML = state.education.map((edu) => `
    <div class="repeatable-block" data-edu-id="${edu.id}">
      <button type="button" class="remove-btn" data-remove-edu="${edu.id}">✕</button>
      <div class="form-row">
        <div class="field"><label>School / University</label><input class="edu-school" type="text" value="${escapeHtml(edu.school)}" placeholder="ABC University"></div>
        <div class="field"><label>Degree</label><input class="edu-degree" type="text" value="${escapeHtml(edu.degree)}" placeholder="B.Tech in Computer Science"></div>
      </div>
      <div class="form-row">
        <div class="field"><label>Start</label><input class="edu-start" type="text" value="${escapeHtml(edu.start)}" placeholder="2019"></div>
        <div class="field"><label>End</label><input class="edu-end" type="text" value="${escapeHtml(edu.end)}" placeholder="2023"></div>
      </div>
    </div>
  `).join("");

  list.querySelectorAll("[data-remove-edu]").forEach((btn) => {
    btn.addEventListener("click", () => {
      syncFormToState();
      state.education = state.education.filter((x) => x.id !== btn.dataset.removeEdu);
      renderEducation(); renderPreview();
    });
  });
  list.querySelectorAll(".edu-school, .edu-degree, .edu-start, .edu-end").forEach((input) => {
    input.addEventListener("input", () => { syncFormToState(); renderPreview(); });
  });
}

/* ---------------------------- SKILLS ---------------------------- */
function addSkill(skill) {
  if (!state.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) state.skills.push(skill);
}

function renderSkills() {
  const wrap = document.getElementById("skillsWrap");
  const input = document.getElementById("skillInput");
  wrap.querySelectorAll(".skill-chip").forEach((c) => c.remove());
  state.skills.forEach((skill) => {
    const chip = document.createElement("span");
    chip.className = "skill-chip";
    chip.innerHTML = `${escapeHtml(skill)} <button type="button" data-remove-skill="${escapeHtml(skill)}">✕</button>`;
    wrap.insertBefore(chip, input);
  });
  wrap.querySelectorAll("[data-remove-skill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.skills = state.skills.filter((s) => s !== btn.dataset.removeSkill);
      renderSkills(); renderPreview();
    });
  });
}

function renderSuggestedSkills(suggestions) {
  const box = document.getElementById("suggestedSkills");
  box.innerHTML = (suggestions || []).map((s) => `<span class="sugg" data-add-suggested="${escapeHtml(s)}">+ ${escapeHtml(s)}</span>`).join("");
  box.querySelectorAll("[data-add-suggested]").forEach((el) => {
    el.addEventListener("click", () => {
      addSkill(el.dataset.addSuggested);
      el.remove();
      renderSkills(); renderPreview();
    });
  });
}

/* ---------------------------- FORM FIELD PREFILL (on load) ---------------------------- */
function renderAll() {
  document.getElementById("p_name").value = state.personal.name;
  document.getElementById("p_role").value = state.personal.role;
  document.getElementById("p_email").value = state.personal.email;
  document.getElementById("p_phone").value = state.personal.phone;
  document.getElementById("p_location").value = state.personal.location;
  document.getElementById("p_link").value = state.personal.link;
  document.getElementById("s_summary").value = state.summary;
  renderExperience();
  renderEducation();
  renderSkills();
  goToStep(1);
  renderPreview();
}

/* ---------------------------- LIVE PREVIEW ---------------------------- */
function renderPreview() {
  const p = state.personal;
  const paper = document.getElementById("paperPreview");
  paper.className = `paper tpl-${state.template}`;

  const contactBits = [p.email, p.phone, p.location, p.link].filter(Boolean).map(escapeHtml).join(" · ");

  const expHtml = state.experience.filter(e => e.company || e.role).map((e) => `
    <div class="entry">
      <div class="entry-head"><span>${escapeHtml(e.role || "Role")} — ${escapeHtml(e.company || "Company")}</span><span>${escapeHtml(e.start)} – ${escapeHtml(e.end)}</span></div>
      <div class="entry-sub">${escapeHtml(e.location)}</div>
      <ul>${e.bullets.filter(Boolean).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
    </div>`).join("");

  const eduHtml = state.education.filter(e => e.school || e.degree).map((e) => `
    <div class="entry">
      <div class="entry-head"><span>${escapeHtml(e.degree || "Degree")}</span><span>${escapeHtml(e.start)} – ${escapeHtml(e.end)}</span></div>
      <div class="entry-sub">${escapeHtml(e.school)}</div>
    </div>`).join("");

  const skillsHtml = state.skills.length
    ? `<div class="skills-list">${state.skills.map((s) => `<span>${escapeHtml(s)}</span>`).join("")}</div>` : "";

  paper.innerHTML = `
    <h1>${escapeHtml(p.name) || "Your Name"}</h1>
    <div class="p-role">${escapeHtml(p.role) || "Target role"}</div>
    <div class="p-contact">${contactBits}</div>
    ${state.summary ? `<section><h3>Summary</h3><p class="p-summary">${escapeHtml(state.summary)}</p></section>` : ""}
    ${expHtml ? `<section><h3>Experience</h3>${expHtml}</section>` : ""}
    ${eduHtml ? `<section><h3>Education</h3>${eduHtml}</section>` : ""}
    ${skillsHtml ? `<section><h3>Skills</h3>${skillsHtml}</section>` : ""}
  `;
}

/* ---------------------------- AI ACTIONS ---------------------------- */
async function callAi(type, payload) {
  const res = await apiRequest("ai_generate.php", { method: "POST", body: { type, payload, resume_id: resumeId ? Number(resumeId) : null } });
  if (!res.success) {
    alert(res.message || "AI request failed.");
    return null;
  }
  return res.result;
}

async function onGenerateSummary(e) {
  syncFormToState();
  const btn = e.target;
  btn.classList.add("loading"); btn.textContent = "Generating...";
  const result = await callAi("summary", {
    name: state.personal.name,
    target_role: state.personal.role,
    years_experience: guessYearsExperience(),
    skills: state.skills,
  });
  btn.classList.remove("loading"); btn.textContent = "✦ Generate with AI";
  if (result) {
    state.summary = result.summary;
    document.getElementById("s_summary").value = result.summary;
    renderPreview();
  }
}

async function onImproveBullet(btn) {
  syncFormToState();
  const [expId, idx] = btn.dataset.improveBullet.split(":");
  const exp = state.experience.find((x) => x.id === expId);
  const original = exp.bullets[idx];
  if (!original) return alert("Type a rough line first, then let AI sharpen it.");

  btn.disabled = true; btn.textContent = "…";
  const result = await callAi("bullet", { text: original });
  btn.disabled = false; btn.textContent = "✦";
  if (result) {
    exp.bullets[idx] = result.bullet;
    renderExperience();
    renderPreview();
  }
}

async function onSuggestSkills(e) {
  syncFormToState();
  const btn = e.target;
  btn.classList.add("loading"); btn.textContent = "Thinking...";
  const result = await callAi("skills", { target_role: state.personal.role, existing_skills: state.skills });
  btn.classList.remove("loading"); btn.textContent = "✦ Suggest skills with AI";
  if (result) renderSuggestedSkills(result.suggested_skills);
}

async function onCheckAts() {
  syncFormToState();
  const sectionsPresent = [];
  if (state.summary) sectionsPresent.push("summary");
  if (state.experience.some(e => e.company)) sectionsPresent.push("experience");
  if (state.education.some(e => e.school)) sectionsPresent.push("education");
  if (state.skills.length) sectionsPresent.push("skills");

  const fullText = [
    state.summary,
    ...state.experience.flatMap(e => e.bullets),
    state.skills.join(", "),
  ].join(" ");

  const result = await callAi("ats_score", { full_text: fullText, sections_present: sectionsPresent });
  if (result) {
    state.atsScore = result.ats_score;
    document.getElementById("atsBarFill").style.width = `${result.ats_score}%`;
    document.getElementById("atsScoreLabel").textContent = `${result.ats_score}/100`;
    document.getElementById("atsNotes").innerHTML = `
      <div class="card" style="padding:18px">
        <h3 style="font-size:1rem">Score: ${result.ats_score}/100</h3>
        <ul style="margin:8px 0 0 18px;padding:0;color:var(--text-lo);font-size:.88rem">
          ${result.notes.map((n) => `<li style="margin-bottom:6px">${escapeHtml(n)}</li>`).join("")}
        </ul>
      </div>`;
  }
}

function guessYearsExperience() {
  const starts = state.experience.map((e) => parseInt(e.start)).filter((n) => !isNaN(n));
  if (!starts.length) return "";
  const earliest = Math.min(...starts);
  const years = new Date().getFullYear() - earliest;
  return years > 0 ? years : "";
}

/* ---------------------------- SAVE ---------------------------- */
async function saveResume() {
  syncFormToState();
  const statusEl = document.getElementById("saveStatus");
  statusEl.textContent = "Saving...";

  const payload = {
    id: resumeId ? Number(resumeId) : null,
    title: state.title,
    template: state.template,
    ats_score: state.atsScore ?? null,
    data: {
      personal: state.personal,
      summary: state.summary,
      experience: state.experience,
      education: state.education,
      skills: state.skills,
    },
  };

  const res = await apiRequest("save_resume.php", { method: "POST", body: payload });
  if (res.success) {
    resumeId = res.id;
    const url = new URL(window.location);
    url.searchParams.set("id", resumeId);
    window.history.replaceState({}, "", url);
    statusEl.textContent = "Saved ✓";
    setTimeout(() => (statusEl.textContent = ""), 2000);
  } else {
    statusEl.textContent = "";
    alert(res.message || "Could not save resume.");
  }
}

/* ---------------------------- EXPORT PDF ---------------------------- */
function exportPdf() {
  const paper = document.getElementById("paperPreview");
  const filename = `${(state.personal.name || "resume").replace(/\s+/g, "_")}_resume.pdf`;
  html2pdf().set({
    margin: 0,
    filename,
    html2canvas: { scale: 2 },
    jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
  }).from(paper).save();
}
