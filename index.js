var unitMode = 'cm';

function setUnit(u) {
    unitMode = u;
    document.getElementById("h-cm").classList.toggle("on", u === "cm");
    document.getElementById("h-ft").classList.toggle("on", u === "ft");

    document.getElementById("height-cm").style.display = u === "cm" ? "block" : "none";
    document.getElementById("wrapper").style.display = u === "ft" ? "flex" : "none";
}

var BIRTH_FREQ = [0.94, 0.88, 0.96, 0.97, 1.0, 1.0, 1.04, 1.09, 1.03, 0.96, 0.95, 0.9];
var MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

fetch("countries.csv")
  .then(r => r.text())
  .then(text => {
    const rows = text.trim().split("\n").slice(1);
    window.COUNTRIES = rows.map(r => {
      const cols = r.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
      const [n, c, p, mm, ms, fm, fs] = cols.map(v => v.replace(/^"|"$/g, ''));
      return [n, c, +p, +mm, +ms, +fm, +fs];
    });
    
    var select = document.getElementById('country');
    COUNTRIES.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c[1];
      opt.textContent = c[0];
      select.appendChild(opt);
    });
    select.value = 'global';
  });

function getHeightCm(){
    if(unitMode === 'cm'){
        var v = parseFloat(document.getElementById('height-cm').value);
        return (isFinite(v) && v > 50) ? v : null;
    }
    var ft = parseFloat(document.getElementById('height-ft').value) || 0;
    var ins = parseFloat(document.getElementById('height-in').value) || 0;
    var cm = ft * 30.48 + ins * 2.54;
    return cm > 50 ? cm : null;
}

function formatBig(n){
    n = Math.round(n);
    if(n >= 1e9)
        return (n/1e9).toFixed(2) + ' billion';
    if(n >= 1e6)
        return (n/1e6).toFixed(2) + ' million';

    return n.toLocaleString('en-US');
}

function formatShort(n){
    n = Math.round(n);
    if(n >= 1e9)
        return (n/1e9).toFixed(2) + 'B';
    if(n >= 1e6)
        return (n/1e6).toFixed(2) + 'M';
    if(n >= 1000)
        return (n/1000).toFixed(2) + 'K';

    return n.toString();
}

function formatProb(p){
    const percent = p * 100;

    if (percent >= 10)
        return percent.toFixed(1) + '%';

    if (percent >= 1)
        return percent.toFixed(2) + '%';

    if (percent >= 0.01)
        return percent.toFixed(4) + '%';

    if (percent >= 0.0001)
        return percent.toFixed(6) + '%';

    return percent.toFixed(8) + '%';
}

function formatOneIn(n){
    n = Math.round(n);
    if(n>= 1e9)
        return (n/1e9).toFixed(1) + ' billion';
    if( n >= 1e6)
        return (n/1e6).toFixed(1) + ' million';

    return n.toLocaleString('en-US');
}

function normCDF(z){
    var t = 1 / (1 + 0.2316419 * Math.abs(z));
    var poly = t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    var pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    var p = 1 - pdf * poly;
    return z >= 0 ? p : 1 - p;
}

function twoTailExtreme(z){
    return 2 * (1 - normCDF(Math.abs(z)));
}

