// Redundancy Ray – script.js (no ageGroup / marginalRate inputs)

// ===================== DOM refs =====================

// Inputs
const fullYearsEl      = document.getElementById('fullYears');
const alHoursEl        = document.getElementById('alHours');
const hoursPerWeekEl   = document.getElementById('hoursPerWeek');
const annualSalaryEl   = document.getElementById('annualSalary');
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

// Outputs - tax breakdown
const taxSection             = document.getElementById('taxSection');
const taxFreeRedundancyOut   = document.getElementById('taxFreeRedundancyOut');
const taxableRedundancyOut   = document.getElementById('taxableRedundancyOut');
const redundancyTaxOut       = document.getElementById('redundancyTaxOut');
const redundancyAfterTaxOut  = document.getElementById('redundancyAfterTaxOut');
const alTaxOut               = document.getElementById('alTaxOut');
const alAfterTaxOut          = document.getElementById('alAfterTaxOut');
const totalAfterTaxOut       = document.getElementById('totalAfterTaxOut');

// Mortgage helper
const mortgageToggleBtn      = document.getElementById('mortgageToggleBtn');
const mortgageSection        = document.getElementById('mortgageSection');
const mortgageLoanAmountEl   = document.getElementById('mortgageLoanAmount');
const mortgageLoanTermEl     = document.getElementById('mortgageLoanTerm');
const mortgageInterestRateEl = document.getElementById('mortgageInterestRate');
const mortgageInterestOnlyEl = document.getElementById('mortgageInterestOnly');
const mortgageCoverageOut    = document.getElementById('mortgageCoverageOut');

// Copy summary
const copyBtn                = document.getElementById('copyBtn');

// ===================== Constants & helpers =====================

// A simple, fixed marginal tax rate to approximate after-tax amounts.
// Previously this came from a user input; now we just assume 32%.
const DEFAULT_MTR = 0.32;

// 2024-25 genuine redundancy tax-free threshold:
// base amount 12,524 + 6,264 * years of service.
const TAX_FREE_BASE   = 12524;
const TAX_FREE_PER_YR = 6264;

/**
 * Parse a number from an input element. Returns 0 if NaN/empty.
 */
function getNumber(el) {
  if (!el) return 0;
  const value = parseFloat(el.value);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Format a number as AUD currency. Returns "—" for NaN or zero if preferEmpty.
 */
function formatCurrency(amount, preferEmpty = false) {
  if (!Number.isFinite(amount)) return '—';
  if (preferEmpty && amount === 0) return '—';
  return amount.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 2
  });
}

/**
 * Format a plain number with optional decimals.
 */
function formatNumber(value, decimals = 0) {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Look up redundancy weeks from full years of service using the table you show.
 */
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
  // Per your table note, 10+ years = 12 weeks
  return 12;
}

/**
 * Compute tax components based on gross redundancy + AL payout.
 */
function computeTax(yearsOfService, redundancyGross, alGross) {
  const taxFreeLimit = TAX_FREE_BASE + TAX_FREE_PER_YR * yearsOfService;
  const taxFreeRedundancy = Math.max(0, Math.min(redundancyGross, taxFreeLimit));
  const taxableRedundancy = Math.max(0, redundancyGross - taxFreeRedundancy);

  const redundancyTax = taxableRedundancy * DEFAULT_MTR;
  const redundancyAfter = redundancyGross - redundancyTax;

  const alTax = alGross * DEFAULT_MTR;
  const alAfter = alGross - alTax;

  const totalAfter = redundancyAfter + alAfter;

  return {
    taxFreeRedundancy,
    taxableRedundancy,
    redundancyTax,
    redundancyAfter,
    alTax,
    alAfter,
    totalAfter
  };
}

// ===================== Main calc =====================

