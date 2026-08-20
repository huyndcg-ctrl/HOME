#!/usr/bin/env node
/*
 * Customer journey QA in an isolated copy of the site data.
 * It never touches the current workspace data or the public service.
 */
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fsp = require("node:fs/promises");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const testRun = new Date().toISOString().replace(/[-:.TZ]/g, "");
const results = [];

function pass(id, title, evidence) { results.push({ id, title, result: "PASS", evidence }); }
function fail(id, title, error) { results.push({ id, title, result: "FAIL", evidence: error.message || String(error) }); }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function removeSandbox(sandbox) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try { await fsp.rm(sandbox, { recursive: true, force: true }); return; }
    catch (error) { lastError = error; await sleep(150 * (attempt + 1)); }
  }
  throw lastError;
}

async function copyWorkspace(destination) {
  const entries = await fsp.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if ([".git", "node_modules", "scripts"].includes(entry.name)) continue;
    await fsp.cp(path.join(root, entry.name), path.join(destination, entry.name), { recursive: true });
  }
  await fsp.mkdir(path.join(destination, "scripts"), { recursive: true });
}

function waitForServer(port, child) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("QA server did not start in time")), 15000);
    const tryRequest = () => {
      const request = http.get(`http://127.0.0.1:${port}/api/payment-config`, (response) => {
        response.resume(); clearTimeout(timer); resolve();
      });
      request.on("error", () => {
        if (child.exitCode !== null) { clearTimeout(timer); reject(new Error(`QA server exited (${child.exitCode})`)); }
        else setTimeout(tryRequest, 150);
      });
    };
    tryRequest();
  });
}

function client(base) {
  let cookie = "";
  return {
    async request(endpoint, options = {}) {
      const response = await fetch(base + endpoint, {
        ...options,
        headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(options.headers || {}) }
      });
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) cookie = setCookie.split(";")[0];
      const text = await response.text();
      let body = {};
      try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
      return { status: response.status, body };
    }
  };
}

