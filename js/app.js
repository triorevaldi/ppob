document.addEventListener('DOMContentLoaded',()=>{
const INCOME_KEY='ppob.income.v1',EXPENSE_KEY='ppob.expense.v1',STOCK_KEY='ppob.stock.v1',SUBSCRIPTION_KEY='ppob.subscriptions.v1',RECIPE_KEY='ppob.recipes.v1';
let incomeData=JSON.parse(localStorage.getItem(INCOME_KEY)||'[]'),expenseData=JSON.parse(localStorage.getItem(EXPENSE_KEY)||'[]'),stockData=JSON.parse(localStorage.getItem(STOCK_KEY)||'[]'),subscriptionData=JSON.parse(localStorage.getItem(SUBSCRIPTION_KEY)||'[]'),customRecipes=JSON.parse(localStorage.getItem(RECIPE_KEY)||'[]'),incomeEditing=null,expenseEditing=null,stockEditing=null,subscriptionEditing=null,incomeSortDesc=true,expenseSortDesc=true,$=x=>document.getElementById(x),fmt=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n),today=()=>{let d=new Date();return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()},monthKey=()=>{let d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')},dateISO=s=>{const v=String(s||'').trim();const parts=v.split(v.includes('/')?'/':'-');if(parts.length!==3)return '';let y,m,d;if(v.includes('/')){d=parts[0];m=parts[1];y=parts[2]}else if(parts[0].length===4){y=parts[0];m=parts[1];d=parts[2]}else{d=parts[0];m=parts[1];y=parts[2]}return String(y)+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0')},dateInput=s=>{let iso=dateISO(s);if(!iso)return String(s||'');let p=iso.split('-');return p[2]+'/'+p[1]+'/'+p[0]},dateDisplay=s=>{let iso=dateISO(s);if(!iso)return String(s||'');let p=iso.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})},recordMonth=r=>dateISO(r.date).slice(0,7),chartFmt=n=>{let a=Math.abs(Number(n)),s=a>=1e9?'b':a>=1e6?'m':a>=1e3?'k':'',v=s?(a/(s==='b'?1e9:s==='m'?1e6:1e3)):a;return (Number.isInteger(v)?v:v.toFixed(1).replace(/\\.0$/,''))+s};
$('date').value=today();$('expenseDate').value=today();$('stockDate').value=today();$('subscriptionDate').value=today();$('month').value=monthKey();

function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function dateValue(s){let iso=dateISO(s);return iso?new Date(iso+'T00:00:00').getTime():0}
function sortedRecords(data,desc){return [...data].sort((a,b)=>{let d=dateValue(b.date)-dateValue(a.date);return d||((data.indexOf(b)-data.indexOf(a))*(desc?1:-1))})}
function renderDashboard(){
  let m=$('month').value||monthKey(),inc=incomeData.filter(r=>recordMonth(r)===m),exp=expenseData.filter(r=>recordMonth(r)===m),
      it=inc.reduce((a,r)=>a+Number(r.amount),0),et=exp.reduce((a,r)=>a+Number(r.amount),0);
  $('monthlyIncome').textContent=fmt(it);$('monthlyExpense').textContent=fmt(et);$('monthlyNet').textContent=fmt(it-et);
  renderFinancialChart(m);
}
function renderFinancialChart(endMonth){
  let [y,mo]=endMonth.split('-').map(Number),months=[];
  for(let i=11;i>=0;i--){let d=new Date(y,mo-1-i,1),key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');months.push({key,label:d.toLocaleDateString('en-US',{month:'short'})})}
  let data=months.map(m=>({label:m.label,income:incomeData.filter(r=>recordMonth(r)===m.key).reduce((a,r)=>a+Number(r.amount),0),expense:expenseData.filter(r=>recordMonth(r)===m.key).reduce((a,r)=>a+Number(r.amount),0)}));
  let canvas=$('financialChart'),ctx=canvas.getContext('2d'),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1,w=Math.max(320,rect.width),h=Math.max(240,rect.height);
  canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  let p={l:64,r:18,t:20,b:42},cw=w-p.l-p.r,ch=h-p.t-p.b,max=Math.max(1,...data.flatMap(x=>[x.income,x.expense])),ticks=4;
  ctx.font='12px system-ui,sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
  for(let i=0;i<=ticks;i++){let v=max*i/ticks,yy=p.t+ch-(ch*i/ticks);ctx.strokeStyle='#e4e7ec';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,yy);ctx.lineTo(w-p.r,yy);ctx.stroke();ctx.fillStyle='#667085';ctx.fillText('Rp '+chartFmt(v),p.l-8,yy)}
  ctx.textAlign='center';ctx.textBaseline='top';let xStep=(w-p.l-p.r)/(data.length-1);
  data.forEach((d,i)=>{ctx.fillStyle='#667085';ctx.fillText(d.label,p.l+i*xStep,h-p.b+12)});
  const draw=(key)=>{ctx.strokeStyle=key==='income'?'#2563eb':'#dc2626';ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();data.forEach((d,i)=>{let x=p.l+i*xStep,yy=p.t+ch-(d[key]/max)*ch;i?ctx.lineTo(x,yy):ctx.moveTo(x,yy)});ctx.stroke();data.forEach((d,i)=>{let x=p.l+i*xStep,yy=p.t+ch-(d[key]/max)*ch;ctx.fillStyle='#fff';ctx.strokeStyle=key==='income'?'#2563eb':'#dc2626';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,yy,4,0,Math.PI*2);ctx.fill();ctx.stroke()})};
  draw('income');draw('expense');
  ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle='#2563eb';ctx.fillRect(p.l,4,12,3);ctx.fillStyle='#182230';ctx.fillText('Income',p.l+18,0);ctx.fillStyle='#dc2626';ctx.fillRect(p.l+90,4,12,3);ctx.fillStyle='#182230';ctx.fillText('Expenses',p.l+108,0);
}

