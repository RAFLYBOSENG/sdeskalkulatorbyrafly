# Simplified-DES-Calculator v2

Versi kedua dari proyek ini dibuat dengan Python dan Flask, dengan tampilan GUI yang mengikuti versi web sebelumnya.

## Struktur

- `app.py`: aplikasi Flask.
- `sdes.py`: implementasi algoritma S-DES.
- `templates/index.html`: tampilan GUI.
- `requirements.txt`: dependensi Python.

## Cara pakai

1. Install dependensi.

```bash
pip install -r requirements.txt
```

2. Jalankan aplikasinya.

```bash
python app.py
```

3. Buka `http://127.0.0.1:5000` di browser.

CLI tetap tersedia jika ingin dipakai langsung:

```bash
python sdes.py encrypt 10101010 1010000010
python sdes.py decrypt 00100100 1010000010
```