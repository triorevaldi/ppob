document.addEventListener('DOMContentLoaded',()=>{
const INCOME_KEY='ppob.income.v1',EXPENSE_KEY='ppob.expense.v1',STOCK_KEY='ppob.stock.v1',SUBSCRIBER_KEY='ppob.subscribers.v1',SUBSCRIPTION_BILL_KEY='ppob.subscriptionBills.v2',SUBSCRIPTION_PAYMENT_KEY='ppob.subscriptionPayments.v1',RECIPE_KEY='ppob.recipes.v1';
let incomeData=JSON.parse(localStorage.getItem(INCOME_KEY)||'[]'),expenseData=JSON.parse(localStorage.getItem(EXPENSE_KEY)||'[]'),stockData=JSON.parse(localStorage.getItem(STOCK_KEY)||'[]'),subscriberData=JSON.parse(localStorage.getItem(SUBSCRIBER_KEY)||'[]'),subscriptionBills=JSON.parse(localStorage.getItem(SUBSCRIPTION_BILL_KEY)||'[]'),subscriptionPayments=JSON.parse(localStorage.getItem(SUBSCRIPTION_PAYMENT_KEY)||'[]'),customRecipes=JSON.parse(localStorage.getItem(RECIPE_KEY)||'[]'),expenseEditing=null,stockEditing=null,subscriberEditing=null,subscriptionBillEditing=null,incomeSortDesc=true,expenseSortDesc=true,serviceEditing=null,$=x=>document.getElementById(x),fmt=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n),today=()=>{let d=new Date();return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()},monthKey=()=>{let d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')},dateISO=s=>{const v=String(s||'').trim();const parts=v.split(v.includes('/')?'/':'-');if(parts.length!==3)return '';let y,m,d;if(v.includes('/')){d=parts[0];m=parts[1];y=parts[2]}else if(parts[0].length===4){y=parts[0];m=parts[1];d=parts[2]}else{d=parts[0];m=parts[1];y=parts[2]}return String(y)+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0')},dateInput=s=>{let iso=dateISO(s);if(!iso)return String(s||'');let p=iso.split('-');return p[2]+'/'+p[1]+'/'+p[0]},dateDisplay=s=>{let iso=dateISO(s);if(!iso)return String(s||'');let p=iso.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})},recordMonth=r=>dateISO(r.date).slice(0,7),chartFmt=n=>{let a=Math.abs(Number(n)),s=a>=1e9?'b':a>=1e6?'m':a>=1e3?'k':'',v=s?(a/(s==='b'?1e9:s==='m'?1e6:1e3)):a;return (Number.isInteger(v)?v:v.toFixed(1).replace(/\\.0$/,''))+s};
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
function normalizeIncomeRecords(){
  let changed=false;
  const seen=new Set();
  incomeData=incomeData.map(r=>{
    let id=String(r.id||'');
    if(!id||seen.has(id)){id=crypto.randomUUID();changed=true}
    seen.add(id);
    return id===r.id?r:{...r,id};
  });
  if(changed)localStorage.setItem(INCOME_KEY,JSON.stringify(incomeData));
}
function normalizeStockRecords(){
  const groups=new Map();
  stockData.forEach(r=>{
    const key=norm(r.item);if(!key)return;
    if(!groups.has(key)){const base={...r,purchases:Array.isArray(r.purchases)?[...r.purchases]:[{date:r.date,qty:Number(r.qty)||0,amount:Number(r.amount)||0,legacy:true}]};if(!Number.isFinite(Number(base.stockPctBase))||Number(base.stockPctBase)<=0)base.stockPctBase=Number(base.qty)||0;groups.set(key,base);return}
    const base=groups.get(key);
    base.qty=(Number(base.qty)||0)+(Number(r.qty)||0);
    base.amount=(Number(base.amount)||0)+(Number(r.amount)||0);
    base.stock=(Number(base.stock??base.currentStock)||0)+(Number(r.stock??r.currentStock)||0);
    base.purchases.push(...(Array.isArray(r.purchases)?r.purchases:[{date:r.date,qty:Number(r.qty)||0,amount:Number(r.amount)||0,legacy:true}]));
    if(dateValue(r.date)>dateValue(base.date))base.date=r.date;
    if(!Number.isFinite(Number(base.stockPctBase))||Number(base.stockPctBase)<=0)base.stockPctBase=(Number(base.qty)||0);
  });
  const normalized=[...groups.values()];
  if(normalized.length!==stockData.length){stockData=normalized;localStorage.setItem(STOCK_KEY,JSON.stringify(stockData))}
}
function getSaleRecipe(sale){
  const key=norm(sale.item);
  if(BUILTIN_RECIPES[key])return BUILTIN_RECIPES[key](sale);
  return customRecipes.filter(r=>norm(r.product)===key&&r.stockItem&&Number(r.qtyPerUnit)>0).map(r=>({stockItem:r.stockItem,qty:Number(r.qtyPerUnit)}));
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
function allServiceNames(){return [...new Set([...Object.keys(BUILTIN_RECIPES).filter(n=>norm(n)!=='print & laminating').map(n=>({print:'Print','photo print':'Photo print',jilid:'Jilid',laminating:'Laminating'}[n]||n)),...customRecipes.map(r=>r.product).filter(Boolean)])].filter(n=>norm(n)!=='print & laminating'&&norm(n)!=='other service…')}
function updateItemControls(){
  if(!$('item'))return;
  const item=$('item').value||'Print';
  $('selectedServiceLabel').textContent=item;
  $('customItemWrap').hidden=item!=='__other__';
  $('photoUsageWrap').hidden=norm(item)!=='photo print';
  renderServiceOptions();
}
function selectedSaleItem(){return $('item').value==='__other__' ? $('customItem').value.trim() : $('item').value}
function renderServiceOptions(){
 const host=$('serviceOptions');if(!host)return;
 const builtins=['Print','Photo print','Jilid','Laminating'].map(norm);
 const customNames=[...new Set(customRecipes.map(r=>r.product).filter(Boolean))];
 host.innerHTML=allServiceNames().map(name=>'<div class="service-option'+(norm(name)===norm($('item').value)?' selected':'')+'"><button type="button" class="service-name" data-service="'+esc(name)+'">'+esc(name)+'</button><button type="button" class="service-manage" data-manage="'+esc(name)+'" aria-label="Edit '+esc(name)+'" title="Edit service">✎</button>'+(builtins.includes(norm(name))?'':'<button type="button" class="service-delete" data-delete="'+esc(name)+'" aria-label="Delete '+esc(name)+'" title="Delete service">×</button>')+'</div>').join('');
 host.querySelectorAll('[data-service]').forEach(b=>b.onclick=()=>{const name=b.dataset.service;$('item').value=name;$('selectedServiceLabel').textContent=name==='__other__'?'Other service…':name;$('customItemWrap').hidden=name!=='__other__';$('photoUsageWrap').hidden=norm(name)!=='photo print';$('servicePicker').hidden=true;if(name==='__other__')$('customItem').focus()});
 host.querySelectorAll('[data-manage]').forEach(b=>b.onclick=()=>{ $('servicePicker').hidden=true;openServiceEditor(b.dataset.manage) });
 host.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{const name=b.dataset.delete;if(!confirm('Delete service/product "'+name+'" and its recipe? Existing sales records and stock movements will remain unchanged.'))return;customRecipes=customRecipes.filter(r=>norm(r.product)!==norm(name));localStorage.setItem(RECIPE_KEY,JSON.stringify(customRecipes));if(norm($('item').value)===norm(name)){$('item').value='Print'}updateItemControls()});
}
function selectedSaleItem(){return $('item').value==='__other__' ? $('customItem').value.trim() : $('item').value}
function renderRecipeManager(){
 const host=$('recipeRows');if(!host)return;
 const rows=serviceEditing?customRecipes.filter(r=>norm(r.product)===norm(serviceEditing)).map(r=>({stockItem:r.stockItem,qtyPerUnit:r.qtyPerUnit})): [];
 host.innerHTML='';
 if(!stockData.length){host.innerHTML='<p class="muted">Add stock items in Stock Manager before assigning materials.</p>';return}
 (serviceEditing?rows:(rows.length?rows:[{stockItem:stockData[0].item,qtyPerUnit:1}])).forEach(row=>addRecipeEditorRow(row));
}
function addRecipeEditorRow(row={}){
 const host=$('recipeRows');const div=document.createElement('div');div.className='recipe-editor-row';
 const options=stockData.map(s=>'<option value="'+esc(s.item)+'"'+(s.item===row.stockItem?' selected':'')+'>'+esc(s.item)+'</option>').join('');
 div.innerHTML='<select aria-label="Stock item">'+options+'</select><input type="number" min="0.01" step="0.01" value="'+Number(row.qtyPerUnit||1)+'" aria-label="Consumption per sale unit"><button type="button" class="remove-recipe-row" aria-label="Remove material">✕</button>';
 div.querySelector('button').onclick=()=>div.remove();host.appendChild(div);
}
function openServiceEditor(name){
 serviceEditing=customRecipes.some(r=>norm(r.product)===norm(name))?name:null;
 const builtin=Object.keys(BUILTIN_RECIPES).some(k=>norm(({print:'Print','photo print':'Photo print',jilid:'Jilid',laminating:'Laminating','print & laminating':'Print & Laminating'}[k]||k))===norm(name));
 $('serviceDialogTitle').textContent=serviceEditing?'Edit service/product':'Add service/product';
 $('recipeProduct').value=serviceEditing|| (builtin?'':name);
 $('recipeProduct').readOnly=builtin;
 $('deleteServiceButton').hidden=!serviceEditing;
 $('recipeRows').innerHTML='';
 if(serviceEditing){customRecipes.filter(r=>norm(r.product)===norm(serviceEditing)).forEach(r=>addRecipeEditorRow(r))}
 else if(!builtin&&stockData.length)addRecipeEditorRow({stockItem:stockData[0].item,qtyPerUnit:1});
 if(builtin){$('recipeRows').innerHTML='<p class="muted">This built-in service uses its predefined stock recipe and cannot be edited here.</p>';$('recipeProduct').value=name;$('recipeForm').querySelector('[type=submit]').disabled=true;$('addRecipeRow').disabled=true}else{$('recipeForm').querySelector('[type=submit]').disabled=false;$('addRecipeRow').disabled=false}
 $('serviceDialog').showModal();
}
function closeServiceEditor(){ $('serviceDialog').close();serviceEditing=null;$('recipeProduct').readOnly=false;$('recipeForm').querySelector('[type=submit]').disabled=false;$('addRecipeRow').disabled=false }

