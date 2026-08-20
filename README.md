# S.Sens Homes — Website

A complete S.Sens Homes boutique-stay website (reference:
https://www.ssenshomes.com/accomodation), rebuilt from scratch with a small
Node.js booking API and no build step.

## Run it

The site is plain HTML/CSS/JS with a small Node booking server. Use this server
so real bookings, availability checks, and email delivery work.

```bash
cd ssens-homes
node server.js
# then open http://127.0.0.1:5173/index.html
```

## Public demo

Project đã có sẵn cấu hình Render. Xem hướng dẫn từng bước tại
[`PUBLIC_DEMO_DEPLOY.md`](PUBLIC_DEMO_DEPLOY.md). Bản Render hiện chỉ phù hợp
để demo vì dữ liệu CMS và booking vẫn lưu bằng file; cần chuyển sang database
cloud trước khi nhận booking thật.

For local testing, bookings are stored in `data/bookings.json`. To send actual
confirmation emails, copy `.env.example` to `.env` and set your Resend API key,
verified sender address, and owner inbox. Keep `.env` private and never publish it.

## Pages

| File            | Page                                                   |
|-----------------|--------------------------------------------------------|
| `index.html`    | Home + accommodation listing (filters, search, pagination) |
| `about.html`    | About Us                                               |
| `projects.html` | Our Project (featured stays + process)                 |
| `contact.html`  | Contact form + map                                     |

## Features

- **Booking modal** — name/email/phone validation, destination dropdown,
  check-in/out dates (checkout must be after check-in), adults (1–20) &
  children (0–20) steppers, success + error states. On submit it sends a real
  request (Telegram or email — see below).
- **Rental catalogue** — clear tabs for **Short stays** (nightly) and **Long
  stays** (monthly serviced apartments). Each card and property page displays
  an indicative price, detailed description, and stay-specific pricing table.
- **Enquiry flow** — guests select dates and guests, then send a pre-filled
  enquiry by email or WhatsApp. S.Sens confirms availability and the final
  rate manually; online payment is intentionally pending.
- **Listing** — location filter tabs (All, HCM, Hanoi, Tam Dao, Cam Ranh,
  Ho Tram), live search, pagination, hover image carousel, wishlist heart.
- **Responsive** — mobile hamburger nav, no horizontal overflow.
- **Shared header/footer** injected by JS across all pages.

## Real bookings and confirmation email

`server.js` exposes a same-origin booking API. It validates customer details,
uses the server-side property data to validate guest limits, rejects overlapping
pending/confirmed stays, and stores each booking with a reference code in
`data/bookings.json`.

For real email, copy `.env.example` to `.env`, then set a [Resend](https://resend.com)
API key and a verified sender. Each booking sends a customer confirmation and a
notification to `OWNER_EMAIL`. Without these values the booking is still saved,
but no email is sent. Never commit or upload `.env`.

## Before launch — email checklist

- [ ] Buy or use an existing domain for S.Sens Homes, then verify it in Resend
  by adding its DNS records (SPF/DKIM).
- [ ] Create a Resend API key and add `RESEND_API_KEY` plus a sender address on
  that verified domain to `.env`. This enables OTP verification for customer
  accounts and booking-confirmation emails.

## CMS / admin

Open `/admin.html` while the Node server is running to manage bookings and edit
public home content. Set `ADMIN_PASSWORD` in `.env` before deployment; without
it, the admin page is intentionally open for local development only.

## Customer accounts

Open `/account.html` to register or sign in with email and password. A customer
must be signed in before creating a booking on a property page. Their account
shows booking history, a printable receipt, and self-service cancellation.
`data/users.json` contains local development accounts and is ignored by Git.

Fees & discount thresholds also live in `SSENS_CONFIG` (`cleaningFee`,
`serviceFeePct`, `taxPct`, weekly/monthly nights + discount %). Change them once
and every quote updates.

## Editing content

All property data lives in **`js/data.js`** (`window.SSENS_PROPERTIES`). Each
listing is one object — edit prices, guests, beds/baths, images, etc. there and
every page updates. This is where you'd paste rows from your spreadsheet. The
nightly base rate used by the price engine is each property's `priceMin`.

Images are downloaded locally under `assets/img/` so the site renders offline
and never depends on a remote host.

## Structure

```
ssens-homes/
├── index.html  about.html  projects.html  contact.html  property.html
├── css/style.css           # full design system
├── js/data.js              # property data + SSENS_CONFIG (edit here)
├── js/booking-engine.js    # calendar + price quote + unavailable-date handling
├── js/main.js              # header/footer, booking modal, listing engine
├── server.js               # booking API, availability API, Resend email adapter
├── admin.html              # internal CMS for bookings and home content
├── .env.example            # email configuration template (no secrets)
├── data/bookings.json      # local booking storage (ignored by Git)
└── assets/img/             # local images
```
