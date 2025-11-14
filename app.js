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
    eliminatedOptions: [],
    currentChampion: null, // 當前保留的選項（上一輪的勝利者）
    championSide: null // 冠軍顯示的位置：'left' 或 'right'
};

// DOM 元素
const editorMode = document.getElementById('editorMode');
const gameMode = document.getElementById('gameMode');
const resultMode = document.getElementById('resultMode');
const optionsList = document.getElementById('optionsList');
const addOptionBtn = document.getElementById('addOptionBtn');
const saveLocalBtn = document.getElementById('saveLocalBtn');
const loadLocalBtn = document.getElementById('loadLocalBtn');
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
const generateQRBtn = document.getElementById('generateQRBtn');

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

        // 添加拖放功能
        setupDragAndDrop(imagePreview, index);

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

// 設置拖放功能
function setupDragAndDrop(element, index) {
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        element.style.borderColor = '#667eea';
        element.style.backgroundColor = '#f0f7ff';
    });

    element.addEventListener('dragleave', (e) => {
        e.preventDefault();
        element.style.borderColor = '';
        element.style.backgroundColor = '';
    });

    element.addEventListener('drop', async (e) => {
        e.preventDefault();
        element.style.borderColor = '';
        element.style.backgroundColor = '';

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            try {
                const compressedImage = await compressImage(files[0]);
                appState.options[index].image = compressedImage;
                renderEditor();
            } catch (error) {
                console.error('圖片處理失敗:', error);
                alert('圖片上傳失敗，請嘗試其他圖片');
            }
        }
    });
}

