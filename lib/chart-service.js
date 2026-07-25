// Chart Data Service — provides structured data for SVG/Canvas visualizations
// Генерирует данные для графиков: тренды, распределения, сравнения

const crypto = require('crypto');

// Generate time-series data for sparklines and trend charts
function generateTrendData(baseValue, volatility, points) {
  const data = [];
  let value = baseValue;
  for (let i = 0; i < points; i++) {
    value = Math.max(0, value + (Math.random() - 0.48) * volatility * baseValue);
    data.push({
      period: i,
      value: Math.round(value * 100) / 100,
      label: getPeriodLabel(i, points)
    });
  }
  return data;
}

function getPeriodLabel(index, total) {
  const labels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  if (total <= 7) return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index] || `Д${index + 1}`;
  if (total <= 12) return labels[index] || `М${index + 1}`;
  return `W${index + 1}`;
}

function getChartConfig(type, data, options = {}) {
  const configs = {
    revenue: {
      title: 'Тренд выручки',
      color: '#247b68',
      unit: '$',
      data: data || generateTrendData(842, 0.05, 12)
    },
    pipeline: {
      title: 'Pipeline воронка',
      color: '#57937f',
      unit: '$',
      data: data || generateTrendData(1200, 0.08, 12)
    },
    churn: {
      title: 'Динамика оттока',
      color: '#d86550',
      unit: '%',
      data: data || generateTrendData(3.2, 0.1, 12)
    },
    nps: {
      title: 'NPS тренд',
      color: '#6394b1',
      unit: 'NPS',
      data: data || generateTrendData(52, 0.06, 12)
    },
    efficiency: {
      title: 'Эффективность',
      color: '#8b79b5',
      unit: '%',
      data: data || generateTrendData(72, 0.04, 12)
    }
  };
  
  return configs[type] || configs.revenue;
}

// Generate SVG path for a line chart
function generateSVGLine(data, width = 300, height = 120) {
  if (!data || data.length < 2) return '';
  
  const values = data.map(d => d.value);
  const min = Math.min(...values) * 0.9;
  const max = Math.max(...values) * 1.1;
  const range = max - min || 1;
  
  const xStep = width / (data.length - 1);
  
  const points = data.map((d, i) => {
    const x = i * xStep;
    const y = height - ((d.value - min) / range) * height * 0.85 - height * 0.075;
    return `${x},${y}`;
  });
  
  return `M${points.join(' L')}`;
}

// Generate bar chart data
function generateBarData(categories, values) {
  return categories.map((cat, i) => ({
    label: cat,
    value: values[i] || Math.round(Math.random() * 100),
    color: getBarColor(i)
  }));
}

function getBarColor(index) {
  const colors = ['#247b68', '#57937f', '#6394b1', '#8b79b5', '#bb915e', '#d86550', '#e5a83f', '#3da47e'];
  return colors[index % colors.length];
}

// Period-over-Period comparison data
function generatePopData(currentPeriod, previousPeriod, labels) {
  return labels.map((label, i) => ({
    label,
    current: currentPeriod[i] || Math.round(Math.random() * 1000),
    previous: previousPeriod[i] || Math.round(Math.random() * 1000),
    change: calculateChange(currentPeriod[i], previousPeriod[i])
  }));
}

function calculateChange(current, previous) {
  if (!previous || previous === 0) return { percent: 0, direction: 'stable' };
  const diff = current - previous;
  const percent = Math.round((diff / previous) * 100);
  return {
    percent: Math.abs(percent),
    direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'stable',
    absolute: Math.round(diff)
  };
}

// Distribution data (pie/ring chart)
function generateDistributionData(segments) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  return segments.map(seg => ({
    ...seg,
    percentage: total > 0 ? Math.round((seg.value / total) * 100) : 0
  }));
}

// Generate complete dashboard chart data
function getDashboardCharts() {
  return {
    revenueTrend: getChartConfig('revenue'),
    pipelineTrend: getChartConfig('pipeline'),
    churnTrend: getChartConfig('churn'),
    npsTrend: getChartConfig('nps'),
    efficiencyTrend: getChartConfig('efficiency'),
    pipelineDistribution: generateDistributionData([
      { label: 'SQL', value: 4218, color: '#247b68' },
      { label: 'Opportunity', value: 1240, color: '#57937f' },
      { label: 'Negotiation', value: 312, color: '#6394b1' },
      { label: 'Closed Won', value: 87, color: '#3da47e' }
    ]),
    revenueByChannel: generateBarData(
      ['Direct', 'Partner', 'Online', 'Enterprise', 'SMB'],
      [320, 210, 180, 95, 37]
    ),
    weeklyTrend: generateTrendData(842, 0.06, 7)
  };
}

module.exports = {
  generateTrendData,
  getChartConfig,
  generateSVGLine,
  generateBarData,
  generatePopData,
  generateDistributionData,
  getDashboardCharts
};