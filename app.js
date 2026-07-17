const DEFAULT_STATE = { xp: 1240, readiness: 42, recall: 12, lessons: 3, answers: 0, correct: 0, streak: 7, soundOn: true, goal: 'CompTIA Security+', lastStudy: null };
const storageKey = 'cydex-state-v2';
let state = { ...DEFAULT_STATE, ...safeJson(localStorage.getItem(storageKey)) };
let currentUser = safeJson(localStorage.getItem('cydex-user'));
let questionIndex = 0;
let authMode = 'signup';

const objectives = [
  { domain: 'General Security Concepts', code: '1.0', objectives: [['1.1', 'Security controls', 'done'], ['1.2', 'Cryptographic concepts', 'current'], ['1.3', 'Authentication factors', ''], ['1.4', 'Security principles', '']] },
  { domain: 'Threats, Vulnerabilities & Mitigations', code: '2.0', objectives: [['2.1', 'Threat actors', 'done'], ['2.2', 'Attack vectors', 'done'], ['2.3', 'Vulnerability management', ''], ['2.4', 'Malware', '']] },
  { domain: 'Security Architecture', code: '3.0', objectives: [['3.1', 'Enterprise security', ''], ['3.2', 'Cloud security', ''], ['3.3', 'Resilience', ''], ['3.4', 'Zero trust', '']] }
];
const focusAreas = [['WPA3 and wireless encryption', 31], ['Public key infrastructure', 38], ['Identity federation', 44]];
const questions = [
  { tag: 'OBJ 1.2', prompt: 'A company needs to encrypt large database backups quickly. Which approach is the best fit?', answers: ['Asymmetric encryption with a public key', 'Symmetric encryption with a shared secret key', 'Hashing each backup with SHA-256', 'A digital signature for every file'], correct: 1, explanation: 'Symmetric encryption uses one shared key and is much faster than asymmetric encryption for bulk data. Hashing verifies integrity, while signatures verify authenticity; neither encrypts the backup.' },
  { tag: 'OBJ 1.2', prompt: 'Which cryptographic property confirms that a message has not been altered in transit?', answers: ['Confidentiality', 'Integrity', 'Availability', 'Non-repudiation'], correct: 1, explanation: 'Integrity means data remains accurate and unchanged. A hash or message authentication code can help detect modification.' },
  { tag: 'OBJ 2.2', prompt: 'An attacker sends a carefully crafted email that appears to come from the payroll department. What is this attack vector?', answers: ['Phishing', 'Shoulder surfing', 'Evil twin', 'Privilege escalation'], correct: 0, explanation: 'Phishing uses deceptive messages to persuade people to disclose information or take unsafe actions.' }
];

