const defaultState = { streak: 7, xp: 1240, readiness: 42, recall: 12, lessons: 3, answers: 0, correct: 0 };
let state = { ...defaultState, ...JSON.parse(localStorage.getItem('cydex-state') || '{}') };
let questionIndex = 0;

const objectives = [
  { domain: 'General Security Concepts', code: '1.0', objectives: [
    ['1.1', 'Security controls', 'done'], ['1.2', 'Cryptographic concepts', 'current'], ['1.3', 'Authentication factors', ''], ['1.4', 'Security principles', '']
  ]},
  { domain: 'Threats, Vulnerabilities & Mitigations', code: '2.0', objectives: [
    ['2.1', 'Threat actors', 'done'], ['2.2', 'Attack vectors', 'done'], ['2.3', 'Vulnerability management', ''], ['2.4', 'Malware', '']
  ]},
  { domain: 'Security Architecture', code: '3.0', objectives: [
    ['3.1', 'Enterprise security', ''], ['3.2', 'Cloud security', ''], ['3.3', 'Resilience', ''], ['3.4', 'Zero trust', '']
  ]}
];
const focusAreas = [
  ['WPA3 & wireless encryption', 31], ['Public key infrastructure', 38], ['Identity federation', 44]
];
const questions = [
  { tag:'OBJ 1.2', prompt:'A company needs to encrypt large database backups quickly. Which approach is the best fit?', answers:['Asymmetric encryption with a public key','Symmetric encryption with a shared secret key','Hashing each backup with SHA-256','A digital signature for every file'], correct:1, explanation:'Symmetric encryption uses one shared key and is much faster than asymmetric encryption for bulk data. Hashing verifies integrity, while signatures verify authenticity; neither encrypts the backup.' },
  { tag:'OBJ 1.2', prompt:'Which cryptographic property confirms that a message has not been altered in transit?', answers:['Confidentiality','Integrity','Availability','Non-repudiation'], correct:1, explanation:'Integrity means data remains accurate and unchanged. A hash or message authentication code can help detect modification.' },
  { tag:'OBJ 2.2', prompt:'An attacker sends a carefully crafted email that appears to come from the payroll department. What is this attack vector?', answers:['Phishing','Shoulder surfing','Evil twin','Privilege escalation'], correct:0, explanation:'Phishing uses deceptive messages to persuade people to disclose information or take unsafe actions.' }
];