function normPDF(z){
    return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

function makeBirthdayChart(mIdx){
    var wrap = document.createElement('div');
    wrap.className = 'bar-chart-wrap';
    var chart = document.createElement('div');
    chart.className = 'bar-chart';
    var maxF = Math.max.apply(null, BIRTH_FREQ);

    BIRTH_FREQ.forEach(function(v, i) {
        var bar = document.createElement('div');
        bar.className = 'bar' + (i === mIdx ? ' hi' : '');
        bar.style.height = Math.round((v / maxF) * 52) + 'px';
        var lbl = document.createElement('span');
        lbl.className = 'bar-lbl';
        lbl.textContent = MONTH_FULL[i];
        bar.appendChild(lbl);
        chart.appendChild(bar);
    });

    wrap.appendChild(chart);
    return wrap;
}

function makeHeightChart(heightCm, mean, sd){
    var canvas = document.createElement('canvas');
    var W = 560, H = 110;
    canvas.width = W;
    canvas.height = H;
    canvas.style.maxWidth = '100%';

    setTimeout(function() {
        var ctx = canvas.getContext('2d');
        var zRange = 3.8;
        var z = (heightCm - mean) / sd;
        var zClamped = Math.max(-zRange, Math.min(zRange, z));
        var absZ = Math.abs(zClamped);

        function xZ(zv){
            return ((zv + zRange) / (2 * zRange)) * W;
        }
        var peakPDF = normPDF(0);
        function yP(pv) {
            return H - 14 - (pv / peakPDF) * (H - 26);
        }

        ctx.fillStyle = 'rgba(184, 74, 14, 0.12)';
        
        ctx.beginPath();
        ctx.moveTo(xZ(-zRange), H - 14);
        for(var zv = -zRange; zv <= -absZ + 0.01; zv += 0.04){
            ctx.lineTo(xZ(zv), yP(normPDF(zv)));
        }
        ctx.lineTo(xZ(-absZ), H - 14);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(xZ(absZ), H - 14);
        for(var zv2 = absZ; zv2 <= zRange; zv2 += 0.04) { 
            ctx.lineTo(xZ(zv2), yP(normPDF(zv2)));
        }
        ctx.lineTo(xZ(zRange), H - 14);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#d0cdc5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, H - 14);
        ctx.lineTo(W, H - 14);
        ctx.stroke();

        ctx.strokeStyle = '#4a4740';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (var zv3 = -zRange; zv3 <= zRange; zv3 += 0.04) {
            var x = xZ(zv3), y = yP(normPDF(zv3));
            if(zv3 === -zRange)
                ctx.moveTo(x, y);
            else
                ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#b8b4ab';
        ctx.strokeWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xZ(0), H - 14);
        ctx.lineTo(xZ(0), 6);
        ctx.stroke();
        ctx.setLineDash([]);

        var ux = xZ(zClamped);
        ctx.strokeStyle = '#b84a0e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ux, H - 14);
        ctx.lineTo(ux, yP(normPDF(zClamped)));
        ctx.stroke();

        ctx.font = '10px Courier New, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8a877f';
        ctx.fillText(Math.round(mean) + ' cm', xZ(0), H - 2);

        var hDisp = unitMode === 'ft'
            ? Math.floor(heightCm / 30.48) + "'" + Math.round((heightCm / 2.54) % 12) + '"'
            : Math.round(heightCm) + ' cm';
        ctx.fillStyle = '#b84a0e';
        var labelX = Math.min(W - 32, Math.max(32, ux));
        var labelY = H - 2;

        ctx.fillText('you: ' + hDisp, labelX, labelY);

        ctx.fillStyle = '#c0bdb5';
        ctx.font = '9px Courier New, monospace';
        [-2, -1, 1, 2].forEach(function(sv){
            if(Math.abs(sv) <= zRange - 0.5){
                ctx.fillText((sv > 0 ? '+' : '') + sv + 'SD', xZ(sv), H - 2);
            }
        });
    }, 60);

    var wrap = document.createElement('div');
    wrap.className = 'bell-wrap';
    wrap.appendChild(canvas);
    return wrap;
}

function makeHandChart(hand){
    var data = [
        { label: 'Right-handed', pct: 89, key: 'right'        },
        { label: 'Left-handed',  pct: 10, key: 'left'         },
        { label: 'Ambidextrous', pct:  1, key: 'ambidextrous' }
    ];
    var wrap = document.createElement('div');
    wrap.className = 'hand-bars';
    data.forEach(function(d) {
        var row = document.createElement('div');
        row.className = 'hb-row';
        var isUser = d.key === hand;
        row.innerHTML = 
            '<span class="hb-lbl">' + (isUser ? '<strong>' + d.label + '</strong>' : d.label) + '</span>' +
            '<div class="hb-track"><div class="hb-fill' + (isUser ? ' hi' : '') + '" style="width:' + d.pct + '%"></div></div>' +
            '<span class="hb-pct">' + d.pct + '%</span>';
        wrap.appendChild(row);
    });
    return wrap;
}

function calculate(){
    var birthdayval = document.getElementById('birdthday').value;
    var heightCm = getHeightCm();
    var gender = document.querySelector('input[name="gender"]:checked').value;
    var hand = document.querySelector('input[name="hand"]:checked').value;
    var cCode = document.getElementById('country').value;
    var cRow = COUNTRIES.filter(function(c){
        return c[1]===cCode;
    })[0] || COUNTRIES[0];
    
    var cName = cRow[0], pop = cRow[2];
    var mMean = cRow[3], mSD = cRow[4], fMean = cRow[5], fSD = cRow[6];
    var hMean = gender === 'male' ? mMean : gender === 'female'? fMean : (mMean + fMean) / 2;
    var hSD = gender === 'male' ? mSD : gender === 'female' ? fSD : (mSD + fSD) / 2;

    var prob = 1.0;
    var steps = [];
    var cards = [];

    var genderProb = gender === 'male' ? 0.503 : 0.497;
    prob *= genderProb;
    var genderLabel = gender === 'male' ? 'Male' : 'Female';
    steps.push({ trait: 'Gender', desc: genderLabel, p: genderProb, running: prob });
    cards.push({
        trait: 'Gender', value: genderLabel, prob: genderProb,
        desc: 'Roughly half the world is ' + genderLabel.toLowerCase() + ' (' + formatProb(genderProb) + '). Gender is not a rarity trait but it is a population split that sets your reference group and narrows the pool. Your height distribution is now calculated against ' + (gender === 'male' ? 'male' : 'female') + ' norms for ' + cName + '.',
        chartFn: null
    });

    if (birthdayval){
        var d = new Date(birthdayval + 'T00:00:00');
        var mIdx = d.getMonth();
        var dayN = d.getDate();
        var totalFreq = BIRTH_FREQ.reduce(function(a,b){
            return a+b;
        }, 0);

        var monthShare = BIRTH_FREQ[mIdx] / totalFreq;
        var daysInMonth = new Date(2000, mIdx + 1, 0).getDate();
        var birthdayProb = monthShare / daysInMonth;

        prob *= birthdayProb;
        steps.push({trait: 'Birthday', desc:MONTH_FULL[mIdx] + ' ' + dayN, p: birthdayProb, running: prob});
        
        var relPct = ((BIRTH_FREQ[mIdx] / (totalFreq / 12)) * 100).toFixed(1);
        var monthAdj = BIRTH_FREQ[mIdx] > 1.02 ? 'a more common birth month'
                    : BIRTH_FREQ[mIdx] < 0.96 ? 'a less common birth month'
                    : 'a near-average birth month';
        cards.push({
            trait: 'Birthday', value: MONTH_FULL[mIdx] + ' ' + dayN, prob: birthdayProb,
            desc: MONTH_FULL[mIdx] + ' is ' + monthAdj + ', ' + relPct + '% of the monthly average birth rate. Births peak in late summer and autumn globally (Aug/Sep) due to seasonal conception patterns, and dip in winter (Feb). Being born in a high-frequency month makes your birth month slightly less rare. The specific day (' + dayN + ') is assumed uniformly distributed across the ' + daysInMonth + ' days of ' + MONTH_FULL[mIdx] + ', contributing 1/' + daysInMonth + ' to the monthly probability. The highlighted bar in the chart below is your birth month.',
            chartFn: function(mi){
                return function(){
                    return makeBirthdayChart(mi);
                };
            }(mIdx)
        });
    }

    if(heightCm !== null){
        var z = (heightCm - hMean) / hSD;
        var hProb = twoTailExtreme(z);
        prob *= hProb;

        var hDisp = unitMode === 'ft'
            ? Math.floor(heightCm / 30.48) + "'" + Math.round((heightCm / 2.54) % 12) + '"'
            : Math.round(heightCm) + ' cm';
        var pctile = Math.round(normCDF(z) * 100);
        var dir = z > 0 ? 'taller' : 'shorter';
        var rareAdj = hProb < 0.05 ? 'very rare'
                    : hProb < 0.16 ? 'uncommon'
                    : hProb < 0.32 ? 'slightly below average frequency'
                    : 'close to average (common)';
        steps.push({trait: 'Height', desc: hDisp + ' (z=' + z.toFixed(2) + ')', p: hProb, running: prob });
        
        var capturedHDisp = hDisp;
        var capturedZ = z.toFixed(2);
        cards.push({
            trait: 'Height', value: hDisp, prob: hProb,
            desc: 'In ' + cName + ', the average height is ' + Math.round(hMean) + ' cm (SD ' + hSD + ' cm). You are ' + capturedHDisp + ', ' + Math.abs(z).toFixed(1) + ' standard deviations ' + dir + ' than average (z = ' + capturedZ + '), at the ' + pctile + 'th percentile. ' + formatProb(hProb) + ' of people are at least this far from the mean, making your height ' + rareAdj + '. Crucially: both unusually tall and unusually short people are rare; only average height is common. The shaded area on the curve shows the population fraction matching your extremity.',
            chartFn: (function(h, m, s){ return function(){ return makeHeightChart(h, m, s); }; })(heightCm, hMean, hSD)
        });
    }

    var handProb = hand === 'right' ? 0.89 : hand === 'left' ? 0.1 : 0.01;
    var handLabel = hand === 'right' ? 'Right-handed' : hand === 'left' ? 'Left-handed' : 'Ambidextrous';
    prob *= handProb;
    steps.push({
        trait: 'Handedness', desc: handLabel, p: handProb, running: prob
    });
    cards.push({
        trait: 'Handedness', value: handLabel, prob: handProb,
        desc: hand === 'right'
            ? 'About 89% of people are right-handed. The overwhelming majority globally. This is the most common handedness and adds very little to your profile. The bar chart reflects population shares.'
            : hand === 'left'
            ? 'About 10% of people are left-handed. Despite being a clear minority, left-handedness is well established in the population and moderately contributes to your rarity.'
            : 'Only about 1% of people are genuinely ambidextrous, able to use both hands with equal skill. This is a very rare trait and adds much more rarity to you.',
            chartFn: (function(h){
                return function(){
                    return makeHandChart(h);
                }; 
            })(hand)
    });

    var WorldPopulation = 8100000000;
    cards.push({
        trait: 'Country / Region', value: cName, prob: null,
        desc: cName + ' has a population of ' + formatBig(pop) + ' (' + ((pop/WorldPopulation)* 100).toFixed(2) + '% of the world). Your country does not directly multiply into the rarity, but is just used as a refrence. The final estimated match count is: combined probability × ' + formatBig(pop) + '.',
        chartFn: null
    });
    
    var estimate = Math.max(1, prob * pop);
    var oneIn = prob > 0 ? 1 / prob : Infinity;
    var rarityPct = Math.min(99, Math.max(1, (Math.log10(Math.max(oneIn, 2)) / Math.log10(pop)) * 100));

    // RENDER FUNCTION
    render({cName: cName, pop: pop, prob: prob, estimate: estimate, oneIn, rarityPct: rarityPct, steps: steps, cards: cards})
}

function render(o){
    document.getElementById('form').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    document.getElementById('r-onein').textContent = '1 in ' +formatOneIn(o.oneIn);
    document.getElementById('r-sub').textContent =
    'Estimated ' + Math.round(o.estimate).toLocaleString('en-US') +
    ' people in ' + o.cName + ' share your exact combination of traits (' +
    formatProb(o.prob) + ' of the population).';

    setTimeout(function(){
        document.getElementById('meter').style.width = o.rarityPct + '%';
    }, 80);
    document.getElementById('meter-note').textContent = 'Rarer than ' + o.rarityPct.toFixed(0) + '% of all possible profiles (log scale)';

    document.getElementById('sc-pop').textContent = formatShort(o.pop);
    document.getElementById('sc-prob').textContent = formatProb(o.prob);
    document.getElementById('sc-match').textContent = formatShort(o.estimate);

    var cardsEl = document.getElementById('trait-cards');
    cardsEl.innerHTML = '';
    o.cards.forEach(function(c){
        var card = document.createElement('div');
        card.className = 'tc';

        var head = document.createElement('div');
        head.className = 'tc-head';
        head.innerHTML = 
            '<span class="tc-name">' + c.trait + '</span>' +
            '<span class="tc-value">' + c.value + '</span>' +
            (c.prob !== null ? '<span class="tc-prob">' + formatProb(c.prob) + ' share this</span>' : '');
        card.appendChild(head);

        var desc = document.createElement('p');
        desc.className = 'tc-desc';
        desc.textContent = c.desc;
        card.appendChild(desc);

        if(c.chartFn){
            var cw = document.createElement('div');
            cw.className = 'tc-chart';
            cw.appendChild(c.chartFn());
            card.appendChild(cw);
        }
        cardsEl.appendChild(card);
    });

    var chainEl = document.getElementById('chain-rows');
    chainEl.innerHTML = '';
    o.steps.forEach(function(s) {
        var row = document.createElement('div');
        row.className = 'chain-row';
        row.innerHTML =
            '<span class="cr-trait"><strong>' + s.trait + '</strong>, ' + s.desc + '</span>' +
            '<span class="cr-p">' + formatProb(s.p) + '</span>' +
            '<span class="cr-run">running: ' + formatProb(s.running) + '</span>';
        chainEl.appendChild(row);
    });
    document.getElementById('chain-box').style.display = 'block';
    
}

function retry(){
    document.getElementById('results').style.display = 'none';
    document.getElementById('form').style.display = 'block';
    document.getElementById('meter').style.width = '0%';
    window.scrollTo({top:0});
}