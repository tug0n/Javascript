const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Các Element UI từ Bootstrap
const scoreDisplay = document.getElementById("score-display");
const floorDisplay = document.getElementById("floor-display");
const statusDisplay = document.getElementById("status-display");
const gameOverScreen = document.getElementById("game-over-screen");
const restartBtn = document.getElementById("restart-btn");

// Các Element UI mới cho Sảnh và Cài Đặt
const lobbyScreen = document.getElementById("lobby-screen");
const hudContainer = document.getElementById("hud-container");
const controlsHint = document.getElementById("controls-hint");
const startGameBtn = document.getElementById("start-game-btn");
const lobbyBtn = document.getElementById("lobby-btn");
const musicVolumeInput = document.getElementById("music-volume");
const sfxVolumeInput = document.getElementById("sfx-volume");
const musicVolVal = document.getElementById("music-vol-val");
const sfxVolVal = document.getElementById("sfx-vol-val");
const clearHistoryBtn = document.getElementById("clear-history-btn");

// CẤU HÌNH HỆ THỐNG
const GRID_SIZE = 40;
const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;

// BIẾN TRẠNG THÁI GAME
let gameMode = "adventure"; // "adventure" hoặc "infinite"
let snake = [];
let snakeColor = "";
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let floor = 1;
let isDead = false;
let inLobby = true;
let dungeonDetails = [];

// BIẾN ROGUELIKE BỔ SUNG
let isSelectingBlessing = false;
let isPaused = false;
let ownedBlessings = [];
let scoreForNextFloor = 50;
let unlockedFoods = ['gold_chest'];
let isInvincible = false;
let invincibleTime = 0;
let foodSpawnCount = 1;
let dangerSensorRange = 2.5 * GRID_SIZE;
let bulletsCount = 0;
let maxBulletsPerFloor = 0;
let cameraScale = 1.0;
let ownsCrystalHeart = false;
let borderWalls = new Set();
let rockWalls = new Map();
let monsters = [];
let bullets = [];
let foods = [];
let bossSnake = [];
let bossMoveCounter = 0;
let cheatCodeSequence = [];

// HỆ THỐNG ÂM THANH RETRO
const SoundManager = {
    audioCtx: null,
    musicNode: null,
    musicGain: null,
    sfxGain: null,
    musicVolume: 0.5,
    sfxVolume: 0.5,
    isPlayingMusic: false,
    musicTimeout: null,

    init() {
        if (this.audioCtx) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.musicGain = this.audioCtx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioCtx.currentTime);
        this.musicGain.connect(this.audioCtx.destination);

        this.sfxGain = this.audioCtx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime);
        this.sfxGain.connect(this.audioCtx.destination);
    },

    setMusicVolume(volume) {
        this.musicVolume = volume;
        if (this.musicGain && this.audioCtx) {
            this.musicGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
        }
    },

    setSfxVolume(volume) {
        this.sfxVolume = volume;
        if (this.sfxGain && this.audioCtx) {
            this.sfxGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
        }
    },

    playEat() {
        this.init();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.12);
        osc.start(); osc.stop(this.audioCtx.currentTime + 0.12);
    },

    playDead() {
        this.init();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, this.audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(this.audioCtx.currentTime + 0.5);
    },

    playNextFloor() {
        this.init();
        const now = this.audioCtx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, index) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain); gain.connect(this.sfxGain);
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + index * 0.08);
            gain.gain.setValueAtTime(0.15, now + index * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.12);
            osc.start(now + index * 0.08); osc.stop(now + index * 0.08 + 0.12);
        });
    },

    playShoot() {
        this.init();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
        osc.start(); osc.stop(this.audioCtx.currentTime + 0.15);
    },

    playBreak() {
        this.init();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, this.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(30, this.audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(this.audioCtx.currentTime + 0.2);
    },

    playMusic() {
        this.init();
        if (this.isPlayingMusic) return;
        this.isPlayingMusic = true;

        let noteIndex = 0;
        const melody = [
            146.83, 164.81, 196.00, 220.00,
            196.00, 220.00, 261.63, 293.66,
            261.63, 293.66, 329.63, 392.00,
            329.63, 293.66, 261.63, 196.00
        ];

        const playNextMusicNote = () => {
            if (!this.isPlayingMusic) return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain); gain.connect(this.musicGain);
            osc.type = "triangle";
            osc.frequency.setValueAtTime(melody[noteIndex % melody.length], this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.35);
            noteIndex++;
            this.musicTimeout = setTimeout(playNextMusicNote, 320);
        };
        playNextMusicNote();
    },

    stopMusic() {
        this.isPlayingMusic = false;
        if (this.musicTimeout) clearTimeout(this.musicTimeout);
    }
};

// HỆ THỐNG LỊCH SỬ KỶ LỤC
function getRecords() {
    try {
        const recordsStr = localStorage.getItem("snake_roguelike_records");
        return recordsStr ? JSON.parse(recordsStr) : [];
    } catch (e) { return []; }
}

function saveRecord(floorReached, finalScore, mode) {
    let records = getRecords();
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Thêm kỷ lục mới
    records.push({ floor: floorReached, score: finalScore, date: dateStr, mode: mode });

    // Phân loại riêng biệt để giữ top 5 cho mỗi chế độ
    let adventureRecords = records.filter(r => r.mode !== "infinite");
    let infiniteRecords = records.filter(r => r.mode === "infinite");

    adventureRecords.sort((a, b) => b.score - a.score || b.floor - a.floor);
    infiniteRecords.sort((a, b) => b.score - a.score);

    adventureRecords = adventureRecords.slice(0, 5);
    infiniteRecords = infiniteRecords.slice(0, 5);

    // Lưu lại danh sách gộp
    records = [...adventureRecords, ...infiniteRecords];
    localStorage.setItem("snake_roguelike_records", JSON.stringify(records));
}

function renderRecordsTable() {
    const records = getRecords();

    // Lọc kỷ lục của 2 chế độ chơi
    const adventureRecords = records.filter(r => r.mode !== "infinite");
    const infiniteRecords = records.filter(r => r.mode === "infinite");

    // 1. Render bảng Mạo Hiểm
    const adventureBody = document.getElementById("adventure-table-body");
    const noAdventureMsg = document.getElementById("no-adventure-msg");
    const adventureTable = document.getElementById("adventure-table");

    adventureBody.innerHTML = "";
    if (adventureRecords.length === 0) {
        noAdventureMsg.classList.remove("d-none");
        adventureTable.classList.add("d-none");
    } else {
        noAdventureMsg.classList.add("d-none");
        adventureTable.classList.remove("d-none");
        adventureRecords.forEach((record, index) => {
            const tr = document.createElement("tr");
            let rankSymbol = index === 0 ? "🥇 Hạng 1" : index === 1 ? "🥈 Hạng 2" : index === 2 ? "🥉 Hạng 3" : `🏅 Hạng ${index + 1}`;
            tr.innerHTML = `
                <td class="text-warning fw-bold">${rankSymbol}</td>
                <td class="text-white">Tầng ${record.floor}</td>
                <td class="text-info fw-bold">${record.score}</td>
                <td class="small text-light-grey" style="color: #cbd5e1 !important;">${record.date}</td>
            `;
            adventureBody.appendChild(tr);
        });
    }

    // 2. Render bảng Vô Hạn
    const infiniteBody = document.getElementById("infinite-table-body");
    const noInfiniteMsg = document.getElementById("no-infinite-msg");
    const infiniteTable = document.getElementById("infinite-table");

    infiniteBody.innerHTML = "";
    if (infiniteRecords.length === 0) {
        noInfiniteMsg.classList.remove("d-none");
        infiniteTable.classList.add("d-none");
    } else {
        noInfiniteMsg.classList.add("d-none");
        infiniteTable.classList.remove("d-none");
        infiniteRecords.forEach((record, index) => {
            const tr = document.createElement("tr");
            let rankSymbol = index === 0 ? "🥇 Hạng 1" : index === 1 ? "🥈 Hạng 2" : index === 2 ? "🥉 Hạng 3" : `🏅 Hạng ${index + 1}`;
            tr.innerHTML = `
                <td class="text-info fw-bold">${rankSymbol}</td>
                <td class="text-white">Vô Hạn</td>
                <td class="text-warning fw-bold">${record.score}</td>
                <td class="small text-light-grey" style="color: #cbd5e1 !important;">${record.date}</td>
            `;
            infiniteBody.appendChild(tr);
        });
    }
}

