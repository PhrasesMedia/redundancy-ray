// ===========================================================
// ⭐ Fade-in for "Recommended by Ray" WITHOUT layout shift
// ===========================================================
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('rayRecommends');
  if (!el) return;

  // Ensure it always reserves space in layout
  el.style.display = 'block';

  // Fade-in on initial load (independent of the 7s schedule)
  setTimeout(() => {
    el.classList.add('visible');
  }, 300);
});


// ===================== DOM refs =====================

// Inputs
const fullYearsEl      = document.getElementById('fullYears');
const alHoursEl        = document.getElementById('alHours');
const hoursPerWeekEl   = document.getElementById('hoursPerWeek');
const annualSalaryEl   = document.getElementById('annualSalary');
const ageGroupEl       = document.getElementById('ageGroup');
const marginalRateEl   = document.getElementById('marginalRate');
const afterTaxToggle   = document.getElementById('afterTaxToggle');

// Outputs - headline
const totalLabel       = document.getElementById('totalLabel');
const totalOut         = document.getElementById('totalOut');

// Outputs - breakdown
const yearsOut               = document.getElementById('yearsOut');
const redundancyWeeksOut     = document.getElementById('redundancyWeeksOut');
const weeklyRateOut          = document.getElementById('weeklyRateOut');
const redundancyPayOut       = document.getElementById('redundancyPayOut');
const hourlyRateOut          = document.getElementById('hourlyRateOut');
const alPayoutOut            = document.getElementById('alPayoutOut');

// Outputs - tax section
const taxSection             = document.getElementById('taxSection');
const taxFreeRedundancyOut   = document.getElementById('taxFreeRedundancyOut');
const taxableRedundancyOut   = document.getElementById('taxableRedundancyOut');
const redundancyTaxOut       = document.getElementById('redundancyTaxOut');
const redundancyAfterTaxOut  = document.getElementById('redundancyAfterTaxOut');
const alTaxOut               = document.getElementById('alTaxOut');
const alAfterTaxOut          = document.getElementById('alAfterTaxOut');
const totalAfterTaxOut       = document.getElementById('totalAfterTaxOut');

// Copy button
const copyBtn          = document.getElementById('copyBtn');

// Ray Recommends block
const rayRecommendsEl  = document.getElementById('rayRecommends');


// ===================== Helpers =====================

