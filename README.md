# 🎧 English Dictation Pro | 專業級英文聽打與聽力反射訓練系統

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Web Audio API](https://img.shields.io/badge/Audio-Web_Audio_API-success?style=for-the-badge)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-blue?style=for-the-badge&logo=github)

> **專為英語學習者量身打造的沉浸式聽打練習工具。**  
> 結合 **真人素材教材庫** 與 **自訂文章 TTS 聽打**，透過多重感官回饋與反射訓練，徹底擺脫「聽得懂卻拼不出來」或「反應太慢」的學習痛點！

---

## 🌟 核心特色 (Core Features)

### 1. 雙練習引擎 (Dual Engines)
* 🎧 **官方真人課程庫 (`index.html`)**：
  * 收錄 **60 課精選教材**（Beginner 初級 30 課 + Intermediate 中級 30 課）。
  * 完整配套真人原聲音檔（共 560+ 個高品質單句音檔）。
  * 自動加載題庫，免設定開箱即練。
* ✍️ **自訂文章模式 (`typing.html`)**：
  * 可自由貼上任何新聞、課文或長篇文章。
  * 系統自動標點斷句，並透過瀏覽器 **Web Speech API** 即時動態發音。

---

### 2. 多層次學習模式 (Adaptive Learning Modes)
* 📖 **朗讀模式 (Reader)**：全文高亮跟讀，可設定單句循環或全文連續朗讀，適合聽力輸入。
* 🟢 **新手模式 (Novice)**：輸入框內呈現半透明原單字，進行疊打與打字反射訓練。
* 🟡 **學徒模式 (Trainee)**：顯示單字首字母及字母數提示（如 `H____`），輔助聯想。
* 🔴 **專家模式 (Expert)**：完全盲打（統一代稱 `...`），不透露任何字母數量與拼寫暗示。

---

### 3. 極致的沉浸式打字體驗
* 🛡️ **防提示機制 (Anti-Hinting)**：每一句練習中的所有單字輸入框均採用「該句最長單字」的統一寬度並置中對齊，徹底消除因長度提示答案的弊病。
* 🎯 **整句判定與回饋**：輸入期間不打斷思緒，按下 `Enter` 一次校驗整句。錯誤會有回彈震動與標紅，全對觸發噴紙花與通關音效。
* ⌨️ **機械鍵盤音效**：內建 Web Audio API 動態合成多層次機械軸按鍵敲擊音效，零延遲打擊感。
* 🎙️ **發音錄音與對比**：支援麥克風錄製自己發音並即時與原音對照播放。
* 📚 **錯題單字本 (Vocabulary Book)**：自動收集拼錯的單字，提供 IPA 國際音標標註與批量管理複習。
* 📊 **數據統計與雲端存檔**：本地 LocalStorage 保存個人學習曲線、WPM 打字速度與進度，支援 JSON 一鍵匯出與備份。

---

## ⌨️ 便捷快捷鍵指南 (Keyboard Shortcuts)

| 快捷鍵 | 功能說明 |
| :--- | :--- |
| <kbd>Left Ctrl</kbd> | **重聽當前句**（隨時反覆聆聽真人音檔） |
| <kbd>Right Ctrl</kbd> | **單字閃現提示**（答案在輸入框瞬間顯示 0.8 秒輔助記憶） |
| <kbd>[</kbd> / <kbd>]</kbd> | **語速微調**（以 ±0.1x 快速加快或減慢播放速度） |
| <kbd>Space</kbd> | 跳轉至下一個單字框，並自動選取文字 |
| <kbd>Backspace</kbd> | 空框時按下自動退回上一個單字框 |
| <kbd>Enter</kbd> | 檢查當前整句正確性 |
| <kbd>Esc</kbd> | 跳至下一句 / 放棄當前題 |

---

## 📂 專案目錄結構 (Project Structure)

```text
英文聽打系統/
├── index.html                   # 系統主入口 (NativeCamp 真人聽打系統)
├── typing.html                  # 自訂文章 TTS 聽打模式
├── style.css                    # 玻璃擬態 (Glassmorphism) 核心主題樣式
├── nativecamp_script.js         # 主系統邏輯 (含自動加載、音訊播放、判定演算法)
├── script.js                    # 自訂文章模式邏輯
├── nativecamp_library.json      # 60 課官方教材資料庫
├── import_articles.json         # 自訂模式預設範例題庫
├── nativecamp_audio/            # 官方真人發音音檔庫 (Beginner & Intermediate)
│   ├── beginner/
│   └── intermediate/
├── transcripts/                 # 原始文本轉錄對照庫
├── tools/                       # 資料清洗、轉錄與維護工具腳本 (Python)
│   ├── verify_consistency.py    # 音檔與文字一致性校驗工具
│   ├── generate_import_json.py  # 文本轉 JSON 教材庫產生器
│   ├── fix_punctuation.py       # 標點符號與大小寫自動修復
│   └── download_audio.py        # 音訊資源下載工具
├── .gitignore                   # Git 排除規則
├── DEVELOPMENT_DOC.md           # 開發規格與 UI/UX 設計文件
└── README.md                    # 專案說明文件
```

---

## 🚀 快速開始 (Quick Start)

### 方式 1：本機免安裝直接執行
1. 下載或 Clone 本專案：
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
   ```
2. 直接使用 Chrome、Edge 或 Safari 瀏覽器點兩下開啟 `index.html` 即可立即練習！

### 方式 2：使用 GitHub Pages 免費線上部署
1. 將本專案推送到您的 GitHub 儲存庫。
2. 進入該 GitHub 專案的 **Settings** -> **Pages**。
3. 在 **Branch** 選擇 `main`（或 `master`），資料夾選擇 `/ (root)`，點擊 **Save**。
4. 稍等約 1 分鐘，GitHub 就會提供專屬的免費線上網址，任何人都可以用瀏覽器隨時隨地練習！

---

## 🛠️ 開發與維護 (Developer Tools)

若您有擴充教材或調整音檔的需求，可使用 `tools/` 內的維護工具：

```bash
# 校驗所有音檔與文字行數是否 100% 吻合
python tools/verify_consistency.py

# 重新生成教材庫 JSON
python tools/generate_import_json.py
```

---

## 📄 License
本專案採 [MIT License](LICENSE) 開源授權，歡迎學習、修改與推廣。
Developed with ❤️ by **Antigravity AI**
