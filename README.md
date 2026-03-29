# ImpactLinks: Golf Charity Subscription Platform

A **subscription-driven full-stack web application** that blends **golf performance tracking, charity fundraising, and a reward-based draw system**.
---

## 🎯 Project Overview

ImpactLinks transforms **Stableford golf scores** into **charitable contributions and reward opportunities**.

* Users log scores → enter monthly draw
* A portion of subscription → goes to charity
* Remaining pool → distributed among winners

---

## ✨ Core Features

### 👤 For Subscribers

* **Subscription Gatekeeper**

  * Monthly / Yearly plans
  * Paywall for non-subscribers

* **Rolling 5 Score System**

  * Accepts scores (1–45)
  * Maintains only latest 5 entries
  * Automatically removes oldest score

* **Charity Contribution Engine**

  * Minimum 10% mandatory donation
  * Adjustable contribution via slider

* **Winnings Vault**

  * Upload scorecard proof
  * Track status:
    * Pending → Paid

---

### 🛠️ For Admins

* **Draw Engine**

  * Random draw OR
  * Algorithmic weighted draw (based on score frequency)

* **Prize Pool Distribution**

  * 5 matches → 40%
  * 4 matches → 35%
  * 3 matches → 25%
  * Jackpot rollover supported

* **Winner Verification System**

  * Review uploaded proofs
  * Approve / Reject payouts

* **Charity Management**

  * Full CRUD for charities
  * Image gallery support
  * Event listings

---

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router)
* **Styling:** Tailwind CSS
* **Backend & DB:** Supabase (PostgreSQL)
* **Authentication:** Supabase Auth
* **Storage:** Supabase Storage

---

##  Getting Started

### 📦 Prerequisites

* Node.js
* Supabase Project

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/impactlinks.git
cd impactlinks
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Environment Variables

Create `.env.local` in root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Payment (Test Mode)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

# Optional
RESEND_API_KEY=your_key
```

---

### 4️⃣ Database Setup (Supabase)

Run SQL scripts to create:

* profiles
* subscriptions
* golf_scores
* charities
* charity_images
* draws
* winnings

Create storage buckets:

* `charity-images`
* `winner-proofs`

---

### 5️⃣ Run the App

```bash
npm run dev
```

Open:
👉 http://localhost:3000

---
