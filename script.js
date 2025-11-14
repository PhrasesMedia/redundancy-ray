// ===== DOM references =====
const fullYearsEl       = document.getElementById('fullYears');
const alHoursEl         = document.getElementById('alHours');
const hoursPerWeekEl    = document.getElementById('hoursPerWeek');
const annualSalaryEl    = document.getElementById('annualSalary');

const totalOut          = document.getElementById('totalOut');
const yearsOut          = document.getElementById('yearsOut');
const redundancyWeeksOut= document.getElementById('redundancyWeeksOut');
const weeklyRateOut     = document.getElementById('weeklyRateOut');
const redundancyPayOut  = document.getElementById('redundancyPayOut');
const hourlyRateOut     = document.getElementById('hourlyRateOut');
const alPayoutOut       = document.getElementById('alPayoutOut');

const copyBtn           = document.getElementById('copyBtn');

// ===== Helpers =====
function num(el) {
  const v = parseFloat(el.value);
  return Number.isFinite(v) ? v : 0;
}

function fmtMoney(value) {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0
  });
}

function fmtNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(decimals);
}

// Redundancy weeks based on full years (per your table)
function getRedundancyWeeks(years) {
  if (years < 1) return 0;
  if (years < 2) return 4;
  if (years < 3) return 6;
  if (years < 4) return 7;
  if (years < 5) return 8;
  if (years < 6) return 10;
  if (years < 7) return 11;
  if (years < 8) return 13;
  if (years < 9) return 14;
  if (years < 10) return 16;
  // 10+ years
  return 12;
}

// ===== Main calc =====
function recalc() {
  const years       = num(fullYearsEl);
  const alHours     = num(alHoursEl);
  const hrsPerWeek  = num(hoursPerWeekEl) || 38; // sensible default
  const annualSal   = num(annualSalaryEl);

  // If key inputs are missing, clear outputs
  if (!years && !annualSal && !alHours) {
    totalOut.textContent           = '—';
    yearsOut.textContent           = '—';
    redundancyWeeksOut.textContent = '—';
    weeklyRateOut.textContent      = '—';
    redundancyPayOut.textContent   = '—';
    hourlyRateOut.textContent      = '—';
    alPayoutOut.textContent        = '—';
    return;
  }

  const weeks       = getRedundancyWeeks(years);
  const weeklyRate  = annualSal > 0 ? (annualSal / 52) : 0;
  const redundancyPay = weeklyRate * weeks;
  const hourlyRate  = hrsPerWeek > 0 ? (weeklyRate / hrsPerWeek) : 0;

  const alWeeks     = hrsPerWeek > 0 ? (alHours / hrsPerWeek) : 0;
  const alPayout    = weeklyRate * alWeeks;

  const total       = redundancyPay + alPayout;

  // Write to UI
  totalOut.textContent           = fmtMoney(total);
  yearsOut.textContent           = years || '0';
  redundancyWeeksOut.textContent = fmtNumber(weeks, 1);
  weeklyRateOut.textContent      = weeklyRate > 0 ? fmtMoney(weeklyRate).replace('A$', '$') : '—';
  redundancyPayOut.textContent   = fmtMoney(redundancyPay);
  hourlyRateOut.textContent      = hourlyRate > 0 ? '$' + fmtNumber(hourlyRate, 2) : '—';
  alPayoutOut.textContent        = fmtMoney(alPayout);
}

// ===== Copy summary =====
async function copySummary() {
  const years       = num(fullYearsEl);
  const alHours     = num(alHoursEl);
  const hrsPerWeek  = num(hoursPerWeekEl) || 38;
  const annualSal   = num(annualSalaryEl);

  const weeks       = getRedundancyWeeks(years);
  const weeklyRate  = annualSal > 0 ? (annualSal / 52) : 0;
  const redundancyPay = weeklyRate * weeks;
  const hourlyRate  = hrsPerWeek > 0 ? (weeklyRate / hrsPerWeek) : 0;
  const alWeeks     = hrsPerWeek > 0 ? (alHours / hrsPerWeek) : 0;
  const alPayout    = weeklyRate * alWeeks;
  const total       = redundancyPay + alPayout;

  const lines = [
    `Redundancy Ray (AU) – rough estimate (before tax)`,
    ``,
    `Total estimate: ${fmtMoney(total)}`,
    `Years of service: ${years || 0} year(s)`,
    `Redundancy weeks: ${fmtNumber(weeks, 1)}`,
    `Weekly rate: ${weeklyRate > 0 ? '$' + fmtNumber(weeklyRate, 2) : '—'}`,
    `Hourly rate: ${hourlyRate > 0 ? '$' + fmtNumber(hourlyRate, 2) : '—'}`,
    `Redundancy pay: ${fmtMoney(redundancyPay)}`,
    `Annual leave payout: ${fmtMoney(alPayout)} (approx, based on ${alHours || 0} AL hours)`,
    ``,
    `Note: This is a simple guide only. Actual entitlements depend on awards/agreements,`,
    `small-business exemptions, notice/LSL, and tax treatment.`
  ];

  const text = lines.join('\n');

  try {
    await navigator.clipboard.writeText(text);
    const original = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = original;
    }, 1500);
  } catch (err) {
    console.error('Clipboard error', err);
    alert('Could not copy to clipboard in this browser.');
  }
}

// ===== Wire up =====
[fullYearsEl, alHoursEl, hoursPerWeekEl, annualSalaryEl].forEach(el => {
  el.addEventListener('input', recalc);
});

copyBtn.addEventListener('click', copySummary);

// Initial
recalc();
