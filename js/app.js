// js/app.js - VoyageFlow behavior (view switching, validation, price calc, modals)

// ---------- Helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const currency = n => '₹' + Number(n).toLocaleString('en-IN');

// ---------- View switching ----------
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // focus first heading for accessibility
    const heading = el.querySelector('h1, h2');
    if (heading) heading.focus?.();
  }
}

// ---------- Registration validation ----------
const regForm = $('#regForm');
const regModal = $('#regModal');

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

if (regForm) {
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // clear errors
    ['nameErr','emailErr','phoneErr','pinErr'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });

    const name = $('#name')?.value.trim() || '';
    const email = $('#email')?.value.trim() || '';
    const phone = $('#phone')?.value.trim() || '';
    const pin = $('#pincode')?.value.trim() || '';

    let ok = true;
    if (name.length < 2) { $('#nameErr').textContent = 'Please enter your name (min 2 chars)'; ok = false; }
    if (!validEmail(email)) { $('#emailErr').textContent = 'Enter a valid email'; ok = false; }
    if (!/^\d{10}$/.test(phone)) { $('#phoneErr').textContent = 'Phone must be exactly 10 digits'; ok = false; }
    if (!/^\d{6}$/.test(pin)) { $('#pinErr').textContent = 'PIN must be exactly 6 digits'; ok = false; }

    if (!ok) return;

    // Show custom modal and then navigate to blog
    regModal.classList.remove('hidden');
    regModal.classList.add('show');

    // Save to sessionStorage (optional)
    try { sessionStorage.setItem('vf_name', name); } catch (e) {}

    setTimeout(() => {
      regModal.classList.add('hidden');
      regModal.classList.remove('show');
      showView('page-blog');
    }, 1100);
  });
}

// clear form
$('#clearReg')?.addEventListener('click', () => regForm.reset());

// ---------- Blog nav smooth scroll ----------
$$('.navlink').forEach(a => {
  a.addEventListener('click', (ev) => {
    ev.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// proceed to calculator
$('#toCalcBtn')?.addEventListener('click', () => showView('page-calc'));

// ---------- Price calculator ----------
let optInputs = $$('.opt');
const totalPriceEl = $('#totalPrice');
const selectedListEl = $('#selectedList');
const modalTotal = $('#modalTotal');
const finalTotal = $('#finalTotal');

function animateNumber(el, newValue) {
  // el: DOM element, newValue: number
  const startValue = Number((el && el.dataset && el.dataset.value) || 0);
  const endValue = Number(newValue);
  const duration = 500;
  const startTime = performance.now();

  function draw(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = Math.round(startValue + (endValue - startValue) * eased);
    if (el) el.textContent = '₹' + current.toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(draw);
    else {
      if (el) {
        el.dataset.value = String(endValue);
        // pop animation
        el.classList.remove('total-pop');
        void el.offsetWidth;
        el.classList.add('total-pop');
      }
    }
  }
  requestAnimationFrame(draw);
}

function updateCalc() {
  // refresh optInputs in case DOM changed
  optInputs = $$('.opt');
  let total = 0;
  const selected = [];
  optInputs.forEach(inp => {
    if (inp.checked) {
      const price = Number(inp.dataset.price || 0);
      total += price;
      const label = inp.closest('label');
      let text = '';
      if (label) {
        // if span immediately follows input
        const sp = label.querySelector('span');
        text = sp ? sp.textContent.trim() : label.textContent.trim();
        text = text.replace(/\d|,|₹/g,'').trim();
      }
      selected.push(text || 'Option');
    }
  });

  // animate total (uses the wrapper function)
  if (totalPriceEl) animateNumber(totalPriceEl, total);

  modalTotal && (modalTotal.textContent = currency(total));
  finalTotal && (finalTotal.textContent = currency(total));

  if (selectedListEl) {
    if (selected.length) {
      selectedListEl.innerHTML = '<ul class="list-disc pl-5 space-y-1">' + selected.map(s => `<li>${s}</li>`).join('') + '</ul>';
    } else {
      selectedListEl.innerHTML = '<div class="text-slate-400">No options selected yet.</div>';
    }
  }

  // persist small state
  try { sessionStorage.setItem('vf_total', String(total)); } catch(e){}
}

// wire checkboxes (safe attach)
function wireOpts() {
  optInputs = $$('.opt');
  optInputs.forEach(i => {
    i.removeEventListener('change', updateCalc);
    i.addEventListener('change', updateCalc);
  });
}
wireOpts();
updateCalc(); // initial

// confirm modal
const confirmModal = $('#confirmModal');
$('#confirmBtn')?.addEventListener('click', () => {
  confirmModal.classList.remove('hidden');
  confirmModal.classList.add('show');
});

// continue to thanks
$('#toThanks')?.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  confirmModal.classList.remove('show');
  // ensure final total is taken from session or current display
  const stored = sessionStorage.getItem('vf_total');
  if (stored && finalTotal) finalTotal.textContent = currency(Number(stored));
  showView('page-thanks');
});

// back to blog
$('#backToBlog')?.addEventListener('click', () => showView('page-blog'));

// restart
$('#restartBtn')?.addEventListener('click', () => {
  regForm.reset();
  // uncheck all options
  $$('.opt').forEach(i => i.checked = false);
  updateCalc();
  try { sessionStorage.removeItem('vf_name'); sessionStorage.removeItem('vf_total'); } catch(e){}
  showView('page-register');
});

// placeholder repo link handler removed (we removed repo button)

// accessibility: close modals on Escape
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(m => {
      if (!m.classList.contains('hidden')) {
        m.classList.add('hidden');
        m.classList.remove('show');
      }
    });
  }
});
