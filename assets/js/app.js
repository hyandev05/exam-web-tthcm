// app.js — Main application controller
// Orchestrates: home/study screens, tab switching, chapter selection, animations

import { renderFlashcard } from './flashcard.js';
import { renderQuiz } from './quiz.js';

// ===== STATE =====
const state = {
  activeTab: 'flashcard',
  activeChapter: 1,
  flashcardData: {},
  quizData: {},
  screen: 'home'       // 'home' | 'study'
};

// ===== DOM REFS =====
const $ = (id) => document.getElementById(id);
const homeView    = $('home-view');
const studyView   = $('study-view');
const chapterGrid = $('chapter-grid');
const contentArea = $('content-area');
const tabNav      = $('tab-nav');
const studyTitle  = $('study-title');
const studySub    = $('study-subtitle');
const studyBadge  = $('study-badge');
const backBtn     = $('back-home-btn');
const homeHeader  = $('home-header');
const footer      = $('footer');

// ===== CHAPTER DEFINITIONS =====
const CHAPTERS = [
  { num: 1, label: 'Chương 1', sub: 'Khái niệm, đối tượng, phương pháp & ý nghĩa học tập TTHCM' },
  { num: 2, label: 'Chương 2', sub: 'Cơ sở, quá trình hình thành & phát triển TTHCM' },
  { num: 3, label: 'Chương 3', sub: 'TTHCM về độc lập dân tộc & CNXH' },
  { num: 4, label: 'Chương 4', sub: 'TTHCM về ĐCSVN & Nhà nước' },
  { num: 5, label: 'Chương 5', sub: 'TTHCM về đại đoàn kết dân tộc & quốc tế' },
  { num: 6, label: 'Chương 6', sub: 'TTHCM về văn hóa, đạo đức, con người' },
];

