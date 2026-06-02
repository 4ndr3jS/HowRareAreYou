function setUnit(u) {
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