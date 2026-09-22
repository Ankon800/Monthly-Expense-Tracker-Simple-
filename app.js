const $ = s => document.querySelector(s);
const key = 'flowfunds-data-v1';
let data = JSON.parse(localStorage.getItem(key) || '{"expenses":[],"balances":{}}');
let activeMonth = new Date().toISOString().slice(0, 7);
const money = value => '৳' + Number(value || 0).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
const monthName = value => new Date(value + '-01T12:00:00').toLocaleDateString('en-US', {month:'long',year:'numeric'});
const dateName = value => new Date(value + 'T12:00:00').toLocaleDateString('en-US', {day:'numeric',month:'short',year:'numeric'});
const clean = value => { const node=document.createElement('span'); node.textContent=value; return node.innerHTML; };
const save = () => localStorage.setItem(key, JSON.stringify(data));
const entries = () => data.expenses.filter(e => e.date.slice(0,7) === activeMonth).sort((a,b) => b.date.localeCompare(a.date));
const empty = text => `<div class="empty-state">◌<br>${text}</div>`;
const icon = cat => cat === 'Food' ? '♨' : '◈';
const entryItem = e => `<div class="recent-item"><span class="expense-icon ${e.category.toLowerCase()}">${icon(e.category)}</span><div class="item-copy"><strong>${clean(e.description)}</strong><span>${e.category} · ${dateName(e.date)}</span></div><span class="item-amount">−${money(e.amount)}</span></div>`;

