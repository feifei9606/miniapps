/**
 * 提前还款计算器 · 核心计算模块（纯函数，与 UI 解耦）
 *
 * 还款方式:
 *   annuity         等额本息（月供固定，逐期重拆本金/利息）
 *   equal-principal 等额本金（每期本金固定，利息按剩余本金计算）
 *
 * 利率模式:
 *   fixed 固定利率: annualRates = [年利率%]
 *   lpr   LPR 加点: annualRates = 每个还款年度的执行年利率% 数组（含加点），
 *         年度边界（每 12 期）后按剩余本金与剩余期数重算月供（等额本息）
 *
 * 提前还款（events）:
 *   { month: 第几期(该期正常月供扣完后额外归还), amount: 金额, type: 'partial'|'settle',
 *     mode: 'shorten'|'reduce-payment' }
 *   shorten         缩短期限: 月供（或每期本金）不变，重算剩余期数
 *   reduce-payment  减少月供: 剩余期数不变，重算月供（或每期本金）
 */

export const REPAYMENT_METHODS = {
  'annuity': '等额本息',
  'equal-principal': '等额本金',
};

/**
 * 按参数计算还款计划
 * @param {object} p
 * @param {number} p.principal       贷款本金（元）
 * @param {number} p.termMonths      贷款期限（月）
 * @param {'annuity'|'equal-principal'} p.method
 * @param {'fixed'|'lpr'} p.rateMode
 * @param {number[]} p.annualRates   按还款年度的执行年利率%（fixed 时长度 1）
 * @param {Date|string} p.startDate  首期还款日（当月任意一天）
 * @param {Array} [p.events]         提前还款事件
 * @returns {{rows: Array, summary: object}}
 */
export function computePlan(p) {
  const { principal, termMonths, method, rateMode } = p;
  const annualRates = normalizeRates(p.annualRates, rateMode);
  const events = indexEvents(p.events || []);
  const startDate = toDate(p.startDate);

  const rows = [];
  let balance = principal;
  let periodsLeft = termMonths;
  let payment = method === 'annuity'
    ? annuityPayment(principal, rateOf(annualRates, 1) / 1200, termMonths)
    : 0;
  let principalPerPeriod = method === 'equal-principal' ? principal / termMonths : 0;

  let totalInterest = 0;
  let totalPrincipal = 0;
  let period = 0;
  const MAX_PERIODS = 1200; // 100 年兜底，防止异常输入死循环

  while (balance > 0.005 && period < MAX_PERIODS) {
    period += 1;
    periodsLeft -= 1;
    const yearIndex = Math.floor((period - 1) / 12) + 1; // 还款年度，1 起
    // 进入新还款年度 → 按新利率重算（银行惯例：剩余本金、剩余期数、新利率重定月供）
    const newAnnualRate = rateOf(annualRates, yearIndex);
    const prevAnnualRate = rateOf(annualRates, yearIndex - 1);
    const r = newAnnualRate / 1200; // 年利率% → 月利率

    if (method === 'annuity') {
      if (period > 1 && newAnnualRate !== prevAnnualRate) {
        payment = annuityPayment(balance, r, periodsLeft + 1);
      }
      let interest = balance * r;
      let principalPart = payment - interest;
      if (principalPart >= balance - 0.005 || periodsLeft === 0) {
        principalPart = balance;
        payment = principalPart + interest;
      }
      balance -= principalPart;
      totalInterest += interest;
      totalPrincipal += principalPart;
      rows.push(makeRow(period, addMonths(startDate, period - 1), payment, principalPart, interest, balance));
    } else {
      let principalPart = Math.min(principalPerPeriod, balance);
      if (periodsLeft === 0) principalPart = balance;
      const interest = balance * r;
      const pay = principalPart + interest;
      balance -= principalPart;
      totalInterest += interest;
      totalPrincipal += principalPart;
      rows.push(makeRow(period, addMonths(startDate, period - 1), pay, principalPart, interest, balance));
    }

    // ---- 当期提前还款（正常月供扣完后处理） ----
    const evs = events.get(period);
    if (evs && balance > 0.005) {
      for (const ev of evs) {
        if (balance <= 0.005) break;
        const amount = ev.type === 'settle' ? balance : Math.min(ev.amount, balance);
        balance -= amount;
        rows[rows.length - 1].prepayment = (rows[rows.length - 1].prepayment || 0) + amount;
        if (balance <= 0.005) {
          balance = 0;
          break;
        }
        if (ev.mode === 'shorten') {
          if (method === 'annuity') {
            periodsLeft = Math.max(1, Math.ceil(annuityPeriods(balance, r, payment)));
          } else {
            periodsLeft = Math.max(1, Math.ceil(balance / principalPerPeriod));
          }
        } else {
          // reduce-payment: 保持剩余期数不变，重算
          if (method === 'annuity') {
            payment = annuityPayment(balance, r, periodsLeft);
          } else {
            principalPerPeriod = balance / periodsLeft;
          }
        }
      }
    }
  }

  return {
    rows,
    summary: {
      months: rows.length,
      totalInterest: round2(totalInterest),
      totalPayment: round2(totalInterest + totalPrincipal),
      monthlyPaymentFirst: rows.length ? round2(rows[0].payment) : 0,
      monthlyPaymentLast: rows.length ? round2(rows[rows.length - 1].payment) : 0,
      startDate: fmtDate(startDate),
      endDate: rows.length ? rows[rows.length - 1].date : fmtDate(startDate),
    },
  };
}

