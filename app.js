let authToken=localStorage.getItem('axiom_token');
const browserFetch=window.fetch.bind(window);
window.fetch=(url,options={})=>browserFetch(url,{...options,headers:{...(options.headers||{}),...(authToken?{Authorization:`Bearer ${authToken}`}:{})}});

const agents=[
  ['S','Торговый агент','Исполнение выручки','Защищает качество воронки и ведёт каждую сделку к следующему шагу.','24','сделок в работе','5','напоминаний отправлено','sales-orb'],
  ['M','Маркетинг-агент','Эффективность спроса','Связывает бюджет с воронкой и находит следующий лучший эксперимент.','3','эксперимента запущено','21%','рост SQL','finance-orb'],
  ['F','Финансовый агент','Деньги и маржа','Моделирует runway, кредитный риск и прибыльность по клиентам.','18.4','месяцев runway','$12k','утечки найдено','ops-orb'],
  ['C','Клиентский агент','Удержание и расширение','Обнаруживает изменения здоровья аккаунта до того, как они станут проблемой.','7','аккаунтов под наблюдением','$28k','upsell найден','sales-orb'],
  ['O','Операционный агент','Скорость исполнения','Находит узкие места и продвигает кросс-функциональные задачи.','3','блокера устранено','82%','обязательств в срок','ops-orb'],
  ['K','Агент знаний','Память компании','Поддерживает стратегические знания актуальными для всех агентов.','4,812','проверенных источников','96%','свежесть знаний','finance-orb']
];

const tasks={
  'Требует решения':[['Выручка','Утвердить план восстановления EU pipeline','CEO · Сегодня','t-1'],['Финансы','Перераспределить $8k с неэффективной кампании','CMO · Завтра','t-2']],
  'В работе':[['Продажи','Добавить следующие шаги к 3 enterprise-сделкам','Торговый агент · Сегодня','t-3'],['Маркетинг','Запустить EU ретаргетинг-эксперимент','Маркетинг-агент · 24 июл','t-4'],['Операции','Решить блокер security review','Мая · Сегодня','t-5']],
  'Сделано':[['Клиенты','Подготовить Acme expansion brief','Клиентский агент','t-6']]
};
const laneKeys=['Требует решения','В работе','Сделано'];
let workspaceData=null;
let chatHistory=[];

// ===== COMMAND PALETTE (⌘K) =====
function initCommandPalette(){
  const overlay=document.createElement('div');
  overlay.id='cmdPalette';
  overlay.className='cmd-palette hidden';
  overlay.innerHTML=`<div class="cmd-backdrop"></div><div class="cmd-box"><div class="cmd-input-wrap"><span class="cmd-icon">⌘</span><input type="text" id="cmdInput" placeholder="Введите команду..." autofocus/></div><div class="cmd-results" id="cmdResults"><div class="cmd-hint">Начните вводить команду или вопрос</div></div></div>`;
  document.body.appendChild(overlay);
  
  const input=document.getElementById('cmdInput');
  input.addEventListener('input',()=>filterCommands(input.value));
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter')executeCommand(input.value);
    if(e.key==='Escape')closeCommandPalette();
    if(e.key==='ArrowDown'){e.preventDefault();navigateCmdResults(1);}
    if(e.key==='ArrowUp'){e.preventDefault();navigateCmdResults(-1);}
  });
  overlay.querySelector('.cmd-backdrop').onclick=closeCommandPalette;
  
  document.addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();toggleCommandPalette();}
  });
}

const COMMANDS=[
  {id:'overview',icon:'⌘',label:'Открыть обзор',action:()=>showView('overview')},
  {id:'ask',icon:'✦',label:'Спросить Axiom',action:()=>showView('ask')},
  {id:'agents',icon:'◌',label:'Открыть ИИ-команду',action:()=>showView('agents')},
  {id:'execution',icon:'✓',label:'Открыть доску исполнения',action:()=>showView('execution')},
  {id:'roi',icon:'$',label:'Открыть ROI дашборд',action:()=>showView('roi')},
  {id:'forecast',icon:'◒',label:'Открыть прогнозы',action:()=>showView('forecast')},
  {id:'health',icon:'♡',label:'Открыть здоровье клиентов',action:()=>showView('customer-health')},
  {id:'graph',icon:'⌘',label:'Открыть бизнес-граф',action:()=>showView('graph')},
  {id:'marketplace',icon:'⊞',label:'Открыть маркетплейс',action:()=>showView('marketplace')},
  {id:'knowledge',icon:'◇',label:'Открыть базу знаний',action:()=>showView('knowledge')},
  {id:'integrations',icon:'⊞',label:'Открыть интеграции',action:()=>showView('integrations')},
  {id:'policies',icon:'⚙',label:'Открыть политики',action:()=>showView('policies')},
  {id:'users',icon:'👥',label:'Открыть команду',action:()=>showView('users')},
  {id:'audit',icon:'◷',label:'Открыть аудит',action:()=>showView('audit')},
  {id:'brief',icon:'📋',label:'Показать morning brief',action:()=>showMorningBrief()},
  {id:'scenario',icon:'🔮',label:'Открыть симулятор сценариев',action:()=>showView('scenarios')},
  {id:'report',icon:'📊',label:'Сгенерировать отчёт',action:()=>generateReport()},
  {id:'investigate',icon:'🔍',label:'Начать расследование',action:()=>{showView('ask');document.getElementById('question')?.focus();}},
  {id:'predict',icon:'📈',label:'Показать KPI прогноз',action:()=>showKpiPrediction()},
  {id:'help',icon:'?',label:'Помощь и горячие клавиши',action:()=>showHelp()}
];

function filterCommands(query){
  const results=document.getElementById('cmdResults');
  if(!query){
    results.innerHTML=COMMANDS.map(c=>`<div class="cmd-item" data-cmd="${c.id}"><span class="cmd-item-icon">${c.icon}</span><span>${c.label}</span></div>`).join('');
    results.querySelectorAll('.cmd-item').forEach(el=>el.onclick=()=>{closeCommandPalette();COMMANDS.find(c=>c.id===el.dataset.cmd)?.action();});
    return;
  }
  const q=query.toLowerCase();
  const filtered=COMMANDS.filter(c=>c.label.toLowerCase().includes(q)||c.id.includes(q));
  if(filtered.length){
    results.innerHTML=filtered.map(c=>`<div class="cmd-item" data-cmd="${c.id}"><span class="cmd-item-icon">${c.icon}</span><span>${c.label}</span></div>`).join('');
    results.querySelectorAll('.cmd-item').forEach(el=>el.onclick=()=>{closeCommandPalette();COMMANDS.find(c=>c.id===el.dataset.cmd)?.action();});
  }else{
    results.innerHTML=`<div class="cmd-item" data-cmd="ask"><span class="cmd-item-icon">✦</span><span>Спросить Axiom: "${query}"</span></div>`;
    results.querySelector('.cmd-item').onclick=()=>{closeCommandPalette();showView('ask');document.getElementById('question').value=query;document.getElementById('runQuestion').click();};
  }
}

function navigateCmdResults(dir){
  const items=document.querySelectorAll('.cmd-item');
  const active=document.querySelector('.cmd-item.active');
  let idx=Array.from(items).indexOf(active);
  items.forEach(i=>i.classList.remove('active'));
  idx=Math.max(0,Math.min(items.length-1,idx+dir));
  items[idx]?.classList.add('active');
}

function toggleCommandPalette(){
  const p=document.getElementById('cmdPalette');
  p.classList.toggle('hidden');
  if(!p.classList.contains('hidden'))setTimeout(()=>document.getElementById('cmdInput')?.focus(),100);
}
function executeCommand(query){
  closeCommandPalette();
  if(!query) return;
  // Try to find matching command
  const cmd = COMMANDS.find(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.id.includes(query));
  if (cmd) { cmd.action(); return; }
  // Otherwise send to ask view
  showView('ask');
  document.getElementById('question').value = query;
  setTimeout(() => document.getElementById('runQuestion').click(), 100);
}
function closeCommandPalette(){document.getElementById('cmdPalette').classList.add('hidden');}

// ===== MORNING BRIEF =====
async function showMorningBrief(){
  try{
    const brief=await(await fetch('/api/brief')).json();
    const modal=document.getElementById('modal');
    document.getElementById('modalContent').innerHTML=`
      <p class="eyebrow">ДОБРОЕ УТРО</p>
      <h2>${brief.title}</h2>
      <p style="color:#71807a;font-size:12px">${brief.greeting}</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0">
        <div class="roi-card"><b>${brief.metrics.pipeline}</b><small>Pipeline</small></div>
        <div class="roi-card"><b>${brief.metrics.activeWorkflows}</b><small>Активных процессов</small></div>
        <div class="roi-card"><b>${brief.metrics.completionRate}</b><small>Выполнено задач</small></div>
        <div class="roi-card"><b>${brief.metrics.teamVelocity}</b><small>Скорость команды</small></div>
      </div>
      ${brief.alerts.length?`<div style="margin:14px 0"><p class="eyebrow amber">⚠ ТРЕБУЕТ ВНИМАНИЯ</p>${brief.alerts.map(a=>`<div class="forecast-alert forecast-${a.type}"><span>${a.icon}</span><div><b>${a.title}</b><p>${a.detail}</p></div></div>`).join('')}</div>`:''}
      ${brief.wins.length?`<div style="margin:14px 0"><p class="eyebrow">✓ ДОСТИЖЕНИЯ</p>${brief.wins.map(w=>`<div class="ch-insight"><span>${w.icon}</span><div><b>${w.title}</b><p>${w.detail}</p></div></div>`).join('')}</div>`:''}
      <div style="margin-top:16px"><p class="eyebrow">РЕКОМЕНДАЦИИ</p>${brief.topRecommendations.map(r=>`<div class="wf-card"><header><b>${r.title}</b><span class="wf-status wf-${r.priority==='high'?'in_progress':'done'}">${r.priority==='high'?'Высокий':r.priority==='medium'?'Средний':'Низкий'}</span></header><p>${r.reason}</p></div>`).join('')}</div>
      <p style="color:#71807a;font-size:11px;margin-top:16px;font-style:italic">${brief.aiSummary}</p>`;
    modal.classList.remove('hidden');
  }catch(e){}
}

