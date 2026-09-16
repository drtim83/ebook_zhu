document.addEventListener('DOMContentLoaded', () => {
  const data = window.BOOK_DATA || { pages: [], englishSections: [], totalPages: 96 };
  let currentPage = 1;
  let currentMode = 'scan'; // 'scan' | 'bilingual' | 'english' | 'guide'
  let currentTheme = localStorage.getItem('reader_theme') || 'theme-light';
  document.body.className = currentTheme;

  // DOM Elements
  const pageImage = document.getElementById('pageImage');
  const bilingualImage = document.getElementById('bilingualImage');
  const bilingualEnglish = document.getElementById('bilingualEnglish');
  const bilingualChinese = document.getElementById('bilingualChinese');
  const bilingualBadge = document.getElementById('bilingualBadge');
  const englishLayout = document.getElementById('englishLayout');

  const currentPageNum = document.getElementById('currentPageNum');
  const totalPageNum = document.getElementById('totalPageNum');
  const pageSlider = document.getElementById('pageSlider');

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const quickJumpBtn = document.getElementById('quickJumpBtn');

  const scanView = document.getElementById('scanView');
  const bilingualView = document.getElementById('bilingualView');
  const englishView = document.getElementById('englishView');
  const guideView = document.getElementById('guideView');

  const modeTabs = document.querySelectorAll('.mode-tab');
  const themeBtn = document.getElementById('themeBtn');

  const tocBtn = document.getElementById('tocBtn');
  const tocOverlay = document.getElementById('tocOverlay');
  const closeTocBtn = document.getElementById('closeTocBtn');
  const tocPagesList = document.getElementById('tocPagesList');
  const tocChaptersList = document.getElementById('tocChaptersList');
  const tocGuideList = document.getElementById('tocGuideList');
  const drawerTabs = document.querySelectorAll('.drawer-tab');

  const searchBtn = document.getElementById('searchBtn');
  const searchOverlay = document.getElementById('searchOverlay');
  const closeSearchBtn = document.getElementById('closeSearchBtn');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  // Guide Sub-Navigation Pills
  const guidePills = document.querySelectorAll('.guide-pill');
  const guideSections = document.querySelectorAll('.guide-section');

  guidePills.forEach(pill => {
    pill.addEventListener('click', () => {
      guidePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const targetId = pill.dataset.target;
      guideSections.forEach(sec => {
        sec.classList.toggle('active', sec.id === targetId);
      });
      guideView.scrollTop = 0;
      if (targetId === 'guideTree' && typeof window.renderCurrentFamilyTree === 'function') {
        window.renderCurrentFamilyTree();
      }
    });
  });

  totalPageNum.textContent = data.totalPages;
  pageSlider.max = data.totalPages;

  // Render English sections in English View
  function renderEnglishChapters() {
    englishLayout.innerHTML = '';
    data.englishSections.forEach((sec, idx) => {
      const div = document.createElement('div');
      div.className = 'eng-section';
      div.id = `eng_sec_${idx}`;
      const h2 = document.createElement('h2');
      h2.textContent = sec.title;
      div.appendChild(h2);
      sec.paragraphs.forEach(p => {
        const pElem = document.createElement('p');
        pElem.textContent = p;
        div.appendChild(pElem);
      });
      englishLayout.appendChild(div);
    });
  }
  renderEnglishChapters();

  // Populate Table of Contents
  function populateTOC() {
    // Pages
    tocPagesList.innerHTML = '';
    data.pages.forEach(p => {
      const item = document.createElement('div');
      item.className = `toc-item ${p.pageNum === currentPage ? 'current' : ''}`;
      const title = p.pageNum === 1 ? '书脊外观 / Book Inspection' : p.pageNum === 2 ? '封面 / Book Cover' : `第 ${p.pageNum} 页 (Page ${p.pageNum})`;
      item.innerHTML = `<span>${title}</span><span style="color:var(--text-secondary);font-size:0.75rem;">${p.chineseText.slice(0, 15)}...</span>`;
      item.addEventListener('click', () => {
        goToPage(p.pageNum);
        switchMode('scan');
        tocOverlay.classList.remove('open');
      });
      tocPagesList.appendChild(item);
    });

    // English Chapters
    tocChaptersList.innerHTML = '';
    data.englishSections.forEach((sec, idx) => {
      const item = document.createElement('div');
      item.className = 'toc-item';
      item.innerHTML = `<span>${sec.title}</span>`;
      item.addEventListener('click', () => {
        switchMode('english');
        tocOverlay.classList.remove('open');
        const target = document.getElementById(`eng_sec_${idx}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
      tocChaptersList.appendChild(item);
    });

    // Guide Sections
    if (tocGuideList) {
      tocGuideList.innerHTML = '';
      const guideItems = [
        { id: 'guideTimeline', title: '1. Historical Timeline (1046 BC - Present)' },
        { id: 'guideTree', title: '2. Simplified Family Tree Chart' },
        { id: 'guidePeople', title: '3. Key Figures of the Clan' },
        { id: 'guidePoem', title: '4. Generational Naming Code (字辈)' },
        { id: 'guideMandate', title: '5. The 20-Year Sacred Mandate' },
        { id: 'guideAboutMe', title: '6. About Me (Ts. Dr. 祝明灿 · 19th Generation)' }
      ];
      guideItems.forEach(g => {
        const item = document.createElement('div');
        item.className = 'toc-item';
        item.innerHTML = `<span>${g.title}</span>`;
        item.addEventListener('click', () => {
          switchMode('guide');
          tocOverlay.classList.remove('open');
          const pill = document.querySelector(`.guide-pill[data-target="${g.id}"]`);
          if (pill) pill.click();
        });
        tocGuideList.appendChild(item);
      });
    }
  }
  populateTOC();

  // Find matching English section for current page
  function getRelevantEnglish(pageNum) {
    if (pageNum <= 2) {
      return data.englishSections[0]?.paragraphs.slice(0, 3).join('\n\n') || "Book Cover & Overview";
    }
    const secIndex = Math.min(
      data.englishSections.length - 1,
      Math.floor(((pageNum - 2) / (data.totalPages - 2)) * data.englishSections.length)
    );
    const sec = data.englishSections[secIndex];
    if (sec) {
      return `【${sec.title}】\n\n` + sec.paragraphs.slice(0, 4).join('\n\n');
    }
    return "See English Edition or Guide tab for full detailed translations.";
  }

  // Go to page
  function goToPage(num) {
    if (num < 1) num = 1;
    if (num > data.totalPages) num = data.totalPages;
    currentPage = num;

    currentPageNum.textContent = currentPage;
    pageSlider.value = currentPage;

    const SUPABASE_CDN_PREFIX = "https://rnrvhdhyoqnnljygslgf.supabase.co/storage/v1/object/public/ebook-assets/";
    const pageObj = data.pages[currentPage - 1];
    if (pageObj) {
      const isFile = window.location.protocol === 'file:';
      const cleanImg = pageObj.image.replace(/^pages\//, '');
      const localPath = "pages/" + cleanImg;
      const cdnPath = SUPABASE_CDN_PREFIX + "pages/" + cleanImg;

      const primaryUrl = isFile ? localPath : cdnPath;
      const fallbackUrl = isFile ? cdnPath : localPath;

      pageImage.onerror = function() {
        if (this.src !== fallbackUrl && !this.src.endsWith(fallbackUrl)) {
          this.src = fallbackUrl;
        }
      };
      bilingualImage.onerror = function() {
        if (this.src !== fallbackUrl && !this.src.endsWith(fallbackUrl)) {
          this.src = fallbackUrl;
        }
      };

      pageImage.src = primaryUrl;
      bilingualImage.src = primaryUrl;
      bilingualChinese.textContent = pageObj.chineseText || '（本页为图表或无文字）';
      bilingualEnglish.textContent = getRelevantEnglish(currentPage);
      bilingualBadge.textContent = currentPage === 1 ? 'Physical Book' : currentPage === 2 ? 'Book Cover' : `Page ${currentPage} / ${data.totalPages || 96}`;
    }

    // Update TOC highlights
    document.querySelectorAll('#tocPagesList .toc-item').forEach((item, idx) => {
      item.classList.toggle('current', idx === currentPage - 1);
    });

    scanView.scrollTop = 0;
    bilingualView.scrollTop = 0;
  }

  // Navigation handlers
  prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
  nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
  pageSlider.addEventListener('input', (e) => goToPage(parseInt(e.target.value)));

  quickJumpBtn.addEventListener('click', () => {
    const val = prompt(`Jump to page (1 - ${data.totalPages}):`, currentPage);
    if (val) {
      const n = parseInt(val);
      if (!isNaN(n)) goToPage(n);
    }
  });

  // Touch swipe support on scanView
  let touchStartX = 0;
  let touchStartY = 0;
  scanView.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  scanView.addEventListener('touchend', (e) => {
    const diffX = e.changedTouches[0].screenX - touchStartX;
    const diffY = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        goToPage(currentPage + 1);
      } else {
        goToPage(currentPage - 1);
      }
    }
  }, { passive: true });

  // Mode Switching
  function switchMode(mode) {
    currentMode = mode;
    modeTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    scanView.classList.toggle('active', mode === 'scan');
    bilingualView.classList.toggle('active', mode === 'bilingual');
    englishView.classList.toggle('active', mode === 'english');
    guideView.classList.toggle('active', mode === 'guide');

    const isPagedMode = mode === 'scan' || mode === 'bilingual';
    prevBtn.style.display = isPagedMode ? 'flex' : 'none';
    nextBtn.style.display = isPagedMode ? 'flex' : 'none';

    if (mode === 'guide') {
      const activePill = document.querySelector('.guide-pill.active');
      if (activePill && activePill.dataset.target === 'guideTree' && typeof window.renderCurrentFamilyTree === 'function') {
        setTimeout(window.renderCurrentFamilyTree, 50);
      }
    }
  }

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });

  // Theme Switching (Light -> Sepia -> Dark -> Light)
  const themes = ['theme-light', 'theme-sepia', 'theme-dark'];
  themeBtn.addEventListener('click', () => {
    let nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
    currentTheme = themes[nextIdx];
    document.body.className = currentTheme;
    localStorage.setItem('reader_theme', currentTheme);
  });

  // TOC Modal
  tocBtn.addEventListener('click', () => tocOverlay.classList.add('open'));
  closeTocBtn.addEventListener('click', () => tocOverlay.classList.remove('open'));
  tocOverlay.addEventListener('click', (e) => {
    if (e.target === tocOverlay) tocOverlay.classList.remove('open');
  });

  // About Me Modal & Actions
  const aboutMeBtn = document.getElementById('aboutMeBtn');
  const aboutMeOverlay = document.getElementById('aboutMeOverlay');
  const closeAboutMeBtn = document.getElementById('closeAboutMeBtn');
  const aboutJumpTreeBtn = document.getElementById('aboutJumpTreeBtn');
  const modalJumpTreeBtn = document.getElementById('modalJumpTreeBtn');
  const aboutJumpPageBtn = document.getElementById('aboutJumpPageBtn');
  const modalJumpPageBtn = document.getElementById('modalJumpPageBtn');

  if (aboutMeBtn && aboutMeOverlay) {
    aboutMeBtn.addEventListener('click', () => aboutMeOverlay.classList.add('open'));
  }
  if (closeAboutMeBtn && aboutMeOverlay) {
    closeAboutMeBtn.addEventListener('click', () => aboutMeOverlay.classList.remove('open'));
  }
  if (aboutMeOverlay) {
    aboutMeOverlay.addEventListener('click', (e) => {
      if (e.target === aboutMeOverlay) aboutMeOverlay.classList.remove('open');
    });
  }

  function handleJumpToMyTree() {
    if (aboutMeOverlay) aboutMeOverlay.classList.remove('open');
    switchMode('guide');
    const pill = document.querySelector('.guide-pill[data-target="guideTree"]');
    if (pill) pill.click();
    const chip = document.getElementById('chipFocusMe');
    if (chip) chip.click();
  }

  function handleJumpToMyPage() {
    if (aboutMeOverlay) aboutMeOverlay.classList.remove('open');
    switchMode('scan');
    goToPage(44);
  }

  aboutJumpTreeBtn?.addEventListener('click', handleJumpToMyTree);
  modalJumpTreeBtn?.addEventListener('click', handleJumpToMyTree);
  aboutJumpPageBtn?.addEventListener('click', handleJumpToMyPage);
  modalJumpPageBtn?.addEventListener('click', handleJumpToMyPage);

  // ============================================================
  // WeChat QR Code Modal Interactivity
  // ============================================================
  const contactQrModal = document.getElementById('contactQrModal');
  const closeContactQrBtn = document.getElementById('closeContactQrBtn');
  const copyWechatIdBtn = document.getElementById('copyWechatIdBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const viewQrBtns = document.querySelectorAll('.view-qr-btn');

  function openContactQr() {
    if (!contactQrModal) return;
    contactQrModal.classList.add('open');
  }

  function closeContactQr() {
    if (contactQrModal) contactQrModal.classList.remove('open');
  }

  viewQrBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openContactQr();
    });
  });

  closeContactQrBtn?.addEventListener('click', closeContactQr);

  if (contactQrModal) {
    contactQrModal.addEventListener('click', (e) => {
      if (e.target === contactQrModal) closeContactQr();
    });
  }

  // Copy WeChat ID
  if (copyWechatIdBtn) {
    copyWechatIdBtn.addEventListener('click', async () => {
      const wechatId = document.getElementById('wechatIdVal')?.textContent?.trim() || 'drtiM';
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(wechatId);
        } else {
          const tempInput = document.createElement('input');
          tempInput.value = wechatId;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }
        copyWechatIdBtn.classList.add('copied');
        if (copyBtnText) copyBtnText.textContent = 'Copied! ✓';
        setTimeout(() => {
          copyWechatIdBtn.classList.remove('copied');
          if (copyBtnText) copyBtnText.textContent = 'Copy ID';
        }, 2200);
      } catch (err) {
        console.warn('Clipboard copy failed:', err);
      }
    });
  }

  drawerTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      drawerTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetTab = tab.dataset.tab;
      tocPagesList.classList.toggle('active', targetTab === 'pages');
      tocChaptersList.classList.toggle('active', targetTab === 'chapters');
      if (tocGuideList) tocGuideList.classList.toggle('active', targetTab === 'guide');
    });
  });

  // Search Modal
  searchBtn.addEventListener('click', () => {
    searchOverlay.classList.add('open');
    searchInput.focus();
  });
  closeSearchBtn.addEventListener('click', () => searchOverlay.classList.remove('open'));
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) searchOverlay.classList.remove('open');
  });

  // Perform search
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      searchResults.innerHTML = '<div class="search-hint">Type to search across Chinese pages, English chapters, and lineage tree.</div>';
      return;
    }

    const matches = [];

    // Search Guide items
    const guideSearchItems = [
      { id: 'guideTimeline', title: 'Timeline', text: 'State of Zhu 1046 BC Taiyuan Hainan Dehui Zhu Gao Guangxu 1895 Nanyang martyrs 2007' },
      { id: 'guideTree', title: 'Family Tree Chart', text: 'Zhurong Dehui Zhu Gao Long Yi Jing Ting Wenwang Wenhong Tianwei Tianhua Tianzhong Biqi Bishou Biling Bien Bihui Bichuan Youyan Youmao Youyi Youmin Youlong Youji Youhui Youhuan Youpeng Youxin Youjue Yougong Youjian Youjing Youneng Xing Xinchuan Sheng Chao Zhaoke Jia Sheng Shengjin Mingcan Ming Yun' },
      { id: 'guidePeople', title: 'Key Figures', text: 'Zhu Gao Zhu Ting Wenwang Wenhong Zhu Xinchuan Zhu Zhaoke Zhu Shengjin Zhu Mingcan Martyrs Wenchang Wanning Gaolong' },
      { id: 'guidePoem', title: 'Naming Code Poem', text: 'Zu Gao Long Yi Jing Ting Tian Bi Qiu You Chuan Wen Ji Zhen Xing Sheng Chao Jia Sheng Ming Yun Ji Chang Qi Ying Xian Si Da' }
    ];
    guideSearchItems.forEach(g => {
      if (g.text.toLowerCase().includes(query) || g.title.toLowerCase().includes(query)) {
        matches.push({
          type: 'guide',
          targetId: g.id,
          header: `Guide: ${g.title}`,
          snippet: `Found in Lineage Guide: ${g.title}`
        });
      }
    });

    // Search Chinese Pages
    data.pages.forEach(p => {
      if (p.chineseText && p.chineseText.toLowerCase().includes(query)) {
        const idx = p.chineseText.toLowerCase().indexOf(query);
        const start = Math.max(0, idx - 20);
        const end = Math.min(p.chineseText.length, idx + query.length + 30);
        matches.push({
          type: 'page',
          target: p.pageNum,
          header: `Page ${p.pageNum} (Chinese Scan)`,
          snippet: '...' + p.chineseText.substring(start, end).replace(/\n/g, ' ') + '...'
        });
      }
    });

    // Search English Sections
    data.englishSections.forEach((sec, sIdx) => {
      const joined = sec.paragraphs.join(' ');
      if (sec.title.toLowerCase().includes(query) || joined.toLowerCase().includes(query)) {
        const idx = joined.toLowerCase().indexOf(query);
        const start = Math.max(0, idx - 20);
        const end = Math.min(joined.length, idx + query.length + 40);
        matches.push({
          type: 'english',
          secIndex: sIdx,
          header: `English: ${sec.title}`,
          snippet: '...' + joined.substring(start, end) + '...'
        });
      }
    });

    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="search-hint">No matches found for "' + query + '".</div>';
      return;
    }

    searchResults.innerHTML = '';
    matches.slice(0, 30).forEach(m => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.innerHTML = `
        <div class="result-header">${m.header}</div>
        <div class="result-snippet">${m.snippet}</div>
      `;
      item.addEventListener('click', () => {
        searchOverlay.classList.remove('open');
        if (m.type === 'guide') {
          switchMode('guide');
          const pill = document.querySelector(`.guide-pill[data-target="${m.targetId}"]`);
          if (pill) pill.click();
        } else if (m.type === 'page') {
          goToPage(m.target);
          switchMode('scan');
        } else {
          switchMode('english');
          const target = document.getElementById(`eng_sec_${m.secIndex}`);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
      });
      searchResults.appendChild(item);
    });
  });

  // ==========================================
  // AUTO-SCROLL CONTROLLER
  // ==========================================
  const autoScrollBtn = document.getElementById('autoScrollBtn');
  const autoScrollWidget = document.getElementById('autoScrollWidget');
  const autoScrollToggleBtn = document.getElementById('autoScrollToggleBtn');
  const autoScrollPlayIcon = document.getElementById('autoScrollPlayIcon');
  const closeAutoScrollBtn = document.getElementById('closeAutoScrollBtn');
  const speedButtons = document.querySelectorAll('.speed-pill-group .speed-btn');

  let isAutoScrolling = false;
  let isAutoScrollPaused = false;
  let autoScrollSpeedMultiplier = 1;
  let autoScrollRafId = null;
  let autoScrollLastTimestamp = null;
  let isUserInteracting = false;
  let userInteractionTimeout = null;

  function getActiveScrollContainer() {
    if (currentMode === 'english') return englishView;
    if (currentMode === 'bilingual') return bilingualView;
    if (currentMode === 'guide') return guideView;
    return scanView;
  }

  function startAutoScroll() {
    isAutoScrolling = true;
    isAutoScrollPaused = false;
    autoScrollWidget.classList.add('active');
    autoScrollBtn.classList.add('active');
    updateAutoScrollPlayIcon();
    autoScrollLastTimestamp = performance.now();
    cancelAnimationFrame(autoScrollRafId);
    autoScrollRafId = requestAnimationFrame(autoScrollStep);
  }

  function autoScrollStep(timestamp) {
    if (!isAutoScrolling) return;

    if (!autoScrollLastTimestamp) autoScrollLastTimestamp = timestamp;
    const delta = (timestamp - autoScrollLastTimestamp) / 1000;
    autoScrollLastTimestamp = timestamp;

    if (!isAutoScrollPaused && !isUserInteracting) {
      const container = getActiveScrollContainer();
      if (container) {
        const pxPerSec = autoScrollSpeedMultiplier === 1 ? 32 : autoScrollSpeedMultiplier === 2 ? 70 : 130;
        container.scrollTop += (pxPerSec * delta);

        // Check if reached bottom
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 4) {
          if ((currentMode === 'scan' || currentMode === 'bilingual') && currentPage < data.totalPages) {
            isAutoScrollPaused = true;
            setTimeout(() => {
              goToPage(currentPage + 1);
              container.scrollTop = 0;
              isAutoScrollPaused = false;
            }, 1000);
          } else {
            pauseAutoScroll();
          }
        }
      }
    }

    autoScrollRafId = requestAnimationFrame(autoScrollStep);
  }

  function pauseAutoScroll() {
    isAutoScrollPaused = true;
    updateAutoScrollPlayIcon();
  }

  function resumeAutoScroll() {
    isAutoScrollPaused = false;
    autoScrollLastTimestamp = performance.now();
    updateAutoScrollPlayIcon();
  }

  function stopAutoScroll() {
    isAutoScrolling = false;
    isAutoScrollPaused = false;
    cancelAnimationFrame(autoScrollRafId);
    autoScrollWidget.classList.remove('active');
    autoScrollBtn.classList.remove('active');
  }

  function updateAutoScrollPlayIcon() {
    const pulseDot = autoScrollWidget.querySelector('.pulse-indicator');
    if (isAutoScrollPaused) {
      autoScrollPlayIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
      if (pulseDot) pulseDot.classList.add('paused');
    } else {
      autoScrollPlayIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
      if (pulseDot) pulseDot.classList.remove('paused');
    }
  }

  [scanView, bilingualView, englishView, guideView].forEach(view => {
    if (!view) return;
    view.addEventListener('touchstart', () => {
      isUserInteracting = true;
      clearTimeout(userInteractionTimeout);
    }, { passive: true });

    view.addEventListener('touchend', () => {
      clearTimeout(userInteractionTimeout);
      userInteractionTimeout = setTimeout(() => {
        isUserInteracting = false;
        autoScrollLastTimestamp = performance.now();
      }, 700);
    }, { passive: true });
  });

  autoScrollBtn.addEventListener('click', () => {
    if (isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  });

  autoScrollToggleBtn.addEventListener('click', () => {
    if (isAutoScrollPaused) {
      resumeAutoScroll();
    } else {
      pauseAutoScroll();
    }
  });

  closeAutoScrollBtn.addEventListener('click', stopAutoScroll);

  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      autoScrollSpeedMultiplier = parseInt(btn.dataset.speed) || 1;
    });
  });

  // ==========================================
  // TRIPLE-ENGINE AUDIOBOOK CONTROLLER
  // 1. Android Native TTS (when running in APK)
  // 2. Web Speech API (with async voice loading)
  // 3. HTML5 Audio Stream Fallback (100% reliable everywhere)
  // ==========================================
  const audioBookBtn = document.getElementById('audioBookBtn');
  const audiobookWidget = document.getElementById('audiobookWidget');
  const audioSoundwave = document.getElementById('audioSoundwave');
  const audiobookTitle = document.getElementById('audiobookTitle');
  const audiobookProgressText = document.getElementById('audiobookProgressText');
  const audioProgressBarFill = document.getElementById('audioProgressBarFill');
  const audioPlayPauseBtn = document.getElementById('audioPlayPauseBtn');
  const audioPlayIcon = document.getElementById('audioPlayIcon');
  const audioPrevBtn = document.getElementById('audioPrevBtn');
  const audioNextBtn = document.getElementById('audioNextBtn');
  const audioStopBtn = document.getElementById('audioStopBtn');
  const audioSpeedBtn = document.getElementById('audioSpeedBtn');
  const audioAutoTurnBtn = document.getElementById('audioAutoTurnBtn');
  const audioLangToggleBtn = document.getElementById('audioLangToggleBtn');
  const audioLangLabel = document.getElementById('audioLangLabel');
  const closeAudiobookBtn = document.getElementById('closeAudiobookBtn');

  const synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
  let activeUtterance = null;
  let streamAudio = null;
  let streamChunks = [];
  let streamChunkIndex = 0;
  let ttsHeartbeatTimer = null;
  let isAudioPlaying = false;
  let isAudioPaused = false;
  let audioPlaylist = [];
  let audioIndex = 0;
  let speechRate = 1.0;
  let speechLang = 'en';
  let autoTurnPage = true;
  let cachedVoices = [];
  const availableSpeeds = [0.8, 1.0, 1.25, 1.5];

  function refreshVoices() {
    if (synth) {
      try {
        cachedVoices = synth.getVoices() || [];
      } catch (e) {
        cachedVoices = [];
      }
    }
  }
  if (synth) {
    refreshVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = refreshVoices;
    }
  }

  function getAvailableVoices(lang) {
    if (!synth) return null;
    if (!cachedVoices || !cachedVoices.length) refreshVoices();
    if (!cachedVoices || !cachedVoices.length) return null;
    if (lang === 'zh') {
      return cachedVoices.find(v => v.lang.toLowerCase().includes('zh') || v.lang.toLowerCase().includes('cmn')) || null;
    } else {
      return cachedVoices.find(v => v.lang.toLowerCase().includes('en-us') || v.lang.toLowerCase().includes('en-gb')) || cachedVoices.find(v => v.lang.toLowerCase().includes('en')) || null;
    }
  }

  function cleanSpeechText(text) {
    if (!text) return '';
    return text
      .replace(/\[照片:[^\]]*\]/g, '')
      .replace(/\[Photo:[^\]]*\]/g, '')
      .replace(/[_\-=*#|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function splitIntoSentences(text, maxLen = 80) {
    if (!text) return [];
    const clean = cleanSpeechText(text);
    if (!clean) return [];
    const parts = clean.split(/([。！？\n.!?;；]+)/);
    const results = [];
    let current = '';

    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i].trim();
      if (!seg) continue;
      if (current.length + seg.length <= maxLen) {
        current += seg;
      } else {
        if (current) results.push(current);
        if (seg.length <= maxLen) {
          current = seg;
        } else {
          let remaining = seg;
          while (remaining.length > maxLen) {
            let slicePoint = maxLen;
            results.push(remaining.slice(0, slicePoint));
            remaining = remaining.slice(slicePoint);
          }
          current = remaining;
        }
      }
    }
    if (current) results.push(current);
    return results.filter(r => r.length > 0);
  }

  function buildAudioPlaylist() {
    audioPlaylist = [];
    clearSpeakingHighlight();

    if (currentMode === 'english') {
      speechLang = 'en';
      audioLangLabel.textContent = 'English ▾';
      const sections = document.querySelectorAll('#englishLayout .eng-section');
      sections.forEach(sec => {
        const titleElem = sec.querySelector('h2');
        if (titleElem && titleElem.textContent.trim()) {
          audioPlaylist.push({
            text: titleElem.textContent.trim(),
            element: titleElem,
            title: titleElem.textContent.trim()
          });
        }
        const paras = sec.querySelectorAll('p');
        paras.forEach((p, pIdx) => {
          const t = cleanSpeechText(p.textContent);
          if (t) {
            audioPlaylist.push({
              text: t,
              element: p,
              title: `${titleElem ? titleElem.textContent.trim() : 'Section'} (Para ${pIdx + 1}/${paras.length})`
            });
          }
        });
      });
    } else if (currentMode === 'bilingual') {
      if (speechLang === 'en') {
        audioLangLabel.textContent = 'English ▾';
        const engText = getRelevantEnglish(currentPage);
        const paras = engText.split('\n\n').map(t => cleanSpeechText(t)).filter(Boolean);
        paras.forEach((p, idx) => {
          audioPlaylist.push({
            text: p,
            element: bilingualEnglish,
            title: `Page ${currentPage} English (${idx + 1}/${paras.length})`
          });
        });
      } else {
        audioLangLabel.textContent = '中文 ▾';
        const pObj = data.pages[currentPage - 1];
        const zhText = pObj?.chineseText || '';
        const lines = zhText.split('\n').map(l => cleanSpeechText(l)).filter(l => l.length > 2);
        if (lines.length > 0) {
          lines.forEach((l, idx) => {
            audioPlaylist.push({
              text: l,
              element: bilingualChinese,
              title: `第 ${currentPage} 页 族谱录 (${idx + 1}/${lines.length})`
            });
          });
        } else {
          audioPlaylist.push({
            text: `海南省文昌市祝氏族谱 第 ${currentPage} 页`,
            element: bilingualChinese,
            title: `第 ${currentPage} 页`
          });
        }
      }
    } else if (currentMode === 'guide') {
      speechLang = 'en';
      audioLangLabel.textContent = 'English ▾';
      const activeSec = document.querySelector('.guide-section.active') || document.getElementById('guideTimeline');
      if (activeSec) {
        const headings = activeSec.querySelectorAll('h2, h3, p');
        headings.forEach(h => {
          const t = cleanSpeechText(h.textContent);
          if (t && t.length > 3) {
            audioPlaylist.push({
              text: t,
              element: h,
              title: `Guide: ${t.slice(0, 30)}...`
            });
          }
        });
      }
    } else {
      // Scan mode
      if (speechLang === 'zh') {
        audioLangLabel.textContent = '中文 ▾';
        const pObj = data.pages[currentPage - 1];
        const rawZh = cleanSpeechText(pObj?.chineseText || '');
        const zhText = rawZh || `海南省文昌市祝氏族谱 第 ${currentPage} 页`;
        const sentences = splitIntoSentences(zhText, 120);
        if (sentences.length > 0) {
          sentences.forEach((s, idx) => {
            audioPlaylist.push({
              text: s,
              element: scanView,
              title: `第 ${currentPage} 页 影印 (${idx + 1}/${sentences.length})`
            });
          });
        } else {
          audioPlaylist.push({
            text: `海南省文昌市祝氏族谱 第 ${currentPage} 页`,
            element: scanView,
            title: `第 ${currentPage} 页 (影印版)`
          });
        }
      } else {
        audioLangLabel.textContent = 'English ▾';
        const engText = getRelevantEnglish(currentPage);
        const paras = engText.split('\n\n').map(t => cleanSpeechText(t)).filter(Boolean);
        paras.forEach((p, idx) => {
          audioPlaylist.push({
            text: p,
            element: scanView,
            title: `Page ${currentPage} Commentary (${idx + 1}/${paras.length})`
          });
        });
      }
    }

    if (audioIndex >= audioPlaylist.length) {
      audioIndex = 0;
    }
  }

  function cleanupAudioPlayback() {
    if (synth) {
      try { synth.cancel(); } catch (e) {}
    }
    clearInterval(ttsHeartbeatTimer);
    if (streamAudio) {
      streamAudio.pause();
      streamAudio.onended = null;
      streamAudio.onerror = null;
      streamAudio = null;
    }
    if (window.AndroidTTS && typeof window.AndroidTTS.stop === 'function') {
      try { window.AndroidTTS.stop(); } catch (e) {}
    }
  }

  function fallbackToAudioStream(text) {
    streamChunks = splitIntoSentences(text, 80);
    if (!streamChunks.length) {
      playAudioTrack(audioIndex + 1);
      return;
    }
    streamChunkIndex = 0;
    playStreamChunk();
  }

  function playStreamChunk() {
    if (streamChunkIndex >= streamChunks.length) {
      if (isAudioPlaying && !isAudioPaused) {
        playAudioTrack(audioIndex + 1);
      }
      return;
    }

    const chunk = streamChunks[streamChunkIndex];
    const tl = speechLang === 'zh' ? 'zh-CN' : 'en';
    const streamUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(chunk)}`;

    if (streamAudio) {
      streamAudio.pause();
      streamAudio = null;
    }

    streamAudio = new Audio(streamUrl);
    streamAudio.playbackRate = speechRate;
    streamAudio.onended = () => {
      streamChunkIndex++;
      if (isAudioPlaying && !isAudioPaused) {
        playStreamChunk();
      }
    };
    streamAudio.onerror = (e) => {
      console.warn('Audio stream error on chunk:', e);
      streamChunkIndex++;
      if (isAudioPlaying && !isAudioPaused) {
        playStreamChunk();
      }
    };
    streamAudio.play().catch(err => {
      console.warn('Playback blocked or failed:', err);
    });
  }

  // Native Android TTS Callbacks
  window.onAndroidTTSStart = function() {
    audioSoundwave.classList.remove('paused');
  };
  window.onAndroidTTSDone = function() {
    if (isAudioPlaying && !isAudioPaused) {
      playAudioTrack(audioIndex + 1);
    }
  };
  window.onAndroidTTSError = function() {
    if (isAudioPlaying && !isAudioPaused) {
      playAudioTrack(audioIndex + 1);
    }
  };

  function playAudioTrack(index) {
    if (index < 0) index = 0;
    if (index >= audioPlaylist.length) {
      if (autoTurnPage && (currentMode === 'scan' || currentMode === 'bilingual') && currentPage < data.totalPages) {
        goToPage(currentPage + 1);
        setTimeout(() => {
          buildAudioPlaylist();
          audioIndex = 0;
          playAudioTrack(0);
        }, 600);
        return;
      } else {
        stopAudio();
        return;
      }
    }

    audioIndex = index;
    const track = audioPlaylist[audioIndex];
    if (!track || !track.text) {
      playAudioTrack(audioIndex + 1);
      return;
    }

    cleanupAudioPlayback();

    isAudioPlaying = true;
    isAudioPaused = false;
    audiobookWidget.classList.add('active');
    audioBookBtn.classList.add('active');
    audioSoundwave.classList.remove('paused');
    audioPlayIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';

    audiobookTitle.textContent = track.title || 'Audiobook Narrator';
    audiobookProgressText.textContent = `Part ${audioIndex + 1} of ${audioPlaylist.length}`;
    const pct = ((audioIndex + 1) / audioPlaylist.length) * 100;
    audioProgressBarFill.style.width = `${pct}%`;

    clearSpeakingHighlight();
    if (track.element && track.element !== scanView) {
      track.element.classList.add('speaking-highlight');
      track.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // LAYER 1: Android Native Text-to-Speech (in APK)
    if (window.AndroidTTS && typeof window.AndroidTTS.speak === 'function') {
      try {
        window.AndroidTTS.speak(track.text, speechLang, speechRate);
        return;
      } catch (err) {
        console.warn('Android TTS bridge call failed, falling back:', err);
      }
    }

    // LAYER 2: Web Speech API (speechSynthesis in modern browsers)
    if (synth) {
      try {
        synth.cancel();
        activeUtterance = new SpeechSynthesisUtterance(track.text);
        activeUtterance.rate = speechRate;
        activeUtterance.lang = speechLang === 'zh' ? 'zh-CN' : 'en-US';

        const v = getAvailableVoices(speechLang);
        if (v) activeUtterance.voice = v;

        activeUtterance.onend = () => {
          clearInterval(ttsHeartbeatTimer);
          if (isAudioPlaying && !isAudioPaused) {
            playAudioTrack(audioIndex + 1);
          }
        };

        activeUtterance.onerror = (e) => {
          clearInterval(ttsHeartbeatTimer);
          console.warn('SpeechSynthesis error, falling back to stream:', e);
          fallbackToAudioStream(track.text);
        };

        // Keep-alive heartbeat for Chrome
        clearInterval(ttsHeartbeatTimer);
        ttsHeartbeatTimer = setInterval(() => {
          if (synth && synth.speaking && !synth.paused) {
            synth.pause();
            synth.resume();
          }
        }, 12000);

        synth.speak(activeUtterance);
        return;
      } catch (e) {
        console.warn('Web Speech API failed, trying stream fallback:', e);
      }
    }

    // LAYER 3: HTML5 Audio Stream Fallback
    fallbackToAudioStream(track.text);
  }

  function pauseAudio() {
    if (window.AndroidTTS && typeof window.AndroidTTS.stop === 'function') {
      window.AndroidTTS.stop();
    }
    if (synth && synth.speaking) {
      synth.pause();
    }
    if (streamAudio && !streamAudio.paused) {
      streamAudio.pause();
    }
    clearInterval(ttsHeartbeatTimer);
    isAudioPaused = true;
    audioSoundwave.classList.add('paused');
    audioPlayIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  }

  function resumeAudio() {
    isAudioPaused = false;
    audioSoundwave.classList.remove('paused');
    audioPlayIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';

    if (streamAudio && streamAudio.paused) {
      streamAudio.play().catch(() => playAudioTrack(audioIndex));
    } else if (synth && synth.paused) {
      synth.resume();
    } else {
      playAudioTrack(audioIndex);
    }
  }

  function stopAudio() {
    cleanupAudioPlayback();
    isAudioPlaying = false;
    isAudioPaused = false;
    clearSpeakingHighlight();
    audiobookWidget.classList.remove('active');
    audioBookBtn.classList.remove('active');
    audioSoundwave.classList.add('paused');
    audioPlayIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
    audioProgressBarFill.style.width = '0%';
  }

  function clearSpeakingHighlight() {
    document.querySelectorAll('.speaking-highlight').forEach(el => {
      el.classList.remove('speaking-highlight');
    });
  }

  audioBookBtn.addEventListener('click', () => {
    if (isAudioPlaying) {
      stopAudio();
    } else {
      buildAudioPlaylist();
      playAudioTrack(audioIndex);
    }
  });

  audioPlayPauseBtn.addEventListener('click', () => {
    if (!isAudioPlaying) {
      buildAudioPlaylist();
      playAudioTrack(audioIndex);
    } else if (isAudioPaused) {
      resumeAudio();
    } else {
      pauseAudio();
    }
  });

  audioPrevBtn.addEventListener('click', () => {
    if (audioIndex > 0) {
      playAudioTrack(audioIndex - 1);
    }
  });

  audioNextBtn.addEventListener('click', () => {
    if (audioIndex < audioPlaylist.length - 1) {
      playAudioTrack(audioIndex + 1);
    }
  });

  audioStopBtn.addEventListener('click', stopAudio);
  closeAudiobookBtn.addEventListener('click', stopAudio);

  audioSpeedBtn.addEventListener('click', () => {
    const curIdx = availableSpeeds.indexOf(speechRate);
    const nextIdx = (curIdx + 1) % availableSpeeds.length;
    speechRate = availableSpeeds[nextIdx];
    audioSpeedBtn.textContent = `${speechRate}x`;
    if (isAudioPlaying && !isAudioPaused) {
      playAudioTrack(audioIndex);
    }
  });

  audioAutoTurnBtn.addEventListener('click', () => {
    autoTurnPage = !autoTurnPage;
    audioAutoTurnBtn.classList.toggle('active', autoTurnPage);
  });

  audioLangToggleBtn.addEventListener('click', () => {
    speechLang = speechLang === 'en' ? 'zh' : 'en';
    buildAudioPlaylist();
    if (isAudioPlaying) {
      playAudioTrack(0);
    }
  });

  // Completely remove Netlify Watermark / HUD Badge from DOM
  function removeNetlifyBadge() {
    const badges = document.querySelectorAll('#nl-badge-frame, #nl-hud-frame, iframe[title*="Netlify"], iframe[id*="nl-"], iframe[src*="netlify"]');
    badges.forEach(b => {
      b.style.display = 'none';
      b.remove();
    });
  }
  removeNetlifyBadge();
  const netlifyObserver = new MutationObserver(removeNetlifyBadge);
  netlifyObserver.observe(document.body, { childList: true, subtree: true });
  const clearTimer = setInterval(removeNetlifyBadge, 300);
  setTimeout(() => clearInterval(clearTimer), 10000);

  // =============================================================
  // INTERACTIVE SPOKES & HUB FAMILY TREE ENGINE
  // =============================================================
  function initFamilyTree() {
    const treeData = window.FAMILY_TREE_DATA;
    if (!treeData || !treeData.nodes) return;

    let activeHubId = treeData.defaultHubId || "gen19_mingcan";
    let currentTreeMode = "spokes"; // 'spokes' | 'hierarchy' | 'summary'
    let currentBranchFilter = "all";
    let zoomScale = 1.0;
    let panOffset = { x: 0, y: 0 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };

    // Elements
    const btnTreeSpokes = document.getElementById('btnTreeSpokes');
    const btnTreeHierarchy = document.getElementById('btnTreeHierarchy');
    const btnTreeSummary = document.getElementById('btnTreeSummary');

    const treeSpokesView = document.getElementById('treeSpokesView');
    const treeHierarchyView = document.getElementById('treeHierarchyView');
    const treeSummaryView = document.getElementById('treeSummaryView');

    const spokesWrapper = document.getElementById('spokesCanvasWrapper');
    const hierarchyWrapper = document.getElementById('hierarchyTreeWrapper');

    const treeSearchInput = document.getElementById('treeSearchInput');
    const treeSearchClearBtn = document.getElementById('treeSearchClearBtn');
    const treeBranchFilter = document.getElementById('treeBranchFilter');

    const treeZoomInBtn = document.getElementById('treeZoomInBtn');
    const treeZoomOutBtn = document.getElementById('treeZoomOutBtn');
    const treeZoomResetBtn = document.getElementById('treeZoomResetBtn');

    // Quick focus chips
    const chipFocusMe = document.getElementById('chipFocusMe');
    const chipFocusFather = document.getElementById('chipFocusFather');
    const chipFocusFounder = document.getElementById('chipFocusFounder');
    const chipFocusOverseas = document.getElementById('chipFocusOverseas');
    const chipFocusRestored = document.getElementById('chipFocusRestored');
    const quickChips = [chipFocusMe, chipFocusFather, chipFocusFounder, chipFocusOverseas, chipFocusRestored];

    // Inspector elements
    const inspectorName = document.getElementById('inspectorName');
    const inspectorPinyin = document.getElementById('inspectorPinyin');
    const inspectorGenBadge = document.getElementById('inspectorGenBadge');
    const inspectorBookPageLabel = document.getElementById('inspectorBookPageLabel');
    const inspectorBookBtn = document.getElementById('inspectorBookBtn');
    const inspectorBreadcrumbs = document.getElementById('inspectorBreadcrumbs');
    const inspectorFatherBox = document.getElementById('inspectorFatherBox');
    const inspectorChildrenBox = document.getElementById('inspectorChildrenBox');
    const inspectorBrothersBox = document.getElementById('inspectorBrothersBox');
    const inspectorLocationBox = document.getElementById('inspectorLocationBox');
    const inspectorNotesText = document.getElementById('inspectorNotesText');

    function setActiveQuickChip(activeChip) {
      quickChips.forEach(c => c && c.classList.remove('active'));
      if (activeChip) activeChip.classList.add('active');
    }

    function switchTreeMode(mode) {
      currentTreeMode = mode;
      btnTreeSpokes?.classList.toggle('active', mode === 'spokes');
      btnTreeHierarchy?.classList.toggle('active', mode === 'hierarchy');
      btnTreeSummary?.classList.toggle('active', mode === 'summary');

      treeSpokesView?.classList.toggle('active', mode === 'spokes');
      treeHierarchyView?.classList.toggle('active', mode === 'hierarchy');
      treeSummaryView?.classList.toggle('active', mode === 'summary');

      renderCurrentView();
    }

    btnTreeSpokes?.addEventListener('click', () => switchTreeMode('spokes'));
    btnTreeHierarchy?.addEventListener('click', () => switchTreeMode('hierarchy'));
    btnTreeSummary?.addEventListener('click', () => switchTreeMode('summary'));

    function setHub(nodeId, sourceChip = null) {
      if (!treeData.getNodeById(nodeId)) return;
      activeHubId = nodeId;
      panOffset = { x: 0, y: 0 };
      zoomScale = 1.0;
      setActiveQuickChip(sourceChip);
      renderCurrentView();
      updateInspector(nodeId);
    }

    chipFocusMe?.addEventListener('click', () => setHub('gen19_mingcan', chipFocusMe));
    chipFocusFather?.addEventListener('click', () => setHub('gen18_shengjin', chipFocusFather));
    chipFocusFounder?.addEventListener('click', () => setHub('gen1_gao', chipFocusFounder));
    chipFocusOverseas?.addEventListener('click', () => setHub('gen17_jiasong', chipFocusOverseas));
    chipFocusRestored?.addEventListener('click', () => setHub('gen8_youyan', chipFocusRestored));

    // Filter by branch
    treeBranchFilter?.addEventListener('change', (e) => {
      currentBranchFilter = e.target.value;
      renderCurrentView();
    });

    // Zoom buttons
    treeZoomInBtn?.addEventListener('click', () => {
      zoomScale = Math.min(2.5, zoomScale + 0.2);
      updateSpokesTransform();
    });
    treeZoomOutBtn?.addEventListener('click', () => {
      zoomScale = Math.max(0.4, zoomScale - 0.2);
      updateSpokesTransform();
    });
    treeZoomResetBtn?.addEventListener('click', () => {
      zoomScale = 1.0;
      panOffset = { x: 0, y: 0 };
      updateSpokesTransform();
    });

    // Search
    function handleTreeSearch() {
      const q = (treeSearchInput.value || '').trim().toLowerCase();
      if (treeSearchClearBtn) treeSearchClearBtn.style.display = q ? 'block' : 'none';
      if (!q) return;

      const match = treeData.nodes.find(n =>
        n.name.toLowerCase().includes(q) ||
        n.pinyin.toLowerCase().includes(q) ||
        (n.location && n.location.toLowerCase().includes(q)) ||
        (n.branch && n.branch.toLowerCase().includes(q)) ||
        (n.notes && n.notes.toLowerCase().includes(q))
      );

      if (match) {
        setHub(match.id);
      }
    }

    treeSearchInput?.addEventListener('input', handleTreeSearch);
    treeSearchClearBtn?.addEventListener('click', () => {
      treeSearchInput.value = '';
      treeSearchClearBtn.style.display = 'none';
      setHub('gen19_mingcan', chipFocusMe);
    });

    // Pan interaction on Spokes wrapper
    spokesWrapper?.addEventListener('mousedown', (e) => {
      if (e.target.closest('.spoke-node-group')) return;
      isDragging = true;
      dragStart = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panOffset.x = e.clientX - dragStart.x;
      panOffset.y = e.clientY - dragStart.y;
      updateSpokesTransform();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    spokesWrapper?.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      zoomScale = Math.min(2.5, Math.max(0.4, zoomScale + delta));
      updateSpokesTransform();
    }, { passive: false });

    // Touch pan
    let touchStartCoord = { x: 0, y: 0 };
    spokesWrapper?.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartCoord = { x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y };
      }
    }, { passive: true });

    spokesWrapper?.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        panOffset.x = e.touches[0].clientX - touchStartCoord.x;
        panOffset.y = e.touches[0].clientY - touchStartCoord.y;
        updateSpokesTransform();
      }
    }, { passive: true });

    function updateSpokesTransform() {
      const g = spokesWrapper?.querySelector('.spokes-main-group');
      if (g) {
        const w = spokesWrapper.clientWidth || 800;
        const h = spokesWrapper.clientHeight || 540;
        g.setAttribute('transform', `translate(${w / 2 + panOffset.x}, ${h / 2 + panOffset.y}) scale(${zoomScale})`);
      }
    }

    // =========================================================
    // RENDER: Spokes & Hub View
    // =========================================================
    function renderSpokesHub() {
      if (!spokesWrapper) return;
      const hubNode = treeData.getNodeById(activeHubId);
      if (!hubNode) return;

      const w = spokesWrapper.clientWidth || 800;
      const h = spokesWrapper.clientHeight || 540;

      // Ancestors
      const father = hubNode.fatherId ? treeData.getNodeById(hubNode.fatherId) : null;
      const grandfather = father && father.fatherId ? treeData.getNodeById(father.fatherId) : null;

      // Descendants & Peers
      const children = treeData.getChildren(activeHubId);
      const brothers = treeData.getBrothers(activeHubId);

      // SVG structure
      let svgHtml = `
        <svg class="spokes-svg" viewBox="0 0 ${w} ${h}">
          <defs>
            <linearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#b91c1c" />
              <stop offset="100%" stop-color="#7f1d1d" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#d97706" />
              <stop offset="100%" stop-color="#b45309" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <g class="spokes-main-group" transform="translate(${w / 2 + panOffset.x}, ${h / 2 + panOffset.y}) scale(${zoomScale})">
            <!-- Concentric Guide Rings -->
            <circle class="spoke-orbit-ring" cx="0" cy="0" r="130" />
            <circle class="spoke-orbit-ring" cx="0" cy="0" r="220" />
      `;

      // Draw Spokes (Lines)
      // 1. Spoke to Father & Grandfather
      if (father) {
        svgHtml += `<line class="spoke-line father-spoke active-path" x1="0" y1="0" x2="0" y2="-130" />`;
        if (grandfather) {
          svgHtml += `<line class="spoke-line father-spoke active-path" x1="0" y1="-130" x2="0" y2="-220" />`;
        }
      }

      // 2. Spokes to Brothers (Left & Right)
      const numBrothers = brothers.length;
      const brotherCoords = [];
      if (numBrothers > 0) {
        const brotherAngles = [-150, 150, -170, 170, -130, 130];
        brothers.slice(0, 6).forEach((bro, i) => {
          const angle = (brotherAngles[i % brotherAngles.length] * Math.PI) / 180;
          const bx = Math.sin(angle) * 140;
          const by = Math.cos(angle) * 140;
          brotherCoords.push({ node: bro, x: bx, y: by });
          svgHtml += `<line class="spoke-line peer-spoke" x1="0" y1="0" x2="${bx}" y2="${by}" />`;
        });
      }

      // 3. Spokes to Children (Bottom arc)
      const numChildren = children.length;
      const childCoords = [];
      if (numChildren > 0) {
        const step = numChildren === 1 ? 0 : 80 / (numChildren - 1);
        const startAngle = numChildren === 1 ? 0 : -40;
        children.forEach((child, i) => {
          const deg = startAngle + i * step;
          const rad = (deg * Math.PI) / 180;
          const cxPos = Math.sin(rad) * 155;
          const cyPos = Math.cos(rad) * 155;
          childCoords.push({ node: child, x: cxPos, y: cyPos });
          svgHtml += `<line class="spoke-line son-spoke" x1="0" y1="0" x2="${cxPos}" y2="${cyPos}" />`;
        });
      }

      // Render Nodes
      // Grandfather Node
      if (grandfather) {
        svgHtml += `
          <g class="spoke-node-group" transform="translate(0, -220)" data-node-id="${grandfather.id}">
            <circle class="spoke-node-circle ancestor-circle" r="28" />
            <text class="spoke-node-text-name" y="-2" font-size="11">${grandfather.name.split(' ')[0]}</text>
            <text class="spoke-node-text-sub" y="12">${grandfather.gen}世 · 祖父</text>
          </g>
        `;
      }

      // Father Node
      if (father) {
        svgHtml += `
          <g class="spoke-node-group" transform="translate(0, -130)" data-node-id="${father.id}">
            <circle class="spoke-node-circle father-circle" r="36" />
            <text class="spoke-node-text-name" y="-4" font-size="13">${father.name.split(' ')[0]}</text>
            <text class="spoke-node-text-sub" y="12">${father.gen}世 · 父亲</text>
          </g>
        `;
      }

      // Brother Nodes
      brotherCoords.forEach(b => {
        svgHtml += `
          <g class="spoke-node-group" transform="translate(${b.x}, ${b.y})" data-node-id="${b.node.id}">
            <circle class="spoke-node-circle peer-circle" r="28" />
            <text class="spoke-node-text-name" y="-2" font-size="11">${b.node.name.split(' ')[0]}</text>
            <text class="spoke-node-text-sub" y="12">${b.node.genChar}字辈</text>
          </g>
        `;
      });

      // Children Nodes
      childCoords.forEach(c => {
        svgHtml += `
          <g class="spoke-node-group" transform="translate(${c.x}, ${c.y})" data-node-id="${c.node.id}">
            <circle class="spoke-node-circle son-circle" r="30" />
            <text class="spoke-node-text-name" y="-3" font-size="12">${c.node.name.split(' ')[0]}</text>
            <text class="spoke-node-text-sub" y="11">${c.node.gen}世 · 子</text>
          </g>
        `;
      });

      // CENTRAL HUB NODE
      const isMe = hubNode.isCurrentUser;
      const hubTitle = hubNode.name.split(' ')[0];
      svgHtml += `
        <!-- Hub pulse wave -->
        <circle class="spoke-hub-pulse" cx="0" cy="0" r="50" fill="${isMe ? 'rgba(180, 83, 9, 0.25)' : 'rgba(153, 27, 27, 0.2)'}" />
        <g class="spoke-node-group hub-group" transform="translate(0, 0)" data-node-id="${hubNode.id}">
          <circle class="spoke-node-circle hub-circle" r="50" fill="url(#hubGrad)" />
          <text class="spoke-node-text-name" y="-8" font-size="15" font-weight="800">${hubTitle}</text>
          <text class="spoke-node-text-sub" y="8" font-size="10">${hubNode.gen > 0 ? `${hubNode.gen}世 · ${hubNode.genChar}字派` : hubNode.genName}</text>
          <text class="spoke-node-text-sub" y="21" font-size="9" fill="#fef08a">${isMe ? '★ 当前焦点 ★' : '● 中心祖辈'}</text>
        </g>
      `;

      svgHtml += `</g></svg>`;
      spokesWrapper.innerHTML = svgHtml;

      // Attach click events on nodes
      spokesWrapper.querySelectorAll('.spoke-node-group').forEach(group => {
        group.addEventListener('click', (e) => {
          e.stopPropagation();
          const nid = group.dataset.nodeId;
          if (nid && nid !== activeHubId) {
            setHub(nid);
          }
        });
      });
    }

    // =========================================================
    // RENDER: Hierarchy Tree View
    // =========================================================
    function renderHierarchyTree() {
      if (!hierarchyWrapper) return;
      hierarchyWrapper.innerHTML = '';

      // Group nodes by generation
      const genGroups = new Map();
      treeData.nodes.forEach(n => {
        // Filter by branch if active
        if (currentBranchFilter !== 'all') {
          const b = (n.branch || '').toLowerCase();
          if (currentBranchFilter === 'gaolong' && !b.includes('gaolong') && !b.includes('senior')) return;
          if (currentBranchFilter === 'junior' && !b.includes('junior') && !b.includes('xinqiao')) return;
          if (currentBranchFilter === 'overseas' && !b.includes('singapore') && !b.includes('malaysia') && !b.includes('nanyang')) return;
          if (currentBranchFilter === 'restored' && !b.includes('82') && !b.includes('83') && !b.includes('restored')) return;
        }

        if (!genGroups.has(n.gen)) {
          genGroups.set(n.gen, []);
        }
        genGroups.get(n.gen).push(n);
      });

      // Sort generations from ancient (-3) to 21
      const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b);
      const activeAncestors = new Set(treeData.getAncestors(activeHubId).map(n => n.id));

      sortedGens.forEach(gen => {
        const nodes = genGroups.get(gen);
        if (!nodes || nodes.length === 0) return;

        const row = document.createElement('div');
        row.className = 'hierarchy-gen-row';

        const label = document.createElement('div');
        label.className = 'hierarchy-gen-label';
        if (gen < 1) {
          label.textContent = gen === -3 ? '上古始祖' : gen === -2 ? '火正祝融' : gen === -1 ? '西周祝国' : '太原/万州';
        } else {
          label.textContent = `${gen}世 · ${nodes[0].genChar || ''}`;
        }
        row.appendChild(label);

        const list = document.createElement('div');
        list.className = 'hierarchy-nodes-list';

        nodes.forEach(n => {
          const card = document.createElement('div');
          const isHub = n.id === activeHubId;
          const inPath = activeAncestors.has(n.id);
          card.className = `hierarchy-card ${isHub ? 'active-hub' : ''} ${inPath ? 'in-path' : ''}`;

          card.innerHTML = `
            <div class="hierarchy-card-name">${n.name.split(' ')[0]} ${n.isCurrentUser ? '★' : ''}</div>
            <div class="hierarchy-card-branch">${n.branch}</div>
          `;

          card.addEventListener('click', () => {
            setHub(n.id);
          });
          list.appendChild(card);
        });

        row.appendChild(list);
        hierarchyWrapper.appendChild(row);
      });
    }

    function renderCurrentView() {
      if (currentTreeMode === 'spokes') {
        renderSpokesHub();
      } else if (currentTreeMode === 'hierarchy') {
        renderHierarchyTree();
      }
    }

    // =========================================================
    // UPDATE: Inspector Drawer / Bottom Card
    // =========================================================
    function updateInspector(nodeId) {
      const node = treeData.getNodeById(nodeId);
      if (!node) return;

      if (inspectorName) inspectorName.textContent = node.name;
      if (inspectorPinyin) inspectorPinyin.textContent = node.pinyin || '';
      if (inspectorGenBadge) inspectorGenBadge.textContent = node.genName || `${node.gen}世`;

      if (inspectorBookPageLabel) inspectorBookPageLabel.textContent = `Book Page ${node.page || 22}`;
      if (inspectorBookBtn) {
        inspectorBookBtn.onclick = () => {
          switchMode('scan');
          goToPage(node.page || 22);
        };
      }

      // Direct Paternal Lineage Breadcrumbs (始祖 ➔ Father ➔ Person)
      if (inspectorBreadcrumbs) {
        inspectorBreadcrumbs.innerHTML = '';
        const path = treeData.getAncestors(nodeId);
        path.forEach((ancestor, idx) => {
          const chip = document.createElement('button');
          chip.className = `path-node-chip ${ancestor.id === nodeId ? 'current-chip' : ''}`;
          chip.textContent = ancestor.name.split(' ')[0];
          chip.title = `${ancestor.genName} (Click to focus)`;
          chip.addEventListener('click', () => setHub(ancestor.id));
          inspectorBreadcrumbs.appendChild(chip);

          if (idx < path.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'path-arrow';
            arrow.textContent = '➔';
            inspectorBreadcrumbs.appendChild(arrow);
          }
        });
      }

      // Father
      if (inspectorFatherBox) {
        inspectorFatherBox.innerHTML = '';
        if (node.fatherId) {
          const f = treeData.getNodeById(node.fatherId);
          if (f) {
            const fChip = document.createElement('button');
            fChip.className = 'tie-chip';
            fChip.textContent = `${f.name.split(' ')[0]} (${f.gen}世)`;
            fChip.addEventListener('click', () => setHub(f.id));
            inspectorFatherBox.appendChild(fChip);
          } else {
            inspectorFatherBox.textContent = '始祖 (Root / No parent recorded)';
          }
        } else {
          inspectorFatherBox.textContent = '始祖 (Root Ancestor)';
        }
      }

      // Sons / Children
      if (inspectorChildrenBox) {
        inspectorChildrenBox.innerHTML = '';
        const children = treeData.getChildren(nodeId);
        if (children.length > 0) {
          children.forEach(c => {
            const cChip = document.createElement('button');
            cChip.className = 'tie-chip';
            cChip.textContent = `${c.name.split(' ')[0]} (${c.gen}世)`;
            cChip.addEventListener('click', () => setHub(c.id));
            inspectorChildrenBox.appendChild(cChip);
          });
        } else {
          inspectorChildrenBox.textContent = '未记录子嗣 / 承前启后 (Successors pending)';
        }
      }

      // Brothers / Generational Peers
      if (inspectorBrothersBox) {
        inspectorBrothersBox.innerHTML = '';
        const brothers = treeData.getBrothers(nodeId);
        if (brothers.length > 0) {
          brothers.forEach(b => {
            const bChip = document.createElement('button');
            bChip.className = 'tie-chip';
            bChip.textContent = b.name.split(' ')[0];
            bChip.addEventListener('click', () => setHub(b.id));
            inspectorBrothersBox.appendChild(bChip);
          });
        } else {
          inspectorBrothersBox.textContent = '独子 / 该支唯一传人';
        }
      }

      // Spouse or Mother
      const inspectorSpouseBoxWrap = document.getElementById('inspectorSpouseBoxWrap');
      const inspectorSpouseBox = document.getElementById('inspectorSpouseBox');
      const inspectorSpouseLabel = document.getElementById('inspectorSpouseLabel');
      if (inspectorSpouseBoxWrap && inspectorSpouseBox) {
        if (node.spouse) {
          inspectorSpouseBoxWrap.style.display = 'block';
          if (inspectorSpouseLabel) inspectorSpouseLabel.textContent = 'Spouse (配偶):';
          inspectorSpouseBox.textContent = node.spouse;
        } else if (node.mother) {
          inspectorSpouseBoxWrap.style.display = 'block';
          if (inspectorSpouseLabel) inspectorSpouseLabel.textContent = 'Mother (母亲):';
          inspectorSpouseBox.textContent = node.mother;
        } else {
          inspectorSpouseBoxWrap.style.display = 'none';
        }
      }

      // Location & Branch
      if (inspectorLocationBox) {
        inspectorLocationBox.textContent = `${node.branch} · ${node.location || '文昌'}`;
      }

      // Notes
      if (inspectorNotesText) {
        inspectorNotesText.textContent = node.notes || '详见族谱世系图原文。';
      }
    }

    // Expose render function
    window.renderCurrentFamilyTree = renderCurrentView;

    // Initial render
    setHub(activeHubId, chipFocusMe);
  }

  // Initialize Family Tree Engine
  initFamilyTree();

  // Initialize on Page 2 (Cover)
  goToPage(2);
});

