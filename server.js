const http = require('http');
const fs = require('fs');
const path = require('path');
const DataStore = require('./lib/data-store');
const seed = require('./lib/seed');
const { sendJson, readJson } = require('./lib/http');
const { createInvestigation, approveInvestigation, EXECUTION_LANE } = require('./lib/llm-service');
const { verifyPassword, createSession, getUserFromRequest, publicUser } = require('./lib/auth-service');
const { recordAudit } = require('./lib/audit-service');
const { connectIntegration, oauthStart, syncIntegration } = require('./lib/integration-service');
const { createRecoveryWorkflow } = require('./lib/workflow-service');
const { getMetricsHistory, getValueSummary } = require('./lib/metrics-service');
const { sendSlackMessage, slackNotifyRisk, slackNotifyApproval, slackDailyPulse, slackMentionUser } = require('./lib/slack-service');
const { createWorkflow, advanceWorkflow, failStep, getWorkflowTimeline } = require('./lib/workflow-engine');
const { getROIDashboard, getBenchmarkingData } = require('./lib/roi-service');
const { getKnowledgeBase, searchKnowledge, verifySourceFreshness } = require('./lib/knowledge-service');
const { getCustomerHealth, getAccountDetail, triggerHealthIntervention } = require('./lib/customer-health-service');
const { getForecast, getForecastAlert } = require('./lib/forecast-service');
const { ROLES, USERS, getUserPermissions, canUser, filterDataByRole, getTeamMembers } = require('./lib/rbac-service');
const { getBusinessGraph } = require('./lib/business-graph');
const { getMarketplacePlaybooks, installTemplate, getCustomAgents, removeAgent, getApprovalPolicies, updateApprovalPolicy } = require('./lib/agent-studio');
// NEW SERVICES
const { getBusinessMemory, addGoal, addApproval, addDecision, addInitiative, updateInitiative } = require('./lib/business-memory');
const { generatePrediction, getConfidenceLabel, getRiskLabel } = require('./lib/kpi-prediction');
const { generateMorningBrief, saveBrief, getBriefHistory } = require('./lib/morning-brief');
const { processChatMessage, getChatHistory, saveChatMessage, AGENTS } = require('./lib/executive-chat');
const { explainRecommendation, explainInvestigation } = require('./lib/explainability');
const { runScenario, getScenarioPresets } = require('./lib/scenario-simulator');
const { generateReport, getReportHistory } = require('./lib/report-generator');
const { executeDecision, getExecutionLogs } = require('./lib/decision-executor');
// NEW FEATURES V2.1
const { getOKRs, getOKRTemplates, createOKR, updateOKRProgress, generateAISmartGoals, aiPredictOKRReachability } = require('./lib/okr-service');
const { getDashboardCharts } = require('./lib/chart-service');
const { recordDecision, getDecisionRegistry, updateDecisionStatus, getDecisionSummary, linkDecisionToWorkflow } = require('./lib/decision-registry');
const { generatePopAnalysis, generateTrendHistory } = require('./lib/pop-analysis');
const { extractActionsFromChat, extractActionsFromInvestigation, createAction, getAutoActions, updateActionStatus, getActionStats } = require('./lib/auto-actions');
const { getRiskTemplates, registerRisk, getRiskRegister, updateRiskStatus, getRiskSummary, autoDetectRisks } = require('./lib/risk-register');
const { generateSLADashboard, trackSLAViolation, getSLAViolations } = require('./lib/sla-service');

const ROOT = __dirname; 
const LANES = new Set(['Needs decision', EXECUTION_LANE, 'Done this week']);
const CONTENT_TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const PUBLIC_FILES = new Set(['index.html', 'app.js', 'styles.css']);

function serveStatic(urlPath, response) { 
  const requestedFile = urlPath === '/' ? 'index.html' : urlPath.slice(1); 
  if (!PUBLIC_FILES.has(requestedFile)) { response.writeHead(404); response.end('Not found'); return; } 
  const target = path.resolve(ROOT, requestedFile); 
  response.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(target)] }); 
  fs.createReadStream(target).pipe(response); 
}

