# 🎫 elliptiCheck - Blockchain-Based NFT Ticket Verification System
## 📖 About elliptiCheck
The digital ticketing industry currently faces serious problems:
* Ticket Forgery – Fake tickets are easy to create and hard to detect
* QR Code Screenshots – QR Codes can be screenshotted and reused multiple times
* Unauthorized Use – Tickets can be used by non-legitimate owners
* Replay Attacks – The same QR Code can be scanned repeatedly
* Duplication – No guarantee of ticket uniqueness

elliptiCheck provides a solution using blockchain and cryptography to ensure every ticket is authentic, unique, and only usable by legitimate owners.

---

## How Does elliptiCheck Ensure Security?

### Multi-Layer Security Flow

```
1. TICKET PURCHASE
   ↓
   Ticket recorded as NFT on blockchain
   (Cannot be forged or deleted)

2. QR CODE GENERATION
   ↓
   a. System creates ticket metadata hash
   b. User signs with ECDSA (private key)
   c. QR Code contains: signature + public key + deadline (58 seconds)
   ↓
   Generated QR Code is unique and encrypted

3. VERIFICATION AT ENTRANCE
   ↓
   a. Scan QR Code
   b. Check if still within deadline (58 seconds)
   c. Verify ECDSA signature (signed by legitimate owner?)
   d. Check NFT ownership on blockchain
   e. Check if QR has been used before (digest tracking)
   ↓
   If all checks pass → Ticket valid
   If any check fails → Ticket rejected
```

### Why Is This Secure?

1. ECDSA Signature – Only the private key owner can create a valid signature
2. EIP-712 Typed Data – Signed data is transparent and structured
3. 58-second Deadline – Screenshots will expire
4. Digest Tracking – The same QR Code cannot be used twice
5. On-chain Verification – NFT ownership is verified directly on-chain

Result: A cryptographically secure and replay-resistant system.

---

## Key Features

### For Buyers

* Buy NFT tickets – Tickets permanently recorded on blockchain
* Generate secure QR codes – QR codes with ECDSA digital signatures
* Manage tickets – Dashboard for all owned tickets
* Dynamic QR codes – Each QR code is valid for 58 seconds

### For Organizers

* Create events
* Monitor sales and revenue in real-time
* Verify tickets at the entrance
* Automatic fraud detection for fake, expired, or replayed tickets

---

## How to Use

### Initial Setup

1. Install a browser wallet such as MetaMask
2. Open the elliptiCheck app in your browser
3. Click the "Connect Wallet" button
4. Approve the connection in MetaMask

---

### As a Buyer

#### 1. Buying Tickets

```
a. View the event list on the Buyer page
b. Click Buy Ticket on the selected event
c. Confirm the transaction in your wallet (pay in ETH)
d. Wait for blockchain confirmation (around 5–10 seconds)
e. The NFT ticket will appear in the My Tickets tab
```

#### 2. Generate QR Code for Event Entry

```
a. Open the My Tickets tab
b. Click Show QR Code on the ticket you want to use
c. Approve the signature request in your wallet (no gas fee)
d. The QR code appears and is valid for 58 seconds
e. Show the QR code to the staff at the entrance
```

IMPORTANT:

* Generate the QR code only when you are already at the entrance
* Each generation produces a new and unique QR code

---

### As an Organizer

#### 1. Creating a New Event

```
a. Open the Organizer tab
b. Click Create New Event
c. Fill in:
   - Event name
   - Date (must be in the future)
   - Location
   - Ticket price (ETH)
   - Total available tickets
d. Click Create Event
e. Confirm the transaction in your wallet
f. The event will appear in the list
```

#### 2. Monitor Sales

```
a. Open the Organizer dashboard
b. Each event card shows:
   - Tickets sold / total tickets
   - Total revenue (ETH)
   - Event status (active / inactive)
c. Click refresh to load the latest data
```

#### 3. Verify Visitor Tickets

```
a. Open the Verifier tab
b. Click Scan QR Code
c. Allow camera access
d. Point the camera at the visitor’s QR code
   (or upload a QR image)
e. The system will:
   - verify the ECDSA signature
   - check NFT ownership
   - check whether it has been used
   - check the deadline
f. The result is displayed
```

