// Game variables
let canvas, ctx;
try {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) throw new Error('Game canvas not found');
    
    ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D rendering context');
} catch (error) {
    console.error('Canvas initialization error:', error);
    // Show error to user
    const errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '20px';
    errorDiv.style.textAlign = 'center';
    errorDiv.textContent = 'Error initializing game. Please refresh the page or check your browser compatibility.';
    document.body.innerHTML = '';
    document.body.appendChild(errorDiv);
    throw error; // Stop further execution
}
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverElement = document.getElementById('gameOver');

// Game settings
const gridSize = 20;
const tileCount = canvas.width / gridSize;
const moveInterval = 400; // Time in milliseconds between snake movements (400ms = 0.4 seconds)
let lastMoveTime = 0;
let lastRenderTime = 0;

let snake = [
    {x: 10, y: 10}
];
let food = {};
let foodDirection = { x: 0, y: 0 };
let foodMoveCounter = 0;
const foodMoveInterval = 3; // Apple moves every 3 frames (snake moves every 1 frame)
let dx = 0;
let dy = 0;
// Next direction for immediate visual feedback
let nextDx = 0;
let nextDy = 0;
let pendingDirectionChange = false;
// Prevent multiple direction changes per movement frame
let directionChangedThisFrame = false;
let score = 0;
// Get high score from localStorage with validation
let highScore = 0;
try {
    const storedScore = localStorage.getItem('snakeHighScore');
    if (storedScore) {
        const parsedScore = parseInt(storedScore, 10);
        // Validate the score is a positive number and not too large (prevent potential memory issues)
        if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 1000000) {
            highScore = parsedScore;
        }
    }
} catch (e) {
    console.warn('Failed to load high score:', e);
}
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

// Edge flash system for swipe feedback
let edgeFlash = {
    active: false,
    direction: null, // 'up', 'down', 'left', 'right'
    duration: 200, // Flash duration in milliseconds
    startTime: 0,
    color: '#00ff88' // Bright green complementary color
};

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
    const canvasX = gridX * gridSize + gridSize / 2;
    const canvasY = gridY * gridSize + gridSize / 2;
    
    for (let i = 0; i < 15; i++) {
        explosionParticles.push(new Particle(canvasX, canvasY));
    }
}

// Trigger edge flash for swipe feedback
function triggerEdgeFlash(direction) {
    edgeFlash.active = true;
    edgeFlash.direction = direction;
    edgeFlash.startTime = performance.now();
}

// Draw edge flash effect
function drawEdgeFlash() {
    if (!edgeFlash.active) return;
    
    const currentTime = performance.now();
    const elapsed = currentTime - edgeFlash.startTime;
    
    // Check if flash should end
    if (elapsed >= edgeFlash.duration) {
        edgeFlash.active = false;
        return;
    }
    
    // Calculate flash intensity (fade out over time)
    const intensity = 1 - (elapsed / edgeFlash.duration);
    const alpha = Math.max(0, intensity * 0.8); // Max 80% opacity
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = edgeFlash.color;
    
    const flashWidth = 8; // Width of the flash edge
    
    switch (edgeFlash.direction) {
        case 'up':
            ctx.fillRect(0, 0, canvas.width, flashWidth);
            break;
        case 'down':
            ctx.fillRect(0, canvas.height - flashWidth, canvas.width, flashWidth);
            break;
        case 'left':
            ctx.fillRect(0, 0, flashWidth, canvas.height);
            break;
        case 'right':
            ctx.fillRect(canvas.width - flashWidth, 0, flashWidth, canvas.height);
            break;
    }
    
    ctx.restore();
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
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
        
        // Add visual feedback for pending direction change on the head
        if (i === 0 && pendingDirectionChange) {
            // Draw a subtle direction indicator on the snake head
            ctx.fillStyle = '#88ff88'; // Lighter green for feedback
            const centerX = segment.x * gridSize + gridSize / 2;
            const centerY = segment.y * gridSize + gridSize / 2;
            const indicatorSize = 4;
            
            // Draw arrow indicator based on next direction
            if (nextDx === 1) { // Right
                ctx.fillRect(centerX + 4, centerY - 2, indicatorSize, indicatorSize);
            } else if (nextDx === -1) { // Left
                ctx.fillRect(centerX - 8, centerY - 2, indicatorSize, indicatorSize);
            } else if (nextDy === -1) { // Up
                ctx.fillRect(centerX - 2, centerY - 8, indicatorSize, indicatorSize);
            } else if (nextDy === 1) { // Down
                ctx.fillRect(centerX - 2, centerY + 4, indicatorSize, indicatorSize);
            }
            
            ctx.fillStyle = '#00ff00'; // Reset to normal green
        }
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
    
    // Draw edge flash effect
    drawEdgeFlash();
}

