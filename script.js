// ===== DOM references =====
const fullYearsEl        = document.getElementById('fullYears');
const alHoursEl          = document.getElementById('alHours');
const hoursPerWeekEl     = document.getElementById('hoursPerWeek');
const annualSalaryEl     = document.getElementById('annualSalary');
const ageGroupEl         = document.getElementById('ageGroup');
const marginalRateEl     = document.getElementById('marginalRate');

const totalOut           = document.getElementById('totalOut');
const yearsOut           = document.getElementById('yearsOut');
const redundancyWeeksOut = document.getElementById('redundancyWeeksOut');
const weeklyRateOut      = document.getElementById('weeklyRateOut');
const redundancyPayOut   = document.getElementById('redundancyPayOut');
const hourlyRateOut      = document.getElementById('hourlyRateOut');
const alPayoutOut        = document.getElementById('alPayoutOut');

const taxFreeRedundancyOut  = document.getElementById('taxFreeRedundancyOut');
const taxableRedundancyOut  = document.getElementById('taxableRedundancyOut');
const redundancyTaxOut      = document.getElementById('redundancyTaxOut');
const redundancyAfterTaxOut = document.getElementById('redundancyAfterTaxOut');
const alTaxOut              = document.getElementById('alTaxOut');
const alAfterTaxOut         = document.getElementById('alAfterTaxOut');
const totalAfterTaxOut      = document.getElementById('totalAfterTaxOut');

const afterTaxToggle     = document.getElementById('afterTaxToggle');
const taxSection         = document.getElementById('taxSection');

const copyBtn            = document.getElementById('copyBtn');

// ===== Constants (2024–25 genuine redundancy thresholds) =====
const TAX_FREE_BASE = 11985;
const TAX_FREE_PER_YEAR = 5994;
const ETP_CAP = 235000; // cap before top rate applies (we assume most people are under this)

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

