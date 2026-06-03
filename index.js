var unitMode = 'cm';

function setUnit(u) {
    unitMode = u;
    document.getElementById("h-cm").classList.toggle("on", u === "cm");
    document.getElementById("h-ft").classList.toggle("on", u === "ft");

    document.getElementById("height-cm").style.display = u === "cm" ? "block" : "none";
    document.getElementById("wrapper").style.display = u === "ft" ? "flex" : "none";
}

var BIRTH_FREQ = [0.94, 0.88, 0.96, 0.97, 1.0, 1.0, 1.04, 1.09, 1.03, 0.96, 0.95];
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
    if(Unitmode === 'cm'){
        var v = parseFloat(document.getElementById('h-cm').value);
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
    if (p >= 0.1)
        return (p*100).toFixed(1) + '%';
    if (p >= 0.001)
        return (p*100).toFixed(2) + '%';

    return (p*100).toExponential(2) + '%';
}

function formatOneIn(n){
    n = Math.round(n);
    if(n>= 1e9)
        return (n/1e9).toFixed(1) + ' billion';
    if( n >= 1e6)
        return (n/1e6).toFixed(1) + ' million';

    return n.toLocaleString('en-US');
}

function twoTailExtreme(z){
    return 2 * (1 - normCDF(Math.abs(z)));
}

function normPDF(z){
    return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
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
    var mMean = cRow[3], mSD = cRow[4], fMean = cRow = [5], fSD = cRow[6];
    var hMean = gender === 'male' ? mMean : gender === 'female'? fMean : (mMean + fMean) / 2;
    var hSD = gender === 'male' ? mSD : gender === 'female' ? fSD : (mSD + fSD) / 2;

    var prob = 1.0;
    var steps = [];
    var cards = [];

    if (birthdayval){
        var d = new Date(birthdayval + 'T00:00:00');
        var mIdx = d.getMonth();
        var dayN = d.getDate();
        var totalFreq = BIRTH_FREQ.reduce(function(a,b){
            return a+b;
        }, 0);

        var monthShare = BIRTH_FREQ[mIdx] / totalFreq;
        var daysInMonth = new Date(200, mIdx + 1, 0).getDate();
        var birthdayProb = monthShare / daysInMonth;

        prob *= birthdayProb;
        steps.push({trait: 'Birthday', desc:MONTH_FULL[mIdx] + ' ' + dayN, p: birthdayProb, runningL: prob});
        
        var relPct = ((BIRTH_FREQ[mIdx] / (totalFreq / 12)) * 100).toFixed(1);
        var monthAdj = BIRTH_FREQ[mIdx] > 1.02 ? 'a more common birth month'
                    : BIRTH_FREQ[mIdx] < 0.96 ? 'a less common birth month'
                    : 'a near-average birth month';
        cards.push({
            trait: 'Birthday', value: MONTH_FULL[mIdx] + ' ' + dayN, prob: birthdayProb,
            desc: MONTH_FULL[mIdx] + ' is ' + monthAdj + ' — ' + relPct + '% of the monthly average birth rate. Births peak in late summer and autumn globally (Aug/Sep) due to seasonal conception patterns, and dip in winter (Feb). Being born in a high-frequency month makes your birth month slightly less rare. The specific day (' + dayN + ') is assumed uniformly distributed across the ' + daysInMonth + ' days of ' + MONTH_FULL[mIdx] + ', contributing 1/' + daysInMonth + ' to the monthly probability. The highlighted bar in the chart below is your birth month.',
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
            ? Math.floor(heightCm / 30.48) + "'" + Math.round((heightCm / 2.54) % 12) + "'"
            : Math.round(heightCm) + ' cm';
        var pctile = Math.round(normPDF(z) * 100);
        var dir = z > 0 ? 'taller' : 'shorter';
        var rareAdj = hProb < 0.05 ? 'very rare'
                    : hProb < 0.16 ? 'uncommon'
                    : hProb < 0.32 ? 'slightly below average frequeny'
                    : 'close to average (common)';
        steps.push({trait: 'Height', desc: hDisp + '(z=' + z.toFixed(2) + ')', p: hProb, running: prob });
        
        var capturedHDisp = hDisp;
        var capturedZ = z.toFixed(2);
        cards.push({
            trait: 'Height', value: hDisp, prob: hProb,
            desc: 'In ' + cName + ', the average height is ' + Math.round(hMean) + ' cm (SD ' + hSD + ' cm). You are ' + capturedHDisp + ' — ' + Math.abs(z).toFixed(1) + ' standard deviations ' + dir + ' than average (z = ' + capturedZ + '), at the ' + pctile + 'th percentile. ' + fmtProb(hProb) + ' of people are at least this far from the mean — making your height ' + rareAdj + '. Crucially: both unusually tall and unusually short people are rare; only average height is common. The shaded area on the curve shows the population fraction matching your extremity.'
            // chartFn: // TO DOOO
        });
    }

    var handProb = hand === 'right' ? 0.89 : hand === 'left' ? 0.1 : 0.01;
    var handLabel = hand === 'right' ? 'Right-handed' : hand === 'left' ? 'Left-handed' : 'Ambidextrous';
    prob *= prob;
    steps.push({
        trait: 'Handedness', desc: handLabel, p: handProb, running: prob
    });
    cards.push({
        trait: 'Handedness', value: hLabel, prob: handProb,
        desc: hand === 'right'
            ? 'About 89% of people are right-handed. The overwhelming majority globally. This is the most common handedness and adds very little to your party. The bar chart reflects population shares.'
            : hand === 'left'
            ? 'About 10% of people are left-handed. Despite being a clear minority, left-handedness is well established in the population and moderately contributes to your rarity.'
            : 'Only about 1% of people are genuinely ambidextrous, able to use both hands with equal skill. This is a very rare trait and adds much more rarity to you.'
            // chartFn:  // TO DOOOO
    });

    var WorldPopulation = 8100000000;
    cards.push({
        trait: 'Country / Region', value: cName, prob: null,
        desc: cName + ' has a population of ' + formatBig(pop) + ' (' + ((pop/WorldPopulation)* 100).toFixed(2) + '% of the world). Your country does not directly multiply into the rarity, but is just used as a refrence. The final estimated match count is: combined probabilty × ' + formatBig(pop) + '.',
        chartFn: null
    });
    
    var estimate = Math.max(1, prob * pop);
    var oneIn = prob > 0 ? 1 / prob : Infinity;
    var rarityPct = Math.min(99, Math.max(1, (Max.log10(Math.max(oneIn, 2)) / Math.log10(pop)) * 100));

    // RENDER FUNCTION
}