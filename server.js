/* S.Sens Homes local booking server — Node.js 18+ */
const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");
const { promisify } = require("util");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 5173);
const BOOKING_FILE = path.join(ROOT, "data", "bookings.json");
const OVERRIDES_FILE = path.join(ROOT, "data", "property-overrides.json");
const USER_FILE = path.join(ROOT, "data", "users.json");
const VERIFICATION_FILE = path.join(ROOT, "data", "email-verifications.json");
const LEADS_FILE = path.join(ROOT, "data", "leads.json");
const SITE_CONTENT_FILE = path.join(ROOT, "data", "site-content.json");
const AUDIT_LOG_FILE = path.join(ROOT, "data", "audit-log.json");
// Keep the public demo images available even when Render's runtime misses a
// tracked static file. A custom mirror can still be supplied through .env.
const ASSET_FALLBACK_BASE = String(
  process.env.ASSET_FALLBACK_BASE || "https://raw.githubusercontent.com/huyndcg-ctrl/HOME/main"
).replace(/\/$/, "");
const scrypt = promisify(crypto.scrypt);
const sessions = new Map();
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon" };

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) return;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  });
}

function catalogue() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8"), sandbox);
  return { properties: sandbox.window.SSENS_PROPERTIES || [], config: sandbox.window.SSENS_CONFIG || {}, detailDefaults: sandbox.window.SSENS_DETAIL_DEFAULTS || {}, propertyDetails: sandbox.window.SSENS_PROPERTY_DETAILS || {} };
}