// 壓縮圖片（更激進的壓縮以縮短 URL）
function compressImage(file, maxWidth = 500, maxHeight = 500, quality = 0.5) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 計算縮放比例（保持比例）
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
                // 使用更好的圖像品質設定
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // 轉換為 JPEG 格式，使用較低的品質以大幅減小大小
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

                // 檢查壓縮後的大小
                const sizeKB = Math.round((compressedDataUrl.length * 0.75) / 1024);
                console.log(`圖片壓縮後大小: ${sizeKB}KB`);

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
    appState.currentChampion = null; // 重置當前冠軍
    appState.championSide = null; // 重置冠軍位置

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
    // 檢查是否只剩一個選項
    if (appState.gameOptions.length === 0 && appState.currentChampion) {
        // 只有冠軍了，遊戲結束
        appState.gameOptions = [appState.currentChampion];
        showResult();
        return;
    }

    if (appState.gameOptions.length === 1 && !appState.currentChampion) {
        // 只剩一個選項，遊戲結束
        showResult();
        return;
    }

    // 更新統計
    const totalRemaining = appState.gameOptions.length + (appState.currentChampion ? 1 : 0);
    document.getElementById('remainingCount').textContent = `剩餘: ${totalRemaining}`;
    document.getElementById('eliminatedCount').textContent = `已淘汰: ${appState.eliminatedOptions.length}`;

    let option1Data, option2Data;

    // 如果沒有當前冠軍（第一輪），隨機選擇兩個選項
    if (!appState.currentChampion) {
        option1Data = appState.gameOptions[0];
        option2Data = appState.gameOptions[1];
        appState.gameOptions.splice(0, 2); // 移除這兩個選項
    } else {
        // 有冠軍時，冠軍 vs 新的挑戰者，冠軍保持在同一側
        const challengerData = appState.gameOptions[0];
        appState.gameOptions.splice(0, 1); // 移除挑戰者

        if (appState.championSide === 'left') {
            // 冠軍在左邊
            option1Data = appState.currentChampion;
            option2Data = challengerData;
        } else {
            // 冠軍在右邊
            option1Data = challengerData;
            option2Data = appState.currentChampion;
        }
    }

    // 顯示選項
    const choice1 = document.getElementById('choice1');
    const choice2 = document.getElementById('choice2');

    updateChoiceCard(choice1, option1Data);
    updateChoiceCard(choice2, option2Data);

    // 設置點擊事件
    choice1.onclick = () => makeChoice(option1Data, option2Data, 'left');
    choice2.onclick = () => makeChoice(option2Data, option1Data, 'right');
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
function makeChoice(winner, loser, clickedSide) {
    // 添加動畫效果
    const cards = document.querySelectorAll('.choice-card');
    cards.forEach(card => card.style.pointerEvents = 'none');

    setTimeout(() => {
        // 淘汰失敗者
        appState.eliminatedOptions.push(loser);

        // 更新當前冠軍
        appState.currentChampion = winner;

        // 更新冠軍位置為用戶點擊的那一側
        appState.championSide = clickedSide;

        console.log(`${winner.text} 勝出！淘汰了 ${loser.text}`);
        console.log(`下一轮冠軍將顯示在: ${clickedSide === 'left' ? '左側' : '右側'}`);
        console.log(`剩餘選項: ${appState.gameOptions.length + 1}`);

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

// 生成分享連結
function generateShareLink() {
    const shareType = document.querySelector('input[name="shareType"]:checked').value;
    let dataToShare = appState.options;

    // 如果選擇僅文字模式，移除圖片
    if (shareType === 'text') {
        dataToShare = appState.options.map(opt => ({
            text: opt.text,
            image: null
        }));
    }

    const encodedData = encodeGameData(dataToShare);
    const url = `${window.location.origin}${window.location.pathname}#${encodedData}`;

    // 更新連結和長度顯示
    shareLink.value = url;
    document.getElementById('urlLength').textContent = url.length;

    // 檢查 URL 長度並顯示警告
    const urlWarning = document.getElementById('urlWarning');
    const MAX_SAFE_URL_LENGTH = 2000; // 大多數瀏覽器的安全限制

    if (url.length > MAX_SAFE_URL_LENGTH && shareType === 'full') {
        urlWarning.classList.remove('hidden');
    } else {
        urlWarning.classList.add('hidden');
    }

    console.log('分享模式:', shareType === 'full' ? '完整（圖片+文字）' : '僅文字');
    console.log('分享連結長度:', url.length);
    console.log('壓縮後數據大小:', encodedData.length, '字符');

    return url;
}

// 分享遊戲
function shareGame() {
    if (appState.options.length < 2) {
        alert('至少需要兩個選項才能分享！');
        return;
    }

    try {
        generateShareLink();
        shareModal.classList.remove('hidden');
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

// 生成 QR 碼
let qrcodeInstance = null;
function generateQRCode() {
    const url = shareLink.value;
    const qrcodeContainer = document.getElementById('qrcodeContainer');
    const qrcodeElement = document.getElementById('qrcode');

    // 檢查 URL 長度
    if (url.length > 2000) {
        alert('URL 過長，建議使用「僅文字」模式後再生成 QR 碼');
        return;
    }

    // 清除舊的 QR 碼
    qrcodeElement.innerHTML = '';

    // 生成新的 QR 碼
    try {
        qrcodeInstance = new QRCode(qrcodeElement, {
            text: url,
            width: 200,
            height: 200,
            colorDark: '#667eea',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
        qrcodeContainer.classList.remove('hidden');
        console.log('QR 碼已生成');
    } catch (error) {
        console.error('生成 QR 碼失敗:', error);
        alert('生成 QR 碼失敗');
    }
}

// 保存到本地存儲
function saveToLocal() {
    try {
        localStorage.setItem('either-one-game-draft', JSON.stringify(appState.options));
        const saveBtn = saveLocalBtn;
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ 已保存';
        saveBtn.style.background = '#28a745';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 2000);
        console.log('草稿已保存到本地');
    } catch (error) {
        console.error('保存失敗:', error);
        alert('保存失敗，可能是數據太大或瀏覽器不支援');
    }
}

// 從本地存儲載入
function loadFromLocal() {
    try {
        const saved = localStorage.getItem('either-one-game-draft');
        if (saved) {
            const confirmed = confirm('確定要載入草稿嗎？這將覆蓋當前的內容。');
            if (confirmed) {
                appState.options = JSON.parse(saved);
                renderEditor();
                alert('草稿載入成功！');
                console.log('已載入本地草稿');
            }
        } else {
            alert('沒有找到已保存的草稿');
        }
    } catch (error) {
        console.error('載入失敗:', error);
        alert('載入失敗');
    }
}

// 關閉模態框
function closeModal() {
    shareModal.classList.add('hidden');
    // 清除 QR 碼
    const qrcodeContainer = document.getElementById('qrcodeContainer');
    qrcodeContainer.classList.add('hidden');
}

// 附加事件監聽器
function attachEventListeners() {
    addOptionBtn.addEventListener('click', addOption);
    saveLocalBtn.addEventListener('click', saveToLocal);
    loadLocalBtn.addEventListener('click', loadFromLocal);
    startGameBtn.addEventListener('click', startGame);
    shareGameBtn.addEventListener('click', shareGame);
    backToEditorBtn.addEventListener('click', () => switchMode('editor'));
    restartGameBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', startGame);
    backToEditorFromResultBtn.addEventListener('click', () => switchMode('editor'));
    copyLinkBtn.addEventListener('click', copyLink);
    generateQRBtn.addEventListener('click', generateQRCode);
    closeModalBtn.addEventListener('click', closeModal);

    // 監聽分享類型切換
    document.querySelectorAll('input[name="shareType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            // 當切換分享類型時，重新生成連結並清除 QR 碼
            if (!shareModal.classList.contains('hidden')) {
                generateShareLink();
                const qrcodeContainer = document.getElementById('qrcodeContainer');
                qrcodeContainer.classList.add('hidden');
            }
        });
    });

    // 點擊模態框背景關閉
    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) {
            closeModal();
        }
    });
}

// 啟動應用
init();