function initIncomeFilters(){const years=[...new Set(incomeData.map(r=>dateISO(r.date).slice(0,4)).filter(y=>/^\\d{4}$/.test(y)))].sort().reverse();const current=String(new Date().getFullYear());$('incomeYearFilter').innerHTML=['<option value="all">All years</option>',...years.map(y=>'<option value="'+y+'">'+y+'</option>')].join('');$('incomeYearFilter').value=years.includes(current)?current:'all';const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];$('incomeMonthFilter').innerHTML=months.map((m,i)=>'<option value="'+String(i+1).padStart(2,'0')+'">'+m+'</option>').join('');const now=String(new Date().getMonth()+1).padStart(2,'0');[...$('incomeMonthFilter').options].forEach(o=>o.selected=o.value===now)}
function renderIncome(){const total=incomeData.reduce((a,r)=>a+Number(r.amount),0);const filtered=incomeData.filter(r=>{const iso=dateISO(r.date),year=$('incomeYearFilter')?.value||'all',selected=[...($('incomeMonthFilter')?.selectedOptions||[])].map(o=>o.value);return (year==='all'||iso.slice(0,4)===year)&&(!selected.length||selected.includes(iso.slice(5,7)))});$('incomeSummary').innerHTML='<button type="button" id="addServiceButton" class="primary">＋ Add service/product</button><span><span class="summary-label">Total income</span> <strong>'+fmt(total)+'</strong></span><span><span class="summary-label">Transactions</span> <strong>'+incomeData.length+'</strong></span>';if(!incomeData.length){$('table').innerHTML='<p class="muted">No income records yet.</p>';return}let todayDate=today(),rows=sortedRecords(filtered,incomeSortDesc);$('incomeSort').textContent='Sort: '+(incomeSortDesc?'Latest first':'Oldest first');$('table').innerHTML=rows.length?'<table><tr><th>Date</th><th>Item name</th><th>Qty</th><th class="money">Income amount</th><th>Note</th><th style="width: 140px">Action</th></tr>'+rows.map(r=>'<tr class="income-today'+(dateISO(r.date)===dateISO(todayDate)?' highlight':'')+'"><td>'+dateDisplay(r.date)+'</td><td>'+esc(r.item)+'</td><td>'+r.qty+'</td><td class="money">'+fmt(r.amount)+'</td><td>'+esc(r.note)+'</td><td style="width: 140px"><button onclick="editIncome(\''+r.id+'\')">Edit</button><button onclick="delIncome(\''+r.id+'\')">Delete</button></td></tr>').join('')+'</table>':'<p class="muted">No income records match the selected month(s) and year.</p>';$('addServiceButton').onclick=()=>openServiceEditor('')}
function renderExpenses(){let total=expenseData.reduce((a,r)=>a+Number(r.amount),0);$('expenseSummary').innerHTML='<span><span class="summary-label">Total expenses</span> <strong>'+fmt(total)+'</strong></span><span><span class="summary-label">Transactions</span> <strong>'+expenseData.length+'</strong></span>';if(!expenseData.length){$('expenseTable').innerHTML='<p class="muted">No expense records yet.</p>';return}let todayDate=today(),rows=sortedRecords(expenseData,expenseSortDesc);$('expenseSort').textContent='Sort: '+(expenseSortDesc?'Latest first':'Oldest first');$('expenseTable').innerHTML='<table><tr><th>Date</th><th>Expense name</th><th>Qty</th><th class="money">Expense amount</th><th>Note</th><th style="width: 140px">Action</th></tr>'+rows.map(r=>'<tr class="expense-today'+(dateISO(r.date)===todayDate?' highlight':'')+'"><td>'+dateDisplay(r.date)+'</td><td>'+esc(r.item)+'</td><td>'+ (r.qty || 1) +'</td><td class="money">'+fmt(r.amount)+'</td><td>'+esc(r.note)+'</td><td><button onclick="editExpense(\''+r.id+'\')">Edit</button><button onclick="delExpense(\''+r.id+'\')">Delete</button></td></tr>').join('')+'</table>'}