async function readBookings() {
  try { return JSON.parse(await fsp.readFile(BOOKING_FILE, "utf8")); }
  catch { return []; }
}
async function writeBookings(bookings) {
  await fsp.writeFile(BOOKING_FILE, JSON.stringify(bookings, null, 2) + "\n", "utf8");
}
async function readOverrides() {
  try { return JSON.parse(await fsp.readFile(OVERRIDES_FILE, "utf8")); }
  catch { return {}; }
}
async function writeOverrides(overrides) {
  await fsp.writeFile(OVERRIDES_FILE, JSON.stringify(overrides, null, 2) + "\n", "utf8");
}
async function readUsers() {
  try { return JSON.parse(await fsp.readFile(USER_FILE, "utf8")); }
  catch { return []; }
}
async function writeUsers(users) {
  await fsp.writeFile(USER_FILE, JSON.stringify(users, null, 2) + "\n", "utf8");
}
async function readVerifications() {
  try { return JSON.parse(await fsp.readFile(VERIFICATION_FILE, "utf8")); }
  catch { return []; }
}
async function writeVerifications(verifications) {
  await fsp.writeFile(VERIFICATION_FILE, JSON.stringify(verifications, null, 2) + "\n", "utf8");
}
async function readLeads() {
  try { return JSON.parse(await fsp.readFile(LEADS_FILE, "utf8")); }
  catch { return []; }
}
async function writeLeads(leads) {
  await fsp.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2) + "\n", "utf8");
}
async function readSiteContent() {
  try { return JSON.parse(await fsp.readFile(SITE_CONTENT_FILE, "utf8")); }
  catch { return {}; }
}
async function writeSiteContent(content) {
  await fsp.writeFile(SITE_CONTENT_FILE, JSON.stringify(content, null, 2) + "\n", "utf8");
}
async function readAuditLog() {
  try { return JSON.parse(await fsp.readFile(AUDIT_LOG_FILE, "utf8")); }
  catch { return []; }
}
async function writeAuditLog(entries) {
  await fsp.writeFile(AUDIT_LOG_FILE, JSON.stringify(entries.slice(-1000), null, 2) + "\n", "utf8");
}
async function audit(event, entityType, entity, actor, detail = {}) {
  const entries = await readAuditLog();
  entries.push({ id: crypto.randomUUID(), at: new Date().toISOString(), event, entityType, entityId: entity.id, reference: entity.reference || "", actor, detail });
  await writeAuditLog(entries);
}
async function saveUploadedImage(dataUrl, prefix = "upload") {
  const match = String(dataUrl || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) { const error = new Error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP"); error.statusCode = 400; throw error; }
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > 4 * 1024 * 1024) { const error = new Error("Mỗi ảnh tối đa 4 MB"); error.statusCode = 400; throw error; }
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[match[1]];
  const folder = path.join(ROOT, "assets", "uploads");
  await fsp.mkdir(folder, { recursive: true });
  const filename = `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
  await fsp.writeFile(path.join(folder, filename), bytes);
  return "assets/uploads/" + filename;
}
async function mergedCatalogue() {
  const base = catalogue();
  const overrides = await readOverrides();
  return { ...base, properties: base.properties.map((property) => ({ ...property, ...base.detailDefaults, ...(base.propertyDetails[property.id] || {}), ...(overrides[property.id] || {}) })) };
}
function json(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => { size += chunk.length; if (size > 6 * 1024 * 1024) { reject(new Error("Request too large")); req.destroy(); return; } chunks.push(chunk); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); } catch { reject(new Error("Invalid JSON")); } });
    req.on("error", reject);
  });
}
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(value + "T00:00:00Z")); }
function nightsBetween(checkin, checkout) { return Math.round((Date.parse(checkout + "T00:00:00Z") - Date.parse(checkin + "T00:00:00Z")) / 86400000); }
function overlaps(a, b) { return a.checkin < b.checkout && b.checkin < a.checkout; }
function nextDate(date) { const value = new Date(date + "T00:00:00Z"); value.setUTCDate(value.getUTCDate() + 1); return value.toISOString().slice(0, 10); }
const RESERVING_BOOKING_STATUSES = ["pending", "payment_submitted", "payment_verified", "confirmed"];
function bookingCountForDay(bookings, propertyId, day) { return bookings.filter((booking) => booking.propertyId === propertyId && RESERVING_BOOKING_STATUSES.includes(booking.status) && booking.checkin <= day && booking.checkout > day).length; }
function hasCapacityForRange(bookings, property, range) { const quantity = Math.max(1, Math.floor(Number(property.quantity) || 1)); for (let day = range.checkin; day < range.checkout; day = nextDate(day)) if (bookingCountForDay(bookings, property.id, day) >= quantity) return false; return true; }
function bookingRef() { return "SSH-" + crypto.randomBytes(4).toString("hex").toUpperCase(); }
function leadRef() { return "YC-" + crypto.randomBytes(3).toString("hex").toUpperCase(); }
function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function cookies(req) { return Object.fromEntries(String(req.headers.cookie || "").split(";").map((entry) => entry.trim().split(/=(.*)/s)).filter(([key]) => key)); }
function session(req) { return sessions.get(cookies(req).ssens_session); }
function createSession(res, identity) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { ...identity, createdAt: Date.now() });
  return { "Set-Cookie": `ssens_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` };
}
function clearSession(res) { return { "Set-Cookie": "ssens_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" }; }
async function passwordHash(password) { const salt = crypto.randomBytes(16).toString("hex"); const hash = await scrypt(password, salt, 64); return `${salt}:${hash.toString("hex")}`; }
async function passwordMatches(password, stored) { const [salt, expected] = String(stored || "").split(":"); if (!salt || !expected) return false; const actual = await scrypt(password, salt, 64); return crypto.timingSafeEqual(actual, Buffer.from(expected, "hex")); }
async function currentUser(req) { const active = session(req); if (!active || active.role !== "customer") return null; const user = (await readUsers()).find((item) => item.id === active.userId); return user && user.emailVerified === true ? user : null; }
// Local convenience switch. Keep this false on any public deployment.
function adminAuthDisabled() { return String(process.env.ADMIN_AUTH_DISABLED || "").toLowerCase() === "true"; }
function stagingSignupWithoutOtp() { return String(process.env.ALLOW_UNVERIFIED_SIGNUP || "").toLowerCase() === "true"; }
function adminAuthorized(req) { return adminAuthDisabled() || session(req)?.role === "admin"; }
function emailConfigured() { return !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM); }
function otpHash(code) { return crypto.createHash("sha256").update(String(code)).digest("hex"); }
async function sendVerificationEmail(email, code) {
  if (!emailConfigured()) { const error = new Error("Email is not configured yet. Add RESEND_API_KEY and RESEND_FROM to .env, then restart the server."); error.statusCode = 503; throw error; }
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.RESEND_FROM, to: [email], subject: "Your S.Sens Homes verification code", html: `<h2>Verify your email</h2><p>Your verification code is:</p><p style="font-size:28px;letter-spacing:6px;font-weight:bold">${code}</p><p>This code expires in 10 minutes. If you did not create an account, you can ignore this email.</p>` }) });
  if (!response.ok) { const error = new Error("We couldn't send the verification email. Please try again."); error.statusCode = 502; throw error; }
}
async function issueVerificationCode(email) {
  const code = String(crypto.randomInt(100000, 1000000));
  const verifications = (await readVerifications()).filter((item) => item.email !== email && Date.parse(item.expiresAt) > Date.now());
  verifications.push({ id: crypto.randomUUID(), email, codeHash: otpHash(code), attempts: 0, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), createdAt: new Date().toISOString() });
  await writeVerifications(verifications);
  await sendVerificationEmail(email, code);
}
function propertyPatch(input) {
  const output = {};
  ["name", "internalName", "description", "location", "address", "mapQuery", "cancellation", "cancelPolicy", "cancelNote", "checkinTime", "checkoutTime", "roomCategory", "unitType", "floorView", "balcony", "kitchen"].forEach((key) => { if (typeof input[key] === "string" && input[key].trim()) output[key] = input[key].trim().slice(0, 3000); });
  ["priceMin", "priceMax", "monthlyFrom", "minNights", "minMonths", "guests", "baseGuests", "extraGuestFeeVnd", "beds", "baths", "bedrooms", "areaSqm", "bedKing", "bedQueen", "bedDouble", "bedSingle", "bedBunk", "bedSofa"].forEach((key) => { if (Number.isFinite(Number(input[key])) && Number(input[key]) >= 0) output[key] = Number(input[key]); });
  if (Number.isInteger(Number(input.quantity)) && Number(input.quantity) >= 1 && Number(input.quantity) <= 999) output.quantity = Number(input.quantity);
  if (["short", "long"].includes(input.rentalType)) output.rentalType = input.rentalType;
  if (typeof input.minimumTerm === "string" && input.minimumTerm.trim()) output.minimumTerm = input.minimumTerm.trim().slice(0, 60);
  if (typeof input.featured === "boolean") output.featured = input.featured;
  if (["published", "hidden", "soldout"].includes(input.status)) output.status = input.status;
  ["amenities", "houseRules", "amenityTags"].forEach((key) => { if (Array.isArray(input[key])) output[key] = input[key].filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim().slice(0, 120)).slice(0, 30); });
  if (Array.isArray(input.images)) output.images = input.images.filter((image) => typeof image === "string" && image.trim()).map((image) => image.trim()).slice(0, 8);
  return output;
}
function quote(property, nights, config, guests = 2) {
  const room = Number(property.priceMin) * nights;
  const baseGuests = Math.max(1, Number(property.baseGuests || 2));
  const extraGuests = Math.max(0, Number(guests) - baseGuests);
  const extraGuest = extraGuests * Number(property.extraGuestFeeVnd || 0) / Number(config.vndPerUsd || 25000) * nights;
  const discountPct = nights >= Number(config.monthlyNights || 28) ? Number(config.monthlyDiscountPct || 0) : nights >= Number(config.weeklyNights || 7) ? Number(config.weeklyDiscountPct || 0) : 0;
  const afterDiscount = room - room * discountPct + extraGuest;
  const cleaning = Number(config.cleaningFee || 0);
  const service = afterDiscount * Number(config.serviceFeePct || 0);
  const tax = (afterDiscount + cleaning + service) * Number(config.taxPct || 0);
  const total = afterDiscount + cleaning + service + tax;
  const currency = config.currency || "$";
  return currency + (Math.round(total * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
let bookingQueue = Promise.resolve();
function reserveBooking(input, property, mode, nights, config, customer) {
  const task = bookingQueue.then(async () => {
    const bookings = await readBookings();
    const requestedRange = { checkin: input.checkin, checkout: input.checkout };
    if (!hasCapacityForRange(bookings, property, requestedRange)) {
      const error = new Error("Those dates are no longer available. Please choose another stay.");
      error.statusCode = 409;
      throw error;
    }
    const booking = { id: crypto.randomUUID(), reference: bookingRef(), customerId: customer.id, propertyId: property.id, propertyName: property.name, mode, status: mode === "instant" ? "confirmed" : "pending", checkin: input.checkin, checkout: input.checkout, nights, guests: Number(input.guests), total: quote(property, nights, config, input.guests), name: customer.name, email: customer.email, phone: String(input.phone).trim(), note: String(input.note || "").trim(), paymentToken: crypto.randomBytes(24).toString("hex"), createdAt: new Date().toISOString() };
    bookings.push(booking);
    await writeBookings(bookings);
    await audit("booking.created", "booking", booking, { role: "customer", userId: customer.id }, { mode });
    return booking;
  });
  bookingQueue = task.catch(() => undefined);
  return task;
}

async function sendEmails(booking) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) return "not_configured";
  const subject = booking.mode === "instant" ? "Booking confirmed" : "Booking request received";
  const action = booking.mode === "instant" ? "Your stay is confirmed." : "We received your request and will confirm availability shortly.";
  const summary = `<p><strong>${escapeHtml(booking.propertyName)}</strong><br>${booking.checkin} → ${booking.checkout} · ${booking.nights} night(s) · ${booking.guests} guest(s)<br>Total estimate: ${escapeHtml(booking.total)}</p>`;
  const guest = { from: process.env.RESEND_FROM, to: [booking.email], subject: `${subject} — S.Sens Homes`, html: `<h2>${subject}</h2><p>Hi ${escapeHtml(booking.name)},</p><p>${action}</p>${summary}<p>Reference: <strong>${booking.reference}</strong></p>` };
  const owner = { from: process.env.RESEND_FROM, to: [process.env.OWNER_EMAIL || "hello@ssenshomes.com"], subject: `New ${booking.mode} booking — ${booking.reference}`, html: `<h2>New booking</h2>${summary}<p>Guest: ${escapeHtml(booking.name)} · ${escapeHtml(booking.email)} · ${escapeHtml(booking.phone)}</p><p>${escapeHtml(booking.note)}</p>` };
  const send = (payload) => fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => { if (!r.ok) throw new Error(`Email API returned ${r.status}`); });
  try { await Promise.all([send(guest), send(owner)]); return "sent"; }
  catch (error) { console.error("Email delivery failed:", error.message); return "failed"; }
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/content") return json(res, 200, { content: await readSiteContent() });
  if (req.method === "GET" && url.pathname === "/api/payment-config") {
    const payment = (await readSiteContent()).payment || {};
    return json(res, 200, { payment: { enabled: payment.enabled === true, bankName: String(payment.bankName || ""), accountNumber: String(payment.accountNumber || ""), accountHolder: String(payment.accountHolder || ""), qrImage: String(payment.qrImage || ""), instructions: String(payment.instructions || ""), transferPrefix: String(payment.transferPrefix || "SSH") } });
  }
  if (req.method === "POST" && url.pathname === "/api/leads") {
    try {
      if (req.method === "GET" && url.pathname === "/api/admin/content") return json(res, 200, { content: await readSiteContent() });
      if (req.method === "PATCH" && url.pathname === "/api/admin/content") {
        const input = await readBody(req);
        const clean = { hero: {}, contact: {}, seo: {} };
        ["eyebrow", "title", "text"].forEach(key => { if (typeof input.hero?.[key] === "string") clean.hero[key] = input.hero[key].trim().slice(0, 1000); });
        ["email", "phone", "zalo"].forEach(key => { if (typeof input.contact?.[key] === "string") clean.contact[key] = input.contact[key].trim().slice(0, 160); });
        ["homeTitle", "homeDescription", "homeImage"].forEach(key => { if (typeof input.seo?.[key] === "string") clean.seo[key] = input.seo[key].trim().slice(0, 1000); });
        if (Array.isArray(input.faq)) clean.faq = input.faq.filter(item => item && typeof item.q === "string" && typeof item.a === "string").map(item => ({ q:item.q.trim().slice(0,300), a:item.a.trim().slice(0,1200) })).slice(0,12);
        let testimonials = input.testimonials;
        if (Array.isArray(testimonials) && testimonials.length === 1 && typeof testimonials[0]?.quote === "string" && testimonials[0].quote.trim().startsWith("[")) { try { testimonials = JSON.parse(testimonials[0].quote); } catch (_) {} }
        if (Array.isArray(testimonials)) clean.testimonials = testimonials.filter(item => item && typeof item.quote === "string").map(item => ({ quote:item.quote.trim().slice(0,600), name:String(item.name || "Khách hàng").trim().slice(0,100), place:String(item.place || "").trim().slice(0,100), image:String(item.image || "").trim().slice(0,500), rating:Math.min(5, Math.max(1, Number(item.rating) || 5)) })).slice(0,12);
        if (Array.isArray(input.destinations)) clean.destinations = input.destinations.filter(item => typeof item === "string" && item.trim()).map(item => item.trim().slice(0,80)).slice(0,12);
        if (input.pages && typeof input.pages === "object" && !Array.isArray(input.pages)) clean.pages = Object.fromEntries(Object.entries(input.pages).filter(([key, value]) => /^[a-z]+\.[a-zA-Z0-9]+$/.test(key) && typeof value === "string").map(([key, value]) => [key, value.trim().slice(0, 3000)]));
        const previous = await readSiteContent();
        const content = { ...previous, ...clean, hero: { ...previous.hero, ...clean.hero }, contact: { ...previous.contact, ...clean.contact }, seo: { ...previous.seo, ...clean.seo } };
        await writeSiteContent(content); return json(res, 200, { content });
      }
      const input = await readBody(req);
      const name = String(input.name || "").trim();
      const email = String(input.email || "").trim().toLowerCase();
      const phone = String(input.phone || "").trim();
      const checkin = String(input.checkin || "");
      const checkout = String(input.checkout || "");
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const phoneOk = /^[+()\d][\d\s().-]{6,}$/.test(phone);
      const nights = validDate(checkin) && validDate(checkout) ? nightsBetween(checkin, checkout) : 0;
      if (name.length < 2 || !emailOk || !phoneOk || nights < 1) return json(res, 400, { error: "Vui lòng kiểm tra lại họ tên, email, số điện thoại và ngày ở." });
      const leads = await readLeads();
      const now = new Date().toISOString();
      const lead = { id: crypto.randomUUID(), reference: leadRef(), status: "new", channel: String(input.channel || "website"), name, email, phone, property: String(input.property || "Yêu cầu chung").slice(0, 180), stayType: String(input.stayType || "short"), checkin, checkout, nights, guests: Math.max(1, Number(input.guests) || 1), estimate: String(input.estimate || ""), note: String(input.note || "").trim().slice(0, 2000), createdAt: now, updatedAt: now };
      lead.paymentToken = crypto.randomBytes(24).toString("hex");
      leads.push(lead); await writeLeads(leads);
      return json(res, 201, { lead: { id: lead.id, reference: lead.reference, paymentToken: lead.paymentToken, status: lead.status, responsePromise: "Phản hồi trong 15 phút (8h–22h)" } });
    } catch (error) { console.error(error); return json(res, 500, { error: "Chưa thể ghi nhận yêu cầu. Vui lòng thử lại hoặc gọi trực tiếp cho chúng tôi." }); }
  }
  const paymentProofMatch = url.pathname.match(/^\/api\/leads\/([^/]+)\/payment-proof$/);
  if (req.method === "POST" && paymentProofMatch) {
    try {
      const input = await readBody(req);
      const leads = await readLeads();
      const lead = leads.find((item) => item.id === paymentProofMatch[1]);
      if (!lead) {
        const bookings = await readBookings();
        const booking = bookings.find((item) => item.id === paymentProofMatch[1]);
        const suppliedToken = Buffer.from(String(input.paymentToken || ""));
        const storedToken = Buffer.from(String(booking?.paymentToken || ""));
        if (!booking || !suppliedToken.length || suppliedToken.length !== storedToken.length || !crypto.timingSafeEqual(suppliedToken, storedToken)) return json(res, 404, { error: "Không tìm thấy yêu cầu thanh toán." });
        if (booking.status === "cancelled") return json(res, 400, { error: "Đặt chỗ đã hủy, không thể gửi thanh toán." });
        const proofUrl = await saveUploadedImage(input.proofDataUrl, "payment-proof");
        booking.payment = { status: "proof_submitted", proofUrl, submittedAt: new Date().toISOString() };
        booking.status = "payment_submitted";
        booking.updatedAt = new Date().toISOString();
        await writeBookings(bookings);
        await audit("payment.proof_submitted", "booking", booking, { role: "customer", userId: booking.customerId }, { proofUrl });
        return json(res, 201, { booking: { reference: booking.reference, paymentStatus: booking.payment.status } });
      }
      const suppliedToken = Buffer.from(String(input.paymentToken || ""));
      const storedToken = Buffer.from(String(lead?.paymentToken || ""));
      if (!lead || !suppliedToken.length || suppliedToken.length !== storedToken.length || !crypto.timingSafeEqual(suppliedToken, storedToken)) return json(res, 404, { error: "Không tìm thấy yêu cầu thanh toán." });
      const proofUrl = await saveUploadedImage(input.proofDataUrl, "payment-proof");
      lead.payment = { status: "proof_submitted", proofUrl, submittedAt: new Date().toISOString() };
      lead.status = "payment_submitted";
      lead.updatedAt = new Date().toISOString();
      await writeLeads(leads);
      return json(res, 201, { lead: { reference: lead.reference, paymentStatus: lead.payment.status } });
    } catch (error) { return json(res, error.statusCode || 500, { error: error.message || "Chưa thể tải ảnh biên lai." }); }
  }
  if (req.method === "POST" && url.pathname === "/api/auth/register") {
    try {
      const input = await readBody(req);
      const name = String(input.name || "").trim();
      const email = String(input.email || "").trim().toLowerCase();
      const password = String(input.password || "");
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) return json(res, 400, { error: "Please provide a name, valid email, and password of at least 8 characters." });
      const users = await readUsers();
      if (users.some((user) => user.email === email)) return json(res, 409, { error: "An account already exists with this email." });
      if (!emailConfigured() && !stagingSignupWithoutOtp()) return json(res, 503, { error: "Email verification is not configured yet. Please try again shortly." });
      const user = { id: crypto.randomUUID(), role: "customer", name, email, passwordHash: await passwordHash(password), emailVerified: stagingSignupWithoutOtp(), createdAt: new Date().toISOString() };
      users.push(user); await writeUsers(users);
      if (stagingSignupWithoutOtp()) return json(res, 201, { verificationRequired: false, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, createSession(res, { role: "customer", userId: user.id }));
      await issueVerificationCode(email);
      return json(res, 201, { verificationRequired: true, email: user.email });
    } catch (error) { console.error(error); return json(res, error.statusCode || 500, { error: error.message || "We couldn't create your account right now." }); }
  }
  if (req.method === "POST" && url.pathname === "/api/auth/verify-email") {
    try {
      const input = await readBody(req);
      const email = String(input.email || "").trim().toLowerCase();
      const code = String(input.code || "").replace(/\s/g, "");
      const users = await readUsers();
      const user = users.find((item) => item.email === email);
      const verifications = await readVerifications();
      const verification = verifications.find((item) => item.email === email);
      if (!user || !verification || Date.parse(verification.expiresAt) <= Date.now() || verification.attempts >= 5) return json(res, 400, { error: "This code has expired. Please request a new one." });
      if (!crypto.timingSafeEqual(Buffer.from(otpHash(code)), Buffer.from(verification.codeHash))) {
        verification.attempts += 1; await writeVerifications(verifications);
        return json(res, 400, { error: "The verification code is incorrect." });
      }
      user.emailVerified = true; user.emailVerifiedAt = new Date().toISOString(); await writeUsers(users);
      await writeVerifications(verifications.filter((item) => item.email !== email));
      return json(res, 200, { user: { id: user.id, name: user.name, email: user.email, role: user.role } }, createSession(res, { role: "customer", userId: user.id }));
    } catch (error) { console.error(error); return json(res, 500, { error: "We couldn't verify this code right now." }); }
  }
  if (req.method === "POST" && url.pathname === "/api/auth/resend-verification") {
    try {
      const input = await readBody(req);
      const email = String(input.email || "").trim().toLowerCase();
      const user = (await readUsers()).find((item) => item.email === email);
      if (!user || user.emailVerified === true) return json(res, 400, { error: "No unverified account was found for this email." });
      await issueVerificationCode(email);
      return json(res, 200, { verificationRequired: true, email });
    } catch (error) { console.error(error); return json(res, error.statusCode || 500, { error: error.message || "We couldn't send a new code right now." }); }
  }
  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    try {
      const input = await readBody(req);
      const user = (await readUsers()).find((item) => item.email === String(input.email || "").trim().toLowerCase());
      if (!user || !(await passwordMatches(String(input.password || ""), user.passwordHash))) return json(res, 401, { error: "Email or password is incorrect." });
      if (user.emailVerified !== true) return json(res, 403, { error: "Please verify your email before signing in.", verificationRequired: true, email: user.email });
      return json(res, 200, { user: { id: user.id, name: user.name, email: user.email, role: user.role } }, createSession(res, { role: "customer", userId: user.id }));
    } catch (error) { console.error(error); return json(res, 500, { error: "We couldn't sign you in right now." }); }
  }
  if (req.method === "POST" && url.pathname === "/api/auth/admin-login") {
    try {
      if (adminAuthDisabled()) return json(res, 200, { user: { role: "admin", name: "Administrator" } }, createSession(res, { role: "admin" }));
      if (!process.env.ADMIN_PASSWORD) return json(res, 503, { error: "ADMIN_PASSWORD has not been configured yet." });
      const input = await readBody(req);
      if (!crypto.timingSafeEqual(Buffer.from(String(input.password || "")), Buffer.from(process.env.ADMIN_PASSWORD))) return json(res, 401, { error: "Admin password is incorrect." });
      return json(res, 200, { user: { role: "admin", name: "Administrator" } }, createSession(res, { role: "admin" }));
    } catch (error) { return json(res, 401, { error: "Admin password is incorrect." }); }
  }
  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    const token = cookies(req).ssens_session; if (token) sessions.delete(token);
    return json(res, 200, { ok: true }, clearSession(res));
  }
  if (req.method === "GET" && url.pathname === "/api/auth/me") {
    const active = session(req);
    if (!active) return json(res, 401, { error: "Not signed in" });
    if (active.role === "admin") return json(res, 200, { user: { role: "admin", name: "Administrator" } });
    const user = await currentUser(req);
    if (!user) return json(res, 401, { error: "Not signed in" });
    return json(res, 200, { user: { id: user.id, role: user.role, name: user.name, email: user.email } });
  }
  if (req.method === "GET" && url.pathname === "/api/me/bookings") {
    const user = await currentUser(req);
    if (!user) return json(res, 401, { error: "Please sign in to view your bookings." });
    const bookings = (await readBookings()).filter((booking) => booking.customerId === user.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return json(res, 200, { bookings });
  }
  const customerBookingMatch = url.pathname.match(/^\/api\/me\/bookings\/([^/]+)$/);
  if (req.method === "PATCH" && customerBookingMatch) {
    const user = await currentUser(req);
    if (!user) return json(res, 401, { error: "Please sign in to manage this booking." });
    const task = bookingQueue.then(async () => {
      const bookings = await readBookings();
      const booking = bookings.find((item) => item.id === customerBookingMatch[1] && item.customerId === user.id);
      if (!booking) { const error = new Error("Booking not found"); error.statusCode = 404; throw error; }
      if (booking.status === "cancelled") { const error = new Error("This booking is already cancelled."); error.statusCode = 400; throw error; }
      const priorStatus = booking.status;
      booking.status = "cancelled";
      booking.payment = { ...(booking.payment || {}), status: ["proof_submitted", "verified"].includes(booking.payment?.status) ? "refund_review" : "cancelled" };
      booking.updatedAt = new Date().toISOString();
      await writeBookings(bookings);
      await audit("booking.cancelled_by_customer", "booking", booking, { role: "customer", userId: user.id }, { priorStatus, paymentStatus: booking.payment.status });
      return booking;
    }); bookingQueue = task.catch(() => undefined);
    try { return json(res, 200, { booking: await task }); } catch (error) { return json(res, error.statusCode || 500, { error: error.message || "Cancellation failed" }); }
  }
  const customerPaymentProofMatch = url.pathname.match(/^\/api\/me\/bookings\/([^/]+)\/payment-proof$/);
  if (req.method === "POST" && customerPaymentProofMatch) {
    try {
      const user = await currentUser(req);
      if (!user) return json(res, 401, { error: "Vui lòng đăng nhập để xác nhận thanh toán." });
      const input = await readBody(req);
      const task = bookingQueue.then(async () => {
        const bookings = await readBookings();
        const booking = bookings.find((item) => item.id === customerPaymentProofMatch[1] && item.customerId === user.id);
        if (!booking) { const error = new Error("Không tìm thấy đặt chỗ."); error.statusCode = 404; throw error; }
        if (booking.status === "cancelled") { const error = new Error("Đặt chỗ đã hủy, không thể gửi thanh toán."); error.statusCode = 400; throw error; }
        const suppliedToken = Buffer.from(String(input.paymentToken || ""));
        const storedToken = Buffer.from(String(booking.paymentToken || ""));
        if (!suppliedToken.length || suppliedToken.length !== storedToken.length || !crypto.timingSafeEqual(suppliedToken, storedToken)) { const error = new Error("Phiên thanh toán không hợp lệ."); error.statusCode = 403; throw error; }
        const proofUrl = await saveUploadedImage(input.proofDataUrl, "payment-proof");
        booking.payment = { status: "proof_submitted", proofUrl, submittedAt: new Date().toISOString() };
        booking.status = "payment_submitted";
        booking.updatedAt = new Date().toISOString();
        await writeBookings(bookings);
        await audit("payment.proof_submitted", "booking", booking, { role: "customer", userId: user.id }, { proofUrl });
        return booking;
      });
      bookingQueue = task.catch(() => undefined);
      const booking = await task;
      return json(res, 201, { booking: { id: booking.id, reference: booking.reference, status: booking.status, paymentStatus: booking.payment.status } });
    } catch (error) { return json(res, error.statusCode || 500, { error: error.message || "Chưa thể tải ảnh biên lai." }); }
  }
  const receiptMatch = url.pathname.match(/^\/api\/me\/bookings\/([^/]+)\/receipt$/);
  if (req.method === "GET" && receiptMatch) {
    const user = await currentUser(req);
    const booking = user && (await readBookings()).find((item) => item.id === receiptMatch[1] && item.customerId === user.id);
    if (!booking) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Receipt not found"); }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(`<!doctype html><title>Receipt ${escapeHtml(booking.reference)}</title><style>body{font:16px system-ui;max-width:680px;margin:60px auto;padding:0 24px;color:#23271f}h1{font:42px Georgia;margin-bottom:8px}.box{border:1px solid #ddd;padding:24px;border-radius:12px;line-height:1.8}</style><h1>S.Sens Homes</h1><p>Booking receipt · ${escapeHtml(booking.reference)}</p><div class="box"><b>${escapeHtml(booking.propertyName)}</b><br>${escapeHtml(booking.checkin)} → ${escapeHtml(booking.checkout)} · ${booking.nights} night(s)<br>Guest: ${escapeHtml(booking.name)}<br>Status: ${escapeHtml(booking.status)}<br><strong>Total: ${escapeHtml(booking.total)}</strong></div><script>print()</script>`);
  }
  if (url.pathname.startsWith("/api/admin/")) {
    if (!adminAuthorized(req)) return json(res, 401, { error: "Admin password required" });
    const bookingMatch = url.pathname.match(/^\/api\/admin\/bookings\/([^/]+)$/);
    const leadMatch = url.pathname.match(/^\/api\/admin\/leads\/([^/]+)$/);
    const propertyMatch = url.pathname.match(/^\/api\/admin\/properties\/([^/]+)$/);
    try {
      if (req.method === "GET" && url.pathname === "/api/admin/content") return json(res, 200, { content: await readSiteContent() });
      if (req.method === "PATCH" && url.pathname === "/api/admin/content") {
        const input = await readBody(req); const clean = { hero: {}, contact: {}, seo: {} };
        ["eyebrow", "title", "text"].forEach(key => { if (typeof input.hero?.[key] === "string") clean.hero[key] = input.hero[key].trim().slice(0, 1000); });
        ["email", "phone", "zalo"].forEach(key => { if (typeof input.contact?.[key] === "string") clean.contact[key] = input.contact[key].trim().slice(0, 160); });
        ["homeTitle", "homeDescription", "homeImage"].forEach(key => { if (typeof input.seo?.[key] === "string") clean.seo[key] = input.seo[key].trim().slice(0, 1000); });
        if (input.payment && typeof input.payment === "object") clean.payment = {
          enabled: input.payment.enabled === true,
          bankName: String(input.payment.bankName || "").trim().slice(0, 120),
          accountNumber: String(input.payment.accountNumber || "").replace(/\s/g, "").slice(0, 40),
          accountHolder: String(input.payment.accountHolder || "").trim().slice(0, 160),
          qrImage: String(input.payment.qrImage || "").trim().slice(0, 500),
          instructions: String(input.payment.instructions || "").trim().slice(0, 1200),
          transferPrefix: String(input.payment.transferPrefix || "SSH").trim().slice(0, 24)
        };
        if (Array.isArray(input.faq)) clean.faq = input.faq.filter(item => item && typeof item.q === "string" && typeof item.a === "string").map(item => ({ q:item.q.trim().slice(0,300), a:item.a.trim().slice(0,1200) })).slice(0,12);
        let testimonials = input.testimonials;
        if (Array.isArray(testimonials) && testimonials.length === 1 && typeof testimonials[0]?.quote === "string" && testimonials[0].quote.trim().startsWith("[")) { try { testimonials = JSON.parse(testimonials[0].quote); } catch (_) {} }
        if (Array.isArray(testimonials)) clean.testimonials = testimonials.filter(item => item && typeof item.quote === "string").map(item => ({ quote:item.quote.trim().slice(0,600), name:String(item.name || "Khách hàng").trim().slice(0,100), place:String(item.place || "").trim().slice(0,100), image:String(item.image || "").trim().slice(0,500), rating:Math.min(5, Math.max(1, Number(item.rating) || 5)) })).slice(0,12);
        if (Array.isArray(input.destinations)) clean.destinations = input.destinations.filter(item => typeof item === "string" && item.trim()).map(item => item.trim().slice(0,80)).slice(0,12);
        if (input.pages && typeof input.pages === "object" && !Array.isArray(input.pages)) clean.pages = Object.fromEntries(Object.entries(input.pages).filter(([key, value]) => /^[a-z]+\.[a-zA-Z0-9]+$/.test(key) && typeof value === "string").map(([key, value]) => [key, value.trim().slice(0, 3000)]));
        const previous = await readSiteContent(); const content = { ...previous, ...clean, hero: { ...previous.hero, ...clean.hero }, contact: { ...previous.contact, ...clean.contact }, seo: { ...previous.seo, ...clean.seo } };
        await writeSiteContent(content); return json(res, 200, { content });
      }
      if (req.method === "POST" && url.pathname === "/api/admin/uploads") {
        const input = await readBody(req);
        const match = String(input.dataUrl || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
        if (!match) return json(res, 400, { error: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP" });
        const bytes = Buffer.from(match[2], "base64");
        if (!bytes.length || bytes.length > 4 * 1024 * 1024) return json(res, 400, { error: "Mỗi ảnh tối đa 4 MB" });
        const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[match[1]];
        const folder = path.join(ROOT, "assets", "uploads");
        await fsp.mkdir(folder, { recursive: true });
        const filename = Date.now() + "-" + crypto.randomBytes(4).toString("hex") + "." + extension;
        await fsp.writeFile(path.join(folder, filename), bytes);
        return json(res, 201, { url: "assets/uploads/" + filename });
      }
      if (req.method === "GET" && url.pathname === "/api/admin/bookings") {
        const bookings = await readBookings();
        return json(res, 200, { bookings: bookings.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))) });
      }
      if (req.method === "GET" && url.pathname === "/api/admin/audit-log") {
        const entries = await readAuditLog();
        return json(res, 200, { entries: entries.slice().reverse().slice(0, 200) });
      }
      if (req.method === "GET" && url.pathname === "/api/admin/leads") {
        const leads = await readLeads();
        return json(res, 200, { leads: leads.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))) });
      }
      if (req.method === "PATCH" && leadMatch) {
        const input = await readBody(req);
        const statuses = ["new", "contacted", "consulting", "held", "payment_submitted", "payment_verified", "won", "lost"];
        if (!statuses.includes(input.status)) return json(res, 400, { error: "Trạng thái yêu cầu không hợp lệ" });
        const leads = await readLeads();
        const lead = leads.find((item) => item.id === leadMatch[1]);
        if (!lead) return json(res, 404, { error: "Không tìm thấy yêu cầu" });
        lead.status = input.status; lead.updatedAt = new Date().toISOString(); await writeLeads(leads);
        return json(res, 200, { lead });
      }
      if (req.method === "PATCH" && bookingMatch) {
        const input = await readBody(req);
        if (!["pending", "payment_submitted", "payment_verified", "confirmed", "cancelled"].includes(input.status)) return json(res, 400, { error: "Invalid booking status" });
        const bookings = await readBookings();
        const booking = bookings.find((item) => item.id === bookingMatch[1]);
        if (!booking) return json(res, 404, { error: "Booking not found" });
        const priorStatus = booking.status;
        booking.status = input.status;
        if (input.status === "payment_verified") booking.payment = { ...(booking.payment || {}), status: "verified", verifiedAt: new Date().toISOString() };
        if (input.status === "confirmed") booking.confirmedAt = new Date().toISOString();
        booking.updatedAt = new Date().toISOString();
        await writeBookings(bookings);
        await audit("booking.status_changed_by_admin", "booking", booking, { role: "admin" }, { priorStatus, nextStatus: input.status });
        return json(res, 200, { booking });
      }
      if (req.method === "GET" && url.pathname === "/api/admin/properties") {
        const catalog = await mergedCatalogue();
        return json(res, 200, { properties: catalog.properties });
      }
      if (req.method === "PATCH" && propertyMatch) {
        const catalog = catalogue();
        if (!catalog.properties.some((property) => property.id === propertyMatch[1])) return json(res, 404, { error: "Property not found" });
        const input = await readBody(req);
        const patch = propertyPatch(input);
        if (!Object.keys(patch).length) return json(res, 400, { error: "No valid changes supplied" });
        const overrides = await readOverrides();
        const baseProperty = catalog.properties.find((property) => property.id === propertyMatch[1]);
        const current = { ...baseProperty, ...catalog.detailDefaults, ...(catalog.propertyDetails[propertyMatch[1]] || {}), ...(overrides[propertyMatch[1]] || {}), ...patch };
        if (Number(current.baseGuests || 2) > Number(current.guests || 0)) return json(res, 400, { error: "Số khách đã gồm trong giá không được lớn hơn số khách tối đa" });
        overrides[propertyMatch[1]] = { ...(overrides[propertyMatch[1]] || {}), ...patch };
        await writeOverrides(overrides);
        return json(res, 200, { property: current });
      }
      return json(res, 404, { error: "Not found" });
    } catch (error) {
      console.error(error);
      return json(res, 500, { error: "The admin action could not be completed" });
    }
  }
  if (req.method === "GET" && url.pathname === "/api/availability") {
    const propertyId = url.searchParams.get("propertyId");
    const bookings = await readBookings();
    const ranges = bookings.filter((b) => b.propertyId === propertyId && RESERVING_BOOKING_STATUSES.includes(b.status)).map((b) => ({ checkin: b.checkin, checkout: b.checkout, status: b.status }));
    const property = (await mergedCatalogue()).properties.find((item) => item.id === propertyId);
    const quantity = Math.max(1, Math.floor(Number(property?.quantity) || 1));
    const dates = new Set(); ranges.forEach((range) => { for (let day = range.checkin; day < range.checkout; day = nextDate(day)) dates.add(day); });
    const unavailableDates = [...dates].filter((day) => bookingCountForDay(bookings, propertyId, day) >= quantity);
    return json(res, 200, { ranges, unavailableDates, quantity });
  }
  if (req.method !== "POST" || url.pathname !== "/api/bookings") return json(res, 404, { error: "Not found" });
  try {
    const input = await readBody(req);
    const customer = await currentUser(req);
    if (!customer) return json(res, 401, { error: "Please sign in or create an account before booking." });
    const catalog = await mergedCatalogue();
    const property = catalog.properties.find((item) => item.id === input.propertyId);
    const mode = input.mode === "instant" ? "instant" : "request";
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || "");
    const phoneOk = /^[+()\d][\d\s().-]{6,}$/.test(input.phone || "");
    const nights = validDate(input.checkin) && validDate(input.checkout) ? nightsBetween(input.checkin, input.checkout) : 0;
    if (!property || !emailOk || !phoneOk || String(input.name || "").trim().length < 2 || nights < 1 || Number(input.guests) < 1 || Number(input.guests) > property.guests) return json(res, 400, { error: "Please check your booking details and try again." });

    const booking = await reserveBooking(input, property, mode, nights, catalog.config, customer);
    const emailStatus = await sendEmails(booking);
    return json(res, 201, { booking: { id: booking.id, reference: booking.reference, paymentToken: booking.paymentToken, status: booking.status, mode: booking.mode, total: booking.total }, emailStatus });
  } catch (error) {
    console.error(error);
    return json(res, error.statusCode || 500, { error: error.statusCode ? error.message : "We couldn't save your booking right now. Please try again." });
  }
}