function formatMoney(value, decimals = 0) {
  if (!Number.isFinite(value) || value === 0) return '—';
  return value.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function getRedundancyWeeks(fullYears) {
  const y = Math.floor(fullYears || 0);
  if (y < 1) return 0;
  if (y < 2) return 4;
  if (y < 3) return 6;
  if (y < 4) return 7;
  if (y < 5) return 8;
  if (y < 6) return 10;
  if (y < 7) return 11;
  if (y < 8) return 13;
  if (y < 9) return 14;
  if (y < 10) return 16;
  return 12;
}

// Approx 2024–25 genuine redundancy tax-free cap
const TAX_FREE_BASE    = 12541;
const TAX_FREE_PER_YR  = 6266;


// ===================== Ray Recommends timing =====================

let rayRecommendsTimeoutId = null;

function hideRayRecommendsImmediately() {
  if (!rayRecommendsEl) return;
  clearTimeout(rayRecommendsTimeoutId);
  rayRecommendsEl.classList.remove('visible');
  rayRecommendsEl.style.opacity = '0';
}

function scheduleRayRecommends() {
  if (!rayRecommendsEl) return;

  clearTimeout(rayRecommendsTimeoutId);
  rayRecommendsEl.classList.remove('visible');
  rayRecommendsEl.style.opacity = '0';

  rayRecommendsTimeoutId = setTimeout(() => {
    rayRecommendsEl.style.opacity = '1';
    rayRecommendsEl.classList.add('visible');
  }, 7000);
}


// ===================== Core calculation =====================

function recalc() {
  const years        = parseFloat(fullYearsEl.value || '') || 0;
  const alHours      = parseFloat(alHoursEl.value || '') || 0;
  const hoursPerWeek = parseFloat(hoursPerWeekEl.value || '') || 0;
  const annualSalary = parseFloat(annualSalaryEl.value || '') || 0;
  const marginalRate = parseFloat(marginalRateEl.value || '') || 0;

  // Basic derived rates
  const weeklyRate = annualSalary > 0 ? annualSalary / 52 : 0;
  const hourlyRate = annualSalary > 0 && hoursPerWeek > 0
    ? (annualSalary / 52) / hoursPerWeek
    : 0;

  const redundancyWeeks = getRedundancyWeeks(years);
  const redundancyPay   = weeklyRate * redundancyWeeks;
  const alPayout        = hourlyRate * alHours;
  const totalGross      = redundancyPay + alPayout;

  // Populate breakdown
  yearsOut.textContent = years ? years.toString() : '—';
  redundancyWeeksOut.textContent = redundancyWeeks ? redundancyWeeks.toString() : '—';
  weeklyRateOut.textContent = formatMoney(weeklyRate, 2);
  redundancyPayOut.textContent = formatMoney(redundancyPay, 0);
  hourlyRateOut.textContent = formatMoney(hourlyRate, 2);
  alPayoutOut.textContent = formatMoney(alPayout, 0);

  // Nothing else to show if no meaningful payout
  if (totalGross <= 0) {
    totalOut.textContent = '—';
    taxSection.classList.add('hidden');
    totalLabel.textContent = 'Estimated payout (before tax)';
    updateMortgageCoverage();
    hideRayRecommendsImmediately();
    return;
  }

  // Tax calculations
  const taxFreeCap = Math.max(0, TAX_FREE_BASE + TAX_FREE_PER_YR * Math.max(0, years));
  const taxFreeRedundancy = Math.min(redundancyPay, taxFreeCap);
  const taxableRedundancy = Math.max(0, redundancyPay - taxFreeRedundancy);

  const etpRate = ageGroupEl.value === '60plus' ? 0.15 : 0.17;
  const redundancyTax = taxableRedundancy * etpRate;
  const redundancyAfterTax = redundancyPay - redundancyTax;

  const mr = Math.min(Math.max(marginalRate, 0), 60) / 100;
  const alTax = alPayout * mr;
  const alAfterTax = alPayout - alTax;

  const totalAfterTax = redundancyAfterTax + alAfterTax;

  const showAfterTax = afterTaxToggle.checked;

  if (showAfterTax) {
    taxSection.classList.remove('hidden');
    totalLabel.textContent = 'Estimated payout (after tax approx)';
    totalOut.textContent = formatMoney(totalAfterTax, 0);
  } else {
    taxSection.classList.add('hidden');
    totalLabel.textContent = 'Estimated payout (before tax)';
    totalOut.textContent = formatMoney(totalGross, 0);
  }

  // Populate tax fields
  taxFreeRedundancyOut.textContent = formatMoney(taxFreeRedundancy, 0);
  taxableRedundancyOut.textContent = formatMoney(taxableRedundancy, 0);
  redundancyTaxOut.textContent = formatMoney(redundancyTax, 0);
  redundancyAfterTaxOut.textContent = formatMoney(redundancyAfterTax, 0);
  alTaxOut.textContent = formatMoney(alTax, 0);
  alAfterTaxOut.textContent = formatMoney(alAfterTax, 0);
  totalAfterTaxOut.textContent = formatMoney(totalAfterTax, 0);

  updateMortgageCoverage();

  // Schedule Ray Recommends reveal (delayed)
  scheduleRayRecommends();
}


// ===================== Copy summary =====================

copyBtn.addEventListener('click', () => {
  const lines = [];
  const isAfterTax = afterTaxToggle.checked;
  const label = isAfterTax ? 'after tax (approx)' : 'before tax';

  lines.push('Redundancy Ray estimate');
  lines.push('');
  lines.push(`Total payout: ${totalOut.textContent} (${label})`);
  lines.push('');

  lines.push(`Years of service: ${yearsOut.textContent}`);
  lines.push(`Redundancy weeks: ${redundancyWeeksOut.textContent}`);
  lines.push(`Redundancy pay (gross): ${redundancyPayOut.textContent}`);
  lines.push(`Annual leave payout (gross): ${alPayoutOut.textContent}`);

  if (!taxSection.classList.contains('hidden')) {
    lines.push('');
    lines.push('Tax (approx):');
    lines.push(`• Tax-free redundancy: ${taxFreeRedundancyOut.textContent}`);
    lines.push(`• Taxable redundancy (ETP): ${taxableRedundancyOut.textContent}`);
    lines.push(`• Tax on redundancy: ${redundancyTaxOut.textContent}`);
    lines.push(`• Redundancy after tax: ${redundancyAfterTaxOut.textContent}`);
    lines.push(`• Tax on annual leave: ${alTaxOut.textContent}`);
    lines.push(`• Annual leave after tax: ${alAfterTaxOut.textContent}`);
    lines.push(`• Total after tax: ${totalAfterTaxOut.textContent}`);
  }

  lines.push('');
  lines.push('Estimates only – actual entitlements and tax depend on your full situation.');

  navigator.clipboard?.writeText(lines.join('\n')).then(() => {
    const original = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = original; }, 1500);
  });
});