$('incomeSort').onclick=()=>{incomeSortDesc=!incomeSortDesc;renderIncome()};
$('incomeYearFilter').onchange=renderIncome;$('incomeMonthFilter').onchange=renderIncome;$('clearIncomeFilter').onclick=()=>{ $('incomeYearFilter').value='all';[...$('incomeMonthFilter').options].forEach(o=>o.selected=false);renderIncome()};
$('expenseSort').onclick=()=>{expenseSortDesc=!expenseSortDesc;renderExpenses()};
$('incomeForm').onsubmit=e=>{
  e.preventDefault();
  const item=selectedSaleItem();
  if(!item){alert('Enter a product or service name.');return}
  const photoSheetsPerUnit=norm(item)==='photo print'?Number($('photoSheetsPerUnit').value):undefined;
  if(norm(item)==='photo print'&&(!Number.isFinite(photoSheetsPerUnit)||photoSheetsPerUnit<=0)){alert('Enter a photo-paper fraction greater than zero.');return}
  const r={id:crypto.randomUUID(),item,qty:+$('qty').value,amount:+$('amount').value,date:$('date').value,note:$('note').value.trim()};
  if(photoSheetsPerUnit!==undefined)r.photoSheetsPerUnit=photoSheetsPerUnit;
  const stockSnapshot=JSON.stringify(stockData);
  try{r.stockDeductions=deductForSale(r)}catch(err){
    stockData=JSON.parse(stockSnapshot);
    alert(err.message||'Could not update stock. Sale was not saved.');
    return;
  }
  incomeData.push(r);
  localStorage.setItem(INCOME_KEY,JSON.stringify(incomeData));
  localStorage.setItem(STOCK_KEY,JSON.stringify(stockData));
  e.target.reset();$('qty').value=1;$('date').value=today();$('photoSheetsPerUnit').value='0.5';
  updateItemControls();renderIncome();renderDashboard();renderStock();
};
let incomeModalEditingId=null;
function closeEditIncomeDialog(){
  $('editIncomeDialog').close();
  incomeModalEditingId=null;
  $('editIncomeForm').reset();
}
$('closeEditIncome').onclick=closeEditIncomeDialog;
$('cancelEditIncome').onclick=closeEditIncomeDialog;
$('editIncomeItem').oninput=()=>{
  $('editPhotoUsageWrap').hidden=norm($('editIncomeItem').value)!=='photo print';
};
$('editIncomeForm').onsubmit=e=>{
  e.preventDefault();
  if(incomeModalEditingId===null)return;
  const index=incomeData.findIndex(x=>x.id===incomeModalEditingId);
  if(index<0){alert('This income record could not be found. Please refresh and try again.');closeEditIncomeDialog();return}
  const existing=incomeData[index],item=$('editIncomeItem').value.trim();
  if(!item){alert('Enter a product or service name.');return}
  const qty=Number($('editIncomeQty').value),amount=Number($('editIncomeAmount').value);
  if(!Number.isInteger(qty)||qty<1||!Number.isFinite(amount)||amount<0){alert('Enter a valid quantity and income amount.');return}
  const photoSheetsPerUnit=norm(item)==='photo print'?Number($('editPhotoSheetsPerUnit').value):undefined;
  if(photoSheetsPerUnit!==undefined&&(!Number.isFinite(photoSheetsPerUnit)||photoSheetsPerUnit<=0)){alert('Enter a photo-paper fraction greater than zero.');return}
  const updated={...existing,item,qty,amount,date:$('editIncomeDate').value,note:$('editIncomeNote').value.trim()};
  delete updated.photoSheetsPerUnit;
  if(photoSheetsPerUnit!==undefined)updated.photoSheetsPerUnit=photoSheetsPerUnit;
  const stockSnapshot=JSON.stringify(stockData);
  if(Array.isArray(existing.stockDeductions))restoreSaleStock(existing);
  try{updated.stockDeductions=deductForSale(updated)}catch(err){
    stockData=JSON.parse(stockSnapshot);
    alert(err.message||'Could not update stock. The income record was not changed.');
    return;
  }
  incomeData[index]=updated;
  localStorage.setItem(INCOME_KEY,JSON.stringify(incomeData));
  localStorage.setItem(STOCK_KEY,JSON.stringify(stockData));
  closeEditIncomeDialog();
  renderIncome();renderDashboard();renderStock();
};
window.editIncome=id=>{
  const r=incomeData.find(x=>x.id===id);if(!r)return;
  incomeModalEditingId=id;
  $('editIncomeItem').value=r.item||'';
  $('editPhotoUsageWrap').hidden=norm(r.item)!=='photo print';
  $('editPhotoSheetsPerUnit').value=r.photoSheetsPerUnit??0.5;
  $('editIncomeQty').value=r.qty??1;
  $('editIncomeAmount').value=r.amount??0;
  $('editIncomeDate').value=dateInput(r.date);
  $('editIncomeNote').value=r.note||'';
  $('editIncomeDialog').showModal();
};
window.delIncome=id=>{
  const r=incomeData.find(x=>x.id===id);if(!r)return;
  if(confirm('Delete this income record?')){
    if(Array.isArray(r.stockDeductions)){restoreSaleStock(r);localStorage.setItem(STOCK_KEY,JSON.stringify(stockData));}
    incomeData=incomeData.filter(x=>x.id!==id);localStorage.setItem(INCOME_KEY,JSON.stringify(incomeData));
    renderIncome();renderDashboard();renderStock();
  }
};
$('servicePickerButton').onclick=()=>{$('servicePicker').hidden=!$('servicePicker').hidden};
document.addEventListener('click',e=>{if(!e.target.closest('.service-picker-wrap'))$('servicePicker').hidden=true});
$('addServiceButton').onclick=()=>openServiceEditor('');
$('closeServiceDialog').onclick=closeServiceEditor;
$('addRecipeRow').onclick=()=>addRecipeEditorRow({stockItem:stockData[0]?.item||'',qtyPerUnit:1});
$('recipeForm').onsubmit=e=>{
 e.preventDefault();const product=$('recipeProduct').value.trim();
 if(!product){alert('Enter a service/product name.');return}
 if(Object.keys(BUILTIN_RECIPES).some(k=>norm(({print:'Print','photo print':'Photo print',jilid:'Jilid',laminating:'Laminating','print & laminating':'Print & Laminating'}[k]||k))===norm(product))){alert('Built-in service recipes cannot be changed here.');return}
 const rows=[...$('recipeRows').querySelectorAll('.recipe-editor-row')].map(row=>({stockItem:row.querySelector('select').value,qtyPerUnit:Number(row.querySelector('input').value)}));
 if(rows.some(r=>!r.stockItem||!Number.isFinite(r.qtyPerUnit)||r.qtyPerUnit<=0)){alert('Check each stock item and its consumption amount, or remove all material rows for an income-only service.');return}
 if(serviceEditing)customRecipes=customRecipes.filter(r=>norm(r.product)!==norm(serviceEditing));
 customRecipes.push(...(rows.length?rows.map(r=>({id:crypto.randomUUID(),product,stockItem:r.stockItem,qtyPerUnit:r.qtyPerUnit})): [{id:crypto.randomUUID(),product,stockItem:'',qtyPerUnit:0}]));
 localStorage.setItem(RECIPE_KEY,JSON.stringify(customRecipes));closeServiceEditor();updateItemControls();
};
$('deleteServiceButton').onclick=()=>{
 if(!serviceEditing||!confirm('Delete this service and all its recipe rows? Existing sale deductions will not change.'))return;
 customRecipes=customRecipes.filter(r=>norm(r.product)!==norm(serviceEditing));localStorage.setItem(RECIPE_KEY,JSON.stringify(customRecipes));closeServiceEditor();updateItemControls();
};
window.deleteRecipe=id=>{
  if(!confirm('Delete this recipe component? Existing sales deductions will not change.'))return;
  customRecipes=customRecipes.filter(r=>r.id!==id);localStorage.setItem(RECIPE_KEY,JSON.stringify(customRecipes));updateItemControls();
};