const BUILTIN_RECIPES={
  'print':sale=>[ {stockItem:'Print paper',qty:1} ],
  'photo print':sale=>[ {stockItem:'Photo paper',qty:Number(sale.photoSheetsPerUnit)} ],
  'jilid':sale=>[ {stockItem:'Thick Paper',qty:1},{stockItem:'Colorful Plastic',qty:1},{stockItem:'Lakban 3.5cm',qty:40} ],
  'laminating':sale=>[ {stockItem:'Laminating Film',qty:1} ],
  'print & laminating':sale=>[ {stockItem:'Print paper',qty:1},{stockItem:'Laminating Film',qty:1} ]
};
function norm(s){return String(s||'').trim().toLowerCase()}
function findStockItem(name){return stockData.find(x=>norm(x.item)===norm(name))}
function getSaleRecipe(sale){
  const key=norm(sale.item);
  if(BUILTIN_RECIPES[key])return BUILTIN_RECIPES[key](sale);
  return customRecipes.filter(r=>norm(r.product)===key).map(r=>({stockItem:r.stockItem,qty:Number(r.qtyPerUnit)}));
}
function restoreSaleStock(sale){
  if(!Array.isArray(sale.stockDeductions))return;
  sale.stockDeductions.forEach(m=>{
    const item=stockData.find(s=>s.id===m.stockId)||findStockItem(m.stockItem);
    if(item)item.stock=Number(item.stock??item.currentStock??0)+Number(m.qty||0);
  });
}
function deductForSale(sale){
  const recipe=getSaleRecipe(sale);
  if(!recipe.length)return [];
  const totals=new Map();
  recipe.forEach(part=>{
    const item=findStockItem(part.stockItem);
    if(!item)throw new Error('Stock item "'+part.stockItem+'" was not found. Add it in Stock Manager first.');
    const qty=Number(part.qty)*Number(sale.qty);
    if(!Number.isFinite(qty)||qty<0)throw new Error('Invalid stock consumption for '+sale.item+'.');
    const prior=totals.get(item.id)||{item,qty:0};prior.qty+=qty;totals.set(item.id,prior);
  });
  for(const {item,qty} of totals.values()){
    const current=Number(item.stock??item.currentStock??0);
    if(current<qty)throw new Error('Not enough '+item.item+'. Available: '+current+', required: '+qty+'. Sale was not saved.');
  }
  const movements=[];
  for(const {item,qty} of totals.values()){
    item.stock=Number(item.stock??item.currentStock??0)-qty;
    movements.push({stockId:item.id,stockItem:item.item,qty});
  }
  return movements;
}
function persistStock(){localStorage.setItem(STOCK_KEY,JSON.stringify(stockData));renderStock()}
function updateItemControls(){
  const sel=$('item'),old=sel.value,customNames=[...new Set(customRecipes.map(r=>r.product).filter(Boolean))];
  const base=[['Print','Print'],['Photo print','Photo print'],['Jilid','Jilid'],['Laminating','Laminating'],['Print & Laminating','Print & Laminating']];
  sel.innerHTML=base.map(([v,t])=>'<option value="'+esc(v)+'">'+esc(t)+'</option>').join('')+customNames.filter(n=>!base.some(x=>norm(x[0])===norm(n))).map(n=>'<option value="'+esc(n)+'">'+esc(n)+' (custom recipe)</option>').join('')+'<option value="__other__">Other (no stock deduction unless a recipe exists)</option>';
  if([...sel.options].some(o=>o.value===old))sel.value=old;
  $('customItemWrap').hidden=sel.value!=='__other__';
  $('photoUsageWrap').hidden=norm(sel.value)!=='photo print';
  renderRecipeManager();
}
function selectedSaleItem(){return $('item').value==='__other__' ? $('customItem').value.trim() : $('item').value}
function renderRecipeManager(){
  const stockSelect=$('recipeStockItem');
  if(!stockSelect)return;
  const selected=stockSelect.value;
  stockSelect.innerHTML=stockData.map(s=>'<option value="'+esc(s.item)+'">'+esc(s.item)+'</option>').join('');
  if([...stockSelect.options].some(o=>o.value===selected))stockSelect.value=selected;
  const body=$('recipeTable');
  body.innerHTML=customRecipes.length?'<table><tr><th>Product/service</th><th>Stock item</th><th>Consumption per sale unit</th><th>Action</th></tr>'+customRecipes.map(r=>'<tr><td>'+esc(r.product)+'</td><td>'+esc(r.stockItem)+'</td><td>'+Number(r.qtyPerUnit)+'</td><td><button type="button" onclick="deleteRecipe(\''+r.id+'\')">Delete</button></td></tr>').join('')+'</table>':'<p class="muted">No custom recipes yet. Items without a recipe only record income.</p>';
}

