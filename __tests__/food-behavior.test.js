const { SnakeGame } = require('../snake-game-logic');

describe('Food behavior', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('generateRandomFood should not spawn on snake and should set a direction', () => {
    const game = new SnakeGame(20, 400);

    // Force generateRandomFood to first hit the snake at (10,10), then a safe spot (2,4), then pick direction index 0 (up)
    const randomSpy = jest.spyOn(Math, 'random')
      // First attempt -> (10,10) collides with initial snake
      .mockReturnValueOnce(0.5) // x -> 10
      .mockReturnValueOnce(0.5) // y -> 10
      // Second attempt -> (2,4) safe
      .mockReturnValueOnce(0.1) // x -> 2
      .mockReturnValueOnce(0.2) // y -> 4
      // Direction pick: index 0 (up)
      .mockReturnValueOnce(0.0);

    game.generateRandomFood();

    expect(game.food).toEqual({ x: 2, y: 4 });
    expect(game.snake.some(s => s.x === game.food.x && s.y === game.food.y)).toBe(false);
    expect([{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }]).toContainEqual(game.foodDirection);

    randomSpy.mockRestore();
  });

  test('moveFood should not move onto snake and should change direction instead', () => {
    const game = new SnakeGame(20, 400);

    // Place snake and food such that food would move onto snake
    game.snake = [{ x: 5, y: 5 }];
    game.food = { x: 4, y: 5 };
    game.foodDirection = { x: 1, y: 0 }; // Would move into the snake at (5,5)

    // Ensure movement triggers this frame
    game.foodMoveCounter = game.foodMoveInterval - 1;

    // Force new direction to be index 1: down {0,1}
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0.25);

    game.moveFood();

    // Food should NOT have moved into the snake
    expect(game.food).toEqual({ x: 4, y: 5 });
    expect(game.foodDirection).toEqual({ x: 0, y: 1 });

    randomSpy.mockRestore();
  });

  test('moveFood should change direction at boundary and keep position', () => {
    const game = new SnakeGame(20, 400);

    // Place food at left edge moving left (would go out of bounds)
    game.food = { x: 0, y: 7 };
    game.foodDirection = { x: -1, y: 0 };
    game.foodMoveCounter = game.foodMoveInterval - 1;

    // New direction: index 3 -> right {1,0}
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0.9);

    game.moveFood();

    // Position unchanged due to boundary, but direction changed
    expect(game.food).toEqual({ x: 0, y: 7 });
    expect(game.foodDirection).toEqual({ x: 1, y: 0 });

    randomSpy.mockRestore();
  });
});
