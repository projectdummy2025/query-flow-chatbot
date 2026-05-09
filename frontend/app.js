const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");

const messages = [];

// Configure marked.js for better rendering
marked.setOptions({
    breaks: true,   // Convert '\n' to <br>
    gfm: true,      // GitHub Flavored Markdown
    headerIds: false,
    mangle: false
});

// Auto-expand textarea (grows upward, starts single-line)
inputEl.addEventListener('input', () => {
    inputEl.style.height = '36px'; // Reset to base first
    inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + 'px';
});

function appendMessage(role, text) {
    const wrapper = document.createElement("div");
    wrapper.className = `msg-wrapper ${role}`;
    
    const roleLabel = role === 'user' ? 'Anda' : 'Query Flow';
    
    const content = role === 'ai' && text !== '...' ? marked.parse(text) : text;
    const avatar = role === 'user' ? 'A' : 'QF';

    wrapper.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div class="msg ${role}">
            <div class="role-label">${roleLabel}</div>
            <div class="content">${content}</div>
        </div>
    `;
    
    chatEl.appendChild(wrapper);
    
    // Animation using Motion One
    if (window.motion) {
        window.motion.animate(
            wrapper,
            { opacity: [0, 1], y: [20, 0], scale: [0.95, 1] },
            { duration: 0.5, easing: [0.16, 1, 0.3, 1] }
        );
    }
 else {
        wrapper.style.opacity = "1";
        wrapper.style.transform = "translateY(0)";
    }
    
    scrollToBottom();
    
    // Highlight code and add copy buttons
    if (window.Prism) {
        Prism.highlightAllUnder(wrapper);
        addCopyButtons(wrapper);
    }
    
    return wrapper.querySelector(".content");
}

function addCopyButtons(container) {
    const codeBlocks = container.querySelectorAll('pre');
    codeBlocks.forEach(block => {
        if (block.querySelector('.copy-btn')) return;
        
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.innerHTML = 'Copy';
        btn.onclick = () => {
            const code = block.querySelector('code').innerText;
            navigator.clipboard.writeText(code).then(() => {
                btn.innerHTML = 'Copied!';
                setTimeout(() => btn.innerHTML = 'Copy', 2000);
            });
        };
        block.style.position = 'relative';
        block.appendChild(btn);
    });
}

function scrollToBottom() {
    chatEl.scrollTop = chatEl.scrollHeight;
}

async function send() {
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = "";
    inputEl.style.height = '36px'; // Reset to single-line
    
    messages.push({ role: "user", content: text });
    appendMessage("user", text);

    // Show loading state/placeholder for AI
    const contentEl = appendMessage("ai", '<div class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>');
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
        contentEl.innerHTML = ""; // Clear typing indicator

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunks = decoder.decode(value, { stream: true }).split("\n\n");
            for (const line of chunks) {
                if (line.startsWith("data: ")) {
                    const content = line.slice(6).trim();
                    if (content === "[DONE]") break;
                    if (content.startsWith("[ERROR]")) throw new Error(content.replace("[ERROR]", ""));
                    
                    botText += content;
                    
                    // Render markdown and force it to be balanced
                    contentEl.innerHTML = marked.parse(botText);
                    
                    if (window.Prism) {
                        Prism.highlightAllUnder(contentEl);
                    }
                    scrollToBottom();
                }
            }
        }
        messages.push({ role: "assistant", content: botText });
    } catch (err) {
        contentEl.innerHTML = `
            <div style="color: #ef4444; display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                ${err.message.includes('Failed to fetch') ? 'Gagal terhubung ke server. Pastikan backend berjalan.' : err.message}
            </div>
        `;
    } finally {
        sendBtn.disabled = false;
        scrollToBottom();
    }
}

sendBtn.onclick = send;
inputEl.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
    }
};
