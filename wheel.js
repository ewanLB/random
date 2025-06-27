const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const addForm = document.getElementById('addForm');
const newItemInput = document.getElementById('newItem');
const resetButton = document.getElementById('resetButton');
const optionList = document.getElementById('optionList');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const menuWheel = document.getElementById('menuWheel');
const menuDraw = document.getElementById('menuDraw');
const drawContainer = document.getElementById('drawContainer');
const drawButton = document.getElementById('drawButton');
const wheelContainer = document.getElementById('wheelContainer');
const title = document.getElementById('title');

const ICONS = ['🍀','🌟','🍭','🍉','🍣','🧩','🎈','🐱','🐶','🐻'];

function getAvailableIcons(){
  return ICONS.filter(ic => !options.some(o => o.icon === ic));
}

function getUniqueIcon(){
  const avail = getAvailableIcons();
  if(avail.length === 0) return ICONS[Math.floor(Math.random()*ICONS.length)];
  return avail[Math.floor(Math.random()*avail.length)];
}

function assignUniqueIcons(arr){
  const used = new Set();
  arr.forEach(o=>{
    const pool = ICONS.filter(ic => !used.has(ic));
    o.icon = pool.length ? pool[Math.floor(Math.random()*pool.length)] : ICONS[Math.floor(Math.random()*ICONS.length)];
    used.add(o.icon);
  });
}
let stored = JSON.parse(localStorage.getItem('wheelOptions'));
if(stored && stored.length){
  if(typeof stored[0] === 'object') {
    options = stored;
    assignUniqueIcons(options);
  } else {
    options = stored.map(t => ({ text: t, active: true }));
    assignUniqueIcons(options);
  }
} else {
  options = ['Option 1','Option 2','Option 3'].map(t => ({ text: t, active: true }));
  assignUniqueIcons(options);
}
let startAngle = 0;
let arc = Math.PI * 2 / countActive();
let spinTimeout = null;
let spinAngleStart = 0;
let spinTime = 0;
let spinTimeTotal = 0;
let audioCtx;
let lastTickIndex = -1;

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

function showModal(option) {
  modalContent.innerHTML = `<span class="icon">${option.icon}</span>${option.text}`;
  modalOverlay.style.display = 'flex';
  startFireworks();
}

modalOverlay.addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});

function drawRouletteWheel() {
  const active = options.filter(o => o.active);
  const outsideRadius = 200;
  const iconRadius = 185;
  const textRadius = 120;
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
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '28px "Comic Sans MS", "Trebuchet MS", cursive';
    ctx.translate(250 + Math.cos(angle + arc / 2) * iconRadius,
                  250 + Math.sin(angle + arc / 2) * iconRadius);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    ctx.fillText(active[i].icon, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'black';
    ctx.font = 'bold 20px "Comic Sans MS", "Trebuchet MS", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(250 + Math.cos(angle + arc / 2) * textRadius,
                  250 + Math.sin(angle + arc / 2) * textRadius);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    ctx.fillText(active[i].text, 0, 0);
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
  playTickIfNeeded();
  spinTimeout = setTimeout(rotateWheel, 30);
}

function stopRotateWheel() {
  clearTimeout(spinTimeout);
  const degrees = startAngle * 180 / Math.PI + 90;
  const arcd = arc * 180 / Math.PI;
  const index = Math.floor((360 - degrees % 360) / arcd);
  const active = options.filter(o => o.active);
  const result = active[index];
  showModal(result);
  stopSpinSound();
  playCelebrateSound();
}

function easeOut(t, b, c, d) {
  const ts = (t/=d)*t;
  const tc = ts*t;
  return b+c*(tc + -3*ts + 3*t);
}

function startSpinSound(){
  lastTickIndex = -1;
}

function stopSpinSound(){
  lastTickIndex = -1;
}

function playTick(){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

function playTickIfNeeded(){
  const degrees = startAngle * 180 / Math.PI + 90;
  const arcd = arc * 180 / Math.PI;
  const index = Math.floor((360 - degrees % 360) / arcd);
  if(index !== lastTickIndex){
    playTick();
    lastTickIndex = index;
  }
}

function playCelebrateSound(){
  const times = [0,0.25,0.5];
  times.forEach(t=>{
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime + t);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime + t);
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + 0.1);
    osc.start(audioCtx.currentTime + t);
    osc.stop(audioCtx.currentTime + t + 0.1);
  });
}

function startFireworks(){
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.style.pointerEvents = 'none';
  canvas.id = 'fireworks';
  document.body.appendChild(canvas);
  const fctx = canvas.getContext('2d');
  const particles = [];
  function burst(x,y){
    for(let i=0;i<20;i++){
      particles.push({
        x:x,
        y:y,
        vx: Math.cos(i/20*Math.PI*2)*(Math.random()*3+2),
        vy: Math.sin(i/20*Math.PI*2)*(Math.random()*3+2),
        alpha:1,
        color:`hsl(${Math.random()*360},70%,60%)`
      });
    }
  }
  for(let b=0;b<3;b++){
    burst(Math.random()*canvas.width, Math.random()*canvas.height/2);
  }
  let frame=0;
  function animate(){
    fctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      p.x+=p.vx;
      p.y+=p.vy;
      p.vy+=0.05;
      p.alpha-=0.01;
    });
    particles.filter(p=>p.alpha>0).forEach(p=>{
      fctx.globalAlpha=p.alpha;
      fctx.fillStyle=p.color;
      fctx.beginPath();
      fctx.arc(p.x,p.y,3,0,Math.PI*2);
      fctx.fill();
    });
    fctx.globalAlpha=1;
    frame++;
    if(frame<200){
      requestAnimationFrame(animate);
    }else{
      document.body.removeChild(canvas);
    }
  }
  animate();
}

canvas.addEventListener('click', spin);

drawButton.addEventListener('click', function(){
  const active = options.filter(o=>o.active);
  if(active.length===0) return;
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const result = active[Math.floor(Math.random()*active.length)];
  showModal(result);
  playCelebrateSound();
});

menuWheel.addEventListener('click', function(){
  title.textContent = 'Lucky Wheel';
  wheelContainer.style.display = '';
  addForm.style.display = '';
  resetButton.style.display = '';
  optionList.style.display = '';
  drawContainer.style.display = 'none';
});

menuDraw.addEventListener('click', function(){
  title.textContent = 'Lucky Draw';
  wheelContainer.style.display = 'none';
  addForm.style.display = 'none';
  resetButton.style.display = 'none';
  optionList.style.display = 'none';
  drawContainer.style.display = 'block';
});

addForm.addEventListener('submit', function(e){
  e.preventDefault();
  const value = newItemInput.value.trim();
  if(value){
    options.push({ text: value, active: true, icon: getUniqueIcon() });
    arc = Math.PI * 2 / countActive();
    saveOptions();
    updateOptionList();
    drawRouletteWheel();
    newItemInput.value='';
  }
});

resetButton.addEventListener('click', function(){
  options = ['Option 1','Option 2','Option 3'].map(t => ({ text: t, active: true }));
  assignUniqueIcons(options);
  arc = Math.PI * 2 / countActive();
  saveOptions();
  updateOptionList();
  drawRouletteWheel();
});

updateOptionList();
drawRouletteWheel();