// 1. KHỞI TẠO NỀN HẦM NGỤC
function generateDungeonDetails() {
    dungeonDetails = [];
    const colors = ["#23232f", "#1d1d26", "#2d2d3d", "#3a3a4a"];
    for (let i = 0; i < 400; i++) {
        dungeonDetails.push({
            x: Math.floor(Math.random() * (MAP_WIDTH / GRID_SIZE)) * GRID_SIZE,
            y: Math.floor(Math.random() * (MAP_HEIGHT / GRID_SIZE)) * GRID_SIZE,
            color: colors[Math.floor(Math.random() * colors.length)],
            type: Math.random() > 0.5 ? 'floor' : 'cracked'
        });
    }
}

// 1B. PHÁT SINH TƯỜNG BIÊN GỒ GHỀ KHỎM 1-2 BLOCK
function generateBorders() {
    borderWalls.clear();
    const cols = MAP_WIDTH / GRID_SIZE;
    const rows = MAP_HEIGHT / GRID_SIZE;
    for (let x = 0; x < cols; x++) {
        borderWalls.add(x + ',0');
        borderWalls.add(x + ',' + (rows - 1));
    }
    for (let y = 0; y < rows; y++) {
        borderWalls.add('0,' + y);
        borderWalls.add((cols - 1) + ',' + y);
    }
    const indentCount = 8;
    for (let i = 0; i < indentCount; i++) {
        const startX = Math.floor(Math.random() * (cols - 15) + 5);
        const length = Math.floor(Math.random() * 5 + 3);
        const depth = Math.random() > 0.5 ? 1 : 2;
        for (let x = startX; x < startX + length; x++) {
            for (let d = 1; d <= depth; d++) {
                borderWalls.add(x + ',' + d);
            }
        }
    }
    for (let i = 0; i < indentCount; i++) {
        const startX = Math.floor(Math.random() * (cols - 15) + 5);
        const length = Math.floor(Math.random() * 5 + 3);
        const depth = Math.random() > 0.5 ? 1 : 2;
        for (let x = startX; x < startX + length; x++) {
            for (let d = 1; d <= depth; d++) {
                borderWalls.add(x + ',' + (rows - 1 - d));
            }
        }
    }
    for (let i = 0; i < indentCount; i++) {
        const startY = Math.floor(Math.random() * (rows - 15) + 5);
        const length = Math.floor(Math.random() * 5 + 3);
        const depth = Math.random() > 0.5 ? 1 : 2;
        for (let y = startY; y < startY + length; y++) {
            for (let d = 1; d <= depth; d++) {
                borderWalls.add(d + ',' + y);
            }
        }
    }
    for (let i = 0; i < indentCount; i++) {
        const startY = Math.floor(Math.random() * (rows - 15) + 5);
        const length = Math.floor(Math.random() * 5 + 3);
        const depth = Math.random() > 0.5 ? 1 : 2;
        for (let y = startY; y < startY + length; y++) {
            for (let d = 1; d <= depth; d++) {
                borderWalls.add((cols - 1 - d) + ',' + y);
            }
        }
    }
}

// 1C. PHÁT SINH ĐÁ ĐA HÌNH THÙ CẢN ĐƯỜNG (TẦNG 2+)
function generateRocks() {
    rockWalls.clear();
    if (gameMode === "infinite") return;
    if (floor < 2) return;
    if (floor === 5) return; // Boss đầu tiên không có chướng ngại vật

    let rockCount;
    let maxRockSize = floor === 2 ? 5 : floor === 3 ? 8 : 10;

    if (floor % 5 === 0) {
        // Boss thứ 2 trở đi có nhiều chướng ngại vật hơn
        rockCount = Math.min(25, Math.floor(floor * 1.8));
    } else {
        rockCount = floor === 2 ? Math.floor(Math.random() * 2 + 2) : floor === 3 ? Math.floor(Math.random() * 3 + 3) : Math.min(18, Math.floor(floor * 1.2));
    }

    const cols = MAP_WIDTH / GRID_SIZE;
    const rows = MAP_HEIGHT / GRID_SIZE;
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);

    for (let r = 0; r < rockCount; r++) {
        const rockSize = Math.floor(Math.random() * maxRockSize + 1);
        let startGx = 0, startGy = 0, found = false;
        for (let attempts = 0; attempts < 100; attempts++) {
            startGx = Math.floor(Math.random() * (cols - 6) + 3);
            startGy = Math.floor(Math.random() * (rows - 6) + 3);
            if (Math.abs(startGx - centerX) <= 12 && Math.abs(startGy - centerY) <= 12) continue;
            const key = startGx + ',' + startGy;
            if (!borderWalls.has(key) && !rockWalls.has(key)) { found = true; break; }
        }
        if (!found) continue;
        let currentRockCells = [{ x: startGx, y: startGy }];
        rockWalls.set(startGx + ',' + startGy, true);

        for (let s = 1; s < rockSize; s++) {
            let neighbors = [];
            currentRockCells.forEach(cell => {
                const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
                dirs.forEach(d => {
                    const nx = cell.x + d.x; const ny = cell.y + d.y;
                    const nkey = nx + ',' + ny;
                    if (Math.abs(nx - centerX) <= 12 && Math.abs(ny - centerY) <= 12) return;
                    if (nx > 2 && nx < cols - 3 && ny > 2 && ny < rows - 3) {
                        if (!borderWalls.has(nkey) && !rockWalls.has(nkey)) neighbors.push({ x: nx, y: ny });
                    }
                });
            });
            if (neighbors.length === 0) break;
            const chosenN = neighbors[Math.floor(Math.random() * neighbors.length)];
            const nkey = chosenN.x + ',' + chosenN.y;
            if (!rockWalls.has(nkey)) {
                rockWalls.set(nkey, true);
                currentRockCells.push(chosenN);
            }
        }
    }
}

// 1D. PHÁT SINH DƠI VÀ NHỆN DI CHUYỂN 1-3 BLOCK (TẦNG 4+)
function generateMonsters() {
    monsters = [];
    if (gameMode === "infinite") return;
    if (floor % 5 === 0) return; // Boss floors do not have regular monsters
    if (floor < 4) return;
    let monsterCount = floor === 4 ? Math.floor(Math.random() * 2 + 1) : Math.min(12, Math.floor((floor - 4) * 1.5 + 2));
    const cols = MAP_WIDTH / GRID_SIZE;
    const rows = MAP_HEIGHT / GRID_SIZE;
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);

    for (let m = 0; m < monsterCount; m++) {
        let mx = 0, my = 0, found = false;
        for (let attempts = 0; attempts < 100; attempts++) {
            mx = Math.floor(Math.random() * (cols - 6) + 3);
            my = Math.floor(Math.random() * (rows - 6) + 3);
            if (Math.abs(mx - centerX) <= 12 && Math.abs(my - centerY) <= 12) continue;
            const key = mx + ',' + my;
            if (!borderWalls.has(key) && !rockWalls.has(key)) { found = true; break; }
        }
        if (!found) continue;
        const type = Math.random() > 0.5 ? 'bat' : 'spider';
        const rangePx = Math.floor(Math.random() * 3 + 1) * GRID_SIZE;
        const speed = 1.5 + Math.min(2.5, (floor - 4) * 0.2);
        monsters.push({
            x: mx * GRID_SIZE, y: my * GRID_SIZE,
            startX: mx * GRID_SIZE, startY: my * GRID_SIZE,
            rangePx: rangePx, speed: speed, dir: Math.random() > 0.5 ? 1 : -1, type: type
        });
    }
}

// 2. KHỞI TẠO MÀU SẮC RẮN
function getRandomSnakeColor() {
    const themes = ["#00ffcc", "#ff0055", "#ccff00", "#ff9900", "#9900ff", "#0099ff", "#ff00ff", "#33cc33"];
    return themes[Math.floor(Math.random() * themes.length)];
}