// Move snake
function moveSnake() {
    // Apply pending direction change if there is one
    if (pendingDirectionChange) {
        dx = nextDx;
        dy = nextDy;
        pendingDirectionChange = false;
    }
    
    // Reset direction change flag for this movement frame
    directionChangedThisFrame = false;
    
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
    
    // Update high score with validation
    if (score > highScore) {
        // Only update high score if the new score is higher and valid
        if (score <= 1000000) {  // Prevent extremely large scores
            highScore = score;
            highScoreElement.textContent = highScore;
            try {
                localStorage.setItem('snakeHighScore', highScore.toString());
            } catch (e) {
                console.warn('Failed to save high score:', e);
            }
        }
    }
}

// Main game loop
function gameLoop(timestamp) {
    try {
        // Always update animations (explosions, etc.)
        updateExplosions();
        
        // Only move the snake at the specified interval
        if (timestamp - lastMoveTime >= moveInterval) {
            if (gameRunning && !gamePaused) {
                moveSnake();
                moveFood(); // Move the apple
                
                if (checkCollision()) {
                    gameOver();
                    return;
                }
            }
            lastMoveTime = timestamp;
        }
        
        // Always render the current game state
        if (gameRunning && !gamePaused) {
            drawGame();
        }
        
    } catch (error) {
        console.error('Game loop error:', error);
        // Try to recover by resetting the game state
        try {
            gameOver();
            alert('A game error occurred. The game has been reset.');
        } catch (e) {
            console.error('Error during game recovery:', e);
            // If we can't recover, show an error message
            document.body.innerHTML = `
                <div style="color: red; text-align: center; padding: 20px;">
                    <h2>Game Error</h2>
                    <p>Sorry, the game encountered an error and cannot continue.</p>
                    <p>Please refresh the page to try again.</p>
                </div>
            `;
            return; // Stop the game loop
        }
    }
    
    // Always request the next frame
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    if (gameRunning && !gamePaused) {
        return; // Game already running
    }
    
    if (!gameRunning) {
        // Reset game state
        snake = [{x: 10, y: 10}];
        // Only reset direction if no direction is already set (preserve directional input start)
        if (dx === 0 && dy === 0) {
            dx = 0;
            dy = 0;
        }
        score = 0;
        scoreElement.textContent = score;
        gameOverElement.style.display = 'none';
        foodMoveCounter = 0; // Reset food movement counter
        randomFood();
    }
    
    gameRunning = true;
    gamePaused = false;
    
    // Start the game loop with requestAnimationFrame
    lastRenderTime = performance.now();
    lastMoveTime = lastRenderTime;
    requestAnimationFrame(gameLoop);
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
    // Reset all direction variables to ensure snake doesn't move automatically
    dx = 0;
    dy = 0;
    nextDx = 0;
    nextDy = 0;
    pendingDirectionChange = false;
    directionChangedThisFrame = false;
    startGame();
}

