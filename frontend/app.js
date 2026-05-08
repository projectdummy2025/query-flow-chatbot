const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");

const messages = [];

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<div class="role role-${role}">${role === "user" ? "You" : "AI"}</div>
                   <div class="content">${text}</div>`;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
  return div.querySelector(".content");
}

async function send() {
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = "";
  messages.push({ role: "user", content: text });
  appendMessage("user", text);

  const contentEl = appendMessage("ai", "...");
  let botText = "";

  sendBtn.disabled = true;

  try {
    const resp = await fetch("/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    if (!resp.ok) throw new Error("Gagal terhubung ke server");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    contentEl.textContent = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split("\n\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const content = line.slice(6);
          if (content === "[DONE]") break;
          if (content.startsWith("[ERROR]")) throw new Error(content);
          
          botText += content;
          contentEl.textContent = botText;
        }
      }
    }
    messages.push({ role: "assistant", content: botText });
  } catch (err) {
    contentEl.textContent = `Error: ${err.message}`;
  } finally {
    sendBtn.disabled = false;
    chatEl.scrollTop = chatEl.scrollHeight;
  }
}

sendBtn.onclick = send;
inputEl.onkeydown = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
};