Possible rejection reasons:

* Expired
* Not owner
* Already used
* Replay attack
* Invalid signature

---

## Smart Contract Repository

Smart contract repository and complete installation guide:

[https://github.com/cizyypie/ellipticheck-smartcontract](https://github.com/cizyypie/ellipticheck-smartcontract)

---

---

# Bahasa Indonesia

# elliptiCheck - Sistem Verifikasi Tiket NFT Berbasis Blockchain

Industri tiket digital saat ini menghadapi masalah serius:

* Pemalsuan tiket – Tiket palsu mudah dibuat dan sulit dideteksi
* Screenshot QR Code – QR Code dapat digunakan ulang
* Penggunaan tidak sah – Tiket dapat digunakan oleh bukan pemilik
* Replay attack – QR Code yang sama dapat dipindai berulang kali
* Duplikasi – Tidak ada jaminan keunikan tiket

elliptiCheck hadir sebagai solusi menggunakan teknologi blockchain dan kriptografi untuk memastikan setiap tiket asli, unik, dan hanya dapat digunakan oleh pemilik yang sah.

---

## Bagaimana elliptiCheck Menjamin Keamanan?

### Alur Sistem Keamanan Berlapis

```
1. PEMBELIAN TIKET
   ↓
   Tiket tercatat sebagai NFT di blockchain

2. GENERATE QR CODE
   ↓
   a. Sistem membuat hash metadata tiket
   b. User menandatangani dengan ECDSA
   c. QR berisi signature, public key, dan deadline (58 detik)

3. VERIFIKASI DI PINTU MASUK
   ↓
   a. Scan QR
   b. Cek deadline
   c. Verifikasi signature
   d. Cek kepemilikan NFT
   e. Cek penggunaan sebelumnya
```

Jika semua lolos, tiket valid.
Jika salah satu gagal, tiket ditolak.

---

## Mengapa Ini Aman?

1. ECDSA signature hanya dapat dibuat oleh pemilik private key
2. EIP-712 membuat data yang ditandatangani terstruktur
3. Deadline 58 detik mencegah penggunaan ulang QR
4. Digest tracking mencegah replay
5. Kepemilikan diverifikasi langsung di blockchain

---

## Fitur Utama

### Untuk Pembeli

* Membeli tiket NFT
* Generate QR code aman
* Kelola tiket melalui dashboard
* QR code bersifat dinamis (58 detik)

### Untuk Penyelenggara

* Membuat event
* Monitoring penjualan
* Verifikasi tiket
* Deteksi penipuan otomatis

---

## Cara Menggunakan

### Persiapan Awal

1. Install MetaMask
2. Buka aplikasi elliptiCheck
3. Klik Connect Wallet
4. Approve di wallet

---

### Sebagai Pembeli

#### Membeli Tiket

```
a. Buka halaman Buyer
b. Pilih event
c. Konfirmasi transaksi
d. Tunggu konfirmasi blockchain
e. Tiket muncul di tab Tiket Saya
```

#### Generate QR untuk Masuk

```
a. Buka tab Tiket Saya
b. Klik Show QR Code
c. Approve signature
d. QR berlaku 58 detik
```

Catatan:

* Generate QR hanya saat sudah di pintu masuk
* Setiap generate menghasilkan QR baru

---

### Sebagai Organizer

#### Membuat Event

```
a. Buka tab Organizer
b. Klik Buat Event Baru
c. Isi form
d. Konfirmasi transaksi
```

#### Monitoring

```
a. Buka dashboard
b. Lihat penjualan dan revenue
```

#### Verifikasi Tiket

```
a. Buka tab Verifier
b. Scan QR
c. Sistem melakukan seluruh pengecekan otomatis
```

Kemungkinan penolakan:

* Expired
* Not owner
* Already used
* Replay attack
* Invalid signature

---

## Tech Stack

Frontend:

* React
* Viem
* Wagmi
* RainbowKit
* Tailwind
* qrcode.react
* qr-scanner

Blockchain:

* Solidity
* Ethereum
* Foundry
* Anvil

Security:

* ECDSA (secp256k1)
* EIP-712
* Keccak256

---

## Lisensi

MIT License

---

elliptiCheck – Secure, transparent, decentralized ticketing system.