$('expenseForm').onsubmit=e=>{e.preventDefault();let r={item:$('expenseItem').value.trim(),qty:+$('expenseQty').value,amount:+$('expenseAmount').value,date:$('expenseDate').value,note:$('expenseNote').value.trim()};if(expenseEditing){let i=expenseData.findIndex(x=>x.id===expenseEditing);expenseData[i]={...expenseData[i],...r};expenseEditing=null;e.target.querySelector('button').textContent='Add expense'}else expenseData.push({id:crypto.randomUUID(),...r});localStorage.setItem(EXPENSE_KEY,JSON.stringify(expenseData));e.target.reset();$('expenseQty').value=1;$('expenseDate').value=today();renderExpenses();renderDashboard()};
window.editExpense=id=>{let r=expenseData.find(x=>x.id===id);expenseEditing=id;$('expenseItem').value=r.item;$('expenseQty').value=r.qty||1;$('expenseAmount').value=r.amount;$('expenseDate').value=dateInput(r.date);$('expenseNote').value=r.note;$('expenseForm').querySelector('button').textContent='Save changes'};
window.delExpense=id=>{if(confirm('Delete this expense record?')){expenseData=expenseData.filter(x=>x.id!==id);localStorage.setItem(EXPENSE_KEY,JSON.stringify(expenseData));renderExpenses();renderDashboard()}};


