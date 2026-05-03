const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreDisplay = document.getElementById('scoreDisplay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreEl = document.getElementById('finalScore');
const gameOverTitle = document.getElementById('gameOverTitle');
const highScoreDisplay = document.getElementById('highScoreDisplay');

// Game State
let state = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let bestScore = parseInt(localStorage.getItem('smoothPacmanBest')) || 0;
highScoreDisplay.innerText = `HI: ${bestScore}`;
let animationId;

// The map: 0 = empty, 1 = wall, 2 = pellet, 3 = power pellet
// 19 cols x 21 rows
const originalMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let map = [];
let TILE_SIZE = 30;

const ROWS = originalMap.length;
const COLS = originalMap[0].length;

// Setup Canvas Size dynamically
canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;

// Entities
let pacman;
let ghosts = [];

// Input
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

let floatingTexts = [];

class FloatingText {
    constructor(x, y, text) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.timer = 60; // 1 second
    }
    update() {
        this.y -= 0.5;
        this.timer--;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.timer / 60);
        ctx.fillStyle = '#10b981'; // Green for points
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Pacman {
    constructor() {
        this.reset();
        this.speed = 2.5;
        this.radius = TILE_SIZE * 0.4;
        this.color = '#fcd34d'; // yellow
        this.mouthOpen = 0;
        this.mouthDir = 1;
    }

    reset() {
        this.x = 9 * TILE_SIZE + TILE_SIZE/2; // Col 9
        this.y = 15 * TILE_SIZE + TILE_SIZE/2; // Row 15
        this.vx = 0;
        this.vy = 0;
        this.nextVx = 0;
        this.nextVy = 0;
        this.angle = 0;
    }

    update() {
        // Animation
        this.mouthOpen += 0.1 * this.mouthDir;
        if (this.mouthOpen >= 0.5 || this.mouthOpen <= 0) {
            this.mouthDir *= -1;
        }

        // Apply requested movement if possible
        if (this.nextVx !== 0 || this.nextVy !== 0) {
            if (this.canMove(this.nextVx, this.nextVy)) {
                this.vx = this.nextVx;
                this.vy = this.nextVy;
                // align to grid when turning
                if (this.vx !== 0) this.y = Math.floor(this.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
                if (this.vy !== 0) this.x = Math.floor(this.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
            }
        }

        // Stop if hitting a wall in current direction
        if (!this.canMove(this.vx, this.vy)) {
            this.vx = 0;
            this.vy = 0;
        }

        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;

        // Screen Wrap
        if (this.x < -TILE_SIZE/2) this.x = canvas.width + TILE_SIZE/2;
        if (this.x > canvas.width + TILE_SIZE/2) this.x = -TILE_SIZE/2;

        // Angle for drawing
        if (this.vx > 0) this.angle = 0;
        if (this.vx < 0) this.angle = Math.PI;
        if (this.vy > 0) this.angle = Math.PI/2;
        if (this.vy < 0) this.angle = -Math.PI/2;

        this.eat();
    }

    canMove(vx, vy) {
        if (vx === 0 && vy === 0) return true;
        // Check corners of bounding box
        const margin = 2; // allowance
        const nextX = this.x + vx * this.speed;
        const nextY = this.y + vy * this.speed;
        
        let left = nextX - this.radius + margin;
        let right = nextX + this.radius - margin;
        let top = nextY - this.radius + margin;
        let bottom = nextY + this.radius - margin;

        return !(this.isWall(left, top) || this.isWall(right, top) || this.isWall(left, bottom) || this.isWall(right, bottom));
    }

    isWall(x, y) {
        let col = Math.floor(x / TILE_SIZE);
        let row = Math.floor(y / TILE_SIZE);
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false; // wrap around tunnels
        return map[row][col] === 1;
    }

    eat() {
        let col = Math.floor(this.x / TILE_SIZE);
        let row = Math.floor(this.y / TILE_SIZE);
        
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
            if (map[row][col] === 2) {
                map[row][col] = 0;
                score += 10;
                scoreDisplay.innerText = score;
                checkWin();
            } else if (map[row][col] === 3) {
                map[row][col] = 0;
                score += 50;
                scoreDisplay.innerText = score;
                // Frighten ghosts (Simplified)
                ghosts.forEach(g => g.frighten());
                checkWin();
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, this.mouthOpen * Math.PI, (2 - this.mouthOpen) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        
        ctx.restore();
    }
}

class Ghost {
    constructor(x, y, color) {
        this.startX = x * TILE_SIZE + TILE_SIZE/2;
        this.startY = y * TILE_SIZE + TILE_SIZE/2;
        this.color = color;
        this.reset();
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.vx = 0;
        this.vy = -1;
        this.speed = 2;
        this.radius = TILE_SIZE * 0.4;
        this.isFrightened = false;
        this.frightenedTimer = 0;
        this.lastTurnCol = -1;
        this.lastTurnRow = -1;
    }

    frighten() {
        this.isFrightened = true;
        this.frightenedTimer = 600; // 10 seconds at 60fps
        // reverse direction
        this.vx *= -1;
        this.vy *= -1;
    }

    update() {
        if (this.isFrightened) {
            this.frightenedTimer--;
            if (this.frightenedTimer <= 0) {
                this.isFrightened = false;
            }
            this.speed = 1.2;
        } else {
            this.speed = 2;
        }

        let dx = this.x % TILE_SIZE;
        let dy = this.y % TILE_SIZE;
        let center = TILE_SIZE / 2;

        let col = Math.floor(this.x / TILE_SIZE);
        let row = Math.floor(this.y / TILE_SIZE);

        // Only make routing decisions when very close to the center of a tile
        if (Math.abs(dx - center) <= this.speed && Math.abs(dy - center) <= this.speed) {
            if (col !== this.lastTurnCol || row !== this.lastTurnRow) {
                // Snap to exact center
                this.x = col * TILE_SIZE + center;
                this.y = row * TILE_SIZE + center;
                this.lastTurnCol = col;
                this.lastTurnRow = row;

                // Make decision
                let dirs = [
                    {vx: 1, vy: 0}, {vx: -1, vy: 0},
                    {vx: 0, vy: 1}, {vx: 0, vy: -1}
                ];
                
                let validDirs = dirs.filter(d => {
                    if (d.vx === -this.vx && d.vy === -this.vy) return false; // don't reverse
                    // Check if the next tile in direction d is a wall
                    let nextCol = col + d.vx;
                    let nextRow = row + d.vy;
                    if (nextCol < 0) nextCol = COLS - 1;
                    if (nextCol >= COLS) nextCol = 0;
                    return originalMap[nextRow][nextCol] !== 1;
                });

                if (validDirs.length === 0) {
                    this.vx *= -1;
                    this.vy *= -1;
                } else {
                    let currentDirValid = validDirs.some(d => d.vx === this.vx && d.vy === this.vy);
                    if (!currentDirValid || (validDirs.length > 1 && Math.random() < 0.2)) {
                        let choice = validDirs[Math.floor(Math.random() * validDirs.length)];
                        this.vx = choice.vx;
                        this.vy = choice.vy;
                    }
                }
            }
        }

        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;

        // Screen Wrap
        if (this.x < -TILE_SIZE/2) this.x = canvas.width + TILE_SIZE/2;
        if (this.x > canvas.width + TILE_SIZE/2) this.x = -TILE_SIZE/2;

        this.checkCollision();
    }

    checkCollision() {
        let dist = Math.hypot(this.x - pacman.x, this.y - pacman.y);
        if (dist < this.radius + pacman.radius) {
            if (this.isFrightened) {
                floatingTexts.push(new FloatingText(this.x, this.y, '+200'));
                this.reset();
                score += 200;
                scoreDisplay.innerText = score;
            } else {
                gameOver(false);
            }
        }
    }

    draw() {
        ctx.fillStyle = this.isFrightened ? (this.frightenedTimer < 120 && this.frightenedTimer % 20 < 10 ? '#fff' : '#3b82f6') : this.color;
        
        ctx.beginPath();
        // Body (top half circle, bottom wavy)
        ctx.arc(this.x, this.y - this.radius*0.2, this.radius, Math.PI, 0);
        ctx.lineTo(this.x + this.radius, this.y + this.radius);
        ctx.lineTo(this.x + this.radius*0.5, this.y + this.radius*0.7);
        ctx.lineTo(this.x, this.y + this.radius);
        ctx.lineTo(this.x - this.radius*0.5, this.y + this.radius*0.7);
        ctx.lineTo(this.x - this.radius, this.y + this.radius);
        ctx.fill();
        ctx.closePath();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - this.radius*0.4, this.y - this.radius*0.3, this.radius*0.3, 0, Math.PI*2);
        ctx.arc(this.x + this.radius*0.4, this.y - this.radius*0.3, this.radius*0.3, 0, Math.PI*2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        let eyeOffset = this.vx > 0 ? 2 : (this.vx < 0 ? -2 : 0);
        ctx.arc(this.x - this.radius*0.4 + eyeOffset, this.y - this.radius*0.3, this.radius*0.15, 0, Math.PI*2);
        ctx.arc(this.x + this.radius*0.4 + eyeOffset, this.y - this.radius*0.3, this.radius*0.15, 0, Math.PI*2);
        ctx.fill();
    }
}

// Draw Map
function drawMap() {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (map[row][col] === 1) {
                // Wall
                ctx.fillStyle = '#1e293b';
                // Draw rounded rects for walls
                ctx.beginPath();
                ctx.roundRect(col * TILE_SIZE + 2, row * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4, 6);
                ctx.fill();
            } else if (map[row][col] === 2) {
                // Pellet
                ctx.fillStyle = '#fcd34d';
                ctx.beginPath();
                ctx.arc(col * TILE_SIZE + TILE_SIZE/2, row * TILE_SIZE + TILE_SIZE/2, TILE_SIZE*0.1, 0, Math.PI*2);
                ctx.fill();
            } else if (map[row][col] === 3) {
                // Power Pellet
                ctx.fillStyle = '#fcd34d';
                ctx.beginPath();
                ctx.arc(col * TILE_SIZE + TILE_SIZE/2, row * TILE_SIZE + TILE_SIZE/2, TILE_SIZE*0.25, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }
}

// Controls
function bindEvents() {
    window.addEventListener('keydown', e => {
        if (state !== 'PLAYING') return;
        
        // Prevent default scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }

        if (e.key === 'ArrowUp') { pacman.nextVx = 0; pacman.nextVy = -1; }
        if (e.key === 'ArrowDown') { pacman.nextVx = 0; pacman.nextVy = 1; }
        if (e.key === 'ArrowLeft') { pacman.nextVx = -1; pacman.nextVy = 0; }
        if (e.key === 'ArrowRight') { pacman.nextVx = 1; pacman.nextVy = 0; }
    });

    // Mobile Swipe Controls
    let touchStartX = 0;
    let touchStartY = 0;
    window.addEventListener('touchstart', e => {
        if (e.target !== canvas) return;
        e.preventDefault();
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, {passive: false});

    window.addEventListener('touchend', e => {
        if (e.target !== canvas || state !== 'PLAYING') return;
        e.preventDefault();
        let touchEndX = e.changedTouches[0].screenX;
        let touchEndY = e.changedTouches[0].screenY;
        handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
    }, {passive: false});

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
}

function handleSwipe(startX, startY, endX, endY) {
    let dx = endX - startX;
    let dy = endY - startY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) { pacman.nextVx = 1; pacman.nextVy = 0; }
        else if (dx < -30) { pacman.nextVx = -1; pacman.nextVy = 0; }
    } else {
        if (dy > 30) { pacman.nextVx = 0; pacman.nextVy = 1; }
        else if (dy < -30) { pacman.nextVx = 0; pacman.nextVy = -1; }
    }
}

// Game Loop Functions
function init() {
    pacman = new Pacman();
    ghosts = [
        new Ghost(9, 8, '#ef4444'), // Red
        new Ghost(8, 9, '#ec4899'), // Pink
        new Ghost(10, 9, '#06b6d4'), // Cyan
        new Ghost(9, 9, '#f97316')  // Orange
    ];
    bindEvents();
    drawMap();
    pacman.draw();
}

function startGame() {
    state = 'PLAYING';
    score = 0;
    scoreDisplay.innerText = score;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Deep copy map
    map = JSON.parse(JSON.stringify(originalMap));
    
    pacman.reset();
    ghosts.forEach(g => g.reset());
    floatingTexts = [];
    
    if (animationId) cancelAnimationFrame(animationId);
    loop();
}

function checkWin() {
    let hasPellets = false;
    for(let r=0; r<ROWS; r++){
        for(let c=0; c<COLS; c++){
            if(map[r][c] === 2 || map[r][c] === 3) hasPellets = true;
        }
    }
    if (!hasPellets) {
        gameOver(true);
    }
}

function gameOver(win) {
    state = 'GAMEOVER';
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('smoothPacmanBest', bestScore);
        highScoreDisplay.innerText = `HI: ${bestScore}`;
    }

    gameOverTitle.innerText = win ? 'You Win!' : 'Game Over';
    finalScoreEl.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

function loop() {
    if (state !== 'PLAYING') return;

    // Update
    pacman.update();
    ghosts.forEach(g => g.update());
    floatingTexts.forEach(ft => ft.update());
    floatingTexts = floatingTexts.filter(ft => ft.timer > 0);

    // Draw
    drawMap();
    pacman.draw();
    ghosts.forEach(g => g.draw());
    floatingTexts.forEach(ft => ft.draw());

    animationId = requestAnimationFrame(loop);
}

// Run
init();
