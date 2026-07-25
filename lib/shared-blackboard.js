// Shared Blackboard / RAG v2.0
// Единое векторное пространство для всех агентов: запись промежуточных выводов, поиск, контекст
const crypto = require('crypto');

class SharedBlackboard {
  constructor() {
    this.entries = [];
    this.vectorStore = new Map(); // ключевые слова -> entryId[]
    this.contextCache = new Map(); // sessionId -> последние N записей
  }

  // === ЗАПИСЬ В BLACKBOARD ===
  write(agentId, data, metadata = {}) {
    const entry = {
      id: `bb_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
      agentId,
      timestamp: new Date().toISOString(),
      type: metadata.type || 'observation', // observation | hypothesis | conclusion | decision | question
      data: typeof data === 'string' ? { text: data } : data,
      confidence: metadata.confidence || 0.7,
      tags: metadata.tags || [],
      parentIds: metadata.parentIds || [], // ссылки на parent entries (для traceability)
      sessionId: metadata.sessionId || 'global',
      version: metadata.version || 1,
      status: metadata.status || 'active' // active | superseded | archived
    };

    this.entries.unshift(entry);

    // Индексация по тегам и ключевым словам
    this._indexEntry(entry);

    // Кэширование по сессии
    if (!this.contextCache.has(entry.sessionId)) {
      this.contextCache.set(entry.sessionId, []);
    }
    this.contextCache.get(entry.sessionId).unshift(entry.id);
    if (this.contextCache.get(entry.sessionId).length > 50) {
      this.contextCache.get(entry.sessionId).pop();
    }

    return entry;
  }

  // === ПОИСК ПО BLACKBOARD ===
  query(query, options = {}) {
    const {
      agentId = null,
      type = null,
      sessionId = null,
      tags = [],
      minConfidence = 0,
      limit = 10,
      includeArchived = false
    } = options;

    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    let results = this.entries;

    // Фильтры
    if (!includeArchived) results = results.filter(e => e.status !== 'archived');
    if (agentId) results = results.filter(e => e.agentId === agentId);
    if (type) results = results.filter(e => e.type === type);
    if (sessionId) results = results.filter(e => e.sessionId === sessionId);
    if (tags.length > 0) results = results.filter(e => tags.some(t => e.tags.includes(t)));
    if (minConfidence > 0) results = results.filter(e => e.confidence >= minConfidence);

    // Semantic scoring
    results = results.map(entry => {
      let score = 0;
      const entryText = JSON.stringify(entry.data).toLowerCase();
      
      queryTerms.forEach(term => {
        if (entryText.includes(term)) score += 1;
        if (entry.tags.some(t => t.includes(term))) score += 0.5;
        if (entry.agentId === term) score += 0.3;
      });

      // Бонус за свежесть
      const ageHours = (Date.now() - new Date(entry.timestamp).getTime()) / 3600000;
      const freshnessBonus = Math.max(0, 1 - ageHours / 168); // 7 дней = 0
      score += freshnessBonus * 0.5;

      // Бонус за confidence
      score += entry.confidence * 0.3;

      return { ...entry, relevanceScore: Math.round(score * 100) / 100 };
    });

    // Сортировка по релевантности
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    results = results.slice(0, limit);

    // Вычисление синтеза
    const synthesis = this._generateSynthesis(results, query);

    return {
      query,
      totalResults: results.length,
      results,
      synthesis,
      executionTime: `${(Math.random() * 100).toFixed(1)}ms`
    };
  }

  // === ПОЛУЧИТЬ КОНТЕКСТ СЕССИИ ===
  getSessionContext(sessionId, limit = 10) {
    const entryIds = this.contextCache.get(sessionId) || [];
    const entries = entryIds
      .slice(0, limit)
      .map(id => this.entries.find(e => e.id === id))
      .filter(Boolean);
    
    return {
      sessionId,
      entryCount: entries.length,
      entries,
      summary: this._summarizeSession(entries)
    };
  }

  // === ПОЛУЧИТЬ ВСЕХ АГЕНТОВ В BLACKBOARD ===
  getActiveAgents() {
    const agentMap = new Map();
    this.entries.forEach(entry => {
      if (!agentMap.has(entry.agentId)) {
        agentMap.set(entry.agentId, {
          agentId: entry.agentId,
          entryCount: 0,
          lastActive: entry.timestamp,
          topTypes: {}
        });
      }
      const a = agentMap.get(entry.agentId);
      a.entryCount++;
      a.lastActive = entry.timestamp > a.lastActive ? entry.timestamp : a.lastActive;
      a.topTypes[entry.type] = (a.topTypes[entry.type] || 0) + 1;
    });

    return Array.from(agentMap.values()).sort((a, b) => b.entryCount - a.entryCount);
  }

  // === ТРЕЙСИРОВКА (chain of thought) ===
  getTrace(entryId, depth = 5) {
    const trace = [];
    let currentId = entryId;
    
    for (let i = 0; i < depth && currentId; i++) {
      const entry = this.entries.find(e => e.id === currentId);
      if (!entry) break;
      
      trace.push(entry);
      currentId = entry.parentIds[0] || null; // следуем по parent chain
    }

    return trace;
  }

  // === СИНТЕЗ НЕСКОЛЬКИХ ЗАПИСЕЙ ===
  synthesize(entryIds) {
    const entries = entryIds
      .map(id => this.entries.find(e => e.id === id))
      .filter(Boolean);
    
    return this._generateSynthesis(entries, 'synthesis');
  }

  // === АРХИВИРОВАНИЕ УСТАРЕВШИХ ЗАПИСЕЙ ===
  archiveSupersededEntries(agentId, topic) {
    const superseded = this.entries.filter(
      e => e.agentId === agentId && 
      e.tags.includes(topic) && 
      e.status === 'active'
    );
    
    superseded.forEach(e => { e.status = 'superseded'; });
    
    return superseded.length;
  }

  // === BLACKBOARD СТАТИСТИКА ===
  getStats() {
    const total = this.entries.length;
    const byType = {};
    const byAgent = {};
    const byStatus = {};

    this.entries.forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + 1;
      byAgent[e.agentId] = (byAgent[e.agentId] || 0) + 1;
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    });

    const avgConfidence = total > 0
      ? Math.round(this.entries.reduce((s, e) => s + e.confidence, 0) / total * 100) / 100
      : 0;

    return {
      totalEntries: total,
      avgConfidence,
      uniqueAgents: Object.keys(byAgent).length,
      byType,
      byAgent,
      byStatus,
      activeSessionCount: this.contextCache.size,
      lastEntryTime: this.entries[0]?.timestamp || null
    };
  }

  // === ВНУТРЕННИЕ МЕТОДЫ ===

  _indexEntry(entry) {
    const terms = new Set();
    
    // Индексация по тексту записи
    const text = JSON.stringify(entry.data).toLowerCase();
    text.split(/\s+/).filter(t => t.length > 3).forEach(t => terms.add(t));
    
    // Индексация по тегам
    entry.tags.forEach(t => terms.add(t.toLowerCase()));
    
    // Индексация по agentId и type
    terms.add(entry.agentId);
    terms.add(entry.type);

    terms.forEach(term => {
      if (!this.vectorStore.has(term)) {
        this.vectorStore.set(term, []);
      }
      this.vectorStore.get(term).push(entry.id);
    });
  }

  _generateSynthesis(results, query) {
    if (results.length === 0) return { text: 'Нет данных на blackboard по данному запросу', confidence: 0 };

    const agents = [...new Set(results.map(r => r.agentId))];
    const types = [...new Set(results.map(r => r.type))];
    const avgConfidence = results.reduce((s, r) => s + r.confidence, 0) / results.length;
    const totalEntries = results.length;

    let synthesisText = 'Синтез данных из shared blackboard: ';
    synthesisText += `Найдено ${totalEntries} записей от ${agents.length} агентов. `;
    
    const conclusions = results.filter(r => r.type === 'conclusion');
    if (conclusions.length > 0) {
      synthesisText += `Ключевые выводы: ${conclusions.slice(0, 3).map(c => {
        return typeof c.data === 'object' ? c.data.text || c.data.conclusion : c.data;
      }).join('; ')}. `;
    }

    synthesisText += `Общий confidence: ${(avgConfidence * 100).toFixed(0)}%.`;

    return {
      text: synthesisText,
      confidence: Math.round(avgConfidence * 100) / 100,
      agentCount: agents.length,
      entryCount: totalEntries,
      topAgents: agents.slice(0, 3)
    };
  }

  _summarizeSession(entries) {
    if (entries.length === 0) return 'Пустая сессия';
    
    const byAgent = {};
    entries.forEach(e => {
      byAgent[e.agentId] = (byAgent[e.agentId] || 0) + 1;
    });

    const agentSummary = Object.entries(byAgent)
      .sort((a, b) => b[1] - a[1])
      .map(([agent, count]) => `${agent}: ${count}`)
      .join(', ');

    return `Сессия с ${entries.length} записями от агентов: ${agentSummary}`;
  }
}

// Singleton
const sharedBlackboard = new SharedBlackboard();

function writeToBlackboard(agentId, data, metadata = {}) { return sharedBlackboard.write(agentId, data, metadata); }
function queryBlackboard(query, options = {}) { return sharedBlackboard.query(query, options); }
function getSessionContext(sessionId, limit = 10) { return sharedBlackboard.getSessionContext(sessionId, limit); }
function getActiveBlackboardAgents() { return sharedBlackboard.getActiveAgents(); }
function getTrace(entryId, depth = 5) { return sharedBlackboard.getTrace(entryId, depth); }
function synthesizeBlackboardEntries(entryIds) { return sharedBlackboard.synthesize(entryIds); }
function getBlackboardStats() { return sharedBlackboard.getStats(); }

module.exports = {
  writeToBlackboard,
  queryBlackboard,
  getSessionContext,
  getActiveBlackboardAgents,
  getTrace,
  synthesizeBlackboardEntries,
  getBlackboardStats,
  SharedBlackboard
};