function renderIncome(){let total=incomeData.reduce((a,r)=>a+Number(r.amount),0);$('incomeSummary').innerHTML='<span><span class="summary-label">Total income</span> <strong>'+fmt(total)+'</strong></span><span><span class="summary-label">Transactions</span> <strong>'+incomeData.length+'</strong></span>';if(!incomeData.length){$('table').innerHTML='<p class="muted">No income records yet.</p>';return}let todayDate=today(),rows=sortedRecords(incomeData,incomeSortDesc);$('incomeSort').textContent='Sort: '+(incomeSortDesc?'Latest first':'Oldest first');$('table').innerHTML='<table><tr><th>Date</th><th>Item name</th><th>Qty</th><th class="money">Income amount</th><th>Note</th><th style="width: 140px">Action</th></tr>'+rows.map(r=>'<tr class="income-today'+(dateISO(r.date)===dateISO(todayDate)?' highlight':'')+'"><td>'+dateDisplay(r.date)+'</td><td>'+esc(r.item)+'</td><td>'+r.qty+'</td><td class="money">'+fmt(r.amount)+'</td><td>'+esc(r.note)+'</td><td style="width: 140px"><button onclick="editIncome(\''+r.id+'\')">Edit</button><button onclick="delIncome(\''+r.id+'\')">Delete</button></td></tr>').join('')+'</table>'}
function renderExpenses(){let total=expenseData.reduce((a,r)=>a+Number(r.amount),0);$('expenseSummary').innerHTML='<span><span class="summary-label">Total expenses</span> <strong>'+fmt(total)+'</strong></span><span><span class="summary-label">Transactions</span> <strong>'+expenseData.length+'</strong></span>';if(!expenseData.length){$('expenseTable').innerHTML='<p class="muted">No expense records yet.</p>';return}let todayDate=today(),rows=sortedRecords(expenseData,expenseSortDesc);$('expenseSort').textContent='Sort: '+(expenseSortDesc?'Latest first':'Oldest first');$('expenseTable').innerHTML='<table><tr><th>Date</th><th>Expense name</th><th>Qty</th><th class="money">Expense amount</th><th>Note</th><th style="width: 140px">Action</th></tr>'+rows.map(r=>'<tr class="expense-today'+(dateISO(r.date)===todayDate?' highlight':'')+'"><td>'+dateDisplay(r.date)+'</td><td>'+esc(r.item)+'</td><td>'+ (r.qty || 1) +'</td><td class="money">'+fmt(r.amount)+'</td><td>'+esc(r.note)+'</td><td><button onclick="editExpense(\''+r.id+'\')">Edit</button><button onclick="delExpense(\''+r.id+'\')">Delete</button></td></tr>').join('')+'</table>'}

