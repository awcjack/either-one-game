// 預設選項
const DEFAULT_OPTIONS = [
    { text: '溫婉', image: null },
    { text: '威嚴', image: null },
    { text: '重視權力', image: null },
    { text: '冷靜', image: null },
    { text: '帥氣', image: null },
    { text: '手段了得', image: null },
    { text: '敏捷', image: null },
    { text: '意氣風發', image: null },
    { text: '果斷', image: null },
    { text: '忠誠', image: null },
    { text: '可愛', image: null },
    { text: '強壯', image: null },
    { text: '聰明', image: null }
];

// 應用狀態
let appState = {
    currentMode: 'editor', // 'editor', 'game', 'result'
    options: [],
    gameOptions: [], // 遊戲進行中的選項
    eliminatedOptions: []
};

// DOM 元素
const editorMode = document.getElementById('editorMode');
const gameMode = document.getElementById('gameMode');
const resultMode = document.getElementById('resultMode');
const optionsList = document.getElementById('optionsList');
const addOptionBtn = document.getElementById('addOptionBtn');
const startGameBtn = document.getElementById('startGameBtn');
const shareGameBtn = document.getElementById('shareGameBtn');
const backToEditorBtn = document.getElementById('backToEditorBtn');
const restartGameBtn = document.getElementById('restartGameBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const backToEditorFromResultBtn = document.getElementById('backToEditorFromResultBtn');
const shareModal = document.getElementById('shareModal');
const shareLink = document.getElementById('shareLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// 初始化
function init() {
    // 檢查 URL hash 是否有分享的數據
    const hash = window.location.hash.substring(1); // 移除 # 符號

    if (hash) {
        try {
            appState.options = decodeGameData(hash);
            console.log('成功載入分享的遊戲數據');
        } catch (error) {
            console.error('無法解析分享的數據:', error);
            alert('無法載入分享的遊戲數據，已載入預設選項');
            appState.options = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
        }
    } else {
        appState.options = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
    }

    renderEditor();
    attachEventListeners();
}

// 渲染編輯器
function renderEditor() {
    optionsList.innerHTML = '';

    appState.options.forEach((option, index) => {
        const optionItem = document.createElement('div');
        optionItem.className = 'option-item';

        const imagePreview = document.createElement('div');
        imagePreview.className = 'option-image-preview';
        if (!option.image) {
            imagePreview.classList.add('empty');
        } else {
            const img = document.createElement('img');
            img.src = option.image;
            imagePreview.appendChild(img);
        }

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.className = 'file-input';
        fileInput.accept = 'image/*';
        fileInput.addEventListener('change', (e) => handleImageUpload(e, index));

        imagePreview.addEventListener('click', () => fileInput.click());

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'option-text-input';
        textInput.value = option.text;
        textInput.placeholder = '輸入選項文字...';
        textInput.addEventListener('input', (e) => {
            appState.options[index].text = e.target.value;
        });

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-option-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => removeOption(index));

        optionItem.appendChild(imagePreview);
        optionItem.appendChild(fileInput);
        optionItem.appendChild(textInput);
        optionItem.appendChild(removeBtn);

        optionsList.appendChild(optionItem);
    });
}

// 壓縮圖片
function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 計算縮放比例
                if (width > height) {
                    if (width > maxWidth) {
                        height = height * (maxWidth / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = width * (maxHeight / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 轉換為 base64（使用較低的品質以減小大小）
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 處理圖片上傳
async function handleImageUpload(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // 壓縮圖片以減小 URL 大小
        const compressedImage = await compressImage(file);
        appState.options[index].image = compressedImage;
        renderEditor();
    } catch (error) {
        console.error('圖片處理失敗:', error);
        alert('圖片上傳失敗，請嘗試其他圖片');
    }
}

// 移除選項
function removeOption(index) {
    if (appState.options.length <= 2) {
        alert('至少需要保留兩個選項才能進行遊戲！');
        return;
    }
    appState.options.splice(index, 1);
    renderEditor();
}

// 新增選項
function addOption() {
    appState.options.push({ text: '', image: null });
    renderEditor();
}

// 開始遊戲
function startGame() {
    if (appState.options.length < 2) {
        alert('至少需要兩個選項才能開始遊戲！');
        return;
    }

    // 檢查是否所有選項都有文字
    const hasEmptyText = appState.options.some(opt => !opt.text.trim());
    if (hasEmptyText) {
        alert('請為所有選項填寫文字！');
        return;
    }

    // 初始化遊戲狀態
    appState.gameOptions = JSON.parse(JSON.stringify(appState.options));
    appState.eliminatedOptions = [];

    // 切換到遊戲模式
    switchMode('game');
    showNextRound();
}

// 切換模式
function switchMode(mode) {
    appState.currentMode = mode;

    editorMode.classList.add('hidden');
    gameMode.classList.add('hidden');
    resultMode.classList.add('hidden');

    if (mode === 'editor') {
        editorMode.classList.remove('hidden');
        renderEditor();
    } else if (mode === 'game') {
        gameMode.classList.remove('hidden');
    } else if (mode === 'result') {
        resultMode.classList.remove('hidden');
    }
}

// 顯示下一輪
function showNextRound() {
    if (appState.gameOptions.length === 1) {
        showResult();
        return;
    }

    // 更新統計
    document.getElementById('remainingCount').textContent = `剩餘: ${appState.gameOptions.length}`;
    document.getElementById('eliminatedCount').textContent = `已淘汰: ${appState.eliminatedOptions.length}`;

    // 隨機選擇兩個不同的選項
    const indices = getRandomIndices(appState.gameOptions.length, 2);
    const choice1Data = appState.gameOptions[indices[0]];
    const choice2Data = appState.gameOptions[indices[1]];

    // 顯示選項
    const choice1 = document.getElementById('choice1');
    const choice2 = document.getElementById('choice2');

    updateChoiceCard(choice1, choice1Data);
    updateChoiceCard(choice2, choice2Data);

    // 設置點擊事件
    choice1.onclick = () => makeChoice(indices[0], indices[1]);
    choice2.onclick = () => makeChoice(indices[1], indices[0]);
}

// 更新選擇卡片
function updateChoiceCard(card, data) {
    const img = card.querySelector('.choice-image');
    const text = card.querySelector('.choice-text');

    if (data.image) {
        img.src = data.image;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }

    text.textContent = data.text;
}

// 進行選擇
function makeChoice(winnerIndex, loserIndex) {
    // 添加動畫效果
    const cards = document.querySelectorAll('.choice-card');
    cards.forEach(card => card.style.pointerEvents = 'none');

    setTimeout(() => {
        // 移除失敗者
        const eliminated = appState.gameOptions.splice(loserIndex, 1)[0];
        appState.eliminatedOptions.push(eliminated);

        cards.forEach(card => card.style.pointerEvents = 'auto');

        // 顯示下一輪
        showNextRound();
    }, 300);
}

// 顯示結果
function showResult() {
    const winner = appState.gameOptions[0];

    const resultImage = document.getElementById('resultImage');
    const resultText = document.getElementById('resultText');

    if (winner.image) {
        resultImage.src = winner.image;
        resultImage.style.display = 'block';
    } else {
        resultImage.style.display = 'none';
    }

    resultText.textContent = winner.text;

    switchMode('result');
}

// 獲取隨機索引
function getRandomIndices(max, count) {
    const indices = [];
    while (indices.length < count) {
        const rand = Math.floor(Math.random() * max);
        if (!indices.includes(rand)) {
            indices.push(rand);
        }
    }
    return indices;
}

// 編碼遊戲數據（使用 LZ-String 壓縮）
function encodeGameData(options) {
    try {
        const jsonString = JSON.stringify(options);
        // 使用 LZ-String 壓縮並編碼為 Base64
        const compressed = LZString.compressToEncodedURIComponent(jsonString);
        return compressed;
    } catch (error) {
        console.error('編碼數據時出錯:', error);
        throw error;
    }
}

// 解碼遊戲數據（使用 LZ-String 解壓縮）
function decodeGameData(encodedData) {
    try {
        // 使用 LZ-String 解壓縮
        const decompressed = LZString.decompressFromEncodedURIComponent(encodedData);
        if (!decompressed) {
            throw new Error('解壓縮失敗');
        }
        return JSON.parse(decompressed);
    } catch (error) {
        console.error('解碼數據時出錯:', error);
        throw error;
    }
}

// 分享遊戲
function shareGame() {
    if (appState.options.length < 2) {
        alert('至少需要兩個選項才能分享！');
        return;
    }

    try {
        const encodedData = encodeGameData(appState.options);
        // 使用 hash (#) 而不是 query parameter (?)
        const url = `${window.location.origin}${window.location.pathname}#${encodedData}`;

        shareLink.value = url;
        shareModal.classList.remove('hidden');

        console.log('分享連結長度:', url.length);
    } catch (error) {
        console.error('生成分享連結時出錯:', error);
        alert('生成分享連結失敗，請稍後再試');
    }
}

// 複製連結
function copyLink() {
    shareLink.select();
    document.execCommand('copy');

    const originalText = copyLinkBtn.textContent;
    copyLinkBtn.textContent = '✓ 已複製';
    setTimeout(() => {
        copyLinkBtn.textContent = originalText;
    }, 2000);
}

// 關閉模態框
function closeModal() {
    shareModal.classList.add('hidden');
}

// 附加事件監聽器
function attachEventListeners() {
    addOptionBtn.addEventListener('click', addOption);
    startGameBtn.addEventListener('click', startGame);
    shareGameBtn.addEventListener('click', shareGame);
    backToEditorBtn.addEventListener('click', () => switchMode('editor'));
    restartGameBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', startGame);
    backToEditorFromResultBtn.addEventListener('click', () => switchMode('editor'));
    copyLinkBtn.addEventListener('click', copyLink);
    closeModalBtn.addEventListener('click', closeModal);

    // 點擊模態框背景關閉
    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) {
            closeModal();
        }
    });
}

// 啟動應用
init();
