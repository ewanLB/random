const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const addForm = document.getElementById('addForm');
const newItemInput = document.getElementById('newItem');
const resetButton = document.getElementById('resetButton');
const optionList = document.getElementById('optionList');
const iconList = document.getElementById('iconList');
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
const shareButton = document.getElementById('shareButton');
const shareModal = document.getElementById('shareModal');
const shareLinkInput = document.getElementById('shareLinkInput');
const shareStatus = document.getElementById('shareStatus');
const shareHint = document.getElementById('shareHint');
const shareCopyBtn = document.getElementById('shareCopyBtn');
const shareNativeBtn = document.getElementById('shareNativeBtn');
const shareClose = document.getElementById('shareClose');
const shareLoadModal = document.getElementById('shareLoadModal');
const shareLoadInfo = document.getElementById('shareLoadInfo');
const shareLoadCancel = document.getElementById('shareLoadCancel');
const shareLoadOk = document.getElementById('shareLoadOk');
const arrowEl = document.getElementById("arrow");
const themeSelect = document.getElementById('themeSelect');
const menuCard = document.getElementById('menuCard');
const menuSlot = document.getElementById('menuSlot');
const controlsContainer = document.getElementById('controlsContainer');
const slotContainer = document.getElementById('slotContainer');
const spinSlotBtn = document.getElementById('spinSlotBtn');
const groupPanel = document.getElementById('groupPanel');


let currentTheme = localStorage.getItem('wheelTheme') || 'glass';
let currentMode = localStorage.getItem('wheelMode') || 'wheel'; // 'wheel', 'card', 'slot'
document.body.dataset.theme = currentTheme;
if (themeSelect) {
  themeSelect.value = currentTheme;
  themeSelect.addEventListener('change', (e) => {
    currentTheme = e.target.value;
    document.body.dataset.theme = currentTheme;
    localStorage.setItem('wheelTheme', currentTheme);
    drawRouletteWheel();
    updateOptionList();
    updateGroupList();
    if (currentMode === 'card') initCards();
    if (currentMode === 'slot') initSlot();
  });
}

function resizeCanvas() {
  canvas.width = wheelContainer.clientWidth;
  canvas.height = wheelContainer.clientHeight;
  drawRouletteWheel();
}

window.addEventListener('resize', resizeCanvas);

const popupSound = new Audio('clap.wav');
let muted = localStorage.getItem('wheelMuted') === 'true';

function cryptoRandom() {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / 2 ** 32;
}

function getRandomFloat(min, max) {
  return min + cryptoRandom() * (max - min);
}

function getRandomInt(min, max) {
  return Math.floor(getRandomFloat(min, max));
}

function shuffleOptions() {
  for (let i = options.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }
}

function sortOptions() {
  options.sort((a, b) => {
    if (a.active === b.active) return 0;
    return a.active ? -1 : 1;
  });
}

