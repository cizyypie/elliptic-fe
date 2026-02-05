```markdown
# 🎫 Ellipticheck - Sistem Verifikasi Tiket NFT Berbasis Blockchain

## 📖 Tentang Ellipticheck

### Mengapa Ellipticheck Dibuat?

Industri tiket digital saat ini menghadapi masalah serius:

- **❌ Pemalsuan Tiket** - Tiket palsu mudah dibuat dan sulit dideteksi
- **❌ Screenshot QR Code** - QR Code dapat di-screenshot dan digunakan berulang kali
- **❌ Penggunaan Tidak Sah** - Tiket dapat digunakan oleh orang yang bukan pemilik asli
- **❌ Replay Attack** - QR Code yang sama dapat dipindai berkali-kali
- **❌ Duplikasi** - Tidak ada jaminan keunikan tiket

**Ellipticheck hadir sebagai solusi** menggunakan teknologi blockchain dan kriptografi untuk memastikan setiap tiket **asli**, **unik**, dan **hanya dapat digunakan oleh pemilik yang sah**.

---

## 🔐 Bagaimana Ellipticheck Menjamin Keamanan?

### Alur Sistem Keamanan Berlapis

```
1. PEMBELIAN TIKET
   ↓
   Tiket tercatat sebagai NFT di blockchain
   (Tidak bisa dipalsukan atau dihapus)

2. GENERATE QR CODE
   ↓
   a. Sistem membuat hash metadata tiket
   b. User menandatangani dengan ECDSA (private key)
   c. QR Code berisi: signature + public key + deadline (58 detik)
   ↓
   QR Code yang dihasilkan UNIK dan TER-ENKRIPSI

3. VERIFIKASI DI PINTU MASUK
   ↓
   a. Scan QR Code
   b. Cek apakah masih dalam deadline (58 detik)
   c. Verifikasi signature ECDSA (apakah ditandatangani pemilik sah?)
   d. Cek kepemilikan NFT di blockchain
   e. Cek apakah QR sudah pernah digunakan (digest tracking)
   ↓
   Jika SEMUA cek lolos → Tiket VALID ✅
   Jika SALAH SATU gagal → Tiket DITOLAK ❌
```

### Mengapa Ini Aman?

1. **ECDSA Signature** → Hanya pemilik private key yang dapat membuat signature valid
2. **EIP-712 Typed Data** → Data yang ditandatangani transparan dan terstruktur
3. **Deadline 58 detik** → Screenshot QR Code akan kadaluarsa
4. **Digest Tracking** → QR Code yang sama tidak bisa dipakai 2x
5. **On-Chain Verification** → Kepemilikan NFT diverifikasi langsung di blockchain

**Hasil:** Sistem yang **cryptographically secure** dan **replay-resistant**

---

## ✨ Fitur Utama

### Untuk Pembeli (Buyer)
- 🎟️ **Beli Tiket NFT** - Tiket tercatat permanen di blockchain
- 📱 **Generate QR Code Aman** - QR Code dengan tanda tangan digital ECDSA
- 🗂️ **Kelola Tiket** - Dashboard lengkap untuk semua tiket yang dimiliki
- ⏱️ **QR Code Dinamis** - Setiap QR Code berlaku 58 detik untuk keamanan maksimal

### Untuk Penyelenggara (Organizer)
- 🎪 **Buat Event** - Tambahkan acara baru dengan mudah
- 📊 **Monitor Penjualan** - Lihat tiket terjual dan revenue secara real-time
- ✅ **Verifikasi Tiket** - Scan dan validasi tiket dengan teknologi kriptografi
- 🔍 **Deteksi Penipuan** - Sistem otomatis menolak tiket palsu, expired, atau replay attack

---

## 🚀 Cara Menggunakan

### Persiapan Awal
1. Install wallet browser seperti [MetaMask](https://metamask.io/)
2. Buka aplikasi Ellipticheck di browser
3. Klik tombol **"Connect Wallet"** di pojok kanan atas
4. Approve koneksi di MetaMask

---

### 🛒 Sebagai Pembeli

#### 1. Membeli Tiket
```
a. Lihat daftar event di halaman "Buyer"
b. Klik tombol "Beli Tiket" pada event yang diinginkan
c. Confirm transaksi di wallet (bayar dengan ETH)
d. Tunggu konfirmasi blockchain (~5-10 detik)
e. Tiket NFT akan muncul di tab "Tiket Saya"
```

#### 2. Generate QR Code untuk Masuk Event
```
a. Buka tab "Tiket Saya"
b. Klik tombol "Show QR Code" pada tiket yang ingin digunakan
c. Approve signature request di wallet (GRATIS, tidak perlu bayar gas)
d. QR Code akan muncul dan berlaku selama 58 detik
e. Tunjukkan QR Code ke petugas di pintu masuk
```

⚠️ **PENTING:**
- Generate QR Code **hanya saat sudah di pintu masuk** (berlaku 58 detik)
- Jangan screenshot QR Code (akan expired dan tidak valid)
- Setiap kali generate akan menghasilkan QR Code baru yang unik

---

### 🎪 Sebagai Organizer

#### 1. Membuat Event Baru
```
a. Klik tab "Organizer" di menu atas
b. Klik tombol "Buat Event Baru"
c. Isi form:
   - Nama Event
   - Tanggal (harus tanggal masa depan)
   - Lokasi
   - Harga Tiket (dalam ETH)
   - Total Tiket Tersedia
