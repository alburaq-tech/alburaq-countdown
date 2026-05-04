Flow Lengkap: Notifikasi "ADMINISTRASI CLOSING"

1. Entry Point: API Endpoint /api/upload_payment

File: addons/umrah-api/controllers/quotation_api.py:999

@http.route('/api/upload_payment', type='http', auth='public', methods=['POST'], csrf=False, cors="*")
def upload_payment(self, **kwargs):

Endpoint ini dipanggil oleh frontend (halaman checkout publik) saat customer/CS mengklik tombol upload bukti pembayaran. Data yang dikirim via form POST:
- quotationId — ID quotation
- paymentProof — file bukti bayar (gambar/PDF)
- fullName, phone, email — data lead
- productDefaultCode — kode produk paket umrah
- jumlahBayar — nominal yang dibayar
- totalBayar — total tagihan
- tahapan_pembayaran — tahapan (default: "Jamaah DP")
- saleOrderLine[i][...] — detail baris sale order
- addonsNote — catatan tambahan

2. Proses di dalam upload_payment (line 1000-1220)

Secara berurutan:

1. Parse form data (line 1000-1018) — ambil semua field dari request
2. Lock quotation via SELECT ... FOR UPDATE NOWAIT (line 1400-1428) — mencegah double payment
3. Kumpulkan data jamaah (line 1050-1068) — loop semua umrah.quotation.jamaah yang terkait, termasuk data room assignment
4. Upload bukti bayar ke MinIO (line 1073) — general_api.upload_file_to_minio(paymentFile) → dapat URL file
5. Update harga sale order lines (line 1094-1121) — sesuaikan harga per line berdasarkan input frontend
6. Build payload untuk Jurnal Mekari (line 1147-1173) — susun data lengkap: quotation info, jamaah list, nominal, bukti bayar, dll.
7. Kirim ke API Finance (line 1177-1202) — POST ke {api_url}/finance/create-bill (atau bypass jika mode dev)
8. Jika response SUCCESS (line 1205):
- Update quotation: state = "uploaded", simpan payment_file_url dan jurnal_sales_order_id
- Panggil _save_closing_wa_message() ← ini yang memicu notifikasi

3. Method _save_closing_wa_message (line 1430-1457)

def _save_closing_wa_message(self, quotation, lead_phone, total_bayar, jumlah_bayar,
                            tahapan_pembayaran, jamaah_list, note, so_no, payment_file_url=None):

Method ini menyusun payload berisi:
- quotation_no, title ("ADMINISTRASI CLOSING")
- phone — diisi dari umrah.wa.id_groupwa_pasca_closing (config parameter = ID grup WA administrasi), BUKAN nomor customer
- name, kota — dari lead
- total_tagihan, jumlah_bayar, diskon
- so_no — Sales Order ID dari Jurnal Mekari
- jamaah — list semua jamaah dengan info room
- catatan, owner_cs, name_cs
- payment_file_url — URL bukti bayar di MinIO

Lalu memanggil:
wa_closing_message.save_admin_closing_message(request.env, payload)

4. Helper save_admin_closing_message (file: addons/umrah-api/helpers/wa_closing_message.py:66)

Fungsi ini melakukan 2 hal:

a) Build pesan teks via build_admin_closing_message(payload) (line 11-63):
*ADMINISTRASI CLOSING*

📇 *No Quotation:* QT-001
📇 *Nama Lead:* Ahmad
📱 *No HP:* 08123456
📍 *Kota:* Jakarta
🧾 *Quotes No:* QT-001
📦 *SO No:* SO-123
👥 *Jml Jamaah:* 3
🎯 *Produk:* UMR-REG-2026
💳 *Tahapan:* Jamaah DP
💰 *Tagihan:* Rp 25.000.000
🎟 *Diskon:* Rp 1.000.000   ← (hanya jika > 0)
✅ *Bayar:* Rp 10.000.000

🧑 *Jamaah:*
- Ahmad (Laki-laki) (Kamar: 201, Lt. 2)
- Fatimah (Perempuan) (Wait List)

📝 *Catatan:*
Request vegetarian

👩‍💼 *CS Owner:* Rina
👨‍🏫 *CS Onsite:* Budi

b) Simpan ke database — env['umrah.whatsapp.message'].sudo().create_from_upload_payment(values) yang membuat record di model umrah.whatsapp.message dengan state
draft.

5. Model umrah.whatsapp.message (file: addons/umroh_core/models/wa_closing_message.py)

Record disimpan dengan field:
- title = "ADMINISTRASI CLOSING"
- quotation_no, target_phone, content (pesan lengkap)
- quotation_id (relasi ke quotation)
- state = "draft"
- payment_file_url (link bukti bayar)

Model ini juga punya method action_resend_wa_message() (line 57-94) yang bisa dipanggil manual dari Odoo backend untuk kirim ulang pesan via WA.

6. Pengiriman WA Sebenarnya via send_whatsapp_notification

File: addons/umroh_core/helpers/general_api.py:246

Fungsi send_whatsapp_notification() mengirim HTTP POST ke WA Gateway API (umrah.wa.api_url dari config) dengan payload:
{
    "user_id": "118",
    "message": "<isi pesan ADMINISTRASI CLOSING>",
    "phone": "<ID grup WA pasca closing>",
    "is_group": 1,
    "attachment_url": "<URL bukti bayar di MinIO>"  // jika ada
}

Target pengiriman: Grup WhatsApp "Pasca Closing" (ID-nya disimpan di config param umrah.wa.id_groupwa_pasca_closing).

---
Ringkasan Flow (Diagram)

Frontend (Halaman Checkout)
│
▼ POST /api/upload_payment (form data + file bukti bayar)
│
├─ 1. Parse form data
├─ 2. Lock quotation (FOR UPDATE)
├─ 3. Kumpulkan data jamaah + room
├─ 4. Upload bukti bayar → MinIO → dapat URL
├─ 5. Update harga sale order lines
├─ 6. POST ke Jurnal Mekari API (create-bill)
│
▼ Jika Jurnal response SUCCESS:
│
├─ 7. Update quotation (state=uploaded)
├─ 8. _save_closing_wa_message()
│     ├─ build_admin_closing_message() → susun teks pesan
│     ├─ save ke DB (umrah.whatsapp.message, state=draft)
│     └─ (record tersimpan untuk resend nanti)
│
└─ 9. [Terpisah] action_resend_wa_message() / send_whatsapp_notification()
        └─ POST ke WA Gateway API
            └─ Pesan "ADMINISTRASI CLOSING" muncul di Grup WA Pasca Closing

Catatan penting: Pada flow upload_payment, pesan hanya disimpan ke DB (state=draft). Pengiriman aktual ke WA terjadi via action_resend_wa_message() yang bisa
dipanggil manual dari backend Odoo, atau mungkin ada cron/trigger lain yang mengirimnya. Ada juga banyak tempat lain yang memanggil wa_closing_message.save_message()
secara langsung (dari controller umrah_readiness, public_quotation, connecting_flight, document_letter, dan model quotation_refund) — ini untuk notifikasi WA tipe
lain (bukan khusus "ADMINISTRASI CLOSING").