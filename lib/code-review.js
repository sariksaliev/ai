// AI Code Review & Deployment Engine v2.0
// Code quality analysis, PR reviews, deployment tracking, team velocity
const crypto = require('crypto');

const REPOSITORIES = [
  { id: 'repo_api', name: 'api-service', language: 'Node.js', branch: 'main', stars: 24, prs: 8, issues: 12 },
  { id: 'repo_frontend', name: 'frontend-app', language: 'React', branch: 'main', stars: 18, prs: 5, issues: 9 },
  { id: 'repo_mobile', name: 'mobile-app', language: 'React Native', branch: 'main', stars: 7, prs: 3, issues: 15 },
  { id: 'repo_infra', name: 'infrastructure', language: 'Terraform', branch: 'main', stars: 4, prs: 2, issues: 4 }
];

const CODE_QUALITY_RULES = [
  { id: 'rule_1', name: 'No console.log in production', severity: 'warning', category: 'best_practices' },
  { id: 'rule_2', name: 'Maximum function length: 50 lines', severity: 'warning', category: 'maintainability' },
  { id: 'rule_3', name: 'No hardcoded credentials', severity: 'error', category: 'security' },
  { id: 'rule_4', name: 'All API endpoints must have validation', severity: 'error', category: 'reliability' },
  { id: 'rule_5', name: 'Test coverage > 70% required', severity: 'warning', category: 'testing' },
  { id: 'rule_6', name: 'No TODO comments in production code', severity: 'info', category: 'maintainability' },
  { id: 'rule_7', name: 'Dockerfile must use multi-stage builds', severity: 'warning', category: 'devops' },
  { id: 'rule_8', name: 'Environment variables must be documented', severity: 'info', category: 'documentation' }
];

class CodeReview {
  constructor() {
    this.prs = this.generatePRs();
    this.deployments = this.generateDeployments();
    this.reviews = this.generateReviews();
  }

