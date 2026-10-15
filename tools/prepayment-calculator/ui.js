/**
 * UI 模块：表单读取与校验、提前还款时间线编辑、结果渲染
 */
import { comparePlans } from './calc.js';
import { renderCharts, destroyCharts } from './chart.js';

const $ = (id) => document.getElementById(id);

let currentResult = null;   // { baseline, plan }
let currentTable = 'plan';  // 明细表当前展示的计划

/* ---------------- 初始化 ---------------- */

function initDate() {
  const now = new Date();
  $('startDate').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function bindEvents() {
  // 利率模式切换
  $('rate-mode').addEventListener('click', (e) => {
    const btn = e.target.closest('.seg');
    if (!btn) return;
    $('rate-mode').querySelectorAll('.seg').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const isLpr = btn.dataset.mode === 'lpr';
    $('lpr-box').classList.toggle('hidden', !isLpr);
    $('fixed-rate-box').classList.toggle('hidden', isLpr);
  });

  // 添加提前还款
  $('add-prepay').addEventListener('click', () => addPrepayItem());

  // LPR 年度
  $('lpr-add-year').addEventListener('click', () => addLprYear());
  addLprYear(1); // 默认第 1 年

  // 表单提交
  $('calc-form').addEventListener('submit', (e) => {
    e.preventDefault();
    onSubmit();
  });

  // 重置
  $('btn-reset').addEventListener('click', () => {
    $('calc-form').reset();
    initDate();
    $('prepay-list').innerHTML = '';
    $('lpr-year-list').innerHTML = '';
    addLprYear(1);
    showEmpty();
  });

  // 明细表切换
  document.querySelector('.table-switch').addEventListener('click', (e) => {
    const btn = e.target.closest('.seg');
    if (!btn) return;
    document.querySelectorAll('.table-switch .seg').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    currentTable = btn.dataset.table;
    if (currentResult) renderTable();
  });
}

/* ---------------- LPR 年度编辑 ---------------- */

function addLprYear(year, rate) {
  const list = $('lpr-year-list');
  const y = year || (list.children.length + 1);
  const row = document.createElement('div');
  row.className = 'lpr-row';
  row.innerHTML = `
    <span class="year-label">第 ${y} 年</span>
    <input type="number" class="lpr-rate" value="${rate ?? 3.5}" min="0" max="36" step="0.01">
    <button type="button" class="btn-remove lpr-del" title="删除">✕</button>`;
  row.querySelector('.lpr-del').addEventListener('click', () => row.remove());
  list.appendChild(row);
}

function readLprRates() {
  const spread = Number($('lprSpread').value) || 0;
  return Array.from(document.querySelectorAll('#lpr-year-list .lpr-rate'))
    .map(el => Number(el.value) + spread / 100); // LPR% + 加点BP → 执行年利率%
}

/* ---------------- 提前还款编辑 ---------------- */

function addPrepayItem() {
  const list = $('prepay-list');
  const item = document.createElement('div');
  item.className = 'prepay-item';
  item.innerHTML = `
    <div class="prepay-head">
      <span>提前还款</span>
      <button type="button" class="btn-remove prepay-del">删除</button>
    </div>
    <div class="row">
      <div class="field">
        <label>期数（第几期）</label>
        <input type="number" class="pp-month" min="1" step="1" placeholder="如 24">
      </div>
      <div class="field">
        <label>金额（万元）</label>
        <input type="number" class="pp-amount" min="0.1" step="0.1" placeholder="如 20">
      </div>
    </div>
    <div class="row">
      <div class="field">
        <label>还款类型</label>
        <select class="pp-type">
          <option value="partial">部分还款</option>
          <option value="settle">一次性结清</option>
        </select>
      </div>
      <div class="field pp-mode-box">
        <label>结清后处理</label>
        <select class="pp-mode">
          <option value="shorten">缩短期限</option>
          <option value="reduce-payment">减少月供</option>
        </select>
      </div>
    </div>`;
  item.querySelector('.prepay-del').addEventListener('click', () => item.remove());
  item.querySelector('.pp-type').addEventListener('change', (e) => {
    item.querySelector('.pp-mode-box').style.display =
      e.target.value === 'settle' ? 'none' : '';
  });
  list.appendChild(item);
}

function readPrepayEvents() {
  return Array.from(document.querySelectorAll('#prepay-list .prepay-item'))
    .map(item => ({
      month: Number(item.querySelector('.pp-month').value),
      amount: Number(item.querySelector('.pp-amount').value) * 10000,
      type: item.querySelector('.pp-type').value,
      mode: item.querySelector('.pp-mode').value,
    }))
    .filter(ev => ev.month >= 1 && (ev.type === 'settle' || ev.amount > 0))
    .sort((a, b) => a.month - b.month);
}

/* ---------------- 提交与渲染 ---------------- */

function showEmpty() {
  $('empty-state').classList.remove('hidden');
  $('result').classList.add('hidden');
  destroyCharts();
  currentResult = null;
}

function showError(msg) {
  const el = $('form-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function readForm() {
  const principal = Number($('principal').value) * 10000;
  const termYears = Number($('termYears').value);
  const method = $('method').value;
  const rateMode = document.querySelector('#rate-mode .seg.active').dataset.mode;
  const startDate = $('startDate').value;
  const events = readPrepayEvents();

  const errors = [];
  if (!(principal > 0)) errors.push('贷款总额必须大于 0');
  if (!(termYears >= 1 && termYears <= 30)) errors.push('贷款期限需在 1–30 年之间');
  if (!/^\d{4}-\d{2}$/.test(startDate || '')) errors.push('请选择首期还款月份');
  const termMonths = Math.round(termYears * 12);
  for (const ev of events) {
    if (ev.type === 'settle') continue;
    if (!(ev.amount > 0)) errors.push(`第 ${ev.month} 期提前还款金额无效`);
    if (ev.month < 1 || ev.month > termMonths) errors.push(`提前还款期数 ${ev.month} 超出贷款期限`);
  }
  if (errors.length) throw new Error(errors[0]);

  const annualRates = rateMode === 'lpr'
    ? readLprRates()
    : [Number($('fixedRate').value)];
  if (annualRates.some(r => !(r >= 0 && r <= 36))) throw new Error('年利率需在 0–36% 之间');

  return { principal, termMonths, method, rateMode, annualRates, startDate, events };
}

function onSubmit() {
  $('form-error').classList.add('hidden');
  let params;
  try {
    params = readForm();
  } catch (err) {
    showError(err.message);
    return;
  }

  try {
    currentResult = comparePlans(
      { ...params, events: [] },   // 原计划
      params,                      // 新计划（含提前还款）
    );
    renderResult();
  } catch (err) {
    showError('计算失败：' + err.message);
  }
}

function renderResult() {
  const { baseline, plan, savedInterest, savedMonths } = currentResult;
  $('empty-state').classList.add('hidden');
  $('result').classList.remove('hidden');

  // 省息横幅
  $('save-interest').textContent = fmtMoney(savedInterest);
  $('save-months').textContent = savedMonths > 0
    ? `同时缩短还款 ${savedMonths} 期（约 ${(savedMonths / 12).toFixed(1)} 年）`
    : (savedInterest > 0 ? '期限未缩短，月供已降低' : '该计划未产生节省，请检查提前还款设置');

  // 对比卡片
  const b = baseline.summary, p = plan.summary;
  $('base-payment').textContent = fmtMoney(b.monthlyPaymentFirst);
  $('base-interest').textContent = fmtMoney(b.totalInterest);
  $('base-total').textContent = fmtMoney(b.totalPayment);
  $('base-months').textContent = `${b.months} 期`;
  $('base-end').textContent = b.endDate;
  $('plan-payment').textContent = fmtMoney(p.monthlyPaymentFirst);
  $('plan-interest').textContent = fmtMoney(p.totalInterest);
  $('plan-total').textContent = fmtMoney(p.totalPayment);
  $('plan-months').textContent = `${p.months} 期`;
  $('plan-end').textContent = p.endDate;

  // 图表（CDN 失败降级）
  const ok = renderCharts(baseline.rows, plan.rows);
  $('chart-fallback').classList.toggle('hidden', ok);
  if (!ok) $('charts').querySelectorAll('.chart-box').forEach(el => el.classList.add('hidden'));
  else $('charts').querySelectorAll('.chart-box').forEach(el => el.classList.remove('hidden'));

  renderTable();
}

function renderTable() {
  const rows = currentTable === 'plan' ? currentResult.plan.rows : currentResult.baseline.rows;
  const tbody = $('schedule-table').querySelector('tbody');
  const frag = document.createDocumentFragment();
  for (const r of rows) {
    const tr = document.createElement('tr');
    const prepay = r.prepayment
      ? `<td class="prepay-cell">${fmtMoney(r.prepayment)}</td>`
      : '<td>—</td>';
    tr.innerHTML = `
      <td>${r.period}</td><td>${r.date}</td><td>${fmtMoney(r.payment)}</td>
      <td>${fmtMoney(r.principal)}</td><td>${fmtMoney(r.interest)}</td>
      ${prepay}<td>${fmtMoney(r.remaining)}</td>`;
    frag.appendChild(tr);
  }
  tbody.innerHTML = '';
  tbody.appendChild(frag);
}

function fmtMoney(v) {
  if (v == null || isNaN(v)) return '--';
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ---------------- 启动 ---------------- */
initDate();
bindEvents();
