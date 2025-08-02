const { SnakeGame } = require('../snake-game-logic');

describe('Snake Game Integration Tests', () => {
  let game;

  beforeEach(() => {
    game = new SnakeGame(20, 400);
  });

  test('should play a complete game scenario', () => {
    // Start the game
    game.startGame();
    expect(game.gameRunning).toBe(true);

    // Set direction and move
    game.setDirection(1, 0); // Move right
    let result = game.update();
    expect(result.continue).toBe(true);
    expect(game.snake[0].x).toBe(11);

    // Continue moving until we find food or hit a wall
    let moves = 0;
    while (result.continue && moves < 100) {
      result = game.update();
      moves++;
      
      if (result.gameOver) {
        expect(game.gameRunning).toBe(false);
        break;
      }
    }

    // Game should either be over or still running
    expect(typeof result.gameOver).toBe('boolean');
    expect(typeof result.continue).toBe('boolean');
  });

  test('should handle pause and resume correctly', () => {
    game.startGame();
    game.setDirection(1, 0);
    
    // Play for a few moves
    game.update();
    game.update();
    const snakePositionBeforePause = [...game.snake];
    
    // Pause the game
    game.pauseGame();
    expect(game.gamePaused).toBe(true);
    
    // Try to update while paused - should not change state
    const result = game.update();
    expect(result).toEqual({ gameOver: false, continue: false });
    expect(game.snake).toEqual(snakePositionBeforePause);
    
    // Resume the game
    game.pauseGame();
    expect(game.gamePaused).toBe(false);
    
    // Should be able to continue playing
    const resumeResult = game.update();
    expect(resumeResult.continue).toBe(true);
  });

  test('should handle food consumption and score increase', () => {
    game.startGame();
    
    // Place food directly in front of snake
    game.food = { x: 11, y: 10 };
    game.setDirection(1, 0);
    
    const initialScore = game.score;
    const initialLength = game.snake.length;
    
    // Move to eat the food
    game.update();
    
    expect(game.score).toBe(initialScore + 1);
    expect(game.snake.length).toBe(initialLength + 1);
    
    // Food should have been regenerated
    expect(game.food.x).toBeGreaterThanOrEqual(0);
    expect(game.food.y).toBeGreaterThanOrEqual(0);
  });

  test('should handle multiple direction changes', () => {
    game.startGame();
    
    // Test a sequence of valid direction changes
    expect(game.setDirection(1, 0)).toBe(true);  // Right
    expect(game.setDirection(0, 1)).toBe(true);  // Down
    expect(game.setDirection(-1, 0)).toBe(true); // Left
    expect(game.setDirection(0, -1)).toBe(true); // Up
    
    // Test invalid reverse direction
    expect(game.setDirection(0, 1)).toBe(false); // Can't go down when going up
    
    expect(game.dx).toBe(0);
    expect(game.dy).toBe(-1);
  });

  test('should maintain game state consistency', () => {
    game.startGame();
    game.setDirection(1, 0);
    
    for (let i = 0; i < 10; i++) {
      const stateBefore = game.getGameState();
      const result = game.update();
      const stateAfter = game.getGameState();
      
      if (result.gameOver) {
        expect(stateAfter.gameRunning).toBe(false);
        break;
      }
      
      // Snake should have moved
      expect(stateAfter.snake[0].x).not.toBe(stateBefore.snake[0].x);
      
      // Score should be same or increased
      expect(stateAfter.score).toBeGreaterThanOrEqual(stateBefore.score);
      
      // Game should still be running
      expect(stateAfter.gameRunning).toBe(true);
    }
  });
});
