// Snake Game Logic - Testable module
class SnakeGame {
  constructor(gridSize = 20, canvasWidth = 400) {
    this.gridSize = gridSize;
    this.tileCount = canvasWidth / gridSize;
    this.reset();
  }

  reset() {
    this.snake = [{ x: 10, y: 10 }];
    this.food = {};
    this.foodDirection = { x: 0, y: 0 };
    this.foodMoveCounter = 0;
    this.foodMoveInterval = 3;
    this.dx = 0;
    this.dy = 0;
    this.score = 0;
    this.gameRunning = false;
    this.gamePaused = false;
    this.generateRandomFood();
  }

  generateRandomFood() {
    this.food = {
      x: Math.floor(Math.random() * this.tileCount),
      y: Math.floor(Math.random() * this.tileCount)
    };

    // Make sure food doesn't spawn on snake
    for (let segment of this.snake) {
      if (segment.x === this.food.x && segment.y === this.food.y) {
        this.generateRandomFood();
        return;
      }
    }

    this.setRandomFoodDirection();
  }

  setRandomFoodDirection() {
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 }   // right
    ];
    this.foodDirection = directions[Math.floor(Math.random() * directions.length)];
  }

  moveFood() {
    this.foodMoveCounter++;

    if (this.foodMoveCounter >= this.foodMoveInterval) {
      this.foodMoveCounter = 0;

      const newX = this.food.x + this.foodDirection.x;
      const newY = this.food.y + this.foodDirection.y;

      let validMove = true;

      // Check bounds
      if (newX < 0 || newX >= this.tileCount || newY < 0 || newY >= this.tileCount) {
        validMove = false;
      }

      // Check if new position would be on snake
      if (validMove) {
        for (let segment of this.snake) {
          if (segment.x === newX && segment.y === newY) {
            validMove = false;
            break;
          }
        }
      }

      if (validMove) {
        this.food.x = newX;
        this.food.y = newY;
      } else {
        this.setRandomFoodDirection();
      }
    }
  }

  moveSnake() {
    const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

    this.snake.unshift(head);

    // Check if food is eaten
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      this.generateRandomFood();
    } else {
      this.snake.pop();
    }
  }

  checkCollision() {
    const head = this.snake[0];

    // Wall collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      return true;
    }

    // Self collision
    for (let i = 1; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        return true;
      }
    }

    return false;
  }

  setDirection(newDx, newDy) {
    // Prevent reverse direction
    if ((newDx === 1 && this.dx === -1) || 
        (newDx === -1 && this.dx === 1) ||
        (newDy === 1 && this.dy === -1) || 
        (newDy === -1 && this.dy === 1)) {
      return false;
    }

    this.dx = newDx;
    this.dy = newDy;
    return true;
  }

  startGame() {
    this.gameRunning = true;
    this.gamePaused = false;
  }

  pauseGame() {
    if (this.gameRunning) {
      this.gamePaused = !this.gamePaused;
    }
  }

  gameOver() {
    this.gameRunning = false;
  }

  update() {
    if (!this.gameRunning || this.gamePaused) {
      return { gameOver: false, continue: false };
    }

    this.moveSnake();
    this.moveFood();

    if (this.checkCollision()) {
      this.gameOver();
      return { gameOver: true, continue: false };
    }

    return { gameOver: false, continue: true };
  }

  getGameState() {
    return {
      snake: [...this.snake],
      food: { ...this.food },
      score: this.score,
      gameRunning: this.gameRunning,
      gamePaused: this.gamePaused,
      dx: this.dx,
      dy: this.dy
    };
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8;
    this.life = 30;
    this.maxLife = 30;
    this.color = `hsl(${Math.random() * 60 + 15}, 100%, ${Math.random() * 30 + 50}%)`;
    this.size = Math.random() * 4 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life--;
    this.size *= 0.95;
  }

  isDead() {
    return this.life <= 0;
  }
}

// Export for testing (Node.js) and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SnakeGame, Particle };
}
