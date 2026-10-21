(() => {
 const storageKey='shiguang-diary-v1';
 const today=new Date();
 const dateString=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
 const panel=document.createElement('section');panel.className='card diary';
 panel.style.cssText='background:white;border:1px solid #dce3d3;border-radius:16px;padding:24px;margin:24px 0;grid-column:1/-1';
 panel.innerHTML=`<h2>每日饮食记录</h2><p style="font-size:13px;color:#74806b">先在计算器里配好食材，再选择日期和餐次保存。保存的是当时的快照；同一天同一餐再次保存会替换原记录。</p><div style="display:flex;flex-wrap:wrap;gap:12px;align-items:end"><label>记录日期<input id="diary-date" type="date" style="display:block;width:160px"></label><label>餐次<select id="diary-meal" style="display:block"><option>早餐</option><option>午餐</option><option>晚餐</option><option>加餐</option></select></label><label>这次吃了几份<input id="diary-eaten" type="number" min="0.1" step="any" value="1" style="display:block;width:110px"></label><button id="diary-save" style="background:#395d3d;color:white;border:0;border-radius:8px;padding:12px;cursor:pointer">保存这餐</button></div><p style="font-size:12px;color:#74806b">例如整锅分为 2 份、你吃了 1 份：这里填 1，只记录整锅一半的热量。</p><p id="diary-message" role="status"></p><div style="background:#e5edd9;padding:18px;border-radius:12px"><b id="diary-total"></b><p id="diary-count" style="margin-bottom:0;font-size:12px"></p></div><div id="diary-records"></div><p style="font-size:12px;color:#74806b">点击日期可查看过去的记录。数据只存于当前浏览器；清除浏览器数据或换设备后不会自动同步。当天合计仅包含已保存餐次。</p>`;
 document.querySelector('main').append(panel);
 const q=id=>document.getElementById(id);
 q('diary-date').value=dateString;
 let records={};let storageAvailable=true;
 try{const parsed=JSON.parse(localStorage.getItem(storageKey)||'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))records=parsed;}catch{storageAvailable=false;}
 const meals=['早餐','午餐','晚餐','加餐'];
 const range=(a,b)=>`${Math.floor(a+1e-9)}–${Math.ceil(b-1e-9)} 千卡`;
 function validRecord(r){return r&&Number.isFinite(r.min)&&Number.isFinite(r.max)&&r.min>=0&&r.max>=r.min&&typeof r.summary==='string';}
 function persist(next){try{localStorage.setItem(storageKey,JSON.stringify(next));records=next;return true;}catch{q('diary-message').textContent='保存失败：浏览器本地存储不可用或已满。原记录未改变。';return false;}}
 function draw(){
  const day=records[q('diary-date').value]||{};let low=0,high=0,count=0;
  q('diary-records').replaceChildren();
  meals.forEach(meal=>{
   const record=day[meal];const row=document.createElement('div');row.style.cssText='border-bottom:1px solid #e3e8dc;padding:16px 0';
   const title=document.createElement('strong');title.textContent=meal;row.append(title);
   if(validRecord(record)){
    count++;low+=record.min;high+=record.max;
    const calories=document.createElement('span');calories.textContent=' · '+range(record.min,record.max);row.append(calories);
    const detail=document.createElement('p');detail.style.cssText='font-size:12px;color:#74806b;line-height:1.8';detail.textContent=record.summary;row.append(detail);
    const remove=document.createElement('button');remove.textContent='删除这餐';remove.style.cssText='font-size:12px;cursor:pointer';
    remove.onclick=()=>{if(!confirm(`删除 ${q('diary-date').value} 的${meal}记录？`))return;const next=JSON.parse(JSON.stringify(records));delete next[q('diary-date').value][meal];if(!Object.keys(next[q('diary-date').value]).length)delete next[q('diary-date').value];if(persist(next)){q('diary-message').textContent='已删除，今日合计已更新。';draw();}};row.append(remove);
   }else{const empty=document.createElement('span');empty.style.color='#8c9682';empty.textContent=' · 未记录';row.append(empty);}
   q('diary-records').append(row);
  });
  q('diary-total').textContent=`${q('diary-date').value||'请选择日期'} · 当天总热量：${range(low,high)}`;
  q('diary-count').textContent=`已记录 ${count} 餐（含加餐）。未记录的餐次未计入。`;
 }
 q('diary-date').onchange=()=>{q('diary-message').textContent='';draw();};
 q('diary-save').onclick=()=>{
  try{
   const date=q('diary-date').value,meal=q('diary-meal').value,eaten=Number(q('diary-eaten').value);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('请先选择日期。');
   const snapshot=typeof window.getMealSnapshot==='function'?window.getMealSnapshot():{items,servings:Number(document.getElementById('servings').value),retention:Number(document.getElementById('oil').value)};
   if(!Array.isArray(snapshot.items)||!snapshot.items.length)throw Error('请先在上方添加食材。');
   if(!Number.isFinite(eaten)||eaten<=0||!Number.isFinite(snapshot.servings)||snapshot.servings<=0||eaten>snapshot.servings)throw Error('吃下的份数须大于 0，且不能超过计算器中的总份数。');
   if(!Number.isFinite(snapshot.retention)||snapshot.retention<0||snapshot.retention>1)throw Error('请检查油摄入比例。');
   let min=0,max=0,totalGrams=0;const summary=[];
   for(const item of snapshot.items){
    if(![item.grams,item.low,item.high].every(Number.isFinite)||item.grams<0||item.low<0||item.high<item.low)throw Error('请先修正食材重量和热量范围。');
    totalGrams+=item.grams;const ratio=eaten/snapshot.servings;
    const factor=item.isOil?snapshot.retention:1;
    min+=item.grams*item.low/100*factor*ratio;max+=item.grams*item.high/100*factor*ratio;
    summary.push(`${item.name} ${Number((item.grams*ratio).toFixed(1))}g`);
   }
   if(totalGrams<=0)throw Error('请添加大于 0 克的食材。');
   if(records[date]&&records[date][meal]&&!confirm(`${date} 的${meal}已有记录，替换吗？`))return;
   const next=JSON.parse(JSON.stringify(records));next[date]||={};
   next[date][meal]={min,max,summary:`吃了 ${eaten} / ${snapshot.servings} 份 · ${summary.join('、')} · 用油摄入比例 ${Math.round(snapshot.retention*100)}%`};
   if(persist(next)){q('diary-message').textContent=`已保存 ${date} 的${meal}。`;draw();}
  }catch(error){q('diary-message').textContent=error.message;}
 };
 if(!storageAvailable)q('diary-message').textContent='无法读取本地记录；请检查浏览器是否允许本地存储。';
 draw();
})();