$('incomeSort').onclick=()=>{incomeSortDesc=!incomeSortDesc;renderIncome()};
$('expenseSort').onclick=()=>{expenseSortDesc=!expenseSortDesc;renderExpenses()};
$('incomeForm').onsubmit=e=>{
  e.preventDefault();
  const item=selectedSaleItem();
  if(!item){alert('Enter a product or service name.');return}
  const photoSheetsPerUnit=norm(item)==='photo print'?Number($('photoSheetsPerUnit').value):undefined;
  if(norm(item)==='photo print'&&(!Number.isFinite(photoSheetsPerUnit)||photoSheetsPerUnit<=0)){alert('Enter a photo-paper fraction greater than zero.');return}
  const r={item,qty:+$('qty').value,amount:+$('amount').value,date:$('date').value,note:$('note').value.trim()};
  if(photoSheetsPerUnit!==undefined)r.photoSheetsPerUnit=photoSheetsPerUnit;
  let existing=null,legacyEdit=false;
  if(incomeEditing){existing=incomeData.find(x=>x.id===incomeEditing);legacyEdit=!!existing&&!Array.isArray(existing.stockDeductions)}
  const stockSnapshot=JSON.stringify(stockData);
  if(existing&&!legacyEdit)restoreSaleStock(existing);
  try{
    if(!legacyEdit)r.stockDeductions=deductForSale(r);
  }catch(err){
    stockData=JSON.parse(stockSnapshot);
    alert(err.message||'Could not update stock. Sale was not saved.');
    return;
  }
  if(incomeEditing){
    const i=incomeData.findIndex(x=>x.id===incomeEditing);
    incomeData[i]={...existing,...r};
    incomeEditing=null;e.target.querySelector('button').textContent='Add income';
  }else incomeData.push({id:crypto.randomUUID(),...r});
  localStorage.setItem(INCOME_KEY,JSON.stringify(incomeData));
  localStorage.setItem(STOCK_KEY,JSON.stringify(stockData));
  e.target.reset();$('qty').value=1;$('date').value=today();$('photoSheetsPerUnit').value='0.5';
  updateItemControls();renderIncome();renderDashboard();renderStock();
};
window.editIncome=id=>{
  const r=incomeData.find(x=>x.id===id);if(!r)return;
  incomeEditing=id;
  const standard=['Print','Photo print','Jilid','Laminating','Print & Laminating'];
  const known=standard.find(n=>norm(n)===norm(r.item))||customRecipes.find(n=>norm(n.product)===norm(r.item))?.product;
  $('item').value=known||'__other__';
  $('customItem').value=known?'':r.item;
  $('customItemWrap').hidden=!!known;
  $('photoUsageWrap').hidden=norm(r.item)!=='photo print';
  $('photoSheetsPerUnit').value=r.photoSheetsPerUnit??0.5;
  $('qty').value=r.qty;$('amount').value=r.amount;$('date').value=dateInput(r.date);$('note').value=r.note||'';
  $('incomeForm').querySelector('button').textContent='Save changes';
};
window.delIncome=id=>{
  const r=incomeData.find(x=>x.id===id);if(!r)return;
  if(confirm('Delete this income record?')){
    if(Array.isArray(r.stockDeductions)){restoreSaleStock(r);localStorage.setItem(STOCK_KEY,JSON.stringify(stockData));}
    incomeData=incomeData.filter(x=>x.id!==id);localStorage.setItem(INCOME_KEY,JSON.stringify(incomeData));
    renderIncome();renderDashboard();renderStock();
  }
};
$('item').onchange=()=>{if($('item').value==='__other__'){$('customItemWrap').hidden=false;$('customItem').focus()}else{$('customItemWrap').hidden=true;$('customItem').value=''}$('photoUsageWrap').hidden=norm($('item').value)!=='photo print'};
$('recipeForm').onsubmit=e=>{
  e.preventDefault();
  const product=$('recipeProduct').value.trim(),stockItem=$('recipeStockItem').value,qtyPerUnit=Number($('recipeQtyPerUnit').value);
  if(!product||!stockItem||!Number.isFinite(qtyPerUnit)||qtyPerUnit<=0){alert('Enter a product, stock item, and consumption greater than zero.');return}
  if(Object.prototype.hasOwnProperty.call(BUILTIN_RECIPES,norm(product))){alert('This product already has a built-in recipe.');return}
  customRecipes.push({id:crypto.randomUUID(),product,stockItem,qtyPerUnit});
  localStorage.setItem(RECIPE_KEY,JSON.stringify(customRecipes));
  e.target.reset();$('recipeQtyPerUnit').value=1;updateItemControls();
};
window.deleteRecipe=id=>{
  if(!confirm('Delete this recipe component? Existing sales deductions will not change.'))return;
  customRecipes=customRecipes.filter(r=>r.id!==id);localStorage.setItem(RECIPE_KEY,JSON.stringify(customRecipes));updateItemControls();
};


