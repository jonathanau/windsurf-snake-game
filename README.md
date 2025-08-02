# Snake Game

A classic Snake game implementation built with HTML5 Canvas and JavaScript. Navigate the snake to eat food, grow longer, and achieve the highest score possible!

## Features

- **Classic Gameplay**: Control the snake using arrow keys or WASD
- **Score Tracking**: Current score and high score display
- **Modern UI**: Dark theme with neon green styling and glowing effects
- **Responsive Design**: Centered layout that works on different screen sizes
- **Game Over Detection**: Collision detection with walls and self
- **Persistent High Score**: High score is saved locally in your browser

## Game Controls

- **Arrow Keys** or **WASD**: Move the snake
  - ↑ / W: Move up
  - ↓ / S: Move down
  - ← / A: Move left
  - → / D: Move right

## How to Run Locally

### Prerequisites

You need a web browser and a simple HTTP server. Here are several options:

### Option 1: Python HTTP Server (Recommended)

If you have Python installed:

```bash
# Navigate to the game directory
cd snake-game

# Python 3
python3 -m http.server 8000

# Or Python 2
python -m SimpleHTTPServer 8000
```

Then open your browser and go to: `http://localhost:8000`

### Option 2: Node.js HTTP Server

If you have Node.js installed:

```bash
# Install a simple HTTP server globally
npm install -g http-server

# Navigate to the game directory
cd snake-game

# Start the server
http-server -p 8000
```

Then open your browser and go to: `http://localhost:8000`

### Option 3: Live Server (VS Code Extension)

If you're using Visual Studio Code:

1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 4: Other Web Servers

You can use any web server of your choice. Just serve the files from the project directory and access `index.html`.

## Game Rules

1. **Objective**: Guide the snake to eat the red food squares
2. **Growth**: Each food item eaten makes the snake grow longer and increases your score
3. **Game Over**: The game ends if the snake hits the walls or collides with itself
4. **Scoring**: Each food item is worth 10 points
5. **High Score**: Your best score is automatically saved and displayed

## File Structure

```
snake-game/
├── index.html          # Main HTML file with game layout and styling
├── snake.js           # Main game logic and rendering
├── snake-game-logic.js # Core game mechanics and state management
├── package.json       # Project metadata and dependencies
├── jest.setup.js      # Test configuration
├── __tests__/         # Test files
└── README.md          # This file
```

## Development

The game is built with vanilla JavaScript and HTML5 Canvas for optimal performance and compatibility.

### Running Tests

```bash
npm install
npm test
```

## Browser Compatibility

This game works in all modern browsers that support HTML5 Canvas:
- Chrome 4+
- Firefox 2+
- Safari 3.1+
- Edge (all versions)
- Opera 9+

## Contributing

Feel free to fork this project and submit pull requests for improvements or bug fixes!

## License

This project is open source and available under the MIT License.
