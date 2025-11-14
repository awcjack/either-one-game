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
    // 檢查 URL 是否有分享的數據
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');

    if (sharedData) {
        try {
            appState.options = decodeGameData(sharedData);
        } catch (error) {
            console.error('無法解析分享的數據:', error);
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

// 處理圖片上傳
function handleImageUpload(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        appState.options[index].image = e.target.result;
        renderEditor();
    };
    reader.readAsDataURL(file);
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

// 編碼遊戲數據
function encodeGameData(options) {
    const jsonString = JSON.stringify(options);
    return btoa(encodeURIComponent(jsonString));
}

// 解碼遊戲數據
function decodeGameData(encodedData) {
    const jsonString = decodeURIComponent(atob(encodedData));
    return JSON.parse(jsonString);
}

// 分享遊戲
function shareGame() {
    if (appState.options.length < 2) {
        alert('至少需要兩個選項才能分享！');
        return;
    }

    const encodedData = encodeGameData(appState.options);
    const url = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;

    shareLink.value = url;
    shareModal.classList.remove('hidden');
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