function persist() { localStorage.setItem('cydex-state', JSON.stringify(state)); }
function byId(id) { return document.getElementById(id); }
function toast(message) { const el = byId('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove('show'), 3200); }
function renderState() {
  byId('streakCount').textContent = state.streak;
  byId('xpValue').textContent = state.xp.toLocaleString();
  byId('readinessValue').textContent = `${state.readiness}%`;
  byId('readinessBar').style.width = `${state.readiness}%`;
  byId('reviewCount').textContent = state.recall;
  byId('recallRemaining').textContent = state.recall;
  byId('terminalScore').textContent = `${state.correct} / ${state.answers}`;
  byId('completedObjectives').textContent = `${state.lessons} / 18`;
  byId('pathProgress').style.width = `${Math.round(state.lessons / 18 * 100)}%`;
}
function renderDashboard() {
  byId('skillTree').innerHTML = [
    ['1.1', 'Controls', 'done'], ['1.2', 'Crypto', 'current'], ['1.3', 'Auth', 'locked'], ['1.4', 'Principles', 'locked'], ['2.1', 'Threats', 'locked']
  ].map(([code, name, status]) => `<article class="tree-node ${status}"><small>${code} / ${status === 'done' ? 'mastered' : status === 'current' ? 'in progress' : 'locked'}</small><strong>${name}${status === 'done' ? ' ✓' : ''}</strong></article>`).join('');
  byId('focusList').innerHTML = focusAreas.map(([label, percent]) => `<article class="focus-item"><div><span>OBJECTIVE</span><span>${percent}% confident</span></div><strong>${label}</strong><div class="progress"><i style="width:${percent}%"></i></div></article>`).join('');
  byId('objectiveMap').innerHTML = objectives.map(({ domain, code, objectives: items }) => `<section class="domain"><div class="domain-head"><h2>${domain}</h2><span>DOMAIN ${code}</span></div><div class="objective-items">${items.map(([num, label, status]) => `<button class="objective ${status}" data-objective="${num}" ${status === '' ? 'disabled' : ''}><i></i><span>${num} · ${label}${status === 'done' ? ' ✓' : ''}</span></button>`).join('')}</div></section>`).join('');
  document.querySelectorAll('[data-objective="1.2"]').forEach(button => button.addEventListener('click', openLesson));
}
function showView(view) {
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.id === view));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  document.querySelector('.sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (view === 'practice') renderQuestion();
}
function renderQuestion() {
  const q = questions[questionIndex % questions.length];
  byId('questionTag').textContent = q.tag;
  byId('questionWrap').innerHTML = `<div class="question-number">QUESTION ${questionIndex + 1} / ADAPTIVE DRILL</div><h2>${q.prompt}</h2><div class="answers">${q.answers.map((answer, index) => `<button class="answer" data-answer="${index}"><span class="answer-key">${String.fromCharCode(65 + index)}</span><span>${answer}</span></button>`).join('')}</div>`;
  document.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => answerQuestion(Number(button.dataset.answer))));
}
function answerQuestion(answer) {
  const q = questions[questionIndex % questions.length];
  const buttons = document.querySelectorAll('[data-answer]');
  buttons.forEach((button, index) => { button.disabled = true; if (index === q.correct) button.classList.add('correct'); if (index === answer && answer !== q.correct) button.classList.add('incorrect'); });
  const correct = answer === q.correct;
  state.answers += 1;
  if (correct) { state.correct += 1; state.xp += 20; state.readiness = Math.min(99, state.readiness + 1); }
  else { state.recall += 1; }
  persist(); renderState();
  const feedback = document.createElement('div');
  feedback.className = 'explanation';
  feedback.innerHTML = `<strong>${correct ? '✓ CORRECT — +20 XP' : 'NOT QUITE — ADDED TO RECALL QUEUE'}</strong><p>${q.explanation}</p><button class="primary-button next-question">Next question <span>→</span></button>`;
  byId('questionWrap').append(feedback);
  feedback.querySelector('button').addEventListener('click', () => { questionIndex += 1; renderQuestion(); });
}
function openLesson() { byId('modalBackdrop').hidden = false; }
function closeLesson() { byId('modalBackdrop').hidden = true; byId('checkFeedback').innerHTML = ''; }
function completeLesson() { state.lessons = Math.min(18, state.lessons + 1); state.xp += 80; state.readiness = Math.min(99, state.readiness + 2); state.streak = Math.max(7, state.streak); persist(); renderState(); renderDashboard(); closeLesson(); toast('Mission complete. +80 XP and Objective 1.2 progress recorded.'); }

document.querySelectorAll('[data-view], [data-view-link]').forEach(el => el.addEventListener('click', event => { event.preventDefault(); showView(el.dataset.view || el.dataset.viewLink); }));
document.querySelectorAll('[data-action="start-mission"]').forEach(el => el.addEventListener('click', openLesson));
document.querySelector('[data-action="practice-weak"]').addEventListener('click', () => showView('practice'));
document.querySelector('[data-action="start-recall"]').addEventListener('click', () => { showView('practice'); toast('Recall mode enabled — questions will target your weakest objectives.'); });
document.querySelector('[data-action="start-exam"]').addEventListener('click', () => { showView('practice'); toast('Readiness assessment started. Focus mode is on.'); });
document.querySelector('.modal-close').addEventListener('click', closeLesson);
byId('modalBackdrop').addEventListener('click', event => { if (event.target === byId('modalBackdrop')) closeLesson(); });
document.querySelectorAll('[data-check]').forEach(button => button.addEventListener('click', () => { const feedback = byId('checkFeedback'); if (button.dataset.check === 'correct') { feedback.className = 'check-feedback'; feedback.style.color = 'var(--green)'; feedback.textContent = 'Correct. Symmetric ciphers are the efficient choice for large data volumes.'; setTimeout(completeLesson, 900); } else { feedback.className = 'check-feedback'; feedback.style.color = 'var(--danger)'; feedback.textContent = 'Try again. Think about which option avoids the overhead of public/private key operations.'; } }));
byId('resetProgress').addEventListener('click', () => { state = { ...defaultState }; persist(); renderState(); renderDashboard(); toast('Demo progress has been reset.'); });
document.querySelector('.mobile-menu').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));

renderState();
renderDashboard();
