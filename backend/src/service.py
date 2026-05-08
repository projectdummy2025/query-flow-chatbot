import os, httpx, json
from typing import Generator

class GeminiError(RuntimeError): pass

def stream_chat(messages) -> Generator[str, None, None]:
    # Konfigurasi murni untuk Gemini
    url = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai").rstrip("/")
    key = os.getenv("GEMINI_API_KEY", "")
    mdl = os.getenv("GEMINI_MODEL")

    if not key:
        yield "[ERROR] GEMINI_API_KEY belum diisi di file .env."
        return

    full_url = f"{url}/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {key}",
        "x-goog-api-key": key
    }

    payload = {
        "model": mdl, 
        "messages": messages, 
        "stream": True, 
        "temperature": float(os.getenv("TEMPERATURE", 0.7)),
        "max_tokens": int(os.getenv("MAX_TOKENS", 2048))
    }
    
    try:
        with httpx.stream("POST", full_url, headers=headers, json=payload, timeout=60.0) as resp:
            if resp.status_code >= 400:
                error_detail = resp.read().decode()
                raise GeminiError(f"Google API Error {resp.status_code}: {error_detail}")
            
            for line in resp.iter_lines():
                if not line.startswith("data: "): continue
                data = line[6:].strip()
                if data == "[DONE]": break
                
                try:
                    chunk = json.loads(data)
                    content = chunk["choices"][0]["delta"].get("content")
                    if content: yield content
                except: continue
    except Exception as e:
        yield f"[ERROR] Gemini Connection Error: {str(e)}"