$('expenseForm').onsubmit=e=>{e.preventDefault();let r={item:$('expenseItem').value.trim(),qty:+$('expenseQty').value,amount:+$('expenseAmount').value,date:$('expenseDate').value,note:$('expenseNote').value.trim()};if(expenseEditing){let i=expenseData.findIndex(x=>x.id===expenseEditing);expenseData[i]={...expenseData[i],...r};expenseEditing=null;e.target.querySelector('button').textContent='Add expense'}else expenseData.push({id:crypto.randomUUID(),...r});localStorage.setItem(EXPENSE_KEY,JSON.stringify(expenseData));e.target.reset();$('expenseQty').value=1;$('expenseDate').value=today();renderExpenses();renderDashboard()};
window.editExpense=id=>{let r=expenseData.find(x=>x.id===id);expenseEditing=id;$('expenseItem').value=r.item;$('expenseQty').value=r.qty||1;$('expenseAmount').value=r.amount;$('expenseDate').value=dateInput(r.date);$('expenseNote').value=r.note;$('expenseForm').querySelector('button').textContent='Save changes'};
window.delExpense=id=>{if(confirm('Delete this expense record?')){expenseData=expenseData.filter(x=>x.id!==id);localStorage.setItem(EXPENSE_KEY,JSON.stringify(expenseData));renderExpenses();renderDashboard()}};