// 3. TẠO THỨC ĂN
function generateFood() {
    const cols = MAP_WIDTH / GRID_SIZE;
    const rows = MAP_HEIGHT / GRID_SIZE;
    const targetFoodCount = (floor % 5 === 0) ? 4 : foodSpawnCount;
    while (foods.length < targetFoodCount) {
        let fx = Math.floor(Math.random() * (cols - 4) + 2) * GRID_SIZE;
        let fy = Math.floor(Math.random() * (rows - 4) + 2) * GRID_SIZE;
        const key = (fx / GRID_SIZE) + ',' + (fy / GRID_SIZE);
        if (borderWalls.has(key) || rockWalls.has(key)) continue;
        if (foods.some(f => f.x === fx && f.y === fy)) continue;

        // Trái Tim Pha Lê có tỷ lệ xuất hiện mặc định 6%, nếu có bùa thì tăng lên 30%
        const crystalHeartChance = ownsCrystalHeart ? 0.30 : 0.06;
        let foodType;
        if (Math.random() < crystalHeartChance) {
            foodType = 'crystal_heart';
        } else {
            foodType = unlockedFoods[Math.floor(Math.random() * unlockedFoods.length)];
        }

        let emoji = "📦", subtype = "", scoreVal = 10, lengthVal = 1;

        if (foodType === 'gold_chest') {
            scoreVal = 10; lengthVal = 1; emoji = "📦";
        } else if (foodType === 'fruit') {
            const fruits = [{ emoji: "🍎", name: "Táo" }, { emoji: "🍌", name: "Chuối" }, { emoji: "🍇", name: "Nho" }, { emoji: "🍉", name: "Dưa" }];
            const f = fruits[Math.floor(Math.random() * fruits.length)];
            emoji = f.emoji; subtype = f.name; scoreVal = 5; lengthVal = 0;
        } else if (foodType === 'meat') {
            const meats = [{ emoji: "🍖", name: "Đùi Gà" }, { emoji: "🥩", name: "Bò Steak" }, { emoji: "🥓", name: "Ba Chỉ" }];
            const m = meats[Math.floor(Math.random() * meats.length)];
            emoji = m.emoji; subtype = m.name; scoreVal = 15; lengthVal = 2;
        } else if (foodType === 'crystal_heart') {
            emoji = "💖"; subtype = "Trái Tim Pha Lê"; scoreVal = 20; lengthVal = 0;
        }
        foods.push({ x: fx, y: fy, type: foodType, subtype: subtype, emoji: emoji, scoreVal: scoreVal, lengthVal: lengthVal });
    }
}

// 4. KHỞI ĐỘNG/RESET LƯỢT CHƠI MỚI
function initGame() {
    isDead = false; isSelectingBlessing = false; isPaused = false;
    score = 0; floor = 1; scoreForNextFloor = 50;
    ownedBlessings = [];

    if (gameMode === "infinite") {
        unlockedFoods = ['gold_chest', 'fruit', 'meat'];
        foodSpawnCount = 3;
    } else {
        unlockedFoods = ['gold_chest'];
        foodSpawnCount = 1;
    }

    isInvincible = false; invincibleTime = 0;
    dangerSensorRange = 2.5 * GRID_SIZE;
    bulletsCount = 0; maxBulletsPerFloor = 0; cameraScale = 1.0; ownsCrystalHeart = false;
    bullets = []; foods = [];

    scoreDisplay.innerText = score;

    if (gameMode === "infinite") {
        document.getElementById("game-title-display").innerText = "Đấu Trường Vô Hạn";
        document.getElementById("floor-label").innerText = "CHẾ ĐỘ:";
        floorDisplay.innerText = "Vô Hạn";
        statusDisplay.innerText = "Đang quyết chiến ở Đấu Trường Vô Hạn";
    } else {
        document.getElementById("game-title-display").innerText = "Mạo Hiểm Hầm Ngục";
        document.getElementById("floor-label").innerText = "TẦNG:";
        floorDisplay.innerText = floor;
        statusDisplay.innerText = "Đang thám hiểm Tầng 1";
    }

    statusDisplay.className = "text-light";
    gameOverScreen.classList.add("d-none");
    snakeColor = getRandomSnakeColor();
    generateDungeonDetails();
    startNextFloor();
}

function startNextFloor() {
    direction = { x: 0, y: 0 };
    nextDirection = { x: 0, y: 0 };
    scoreDisplay.innerText = score;

    if (gameMode === "infinite") {
        floorDisplay.innerText = "Vô Hạn";
        statusDisplay.innerText = "Đang quyết chiến ở Đấu Trường Vô Hạn";
    } else {
        floorDisplay.innerText = floor;
        statusDisplay.innerText = `Đang thám hiểm Tầng ${floor}`;
    }

    statusDisplay.className = "text-light";
    gameOverScreen.classList.add("d-none");

    const startX = Math.floor((MAP_WIDTH / GRID_SIZE) / 2) * GRID_SIZE;
    const startY = Math.floor((MAP_HEIGHT / GRID_SIZE) / 2) * GRID_SIZE;
    snake = [{ x: startX, y: startY }, { x: startX - GRID_SIZE, y: startY }, { x: startX - (GRID_SIZE * 2), y: startY }];

    if (ownsCrystalHeart) { isInvincible = true; invincibleTime = 30; }
    bullets = [];
    bulletsCount = maxBulletsPerFloor;

    // Khởi tạo Boss nếu là tầng bội số của 5 (Tầng 5, 10, 15,...)
    if (gameMode !== "infinite" && floor % 5 === 0) {
        const bossCount = floor / 5;
        scoreForNextFloor = score + (70 + bossCount * 30);

        bossSnake = [];
        const bossHeadX = 2 * GRID_SIZE;
        const bossHeadY = 2 * GRID_SIZE;
        for (let i = 0; i < 15; i++) {
            bossSnake.push({ x: bossHeadX, y: bossHeadY });
        }
        bossMoveCounter = 0;
    } else {
        bossSnake = [];
    }

    generateBorders();
    generateRocks();
    generateMonsters();
    foods = [];
    generateFood();
}

