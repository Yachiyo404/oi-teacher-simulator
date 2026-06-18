#!/usr/bin/env python3
"""
Session Rename Manager - Graphical session management tool.
Run: python3 session-manager.py
Open: http://127.0.0.1:18790
"""
import json
import os
import shutil
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 18790
SESSION_PATH = os.path.expanduser("~/.openclaw/agents/main/sessions/sessions.json")

HTML = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>对话管理</title>
<style>
  :root {
    --bg: #1a1a2e;
    --card: #16213e;
    --accent: #e94560;
    --text: #eee;
    --muted: #888;
    --border: #2a2a4a;
    --hover: #1e2a4a;
    --green: #2ecc71;
    --input-bg: #0f0f23;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
  }
  .container { max-width: 900px; width: 100%; }
  h1 { font-size: 1.8rem; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
  h1 .icon { font-size: 2rem; }
  .subtitle { color: var(--muted); margin-bottom: 32px; font-size: 0.95rem; }
  .search-bar { display: flex; gap: 12px; margin-bottom: 24px; }
  .search-bar input {
    flex: 1; background: var(--input-bg); border: 1px solid var(--border);
    color: var(--text); padding: 10px 16px; border-radius: 10px; font-size: 0.95rem;
  }
  .search-bar input:focus { outline: none; border-color: var(--accent); }
  .session-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 16px 20px; margin-bottom: 12px; display: flex; align-items: center;
    gap: 16px; transition: all 0.2s;
  }
  .session-card:hover { border-color: var(--accent); background: var(--hover); }
  .session-info { flex: 1; min-width: 0; }
  .session-label { font-size: 1.1rem; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
  .session-label .name { color: var(--text); word-break: break-all; }
  .session-label .badge { font-size: 0.7rem; background: var(--accent); color: white; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
  .session-key { font-size: 0.78rem; color: var(--muted); font-family: 'SF Mono', 'Fira Code', monospace; word-break: break-all; }
  .session-meta { font-size: 0.75rem; color: var(--muted); margin-top: 6px; display: flex; gap: 16px; flex-wrap: wrap; }
  .rename-group { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
  .rename-group input {
    background: var(--input-bg); border: 1px solid var(--border); color: var(--text);
    padding: 8px 12px; border-radius: 8px; font-size: 0.9rem; width: 180px; transition: border-color 0.2s;
  }
  .rename-group input:focus { outline: none; border-color: var(--accent); }
  .btn { padding: 8px 16px; border: none; border-radius: 8px; font-size: 0.85rem; cursor: pointer; font-weight: 500; transition: all 0.2s; white-space: nowrap; }
  .btn-save { background: var(--accent); color: white; }
  .btn-save:hover { opacity: 0.85; }
  .btn-clear { background: transparent; border: 1px solid var(--border); color: var(--muted); }
  .btn-clear:hover { border-color: var(--accent); color: var(--accent); }
  .btn-delete { background: transparent; border: 1px solid var(--border); color: var(--muted); }
  .btn-delete:hover { border-color: #e74c3c; color: #e74c3c; }
  .btn-delete:disabled { opacity: 0.3; cursor: not-allowed; }
  .btn-lock { background: transparent; border: 1px solid var(--border); color: var(--muted); }
  .btn-lock:hover { border-color: #f1c40f; color: #f1c40f; }
  .btn-lock.locked { background: rgba(241,196,15,0.15); border-color: #f1c40f; color: #f1c40f; }
  .lock-badge { font-size: 0.7rem; background: #f1c40f; color: #000; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
  .session-card.locked { border-color: rgba(241,196,15,0.3); }
  .rename-group input:disabled { opacity: 0.4; cursor: not-allowed; }
  .rename-group .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
  .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .confirm-box { background: var(--card); border: 1px solid var(--accent); border-radius: 14px; padding: 28px 32px; max-width: 420px; width: 90%; }
  .confirm-box h3 { margin-bottom: 12px; font-size: 1.1rem; }
  .confirm-box p { color: var(--muted); font-size: 0.9rem; margin-bottom: 20px; }
  .confirm-box .actions { display: flex; gap: 10px; justify-content: flex-end; }
  .confirm-box .btn-cancel { background: transparent; border: 1px solid var(--border); color: var(--text); }
  .confirm-box .btn-danger { background: #e74c3c; color: white; border: none; }
  .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: var(--green); color: #000; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; z-index: 999; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
  .toast.show { opacity: 1; }
  .empty { text-align: center; color: var(--muted); padding: 60px 0; }
</style>
</head>
<body>
<div class="toast" id="toast"></div>
<div class="container">
  <h1><span class="icon">🏷️</span> 对话管理</h1>
  <p class="subtitle">重命名、删除 OpenClaw 会话</p>
  <div class="search-bar">
    <input type="text" id="search" placeholder="搜索会话..." oninput="render()">
  </div>
  <div id="session-list"></div>
</div>
<script>
let sessions = {};
let sessionKeys = [];

async function load() {
  try { const res = await fetch('/api/list'); const data = await res.json(); sessions = data.sessions; sessionKeys = data.order; } catch(e) { console.error(e); }
  render();
}

function fmtTime(ts) {
  if (!ts) return '?';
  const d = new Date(ts), now = new Date(), diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff/60000) + ' 分钟前';
  if (diff < 86400000) return Math.floor(diff/3600000) + ' 小时前';
  if (diff < 604800000) return Math.floor(diff/86400000) + ' 天前';
  return d.toLocaleDateString('zh-CN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
}

function esc(s) { const div = document.createElement('div'); div.textContent = s; return div.innerHTML; }

function render() {
  const search = (document.getElementById('search').value || '').toLowerCase();
  const container = document.getElementById('session-list');
  let filtered = sessionKeys.filter(k => {
    const label = (sessions[k]?.label || '').toLowerCase();
    return !search || k.toLowerCase().includes(search) || label.includes(search);
  });
  if (!filtered.length) { container.innerHTML = '<div class="empty">没有匹配的会话 📭</div>'; return; }
  container.innerHTML = filtered.map(k => {
    const s = sessions[k], label = s.label || '';
    const shortKey = k.length > 80 ? k.slice(0, 80) + '...' : k;
    let kindBadge = '';
    if (k.includes('dashboard')) kindBadge = '<span class="badge">WebChat</span>';
    else if (k.endsWith('main')) kindBadge = '<span class="badge">Main</span>';
    const isLocked = !!s.locked;
    const lockBadge = isLocked ? '<span class="lock-badge">🔒 已锁定</span>' : '';
    const clearBtn = label && !isLocked ? `<button class="btn btn-clear" onclick="clearLabel('${k}')">清除</button>` : '';
    const deleteBtn = isLocked
      ? `<button class="btn btn-delete" disabled title="已锁定，无法删除" style="opacity:0.3;cursor:not-allowed">🗑</button>`
      : `<button class="btn btn-delete" onclick="confirmDelete('${k}', this)">🗑</button>`;
    const lockBtn = isLocked
      ? `<button class="btn btn-lock locked" onclick="toggleLock('${k}')" title="解锁">🔒</button>`
      : `<button class="btn btn-lock" onclick="toggleLock('${k}')" title="锁定">🔓</button>`;
    return `
      <div class="session-card${isLocked ? ' locked' : ''}">
        <div class="session-info">
          <div class="session-label">
            <span class="name">${label ? esc(label) : '<i style="color:var(--muted)">未命名</i>'}</span>
            ${kindBadge} ${lockBadge}
          </div>
          <div class="session-key">${esc(shortKey)}</div>
          <div class="session-meta">
            <span>🕐 ${s.updated ? fmtTime(s.updated) : '?'}</span>
            <span>📝 ${(s.tokens || 0).toLocaleString()} tokens</span>
          </div>
        </div>
        <div class="rename-group">
          <input type="text" id="input-${k}" value="${esc(label)}" placeholder="输入名称..." onkeydown="if(event.key==='Enter') rename('${k}')" ${isLocked ? 'disabled' : ''}>
          <button class="btn btn-save" onclick="rename('${k}')" ${isLocked ? 'disabled' : ''}>保存</button>
          ${clearBtn}
          ${deleteBtn}
          ${lockBtn}
        </div>
      </div>`;
  }).join('');
}

async function rename(key) {
  const name = document.getElementById('input-' + key).value.trim();
  if (!name) return;
  const res = await fetch('/api/rename', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({key, label: name}) });
  if (res.ok) { toast(`✅ 已重命名为 "${name}"`); await load(); } else { toast('❌ 重命名失败'); }
}

async function clearLabel(key) {
  const res = await fetch('/api/clear', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({key}) });
  if (res.ok) { toast('✅ 已清除标签'); await load(); } else { toast('❌ 清除失败'); }
}

function confirmDelete(key, btn) {
  if (btn.disabled) return;
  const label = sessions[key]?.label || key.slice(-12);
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `<div class="confirm-box"><h3>🗑️ 确认删除</h3><p>确定要删除会话 <b>${esc(label)}</b> 吗？<br>相关聊天记录会移至 .trash。</p><div class="actions"><button class="btn btn-cancel" onclick="this.closest('.confirm-overlay').remove()">取消</button><button class="btn btn-danger" onclick="doDelete('${key}'); this.closest('.confirm-overlay').remove()">删除</button></div></div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function toggleLock(key) {
  const isLocked = !!sessions[key]?.locked;
  const action = isLocked ? 'unlock' : 'lock';
  const res = await fetch('/api/' + action, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({key}) });
  if (res.ok) { toast(isLocked ? '🔓 已解锁' : '🔒 已锁定'); await load(); } else { toast('❌ 操作失败'); }
}

async function doDelete(key) {
  if (sessions[key]?.locked) { toast('❌ 会话已锁定，无法删除'); return; }
  const res = await fetch('/api/delete', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({key}) });
  if (res.ok) { toast('🗑️ 已删除'); await load(); }
  else {
    const msg = {404: '❌ 会话不存在', 423: '❌ 会话已锁定'}[res.status] || '❌ 删除失败';
    toast(msg);
  }
}

function toast(msg) { const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2000); }

load();
</script>
</body>
</html>
"""


def find_current_session(data: dict) -> str | None:
    best_key, best_ts = None, 0
    for k, v in data.items():
        if "dashboard" in k and v.get("updatedAt", 0) > best_ts:
            best_ts = v["updatedAt"]
            best_key = k
    return best_key


def load_sessions() -> dict:
    if not os.path.exists(SESSION_PATH):
        return {}
    with open(SESSION_PATH) as f:
        return json.load(f)


def save_sessions(data: dict) -> None:
    shutil.copy2(SESSION_PATH, SESSION_PATH + ".bak")
    with open(SESSION_PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML.encode("utf-8"))
        elif self.path == "/api/list":
            self._api_list()
        else:
            self.send_error(404)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        data = json.loads(self.rfile.read(length)) if length else {}
        if self.path == "/api/rename":
            self._api_rename(data)
        elif self.path == "/api/clear":
            self._api_clear(data)
        elif self.path == "/api/delete":
            self._api_delete(data)
        elif self.path == "/api/lock":
            self._api_lock(data)
        elif self.path == "/api/unlock":
            self._api_unlock(data)
        else:
            self.send_error(404)

    def _json(self, code, obj=None):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        if obj is None:
            obj = {"ok": True} if code < 400 else {"ok": False}
        self.wfile.write(json.dumps(obj).encode())

    def _api_list(self):
        sessions = load_sessions()
        current_key = find_current_session(sessions)
        result, order = {}, []
        for k, v in sorted(sessions.items(), key=lambda x: x[1].get("updatedAt", 0), reverse=True):
            if "subagent" in k:
                continue
            order.append(k)
            result[k] = {"label": v.get("label", ""), "updated": v.get("updatedAt", 0), "tokens": v.get("totalTokens", 0), "isCurrent": k == current_key, "locked": v.get("locked", False)}
        self._json(200, {"sessions": result, "order": order})

    def _api_rename(self, data):
        key, label = data.get("key", ""), data.get("label", "").strip()
        if not key or not label: return self._json(400)
        sessions = load_sessions()
        if key not in sessions: return self._json(404)
        sessions[key]["label"] = label
        save_sessions(sessions)
        self._json(200)

    def _api_clear(self, data):
        key = data.get("key", "")
        if not key: return self._json(400)
        sessions = load_sessions()
        if key not in sessions: return self._json(404)
        sessions[key].pop("label", None)
        save_sessions(sessions)
        self._json(200)

    def _api_lock(self, data):
        key = data.get("key", "")
        if not key: return self._json(400)
        sessions = load_sessions()
        if key not in sessions: return self._json(404)
        sessions[key]["locked"] = True
        save_sessions(sessions)
        self._json(200)

    def _api_unlock(self, data):
        key = data.get("key", "")
        if not key: return self._json(400)
        sessions = load_sessions()
        if key not in sessions: return self._json(404)
        sessions[key]["locked"] = False
        save_sessions(sessions)
        self._json(200)

    def _api_delete(self, data):
        key = data.get("key", "")
        if not key: return self._json(400)
        sessions = load_sessions()
        if key not in sessions: return self._json(404)
        if sessions[key].get("locked"): return self._json(423, {"ok": False, "error": "会话已锁定"})
        entry = sessions.pop(key)
        save_sessions(sessions)
        trash_dir = os.path.join(os.path.dirname(SESSION_PATH), ".trash")
        os.makedirs(trash_dir, exist_ok=True)
        sid = entry.get("sessionId", "")
        if sid:
            d = os.path.dirname(SESSION_PATH)
            for ext in [".jsonl", ".trajectory.jsonl", ".trajectory-path.json"]:
                f = os.path.join(d, sid + ext)
                if os.path.exists(f): shutil.move(f, os.path.join(trash_dir, os.path.basename(f)))
        self._json(200)


def main():
    print(f"🏷️  Session Manager  →  http://127.0.0.1:{PORT}")
    HTTPServer.allow_reuse_address = True
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    try: server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋"); server.shutdown()

if __name__ == "__main__":
    main()