function paymentsForBill(id){return subscriptionPayments.filter(p=>p.billId===id)}
function billPaidTotal(id){return paymentsForBill(id).reduce((sum,p)=>sum+(Number(p.amount)||0),0)}
function billBalance(b){return Math.max(0,(Number(b.amount)||0)-billPaidTotal(b.id))}
function billStatus(b){const paid=billPaidTotal(b.id),amount=Number(b.amount)||0;return paid<=0?'unpaid':paid<amount?'partial':paid===amount?'paid':'overpaid'}
function subscriberName(id){return subscriberData.find(s=>s.id===id)?.name||'Unknown subscriber'}
function persistSubscriptions(){localStorage.setItem(SUBSCRIBER_KEY,JSON.stringify(subscriberData));localStorage.setItem(SUBSCRIPTION_BILL_KEY,JSON.stringify(subscriptionBills));localStorage.setItem(SUBSCRIPTION_PAYMENT_KEY,JSON.stringify(subscriptionPayments))}
function resetSubscriberForm(){subscriberEditing=null;$('subscriberEditId').value='';$('subscriberForm').reset();$('subscriberSubmit').textContent='Add subscriber';$('cancelSubscriberEdit').hidden=true}
function resetSubscriptionBillForm(){subscriptionBillEditing=null;$('subscriptionBillEditId').value='';$('subscriptionBillForm').reset();$('subscriptionBillPeriod').value=$('subscriptionMonth').value||monthKey();$('subscriptionBillSubmit').textContent='Create bill';$('cancelSubscriptionBillEdit').hidden=true;renderSubscriptionChoices()}
function renderSubscriptionChoices(){
 const sel=$('subscriptionBillSubscriber'),prev=sel.value,active=subscriberData.filter(s=>s.active!==false).sort((a,b)=>a.name.localeCompare(b.name));
 sel.innerHTML='<option value="">Choose subscriber</option>'+active.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join('');if(active.some(s=>s.id===prev))sel.value=prev;
 const pay=$('subscriptionPaymentBill'),oldPay=pay.value,open=subscriptionBills.filter(b=>billBalance(b)>0).sort((a,b)=>a.period.localeCompare(b.period)||subscriberName(a.subscriberId).localeCompare(subscriberName(b.subscriberId)));
 pay.innerHTML='<option value="">Choose outstanding bill</option>'+open.map(b=>'<option value="'+esc(b.id)+'">'+esc(subscriberName(b.subscriberId)+' · '+(b.service==='electricity'?'Electricity':'Water')+' · '+b.period+' · due '+fmt(billBalance(b)))+'</option>').join('');if(open.some(b=>b.id===oldPay))pay.value=oldPay;
 const chosen=subscriptionBills.find(b=>b.id===pay.value);if(chosen)$('subscriptionPaymentAmount').max=String(billBalance(chosen));else $('subscriptionPaymentAmount').removeAttribute('max');
}
function renderSubscriberTable(){
 if(!subscriberData.length){$('subscriberTable').innerHTML='<p class="muted">No subscribers yet. Add a customer above to get started.</p>';return}
 const rows=[...subscriberData].sort((a,b)=>a.name.localeCompare(b.name)).map(s=>'<tr><td>'+esc(s.name)+'</td><td>'+esc(s.phone||'—')+'</td><td>'+esc(s.address||'—')+'</td><td>'+subscriptionBills.filter(b=>b.subscriberId===s.id).length+'</td><td><span class="subscription-status '+(s.active===false?'inactive':'active')+'">'+(s.active===false?'Inactive':'Active')+'</span></td><td class="subscription-actions"><button type="button" onclick="editSubscriber(\''+s.id+'\')">Edit</button><button type="button" onclick="toggleSubscriber(\''+s.id+'\')">'+(s.active===false?'Activate':'Deactivate')+'</button></td></tr>').join('');
 $('subscriberTable').innerHTML='<div class="subscription-table-scroll"><table><thead><tr><th>Subscriber</th><th>Phone</th><th>Address</th><th>Bills</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function renderSubscriptions(){
 const month=$('subscriptionMonth').value||monthKey();if(!subscriptionBillEditing)$('subscriptionBillPeriod').value=month;
 renderSubscriberTable();renderSubscriptionChoices();
 const bills=subscriptionBills.filter(b=>b.period===month),billed=bills.reduce((s,b)=>s+(Number(b.amount)||0),0),collected=bills.reduce((s,b)=>s+billPaidTotal(b.id),0),outstanding=bills.reduce((s,b)=>s+billBalance(b),0),due=bills.filter(b=>['unpaid','partial'].includes(billStatus(b))).length;
 $('subscriptionSummary').innerHTML='<div class="subscription-stat"><span>Total billed</span><strong>'+fmt(billed)+'</strong></div><div class="subscription-stat"><span>Collected</span><strong>'+fmt(collected)+'</strong></div><div class="subscription-stat"><span>Outstanding</span><strong>'+fmt(outstanding)+'</strong></div><div class="subscription-stat"><span>Unpaid / partial bills</span><strong>'+due+'</strong></div>';
 const sf=$('subscriptionStatusFilter').value,tf=$('subscriptionServiceFilter').value,filtered=bills.filter(b=>(sf==='all'||billStatus(b)===sf)&&(tf==='all'||b.service===tf)).sort((a,b)=>subscriberName(a.subscriberId).localeCompare(subscriberName(b.subscriberId))||a.service.localeCompare(b.service));
 const rows=filtered.map(b=>{const paid=billPaidTotal(b.id),balance=billBalance(b),status=billStatus(b),label={unpaid:'Unpaid',partial:'Partial',paid:'Paid',overpaid:'Overpaid'}[status]||status;return '<tr><td>'+esc(subscriberName(b.subscriberId))+'</td><td>'+(b.service==='electricity'?'Electricity':'Water')+'</td><td>'+esc(b.period)+'</td><td class="money">'+fmt(b.amount)+'</td><td class="money">'+fmt(paid)+'</td><td class="money">'+fmt(balance)+'</td><td><span class="subscription-status '+status+'">'+label+'</span></td><td class="subscription-actions"><button type="button" onclick="editSubscriptionBill(\''+b.id+'\')">Edit</button><button type="button" onclick="viewSubscriptionPayments(\''+b.id+'\')">History</button><button type="button" class="danger" onclick="deleteSubscriptionBill(\''+b.id+'\')">Delete</button></td></tr>'}).join('');
 $('subscriptionTable').innerHTML=rows?'<div class="subscription-table-scroll"><table><thead><tr><th>Subscriber</th><th>Service</th><th>Period</th><th class="money">Bill</th><th class="money">Paid</th><th class="money">Remaining</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p class="muted">No bills match this month and filter. Create a bill above to get started.</p>';
 const history=subscriptionPayments.filter(p=>{const bill=subscriptionBills.find(b=>b.id===p.billId);return bill&&bill.period===month}).sort((a,b)=>dateValue(b.date)-dateValue(a.date));
 $('subscriptionPaymentHistory').innerHTML=history.length?'<div class="subscription-table-scroll"><table><thead><tr><th>Payment date</th><th>Subscriber</th><th>Service</th><th>Bill period</th><th class="money">Payment</th><th>Note</th><th>Action</th></tr></thead><tbody>'+history.map(p=>{const bill=subscriptionBills.find(b=>b.id===p.billId);return '<tr><td>'+dateDisplay(p.date)+'</td><td>'+esc(subscriberName(bill.subscriberId))+'</td><td>'+(bill.service==='electricity'?'Electricity':'Water')+'</td><td>'+esc(bill.period)+'</td><td class="money">'+fmt(p.amount)+'</td><td>'+esc(p.note||'—')+'</td><td><button type="button" class="danger" onclick="deleteSubscriptionPayment(\''+p.id+'\')">Delete</button></td></tr>'}).join('')+'</tbody></table></div>':'<p class="muted">No payments recorded for bills in this month.</p>';
}
$('subscriberForm').onsubmit=e=>{e.preventDefault();const name=$('subscriberName').value.trim();if(!name){alert('Enter a subscriber name.');return}const duplicate=subscriberData.find(s=>s.id!==subscriberEditing&&s.active!==false&&s.name.trim().toLocaleLowerCase()===name.toLocaleLowerCase());if(duplicate&&!confirm('An active subscriber with this name already exists. Add another person or household with the same name?'))return;const record={name,phone:$('subscriberPhone').value.trim(),address:$('subscriberAddress').value.trim(),active:true};if(subscriberEditing){const i=subscriberData.findIndex(s=>s.id===subscriberEditing);if(i<0){alert('Subscriber not found.');resetSubscriberForm();return}subscriberData[i]={...subscriberData[i],...record}}else subscriberData.push({id:crypto.randomUUID(),...record,createdAt:new Date().toISOString()});persistSubscriptions();resetSubscriberForm();renderSubscriptions()};
$('cancelSubscriberEdit').onclick=resetSubscriberForm;
window.editSubscriber=id=>{const s=subscriberData.find(x=>x.id===id);if(!s)return;subscriberEditing=id;$('subscriberEditId').value=id;$('subscriberName').value=s.name;$('subscriberPhone').value=s.phone||'';$('subscriberAddress').value=s.address||'';$('subscriberSubmit').textContent='Save subscriber';$('cancelSubscriberEdit').hidden=false;$('subscriberForm').scrollIntoView({behavior:'smooth',block:'center'})};
window.toggleSubscriber=id=>{const s=subscriberData.find(x=>x.id===id);if(!s)return;s.active=s.active===false;persistSubscriptions();renderSubscriptions()};
$('subscriptionBillForm').onsubmit=e=>{e.preventDefault();const subscriberId=$('subscriptionBillSubscriber').value,service=$('subscriptionService').value,period=$('subscriptionBillPeriod').value,amount=Number($('subscriptionBillAmount').value);if(!subscriberData.some(s=>s.id===subscriberId&&s.active!==false)){alert('Choose an active subscriber.');return}if(!/^\d{4}-\d{2}$/.test(period)){alert('Choose a valid billing month.');return}if(!Number.isSafeInteger(amount)||amount<0){alert('Enter a valid whole-rupiah bill amount.');return}const duplicate=subscriptionBills.find(b=>b.id!==subscriptionBillEditing&&b.subscriberId===subscriberId&&b.service===service&&b.period===period);if(duplicate){alert('A bill already exists for this subscriber, service, and month. Edit the existing bill instead.');return}const record={subscriberId,service,period,amount,note:$('subscriptionBillNote').value.trim(),updatedAt:new Date().toISOString()};if(subscriptionBillEditing){const i=subscriptionBills.findIndex(b=>b.id===subscriptionBillEditing);if(i<0){alert('Bill not found.');resetSubscriptionBillForm();return}if(billPaidTotal(subscriptionBillEditing)>amount){alert('Bill amount cannot be less than payments already recorded ('+fmt(billPaidTotal(subscriptionBillEditing))+').');return}subscriptionBills[i]={...subscriptionBills[i],...record}}else subscriptionBills.push({id:crypto.randomUUID(),...record,createdAt:new Date().toISOString()});persistSubscriptions();resetSubscriptionBillForm();renderSubscriptions()};
$('cancelSubscriptionBillEdit').onclick=resetSubscriptionBillForm;
window.editSubscriptionBill=id=>{const b=subscriptionBills.find(x=>x.id===id);if(!b)return;subscriptionBillEditing=id;$('subscriptionBillEditId').value=id;$('subscriptionBillSubscriber').value=b.subscriberId;$('subscriptionService').value=b.service;$('subscriptionBillPeriod').value=b.period;$('subscriptionBillAmount').value=b.amount;$('subscriptionBillNote').value=b.note||'';$('subscriptionBillSubmit').textContent='Save bill changes';$('cancelSubscriptionBillEdit').hidden=false;$('subscriptionBillForm').scrollIntoView({behavior:'smooth',block:'center'})};
window.deleteSubscriptionBill=id=>{const b=subscriptionBills.find(x=>x.id===id);if(!b)return;const count=paymentsForBill(id).length;if(!confirm('Delete this bill'+(count?' and its '+count+' payment record(s)':'')+'? This cannot be undone.'))return;subscriptionBills=subscriptionBills.filter(x=>x.id!==id);subscriptionPayments=subscriptionPayments.filter(p=>p.billId!==id);if(subscriptionBillEditing===id)resetSubscriptionBillForm();persistSubscriptions();renderSubscriptions()};
window.viewSubscriptionPayments=id=>{const b=subscriptionBills.find(x=>x.id===id);if(!b)return;const history=paymentsForBill(id);alert(history.length?'Payment history for '+subscriberName(b.subscriberId)+' · '+(b.service==='electricity'?'Electricity':'Water')+' · '+b.period+'\n\n'+history.map(p=>dateDisplay(p.date)+' — '+fmt(p.amount)+(p.note?' ('+p.note+')':'')).join('\n'):'No payments recorded for this bill.')};
$('subscriptionPaymentForm').onsubmit=e=>{e.preventDefault();const bill=subscriptionBills.find(b=>b.id===$('subscriptionPaymentBill').value),amount=Number($('subscriptionPaymentAmount').value),date=$('subscriptionPaymentDate').value;if(!bill){alert('Choose an outstanding bill.');return}if(!Number.isSafeInteger(amount)||amount<=0){alert('Enter a payment of at least Rp 1.');return}const balance=billBalance(bill);if(amount>balance){alert('Payment exceeds the outstanding balance of '+fmt(balance)+'.');return}if(!dateISO(date)){alert('Enter a valid payment date.');return}subscriptionPayments.push({id:crypto.randomUUID(),billId:bill.id,amount,date,note:$('subscriptionPaymentNote').value.trim(),createdAt:new Date().toISOString()});persistSubscriptions();e.target.reset();$('subscriptionPaymentDate').value=today();renderSubscriptions()};
$('subscriptionPaymentBill').onchange=()=>{const b=subscriptionBills.find(x=>x.id===$('subscriptionPaymentBill').value);if(b)$('subscriptionPaymentAmount').max=String(billBalance(b));else $('subscriptionPaymentAmount').removeAttribute('max')};
$('subscriptionMonth').onchange=()=>{if(!subscriptionBillEditing)$('subscriptionBillPeriod').value=$('subscriptionMonth').value||monthKey();renderSubscriptions()};
$('subscriptionStatusFilter').onchange=renderSubscriptions;$('subscriptionServiceFilter').onchange=renderSubscriptions;
$('subscriptionPaymentDate').value=today();$('subscriptionMonth').value=monthKey();$('subscriptionBillPeriod').value=monthKey();
window.deleteSubscriptionPayment=id=>{const p=subscriptionPayments.find(x=>x.id===id);if(!p||!confirm('Delete this payment record? The bill balance will increase accordingly.'))return;subscriptionPayments=subscriptionPayments.filter(x=>x.id!==id);persistSubscriptions();renderSubscriptions()};