d. Klik "Buat Event"
e. Confirm transaksi di wallet
f. Event akan muncul di daftar
```

#### 2. Monitor Penjualan
```
a. Di dashboard "Organizer", lihat card setiap event
b. Informasi yang ditampilkan:
   - Tiket terjual / Total tiket
   - Total revenue (dalam ETH)
   - Status event (Aktif/Nonaktif)
c. Klik tombol refresh untuk update data terbaru
```

#### 3. Verifikasi Tiket Pengunjung
```
a. Klik tab "Verifier" di menu atas
b. Klik tombol "Scan QR Code"
c. Izinkan akses kamera saat diminta browser
d. Arahkan kamera ke QR Code pengunjung
   (atau klik "Upload Gambar QR" untuk upload foto)
e. Sistem akan otomatis:
   - Memverifikasi signature ECDSA
   - Mengecek kepemilikan NFT
   - Mengecek apakah sudah pernah dipakai
   - Mengecek deadline
f. Hasil verifikasi akan muncul:
   - ✅ VALID → Pengunjung boleh masuk
   - ❌ INVALID → Tampilkan alasan penolakan
```

**Kemungkinan Status Penolakan:**
- ⏰ **Expired** - QR Code sudah lewat dari 58 detik
- 🚫 **Not Owner** - QR Code bukan milik pemilik NFT yang sah
- ♻️ **Already Used** - Tiket sudah pernah dipakai
- 🔁 **Replay Attack** - QR Code yang sama digunakan lagi
- ❌ **Invalid Signature** - Signature digital tidak valid

---

## 📋 Smart Contract Repository

Repository smart contract dan panduan instalasi lengkap tersedia di:

👉 **[Ellipticheck Smart Contract Repository](https://github.com/yourusername/ellipticheck-contracts)**

> **Catatan:** Untuk menjalankan sistem secara lokal (development), Anda perlu:
> 1. Clone repository smart contract
> 2. Deploy smart contract ke local blockchain (Anvil)
> 3. Update contract address di frontend
> 
> Panduan lengkap instalasi dan deployment tersedia di repository smart contract.

---

## 🛠️ Tech Stack

**Frontend:**
- React.js - UI Framework
- Viem - Ethereum interactions
- Wagmi - React Hooks for Ethereum
- RainbowKit - Wallet connection
- Tailwind CSS - Styling
- qrcode.react - QR Code generation
- qr-scanner - QR Code scanning

**Blockchain:**
- Solidity - Smart contract language
- Ethereum - Blockchain platform
- Foundry - Smart contract development & testing
- Anvil - Local Ethereum node

**Security:**
- ECDSA (secp256k1) - Digital signature algorithm
- EIP-712 - Typed structured data signing
- Keccak256 - Cryptographic hashing

---

## ⚠️ Keterbatasan Sistem & Area Improvement

Sistem Ellipticheck saat ini masih memiliki beberapa keterbatasan yang dapat dikembangkan lebih lanjut:

### 1. **Efisiensi Gas Fee**
- ❌ **Masalah:** Implementasi manual ECDSA verification di smart contract mengonsumsi gas yang tinggi
- ✅ **Solusi:** Gunakan `ecrecover` bawaan Ethereum atau library OpenZeppelin yang sudah dioptimasi

### 2. **Skalabilitas**
- ❌ **Masalah:** Belum diuji pada skala besar (ribuan tiket, ratusan event simultan)
- ✅ **Solusi:** Implementasi Layer 2 (Polygon, Arbitrum) atau optimasi smart contract

### 3. **User Experience**
- ❌ **Masalah:** User harus approve 2x saat generate QR Code (signature request + public key extraction)
- ✅ **Solusi:** Implementasi signature caching atau session-based signing

### 4. **Mobile Optimization**
- ❌ **Masalah:** Kamera QR scanner belum optimal di semua device mobile
- ✅ **Solusi:** Implementasi native mobile app atau PWA dengan native camera API

### 5. **Recovery Mechanism**
- ❌ **Masalah:** Jika user kehilangan private key, tiket hilang selamanya
- ✅ **Solusi:** Implementasi social recovery atau multi-sig wallet

### 6. **Deadline Flexibility**
- ❌ **Masalah:** Deadline 58 detik fixed, tidak bisa disesuaikan per event
- ✅ **Solusi:** Tambahkan parameter deadline yang configurable per event

### 7. **Secondary Market**
- ❌ **Masalah:** Belum ada fitur resale/transfer tiket antar user
- ✅ **Solusi:** Implementasi marketplace dengan royalty untuk organizer

### 8. **Testnet/Mainnet Deployment**
- ❌ **Masalah:** Sistem baru diuji di local blockchain (Anvil)
- ✅ **Solusi:** Deploy dan testing di testnet (Sepolia/Goerli) sebelum production

### 9. **Error Handling**
- ❌ **Masalah:** Beberapa error message masih terlalu teknis untuk end-user
- ✅ **Solusi:** Implementasi user-friendly error messages dan help tooltips

### 10. **Analytics & Reporting**
- ❌ **Masalah:** Belum ada fitur export data penjualan atau attendance report
- ✅ **Solusi:** Tambahkan dashboard analytics dan export ke CSV/PDF

---

**Catatan:** Sistem ini merupakan proof-of-concept dan penelitian akademis. Untuk penggunaan production, diperlukan audit keamanan smart contract dan testing ekstensif.

---

## 📄 Lisensi

MIT License - Bebas digunakan untuk tujuan pembelajaran dan pengembangan

---

## 👨‍💻 Kontributor

Developed as part of academic research on blockchain-based ticketing systems with cryptographic security.

---

**⚡ Ellipticheck - Secure, Transparent, Decentralized Ticketing**
```

