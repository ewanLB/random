const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const addForm = document.getElementById('addForm');
const newItemInput = document.getElementById('newItem');
const resultDiv = document.getElementById('result');
const resetButton = document.getElementById('resetButton');
const optionList = document.getElementById('optionList');

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

function drawRouletteWheel() {
  const outsideRadius = 200;
  const textRadius = 160;
  const insideRadius = 50;

  ctx.clearRect(0, 0, 500, 500);

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;

  for(let i = 0; i < options.length; i++) {
    const angle = startAngle + i * arc;
    ctx.fillStyle = getColor(i, options.length);

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
  ctx.fillStyle = 'black';
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

function byte2Hex(n) {
  const nybHexString = '0123456789ABCDEF';
  return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
}

function getColor(item, maxitem) {
  const phase = 0;
  const center = 128;
  const width = 127;
  const frequency = Math.PI*2/maxitem;

  const red   = Math.sin(frequency*item+2+phase) * width + center;
  const green = Math.sin(frequency*item+0+phase) * width + center;
  const blue  = Math.sin(frequency*item+4+phase) * width + center;

  return '#' + byte2Hex(red) + byte2Hex(green) + byte2Hex(blue);
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
  alert(msg);
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