function safeJson(value) { try { return value ? JSON.parse(value) : {}; } catch { return {}; } }
function byId(id) { return document.getElementById(id); }
function persist() { localStorage.setItem(storageKey, JSON.stringify(state)); }
function displayName() { return currentUser?.name || 'Alex Parker'; }
function firstName() { return displayName().split(' ')[0]; }
function initials() { return displayName().split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase(); }
function level() { return Math.floor(state.xp / 350) + 1; }
function xpToNext() { return 350 - (state.xp % 350); }
function toast(message, tone = 'success') { const el = byId('toast'); el.textContent = message; el.dataset.tone = tone; el.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove('show'), 3600); }
function playTone(kind) {
  if (!state.soundOn || !window.AudioContext) return;
  const context = new AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain();
  oscillator.frequency.value = kind === 'good' ? 560 : 180; oscillator.type = kind === 'good' ? 'sine' : 'triangle'; gain.gain.setValueAtTime(.055, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .14);
  oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .14);
}
function updateXp(delta, reason) {
  const before = state.xp; state.xp = Math.max(0, state.xp + delta); persist(); renderState();
  const actual = state.xp - before; if (actual) toast(`${actual > 0 ? '+' : ''}${actual} XP - ${reason}`, actual > 0 ? 'success' : 'warning');
}
function renderState() {
  byId('streakCount').textContent = state.streak; byId('xpValue').textContent = state.xp.toLocaleString(); byId('levelValue').textContent = `LVL ${level()}`; byId('levelCaption').textContent = `${xpToNext()} XP to level ${level() + 1}`;
  byId('readinessValue').textContent = `${state.readiness}%`; byId('readinessBar').style.width = `${state.readiness}%`; byId('reviewCount').textContent = state.recall; byId('recallRemaining').textContent = state.recall;
  byId('terminalScore').textContent = `${state.correct} / ${state.answers}`; byId('completedObjectives').textContent = `${state.lessons} / 18`; byId('pathProgress').style.width = `${Math.round((state.lessons / 18) * 100)}%`;
  byId('unlockProgress').textContent = `${state.readiness}% / 60%`; byId('profileName').textContent = displayName(); byId('heroName').textContent = firstName(); byId('avatarInitials').textContent = initials(); byId('profileRole').textContent = state.goal.replace('CompTIA ', '') + ' Candidate';
  byId('soundButton').textContent = `Sound: ${state.soundOn ? 'on' : 'off'}`; byId('soundInput').checked = state.soundOn; byId('profileNameInput').value = displayName(); byId('goalInput').value = state.goal;
  byId('accountButton').textContent = currentUser ? 'Account' : 'Sign up / Log in'; byId('streakMessage').textContent = state.lastStudy === today() ? 'Mission complete. Momentum secured.' : 'Study today to protect it.';
}
function renderDashboard() {
  byId('skillTree').innerHTML = [['1.1', 'Controls', 'done'], ['1.2', 'Crypto', 'current'], ['1.3', 'Auth', 'locked'], ['1.4', 'Principles', 'locked'], ['2.1', 'Threats', 'locked']].map(([code, name, status]) => `<button class="tree-node ${status}" ${status === 'current' ? 'data-action="start-mission"' : ''} ${status === 'locked' ? 'disabled' : ''}><small>${code} / ${status === 'done' ? 'mastered' : status === 'current' ? 'in progress' : 'locked'}</small><strong>${name}${status === 'done' ? ' +': ''}</strong></button>`).join('');
  byId('focusList').innerHTML = focusAreas.map(([label, confidence]) => `<article class="focus-item"><div><span>OBJECTIVE</span><span>${confidence}% confident</span></div><strong>${label}</strong><div class="progress"><i style="width:${confidence}%"></i></div></article>`).join('');
  byId('objectiveMap').innerHTML = objectives.map(({ domain, code, objectives: items }) => `<section class="domain"><div class="domain-head"><h2>${domain}</h2><span>DOMAIN ${code}</span></div><div class="objective-items">${items.map(([number, label, status]) => `<button class="objective ${status}" ${status === 'current' ? 'data-action="start-mission"' : ''} ${status === '' ? 'disabled' : ''}><i></i><span>${number} - ${label}${status === 'done' ? ' +' : ''}</span></button>`).join('')}</div></section>`).join('');
}
function showView(view) { document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.id === view)); document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.view === view)); document.querySelector('.sidebar').classList.remove('open'); if (view === 'practice') renderQuestion(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function renderQuestion() { const q = questions[questionIndex % questions.length]; byId('questionTag').textContent = q.tag; byId('questionWrap').innerHTML = `<div class="question-number">QUESTION ${questionIndex + 1} / ADAPTIVE DRILL</div><h2>${q.prompt}</h2><div class="answers">${q.answers.map((answer, index) => `<button class="answer" data-action="answer-question" data-answer="${index}"><span class="answer-key">${String.fromCharCode(65 + index)}</span><span>${answer}</span></button>`).join('')}</div>`; }
function answerQuestion(answer) {
  const q = questions[questionIndex % questions.length]; const buttons = document.querySelectorAll('[data-action="answer-question"]'); if (!buttons.length || buttons[0].disabled) return;
  buttons.forEach((button, index) => { button.disabled = true; if (index === q.correct) button.classList.add('correct'); if (index === answer && answer !== q.correct) button.classList.add('incorrect'); });
  const correct = answer === q.correct; state.answers += 1;
  if (correct) { state.correct += 1; state.readiness = Math.min(99, state.readiness + 1); updateXp(20, 'correct answer'); playTone('good'); } else { state.recall += 1; state.readiness = Math.max(0, state.readiness - 1); updateXp(-5, 'missed answer'); playTone('bad'); }
  persist(); renderState(); const feedback = document.createElement('div'); feedback.className = 'explanation'; feedback.innerHTML = `<strong>${correct ? 'CORRECT - +20 XP' : 'NOT QUITE - 5 XP, ADDED TO RECALL'}</strong><p>${q.explanation}</p><button class="primary-button next-question" data-action="next-question">Next question <span>&rarr;</span></button>`; byId('questionWrap').append(feedback);
}
function today() { return new Date().toISOString().slice(0, 10); }
function completeLesson() { state.lessons = Math.min(18, state.lessons + 1); state.readiness = Math.min(99, state.readiness + 2); state.lastStudy = today(); persist(); updateXp(80, 'mission complete'); renderDashboard(); closeModal('lessonModal'); playTone('good'); }
function openModal(id) { byId(id).hidden = false; document.body.classList.add('modal-open'); if (id === 'authModal') switchAuth(authMode); }
function closeModal(id) { byId(id).hidden = true; if (![...document.querySelectorAll('.modal-backdrop')].some(el => !el.hidden)) document.body.classList.remove('modal-open'); }
function closeAllModals() { document.querySelectorAll('.modal-backdrop').forEach(el => { el.hidden = true; }); document.body.classList.remove('modal-open'); }
function switchAuth(mode) { authMode = mode; byId('signupForm').hidden = mode !== 'signup'; byId('loginForm').hidden = mode !== 'login'; document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.authMode === mode)); byId('authMessage').textContent = ''; }
async function request(path, data) { const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.'); return result; }
function finishAuth(result) { currentUser = result.user; localStorage.setItem('cydex-user', JSON.stringify(currentUser)); localStorage.setItem('cydex-session', result.sessionToken); state.goal = currentUser.goal || state.goal; persist(); renderState(); closeModal('authModal'); toast(result.emailStatus?.delivery === 'sent' ? 'Welcome email sent. Your Cydex ID is live.' : 'Account created. Welcome email queued for local delivery.'); }
async function submitSignup(form) { const message = byId('authMessage'); message.textContent = 'Creating your Cydex ID...'; try { finishAuth(await request('/api/auth/signup', Object.fromEntries(new FormData(form)))); form.reset(); } catch (error) { message.textContent = error.message; } }
async function submitLogin(form) { const message = byId('authMessage'); message.textContent = 'Checking your credentials...'; try { finishAuth(await request('/api/auth/login', Object.fromEntries(new FormData(form)))); form.reset(); } catch (error) { message.textContent = error.message; } }
function updateProfile(form) { const values = Object.fromEntries(new FormData(form)); const name = values.name.trim(); if (!name) return; currentUser = { ...(currentUser || {}), name, goal: values.goal }; localStorage.setItem('cydex-user', JSON.stringify(currentUser)); state.goal = values.goal; state.soundOn = values.sound === 'on'; persist(); renderState(); closeModal('profileModal'); toast('Profile saved. Your learning space is yours.'); }

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]'); if (!target) return; const action = target.dataset.action;
  if (action === 'show-view') showView(target.dataset.view);
  if (action === 'start-mission') { closeAllModals(); openModal('lessonModal'); }
  if (action === 'close-modal') closeModal(target.dataset.modal);
  if (action === 'lesson-answer') { if (target.dataset.correct === 'true') { byId('lessonFeedback').className = 'check-feedback'; byId('lessonFeedback').textContent = 'Correct. Symmetric ciphers are the efficient choice for large data volumes.'; setTimeout(completeLesson, 650); } else { byId('lessonFeedback').className = 'check-feedback bad-feedback'; byId('lessonFeedback').textContent = 'Try again. Think about the option that avoids public/private-key overhead.'; playTone('bad'); } }
  if (action === 'answer-question') answerQuestion(Number(target.dataset.answer));
  if (action === 'next-question') { questionIndex += 1; renderQuestion(); }
  if (action === 'practice-weak') showView('practice');
  if (action === 'start-recall') { showView('practice'); toast('Recall mode enabled - weak objectives prioritized.'); }
  if (action === 'start-exam') { showView('practice'); toast('Readiness assessment started. Focus mode is on.'); }
  if (action === 'locked-exam') toast(`Build another ${Math.max(0, 60 - state.readiness)}% readiness to unlock this exam.`, 'warning');
  if (action === 'toggle-menu') document.querySelector('.sidebar').classList.toggle('open');
  if (action === 'toggle-sound') { state.soundOn = !state.soundOn; persist(); renderState(); toast(`Practice sounds ${state.soundOn ? 'enabled' : 'muted'}.`); if (state.soundOn) playTone('good'); }
  if (action === 'open-auth') currentUser ? openModal('profileModal') : openModal('authModal');
  if (action === 'open-profile') openModal('profileModal');
  if (action === 'open-plans') openModal('plansModal');
  if (action === 'open-notifications') openModal('notificationsModal');
  if (action === 'open-help') { window.location.href = 'mailto:hello@cydex.dev?subject=Cydex%20early%20access'; }
  if (action === 'switch-auth') switchAuth(target.dataset.authMode);
  if (action === 'logout') { currentUser = null; localStorage.removeItem('cydex-user'); localStorage.removeItem('cydex-session'); renderState(); closeModal('profileModal'); toast('Logged out of this device. Your local study data stays here.'); }
  if (action === 'reset-progress') { state = { ...DEFAULT_STATE, soundOn: state.soundOn, goal: state.goal }; persist(); renderState(); renderDashboard(); toast('Study progress reset. Your account is unchanged.', 'warning'); }
});
document.addEventListener('click', event => { if (event.target.classList.contains('modal-backdrop')) closeModal(event.target.id); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAllModals(); });
byId('signupForm').addEventListener('submit', event => { event.preventDefault(); submitSignup(event.currentTarget); });
byId('loginForm').addEventListener('submit', event => { event.preventDefault(); submitLogin(event.currentTarget); });
byId('profileForm').addEventListener('submit', event => { event.preventDefault(); updateProfile(event.currentTarget); });

renderState(); renderDashboard();