---

```markdown
# 🎫 Ellipticheck - Blockchain-Based NFT Ticket Verification System

## 📖 About Ellipticheck

### Why Was Ellipticheck Created?

The digital ticketing industry currently faces serious problems:

- **❌ Ticket Forgery** - Fake tickets are easy to create and hard to detect
- **❌ QR Code Screenshots** - QR Codes can be screenshotted and reused multiple times
- **❌ Unauthorized Use** - Tickets can be used by non-legitimate owners
- **❌ Replay Attacks** - The same QR Code can be scanned repeatedly
- **❌ Duplication** - No guarantee of ticket uniqueness

**Ellipticheck provides a solution** using blockchain and cryptography to ensure every ticket is **authentic**, **unique**, and **only usable by legitimate owners**.

---

## 🔐 How Does Ellipticheck Guarantee Security?

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
   Generated QR Code is UNIQUE and ENCRYPTED

3. VERIFICATION AT ENTRANCE
   ↓
   a. Scan QR Code
   b. Check if still within deadline (58 seconds)
   c. Verify ECDSA signature (signed by legitimate owner?)
   d. Check NFT ownership on blockchain
   e. Check if QR has been used before (digest tracking)
   ↓
   If ALL checks pass → Ticket VALID ✅
   If ANY check fails → Ticket REJECTED ❌
```

