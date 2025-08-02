const { SnakeGame, Particle } = require('../snake-game-logic');

describe('SnakeGame', () => {
  let game;

  beforeEach(() => {
    game = new SnakeGame(20, 400);
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(game.gridSize).toBe(20);
      expect(game.tileCount).toBe(20);
      expect(game.snake).toEqual([{ x: 10, y: 10 }]);
      expect(game.score).toBe(0);
      expect(game.gameRunning).toBe(false);
      expect(game.gamePaused).toBe(false);
      expect(game.dx).toBe(0);
      expect(game.dy).toBe(0);
    });

    test('should generate food at valid position', () => {
      expect(game.food.x).toBeGreaterThanOrEqual(0);
      expect(game.food.x).toBeLessThan(game.tileCount);
      expect(game.food.y).toBeGreaterThanOrEqual(0);
      expect(game.food.y).toBeLessThan(game.tileCount);
    });

    test('should set random food direction', () => {
      const validDirections = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
      ];
      expect(validDirections).toContainEqual(game.foodDirection);
    });
  });

  describe('Game State Management', () => {
    test('should start game correctly', () => {
      game.startGame();
      expect(game.gameRunning).toBe(true);
      expect(game.gamePaused).toBe(false);
    });

    test('should pause and unpause game', () => {
      game.startGame();
      game.pauseGame();
      expect(game.gamePaused).toBe(true);
      
      game.pauseGame();
      expect(game.gamePaused).toBe(false);
    });

    test('should not pause if game is not running', () => {
      expect(game.gameRunning).toBe(false);
      game.pauseGame();
      expect(game.gamePaused).toBe(false);
    });

    test('should end game correctly', () => {
      game.startGame();
      game.gameOver();
      expect(game.gameRunning).toBe(false);
    });

    test('should reset game state', () => {
      game.score = 10;
      game.snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
      game.dx = 1;
      game.dy = 0;
      
      game.reset();
      
      expect(game.score).toBe(0);
      expect(game.snake).toEqual([{ x: 10, y: 10 }]);
      expect(game.dx).toBe(0);
      expect(game.dy).toBe(0);
    });
  });

  describe('Direction Control', () => {
    test('should set direction correctly', () => {
      const result = game.setDirection(1, 0);
      expect(result).toBe(true);
      expect(game.dx).toBe(1);
      expect(game.dy).toBe(0);
    });

    test('should prevent reverse direction', () => {
      game.dx = 1;
      game.dy = 0;
      
      const result = game.setDirection(-1, 0);
      expect(result).toBe(false);
      expect(game.dx).toBe(1);
      expect(game.dy).toBe(0);
    });

    test('should allow perpendicular direction changes', () => {
      game.dx = 1;
      game.dy = 0;
      
      const result = game.setDirection(0, 1);
      expect(result).toBe(true);
      expect(game.dx).toBe(0);
      expect(game.dy).toBe(1);
    });
  });

  describe('Snake Movement', () => {
    test('should move snake forward', () => {
      game.dx = 1;
      game.dy = 0;
      const initialHead = { ...game.snake[0] };
      
      game.moveSnake();
      
      expect(game.snake[0].x).toBe(initialHead.x + 1);
      expect(game.snake[0].y).toBe(initialHead.y);
    });

    test('should grow snake when eating food', () => {
      game.dx = 1;
      game.dy = 0;
      game.food = { x: 11, y: 10 }; // Place food in front of snake
      const initialLength = game.snake.length;
      const initialScore = game.score;
      
      game.moveSnake();
      
      expect(game.snake.length).toBe(initialLength + 1);
      expect(game.score).toBe(initialScore + 1);
    });

    test('should not grow snake when not eating food', () => {
      game.dx = 1;
      game.dy = 0;
      game.food = { x: 15, y: 15 }; // Place food away from snake
      const initialLength = game.snake.length;
      
      game.moveSnake();
      
      expect(game.snake.length).toBe(initialLength);
    });
  });

  describe('Collision Detection', () => {
    test('should detect wall collision - left wall', () => {
      game.snake = [{ x: 0, y: 10 }];
      game.dx = -1;
      game.dy = 0;
      game.moveSnake();
      
      expect(game.checkCollision()).toBe(true);
    });

    test('should detect wall collision - right wall', () => {
      game.snake = [{ x: 19, y: 10 }];
      game.dx = 1;
      game.dy = 0;
      game.moveSnake();
      
      expect(game.checkCollision()).toBe(true);
    });

    test('should detect wall collision - top wall', () => {
      game.snake = [{ x: 10, y: 0 }];
      game.dx = 0;
      game.dy = -1;
      game.moveSnake();
      
      expect(game.checkCollision()).toBe(true);
    });

    test('should detect wall collision - bottom wall', () => {
      game.snake = [{ x: 10, y: 19 }];
      game.dx = 0;
      game.dy = 1;
      game.moveSnake();
      
      expect(game.checkCollision()).toBe(true);
    });

    test('should detect self collision', () => {
      game.snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
        { x: 8, y: 11 },
        { x: 9, y: 11 },
        { x: 10, y: 11 }
      ];
      game.dx = 0;
      game.dy = 1;
      game.moveSnake(); // This should make head collide with body
      
      expect(game.checkCollision()).toBe(true);
    });

    test('should not detect collision in safe position', () => {
      game.snake = [{ x: 10, y: 10 }];
      expect(game.checkCollision()).toBe(false);
    });
  });

  describe('Food Movement', () => {
    test('should move food after interval', () => {
      const initialFood = { ...game.food };
      const initialDirection = { ...game.foodDirection };
      
      // Move food multiple times to trigger movement
      for (let i = 0; i < game.foodMoveInterval; i++) {
        game.moveFood();
      }
      
      const expectedX = initialFood.x + initialDirection.x;
      const expectedY = initialFood.y + initialDirection.y;
      
      // Check if food moved or direction changed (if hit boundary)
      const foodMoved = (game.food.x === expectedX && game.food.y === expectedY);
      const directionChanged = (game.foodDirection.x !== initialDirection.x || 
                               game.foodDirection.y !== initialDirection.y);
      
      expect(foodMoved || directionChanged).toBe(true);
    });

    test('should not move food before interval', () => {
      const initialFood = { ...game.food };
      
      game.moveFood(); // Only one call, should not move
      
      expect(game.food).toEqual(initialFood);
    });
  });

  describe('Game Update', () => {
    test('should not update when game not running', () => {
      const result = game.update();
      expect(result).toEqual({ gameOver: false, continue: false });
    });

    test('should not update when game paused', () => {
      game.startGame();
      game.pauseGame();
      const result = game.update();
      expect(result).toEqual({ gameOver: false, continue: false });
    });

    test('should continue game when no collision', () => {
      game.startGame();
      game.dx = 1;
      game.dy = 0;
      const result = game.update();
      expect(result).toEqual({ gameOver: false, continue: true });
    });

    test('should end game on collision', () => {
      game.startGame();
      game.snake = [{ x: 19, y: 10 }];
      game.dx = 1;
      game.dy = 0;
      const result = game.update();
      expect(result).toEqual({ gameOver: true, continue: false });
      expect(game.gameRunning).toBe(false);
    });
  });

  describe('Game State Retrieval', () => {
    test('should return correct game state', () => {
      game.score = 5;
      game.dx = 1;
      game.dy = 0;
      game.startGame();
      
      const state = game.getGameState();
      
      expect(state.score).toBe(5);
      expect(state.dx).toBe(1);
      expect(state.dy).toBe(0);
      expect(state.gameRunning).toBe(true);
      expect(state.gamePaused).toBe(false);
      expect(state.snake).toEqual(game.snake);
      expect(state.food).toEqual(game.food);
    });
  });
});

