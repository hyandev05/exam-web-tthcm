// quiz.js — Quiz engine module
// Exports: renderQuiz(container, quizQuestions)
// quiz-data.json: options = string[], correct = string (value-based matching)

let quizState = {
  questions: [],
  currentIndex: 0,
  answers: [],
  isFinished: false
};

function renderQuiz(container, quizQuestions) {
  quizState = {
    questions: quizQuestions || [],
    currentIndex: 0,
    answers: [],
    isFinished: false
  };

  if (!quizState.questions || quizState.questions.length === 0) {
    container.innerHTML = renderQuizEmpty();
    lucide.createIcons();
    animateIn(container);
    return;
  }

  quizState.questions = shuffleArray([...quizState.questions]);
  renderQuestion(container);
}

function renderQuizEmpty() {
  return `
    <div class="flex flex-col items-center justify-center py-20" style="opacity:0">
      <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100 mb-4">
        <i data-lucide="file-question" class="w-10 h-10 text-gray-400"></i>
      </div>
      <p class="text-lg font-semibold text-text-gray">Chưa có câu hỏi trắc nghiệm</p>
      <p class="text-sm text-gray-400 mt-1">Cần thêm dữ liệu cho chương này...</p>
    </div>
  `;
}

function renderQuestion(container) {
  const q = quizState.questions[quizState.currentIndex];
  const shuffledTexts = shuffleArray([...q.options]);
  const LABELS = ['A', 'B', 'C', 'D'];

  container.innerHTML = `
    <div id="quiz-scene" class="flex flex-col items-center" style="opacity:0; transform:translateY(12px)">
      <!-- Progress -->
      <div class="w-full max-w-2xl mb-5">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-text-gray">
            Câu ${quizState.currentIndex + 1} / ${quizState.questions.length}
          </span>
          <span class="text-sm font-semibold text-primary inline-flex items-center gap-1">
            <i data-lucide="check-circle" class="w-4 h-4"></i> ${quizState.answers.filter(a => a.isCorrect).length} đúng
          </span>
        </div>
        <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full transition-all duration-500 ease-out"
               style="width: ${(quizState.currentIndex / quizState.questions.length) * 100}%"></div>
        </div>
      </div>

      <!-- Question -->
      <div class="w-full max-w-2xl bg-surface rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs font-semibold text-white bg-primary px-2.5 py-0.5 rounded-full">${q.citation || ''}</span>
          <span class="text-xs text-gray-300">/</span>
          <span class="text-xs font-medium text-primary">Câu ${quizState.currentIndex + 1}</span>
        </div>
        <p class="text-lg md:text-xl font-semibold leading-relaxed text-text-dark">${q.question}</p>
      </div>

      <!-- Options -->
      <div class="w-full max-w-2xl grid grid-cols-1 gap-3" id="options-container">
        ${shuffledTexts.map((text, i) => `
          <button data-value="${escapeHtml(text)}"
                  class="quiz-option w-full text-left px-6 py-4 rounded-xl border-2 border-gray-200 bg-surface font-medium text-text-dark">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-sm font-bold text-text-gray mr-3">${LABELS[i]}</span>
            <span class="option-text">${text}</span>
          </button>
        `).join('')}
      </div>

      <!-- Feedback -->
      <div id="feedback-area" class="w-full max-w-2xl mt-4 hidden"></div>

      <!-- Next -->
      <button id="quiz-next-btn"
              class="mt-6 px-8 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 inline-flex items-center gap-2 hidden">
        ${quizState.currentIndex < quizState.questions.length - 1 ? 'Câu Tiếp <i data-lucide="arrow-right" class="w-4 h-4"></i>' : 'Xem Kết Quả <i data-lucide="target" class="w-4 h-4"></i>'}
      </button>
    </div>
  `;

  lucide.createIcons();
  animateIn(container);

  const submitted = quizState.answers.find(a => a.questionId === q.id);
  document.querySelectorAll('#options-container button').forEach(btn => {
    btn.addEventListener('click', () => { if (submitted) return; handleAnswer(container, q, btn.dataset.value); });
  });
  if (submitted) showAnswerState(container, q, submitted);
}

