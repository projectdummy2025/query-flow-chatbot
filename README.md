# Query Flow Chat

Chatbot sederhana yang difokuskan sepenuhnya menggunakan Google Gemini API.
Backend menggunakan FastAPI (Python) dan frontend menggunakan HTML + JavaScript murni.

## Fitur Utama

- **Streaming Response**: Jawaban muncul secara real-time.
- **Gemini Focused**: Dioptimalkan khusus untuk model Gemini (Flash, Pro, Lite).
- **Simple & Fast**: Tanpa konfigurasi provider yang rumit.

## Persiapan

1. Salin `.env.example` menjadi `.env`.
2. Masukkan `GEMINI_API_KEY` Anda.
3. Instal dependensi:
   ```bash
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```

## Cara Menjalankan

```bash
uvicorn backend.main:app --reload
```

Buka `http://localhost:8000` di browser Anda.

## Konfigurasi

Semua pengaturan model dan API key dikelola melalui file `.env`.
