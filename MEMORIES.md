# Bug hunt memories

Tracked high-severity findings with open or rejected PRs. Do not re-open a PR for an entry that is still open.

| Bug | PR | Status | Recorded |
|-----|----|--------|----------|
| `server.js` `/api/chat` and `/api/investigations` called async `processChatMessage` without `await`, persisting `{}` chat history and audit `resource: unknown` | (pending) | open | 2026-07-26 |
