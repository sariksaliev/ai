# Multi-Agent Architecture Implementation Plan

## ✅ Done
- [x] Analyzed current agent architecture (llm-service, executive-chat, workflow-engine, business-memory, business-graph, knowledge-service)

## 📝 To Do
### Core Multi-Agent Engine (5 new files + 3 updates)
- [ ] **1. `lib/shared-blackboard.js`** — Shared RAG / Blackboard (единое векторное пространство для всех агентов)
- [ ] **2. `lib/agent-reflection.js`** — Reflection & Multi-agent Debate (агент-критик, дебаты с консенсусом)
- [ ] **3. `lib/agent-graph.js`** — LangGraph-подобная State Machine (узлы, условные ребра, параллельное выполнение)
- [ ] **4. `lib/agent-orchestrator.js`** — Orchestrator-Worker + Dynamic Router + MCTS (декомпозиция, routing с confidence, древовидное планирование)
- [ ] **5. Update `lib/business-graph.js`** — Dynamic Knowledge Graph (история изменений, динамические узлы и ребра)

### Integration Layer
- [ ] **6. Update `lib/executive-chat.js`** — Подключение к Blackboard и Orchestrator для сложных задач
- [ ] **7. Update `server.js`** — API endpoints для всех новых сервисов (orchestrate, reflect, debate, blackboard, graph)

### Testing & Deployment
- [ ] **8. Restart server** — Перезапуск с новыми файлами
- [ ] **9. Test endpoints** — Проверка `/api/agents/orchestrate`, `/api/agents/reflect`, `/api/agents/debate`