describe('Particle', () => {
  let particle;

  beforeEach(() => {
    particle = new Particle(100, 100);
  });

  test('should initialize with correct properties', () => {
    expect(particle.x).toBe(100);
    expect(particle.y).toBe(100);
    expect(particle.life).toBe(30);
    expect(particle.maxLife).toBe(30);
    expect(typeof particle.vx).toBe('number');
    expect(typeof particle.vy).toBe('number');
    expect(typeof particle.color).toBe('string');
    expect(typeof particle.size).toBe('number');
  });

  test('should update position and properties', () => {
    const initialX = particle.x;
    const initialY = particle.y;
    const initialLife = particle.life;
    const initialSize = particle.size;
    
    particle.update();
    
    expect(particle.x).not.toBe(initialX);
    expect(particle.y).not.toBe(initialY);
    expect(particle.life).toBe(initialLife - 1);
    expect(particle.size).toBeLessThan(initialSize);
  });

  test('should be dead when life reaches zero', () => {
    expect(particle.isDead()).toBe(false);
    
    particle.life = 0;
    expect(particle.isDead()).toBe(true);
  });

  test('should apply friction to velocity', () => {
    const initialVx = particle.vx;
    const initialVy = particle.vy;
    
    particle.update();
    
    expect(Math.abs(particle.vx)).toBeLessThan(Math.abs(initialVx));
    expect(Math.abs(particle.vy)).toBeLessThan(Math.abs(initialVy));
  });
});
