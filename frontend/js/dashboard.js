const resumeGrid = document.getElementById("resumeGrid");
const userNameEl = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");

(async function init() {
  const user = await guardAuth();
  if (!user) return;
  userNameEl.textContent = user.full_name;
  await loadResumes();
})();

logoutBtn.addEventListener("click", async () => {
  await apiRequest("logout.php", { method: "POST" });
  window.location.href = "login.html";
});

async function loadResumes() {
  resumeGrid.innerHTML = `<p style="grid-column:1/-1;color:var(--text-lo)">Loading your resumes...</p>`;
  const res = await apiRequest("get_resumes.php");

  if (!res.success) {
    resumeGrid.innerHTML = `<p style="grid-column:1/-1;color:var(--danger)">${escapeHtml(res.message || "Could not load resumes.")}</p>`;
    return;
  }

  const resumes = res.resumes || [];
  if (resumes.length === 0) {
    resumeGrid.innerHTML = `
      <div class="empty-state">
        <h3>No resumes yet</h3>
        <p>Create your first AI-assisted resume in a couple of minutes.</p>
        <a href="builder.html" class="btn btn-primary">+ New resume</a>
      </div>`;
    return;
  }

  resumeGrid.innerHTML = resumes.map(renderCard).join("");

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!confirm("Delete this resume? This can't be undone.")) return;
      const id = btn.getAttribute("data-delete");
      const res = await apiRequest("delete_resume.php", { method: "POST", body: { id: Number(id) } });
      if (res.success) loadResumes();
      else alert(res.message || "Could not delete resume.");
    });
  });
}

function renderCard(r) {
  const ats = r.ats_score != null ? r.ats_score : null;
  return `
    <div class="resume-card">
      <div class="thumb">
        <div class="rl hd"></div>
        <div class="rl" style="width:80%"></div>
        <div class="rl" style="width:60%"></div>
        <div class="rl" style="width:70%"></div>
      </div>
      <div class="body">
        <h4>${escapeHtml(r.title)}</h4>
        <div class="meta">
          <span>${escapeHtml(r.template)}</span>
          <span>Updated ${formatDate(r.updated_at)}</span>
        </div>
        ${ats !== null ? `<span class="ats-pill">● ATS ${ats}/100</span>` : ""}
        <div class="actions">
          <a href="builder.html?id=${r.id}" class="btn btn-dark btn-sm">Edit</a>
          <button class="btn btn-danger btn-sm" data-delete="${r.id}">Delete</button>
        </div>
      </div>
    </div>`;
}