function renderStock(){
  updateStockItemChoices();
  if(!stockData.length){$('stockTable').innerHTML='<p class="muted">No stock records yet.</p>';return}
  let rows=stockData.map(r=>{
    let qty=Number(r.qty)||0,stock=Number(r.stock??r.currentStock??0),cost=Number(r.amount)||0;
    const stockPctBase=Number(r.stockPctBase)>0?Number(r.stockPctBase):qty;
    let stockPct=stockPctBase>0?(stock/stockPctBase*100):0,costPerUnit=qty>0?cost/qty:0;
    return {r,qty,stock,cost,stockPct,costPerUnit};
  }).sort((a,b)=>a.stockPct-b.stockPct).map(({r,qty,stock,cost,stockPct,costPerUnit})=>{
    let lowStock=stockPct<10?' low-stock':'';
    return `<tr class="${lowStock.trim()}"><td>${dateDisplay(r.date)}</td><td>${esc(r.item)}</td><td>${qty}</td><td class="money">${fmt(cost)}</td><td>${stock.toLocaleString('id-ID')}</td><td>${Math.floor(stockPct)}%</td><td class="money">${fmt(costPerUnit)}</td><td><button onclick="editStock('${r.id}')">Edit</button><button onclick="delStock('${r.id}')">Delete</button></td></tr>`
  }).join('');
  $('stockTable').innerHTML='<table><tr><th>Latest purchase</th><th>Item name</th><th>Total purchased</th><th class="money">Total cost</th><th>Stock</th><th>Stock %</th><th class="money">Avg. cost/unit</th><th>Action</th></tr>'+rows+'</table>'
}
function updateStockItemChoices(){
  const select=$('stockExistingItem');if(!select)return;
  const previous=select.value,names=[...new Set(stockData.map(r=>r.item).filter(Boolean))];
  select.innerHTML=names.map(name=>'<option value="'+esc(name)+'">'+esc(name)+'</option>').join('');
  if(names.includes(previous))select.value=previous;
  $('stockMode').querySelector('option[value="restock"]').disabled=!names.length;
  if(!names.length&&$('stockMode').value==='restock')$('stockMode').value='new';
  updateStockModeUI();
}
function updateStockModeUI(){
  const restock=$('stockMode').value==='restock';
  $('stockNewItemWrap').hidden=restock;$('stockExistingItemWrap').hidden=!restock;$('stockInitialWrap').hidden=restock;
  $('stockStock').required=!restock;$('stockItem').required=!restock;$('stockExistingItem').required=restock;
  $('stockSubmitButton').textContent=stockEditing?'Save changes':(restock?'Restock item':'Add stock');
  $('stockFlowHelp').textContent=restock
    ?'Restocking adds the purchase quantity and cost to the existing item. Current stock increases by the purchased quantity; purchase history is retained.'
    :'For a new item, enter the purchased quantity, total purchase cost, and current remaining stock.';
}
$('stockMode').onchange=updateStockModeUI;
$('stockForm').onsubmit=e=>{
  e.preventDefault();
  const date=$('stockDate').value,qty=Number($('stockQty').value),amount=Number($('stockAmount').value);
  if(!Number.isFinite(qty)||qty<=0||!Number.isFinite(amount)||amount<0){alert('Enter a valid purchase quantity and cost.');return}
  const purchase={date,qty,amount};
  if(stockEditing){
    const i=stockData.findIndex(x=>x.id===stockEditing);
    if(i<0){stockEditing=null;alert('Stock item not found.');return}
    const prior=stockData[i],name=$('stockItem').value.trim();
    stockData[i]={...prior,date,item:name,qty,amount,stock:Number($('stockStock').value),purchases:[...(prior.purchases||[]),purchase]};
    stockEditing=null;
  }else if($('stockMode').value==='restock'){
    const name=$('stockExistingItem').value,item=findStockItem(name);
    if(!item){alert('Choose an existing stock item.');return}
    const previousPurchase={date:item.date,qty:Number(item.qty)||0,amount:Number(item.amount)||0,legacy:true};
    item.purchases=Array.isArray(item.purchases)?item.purchases:[previousPurchase];
    item.qty=(Number(item.qty)||0)+qty;item.amount=(Number(item.amount)||0)+amount;
    item.stock=Number(item.stock??item.currentStock??0)+qty;item.currentStock=item.stock;item.stockPctBase=item.stock;item.date=date;
    item.purchases.push(purchase);
  }else{
    const name=$('stockItem').value.trim();
    if(!name){alert('Enter an item name.');return}
    if(findStockItem(name)){alert('This item already exists. Choose “Restock existing item” instead to avoid a duplicate.');return}
    const initialStock=Number($('stockStock').value);
    stockData.push({id:crypto.randomUUID(),date,item:name,qty,amount,stock:initialStock,stockPctBase:qty,purchases:[purchase]});
  }
  localStorage.setItem(STOCK_KEY,JSON.stringify(stockData));
  e.target.reset();$('stockDate').value=today();$('stockQty').value=1;$('stockAmount').value='';
  stockEditing=null;$('stockMode').value='new';updateStockModeUI();
  renderStock();renderRecipeManager();renderIncome();
};
window.editStock=id=>{
  const r=stockData.find(x=>x.id===id);if(!r)return;
  stockEditing=id;$('stockMode').value='new';$('stockDate').value=dateInput(r.date)||today();$('stockItem').value=r.item;
  $('stockQty').value=r.qty||1;$('stockAmount').value=r.amount||0;$('stockStock').value=r.stock??r.currentStock??'';
  $('stockForm').querySelector('button').textContent='Save changes';updateStockModeUI();
};
window.delStock=id=>{
  const item=stockData.find(x=>x.id===id);if(!item)return;
  if(confirm('Delete stock item "'+item.item+'"? Sales recipes using this item may no longer deduct stock.')){
    stockData=stockData.filter(x=>x.id!==id);localStorage.setItem(STOCK_KEY,JSON.stringify(stockData));renderStock();renderRecipeManager()
  }
};
function show(p){$('dashboard').hidden=p!=='dashboard';$('income').hidden=p!=='income';$('expenses').hidden=p!=='expenses';$('subscriptions').hidden=p!=='subscriptions';$('stock').hidden=p!=='stock';$('bd').classList.toggle('active',p==='dashboard');$('bi').classList.toggle('active',p==='income');$('be').classList.toggle('active',p==='expenses');$('bsub').classList.toggle('active',p==='subscriptions');$('bs').classList.toggle('active',p==='stock');if(p==='income')$('date').value=today();if(p==='expenses')$('expenseDate').value=today();if(p==='stock')$('stockDate').value=today();if(p==='subscriptions')renderSubscriptions();if(p==='dashboard')renderDashboard()}