// 5. BẮT SỰ KIỆN ĐIỀU KHIỂN & BẮN ĐẠN F/SHIFT & TẠM DỪNG SPACE
window.addEventListener("keydown", (e) => {
    // Thu thập mã cheat phím: Lên Lên Xuống Xuống Trái Phải Trái Phải (chỉ khi tạm dừng)
    if (isPaused) {
        let inputToken = null;
        if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") inputToken = 'U';
        else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") inputToken = 'D';
        else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") inputToken = 'L';
        else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") inputToken = 'R';

        if (inputToken) {
            e.preventDefault();
            cheatCodeSequence.push(inputToken);
            if (cheatCodeSequence.length > 8) {
                cheatCodeSequence.shift();
            }
            if (cheatCodeSequence.join("") === "UUDDLRLR") {
                // Đóng modal tạm dừng
                const modalEl = document.getElementById("pauseModal");
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                // Nhận đủ điểm qua màn, đặt lại sequence và unpause
                score = scoreForNextFloor;
                scoreDisplay.innerText = score;
                cheatCodeSequence = [];
                isPaused = false;

                // Tiến lên tầng tiếp theo và hiển thị chọn bùa lợi
                floor++;
                isSelectingBlessing = true;
                SoundManager.playNextFloor();
                showBlessingSelection();
            }
        }
    }

    if (inLobby || isDead || isSelectingBlessing) return;

    // Phím Space để Tạm dừng / Tiếp tục nhanh
    if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (isPaused) {
            const modalEl = document.getElementById("pauseModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
            } else {
                isPaused = false;
            }
        } else {
            const pauseBtnFloating = document.getElementById("pause-btn-floating");
            if (pauseBtnFloating) pauseBtnFloating.click();
        }
        return;
    }

    if (isPaused) return;

    // Phím F hoặc Shift để bắn hỏa cầu phá đá
    if (e.key.toLowerCase() === "f" || e.key === "Shift") {
        e.preventDefault();
        if (bulletsCount > 0) {
            let shootDir = { ...direction };
            // Nếu rắn đang đứng yên ở đầu tầng, bắn theo hướng mặc định (Phải)
            if (shootDir.x === 0 && shootDir.y === 0) {
                shootDir = { x: 1, y: 0 };
            }
            bulletsCount--;
            // Đạn xuất phát dịch trước đầu rắn một chút để bay mượt và không tự chạm đầu rắn
            const spawnX = snake[0].x + GRID_SIZE / 2 + shootDir.x * GRID_SIZE;
            const spawnY = snake[0].y + GRID_SIZE / 2 + shootDir.y * GRID_SIZE;
            // Tốc độ bay của hỏa cầu nhanh hơn hẳn tốc độ di chuyển của rắn
            bullets.push({ x: spawnX, y: spawnY, dx: shootDir.x * 35, dy: shootDir.y * 35 });
            SoundManager.playShoot();
        }
        return;
    }

    switch (e.key.toLowerCase()) {
        case "arrowup": case "w": if (direction.y === 0) nextDirection = { x: 0, y: -1 }; break;
        case "arrowdown": case "s": if (direction.y === 0) nextDirection = { x: 0, y: 1 }; break;
        case "arrowleft": case "a": if (direction.x === 0) nextDirection = { x: -1, y: 0 }; break;
        case "arrowright": case "d": if (direction.x === 0) nextDirection = { x: 1, y: 0 }; break;
    }
});

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];

        // Thực hiện di chuyển và kiểm tra va chạm theo từng bước nhỏ (sub-steps) để tránh lọt lưới
        const steps = 2;
        const stepX = b.dx / steps;
        const stepY = b.dy / steps;
        let destroyed = false;

        for (let s = 0; s < steps; s++) {
            b.x += stepX;
            b.y += stepY;
            const key = Math.floor(b.x / GRID_SIZE) + ',' + Math.floor(b.y / GRID_SIZE);

            // 1. Va chạm với chướng ngại vật đá
            if (rockWalls.has(key)) {
                rockWalls.delete(key);
                bullets.splice(i, 1);
                SoundManager.playBreak();
                destroyed = true;
                break;
            }

            // 2. Va chạm với quái vật (dơi và nhện)
            let hitMonster = false;
            for (let j = monsters.length - 1; j >= 0; j--) {
                const m = monsters[j];
                const dist = Math.hypot(b.x - (m.x + GRID_SIZE / 2), b.y - (m.y + GRID_SIZE / 2));
                if (dist < 34) {
                    monsters.splice(j, 1);
                    bullets.splice(i, 1);
                    SoundManager.playBreak();
                    hitMonster = true;
                    destroyed = true;
                    break;
                }
            }
            if (destroyed) break;

            // 3. Va chạm với Boss (bị triệt tiêu hỏa cầu nhưng Boss vô sự)
            let hitBoss = false;
            if (floor % 5 === 0 && bossSnake && bossSnake.length > 0) {
                for (let segment of bossSnake) {
                    const dist = Math.hypot(b.x - (segment.x + GRID_SIZE / 2), b.y - (segment.y + GRID_SIZE / 2));
                    if (dist < 26) {
                        bullets.splice(i, 1);
                        hitBoss = true;
                        destroyed = true;
                        break;
                    }
                }
            }
            if (destroyed) break;

            // 4. Va chạm với tường biên hoặc biên giới hạn map
            if (borderWalls.has(key) || b.x < 0 || b.x >= MAP_WIDTH || b.y < 0 || b.y >= MAP_HEIGHT) {
                bullets.splice(i, 1);
                destroyed = true;
                break;
            }
        }
        if (destroyed) continue;
    }
}

function updateMonsters() {
    monsters.forEach(m => {
        if (m.type === 'bat') {
            m.y += m.speed * m.dir;
            if (m.y > m.startY + m.rangePx || m.y < m.startY) { m.dir = -m.dir; m.y = Math.max(m.startY, Math.min(m.startY + m.rangePx, m.y)); }
        } else if (m.type === 'spider') {
            m.x += m.speed * m.dir;
            if (m.x > m.startX + m.rangePx || m.x < m.startX) { m.dir = -m.dir; m.x = Math.max(m.startX, Math.min(m.startX + m.rangePx, m.x)); }
        }
        const dist = Math.hypot((m.x + GRID_SIZE / 2) - (snake[0].x + GRID_SIZE / 2), (m.y + GRID_SIZE / 2) - (snake[0].y + GRID_SIZE / 2));
        if (dist < 34 && !isInvincible) endGame();
    });
}

function updateBoss() {
    if (isDead || isSelectingBlessing || isPaused) return;

    bossMoveCounter++;
    // Boss di chuyển bằng 50% tốc độ người chơi để vừa kịch tính vừa có thể né được
    if (bossMoveCounter % 2 !== 0) return;

    const head = snake[0];
    const bossHead = bossSnake[0];

    let dx = head.x - bossHead.x;
    let dy = head.y - bossHead.y;

    let moveX = 0;
    let moveY = 0;

    // Lựa chọn di chuyển theo trục khoảng cách xa hơn
    if (Math.abs(dx) > Math.abs(dy)) {
        moveX = Math.sign(dx) * GRID_SIZE;
    } else {
        moveY = Math.sign(dy) * GRID_SIZE;
    }

    // Ngăn chặn Boss quay đầu 180 độ
    if (bossSnake.length > 1) {
        const second = bossSnake[1];
        if (bossHead.x + moveX === second.x && bossHead.y + moveY === second.y) {
            if (moveX !== 0) {
                moveX = 0;
                moveY = dy !== 0 ? Math.sign(dy) * GRID_SIZE : (Math.random() > 0.5 ? GRID_SIZE : -GRID_SIZE);
            } else {
                moveY = 0;
                moveX = dx !== 0 ? Math.sign(dx) * GRID_SIZE : (Math.random() > 0.5 ? GRID_SIZE : -GRID_SIZE);
            }
        }
    }

    let newHead = { x: bossHead.x + moveX, y: bossHead.y + moveY };

    // Giữ Boss nằm trong giới hạn tường biên
    const cols = MAP_WIDTH / GRID_SIZE;
    const rows = MAP_HEIGHT / GRID_SIZE;
    if (newHead.x < GRID_SIZE) newHead.x = GRID_SIZE;
    if (newHead.x >= (cols - 1) * GRID_SIZE) newHead.x = (cols - 2) * GRID_SIZE;
    if (newHead.y < GRID_SIZE) newHead.y = GRID_SIZE;
    if (newHead.y >= (rows - 1) * GRID_SIZE) newHead.y = (rows - 2) * GRID_SIZE;

    bossSnake.unshift(newHead);
    bossSnake.pop();
}

// 6. THUẬT TOÁN LOGIC CẬP NHẬT TRẠNG THÁI CHÍNH
function update() {
    if (inLobby || isDead || isSelectingBlessing || isPaused) return;
    updateBullets();
    updateMonsters();

    if (gameMode !== "infinite" && floor % 5 === 0) {
        updateBoss();
    }

    if (isInvincible) {
        invincibleTime -= 0.1;
        if (invincibleTime <= 0) { isInvincible = false; invincibleTime = 0; }
    }

    const bulletDisplay = document.getElementById("bullet-display");
    const invincibleDisplay = document.getElementById("invincible-display");
    const invincibleTimer = document.getElementById("invincible-timer");
    const hudSubRow = document.getElementById("hud-sub-row");

    if (bulletsCount > 0 || isInvincible) {
        hudSubRow.classList.remove("d-none");
        bulletDisplay.innerText = bulletsCount;
        if (isInvincible) {
            invincibleDisplay.classList.remove("d-none");
            invincibleTimer.innerText = Math.ceil(invincibleTime);
        } else { invincibleDisplay.classList.add("d-none"); }
    } else { hudSubRow.classList.add("d-none"); }

    if (direction.x === 0 && direction.y === 0) {
        if (nextDirection.x !== 0 || nextDirection.y !== 0) { direction = nextDirection; } else { return; }
    }
    direction = nextDirection;

    const head = { x: snake[0].x + direction.x * GRID_SIZE, y: snake[0].y + direction.y * GRID_SIZE };
    const headKey = Math.floor(head.x / GRID_SIZE) + ',' + Math.floor(head.y / GRID_SIZE);

    if (head.x < 0 || head.x >= MAP_WIDTH || head.y < 0 || head.y >= MAP_HEIGHT || borderWalls.has(headKey) || rockWalls.has(headKey)) {
        endGame(); return;
    }
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y && !isInvincible) { endGame(); return; }
    }

    // Kiểm tra va chạm với Boss
    if (gameMode !== "infinite" && floor % 5 === 0 && bossSnake.length > 0) {
        // Đầu người chơi chạm vào thân/đầu Boss
        for (let i = 0; i < bossSnake.length; i++) {
            const bSeg = bossSnake[i];
            const dist = Math.hypot((head.x + GRID_SIZE / 2) - (bSeg.x + GRID_SIZE / 2), (head.y + GRID_SIZE / 2) - (bSeg.y + GRID_SIZE / 2));
            if (dist < 30) { endGame(); return; }
        }
        // Đầu Boss chạm vào thân người chơi
        const bossHead = bossSnake[0];
        for (let i = 0; i < snake.length; i++) {
            const pSeg = snake[i];
            const dist = Math.hypot((bossHead.x + GRID_SIZE / 2) - (pSeg.x + GRID_SIZE / 2), (bossHead.y + GRID_SIZE / 2) - (pSeg.y + GRID_SIZE / 2));
            if (dist < 30) { endGame(); return; }
        }
    }

    snake.unshift(head);
    snake.pop();

    let eatenIndex = foods.findIndex(f => head.x === f.x && head.y === f.y);
    if (eatenIndex !== -1) {
        const eatenFood = foods[eatenIndex];
        score += eatenFood.scoreVal;
        scoreDisplay.innerText = score;
        foods.splice(eatenIndex, 1);
        generateFood();
        SoundManager.playEat();

        // Kích hoạt bất tử 30s khi ăn Trái Tim Pha Lê
        if (eatenFood.type === 'crystal_heart') {
            isInvincible = true;
            invincibleTime = 30;
        }

        if (eatenFood.lengthVal > 0) {
            for (let l = 0; l < eatenFood.lengthVal; l++) {
                const tail = snake[snake.length - 1] || head;
                snake.push({ x: tail.x, y: tail.y });
            }
        }
        if (gameMode !== "infinite" && score >= scoreForNextFloor) {
            floor++;
            isSelectingBlessing = true;
            SoundManager.playNextFloor();
            showBlessingSelection();
        }
    }
}

