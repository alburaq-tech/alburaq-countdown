# Google Form: Pengumpulan Credentials & Digital Assets Perusahaan

> Spesifikasi form untuk dibuat di Google Forms. Setiap section sesuai dengan section di Google Forms.

---

## Form Settings

- **Title:** Pengumpulan Credentials & Digital Assets Perusahaan
- **Description:** Form ini untuk mengumpulkan data akun, akses, dan aset digital perusahaan yang dikelola oleh tim Anda. Mohon isi dengan lengkap dan akurat. Data ini bersifat rahasia dan hanya digunakan untuk keperluan inventaris internal.
- **Require sign-in:** Ya (batasi hanya akun organisasi)
- **Limit to 1 response:** Tidak (tim bisa mengisi berkali-kali untuk aset berbeda)

---

## Section 1 — Informasi Pengisi

| #   | Field            | Tipe       | Required | Note                                    |
| --- | ---------------- | ---------- | -------- | --------------------------------------- |
| 1   | Nama Lengkap     | Short text | Ya       |                                         |
| 2   | Divisi / Tim     | Short text | Ya       | Contoh: Marketing, Engineering, Finance |
| 3   | Email Perusahaan | Short text | Ya       |                                         |
| 4   | Nomor Telepon    | Short text | Tidak    |                                         |

---

## Section 2 — Detail Aset / Credential

| #   | Field                      | Tipe            | Required | Note                                                                                                                                       |
| --- | -------------------------- | --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 5   | Nama Aset / Akun           | Short text      | Ya       | Contoh: "Instagram @perusahaan", "AWS Production", "Domain company.co.id"                                                                  |
| 6   | Kategori                   | Dropdown        | Ya       | Lihat opsi di bawah                                                                                                                        |
| 7   | URL / Alamat Akses         | Short text      | Ya       | URL login, dashboard, atau alamat akses. Contoh: https://app.platform.com                                                                  |
| 8   | Deskripsi Singkat          | Paragraph       | Tidak    | Jelaskan kegunaan aset ini untuk perusahaan                                                                                                |
| 9   | Email Akun yang Terdaftar  | Short text      | Ya       | Email yang digunakan untuk mendaftar/login                                                                                                 |
| 9b  | Password / API Key         | Paragraph       | Tidak    | Isi password atau API key. Data ini akan dipindahkan ke vault setelah dikumpulkan                                                          |
| 10  | Nama Pemilik Akun (PIC)    | Short text      | Ya       | Orang yang bertanggung jawab atas akun ini                                                                                                 |
| 11  | Email PIC                  | Short text      | Ya       |                                                                                                                                            |
| 12  | Status Akses Saat Ini      | Dropdown        | Ya       | Lihat opsi di bawah                                                                                                                        |
| 13  | Apakah ada 2FA aktif?      | Multiple choice | Ya       | Ya / Tidak / Tidak tahu. 2FA = Two-Factor Authentication, verifikasi tambahan selain password (misal: kode SMS, Google Authenticator, dll) |
| 13b | Kontak Pemegang 2FA        | Short text      | Tidak    | Nama & kontak orang yang menerima OTP/code. Muncul jika #13 = Ya                                                                           |
| 14  | Tanggal Expired (jika ada) | Date            | Tidak    | Untuk domain, SSL, lisensi, dll                                                                                                            |
| 15  | Biaya Langganan (jika ada) | Short text      | Tidak    | Format: Rp xxx.xxx / bulan OR tahun                                                                                                        |
| 16  | Metode Pembayaran          | Dropdown        | Tidak    | Lihat opsi di bawah                                                                                                                        |
| 17  | Catatan Tambahan           | Paragraph       | Tidak    | Info penting lain yang perlu diketahui                                                                                                     |

### Dropdown "Kategori" — Opsi:

1. Domain & DNS
2. Hosting / Server
3. SSL Certificate
4. Cloud Services (AWS/GCP/Azure)
5. SaaS / Subscription Tools (Jira, Figma, dll)
6. Email & Communication (Google Workspace, Slack, dll)
7. Social Media
8. Payment & Financial (Midtrans, Stripe, dll)
9. Development / Repository (GitHub, GitLab, dll)
10. Aplikasi Internal
11. API & Integrasi
12. Lainnya

### Dropdown "Status Akses Saat Ini" — Opsi:

1. Aktif — digunakan rutin
2. Aktif — jarang digunakan
3. Expired / Perlu perpanjangan
4. Tidak aktif tapi perlu di-retain
5. Tidak tahu statusnya

### Dropdown "Metode Pembayaran" — Opsi:

1. Kartu Kredit Perusahaan
2. Kartu Debit Perusahaan
3. Rekening Korporat
4. Kartu Pribadi (reimburse)
5. Gratis / Tidak ada biaya
6. Tidak tahu

---

## Section 3 — Penyimpanan Credential

| # | Field | Tipe | Required | Note |
|---|-------|------|----------|------|
| 18 | Dimana credential (username/password) disimpan? | Multiple choice | Ya | Lihat opsi di bawah |
| 19 | Jika "Lainnya", sebutkan di mana | Short text | Tidak | Muncul jika jawaban #18 = Lainnya |
| 20 | Siapa yang memiliki akses ke credential ini? | Paragraph | Tidak | Sebutkan nama atau peran. Contoh: "Tim Dev lead - Budi, Andi" |

### Multiple choice "Penyimpanan Credential" — Opsi:

1. Password Manager Perusahaan (1Password / Bitwarden / dll)
2. Spreadsheet / Dokumen Internal
3. Email (dikirim via email)
4. Hafalan PIC saja (tidak tersimpan di mana pun)
5. Lainnya

---

## Section 4 — Konfirmasi

| # | Field | Tipe | Required | Note |
|---|-------|------|----------|------|
| 21 | Saya menyatakan data yang saya isi adalah benar | Checkbox | Ya | |
| 22 | Saya bersedia dihubungi jika ada pertanyaan lanjutan | Checkbox | Ya | |

---

## Tips Pembuatan di Google Forms

1. **Aktifkan "Require sign-in"** agar hanya akun organisasi yang bisa mengisi
2. **Jangan aktifkan "Limit to 1 response"** — tim bisa punya banyak aset
3. **Tambahkan section logic:** setelah Section 2, tampilkan opsi "Apakah ada aset lain yang ingin dilaporkan?" (Ya/Kembali ke Section 2 / Selesai)
4. **Set response spreadsheet** ke folder Google Drive yang terbatas aksesnya
5. **Aktifkan email notification** untuk setiap response baru
6. **Hapus data dari spreadsheet segera setelah dipindahkan ke vault** — jangan biarkan password tersimpan lama di spreadsheet