$('exportData').onclick=()=>{
  const backup={app:'PPOB',formatVersion:2,exportedAt:new Date().toISOString(),income:incomeData,expenses:expenseData,stock:stockData,subscribers:subscriberData,subscriptionBills,subscriptionPayments,recipes:customRecipes};
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
    if(!parsed||parsed.app!=='PPOB'||![1,2].includes(parsed.formatVersion)||!Array.isArray(parsed.income)||!Array.isArray(parsed.expenses)||!Array.isArray(parsed.stock)||(parsed.subscriptions!==undefined&&!Array.isArray(parsed.subscriptions))||(parsed.subscribers!==undefined&&!Array.isArray(parsed.subscribers))||(parsed.subscriptionBills!==undefined&&!Array.isArray(parsed.subscriptionBills))||(parsed.subscriptionPayments!==undefined&&!Array.isArray(parsed.subscriptionPayments))||(parsed.recipes!==undefined&&!Array.isArray(parsed.recipes)))throw new Error('This file is not a supported PPOB backup.');
    if(!confirm('Import this backup and replace all current income, expense, stock, and subscription records? This cannot be undone.')){e.target.value='';return}
    incomeData=parsed.income;expenseData=parsed.expenses;stockData=parsed.stock;subscriberData=parsed.subscribers||[];subscriptionBills=parsed.subscriptionBills||[];subscriptionPayments=parsed.subscriptionPayments||[];customRecipes=parsed.recipes||[];
    normalizeIncomeRecords();
    localStorage.setItem(INCOME_KEY,JSON.stringify(incomeData));
    localStorage.setItem(EXPENSE_KEY,JSON.stringify(expenseData));
    localStorage.setItem(STOCK_KEY,JSON.stringify(stockData));
    persistSubscriptions();
    localStorage.setItem(RECIPE_KEY,JSON.stringify(customRecipes));
    expenseEditing=stockEditing=null;
    $('incomeForm').reset();$('expenseForm').reset();$('stockForm').reset();resetSubscriberForm();resetSubscriptionBillForm();$('subscriptionPaymentForm').reset();
    $('qty').value=$('expenseQty').value=$('stockQty').value=1;
    $('date').value=$('expenseDate').value=$('stockDate').value=$('subscriptionPaymentDate').value=today();$('subscriptionMonth').value=$('subscriptionBillPeriod').value=monthKey();
    $('incomeForm').querySelector('button').textContent='Add income';
    $('expenseForm').querySelector('button').textContent='Add expense';
    $('stockForm').querySelector('button').textContent='Add stock';
    renderIncome();renderExpenses();renderStock();renderSubscriptions();renderDashboard();
    $('backupStatus').textContent='Backup imported successfully.';
  }catch(err){$('backupStatus').textContent=err.message||'Could not read this backup file.'}
  e.target.value='';
};
$('bd').onclick=()=>show('dashboard');$('bi').onclick=()=>show('income');$('be').onclick=()=>show('expenses');$('bsub').onclick=()=>show('subscriptions');$('bs').onclick=()=>show('stock');$('month').onchange=renderDashboard;
$('toggleSidebar').onclick=()=>{let c=$('sidebar').classList.toggle('collapsed');$('toggleSidebar').textContent=c?'›':'‹';$('toggleSidebar').title=c?'Expand sidebar':'Collapse sidebar';$('toggleSidebar').setAttribute('aria-label',$('toggleSidebar').title)};
normalizeIncomeRecords();normalizeStockRecords();initIncomeFilters();updateItemControls();renderIncome();renderExpenses();renderStock();$('subscriptionMonth').value=monthKey();$('subscriptionBillPeriod').value=monthKey();$('subscriptionPaymentDate').value=today();renderSubscriptions();renderDashboard();window.addEventListener('resize',()=>{if(!$('dashboard').hidden)renderFinancialChart($('month').value||monthKey())});
});

