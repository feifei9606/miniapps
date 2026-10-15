/**
 * 图表渲染模块：剩余本金对比 + 月供构成对比
 * 依赖 CDN 引入的 Chart.js（window.Chart）。加载失败时由 UI 降级为提示。
 */

let chartBalance = null;
let chartPayment = null;

const BLUE = '#1B5FD9';
const SKY = '#0EA5E9';
const GREEN = '#059669';
const ORANGE = '#F59E0B';

/**
 * 渲染两张对比图
 * @param {Array} baselineRows 原计划行
 * @param {Array} planRows     新计划行
 * @returns {boolean} 是否渲染成功（false = Chart.js 未加载）
 */
export function renderCharts(baselineRows, planRows) {
  if (typeof window === 'undefined' || !window.Chart) return false;

  const style = getComputedStyle(document.documentElement);
  const textColor = style.getPropertyValue('--text-muted').trim() || '#6B7280';
  const gridColor = 'rgba(107, 114, 128, .12)';

  Chart.defaults.font.family =
    '"PingFang SC", "Microsoft YaHei", -apple-system, sans-serif';
  Chart.defaults.color = textColor;

  renderBalance(baselineRows, planRows, gridColor);
  renderPayment(baselineRows, planRows, gridColor);
  return true;
}

function renderBalance(base, plan, gridColor) {
  const labels = base.map(r => r.date);
  const data = {
    labels,
    datasets: [
      {
        label: '原计划',
        data: base.map(r => r.remaining),
        borderColor: BLUE,
        backgroundColor: fillGradient(chartBalance, BLUE),
        borderWidth: 2,
        pointRadius: 0,
        tension: .25,
        fill: true,
      },
      {
        label: '提前还款后',
        data: plan.map(r => r.remaining),
        borderColor: GREEN,
        backgroundColor: fillGradient(chartPayment, GREEN),
        borderWidth: 2,
        pointRadius: 0,
        tension: .25,
        fill: false,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: { valueFormatter: v => fmtWan(v) + ' 万' },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
      y: {
        grid: { color: gridColor },
        ticks: { callback: v => fmtWan(v) + ' 万' },
      },
    },
  };
  if (chartBalance) chartBalance.destroy();
  chartBalance = new window.Chart(
    document.getElementById('chart-balance'), { type: 'line', data, options });
}

function renderPayment(base, plan, gridColor) {
  const labels = base.map(r => r.date);
  const data = {
    labels,
    datasets: [
      {
        label: '原·月供本金',
        data: base.map(r => r.principal),
        backgroundColor: BLUE,
        stack: 'base',
        pointRadius: 0,
      },
      {
        label: '原·月供利息',
        data: base.map(r => r.interest),
        backgroundColor: ORANGE,
        stack: 'base',
        pointRadius: 0,
      },
      {
        label: '新·月供本金',
        data: plan.map(r => r.principal),
        backgroundColor: SKY,
        stack: 'plan',
        pointRadius: 0,
      },
      {
        label: '新·月供利息',
        data: plan.map(r => r.interest),
        backgroundColor: 'rgba(5, 150, 105, .55)',
        stack: 'plan',
        pointRadius: 0,
      },
    ],
  };
  const options = {
    type: 'bar',
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: { valueFormatter: v => v.toFixed(0) + ' 元' },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { maxTicksLimit: 12 } },
      y: { stacked: true, grid: { color: gridColor }, ticks: { callback: v => v.toFixed(0) + ' 元' } },
    },
  };
  if (chartPayment) chartPayment.destroy();
  chartPayment = new window.Chart(
    document.getElementById('chart-payment'), { type: 'bar', data, options });
}

/** 纵轴压缩显示：元 → 万 */
function fmtWan(v) {
  return (v / 10000).toFixed(1);
}

function fillGradient(chart, color) {
  // Chart.js v4 需要在此处拿到 ctx；首次渲染时 canvas ctx 由 Chart 内部创建，
  // 简化处理：直接返回低透明度纯色渐变替代。
  void chart;
  return hexToRgba(color, .12);
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 销毁图表实例（重算前调用，避免内存泄漏） */
export function destroyCharts() {
  if (chartBalance) { chartBalance.destroy(); chartBalance = null; }
  if (chartPayment) { chartPayment.destroy(); chartPayment = null; }
}
