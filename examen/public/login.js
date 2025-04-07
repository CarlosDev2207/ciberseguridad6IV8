// login.js
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formulario-login");
    const alerta = document.getElementById("alerta");
  
    function show(msg, err = false) {
      alerta.textContent = msg;
      alerta.className = err ? "alert error" : "alert";
      setTimeout(() => alerta.textContent = "", 3000);
    }
  
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const u = form.username.value.trim();
      const p = form.password.value.trim();
  
      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: u, password: p })
        });
        const text = await res.text();
        if (!res.ok) return show(text, true);
        show(text);
        setTimeout(() => window.location.href = "/", 1500);
      } catch {
        show("Error al iniciar sesión.", true);
      }
    });
  });