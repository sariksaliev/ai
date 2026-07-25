// Employee Performance Analytics Engine v2.0
// Team productivity, individual KPIs, workload analysis, skill gap detection
const crypto = require('crypto');

const DEPARTMENTS = [
  { id: 'dept_sales', name: 'Продажи', headcount: 12, color: '#3b82f6' },
  { id: 'dept_marketing', name: 'Маркетинг', headcount: 8, color: '#8b5cf6' },
  { id: 'dept_engineering', name: 'Разработка', headcount: 15, color: '#22c55e' },
  { id: 'dept_support', name: 'Поддержка', headcount: 6, color: '#f59e0b' },
  { id: 'dept_finance', name: 'Финансы', headcount: 4, color: '#ef4444' },
  { id: 'dept_hr', name: 'HR', headcount: 3, color: '#ec4899' }
];

const SKILLS = [
  { id: 'skill_1', name: 'Sales Negotiation', category: 'sales', level: 'advanced' },
  { id: 'skill_2', name: 'CRM Management', category: 'sales', level: 'intermediate' },
  { id: 'skill_3', name: 'Digital Marketing', category: 'marketing', level: 'advanced' },
  { id: 'skill_4', name: 'Content Strategy', category: 'marketing', level: 'intermediate' },
  { id: 'skill_5', name: 'JavaScript/Node.js', category: 'engineering', level: 'advanced' },
  { id: 'skill_6', name: 'Cloud Architecture', category: 'engineering', level: 'intermediate' },
  { id: 'skill_7', name: 'Customer Support', category: 'support', level: 'intermediate' },
  { id: 'skill_8', name: 'Financial Analysis', category: 'finance', level: 'advanced' },
  { id: 'skill_9', name: 'Team Management', category: 'management', level: 'advanced' },
  { id: 'skill_10', name: 'Data Analysis', category: 'analytics', level: 'intermediate' }
];

class PerformanceAnalytics {
  constructor() {
    this.employees = this.generateEmployees();
    this.performanceHistory = this.generatePerformanceHistory();
  }

  generateEmployees() {
    const names = [
      { name: 'Анна Смирнова', role: 'Sales Manager', dept: 'dept_sales' },
      { name: 'Максим Иванов', role: 'Senior Developer', dept: 'dept_engineering' },
      { name: 'Елена Петрова', role: 'Marketing Lead', dept: 'dept_marketing' },
      { name: 'Дмитрий Сидоров', role: 'Support Engineer', dept: 'dept_support' },
      { name: 'Ольга Козлова', role: 'CFO', dept: 'dept_finance' },
      { name: 'Сергей Новиков', role: 'HR Director', dept: 'dept_hr' },
      { name: 'Татьяна Морозова', role: 'Account Executive', dept: 'dept_sales' },
      { name: 'Алексей Волков', role: 'Full Stack Developer', dept: 'dept_engineering' },
      { name: 'Наталья Белова', role: 'Content Manager', dept: 'dept_marketing' },
      { name: 'Игорь Кузнецов', role: 'DevOps Engineer', dept: 'dept_engineering' },
      { name: 'Мария Лебедева', role: 'Customer Success', dept: 'dept_support' },
      { name: 'Павел Соколов', role: 'Sales Representative', dept: 'dept_sales' }
    ];

    return names.map((n, i) => ({
      id: `emp_${i + 1}`,
      ...n,
      avatar: n.name.split(' ').map(s => s[0]).join(''),
      email: `${n.name.toLowerCase().replace(' ', '.')}@company.com`,
      startDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      performance: this.generateEmployeePerformance(),
      skills: this.generateEmployeeSkills(n.dept),
      workload: this.generateWorkload(),
      engagement: Math.round(60 + Math.random() * 40)
    }));
  }

  generateEmployeePerformance() {
    return {
      current: Math.round(60 + Math.random() * 40),
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
      kpis: {
        productivity: Math.round(60 + Math.random() * 40),
        quality: Math.round(65 + Math.random() * 35),
        teamwork: Math.round(55 + Math.random() * 45),
        leadership: Math.round(50 + Math.random() * 50),
        innovation: Math.round(40 + Math.random() * 60)
      },
      lastReview: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString(),
      reviewNotes: ['Показывает стабильный рост', 'Требуется развитие навыков коммуникации', 'Отличный командный игрок', 'Потенциал для повышения'][Math.floor(Math.random() * 4)]
    };
  }