async function serveStatic(req, res, url) {
  const relativePath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname).replace(/^[/\\]+/, "");
  const filePath = path.resolve(ROOT, relativePath);
  if (!filePath.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end("Forbidden"); }
  try {
    if (relativePath === "js/data.js") {
      const source = await fsp.readFile(filePath, "utf8");
      const overrides = await readOverrides();
      const applyOverrides = `\n;(() => { const overrides = ${JSON.stringify(overrides)}; const defaults = window.SSENS_DETAIL_DEFAULTS || {}; const details = window.SSENS_PROPERTY_DETAILS || {}; window.SSENS_PROPERTIES = (window.SSENS_PROPERTIES || []).map((property) => Object.assign({}, property, defaults, details[property.id] || {}, overrides[property.id] || {})); })();\n`;
      res.writeHead(200, { "Content-Type": MIME[".js"], "Cache-Control": "no-store" });
      return res.end(source + applyOverrides);
    }
    if (relativePath.endsWith(".html")) {
      let source = await fsp.readFile(filePath, "utf8");
      const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
      const origin = (forwardedProto || "http") + "://" + (req.headers.host || "localhost:5174");
      let title = (source.match(/<title>([\s\S]*?)<\/title>/i) || ["", "S.Sens Homes"])[1].trim();
      let description = (source.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || ["", "Căn hộ dịch vụ và không gian lưu trú được tuyển chọn tại Việt Nam."])[1];
      let image = "/assets/img/1600585154340-be6161a56a0c.jpg";
      let canonical = origin + url.pathname;
      if (relativePath === "index.html") {
        const content = await readSiteContent();
        title = content.seo?.homeTitle || title;
        description = content.seo?.homeDescription || description;
        image = content.seo?.homeImage || image;
      }
      if (relativePath === "property.html") {
        const catalog = await mergedCatalogue();
        const property = catalog.properties.find((item) => item.id === url.searchParams.get("id"));
        if (property) {
          title = property.name + " — S.Sens Homes";
          description = property.description || description;
          image = (property.images || [])[0] || image;
          canonical += "?id=" + encodeURIComponent(property.id);
        }
      }
      const imageUrl = new URL(image, origin + "/").href;
      const tags = `\n  <meta property="og:type" content="website" />\n  <meta property="og:locale" content="vi_VN" />\n  <meta property="og:title" content="${escapeHtml(title)}" />\n  <meta property="og:description" content="${escapeHtml(description)}" />\n  <meta property="og:image" content="${escapeHtml(imageUrl)}" />\n  <meta property="og:url" content="${escapeHtml(canonical)}" />\n  <meta name="twitter:card" content="summary_large_image" />\n  <meta name="twitter:title" content="${escapeHtml(title)}" />\n  <meta name="twitter:description" content="${escapeHtml(description)}" />\n  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`;
      source = source.replace("</head>", tags + "\n</head>");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(source);
    }
    const stat = await fsp.stat(filePath);
    if (stat.isDirectory()) throw new Error("Directory");
    // Local development: always serve the latest interface after a reload.
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    // Render's demo filesystem can omit static image assets at runtime. Keep the
    // public demo resilient by serving the tracked repository copy as a fallback.
    if (ASSET_FALLBACK_BASE && relativePath.startsWith("assets/img/")) {
      res.writeHead(302, { Location: ASSET_FALLBACK_BASE + "/" + relativePath });
      return res.end();
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Not found");
  }
}

loadEnv();
http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) handleApi(req, res, url);
  else serveStatic(req, res, url);
}).listen(PORT, () => console.log(`S.Sens Homes is running at http://localhost:${PORT}`));
