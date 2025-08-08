const { SnakeGame } = require('../snake-game-logic');

describe('State immutability and U-turn detection', () => {
  test('getGameState returns new containers (array/object) so external pushes and food edits do not mutate internal state', () => {
    const game = new SnakeGame(20, 400);
    game.startGame();
    game.setDirection(1, 0);
    game.update();

    const state = game.getGameState();

    // Mutate returned state containers
    const prevLength = state.snake.length;
    state.snake.push({ x: 999, y: 999 });
    const prevFoodX = state.food.x;
    state.food.x = prevFoodX + 100;

    // Internal state should not reflect external container mutations
    const internal = game.getGameState();
    expect(internal.snake.length).toBe(prevLength); // push to returned array shouldn't affect internal
    expect(internal.food.x).not.toBe(state.food.x); // returned food object is copied
  });

  test('two rapid valid turns within one tick can cause self-collision (classic U-turn)', () => {
    const game = new SnakeGame(20, 400);

    // Create a 3-length snake moving right
    game.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    game.dx = 1;
    game.dy = 0;

    // Emulate two rapid direction changes before a single move
    expect(game.setDirection(0, -1)).toBe(true); // up
    expect(game.setDirection(-1, 0)).toBe(true); // left (now opposite of original)

    // Perform one move; head should collide with body at (9,10)
    game.moveSnake();
    const collided = game.checkCollision();
    expect(collided).toBe(true);
  });
});