function recalc() {
  const years          = getNumber(fullYearsEl);
  const alHours        = getNumber(alHoursEl);
  const hoursPerWeek   = Math.max(1, getNumber(hoursPerWeekEl));
  const annualSalary   = getNumber(annualSalaryEl);
  const showAfterTax   = !!(afterTaxToggle && afterTaxToggle.checked);

  // Basic derived rates
  const weeklyRate = annualSalary / 52;
  const hourlyRate = annualSalary / (hoursPerWeek * 52);

  const redundancyWeeks = getRedundancyWeeks(years);
  const redundancyGross = weeklyRate * redundancyWeeks;
  const alGross         = hourlyRate * alHours;
  const totalGross      = redundancyGross + alGross;

  // Write basic outputs
  if (yearsOut)           yearsOut.textContent = years > 0 ? formatNumber(years, 0) + ' years' : '—';
  if (redundancyWeeksOut) redundancyWeeksOut.textContent = redundancyWeeks ? formatNumber(redundancyWeeks, 0) + ' weeks' : '—';
  if (weeklyRateOut)      weeklyRateOut.textContent = weeklyRate > 0 ? formatCurrency(weeklyRate) : '—';
  if (redundancyPayOut)   redundancyPayOut.textContent = redundancyGross > 0 ? formatCurrency(redundancyGross) : '—';
  if (hourlyRateOut)      hourlyRateOut.textContent = hourlyRate > 0 ? formatCurrency(hourlyRate) : '—';
  if (alPayoutOut)        alPayoutOut.textContent = alGross > 0 ? formatCurrency(alGross) : '—';

  // Headline total + optional after-tax
  let totalAfter = 0;

  if (showAfterTax && totalGross > 0) {
    const tax = computeTax(years, redundancyGross, alGross);
    totalAfter = tax.totalAfter;

    if (taxSection) taxSection.classList.remove('hidden');

    if (taxFreeRedundancyOut)  taxFreeRedundancyOut.textContent  = formatCurrency(tax.taxFreeRedundancy, true);
    if (taxableRedundancyOut)  taxableRedundancyOut.textContent  = formatCurrency(tax.taxableRedundancy, true);
    if (redundancyTaxOut)      redundancyTaxOut.textContent      = formatCurrency(tax.redundancyTax, true);
    if (redundancyAfterTaxOut) redundancyAfterTaxOut.textContent = formatCurrency(tax.redundancyAfter, true);
    if (alTaxOut)              alTaxOut.textContent              = formatCurrency(tax.alTax, true);
    if (alAfterTaxOut)         alAfterTaxOut.textContent         = formatCurrency(tax.alAfter, true);
    if (totalAfterTaxOut)      totalAfterTaxOut.textContent      = formatCurrency(tax.totalAfter, true);

    if (totalLabel) totalLabel.textContent = 'Estimated payout (after tax, approx)';
    if (totalOut)   totalOut.textContent   = formatCurrency(totalAfter, true);

  } else {
    // Hide tax details
    if (taxSection) taxSection.classList.add('hidden');

    if (taxFreeRedundancyOut)  taxFreeRedundancyOut.textContent  = '—';
    if (taxableRedundancyOut)  taxableRedundancyOut.textContent  = '—';
    if (redundancyTaxOut)      redundancyTaxOut.textContent      = '—';
    if (redundancyAfterTaxOut) redundancyAfterTaxOut.textContent = '—';
    if (alTaxOut)              alTaxOut.textContent              = '—';
    if (alAfterTaxOut)         alAfterTaxOut.textContent         = '—';
    if (totalAfterTaxOut)      totalAfterTaxOut.textContent      = '—';

    if (totalLabel) totalLabel.textContent = 'Estimated payout (before tax)';
    if (totalOut)   totalOut.textContent   = totalGross > 0 ? formatCurrency(totalGross, true) : '—';
  }

  // Update mortgage coverage with latest totals
  updateMortgageCoverage(totalGross, showAfterTax ? totalAfter : null);
}

// ===================== Mortgage helper =====================

function updateMortgageCoverage(totalGross, totalAfterTaxOverride) {
  if (!mortgageCoverageOut) return;

  const loanAmount   = getNumber(mortgageLoanAmountEl);
  const loanYears    = getNumber(mortgageLoanTermEl);
  const ratePA       = getNumber(mortgageInterestRateEl);
  const interestOnly = !!(mortgageInterestOnlyEl && mortgageInterestOnlyEl.checked);

  if (loanAmount <= 0 || loanYears <= 0 || ratePA <= 0) {
    mortgageCoverageOut.textContent = '—';
    return;
  }

  const monthlyRate = ratePA / 100 / 12;
  const n           = loanYears * 12;

  let monthlyRepayment;

  if (interestOnly) {
    monthlyRepayment = loanAmount * monthlyRate;
  } else {
    // Standard P&I repayment formula
    const factor = Math.pow(1 + monthlyRate, -n);
    monthlyRepayment = loanAmount * monthlyRate / (1 - factor);
  }

  if (!Number.isFinite(monthlyRepayment) || monthlyRepayment <= 0) {
    mortgageCoverageOut.textContent = '—';
    return;
  }

  const available = Number.isFinite(totalAfterTaxOverride) && totalAfterTaxOverride > 0
    ? totalAfterTaxOverride
    : totalGross;

  if (!Number.isFinite(available) || available <= 0) {
    mortgageCoverageOut.textContent = '—';
    return;
  }

  const months = available / monthlyRepayment;
  if (!Number.isFinite(months) || months <= 0) {
    mortgageCoverageOut.textContent = '—';
    return;
  }

  const wholeMonths = Math.floor(months);
  const years = Math.floor(wholeMonths / 12);
  const remMonths = wholeMonths % 12;

  let label = formatNumber(wholeMonths, 0) + ' months';
  if (years > 0) {
    label += ` (${years} year${years === 1 ? '' : 's'}`;
    if (remMonths > 0) {
      label += `, ${remMonths} month${remMonths === 1 ? '' : 's'}`;
    }
    label += ')';
  }

  mortgageCoverageOut.textContent = label;
}