function playFlipSound() {
  if (muted) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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

const ICONS = ['🍀', '🌟', '🍭', '🍉', '🍣', '🧩', '🎈', '🐱', '🐶', '🐻'];

function getAvailableIcons() {
  return ICONS.filter(ic => !options.some(o => o.icon === ic));
}

function getUniqueIcon() {
  const avail = getAvailableIcons();
  if (avail.length === 0) return ICONS[getRandomInt(0, ICONS.length)];
  return avail[getRandomInt(0, avail.length)];
}

function assignUniqueIcons(arr) {
  const used = new Set();
  arr.forEach(o => {
    const pool = ICONS.filter(ic => !used.has(ic));
    o.icon = pool.length ? pool[getRandomInt(0, pool.length)] : ICONS[getRandomInt(0, ICONS.length)];
    used.add(o.icon);
  });
}

let options;
let stored = JSON.parse(localStorage.getItem('wheelOptions'));
const hasStoredOptions = !!(stored && stored.length);
if (hasStoredOptions) {
  options = typeof stored[0] === 'object' ? stored : stored.map(t => ({ text: t, active: true }));
} else {
  options = ['Option 1', 'Option 2', 'Option 3'].map(t => ({ text: t, active: true }));
}
if (hasStoredOptions) {
  // Keep the saved arrangement. Re-shuffling and re-assigning icons on every load
  // changed the emoji on each refresh, left the list out of sync with storage, and
  // made a shared link look different once the recipient reloaded.
  fillMissingIcons(options);
} else {
  shuffleOptions();
  assignUniqueIcons(options);
}
sortOptions();
let startAngle = 0;
let arc = Math.PI * 2 / countActive();
let spinTimeout = null;
let spinAngleStart = 0;
let spinTime = 0;
let spinTimeTotal = 0;
let audioCtx;
let lastTickIndex = -1;

let groups = JSON.parse(localStorage.getItem('wheelGroups') || '[]');

function openGroupNameModal() {
  groupNameInput.value = '';
  groupNameModal.style.display = 'flex';
  groupNameInput.focus();
}

function closeGroupNameModal() {
  groupNameModal.style.display = 'none';
}

function openSaveConfirm() {
  saveConfirmModal.style.display = 'flex';
}

function closeSaveConfirm() {
  saveConfirmModal.style.display = 'none';
}

function countActive() {
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
    iconInput.title = 'Icon for this option';
    iconInput.setAttribute('aria-label', 'Icon for this option');
    iconInput.addEventListener('input', () => {
      opt.icon = iconInput.value;
      saveOptions();
      drawRouletteWheel();
      if (currentMode === 'card') initCards();
      if (currentMode === 'slot') initSlot();
    });
    li.appendChild(iconInput);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = opt.text;
    textInput.className = 'ant-input';
    textInput.setAttribute('aria-label', 'Option text');
    textInput.addEventListener('input', () => {
      opt.text = textInput.value;
      saveOptions();
      drawRouletteWheel();
      if (currentMode === 'card') initCards();
      if (currentMode === 'slot') initSlot();
    });
    li.appendChild(textInput);

    const probSpan = document.createElement('span');
    const prob = opt.active && activeCount ? (100 / activeCount).toFixed(1) : '0.0';
    probSpan.textContent = ` - ${prob}%`;
    li.appendChild(probSpan);

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = opt.active;
    toggle.title = 'Include this option in the draw';
    toggle.setAttribute('aria-label', `Include "${opt.text}" in the draw`);
    toggle.addEventListener('change', () => {
      opt.active = toggle.checked;
      sortOptions();
      arc = countActive() > 0 ? Math.PI * 2 / countActive() : Math.PI * 2;
      saveOptions();
      updateOptionList();
      drawRouletteWheel();
    });
    li.appendChild(toggle);

    const del = document.createElement('button');
    del.className = 'ant-btn ant-btn-link';
    del.textContent = 'x';
    del.title = 'Remove this option';
    del.setAttribute('aria-label', `Remove "${opt.text}"`);
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
  if (currentMode === 'card') {
    initCards();
  }
  if (currentMode === 'slot') {
    initSlot();
  }
  updateIconList();
}

function updateIconList() {
  iconList.innerHTML = '';
  const used = [];
  options.forEach(o => {
    if (!used.includes(o.icon)) used.push(o.icon);
  });
  used.forEach(ic => {
    const span = document.createElement('span');
    span.textContent = ic;
    span.style.margin = '0 4px';
    iconList.appendChild(span);
  });
}

function saveGroups() {
  localStorage.setItem('wheelGroups', JSON.stringify(groups));
}

function updateGroupList() {
  groupListEl.innerHTML = '';
  if (groups.length === 0) {
    groupPanel.style.display = 'none';
    return;
  }
  groupPanel.style.display = 'block';

  groups.forEach((g, idx) => {
    const li = document.createElement('li');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'group-name';
    nameSpan.textContent = g.name;
    li.appendChild(nameSpan);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'group-actions';

    const loadBtn = document.createElement('button');
    loadBtn.className = 'ant-btn ant-btn-primary ant-btn-sm';
    loadBtn.textContent = 'Load';
    loadBtn.addEventListener('click', () => loadGroup(idx));

    const shareBtn = document.createElement('button');
    shareBtn.className = 'ant-btn ant-btn-sm';
    shareBtn.textContent = '🔗';
    shareBtn.title = 'Share this group';
    shareBtn.addEventListener('click', () => openShareModal(g.name, g.options));

    const delBtn = document.createElement('button');
    delBtn.className = 'ant-btn ant-btn-link ant-btn-sm';
    delBtn.textContent = 'x';
    delBtn.title = `Delete group "${g.name}"`;
    delBtn.setAttribute('aria-label', delBtn.title);
    delBtn.addEventListener('click', () => deleteGroup(idx));

    btnGroup.appendChild(loadBtn);
    btnGroup.appendChild(shareBtn);
    btnGroup.appendChild(delBtn);
    li.appendChild(btnGroup);

    groupListEl.appendChild(li);
  });
}

function applyOptions(newOptions) {
  options = JSON.parse(JSON.stringify(newOptions));
  arc = countActive() > 0 ? Math.PI * 2 / countActive() : Math.PI * 2;
  saveOptions();
  updateOptionList();
  drawRouletteWheel();
  if (currentMode === 'card') {
    initCards();
  }
  if (currentMode === 'slot') {
    initSlot();
  }
}

function loadGroup(idx) {
  const grp = groups[idx];
  if (!grp) return;
  applyOptions(grp.options);
}

function deleteGroup(idx) {
  groups.splice(idx, 1);
  saveGroups();
  updateGroupList();
}

function upsertGroup(name, opts) {
  const normalized = name.trim().toLowerCase();
  const existingIdx = groups.findIndex(g => g.name.trim().toLowerCase() === normalized);
  const groupData = { name, options: JSON.parse(JSON.stringify(opts)) };
  if (existingIdx >= 0) {
    groups[existingIdx] = groupData;
  } else {
    groups.push(groupData);
  }
  saveGroups();
  updateGroupList();
}

/* ---------- Share via link ---------- */

const SHARE_PARAM = 's';
const SHARE_LINK_WARN_LENGTH = 4000;

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code) {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeShare(name, opts) {
  const payload = {
    v: 1,
    n: name || '',
    o: opts.map(o => [o.text, o.icon || '', o.active ? 1 : 0])
  };
  return toBase64Url(JSON.stringify(payload));
}

function fillMissingIcons(opts) {
  const used = new Set(opts.map(o => o.icon).filter(Boolean));
  opts.forEach(o => {
    if (o.icon) return;
    const pool = ICONS.filter(ic => !used.has(ic));
    o.icon = pool.length ? pool[getRandomInt(0, pool.length)] : ICONS[getRandomInt(0, ICONS.length)];
    used.add(o.icon);
  });
}

function decodeShare(code) {
  let data;
  try {
    data = JSON.parse(fromBase64Url(code));
  } catch (err) {
    return null;
  }
  if (!data || !Array.isArray(data.o)) return null;
  const opts = data.o
    .filter(item => Array.isArray(item) && typeof item[0] === 'string' && item[0].trim())
    .map(item => ({
      text: String(item[0]).slice(0, 100),
      icon: typeof item[1] === 'string' ? item[1].slice(0, 4) : '',
      active: item[2] !== 0
    }));
  if (!opts.length) return null;
  fillMissingIcons(opts);
  return { name: typeof data.n === 'string' ? data.n.slice(0, 60) : '', options: opts };
}

function buildShareUrl(name, opts) {
  const base = location.href.split('#')[0].split('?')[0];
  return `${base}#${SHARE_PARAM}=${encodeShare(name, opts)}`;
}

// select() leaves the caret at the end, which scrolls the field past the start of
// the URL; keep the readable beginning in view.
function selectShareLink() {
  // 'backward' puts the selection focus at the start, so the browser scrolls there
  // instead of to the end; the rAF reset covers browsers that ignore the direction.
  try {
    shareLinkInput.setSelectionRange(0, shareLinkInput.value.length, 'backward');
  } catch (err) {
    shareLinkInput.select();
  }
  setTimeout(() => { shareLinkInput.scrollLeft = 0; }, 0);
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) { /* fall through to legacy copy */ }
  try {
    shareLinkInput.focus();
    selectShareLink();
    const ok = document.execCommand('copy');
    selectShareLink();
    return ok;
  } catch (err) {
    return false;
  }
}