// Validate keyboard input
function isValidKey(key) {
    // Only allow arrow keys, WASD, and space for pause
    const validKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' '
    ];
    return validKeys.includes(key);
}

// Swipe controls for the game canvas
function setupSwipeControls() {
    // Use the game canvas for swipe gestures
    const gameCanvas = document.getElementById('gameCanvas');
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;
    
    function handleSwipe(touchEndX, touchEndY) {
        const dxSwipe = touchEndX - touchStartX;
        const dySwipe = touchEndY - touchStartY;
        
        // Only process swipes that move a minimum distance (to prevent accidental swipes)
        const minSwipeDistance = 10;
        if (Math.abs(dxSwipe) < minSwipeDistance && Math.abs(dySwipe) < minSwipeDistance) {
            return;
        }
        
        // Determine new direction based on swipe
        let newDx = dx;
        let newDy = dy;
        let isValidSwipe = false;
        let inputDirection = null;
        
        // Determine if the swipe was more horizontal or vertical
        if (Math.abs(dxSwipe) > Math.abs(dySwipe)) {
            // Horizontal swipe
            if (dxSwipe > 0 && dx !== -1) {
                // Swipe right
                newDx = 1;
                newDy = 0;
                isValidSwipe = true;
                inputDirection = 'right';
            } else if (dxSwipe < 0 && dx !== 1) {
                // Swipe left
                newDx = -1;
                newDy = 0;
                isValidSwipe = true;
                inputDirection = 'left';
            }
        } else {
            // Vertical swipe
            if (dySwipe > 0 && dy !== -1) {
                // Swipe down
                newDx = 0;
                newDy = 1;
                isValidSwipe = true;
                inputDirection = 'down';
            } else if (dySwipe < 0 && dy !== 1) {
                // Swipe up
                newDx = 0;
                newDy = -1;
                isValidSwipe = true;
                inputDirection = 'up';
            }
        }
        
        // If game is not running and we got a valid swipe, start the game
        if (!gameRunning && isValidSwipe) {
            dx = newDx;
            dy = newDy;
            if (inputDirection) {
                triggerEdgeFlash(inputDirection);
            }
            startGame();
            return;
        }
        
        // If game is paused, ignore swipes
        if (gamePaused) {
            return;
        }
        
        // If game is running, set next direction for immediate feedback
        // But only allow one direction change per movement frame to prevent U-turns
        if (gameRunning && isValidSwipe && !directionChangedThisFrame) {
            const willChange = (newDx !== dx || newDy !== dy);
            if (willChange) {
                nextDx = newDx;
                nextDy = newDy;
                pendingDirectionChange = true;
                directionChangedThisFrame = true;
                if (inputDirection) {
                    triggerEdgeFlash(inputDirection);
                }
                // Trigger immediate re-render to show direction change feedback
                drawGame();
            }
        }
    }
    
    // Touch event handlers
    gameCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = gameCanvas.getBoundingClientRect();
        touchStartX = touch.clientX - rect.left;
        touchStartY = touch.clientY - rect.top;
        isSwiping = true;
    }, { passive: false });
    
    gameCanvas.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        e.preventDefault();
    }, { passive: false });
    
    gameCanvas.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = gameCanvas.getBoundingClientRect();
        const touchEndX = touch.clientX - rect.left;
        const touchEndY = touch.clientY - rect.top;
        handleSwipe(touchEndX, touchEndY);
        isSwiping = false;
    }, { passive: false });
    
    // Mouse event handlers for testing on desktop
    gameCanvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const rect = gameCanvas.getBoundingClientRect();
        touchStartX = e.clientX - rect.left;
        touchStartY = e.clientY - rect.top;
        isSwiping = true;
    });
    
    gameCanvas.addEventListener('mouseup', (e) => {
        if (!isSwiping) return;
        e.preventDefault();
        const rect = gameCanvas.getBoundingClientRect();
        const touchEndX = e.clientX - rect.left;
        const touchEndY = e.clientY - rect.top;
        handleSwipe(touchEndX, touchEndY);
        isSwiping = false;
    });
    
    // Prevent context menu on right-click
    gameCanvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// Initialize swipe controls when the DOM is loaded
