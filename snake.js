// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverElement = document.getElementById('gameOver');

// Game settings
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [
    {x: 10, y: 10}
];
let food = {};
let foodDirection = { x: 0, y: 0 };
let foodMoveCounter = 0;
const foodMoveInterval = 3; // Apple moves every 3 frames (snake moves every 1 frame)
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gamePaused = false;

// Background colors array
const backgroundColors = [
    '#000000', // black
    '#1a1a2e', // dark blue
    '#16213e', // navy
    '#0f3460', // deep blue
    '#533483', // purple
    '#7209b7', // violet
    '#2d1b69', // dark purple
    '#0d7377', // teal
    '#14a085', // green-blue
    '#2e8b57'  // sea green
];
let currentBackgroundIndex = 0;

// Explosion particles system
let explosionParticles = [];

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 30;
        this.maxLife = 30;
        this.color = `hsl(${Math.random() * 60 + 15}, 100%, ${Math.random() * 30 + 50}%)`; // Orange/yellow colors
        this.size = Math.random() * 4 + 2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98; // Friction
        this.vy *= 0.98;
        this.life--;
        this.size *= 0.95; // Shrink over time
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

// Initialize high score display
highScoreElement.textContent = highScore;

// Generate random food position and direction
function randomFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    
    // Make sure food doesn't spawn on snake
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            randomFood();
            return;
        }
    }
    
    // Set random direction for food movement
    setRandomFoodDirection();
}

// Set random direction for food movement
function setRandomFoodDirection() {
    const directions = [
        { x: 0, y: -1 }, // up
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }, // left
        { x: 1, y: 0 }   // right
    ];
    foodDirection = directions[Math.floor(Math.random() * directions.length)];
}

// Move food (apple)
function moveFood() {
    foodMoveCounter++;
    
    // Only move food every foodMoveInterval frames
    if (foodMoveCounter >= foodMoveInterval) {
        foodMoveCounter = 0;
        
        const newX = food.x + foodDirection.x;
        const newY = food.y + foodDirection.y;
        
        // Check if new position is valid (within bounds and not on snake)
        let validMove = true;
        
        // Check bounds
        if (newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount) {
            validMove = false;
        }
        
        // Check if new position would be on snake
        if (validMove) {
            for (let segment of snake) {
                if (segment.x === newX && segment.y === newY) {
                    validMove = false;
                    break;
                }
            }
        }
        
        if (validMove) {
            // Move food to new position
            food.x = newX;
            food.y = newY;
        } else {
            // Change direction if can't move
            setRandomFoodDirection();
        }
    }
}

// Change background color
function changeBackground() {
    currentBackgroundIndex = (currentBackgroundIndex + 1) % backgroundColors.length;
}

// Create explosion at given position
function createExplosion(gridX, gridY) {
    const centerX = gridX * gridSize + gridSize / 2;
    const centerY = gridY * gridSize + gridSize / 2;
    
    // Create multiple particles
    for (let i = 0; i < 12; i++) {
        explosionParticles.push(new Particle(centerX, centerY));
    }
}

// Update and draw explosion particles
function updateExplosions() {
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const particle = explosionParticles[i];
        particle.update();
        
        if (particle.isDead()) {
            explosionParticles.splice(i, 1);
        } else {
            particle.draw();
        }
    }
}

// Draw game elements
function drawGame() {
    // Clear canvas with current background color
    ctx.fillStyle = backgroundColors[currentBackgroundIndex];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw snake
    ctx.fillStyle = '#00ff00';
    for (let segment of snake) {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    }
    
    // Draw food (apple emoji)
    ctx.font = `${gridSize - 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
        '🍎', 
        food.x * gridSize + gridSize / 2, 
        food.y * gridSize + gridSize / 2
    );
    
    // Draw explosion particles
    updateExplosions();
}

// Move snake
function moveSnake() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    
    // Add new head
    snake.unshift(head);
    
    // Check if food is eaten
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        createExplosion(food.x, food.y); // Create explosion at food location
        changeBackground(); // Change background when food is consumed
        randomFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
}

// Check collisions
function checkCollision() {
    const head = snake[0];
    
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }
    
    // Self collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Game over
function gameOver() {
    gameRunning = false;
    gameOverElement.style.display = 'block';
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
}

// Main game loop
function gameLoop() {
    if (!gameRunning || gamePaused) {
        return;
    }
    
    moveSnake();
    moveFood(); // Move the apple
    
    if (checkCollision()) {
        gameOver();
        return;
    }
    
    drawGame();
}

// Start game
function startGame() {
    if (gameRunning && !gamePaused) {
        return; // Game already running
    }
    
    if (!gameRunning) {
        // Reset game state
        snake = [{x: 10, y: 10}];
        dx = 0;
        dy = 0;
        score = 0;
        scoreElement.textContent = score;
        gameOverElement.style.display = 'none';
        foodMoveCounter = 0; // Reset food movement counter
        randomFood();
    }
    
    gameRunning = true;
    gamePaused = false;
    
    // Start game loop
    setInterval(gameLoop, 100);
}

// Pause game
function pauseGame() {
    if (gameRunning) {
        gamePaused = !gamePaused;
    }
}

// Restart game
function restartGame() {
    gameRunning = false;
    gamePaused = false;
    gameOverElement.style.display = 'none';
    startGame();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!gameRunning || gamePaused) {
        return;
    }
    
    const key = e.key.toLowerCase();
    
    // Prevent reverse direction
    switch (key) {
        case 'arrowup':
        case 'w':
            if (dy !== 1) {
                dx = 0;
                dy = -1;
            }
            break;
        case 'arrowdown':
        case 's':
            if (dy !== -1) {
                dx = 0;
                dy = 1;
            }
            break;
        case 'arrowleft':
        case 'a':
            if (dx !== 1) {
                dx = -1;
                dy = 0;
            }
            break;
        case 'arrowright':
        case 'd':
            if (dx !== -1) {
                dx = 1;
                dy = 0;
            }
            break;
        case ' ':
        case 'p':
            pauseGame();
            break;
    }
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!gameRunning || gamePaused) {
        return;
    }
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0 && dx !== -1) {
                // Swipe right
                dx = 1;
                dy = 0;
            } else if (deltaX < 0 && dx !== 1) {
                // Swipe left
                dx = -1;
                dy = 0;
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0 && dy !== -1) {
                // Swipe down
                dx = 0;
                dy = 1;
            } else if (deltaY < 0 && dy !== 1) {
                // Swipe up
                dx = 0;
                dy = -1;
            }
        }
    }
});

// Initialize game
randomFood();
drawGame();
