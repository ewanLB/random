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
const menuToggle = document.getElementById('menuToggle');
const menu = document.getElementById('menu');
const muteButton = document.getElementById('muteButton');
const cardContainer = document.getElementById('cardContainer');
const wheelContainer = document.getElementById('wheelContainer');
const title = document.getElementById('title');

const popupSound = new Audio('clap.wav');
let muted = false;

function shuffleOptions(){
  for(let i=options.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [options[i],options[j]]=[options[j],options[i]];
  }
}

function playFlipSound(){
  if(muted) return;
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

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

let options;
let stored = JSON.parse(localStorage.getItem('wheelOptions'));
if(stored && stored.length){
  if(typeof stored[0] === 'object') {
    options = stored;
  } else {
    options = stored.map(t => ({ text: t, active: true }));
  }
} else {
  options = ['Option 1','Option 2','Option 3'].map(t => ({ text: t, active: true }));
}
shuffleOptions();
assignUniqueIcons(options);
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

function showModal(option, index) {
  modalContent.innerHTML = `<span class="icon">${option.icon}</span>${option.text}`;
  modalContent.style.background = getColor(index, countActive());
  modalOverlay.style.display = 'flex';
  startFireworks();
  if(!muted){
    popupSound.currentTime = 0;
    popupSound.play();
  }
}

modalOverlay.addEventListener('click', () => {
  modalOverlay.style.display = 'none';
  if(cardContainer.style.display !== 'none') {
    initCards();
  }
});

function drawRouletteWheel() {
  const active = options.filter(o => o.active);
  const outsideRadius = 200;
  const iconRadius = 150;
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
  showModal(result, index);
  stopSpinSound();
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
  if(muted) return;
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

function playFireworksSound(){
  if(muted) return;
  const duration = 2;
  const numBursts = 5;
  for(let i=0;i<numBursts;i++){
    const t = i*0.3;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200+Math.random()*400, audioCtx.currentTime + t);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + t + duration/numBursts);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime + t);
    gain.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + duration/numBursts);
    osc.start(audioCtx.currentTime + t);
    osc.stop(audioCtx.currentTime + t + duration/numBursts);
  }
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

let drawPhase = 'front';

function initCards(){
  cardContainer.innerHTML = '';
  const active = options.filter(o=>o.active);
  const shuffled = active.slice().sort(()=>Math.random()-0.5);
  shuffled.forEach((opt)=>{
    const card = document.createElement('div');
    card.className = 'card';
    const inner = document.createElement('div');
    inner.className = 'card-inner';
    const front = document.createElement('div');
    front.className = 'card-face front';
    front.innerHTML = `<div>${opt.icon}</div><div>${opt.text}</div>`;
    const index = active.indexOf(opt);
    front.style.setProperty('--bg', getColor(index, active.length));
    const back = document.createElement('div');
    back.className = 'card-face back';
    back.textContent = '💖';
    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    cardContainer.appendChild(card);
    card.addEventListener('click', handleCardClick);
  });
  drawPhase = 'front';
}

function flipAllToBack(){
  const cards = cardContainer.querySelectorAll('.card');
  cards.forEach((c,i)=>{
    setTimeout(()=>{c.classList.add('flipped'); playFlipSound();}, i*150);
  });
  drawPhase = 'animating';
  const totalTime = cards.length * 150 + 600;
  setTimeout(()=>shuffleCards(()=>{ drawPhase = 'back'; }), totalTime);
}

function shuffleCards(done){
  const cards = Array.from(cardContainer.querySelectorAll('.card'));
  const rects = cards.map(c=>c.getBoundingClientRect());
  const order = rects.map((_,i)=>i).sort(()=>Math.random()-0.5);
  cards.forEach((card,i)=>{
    const dx = rects[order[i]].left - rects[i].left;
    const dy = rects[order[i]].top - rects[i].top;
    card.style.transition = 'transform 0.6s';
    card.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  setTimeout(()=>{
    order.forEach(idx=>cardContainer.appendChild(cards[idx]));
    cards.forEach(card=>{
      card.style.transition = '';
      card.style.transform = '';
    });
    if(done) done();
  },600);
}

function revealCard(card){
  const active = options.filter(o=>o.active);
  if(active.length===0) return;
  const result = active[Math.floor(Math.random()*active.length)];
  const front = card.querySelector('.front');
  front.innerHTML = `<div>${result.icon}</div><div>${result.text}</div>`;
  const index = active.indexOf(result);
  front.style.setProperty('--bg', getColor(index, active.length));
  card.classList.remove('flipped');
  playFlipSound();
  showModal(result, index);
}

function handleCardClick(e){
  const card = e.currentTarget;
  if(drawPhase!=='front' && drawPhase!=='back') return;
  if(drawPhase==='front'){
    flipAllToBack();
  }else if(drawPhase==='back'){
    revealCard(card);
  }
}

canvas.addEventListener('click', spin);

menuWheel.addEventListener('click', function(){
  title.textContent = 'Lucky Wheel';
  wheelContainer.style.display = '';
  cardContainer.style.display = 'none';
  addForm.style.display = '';
  resetButton.style.display = '';
  optionList.style.display = '';
  menu.classList.remove('open');
});

menuDraw.addEventListener('click', function(){
  title.textContent = 'Lucky Draw';
  wheelContainer.style.display = 'none';
  cardContainer.style.display = 'grid';
  addForm.style.display = '';
  resetButton.style.display = '';
  optionList.style.display = '';
  initCards();
  menu.classList.remove('open');
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
  shuffleOptions();
  assignUniqueIcons(options);
  arc = Math.PI * 2 / countActive();
  saveOptions();
  updateOptionList();
  drawRouletteWheel();
});

muteButton.addEventListener('click', function(){
  muted = !muted;
  muteButton.textContent = muted ? '🔇' : '🔊';
});

menuToggle.addEventListener('click', function(){
  menu.classList.toggle('open');
});

muteButton.textContent = '🔊';
updateOptionList();
drawRouletteWheel();
