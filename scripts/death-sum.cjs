const fs=require('fs');const L=process.argv.slice(2).map(f=>JSON.parse(fs.readFileSync(f,'utf8')));
const T={};let ext=0,pop=0,lows=[],life=0,d=0;for(const x of L){for(const k in x.T)T[k]=(T[k]||0)+x.T[k];ext+=x.ext;pop+=x.avgPop;lows.push(...x.lows);life+=x.lifeUsed*x.deaths;d+=x.deaths;}
lows.sort((a,b)=>a-b);const pct={};for(const k in T)pct[k]=Math.round(100*T[k]/d)+'%';
console.log(JSON.stringify({deathCauses:pct,deaths:d,extinct:ext,avgPop:Math.round(pop/L.length),lowestPopMedian:lows[lows.length>>1],worstLow:lows[0],shareOfLifespanLived:+(life/d).toFixed(3)}));
