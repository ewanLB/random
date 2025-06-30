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
const saveButton = document.getElementById('saveButton');
const groupListEl = document.getElementById('groupList');
const groupNameModal = document.getElementById('groupNameModal');
const groupNameInput = document.getElementById('groupNameInput');
const groupNameCancel = document.getElementById('groupNameCancel');
const groupNameOk = document.getElementById('groupNameOk');
const saveConfirmModal = document.getElementById('saveConfirmModal');
const saveConfirmOk = document.getElementById('saveConfirmOk');

function resizeCanvas(){
  canvas.width = wheelContainer.clientWidth;
  canvas.height = wheelContainer.clientHeight;
  drawRouletteWheel();
}

window.addEventListener('resize', resizeCanvas);

const popupSound = new Audio('clap.wav');
let muted = localStorage.getItem('wheelMuted') === 'true';

function cryptoRandom(){
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / 2**32;
}

function getRandomFloat(min, max){
  return min + cryptoRandom() * (max - min);
}

function getRandomInt(min, max){
  return Math.floor(getRandomFloat(min, max));
}

function shuffleOptions(){
  for(let i=options.length-1;i>0;i--){
    const j=getRandomInt(0, i+1);
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
  if(avail.length === 0) return ICONS[getRandomInt(0, ICONS.length)];
  return avail[getRandomInt(0, avail.length)];
}

function assignUniqueIcons(arr){
  const used = new Set();
  arr.forEach(o=>{
    const pool = ICONS.filter(ic => !used.has(ic));
    o.icon = pool.length ? pool[getRandomInt(0, pool.length)] : ICONS[getRandomInt(0, ICONS.length)];
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

let groups = JSON.parse(localStorage.getItem('wheelGroups') || '[]');

function openGroupNameModal(){
  groupNameInput.value = '';
  groupNameModal.style.display = 'flex';
  groupNameInput.focus();
}

function closeGroupNameModal(){
  groupNameModal.style.display = 'none';
}

function openSaveConfirm(){
  saveConfirmModal.style.display = 'flex';
}

function closeSaveConfirm(){
  saveConfirmModal.style.display = 'none';
}

function countActive(){
  return options.filter(o => o.active).length;
}

function saveOptions() {
  localStorage.setItem('wheelOptions', JSON.stringify(options));
}

function updateOptionList() {
  optionList.innerHTML = '';
  const activeCount = countActive();
  options.forEach((opt, index) => {
    const li = document.createElement('li');
    li.style.background = getColor(index, options.length);

    const iconInput = document.createElement('input');
    iconInput.type = 'text';
    iconInput.value = opt.icon;
    iconInput.maxLength = 2;
    iconInput.className = 'ant-input icon-input';
    iconInput.addEventListener('input', () => {
      opt.icon = iconInput.value;
      saveOptions();
      drawRouletteWheel();
      if(cardContainer.style.display !== 'none') initCards();
    });
    li.appendChild(iconInput);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = opt.text;
    textInput.className = 'ant-input';
    textInput.addEventListener('input', () => {
      opt.text = textInput.value;
      saveOptions();
      drawRouletteWheel();
      if(cardContainer.style.display !== 'none') initCards();
    });
    li.appendChild(textInput);

    const probSpan = document.createElement('span');
    const prob = opt.active && activeCount ? (100/activeCount).toFixed(1) : '0.0';
    probSpan.textContent = ` - ${prob}%`;
    li.appendChild(probSpan);

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = opt.active;
    toggle.addEventListener('change', () => {
      opt.active = toggle.checked;
      arc = countActive() > 0 ? Math.PI * 2 / countActive() : Math.PI * 2;
      saveOptions();
      updateOptionList();
      drawRouletteWheel();
    });
    li.appendChild(toggle);

    const del = document.createElement('button');
    del.className = 'ant-btn ant-btn-link';
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
  if(cardContainer.style.display !== 'none') {
    initCards();
  }
}

function saveGroups(){
  localStorage.setItem('wheelGroups', JSON.stringify(groups));
}

function updateGroupList(){
  groupListEl.innerHTML = '';
  groups.forEach((g, idx) => {
    const li = document.createElement('li');
    li.textContent = g.name;
    const loadBtn = document.createElement('button');
    loadBtn.className = 'ant-btn ant-btn-primary ant-btn-sm';
    loadBtn.textContent = 'Load';
    loadBtn.addEventListener('click', () => loadGroup(idx));
    const delBtn = document.createElement('button');
    delBtn.className = 'ant-btn ant-btn-link ant-btn-sm';
    delBtn.textContent = 'x';
    delBtn.addEventListener('click', () => deleteGroup(idx));
    li.appendChild(loadBtn);
    li.appendChild(delBtn);
    groupListEl.appendChild(li);
  });
}

function loadGroup(idx){
  const grp = groups[idx];
  if(!grp) return;
  options = JSON.parse(JSON.stringify(grp.options));
  arc = countActive() > 0 ? Math.PI * 2 / countActive() : Math.PI * 2;
  saveOptions();
  updateOptionList();
  drawRouletteWheel();
  if(cardContainer.style.display !== 'none'){
    initCards();
  }
}

function deleteGroup(idx){
  groups.splice(idx,1);
  saveGroups();
  updateGroupList();
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
  const size = Math.min(canvas.width, canvas.height);
  const center = size / 2;
  const outsideRadius = size * 0.4;
  const iconRadius = size * 0.3;
  const textRadius = size * 0.24;
  const insideRadius = size * 0.1;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 4;

  for(let i = 0; i < active.length; i++) {
    const angle = startAngle + i * arc;
    const color = getColor(i, active.length);
    const grad = ctx.createRadialGradient(center,center,insideRadius,center,center,outsideRadius);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.arc(center, center, outsideRadius, angle, angle + arc, false);
    ctx.arc(center, center, insideRadius, angle + arc, angle, true);
    ctx.stroke();
    ctx.fill();

    ctx.save();
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.translate(center + Math.cos(angle + arc / 2) * iconRadius,
                  center + Math.sin(angle + arc / 2) * iconRadius);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    ctx.fillText(active[i].icon, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'black';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(center + Math.cos(angle + arc / 2) * textRadius,
                  center + Math.sin(angle + arc / 2) * textRadius);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    ctx.fillText(active[i].text, 0, 0);
    ctx.restore();
  }

}

function getColor(index, total) {
  const hue = index * (360 / total);
  return `hsl(${hue}, 70%, 80%)`;
}

function spin(e) {
  if(countActive() === 0) return;
  if(e){
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.min(canvas.width, canvas.height);
    const center = size / 2;
    const outsideRadius = size * 0.4;
    const dx = x - center;
    const dy = y - center;
    if(dx*dx + dy*dy > outsideRadius * outsideRadius) return;
  }
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  startSpinSound();
  spinAngleStart = getRandomFloat(10, 20);
  spinTime = 0;
  spinTimeTotal = getRandomFloat(4000, 7000);
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
  const active = options.filter(o => o.active);
  if(active.length === 0) return;
  const pointerAngle = Math.PI * 1.5; // arrow at the top
  const diff = (pointerAngle - (startAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const index = Math.floor(diff / arc) % active.length;
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
  const activeCount = countActive();
  if(activeCount === 0) return;
  const pointerAngle = Math.PI * 1.5;
  const diff = (pointerAngle - (startAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const index = Math.floor(diff / arc) % activeCount;
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
    osc.frequency.setValueAtTime(200+getRandomFloat(0,400), audioCtx.currentTime + t);
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
        vx: Math.cos(i/20*Math.PI*2)*(getRandomFloat(2,5)),
        vy: Math.sin(i/20*Math.PI*2)*(getRandomFloat(2,5)),
        alpha:1,
        color:`hsl(${getRandomFloat(0,360)},70%,60%)`
      });
    }
  }
  for(let b=0;b<3;b++){
    burst(getRandomFloat(0, canvas.width), getRandomFloat(0, canvas.height/2));
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
  const shuffled = active.slice().sort(()=>getRandomFloat(-0.5,0.5));
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
  const order = rects.map((_,i)=>i).sort(()=>getRandomFloat(-0.5,0.5));
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
  const result = active[getRandomInt(0, active.length)];
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
  if(cardContainer.style.display !== 'none'){
    initCards();
  }
});

muteButton.addEventListener('click', function(){
  muted = !muted;
  muteButton.textContent = muted ? '🔇' : '🔊';
  localStorage.setItem('wheelMuted', muted);
});

menuToggle.addEventListener('click', function(){
  menu.classList.toggle('open');
});

saveButton.addEventListener('click', openGroupNameModal);

groupNameCancel.addEventListener('click', closeGroupNameModal);
groupNameModal.addEventListener('click', function(e){
  if(e.target === groupNameModal || e.target.classList.contains('ant-modal-mask')){
    closeGroupNameModal();
  }
});

groupNameOk.addEventListener('click', function(){
  const name = groupNameInput.value.trim();
  if(!name){
    closeGroupNameModal();
    return;
  }
  groups.push({ name, options: JSON.parse(JSON.stringify(options)) });
  saveGroups();
  updateGroupList();
  options = [];
  arc = countActive() > 0 ? Math.PI * 2 / countActive() : Math.PI * 2;
  saveOptions();
  updateOptionList();
  drawRouletteWheel();
  if(cardContainer.style.display !== 'none'){
    initCards();
  }
  closeGroupNameModal();
  openSaveConfirm();
});

saveConfirmOk.addEventListener('click', closeSaveConfirm);
saveConfirmModal.addEventListener('click', function(e){
  if(e.target === saveConfirmModal || e.target.classList.contains('ant-modal-mask')){
    closeSaveConfirm();
  }
});

muteButton.textContent = muted ? '🔇' : '🔊';
updateOptionList();
updateGroupList();
resizeCanvas();