function renderDashboard(){
  const list=entries(), total=list.reduce((n,e)=>n+Number(e.amount),0), balance=Number(data.balances[activeMonth]||0);
  const food=list.filter(e=>e.category==='Food').reduce((n,e)=>n+Number(e.amount),0);
  const expenses=list.filter(e=>e.category==='Expenses').reduce((n,e)=>n+Number(e.amount),0);
  const days=new Set(list.map(e=>e.date)).size, left=balance-total, high=Math.max(food,expenses,1);
  $('#month-title').textContent=monthName(activeMonth);
  $('#starting-balance').textContent=money(balance);
  $('#money-left').textContent=money(left);
  $('#left-context').textContent=balance ? Math.max(0,Math.round(left/balance*100))+'% of your starting money remains' : 'Set a starting balance to begin';
  $('#balance-meter').style.width=balance ? Math.min(100,Math.max(0,left/balance*100))+'%' : '0%';
  $('#total-expenses').textContent=money(total);
  $('#expense-count').textContent=list.length ? list.length+' expense'+(list.length===1?'':'s')+' this month' : 'No expenses this month';
  $('#daily-average').textContent=money(days ? total/days : 0);
  $('#category-chart').innerHTML=`<div class="bar food" style="height:${food?Math.max(7,food/high*100):3}%"><span class="bar-value">${money(food)}</span></div><div class="bar expenses" style="height:${expenses?Math.max(7,expenses/high*100):3}%"><span class="bar-value">${money(expenses)}</span></div>`;
  $('#category-legend').innerHTML=`<span><i style="background:var(--orange)"></i> Food · ${money(food)}</span><span><i style="background:var(--rose)"></i> Expenses · ${money(expenses)}</span>`;
  $('#recent-list').innerHTML=list.slice(0,4).map(entryItem).join('') || empty('Add your first expense to see it here.');
}
function renderExpenses(){
  const list=entries(); $('#month-filter').value=activeMonth;
  $('#expense-table').innerHTML=list.length ? `<div class="table-head"><span>Description</span><span>Category</span><span>Date</span><span>Amount</span><span></span></div>`+list.map(e=>`<div class="expense-row"><div class="table-description"><span class="expense-icon ${e.category.toLowerCase()}">${icon(e.category)}</span><strong>${clean(e.description)}</strong></div><span class="tag ${e.category.toLowerCase()}">${e.category}</span><span class="row-date">${dateName(e.date)}</span><strong>−${money(e.amount)}</strong>${e.invoice ? `<a class="invoice-link" href="${e.invoice.data}" download="${clean(e.invoice.name)}" title="Download invoice">↓</a>` : '<span></span>'}<button class="delete-button" data-delete="${e.id}" aria-label="Delete">×</button></div>`).join('') : empty('No expenses in '+monthName(activeMonth)+'.');
}
function renderInvoices(){
  const invoices=data.expenses.filter(e=>e.invoice).sort((a,b)=>b.date.localeCompare(a.date));
  $('#invoice-grid').innerHTML=invoices.map(e=>{const image=e.invoice.type.startsWith('image/')&&!/heic|heif/.test(e.invoice.type); return `<article class="invoice-card"><div class="invoice-preview">${image ? `<img src="${e.invoice.data}" alt="${clean(e.invoice.name)}">` : '<b>'+(e.invoice.type==='application/pdf'?'PDF':'FILE')+'</b>'}</div><div class="invoice-card-info"><strong>${clean(e.description)}</strong><span>${dateName(e.date)} · ${money(e.amount)}</span><br><a href="${e.invoice.data}" download="${clean(e.invoice.name)}">Download ${clean(e.invoice.name)}</a></div></article>`;}).join('') || empty('Upload an invoice while adding an expense and it will appear here.');
}
function render(){renderDashboard();renderExpenses();renderInvoices();}
function moveMonth(change){const date=new Date(activeMonth+'-01T12:00:00');date.setMonth(date.getMonth()+change);activeMonth=date.toISOString().slice(0,7);render();}
$('#today-label').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'});
$('#expense-form').date.value=new Date().toISOString().slice(0,10);
$('#add-expense').onclick=()=>$('#expense-dialog').showModal();
$('#close-expense').onclick=$('#cancel-expense').onclick=()=>$('#expense-dialog').close();
$('#previous-month').onclick=()=>moveMonth(-1); $('#next-month').onclick=()=>moveMonth(1);
$('#set-balance').onclick=()=>{ $('#balance-month').textContent=monthName(activeMonth);$('#balance-form').balance.value=data.balances[activeMonth]||'';$('#balance-dialog').showModal(); };
$('#close-balance').onclick=$('#cancel-balance').onclick=()=>$('#balance-dialog').close();
$('#month-filter').onchange=e=>{activeMonth=e.target.value;render();};
document.querySelectorAll('.nav-item').forEach(button=>button.onclick=()=>{document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));button.classList.add('active');document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));$('#'+button.dataset.view+'-view').classList.add('active-view');$('#page-title').textContent=button.dataset.view==='dashboard'?'A clear view of your money.':button.dataset.view==='expenses'?'Your spending, organized.':'Keep every receipt close.';});
$('[data-view-target="expenses"]').onclick=()=>$('.nav-item[data-view="expenses"]').click();
$('#expense-form').invoice.onchange=e=>$('#file-name').textContent=e.target.files[0]?.name||'PDF, JPEG, PNG, or HEIC';
$('#expense-form').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,file=form.invoice.files[0];let invoice=null;if(file)invoice={name:file.name,type:file.type||'application/octet-stream',data:await new Promise((ok,bad)=>{const reader=new FileReader();reader.onload=()=>ok(reader.result);reader.onerror=bad;reader.readAsDataURL(file);})};data.expenses.push({id:crypto.randomUUID(),description:form.description.value.trim(),amount:Number(form.amount.value),category:form.category.value,date:form.date.value,invoice});save();activeMonth=form.date.value.slice(0,7);form.reset();form.date.value=new Date().toISOString().slice(0,10);$('#file-name').textContent='PDF, JPEG, PNG, or HEIC';$('#expense-dialog').close();render();};
$('#balance-form').onsubmit=e=>{e.preventDefault();data.balances[activeMonth]=Number(e.currentTarget.balance.value);save();$('#balance-dialog').close();render();};
$('#expense-table').onclick=e=>{const id=e.target.dataset.delete;if(!id)return;data.expenses=data.expenses.filter(x=>x.id!==id);save();render();};
render();