/**
 * 对比原计划与含提前还款的新计划
 * @returns {{baseline: object, plan: object, savedInterest: number, savedMonths: number}}
 */
export function comparePlans(baselineParams, planParams) {
  const baseline = computePlan(baselineParams);
  const plan = computePlan(planParams);
  return {
    baseline,
    plan,
    savedInterest: round2(baseline.summary.totalInterest - plan.summary.totalInterest),
    savedMonths: baseline.summary.months - plan.summary.months,
  };
}

/* ---------------- 纯工具函数 ---------------- */

/** 等额本息月供: M = P·r·(1+r)^n / ((1+r)^n − 1) */
export function annuityPayment(principal, monthlyRate, months) {
  if (monthlyRate <= 0) return principal / months;
  const k = Math.pow(1 + monthlyRate, months);
  return principal * monthlyRate * k / (k - 1);
}

/** 由月供反解等额本息剩余期数（小数，需自行 ceil） */
export function annuityPeriods(balance, monthlyRate, payment) {
  if (monthlyRate <= 0) return balance / payment;
  if (payment <= balance * monthlyRate) return Infinity; // 月供不足以覆盖利息
  const k = 1 - (balance * monthlyRate) / payment;
  return -Math.log(k) / Math.log(1 + monthlyRate);
}

/** 补全利率数组：每个还款年度一个执行年利率%，超出的年度沿用最后一个 */
function normalizeRates(annualRates, rateMode) {
  const arr = Array.isArray(annualRates) && annualRates.length
    ? annualRates.map(Number)
    : [0];
  void rateMode;
  return arr;
}

/** 第 yearIndex 个还款年度的年利率%（yearIndex<=0 或越界时取第一个/最后一个） */
function rateOf(annualRates, yearIndex) {
  if (yearIndex <= 1) return annualRates[0];
  return annualRates[Math.min(yearIndex - 1, annualRates.length - 1)];
}

/** 事件按期数分组 */
function indexEvents(events) {
  const map = new Map();
  for (const ev of events) {
    const m = Math.max(1, Math.floor(Number(ev.month)));
    if (!map.has(m)) map.set(m, []);
    map.get(m).push(ev);
  }
  return map;
}

function makeRow(period, date, payment, principal, interest, remaining) {
  return {
    period,
    date: fmtDate(date),
    payment: round2(payment),
    principal: round2(principal),
    interest: round2(interest),
    remaining: round2(Math.max(0, remaining)),
  };
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

function toDate(v) {
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) throw new Error('无效的日期: ' + v);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** 加 n 个月（保持在有效日，1 号） */
function addMonths(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth() + n, 1);
  return d;
}

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