let copyResetTimer = null;

// Re-clicking Copy link must visibly react, so restart the animation instead of
// leaving the button in whatever state the previous click left it in.
function showCopyResult(copied) {
  clearTimeout(copyResetTimer);
  shareStatus.textContent = copied
    ? '✅ Link copied to clipboard!'
    : '⚠️ Copy failed — select the link below and copy it manually.';
  shareCopyBtn.classList.remove('is-copied');
  void shareCopyBtn.offsetWidth; // force reflow so the pop animation replays
  if (!copied) {
    shareCopyBtn.textContent = 'Copy link';
    return;
  }
  shareCopyBtn.textContent = '✅ Copied!';
  shareCopyBtn.classList.add('is-copied');
  copyResetTimer = setTimeout(() => {
    shareCopyBtn.textContent = 'Copy link';
    shareCopyBtn.classList.remove('is-copied');
  }, 1800);
}

function resetCopyButton() {
  clearTimeout(copyResetTimer);
  shareCopyBtn.textContent = 'Copy link';
  shareCopyBtn.classList.remove('is-copied');
}

async function openShareModal(name, opts) {
  resetCopyButton();
  const active = opts.filter(o => o.active);
  if (!active.length) {
    shareStatus.textContent = 'Nothing to share — enable at least one option first.';
    shareLinkInput.value = '';
    shareLinkInput.title = '';
    shareHint.textContent = '';
    shareNativeBtn.style.display = 'none';
    shareCopyBtn.disabled = true;
    shareModal.style.display = 'flex';
    return;
  }
  const url = buildShareUrl(name, opts);
  shareLinkInput.value = url;
  shareLinkInput.title = url; // the field truncates, so expose the full link on hover
  shareHint.textContent = url.length > SHARE_LINK_WARN_LENGTH
    ? 'This link is long — some chat apps may cut it off. Consider sharing fewer options.'
    : 'Anyone who opens this link gets the same options.';
  shareNativeBtn.style.display = navigator.share ? '' : 'none';
  shareCopyBtn.disabled = false;
  // Clear first: without this the previous "copied" message stays on screen
  // while the clipboard write is still pending.
  shareStatus.textContent = 'Copying link…';
  shareModal.style.display = 'flex';
  showCopyResult(await copyToClipboard(url));
}

