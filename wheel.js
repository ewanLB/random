const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const addForm = document.getElementById('addForm');
const newItemInput = document.getElementById('newItem');
const resultDiv = document.getElementById('result');
const resetButton = document.getElementById('resetButton');
const optionList = document.getElementById('optionList');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');

const ICONS = ['🍀','🌟','🍭','🍉','🍣','🧩','🎈','🐱','🐶','🐻'];
let stored = JSON.parse(localStorage.getItem('wheelOptions'));
if(stored && stored.length){
  if(typeof stored[0] === 'object') {
    options = stored;
  } else {
    options = stored.map(t => ({ text: t, active: true, icon: ICONS[Math.floor(Math.random()*ICONS.length)] }));
  }
} else {
  options = ['Option 1','Option 2','Option 3'].map(t => ({ text: t, active: true, icon: ICONS[Math.floor(Math.random()*ICONS.length)] }));
}
let startAngle = 0;
let arc = Math.PI * 2 / countActive();
let spinTimeout = null;
let spinAngleStart = 0;
let spinTime = 0;
let spinTimeTotal = 0;
let audioCtx;
let spinOsc;

function countActive(){
  return options.filter(o => o.active).length;
}

function saveOptions() {
  localStorage.setItem('wheelOptions', JSON.stringify(options));
}

function updateOptionList() {
  optionList.innerHTML = '';
  options.forEach((opt, index) => {
    const li = document.createElement('li');
    li.style.background = getColor(index, options.length);

    const span = document.createElement('span');
    span.textContent = `${opt.icon} ${opt.text}`;
    li.appendChild(span);

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = opt.active;
    toggle.addEventListener('change', () => {
      opt.active = toggle.checked;
      arc = countActive() > 0 ? Math.PI * 2 / countActive() : Math.PI * 2;
      saveOptions();
      drawRouletteWheel();
    });
    li.appendChild(toggle);

    const del = document.createElement('button');
    del.textContent = 'x';
    del.addEventListener('click', () => {
      options.splice(index, 1);
      arc = countActive() > 0 ? Math.PI * 2 / countActive() : Math.PI * 2;
      saveOptions();
      updateOptionList();
      drawRouletteWheel();
    });
    li.appendChild(del);

    optionList.appendChild(li);
  });
}

function showModal(msg) {
  modalContent.textContent = msg;
  modalOverlay.style.display = 'flex';
}

modalOverlay.addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});

function drawRouletteWheel() {
  const active = options.filter(o => o.active);
  const outsideRadius = 200;
  const textRadius = 160;
  const insideRadius = 50;

  ctx.clearRect(0, 0, 500, 500);

  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 4;

  for(let i = 0; i < active.length; i++) {
    const angle = startAngle + i * arc;
    const color = getColor(i, active.length);
    const grad = ctx.createRadialGradient(250,250,insideRadius,250,250,outsideRadius);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.arc(250, 250, outsideRadius, angle, angle + arc, false);
    ctx.arc(250, 250, insideRadius, angle + arc, angle, true);
    ctx.stroke();
    ctx.fill();

    ctx.save();
    ctx.fillStyle = 'black';
    ctx.translate(250 + Math.cos(angle + arc / 2) * textRadius,
                  250 + Math.sin(angle + arc / 2) * textRadius);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    const txt = `${active[i].icon} ${active[i].text}`;
    ctx.fillText(txt, -ctx.measureText(txt).width / 2, 0);
    ctx.restore();
  }

}

function getColor(index, total) {
  const hue = index * (360 / total);
  return `hsl(${hue}, 70%, 80%)`;
}

function spin() {
  if(countActive() === 0) return;
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  startSpinSound();
  spinAngleStart = Math.random() * 10 + 10;
  spinTime = 0;
  spinTimeTotal = Math.random() * 3000 + 4000;
  rotateWheel();
}

function rotateWheel() {
  spinTime += 30;
  if(spinTime >= spinTimeTotal) {
    stopRotateWheel();
    return;
  }
  const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
  startAngle += (spinAngle * Math.PI / 180);
  drawRouletteWheel();
  if(spinOsc){
    const progress = spinTime/spinTimeTotal;
    spinOsc.frequency.setValueAtTime(600 - progress*500, audioCtx.currentTime);
  }
  spinTimeout = setTimeout(rotateWheel, 30);
}

function stopRotateWheel() {
  clearTimeout(spinTimeout);
  const degrees = startAngle * 180 / Math.PI + 90;
  const arcd = arc * 180 / Math.PI;
  const index = Math.floor((360 - degrees % 360) / arcd);
  const active = options.filter(o => o.active);
  const result = active[index];
  const msg = 'Result: ' + result.text;
  resultDiv.textContent = msg;
  showModal(msg);
  stopSpinSound();
  playCelebrateSound();
}

function easeOut(t, b, c, d) {
  const ts = (t/=d)*t;
  const tc = ts*t;
  return b+c*(tc + -3*ts + 3*t);
}

function startSpinSound(){
  spinOsc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  spinOsc.type = 'sawtooth';
  spinOsc.frequency.setValueAtTime(600, audioCtx.currentTime);
  spinOsc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  spinOsc.start();
}

function stopSpinSound(){
  if(spinOsc){
    spinOsc.stop();
    spinOsc.disconnect();
    spinOsc = null;
  }
}

function playCelebrateSound(){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}

canvas.addEventListener('click', spin);

addForm.addEventListener('submit', function(e){
  e.preventDefault();
  const value = newItemInput.value.trim();
  if(value){
    options.push({ text: value, active: true, icon: ICONS[Math.floor(Math.random()*ICONS.length)] });
    arc = Math.PI * 2 / countActive();
    saveOptions();
    updateOptionList();
    drawRouletteWheel();
    newItemInput.value='';
  }
});

resetButton.addEventListener('click', function(){
  options = ['Option 1','Option 2','Option 3'].map(t => ({ text: t, active: true, icon: ICONS[Math.floor(Math.random()*ICONS.length)] }));
  arc = Math.PI * 2 / countActive();
  saveOptions();
  updateOptionList();
  drawRouletteWheel();
});

updateOptionList();
drawRouletteWheel();
