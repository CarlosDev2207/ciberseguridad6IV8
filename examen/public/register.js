// register.js
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formulario-register");
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
      if (p.length < 6) return show("La contraseña debe tener al menos 6 caracteres.", true);
  
      try {
        const res = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: u, password: p })
        });
        const text = await res.text();
        if (!res.ok) return show(text, true);
        show(text);
        setTimeout(() => window.location.href = "/login", 1500);
      } catch {
        show("Error al registrar usuario.", true);
      }
    });
  });