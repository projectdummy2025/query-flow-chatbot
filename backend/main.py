import os
from typing import List
from fastapi import FastAPI
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
print(f"DEBUG: BASE_URL={os.getenv('LLM_BASE_URL')}")
print(f"DEBUG: MODEL={os.getenv('LLM_MODEL')}")

from backend.src.service import stream_chat

app = FastAPI()

class ChatRequest(BaseModel):
    messages: List[dict]

@app.get("/")
def index():
    return FileResponse("frontend/index.html")

app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.post("/api/chat/stream")
def chat_stream(payload: ChatRequest):
    def event_stream():
        # Sekarang hanya mengirim messages, parameter lain dihapus
        for chunk in stream_chat(messages=payload.messages):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
