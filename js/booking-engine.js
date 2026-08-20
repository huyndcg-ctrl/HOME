/* =============================================================
   S.SENS HOMES — Booking core (client-side, no backend)
   • Range calendar (chọn ngày nhận / trả)
   • Tính giá minh bạch + long-stay discount
   • Gửi yêu cầu qua Telegram (fallback: email/mailto)
   ============================================================= */
(function () {
  "use strict";

  var CFG = window.SSENS_CONFIG || {};
  var CUR = CFG.currency || "$";

  /* ---------- Date helpers (local, no timezone drift) ---------- */
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function today() { return startOfDay(new Date()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
  function sameDay(a, b) { return a && b && a.getTime() === b.getTime(); }
  function nightsBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / 86400000); }
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function pretty(d) {
    return d.getDate() + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  }
  var MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  var DOW = ["CN","T2","T3","T4","T5","T6","T7"];

  /* ---------- Money ---------- */
  function money(n) {
    var usd = Math.round(n * 100) / 100;
    var vnd = Math.round(usd * (CFG.vndPerUsd || 25000));
    return vnd.toLocaleString("vi-VN") + " ₫";
  }

  /* ---------- Price engine ---------- */
  // Trả về breakdown minh bạch cho 1 lần đặt.
  function quote(property, checkin, checkout, guests) {
    var nightly = (property && property.priceMin) || 0;
    var nights = (checkin && checkout) ? nightsBetween(checkin, checkout) : 0;
    if (nights < 1) {
      return { nights: 0, nightly: nightly, valid: false };
    }
    var room = nightly * nights;
    var baseGuests = Math.max(1, Number((property && property.baseGuests) || 2));
    var guestCount = Math.max(1, Number(guests || baseGuests));
    var extraGuests = Math.max(0, guestCount - baseGuests);
    var extraGuestFeeVnd = Math.max(0, Number((property && property.extraGuestFeeVnd) || 0));
    var extraGuest = extraGuests * extraGuestFeeVnd / (CFG.vndPerUsd || 25000) * nights;

    // long-stay discount
    var pct = 0, label = "";
    if (nights >= (CFG.monthlyNights || 28)) { pct = CFG.monthlyDiscountPct || 0; label = "Giảm giá lưu trú theo tháng"; }
    else if (nights >= (CFG.weeklyNights || 7)) { pct = CFG.weeklyDiscountPct || 0; label = "Giảm giá lưu trú theo tuần"; }
    var discount = room * pct;

    var afterDiscount = room - discount + extraGuest;
    var cleaning = CFG.cleaningFee || 0;
    var service = afterDiscount * (CFG.serviceFeePct || 0);
    var taxable = afterDiscount + cleaning + service;
    var tax = taxable * (CFG.taxPct || 0);
    var total = taxable + tax;

    return {
      valid: true,
      nights: nights,
      nightly: nightly,
      room: room,
      baseGuests: baseGuests,
      guests: guestCount,
      extraGuests: extraGuests,
      extraGuestFeeVnd: extraGuestFeeVnd,
      extraGuest: extraGuest,
      discountPct: pct,
      discountLabel: label,
      discount: discount,
      cleaning: cleaning,
      service: service,
      tax: tax,
      total: total
    };
  }

  // HTML bảng breakdown
  function quoteHTML(q) {
    if (!q.valid) {
      return '<div class="bk-hint">Chọn ngày để xem tổng giá tham khảo.</div>';
    }
    var rows = "";
    rows += row(money(q.nightly) + " × " + q.nights + " đêm", money(q.room));
    if (q.extraGuest > 0) rows += row("Phụ thu " + q.extraGuests + " khách thêm × " + q.nights + " đêm", money(q.extraGuest));
    if (q.discount > 0) {
      rows += row('<span class="bk-disc">' + q.discountLabel + " (−" + Math.round(q.discountPct * 100) + "%)</span>",
                  '<span class="bk-disc">−' + money(q.discount) + "</span>");
    }
    if (q.cleaning > 0) rows += row("Phí dọn dẹp", money(q.cleaning));
    if (q.service > 0) rows += row("Phí dịch vụ", money(q.service));
    if (q.tax > 0) rows += row("Thuế (VAT)", money(q.tax));
    return '<div class="bk-rows">' + rows +
           '<div class="bk-row bk-total"><span>Tổng cộng</span><b>' + money(q.total) + "</b></div></div>";
  }
  function row(l, r) { return '<div class="bk-row"><span>' + l + "</span><span>" + r + "</span></div>"; }

  /* ---------- Range calendar ----------
     mount(container, { minDate, onChange(checkin, checkout) })
     Click 1: đặt check-in. Click 2: đặt check-out (nếu sau check-in).
  ------------------------------------------------------------- */
  function Calendar(container, opts) {
    opts = opts || {};
    var min = startOfDay(opts.minDate || today());
    var view = new Date(min.getFullYear(), min.getMonth(), 1);
    var checkin = opts.initialCheckin ? startOfDay(opts.initialCheckin) : null;
    var checkout = opts.initialCheckout ? startOfDay(opts.initialCheckout) : null;
    if (checkin && (checkin < min || !checkout || checkout <= checkin)) { checkin = null; checkout = null; }
    var unavailable = {};
    (opts.unavailableDates || []).forEach(function (date) { unavailable[date] = true; });

    function fire() { if (opts.onChange) opts.onChange(checkin, checkout); }

    function pick(d) {
      if (!checkin || checkout) {          // bắt đầu chọn mới
        checkin = d; checkout = null;
      } else if (d > checkin && !rangeHasUnavailable(checkin, d)) { // chọn ngày trả hợp lệ
        checkout = d;
      } else if (d > checkin) {
        if (opts.onUnavailableRange) opts.onUnavailableRange();
      } else {                             // click ngày <= check-in → đặt lại check-in
        checkin = d; checkout = null;
      }
      render(); fire();
    }

    function rangeHasUnavailable(start, end) {
      for (var d = addDays(start, 0); d < end; d = addDays(d, 1)) {
        if (unavailable[iso(d)]) return true;
      }
      return false;
    }

    function dayCell(d, muted) {
      var disabled = d < min || unavailable[iso(d)];
      var isIn = sameDay(d, checkin);
      var isOut = sameDay(d, checkout);
      var inRange = checkin && checkout && d > checkin && d < checkout;
      var cls = "bk-day";
      if (muted) cls += " muted";
      if (disabled) cls += " disabled";
      if (isIn) cls += " start";
      if (isOut) cls += " end";
      if (inRange) cls += " inrange";
      return '<button type="button" class="' + cls + '"' +
        (disabled ? " disabled" : "") +
        ' data-date="' + iso(d) + '">' + d.getDate() + "</button>";
    }

    function monthGrid(base) {
      var first = new Date(base.getFullYear(), base.getMonth(), 1);
      var startDow = first.getDay();
      var cells = "";
      // leading days from prev month
      for (var i = 0; i < startDow; i++) {
        cells += dayCell(addDays(first, i - startDow), true);
      }
      var days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
      for (var day = 1; day <= days; day++) {
        cells += dayCell(new Date(base.getFullYear(), base.getMonth(), day), false);
      }
      // trailing to fill last week
      var total = startDow + days;
      var trail = (7 - (total % 7)) % 7;
      for (var t = 1; t <= trail; t++) {
        cells += dayCell(new Date(base.getFullYear(), base.getMonth() + 1, t), true);
      }
      return '<div class="bk-cal-head">' +
               '<button type="button" class="bk-nav" data-nav="-1" aria-label="Tháng trước">‹</button>' +
               '<div class="bk-cal-title">' + MONTHS[base.getMonth()] + " " + base.getFullYear() + "</div>" +
               '<button type="button" class="bk-nav" data-nav="1" aria-label="Tháng sau">›</button>' +
             "</div>" +
             '<div class="bk-dow">' + DOW.map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>" +
             '<div class="bk-grid">' + cells + "</div>";
    }

    function render() {
      container.innerHTML = '<div class="bk-cal">' + monthGrid(view) + "</div>";
      container.querySelectorAll(".bk-day").forEach(function (b) {
        if (b.disabled) return;
        b.addEventListener("click", function () {
          var p = b.dataset.date.split("-");
          pick(new Date(+p[0], +p[1] - 1, +p[2]));
        });
      });
      container.querySelectorAll("[data-nav]").forEach(function (b) {
        b.addEventListener("click", function () { view = addMonths(view, +b.dataset.nav); render(); });
      });
    }

    render(); fire();

    return {
      get: function () { return { checkin: checkin, checkout: checkout }; },
      reset: function () { checkin = null; checkout = null; view = new Date(min.getFullYear(), min.getMonth(), 1); render(); fire(); }
    };
  }

  /* ---------- Send request (Telegram → fallback mailto) ---------- */
  function buildMessage(p) {
    // p: { property, checkin, checkout, nights, guests, total, name, email, phone, note }
    var L = [];
    L.push("🏡 YÊU CẦU LƯU TRÚ MỚI — S.Sens Homes");
    if (p.property) L.push("• Căn hộ: " + p.property);
    if (p.checkin) L.push("• Nhận phòng: " + p.checkin);
    if (p.checkout) L.push("• Trả phòng: " + p.checkout);
    if (p.nights) L.push("• Số đêm: " + p.nights);
    if (p.guests != null) L.push("• Số khách: " + p.guests);
    if (p.total) L.push("• Tổng giá tham khảo: " + p.total);
    L.push("——");
    if (p.name) L.push("• Họ tên: " + p.name);
    if (p.email) L.push("• Email: " + p.email);
    if (p.phone) L.push("• Điện thoại: " + p.phone);
    if (p.note) L.push("• Ghi chú: " + p.note);
    return L.join("\n");
  }

  function sendRequest(payload) {
    var text = buildMessage(payload);
    var tg = CFG.telegram || {};
    if (tg.botToken && tg.chatId) {
      return fetch("https://api.telegram.org/bot" + tg.botToken + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: tg.chatId, text: text, disable_web_page_preview: true })
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (!d.ok) throw new Error(d.description || "Telegram error");
        return "telegram";
      });
    }
    // fallback: open user's email client with everything prefilled
    var email = (CFG.contact && CFG.contact.email) || "hello@ssenshomes.com";
    var subject = "Yêu cầu lưu trú — " + (payload.property || "S.Sens Homes");
    var url = "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
    window.location.href = url;
    return Promise.resolve("mailto");
  }

  function whatsappURL(payload) {
    var num = (CFG.contact && CFG.contact.whatsapp) || "";
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(buildMessage(payload));
  }

  /* ---------- Export ---------- */
  window.SSENS = window.SSENS || {};
  window.SSENS.Booking = {
    quote: quote,
    quoteHTML: quoteHTML,
    money: money,
    pretty: pretty,
    iso: iso,
    nights: nightsBetween,
    Calendar: Calendar,
    sendRequest: sendRequest,
    buildMessage: buildMessage,
    whatsappURL: whatsappURL,
    today: today
  };
})();