function handleAnswer(container, question, selectedText) {
  const isCorrect = selectedText === question.correct;
  const correctText = question.correct;

  quizState.answers.push({ questionId: question.id, selected: selectedText, correct: correctText, isCorrect });

  document.querySelectorAll('#options-container button').forEach(btn => {
    btn.disabled = true; btn.classList.add('cursor-not-allowed');
    if (btn.dataset.value === correctText) btn.classList.add('correct');
    if (btn.dataset.value === selectedText && !isCorrect) btn.classList.add('wrong');
  });

  const feedback = document.getElementById('feedback-area');
  feedback.classList.remove('hidden');
  if (isCorrect) {
    feedback.innerHTML = `
      <div class="flex items-center gap-2 text-green-600 font-semibold bg-green-50 rounded-xl px-5 py-3 animate-fade-slide-up">
        <i data-lucide="check-circle" class="w-5 h-5"></i> Chính xác! Rất tốt!
      </div>`;
  } else {
    feedback.innerHTML = `
      <div class="flex items-center gap-2 text-red-600 font-semibold bg-red-50 rounded-xl px-5 py-3 animate-fade-slide-up">
        <i data-lucide="x-circle" class="w-5 h-5"></i> Sai rồi! Đáp án đúng là: <span class="font-bold ml-1">${truncate(correctText, 80)}</span>
      </div>`;
  }
  lucide.createIcons();

  const nextBtn = document.getElementById('quiz-next-btn');
  nextBtn.classList.remove('hidden');
  nextBtn.style.opacity = '0'; nextBtn.style.transform = 'translateY(8px)';
  requestAnimationFrame(() => {
    nextBtn.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    nextBtn.style.opacity = '1'; nextBtn.style.transform = 'translateY(0)';
  });
  nextBtn.onclick = () => {
    if (quizState.currentIndex < quizState.questions.length - 1) {
      quizState.currentIndex++; animateCardOut(container).then(() => renderQuestion(container));
    } else { showResults(container); }
  };
}

function showAnswerState(container, question, answer) {
  const correctText = question.correct;
  document.querySelectorAll('#options-container button').forEach(btn => {
    btn.disabled = true; btn.classList.add('cursor-not-allowed');
    if (btn.dataset.value === correctText) btn.classList.add('correct');
    if (btn.dataset.value === answer.selected && !answer.isCorrect) btn.classList.add('wrong');
  });

  const feedback = document.getElementById('feedback-area');
  feedback.classList.remove('hidden');
  feedback.innerHTML = answer.isCorrect
    ? `<div class="flex items-center gap-2 text-green-600 font-semibold bg-green-50 rounded-xl px-5 py-3"><i data-lucide="check-circle" class="w-5 h-5"></i> Chính xác!</div>`
    : `<div class="flex items-center gap-2 text-red-600 font-semibold bg-red-50 rounded-xl px-5 py-3"><i data-lucide="x-circle" class="w-5 h-5"></i> Đáp án đúng: <span class="font-bold">${truncate(correctText, 80)}</span></div>`;
  lucide.createIcons();

  const nextBtn = document.getElementById('quiz-next-btn');
  nextBtn.classList.remove('hidden');
  nextBtn.onclick = () => {
    if (quizState.currentIndex < quizState.questions.length - 1) {
      quizState.currentIndex++; animateCardOut(container).then(() => renderQuestion(container));
    } else { showResults(container); }
  };
}