function renderSubscriptions(){
  const rows=[...subscriptionData].sort((a,b)=>dateValue(b.date)-dateValue(a.date)).map(r=>{
    const bill=Number(r.bill)||0,paid=Number(r.paid)||0,balance=bill-paid;
    return `<tr><td>${dateDisplay(r.date)}</td><td>${esc(r.customer)}</td><td>${esc(r.type)}</td><td class="money">${fmt(bill)}</td><td class="money">${fmt(paid)}</td><td class="money">${fmt(balance)}</td><td>${esc(r.note)}</td><td><button onclick="editSubscription('${r.id}')">Edit</button><button onclick="delSubscription('${r.id}')">Delete</button></td></tr>`;
  }).join('');
  $('subscriptionTable').innerHTML=subscriptionData.length?'<table><tr><th>Date</th><th>Customer Name</th><th>Type</th><th class="money">Bill</th><th class="money">Paid</th><th class="money">Remaining</th><th>Note</th><th>Action</th></tr>'+rows+'</table>':'<p class="muted">No subscription bills yet.</p>';
}
$('subscriptionForm').onsubmit=e=>{
  e.preventDefault();
  const r={date:$('subscriptionDate').value,customer:$('subscriptionCustomer').value.trim(),type:$('subscriptionType').value,bill:+$('subscriptionBill').value,paid:+$('subscriptionPaid').value,note:$('subscriptionNote').value.trim()};
  if(subscriptionEditing){const i=subscriptionData.findIndex(x=>x.id===subscriptionEditing);subscriptionData[i]={...subscriptionData[i],...r};subscriptionEditing=null;e.target.querySelector('button').textContent='Add bill'}
  else subscriptionData.push({id:crypto.randomUUID(),...r});
  localStorage.setItem(SUBSCRIPTION_KEY,JSON.stringify(subscriptionData));e.target.reset();$('subscriptionDate').value=today();$('subscriptionPaid').value=0;renderSubscriptions();
};
window.editSubscription=id=>{const r=subscriptionData.find(x=>x.id===id);if(!r)return;subscriptionEditing=id;$('subscriptionDate').value=dateInput(r.date);$('subscriptionCustomer').value=r.customer;$('subscriptionType').value=r.type;$('subscriptionBill').value=r.bill;$('subscriptionPaid').value=r.paid;$('subscriptionNote').value=r.note||'';$('subscriptionForm').querySelector('button').textContent='Save changes'};
window.delSubscription=id=>{if(confirm('Delete this subscription bill?')){subscriptionData=subscriptionData.filter(x=>x.id!==id);localStorage.setItem(SUBSCRIPTION_KEY,JSON.stringify(subscriptionData));renderSubscriptions()}};

function renderStock(){
  if(!stockData.length){$('stockTable').innerHTML='<p class="muted">No stock records yet.</p>';return}
  let rows=stockData.map(r=>{
    let qty=Number(r.qty)||0,stock=Number(r.stock??r.currentStock??0),cost=Number(r.amount)||0;
    let stockPct=qty>0?(stock/qty*100):0,costPerUnit=qty>0?cost/qty:0;
    return {r,qty,stock,cost,stockPct,costPerUnit};
  }).sort((a,b)=>a.stockPct-b.stockPct).map(({r,qty,stock,cost,stockPct,costPerUnit})=>{
    let lowStock=stockPct<10?' low-stock':'';
    return `<tr class="${lowStock.trim()}"><td>${dateDisplay(r.date)}</td><td>${esc(r.item)}</td><td>${qty}</td><td class="money">${fmt(cost)}</td><td>${stock.toLocaleString('id-ID')}</td><td>${Math.floor(stockPct)}%</td><td class="money">${fmt(costPerUnit)}</td><td><button onclick="editStock('${r.id}')">Edit</button><button onclick="delStock('${r.id}')">Delete</button></td></tr>`
  }).join('');
  $('stockTable').innerHTML='<table><tr><th>Date</th><th>Item name</th><th>Qty</th><th class="money">Cost</th><th>Stock</th><th>Stock %</th><th class="money">Cost per unit</th><th>Action</th></tr>'+rows+'</table>'
}

$('stockForm').onsubmit=e=>{
  e.preventDefault();
  let r={date:$('stockDate').value,item:$('stockItem').value.trim(),qty:+$('stockQty').value,amount:+$('stockAmount').value,stock:+$('stockStock').value};
  if(stockEditing){
    let i=stockData.findIndex(x=>x.id===stockEditing);
    stockData[i]={...stockData[i],...r};
    stockEditing=null;
    e.target.querySelector('button').textContent='Add stock'
  }else stockData.push({id:crypto.randomUUID(),...r});
  localStorage.setItem(STOCK_KEY,JSON.stringify(stockData));
    localStorage.setItem(SUBSCRIPTION_KEY,JSON.stringify(subscriptionData));
  e.target.reset();
  $('stockDate').value=today();
  $('stockQty').value=1;
  renderStock()
};
window.editStock=id=>{
  let r=stockData.find(x=>x.id===id);
  stockEditing=id;
  $('stockDate').value=dateInput(r.date)||today();
  $('stockItem').value=r.item;
  $('stockQty').value=r.qty||1;
  $('stockAmount').value=r.amount||0;
  $('stockStock').value=r.stock??r.currentStock??'';
  $('stockForm').querySelector('button').textContent='Save changes'
};
window.delStock=id=>{
  if(confirm('Delete this stock record?')){
    stockData=stockData.filter(x=>x.id!==id);
    localStorage.setItem(STOCK_KEY,JSON.stringify(stockData));
    renderStock()
  }
};
function show(p){$('dashboard').hidden=p!=='dashboard';$('income').hidden=p!=='income';$('expenses').hidden=p!=='expenses';$('subscriptions').hidden=p!=='subscriptions';$('stock').hidden=p!=='stock';$('bd').classList.toggle('active',p==='dashboard');$('bi').classList.toggle('active',p==='income');$('be').classList.toggle('active',p==='expenses');$('bsub').classList.toggle('active',p==='subscriptions');$('bs').classList.toggle('active',p==='stock');if(p==='income')$('date').value=today();if(p==='expenses')$('expenseDate').value=today();if(p==='stock')$('stockDate').value=today();if(p==='subscriptions')$('subscriptionDate').value=today();if(p==='dashboard')renderDashboard()}