### Why Is This Secure?

1. **ECDSA Signature** → Only private key owner can create valid signature
2. **EIP-712 Typed Data** → Signed data is transparent and structured
3. **58-second Deadline** → Screenshots will expire
4. **Digest Tracking** → Same QR Code cannot be used twice
5. **On-Chain Verification** → NFT ownership verified directly on blockchain

**Result:** A **cryptographically secure** and **replay-resistant** system

---

## ✨ Key Features

### For Buyers
- 🎟️ **Buy NFT Tickets** - Tickets permanently recorded on blockchain
- 📱 **Generate Secure QR Code** - QR Code with ECDSA digital signature
- 🗂️ **Manage Tickets** - Complete dashboard for all owned tickets
- ⏱️ **Dynamic QR Code** - Each QR Code valid for 58 seconds for maximum security

### For Organizers
- 🎪 **Create Events** - Easily add new events
- 📊 **Monitor Sales** - View tickets sold and revenue in real-time
- ✅ **Verify Tickets** - Scan and validate tickets with cryptographic technology
- 🔍 **Fraud Detection** - System automatically rejects fake, expired, or replay attack tickets

---

## 🚀 How to Use

### Initial Setup
1. Install a browser wallet like [MetaMask](https://metamask.io/)
2. Open Ellipticheck app in browser
3. Click **"Connect Wallet"** button in top right corner
4. Approve connection in MetaMask

---

### 🛒 As a Buyer

#### 1. Buying Tickets
```
a. View event list on "Buyer" page
b. Click "Buy Ticket" button on desired event
c. Confirm transaction in wallet (pay with ETH)
d. Wait for blockchain confirmation (~5-10 seconds)
e. NFT ticket will appear in "My Tickets" tab
```

#### 2. Generate QR Code for Event Entry
```
a. Open "My Tickets" tab
b. Click "Show QR Code" button on ticket you want to use
c. Approve signature request in wallet (FREE, no gas fee)
d. QR Code will appear and valid for 58 seconds
e. Show QR Code to staff at entrance
```

⚠️ **IMPORTANT:**
- Generate QR Code **only when at the entrance** (valid for 58 seconds)
- Don't screenshot QR Code (will expire and become invalid)
- Each generation creates a new unique QR Code

---

### 🎪 As an Organizer

#### 1. Creating New Event
```
a. Click "Organizer" tab in top menu
b. Click "Create New Event" button
c. Fill form:
   - Event Name
   - Date (must be future date)
   - Location
   - Ticket Price (in ETH)
   - Total Available Tickets
d. Click "Create Event"
e. Confirm transaction in wallet
f. Event will appear in list
```

#### 2. Monitor Sales
```
a. In "Organizer" dashboard, view each event card
b. Displayed information:
   - Tickets sold / Total tickets
   - Total revenue (in ETH)
   - Event status (Active/Inactive)
c. Click refresh button for latest data
```

#### 3. Verify Visitor Tickets
```
a. Click "Verifier" tab in top menu
b. Click "Scan QR Code" button
c. Allow camera access when browser prompts
d. Point camera at visitor's QR Code
   (or click "Upload QR Image" to upload photo)
e. System will automatically:
   - Verify ECDSA signature
   - Check NFT ownership
   - Check if already used
   - Check deadline
f. Verification result will appear:
   - ✅ VALID → Visitor may enter
   - ❌ INVALID → Shows rejection reason
```

**Possible Rejection Status:**
- ⏰ **Expired** - QR Code exceeded 58 seconds
- 🚫 **Not Owner** - QR Code doesn't belong to legitimate NFT owner
- ♻️ **Already Used** - Ticket has been used before
- 🔁 **Replay Attack** - Same QR Code used again
- ❌ **Invalid Signature** - Digital signature is invalid

---

## 📋 Smart Contract Repository

Smart contract repository and complete installation guide available at:

👉 **[Ellipticheck Smart Contract Repository](https://github.com/yourusername/ellipticheck-contracts)**

> **Note:** To run the system locally (development), you need to:
> 1. Clone smart contract repository
> 2. Deploy smart contract to local blockchain (Anvil)
> 3. Update contract address in frontend
> 
> Complete installation and deployment guide available in smart contract repository.

---

## 🛠️ Tech Stack

**Frontend:**
- React.js - UI Framework
- Viem - Ethereum interactions
- Wagmi - React Hooks for Ethereum
- RainbowKit - Wallet connection
- Tailwind CSS - Styling
- qrcode.react - QR Code generation
- qr-scanner - QR Code scanning

**Blockchain:**
- Solidity - Smart contract language
- Ethereum - Blockchain platform
- Foundry - Smart contract development & testing
- Anvil - Local Ethereum node

**Security:**
- ECDSA (secp256k1) - Digital signature algorithm
- EIP-712 - Typed structured data signing
- Keccak256 - Cryptographic hashing

---

## ⚠️ System Limitations & Areas for Improvement

Ellipticheck currently has several limitations that can be further developed:

### 1. **Gas Fee Efficiency**
- ❌ **Issue:** Manual ECDSA verification implementation in smart contract consumes high gas
- ✅ **Solution:** Use Ethereum's built-in `ecrecover` or optimized OpenZeppelin libraries

### 2. **Scalability**
- ❌ **Issue:** Not tested at large scale (thousands of tickets, hundreds of simultaneous events)
- ✅ **Solution:** Implement Layer 2 (Polygon, Arbitrum) or optimize smart contracts

### 3. **User Experience**
- ❌ **Issue:** Users must approve twice when generating QR Code (signature request + public key extraction)
- ✅ **Solution:** Implement signature caching or session-based signing

### 4. **Mobile Optimization**
- ❌ **Issue:** QR scanner camera not optimal on all mobile devices
- ✅ **Solution:** Implement native mobile app or PWA with native camera API

### 5. **Recovery Mechanism**
- ❌ **Issue:** If user loses private key, ticket is lost forever
- ✅ **Solution:** Implement social recovery or multi-sig wallet

### 6. **Deadline Flexibility**
- ❌ **Issue:** 58-second deadline is fixed, cannot be adjusted per event
- ✅ **Solution:** Add configurable deadline parameter per event

### 7. **Secondary Market**
- ❌ **Issue:** No resale/transfer feature between users
- ✅ **Solution:** Implement marketplace with royalty for organizers

### 8. **Testnet/Mainnet Deployment**
- ❌ **Issue:** System only tested on local blockchain (Anvil)
- ✅ **Solution:** Deploy and test on testnet (Sepolia/Goerli) before production

### 9. **Error Handling**
- ❌ **Issue:** Some error messages are too technical for end-users
- ✅ **Solution:** Implement user-friendly error messages and help tooltips

### 10. **Analytics & Reporting**
- ❌ **Issue:** No sales data export or attendance report feature
- ✅ **Solution:** Add analytics dashboard and export to CSV/PDF

---

**Note:** This system is a proof-of-concept and academic research. For production use, smart contract security audit and extensive testing are required.

---

## 📄 License

MIT License - Free to use for educational and development purposes

---

## 👨‍💻 Contributors

Developed as part of academic research on blockchain-based ticketing systems with cryptographic security.

---

**⚡ Ellipticheck - Secure, Transparent, Decentralized Ticketing**
```
