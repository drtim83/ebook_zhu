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
        { id: 'guideMandate', title: '5. The 20-Year Sacred Mandate' }
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
      const imgUrl = pageObj.image.startsWith("http") ? pageObj.image : (SUPABASE_CDN_PREFIX + pageObj.image);
      pageImage.src = imgUrl;
      bilingualImage.src = imgUrl;
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
  // AUDIOBOOK / READ-ALOUD CONTROLLER
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
  let isAudioPlaying = false;
  let isAudioPaused = false;
  let audioPlaylist = [];
  let audioIndex = 0;
  let speechRate = 1.0;
  let speechLang = 'en';
  let autoTurnPage = true;
  const availableSpeeds = [0.8, 1.0, 1.25, 1.5];

  function getAvailableVoices(lang) {
    if (!synth) return null;
    const voices = synth.getVoices();
    if (!voices || voices.length === 0) return null;
    if (lang === 'zh') {
      return voices.find(v => v.lang.toLowerCase().includes('zh') || v.lang.toLowerCase().includes('cmn')) || null;
    } else {
      return voices.find(v => v.lang.toLowerCase().includes('en-us') || v.lang.toLowerCase().includes('en-gb')) || voices.find(v => v.lang.toLowerCase().includes('en')) || null;
    }
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
          if (p.textContent.trim()) {
            audioPlaylist.push({
              text: p.textContent.trim(),
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
        const paras = engText.split('\n\n').map(t => t.trim()).filter(Boolean);
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
        const lines = zhText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
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
          if (h.textContent.trim().length > 3) {
            audioPlaylist.push({
              text: h.textContent.trim(),
              element: h,
              title: `Guide: ${h.textContent.trim().slice(0, 30)}...`
            });
          }
        });
      }
    } else {
      speechLang = 'zh';
      audioLangLabel.textContent = '中文 ▾';
      const pObj = data.pages[currentPage - 1];
      const zhText = pObj?.chineseText || `海南省文昌市祝氏族谱 第 ${currentPage} 页`;
      audioPlaylist.push({
        text: zhText,
        element: scanView,
        title: `第 ${currentPage} 页 (影印版)`
      });
    }

    if (audioIndex >= audioPlaylist.length) {
      audioIndex = 0;
    }
  }

  function playAudioTrack(index) {
    if (!synth) {
      alert('Text-to-Speech audio is not supported in this browser.');
      return;
    }

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
    if (!track) return;

    synth.cancel();
    clearSpeakingHighlight();

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

    if (track.element) {
      track.element.classList.add('speaking-highlight');
      track.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    activeUtterance = new SpeechSynthesisUtterance(track.text);
    activeUtterance.rate = speechRate;
    activeUtterance.lang = speechLang === 'zh' ? 'zh-CN' : 'en-US';

    const v = getAvailableVoices(speechLang);
    if (v) activeUtterance.voice = v;

    activeUtterance.onend = () => {
      clearSpeakingHighlight();
      if (isAudioPlaying && !isAudioPaused) {
        playAudioTrack(audioIndex + 1);
      }
    };

    activeUtterance.onerror = (e) => {
      console.warn('TTS error:', e);
      clearSpeakingHighlight();
      if (isAudioPlaying && !isAudioPaused) {
        playAudioTrack(audioIndex + 1);
      }
    };

    synth.speak(activeUtterance);
  }

  function pauseAudio() {
    if (!synth) return;
    if (synth.speaking && !synth.paused) {
      synth.pause();
    }
    isAudioPaused = true;
    audioSoundwave.classList.add('paused');
    audioPlayIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  }

  function resumeAudio() {
    if (!synth) return;
    if (synth.paused) {
      synth.resume();
    } else {
      playAudioTrack(audioIndex);
    }
    isAudioPaused = false;
    audioSoundwave.classList.remove('paused');
    audioPlayIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
  }

  function stopAudio() {
    if (synth) synth.cancel();
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

  // Initialize on Page 2 (Cover)
  goToPage(2);
});