document.addEventListener('DOMContentLoaded', setupSwipeControls);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    // Prevent default for game keys to avoid page scrolling
    if (isValidKey(e.key)) {
        e.preventDefault();
    }
    
    const key = e.key.toLowerCase();
    
    // Handle directional inputs
    let newDx = dx;
    let newDy = dy;
    let isDirectionalInput = false;
    let inputDirection = null;
    
    switch (key) {
        case 'arrowup':
        case 'w':
            if (dy !== 1) {
                newDx = 0;
                newDy = -1;
                isDirectionalInput = true;
                inputDirection = 'up';
            }
            break;
        case 'arrowdown':
        case 's':
            if (dy !== -1) {
                newDx = 0;
                newDy = 1;
                isDirectionalInput = true;
                inputDirection = 'down';
            }
            break;
        case 'arrowleft':
        case 'a':
            if (dx !== 1) {
                newDx = -1;
                newDy = 0;
                isDirectionalInput = true;
                inputDirection = 'left';
            }
            break;
        case 'arrowright':
        case 'd':
            if (dx !== -1) {
                newDx = 1;
                newDy = 0;
                isDirectionalInput = true;
                inputDirection = 'right';
            }
            break;
        case ' ':
        case 'p':
            if (gameRunning) {
                pauseGame();
            } else {
                startGame();
            }
            return;
    }
    
    // If game is not running and we got a directional input, start the game
    if (!gameRunning && isDirectionalInput) {
        dx = newDx;
        dy = newDy;
        if (inputDirection) {
            triggerEdgeFlash(inputDirection);
        }
        startGame();
        return;
    }
    
    // If game is paused, only allow space to unpause
    if (gamePaused) {
        return;
    }
    
    // If game is running, set next direction for immediate feedback
    // But only allow one direction change per movement frame to prevent U-turns
    if (gameRunning && isDirectionalInput && !directionChangedThisFrame) {
        const willChange = (newDx !== dx || newDy !== dy);
        if (willChange) {
            nextDx = newDx;
            nextDy = newDy;
            pendingDirectionChange = true;
            directionChangedThisFrame = true;
            if (inputDirection) {
                triggerEdgeFlash(inputDirection);
            }
            // Trigger immediate re-render to show direction change feedback
            drawGame();
        }
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
                const newDx2 = 1;
                const newDy2 = 0;
                const willChange2 = (newDx2 !== dx || newDy2 !== dy);
                if (willChange2) {
                    dx = newDx2;
                    dy = newDy2;
                    triggerEdgeFlash('right');
                }
            } else if (deltaX < 0 && dx !== 1) {
                // Swipe left
                const newDx2 = -1;
                const newDy2 = 0;
                const willChange2 = (newDx2 !== dx || newDy2 !== dy);
                if (willChange2) {
                    dx = newDx2;
                    dy = newDy2;
                    triggerEdgeFlash('left');
                }
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0 && dy !== -1) {
                // Swipe down
                const newDx2 = 0;
                const newDy2 = 1;
                const willChange2 = (newDx2 !== dx || newDy2 !== dy);
                if (willChange2) {
                    dx = newDx2;
                    dy = newDy2;
                    triggerEdgeFlash('down');
                }
            } else if (deltaY < 0 && dy !== 1) {
                // Swipe up
                const newDx2 = 0;
                const newDy2 = -1;
                const willChange2 = (newDx2 !== dx || newDy2 !== dy);
                if (willChange2) {
                    dx = newDx2;
                    dy = newDy2;
                    triggerEdgeFlash('up');
                }
            }
        }
    }
});

// Initialize game
randomFood();
drawGame();
