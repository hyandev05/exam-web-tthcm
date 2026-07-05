// flashcard.js — Flashcard renderer module
// Exports: renderFlashcard(container, questions, chapterLabel)

let currentIndex = 0;
let questions = [];

function renderFlashcard(container, chapterQuestions) {
  questions = chapterQuestions || [];
  currentIndex = 0;

  if (!questions || questions.length === 0) {
    container.innerHTML = renderEmpty();
    lucide.createIcons();
    animateContent(container);
    return;
  }

  renderCard(container);
}

function renderEmpty() {
  return `
    <div class="flex flex-col items-center justify-center py-20" style="opacity:0">
      <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100 mb-4">
        <i data-lucide="book-open" class="w-10 h-10 text-gray-400 animate-float"></i>
      </div>
      <p class="text-lg font-semibold text-text-gray">Chưa có dữ liệu flashcard</p>
      <p class="text-sm text-gray-400 mt-1">Đang chờ thêm câu hỏi...</p>
    </div>
  `;
}

function renderCard(container) {
  const q = questions[currentIndex];

  container.innerHTML = `
    <div id="flashcard-scene" class="flex flex-col items-center" style="opacity:0">
      <!-- Progress -->
      <div class="flex items-center gap-3 mb-5 w-full max-w-md" id="fc-progress">
        <span class="text-sm text-text-gray font-medium min-w-[60px]">
          ${currentIndex + 1} / ${questions.length}
        </span>
        <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full transition-all duration-500 ease-out"
               style="width: ${((currentIndex + 1) / questions.length) * 100}%"></div>
        </div>
      </div>

      <!-- Flashcard -->
      <div id="flashcard"
           class="w-full max-w-2xl cursor-pointer"
           style="perspective: 1000px;">
        <div class="flashcard-inner relative w-full" style="min-height: 280px;">
          <!-- Front -->
          <div class="flashcard-front absolute inset-0 bg-surface rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
            <span class="text-xs font-semibold text-primary uppercase tracking-wider mb-3">${q.citation || ''}</span>
            <p class="text-lg md:text-xl font-semibold leading-relaxed text-text-dark">${q.question}</p>
            <p class="text-xs text-gray-400 mt-6 inline-flex items-center gap-1">
              <i data-lucide="pointer" class="w-3.5 h-3.5"></i> Chạm vào thẻ hoặc nhấn Space
            </p>
          </div>
          <!-- Back -->
          <div class="flashcard-back absolute inset-0 bg-gradient-to-br from-primary to-primary-dark rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center text-center">
            <span class="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Đáp án</span>
            <p class="text-lg md:text-xl font-medium leading-relaxed text-white">${q.answer}</p>
            <p class="text-xs text-white/40 mt-6 inline-flex items-center gap-1">
              <i data-lucide="pointer" class="w-3.5 h-3.5"></i> Chạm để xem câu hỏi
            </p>
          </div>
        </div>
      </div>

      <!-- Nav buttons -->
      <div class="flex items-center gap-3 mt-6">
        <button id="prev-card-btn"
                class="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-text-gray hover:border-primary hover:text-primary transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-text-gray"
                ${currentIndex === 0 ? 'disabled' : ''}>
          <i data-lucide="arrow-left" class="w-4 h-4 inline-block"></i>
          <span class="hidden sm:inline ml-1">Trước</span>
        </button>
        <button id="flip-btn"
                class="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-all duration-200 shadow-md hover:shadow-lg active:scale-95">
          <i data-lucide="refresh-cw" class="w-4 h-4"></i> Lật
        </button>
        <button id="next-card-btn"
                class="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-text-gray hover:border-primary hover:text-primary transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-text-gray"
                ${currentIndex >= questions.length - 1 ? 'disabled' : ''}>
          <span class="hidden sm:inline mr-1">Sau</span>
          <i data-lucide="arrow-right" class="w-4 h-4 inline-block"></i>
        </button>
      </div>

      <!-- Keyboard hint -->
      <p class="text-xs text-gray-300 mt-4 inline-flex items-center gap-2">
        <i data-lucide="delete" class="w-3 h-3"></i>
        <i data-lucide="arrow-left" class="w-3 h-3"></i>
        <i data-lucide="refresh-cw" class="w-3 h-3"></i>
        <i data-lucide="arrow-right" class="w-3 h-3"></i>
      </p>
    </div>
  `;

  lucide.createIcons();
  animateContent(container);

  const fc = document.getElementById('flashcard');
  fc.addEventListener('click', function () { this.classList.toggle('flashcard-flipped'); });

  document.getElementById('flip-btn').addEventListener('click', () => fc.classList.toggle('flashcard-flipped'));

  document.getElementById('prev-card-btn').addEventListener('click', () => {
    if (currentIndex > 0) { currentIndex--; animateCardOut(container).then(() => renderCard(container)); }
  });

  document.getElementById('next-card-btn').addEventListener('click', () => {
    if (currentIndex < questions.length - 1) { currentIndex++; animateCardOut(container).then(() => renderCard(container)); }
  });

  container._keyHandler = (e) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      e.preventDefault(); currentIndex--; animateCardOut(container).then(() => renderCard(container));
    } else if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
      e.preventDefault(); currentIndex++; animateCardOut(container).then(() => renderCard(container));
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault(); const c = document.getElementById('flashcard');
      if (c) c.classList.toggle('flashcard-flipped');
    }
  };
  document.addEventListener('keydown', container._keyHandler);
}

// ===== ANIMATIONS =====
function animateContent(container) {
  const scene = document.getElementById('flashcard-scene');
  if (!scene) return;
  requestAnimationFrame(() => {
    scene.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
    scene.style.opacity = '1'; scene.style.transform = 'translateY(0)';
  });
}

function animateCardOut(container) {
  return new Promise(resolve => {
    const scene = document.getElementById('flashcard-scene');
    if (!scene) { resolve(); return; }
    scene.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
    scene.style.opacity = '0'; scene.style.transform = 'translateY(8px)';
    setTimeout(resolve, 220);
  });
}

function cleanupFlashcard() {}

export { renderFlashcard, cleanupFlashcard };
