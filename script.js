class DictationApp {
    constructor() {
        this.sentences = [];
        this.currentIndex = 0;
        this.currentWords = [];
        this.correctCount = 0;
        this.totalAttempted = 0;
        this.sentenceStartTime = null;

        this.synth = window.speechSynthesis;
        this.voices = [];
        this.utterance = new SpeechSynthesisUtterance();
        this.utterance.lang = 'en-US';

        // Elements
        this.setupSection = document.getElementById('setupSection');
        this.practiceSection = document.getElementById('practiceSection');
        this.librarySection = document.getElementById('librarySection');
        this.statsSection = document.getElementById('statsSection');
        this.profileSection = document.getElementById('profileSection');
        this.homeSection = document.getElementById('homeSection');

        this.articleTitle = document.getElementById('articleTitle');
        this.articleText = document.getElementById('articleText');

        this.startBtn = document.getElementById('startBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.backupBtn = document.getElementById('backupBtn');
        this.restoreBtn = document.getElementById('restoreBtn');
        this.restoreInput = document.getElementById('restoreInput');

        this.wordContainer = document.getElementById('wordContainer');
        this.originalSentenceDisplay = document.getElementById('originalSentenceDisplay');
        this.giveUpBtn = document.getElementById('giveUpBtn');

        this.currentIndexEl = document.getElementById('currentIndex');
        this.totalCountEl = document.getElementById('totalCount');
        this.accuracyText = document.getElementById('accuracyText');
        this.progressBar = document.getElementById('progressBar');

        this.speedRange = document.getElementById('speedRange');
        this.speedValue = document.getElementById('speedValue');
        this.toggleHint = document.getElementById('toggleHint');
        this.shuffleCheckbox = document.getElementById('shuffleCheckbox');
        this.voiceChipsContainer = document.getElementById('voiceChips');
        this.closePracticeBtn = document.getElementById('closePracticeBtn');
        this.virtualKeyboard = document.getElementById('virtualKeyboard');

        // Audio Context for typing sound
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.init();
        this.renderHome(); // Add this
    }

    playTypingSound() {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

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
        noiseGain.gain.setValueAtTime(0.05, now);
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

        oscGain.gain.setValueAtTime(0.03, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(oscGain);
        oscGain.connect(this.audioCtx.destination);

        noise.start(now);
        osc.start(now);
        noise.stop(now + 0.05);
        osc.stop(now + 0.05);
    }

    playFeedbackSound(isSuccess) {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        if (isSuccess) {
            // "Cash Register" / Coin Sound
            // Part 1: High Ping
            const osc1 = this.audioCtx.createOscillator();
            const gain1 = this.audioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(1400, now);
            osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
            gain1.gain.setValueAtTime(0.1, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc1.connect(gain1);
            gain1.connect(this.audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.3);

            // Part 2: Secondary Ping (harmonic)
            const osc2 = this.audioCtx.createOscillator();
            const gain2 = this.audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(2000, now + 0.05);
            gain2.gain.setValueAtTime(0.05, now + 0.05);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc2.connect(gain2);
            gain2.connect(this.audioCtx.destination);
            osc2.start(now + 0.05);
            osc2.stop(now + 0.35);

        } else {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        }
    }

    playLevelUpSound() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const now = this.audioCtx.currentTime;

        // Victory fanfare
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0.1, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    init() {
        this.loadVoices();

        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }

        this.toggleHint.addEventListener('change', () => this.updateHintVisibility());

        // Setup control listeners
        this.speedRange.addEventListener('input', (e) => {
            const val = e.target.value;
            this.speedValue.textContent = val;
            this.utterance.rate = val;
        });

        this.startBtn.addEventListener('click', () => this.startPractice());
        this.saveBtn.addEventListener('click', () => this.saveArticle());
        this.backupBtn.addEventListener('click', () => this.exportData());
        this.restoreBtn.addEventListener('click', () => this.restoreInput.click());
        this.restoreInput.addEventListener('change', (e) => this.importData(e));

        // Remove any existing listeners to prevent duplication if init called multiple times (though it shouldn't be)
        // Better: just add listener.
        this.giveUpBtn.onclick = () => this.giveUpAndShowAnswer();
        this.closePracticeBtn.addEventListener('click', () => this.resetApp());

        // Keyboard tracking
        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleGlobalKeyUp(e));

        // Navigation Logic
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                this.switchSection(targetId);

                // Refresh data when switching
                if (targetId === 'librarySection') this.renderLibrary();
                if (targetId === 'statsSection') this.renderStats();
                if (targetId === 'profileSection') this.renderProfile();
                if (targetId === 'homeSection') this.renderHome();
            });
        });

        document.getElementById('clearStatsBtn').addEventListener('click', () => {
            if (confirm('確定要清除所有統計資料嗎？不可恢復。')) {
                localStorage.removeItem('dictation_stats');
                this.renderStats();
            }
        });
    }

    handleGlobalKeyDown(e) {
        // Highlight virtual key
        const key = e.key.toLowerCase();
        const keyEl = this.virtualKeyboard.querySelector(`[data-key="${key}"]`);
        if (keyEl) keyEl.classList.add('active');

        if (this.practiceSection.style.display === 'block' || this.practiceSection.classList.contains('active-section')) {
            // Track typing start
            if (!this.sentenceStartTime && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                this.sentenceStartTime = Date.now();
            }

            // Replay shortcut: Ctrl
            if (e.key === 'Control' && !e.repeat) {
                e.preventDefault();
                this.speakCurrent();
            }

            // Also allow Enter to replay ONLY if not inside an input (prevent double trigger)
            if (e.key === 'Enter' && !e.target.classList.contains('word-input')) {
                this.speakCurrent();
            }

            // Give up shortcut: Escape
            if (e.key === 'Escape') {
                e.preventDefault();
                this.giveUpAndShowAnswer();
            }

            // Speed shortcuts: [ (decrease), ] (increase)
            if (e.key === '[') {
                const newVal = Math.max(0.5, parseFloat(this.speedRange.value) - 0.1);
                this.speedRange.value = newVal.toFixed(1);
                this.speedRange.dispatchEvent(new Event('input'));
            }
            if (e.key === ']') {
                const newVal = Math.min(1.5, parseFloat(this.speedRange.value) + 0.1);
                this.speedRange.value = newVal.toFixed(1);
                this.speedRange.dispatchEvent(new Event('input'));
            }

            // Voice shortcut: F2
            if (e.key === 'F2') {
                e.preventDefault();
                const chip = this.voiceChipsContainer.querySelector('.voice-chip');
                if (chip) chip.click();
            }
        }
    }

    handleGlobalKeyUp(e) {
        const key = e.key.toLowerCase();
        const keyEl = this.virtualKeyboard.querySelector(`[data-key="${key}"]`);
        if (keyEl) keyEl.classList.remove('active');
    }

    loadVoices() {
        const allVoices = this.synth.getVoices();
        if (allVoices.length === 0) return;

        this.voiceChipsContainer.innerHTML = '';

        // Find top candidates in order of preference
        const candidates = [
            ...allVoices.filter(v => v.name.includes('Aria') && v.name.includes('Natural')),
            ...allVoices.filter(v => v.name.includes('Guy') && v.name.includes('Natural')),
            ...allVoices.filter(v => v.name.includes('Natural') && v.lang.startsWith('en-US')),
            ...allVoices.filter(v => v.name.includes('Google US English')),
            ...allVoices.filter(v => v.lang.startsWith('en-US'))
        ];

        // Unique voices only (by name)
        const uniqueNames = new Set();
        this.topVoices = [];
        candidates.forEach(v => {
            if (!uniqueNames.has(v.name)) {
                uniqueNames.add(v.name);
                this.topVoices.push(v);
            }
        });

        // Ensure at least one fallback
        if (this.topVoices.length === 0) {
            const fallback = allVoices.find(v => v.lang.startsWith('en'));
            if (fallback) this.topVoices.push(fallback);
        }

        // Initialize or Cycle
        if (this.currentVoiceIndex === undefined || this.currentVoiceIndex >= this.topVoices.length) {
            this.currentVoiceIndex = 0;
        }

        this.setVoice(this.currentVoiceIndex);
    }

    setVoice(index) {
        if (!this.topVoices[index]) return;

        this.currentVoiceIndex = index;
        const selectedVoice = this.topVoices[index];
        this.utterance.voice = selectedVoice;

        this.voiceChipsContainer.innerHTML = '';
        const chip = document.createElement('div');
        chip.className = 'voice-chip active';
        chip.style.cursor = 'pointer';
        chip.title = '點擊切換下一個推薦語音';

        const displayName = selectedVoice.name
            .replace('Microsoft ', '')
            .replace('Online (Natural)', '🌿')
            .replace('Google ', '🌐 ')
            .split(' ')[0]; // Take only first part for maximum conciseness

        chip.textContent = `🗣️ ${displayName}`;

        chip.addEventListener('click', () => {
            let nextIndex = this.currentVoiceIndex + 1;
            if (nextIndex >= this.topVoices.length) nextIndex = 0;
            this.setVoice(nextIndex);
        });
        this.voiceChipsContainer.appendChild(chip);
    }

    async startPractice() {
        const text = this.articleText.value.trim();
        if (!text) return alert('請先貼上英文文章！');

        this.sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0);

        if (this.sentences.length === 0) return alert('無法解析文章內容。');

        if (this.shuffleCheckbox.checked) {
            for (let i = this.sentences.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.sentences[i], this.sentences[j]] = [this.sentences[j], this.sentences[i]];
            }
        }

        this.currentIndex = 0;
        this.correctCount = 0;
        this.totalAttempted = 0;
        this.switchSection('practiceSection');
        this.updateSentence();
        this.speakCurrent();
    }

    updateSentence() {
        const total = this.sentences.length;
        const current = this.currentIndex + 1;
        const percentage = Math.round((current / total) * 100);

        this.currentIndexEl.textContent = current;
        this.totalCountEl.textContent = total;

        let accuracy = 0;
        if (this.totalAttempted > 0) {
            accuracy = Math.round((this.correctCount / this.totalAttempted) * 100);
        }
        this.accuracyText.textContent = `${accuracy}%`;

        this.progressBar.style.width = `${percentage}%`;

        this.originalSentenceDisplay.style.display = 'none';
        this.giveUpBtn.textContent = '🏳️ 放棄作答 (顯示答案)';
        this.giveUpBtn.onclick = () => this.giveUpAndShowAnswer();
        this.giveUpBtn.classList.remove('btn-primary');
        this.giveUpBtn.classList.add('btn-secondary');
        this.giveUpBtn.disabled = false;

        const sentence = this.sentences[this.currentIndex];
        this.sentenceStartTime = null; // Reset timer for new sentence
        this.currentWords = sentence.split(/(\s+|[,.!?])/).filter(w => w.length > 0);
        this.renderWords();
    }

    renderWords() {
        this.wordContainer.innerHTML = '';
        let maxLen = 0;
        this.currentWords.forEach(token => {
            if (!/^\s+$/.test(token) && !/^[,.!?]$/.test(token)) {
                if (token.length > maxLen) maxLen = token.length;
            }
        });
        const uniformWidth = `${Math.max(maxLen, 4)}ch`;

        this.currentWords.forEach((token, idx) => {
            if (/^\s+$/.test(token)) {
                this.wordContainer.appendChild(document.createTextNode(token));
                return;
            }

            if (/^[,.!?]$/.test(token)) {
                const span = document.createElement('span');
                span.className = 'punctuation';
                span.textContent = token;
                this.wordContainer.appendChild(span);
                return;
            }

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'word-input';
            if (!this.toggleHint.checked) input.classList.add('hidden-text');
            input.dataset.target = token;
            input.dataset.index = idx;
            input.style.width = uniformWidth;

            input.addEventListener('input', () => {
                if (input.value.length > 0) input.classList.add('revealed');
                else input.classList.remove('revealed');
            });

            input.addEventListener('focus', () => { input.select(); });

            input.addEventListener('keydown', (e) => {
                if (e.key.length === 1 || e.key === 'Backspace' || e.key === ' ' || e.key === 'Tab') {
                    this.playTypingSound();
                }

                if (e.key === ' ') {
                    e.preventDefault();
                    this.focusNextInput(input);
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    if (e.shiftKey) this.focusPrevInput(input);
                    else this.focusNextInput(input);
                } else if (e.key === 'Enter') {
                    this.checkEntireSentence();
                } else if (e.key === 'Backspace' && input.value === '') {
                    e.preventDefault();
                    this.focusPrevInput(input);
                }
            });

            this.wordContainer.appendChild(input);
        });

        const firstInput = this.wordContainer.querySelector('.word-input');
        if (firstInput) firstInput.focus();
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
            setTimeout(() => {
                prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
            }, 0);
        } else {
            const last = inputs[inputs.length - 1];
            last.focus();
            setTimeout(() => {
                last.setSelectionRange(last.value.length, last.value.length);
            }, 0);
        }
    }

    speakCurrent() {
        if (this.synth.speaking) this.synth.cancel();
        this.utterance.text = this.sentences[this.currentIndex];
        this.synth.speak(this.utterance);
    }

    checkEntireSentence() {
        const inputs = Array.from(this.wordContainer.querySelectorAll('.word-input'));
        let allCorrect = true;

        inputs.forEach(input => {
            const userVal = input.value.trim().toLowerCase();
            const targetVal = input.dataset.target.trim().toLowerCase();
            input.classList.remove('incorrect');
            if (userVal === targetVal) {
                input.classList.add('correct');
            } else {
                input.classList.add('incorrect');
                allCorrect = false;
            }
        });

        if (allCorrect) {
            this.playFeedbackSound(true);
            this.correctCount++;
            this.totalAttempted++;
            this.updateXP(50 + (this.currentWords.length * 2));
            this.updateStats(this.currentWords.length);

            // Calculate WPM
            if (this.sentenceStartTime) {
                const endTime = Date.now();
                const totalTimeSeconds = (endTime - this.sentenceStartTime) / 1000;
                const totalCharacters = this.sentences[this.currentIndex].length;
                const wpm = Math.round((totalCharacters / 5) / (totalTimeSeconds / 60)) || 0;

                // Show WPM in the UI
                const wpmEl = document.getElementById('wpmDisplay');
                if (wpmEl) {
                    wpmEl.textContent = `⚡ ${wpm} WPM`;
                    wpmEl.style.opacity = '1';
                    setTimeout(() => { wpmEl.style.opacity = '0.5'; }, 3000);
                }
            }

            this.triggerCelebration();

            setTimeout(() => {
                this.currentIndex++;
                if (this.currentIndex < this.sentences.length) {
                    this.updateSentence();
                    setTimeout(() => this.speakCurrent(), 500);
                } else {
                    this.finishPractice();
                }
            }, 1000);
        } else {
            this.playFeedbackSound(false);
            inputs.forEach(input => {
                const userVal = input.value.trim().toLowerCase();
                const targetVal = input.dataset.target.trim().toLowerCase();
                if (userVal !== targetVal && userVal !== '') {
                    this.trackMistake(input.dataset.target);
                }
            });
            this.wordContainer.classList.add('shake');
            setTimeout(() => this.wordContainer.classList.remove('shake'), 500);
        }
    }

    updateHintVisibility() {
        const inputs = this.wordContainer.querySelectorAll('.word-input');
        inputs.forEach(input => {
            if (this.toggleHint.checked) input.classList.remove('hidden-text');
            else input.classList.add('hidden-text');
        });
    }

    finishPractice() {
        this.progressBar.style.width = '100%';
        let accuracy = 0;
        if (this.totalAttempted > 0) accuracy = Math.round((this.correctCount / this.totalAttempted) * 100);
        alert(`練習完成！🎉\n最終正確率：${accuracy}%\n答對句子：${this.correctCount} / ${this.totalAttempted}`);
        this.resetApp();
    }

    giveUpAndShowAnswer() {
        if (this.originalSentenceDisplay.style.display === 'block') return; // Prevent multiple triggers

        this.totalAttempted++;
        this.trackSkipped(this.sentences[this.currentIndex]);
        this.originalSentenceDisplay.textContent = this.sentences[this.currentIndex];
        this.originalSentenceDisplay.style.display = 'block';

        const inputs = this.wordContainer.querySelectorAll('.word-input');
        inputs.forEach(input => {
            input.disabled = true;
            input.classList.add('revealed-answer');
        });

        // Hide button as per user request ("Next button doesn't need to appear")
        this.giveUpBtn.style.display = 'none';

        // Auto-advance after 2 seconds
        setTimeout(() => {
            // Check if we are still in practice mode and on the same section
            if (this.practiceSection.style.display !== 'none') {
                this.currentIndex++;
                if (this.currentIndex < this.sentences.length) {
                    this.updateSentence();
                    // Still hidden as per user request
                    setTimeout(() => this.speakCurrent(), 500);
                } else {
                    this.finishPractice();
                }
            }
        }, 3000);
    }

    resetApp() {
        this.switchSection('setupSection');
    }

    switchSection(sectionId) {
        [this.setupSection, this.librarySection, this.statsSection, this.practiceSection, this.homeSection, this.profileSection].forEach(sec => {
            if (sec) {
                sec.style.display = 'none';
                sec.classList.remove('active-section');
            }
        });
        const target = document.getElementById(sectionId);
        if (target) {
            target.style.display = (sectionId === 'practiceSection' || sectionId === 'setupSection' || sectionId === 'homeSection') ? 'flex' : 'block';
            if (sectionId === 'practiceSection') target.style.display = 'flex';
            target.classList.add('active-section');
        }
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.target === sectionId) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    getStorage(key, defaultVal) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultVal;
    }

    setStorage(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    }

    saveArticle() {
        const title = this.articleTitle.value.trim() || '未命名文章 ' + new Date().toLocaleDateString();
        const content = this.articleText.value.trim();
        if (!content) return alert('內容不能為空！');
        const articles = this.getStorage('dictation_articles', []);
        const existingIndex = articles.findIndex(a => a.title === title);
        if (existingIndex !== -1) {
            if (!confirm(`文章「${title}」已存在，確定要覆蓋嗎？`)) return;
            articles[existingIndex].content = content;
            articles[existingIndex].date = new Date().toLocaleDateString();
            this.setStorage('dictation_articles', articles);
            alert('✅ 文章已更新！');
        } else {
            const newArticle = { id: Date.now(), title, content, date: new Date().toLocaleDateString() };
            articles.unshift(newArticle);
            this.setStorage('dictation_articles', articles);
            alert('✅ 文章已存入題庫！');
        }
    }

    renderLibrary() {
        const list = document.getElementById('articleList');
        const articles = this.getStorage('dictation_articles', []);
        if (articles.length === 0) {
            list.innerHTML = '<div class="empty-state">尚未儲存任何文章</div>';
            return;
        }
        list.innerHTML = '';
        articles.forEach(article => {
            const card = document.createElement('div');
            card.className = 'article-card';
            card.innerHTML = `<h3>${article.title}</h3><div class="article-date">${article.date}</div><div class="article-actions"><button class="btn btn-primary btn-sm load-btn">練習此篇</button><button class="btn btn-secondary btn-sm delete-btn" style="background:var(--danger)">刪除</button></div>`;
            card.querySelector('.load-btn').addEventListener('click', () => { this.startArticle(article); });
            card.querySelector('.delete-btn').addEventListener('click', () => {
                if (confirm('確定刪除？')) {
                    const newArticles = articles.filter(a => a.id !== article.id);
                    this.setStorage('dictation_articles', newArticles);
                    this.renderLibrary();
                }
            });
            list.appendChild(card);
        });
    }

    trackMistake(word) {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (cleanWord.length < 2) return;
        const stats = this.getStorage('dictation_stats', { mistakes: {}, skipped: [] });
        if (!stats.mistakes) stats.mistakes = {};
        stats.mistakes[cleanWord] = (stats.mistakes[cleanWord] || 0) + 1;
        this.setStorage('dictation_stats', stats);
    }

    trackSkipped(sentence) {
        if (!sentence) return;
        const stats = this.getStorage('dictation_stats', { mistakes: {}, skipped: [] });
        if (!stats.skipped) stats.skipped = [];
        stats.skipped.unshift({ text: sentence, date: new Date().toLocaleDateString() });
        if (stats.skipped.length > 50) stats.skipped.pop();
        this.setStorage('dictation_stats', stats);
    }

    renderStats() {
        const stats = this.getStorage('dictation_stats', { mistakes: {}, skipped: [] });
        const mistakeList = document.getElementById('mistakeList');
        const skippedList = document.getElementById('skippedList');
        mistakeList.innerHTML = '';
        const sortedMistakes = Object.entries(stats.mistakes || {}).sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (sortedMistakes.length === 0) mistakeList.innerHTML = '<div style="color:var(--text-muted);text-align:center">尚無錯題紀錄</div>';
        else sortedMistakes.forEach(([word, count]) => {
            const li = document.createElement('li');
            li.className = 'stat-item';
            li.innerHTML = `<span class="stat-word">${word}</span><span class="stat-count">錯 ${count} 次</span>`;
            mistakeList.appendChild(li);
        });
        skippedList.innerHTML = '';
        if (!stats.skipped || stats.skipped.length === 0) skippedList.innerHTML = '<div style="color:var(--text-muted);text-align:center">尚無放棄紀錄</div>';
        else stats.skipped.forEach(item => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.style.display = 'block';
            div.innerHTML = `<div style="font-size:0.9rem;margin-bottom:0.3rem">${item.text}</div><div style="font-size:0.75rem;color:var(--text-muted)">${item.date}</div>`;
            skippedList.appendChild(div);
        });
    }

    exportData() {
        const data = { articles: this.getStorage('dictation_articles', []), stats: this.getStorage('dictation_stats', {}) };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dictation_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (confirm('確定要還原備份嗎？目前的紀錄將被覆蓋！')) {
                    if (data.articles) this.setStorage('dictation_articles', data.articles);
                    if (data.stats) this.setStorage('dictation_stats', data.stats);
                    alert('✅ 資料還原成功！');
                    this.renderProfile();
                    this.renderStats();
                    this.renderLibrary();
                }
            } catch (err) { alert('❌ 檔案格式錯誤，無法還原。'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    updateXP(amount) {
        const stats = this.getStorage('dictation_stats', { mistakes: {}, skipped: [], xp: 0, level: 1 });
        if (!stats.xp) stats.xp = 0;
        if (!stats.level) stats.level = 1;
        stats.xp += amount;
        const requiredXP = stats.level * 1000;
        if (stats.xp >= requiredXP) {
            stats.xp -= requiredXP;
            stats.level++;
            this.playLevelUpSound();
            alert(`🎉 恭喜升級！現在是 Level ${stats.level}！`);
        }
        this.setStorage('dictation_stats', stats);
    }

    updateStats(wordCount) {
        const stats = this.getStorage('dictation_stats', {});
        stats.totalWords = (stats.totalWords || 0) + wordCount;
        stats.studyTimeMinutes = (stats.studyTimeMinutes || 0) + 0.5;
        const today = new Date().toDateString();
        if (!stats.lastPracticeDate) stats.lastPracticeDate = today;
        if (stats.lastPracticeDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (stats.lastPracticeDate === yesterday.toDateString()) stats.streak = (stats.streak || 0) + 1;
            else stats.streak = 1;
            stats.lastPracticeDate = today;
        }
        this.setStorage('dictation_stats', stats);
    }

    renderProfile() {
        const stats = this.getStorage('dictation_stats', { xp: 0, level: 1, streak: 0, totalWords: 0, studyTimeMinutes: 0 });
        const level = stats.level || 1;
        const xp = stats.xp || 0;
        const maxXP = level * 1000;
        const percentage = Math.min((xp / maxXP) * 100, 100);
        const badge = document.getElementById('levelBadge');
        if (badge) badge.textContent = `Lv. ${level}`;
        const title = document.getElementById('levelTitle');
        if (title) title.textContent = this.getLevelTitle(level);
        const bar = document.getElementById('xpBar');
        if (bar) bar.style.width = `${percentage}%`;
        const xpEl = document.getElementById('currentXP');
        if (xpEl) xpEl.textContent = xp;
        const maxXpEl = document.getElementById('nextLevelXP');
        if (maxXpEl) maxXpEl.textContent = maxXP;
        const streakEl = document.getElementById('streakCount');
        if (streakEl) streakEl.textContent = `${stats.streak || 0} 天`;
        const wordsEl = document.getElementById('totalWordsTyped');
        if (wordsEl) wordsEl.textContent = `${stats.totalWords || 0} 字`;
        const timeEl = document.getElementById('totalStudyTime');
        if (timeEl) timeEl.textContent = `${Math.floor(stats.studyTimeMinutes || 0)} 分鐘`;
    }

    getLevelTitle(level) {
        if (level >= 50) return '聽打傳奇 (Legend)';
        if (level >= 30) return '聽打大師 (Master)';
        if (level >= 20) return '聽打專家 (Expert)';
        if (level >= 10) return '聽打老手 (Veteran)';
        if (level >= 5) return '聽打學徒 (Apprentice)';
        return '新手聽打員 (Novice)';
    }

    triggerCelebration() {
        if (typeof confetti === 'function') {
            const duration = 500;
            const animationEnd = Date.now() + duration;
            // Use a very high z-index to ensure it's above the practice section (10000)
            const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 99999 };

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 100 * (timeLeft / duration);

                // Burst from the center of the screen
                confetti(Object.assign({}, defaults, {
                    particleCount,
                    origin: { x: 0.5, y: 0.5 }
                }));
            }, 250);
        }
    }

    renderHome() {
        const list = document.getElementById('quickStartList');
        const articles = this.getStorage('dictation_articles', []);
        if (articles.length === 0) {
            list.innerHTML = '<div class="empty-state">尚未儲存任何文章</div>';
            return;
        }
        list.innerHTML = '';
        articles.slice(0, 4).forEach(article => {
            const card = document.createElement('div');
            card.className = 'quick-card';
            card.innerHTML = `<h4>${article.title}</h4><span>${article.date}</span>`;
            card.addEventListener('click', () => { this.startArticle(article); });
            list.appendChild(card);
        });
    }

    startArticle(article) {
        this.articleTitle.value = article.title;
        this.articleText.value = article.content;
        this.startPractice();
    }
}

document.addEventListener('DOMContentLoaded', () => { new DictationApp(); });