// ===== HELPERS =====
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== DATA LOADING =====
async function loadData() {
  try {
    const [flashRes, quizRes] = await Promise.all([
      fetch('data.json'),
      fetch('quiz-data.json')
    ]);
    const flashRaw = await flashRes.json();
    const quizRaw = await quizRes.json();
    state.flashcardData = groupByChapter(flashRaw);
    state.quizData = groupByChapter(quizRaw);
  } catch (err) {
    console.error('Failed to load data:', err);
    contentArea.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20">
        <div class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 17.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p class="text-lg font-semibold text-red-600">&#x26A0;&#xFE0F; Lỗi tải dữ liệu</p>
        <p class="text-sm text-gray-400 mt-2">${err.message}</p>
      </div>`;
    throw err;
  }
}

function groupByChapter(items) {
  const grouped = {};
  items.forEach(item => {
    let ch = item.chapter;
    if (!ch) {
      const m = item.citation && item.citation.match(/C(\d+)/);
      ch = m ? parseInt(m[1]) : 1;
    }
    if (!grouped[ch]) grouped[ch] = [];
    grouped[ch].push(item);
  });
  return grouped;
}

// ===== SCREEN NAVIGATION =====
function navigateToStudy(chapter) {
  state.screen = 'study';
  state.activeChapter = chapter;

  const chInfo = CHAPTERS.find(c => c.num === chapter);
  const dataSource = state.activeTab === 'flashcard' ? state.flashcardData : state.quizData;
  const items = dataSource[chapter] || [];

  // Update study header
  studyTitle.textContent = chInfo ? chInfo.label : 'Chương ' + chapter;
  studySub.textContent = chInfo ? chInfo.sub : '';
  studyBadge.textContent = items.length > 0
    ? (state.activeTab === 'flashcard' ? items.length + ' thẻ' : items.length + ' câu')
    : 'Trống';

  // Pre-fill content area BEFORE animation
  if (items.length === 0) {
    contentArea.innerHTML = renderComingSoon(chapter);
  }

  // Animate: hide home, show study
  animateHomeOut().then(() => {
    document.body.classList.add('study-active');
    animateStudyIn();
  });
}

function renderComingSoon(chapter) {
  const images = [
    '&#x1F4DA;', '&#x1F4D6;', '&#x1F4D9;', '&#x1F4D5;', '&#x1F4D8;', '&#x1F4D7;'
  ];
  const img = images[(chapter - 1) % images.length];
  return `
    <div id="coming-scene" class="flex flex-col items-center justify-center py-16" style="opacity:0; transform:translateY(20px)">
      <div class="relative mb-6">
        <div class="text-6xl mb-2 text-center">${img}</div>
        <div class="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center animate-pulse-soft">
          <span class="text-white text-[10px] font-black">${chapter}</span>
        </div>
      </div>
      <h3 class="text-2xl font-black text-text-dark mb-2">Chương ${chapter}</h3>
      <p class="text-lg font-semibold text-primary mb-3">Coming Soon</p>
      <p class="text-sm text-text-gray text-center max-w-md">
        Nội dung đang được cập nhật. Quay lại sau nhé!
      </p>
      <div class="flex gap-1.5 mt-6">
        <span class="w-2 h-2 rounded-full bg-primary animate-bounce" style="animation-delay:0s"></span>
        <span class="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style="animation-delay:0.15s"></span>
        <span class="w-2 h-2 rounded-full bg-primary/30 animate-bounce" style="animation-delay:0.3s"></span>
      </div>
    </div>
  `;
}

function navigateHome() {
  state.screen = 'home';

  animateStudyOut().then(() => {
    document.body.classList.remove('study-active');
    animateHomeIn();
  });
}

// ===== HOME ANIMATIONS =====
function animateHomeIn() {
  // Reset stagger
  const grid = chapterGrid;
  grid.classList.remove('anim-stagger-in');
  grid.style.opacity = '1';

  // Home header entrance
  homeHeader.style.opacity = '0';
  homeHeader.style.transform = 'translateY(20px)';
  requestAnimationFrame(() => {
    homeHeader.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
    homeHeader.style.opacity = '1';
    homeHeader.style.transform = 'translateY(0)';
  });

  // Chapter grid stagger entrance
  requestAnimationFrame(() => {
    grid.classList.add('anim-stagger-in');
  });

  // Footer fade in
  footer.style.opacity = '0';
  footer.style.transition = 'opacity 0.3s ease';
  requestAnimationFrame(() => { footer.style.opacity = '1'; });
}

function animateHomeOut() {
  return new Promise(resolve => {
    homeHeader.style.transition = 'opacity 0.25s ease-out, transform 0.25s ease-out';
    homeHeader.style.opacity = '0';
    homeHeader.style.transform = 'translateY(-12px)';

    chapterGrid.style.transition = 'opacity 0.25s ease-out, transform 0.25s ease-out';
    chapterGrid.style.opacity = '0';
    chapterGrid.style.transform = 'translateY(12px)';

    footer.style.transition = 'opacity 0.2s ease';
    footer.style.opacity = '0';

    setTimeout(resolve, 300);
  });
}

// ===== STUDY ANIMATIONS =====
function animateStudyIn() {
  const header = $('study-header');
  const area = contentArea;

  // Reset
  header.classList.remove('anim-enter-active');
  area.style.opacity = '0';
  area.style.transform = 'translateY(20px)';

  // Header entrance
  requestAnimationFrame(() => {
    header.classList.add('anim-enter-active');
  });

  // Content entrance (slightly delayed)
  setTimeout(() => {
    area.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
    area.style.opacity = '1';
    area.style.transform = 'translateY(0)';

    // Animate coming-soon scene if present
    const cs = area.querySelector('#coming-scene');
    if (cs) {
      cs.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
      cs.style.opacity = '1';
      cs.style.transform = 'translateY(0)';
    }
  }, 120);

  // Only render content if not already set (coming-soon is pre-filled)
  if (!area.querySelector('#coming-scene')) {
    renderContent();
  }
}

function animateStudyOut() {
  return new Promise(resolve => {
    const header = $('study-header');
    const area = contentArea;

    header.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
    header.style.opacity = '0';
    header.style.transform = 'translateY(-12px)';

    area.style.transition = 'opacity 0.25s ease-out, transform 0.25s ease-out';
    area.style.opacity = '0';
    area.style.transform = 'translateY(16px)';

    setTimeout(resolve, 280);
  });
}

// ===== RENDER CHAPTER GRID =====
function renderChapterGrid() {
  const dataSource = state.activeTab === 'flashcard' ? state.flashcardData : state.quizData;

  chapterGrid.innerHTML = CHAPTERS.map(ch => {
    const items = dataSource[ch.num] || [];
    const hasData = items.length > 0;

    return `
      <button data-chapter="${ch.num}"
              class="chapter-btn group relative bg-surface rounded-2xl p-5 text-left transition-all duration-300 border-2
                     border-gray-100 shadow-sm hover:border-primary hover:shadow-lg hover:-translate-y-1
                     ${!hasData ? 'opacity-60' : ''}">
        <!-- Hover accent bar -->
        <div class="absolute top-0 left-4 right-4 h-0.5 bg-primary rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        <div class="flex items-start justify-between mb-2">
          <span class="inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black bg-gray-100 text-text-gray group-hover:bg-primary group-hover:text-white transition-all duration-300">
            ${ch.num}
          </span>
          ${hasData
            ? `<span class="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">${items.length} câu</span>`
            : `<span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Trống</span>`
          }
        </div>
        <h3 class="font-bold text-sm md:text-base text-text-dark leading-snug group-hover:text-primary transition-colors duration-200">${ch.label}</h3>
        <p class="text-xs text-text-gray mt-1 line-clamp-2">${ch.sub}</p>
      </button>`;
  }).join('');

  // Click handlers
  document.querySelectorAll('.chapter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ch = parseInt(btn.dataset.chapter);
      navigateToStudy(ch);
    });
  });
}

// ===== RENDER CONTENT =====
function renderContent() {
  const dataSource = state.activeTab === 'flashcard' ? state.flashcardData : state.quizData;
  const chapterQuestions = dataSource[state.activeChapter] || [];
  const chapterLabel = 'Chương ' + state.activeChapter;

  if (state.activeTab === 'flashcard') {
    renderFlashcard(contentArea, chapterQuestions, chapterLabel);
  } else {
    renderQuiz(contentArea, chapterQuestions);
  }
}

// ===== QUIZ BACK HANDLER =====
contentArea.addEventListener('quiz-back', navigateHome);

// ===== SETUP BACK BUTTON =====
function setupBackButton() {
  backBtn.addEventListener('click', navigateHome);

  // Logo click → home
  window.addEventListener('nav-home', () => {
    if (state.screen === 'study') navigateHome();
  });
}

// ===== SETUP TABS =====
function setupTabs() {
  tabNav.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn || btn.dataset.tab === state.activeTab) return;

    state.activeTab = btn.dataset.tab;

    // Update tab button styles
    tabNav.querySelectorAll('[data-tab]').forEach(b => {
      const active = b.dataset.tab === state.activeTab;
      b.className = 'px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 '
        + (active
          ? 'bg-primary text-white shadow-md'
          : 'text-text-gray hover:text-text-dark');
    });

    if (state.screen === 'home') {
      renderChapterGrid();
      // Re-trigger stagger entrance
      requestAnimationFrame(() => {
        chapterGrid.classList.add('anim-stagger-in');
      });
    } else {
      // Re-render study view with new tab data
      const chInfo = CHAPTERS.find(c => c.num === state.activeChapter);
      const dataSource = state.activeTab === 'flashcard' ? state.flashcardData : state.quizData;
      const items = dataSource[state.activeChapter] || [];

      studyTitle.textContent = chInfo ? chInfo.label : 'Chương ' + state.activeChapter;
      studyBadge.textContent = items.length > 0
        ? (state.activeTab === 'flashcard' ? items.length + ' thẻ' : items.length + ' câu')
        : 'Trống';

      // Fade out/in content
      contentArea.style.opacity = '0';
      contentArea.style.transform = 'translateY(12px)';
      setTimeout(() => {
        renderContent();
        contentArea.style.transition = 'opacity 0.35s ease-out, transform 0.35s ease-out';
        contentArea.style.opacity = '1';
        contentArea.style.transform = 'translateY(0)';
      }, 200);
    }
  });
}

// ===== INIT =====
async function init() {
  await loadData();
  setupTabs();
  setupBackButton();
  renderChapterGrid();

  // Entrance animation on first load
  requestAnimationFrame(() => {
    homeHeader.classList.add('anim-enter-active');
    chapterGrid.classList.add('anim-stagger-in');
  });
}

init();
