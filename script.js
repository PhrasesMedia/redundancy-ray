// ===================== Formatting helpers =====================

// Currency formatter for AU dollars (no cents in display)
const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

// Convert any input value to a safe number
function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// ===================== Redundancy logic =====================

// Redundancy weeks table (Fair Work style, simplified)
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
  // Simple extension above 10 years so it doesn't just stop
  return 12 + years;
}

// ===================== Mortgage logic =====================

// Standard principal & interest mortgage repayment (monthly)
function calculateMonthlyRepayment(loanAmount, annualRate, termYears) {
  const P = loanAmount;
  const r = annualRate / 100 / 12;  // monthly interest rate
  const n = termYears * 12;         // total months

  if (P <= 0 || n <= 0) return 0;

  // If interest rate is 0, just loan / months
  if (r === 0) {
    return P / n;
  }

  const factor = Math.pow(1 + r, n);
  return (P * r * factor) / (factor - 1);
}

// ===================== DOM references =====================

// Redundancy inputs
const yearsEl     = document.getElementById("years");
const alHoursEl   = document.getElementById("alHours");
const stdHoursEl  = document.getElementById("stdHours");
const salaryEl    = document.getElementById("salary");

// Redundancy outputs
const redundancyWeeksEl = document.getElementById("redundancyWeeks");
const redundancyPayEl   = document.getElementById("redundancyPay");
const alPayEl           = document.getElementById("alPay");
const totalPayoutEl     = document.getElementById("totalPayout");

// Mortgage helper inputs
const loanAmountEl   = document.getElementById("loanAmount");
const loanTermEl     = document.getElementById("loanTerm");
const interestRateEl = document.getElementById("interestRate");

// Mortgage helper output
const mortgageCoverageEl = document.getElementById("mortgageCoverage");

// Copy button
const copySummaryBtn = document.getElementById("copySummary");

// ===================== Core calculation =====================

function recalc() {
  // --- Read redundancy inputs ---
  const years    = safeNumber(yearsEl.value);
  const alHours  = safeNumber(alHoursEl.value);
  const stdHours = safeNumber(stdHoursEl.value);
  const salary   = safeNumber(salaryEl.value);

  let redundancyWeeks = 0;
  let redundancyPay   = 0;
  let alPay           = 0;
  let totalPayout     = 0;

  // Only calculate if we have the basics
  if (years > 0 && salary > 0 && stdHours > 0) {
    redundancyWeeks = getRedundancyWeeks(years);

    const weeklySalary = salary / 52;
    redundancyPay      = weeklySalary * redundancyWeeks;

    const hourlyRate = weeklySalary / stdHours;
    alPay            = hourlyRate * alHours;

    totalPayout = redundancyPay + alPay;
  }

  // --- Update redundancy UI ---

  if (totalPayout > 0) {
    totalPayoutEl.textContent = currencyFormatter.format(totalPayout);
  } else {
    totalPayoutEl.textContent = "—";
  }

  redundancyWeeksEl.textContent =
    redundancyWeeks > 0 ? `${redundancyWeeks} weeks` : "—";

  redundancyPayEl.textContent =
    redundancyPay > 0 ? currencyFormatter.format(redundancyPay) : "—";

  alPayEl.textContent =
    alPay > 0 ? currencyFormatter.format(alPay) : "—";

  // --- Mortgage coverage using the payout we just calculated ---
  recalcMortgageCoverage(totalPayout);
}

function recalcMortgageCoverage(totalPayout) {
  const loanAmount   = safeNumber(loanAmountEl.value);
  const loanTerm     = safeNumber(loanTermEl.value);
  const interestRate = safeNumber(interestRateEl.value);

  // No payout yet
  if (totalPayout <= 0) {
    mortgageCoverageEl.textContent =
      "Enter your redundancy details to see mortgage coverage.";
    return;
  }

  // Missing loan details
  if (loanAmount <= 0 || loanTerm <= 0 || interestRate < 0) {
    mortgageCoverageEl.textContent =
      "Enter your loan amount, term and interest rate to estimate coverage.";
    return;
  }

  const monthlyRepayment = calculateMonthlyRepayment(
    loanAmount,
    interestRate,
    loanTerm
  );

  if (monthlyRepayment <= 0) {
    mortgageCoverageEl.textContent =
      "Unable to calculate mortgage coverage with these numbers.";
    return;
  }

  const monthsCoverage = totalPayout / monthlyRepayment;
  const wholeMonths    = Math.floor(monthsCoverage);

  const repaymentStr = currencyFormatter.format(Math.round(monthlyRepayment));

  mortgageCoverageEl.innerHTML = `
    With this redundancy, you could cover about
    <strong>${wholeMonths} month${wholeMonths === 1 ? "" : "s"}</strong>
    of mortgage repayments (estimated monthly repayment ${repaymentStr}).
  `;
}

// ===================== Copy summary =====================

async function handleCopySummary() {
  const years   = yearsEl.value || "0";
  const alHours = alHoursEl.value || "0";
  const stdHrs  = stdHoursEl.value || "0";
  const salary  = salaryEl.value || "0";

  const totalText          = totalPayoutEl.textContent || "—";
  const redundancyWeeksTxt = redundancyWeeksEl.textContent || "—";
  const redundancyPayTxt   = redundancyPayEl.textContent || "—";
  const alPayTxt           = alPayEl.textContent || "—";
  const mortgageText       = mortgageCoverageEl.textContent || "";

  const salaryFormatted =
    salary && safeNumber(salary) > 0
      ? currencyFormatter.format(safeNumber(salary))
      : "—";

  const lines = [
    "Redundancy Ray estimate (AU):",
    "",
    `• Years with company: ${years}`,
    `• Annual salary: ${salaryFormatted}`,
    `• AL hours accrued: ${alHours}`,
    `• Std hrs/week: ${stdHrs}`,
    "",
    `Redundancy weeks: ${redundancyWeeksTxt}`,
    `Redundancy payout (before tax): ${redundancyPayTxt}`,
    `Annual leave payout (before tax): ${alPayTxt}`,
    `Total estimated payout (before tax): ${totalText}`,
    "",
    mortgageText ? `Mortgage coverage: ${mortgageText}` : "",
    "",
    "Estimates only – actual entitlements depend on awards/agreements, notice, long service leave, tax and any small-business exemptions.",
  ];

  const summary = lines.filter(Boolean).join("\n");

  try {
    await navigator.clipboard.writeText(summary);
    copySummaryBtn.textContent = "Copied!";
    setTimeout(() => {
      copySummaryBtn.textContent = "Copy summary";
    }, 1500);
  } catch (err) {
    console.error("Copy failed", err);
    copySummaryBtn.textContent = "Copy failed";
    setTimeout(() => {
      copySummaryBtn.textContent = "Copy summary";
    }, 1500);
  }
}

// ===================== Event wiring =====================

[
  yearsEl,
  alHoursEl,
  stdHoursEl,
  salaryEl,
  loanAmountEl,
  loanTermEl,
  interestRateEl,
].forEach((el) => {
  el.addEventListener("input", recalc);
});

copySummaryBtn.addEventListener("click", handleCopySummary);

// Run once on load so everything starts in a clean state
recalc();