// 7. XỬ LÝ GAME OVER
function endGame() {
    isDead = true;
    statusDisplay.innerText = "Đã hy sinh";
    statusDisplay.className = "text-danger fw-bold";

    // Đổi mô tả tử trận linh hoạt theo chế độ chơi
    const gameOverDesc = document.querySelector("#game-over-screen p");
    if (gameOverDesc) {
        if (gameMode === "infinite") {
            gameOverDesc.innerText = "Huyền thoại của bạn tại Đấu Trường Vô Hạn đã khép lại...";
        } else {
            gameOverDesc.innerText = "Thân xác bạn đã hóa đá xám xịt giữa hầm ngục sâu thẳm...";
        }
    }

    gameOverScreen.classList.remove("d-none");
    SoundManager.playDead();
    saveRecord(floor, score, gameMode);
}

// HIỂN THỊ MODAL CHỌN BÙA LỢI
function showBlessingSelection() {
    const blessings = [
        { id: "fruit_buff", emoji: "🍎", name: "Trái Cây Thần Bí", desc: "Mở khóa Trái Cây (+5 điểm, không dài rắn)." },
        { id: "meat_buff", emoji: "🍖", name: "Thịt Thú Hầm Ngục", desc: "Mở khóa Thịt (+15 điểm, tăng thêm 2 đốt rắn)." },
        { id: "crystal_heart", emoji: "💖", name: "Trái Tim Pha Lê", desc: "Bất tử hộ thể trong 30s đầu mỗi tầng.", condition: () => floor >= 3 },
        { id: "plentiful_bait", emoji: "🍯", name: "Mồi Nhử Sung Túc", desc: "Sinh 3 loại mồi cùng lúc trên bản đồ." },
        { id: "danger_sensor", emoji: "⚠️", name: "Mắt Thần Cảnh Báo", desc: "Hiển thị mũi tên đỏ khi gần đá hoặc tường biên." },
        { id: "rock_breaker", emoji: "☄️", name: "Hỏa Cầu Phá Đá", desc: "Nhận 1 hỏa cầu, bấm F hoặc Shift để bắn phá đá cản đường." },
        { id: "ancient_telescope", emoji: "👁️", name: "Kính Viễn Vọng Cổ Đại", desc: "Thu nhỏ camera nhìn rộng và tăng tầm phát sáng." }
    ];

    // Giới hạn số lần chọn tối đa cho mỗi loại bùa lợi
    const BLESSING_LIMITS = {
        fruit_buff: 3,
        meat_buff: 3,
        crystal_heart: 1,
        plentiful_bait: 3,
        danger_sensor: 4,
        rock_breaker: 4,
        ancient_telescope: 3
    };

    // Lọc các bùa lợi khả dụng và chưa đạt giới hạn tối đa
    const candidates = blessings.filter(b => {
        if (b.condition && !b.condition()) return false;
        const limit = BLESSING_LIMITS[b.id] || 99;
        const ownedCount = ownedBlessings.filter(ob => ob.id === b.id).length;
        return ownedCount < limit;
    });

    if (candidates.length === 0) {
        // Tự động cộng 15 điểm thưởng vì không còn bùa lợi nào để chọn/nâng cấp
        score += 15;
        scoreDisplay.innerText = score;

        isSelectingBlessing = false;
        scoreForNextFloor = floor * 50;
        startNextFloor();

        // Cập nhật dòng trạng thái trên HUD để người chơi biết
        statusDisplay.innerText = "🎁 +15 Điểm (Đã nâng cấp tối đa!)";
        statusDisplay.className = "text-warning fw-bold";
        return;
    }

    const chosen = [];
    const candidatesCopy = [...candidates];
    while (chosen.length < 3 && candidatesCopy.length > 0) {
        chosen.push(candidatesCopy.splice(Math.floor(Math.random() * candidatesCopy.length), 1)[0]);
    }

    const container = document.getElementById("blessing-options-container");
    container.innerHTML = "";
    chosen.forEach(b => {
        const col = document.createElement("div");
        col.className = "col-md-4";
        col.innerHTML = `
            <div class="card blessing-card h-100 p-3 d-flex flex-column align-items-center justify-content-between text-center text-light">
                <div class="fs-1 my-2">${b.emoji}</div>
                <h5 class="text-warning fw-bold mb-2">${b.name}</h5>
                <p class="small mb-3" style="font-size: 0.82rem; color: #e2e8f0 !important;">${b.desc}</p>
                <button class="btn btn-outline-warning btn-sm w-100 mt-auto fw-bold py-1">CHỌN BÙA</button>
            </div>
        `;
        col.querySelector(".card").addEventListener("click", () => {
            applyBlessing(b);
            const modal = bootstrap.Modal.getInstance(document.getElementById("blessingModal"));
            if (modal) modal.hide();
        });
        container.appendChild(col);
    });
    new bootstrap.Modal(document.getElementById("blessingModal")).show();
}

function applyBlessing(b) {
    ownedBlessings.push(b);
    if (b.id === "fruit_buff") {
        if (!unlockedFoods.includes("fruit")) {
            unlockedFoods.push("fruit");
        } else {
            foodSpawnCount += 1;
        }
    }
    else if (b.id === "meat_buff") {
        if (!unlockedFoods.includes("meat")) {
            unlockedFoods.push("meat");
        } else {
            foodSpawnCount += 1;
        }
    }
    else if (b.id === "crystal_heart") {
        ownsCrystalHeart = true;
        isInvincible = true;
        invincibleTime = 30;
    }
    else if (b.id === "plentiful_bait") {
        if (foodSpawnCount === 1) foodSpawnCount = 3;
        else foodSpawnCount += 1;
    }
    else if (b.id === "danger_sensor") {
        dangerSensorRange += 3 * GRID_SIZE;
    }
    else if (b.id === "rock_breaker") {
        maxBulletsPerFloor += 1;
    }
    else if (b.id === "ancient_telescope") {
        // Tác dụng mở rộng tầm nhìn được xử lý trực tiếp trong draw() dựa trên ownedBlessings
    }

    scoreForNextFloor = floor * 50;
    startNextFloor();
    isSelectingBlessing = false;
}