function fmtMoneyExact(value) {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toLocaleString('en-AU', {
    style: 'currency',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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
  const ageGroup    = ageGroupEl.value;
  let marginalRate  = num(marginalRateEl);

  if (!Number.isFinite(marginalRate) || marginalRate <= 0) marginalRate = 32;
  if (marginalRate > 60) marginalRate = 60;
  const marginalRateFrac = marginalRate / 100;

  // If key inputs are missing, clear outputs
  if (!years && !annualSal && !alHours) {
    totalOut.textContent            = '—';
    yearsOut.textContent            = '—';
    redundancyWeeksOut.textContent  = '—';
    weeklyRateOut.textContent       = '—';
    redundancyPayOut.textContent    = '—';
    hourlyRateOut.textContent       = '—';
    alPayoutOut.textContent         = '—';
    taxFreeRedundancyOut.textContent  = '—';
    taxableRedundancyOut.textContent  = '—';
    redundancyTaxOut.textContent      = '—';
    redundancyAfterTaxOut.textContent = '—';
    alTaxOut.textContent              = '—';
    alAfterTaxOut.textContent         = '—';
    totalAfterTaxOut.textContent      = '—';
    return;
  }

  const weeks       = getRedundancyWeeks(years);
  const weeklyRate  = annualSal > 0 ? (annualSal / 52) : 0;
  const redundancyPay = weeklyRate * weeks;
  const hourlyRate  = hrsPerWeek > 0 ? (weeklyRate / hrsPerWeek) : 0;

  const alWeeks     = hrsPerWeek > 0 ? (alHours / hrsPerWeek) : 0;
  const alPayout    = weeklyRate * alWeeks;

  const totalGross  = redundancyPay + alPayout;

  // ===== Tax on redundancy (genuine redundancy rules) =====
  const taxFreeLimit = TAX_FREE_BASE + TAX_FREE_PER_YEAR * Math.max(0, Math.floor(years));
  const taxFreeRedundancy = Math.min(redundancyPay, taxFreeLimit);
  const taxableRedundancy = Math.max(0, redundancyPay - taxFreeRedundancy);

  // ETP tax rate based on age group
  const isOver60 = ageGroup === '60plus';
  const eptRate = isOver60 ? 0.17 : 0.32;

  // We assume taxable redundancy is under the ETP cap
  const redundancyTax = Math.min(taxableRedundancy, ETP_CAP) * eptRate;
  const redundancyAfterTax = taxFreeRedundancy + (taxableRedundancy - redundancyTax);

  // ===== Tax on annual leave (simple marginal-rate assumption) =====
  const alTax = alPayout * marginalRateFrac;
  const alAfterTax = alPayout - alTax;

  const totalAfterTax = redundancyAfterTax + alAfterTax;

  // ===== Write to UI =====
  totalOut.textContent            = fmtMoney(totalGross);
  yearsOut.textContent            = years || '0';
  redundancyWeeksOut.textContent  = fmtNumber(weeks, 1);
  weeklyRateOut.textContent       = weeklyRate > 0 ? fmtMoneyExact(weeklyRate).replace('A$', '$') : '—';
  redundancyPayOut.textContent    = fmtMoney(redundancyPay);
  hourlyRateOut.textContent       = hourlyRate > 0 ? '$' + fmtNumber(hourlyRate, 2) : '—';
  alPayoutOut.textContent         = fmtMoney(alPayout);

  taxFreeRedundancyOut.textContent  = fmtMoney(taxFreeRedundancy);
  taxableRedundancyOut.textContent  = fmtMoney(taxableRedundancy);
  redundancyTaxOut.textContent      = redundancyTax > 0 ? fmtMoneyExact(redundancyTax) : '—';
  redundancyAfterTaxOut.textContent = fmtMoney(redundancyAfterTax);

  alTaxOut.textContent        = alTax > 0 ? fmtMoneyExact(alTax) : '—';
  alAfterTaxOut.textContent   = fmtMoney(alAfterTax);
  totalAfterTaxOut.textContent= fmtMoney(totalAfterTax);
}

// ===== Copy summary =====
async function copySummary() {
  const years       = num(fullYearsEl);
  const alHours     = num(alHoursEl);
  const hrsPerWeek  = num(hoursPerWeekEl) || 38;
  const annualSal   = num(annualSalaryEl);
  const ageGroup    = ageGroupEl.value;
  let marginalRate  = num(marginalRateEl);
  if (!Number.isFinite(marginalRate) || marginalRate <= 0) marginalRate = 32;
  if (marginalRate > 60) marginalRate = 60;
  const marginalRateFrac = marginalRate / 100;

  const weeks       = getRedundancyWeeks(years);
  const weeklyRate  = annualSal > 0 ? (annualSal / 52) : 0;
  const redundancyPay = weeklyRate * weeks;
  const hrsWeekSafe = hrsPerWeek || 38;
  const hourlyRate  = hrsWeekSafe > 0 ? (weeklyRate / hrsWeekSafe) : 0;

  const alWeeks     = hrsWeekSafe > 0 ? (alHours / hrsWeekSafe) : 0;
  const alPayout    = weeklyRate * alWeeks;
  const totalGross  = redundancyPay + alPayout;

  const taxFreeLimit = TAX_FREE_BASE + TAX_FREE_PER_YEAR * Math.max(0, Math.floor(years));
  const taxFreeRedundancy = Math.min(redundancyPay, taxFreeLimit);
  const taxableRedundancy = Math.max(0, redundancyPay - taxFreeRedundancy);

  const isOver60 = ageGroup === '60plus';
  const eptRate = isOver60 ? 0.17 : 0.32;
  const redundancyTax = Math.min(taxableRedundancy, ETP_CAP) * eptRate;
  const redundancyAfterTax = taxFreeRedundancy + (taxableRedundancy - redundancyTax);

  const alTax       = alPayout * marginalRateFrac;
  const alAfterTax  = alPayout - alTax;
  const totalAfterTax = redundancyAfterTax + alAfterTax;

  const ageLabel = isOver60 ? '60 or older' : 'Under 60';

  const lines = [
    `Redundancy Ray (AU) – rough estimate (2024–25 settings)`,
    ``,
    `Total gross payout (redundancy + annual leave): ${fmtMoney(totalGross)}`,
    `Total after tax (approx): ${fmtMoney(totalAfterTax)}`,
    ``,
    `Years of service: ${years || 0} year(s)`,
    `Redundancy weeks (per table): ${fmtNumber(weeks, 1)}`,
    `Weekly rate: ${weeklyRate > 0 ? '$' + fmtNumber(weeklyRate, 2) : '—'}`,
    `Hourly rate: ${hourlyRate > 0 ? '$' + fmtNumber(hourlyRate, 2) : '—'}`,
    ``,
    `Redundancy pay (gross): ${fmtMoney(redundancyPay)}`,
    `Tax-free redundancy cap used: ${fmtMoney(taxFreeRedundancy)} (of formula cap: ${fmtMoney(taxFreeLimit)})`,
    `Taxable redundancy (ETP): ${fmtMoney(taxableRedundancy)}`,
    `ETP age group: ${ageLabel}`,
    `Approx tax on redundancy (ETP): ${redundancyTax > 0 ? fmtMoneyExact(redundancyTax) : '—'}`,
    `Redundancy after tax: ${fmtMoney(redundancyAfterTax)}`,
    ``,
    `Annual leave payout (gross): ${fmtMoney(alPayout)} (hours: ${alHours || 0}, est. rate: ${marginalRate}% )`,
    `Approx tax on annual leave: ${alTax > 0 ? fmtMoneyExact(alTax) : '—'}`,
    `Annual leave after tax: ${fmtMoney(alAfterTax)}`,
    ``,
    `Note: This is a simple guide only. It uses 2024–25 ATO tax-free redundancy limits and a`,
    `flat ETP rate (${isOver60 ? '17%' : '32%'}), and assumes your taxable redundancy is under the ETP cap.`,
    `Leave tax is approximated using the marginal rate you entered. Your actual outcome will depend`,
    `on your full tax position, awards/agreements, any LSL splits, notice, and small-business rules.`
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
[
  fullYearsEl,
  alHoursEl,
  hoursPerWeekEl,
  annualSalaryEl,
  ageGroupEl,
  marginalRateEl
].forEach(el => {
  el.addEventListener('input', recalc);
});

afterTaxToggle.addEventListener('change', () => {
  if (afterTaxToggle.checked) {
    taxSection.classList.remove('hidden');
  } else {
    taxSection.classList.add('hidden');
  }
});

copyBtn.addEventListener('click', copySummary);

// Initial
recalc();
taxSection.classList.add('hidden');
afterTaxToggle.checked = false;
