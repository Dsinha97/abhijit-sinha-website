**1.Mathematical Formula Reference:**

**1. SIP Future Value Formula:**

$$FV = P \times \left[ \frac{(1 + i)^n - 1}{i} \right] \times (1 + i)$$

Where:

- $P$ = Monthly investment amount
    
- $i$ = Periodic monthly interest rate ($\text{Annual Rate} / 12 / 100$)
    
- $n$ = Total number of months ($\text{Years} \times 12$)
    

**2. Goal Required Monthly SIP Formula:**

$$P = \frac{FV}{(1 + i) \times \left[ \frac{(1 + i)^n - 1}{i} \right]}$$

**2.Create the Calculator Component (src/components/Calculators.astro):**

Create this file to render the tab interface, range sliders, numeric outputs, and real-time computation logic:

astro

```
---
// src/components/Calculators.astro
---

<div class="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
  <!-- Tab Controls -->
  <div class="flex border-b border-slate-200 mb-8">
    <button
      id="tab-sip-btn"
      class="pb-3 px-4 text-sm font-semibold border-b-2 border-slate-900 text-slate-900 transition"
    >
      SIP Growth Calculator
    </button>
    <button
      id="tab-goal-btn"
      class="pb-3 px-4 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition"
    >
      Target Goal Planner
    </button>
  </div>

  <!-- 1. SIP Growth Calculator Panel -->
  <div id="panel-sip" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <div class="lg:col-span-7 space-y-6">
      <div>
        <div class="flex justify-between text-sm font-medium text-slate-800 mb-2">
          <span>Monthly Investment</span>
          <span class="font-bold text-slate-900">₹<span id="sip-amount-val">10,000</span></span>
        </div>
        <input
          type="range"
          id="sip-amount"
          min="500"
          max="200000"
          step="500"
          value="10000"
          class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
        />
      </div>

      <div>
        <div class="flex justify-between text-sm font-medium text-slate-800 mb-2">
          <span>Expected Annual Return Rate</span>
          <span class="font-bold text-slate-900"><span id="sip-rate-val">12</span>%</span>
        </div>
        <input
          type="range"
          id="sip-rate"
          min="4"
          max="20"
          step="0.5"
          value="12"
          class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
        />
      </div>

      <div>
        <div class="flex justify-between text-sm font-medium text-slate-800 mb-2">
          <span>Investment Horizon</span>
          <span class="font-bold text-slate-900"><span id="sip-years-val">10</span> Years</span>
        </div>
        <input
          type="range"
          id="sip-years"
          min="1"
          max="30"
          step="1"
          value="10"
          class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
        />
      </div>
    </div>

    <div class="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
      <div class="space-y-4 text-sm">
        <div class="flex justify-between">
          <span class="text-slate-600">Total Invested</span>
          <span class="font-bold text-slate-900">₹<span id="sip-invested">12,00,000</span></span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600">Estimated Returns</span>
          <span class="font-bold text-green-700">+₹<span id="sip-gains">11,23,391</span></span>
        </div>
        <div class="border-t border-slate-200 pt-3 flex justify-between items-baseline">
          <span class="text-slate-900 font-semibold">Total Value</span>
          <span class="text-xl font-extrabold text-slate-900">₹<span id="sip-total">23,23,391</span></span>
        </div>
      </div>
      <a
        href="/schedule"
        class="mt-6 w-full text-center py-2.5 bg-slate-900 text-white font-medium text-xs rounded-lg hover:bg-slate-800 transition"
      >
        Structure Your SIP Plan
      </a>
    </div>
  </div>

  <!-- 2. Goal Planner Panel -->
  <div id="panel-goal" class="grid grid-cols-1 lg:grid-cols-12 gap-8 hidden">
    <div class="lg:col-span-7 space-y-6">
      <div>
        <div class="flex justify-between text-sm font-medium text-slate-800 mb-2">
          <span>Target Wealth Goal</span>
          <span class="font-bold text-slate-900">₹<span id="goal-amount-val">50,00,000</span></span>
        </div>
        <input
          type="range"
          id="goal-amount"
          min="100000"
          max="20000000"
          step="100000"
          value="5000000"
          class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
        />
      </div>

      <div>
        <div class="flex justify-between text-sm font-medium text-slate-800 mb-2">
          <span>Expected Annual Return Rate</span>
          <span class="font-bold text-slate-900"><span id="goal-rate-val">12</span>%</span>
        </div>
        <input
          type="range"
          id="goal-rate"
          min="4"
          max="20"
          step="0.5"
          value="12"
          class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
        />
      </div>

      <div>
        <div class="flex justify-between text-sm font-medium text-slate-800 mb-2">
          <span>Time to Reach Goal</span>
          <span class="font-bold text-slate-900"><span id="goal-years-val">10</span> Years</span>
        </div>
        <input
          type="range"
          id="goal-years"
          min="1"
          max="30"
          step="1"
          value="10"
          class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
        />
      </div>
    </div>

    <div class="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
      <div class="space-y-4 text-sm">
        <div class="flex justify-between">
          <span class="text-slate-600">Target Corpus</span>
          <span class="font-bold text-slate-900">₹<span id="goal-target-out">50,00,000</span></span>
        </div>
        <div class="border-t border-slate-200 pt-3 flex flex-col gap-1">
          <span class="text-slate-600 text-xs">Required Monthly Investment:</span>
          <span class="text-2xl font-black text-slate-900">₹<span id="goal-required-sip">21,521</span></span>
        </div>
      </div>
      <a
        href="/schedule"
        class="mt-6 w-full text-center py-2.5 bg-slate-900 text-white font-medium text-xs rounded-lg hover:bg-slate-800 transition"
      >
        Start This Goal Plan
      </a>
    </div>
  </div>
</div>

<!-- Client-Side TypeScript Logic -->
<script>
  // Tab Switching Logic
  const sipTabBtn = document.getElementById('tab-sip-btn') as HTMLButtonElement;
  const goalTabBtn = document.getElementById('tab-goal-btn') as HTMLButtonElement;
  const sipPanel = document.getElementById('panel-sip') as HTMLDivElement;
  const goalPanel = document.getElementById('panel-goal') as HTMLDivElement;

  sipTabBtn.addEventListener('click', () => {
    sipTabBtn.className = 'pb-3 px-4 text-sm font-semibold border-b-2 border-slate-900 text-slate-900 transition';
    goalTabBtn.className = 'pb-3 px-4 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition';
    sipPanel.classList.remove('hidden');
    goalPanel.classList.add('hidden');
  });

  goalTabBtn.addEventListener('click', () => {
    goalTabBtn.className = 'pb-3 px-4 text-sm font-semibold border-b-2 border-slate-900 text-slate-900 transition';
    sipTabBtn.className = 'pb-3 px-4 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition';
    goalPanel.classList.remove('hidden');
    sipPanel.classList.add('hidden');
  });

  // Currency Formatter
  const formatINR = (val: number): string => Math.round(val).toLocaleString('en-IN');

  // 1. SIP Calculator Inputs & Outputs
  const sipAmountInput = document.getElementById('sip-amount') as HTMLInputElement;
  const sipRateInput = document.getElementById('sip-rate') as HTMLInputElement;
  const sipYearsInput = document.getElementById('sip-years') as HTMLInputElement;

  const sipAmountVal = document.getElementById('sip-amount-val') as HTMLSpanElement;
  const sipRateVal = document.getElementById('sip-rate-val') as HTMLSpanElement;
  const sipYearsVal = document.getElementById('sip-years-val') as HTMLSpanElement;

  const sipInvested = document.getElementById('sip-invested') as HTMLSpanElement;
  const sipGains = document.getElementById('sip-gains') as HTMLSpanElement;
  const sipTotal = document.getElementById('sip-total') as HTMLSpanElement;

  function updateSIP() {
    const p = parseFloat(sipAmountInput.value);
    const annualRate = parseFloat(sipRateInput.value);
    const years = parseFloat(sipYearsInput.value);

    sipAmountVal.textContent = formatINR(p);
    sipRateVal.textContent = annualRate.toString();
    sipYearsVal.textContent = years.toString();

    const i = annualRate / 12 / 100;
    const n = years * 12;

    const totalValue = p * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const invested = p * n;
    const gains = totalValue - invested;

    sipInvested.textContent = formatINR(invested);
    sipGains.textContent = formatINR(gains);
    sipTotal.textContent = formatINR(totalValue);
  }

  [sipAmountInput, sipRateInput, sipYearsInput].forEach((el) => el.addEventListener('input', updateSIP));

  // 2. Goal Calculator Inputs & Outputs
  const goalAmountInput = document.getElementById('goal-amount') as HTMLInputElement;
  const goalRateInput = document.getElementById('goal-rate') as HTMLInputElement;
  const goalYearsInput = document.getElementById('goal-years') as HTMLInputElement;

  const goalAmountVal = document.getElementById('goal-amount-val') as HTMLSpanElement;
  const goalRateVal = document.getElementById('goal-rate-val') as HTMLSpanElement;
  const goalYearsVal = document.getElementById('goal-years-val') as HTMLSpanElement;

  const goalTargetOut = document.getElementById('goal-target-out') as HTMLSpanElement;
  const goalRequiredSip = document.getElementById('goal-required-sip') as HTMLSpanElement;

  function updateGoal() {
    const target = parseFloat(goalAmountInput.value);
    const annualRate = parseFloat(goalRateInput.value);
    const years = parseFloat(goalYearsInput.value);

    goalAmountVal.textContent = formatINR(target);
    goalRateVal.textContent = annualRate.toString();
    goalYearsVal.textContent = years.toString();
    goalTargetOut.textContent = formatINR(target);

    const i = annualRate / 12 / 100;
    const n = years * 12;

    const monthlyRequired = target / (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    goalRequiredSip.textContent = formatINR(monthlyRequired);
  }

  [goalAmountInput, goalRateInput, goalYearsInput].forEach((el) => el.addEventListener('input', updateGoal));
</script>
```

**3.Mount on the Solutions or Homepage:**

You can import and render `<Calculators/>` anywhere across your site:

astro

```
---
// src/pages/solutions.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Calculators from '../components/Calculators.astro';
---

<BaseLayout title="Investment Solutions & Calculators | Abhijit Sinha" description="Mutual fund allocation solutions and compounding calculators.">
  <section class="py-12">
    <div class="text-center max-w-2xl mx-auto mb-10">
      <h2 class="text-3xl font-bold text-slate-900 mb-3">Plan Your Compounding Journey</h2>
      <p class="text-sm text-slate-600">
        Estimate the future value of your Systematic Investment Plans (SIP) or calculate the monthly savings required to hit a specific financial milestone.
      </p>
    </div>

    <Calculators />
  </section>
</BaseLayout>
```