  generateEmployeeSkills(deptId) {
    const deptSkills = SKILLS.filter(s => s.category === deptId.replace('dept_', ''));
    const additionalSkills = SKILLS.filter(s => s.category !== deptId.replace('dept_', ''));
    const selected = deptSkills.slice(0, 3).map(s => ({
      ...s,
      proficiency: Math.round(60 + Math.random() * 40),
      certified: Math.random() > 0.5
    }));
    // Add 1-2 random skills
    for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
      const skill = additionalSkills[Math.floor(Math.random() * additionalSkills.length)];
      if (!selected.find(s => s.id === skill.id)) {
        selected.push({ ...skill, proficiency: Math.round(30 + Math.random() * 40), certified: false });
      }
    }
    return selected;
  }

  generateWorkload() {
    return {
      currentProjects: Math.floor(2 + Math.random() * 4),
      completedTasks: Math.floor(10 + Math.random() * 30),
      pendingTasks: Math.floor(3 + Math.random() * 10),
      overtimeHours: Math.round(Math.random() * 20),
      utilization: Math.round(50 + Math.random() * 50)
    };
  }

  generatePerformanceHistory() {
    return Array.from({ length: 6 }, (_, i) => ({
      month: new Date(2026, i, 1).toISOString(),
      avgProductivity: Math.round(65 + Math.random() * 25 + Math.sin(i / 2) * 10),
      avgQuality: Math.round(70 + Math.random() * 20),
      avgEngagement: Math.round(60 + Math.random() * 30)
    }));
  }

  getDepartmentOverview() {
    return DEPARTMENTS.map(dept => {
      const deptEmployees = this.employees.filter(e => e.dept === dept.id);
      const avgPerformance = deptEmployees.length > 0 
        ? Math.round(deptEmployees.reduce((s, e) => s + e.performance.current, 0) / deptEmployees.length)
        : 0;
      const avgWorkload = deptEmployees.length > 0
        ? Math.round(deptEmployees.reduce((s, e) => s + e.workload.utilization, 0) / deptEmployees.length)
        : 0;

      return {
        ...dept,
        employees: deptEmployees,
        avgPerformance,
        avgWorkload,
        topPerformer: deptEmployees.sort((a, b) => b.performance.current - a.performance.current)[0] || null,
        needsAttention: deptEmployees.filter(e => e.performance.current < 60).length
      };
    });
  }

  getEmployeeDetail(employeeId) {
    return this.employees.find(e => e.id === employeeId) || null;
  }

  getTeamAnalytics() {
    const depts = this.getDepartmentOverview();
    const totalEmployees = this.employees.length;
    const avgPerformance = Math.round(this.employees.reduce((s, e) => s + e.performance.current, 0) / totalEmployees);
    const avgEngagement = Math.round(this.employees.reduce((s, e) => s + e.engagement, 0) / totalEmployees);
    const avgWorkload = Math.round(this.employees.reduce((s, e) => s + e.workload.utilization, 0) / totalEmployees);

    const topPerformers = this.employees.filter(e => e.performance.current >= 80);
    const atRisk = this.employees.filter(e => e.performance.current < 50 || e.engagement < 40);
    const overworked = this.employees.filter(e => e.workload.utilization > 85);

    const skillGaps = this.identifySkillGaps();

    return {
      summary: {
        totalEmployees,
        avgPerformance,
        avgEngagement,
        avgWorkload,
        departments: depts.length
      },
      topPerformers: topPerformers.map(e => ({ id: e.id, name: e.name, role: e.role, performance: e.performance.current })),
      atRisk: atRisk.map(e => ({ id: e.id, name: e.name, role: e.role, performance: e.performance.current, engagement: e.engagement })),
      overworked: overworked.map(e => ({ id: e.id, name: e.name, role: e.role, utilization: e.workload.utilization })),
      departments: depts,
      skillGaps,
      history: this.performanceHistory,
      recommendations: this.generateRecommendations(atRisk, overworked, skillGaps)
    };
  }

  identifySkillGaps() {
    const gaps = [];
    const requiredSkills = {
      'dept_sales': ['Sales Negotiation', 'CRM Management'],
      'dept_marketing': ['Digital Marketing', 'Content Strategy'],
      'dept_engineering': ['JavaScript/Node.js', 'Cloud Architecture'],
      'dept_support': ['Customer Support', 'Data Analysis'],
      'dept_finance': ['Financial Analysis', 'Data Analysis'],
      'dept_hr': ['Team Management', 'Data Analysis']
    };

    Object.entries(requiredSkills).forEach(([deptId, skills]) => {
      const deptEmployees = this.employees.filter(e => e.dept === deptId);
      skills.forEach(skillName => {
        const hasSkill = deptEmployees.some(e => e.skills.some(s => s.name === skillName && s.proficiency >= 60));
        if (!hasSkill) {
          gaps.push({ department: DEPARTMENTS.find(d => d.id === deptId)?.name, skill: skillName, severity: 'high' });
        }
      });
    });

    return gaps;
  }

  generateRecommendations(atRisk, overworked, skillGaps) {
    const recommendations = [];
    if (atRisk.length > 0) {
      recommendations.push(`Провести 1:1 встречи с ${atRisk.length} сотрудниками группы риска`);
    }
    if (overworked.length > 0) {
      recommendations.push(`Перераспределить нагрузку: ${overworked.length} сотрудников перегружены (>85% utilization)`);
    }
    if (skillGaps.length > 0) {
      recommendations.push(`Организовать обучение по ${skillGaps.length} критическим навыкам`);
    }
    if (this.employees.filter(e => e.performance.current >= 80).length > 3) {
      recommendations.push('Рассмотреть повышение для топ-исполнителей');
    }
    recommendations.push('Запланировать quarterly performance review');
    return recommendations;
  }

  getProductivityTrends() {
    return {
      weekly: Array.from({ length: 12 }, (_, i) => ({
        week: `W${i + 1}`,
        productivity: Math.round(65 + Math.random() * 25),
        quality: Math.round(70 + Math.random() * 20),
        engagement: Math.round(60 + Math.random() * 30)
      })),
      monthly: this.performanceHistory,
      quarterly: [
        { quarter: 'Q1 2026', avgProductivity: 72, avgQuality: 78, avgEngagement: 68 },
        { quarter: 'Q2 2026', avgProductivity: 75, avgQuality: 80, avgEngagement: 71 }
      ]
    };
  }
}

const performanceAnalytics = new PerformanceAnalytics();

function getTeamAnalytics() { return performanceAnalytics.getTeamAnalytics(); }
function getDepartmentOverview() { return performanceAnalytics.getDepartmentOverview(); }
function getEmployeeDetail(id) { return performanceAnalytics.getEmployeeDetail(id); }
function getProductivityTrends() { return performanceAnalytics.getProductivityTrends(); }

module.exports = { getTeamAnalytics, getDepartmentOverview, getEmployeeDetail, getProductivityTrends, PerformanceAnalytics };