function closeShareModal() {
  shareModal.style.display = 'none';
}

let pendingShare = null;

function readShareCode() {
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
  return hashParams.get(SHARE_PARAM) || new URLSearchParams(location.search).get(SHARE_PARAM);
}

function clearShareCode() {
  try {
    const url = new URL(location.href);
    url.hash = '';
    url.searchParams.delete(SHARE_PARAM);
    history.replaceState(null, '', url.toString());
  } catch (err) {
    location.hash = '';
  }
}

function closeShareLoadModal() {
  shareLoadModal.style.display = 'none';
  pendingShare = null;
}

function handleSharedLink() {
  const code = readShareCode();
  if (!code) return;
  const data = decodeShare(code);
  clearShareCode();
  if (!data) return;
  pendingShare = data;

  shareLoadInfo.textContent = '';
  const nameEl = document.createElement('strong');
  nameEl.textContent = data.name || 'Shared options';
  shareLoadInfo.appendChild(nameEl);

  const countEl = document.createElement('div');
  countEl.textContent = `${data.options.length} option${data.options.length > 1 ? 's' : ''}`;
  shareLoadInfo.appendChild(countEl);

  const previewEl = document.createElement('div');
  previewEl.className = 'share-preview';
  previewEl.textContent = data.options.map(o => `${o.icon} ${o.text}`).join('、');
  shareLoadInfo.appendChild(previewEl);

  shareLoadModal.style.display = 'flex';
}

// Option text can arrive from a shared link, so always render it as text, never as HTML.
function renderCardFace(el, opt) {
  el.textContent = '';
  const iconEl = document.createElement('div');
  iconEl.textContent = opt.icon || '';
  const textEl = document.createElement('div');
  textEl.textContent = opt.text;
  el.appendChild(iconEl);
  el.appendChild(textEl);
}

function showModal(option, index) {
  modalContent.textContent = '';
  const iconEl = document.createElement('span');
  iconEl.className = 'icon';
  iconEl.textContent = option.icon || '';
  modalContent.appendChild(iconEl);
  modalContent.appendChild(document.createTextNode(option.text));
  modalContent.style.background = getColor(index, countActive());
  modalOverlay.style.display = 'flex';
  startFireworks();
  if (!muted) {
    popupSound.currentTime = 0;
    popupSound.play();
  }
}

modalOverlay.addEventListener('click', () => {
  modalOverlay.style.display = 'none';
  if (currentMode === 'card') {
    initCards();
  }
  // Slot mode does not reset on close, keeps the winner visible
});

