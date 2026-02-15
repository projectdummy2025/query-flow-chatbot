import os
from typing import List

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.openrouter_client import OpenRouterError, chat, stream_chat

app = FastAPI(title="Query Flow Chat")

app_origin = os.getenv("APP_ORIGIN")
if app_origin:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[app_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]


@app.get("/")
def index() -> FileResponse:
    return FileResponse("frontend/index.html")


app.mount("/static", StaticFiles(directory="frontend"), name="static")


@app.post("/api/chat")
def chat_once(payload: ChatRequest) -> dict:
    try:
        data = chat([message.model_dump() for message in payload.messages])
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {"content": content}
    except OpenRouterError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/chat/stream")
def chat_stream(payload: ChatRequest) -> StreamingResponse:
    def event_stream():
        try:
            for chunk in stream_chat([message.model_dump() for message in payload.messages]):
                yield f"data: {chunk}\n\n"
        except OpenRouterError as exc:
            yield f"data: [ERROR] {str(exc)}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