$('exportData').onclick=()=>{
  const backup={app:'PPOB',formatVersion:1,exportedAt:new Date().toISOString(),income:incomeData,expenses:expenseData,stock:stockData,subscriptions:subscriptionData,recipes:customRecipes};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='ppob-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  $('backupStatus').textContent='Backup exported. Keep the JSON file somewhere safe.';
};
$('importFile').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());
    if(!parsed||parsed.app!=='PPOB'||parsed.formatVersion!==1||!Array.isArray(parsed.income)||!Array.isArray(parsed.expenses)||!Array.isArray(parsed.stock)||(parsed.subscriptions!==undefined&&!Array.isArray(parsed.subscriptions))||(parsed.recipes!==undefined&&!Array.isArray(parsed.recipes)))throw new Error('This file is not a supported PPOB backup.');
    if(!confirm('Import this backup and replace all current income, expense, and stock records? This cannot be undone.')){e.target.value='';return}
    incomeData=parsed.income;expenseData=parsed.expenses;stockData=parsed.stock;subscriptionData=parsed.subscriptions||[];customRecipes=parsed.recipes||[];
    localStorage.setItem(INCOME_KEY,JSON.stringify(incomeData));
    localStorage.setItem(EXPENSE_KEY,JSON.stringify(expenseData));
    localStorage.setItem(STOCK_KEY,JSON.stringify(stockData));
    localStorage.setItem(SUBSCRIPTION_KEY,JSON.stringify(subscriptionData));
    localStorage.setItem(RECIPE_KEY,JSON.stringify(customRecipes));
    incomeEditing=expenseEditing=stockEditing=null;
    $('incomeForm').reset();$('expenseForm').reset();$('stockForm').reset();$('subscriptionForm').reset();
    $('qty').value=$('expenseQty').value=$('stockQty').value=1;
    $('date').value=$('expenseDate').value=$('stockDate').value=$('subscriptionDate').value=today();$('subscriptionPaid').value=0;
    $('incomeForm').querySelector('button').textContent='Add income';
    $('expenseForm').querySelector('button').textContent='Add expense';
    $('stockForm').querySelector('button').textContent='Add stock';
    $('subscriptionForm').querySelector('button').textContent='Add bill';
    renderIncome();renderExpenses();renderStock();renderSubscriptions();renderDashboard();
    $('backupStatus').textContent='Backup imported successfully.';
  }catch(err){$('backupStatus').textContent=err.message||'Could not read this backup file.'}
  e.target.value='';
};
$('bd').onclick=()=>show('dashboard');$('bi').onclick=()=>show('income');$('be').onclick=()=>show('expenses');$('bsub').onclick=()=>show('subscriptions');$('bs').onclick=()=>show('stock');$('month').onchange=renderDashboard;
$('toggleSidebar').onclick=()=>{let c=$('sidebar').classList.toggle('collapsed');$('toggleSidebar').textContent=c?'›':'‹';$('toggleSidebar').title=c?'Expand sidebar':'Collapse sidebar';$('toggleSidebar').setAttribute('aria-label',$('toggleSidebar').title)};
updateItemControls();updateItemControls();renderIncome();renderExpenses();renderStock();renderSubscriptions();renderDashboard();window.addEventListener('resize',()=>{if(!$('dashboard').hidden)renderFinancialChart($('month').value||monthKey())});
});

