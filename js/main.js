/* =============================================================
   S.SENS HOMES — App logic
   ============================================================= */
(function () {
  "use strict";

  const ICONS = {
    guest: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 12a4 4 0 100-8 4 4 0 000 8z"/><path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5"/></svg>',
    bed: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 18V9a2 2 0 012-2h14a2 2 0 012 2v9"/><path d="M3 14h18M7 10h5"/><path d="M3 18v2M21 18v2"/></svg>',
    bath: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h16v3a4 4 0 01-4 4H8a4 4 0 01-4-4v-3z"/><path d="M6 12V6a2 2 0 012-2c1 0 1.6.5 2 1"/><path d="M9 5.5h2.5"/><path d="M7 19l-1 2M18 19l1 2"/></svg>',
    star: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z"/></svg>',
    heart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.5-4.7-10-9.3C.5 8.5 2 5 5.5 5 8 5 9.5 6.8 12 9c2.5-2.2 4-4 6.5-4C22 5 23.5 8.5 22 11.7 19.5 16.3 12 21 12 21z"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    check: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 12l5 5 11-11"/></svg>',
    warn: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v5M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>',
    child: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="6" r="3"/><path d="M12 9v6M8 12h8M9 21l3-4 3 4"/></svg>'
  };
  const SOCIAL = {
    fb: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M13 22v-8h3l.5-3.5H13V8.3c0-1 .3-1.7 1.8-1.7H17V3.5c-.9-.1-1.8-.2-2.7-.2C11.6 3.3 10 5 10 8v2.5H7V14h3v8h3z"/></svg>',
    ig: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    zalo: '<span style="font-weight:800;font-size:12px;letter-spacing:-.04em">Zalo</span>'
  };

  const CONTACT = {
    email: "hello@ssenshomes.com",
    phone: "(+84) 83 209 1997",
    address: "52 Nguyen Sieu Str, Hoan Kiem, Ha Noi, Viet Nam"
  };

  /* ---------------- Header / Footer injection ---------------- */
  function brand() {
    return '<a href="index.html" class="brand"><b>S.</b><span>Sens</span><small>Homes</small></a>';
  }
  const NAV = [
    { href: "index.html", label: "Căn hộ" },
    { href: "about.html", label: "Về chúng tôi" },
    { href: "projects.html", label: "Dự án" },
    { href: "contact.html", label: "Liên hệ" },
    { href: "account.html", label: "Chuyến ở của tôi" }
  ];
  function injectHeader() {
    const host = document.querySelector("[data-header]");
    if (!host) return;
    const page = host.getAttribute("data-header") || "";
    host.innerHTML = `
      <header class="site-header">
        <div class="wrap nav">
          ${brand()}
          <nav class="nav-links">
            ${NAV.map(n => `<a href="${n.href}" class="${n.href === page ? "active" : ""}">${n.label}</a>`).join("")}
          </nav>
          <div class="nav-right">
            <button class="btn btn-tan" data-open-booking>Liên hệ ngay</button>
            <button class="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
          </div>
        </div>
      </header>`;
    const header = host.querySelector(".site-header");
    host.querySelector(".nav-toggle").addEventListener("click", () => header.classList.toggle("menu-open"));
    window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 12), { passive: true });
  }
  function injectFooter() {
    const host = document.querySelector("[data-footer]");
    if (!host) return;
    host.innerHTML = `
      <footer class="site-footer">
        <div class="wrap">
          <div class="footer-grid">
            <div class="footer-about">
              ${brand()}
              <p id="footer-description">Mỗi không gian được đội ngũ S.Sens chăm chút để mang đến trải nghiệm lưu trú thư thái trên khắp Việt Nam.</p>
              <div class="socials">
                <a id="footer-facebook" href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook">${SOCIAL.fb}</a>
                <a id="footer-instagram" href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram">${SOCIAL.ig}</a>
                <a id="footer-zalo" href="https://zalo.me/84832091997" target="_blank" rel="noopener" aria-label="Zalo">${SOCIAL.zalo}</a>
              </div>
            </div>
            <div class="footer-col">
              <h5>Khám phá</h5>
              ${NAV.map(n => `<a href="${n.href}">${n.label}</a>`).join("")}
            </div>
            <div class="footer-col">
              <h5>Điểm đến</h5>
              <div id="footer-destinations"><a href="index.html">Hà Nội</a><a href="index.html">TP. Hồ Chí Minh</a><a href="index.html">Tam Đảo</a><a href="index.html">Cam Ranh</a><a href="index.html">Hồ Tràm</a></div>
            </div>
            <div class="footer-col">
              <h5>Liên hệ</h5>
              <a data-contact-email href="mailto:${CONTACT.email}">${CONTACT.email}</a>
              <a data-contact-phone href="tel:+84832091997">${CONTACT.phone}</a>
              <p>${CONTACT.address}</p>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} S.Sens Homes. Bảo lưu mọi quyền.</span>
            <span><a href="terms.html">Điều khoản sử dụng</a> · <a href="privacy.html">Chính sách bảo mật</a></span>
          </div>
        </div>
      </footer>`;
  }

  function injectCookieConsent() {
    if (localStorage.getItem("ssens_cookie_consent")) return;
    const banner = document.createElement("aside");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Thông báo quyền riêng tư");
    banner.innerHTML = `<div><strong id="cookie-title">Quyền riêng tư của bạn</strong><p id="cookie-text">S.Sens dùng cookie cần thiết để website hoạt động và dùng thông tin bạn gửi để phản hồi yêu cầu lưu trú. Xem <a href="privacy.html">Chính sách bảo mật</a>.</p></div><div class="cookie-actions"><button class="btn btn-ghost" data-cookie="essential">Chỉ cookie cần thiết</button><button class="btn btn-primary" data-cookie="accepted">Đồng ý</button></div>`;
    document.body.appendChild(banner);
    banner.querySelectorAll("[data-cookie]").forEach((button) => button.addEventListener("click", () => {
      localStorage.setItem("ssens_cookie_consent", button.dataset.cookie);
      banner.remove();
    }));
  }

  async function applySiteContent() {
    try {
      const response = await fetch("/api/content");
      if (!response.ok) return;
      const { content } = await response.json();
      const hero = content.hero || {};
      [["hero-eyebrow", hero.eyebrow], ["hero-title", hero.title], ["hero-text", hero.text]].forEach(([key, value]) => { if (value) document.querySelectorAll(`[data-content="${key}"]`).forEach(el => el.textContent = value); });
      if (content.contact?.email) { CONTACT.email = content.contact.email; document.querySelectorAll("[data-contact-email]").forEach(el => { el.textContent = CONTACT.email; el.href = "mailto:" + CONTACT.email; }); }
      if (content.contact?.phone) document.querySelectorAll("[data-contact-phone]").forEach(el => { el.textContent = content.contact.phone; el.href = "tel:" + content.contact.phone.replace(/[^+\d]/g, ""); });
      if (Array.isArray(content.destinations) && content.destinations.length) { const list = document.getElementById("footer-destinations"); if (list) list.innerHTML = content.destinations.map(item => `<a href="index.html">${item}</a>`).join(""); }
      if (content.pages?.["footer.description"]) document.getElementById("footer-description")?.replaceChildren(content.pages["footer.description"]);
      [["footer.facebook","footer-facebook"],["footer.instagram","footer-instagram"],["footer.zalo","footer-zalo"]].forEach(([key,id]) => { if (content.pages?.[key]) document.getElementById(id)?.setAttribute("href", content.pages[key]); });
      const menu = [["global.navHomes","index.html"],["global.navAbout","about.html"],["global.navProjects","projects.html"],["global.navContact","contact.html"],["global.navAccount","account.html"]];
      menu.forEach(([key, href]) => { if (content.pages?.[key]) document.querySelectorAll(`.nav-links a[href="${href}"], .footer-col:nth-of-type(2) a[href="${href}"]`).forEach(link => { link.textContent = content.pages[key]; }); });
      if (content.pages?.["global.headerCta"]) document.querySelector(".nav-right [data-open-booking]")?.replaceChildren(content.pages["global.headerCta"]);
      if (content.pages?.["global.cookieTitle"]) document.getElementById("cookie-title")?.replaceChildren(content.pages["global.cookieTitle"]);
      if (content.pages?.["global.cookieText"]) document.getElementById("cookie-text")?.replaceChildren(content.pages["global.cookieText"]);
      if (content.pages?.["global.cookieEssential"]) document.querySelector('[data-cookie="essential"]')?.replaceChildren(content.pages["global.cookieEssential"]);
      if (content.pages?.["global.cookieAccepted"]) document.querySelector('[data-cookie="accepted"]')?.replaceChildren(content.pages["global.cookieAccepted"]);
      [["global.footerExplore", ".footer-col:nth-of-type(2) h5"],["global.footerDestinations", ".footer-col:nth-of-type(3) h5"],["global.footerContact", ".footer-col:nth-of-type(4) h5"]].forEach(([key, selector]) => { if (content.pages?.[key]) document.querySelector(selector)?.replaceChildren(content.pages[key]); });
      if (content.seo?.homeTitle && location.pathname.endsWith("index.html")) document.title = content.seo.homeTitle;
      if (content.seo?.homeDescription && location.pathname.endsWith("index.html")) document.querySelector('meta[name="description"]')?.setAttribute("content", content.seo.homeDescription);
      const page = location.pathname.split("/").pop() || "index.html";
      const selectors = {
        "index.html": { "home.listingTitle":"#listing .section-head h2", "home.listingText":"#listing .section-head p", "home.whyTitle":".split h2", "home.whyText":".split h2 + p", "home.stepsTitle":"#home-steps-title", "home.faqTitle":"#faq h2", "home.faqText":"#faq .section-head p", "home.ctaTitle":".cta-band h2", "home.ctaText":".cta-band p", "home.heroExploreButton":"#home-hero-explore-button", "home.heroBookingButton":"#home-hero-booking-button", "home.ctaButton":"#home-cta-button" },
        "about.html": { "about.heroTitle":".page-hero h1", "about.heroText":".page-hero p", "about.storyTitle":".split h2", "about.storyText":".split p", "about.valueTitle":".section-head h2", "about.ctaTitle":".cta-band h2", "about.ctaText":"#about-cta-text", "about.ctaExploreButton":"#about-cta-explore-button", "about.ctaBookingButton":"#about-cta-booking-button", "about.stats1":"#about-stat-1", "about.stats2":"#about-stat-2", "about.stats3":"#about-stat-3", "about.stats4":"#about-stat-4" },
        "projects.html": { "projects.heroTitle":".page-hero h1", "projects.heroText":".page-hero p", "projects.introTitle":".section-head h2", "projects.introText":".section-head p", "projects.processTitle":".split h2", "projects.processText":".split h2 + p", "projects.ctaEyebrow":"#projects-cta-eyebrow", "projects.ctaTitle":".cta-band h2", "projects.ctaText":".cta-band p", "projects.ctaButton":".cta-band .btn" },
        "contact.html": { "contact.heroTitle":".page-hero h1", "contact.heroText":".page-hero p", "contact.infoTitle":".contact-info h2", "contact.officeAddress":".ci-item:nth-of-type(3) p", "contact.formTitle":".form-card h3", "contact.submitButton":"#contact-form button[type=submit]" },
        "account.html": { "account.heroTitle":".account-hero h1", "account.heroText":".account-hero h1 + p", "account.authTitle":".auth-copy h2", "account.authText":".auth-copy h2 + p", "account.loginTab":"[data-auth-tab=login]", "account.registerTab":"[data-auth-tab=register]", "account.loginButton":"#login-form button[type=submit]", "account.registerButton":"#register-form button[type=submit]", "account.staysTitle":".booking-list-head h2", "account.staysText":".booking-list-head p", "account.findStay":".booking-list-head .btn" },
        "property.html": { "property.ctaTitle":".cta-band h2", "property.ctaText":".cta-band p", "property.ctaButton":".cta-band .btn" },
        "terms.html": { "terms.eyebrow":".detail-section .eyebrow", "terms.title":"h1", "terms.intro":"h1 + p", "terms.requestTitle":"h3:nth-of-type(1)", "terms.request":"h3:nth-of-type(1) + p", "terms.paymentTitle":"h3:nth-of-type(2)", "terms.payment":"h3:nth-of-type(2) + p", "terms.contactTitle":"h3:nth-of-type(3)", "terms.contactText":"h3:nth-of-type(3) + p" },
        "privacy.html": { "privacy.eyebrow":".detail-section .eyebrow", "privacy.title":"h1", "privacy.intro":"h1 + p", "privacy.purposeTitle":"h3:nth-of-type(1)", "privacy.purpose":"h3:nth-of-type(1) + p", "privacy.protectionTitle":"h3:nth-of-type(2)", "privacy.protection":"h3:nth-of-type(2) + p", "privacy.rightsTitle":"h3:nth-of-type(3)", "privacy.rightsText":"h3:nth-of-type(3) + p" }
      };
      Object.entries(selectors[page] || {}).forEach(([key, selector]) => { const value = content.pages?.[key]; const element = document.querySelector(selector); if (value && element) element.textContent = value; });
      if (page === "about.html") [1,2,3,4].forEach(index => { const value = content.pages?.["about.stats" + index]; const element = document.getElementById("about-stat-" + index); if (value && element) { const [number, label] = value.split(" — "); element.innerHTML = `<b>${number}</b><span>${label || ""}</span>`; } });
      if (page === "about.html") { const ids = { "about.storyText2":"about-story-text-2", "about.value1Title":"about-value-1-title", "about.value1Text":"about-value-1-text", "about.value2Title":"about-value-2-title", "about.value2Text":"about-value-2-text", "about.value3Title":"about-value-3-title", "about.value3Text":"about-value-3-text" }; Object.entries(ids).forEach(([key,id]) => { if (content.pages?.[key]) document.getElementById(id)?.replaceChildren(content.pages[key]); }); }
      if (page === "projects.html") { const ids = { "projects.step1Title":"project-step-1-title", "projects.step1Text":"project-step-1-text", "projects.step2Title":"project-step-2-title", "projects.step2Text":"project-step-2-text", "projects.step3Title":"project-step-3-title", "projects.step3Text":"project-step-3-text" }; Object.entries(ids).forEach(([key,id]) => { if (content.pages?.[key]) document.getElementById(id)?.replaceChildren(content.pages[key]); }); }
      if (page === "index.html") { [1,2,3,4].forEach(index => { const value = content.pages?.["home.stat" + index]; const element = document.getElementById("home-stat-" + index); if (value && element) { const [number, label] = value.split(" — "); element.innerHTML = `<b>${number}</b><span>${label || ""}</span>`; } }); const ids = { "home.value1Title":"home-value-1-title", "home.value1Text":"home-value-1-text", "home.value2Title":"home-value-2-title", "home.value2Text":"home-value-2-text", "home.value3Title":"home-value-3-title", "home.value3Text":"home-value-3-text", "home.step1Title":"home-step-1-title", "home.step1Text":"home-step-1-text", "home.step2Title":"home-step-2-title", "home.step2Text":"home-step-2-text", "home.step3Title":"home-step-3-title", "home.step3Text":"home-step-3-text" }; Object.entries(ids).forEach(([key,id]) => { if (content.pages?.[key]) document.getElementById(id)?.replaceChildren(content.pages[key]); }); }
      if (page === "contact.html" && content.pages?.["contact.mapQuery"]) { const map = document.querySelector(".map-embed iframe"); if (map) map.src = "https://www.google.com/maps?q=" + encodeURIComponent(content.pages["contact.mapQuery"]) + "&output=embed"; }
      const images = {
        "index.html": { "home.heroImage": ".hero-bg img", "home.whyImage": ".split-media img" },
        "about.html": { "about.storyImage": ".split-media img" },
        "projects.html": { "projects.processImage": ".split-media img" }
      };
      Object.entries(images[page] || {}).forEach(([key, selector]) => { const value = content.pages?.[key]; const image = document.querySelector(selector); if (value && image) image.src = value; });
      const heroImage = content.pages?.[page === "about.html" ? "about.heroImage" : page === "projects.html" ? "projects.heroImage" : page === "contact.html" ? "contact.heroImage" : ""];
      if (heroImage && page !== "index.html") document.querySelector(".page-hero")?.style.setProperty("--img", `url("${heroImage.replace(/"/g, "")}")`);
      if (Array.isArray(content.faq) && content.faq.length) { const list = document.getElementById("faq-list"); if (list) list.innerHTML = content.faq.map(item => `<details><summary>${item.q}</summary><p>${item.a}</p></details>`).join(""); }
      if (Array.isArray(content.testimonials) && content.testimonials.length) { const list = document.getElementById("testimonials-list"); if (list) { list.classList.toggle("is-scrollable", content.testimonials.length > 3); list.innerHTML = content.testimonials.map(item => `<div class="quote reveal in"><div class="stars">${"★".repeat(item.rating || 5)}</div><p>“${item.quote}”</p><div class="who">${item.image ? `<img src="${item.image}" alt="${item.name}">` : ""}<div><b>${item.name}</b><span>${item.place}</span></div></div></div>`).join(""); } }
    } catch (_) { /* Website vẫn dùng nội dung mặc định nếu server chưa chạy. */ }
  }

  /* ---------------- Booking Modal ---------------- */
  function injectModal() {
    if (document.getElementById("booking-modal")) return;
    const dest = (window.SSENS_BOOKING_DESTINATIONS || []);
    const el = document.createElement("div");
    el.className = "modal";
    el.id = "booking-modal";
    el.innerHTML = `
      <div class="modal-overlay" data-close-booking></div>
      <div class="modal-panel" role="dialog" aria-modal="true" aria-label="Book your stay">
        <div class="modal-head">
          <button class="modal-close" data-close-booking aria-label="Close">${ICONS.close}</button>
          <div class="eyebrow">Yêu cầu lưu trú</div>
          <h3>Cho chúng tôi biết kế hoạch của bạn</h3>
          <p>Chọn ngày ở và căn mong muốn. Chúng tôi sẽ xác nhận tình trạng căn và báo giá cuối cùng trong 15 phút, từ 8h đến 22h hằng ngày.</p>
        </div>
        <div class="modal-body">
          <form id="booking-form" novalidate>
            <div class="field">
              <label>Họ và tên</label>
              <input name="name" type="text" placeholder="Tên của bạn" required />
              <span class="err">Vui lòng nhập họ tên.</span>
            </div>
            <div class="row-2">
              <div class="field">
                <label>Email</label>
                <input name="email" type="email" placeholder="you@email.com" required />
                <span class="err">Vui lòng nhập email hợp lệ.</span>
              </div>
              <div class="field">
                <label>Số điện thoại</label>
                <input name="phone" type="tel" placeholder="+84 ..." required />
                <span class="err">Vui lòng nhập số điện thoại hợp lệ.</span>
              </div>
            </div>
            <div class="field">
              <label>Điểm đến</label>
              <select name="destination" required>
                <option value="">Chọn điểm đến</option>
                ${dest.map(d => `<option>${d}</option>`).join("")}
              </select>
              <span class="err">Vui lòng chọn điểm đến.</span>
            </div>
            <div class="field">
              <label>Hình thức thuê</label>
              <select name="stayType" required>
                <option value="short">Ngắn hạn (theo đêm)</option>
                <option value="long">Dài hạn (theo tháng)</option>
              </select>
            </div>
            <div class="row-2">
              <div class="field">
                <label>Ngày nhận phòng</label>
                <input name="checkin" type="date" required />
                <span class="err">Vui lòng chọn ngày.</span>
              </div>
              <div class="field">
                <label>Ngày trả phòng</label>
                <input name="checkout" type="date" required />
                <span class="err">Ngày trả phòng phải sau ngày nhận phòng.</span>
              </div>
            </div>
            <div class="row-2">
              <div class="field">
                <label>Người lớn</label>
                <div class="stepper" data-stepper="adults" data-min="1" data-max="20">
                  <span class="lbl">${ICONS.guest} Người lớn</span>
                  <span class="ctrl"><button type="button" data-dec>−</button><b>1</b><button type="button" data-inc>+</button></span>
                </div>
                <input type="hidden" name="adults" value="1" />
              </div>
              <div class="field">
                <label>Trẻ em</label>
                <div class="stepper" data-stepper="children" data-min="0" data-max="20">
                  <span class="lbl">${ICONS.child} Trẻ em</span>
                  <span class="ctrl"><button type="button" data-dec>−</button><b>0</b><button type="button" data-inc>+</button></span>
                </div>
                <input type="hidden" name="children" value="0" />
              </div>
            </div>
            <button class="btn btn-primary btn-block" type="submit" style="margin-top:8px">Gửi yêu cầu</button>
            <div class="quick-contact"><a class="btn btn-zalo" href="https://zalo.me/84832091997" target="_blank" rel="noopener">Nhắn Zalo</a><a class="btn btn-ghost" href="tel:+84832091997">Gọi ngay</a></div>
          </form>
          <div class="modal-result ok" data-result-ok>
            <div class="icon">${ICONS.check}</div>
            <h3>Cảm ơn bạn đã gửi yêu cầu!</h3>
            <p>Đội ngũ S.Sens sẽ sớm liên hệ để xác nhận tình trạng căn và báo giá cuối cùng.</p>
            <button class="btn btn-ghost" data-close-booking style="margin-top:18px">Đóng</button>
          </div>
          <div class="modal-result fail" data-result-fail>
            <div class="icon">${ICONS.warn}</div>
            <h3>Có lỗi xảy ra</h3>
            <p>Chúng tôi chưa thể gửi yêu cầu lúc này. Vui lòng thử lại hoặc gửi email trực tiếp.</p>
            <button class="btn btn-ghost" data-retry style="margin-top:18px">Thử lại</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);

    const form = el.querySelector("#booking-form");
    const okBox = el.querySelector("[data-result-ok]");
    const failBox = el.querySelector("[data-result-fail]");

    // steppers
    el.querySelectorAll("[data-stepper]").forEach(st => {
      const min = +st.dataset.min, max = +st.dataset.max;
      const out = st.querySelector("b");
      const hidden = st.parentElement.querySelector("input[type=hidden]");
      const dec = st.querySelector("[data-dec]"), inc = st.querySelector("[data-inc]");
      const sync = () => {
        const v = +out.textContent;
        dec.disabled = v <= min; inc.disabled = v >= max; hidden.value = v;
      };
      dec.addEventListener("click", () => { out.textContent = Math.max(min, +out.textContent - 1); sync(); });
      inc.addEventListener("click", () => { out.textContent = Math.min(max, +out.textContent + 1); sync(); });
      sync();
    });

    // date minimums
    const today = new Date().toISOString().split("T")[0];
    const ci = form.elements.checkin, co = form.elements.checkout;
    ci.min = today; co.min = today;
    ci.addEventListener("change", () => { co.min = ci.value || today; });

    function setInvalid(input, bad) {
      input.closest(".field").classList.toggle("invalid", bad);
    }
    function validate() {
      let ok = true;
      const F = form.elements;
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRe = /^[+()\d][\d\s().-]{6,}$/;
      const checks = [
        [F.name, F.name.value.trim().length >= 2],
        [F.email, emailRe.test(F.email.value.trim())],
        [F.phone, phoneRe.test(F.phone.value.trim())],
        [F.destination, !!F.destination.value],
        [F.checkin, !!F.checkin.value],
        [F.checkout, !!F.checkout.value && F.checkout.value > F.checkin.value]
      ];
      checks.forEach(([input, good]) => { setInvalid(input, !good); if (!good) ok = false; });
      return ok;
    }

    form.addEventListener("submit", e => {
      e.preventDefault();
      if (!validate()) return;
      const F = form.elements;
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = "Sending...";
      submitBtn.disabled = true;

      const BK = window.SSENS && window.SSENS.Booking;
      const payload = {
        property: F.destination.value ? (F.destination.value + " — " + (F.stayType.value === "long" ? "long stay" : "short stay") + " enquiry") : "General enquiry",
        checkin: F.checkin.value,
        checkout: F.checkout.value,
        nights: BK ? BK.nights(new Date(F.checkin.value), new Date(F.checkout.value)) : "",
        guests: (+F.adults.value) + (+F.children.value),
        name: F.name.value.trim(),
        email: F.email.value.trim(),
        phone: F.phone.value.trim(),
        stayType: F.stayType.value,
        channel: "website"
      };
      const finish = () => { submitBtn.textContent = "Gửi yêu cầu"; submitBtn.disabled = false; };
      const done = (reference) => { form.style.display = "none"; okBox.querySelector("p").innerHTML = "Chúng tôi đã ghi nhận yêu cầu <strong>" + reference + "</strong>. Đội ngũ S.Sens phản hồi trong 15 phút (8h–22h)."; okBox.classList.add("show"); finish(); };
      const fail = () => { form.style.display = "none"; failBox.classList.add("show"); finish(); };

      fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(response => response.json().then(data => { if (!response.ok) throw new Error(data.error || "Chưa thể gửi yêu cầu."); return data; }))
        .then(data => done(data.lead.reference)).catch(fail);
    });

    el.querySelector("[data-retry]").addEventListener("click", () => {
      failBox.classList.remove("show");
      form.style.display = "block";
    });

    // reset when closed
    el.addEventListener("ss:reset", () => {
      form.reset();
      form.style.display = "block";
      okBox.classList.remove("show");
      failBox.classList.remove("show");
      el.querySelectorAll(".invalid").forEach(f => f.classList.remove("invalid"));
      el.querySelectorAll("[data-stepper] b").forEach((b, i) => { b.textContent = b.closest("[data-stepper]").dataset.stepper === "adults" ? "1" : "0"; });
    });
  }

  function openBooking(prefill) {
    const m = document.getElementById("booking-modal");
    if (!m) return;
    if (prefill && prefill.destination) {
      const sel = m.querySelector("select[name=destination]");
      const match = Array.from(sel.options).find(o => o.value.toLowerCase().includes(prefill.destination.toLowerCase()));
      if (match) sel.value = match.value;
    }
    m.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeBooking() {
    const m = document.getElementById("booking-modal");
    if (!m) return;
    m.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => m.dispatchEvent(new Event("ss:reset")), 300);
  }
  document.addEventListener("click", e => {
    if (e.target.closest("[data-open-booking]")) { e.preventDefault(); openBooking(); }
    if (e.target.closest("[data-close-booking]")) { e.preventDefault(); closeBooking(); }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeBooking(); });

  /* ---------------- Listing engine ---------------- */
  const PER_PAGE = 6;
  function money(n) {
    const usd = Math.round(Number(n) * 100) / 100;
    const rate = (window.SSENS_CONFIG && window.SSENS_CONFIG.vndPerUsd) || 25000;
    return Math.round(usd * rate).toLocaleString("vi-VN") + " ₫";
  }

  function cardHTML(p, state) {
    const selectedDates = state && state.checkin && state.checkout ? `&checkin=${encodeURIComponent(state.checkin)}&checkout=${encodeURIComponent(state.checkout)}&guests=${encodeURIComponent(state.guests || 2)}` : "";
    const detailUrl = `property.html?id=${p.id}${selectedDates}`;
    const isLong = p.rentalType === "long";
    const typeLabel = isLong ? "Dài hạn" : "Ngắn hạn";
    const typeNote = isLong ? "Căn hộ dịch vụ · theo tháng" : "Lưu trú dịch vụ · theo đêm";
    const price = isLong
      ? `<b>${money(p.monthlyFrom || p.priceMin * 30)}</b> <span>/ tháng · từ</span>`
      : `<b>${money(p.priceMin)}–${money(p.priceMax)}</b> <span>/ đêm</span>`;
    return `
      <article class="card" data-id="${p.id}">
        <div class="card-media loading">
          <div class="card-loc">${p.location}</div>
          <div class="card-type">${typeLabel}</div>
          <button class="card-fav" aria-label="Lưu căn hộ vào yêu thích" title="Lưu vào yêu thích trên thiết bị này">${ICONS.heart}</button>
          <a href="${detailUrl}" aria-label="View ${p.name}">
            <img src="${p.images[0]}" alt="${p.name}" loading="lazy"
                 data-imgs='${JSON.stringify(p.images)}' data-i="0" />
          </a>
          <div class="card-dots">${p.images.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("")}</div>
        </div>
        <div class="card-body">
          <div class="card-top">
            <h3><a href="${detailUrl}">${p.name}</a></h3>
            <span class="card-rating">${ICONS.star} ${p.rating.toFixed(2)}</span>
          </div>
          <p class="card-term">${typeNote}</p>
          <p class="card-desc">${p.description}</p>
          <div class="card-specs">
            <span class="spec">${ICONS.guest} ${p.guests} khách</span>
            <span class="spec">${ICONS.bed} ${p.beds} giường</span>
            <span class="spec">${ICONS.bath} ${p.baths} phòng tắm</span>
          </div>
          <div class="card-foot">
            <div class="card-price">${price}</div>
            <a class="btn btn-primary" href="${detailUrl}">Xem chi tiết</a>
          </div>
        </div>
      </article>`;
  }

  function initListing() {
    const grid = document.getElementById("listing-grid");
    if (!grid) return;
      const all = (window.SSENS_PROPERTIES || []).filter(p => p.status !== "hidden" && p.status !== "soldout");
    const destinations = window.SSENS_DESTINATIONS || ["All"];
    const filterHost = document.getElementById("filters");
    const searchInput = document.getElementById("listing-search");
    const pager = document.getElementById("pagination");
    const priceFilter = document.getElementById("price-filter");
    const bedsFilter = document.getElementById("beds-filter");
    const amenityFilter = document.getElementById("amenity-filter");
    const sortFilter = document.getElementById("sort-filter");
    const typeHost = document.getElementById("stay-type-filters");
    const shortSearch = document.getElementById("short-stay-search");
    const shortSearchNote = document.getElementById("short-stay-search-note");
    const state = { filter: "Tất cả", stayType: "all", query: "", price: "all", beds: "all", amenity: "all", sort: "featured", page: 1, checkin: "", checkout: "", guests: 2 };

    filterHost.innerHTML = destinations.map(d =>
      `<button class="filter-tab ${d === "Tất cả" ? "active" : ""}" data-filter="${d}">${d}</button>`
    ).join("");

    function filtered() {
      const list = all.filter(p => {
        const okLoc = state.filter === "Tất cả" || p.location === state.filter;
        const okType = state.stayType === "all" || p.rentalType === state.stayType;
        const vnd = Number(p.priceMin) * ((window.SSENS_CONFIG && window.SSENS_CONFIG.vndPerUsd) || 25000);
        const okPrice = state.price === "all" || (state.price === "low" && vnd < 2500000) || (state.price === "mid" && vnd >= 2500000 && vnd <= 5000000) || (state.price === "high" && vnd > 5000000);
        const okBeds = state.beds === "all" || Number(p.beds) >= Number(state.beds);
        const okAmenity = state.amenity === "all" || (p.amenityTags || []).includes(state.amenity);
        const q = state.query.trim().toLowerCase();
        const okQ = !q || p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
        return okLoc && okType && okPrice && okBeds && okAmenity && okQ;
      });
      return list.sort((a, b) => state.sort === "price-asc" ? a.priceMin - b.priceMin : state.sort === "price-desc" ? b.priceMin - a.priceMin : state.sort === "rating" ? b.rating - a.rating : Number(b.featured) - Number(a.featured));
    }

    function render() {
      const list = filtered();
      const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
      if (state.page > pages) state.page = pages;
      const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);

      grid.innerHTML = slice.length
        ? slice.map(p => cardHTML(p, state)).join("")
        : `<div class="empty"><h3>Không tìm thấy căn phù hợp</h3><p>Hãy thử điểm đến hoặc từ khóa khác.</p></div>`;

      // reveal + interactions
      requestAnimationFrame(() => grid.querySelectorAll(".card").forEach((c, i) => {
        setTimeout(() => c.classList.add("in"), i * 60);
      }));
      attachCardEvents(grid);

      // pagination
      if (pages <= 1) { pager.innerHTML = ""; return; }
      let html = `<button ${state.page === 1 ? "disabled" : ""} data-page="prev">Trước</button>`;
      for (let i = 1; i <= pages; i++) html += `<button class="${i === state.page ? "active" : ""}" data-page="${i}">${i}</button>`;
      html += `<button ${state.page === pages ? "disabled" : ""} data-page="next">Sau</button>`;
      pager.innerHTML = html;
    }

    filterHost.addEventListener("click", e => {
      const b = e.target.closest("[data-filter]");
      if (!b) return;
      filterHost.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
      b.classList.add("active");
      state.filter = b.dataset.filter; state.page = 1; render();
    });
    if (typeHost) typeHost.addEventListener("click", e => {
      const b = e.target.closest("[data-stay-type]");
      if (!b) return;
      typeHost.querySelectorAll(".stay-type-tab").forEach(t => t.classList.remove("active"));
      b.classList.add("active");
      state.stayType = b.dataset.stayType;
      if (shortSearch) shortSearch.hidden = state.stayType !== "short";
      state.page = 1;
      render();
    });
    if (shortSearch) {
      const today = new Date().toISOString().slice(0, 10);
      shortSearch.elements.checkin.min = today;
      shortSearch.elements.checkout.min = today;
      shortSearch.elements.checkin.addEventListener("change", () => { shortSearch.elements.checkout.min = shortSearch.elements.checkin.value || today; });
      shortSearch.addEventListener("submit", event => {
        event.preventDefault();
        const F = shortSearch.elements;
        if (!F.checkin.value || !F.checkout.value || F.checkout.value <= F.checkin.value) { shortSearchNote.textContent = "Vui lòng chọn ngày trả phòng sau ngày nhận phòng."; return; }
        state.checkin = F.checkin.value; state.checkout = F.checkout.value; state.guests = F.guests.value;
        shortSearchNote.textContent = "Đã áp dụng ngày ở. Chọn một căn để xem tạm tính và gửi yêu cầu.";
        render();
      });
    }
    if (searchInput) {
      let t;
      searchInput.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => { state.query = searchInput.value; state.page = 1; render(); }, 180);
      });
    }
    [[priceFilter, "price"], [bedsFilter, "beds"], [amenityFilter, "amenity"], [sortFilter, "sort"]].forEach(([control, key]) => {
      if (!control) return;
      control.addEventListener("change", () => { state[key] = control.value; state.page = 1; render(); });
    });
    pager.addEventListener("click", e => {
      const b = e.target.closest("[data-page]");
      if (!b || b.disabled) return;
      const pages = Math.max(1, Math.ceil(filtered().length / PER_PAGE));
      if (b.dataset.page === "prev") state.page = Math.max(1, state.page - 1);
      else if (b.dataset.page === "next") state.page = Math.min(pages, state.page + 1);
      else state.page = +b.dataset.page;
      render();
      document.getElementById("listing").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    render();
  }

  function attachCardEvents(scope) {
    const savedHomes = new Set(JSON.parse(localStorage.getItem("ssens_saved_homes") || "[]"));
    scope.querySelectorAll(".card").forEach(card => {
      const img = card.querySelector(".card-media img");
      const media = card.querySelector(".card-media");
      const dots = card.querySelectorAll(".card-dots i");
      const imgs = JSON.parse(img.dataset.imgs || "[]");
      const fav = card.querySelector(".card-fav");
      fav.classList.toggle("on", savedHomes.has(card.dataset.id));
      const imageReady = () => media.classList.remove("loading");
      if (img.complete) imageReady(); else img.addEventListener("load", imageReady, { once: true });
      // cycle images on hover
      let iv;
      card.addEventListener("mouseenter", () => {
        if (imgs.length < 2) return;
        iv = setInterval(() => {
          let i = (+img.dataset.i + 1) % imgs.length;
          img.dataset.i = i; img.src = imgs[i];
          dots.forEach((d, di) => d.classList.toggle("on", di === i));
        }, 1100);
      });
      card.addEventListener("mouseleave", () => {
        clearInterval(iv);
        img.dataset.i = 0; img.src = imgs[0];
        dots.forEach((d, di) => d.classList.toggle("on", di === 0));
      });
      // pause the image cycle while pointer is over the interactive controls,
      // so clicks never land on a mid-swap image
      const controls = card.querySelector(".card-body");
      controls.addEventListener("pointerenter", () => clearInterval(iv));
      fav.addEventListener("pointerenter", () => clearInterval(iv));
      fav.addEventListener("click", () => {
        fav.classList.toggle("on");
        if (fav.classList.contains("on")) savedHomes.add(card.dataset.id); else savedHomes.delete(card.dataset.id);
        localStorage.setItem("ssens_saved_homes", JSON.stringify([...savedHomes]));
        toast(fav.classList.contains("on") ? "Đã lưu căn hộ vào mục yêu thích trên thiết bị này." : "Đã bỏ căn hộ khỏi mục yêu thích.");
      });
    });
  }

  /* ---------------- Contact form ---------------- */
  function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", e => {
      e.preventDefault();
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let ok = true;
      const rules = [
        [form.elements.name, form.elements.name.value.trim().length >= 2],
        [form.elements.email, emailRe.test(form.elements.email.value.trim())],
        [form.elements.message, form.elements.message.value.trim().length >= 5]
      ];
      rules.forEach(([i, good]) => { i.closest(".field").classList.toggle("invalid", !good); if (!good) ok = false; });
      if (!ok) return;

      const F = form.elements;
      const subject = F.subject.value + " — S.Sens Homes";
      const body = [
        "Họ tên: " + F.name.value.trim(),
        "Email: " + F.email.value.trim(),
        "Điện thoại: " + F.phone.value.trim(),
        "Chủ đề: " + F.subject.value,
        "",
        F.message.value.trim()
      ].join("\\n");
      window.location.href = "mailto:" + CONTACT.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      form.reset();
      toast("Email đã được soạn sẵn — vui lòng gửi để liên hệ với chúng tôi.");
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  function initReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));
  }

  /* ---------------- Toast ---------------- */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    injectHeader();
    injectFooter();
    injectCookieConsent();
    applySiteContent();
    injectModal();
    initListing();
    initContactForm();
    initReveal();
  });

  // merge — do NOT overwrite, booking-engine.js already set window.SSENS.Booking
  window.SSENS = Object.assign(window.SSENS || {}, { openBooking, toast });
})();
