document.addEventListener('DOMContentLoaded',()=>{
const INCOME_KEY='ppob.income.v1',EXPENSE_KEY='ppob.expense.v1';
let incomeData=JSON.parse(localStorage.getItem(INCOME_KEY)||'[]'),expenseData=JSON.parse(localStorage.getItem(EXPENSE_KEY)||'[]'),incomeEditing=null,expenseEditing=null,$=x=>document.getElementById(x),fmt=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n),today=()=>{let d=new Date();return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()},monthKey=()=>{let d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')},recordMonth=r=>{let p=String(r.date||'').split('/');return p.length===3?p[2]+'-'+p[1]:''};
$('date').value=today();$('expenseDate').value=today();$('month').value=monthKey();

function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderDashboard(){
  let m=$('month').value||monthKey(),inc=incomeData.filter(r=>recordMonth(r)===m),exp=expenseData.filter(r=>recordMonth(r)===m),
      it=inc.reduce((a,r)=>a+Number(r.amount),0),et=exp.reduce((a,r)=>a+Number(r.amount),0);
  $('monthlyIncome').textContent=fmt(it);$('monthlyExpense').textContent=fmt(et);$('monthlyNet').textContent=fmt(it-et);
  renderFinancialChart(m);
}
function renderFinancialChart(endMonth){
  let [y,mo]=endMonth.split('-').map(Number),months=[];
  for(let i=11;i>=0;i--){let d=new Date(y,mo-1-i,1),key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');months.push({key,label:d.toLocaleDateString('en-US',{month:'short',year:'2-digit'})})}
  let data=months.map(m=>({label:m.label,income:incomeData.filter(r=>recordMonth(r)===m.key).reduce((a,r)=>a+Number(r.amount),0),expense:expenseData.filter(r=>recordMonth(r)===m.key).reduce((a,r)=>a+Number(r.amount),0)}));
  let canvas=$('financialChart'),ctx=canvas.getContext('2d'),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1,w=Math.max(320,rect.width),h=Math.max(240,rect.height);
  canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  let p={l:64,r:18,t:20,b:42},cw=w-p.l-p.r,ch=h-p.t-p.b,max=Math.max(1,...data.flatMap(x=>[x.income,x.expense])),ticks=4;
  ctx.font='12px system-ui,sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
  for(let i=0;i<=ticks;i++){let v=max*i/ticks,yy=p.t+ch-(ch*i/ticks);ctx.strokeStyle='#e4e7ec';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,yy);ctx.lineTo(w-p.r,yy);ctx.stroke();ctx.fillStyle='#667085';ctx.fillText(fmt(v).replace('Rp','Rp '),p.l-8,yy)}
  ctx.textAlign='center';ctx.textBaseline='top';let xStep=(w-p.l-p.r)/(data.length-1);
  data.forEach((d,i)=>{ctx.fillStyle='#667085';ctx.fillText(d.label,p.l+i*xStep,h-p.b+12)});
  const draw=(key)=>{ctx.strokeStyle=key==='income'?'#2563eb':'#dc2626';ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();data.forEach((d,i)=>{let x=p.l+i*xStep,yy=p.t+ch-(d[key]/max)*ch;i?ctx.lineTo(x,yy):ctx.moveTo(x,yy)});ctx.stroke();data.forEach((d,i)=>{let x=p.l+i*xStep,yy=p.t+ch-(d[key]/max)*ch;ctx.fillStyle='#fff';ctx.strokeStyle=key==='income'?'#2563eb':'#dc2626';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,yy,4,0,Math.PI*2);ctx.fill();ctx.stroke()})};
  draw('income');draw('expense');
  ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle='#2563eb';ctx.fillRect(p.l,4,12,3);ctx.fillStyle='#182230';ctx.fillText('Income',p.l+18,0);ctx.fillStyle='#dc2626';ctx.fillRect(p.l+90,4,12,3);ctx.fillStyle='#182230';ctx.fillText('Expenses',p.l+108,0);
}
function renderIncome(){let total=incomeData.reduce((a,r)=>a+Number(r.amount),0);$('incomeSummary').innerHTML='<span><span class="summary-label">Total income</span> <strong>'+fmt(total)+'</strong></span><span><span class="summary-label">Transactions</span> <strong>'+incomeData.length+'</strong></span>';if(!incomeData.length){$('table').innerHTML='<p class="muted">No income records yet.</p>';return}$('table').innerHTML='<table><tr><th>Item name</th><th>Qty</th><th class="money">Income amount</th><th>Date</th><th>Note</th><th>Action</th></tr>'+incomeData.map(r=>'<tr><td>'+esc(r.item)+'</td><td>'+r.qty+'</td><td class="money">'+fmt(r.amount)+'</td><td>'+r.date+'</td><td>'+esc(r.note)+'</td><td><button onclick="editIncome(\''+r.id+'\')">Edit</button><button onclick="delIncome(\''+r.id+'\')">Delete</button></td></tr>').join('')+'</table>'}
function renderExpenses(){let total=expenseData.reduce((a,r)=>a+Number(r.amount),0);$('expenseSummary').innerHTML='<span><span class="summary-label">Total expenses</span> <strong>'+fmt(total)+'</strong></span><span><span class="summary-label">Transactions</span> <strong>'+expenseData.length+'</strong></span>';if(!expenseData.length){$('expenseTable').innerHTML='<p class="muted">No expense records yet.</p>';return}$('expenseTable').innerHTML='<table><tr><th>Expense name</th><th class="money">Amount</th><th>Date</th><th>Note</th><th>Action</th></tr>'+expenseData.map(r=>'<tr><td>'+esc(r.item)+'</td><td class="money">'+fmt(r.amount)+'</td><td>'+r.date+'</td><td>'+esc(r.note)+'</td><td><button onclick="editExpense(\''+r.id+'\')">Edit</button><button onclick="delExpense(\''+r.id+'\')">Delete</button></td></tr>').join('')+'</table>'}

$('incomeForm').onsubmit=e=>{e.preventDefault();let r={item:$('item').value.trim(),qty:+$('qty').value,amount:+$('amount').value,date:$('date').value,note:$('note').value.trim()};if(incomeEditing){let i=incomeData.findIndex(x=>x.id===incomeEditing);incomeData[i]={...incomeData[i],...r};incomeEditing=null;e.target.querySelector('button').textContent='Add income'}else incomeData.push({id:crypto.randomUUID(),...r});localStorage.setItem(INCOME_KEY,JSON.stringify(incomeData));e.target.reset();$('qty').value=1;$('date').value=today();renderIncome();renderDashboard()};
window.editIncome=id=>{let r=incomeData.find(x=>x.id===id);incomeEditing=id;$('item').value=r.item;$('qty').value=r.qty;$('amount').value=r.amount;$('date').value=r.date;$('note').value=r.note;$('incomeForm').querySelector('button').textContent='Save changes'};
window.delIncome=id=>{if(confirm('Delete this income record?')){incomeData=incomeData.filter(x=>x.id!==id);localStorage.setItem(INCOME_KEY,JSON.stringify(incomeData));renderIncome();renderDashboard()}};

$('expenseForm').onsubmit=e=>{e.preventDefault();let r={item:$('expenseItem').value.trim(),amount:+$('expenseAmount').value,date:$('expenseDate').value,note:$('expenseNote').value.trim()};if(expenseEditing){let i=expenseData.findIndex(x=>x.id===expenseEditing);expenseData[i]={...expenseData[i],...r};expenseEditing=null;e.target.querySelector('button').textContent='Add expense'}else expenseData.push({id:crypto.randomUUID(),...r});localStorage.setItem(EXPENSE_KEY,JSON.stringify(expenseData));e.target.reset();$('expenseDate').value=today();renderExpenses();renderDashboard()};
window.editExpense=id=>{let r=expenseData.find(x=>x.id===id);expenseEditing=id;$('expenseItem').value=r.item;$('expenseAmount').value=r.amount;$('expenseDate').value=r.date;$('expenseNote').value=r.note;$('expenseForm').querySelector('button').textContent='Save changes'};
window.delExpense=id=>{if(confirm('Delete this expense record?')){expenseData=expenseData.filter(x=>x.id!==id);localStorage.setItem(EXPENSE_KEY,JSON.stringify(expenseData));renderExpenses();renderDashboard()}};

function show(p){$('dashboard').hidden=p!=='dashboard';$('income').hidden=p!=='income';$('expenses').hidden=p!=='expenses';$('bd').classList.toggle('active',p==='dashboard');$('bi').classList.toggle('active',p==='income');$('be').classList.toggle('active',p==='expenses');if(p==='income')$('date').value=today();if(p==='expenses')$('expenseDate').value=today();if(p==='dashboard')renderDashboard()}
$('bd').onclick=()=>show('dashboard');$('bi').onclick=()=>show('income');$('be').onclick=()=>show('expenses');$('month').onchange=renderDashboard;
$('toggleSidebar').onclick=()=>{let c=$('sidebar').classList.toggle('collapsed');$('toggleSidebar').textContent=c?'›':'‹';$('toggleSidebar').title=c?'Expand sidebar':'Collapse sidebar';$('toggleSidebar').setAttribute('aria-label',$('toggleSidebar').title)};
renderIncome();renderExpenses();renderDashboard();window.addEventListener('resize',()=>{if(!$('dashboard').hidden)renderFinancialChart($('month').value||monthKey())});
});