// ===================== Copy summary =====================

function buildSummaryText() {
  const years          = getNumber(fullYearsEl);
  const alHours        = getNumber(alHoursEl);
  const hoursPerWeek   = Math.max(1, getNumber(hoursPerWeekEl));
  const annualSalary   = getNumber(annualSalaryEl);
  const showAfterTax   = !!(afterTaxToggle && afterTaxToggle.checked);

  const weeklyRate     = annualSalary / 52;
  const hourlyRate     = annualSalary / (hoursPerWeek * 52);
  const redundancyWeeks= getRedundancyWeeks(years);
  const redundancyGross= weeklyRate * redundancyWeeks;
  const alGross        = hourlyRate * alHours;
  const totalGross     = redundancyGross + alGross;

  let text = 'Redundancy estimate (approx):\n';

  text += `• Years of service: ${years || 0}\n`;
  text += `• Annual salary: ${formatCurrency(annualSalary, true)}\n`;
  text += `• Redundancy weeks: ${redundancyWeeks}\n`;
  text += `• Redundancy pay (gross): ${formatCurrency(redundancyGross, true)}\n`;
  text += `• Annual leave payout (gross): ${formatCurrency(alGross, true)}\n`;
  text += `• Total payout (before tax): ${formatCurrency(totalGross, true)}\n`;

  if (showAfterTax && totalGross > 0) {
    const tax = computeTax(years, redundancyGross, alGross);
    text += '\nAfter-tax (approx):\n';
    text += `• Tax-free redundancy: ${formatCurrency(tax.taxFreeRedundancy, true)}\n`;
    text += `• Taxable redundancy: ${formatCurrency(tax.taxableRedundancy, true)}\n`;
    text += `• Tax on redundancy: ${formatCurrency(tax.redundancyTax, true)}\n`;
    text += `• Redundancy after tax: ${formatCurrency(tax.redundancyAfter, true)}\n`;
    text += `• Tax on annual leave: ${formatCurrency(tax.alTax, true)}\n`;
    text += `• Annual leave after tax: ${formatCurrency(tax.alAfter, true)}\n`;
    text += `• Total after tax: ${formatCurrency(tax.totalAfter, true)}\n`;
  }

  text += '\nEstimates only — actual entitlements and tax depend on awards, agreements, notice, LSL, and your full tax position.';

  return text;
}

function handleCopy() {
  const text = buildSummaryText();
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      // Silently ignore clipboard errors
    });
  } else {
    // Fallback: older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(textarea);
  }
}

// ===================== Wire up events =====================

function init() {
  const inputs = [
    fullYearsEl,
    alHoursEl,
    hoursPerWeekEl,
    annualSalaryEl,
    afterTaxToggle,
    mortgageLoanAmountEl,
    mortgageLoanTermEl,
    mortgageInterestRateEl,
    mortgageInterestOnlyEl
  ];

  inputs.forEach(el => {
    if (!el) return;
    const eventName = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(eventName, recalc);
  });

  if (mortgageToggleBtn && mortgageSection) {
    mortgageToggleBtn.addEventListener('click', () => {
      const isHidden = mortgageSection.classList.contains('hidden');
      if (isHidden) {
        mortgageSection.classList.remove('hidden');
      } else {
        mortgageSection.classList.add('hidden');
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', handleCopy);
  }

  // Initial calc on load
  recalc();
}

document.addEventListener('DOMContentLoaded', init);
