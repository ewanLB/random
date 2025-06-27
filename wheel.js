const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const addForm = document.getElementById('addForm');
const newItemInput = document.getElementById('newItem');
const resultDiv = document.getElementById('result');
const resetButton = document.getElementById('resetButton');
const optionList = document.getElementById('optionList');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');

let options = JSON.parse(localStorage.getItem('wheelOptions')) || ['Option 1', 'Option 2', 'Option 3'];
let startAngle = 0;
let arc = Math.PI * 2 / options.length;
let spinTimeout = null;
let spinAngleStart = 0;
let spinTime = 0;
let spinTimeTotal = 0;

function saveOptions() {
  localStorage.setItem('wheelOptions', JSON.stringify(options));
}

function updateOptionList() {
  optionList.innerHTML = '';
  options.forEach((opt, index) => {
    const li = document.createElement('li');
    li.style.background = getColor(index, options.length);
    li.textContent = opt;
    const del = document.createElement('button');
    del.textContent = 'x';
    del.addEventListener('click', () => {
      options.splice(index, 1);
      arc = options.length > 0 ? Math.PI * 2 / options.length : Math.PI * 2;
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
  const outsideRadius = 200;
  const textRadius = 160;
  const insideRadius = 50;

  ctx.clearRect(0, 0, 500, 500);

  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 4;

  for(let i = 0; i < options.length; i++) {
    const angle = startAngle + i * arc;
    const color = getColor(i, options.length);
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
    ctx.fillText(options[i], -ctx.measureText(options[i]).width / 2, 0);
    ctx.restore();
  }

  // Arrow
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.moveTo(250 - 4, 250 - (outsideRadius + 5));
  ctx.lineTo(250 + 4, 250 - (outsideRadius + 5));
  ctx.lineTo(250 + 4, 250 - (outsideRadius - 5));
  ctx.lineTo(250 + 9, 250 - (outsideRadius - 5));
  ctx.lineTo(250 + 0, 250 - (outsideRadius - 13));
  ctx.lineTo(250 - 9, 250 - (outsideRadius - 5));
  ctx.lineTo(250 - 4, 250 - (outsideRadius - 5));
  ctx.lineTo(250 - 4, 250 - (outsideRadius + 5));
  ctx.fill();
}

function getColor(index, total) {
  const hue = index * (360 / total);
  return `hsl(${hue}, 70%, 80%)`;
}

function spin() {
  if(options.length === 0) return;
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
  spinTimeout = setTimeout(rotateWheel, 30);
}

function stopRotateWheel() {
  clearTimeout(spinTimeout);
  const degrees = startAngle * 180 / Math.PI + 90;
  const arcd = arc * 180 / Math.PI;
  const index = Math.floor((360 - degrees % 360) / arcd);
  const msg = 'Result: ' + options[index];
  resultDiv.textContent = msg;
  showModal(msg);
}

function easeOut(t, b, c, d) {
  const ts = (t/=d)*t;
  const tc = ts*t;
  return b+c*(tc + -3*ts + 3*t);
}

canvas.addEventListener('click', spin);

addForm.addEventListener('submit', function(e){
  e.preventDefault();
  const value = newItemInput.value.trim();
  if(value){
    options.push(value);
    arc = Math.PI * 2 / options.length;
    saveOptions();
    updateOptionList();
    drawRouletteWheel();
    newItemInput.value='';
  }
});

resetButton.addEventListener('click', function(){
  options = ['Option 1', 'Option 2', 'Option 3'];
  arc = Math.PI * 2 / options.length;
  saveOptions();
  updateOptionList();
  drawRouletteWheel();
});

updateOptionList();
drawRouletteWheel();
