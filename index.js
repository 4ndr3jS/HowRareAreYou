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