// ===================== Mortgage coverage helper =====================

const mortgageToggleBtn       = document.getElementById('mortgageToggleBtn');
const mortgageSection         = document.getElementById('mortgageSection');
const mortgageLoanAmountEl    = document.getElementById('mortgageLoanAmount');
const mortgageLoanTermEl      = document.getElementById('mortgageLoanTerm');
const mortgageInterestRateEl  = document.getElementById('mortgageInterestRate');
const mortgageInterestOnlyEl  = document.getElementById('mortgageInterestOnly');
const mortgageCoverageOut     = document.getElementById('mortgageCoverageOut');

function getCurrentPayoutAmount() {
  const raw = totalOut.textContent.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  const val = parseFloat(raw);
  return Number.isFinite(val) ? val : 0;
}

function calcMonthlyRepayment(principal, annualRate, years) {
  const P = principal;
  const r = (annualRate / 100) / 12;
  const n = years * 12;

  if (!P || !n) return 0;
  if (r === 0) return P / n;

  const factor = Math.pow(1 + r, n);
  return (P * r * factor) / (factor - 1);
}

function updateMortgageCoverage() {
  const payout = getCurrentPayoutAmount();
  const loan   = parseFloat(mortgageLoanAmountEl.value || '') || 0;
  const term   = parseFloat(mortgageLoanTermEl.value || '') || 0;
  const rate   = parseFloat(mortgageInterestRateEl.value || '') || 0;

  if (!payout || !loan || !term || rate < 0) {
    mortgageCoverageOut.textContent = '—';
    return;
  }

  let monthly;

  if (mortgageInterestOnlyEl.checked) {
    monthly = loan * (rate / 100) / 12;
  } else {
    monthly = calcMonthlyRepayment(loan, rate, term);
  }

  if (!monthly || monthly <= 0) {
    mortgageCoverageOut.textContent = '—';
    return;
  }

  const months = payout / monthly;
  const weeks  = months * 4.345;

  mortgageCoverageOut.textContent =
    `${weeks.toFixed(0)} weeks / ${months.toFixed(1)} months`;
}

// Toggle mortgage panel
mortgageSection.classList.add('hidden');
mortgageToggleBtn.addEventListener('click', () => {
  const isHidden = mortgageSection.classList.contains('hidden');
  if (isHidden) {
    mortgageSection.classList.remove('hidden');
    mortgageToggleBtn.textContent = 'Hide mortgage coverage helper';
    updateMortgageCoverage();
  } else {
    mortgageSection.classList.add('hidden');
    mortgageToggleBtn.textContent = 'Mortgage coverage helper';
  }
});

// Recalculate coverage when inputs change
[mortgageLoanAmountEl, mortgageLoanTermEl, mortgageInterestRateEl]
  .forEach(el => el?.addEventListener('input', updateMortgageCoverage));

mortgageInterestOnlyEl?.addEventListener('change', updateMortgageCoverage);


// ===================== Wire up recalculation =====================

[
  fullYearsEl,
  alHoursEl,
  hoursPerWeekEl,
  annualSalaryEl,
  ageGroupEl,
  marginalRateEl
].forEach(el => {
  if (!el) return;
  const eventName = el === ageGroupEl ? 'change' : 'input';
  el.addEventListener(eventName, recalc);
});

afterTaxToggle.addEventListener('change', recalc);

// Initial render
recalc();
