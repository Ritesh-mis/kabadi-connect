import { db } from "./db.js";
const cats = [
 ["copper_cable","Copper cables","Insulated copper wire","तांब्याच्या तारा","तांबे की केबल","kg","Never burn cables - toxic smoke"],
 ["li_battery","Lithium batteries","Li-ion cells/packs","लिथियम बॅटरी","लिथियम बैटरी","kg","Do not open or puncture - fire risk"],
 ["pcb","Printed circuit boards","Mixed PCB","सर्किट बोर्ड","सर्किट बोर्ड","kg","No acid leaching or desoldering fumes"],
 ["mobile","Mobile phones","Feature/smart phones","मोबाईल फोन","मोबाइल फोन","pc","Remove battery, keep intact"],
 ["crt","CRT monitors/TVs","CRT","सीआरटी टीव्ही","सीआरटी टीवी","pc","Leaded glass - never break the tube"],
 ["lcd","LCD panels","LCD/LED panel","एलसीडी पॅनल","एलसीडी पैनल","pc","Contains mercury backlight - keep whole"],
 ["motor_magnet","Motors & magnet assemblies","Motor/HDD magnets","मोटर व चुंबक","मोटर और चुंबक","kg","Keep magnets away from electronics"],
 ["mixed_plastic","Mixed plastics","E-waste casings","मिश्र प्लास्टिक","मिश्रित प्लास्टिक","kg","Do not burn plastic"]];
const base = {copper_cable:642,li_battery:118,pcb:386,mobile:74,crt:150,lcd:210,motor_magnet:95,mixed_plastic:18};
const locs = {Pune:[18.5204,73.8567],Mumbai:[19.076,72.8777],Nashik:[19.9975,73.7898]};
const rec = [
 ["r1","GreenCycle Pune","Pune",18.5314,73.8446,"copper_cable,pcb,li_battery,mobile,lcd,motor_magnet","MH/EW/2023/0142","active","9800000001",1,15,4.9,"1111",1.04],
 ["r2","EcoMetals Recovery","Pune",18.5793,73.9089,"copper_cable,pcb,mobile,crt,mixed_plastic","MH/EW/2022/0089","active","9800000002",1,20,4.7,"2222",1.01],
 ["r3","Sahyadri E-Waste","Pune",18.4575,73.8508,"copper_cable,pcb,li_battery,lcd,crt,motor_magnet,mixed_plastic","MH/EW/2021/0033","active","9800000003",0,25,4.8,"3333",1.0],
 ["r4","Mumbai MetalRec","Mumbai",19.11,72.87,"copper_cable,pcb,li_battery,mobile","MH/EW/2023/0201","active","9800000004",1,20,4.5,"4444",1.06],
 ["r5","Nashik Urban Mining","Nashik",20.0,73.78,"copper_cable,pcb,motor_magnet","MH/EW/2020/0007","suspended","9800000005",1,15,3.9,"5555",1.1]];
db.transaction(() => {
 for (const t of ["handovers","lots","categories","recyclers","recycler_rates","prices","collectors"]) db.prepare(`DELETE FROM ${t}`).run();
 db.prepare("INSERT INTO collectors(id,name,language,area) VALUES('c1','Raju Kadam','English','Pune')").run();
 const ic = db.prepare("INSERT INTO categories(id,name,sub_category,local_mr,local_hi,unit,hazard) VALUES(?,?,?,?,?,?,?)");
 cats.forEach(c => ic.run(c[0],c[1],c[2],c[3],c[4],c[5],c[6]));
 const ir = db.prepare("INSERT INTO recyclers VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)");
 const irr = db.prepare("INSERT INTO recycler_rates(recycler_id,category_id,rate) VALUES(?,?,?)");
 const ip = db.prepare("INSERT INTO prices(category_id,location,date,buy_price,quoted_price,range_low,range_high,unit,recycler_id) VALUES(?,?,?,?,?,?,?,?,?)");
 let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
 for (const r of rec) {
  const f = r.pop(); ir.run(...r);
  for (const m of r[5].split(",")) irr.run(r[0], m, Math.round(base[m] * f));
 }
 // 60 days of synthetic history per category/city (documented as synthetic seed data)
 for (const [city, mult] of [["Pune",1],["Mumbai",1.05],["Nashik",0.95]]) for (const c of cats) for (let d = 60; d >= 0; d--) {
  const date = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
  const drift = 1 + (60 - d) * 0.0008 + (rnd() - 0.5) * 0.05;
  const buy = Math.round(base[c[0]] * mult * drift * 0.92), q = Math.round(buy * 1.08);
  ip.run(c[0], city, date, buy, q, Math.round(buy * 0.9), Math.round(buy * 1.12), c[5], null);
 }
})();
console.log("Seeded.");
// demo history so the dashboard is not empty
const il = db.prepare("INSERT INTO lots(id,collector_id,category_id,weight_kg,est_value,quoted_price,final_value,location,collected_at,recycler_id,payment_status,payment_mode,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)");
[["LOT-D0001","copper_cable",5,3210,3340,3210,"r1","paid","completed"],["LOT-D0002","pcb",12,2450,2450,null,"r2","pending","handover_pending"],["LOT-D0003","li_battery",8,944,null,null,null,"none","draft"]]
 .forEach((r,i)=>il.run(r[0],"c1",r[1],r[2],r[3],r[4],r[5],"Pune",new Date(Date.now()-i*864e5).toISOString(),r[6],r[7],r[7]==="paid"?"cash":null,r[8]));