function createServer({ dbPath = path.join(ROOT, 'data.json') } = {}) { 
  const store = new DataStore(dbPath, seed); 
  return http.createServer(async (request, response) => { 
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`); 
    try {
      // === AUTH ===
      if (request.method === 'POST' && url.pathname === '/api/auth/login') { 
        const { email, password } = await readJson(request); 
        const data = store.read(); 
        const user = data.users.find((item) => item.email === String(email || '').toLowerCase()); 
        if (!user || typeof password !== 'string' || !verifyPassword(password, user)) 
          return sendJson(response, 401, { error: 'Invalid email or password' }); 
        const token = createSession(data, user); 
        recordAudit(data, { actor: user, action: 'auth.login', resource: 'session', detail: 'Signed in to Axiom OS' }); 
        store.write(data); 
        return sendJson(response, 200, { token, user: publicUser(user) }); 
      }
      
      const data = store.read(); 
      const user = getUserFromRequest(request, data); 
      if (url.pathname.startsWith('/api/') && !user) 
        return sendJson(response, 401, { error: 'Authentication required' });
      
      // === BOOTSTRAP ===
      if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
        // Generate morning brief on bootstrap if not already generated today
        if (!data.lastBriefDate || new Date(data.lastBriefDate).toDateString() !== new Date().toDateString()) {
          const brief = generateMorningBrief(data);
          saveBrief(data, brief);
          data.lastBriefDate = new Date().toISOString();
          store.write(data);
        }
        return sendJson(response, 200, { 
          ...data, 
          currentUser: publicUser(user),
          morningBrief: data.morningBriefs?.[0] || null
        });
      }
      
      // === MORNING BRIEF ===
      if (request.method === 'GET' && url.pathname === '/api/brief') 
        return sendJson(response, 200, data.morningBriefs?.[0] || generateMorningBrief(data));
      if (request.method === 'GET' && url.pathname === '/api/brief/history') 
        return sendJson(response, 200, getBriefHistory(data));
      
      // === EXECUTIVE CHAT ===
      if (request.method === 'POST' && url.pathname === '/api/chat') {
        const body = await readJson(request);
        const result = processChatMessage(data, body);
        saveChatMessage(data, result);
        recordAudit(data, { actor: user, action: 'chat.message', resource: result.id, detail: body.text?.substring(0, 100) || 'Chat message' });
        store.write(data);
        return sendJson(response, 200, result);
      }
      if (request.method === 'GET' && url.pathname === '/api/chat/history') 
        return sendJson(response, 200, getChatHistory(data));
      if (request.method === 'GET' && url.pathname === '/api/chat/agents') 
        return sendJson(response, 200, Object.values(AGENTS));
      
      // === BUSINESS MEMORY ===
      if (request.method === 'GET' && url.pathname === '/api/memory') 
        return sendJson(response, 200, getBusinessMemory(data));
      if (request.method === 'POST' && url.pathname === '/api/memory/goals') {
        const body = await readJson(request);
        const goal = addGoal(data, body);
        store.write(data);
        return sendJson(response, 201, goal);
      }
      if (request.method === 'POST' && url.pathname === '/api/memory/initiatives') {
        const body = await readJson(request);
        const init = addInitiative(data, body);
        store.write(data);
        return sendJson(response, 201, init);
      }
      const initUpdateMatch = url.pathname.match(/^\/api\/memory\/initiatives\/([^/]+)$/);
      if (request.method === 'PATCH' && initUpdateMatch) {
        const body = await readJson(request);
        const result = updateInitiative(data, initUpdateMatch[1], body);
        if (!result) return sendJson(response, 404, { error: 'Initiative not found' });
        store.write(data);
        return sendJson(response, 200, result);
      }
      
      // === KPI PREDICTION ===
      if (request.method === 'POST' && url.pathname === '/api/predict') {
        const body = await readJson(request);
        const prediction = generatePrediction(data, body.action || body, body.context || '');
        return sendJson(response, 200, prediction);
      }
      
      // === EXPLAINABILITY ===
      if (request.method === 'POST' && url.pathname === '/api/explain') {
        const body = await readJson(request);
        const explanation = explainRecommendation(data, body.recommendation, body.context);
        return sendJson(response, 200, explanation);
      }
      if (request.method === 'POST' && url.pathname.startsWith('/api/explain/investigation/')) {
        const invId = url.pathname.split('/').pop();
        const investigation = data.investigations.find(i => i.id === invId);
        if (!investigation) return sendJson(response, 404, { error: 'Investigation not found' });
        return sendJson(response, 200, explainInvestigation(investigation));
      }
      
      // === SCENARIO SIMULATOR ===
      if (request.method === 'GET' && url.pathname === '/api/scenarios/presets') 
        return sendJson(response, 200, getScenarioPresets());
      if (request.method === 'POST' && url.pathname === '/api/scenarios/run') {
        const body = await readJson(request);
        const scenario = runScenario(data, body);
        return sendJson(response, 200, scenario);
      }
      
      // === REPORTS ===
      if (request.method === 'GET' && url.pathname === '/api/reports') 
        return sendJson(response, 200, getReportHistory(data));
      if (request.method === 'POST' && url.pathname === '/api/reports/generate') {
        const body = await readJson(request);
        const report = generateReport(data, body.type || 'executive', body.context || '');
        recordAudit(data, { actor: user, action: 'report.generate', resource: report.id, detail: report.title });
        store.write(data);
        return sendJson(response, 201, report);
      }
      if (request.method === 'GET' && url.pathname.startsWith('/api/reports/')) {
        const reportId = url.pathname.split('/').pop();
        const report = data.reports?.find(r => r.id === reportId);
        if (!report) return sendJson(response, 404, { error: 'Report not found' });
        return sendJson(response, 200, report);
      }
      
      // === DECISION EXECUTOR ===
      if (request.method === 'POST' && url.pathname === '/api/decisions') {
        const body = await readJson(request);
        const result = executeDecision(data, body);
        if (result.error) return sendJson(response, result.status || 400, { error: result.error });
        recordAudit(data, { actor: user, action: 'decision.execute', resource: result.decisionId, detail: `${body.action} on ${body.investigationId}` });
        store.write(data);
        return sendJson(response, 200, result);
      }
      if (request.method === 'GET' && url.pathname === '/api/decisions/logs') 
        return sendJson(response, 200, getExecutionLogs(data));
      if (request.method === 'GET' && url.pathname.startsWith('/api/decisions/')) {
        const logId = url.pathname.split('/').pop();
        const logs = data.executionLogs?.filter(l => l.decisionId === logId) || [];
        return sendJson(response, 200, logs);
      }
      
      // === EXISTING ENDPOINTS ===
      if (request.method === 'GET' && url.pathname === '/api/audit') return sendJson(response, 200, data.audit);
      if (request.method === 'GET' && url.pathname === '/api/workflows') return sendJson(response, 200, data.workflows);
      if (request.method === 'GET' && url.pathname === '/api/notifications') return sendJson(response, 200, data.notifications);
      if (request.method === 'GET' && url.pathname === '/api/value') return sendJson(response, 200, getValueSummary(data));
      if (request.method === 'GET' && url.pathname === '/api/metrics/history') return sendJson(response, 200, getMetricsHistory());
      if (request.method === 'GET' && url.pathname === '/api/integrations') return sendJson(response, 200, data.integrations);
      
      // === SLACK INTEGRATIONS ===
      if (request.method === 'POST' && url.pathname === '/api/slack/notify-risk') { 
        const body = await readJson(request); 
        const result = slackNotifyRisk(data, body.risk); 
        recordAudit(data, { actor: user, action: 'slack.alert', resource: 'slack', detail: `Risk alert: ${body.risk?.title}` }); 
        store.write(data); 
        return sendJson(response, 200, result); 
      }
      if (request.method === 'POST' && url.pathname === '/api/slack/notify-approval') { 
        const body = await readJson(request); 
        const result = slackNotifyApproval(data, body.item); 
        store.write(data); 
        return sendJson(response, 200, result); 
      }
      if (request.method === 'POST' && url.pathname === '/api/slack/daily-pulse') { 
        const result = slackDailyPulse(data); 
        store.write(data); 
        return sendJson(response, 200, result); 
      }
      if (request.method === 'POST' && url.pathname === '/api/slack/mention') { 
        const body = await readJson(request); 
        const result = slackMentionUser(data, body.userId, body.message); 
        store.write(data); 
        return sendJson(response, 200, result); 
      }
      
      // === INVESTIGATIONS ===
      if (request.method === 'POST' && url.pathname === '/api/investigations') { 
        const body = await readJson(request);
        // Use new chat engine for enriched investigations
        const chatResult = processChatMessage(data, { text: body.question || 'Business analysis' });
        // Find the full investigation from data (chatResult.response.investigation only has id/evidence/plan)
        const investigation = data.investigations[0];
        // Ensure backward compatibility
        if (!investigation.question) investigation.question = body.question;
        store.write(data); 
        recordAudit(data, { actor: user, action: 'agent.investigation.start', resource: investigation.id, detail: investigation.question }); 
        return sendJson(response, 201, investigation); 
      }
      
      const approvalMatch = url.pathname.match(/^\/api\/investigations\/([^/]+)\/approve$/); 
      if (request.method === 'POST' && approvalMatch) { 
        const result = approveInvestigation(data, approvalMatch[1]); 
        if (result.error) return sendJson(response, result.status, { error: result.error }); 
        const wfConfig = { 
          title: 'EU Pipeline Recovery', 
          targetImpact: result.investigation.impact, 
          sourceInvestigationId: result.investigation.id, 
          steps: [ 
            { title: 'Restore high-intent EU audience', owner: 'Marketing Agent', due: 'Today' }, 
            { title: 'Prepare follow-up for 17 delayed leads', owner: 'Sales Agent', due: 'Today' }, 
            { title: 'Open renewal interventions for 3 accounts', owner: 'Customer Agent', due: 'Tomorrow', approvalRequired: true, escalationContact: 'CEO' } 
          ], 
          sla: '48 hours' 
        }; 
        const workflow = createWorkflow(data, wfConfig); 
        data.notifications.unshift({ 
          id: `notice-${Date.now()}`, kind: 'workflow', title: 'Recovery workflow started', 
          detail: 'Three AI-owned recovery actions with SLA tracking are now in progress.', 
          read: false, createdAt: new Date().toISOString() 
        }); 
        slackNotifyRisk(data, { title: 'EU Pipeline Recovery Approved', detail: '21-day recovery plan activated with 3 AI agents', impact: result.investigation.impact, agent: 'CEO' }); 
        addApproval(data, result.investigation.id, 'EU Pipeline Recovery', user?.name || 'CEO');
        addDecision(data, 'EU Pipeline Recovery', 'approved', result.investigation.impact);
        recordAudit(data, { actor: user, action: 'workflow.approve', resource: workflow.id, detail: 'EU pipeline recovery plan approved' }); 
        store.write(data); 
        return sendJson(response, 200, { ...result, workflow }); 
      }
      
      // === WORKFLOW ENGINE ===
      if (request.method === 'POST' && url.pathname === '/api/workflow/create') { 
        const body = await readJson(request); 
        const wf = createWorkflow(data, body.config); 
        recordAudit(data, { actor: user, action: 'workflow.create', resource: wf.id, detail: wf.title }); 
        store.write(data); 
        return sendJson(response, 201, wf); 
      }
      const wfAdvanceMatch = url.pathname.match(/^\/api\/workflow\/([^/]+)\/advance$/); 
      if (request.method === 'POST' && wfAdvanceMatch) { 
        const result = advanceWorkflow(data, wfAdvanceMatch[1]); 
        if (result.error) return sendJson(response, result.status, { error: result.error }); 
        recordAudit(data, { actor: user, action: 'workflow.advance', resource: wfAdvanceMatch[1] }); 
        store.write(data); 
        return sendJson(response, 200, result); 
      }
      const wfFailMatch = url.pathname.match(/^\/api\/workflow\/([^/]+)\/fail\/([^/]+)$/); 
      if (request.method === 'POST' && wfFailMatch) { 
        const result = failStep(data, wfFailMatch[1], wfFailMatch[2]); 
        if (result.error) return sendJson(response, result.status, { error: result.error }); 
        store.write(data); 
        return sendJson(response, 200, result); 
      }
      const wfTimelineMatch = url.pathname.match(/^\/api\/workflow\/([^/]+)\/timeline$/); 
      if (request.method === 'GET' && wfTimelineMatch) { 
        const timeline = getWorkflowTimeline(data, wfTimelineMatch[1]); 
        if (!timeline) return sendJson(response, 404, { error: 'Workflow not found' }); 
        return sendJson(response, 200, timeline); 
      }
      
      // === TASKS ===
      const moveMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/move$/); 
      if (request.method === 'POST' && moveMatch) { 
        const { lane } = await readJson(request); 
        const task = data.tasks.find((item) => item.id === moveMatch[1]); 
        if (!task || !LANES.has(lane)) return sendJson(response, 400, { error: 'Invalid task or lane' }); 
        task.lane = lane; 
        task.status = lane === 'Done this week' ? 'done' : 'active'; 
        recordAudit(data, { actor: user, action: 'task.move', resource: task.id, detail: `Moved to ${lane}` }); 
        store.write(data); 
        return sendJson(response, 200, task); 
      }
      
      // === ROI ===
      if (request.method === 'GET' && url.pathname === '/api/roi') return sendJson(response, 200, getROIDashboard(data));
      if (request.method === 'GET' && url.pathname === '/api/benchmarks') return sendJson(response, 200, getBenchmarkingData());
      
      // === KNOWLEDGE BASE ===
      if (request.method === 'GET' && url.pathname === '/api/knowledge') return sendJson(response, 200, getKnowledgeBase());
      if (request.method === 'POST' && url.pathname === '/api/knowledge/search') { 
        const body = await readJson(request); 
        return sendJson(response, 200, searchKnowledge(body.query)); 
      }
      const kbVerifyMatch = url.pathname.match(/^\/api\/knowledge\/verify\/([^/]+)$/); 
      if (request.method === 'POST' && kbVerifyMatch) { 
        const result = verifySourceFreshness(data, kbVerifyMatch[1]); 
        if (!result) return sendJson(response, 404, { error: 'Source not found' }); 
        return sendJson(response, 200, result); 
      }
      
      // === CUSTOMER HEALTH ===
      if (request.method === 'GET' && url.pathname === '/api/customer-health') return sendJson(response, 200, getCustomerHealth());
      if (request.method === 'GET' && url.pathname.startsWith('/api/customer-health/')) { 
        const id = url.pathname.split('/').pop(); 
        const account = getAccountDetail(id); 
        if (!account) return sendJson(response, 404, { error: 'Account not found' }); 
        return sendJson(response, 200, account); 
      }
      if (request.method === 'POST' && url.pathname.startsWith('/api/customer-health/')) { 
        const id = url.pathname.split('/').pop(); 
        const result = triggerHealthIntervention(data, id); 
        if (!result) return sendJson(response, 404, { error: 'Account not found' }); 
        store.write(data); 
        return sendJson(response, 200, result); 
      }
      
      // === FORECAST ===
      if (request.method === 'GET' && url.pathname === '/api/forecast') return sendJson(response, 200, getForecast());
      if (request.method === 'GET' && url.pathname === '/api/forecast/alert') return sendJson(response, 200, getForecastAlert());
      
      // === USERS & RBAC ===
      if (request.method === 'GET' && url.pathname === '/api/users') return sendJson(response, 200, { users: USERS, currentUser: publicUser(user), roles: Object.keys(ROLES) });
      if (request.method === 'GET' && url.pathname === '/api/users/team') return sendJson(response, 200, getTeamMembers(user));
      if (request.method === 'GET' && url.pathname === '/api/users/permissions') return sendJson(response, 200, getUserPermissions(user));
      
      // === BUSINESS GRAPH ===
      if (request.method === 'GET' && url.pathname === '/api/business-graph') return sendJson(response, 200, getBusinessGraph());
      
      // === MARKETPLACE ===
      if (request.method === 'GET' && url.pathname === '/api/marketplace') return sendJson(response, 200, getMarketplacePlaybooks());
      if (request.method === 'POST' && url.pathname === '/api/marketplace/install') { 
        const body = await readJson(request); 
        const result = installTemplate(data, body.templateId, body.config); 
        if (result.error) return sendJson(response, result.status, { error: result.error }); 
        store.write(data); 
        return sendJson(response, 200, result); 
      }
      if (request.method === 'GET' && url.pathname === '/api/custom-agents') return sendJson(response, 200, getCustomAgents());
      if (request.method === 'POST' && url.pathname === '/api/custom-agents/remove') { 
        const body = await readJson(request); 
        const result = removeAgent(body.agentId); 
        if (result.error) return sendJson(response, result.status, { error: result.error }); 
        return sendJson(response, 200, result); 
      }
      
      // === POLICIES ===
      if (request.method === 'GET' && url.pathname === '/api/policies') return sendJson(response, 200, getApprovalPolicies());
      if (request.method === 'POST' && url.pathname === '/api/policies/update') { 
        const body = await readJson(request); 
        const result = updateApprovalPolicy(body.policyId, body.updates); 
        if (result.error) return sendJson(response, result.status, { error: result.error }); 
        return sendJson(response, 200, result); 
      }
      
      // === OAUTH ===
      const oauthMatch = url.pathname.match(/^\/api\/integrations\/(hubspot|slack)\/oauth\/start$/); 
      if (request.method === 'GET' && oauthMatch) return sendJson(response, 200, oauthStart(oauthMatch[1], `${url.protocol}//${request.headers.host}`));
      const integrationMatch = url.pathname.match(/^\/api\/integrations\/(hubspot|slack)\/connect$/); 
      if (request.method === 'POST' && integrationMatch) { 
        const integration = connectIntegration(data, integrationMatch[1]); 
        recordAudit(data, { actor: user, action: 'integration.connect', resource: integration.name, detail: `Granted ${integration.scopes.join(', ')}` }); 
        store.write(data); 
        return sendJson(response, 200, integration); 
      }
      const syncMatch = url.pathname.match(/^\/api\/integrations\/(hubspot|slack)\/sync$/); 
      if (request.method === 'POST' && syncMatch) { 
        const result = syncIntegration(data, syncMatch[1]); 
        if (!result) return sendJson(response, 409, { error: 'Connect this integration before syncing.' }); 
        data.notifications.unshift({ id: `notice-${Date.now()}`, kind: 'sync', title: `${result.integration.name} sync completed`, detail: `${Object.entries(result.records).map(([key, value]) => `${value} ${key}`).join(', ')} indexed for agents.`, read: false, createdAt: new Date().toISOString() }); 
        recordAudit(data, { actor: user, action: 'integration.sync', resource: result.integration.name, detail: 'Agent data sources refreshed' }); 
        store.write(data); 
        return sendJson(response, 200, result); 
      }
      
      // === OKR TRACKER ===
      if (request.method === 'GET' && url.pathname === '/api/okrs') return sendJson(response, 200, getOKRs(data));
      if (request.method === 'GET' && url.pathname === '/api/okrs/templates') return sendJson(response, 200, getOKRTemplates());
      if (request.method === 'POST' && url.pathname === '/api/okrs') {
        const body = await readJson(request);
        const okr = createOKR(data, body);
        recordAudit(data, { actor: user, action: 'okr.create', resource: okr.id, detail: okr.objective });
        store.write(data);
        return sendJson(response, 201, okr);
      }
      const okrUpdateMatch = url.pathname.match(/^\/api\/okrs\/([^/]+)\/kr\/([^/]+)$/);
      if (request.method === 'PATCH' && okrUpdateMatch) {
        const body = await readJson(request);
        const result = updateOKRProgress(data, okrUpdateMatch[1], okrUpdateMatch[2], body.current);
        if (!result) return sendJson(response, 404, { error: 'OKR or KR not found' });
        store.write(data);
        return sendJson(response, 200, result);
      }
      if (request.method === 'GET' && url.pathname === '/api/okrs/ai-goals') return sendJson(response, 200, generateAISmartGoals(data));
      const okrPredictMatch = url.pathname.match(/^\/api\/okrs\/([^/]+)\/predict$/);
      if (request.method === 'GET' && okrPredictMatch) {
        const prediction = aiPredictOKRReachability(data, okrPredictMatch[1]);
        if (!prediction) return sendJson(response, 404, { error: 'OKR not found' });
        return sendJson(response, 200, prediction);
      }
      
      // === CHARTS ===
      if (request.method === 'GET' && url.pathname === '/api/charts/dashboard') return sendJson(response, 200, getDashboardCharts());
      
      // === DECISION REGISTRY ===
      if (request.method === 'GET' && url.pathname === '/api/decision-registry') {
        const status = url.searchParams.get('status');
        const category = url.searchParams.get('category');
        return sendJson(response, 200, getDecisionRegistry(data, { status, category }));
      }
      if (request.method === 'POST' && url.pathname === '/api/decision-registry') {
        const body = await readJson(request);
        const decision = recordDecision(data, body, user);
        recordAudit(data, { actor: user, action: 'decision.registry.create', resource: decision.id, detail: decision.title });
        store.write(data);
        return sendJson(response, 201, decision);
      }
      const dregUpdateMatch = url.pathname.match(/^\/api\/decision-registry\/([^/]+)$/);
      if (request.method === 'PATCH' && dregUpdateMatch) {
        const body = await readJson(request);
        const result = updateDecisionStatus(data, dregUpdateMatch[1], body.status, body);
        if (!result) return sendJson(response, 404, { error: 'Decision not found' });
        store.write(data);
        return sendJson(response, 200, result);
      }
      if (request.method === 'GET' && url.pathname === '/api/decision-registry/summary') return sendJson(response, 200, getDecisionSummary(data));
      
      // === PERIOD-OVER-PERIOD ANALYSIS ===
      if (request.method === 'GET' && url.pathname === '/api/pop-analysis') return sendJson(response, 200, generatePopAnalysis(data));
      if (request.method === 'GET' && url.pathname.startsWith('/api/pop-analysis/trend/')) {
        const metric = url.pathname.split('/').pop();
        return sendJson(response, 200, generateTrendHistory(metric));
      }
      
      // === AUTO ACTIONS ===
      if (request.method === 'GET' && url.pathname === '/api/auto-actions') return sendJson(response, 200, getAutoActions(data));
      if (request.method === 'GET' && url.pathname === '/api/auto-actions/stats') return sendJson(response, 200, getActionStats(data));
      if (request.method === 'POST' && url.pathname === '/api/auto-actions') {
        const body = await readJson(request);
        const action = createAction(data, body);
        recordAudit(data, { actor: user, action: 'auto-action.create', resource: action.id, detail: action.title });
        store.write(data);
        return sendJson(response, 201, action);
      }
      const actUpdateMatch = url.pathname.match(/^\/api\/auto-actions\/([^/]+)$/);
      if (request.method === 'PATCH' && actUpdateMatch) {
        const body = await readJson(request);
        const result = updateActionStatus(data, actUpdateMatch[1], body.status);
        if (!result) return sendJson(response, 404, { error: 'Action not found' });
        store.write(data);
        return sendJson(response, 200, result);
      }
      // Auto-extract from chat
      if (request.method === 'POST' && url.pathname === '/api/auto-actions/extract-chat') {
        const body = await readJson(request);
        const actions = extractActionsFromChat(data, body);
        store.write(data);
        return sendJson(response, 200, actions);
      }
      
      // === RISK REGISTER ===
      if (request.method === 'GET' && url.pathname === '/api/risks') return sendJson(response, 200, getRiskRegister(data));
      if (request.method === 'GET' && url.pathname === '/api/risks/templates') return sendJson(response, 200, getRiskTemplates());
      if (request.method === 'GET' && url.pathname === '/api/risks/summary') return sendJson(response, 200, getRiskSummary(data));
      if (request.method === 'POST' && url.pathname === '/api/risks') {
        const body = await readJson(request);
        const risk = registerRisk(data, body, user);
        recordAudit(data, { actor: user, action: 'risk.register', resource: risk.id, detail: risk.title });
        store.write(data);
        return sendJson(response, 201, risk);
      }
      const riskUpdateMatch = url.pathname.match(/^\/api\/risks\/([^/]+)$/);
      if (request.method === 'PATCH' && riskUpdateMatch) {
        const body = await readJson(request);
        const result = updateRiskStatus(data, riskUpdateMatch[1], body.status, body);
        if (!result) return sendJson(response, 404, { error: 'Risk not found' });
        store.write(data);
        return sendJson(response, 200, result);
      }
      if (request.method === 'POST' && url.pathname === '/api/risks/auto-detect') {
        const newRisks = autoDetectRisks(data);
        newRisks.forEach(r => registerRisk(data, r, { name: 'AI System' }));
        store.write(data);
        return sendJson(response, 200, newRisks);
      }
      
      // === SLA DASHBOARD ===
      if (request.method === 'GET' && url.pathname === '/api/sla') return sendJson(response, 200, generateSLADashboard(data));
      if (request.method === 'GET' && url.pathname === '/api/sla/violations') return sendJson(response, 200, getSLAViolations(data));
      
      // === HEALTH CHECK ===
      if (request.method === 'GET' && url.pathname === '/api/health') {
        return sendJson(response, 200, {
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          services: {
            dataStore: 'operational',
            auth: 'operational',
            memory: !!data.businessMemory ? 'operational' : 'initialized',
            integrations: data.integrations?.filter(i => i.status === 'connected').length || 0,
            agents: data.agents?.filter(a => a.state === 'active').length || 0
          }
        });
      }
      
      return serveStatic(url.pathname, response);
    } catch (error) { 
      return sendJson(response, error.message === 'Invalid JSON body' ? 400 : 500, { 
        error: error.message === 'Invalid JSON body' ? error.message : 'Internal server error' 
      }); 
    } 
  }); 
}

if (require.main === module) { 
  const port = Number(process.env.PORT) || 3000; 
  createServer().listen(port, () => console.log(`Axiom OS v2.0 running at http://localhost:${port}`)); 
}

module.exports = { createServer };