  generatePRs() {
    const prTitles = [
      'feat: add revenue intelligence dashboard', 'fix: resolve N+1 query in customer list',
      'chore: update dependencies', 'feat: implement sentiment analysis API',
      'fix: correct timezone handling in reports', 'refactor: extract common utilities',
      'feat: add meeting intelligence module', 'docs: update API documentation',
      'fix: memory leak in WebSocket connections', 'feat: implement notification engine'
    ];

    return Array.from({ length: 15 }, (_, i) => {
      const repo = REPOSITORIES[Math.floor(Math.random() * REPOSITORIES.length)];
      const created = new Date(Date.now() - Math.random() * 14 * 86400000);
      const statuses = ['open', 'in_review', 'approved', 'merged', 'closed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const additions = Math.floor(Math.random() * 500) + 10;
      const deletions = Math.floor(Math.random() * 200);

      return {
        id: `pr_${Date.now()}_${i}`,
        number: i + 101,
        title: prTitles[i % prTitles.length],
        repository: repo.id,
        author: ['anna.s', 'max.i', 'elena.p', 'dmitry.s', 'alex.v'][Math.floor(Math.random() * 5)],
        status,
        created: created.toISOString(),
        updated: new Date(created.getTime() + Math.random() * 48 * 3600000).toISOString(),
        additions,
        deletions,
        filesChanged: Math.floor(Math.random() * 15) + 1,
        reviewers: ['Анна С.', 'Максим И.', 'Елена П.', 'Дмитрий С.'].slice(0, Math.floor(Math.random() * 3) + 1),
        comments: Math.floor(Math.random() * 20),
        ciPassing: Math.random() > 0.2,
        coverage: Math.round(40 + Math.random() * 55)
      };
    });
  }

  generateDeployments() {
    const environments = ['production', 'staging', 'development'];
    const statuses = ['success', 'failed', 'in_progress', 'rolled_back'];
    
    return Array.from({ length: 10 }, (_, i) => ({
      id: `deploy_${Date.now()}_${i}`,
      repository: REPOSITORIES[Math.floor(Math.random() * REPOSITORIES.length)].id,
      version: `v2.${i}.${Math.floor(Math.random() * 10)}`,
      environment: environments[Math.floor(Math.random() * environments.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      startedAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      completedAt: new Date(Date.now() - Math.random() * 6 * 86400000).toISOString(),
      duration: Math.floor(Math.random() * 30) + 5, // minutes
      triggeredBy: ['CI/CD', 'Анна С.', 'Максим И.', 'Auto-deploy'][Math.floor(Math.random() * 4)],
      commitSha: crypto.randomUUID().slice(0, 7),
      rollback: Math.random() > 0.9 ? { reason: 'Performance regression detected', timestamp: new Date().toISOString() } : null
    }));
  }

  generateReviews() {
    return Array.from({ length: 20 }, (_, i) => ({
      id: `review_${Date.now()}_${i}`,
      prId: `pr_${Date.now()}_${Math.floor(Math.random() * 15)}`,
      reviewer: ['Анна С.', 'Максим И.', 'Елена П.', 'Дмитрий С.'][Math.floor(Math.random() * 4)],
      verdict: ['approved', 'changes_requested', 'commented'][Math.floor(Math.random() * 3)],
      comments: this.generateReviewComments(),
      reviewedAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      qualityScore: Math.round(60 + Math.random() * 40)
    }));
  }

  generateReviewComments() {
    const comments = [
      { line: 42, file: 'server.js', message: 'Consider using async/await instead of callbacks', severity: 'info' },
      { line: 87, file: 'api.js', message: 'Missing input validation for user ID', severity: 'error' },
      { line: 15, file: 'config.js', message: 'Hardcoded API key detected! Use env variables', severity: 'error' },
      { line: 203, file: 'service.js', message: 'Function too long (85 lines). Consider refactoring', severity: 'warning' },
      { line: 66, file: 'test.js', message: 'Test coverage is 65%, should be > 70%', severity: 'warning' }
    ];
    return comments.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  analyzeCode(code, filename) {
    const issues = [];
    const lines = code.split('\n');

    // Check for console.log
    lines.forEach((line, i) => {
      if (line.includes('console.log') && !filename.includes('test')) {
        issues.push({ line: i + 1, severity: 'warning', message: 'console.log in production code', rule: 'rule_1' });
      }
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({ line: i + 1, severity: 'info', message: 'TODO/FIXME comment found', rule: 'rule_6' });
      }
      if (line.includes('password') || line.includes('secret') || line.includes('api_key')) {
        if (line.includes('=') && !line.includes('process.env')) {
          issues.push({ line: i + 1, severity: 'error', message: 'Potential credential hardcoded', rule: 'rule_3' });
        }
      }
    });

    // Check function length
    let functionLines = 0;
    let inFunction = false;
    lines.forEach((line, i) => {
      if (line.match(/function\s*\w*\s*\(/) || line.match(/=>\s*\{/) || line.match(/async\s+\w*\s*\(/)) {
        inFunction = true;
        functionLines = 0;
      }
      if (inFunction) {
        functionLines++;
        if (line.includes('}') && functionLines > 50) {
          issues.push({ line: i + 1, severity: 'warning', message: `Function too long (${functionLines} lines, max 50)`, rule: 'rule_2' });
          inFunction = false;
        }
        if (line.includes('}')) inFunction = false;
      }
    });

    return {
      issues,
      score: Math.max(0, 100 - issues.reduce((s, i) => s + (i.severity === 'error' ? 15 : i.severity === 'warning' ? 5 : 1), 0)),
      summary: issues.length > 0 
        ? `Найдено ${issues.filter(i => i.severity === 'error').length} ошибок, ${issues.filter(i => i.severity === 'warning').length} предупреждений`
        : 'Код соответствует стандартам качества'
    };
  }

  reviewPullRequest(prId) {
    const pr = this.prs.find(p => p.id === prId);
    if (!pr) return { error: 'PR not found' };

    pr.status = 'in_review';
    const reviewResult = this.analyzeCode(this.simulatePRCode(pr), pr.title.includes('server') ? 'server.js' : 'app.js');
    
    const review = {
      id: `review_${Date.now()}`,
      prId,
      reviewer: 'AI Code Review Agent',
      verdict: reviewResult.score >= 80 ? 'approved' : reviewResult.score >= 60 ? 'changes_requested' : 'blocked',
      score: reviewResult.score,
      issues: reviewResult.issues,
      summary: reviewResult.summary,
      reviewedAt: new Date().toISOString(),
      suggestions: this.generateSuggestions(reviewResult.issues)
    };

    this.reviews.push(review);
    return review;
  }

  simulatePRCode(pr) {
    return `const express = require('express');
const app = express();

// TODO: add error handling
app.get('/api/users', (req, res) => {
  console.log('Fetching users');
  const users = db.query('SELECT * FROM users');
  res.json(users);
});

const API_KEY = 'sk-123456789'; // HARDCODED!

app.post('/api/process', async (req, res) => {
  if (!req.body.id) {
    return res.status(400).json({ error: 'Missing id' });
  }
  // Process data
  const result = await processData(req.body.id);
  res.json(result);
});

function veryLongFunctionThatDoesManyThingsAndShouldBeRefactored() {
  console.log('Processing...');
  // ... many lines of code
  // ... many lines of code
  // ... many lines of code
}`;
  }

  generateSuggestions(issues) {
    const suggestions = [];
    const errorIssues = issues.filter(i => i.severity === 'error');
    const warningIssues = issues.filter(i => i.severity === 'warning');

    if (errorIssues.length > 0) {
      suggestions.push('Исправить критические ошибки перед merge');
    }
    if (warningIssues.length > 2) {
      suggestions.push('Рассмотреть рефакторинг для улучшения поддерживаемости');
    }
    suggestions.push('Добавить unit-тесты для новой функциональности');
    suggestions.push('Обновить документацию API');
    
    return suggestions;
  }

  getCodeReviewDashboard() {
    const openPRs = this.prs.filter(p => p.status === 'open' || p.status === 'in_review');
    const mergedPRs = this.prs.filter(p => p.status === 'merged');
    const failedDeployments = this.deployments.filter(d => d.status === 'failed');
    const avgQuality = this.reviews.length > 0 
      ? Math.round(this.reviews.reduce((s, r) => s + r.qualityScore, 0) / this.reviews.length)
      : 85;

    const repoStats = REPOSITORIES.map(repo => {
      const repoPRs = this.prs.filter(p => p.repository === repo.id);
      const repoDeploys = this.deployments.filter(d => d.repository === repo.id);
      return {
        ...repo,
        prCount: repoPRs.length,
        openPRs: repoPRs.filter(p => p.status === 'open').length,
        deployCount: repoDeploys.length,
        lastDeploy: repoDeploys[0]?.completedAt || null
      };
    });

    return {
      summary: {
        openPRs: openPRs.length,
        mergedThisWeek: mergedPRs.filter(p => new Date(p.updated) > new Date(Date.now() - 7 * 86400000)).length,
        avgQualityScore: avgQuality,
        deploymentsToday: this.deployments.filter(d => new Date(d.startedAt) > new Date(Date.now() - 86400000)).length,
        failedDeployments: failedDeployments.length,
        avgReviewTime: '4.2 hours'
      },
      repositories: repoStats,
      recentPRs: this.prs.slice(0, 5),
      recentDeployments: this.deployments.slice(0, 5),
      qualityTrends: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(2026, i, 1).toLocaleString('ru', { month: 'short' }),
        quality: Math.round(70 + Math.random() * 20),
        coverage: Math.round(50 + Math.random() * 30)
      })),
      recommendations: this.generateCodeReviewRecommendations(openPRs, failedDeployments, avgQuality)
    };
  }

  generateCodeReviewRecommendations(openPRs, failedDeployments, avgQuality) {
    const recommendations = [];
    if (openPRs.length > 5) {
      recommendations.push(`Ускорить code review: ${openPRs.length} открытых PR`);
    }
    if (failedDeployments.length > 0) {
      recommendations.push('Провести post-mortem по неудачным деплоям');
    }
    if (avgQuality < 75) {
      recommendations.push('Внедрить обязательный code review для всех PR');
    }
    recommendations.push('Автоматизировать проверку code style через ESLint/Prettier');
    recommendations.push('Настроить автоматический деплой в staging');
    return recommendations;
  }

  triggerDeployment(repoId, environment, data) {
    const repo = REPOSITORIES.find(r => r.id === repoId);
    if (!repo) return { error: 'Repository not found' };

    const deployment = {
      id: `deploy_${Date.now()}`,
      repository: repoId,
      version: `v2.${this.deployments.length}.0`,
      environment,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      duration: 0,
      triggeredBy: 'AI Deployment Agent',
      commitSha: crypto.randomUUID().slice(0, 7)
    };

    this.deployments.unshift(deployment);

    // Simulate deployment completion
    setTimeout(() => {
      deployment.status = Math.random() > 0.15 ? 'success' : 'failed';
      deployment.completedAt = new Date().toISOString();
      deployment.duration = Math.floor(Math.random() * 25) + 5;
    }, 1000);

    if (data) {
      data.notifications.unshift({
        id: `notice_${Date.now()}`,
        kind: 'deployment',
        title: `🚀 Деплой ${repo.name} в ${environment}`,
        detail: `Версия ${deployment.version}. Запущен AI Deployment Agent.`,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    return deployment;
  }
}

const codeReview = new CodeReview();

function getCodeReviewDashboard() { return codeReview.getCodeReviewDashboard(); }
function reviewPullRequest(prId) { return codeReview.reviewPullRequest(prId); }
function analyzeCode(code, filename) { return codeReview.analyzeCode(code, filename); }
function triggerDeployment(repoId, environment, data) { return codeReview.triggerDeployment(repoId, environment, data); }

module.exports = { getCodeReviewDashboard, reviewPullRequest, analyzeCode, triggerDeployment, CodeReview };