// 8. HÀM VẼ (RENDER) TOÀN BỘ GAME
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (inLobby) {
        ctx.fillStyle = "#111116"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(0, 255, 204, 0.03)"; ctx.lineWidth = 1.5;
        let time = Date.now() * 0.015; let offset = time % GRID_SIZE;
        for (let x = offset; x < canvas.width; x += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
        for (let y = offset; y < canvas.height; y += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
        ctx.fillStyle = "rgba(0, 255, 204, 0.05)";
        for (let i = 0; i < 5; i++) {
            let cx = (Math.sin(time * 0.04 + i) * 0.4 + 0.5) * canvas.width;
            let cy = (Math.cos(time * 0.02 + i * 2) * 0.4 + 0.5) * canvas.height;
            ctx.beginPath(); ctx.arc(cx, cy, 25 + i * 8, 0, Math.PI * 2); ctx.fill();
        }
        return;
    }

    const head = snake[0] || { x: 0, y: 0 };
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(cameraScale, cameraScale);
    ctx.translate(-head.x - GRID_SIZE / 2, -head.y - GRID_SIZE / 2);

    ctx.fillStyle = "#16161e";
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    dungeonDetails.forEach(detail => {
        const key = Math.floor(detail.x / GRID_SIZE) + ',' + Math.floor(detail.y / GRID_SIZE);
        if (borderWalls.has(key) || rockWalls.has(key)) return;
        ctx.fillStyle = detail.color;
        if (detail.type === 'floor') { ctx.fillRect(detail.x + 2, detail.y + 2, GRID_SIZE - 4, GRID_SIZE - 4); }
        else {
            ctx.strokeStyle = "#2e2e3e"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(detail.x + 5, detail.y + 5); ctx.lineTo(detail.x + GRID_SIZE - 5, detail.y + GRID_SIZE - 5); ctx.stroke();
        }
    });

    borderWalls.forEach(key => {
        const [xStr, yStr] = key.split(',');
        const px = parseInt(xStr) * GRID_SIZE; const py = parseInt(yStr) * GRID_SIZE;
        ctx.fillStyle = "#2c3e50"; ctx.strokeStyle = "#34495e"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2, 4); ctx.fill(); ctx.stroke();
    });

    rockWalls.forEach((val, key) => {
        const [xStr, yStr] = key.split(',');
        const px = parseInt(xStr) * GRID_SIZE; const py = parseInt(yStr) * GRID_SIZE;
        ctx.fillStyle = "#7f8c8d"; ctx.strokeStyle = "#95a5a6"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2, 6); ctx.fill(); ctx.stroke();
    });

    foods.forEach(foodItem => {
        // Hiệu ứng phát sáng nhẹ xung quanh thức ăn
        ctx.save();
        let glowColor = "rgba(255, 255, 255, 0.15)";
        if (foodItem.type === 'gold_chest') glowColor = "rgba(255, 215, 0, 0.3)";
        else if (foodItem.type === 'fruit') glowColor = "rgba(46, 204, 113, 0.3)";
        else if (foodItem.type === 'meat') glowColor = "rgba(231, 76, 60, 0.3)";
        else if (foodItem.type === 'crystal_heart') glowColor = "rgba(255, 0, 128, 0.4)";

        ctx.shadowBlur = 15;
        ctx.shadowColor = glowColor.replace("0.15", "1").replace("0.3", "1").replace("0.4", "1");
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(foodItem.x + GRID_SIZE / 2, foodItem.y + GRID_SIZE / 2, GRID_SIZE * 0.75, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (foodItem.type === 'gold_chest') {
            ctx.fillStyle = "#b37400"; ctx.fillRect(foodItem.x + 4, foodItem.y + 8, GRID_SIZE - 8, GRID_SIZE - 12);
            ctx.fillStyle = "#ffd700"; ctx.fillRect(foodItem.x + 4, foodItem.y + 2, GRID_SIZE - 8, 6);
            ctx.fillStyle = "#000000"; ctx.fillRect(foodItem.x + (GRID_SIZE / 2) - 3, foodItem.y + 8, 6, 4);
        } else {
            ctx.fillStyle = "#ffffff"; ctx.font = "26px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(foodItem.emoji, foodItem.x + GRID_SIZE / 2, foodItem.y + GRID_SIZE / 2);
        }
    });

    monsters.forEach(m => {
        ctx.fillStyle = m.type === 'bat' ? "#9b59b6" : "#e74c3c";
        ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle;

        const cx = m.x + GRID_SIZE / 2;
        const cy = m.y + GRID_SIZE / 2;

        if (m.type === 'bat') {
            // Vẽ thân dơi (Phình to hơn)
            ctx.beginPath();
            ctx.arc(cx, cy + 3, 11, 0, Math.PI * 2);
            ctx.fill();

            // Vẽ cánh dơi và tai dơi
            ctx.beginPath();
            const flap = Math.sin(Date.now() * 0.015);

            // Cánh trái (to hơn)
            ctx.moveTo(cx, cy);
            ctx.quadraticCurveTo(cx - 16, cy - 19 + flap * 9, cx - 32, cy - 6 + flap * 6);
            ctx.lineTo(cx - 19, cy + 6);
            ctx.quadraticCurveTo(cx - 9, cy + 3, cx, cy);

            // Cánh phải (to hơn)
            ctx.moveTo(cx, cy);
            ctx.quadraticCurveTo(cx + 16, cy - 19 + flap * 9, cx + 32, cy - 6 + flap * 6);
            ctx.lineTo(cx + 19, cy + 6);
            ctx.quadraticCurveTo(cx + 9, cy + 3, cx, cy);

            // Tai trái
            ctx.moveTo(cx - 5, cy - 9);
            ctx.lineTo(cx - 9, cy - 22);
            ctx.lineTo(cx - 2, cy - 11);

            // Tai phải
            ctx.moveTo(cx + 5, cy - 9);
            ctx.lineTo(cx + 9, cy - 22);
            ctx.lineTo(cx + 2, cy - 11);
            ctx.fill();

            // Vẽ mắt dơi nhỏ màu đỏ
            ctx.fillStyle = "#ff0000";
            ctx.fillRect(cx - 5, cy - 2, 3, 3);
            ctx.fillRect(cx + 2, cy - 2, 3, 3);
        } else {
            const wiggle = Math.sin(Date.now() * 0.015);

            // Vẽ chân nhện (8 chân) (Lớn và dày hơn)
            ctx.strokeStyle = "#e74c3c";
            ctx.lineWidth = 4.0;
            ctx.beginPath();

            // Chân bên trái
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx - 19, cy - 19 + wiggle * 4.8);
            ctx.lineTo(cx - 29, cy - 10 + wiggle * 4.8);

            ctx.moveTo(cx, cy);
            ctx.lineTo(cx - 22, cy - 6 + wiggle * 3.2);
            ctx.lineTo(cx - 32, cy + 3 + wiggle * 3.2);

            ctx.moveTo(cx, cy);
            ctx.lineTo(cx - 22, cy + 6 - wiggle * 3.2);
            ctx.lineTo(cx - 32, cy + 16 - wiggle * 3.2);

            ctx.moveTo(cx, cy);
            ctx.lineTo(cx - 19, cy + 19 - wiggle * 4.8);
            ctx.lineTo(cx - 26, cy + 29 - wiggle * 4.8);

            // Chân bên phải
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + 19, cy - 19 - wiggle * 4.8);
            ctx.lineTo(cx + 29, cy - 10 - wiggle * 4.8);

            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + 22, cy - 6 - wiggle * 3.2);
            ctx.lineTo(cx + 32, cy + 3 - wiggle * 3.2);

            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + 22, cy + 6 + wiggle * 3.2);
            ctx.lineTo(cx + 32, cy + 16 + wiggle * 3.2);

            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + 19, cy + 19 + wiggle * 4.8);
            ctx.lineTo(cx + 26, cy + 29 + wiggle * 4.8);
            ctx.stroke();

            // Thân nhện (to hơn)
            ctx.beginPath();
            ctx.fillStyle = "#e74c3c";
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fill();

            // Đầu nhện
            ctx.beginPath();
            ctx.arc(cx, cy - 13, 8, 0, Math.PI * 2);
            ctx.fill();

            // Mắt nhện
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(cx - 3, cy - 16, 2.4, 2.4);
            ctx.fillRect(cx + 1, cy - 16, 2.4, 2.4);
            ctx.fillRect(cx - 5, cy - 13, 1.6, 1.6);
            ctx.fillRect(cx + 3, cy - 13, 1.6, 1.6);
        }
        ctx.shadowBlur = 0;
    });

    bullets.forEach(b => {
        ctx.fillStyle = "#ffcc00"; ctx.shadowBlur = 10; ctx.shadowColor = "#ffcc00";
        ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    });

    // Vẽ Boss Rắn nếu ở tầng Boss
    if (gameMode !== "infinite" && floor % 5 === 0 && bossSnake.length > 0) {
        bossSnake.forEach((block, index) => {
            // Boss màu đỏ thẫm/cam neon chuyển sắc, mắt vàng đáng sợ
            let segmentColor = index === 0 ? "#ff003c" : `hsl(${(340 + index * 4) % 360}, 100%, 50%)`;
            ctx.fillStyle = segmentColor;
            ctx.shadowBlur = index === 0 ? 25 : 12;
            ctx.shadowColor = segmentColor;
            ctx.beginPath();
            // Vẽ to hơn Rắn thường một chút (GRID_SIZE - 2)
            ctx.roundRect(block.x + 1, block.y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 8);
            ctx.fill();
            ctx.shadowBlur = 0;

            if (index === 0) {
                // Vẽ mắt vàng neon phát sáng dữ tợn
                ctx.fillStyle = "#ffeb3b";
                ctx.fillRect(block.x + 8, block.y + 8, 8, 8);
                ctx.fillRect(block.x + GRID_SIZE - 16, block.y + 8, 8, 8);
                ctx.fillStyle = "#000000";
                ctx.fillRect(block.x + 11, block.y + 11, 3, 3);
                ctx.fillRect(block.x + GRID_SIZE - 13, block.y + 11, 3, 3);
            }
        });

        // Vẽ mũi tên cảnh báo vị trí của Boss từ đầu player
        if (!isDead) {
            const bHead = bossSnake[0];
            const angle = Math.atan2(bHead.y - head.y, bHead.x - head.x);
            const arrowX = head.x + GRID_SIZE / 2 + Math.cos(angle) * 85;
            const arrowY = head.y + GRID_SIZE / 2 + Math.sin(angle) * 85;
            ctx.save(); ctx.translate(arrowX, arrowY); ctx.rotate(angle);
            ctx.shadowBlur = 15; ctx.shadowColor = "#ff0055"; ctx.fillStyle = "#ff0055";
            // Mũi tên Boss to hơn, nguy hiểm hơn
            ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-4, 0); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    }

    snake.forEach((block, index) => {
        let blockColor;
        if (isDead) {
            blockColor = index === 0 ? "#7a7a7a" : "#a3a3a3";
        } else if (isInvincible) {
            // Đổi màu cầu vồng liên tục khi bất tử
            blockColor = `hsl(${(Date.now() / 2.5 + index * 22) % 360}, 100%, 60%)`;
        } else {
            blockColor = index === 0 ? "#ffffff" : snakeColor;
        }
        ctx.fillStyle = blockColor;
        if (isInvincible) { ctx.shadowBlur = 16; ctx.shadowColor = blockColor; }
        ctx.beginPath(); ctx.roundRect(block.x + 2, block.y + 2, GRID_SIZE - 4, GRID_SIZE - 4, 6); ctx.fill(); ctx.shadowBlur = 0;

        if (index === 0) {
            ctx.fillStyle = "#000000";
            ctx.fillRect(block.x + 10, block.y + 10, 6, 6); ctx.fillRect(block.x + GRID_SIZE - 16, block.y + 10, 6, 6);
        }
    });

    ctx.restore();

    // Chỉ bị tối nếu không ở trạng thái bất tử (Trái Tim Pha Lê)
    if (!isInvincible) {
        let viewRadius = 320;
        const telescopeCount = ownedBlessings.filter(b => b.id === "ancient_telescope").length;
        if (telescopeCount > 0) {
            viewRadius = 460 + (telescopeCount - 1) * 60;
        }
        const grad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, viewRadius * 0.3,
            canvas.width / 2, canvas.height / 2, viewRadius
        );
        grad.addColorStop(0, "rgba(0, 0, 0, 0)");
        grad.addColorStop(0.7, "rgba(0, 0, 0, 0.75)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0.98)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Vẽ các mũi tên chỉ đường và cảnh báo lên trên lớp tối ở hệ tọa độ màn hình
    if (!isDead && !isSelectingBlessing && (direction.x !== 0 || direction.y !== 0)) {
        // 1. Mũi tên chỉ hướng thức ăn (Màu xanh lá)
        foods.forEach(foodItem => {
            const angle = Math.atan2(foodItem.y - (head.y + GRID_SIZE / 2), foodItem.x - (head.x + GRID_SIZE / 2));
            const arrowX = canvas.width / 2 + Math.cos(angle) * 65;
            const arrowY = canvas.height / 2 + Math.sin(angle) * 65;
            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.rotate(angle);
            ctx.shadowBlur = 8; ctx.shadowColor = "#00ff66"; ctx.fillStyle = "#00ff66";
            ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-4, -5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
            ctx.restore();
        });

        // 2. Mũi tên cảnh báo va chạm chướng ngại vật & Quái vật (Màu đỏ)
        if (dangerSensorRange > 0) {
            let closestHazard = null, minDistance = Infinity;
            const headX = head.x + GRID_SIZE / 2, headY = head.y + GRID_SIZE / 2;
            const checkRadius = Math.ceil(dangerSensorRange / GRID_SIZE);
            const headGx = Math.floor(head.x / GRID_SIZE), headGy = Math.floor(head.y / GRID_SIZE);

            // Kiểm tra tường biên và đá chướng ngại vật gần đó
            for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                for (let dy = -checkRadius; dy <= checkRadius; dy++) {
                    const key = (headGx + dx) + ',' + (headGy + dy);
                    if (borderWalls.has(key) || rockWalls.has(key)) {
                        const wx = (headGx + dx) * GRID_SIZE + GRID_SIZE / 2;
                        const wy = (headGy + dy) * GRID_SIZE + GRID_SIZE / 2;
                        const dist = Math.hypot(wx - headX, wy - headY);
                        if (dist < minDistance && dist <= dangerSensorRange) {
                            minDistance = dist;
                            closestHazard = { x: wx, y: wy };
                        }
                    }
                }
            }

            // Kiểm tra quái vật (dơi, nhện) gần đó
            monsters.forEach(m => {
                const mx = m.x + GRID_SIZE / 2;
                const my = m.y + GRID_SIZE / 2;
                const dist = Math.hypot(mx - headX, my - headY);
                if (dist < minDistance && dist <= dangerSensorRange) {
                    minDistance = dist;
                    closestHazard = { x: mx, y: my };
                }
            });

            if (closestHazard) {
                const angle = Math.atan2(closestHazard.y - headY, closestHazard.x - headX);
                const arrowX = canvas.width / 2 + Math.cos(angle) * 55;
                const arrowY = canvas.height / 2 + Math.sin(angle) * 55;
                ctx.save();
                ctx.translate(arrowX, arrowY);
                ctx.rotate(angle);
                ctx.shadowBlur = 10; ctx.shadowColor = "#ff0000"; ctx.fillStyle = "#ff0000";
                ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-4, -6); ctx.lineTo(-2, 0); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill();
                ctx.restore();
            }
        }
    }

    if (direction.x === 0 && direction.y === 0) {
        // Hộp thông báo bắt đầu của mỗi tầng
        ctx.fillStyle = "rgba(10, 10, 16, 0.75)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const boxWidth = 540;
        const boxHeight = 160;
        const boxX = (canvas.width - boxWidth) / 2;
        const boxY = (canvas.height - boxHeight) / 2 - 40;

        ctx.fillStyle = "#0c0c14";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = "#ffc107";
        ctx.lineWidth = 4;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        let title = "";
        let line1 = "";
        let line2 = "";
        let color = "#ffc107";

        if (gameMode === "infinite") {
            title = "🌐 ĐẤU TRƯỜNG VÔ HẠN 🌐";
            line1 = "Ăn thức ăn để lớn lên và đạt điểm số cao nhất.";
            line2 = "Không chướng ngại vật hay boss. Hãy sinh tồn đến cùng!";
            color = "#00ff88";
        } else if (floor % 5 === 0) {
            const targetDiff = scoreForNextFloor - score;
            title = `👹 QUYẾT CHIẾN BOSS TẦNG ${floor} 👹`;
            line1 = "Né tránh Rắn Khổng Lồ và thu thập thức ăn!";
            line2 = `Yêu cầu đạt thêm ${targetDiff} điểm để vượt ải Boss.`;
            color = "#ff0055";
        } else if (floor === 2) {
            title = "⚠️ CƠ CHẾ MỚI TẦNG 2 ⚠️";
            line1 = "Đá chướng ngại vật bắt đầu xuất hiện ngẫu nhiên.";
            line2 = "Sử dụng Hỏa Cầu Phá Đá (nếu có bùa) để mở đường!";
            color = "#ff8800";
        } else if (floor === 4) {
            title = "⚠️ QUÁI VẬT XUẤT HIỆN TẦNG 4 ⚠️";
            line1 = "Hầm ngục đã bị chiếm giữ bởi loài Dơi và Nhện!";
            line2 = "Tránh va chạm để bảo toàn mạng sống.";
            color = "#ff3366";
        } else {
            title = `🏰 ĐÃ ĐẾN TẦNG ${floor} 🏰`;
            line1 = "Hãy sẵn sàng thám hiểm sâu hơn vào hầm ngục tăm tối.";
            line2 = "Thu thập rương báu và bùa lợi mới để gia tăng sức mạnh.";
            color = "#00ffcc";
        }

        ctx.fillStyle = color;
        ctx.font = "bold 20px 'Chakra Petch'";
        ctx.textAlign = "center";
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.fillText(title, canvas.width / 2, boxY + 45);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.font = "15px 'Be Vietnam Pro'";
        ctx.fillText(line1, canvas.width / 2, boxY + 85);

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "italic 13px 'Be Vietnam Pro'";
        ctx.fillText(line2, canvas.width / 2, boxY + 115);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 15px 'Chakra Petch'";
        ctx.fillText("NHẤN CÁC PHÍM DI CHUYỂN (W,A,S,D / MŨI TÊN) ĐỂ KHỞI HÀNH!", canvas.width / 2, boxY + boxHeight + 40);
    }
}