function drawRouletteWheel() {
  const active = options.filter(o => o.active);
  const size = Math.min(canvas.width, canvas.height);
  const center = size / 2;
  const outsideRadius = size * 0.45;
  const iconRadius = size * 0.35;
  const textRadius = size * 0.28;
  const insideRadius = size * 0.1;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Theme-specific settings
  let strokeColor, strokeWidth, shadowColor, shadowBlur, fontMain, fontIcon, textColor;

  if (currentTheme === 'cyberpunk') {
    strokeColor = '#00f3ff';
    strokeWidth = 2;
    shadowColor = '#00f3ff';
    shadowBlur = 15;
    fontMain = 'bold 16px "Orbitron", sans-serif';
    fontIcon = '32px "Orbitron", sans-serif';
    textColor = '#e0e0e0';
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
  } else if (currentTheme === 'casino') {
    strokeColor = '#d4af37';
    strokeWidth = 2;
    shadowColor = 'rgba(0,0,0,0.5)';
    shadowBlur = 10;
    fontMain = 'bold 16px "Playfair Display", serif';
    fontIcon = '32px "Playfair Display", serif';
    textColor = '#fff';
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
  } else { // Glass
    strokeColor = 'rgba(255, 255, 255, 0.8)';
    strokeWidth = 4;
    shadowColor = 'rgba(0,0,0,0.1)';
    shadowBlur = 5;
    fontMain = 'bold 16px "Inter", sans-serif';
    fontIcon = '32px "Inter", sans-serif';
    textColor = '#2d3748';
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
  }

  for (let i = 0; i < active.length; i++) {
    const angle = startAngle + i * arc;
    const originalIndex = options.indexOf(active[i]);
    const color = getColor(originalIndex, options.length);

    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(center, center, outsideRadius, angle, angle + arc, false);
    ctx.arc(center, center, insideRadius, angle + arc, angle, true);
    ctx.fill();

    // Gradient overlay for Casino
    if (currentTheme === 'casino') {
      const grd = ctx.createRadialGradient(center, center, insideRadius, center, center, outsideRadius);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = grd;
      ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    ctx.save();

    // Text & Icon
    if (currentTheme === 'cyberpunk') {
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 5;
      ctx.fillStyle = '#fff';
    } else if (currentTheme === 'casino') {
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = textColor;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = textColor;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Icon
    ctx.font = fontIcon;
    ctx.translate(center + Math.cos(angle + arc / 2) * iconRadius,
      center + Math.sin(angle + arc / 2) * iconRadius);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    ctx.fillText(active[i].icon, 0, 0);
    ctx.restore();

    ctx.save();
    // Text
    if (currentTheme === 'cyberpunk') {
      ctx.fillStyle = '#e0e0e0';
    } else {
      ctx.fillStyle = textColor;
    }
    ctx.font = fontMain;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(center + Math.cos(angle + arc / 2) * textRadius,
      center + Math.sin(angle + arc / 2) * textRadius);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    ctx.fillText(active[i].text, 0, 0);
    ctx.restore();
  }

  // Outer Ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, outsideRadius, 0, Math.PI * 2);
  ctx.strokeStyle = strokeColor;

  if (currentTheme === 'cyberpunk') {
    ctx.lineWidth = 5;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 20;
  } else if (currentTheme === 'casino') {
    ctx.lineWidth = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
  } else {
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  }
  ctx.stroke();

  // Inner Hub
  ctx.beginPath();
  ctx.arc(center, center, insideRadius, 0, Math.PI * 2);

  if (currentTheme === 'cyberpunk') {
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (currentTheme === 'casino') {
    const hubGrad = ctx.createRadialGradient(center, center, 0, center, center, insideRadius);
    hubGrad.addColorStop(0, '#bf953f');
    hubGrad.addColorStop(1, '#aa771c');
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glass Hub Icon
    ctx.fillStyle = '#4a5568';
    ctx.font = '24px "Inter"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', center, center);
  }
  ctx.restore();
}

function shadeColor(color, percent) {
  return color; // Not needed for flat neon
}

function getColor(index, total) {
  if (currentTheme === 'cyberpunk') {
    const colors = [
      'rgba(0, 243, 255, 0.4)', // Cyan
      'rgba(255, 0, 255, 0.4)', // Magenta
      'rgba(252, 238, 10, 0.4)', // Yellow
      'rgba(118, 75, 162, 0.4)'  // Purple
    ];
    return colors[index % colors.length];
  } else if (currentTheme === 'casino') {
    return `hsl(${index * 360 / total}, 85%, 45%)`;
  } else {
    return `hsl(${index * 360 / total}, 85%, 85%)`;
  }
}

function spin(e) {
  if (countActive() === 0) return;
  if (e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.min(canvas.width, canvas.height);
    const center = size / 2;
    const outsideRadius = size * 0.4;
    const dx = x - center;
    const dy = y - center;
    if (dx * dx + dy * dy > outsideRadius * outsideRadius) return;
  }
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  startSpinSound();
  spinAngleStart = getRandomFloat(10, 20);
  spinTime = 0;
  spinTimeTotal = getRandomFloat(4000, 7000);
  rotateWheel();
}

function rotateWheel() {
  spinTime += 30;
  if (spinTime >= spinTimeTotal) {
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
  if (active.length === 0) return;
  // Arrow is now at top (Math.PI * 1.5 or 270 deg)
  // But in canvas arc, 0 is right, PI/2 is down, PI is left, 3PI/2 is top.
  const pointerAngle = Math.PI * 1.5;
  const diff = (pointerAngle - (startAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const index = Math.floor(diff / arc) % active.length;
  const result = active[index];
  showModal(result, index);
  stopSpinSound();
}

function easeOut(t, b, c, d) {
  const ts = (t /= d) * t;
  const tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t);
}

function startSpinSound() {
  lastTickIndex = -1;
}

function stopSpinSound() {
  lastTickIndex = -1;
}

function playTick() {
  if (muted) return;
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

function playTickIfNeeded() {
  const activeCount = countActive();
  if (activeCount === 0) return;
  const pointerAngle = Math.PI * 1.5;
  const diff = (pointerAngle - (startAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const index = Math.floor(diff / arc) % activeCount;
  if (index !== lastTickIndex) {
    playTick();
    lastTickIndex = index;
  }
}

function playFireworksSound() {
  if (muted) return;
  const duration = 2;
  const numBursts = 5;
  for (let i = 0; i < numBursts; i++) {
    const t = i * 0.3;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200 + getRandomFloat(0, 400), audioCtx.currentTime + t);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + t + duration / numBursts);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime + t);
    gain.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + duration / numBursts);
    osc.start(audioCtx.currentTime + t);
    osc.stop(audioCtx.currentTime + t + duration / numBursts);
  }
}

function startFireworks() {
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
  function burst(x, y) {
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(i / 20 * Math.PI * 2) * (getRandomFloat(2, 5)),
        vy: Math.sin(i / 20 * Math.PI * 2) * (getRandomFloat(2, 5)),
        alpha: 1,
        color: `hsl(${getRandomFloat(0, 360)},70%,60%)`
      });
    }
  }
  for (let b = 0; b < 3; b++) {
    burst(getRandomFloat(0, canvas.width), getRandomFloat(0, canvas.height / 2));
  }
  let frame = 0;
  function animate() {
    fctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.alpha -= 0.01;
    });
    particles.filter(p => p.alpha > 0).forEach(p => {
      fctx.globalAlpha = p.alpha;
      fctx.fillStyle = p.color;
      fctx.beginPath();
      fctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      fctx.fill();
    });
    fctx.globalAlpha = 1;
    frame++;
    if (frame < 200) {
      requestAnimationFrame(animate);
    } else {
      document.body.removeChild(canvas);
    }
  }
  animate();
}

