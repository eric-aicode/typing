class NativeCampApp {
    constructor() {
        this.articles = [];
        this.currentArticle = null;
        this.currentIndex = 0;
        this.sentences = [];
        this.currentWords = [];
        this.correctCount = 0;
        this.totalAttempted = 0;
        this.sentenceStartTime = null;
        this.learningMode = 'reader'; // reader, novice, trainee, expert

        // DOM Elements
        this.homeView = document.getElementById('homeView');
        this.practiceSection = document.getElementById('practiceSection');
        this.lessonGrid = document.getElementById('lessonGrid');
        this.importLibraryBtn = document.getElementById('importLibraryBtn');
        this.libraryFileInput = document.getElementById('libraryFileInput');

        this.wordContainer = document.getElementById('wordContainer');
        this.originalSentenceDisplay = document.getElementById('originalSentenceDisplay');
        this.currentIndexEl = document.getElementById('currentIndex');
        this.totalCountEl = document.getElementById('totalCount');
        this.accuracyText = document.getElementById('accuracyText');
        this.progressBar = document.getElementById('progressBar');
        this.wpmDisplay = document.getElementById('wpmDisplay');
        this.closePracticeBtn = document.getElementById('closePracticeBtn');
        this.virtualKeyboard = document.getElementById('virtualKeyboard');
        this.audioPlayer = document.getElementById('sentenceAudio');
        this.modeSelector = document.getElementById('learningMode');
        this.speedSelector = document.getElementById('playbackSpeed');
        this.practiceTitle = document.getElementById('practiceTitle');
        this.translationDisplay = document.getElementById('translationDisplay');
        this.readerView = document.getElementById('readerView');
        this.readerControls = document.getElementById('readerControls');
        this.playAllBtn = document.getElementById('playAllBtn');
        this.readingTimerBtn = document.getElementById('readingTimerBtn');
        this.timerDisplay = document.getElementById('timerDisplay');

        // Modal & Wordbook
        this.wordbookView = document.getElementById('wordbookView');
        this.profileView = document.getElementById('profileView');
        this.wordbookContent = document.getElementById('wordbookContent');
        this.statsOverview = document.getElementById('statsOverview');
        this.batchActionBar = document.getElementById('batchActionBar');
        this.batchCountDisplay = document.getElementById('batchCountDisplay');
        this.selectedWords = new Set();

        this.correctTextBtn = document.getElementById('correctTextBtn');
        this.correctionModal = document.getElementById('correctionModal');
        this.correctionInput = document.getElementById('correctionInput');

        // Recording & Audio Context
        this.recordBtn = document.getElementById('recordBtn');
        this.userAudioPlayer = document.getElementById('userAudioPlayer');
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.playbackRate = 1.0;

        // AutoPlay & Timing
        this.isAutoPlaying = false;
        this.isTiming = false;
        this.readingStartTime = null;
        this.timerInterval = null;

        this.init();
    }

    init() {
        if (this.importLibraryBtn) this.importLibraryBtn.addEventListener('click', () => this.libraryFileInput.click());
        if (this.libraryFileInput) this.libraryFileInput.addEventListener('change', (e) => this.loadLibrary(e));
        if (this.closePracticeBtn) this.closePracticeBtn.addEventListener('click', () => this.exitPractice());

        if (this.modeSelector) {
            this.modeSelector.addEventListener('change', (e) => {
                this.learningMode = e.target.value;
                if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
                this.updateSentence();
            });
        }

        if (this.speedSelector) {
            this.speedSelector.addEventListener('change', (e) => {
                this.playbackRate = parseFloat(e.target.value);
                this.audioPlayer.playbackRate = this.playbackRate;
            });
        }

        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleGlobalKeyUp(e));

        if (this.playAllBtn) {
            this.playAllBtn.addEventListener('click', () => {
                this.isAutoPlaying = !this.isAutoPlaying;
                this.playAllBtn.innerHTML = this.isAutoPlaying ? '⏸️ 停止朗讀' : '▶️ 開始全文章朗讀';
                this.playAllBtn.classList.toggle('btn-secondary', this.isAutoPlaying);
                if (this.isAutoPlaying) this.updateSentence();
            });
        }

        if (this.readingTimerBtn) this.readingTimerBtn.addEventListener('click', () => this.toggleReadingTimer());
        if (this.recordBtn) this.recordBtn.addEventListener('click', () => this.toggleRecording());
        if (this.correctTextBtn) this.correctTextBtn.addEventListener('click', () => this.openCorrectionModal());

        this.audioPlayer.onended = () => {
            if (this.learningMode === 'reader' && this.isAutoPlaying) {
                if (this.currentIndex < this.sentences.length - 1) {
                    this.currentIndex++;
                    this.updateSentence();
                } else {
                    this.isAutoPlaying = false;
                    this.playAllBtn.innerHTML = '▶️ 開始全文章朗讀';
                    if (this.currentArticle) this.markLessonComplete(this.currentArticle.id, 'reader');
                }
            }
        };

        // Load initially from LocalStorage
        const savedLibrary = localStorage.getItem('nc_library');
        let loaded = false;
        if (savedLibrary) {
            try {
                const data = JSON.parse(savedLibrary);
                // Handle both {articles:[]} and []
                this.articles = Array.isArray(data) ? data : (data.articles || []);
                if (this.articles && this.articles.length > 0) {
                    this.displayLessons('all');
                    loaded = true;
                }
            } catch (e) {
                console.error("Failed to parse saved library", e);
            }
        }

        // Auto load bundled nativecamp_library.json if empty
        if (!loaded) {
            this.fetchDefaultLibrary();
        }
    }

    async fetchDefaultLibrary() {
        try {
            const res = await fetch('./nativecamp_library.json');
            if (res.ok) {
                const data = await res.json();
                this.articles = Array.isArray(data) ? data : (data.articles || []);
                if (this.articles.length > 0) {
                    this.setStorage('nc_library', this.articles);
                }
                this.displayLessons('all');
            } else {
                this.displayLessons('all');
            }
        } catch (e) {
            console.log("Auto-fetch nativecamp_library.json bypassed:", e);
            this.displayLessons('all');
        }
    }

    // --- Data Persistence ---
    getStorage(key, def) {
        const val = localStorage.getItem(key);
        try { return val ? JSON.parse(val) : def; } catch (e) { return def; }
    }

    setStorage(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    }

    // --- Library Loading ---
    loadLibrary(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                // Handle both formats
                this.articles = Array.isArray(data) ? data : (data.articles || []);

                if (!this.articles || this.articles.length === 0) {
                    throw new Error("Invalid Format");
                }

                this.setStorage('nc_library', this.articles);
                this.displayLessons('all');
                alert('教材庫載入成功！');
            } catch (err) {
                console.error(err);
                alert('教材庫格式不正確。請確定選擇了正確的 JSON 檔案。');
            }
        };
        reader.readAsText(file);
    }

    displayLessons(filter = 'all') {
        if (!this.lessonGrid) return;
        this.lessonGrid.innerHTML = '';

        const stats = this.getStorage('dictation_stats', { lessonProgress: {} });
        const progress = stats.lessonProgress || {};

        let filtered = this.articles || [];
        if (filter !== 'all') {
            filtered = filtered.filter(a => a.category === filter);
        }

        if (filtered.length === 0) {
            this.lessonGrid.innerHTML = '<div class="empty-state">目前課程庫是空的。請先「載入教材庫」。</div>';
            return;
        }

        filtered.forEach(article => {
            const artProgress = progress[article.id] || {};
            // Status classes for the whole card background/style if needed
            let progressClass = '';
            if (artProgress.expert) progressClass = 'status-expert';
            else if (artProgress.novice || artProgress.trainee) progressClass = 'status-novice';
            else if (artProgress.reader) progressClass = 'status-read';

            // Extract lesson number from title properly
            let num = '';
            const numMatch = (article.title || '').match(/Lesson\s+(\d+)/i);
            if (numMatch) {
                num = numMatch[1];
            } else {
                num = String(article.id).split('_').pop();
                if (num.length > 3) num = num.slice(-1);
            }

            const category = article.category || 'Beginner';

            // Differentiate colors for labels and the side bar
            const isIntermediate = category.toLowerCase().includes('inter');
            const categoryColor = isIntermediate ? '#fbbf24' : '#6366f1';

            // Use the FIRST line of content as the display title
            const contentLines = (article.content || '').split('\n').filter(l => l.trim());
            let displayTitle = contentLines.length > 0 ? contentLines[0].trim() : 'Untitled';
            displayTitle = displayTitle.replace(/[.!?]$/, '');

            const card = document.createElement('div');
            card.className = `nc-lesson-card ${progressClass}`;
            card.style.paddingTop = '1.6rem';
            card.innerHTML = `
                <div class="status-indicator" style="background: ${categoryColor};"></div>
                <div class="nc-badge-left" style="font-weight: 800; color: ${categoryColor}; border-color: ${categoryColor}44;">${category}</div>
                <div class="nc-badge-right" style="opacity: 0.8; font-weight: 900;">L${num}</div>
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; padding: 0 5px;">
                    <p style="font-weight: 700; color: var(--text); text-align: center; font-size: 1.05rem; line-height: 1.3; margin: 0;">${displayTitle}</p>
                </div>
                <div class="nc-card-audio" style="font-size: 1.1rem; left: 0.8rem; transform: none; opacity: 0.8; color: ${categoryColor};">🔈</div>
            `;
            card.onclick = () => this.startLesson(article.id);
            this.lessonGrid.appendChild(card);
        });
    }

    filterLessons(category) {
        this.displayLessons(category);
        document.querySelectorAll('.filter-btn').forEach(btn => {
            // Check if button text matches the category
            const match = btn.textContent.toLowerCase().includes(category) ||
                (category === 'all' && btn.textContent.includes('全部'));
            btn.classList.toggle('active', match);
        });
    }

    // --- Practice Engine ---
    startLesson(id) {
        // Find article using robust ID comparison
        this.currentArticle = this.articles.find(a => String(a.id) === String(id));
        if (!this.currentArticle) {
            alert('找不到該課程資訊。');
            return;
        }

        this.sentences = (this.currentArticle.content || '').split('\n').filter(s => s.trim().length > 0);
        this.currentIndex = 0;
        this.correctCount = 0;
        this.totalAttempted = 0;

        const contentLines = (this.currentArticle.content || '').split('\n').filter(l => l.trim());
        let displayTitle = contentLines.length > 0 ? contentLines[0].trim() : 'Untitled';
        this.practiceTitle.textContent = displayTitle.replace(/[.!?]$/, '');
        this.homeView.style.display = 'none';
        this.wordbookView.style.display = 'none';
        this.profileView.style.display = 'none';
        this.practiceSection.style.display = 'flex';
        this.practiceSection.classList.add('active'); // CSS trigger
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        // Only auto-play if NOT in reader mode when first entering
        this.updateSentence(this.learningMode !== 'reader');
    }

    exitPractice() {
        this.isAutoPlaying = false;
        this.isTiming = false;
        clearInterval(this.timerInterval);
        this.practiceSection.style.display = 'none';
        this.practiceSection.classList.remove('active');
        this.homeView.style.display = 'flex';
        this.displayLessons();
    }

    updateSentence(play = true) {
        if (!this.sentences || !this.sentences[this.currentIndex]) return;

        const acc = this.totalAttempted > 0 ? Math.round((this.correctCount / this.totalAttempted) * 100) : 100;
        const perc = (this.currentIndex / this.sentences.length) * 100;

        if (this.currentIndexEl) this.currentIndexEl.textContent = this.currentIndex + 1;
        if (this.totalCountEl) this.totalCountEl.textContent = this.sentences.length;
        if (this.accuracyText) this.accuracyText.textContent = `${acc}%`;
        if (this.progressBar) this.progressBar.style.width = `${perc}%`;

        this.originalSentenceDisplay.style.display = 'none';
        this.translationDisplay.style.display = 'none';
        this.sentenceStartTime = Date.now();

        if (this.learningMode === 'reader') {
            this.wordContainer.style.display = 'none';
            this.readerView.style.display = 'block';
            this.readerControls.style.display = 'flex';
            this.virtualKeyboard.style.display = 'none';
            this.renderReader();
            if (play) this.playAudio();
            return;
        }

        // Typing Modes
        this.wordContainer.style.display = 'flex';
        this.readerView.style.display = 'none';
        this.readerControls.style.display = 'none';
        this.virtualKeyboard.style.display = 'block';

        const s = this.sentences[this.currentIndex];
        this.currentWords = s.split(/(\s+|[,.!?])/).filter(w => w.length > 0);
        this.renderWords();
        if (play) this.playAudio();

        if (this.learningMode === 'novice') {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=${encodeURIComponent(s)}`;
            fetch(url).then(r => r.json()).then(data => {
                if (data && data[0] && data[0][0]) {
                    this.translationDisplay.textContent = data[0][0][0];
                    this.translationDisplay.style.display = 'block';
                }
            }).catch(() => { });
        }
    }

    renderReader() {
        if (!this.readerView) return;
        this.readerView.innerHTML = '';
        this.sentences.forEach((s, idx) => {
            const div = document.createElement('div');
            div.className = `reader-sentence ${idx === this.currentIndex ? 'active' : ''}`;
            div.innerHTML = `<div>${s}</div>`;
            div.onclick = () => {
                this.currentIndex = idx;
                this.updateSentence();
            };
            this.readerView.appendChild(div);
            if (idx === this.currentIndex) div.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    renderWords() {
        if (!this.wordContainer) return;
        this.wordContainer.innerHTML = '';

        // Calculate max word length in current sentence to avoid hint
        const realWords = this.currentWords.filter(w => !/\s+/.test(w) && !/[,.!?]/.test(w));
        const maxLen = Math.max(...realWords.map(w => w.length), 4);
        const uniformWidth = `${maxLen + 1}ch`;

        this.currentWords.forEach((w, idx) => {
            if (/\s+/.test(w)) {
                const space = document.createElement('span');
                space.innerHTML = '&nbsp;';
                this.wordContainer.appendChild(space);
            } else if (/[,.!?]/.test(w)) {
                const punc = document.createElement('span');
                punc.textContent = w;
                punc.className = 'punctuation';
                this.wordContainer.appendChild(punc);
            } else {
                const box = document.createElement('div');
                box.className = 'word-box';

                const input = document.createElement('input');
                input.className = 'word-input';
                input.dataset.index = idx;
                input.dataset.word = w;
                input.autocomplete = "off";
                input.autocorrect = "off";
                input.spellcheck = false;
                input.style.width = uniformWidth;
                input.style.textAlign = 'center';

                // Mode-based ghost text / placeholders
                if (this.learningMode === 'novice') {
                    input.classList.add('novice-mode');
                    input.placeholder = w; // Full word guide
                } else if (this.learningMode === 'expert') {
                    input.classList.add('expert-mode'); // New class for tougher styling
                    input.placeholder = '...';
                } else if (this.learningMode === 'trainee') {
                    input.placeholder = w[0] + '_'.repeat(Math.max(1, w.length - 1));
                }

                const hint = document.createElement('div');
                hint.className = 'word-hint';
                hint.innerHTML = `<span class="ipa-text" id="ipa-${idx}"></span>${w}`;
                this.loadPhonetics(w, `ipa-${idx}`);

                // Toggle hint visibility based on mode
                if (this.learningMode !== 'novice') {
                    hint.style.opacity = '0';
                }

                input.oninput = () => this.playTypingSound();
                input.onkeydown = (e) => {
                    // Always play sound on keydown for all keys
                    this.playTypingSound();

                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.checkEntireSentence();
                    } else if (e.key === ' ') {
                        e.preventDefault();
                        this.focusNextInput(input);
                    } else if (e.key === 'Backspace' && input.value === '') {
                        e.preventDefault();
                        this.focusPrevInput(input);
                    }
                };

                // Peek feature for Trainee/Expert? (Maybe only for Trainee)
                if (this.learningMode === 'trainee') {
                    box.onmouseenter = () => hint.style.opacity = '0.4';
                    box.onmouseleave = () => hint.style.opacity = '0';
                } else if (this.learningMode === 'expert') {
                    // No peeking in expert!
                }

                box.appendChild(input);
                box.appendChild(hint);
                this.wordContainer.appendChild(box);
            }
        });
        const firstInput = this.wordContainer.querySelector('input');
        if (firstInput) firstInput.focus();
    }

    checkEntireSentence() {
        const inputs = Array.from(this.wordContainer.querySelectorAll('.word-input'));
        let allCorrect = true;

        inputs.forEach(input => {
            const userVal = input.value.trim().toLowerCase();
            const targetVal = input.dataset.word.trim().toLowerCase();
            input.classList.remove('incorrect');
            if (userVal === targetVal) {
                input.classList.add('correct');
                input.disabled = true;

                const hint = input.parentElement.querySelector('.word-hint');
                if (hint) {
                    hint.style.opacity = '1';
                    hint.style.color = 'var(--secondary)';
                }
            } else {
                input.classList.add('incorrect');
                allCorrect = false;
                this.trackMistake(input.dataset.word);
            }
        });

        this.totalAttempted++;

        if (allCorrect) {
            this.correctCount++;
            if (window.confetti) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#fbbf24', '#6366f1', '#10b981']
                });
            }
            this.playSuccessSound();

            setTimeout(() => {
                if (this.currentIndex < this.sentences.length - 1) {
                    this.currentIndex++;
                    this.updateSentence();
                } else {
                    this.playCompletionSound();
                    this.markLessonComplete(this.currentArticle.id, this.learningMode);
                    alert('🎉 太棒了！您已成功挑戰本課程的所有內容！');
                    this.exitPractice();
                }
            }, 1200);
        } else {
            this.wordContainer.classList.add('shake');
            setTimeout(() => this.wordContainer.classList.remove('shake'), 500);
        }
    }

    focusNextInput(currentInput) {
        const inputs = Array.from(this.wordContainer.querySelectorAll('.word-input'));
        const index = inputs.indexOf(currentInput);
        if (index < inputs.length - 1) {
            inputs[index + 1].focus();
            inputs[index + 1].select();
        } else {
            inputs[0].focus();
            inputs[0].select();
        }
    }

    focusPrevInput(currentInput) {
        const inputs = Array.from(this.wordContainer.querySelectorAll('.word-input'));
        const index = inputs.indexOf(currentInput);
        if (index > 0) {
            const prevInput = inputs[index - 1];
            prevInput.focus();
            // Move cursor to end
            setTimeout(() => {
                prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
            }, 0);
        }
    }

    // --- Audio ---
    playAudio() {
        if (!this.currentArticle) return;

        // Extract lesson number from title or ID
        let lessonNum = '';
        const match = (this.currentArticle.title || '').match(/Lesson\s+(\d+)/i);
        if (match) {
            lessonNum = match[1];
        } else {
            lessonNum = String(this.currentArticle.id).split('_').pop();
        }

        const category = this.currentArticle.category || 'beginner';
        this.audioPlayer.src = `nativecamp_audio/${category}/lesson_${lessonNum}/${this.currentIndex + 1}.mp3`;
        this.audioPlayer.playbackRate = this.playbackRate;
        this.audioPlayer.play().catch(e => console.log('Audio loading...'));
    }

    speakWord(word) {
        const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=en&client=tw-ob`);
        audio.play().catch(() => {
            const u = new SpeechSynthesisUtterance(word);
            u.lang = 'en-US';
            window.speechSynthesis.speak(u);
        });
    }

    playTypingSound() {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const now = this.audioCtx.currentTime;

        // Layer 1: Mechanical "Clack" (High-pass Noise)
        const noiseBuffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 0.05, this.audioCtx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = this.audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1500 + Math.random() * 500, now);

        const noiseGain = this.audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.06, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioCtx.destination);

        // Layer 2: The "Thump" (Body of the key)
        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200 + Math.random() * 50, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

        oscGain.gain.setValueAtTime(0.04, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(oscGain);
        oscGain.connect(this.audioCtx.destination);

        noise.start(now);
        osc.start(now);
        noise.stop(now + 0.05);
        osc.stop(now + 0.05);
    }

    playSuccessSound() {
        const now = this.audioCtx.currentTime;
        [440, 554, 659, 880].forEach((f, i) => {
            const o = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
            o.type = 'triangle';
            o.frequency.setValueAtTime(f, now + i * 0.1);
            g.gain.setValueAtTime(0.1, now + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.2);
            o.connect(g);
            g.connect(this.audioCtx.destination);
            o.start(now + i * 0.1);
            o.stop(now + (i + 1) * 0.2);
        });
    }

    playCompletionSound() {
        const now = this.audioCtx.currentTime;
        [523, 659, 783, 1046, 783, 1046, 1318].forEach((f, i) => {
            const o = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(f, now + i * 0.12);
            g.gain.setValueAtTime(0.15, now + i * 0.12);
            g.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.3);
            o.connect(g);
            g.connect(this.audioCtx.destination);
            o.start(now + i * 0.12);
            o.stop(now + (i + 1) * 0.3);
        });
    }

    changeSpeed(delta) {
        this.playbackRate = Math.max(0.5, Math.min(2.0, this.playbackRate + delta));
        this.audioPlayer.playbackRate = this.playbackRate;
        if (this.speedSelector) this.speedSelector.value = this.playbackRate.toFixed(1);
    }

    // --- Stats & Wordbook ---
    getStats() {
        return this.getStorage('dictation_stats', {
            lessonProgress: {},
            mistakes: {},
            wordTranslations: {},
            wordPhonetics: {}, // Caching IPA
            xp: 0,
            level: 1
        });
    }

    trackMistake(word) {
        const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (clean.length < 2) return;
        const s = this.getStats();
        s.mistakes[clean] = (s.mistakes[clean] || 0) + 1;
        this.setStorage('dictation_stats', s);
    }

    markLessonComplete(articleId, mode) {
        const s = this.getStats();
        if (!s.lessonProgress[articleId]) s.lessonProgress[articleId] = {};
        s.lessonProgress[articleId][mode] = true;

        const rewards = { 'reader': 50, 'novice': 100, 'trainee': 200, 'expert': 400 };
        s.xp += rewards[mode] || 100;

        if (s.xp >= s.level * 1000) {
            s.level++;
            s.xp = 0;
            alert(`Level Up! 現在等級是 Lv.${s.level}`);
        }
        this.setStorage('dictation_stats', s);
    }

    renderWordbook() {
        const s = this.getStats();
        const mistakes = s.mistakes || {};
        const wordTranslations = s.wordTranslations || {};
        const entries = Object.entries(mistakes).sort((a, b) => b[1] - a[1]);

        if (this.wordbookContent) {
            this.wordbookContent.innerHTML = '';
            this.selectedWords.clear();
            this.updateBatchBar();

            if (entries.length === 0) {
                this.wordbookContent.innerHTML = '<div class="empty-state">尚無錯題紀錄，繼續努力練習吧！</div>';
                return;
            }

            const list = document.createElement('div');
            list.className = 'wordbook-list';

            entries.forEach(([word, count]) => {
                const item = document.createElement('div');
                item.className = 'wordbook-item';
                const trans = wordTranslations[word] || "點擊載入翻譯...";
                const ipa = s.wordPhonetics ? s.wordPhonetics[word] : "";

                item.innerHTML = `
                    <input type="checkbox" class="wordbook-checkbox" data-word="${word}">
                    <div style="display: flex; flex-direction: column; gap: 2px; flex: 1; cursor: default;">
                        <div class="wordbook-word">${word} ${ipa ? `<span class="ipa-text" style="font-size:0.85rem; margin-top:2px;">[${ipa}]</span>` : ''}</div>
                        <div class="wordbook-trans" id="trans-${word}" style="cursor: pointer; color: var(--text-muted); font-size: 0.9rem;">${trans}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button class="btn btn-secondary btn-sm" onclick="app.speakWord('${word}')">🔊</button>
                        <span class="wordbook-count">${count}</span>
                        <button class="btn btn-sm" onclick="event.stopPropagation(); app.removeMistake('${word}')" style="background: rgba(239,68,68,0.2); color: #ef4444; border:none; padding:4px 10px; border-radius:6px;">✕</button>
                    </div>
                `;

                const cb = item.querySelector('.wordbook-checkbox');
                cb.onclick = (e) => {
                    e.stopPropagation();
                    if (cb.checked) this.selectedWords.add(word); else this.selectedWords.delete(word);
                    this.updateBatchBar();
                };

                item.onclick = (e) => {
                    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
                        cb.checked = !cb.checked;
                        if (cb.checked) this.selectedWords.add(word); else this.selectedWords.delete(word);
                        this.updateBatchBar();
                    }
                };

                const transEl = item.querySelector(`#trans-${word}`);
                transEl.onclick = async (e) => {
                    e.stopPropagation();
                    if (transEl.textContent === "載入中...") return;
                    transEl.textContent = "載入中...";
                    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=${encodeURIComponent(word)}`;
                    try {
                        const r = await fetch(url);
                        const d = await r.json();
                        if (d && d[0] && d[0][0]) {
                            const res = d[0][0][0];
                            transEl.textContent = res;
                            const currentS = this.getStats();
                            currentS.wordTranslations[word] = res;
                            this.setStorage('dictation_stats', currentS);
                        }
                    } catch (err) { transEl.textContent = "翻譯失敗"; }
                };
                list.appendChild(item);
            });
            this.wordbookContent.appendChild(list);
        }
    }

    updateBatchBar() {
        if (!this.batchActionBar) return;
        this.batchActionBar.style.display = this.selectedWords.size > 0 ? 'flex' : 'none';
        if (this.batchCountDisplay) this.batchCountDisplay.textContent = `已選擇 ${this.selectedWords.size} 個單字`;
    }

    deleteSelectedWords() {
        if (confirm(`確定刪除所選的 ${this.selectedWords.size} 個單字？`)) {
            const s = this.getStats();
            this.selectedWords.forEach(w => {
                delete s.mistakes[w];
                if (s.wordTranslations) delete s.wordTranslations[w];
                if (s.wordPhonetics) delete s.wordPhonetics[w];
            });
            this.setStorage('dictation_stats', s);
            this.selectedWords.clear();
            this.renderWordbook();
        }
    }

    removeMistake(word) {
        if (confirm(`確定從單字本移除 "${word}"？`)) {
            const s = this.getStats();
            delete s.mistakes[word];
            if (s.wordTranslations) delete s.wordTranslations[word];
            this.setStorage('dictation_stats', s);
            this.renderWordbook();
        }
    }

    clearMistakes() {
        if (confirm('確定清空所有單字本紀錄嗎？此動作無法復原。')) {
            const s = this.getStats();
            s.mistakes = {};
            s.wordTranslations = {};
            this.setStorage('dictation_stats', s);
            this.renderWordbook();
        }
    }

    // --- Profile ---
    renderProfile() {
        if (!this.statsOverview) return;
        const s = this.getStats();
        const level = s.level || 1;
        const xp = s.xp || 0;
        const targetXP = level * 1000;
        const xpPerc = (xp / targetXP) * 100;

        this.statsOverview.innerHTML = `
            <div class="stat-card">
                <span class="value">Lv.${level}</span>
                <span class="label">等級進度</span>
                <div style="width:100%; height:8px; background:rgba(255,255,255,0.05); border-radius:4px; margin-top:10px; overflow:hidden;">
                    <div style="width:${xpPerc}%; height:100%; background:var(--primary); transition: width 0.6s ease;"></div>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:5px; text-align:right;">${xp} / ${targetXP} XP</div>
            </div>
            <div class="stat-card">
                <span class="value">${Object.keys(s.mistakes || {}).length}</span>
                <span class="label">錯題單字數</span>
            </div>
        `;
    }

    // --- Import / Export ---
    exportData() {
        const d = { stats: this.getStorage('dictation_stats', {}), library: this.getStorage('nc_library', []) };
        const b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = `NativeCamp_FullBackup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }

    exportLibraryOnly() {
        if (!this.articles || this.articles.length === 0) {
            alert('目前沒有教材可供導出。');
            return;
        }
        const b = new Blob([JSON.stringify(this.articles, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'nativecamp_library_fixed.json';
        a.click();
    }

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = (event) => {
            try {
                const d = JSON.parse(event.target.result);
                if (d.stats) this.setStorage('dictation_stats', d.stats);
                if (d.library) this.setStorage('nc_library', d.library);
                alert('匯入成功！即將自動重新載入網頁。');
                location.reload();
            } catch (err) { alert('匯入格式錯誤。'); }
        };
        r.readAsText(file);
    }

    // --- Full Text Correction ---
    openCorrectionModal() {
        if (!this.currentArticle) return;
        this.correctionInput.value = this.sentences.join('\n');
        this.correctionModal.style.display = 'flex';
    }

    closeCorrectionModal() {
        if (this.correctionModal) this.correctionModal.style.display = 'none';
    }

    saveFullCorrection() {
        const fullText = this.correctionInput.value;
        const newSents = fullText.split('\n').map(s => s.trim()).filter(x => x.length > 0);

        if (newSents.length === 0) {
            alert('內容不能為空。');
            return;
        }

        this.sentences = newSents;
        const fullTxt = this.sentences.join('\n');

        if (this.currentArticle) {
            this.currentArticle.content = fullTxt;
            // Sync back to master list
            this.articles = this.articles.map(a => String(a.id) === String(this.currentArticle.id) ? this.currentArticle : a);
            this.setStorage('nc_library', this.articles);
        }

        this.closeCorrectionModal();
        this.updateSentence(false); // Refresh UI
        alert('內容修正成功！已同步至教材庫中。');
    }

    // --- Utilities ---
    handleGlobalKeyDown(e) {
        // Virtual Keyboard Highlight
        const key = e.key.toLowerCase();
        const keyEl = this.virtualKeyboard.querySelector(`[data-key="${key === ' ' ? ' ' : key}"]`);
        if (keyEl) keyEl.classList.add('active');

        // Tab Cycling for Inputs
        if (e.key === 'Tab' && document.activeElement.classList.contains('word-input')) {
            e.preventDefault();
            const inputs = Array.from(this.wordContainer.querySelectorAll('input:not([disabled])'));
            if (inputs.length > 0) {
                const idx = inputs.indexOf(document.activeElement);
                const nextIdx = e.shiftKey ? (idx - 1 + inputs.length) % inputs.length : (idx + 1) % inputs.length;
                inputs[nextIdx].focus();
            }
            return;
        }

        if (e.key === 'Control') {
            if (e.location === 1) this.playAudio(); // Left Ctrl
            if (e.location === 2) this.showAnswer(); // Right Ctrl
        }
        if (e.key === '[') this.changeSpeed(-0.1);
        if (e.key === ']') this.changeSpeed(0.1);
        if (e.key === 'Escape') this.exitPractice();
    }

    handleGlobalKeyUp(e) {
        const key = e.key.toLowerCase();
        const keyEl = this.virtualKeyboard.querySelector(`[data-key="${key === ' ' ? ' ' : key}"]`);
        if (keyEl) keyEl.classList.remove('active');
    }

    showAnswer() {
        if (this.learningMode === 'reader') return;

        const activeInput = document.activeElement.classList.contains('word-input')
            ? document.activeElement
            : this.wordContainer.querySelector('input:not([disabled])');

        if (activeInput && activeInput.dataset.word) {
            const originalVal = activeInput.value;
            activeInput.value = activeInput.dataset.word;
            activeInput.classList.add('peeking');

            setTimeout(() => {
                if (activeInput && !activeInput.disabled) {
                    activeInput.value = originalVal;
                    activeInput.classList.remove('peeking');
                }
            }, 800);
        }
    }

    // --- Recording ---
    toggleRecording() {
        if (!this.isRecording) this.startRecording(); else this.stopRecording();
    }

    async startRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('瀏覽器不支持錄音功能。');
            return;
        }
        try {
            const s = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(s);
            this.audioChunks = [];
            this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
            this.mediaRecorder.onstop = () => {
                const b = new Blob(this.audioChunks, { type: 'audio/mp3' });
                if (this.userAudioPlayer) {
                    this.userAudioPlayer.src = URL.createObjectURL(b);
                    this.userAudioPlayer.style.display = 'block';
                }
            };
            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordBtn.innerHTML = '⏹️ 停止錄音';
            this.recordBtn.style.background = '#ef4444';
            if (this.userAudioPlayer) this.userAudioPlayer.style.display = 'none';
        } catch (err) { alert('無法存取麥克風設備。'); }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            if (this.recordBtn) {
                this.recordBtn.innerHTML = '🎙️ 錄音';
                this.recordBtn.style.background = '#ef4444';
            }
            this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
        }
    }

    // --- Timer ---
    toggleReadingTimer() {
        if (!this.isTiming) {
            this.isTiming = true;
            this.readingStartTime = Date.now();
            if (this.timerDisplay) this.timerDisplay.style.display = 'block';
            this.readingTimerBtn.innerHTML = '⏹️ 停止計時';
            this.readingTimerBtn.style.background = '#ef4444';
            this.timerInterval = setInterval(() => this.updateTimer(), 10);
        } else {
            this.stopReadingTimer();
        }
    }

    stopReadingTimer() {
        this.isTiming = false;
        clearInterval(this.timerInterval);
        this.readingTimerBtn.innerHTML = '⏱️ 自我朗讀挑戰';
        this.readingTimerBtn.style.background = '#10b981';
    }

    updateTimer() {
        const diff = Date.now() - this.readingStartTime;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        const ms = Math.floor((diff % 1000) / 10);
        if (this.timerDisplay) {
            this.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
        }
    }

    switchView(viewName) {
        const v = { 'lessons': this.homeView, 'wordbook': this.wordbookView, 'profile': this.profileView };
        Object.keys(v).forEach(key => {
            if (v[key]) v[key].style.display = (key === viewName) ? 'flex' : 'none';
        });
        if (viewName === 'wordbook') this.renderWordbook();
        if (viewName === 'profile') this.renderProfile();
    }

    async loadPhonetics(word, elementId) {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (cleanWord.length < 2) return;

        const stats = this.getStats();
        const cached = stats.wordPhonetics[cleanWord];

        const el = document.getElementById(elementId);
        if (cached) {
            if (el) el.textContent = `[${cached}] `;
            return;
        }

        // Fetch from Dictionary API
        try {
            const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
            const d = await r.json();
            if (d && d[0] && d[0].phonetic) {
                const ipa = d[0].phonetic.replace(/\//g, '');
                stats.wordPhonetics[cleanWord] = ipa;
                this.setStorage('dictation_stats', stats);
                if (el) el.textContent = `[${ipa}] `;
            } else if (d && d[0] && d[0].phonetics && d[0].phonetics.length > 0) {
                const p = d[0].phonetics.find(x => x.text && x.text.length > 0);
                if (p) {
                    const ipa = p.text.replace(/\//g, '');
                    stats.wordPhonetics[cleanWord] = ipa;
                    this.setStorage('dictation_stats', stats);
                    if (el) el.textContent = `[${ipa}] `;
                }
            }
        } catch (err) {
            console.warn("Failed to fetch phonetics for", cleanWord);
        }
    }

    async speakWord(word) {
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word);
        u.lang = 'en-US';
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }
}

window.addEventListener('load', () => { window.app = new NativeCampApp(); });
