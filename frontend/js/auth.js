const formMsg = document.getElementById("formMsg");
const submitBtn = document.getElementById("submitBtn");

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";

    const payload = {
      full_name: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
    };

    const res = await apiRequest("register.php", { method: "POST", body: payload });

    if (res.success) {
      showMsg(formMsg, "Account created! Redirecting...", "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 700);
    } else {
      showMsg(formMsg, res.message || "Registration failed.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Create account";
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    const payload = {
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
    };

    const res = await apiRequest("login.php", { method: "POST", body: payload });

    if (res.success) {
      showMsg(formMsg, "Welcome back! Redirecting...", "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 500);
    } else {
      showMsg(formMsg, res.message || "Login failed.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Log in";
    }
  });
}
