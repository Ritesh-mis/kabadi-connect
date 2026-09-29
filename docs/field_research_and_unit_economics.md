# Field Research & Unit Economics - KabadiConnect

> **Status of evidence.** Everything marked **[FILL]** must come from your own visits. Figures marked *assumption* are model inputs, not findings. Do not present them as measured facts to the jury.

## Part A - Field research

### A1. Goal
Test three things with working collectors/aggregators: (1) the price gap between what they get now and what an authorized recycler offers, (2) whether the app is usable by them unaided, (3) what stops them using the formal route today.

### A2. Sample (minimum 2; aim for 3-4)
| ID | Type | Area | Approx. kg/month | Phone (model, Android ver, data plan) | Reads Marathi / Hindi / neither |
|---|---|---|---|---|---|
| F1 | Waste-picker / kabadiwala | [FILL] | [FILL] | [FILL] | [FILL] |
| F2 | Local aggregator | [FILL] | [FILL] | [FILL] | [FILL] |
Also interview **one authorized recycler** (rate card, pickup policy, what documents they need from collectors).

### A3. Consent and privacy
Explain purpose in the collector's language; get verbal consent (record on the sheet). Note first name/ID only, no phone numbers or Aadhaar. Photograph scrap, not faces. Say clearly that this is a student prototype and no payment is promised.

### A4. Interview guide (30 min, in Marathi/Hindi)
1. What do you collect? Which items pay best? Which do you avoid, and why?
2. Last 5 sales: item, kg, who bought, price per kg, paid cash or later? **[FILL table B1]**
3. Who sets the price? Do you know the rate elsewhere? How do you find out?
4. What do you do with items you cannot sell (PCBs, batteries, CRTs)? Do you burn, open or acid-treat anything? (ask without judgement)
5. Have you heard of authorized recyclers? Why haven't you sold to one? (distance, minimum quantity, paperwork, trust, payment delay)
6. Monthly volume, trips, transport cost, days-to-payment.
7. What would make you switch: higher price, pickup, instant cash, a receipt?

### B1. Price comparison sheet (this fills the key assumption)
Collect a **same-day, same-item** comparison. For each item, record the dealer's price and get a real quote from an authorized recycler (phone call is enough).
| Date | Item | kg | Dealer price/kg | Recycler quote/kg | App board price/kg | Realization = dealer / recycler |
|---|---|---|---|---|---|---|
| [FILL] | copper cable | | | | | |
| [FILL] | PCB | | | | | |
| [FILL] | Li battery | | | | | |
**Result to report:** average realization = [FILL]% (model uses 70% as an *assumption*; 60% and 80% are tested below).

### B2. Usability test (each collector, unaided, think-aloud)
Tasks: (T1) hear today's copper price, (T2) create a lot with photo + weight, (T3) pick a recycler and get the handover reference, (T4) find the safety warning for batteries, (T5) create a lot with airplane mode on.
| Task | Completed unaided? (Y/N) | Time (s) | Errors/help needed | Quote or observation |
|---|---|---|---|---|
| T1-T5 | [FILL] | [FILL] | [FILL] | [FILL] |
Suggested targets: >=4 of 5 tasks unaided; T2 under 90 s; report failures honestly and what you changed after them.

### B3. Photo collection for the classifier
Photograph 30-50 items per category (cables, PCBs, batteries, motors, mobiles, LCD, CRT, plastics) in the collector's real lighting/backgrounds. Save into `ml/dataset/<category_id>/` and run `python ml/train.py`. Report the resulting accuracy and dataset size.

### B4. Findings summary (write after visits)
Barriers ranked: [FILL]. Price gap measured: [FILL]. Usability changes made: [FILL]. Quotes: [FILL].

---

## Part C - Unit economics (per collector, per month)

### C1. Inputs
| Input | Value | Basis |
|---|---|---|
| Volume | 100 kg/month | *assumption* - replace with F1/F2 volume |
| Blended fair price | Rs 193/kg | Prototype price board x assumed weight mix: cables 20%, PCB 10%, Li batteries 10%, motors 15%, mixed plastics 45% (614/375/116/89/18 Rs/kg). *Assumption* - replace with the real basket |
| Informal realization | 70% of fair price | *assumption* - measure in B1 |
| Formal realization | 100% of recycler offer | recycler rate card |
| Extra transport to recycler | Rs 200/month (2 trips), Rs 0 with pickup | *assumption* |

### C2. Collector earnings
| Scenario (informal realization) | Today | With platform | Gross uplift | Net of transport | Uplift % |
|---|---|---|---|---|---|
| Pessimistic 80% | Rs 15,440 | Rs 19,300 | Rs 3,860 | Rs 3,660 | +25% |
| **Base 70%** | **Rs 13,510** | **Rs 19,300** | **Rs 5,790** | **Rs 5,590** | **+43%** |
| Optimistic 60% | Rs 11,580 | Rs 19,300 | Rs 7,720 | Rs 7,520 | +67% |
Other benefits not priced: faster/certain cash, a receipt and earnings history, safer handling. The uplift only exists if recyclers really pay near list price and B1 confirms the gap.

### C3. Why the recycler pays (platform buyer side)
Recyclers get traceable, documented material (helps their EPR record-keeping under the E-Waste (Management) Rules, 2022), and buy directly instead of through 1-2 middlemen. The 30% gap in the base case is the pool from which a 3-5% platform fee is funded. **Confirm with your recycler interview that they accept a fee.**

### C4. Platform sustainability
Revenue: fee on each completed, recycler-confirmed handover (charged to the recycler, never the collector); optional recycler subscription for lead access (*assumption* Rs 2,000/month each).
Cost: fixed Rs 1,20,000/month (2 field onboarding staff Rs 70,000, cloud+SMS Rs 15,000, support/compliance Rs 35,000 - *assumption*); variable Rs 30/collector/month.

| Fee | Contribution/collector/month | Recyclers on subscription | Break-even active collectors |
|---|---|---|---|
| 3% | Rs 549 | 5 / 10 / 20 | 200 / 182 / 146 |
| 5% | Rs 935 | 5 / 10 / 20 | 117 / 107 / 86 |
Reading: roughly 100-200 active collectors in one city sustain the pilot. Early phase can run on grant/CSR/EPR-producer funding; producers and PROs may also pay for verified collection data.

### C5. Risks
Recyclers may not pay list price to small lots (mitigate: aggregator hubs, minimum-lot bundling); collectors may bypass the platform after first introduction (mitigate: value of ledger/receipts and price board, fee only on confirmed deals); price data can be gamed (anomaly checks + recycler confirmation already in backend).

*Live model:* `GET /api/economics?kg_month=100&informal=0.7&fee=0.03&price=193&trip_cost=200` (the app's Earnings tab uses it; it shows earnings after transport, so 19,100 and +41% rather than the gross 19,300 / +43%).
