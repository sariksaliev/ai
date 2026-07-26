# Bug hunt memories

Tracked high-severity findings with open or rejected PRs. Do not re-open a PR for an entry that is still open.

| Bug | PR | Status | Recorded |
|-----|----|--------|----------|
| `server.js` `/api/chat` + `/api/investigations`: async `processChatMessage` called without `await` → empty `{}` chat history / audit `resource: unknown` | https://github.com/sariksaliev/ai/pull/new/fix/await-chat-agent-dm (branch pushed; PR create pending auth) | open | 2026-07-26 |