// 9. VÒNG LẶP TRÒ CHƠI
function gameLoop() {
    update(); draw(); setTimeout(gameLoop, 100);
}

// Bắt sự kiện nút hồi sinh
restartBtn.addEventListener("click", () => { initGame(); });

// ĐIỀU KHIỂN CHẾ ĐỘ CHƠI (LOBBY)
const modeAdventureBtn = document.getElementById("mode-adventure");
const modeInfiniteBtn = document.getElementById("mode-infinite");

modeAdventureBtn.addEventListener("click", () => {
    if (!inLobby) return;
    gameMode = "adventure";
    modeAdventureBtn.classList.add("active");
    modeInfiniteBtn.classList.remove("active");
    startGameBtn.innerText = "🎮 Bắt Đầu Thám Hiểm";
});

modeInfiniteBtn.addEventListener("click", () => {
    if (!inLobby) return;
    gameMode = "infinite";
    modeInfiniteBtn.classList.add("active");
    modeAdventureBtn.classList.remove("active");
    startGameBtn.innerText = "🎮 Vào Đấu Trường";
});

// Bắt các sự kiện chuyển đổi qua lại giữa Sảnh và Game
startGameBtn.addEventListener("click", () => {
    SoundManager.init(); SoundManager.playMusic();
    inLobby = false;
    lobbyScreen.classList.add("d-none");
    document.getElementById("game-container").classList.remove("d-none");
    document.getElementById("pause-btn-floating").classList.remove("d-none");
    hudContainer.classList.remove("d-none");
    controlsHint.classList.remove("d-none");
    initGame();
});

