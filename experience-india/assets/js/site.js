// Experience India — small progressive enhancements. The site works fully without JS.
(function () {
  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector(".label").textContent = open ? "Close" : "Menu";
    });
  }

  // Scroll reveal (opt-in via .reveal)
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  // Analytics helper: sends a named event to GA4 or Plausible when either is configured.
  function track(name, props) {
    try {
      if (window.gtag) window.gtag("event", name, props || {});
      if (window.plausible) window.plausible(name, { props: props || {} });
    } catch (_) {}
  }
  window.eiTrack = track;

  // CTA click tracking: any element with data-track="event_name"
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-track]");
    if (el) track(el.getAttribute("data-track"), { path: location.pathname });
  });

  // Remember where the visitor came from (utm / referrer) and attach it to lead forms.
  try {
    var params = new URLSearchParams(location.search);
    var src = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(function (k) {
      if (params.get(k)) src[k] = params.get(k);
    });
    if (Object.keys(src).length) sessionStorage.setItem("ei_src", JSON.stringify(src));
    var saved = JSON.parse(sessionStorage.getItem("ei_src") || "{}");
    document.querySelectorAll("form [name=source]").forEach(function (input) {
      var parts = [];
      for (var k in saved) parts.push(k + "=" + saved[k]);
      if (document.referrer) parts.push("ref=" + document.referrer);
      input.value = parts.join(" ") || "direct";
    });
  } catch (_) {}

  // Forms: if the form posts to an external endpoint (Formspree, Apps Script, ...),
  // submit with fetch and show the inline success panel. Netlify Forms (empty action)
  // submit natively and land on /thanks.
  document.querySelectorAll("form[data-lead]").forEach(function (form) {
    var action = form.getAttribute("action") || "";
    if (!/^https?:/.test(action)) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var btn = form.querySelector("[type=submit]");
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = "Sending…";
      fetch(action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("bad status"); return r; })
        .then(function () {
          track("lead_submitted", { form: form.getAttribute("data-lead") });
          var ok = document.getElementById(form.getAttribute("data-success"));
          form.style.display = "none";
          if (ok) { ok.style.display = "block"; ok.scrollIntoView({ behavior: "smooth", block: "center" }); }
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = label;
          alert("Sorry — that didn't send. Please try again or email us directly.");
        });
    });
  });
})();