let drawPhase = 'front';

function initCards() {
  cardContainer.innerHTML = '';
  const active = options.filter(o => o.active);
  const shuffled = active.slice().sort(() => getRandomFloat(-0.5, 0.5));
  shuffled.forEach((opt) => {
    const card = document.createElement('div');
    card.className = 'card';
    const inner = document.createElement('div');
    inner.className = 'card-inner';
    const front = document.createElement('div');
    front.className = 'card-face front';
    renderCardFace(front, opt);
    const index = options.indexOf(opt);
    front.style.setProperty('--bg', getColor(index, options.length));
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

function flipAllToBack() {
  const cards = cardContainer.querySelectorAll('.card');
  cards.forEach((c, i) => {
    setTimeout(() => { c.classList.add('flipped'); playFlipSound(); }, i * 150);
  });
  drawPhase = 'animating';
  const totalTime = cards.length * 150 + 600;
  setTimeout(() => shuffleCards(() => { drawPhase = 'back'; }), totalTime);
}

function shuffleCards(done) {
  const cards = Array.from(cardContainer.querySelectorAll('.card'));
  const rects = cards.map(c => c.getBoundingClientRect());
  const order = rects.map((_, i) => i).sort(() => getRandomFloat(-0.5, 0.5));
  cards.forEach((card, i) => {
    const dx = rects[order[i]].left - rects[i].left;
    const dy = rects[order[i]].top - rects[i].top;
    card.style.transition = 'transform 0.6s';
    card.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  setTimeout(() => {
    order.forEach(idx => cardContainer.appendChild(cards[idx]));
    cards.forEach(card => {
      card.style.transition = '';
      card.style.transform = '';
    });
    if (done) done();
  }, 600);
}

function revealCard(card) {
  const active = options.filter(o => o.active);
  if (active.length === 0) return;
  const result = active[getRandomInt(0, active.length)];
  const front = card.querySelector('.front');
  renderCardFace(front, result);
  const index = options.indexOf(result);
  front.style.setProperty('--bg', getColor(index, options.length));
  card.classList.remove('flipped');
  playFlipSound();
  showModal(result, index);
}

function handleCardClick(e) {
  const card = e.currentTarget;
  if (drawPhase !== 'front' && drawPhase !== 'back') return;
  if (drawPhase === 'front') {
    flipAllToBack();
  } else if (drawPhase === 'back') {
    revealCard(card);
  }
}

canvas.addEventListener('click', spin);

// Slot Machine Logic
function initSlot() {
  const active = options.filter(o => o.active);
  if (active.length === 0) return;

  ['reel1', 'reel2', 'reel3'].forEach(id => {
    const reel = document.getElementById(id);
    reel.innerHTML = '';
    const strip = document.createElement('div');
    strip.className = 'reel-strip';

    // Create a long strip of duplicated options for scrolling effect
    // We need enough items to scroll comfortably. 
    // Let's repeat the active list multiple times.
    const repeatCount = Math.ceil(30 / active.length) + 2; // Ensure at least ~30 items

    for (let i = 0; i < repeatCount; i++) {
      active.forEach((opt, index) => {
        const item = document.createElement('div');
        item.className = 'reel-item';

        // Create content container for styling
        const content = document.createElement('div');
        content.className = 'reel-item-content';
        content.textContent = opt.icon;
        const originalIndex = options.indexOf(opt);
        content.style.background = getColor(originalIndex, options.length);

        item.appendChild(content);
        strip.appendChild(item);
      });
    }
    reel.appendChild(strip);
    // Reset transform
    strip.style.transform = 'translateY(0)';
    strip.style.transition = 'none';
  });
}

function playWinSound() {
  if (muted) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}

function spinSlot() {
  const active = options.filter(o => o.active);
  if (active.length === 0) return;

  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  startSpinSound();

  // Pick a winner
  const winnerIndex = getRandomInt(0, active.length);
  const winner = active[winnerIndex];

  // Calculate scroll distance
  // We want to land on the winner.
  // The strip has many repeats. Let's land on a specific repeat index deep in the strip.
  // Item height is 150px.
  const itemHeight = 150;

  // Target index in the strip (e.g., somewhere in the middle-end)
  // We need to find the Nth occurrence of the winner in the strip.
  // Let's aim for the 5th repeat or so.
  const targetRepeat = 5;
  const targetIndex = (targetRepeat * active.length) + winnerIndex;

  // Calculate Y offset. 
  // We want the target item to be centered.
  // The reel height is 150px. The item height is 150px.
  // So translate to -targetIndex * 150.
  const translateY = -(targetIndex * itemHeight);

  ['reel1', 'reel2', 'reel3'].forEach((id, idx) => {
    const reel = document.getElementById(id);
    const strip = reel.querySelector('.reel-strip');

    // Reset first to 0 (seamless if we constructed it right, but for now just jump)
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0)';

    // Force reflow
    void strip.offsetWidth;

    // Animate
    // Add delay for each reel
    const duration = 2 + (idx * 0.5); // 2s, 2.5s, 3s
    strip.style.transition = `transform ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
    strip.style.transform = `translateY(${translateY}px)`;
  });

  // Show modal after last reel finishes
  setTimeout(() => {
    stopSpinSound();
    playWinSound();
    showModal(winner, winnerIndex);
  }, 3000); // Max duration
}

const slotLever = document.getElementById('slotLever');
if (slotLever) {
  slotLever.addEventListener('click', () => {
    if (slotLever.classList.contains('pulled')) return; // Prevent double click

    slotLever.classList.add('pulled');

    // Wait for animation down
    setTimeout(() => {
      spinSlot();

      // Reset lever after a short delay
      setTimeout(() => {
        slotLever.classList.remove('pulled');
      }, 500);
    }, 300);
  });
}

// Menu Navigation
menuWheel.addEventListener('click', () => {
  currentMode = 'wheel';
  localStorage.setItem('wheelMode', 'wheel');
  title.textContent = 'Lucky Wheel';
  wheelContainer.style.display = 'block';
  controlsContainer.style.display = 'flex';
  cardContainer.style.display = 'none';
  slotContainer.style.display = 'none';
  addForm.style.display = '';
  resetButton.style.display = '';
  optionList.style.display = '';
  menu.classList.remove('open');
});

menuCard.addEventListener('click', () => {
  currentMode = 'card';
  localStorage.setItem('wheelMode', 'card');
  title.textContent = 'Lucky Draw';
  wheelContainer.style.display = 'none';
  controlsContainer.style.display = 'flex';
  cardContainer.style.display = 'grid';
  slotContainer.style.display = 'none';
  addForm.style.display = '';
  resetButton.style.display = '';
  optionList.style.display = '';
  initCards();
  menu.classList.remove('open');
});

menuSlot.addEventListener('click', () => {
  currentMode = 'slot';
  localStorage.setItem('wheelMode', 'slot');
  title.textContent = 'Lucky Slot';
  wheelContainer.style.display = 'none';
  controlsContainer.style.display = 'flex';
  cardContainer.style.display = 'none';
  slotContainer.style.display = 'flex';
  addForm.style.display = '';
  resetButton.style.display = '';
  optionList.style.display = '';
  initSlot();
  menu.classList.remove('open');
});

addForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const value = newItemInput.value.trim();
  if (value) {
    options.push({ text: value, active: true, icon: getUniqueIcon() });
    arc = Math.PI * 2 / countActive();
    saveOptions();
    updateOptionList();
    drawRouletteWheel();
    newItemInput.value = '';
  }
});

resetButton.addEventListener('click', function () {
  options = ['Option 1', 'Option 2', 'Option 3'].map(t => ({ text: t, active: true }));
  shuffleOptions();
  assignUniqueIcons(options);
  arc = Math.PI * 2 / countActive();
  saveOptions();
  updateOptionList();
  drawRouletteWheel();
  if (cardContainer.style.display !== 'none') {
    initCards();
  }
});

muteButton.addEventListener('click', function () {
  muted = !muted;
  muteButton.textContent = muted ? '🔇' : '🔊';
  localStorage.setItem('wheelMuted', muted);
});

menuToggle.addEventListener('click', function () {
  menu.classList.toggle('open');
});

saveButton.addEventListener('click', openGroupNameModal);

groupNameCancel.addEventListener('click', closeGroupNameModal);
groupNameInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    groupNameOk.click();
  }
});
groupNameModal.addEventListener('click', function (e) {
  if (e.target === groupNameModal || e.target.classList.contains('ant-modal-mask')) {
    closeGroupNameModal();
  }
});

groupNameOk.addEventListener('click', function () {
  const name = groupNameInput.value.trim();
  if (!name) {
    closeGroupNameModal();
    return;
  }
  upsertGroup(name, options);
  // options = []; // Don't clear options after save
  arc = countActive() > 0 ? Math.PI * 2 / countActive() : Math.PI * 2;
  saveOptions();
  updateOptionList();
  drawRouletteWheel();
  if (cardContainer.style.display !== 'none') {
    initCards();
  }
  closeGroupNameModal();
  openSaveConfirm();
});

shareButton.addEventListener('click', () => openShareModal('', options));
shareCopyBtn.addEventListener('click', async () => {
  if (!shareLinkInput.value) return;
  showCopyResult(await copyToClipboard(shareLinkInput.value));
});
// Readonly fields do not select on click by default; make grabbing the link easy.
shareLinkInput.addEventListener('focus', selectShareLink);
shareLinkInput.addEventListener('click', selectShareLink);
shareNativeBtn.addEventListener('click', async () => {
  if (!shareLinkInput.value) return;
  try {
    await navigator.share({ title: 'Lucky Wheel', text: 'Spin these options with me!', url: shareLinkInput.value });
  } catch (err) { /* user cancelled the share sheet */ }
});
shareClose.addEventListener('click', closeShareModal);
shareModal.addEventListener('click', function (e) {
  if (e.target === shareModal || e.target.classList.contains('ant-modal-mask')) {
    closeShareModal();
  }
});

shareLoadCancel.addEventListener('click', closeShareLoadModal);
shareLoadModal.addEventListener('click', function (e) {
  if (e.target === shareLoadModal || e.target.classList.contains('ant-modal-mask')) {
    closeShareLoadModal();
  }
});
shareLoadOk.addEventListener('click', function () {
  if (!pendingShare) {
    closeShareLoadModal();
    return;
  }
  const shared = pendingShare;
  applyOptions(shared.options);
  if (shared.name) {
    upsertGroup(shared.name, shared.options);
  }
  closeShareLoadModal();
});

saveConfirmOk.addEventListener('click', closeSaveConfirm);
saveConfirmModal.addEventListener('click', function (e) {
  if (e.target === saveConfirmModal || e.target.classList.contains('ant-modal-mask')) {
    closeSaveConfirm();
  }
});

muteButton.textContent = muted ? '🔇' : '🔊';
saveOptions(); // persist any icons filled in above so the list matches storage
updateOptionList();
updateGroupList();
resizeCanvas();

// Restore mode
if (currentMode === 'card') {
  menuCard.click();
} else if (currentMode === 'slot') {
  menuSlot.click();
} else {
  menuWheel.click();
}

handleSharedLink();
// Pasting a share link into an already-open tab only changes the hash, so no reload happens.
window.addEventListener('hashchange', handleSharedLink);

// Every dialog was mouse-only before; Escape now dismisses whichever one is open.
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  const isOpen = el => el && getComputedStyle(el).display !== 'none';
  if (isOpen(shareModal)) return closeShareModal();
  if (isOpen(shareLoadModal)) return closeShareLoadModal();
  if (isOpen(groupNameModal)) return closeGroupNameModal();
  if (isOpen(saveConfirmModal)) return closeSaveConfirm();
  if (isOpen(modalOverlay)) {
    modalOverlay.style.display = 'none';
    if (currentMode === 'card') initCards();
  }
});
