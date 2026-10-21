// 常见食品每100克可食部的参考范围（千卡）；品牌标签优先。
export const foods = [
 ['蚝油','调料',50,120],['香油','调料',880,900],['醋','调料',10,35],['油','调料',880,900],['盐','调料',0,0],['酱油','调料',30,80],['单山蘸水','调料',180,330],['甜辣酱','调料',150,250],
 ['鸡胸肉','蛋白质',105,135],['鸡腿肉（去骨）','蛋白质',130,200],['鸡蛋（去壳）','蛋白质',135,155],['豆腐','蛋白质',55,110],['鸡肉肠','蛋白质',120,240],
 ['白菜','蔬菜',12,20],['娃娃菜','蔬菜',12,22],['黄瓜','蔬菜',12,18],['上海青','蔬菜',12,22],
 ['土豆','碳水',70,90],['米饭','碳水',110,140,'熟重'],['牛肉饺子','碳水',180,260],['牛奶吐司','碳水',260,330,'成品'],['乌冬面','碳水',100,150,'湿面'],['面食（干面条）','碳水',340,370,'干重'],['麦片','碳水',350,410,'干重'],
 ['巴旦木','脂肪',570,640],['核桃','脂肪',630,700],['南瓜籽（去壳）','脂肪',540,620],['奇亚籽','脂肪',450,510]
].map(([name,category,min,max,basis='生重'])=>({name,category,min,max,basis}));
export function calculate(items, servings=1, cookedWeight=0, retention=1) {
 if(!Number.isFinite(servings)||servings<=0) throw Error('份数必须大于0');
 let min=0,max=0;
 const rows=items.map(item=>{
 const {grams,low,high,isOil=false}=item;
 if(![grams,low,high].every(Number.isFinite)||grams<0||low<0||high<low) throw Error('请填写有效重量与热量范围');
 const factor=isOil?retention:1;
 if(!Number.isFinite(factor)||factor<0||factor>1) throw Error('用油摄入比例须在0到1之间');
 const row={min:grams*low/100*factor,max:grams*high/100*factor};min+=row.min;max+=row.max;return row;
 });
 return {min,max,rows,perServing:[min/servings,max/servings],per100:cookedWeight>0?[min/cookedWeight*100,max/cookedWeight*100]:null};
}