// ===== KPI PREDICTION =====
async function showKpiPrediction(){
  const modal=document.getElementById('modal');
  document.getElementById('modalContent').innerHTML=`<p class="eyebrow">KPI ПРОГНОЗ</p><h2>Прогнозирование результатов</h2><p style="color:#71807a">Загрузка данных...</p>`;
  modal.classList.remove('hidden');
  try{
    const pred=await(await fetch('/api/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'EU Pipeline Recovery'})})).json();
    document.getElementById('modalContent').innerHTML=`
      <p class="eyebrow">KPI ПРОГНОЗ</p>
      <h2>Прогноз восстановления pipeline</h2>
      <div class="result-grid">
        <div>
          <div class="roi-breakdown"><h3>Текущие показатели</h3><div class="roi-metrics">
            <div><b>Выручка</b><p>$${(pred.current.revenue/1000).toFixed(0)}k/мес</p></div>
            <div><b>Pipeline</b><p>$${(pred.current.pipeline/1e6).toFixed(1)}M</p></div>
            <div><b>ARR</b><p>$${(pred.current.arr/1e6).toFixed(1)}M</p></div>
          </div></div>
          <div class="roi-breakdown"><h3>Прогноз</h3><div class="roi-metrics">
            <div><b>Выручка</b><p>$${(pred.projected.revenue/1000).toFixed(0)}k/мес <small style="color:#3da47e">+${(pred.impact.revenueDelta*100).toFixed(1)}%</small></p></div>
            <div><b>Pipeline</b><p>$${(pred.projected.pipeline/1e6).toFixed(1)}M <small style="color:#3da47e">+${(pred.impact.pipelineDelta*100).toFixed(1)}%</small></p></div>
            <div><b>ARR</b><p>$${(pred.projected.arr/1e6).toFixed(1)}M <small style="color:#3da47e">+${(pred.impact.arrDelta*100).toFixed(1)}%</small></p></div>
          </div></div>
        </div>
        <aside>
          <div class="plan"><h3>Сценарии</h3>
            <div style="margin:10px 0"><b>Оптимистичный</b> (${(pred.scenarios.optimistic.probability*100)}%)<div class="progress blue"><span style="width:${pred.scenarios.optimistic.probability*100}%"></span></div><small>$${(pred.scenarios.optimistic.revenue/1000).toFixed(0)}k выручки</small></div>
            <div style="margin:10px 0"><b>Ожидаемый</b> (${(pred.scenarios.expected.probability*100)}%)<div class="progress mint"><span style="width:${pred.scenarios.expected.probability*100}%"></span></div><small>$${(pred.scenarios.expected.revenue/1000).toFixed(0)}k выручки</small></div>
            <div style="margin:10px 0"><b>Пессимистичный</b> (${(pred.scenarios.pessimistic.probability*100)}%)<div class="progress"><span style="width:${pred.scenarios.pessimistic.probability*100}%"></span></div><small>$${(pred.scenarios.pessimistic.revenue/1000).toFixed(0)}k выручки</small></div>
          </div>
        </aside>
      </div>
      <p style="color:#71807a;font-size:10px;margin-top:12px">Временной горизонт: ${pred.impact.timeframe} · Уровень риска: ${pred.impact.riskLevel}</p>`;
  }catch(e){document.getElementById('modalContent').innerHTML='<p class="hero-sub">Ошибка загрузки прогноза.</p>';}
}

// ===== HELP =====
function showHelp(){
  const modal=document.getElementById('modal');
  document.getElementById('modalContent').innerHTML=`
    <p class="eyebrow">ПОМОЩЬ</p>
    <h2>Горячие клавиши и команды</h2>
    <div style="margin:18px 0">
      <div class="wf-card"><b>⌘K / Ctrl+K</b><p>Открыть командную палитру</p></div>
      <div class="wf-card"><b>⌘Enter</b><p>Отправить вопрос Axiom</p></div>
      <div class="wf-card"><b>Esc</b><p>Закрыть модальное окно / палитру</p></div>
      <div class="wf-card"><b>↑↓</b><p>Навигация по командам в палитре</p></div>
    </div>
    <p class="eyebrow">ДОСТУПНЫЕ КОМАНДЫ</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${COMMANDS.map(c=>`<div class="wf-card" style="padding:10px;margin:0"><b>${c.icon} ${c.label}</b></div>`).join('')}</div>`;
  modal.classList.remove('hidden');
}

// ===== SCENARIO SIMULATOR VIEW =====
async function renderScenarioSimulator(){
  const el=document.getElementById('scenarioContent');
  if(!el)return;
  try{
    const presets=await(await fetch('/api/scenarios/presets')).json();
    el.innerHTML=`<div class="page-title"><p class="eyebrow">СИМУЛЯТОР СЦЕНАРИЕВ</p><h1>Что, если?</h1><p>Моделируйте бизнес-сценарии и оценивайте влияние на ключевые метрики.</p></div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px">
      ${presets.map(p=>`<div class="wf-card" style="cursor:pointer" data-preset='${JSON.stringify(p).replace(/'/g,"&#39;")}'><header><b>${p.name}</b></header><p>${p.description}</p><small style="color:#71807a">${p.timeframe} · ${p.adjustments.length} изменений</small></div>`).join('')}
    </div>
    <div id="scenarioResult"></div>`;
    el.querySelectorAll('[data-preset]').forEach(card=>card.onclick=()=>runScenarioPreset(JSON.parse(card.dataset.preset)));
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки сценариев.</p>';}
}

async function runScenarioPreset(preset){
  const el=document.getElementById('scenarioResult');
  el.innerHTML=`<div class="investigation-result"><p class="eyebrow">ЗАПУСК СЦЕНАРИЯ</p><h2>${preset.name}</h2><div class="live-reasoning" id="scenarioReasoning"><div class="reasoning-step active"><span class="reasoning-dot"></span><span>Моделирование изменений...</span></div></div></div>`;
  try{
    const result=await(await fetch('/api/scenarios/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(preset)})).json();
    el.innerHTML=`
      <div class="investigation-result">
        <p class="eyebrow">РЕЗУЛЬТАТ СЦЕНАРИЯ</p>
        <h2>${result.name}</h2>
        <p style="color:#71807a;font-size:12px">Временной горизонт: ${result.outcomes.timeframe} · Уверенность: ${(result.confidence*100).toFixed(0)}%</p>
        <div class="result-grid">
          <div>
            <div class="roi-breakdown"><h3>Ключевые метрики</h3>${result.outcomes.keyMetrics.map(m=>`<div class="forecast-metric"><span>${m.name}</span><div><b>${m.base}</b> → <span style="color:#247b68">${m.projected.expected}</span></div></div>`).join('')}</div>
            <div class="roi-breakdown"><h3>Сценарии</h3>${Object.entries(result.outcomes.scenarios).map(([key,s])=>`<div style="margin:8px 0"><b>${key==='optimistic'?'Оптимистичный':key==='expected'?'Ожидаемый':'Пессимистичный'}</b> (${(s.probability*100)}%)<p style="font-size:10px;color:#71807a">${s.description}</p></div>`).join('')}</div>
          </div>
          <aside>
            <div class="plan"><h3>Риски</h3>${result.outcomes.risks.map(r=>`<div class="wf-escalation" style="margin:6px 0">${r.severity==='high'?'🚨':r.severity==='medium'?'⚠':'ℹ'} ${r.description}</div>`).join('')}</div>
            <div class="plan" style="margin-top:12px"><h3>Возможности</h3>${result.outcomes.opportunities.map(o=>`<div style="margin:6px 0;font-size:11px">${o.type==='revenue'?'💰':o.type==='efficiency'?'⚡':'🛡'} <b>${o.description}</b><br/><small style="color:#71807a">${o.potential}</small></div>`).join('')}</div>
          </aside>
        </div>
      </div>`;
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка выполнения сценария.</p>';}
}

// ===== REPORT GENERATOR =====
async function generateReport(){
  const modal=document.getElementById('modal');
  document.getElementById('modalContent').innerHTML=`
    <p class="eyebrow">ГЕНЕРАЦИЯ ОТЧЁТА</p>
    <h2>Создать отчёт</h2>
    <p style="color:#71807a;font-size:12px">Выберите тип отчёта для генерации</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0">
      <button class="wf-card" style="text-align:left;cursor:pointer" data-type="executive"><b>📋 Executive дайджест</b><small style="color:#71807a;display:block;margin-top:4px">Общий обзор бизнеса</small></button>
      <button class="wf-card" style="text-align:left;cursor:pointer" data-type="pipeline"><b>📈 Pipeline отчёт</b><small style="color:#71807a;display:block;margin-top:4px">Состояние воронки продаж</small></button>
      <button class="wf-card" style="text-align:left;cursor:pointer" data-type="churn"><b>⚠ Churn анализ</b><small style="color:#71807a;display:block;margin-top:4px">Риски оттока клиентов</small></button>
      <button class="wf-card" style="text-align:left;cursor:pointer" data-type="financial"><b>💰 Финансовый обзор</b><small style="color:#71807a;display:block;margin-top:4px">Runway, burn rate, маржа</small></button>
    </div>
    <div id="reportResult"></div>`;
  modal.classList.remove('hidden');
  modal.querySelectorAll('[data-type]').forEach(btn=>btn.onclick=async()=>{
    const type=btn.dataset.type;
    document.getElementById('reportResult').innerHTML='<p style="color:#71807a">Генерация отчёта...</p>';
    try{
      const report=await(await fetch('/api/reports/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type})})).json();
      document.getElementById('reportResult').innerHTML=`
        <div class="investigation-result"><h2>${report.title}</h2><p style="color:#71807a;font-size:11px">Сгенерирован: ${new Date(report.generatedAt).toLocaleString()}</p>
        <p style="font-size:12px;margin:12px 0">${report.summary}</p>
        <div class="roi-breakdown"><h3>Метрики</h3><div class="roi-metrics">${Object.entries(report.metrics).map(([k,v])=>`<div><b>${k}</b><p>${v}</p></div>`).join('')}</div></div>
        ${report.sections.map(s=>`<div class="wf-card"><header><b>${s.title}</b><span class="wf-status wf-${s.priority==='high'?'in_progress':'done'}">${s.priority}</span></header><p style="font-size:11px;white-space:pre-line">${s.content}</p></div>`).join('')}
        <button class="primary" style="margin-top:12px" onclick="alert('Report exported as JSON. Check console.')">Экспорт <span>→</span></button></div>`;
    }catch(e){document.getElementById('reportResult').innerHTML='<p class="hero-sub">Ошибка генерации отчёта.</p>';}
  });
}

// ===== LIVE REASONING ANIMATION =====
function showReasoningAnimation(containerId, steps, onComplete){
  const container=document.getElementById(containerId);
  if(!container)return;
  container.innerHTML='<p class="eyebrow amber">ИИ-АНАЛИЗ</p><div class="reasoning-steps" id="reasoningSteps"></div>';
  const stepsContainer=document.getElementById('reasoningSteps');
  let i=0;
  function addStep(){
    if(i>=steps.length){if(onComplete)setTimeout(onComplete,500);return;}
    const step=steps[i];
    const el=document.createElement('div');
    el.className='reasoning-step active';
    el.innerHTML=`<span class="reasoning-dot"></span><span>${step}</span>`;
    stepsContainer.appendChild(el);
    setTimeout(()=>{el.classList.remove('active');el.classList.add('done');i++;addStep();},800+Math.random()*600);
  }
  addStep();
}

// ===== RENDER FUNCTIONS =====
function renderAgents(){
  document.getElementById('agentGrid').innerHTML=agents.map(a=>`<article class="agent-card" data-agent="${a[1].toLowerCase().replace(/\s/g,'-')}" style="animation:rise .35s ease"><header><span class="agent-orb ${a[8]}">${a[0]}</span><div><h2>${a[1]}</h2><small>${a[2]}</small></div><span class="working">● АКТИВЕН</span></header><p>${a[3]}</p><div class="agent-stats"><div><b>${a[4]}</b><small>${a[5]}</small></div><div><b>${a[6]}</b><small>${a[7]}</small></div></div></article>`).join('');
  document.getElementById('agentGrid').querySelectorAll('.agent-card').forEach(c=>c.onclick=()=>openAgentModal(c.dataset.agent));
}

function renderBoard(){
  document.getElementById('board').innerHTML=Object.entries(tasks).map(([name,items])=>`<section class="column" data-lane="${name}"><h3>${name}<span class="count">${items.length}</span></h3>${items.map((t,i)=>renderTaskCard(t,name,i)).join('')}</section>`).join('');
}

function renderTaskCard(t,lane,i){
  return `<article class="task" data-index="${i}" style="animation:rise .25s ease"><span class="task-tag">${t[0].toUpperCase()}</span><b>${t[1]}</b><footer><span>${t[2]}</span><div class="task-actions">${renderTaskMoveButtons(t[3],lane)}</div></footer></article>`;
}

function renderTaskMoveButtons(id,currentLane){
  const idx=laneKeys.indexOf(currentLane);
  return laneKeys.map((lane,j)=>{if(j===idx)return'';const dir=j<idx?'←':'→';const label=j===0?'Решить':j===1?'В работу':'Готово';return`<button class="move-btn" data-task-id="${id}" data-lane="${lane}" title="Перенести в ${lane}">${dir} ${label}</button>`}).filter(Boolean).join('');
}

renderAgents();renderBoard();

document.addEventListener('click',e=>{const btn=e.target.closest('.move-btn');if(!btn)return;const id=btn.dataset.taskId;const lane=btn.dataset.lane;moveTask(id,lane)});

async function moveTask(id,lane){
  const response=await fetch(`/api/tasks/${id}/move`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lane})});
  if(!response.ok)return;
  const updated=await response.json();
  const oldLane=Object.entries(tasks).find(([_,items])=>items.some(t=>t[3]===id))?.[0];
  if(!oldLane)return;
  const taskIdx=tasks[oldLane].findIndex(t=>t[3]===id);
  const[t]=tasks[oldLane].splice(taskIdx,1);
  t[2]=`${updated.owner} · Перенесено`;
  tasks[lane].push(t);
  renderBoard();
}

function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));
  document.querySelectorAll('.nav-item').forEach(v=>v.classList.remove('active'));
  const view=document.getElementById(id);
  if(view){view.classList.add('active-view');view.style.animation='rise .3s ease';}
  document.querySelector(`[data-view="${id}"]`)?.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

document.querySelectorAll('[data-exec-tab]').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('[data-exec-tab]').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  document.querySelectorAll('.exec-panel').forEach(p=>p.classList.remove('active-panel'));
  document.getElementById('exec'+t.dataset.execTab.charAt(0).toUpperCase()+t.dataset.execTab.slice(1)).classList.add('active-panel');
});

document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showView(b.dataset.go));

function renderOverview(data){
  const el=document.getElementById('overview');
  el.innerHTML=`<div class="hero"><div><p class="eyebrow">ДОБРОЕ УТРО, САМ</p><h1>Ваша компания <em>в движении.</em></h1><p class="hero-sub">Вот что требует вашего внимания сегодня.</p></div><button class="primary" id="reviewBtn">Обзор приоритетов <span>→</span></button></div>
  <div class="metric-grid">${data.metrics.map(m=>`<article class="metric" style="animation:rise .3s ease"><div class="metric-top"><span>${m.label}</span><span class="${m.tone}">${m.change}</span></div><strong>${m.value}</strong><div class="spark">${Array(8).fill(0).map(()=>`<span style="height:${20+Math.random()*70}%"></span>`).join('')}</div></article>`).join('')}</div>
  <div class="main-grid"><section class="panel attention"><div class="panel-head"><div><p class="eyebrow amber">ТРЕБУЕТ ВНИМАНИЯ</p><h2>Одно решение ждёт вас</h2></div><button class="text-btn">Все <span>→</span></button></div>
  <article class="decision"><div class="decision-icon">↘</div><div class="decision-copy"><div class="tag-row"><span class="tag coral">РИСК ВЫРУЧКИ</span><span class="time">Обнаружено 38м назад</span></div><h3>EU pipeline на 18% ниже плана</h3><p>Торговый, Маркетинг и Клиентский агенты нашли вероятную причину. Потенциальное влияние: <b>$42–71k</b> в этом квартале.</p><div class="agent-row"><span class="tiny-avatar sales">S</span><span class="tiny-avatar market">M</span><span class="tiny-avatar support">C</span><span>3 агента исследовали · 11 источников</span></div></div><button class="review" id="openInvestigation">Расследование <span>→</span></button></article></section>
  <section class="panel agents-now"><div class="panel-head"><div><p class="eyebrow">ИИ-КОМАНДА</p><h2>Сейчас работают</h2></div><span class="live"><i></i> ${data.agents.filter(a=>a.state==='active').length} активно</span></div>${data.agents.filter(a=>a.state==='active').slice(0,3).map(a=>`<div class="agent-mini"><span class="agent-orb ${a.id==='sales'?'sales-orb':a.id==='finance'?'finance-orb':'ops-orb'}">${a.letter||a.id[0].toUpperCase()}</span><div><b>${a.name}</b><small>${a.task}</small></div><span class="working">работает</span></div>`).join('')}<button class="full-width" data-go="agents">Открыть ИИ-Команду <span>→</span></button></section></div>
  <div class="lower-grid"><section class="panel pulse"><div class="panel-head"><div><p class="eyebrow">ПУЛЬС БИЗНЕСА</p><h2>Что изменилось со вчера</h2></div><button class="text-btn">Таймлайн</button></div><ul><li><span class="event-icon green-bg">↑</span><div><b>Обнаружена возможность расширения Acme</b><p>Использование продукта выросло на 34%; продление через 62 дня.</p></div><span class="impact positive">+$28k потенциал</span></li><li><span class="event-icon yellow-bg">!</span><div><b>Три enterprise-сделки без следующего шага</b><p>Торговый агент подготовил напоминания.</p></div><span class="impact">Требует действий</span></li><li><span class="event-icon purple-bg">✓</span><div><b>Эксперимент Q3 кампании завершён</b><p>Маркетинг-агент рекомендует перераспределить $8k.</p></div><span class="impact positive">+21% SQL</span></li></ul></section><section class="panel execution"><div class="panel-head"><div><p class="eyebrow">ЗДОРОВЬЕ ИСПОЛНЕНИЯ</p><h2>Обязательства компании</h2></div><button class="text-btn" data-go="execution">Доска <span>→</span></button></div><div class="ring-wrap"><div class="ring"><b>82<small>%</small></b><span>в срок</span></div><div class="commitments"><div><span class="dot teal"></span><b>${data.tasks.filter(t=>t.status==='active').length}</b><small>Активно</small></div><div><span class="dot amber-dot"></span><b>${data.tasks.filter(t=>t.lane==='Требует решения'||t.lane==='Needs decision').length}</b><small>Ожидает</small></div><div><span class="dot red"></span><b>${data.tasks.filter(t=>t.status==='done').length}</b><small>Готово</small></div></div></div><div class="blocker"><span>⌁</span><p><b>Запуск продукта заблокирован</b><br/>Ожидание security review · владелец уведомлён</p></div></section></div>`;
  document.getElementById('openInvestigation').onclick=openModal;
  document.getElementById('openInvestigation2').onclick=openModal;
  document.getElementById('reviewBtn').onclick=openModal;
  document.getElementById('openAsk').onclick=()=>showView('ask');
}

// ===== INVESTIGATION WITH LIVE REASONING =====
async function openModal(){
  const modal=document.getElementById('modal');
  document.getElementById('modalContent').innerHTML='<p class="eyebrow">РАССЛЕДОВАНИЕ AXIOM</p><h2>Сбор данных от ИИ-команды…</h2><div class="live-reasoning" id="liveReasoning"></div>';
  modal.classList.remove('hidden');
  
  showReasoningAnimation('liveReasoning',[
    '🔍 CEO-агент: Анализирую запрос. Определяю необходимые ресурсы.',
    '📊 Торговый агент: Чтение CRM — 312 сделок, 17 пропустили SLA.',
    '📈 Маркетинг-агент: Проверка Analytics — изменение аудитории Google Ads 9 июля.',
    '💬 Клиентский агент: Review Slack — тональность поддержки упала на 23%.',
    '📉 Финансовый агент: Сравнение исторических метрик — $42-71k под риском.',
    '🧠 CEO-агент: Построение гипотез — качество спроса + скорость реакции.',
    '✓ CEO-агент: Выбор лучшей стратегии — комплексный план восстановления.'
  ],async ()=>{
    try{
      const response=await fetch('/api/investigations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'Почему EU pipeline ниже плана?'})});
      const item=await response.json();
      document.getElementById('modalContent').innerHTML=apiResult(item);
    }catch(e){
      document.getElementById('modalContent').innerHTML=result();
    }
  });
}

document.getElementById('closeModal').onclick=()=>document.getElementById('modal').classList.add('hidden');
document.getElementById('modal').onclick=e=>{if(e.target.id==='modal')e.currentTarget.classList.add('hidden')};

const result=()=>`<p class="eyebrow amber">МУЛЬТИ-АГЕНТНОЕ РАССЛЕДОВАНИЕ · 11 ИСТОЧНИКОВ · 94% УВЕРЕННОСТИ</p><h2>EU pipeline снизился из-за качества спроса и скорости реакции.</h2><p style="color:#71807a;font-size:12px;line-height:1.6">Axiom сопоставил CRM, рекламу, поддержку и календарь. Это подтверждённый операционный риск.</p><div class="result-grid"><div><div class="evidence"><span>01</span><div><b>SQL упал на 24% после изменения аудитории кампании</b><p>Маркетинг-агент нашёл изменение в Google Ads 9 июля. Это ~61% разрыва pipeline.</p></div></div><div class="evidence"><span>02</span><div><b>Медианное время ответа выросло с 18 минут до 6.1 часов</b><p>Торговый агент нашёл 17 лидов, пропустивших SLA.</p></div></div><div class="evidence"><span>03</span><div><b>Тон поддержки упал среди 3 enterprise-аккаунтов</b><p>Клиентский агент связывает это с задержкой онбординга, создавая $19k риска продления.</p></div></div></div><aside class="plan"><p class="eyebrow">РЕКОМЕНДУЕМЫЙ ПЛАН</p><h3>Восстановить Q3 разрыв за 21 день</h3><ol><li>Восстановить высокоинтентную EU аудиторию в Google Ads</li><li>Подготовить follow-up для 17 задержанных лидов</li><li>Открыть интервенции по продлению для 3 аккаунтов</li></ol><button class="primary" style="margin-top:13px" onclick="showView('execution')">Исполнение <span>→</span></button></aside></div>`;

function apiResult(item){
  return `<p class="eyebrow amber">МУЛЬТИ-АГЕНТНОЕ РАССЛЕДОВАНИЕ · ${item.agents?.length||3} АГЕНТОВ · ${item.confidence||94}% УВЕРЕННОСТИ</p><h2>${item.summary||'EU pipeline снизился из-за качества спроса и скорости реакции.'}</h2><p style="color:#71807a;font-size:12px;line-height:1.6">Потенциальное влияние: <b>${item.impact||'$42–71k'}</b>. Axiom собрал данные из живых бизнес-систем и создал план.</p>
  <div class="result-grid"><div>${(item.evidence||[]).map((e,i)=>`<div class="evidence"><span>0${i+1}</span><div><b>${e.title||e}</b><p>${e.detail||''}</p></div></div>`).join('')}</div>
  <aside class="plan"><p class="eyebrow">РЕКОМЕНДУЕМЫЙ ПЛАН</p><h3>Восстановить Q3 разрыв за 21 день</h3><ol>${(item.plan||[]).map(x=>`<li>${typeof x==='string'?x:x.title||''}</li>`).join('')}</ol>
  <div style="display:flex;gap:8px;margin-top:13px">
    <button class="primary" style="flex:1" onclick="approveServerPlan('${item.id}')">✓ Утвердить</button>
    <button class="primary" style="flex:1;background:#d86550" onclick="document.getElementById('modal').classList.add('hidden')">✕ Отклонить</button>
  </div>
  <button class="text-btn" style="margin-top:8px;width:100%" onclick="showExplanation('${item.id}')">Почему эта рекомендация? →</button>
  </aside></div>`;
}

async function showExplanation(investigationId){
  try{
    const exp=await(await fetch(`/api/explain/investigation/${investigationId}`,{method:'POST'})).json();
    const modal=document.getElementById('modal');
    document.getElementById('modalContent').innerHTML=`
      <p class="eyebrow">ОБЪЯСНЕНИЕ РЕКОМЕНДАЦИИ</p>
      <h2>Почему Axiom предложил этот план</h2>
      <div class="roi-breakdown"><h3>Выбор агентов</h3>${exp.agentSelection.map(a=>`<div class="evidence"><span>${a.agent[0]}</span><div><b>${a.agent}</b><p>${a.reason}: ${a.selectedBecause}</p></div></div>`).join('')}</div>
      <div class="roi-breakdown"><h3>Использованные данные</h3>${exp.dataPointsUsed.map(d=>`<div style="font-size:11px;margin:4px 0">• ${d}</div>`).join('')}</div>
      <div class="roi-breakdown"><h3>Уверенность</h3><div class="roi-metrics">${Object.entries(exp.confidenceBreakdown).map(([k,v])=>`<div><b>${k}</b><p>${(v*100).toFixed(0)}%</p></div>`).join('')}</div></div>
      <p style="color:#71807a;font-size:10px;margin-top:12px">Ограничения: ${exp.whatWouldChangeOutcome.join(', ')}</p>`;
  }catch(e){}
}

document.getElementById('runQuestion').onclick=async()=>{
  const q=document.getElementById('question').value||'Почему упали продажи в Европе?';
  const button=document.getElementById('runQuestion');
  button.textContent='Расследуем…';
  button.disabled=true;
  const el=document.getElementById('askResult');
  el.innerHTML='<p class="eyebrow amber">МУЛЬТИ-АГЕНТНОЕ РАССЛЕДОВАНИЕ</p><h2>Сбор данных от ИИ-команды…</h2><div class="live-reasoning" id="askReasoning"></div>';
  el.classList.remove('hidden');
  document.getElementById('askEmpty').classList.add('hidden');
  
  showReasoningAnimation('askReasoning',[
    '🔍 CEO-агент: Анализирую запрос. Определяю необходимые ресурсы.',
    '📊 Торговый агент: Чтение CRM — анализ pipeline и сделок.',
    '📈 Маркетинг-агент: Проверка Analytics — оценка кампаний.',
    '💬 Клиентский агент: Review Slack — мониторинг тональности.',
    '📉 Финансовый агент: Сравнение метрик — расчёт влияния.',
    '🧠 CEO-агент: Построение гипотез и синтез результатов.',
    '✓ CEO-агент: Формирование рекомендации.'
  ],async()=>{
    try{
      const response=await fetch('/api/investigations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q})});
      const item=await response.json();
      el.innerHTML=apiResult(item);
    }catch(e){
      el.innerHTML=result();
    }finally{
      button.innerHTML='Расследовать <span>→</span>';
      button.disabled=false;
    }
  });
};

document.querySelectorAll('.suggestions button').forEach(b=>b.onclick=()=>{document.getElementById('question').value=b.textContent;document.getElementById('runQuestion').click();});

async function approveServerPlan(id){
  const response=await fetch(`/api/investigations/${id}/approve`,{method:'POST'});
  if(!response.ok)return;
  const data=await response.json();
  tasks['В работе'].unshift(['Выручка','Восстановить EU pipeline: 21-дневный план','Торговый + Маркетинг агенты · Запущен','t-workflow-'+Date.now()]);
  renderBoard();
  document.getElementById('modal').classList.add('hidden');
  showView('execution');
}

// ===== INTEGRATIONS, AUDIT, NOTIFICATIONS =====
function renderIntegrations(items){
  const grid=document.getElementById('integrationGrid');
  if(!grid)return;
  grid.innerHTML=items.map(item=>`<button data-connect="${item.id}"><b>${item.name}</b><span>${item.status==='connected'?'● Подключено':'○ Не подключено'}</span><small>${item.status==='connected'?`Посл. синхр: ${new Date(item.lastSync).toLocaleString()}`:`Права: ${item.scopes.join(', ')}`}</small></button>`).join('');
  grid.querySelectorAll('[data-connect]').forEach(button=>button.onclick=()=>connectIntegration(button.dataset.connect));
}

function renderAudit(items){
  const list=document.getElementById('auditList');
  if(!list)return;
  list.innerHTML=items.length?items.map(item=>`<article class="audit-entry"><span>✓</span><div><b>${item.actor.name} · ${item.action}</b><p>${item.detail}</p></div><time>${new Date(item.at).toLocaleString()}</time></article>`).join(''):'<p class="hero-sub">Действий пока нет.</p>';
}

async function loadGovernance(){
  const [integrations,audit]=await Promise.all([fetch('/api/integrations'),fetch('/api/audit')]);
  if(integrations.ok)renderIntegrations(await integrations.json());
  if(audit.ok)renderAudit(await audit.json());
}

async function connectIntegration(id){
  const integration=(workspaceData?.integrations||[]).find(item=>item.id===id);
  const action=integration?.status==='connected'?'sync':'connect';
  const response=await fetch(`/api/integrations/${id}/${action}`,{method:'POST'});
  if(response.ok){
    if(action==='connect'&&workspaceData)workspaceData.integrations=workspaceData.integrations.map(item=>item.id===id?{...item,status:'connected',lastSync:new Date().toISOString()}:item);
    await loadGovernance();
  }
}

function renderNotifications(items){
  const list=document.getElementById('notificationList');
  if(!list)return;
  const unread=items.filter(n=>!n.read).length;
  const badge=document.querySelector('.notification-badge');
  if(badge){badge.textContent=unread;badge.style.display=unread?'':'none';}
  list.innerHTML=items.slice(0,10).map(n=>`<article class="notice-item ${n.read?'':'unread'}"><span class="notice-icon notice-${n.kind}">${n.kind==='risk'||n.kind==='escalation'?'!':n.kind==='workflow'?'→':'↻'}</span><div><b>${n.title}</b><p>${n.detail}</p><time>${new Date(n.createdAt).toLocaleString()}</time></div></article>`).join('');
}

function toggleNotifications(e){
  e.stopPropagation();
  const popover=document.getElementById('notificationPopover');
  popover.classList.toggle('hidden');
}

function renderWorkflows(items){
  const list=document.getElementById('workflowList');
  if(!list)return;
  list.innerHTML=items.length?items.map(w=>`<article class="wf-card" style="animation:rise .3s ease"><header><b>${w.title}</b><span class="wf-status wf-${w.status}">${w.status=='in_progress'?'В работе':w.status=='done'?'Готово':'Ожидание'}</span></header><p>Влияние: ${w.targetImpact} · ${w.steps.filter(s=>s.status==='done').length}/${w.steps.length} шагов · ${w.sla?'SLA: '+w.sla:''}</p><div class="wf-steps">${w.steps.map(s=>`<div class="wf-step wf-step-${s.status}"><span class="step-indicator">${s.status==='active'?'→':s.status==='queued'?'○':s.status==='escalated'?'!':'✓'}</span><div><b>${s.title}</b><small>${s.owner} · ${s.due}${s.approvalRequired?' · ⚠️ Нужно одобрение':''}${s.retries>0?' · 🔄 Попытка '+(s.retries+1)+'/'+s.maxRetries:''}</small></div></div>`).join('')}</div>${w.escalations&&w.escalations.length?`<div class="wf-escalations">${w.escalations.map(e=>`<p class="wf-escalation">🚨 Эскалация ${e.contact}: ${e.reason}</p>`).join('')}</div>`:''}</article>`).join(''):'<p class="hero-sub" style="padding:40px;text-align:center">Нет активных процессов. Утвердите расследование, чтобы запустить.</p>';
}

const agentChats = {};

const AGENT_SUGGESTIONS = {
  sales: ['Какой статус pipeline?', 'Какие сделки застряли?', 'Сколько лидов пропустили SLA?'],
  marketing: ['Что с ROAS кампаний?', 'Куда перераспределить бюджет?', 'Какая аудитория просела?'],
  finance: ['Какой runway?', 'Сколько выручки под риском?', 'Что с маржой в EU?'],
  customer: ['Какие клиенты под риском?', 'Где упал NPS?', 'Какой upsell потенциал?'],
  operations: ['Какие операции заблокированы?', 'Как выполняется SLA?', 'Где bottleneck?'],
  knowledge: ['Что мы знаем про EU pipeline?', 'Какие выводы из прошлых расследований?', 'Насколько свежи источники?']
};

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openAgentModal(agentId){
  const a=agents.find(x=>x[1].toLowerCase().replace(/\s/g,'-')===agentId);
  if(!a)return;
  const agentIdMap = {
    'S':'sales','M':'marketing','F':'finance','C':'customer','O':'operations','K':'knowledge'
  };
  const backendId = agentIdMap[a[0]] || a[0].toLowerCase();
  if (!agentChats[backendId]) agentChats[backendId] = [];
  const suggestions = AGENT_SUGGESTIONS[backendId] || AGENT_SUGGESTIONS.sales;
  
  const modal=document.getElementById('modal');
  document.getElementById('modalContent').innerHTML=`
    <div class="agent-chat-modal">
      <div class="agent-chat-header">
        <div class="agent-chat-info">
          <span class="agent-orb ${a[8]}" style="width:40px;height:40px;font-size:16px">${a[0]}</span>
          <div>
            <h2 style="margin:0;font-size:16px">${escapeHtml(a[1])}</h2>
            <small style="color:#71807a;font-size:11px">${escapeHtml(a[2])} · ${escapeHtml(a[4])} ${escapeHtml(a[5])}</small>
          </div>
        </div>
        <span class="working">● АКТИВЕН</span>
      </div>
      <p style="color:#71807a;font-size:11px;margin:8px 0 12px;line-height:1.5">${escapeHtml(a[3])}</p>
      <div class="agent-chat-messages" id="agentChatMessages_${backendId}"></div>
      <div class="agent-chat-input">
        <input type="text" id="agentChatInput_${backendId}" placeholder="Спросить ${escapeHtml(a[1])}..." autocomplete="off" />
        <button id="agentChatSend_${backendId}" class="primary" style="padding:8px 16px">→</button>
      </div>
      <div class="agent-chat-suggestions">
        ${suggestions.map(s => 
          `<button type="button" class="agent-chat-suggestion" data-q="${escapeHtml(s)}">${escapeHtml(s)}</button>`
        ).join('')}
      </div>
    </div>`;
  modal.classList.remove('hidden');
  renderAgentChat(backendId, a);
  
  const input = document.getElementById(`agentChatInput_${backendId}`);
  const sendBtn = document.getElementById(`agentChatSend_${backendId}`);
  
  async function sendAgentMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    
    agentChats[backendId].push({ role: 'user', text, time: new Date().toLocaleTimeString() });
    renderAgentChat(backendId, a);
    
    const msgs = document.getElementById(`agentChatMessages_${backendId}`);
    const typing = document.createElement('div');
    typing.className = 'agent-chat-msg agent-msg';
    typing.id = 'typingIndicator';
    typing.innerHTML = `<span class="agent-orb mini ${a[8]}" style="width:22px;height:22px;font-size:10px;flex-shrink:0">${a[0]}</span><div class="chat-bubble"><div class="chat-typing"><span></span><span></span><span></span></div></div>`;
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, agentId: backendId })
      });
      const result = await response.json();
      document.getElementById('typingIndicator')?.remove();
      
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Chat request failed');
      }
      
      if (result.response) {
        const agentMsg = result.response.analysis || result.response.summary || 'Анализ выполнен';
        agentChats[backendId].push({ 
          role: 'agent', 
          text: agentMsg, 
          time: new Date().toLocaleTimeString(),
          _findings: result.response.findings || null,
          _recommendations: result.response.recommendations || null,
          findings: null,
          recommendations: null,
          streaming: true
        });
        renderAgentChat(backendId, a);
      }
    } catch(e) {
      document.getElementById('typingIndicator')?.remove();
      agentChats[backendId].push({ role: 'agent', text: 'Извините, произошла ошибка. Попробуйте ещё раз.', time: new Date().toLocaleTimeString() });
      renderAgentChat(backendId, a);
    } finally {
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }
  
  sendBtn.onclick = sendAgentMessage;
  input.onkeydown = (e) => { if (e.key === 'Enter') sendAgentMessage(); };
  modal.querySelectorAll('.agent-chat-suggestion').forEach(btn => {
    btn.onclick = () => {
      input.value = btn.dataset.q;
      sendAgentMessage();
    };
  });
  setTimeout(() => input.focus(), 50);
}

function renderAgentChat(backendId, a) {
  const msgs = document.getElementById('agentChatMessages_' + backendId);
  if (!msgs) return;
  const history = agentChats[backendId] || [];
  if (history.length === 0) {
    msgs.innerHTML = `<div class="agent-chat-welcome">Задайте вопрос ${escapeHtml(a[1].toLowerCase())}. Например: «${escapeHtml((AGENT_SUGGESTIONS[backendId] || AGENT_SUGGESTIONS.sales)[0])}»</div>`;
    return;
  }
  msgs.innerHTML = history.map(m => `
    <div class="agent-chat-msg ${m.role === 'user' ? 'user-msg' : 'agent-msg'}">
      ${m.role === 'agent' ? `<span class="agent-orb mini ${a[8]}" style="width:22px;height:22px;font-size:10px;flex-shrink:0">${a[0]}</span>` : ''}
      <div class="chat-bubble">
        <div class="chat-text ${m.streaming ? 'streaming-text' : ''}">${m.streaming ? '' : escapeHtml(m.text || '')}</div>
        <div class="chat-time">${escapeHtml(m.time)}</div>
        ${m.findings ? `<div class="chat-findings">
          <div class="chat-confidence">Уверенность: ${(m.findings.confidence * 100).toFixed(0)}%</div>
          ${m.findings.dataPoints ? m.findings.dataPoints.map(dp => `<div class="chat-datapoint">• ${escapeHtml(dp)}</div>`).join('') : ''}
        </div>` : ''}
        ${m.recommendations ? `<div class="chat-recommendations"><span class="chat-rec-label">Рекомендация:</span> ${escapeHtml(m.recommendations)}</div>` : ''}
      </div>
    </div>
  `).join('');
  msgs.scrollTop = msgs.scrollHeight;
  
  const streamingEl = msgs.querySelector('.streaming-text');
  if (streamingEl) typeMessage(streamingEl, backendId, a);
}

function typeMessage(el, backendId, a) {
  const fullText = agentChats[backendId].find(m => m.streaming)?.text || '';
  if (!fullText) { 
    el.classList.remove('streaming-text'); 
    return; 
  }
  el.textContent = '';
  let idx = 0;
  function typeChar() {
    if (idx < fullText.length) {
      el.textContent += fullText[idx];
      idx++;
      const msgs = document.getElementById('agentChatMessages_' + backendId);
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
      const delay = fullText[idx - 1] === '\n' ? 50 : Math.random() * 20 + 10;
      setTimeout(typeChar, delay);
    } else {
      el.classList.remove('streaming-text');
      const lastMsg = agentChats[backendId][agentChats[backendId].length - 1];
      if (lastMsg) {
        lastMsg.streaming = false;
        lastMsg.findings = lastMsg._findings;
        lastMsg.recommendations = lastMsg._recommendations;
        delete lastMsg._findings;
        delete lastMsg._recommendations;
        renderAgentChat(backendId, a);
      }
    }
  }
  typeChar();
}

// ===== ROI, FORECAST, CUSTOMER HEALTH, MARKETPLACE, KNOWLEDGE, POLICIES, USERS, GRAPH =====
async function renderROI(){
  const el=document.getElementById('roiContent');
  if(!el)return;
  try{
    const res=await fetch('/api/roi');
    const roi=await res.json();
    const bench=await(await fetch('/api/benchmarks')).json();
    el.innerHTML=`<div class="roi-grid"><div class="roi-card roi-primary"><span class="roi-icon">$</span><b>$${roi.summary.atRiskRevenueIdentified.toLocaleString()}</b><small>Выявлено риска выручки</small></div><div class="roi-card roi-danger"><span class="roi-icon">⚠</span><b>$${roi.summary.churnRiskDetected.toLocaleString()}</b><small>Риск оттока</small></div><div class="roi-card roi-success"><span class="roi-icon">⚡</span><b>${roi.summary.hoursAutomated}ч</b><small>Автоматизировано часов</small></div><div class="roi-card roi-info"><span class="roi-icon">✓</span><b>${roi.summary.approvedPlans}</b><small>Утверждённых планов</small></div></div>
    <div class="roi-breakdown"><h3>Детализация</h3><div class="roi-metrics"><div><b>Выручка</b><p>Выявлено: $${roi.breakdown.revenue.identified.toLocaleString()}</p><p>Восстановлено: $${roi.breakdown.revenue.recovered.toLocaleString()}</p><p>Под риском: $${roi.breakdown.revenue.atRisk.toLocaleString()}</p></div><div><b>Отток</b><p>Обнаружено: $${roi.breakdown.churn.detected.toLocaleString()}</p><p>Предотвращено: $${roi.breakdown.churn.prevented.toLocaleString()}</p><p>Аккаунтов в зоне риска: ${roi.breakdown.churn.accounts}</p></div><div><b>Эффективность</b><p>Часов сэкономлено: ${roi.breakdown.efficiency.hoursAutomated}</p><p>Сэкономлено: $${roi.breakdown.efficiency.costSaved.toLocaleString()}</p><p>Процессов: ${roi.breakdown.efficiency.workflowsAutomated}</p></div></div></div>
    <div class="benchmark-section"><h3>Отраслевые бенчмарки</h3><div class="benchmark-grid">${Object.entries(bench).map(([k,v])=>`<div class="benchmark-item"><b>${k.replace(/([A-Z])/g,' $1').trim()}</b><div class="bench-bar"><span style="width:${v.percentile}%"></span></div><span class="bench-value">${v.company}</span><span class="bench-trend bench-${v.trend}">${v.trend=='growing'?'Растёт':v.trend=='declining'?'Падает':v.trend=='improving'?'Улучшается':'Стабильно'}</span></div>`).join('')}</div></div>`;
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки ROI.</p>';}
}

async function renderForecast(){
  const el=document.getElementById('forecastContent');
  const alertEl=document.getElementById('forecastAlert');
  if(!el)return;
  try{
    const f=await(await fetch('/api/forecast')).json();
    const a=await(await fetch('/api/forecast/alert')).json();
    if(alertEl&&a.hasAlert)alertEl.innerHTML=`<div class="forecast-alert forecast-${a.severity}"><span>⚠</span><div><b>${a.title}</b><p>${a.detail}</p></div><span class="forecast-gap">$${(a.gap/1000).toFixed(0)}k разрыв · ${a.daysRemaining}д осталось</span></div>`;
    el.innerHTML=`<div class="forecast-grid"><div class="forecast-card"><h3>Воронка</h3><div class="forecast-metric"><b>$${(f.pipeline.current/1e6).toFixed(1)}M</b><small>Текущий</small></div><div class="forecast-metric"><b>$${(f.pipeline.forecast/1e6).toFixed(1)}M</b><small>Прогноз</small></div><div class="forecast-metric"><b>$${(f.pipeline.target/1e6).toFixed(1)}M</b><small>Цель</small></div><div class="forecast-prob"><span style="width:${f.pipeline.probability}%"></span><small>${f.pipeline.probability}% вероятности</small></div></div><div class="forecast-card"><h3>Выручка</h3><div class="forecast-metric"><b>$${f.revenue.current.toLocaleString()}</b><small>Текущий</small></div><div class="forecast-metric"><b>$${f.revenue.forecast.toLocaleString()}</b><small>Прогноз</small></div><div class="forecast-metric"><b>$${f.revenue.target.toLocaleString()}</b><small>Цель</small></div><div class="forecast-prob"><span style="width:${f.revenue.probability}%"></span><small>${f.revenue.probability}% вероятности</small></div></div><div class="forecast-card"><h3>Runway</h3><div class="forecast-metric"><b>${f.cashRunway.current}мес</b><small>Текущий</small></div><div class="forecast-metric"><b>${f.cashRunway.forecast}мес</b><small>Прогноз</small></div><div class="forecast-metric"><b>${f.cashRunway.minimum}мес</b><small>Минимум</small></div></div></div><div class="forecast-plan"><h3>План Q3: ${f.quarterlyPlan.percentComplete}% выполнено</h3><div class="progress"><span style="width:${f.quarterlyPlan.percentComplete}%"></span></div><p>Прогноз: ${f.quarterlyPlan.projectedCompletion}% · Риск: ${f.quarterlyPlan.riskLevel=='moderate'?'Умеренный':f.quarterlyPlan.riskLevel=='high'?'Высокий':'Низкий'}</p><ul>${f.quarterlyPlan.keyRisks.map(r=>`<li>${r}</li>`).join('')}</ul></div><div class="forecast-recs"><h3>Рекомендации</h3>${f.recommendations.map(r=>`<div class="forecast-rec forecast-${r.priority}"><b>${r.action}</b><span>${r.impact}</span></div>`).join('')}</div>`;
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки прогноза.</p>';}
}

async function renderCustomerHealth(){
  const el=document.getElementById('customerHealthContent');
  if(!el)return;
  try{
    const ch=await(await fetch('/api/customer-health')).json();
    el.innerHTML=`<div class="ch-summary"><div class="ch-stat ch-healthy"><b>${ch.summary.healthy}</b><small>Здоровы</small></div><div class="ch-stat ch-warning"><b>${ch.summary.warning}</b><small>Внимание</small></div><div class="ch-stat ch-atrisk"><b>${ch.summary.atRisk}</b><small>В зоне риска</small></div><div class="ch-stat ch-mrr"><b>$${(ch.summary.totalMRR/1e3).toFixed(0)}k</b><small>Общий MRR</small></div><div class="ch-stat ch-risk"><b>${ch.summary.churnRisk}%</b><small>Риск оттока</small></div></div>
    <div class="ch-insights">${ch.insights.map(i=>`<div class="ch-insight ch-${i.type}"><span>${i.type==='critical'?'🚨':i.type==='warning'?'⚠':'💡'}</span><div><b>${i.title}</b><p>${i.detail}</p><small>Действие: ${i.action}</small></div></div>`).join('')}</div>
    <div class="ch-accounts"><h3>Все аккаунты</h3>${ch.accounts.map(a=>`<div class="ch-account ch-${a.health}"><div class="ch-account-header"><b>${a.name}</b><span class="ch-badge ch-${a.health}">${a.health=='healthy'?'Здоров':a.health=='warning'?'Внимание':'Риск'}</span></div><div class="ch-account-metrics"><span>$${a.mrr.toLocaleString()} MRR</span><span>Использование: ${a.usage}%</span><span>NPS: ${a.nps}</span><span>Продление: ${new Date(a.renewalDate).toLocaleDateString()}</span></div>${a.riskFactors.length?`<div class="ch-risk-factors">${a.riskFactors.map(r=>`<span class="ch-risk-tag">${r}</span>`).join('')}</div>`:''}</div>`).join('')}</div>`;
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки здоровья клиентов.</p>';}
}

async function renderMarketplace(){
  const el=document.getElementById('marketplaceGrid');
  if(!el)return;
  try{
    const items=await(await fetch('/api/marketplace')).json();
    el.innerHTML=items.map(t=>`<div class="mp-card ${t.installed?'mp-installed':''}"><div class="mp-header"><span class="mp-category mp-${t.category}">${t.category=='retention'?'Удержание':t.category=='financial'?'Финансы':t.category=='marketing'?'Маркетинг':t.category=='sales'?'Продажи':t.category=='operations'?'Операции':t.category=='compliance'?'Комплаенс':t.category=='hr'?'HR':'Поддержка'}</span><span class="mp-time">${t.setupTime}</span></div><h3>${t.name}</h3><p>${t.description}</p><div class="mp-agents"><small>Использует: ${t.agents.join(', ')}</small></div>${t.installed?'<span class="mp-installed-badge">✓ Установлен</span>':`<button class="primary mp-install-btn" data-template="${t.id}">Установить <span>+</span></button>`}</div>`).join('');
    el.querySelectorAll('.mp-install-btn').forEach(b=>b.onclick=async()=>{const res=await fetch('/api/marketplace/install',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({templateId:b.dataset.template})});if(res.ok){b.textContent='✓ Установлен';b.disabled=true;renderMarketplace()}});
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки маркетплейса.</p>';}
}

async function renderKnowledgeSearch(){
  const el=document.getElementById('knowledgeResults');
  const q=document.getElementById('knowledgeQuery').value;
  if(!el||!q)return;
  try{
    const res=await(await fetch('/api/knowledge/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q})})).json();
    el.innerHTML=res.results.length?`<h3>${res.totalResults} результатов</h3>${res.results.map(r=>`<div class="kb-result"><div class="kb-source">${r.source}</div><b>${r.title}</b><p>${r.snippet}</p><div class="kb-meta"><span>Релевантность: ${Math.round(r.relevance*100)}%</span><span>Свежесть: ${r.freshness}%</span></div></div>`).join('')}`:'<p class="hero-sub">Ничего не найдено.</p>';
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка поиска.</p>';}
}

document.getElementById('runKnowledgeSearch').onclick=renderKnowledgeSearch;
document.getElementById('knowledgeQuery').onkeydown=e=>{if(e.key==='Enter')renderKnowledgeSearch()};

async function renderPolicies(){
  const el=document.getElementById('policiesList');
  if(!el)return;
  try{
    const policies=await(await fetch('/api/policies')).json();
    el.innerHTML=policies.map(p=>`<div class="policy-card"><div class="policy-header"><b>${p.name}</b><span class="policy-level policy-${p.level}">${p.level=='create'?'Создание':p.level=='approval'?'Одобрение':p.level=='draft'?'Черновик':'Аудит'}</span></div><p>${p.description}</p><div class="policy-meta"><span>Область: ${p.scope}</span>${p.approver?`<span>Утверждающий: ${p.approver}</span>`:''}${p.editable?'<span class="policy-editable">Редактируемо</span>':'<span class="policy-locked">🔒 Системное</span>'}</div></div>`).join('');
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки политик.</p>';}
}

async function renderUsers(){
  const el=document.getElementById('usersList');
  if(!el)return;
  try{
    const data=await(await fetch('/api/users')).json();
    el.innerHTML=`<div class="users-grid">${data.users.map(u=>`<div class="user-card ${u.role==='ceo'?'user-ceo':''}"><span class="avatar" style="background:${u.role==='ceo'?'#247b68':u.role==='cro'?'#57937f':u.role==='cmo'?'#bb915e':'#6394b1'}">${u.avatar}</span><div><b>${u.name}</b><small>${u.role.toUpperCase()} · ${u.department}</small></div><span class="user-role-badge">${u.role=='ceo'?'CEO':u.role=='cro'?'CRO':u.role=='cmo'?'CMO':u.role=='finance'?'Финансы':u.role=='manager'?'Менеджер':'Сотрудник'}</span></div>`).join('')}</div><div class="roles-section"><h3>Роли и права</h3><div class="roles-grid">${Object.entries(data.roles).map(([key,role])=>`<div class="role-card"><b>${role.toUpperCase()}</b><small>права ${key}</small></div>`).join('')}</div></div>`;
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки пользователей.</p>';}
}

async function renderGraphInsights(){
  const el=document.getElementById('graphInsights');
  if(!el)return;
  try{
    const g=await(await fetch('/api/business-graph')).json();
    el.innerHTML=`<div class="graph-insights"><h3>Инсайты ИИ</h3>${g.insights.map(i=>`<div class="graph-insight"><span class="graph-insight-strength graph-${i.strength}">${i.strength=='strong'?'Сильная':i.strength=='moderate'?'Умеренная':'Слабая'}</span><div><b>${i.path}</b><p>${i.impact}</p></div></div>`).join('')}</div>`;
  }catch(e){}
}

// ===== HYDRATE =====
async function hydrate(){
  const response=await fetch('/api/bootstrap');
  if(!response.ok)throw new Error('Authentication required');
  workspaceData=await response.json();
  const active=workspaceData.agents.filter(a=>a.state==='active').length;
  document.querySelector('.live').innerHTML=`<i></i> ${active} активно`;
  const saved=workspaceData.tasks.reduce((acc,t)=>{(acc[t.lane]??=[]).push([t.domain,t.title,`${t.owner} · ${t.due}`,t.id]);return acc},{});
  Object.keys(tasks).forEach(k=>tasks[k]=saved[k]||[]);
  renderBoard();
  renderOverview(workspaceData);
  await loadGovernance();
  try{
    const notifs=await(await fetch('/api/notifications')).json();
    renderNotifications(notifs);
    const wfs=await(await fetch('/api/workflows')).json();
    renderWorkflows(wfs);
    renderROI();
    renderForecast();
    renderCustomerHealth();
    renderMarketplace();
    renderPolicies();
    renderUsers();
    renderGraphInsights();
    renderScenarioSimulator();
  }catch(e){}
}

const loginGate=document.getElementById('loginGate');
const loginForm=document.getElementById('loginForm');
const loginError=document.getElementById('loginError');

async function signIn(event){
  event.preventDefault();
  loginError.classList.add('hidden');
  const submit=loginForm.querySelector('button');
  submit.disabled=true;
  try{
    const response=await browserFetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('loginEmail').value,password:document.getElementById('loginPassword').value})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Unable to sign in');
    authToken=data.token;
    localStorage.setItem('axiom_token',authToken);
    loginGate.classList.add('hidden');
    await hydrate();
    // Show morning brief on first login
    setTimeout(showMorningBrief,500);
  }catch(error){
    loginError.textContent=error.message;
    loginError.classList.remove('hidden');
  }finally{submit.disabled=false;}
}

loginForm.addEventListener('submit',signIn);
if(authToken){
  hydrate().catch(()=>{localStorage.removeItem('axiom_token');authToken=null;loginGate.classList.remove('hidden')});
}else{
  loginGate.classList.remove('hidden');
}

document.addEventListener('click',e=>{
  const popover=document.getElementById('notificationPopover');
  if(popover&&!popover.classList.contains('hidden')&&!e.target.closest('.notification-wrap')&&!e.target.closest('#notificationPopover'))popover.classList.add('hidden');
});

// ===== V2.1 NEW FEATURES =====

// === OKR RENDERER ===
async function renderOKRs(){
  const el=document.getElementById('okrContent');
  if(!el)return;
  el.innerHTML='<p style="color:#71807a">Загрузка OKR...</p>';
  try{
    const okrs=await(await fetch('/api/okrs')).json();
    if(!okrs.length){
      const templates=await(await fetch('/api/okrs/templates')).json();
      el.innerHTML=`<div class="okr-templates">${templates.map((t,i)=>`<div class="okr-tpl" data-tpl="${i}"><h3>${t.objective}</h3><p>${t.keyResults.length} Key Results</p></div>`).join('')}</div><p style="color:#71807a;font-size:11px;text-align:center;margin-top:12px">Выберите шаблон для создания OKR</p>`;
      el.querySelectorAll('.okr-tpl').forEach(c=>c.onclick=async()=>{
        await fetch('/api/okrs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({templateId:`okr-tpl-${c.dataset.tpl}`})});
        renderOKRs();
      });
      return;
    }
    el.innerHTML=`<div class="okr-grid">${okrs.map(o=>`<div class="okr-card"><div class="okr-header"><h3>${o.objective}</h3><span class="okr-badge okr-${o.health}">${o.health==='on_track'?'В плане':o.health==='needs_attention'?'Внимание':'Риск'}</span></div><div class="okr-category">${o.category} · ${o.quarter}</div><div class="okr-progress"><div class="okr-progress-bar"><span style="width:${o.progress}%"></span></div><span class="okr-progress-text">${o.progress}%</span></div>${o.keyResults.map(kr=>`<div class="okr-kr"><div class="okr-kr-header"><b>${kr.title}</b><span class="okr-kr-trend okr-kr-${kr.trend}">${kr.trend==='improving'?'↑':kr.trend==='declining'?'↓':'→'}</span></div><div class="okr-kr-bar"><span style="width:${(kr.current/kr.target*100).toFixed(0)}%"></span></div><div style="display:flex;justify-content:space-between;font-size:9px;color:#75827d;margin-top:2px"><span>${kr.current}${kr.unit==='$'?'k':''} / ${kr.target}${kr.unit==='$'?'k':''} ${kr.unit}</span><span>${(kr.current/kr.target*100).toFixed(0)}%</span></div></div>`).join('')}<div class="okr-footer"><span>Создан: ${new Date(o.createdAt).toLocaleDateString()}</span><span>Прогноз: ${o.health==='on_track'?'✅':'⚠️'}</span></div></div>`).join('')}</div>`;
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки OKR.</p>';}
}

document.getElementById('showOkrTemplates').onclick=async()=>{
  const modal=document.getElementById('modal');
  try{
    const templates=await(await fetch('/api/okrs/templates')).json();
    document.getElementById('modalContent').innerHTML=`<p class="eyebrow">ШАБЛОНЫ OKR</p><h2>Выберите цель</h2><div class="okr-templates">${templates.map((t,i)=>`<div class="okr-tpl" data-tpl="${i}"><h3>${t.objective}</h3><p>${t.keyResults.length} Key Results</p></div>`).join('')}</div>`;
    modal.classList.remove('hidden');
    modal.querySelectorAll('.okr-tpl').forEach(c=>c.onclick=async()=>{
      await fetch('/api/okrs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({templateId:`okr-tpl-${c.dataset.tpl}`})});
      modal.classList.add('hidden');
      renderOKRs();
    });
  }catch(e){}
};

document.getElementById('showAiGoals').onclick=async()=>{
  const modal=document.getElementById('modal');
  try{
    const goals=await(await fetch('/api/okrs/ai-goals')).json();
    document.getElementById('modalContent').innerHTML=`<p class="eyebrow">AI-ЦЕЛИ</p><h2>Рекомендованные цели</h2><p style="color:#71807a;font-size:12px">AI проанализировал текущие метрики и предлагает SMART-цели</p><div class="okr-ai-suggestions" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px">${goals.map(g=>`<div class="okr-ai-card" style="border:1px solid #d9eee3;background:#f7fbf9;border-radius:9px;padding:14px;position:relative"><span class="confidence" style="position:absolute;top:8px;right:8px;font:9px 'DM Mono';color:#247b68">${(g.confidence*100).toFixed(0)}%</span><h4 style="font-size:12px;margin:0 0 4px">${g.objective}</h4><p style="font-size:10px;color:#75827d;margin:0 0 8px;line-height:1.4">${g.reasoning}</p><small style="font-size:9px;color:#247b68;display:block">${g.keyResults.length} Key Results</small><button class="primary" style="margin-top:8px;width:100%;padding:6px" data-ai-goal='${JSON.stringify(g).replace(/'/g,"&#39;")}'>Создать</button></div>`).join('')}</div>`;
    modal.classList.remove('hidden');
    modal.querySelectorAll('[data-ai-goal]').forEach(b=>b.onclick=async()=>{
      const goal=JSON.parse(b.dataset.aiGoal);
      await fetch('/api/okrs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({objective:goal.objective,category:goal.category,keyResults:goal.keyResults})});
      modal.classList.add('hidden');
      renderOKRs();
    });
  }catch(e){}
};

// === CHARTS RENDERER ===
async function renderCharts(){
  const el=document.getElementById('chartsContent');
  if(!el)return;
  el.innerHTML='<p style="color:#71807a">Загрузка графиков...</p>';
  try{
    const charts=await(await fetch('/api/charts/dashboard')).json();
    el.innerHTML=`<div class="chart-grid">
      <div class="chart-card"><h3>${charts.revenueTrend.title}</h3><svg class="chart-svg" viewBox="0 0 300 70"><path d="${charts.revenueTrend.data.map((d,i)=>`${i===0?'M':'L'}${i*25},${70-(d.value/1000)*5}`).join(' ')}" fill="none" stroke="#247b68" stroke-width="2"/></svg></div>
      <div class="chart-card"><h3>${charts.pipelineTrend.title}</h3><svg class="chart-svg" viewBox="0 0 300 70"><path d="${charts.pipelineTrend.data.map((d,i)=>`${i===0?'M':'L'}${i*25},${70-(d.value/20)*5}`).join(' ')}" fill="none" stroke="#57937f" stroke-width="2"/></svg></div>
      <div class="chart-card"><h3>${charts.churnTrend.title}</h3><svg class="chart-svg" viewBox="0 0 300 70"><path d="${charts.churnTrend.data.map((d,i)=>`${i===0?'M':'L'}${i*25},${70-d.value*15}`).join(' ')}" fill="none" stroke="#d86550" stroke-width="2"/></svg></div>
      <div class="chart-card"><h3>${charts.npsTrend.title}</h3><svg class="chart-svg" viewBox="0 0 300 70"><path d="${charts.npsTrend.data.map((d,i)=>`${i===0?'M':'L'}${i*25},${70-(d.value/52)*50}`).join(' ')}" fill="none" stroke="#6394b1" stroke-width="2"/></svg></div>
      <div class="chart-card"><h3>Pipeline распределение</h3><div class="chart-distribution">${charts.pipelineDistribution.map(d=>`<div class="chart-dist-item"><span class="chart-dist-dot" style="background:${d.color}"></span>${d.label} ${d.percentage}%</div>`).join('')}</div></div>
      <div class="chart-card"><h3>Выручка по каналам</h3><div class="chart-bar">${charts.revenueByChannel.map(d=>`<div class="chart-bar-col"><div class="chart-bar-fill" style="height:${(d.value/320)*60}px;background:${d.color}"></div><span class="chart-bar-value">$${d.value}k</span><span class="chart-bar-label">${d.label}</span></div>`).join('')}</div></div>
    </div>`;
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки графиков.</p>';}
}

// === DECISION REGISTRY RENDERER ===
async function renderDecisions(){
  const el=document.getElementById('decisionsContent');
  if(!el)return;
  el.innerHTML='<p style="color:#71807a">Загрузка решений...</p>';
  try{
    const data=await(await fetch('/api/decision-registry')).json();
    const summary=await(await fetch('/api/decision-registry/summary')).json();
    el.innerHTML=`<div class="dreg-summary">
      <div class="roi-card roi-primary"><span class="roi-icon">📋</span><b>${summary.totalDecisions}</b><small>Всего решений</small></div>
      <div class="roi-card roi-success"><span class="roi-icon">⚡</span><b>${summary.activeDecisions}</b><small>Активных</small></div>
      <div class="roi-card roi-info"><span class="roi-icon">✓</span><b>${summary.completedThisWeek}</b><small>На этой неделе</small></div>
      <div class="roi-card roi-danger"><span class="roi-icon">$</span><b>$${(summary.totalExpectedValue/1000).toFixed(0)}k</b><small>Ожидаемая ценность</small></div>
    </div>
    <div class="dreg-list">${data.decisions.length?data.decisions.slice(0,20).map(d=>`<div class="dreg-card"><div class="dreg-header"><b>${d.title}</b><span class="dreg-status dreg-${d.status}">${d.status==='approved'?'Утверждено':d.status==='in_progress'?'В работе':d.status==='completed'?'Выполнено':'Отклонено'}</span></div><div class="dreg-meta"><span>${d.owner}</span><span>${d.category}</span><span>${d.priority}</span>${d.expectedValue?`<span class="dreg-value">$${d.expectedValue.toLocaleString()}</span>`:''}</div>${d.tags.length?`<div class="dreg-tags">${d.tags.map(t=>`<span class="dreg-tag">${t}</span>`).join('')}</div>`:''}</div>`).join(''):'<p class="hero-sub" style="padding:40px;text-align:center">Нет решений. Утвердите расследование, чтобы создать первое.</p>'}</div>`;
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки решений.</p>';}
}

// === POP ANALYSIS RENDERER ===
async function renderPopAnalysis(){
  const el=document.getElementById('popContent');
  if(!el)return;
  el.innerHTML='<p style="color:#71807a">Загрузка анализа...</p>';
  try{
    const pop=await(await fetch('/api/pop-analysis')).json();
    const periods=['weekly','monthly','quarterly'];
    const labels=['Неделя к неделе','Месяц к месяцу','Квартал к кварталу'];
    el.innerHTML=`<div class="pop-tabs">${periods.map((p,i)=>`<button class="pop-tab ${i===0?'active':''}" data-pop="${p}">${labels[i]}</button>`).join('')}</div>
    ${periods.map((p,i)=>`<div class="pop-panel ${i===0?'active-panel':''}" id="popPanel${p}"></div>`).join('')}`;
    periods.forEach(p=>renderPopPanel(p,pop[p]));
    el.querySelectorAll('.pop-tab').forEach(t=>t.onclick=()=>{
      el.querySelectorAll('.pop-tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      el.querySelectorAll('.pop-panel').forEach(x=>x.classList.remove('active-panel'));
      document.getElementById('popPanel'+t.dataset.pop).classList.add('active-panel');
    });
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки анализа.</p>';}
}

function renderPopPanel(period,data){
  const panel=document.getElementById('popPanel'+period);
  if(!panel||!data)return;
  panel.innerHTML=`<div class="pop-grid">${data.metrics.map(m=>`<div class="pop-card"><div class="pop-info"><b>${m.label}</b><div class="pop-values"><span>${m.unit==='$'?'$'+m.previous.toLocaleString():m.previous}</span><span>→</span><span>${m.unit==='$'?'$'+m.current.toLocaleString():m.current}</span></div></div><span class="pop-change pop-${m.change.direction}">${m.change.direction==='up'?'↑':m.change.direction==='down'?'↓':'→'} ${m.change.percent}%</span></div>`).join('')}</div>
  <div class="pop-summary"><h3>Сводка: ${data.label}</h3>${data.summary.details?data.summary.details.map(d=>`<div class="${d.includes('внимание')||d.includes('срочно')?'pop-risk':'pop-highlight'}">${d}</div>`).join(''):''}</div>`;
}

// === AUTO ACTIONS RENDERER ===
async function renderAutoActions(){
  const el=document.getElementById('actionsContent');
  if(!el)return;
  el.innerHTML='<p style="color:#71807a">Загрузка действий...</p>';
  try{
    const stats=await(await fetch('/api/auto-actions/stats')).json();
    const actions=await(await fetch('/api/auto-actions')).json();
    el.innerHTML=`<div class="dreg-summary">
      <div class="roi-card roi-primary"><span class="roi-icon">⚡</span><b>${stats.total}</b><small>Всего действий</small></div>
      <div class="roi-card roi-success"><span class="roi-icon">⏳</span><b>${stats.pending}</b><small>Ожидают</small></div>
      <div class="roi-card roi-info"><span class="roi-icon">✓</span><b>${stats.completed}</b><small>Выполнено</small></div>
      <div class="roi-card roi-danger"><span class="roi-icon">💬</span><b>${stats.bySource.chat}</b><small>Из чата</small></div>
    </div>
    <div class="dreg-list">${actions.length?actions.slice(0,20).map(a=>`<div class="dreg-card"><div class="dreg-header"><b>${a.title}</b><span class="dreg-status dreg-${a.status==='pending'?'approved':a.status==='in_progress'?'in_progress':'completed'}">${a.status==='pending'?'Создано':a.status==='in_progress'?'В работе':'Выполнено'}</span></div><div class="dreg-meta"><span>${a.owner}</span><span>${a.domain}</span><span>${a.source}</span><span>${a.due||''}</span></div></div>`).join(''):'<p class="hero-sub" style="padding:40px;text-align:center">Нет авто-действий. Напишите AI "запусти план восстановления" в чате.</p>'}</div>`;
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки действий.</p>';}
}

// === RISK REGISTER RENDERER ===
async function renderRisks(){
  const el=document.getElementById('risksContent');
  if(!el)return;
  el.innerHTML='<p style="color:#71807a">Загрузка рисков...</p>';
  try{
    await fetch('/api/risks/auto-detect',{method:'POST'});
    const summary=await(await fetch('/api/risks/summary')).json();
    const risks=await(await fetch('/api/risks')).json();
    el.innerHTML=`<div class="dreg-summary">
      <div class="roi-card roi-danger"><span class="roi-icon">🚨</span><b>${summary.active}</b><small>Активных рисков</small></div>
      <div class="roi-card roi-primary"><span class="roi-icon">🔴</span><b>${summary.critical+summary.high}</b><small>Критичных/Высоких</small></div>
      <div class="roi-card roi-success"><span class="roi-icon">✓</span><b>${summary.mitigated+summary.closed}</b><small>Устранено</small></div>
      <div class="roi-card roi-info"><span class="roi-icon">📊</span><b>${summary.averageScore}</b><small>Средний score</small></div>
    </div>
    <div class="dreg-list">${risks.length?risks.slice(0,20).map(r=>`<div class="dreg-card"><div class="dreg-header"><b>${r.title}</b><span class="dreg-status dreg-${r.severity==='critical'||r.severity==='high'?'rejected':'completed'}">${r.severity}</span></div><p style="font-size:10px;color:#75827d;margin:4px 0">${r.description}</p><div class="dreg-meta"><span>Score: ${r.score}</span><span>${r.owner}</span><span>${r.category}</span><span>${r.impact}</span></div></div>`).join(''):'<p class="hero-sub" style="padding:40px;text-align:center">Рисков не обнаружено.</p>'}</div>`;
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки рисков.</p>';}
}

// === SLA RENDERER ===
async function renderSLA(){
  const el=document.getElementById('slaContent');
  if(!el)return;
  el.innerHTML='<p style="color:#71807a">Загрузка SLA...</p>';
  try{
    const sla=await(await fetch('/api/sla')).json();
    el.innerHTML=`<div class="dreg-summary">
      <div class="roi-card roi-success"><span class="roi-icon">✓</span><b>${sla.stats.met}</b><small>Выполнено</small></div>
      <div class="roi-card roi-primary"><span class="roi-icon">⚠</span><b>${sla.stats.warning}</b><small>Предупреждение</small></div>
      <div class="roi-card roi-danger"><span class="roi-icon">🚨</span><b>${sla.stats.breached}</b><small>Нарушено</small></div>
      <div class="roi-card roi-info"><span class="roi-icon">📊</span><b>${sla.stats.overall==='healthy'?'✅':sla.stats.overall==='at_risk'?'⚠️':'🔴'}</b><small>Общий статус</small></div>
    </div>
    ${sla.alerts.length?`<div style="margin-bottom:14px"><p class="eyebrow amber">⚠ АЛЕРТЫ</p>${sla.alerts.map(a=>`<div class="forecast-alert forecast-${a.severity==='critical'?'warning':''}"><span>${a.severity==='critical'?'🚨':'⚠'}</span><div><b>${a.name}</b><p>${a.detail}</p></div><span class="forecast-gap">${a.owner}</span></div>`).join('')}</div>`:''}
    <div class="okr-grid">${sla.slas.map(s=>`<div class="okr-card"><div class="okr-header"><h3>${s.name}</h3><span class="okr-badge okr-${s.status==='met'?'on_track':s.status==='warning'?'needs_attention':'at_risk'}">${s.status==='met'?'ОК':s.status==='warning'?'Внимание':'Нарушено'}</span></div><p style="font-size:10px;color:#75827d;margin:0 0 8px">${s.description}</p><div class="okr-progress"><div class="okr-progress-bar"><span style="width:${Math.min(100,s.status==='met'?100:50)}%;background:${s.status==='met'?'#3da47e':s.status==='warning'?'#e5a83f':'#d86550'}"></span></div><span class="okr-progress-text">${s.current}${s.unit}</span></div><div class="okr-footer"><span>Target: ${s.target}${s.unit}</span><span>${s.owner}</span></div></div>`).join('')}</div>`;
  }catch(e){el.innerHTML='<p class="hero-sub">Ошибка загрузки SLA.</p>';}
}

// === ADD RENDER CALLS TO HYDRATE ===
const origHydrate=hydrate;
hydrate=async function(){
  await origHydrate();
  renderOKRs();
  renderCharts();
  renderDecisions();
  renderPopAnalysis();
  renderAutoActions();
  renderRisks();
  renderSLA();
};

// Initialize command palette
initCommandPalette();