async function main() {
  const sandbox = await fsp.mkdtemp(path.join(os.tmpdir(), "ssens-customer-qa-"));
  const port = 47000 + Math.floor(Math.random() * 1000);
  let child;
  try {
    await copyWorkspace(sandbox);
    child = spawn(process.execPath, ["server.js"], {
      cwd: sandbox,
      env: { ...process.env, PORT: String(port), ADMIN_AUTH_DISABLED: "true", ALLOW_UNVERIFIED_SIGNUP: "true" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let serverOutput = "";
    child.stderr.on("data", (chunk) => { serverOutput += chunk; });
    await waitForServer(port, child);
    const base = `http://127.0.0.1:${port}`;
    const guest = client(base);
    const customer = client(base);
    const outsider = client(base);

    try {
      for (const page of ["/index.html", "/property.html?id=arena-seaview", "/account.html"]) {
        const response = await fetch(base + page);
        assert.equal(response.status, 200, `${page} must be available`);
      }
      pass(1, "Khách mở các trang chính", "Trang chủ, chi tiết căn và tài khoản đều trả HTTP 200.");
    } catch (error) { fail(1, "Khách mở các trang chính", error); }

    try {
      const response = await guest.request("/api/payment-config");
      assert.equal(response.status, 200); assert.equal(response.body.payment.enabled, true); assert.ok(response.body.payment.qrImage);
      pass(2, "Hiển thị QR và thông tin chuyển khoản", "Cấu hình QR/STAGING được website trả về khi khách bấm thanh toán.");
    } catch (error) { fail(2, "Hiển thị QR và thông tin chuyển khoản", error); }

    const bookingInput = { propertyId: "arena-seaview", mode: "request", checkin: "2027-08-10", checkout: "2027-08-12", guests: 2, name: "QA Customer", email: `qa-customer-${testRun}@example.test`, phone: "+84999999999", note: "Automated customer QA" };
    try {
      const response = await guest.request("/api/bookings", { method: "POST", body: JSON.stringify(bookingInput) });
      assert.equal(response.status, 401);
      pass(3, "Không đặt phòng khi chưa đăng nhập", "API chặn khách chưa đăng nhập bằng HTTP 401.");
    } catch (error) { fail(3, "Không đặt phòng khi chưa đăng nhập", error); }

    try {
      const response = await customer.request("/api/auth/register", { method: "POST", body: JSON.stringify({ name: bookingInput.name, email: bookingInput.email, password: "QaTestPass2026!" }) });
      assert.equal(response.status, 201); assert.equal(response.body.verificationRequired, false);
      pass(4, "Khách tạo tài khoản staging", "Tài khoản QA được tạo và tự đăng nhập trong chế độ staging không OTP.");
    } catch (error) { fail(4, "Khách tạo tài khoản staging", error); }

    let booking;
    try {
      const response = await customer.request("/api/bookings", { method: "POST", body: JSON.stringify(bookingInput) });
      assert.equal(response.status, 201); assert.equal(response.body.booking.status, "pending"); assert.ok(response.body.booking.paymentToken);
      booking = response.body.booking;
      pass(5, "Khách tạo yêu cầu đặt phòng", `Yêu cầu ${booking.reference} được tạo ở trạng thái chờ thanh toán.`);
    } catch (error) { fail(5, "Khách tạo yêu cầu đặt phòng", error); }

    try {
      const response = await customer.request(`/api/me/bookings/${booking.id}/payment-proof`, { method: "POST", body: JSON.stringify({ paymentToken: booking.paymentToken }) });
      assert.equal(response.status, 400);
      pass(6, "Bắt buộc tải ảnh biên lai", "Không có ảnh chứng từ bị từ chối HTTP 400.");
    } catch (error) { fail(6, "Bắt buộc tải ảnh biên lai", error); }

    try {
      const response = await customer.request(`/api/me/bookings/${booking.id}/payment-proof`, { method: "POST", body: JSON.stringify({ paymentToken: booking.paymentToken, proofDataUrl: tinyPng }) });
      assert.equal(response.status, 201); assert.equal(response.body.booking.status, "payment_submitted");
      pass(7, "Gửi biên lai chuyển khoản", "Ảnh hợp lệ được lưu; đơn chuyển sang payment_submitted.");
    } catch (error) { fail(7, "Gửi biên lai chuyển khoản", error); }

    try {
      const registered = await outsider.request("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "QA Outsider", email: `qa-outsider-${testRun}@example.test`, password: "QaTestPass2026!" }) });
      assert.equal(registered.status, 201);
      const response = await outsider.request(`/api/me/bookings/${booking.id}`, { method: "PATCH", body: "{}" });
      assert.equal(response.status, 404);
      pass(8, "Phân quyền giữa hai khách", "Tài khoản khác không thể hủy đơn của khách ban đầu.");
    } catch (error) { fail(8, "Phân quyền giữa hai khách", error); }

    try {
      const response = await customer.request("/api/me/bookings");
      const own = response.body.bookings.find((item) => item.id === booking.id);
      assert.equal(response.status, 200); assert.equal(own.status, "payment_submitted"); assert.equal(own.payment.status, "proof_submitted");
      pass(9, "Khách xem Đặt phòng của tôi", "Đơn của chính khách hiển thị kèm trạng thái đã gửi chứng từ.");
    } catch (error) { fail(9, "Khách xem Đặt phòng của tôi", error); }

    try {
      const cancelled = await customer.request(`/api/me/bookings/${booking.id}`, { method: "PATCH", body: "{}" });
      assert.equal(cancelled.status, 200); assert.equal(cancelled.body.booking.status, "cancelled"); assert.equal(cancelled.body.booking.payment.status, "refund_review");
      const availability = await guest.request("/api/availability?propertyId=arena-seaview");
      assert.equal(availability.body.unavailableDates.includes("2027-08-10"), false);
      const audit = await guest.request("/api/admin/audit-log");
      const events = audit.body.entries.filter((item) => item.entityId === booking.id).map((item) => item.event);
      assert.deepEqual(events, ["booking.cancelled_by_customer", "payment.proof_submitted", "booking.created"]);
      pass(10, "Khách hủy đơn và hệ thống đồng bộ", "Đơn cancelled, chứng từ chuyển refund_review, lịch được mở và audit log đủ 3 sự kiện.");
    } catch (error) { fail(10, "Khách hủy đơn và hệ thống đồng bộ", error); }

    const failed = results.filter((item) => item.result === "FAIL");
    console.table(results);
    console.log(JSON.stringify({ summary: { total: results.length, passed: results.length - failed.length, failed: failed.length }, scenarios: results }, null, 2));
    if (failed.length) process.exitCode = 1;
    if (serverOutput) console.error(serverOutput);
  } finally {
    if (child && child.exitCode === null) {
      await new Promise((resolve) => { child.once("exit", resolve); child.kill(); });
    }
    await removeSandbox(sandbox);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