lobbyBtn.addEventListener("click", () => {
    gameOverScreen.classList.add("d-none");
    lobbyScreen.classList.remove("d-none");
    document.getElementById("game-container").classList.add("d-none");
    document.getElementById("pause-btn-floating").classList.add("d-none");
    hudContainer.classList.add("d-none");
    controlsHint.classList.add("d-none");
    inLobby = true; SoundManager.stopMusic();
});

const pauseBtnFloating = document.getElementById("pause-btn-floating");
pauseBtnFloating.addEventListener("click", () => {
    if (inLobby || isDead || isSelectingBlessing) return;
    isPaused = true;
    document.getElementById("pause-music-volume").value = musicVolumeInput.value;
    document.getElementById("pause-music-vol-val").innerText = musicVolVal.innerText;
    document.getElementById("pause-sfx-volume").value = sfxVolumeInput.value;
    document.getElementById("pause-sfx-vol-val").innerText = sfxVolVal.innerText;

    const listContainer = document.getElementById("owned-blessings-list");
    listContainer.innerHTML = "";
    if (gameMode === "infinite") {
        listContainer.innerHTML = `<span class="text-info small">Chế độ Vô Hạn không áp dụng bùa lợi.</span>`;
    } else if (ownedBlessings.length === 0) {
        listContainer.innerHTML = `<span class="text-muted small">Chưa sở hữu bùa lợi nào.</span>`;
    } else {
        ownedBlessings.forEach(b => {
            const badge = document.createElement("span");
            badge.className = "badge bg-secondary border border-warning text-light p-2 me-1 mb-1";
            badge.innerHTML = `${b.emoji} ${b.name}`;
            listContainer.appendChild(badge);
        });
    }
    new bootstrap.Modal(document.getElementById("pauseModal")).show();
});

document.getElementById("pauseModal").addEventListener("hidden.bs.modal", () => { isPaused = false; });

document.getElementById("pause-exit-btn").addEventListener("click", () => {
    const modal = bootstrap.Modal.getInstance(document.getElementById("pauseModal"));
    if (modal) modal.hide();
    gameOverScreen.classList.add("d-none");
    lobbyScreen.classList.remove("d-none");
    document.getElementById("game-container").classList.add("d-none");
    pauseBtnFloating.classList.add("d-none");
    hudContainer.classList.add("d-none");
    controlsHint.classList.add("d-none");
    inLobby = true; isPaused = false; SoundManager.stopMusic();
});

// VOLUME CONTROLS (LOBBY & PAUSE SYNC)
musicVolumeInput.addEventListener("input", (e) => {
    const val = parseInt(e.target.value); musicVolVal.innerText = val + "%";
    SoundManager.init(); SoundManager.setMusicVolume(val / 100);
});

sfxVolumeInput.addEventListener("input", (e) => {
    const val = parseInt(e.target.value); sfxVolVal.innerText = val + "%";
    SoundManager.init(); SoundManager.setSfxVolume(val / 100);
});

sfxVolumeInput.addEventListener("change", () => { SoundManager.playEat(); });

document.getElementById("pause-music-volume").addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    document.getElementById("pause-music-vol-val").innerText = val + "%";
    musicVolumeInput.value = val; musicVolVal.innerText = val + "%";
    SoundManager.init(); SoundManager.setMusicVolume(val / 100);
});

document.getElementById("pause-sfx-volume").addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    document.getElementById("pause-sfx-vol-val").innerText = val + "%";
    sfxVolumeInput.value = val; sfxVolVal.innerText = val + "%";
    SoundManager.init(); SoundManager.setSfxVolume(val / 100);
});

document.getElementById("pause-sfx-volume").addEventListener("change", () => { SoundManager.playEat(); });

document.getElementById("records-btn").addEventListener("click", () => {
    renderRecordsTable();
    // Tự động chọn Tab kỷ lục phù hợp với chế độ chơi đang chọn ngoài sảnh
    if (gameMode === "infinite") {
        const tabEl = document.getElementById("tab-infinite");
        if (tabEl) {
            const tab = bootstrap.Tab.getOrCreateInstance(tabEl);
            tab.show();
        }
    } else {
        const tabEl = document.getElementById("tab-adventure");
        if (tabEl) {
            const tab = bootstrap.Tab.getOrCreateInstance(tabEl);
            tab.show();
        }
    }
});

clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử kỷ lục hầm ngục không?")) {
        localStorage.removeItem("snake_roguelike_records");
        renderRecordsTable();
    }
});

// Thiết lập đổi màu ngẫu nhiên cho con rắn chạy ở sảnh chờ mỗi khi chạy qua hết màn hình
const lobbySnakeContainer = document.querySelector(".lobby-snake-container");
const headDot = document.querySelector(".snake-dot.dot-1");
if (lobbySnakeContainer && headDot) {
    // Đặt màu ngẫu nhiên ban đầu
    lobbySnakeContainer.style.setProperty("--snake-hue", Math.floor(Math.random() * 360));

    // Mỗi khi hoàn thành xong một chu kỳ chạy qua màn hình (animationiteration)
    headDot.addEventListener("animationiteration", () => {
        const nextHue = Math.floor(Math.random() * 360);
        lobbySnakeContainer.style.setProperty("--snake-hue", nextHue);
    });
}

gameLoop();