function showResults(container) {
  quizState.isFinished = true;
  const total = quizState.answers.length;
  const correct = quizState.answers.filter(a => a.isCorrect).length;
  const wrong = total - correct;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (pct / 100) * circumference;

  try {
    const history = JSON.parse(localStorage.getItem('quiz_history') || '[]');
    history.push({ date: new Date().toISOString(), chapter: (quizState.questions[0] && quizState.questions[0].chapter) || 1, correct, total, percentage: pct });
    localStorage.setItem('quiz_history', JSON.stringify(history.slice(-20)));
  } catch (e) {}

  const trophyIcon = '<i data-lucide="trophy" class="w-10 h-10 text-yellow-500"></i>';
  const muscleIcon = '<i data-lucide="muscle" class="w-10 h-10 text-primary"></i>';
  const bookIcon = '<i data-lucide="book-open" class="w-10 h-10 text-text-gray"></i>';
  const resultIcon = pct >= 80 ? trophyIcon : pct >= 50 ? muscleIcon : bookIcon;

  const isCorrectIcon = '<i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i>';
  const isWrongIcon = '<i data-lucide="x-circle" class="w-5 h-5 text-red-500"></i>';

  container.innerHTML = `
    <div id="results-scene" class="flex flex-col items-center py-4" style="opacity:0; transform:translateY(16px)">
      <div class="mb-2 ${pct >= 80 ? 'animate-bounce' : 'animate-float'}">${resultIcon}</div>
      <h2 class="text-2xl font-black text-text-dark mb-1">Kết Quả</h2>
      <p class="text-sm text-text-gray mb-6">${pct >= 80 ? 'Xuất sắc!' : pct >= 50 ? 'Cố gắng thêm!' : 'Luyện tập thêm nhé!'}</p>

      <div class="relative w-36 h-36 mb-6">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" stroke-width="10" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="#2A5CFF" stroke-width="10" stroke-linecap="round"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
                  style="transition: stroke-dashoffset 1.2s ease-out;" />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center"><span class="text-3xl font-black text-primary">${pct}%</span></div>
      </div>

      <div class="grid grid-cols-3 gap-4 w-full max-w-md mb-6">
        <div class="bg-surface rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p class="text-2xl font-black text-text-dark">${total}</p>
          <p class="text-xs text-text-gray">Tổng câu</p>
        </div>
        <div class="bg-surface rounded-xl shadow-sm border border-green-200 p-4 text-center">
          <p class="text-2xl font-black text-green-600">${correct}</p>
          <p class="text-xs text-text-gray">Đúng</p>
        </div>
        <div class="bg-surface rounded-xl shadow-sm border border-red-200 p-4 text-center">
          <p class="text-2xl font-black text-red-500">${wrong}</p>
          <p class="text-xs text-text-gray">Sai</p>
        </div>
      </div>

      <div class="w-full max-w-2xl space-y-3 mb-6">
        <h3 class="text-lg font-bold text-text-dark mb-3 inline-flex items-center gap-2">
          <i data-lucide="clipboard-list" class="w-5 h-5"></i> Chi Tiết
        </h3>
        ${quizState.answers.map((a, i) => {
          const q = quizState.questions[i];
          return `
            <div class="bg-surface rounded-xl shadow-sm border ${a.isCorrect ? 'border-green-200' : 'border-red-200'} p-4 flex items-start gap-3">
              <span class="flex-shrink-0">${a.isCorrect ? isCorrectIcon : isWrongIcon}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-text-dark">${q.question}</p>
                <p class="text-xs mt-1 ${a.isCorrect ? 'text-green-600' : 'text-red-500'}">
                  ${a.isCorrect ? 'Đúng' : 'Sai &rarr; ' + truncate(a.correct, 60)}
                </p>
                ${!a.isCorrect ? `<p class="text-xs text-gray-400 mt-0.5">${truncate(a.correct, 100)}</p>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>

      <div class="flex gap-3">
        <button id="quiz-retry-btn"
                class="px-6 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 inline-flex items-center gap-2">
          <i data-lucide="refresh-cw" class="w-4 h-4"></i> Làm Lại
        </button>
        <button id="quiz-home-btn"
                class="px-6 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 text-text-gray hover:border-primary hover:text-primary transition-all duration-200 inline-flex items-center gap-2">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> Chọn Chương Khác
        </button>
      </div>
    </div>
  `;

  lucide.createIcons();
  animateIn(container);

  document.getElementById('quiz-retry-btn').addEventListener('click', () => {
    animateCardOut(container).then(() => renderQuiz(container, quizState.questions));
  });
  document.getElementById('quiz-home-btn').addEventListener('click', () => {
    container.dispatchEvent(new CustomEvent('quiz-back'));
  });
}

// ===== HELPERS =====
function escapeHtml(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(str, max) {
  if (!str || str.length <= max) return str || '';
  return str.substring(0, max) + '...';
}

function animateIn(container) {
  const target = container.querySelector('[id$="-scene"]');
  if (!target) return;
  requestAnimationFrame(() => {
    target.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
    target.style.opacity = '1'; target.style.transform = 'translateY(0)';
  });
}

function animateCardOut(container) {
  return new Promise(resolve => {
    const target = container.querySelector('[id$="-scene"]');
    if (!target) { resolve(); return; }
    target.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
    target.style.opacity = '0'; target.style.transform = 'translateY(10px)';
    setTimeout(resolve, 220);
  });
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export { renderQuiz };
