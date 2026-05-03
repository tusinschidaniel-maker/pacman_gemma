# Smooth Pacman

A modern, fluid, and responsive Pacman clone built entirely with HTML5 Canvas, CSS3, and JavaScript.

## Features
- **Smooth Movement:** Physics-based vector movement allowing Pacman to glide smoothly, breaking away from the rigid grid-snapping of older clones.
- **Modern Retro Aesthetic:** Combines a sleek, dark glassmorphic UI with the classic "Press Start 2P" pixelated font for a fresh yet nostalgic feel.
- **Responsive Controls:** Play effortlessly on desktop using Arrow Keys, or on mobile devices using intuitive swipe gestures.
- **Classic Mechanics:** Includes standard pellets, power pellets to frighten ghosts, screen-wrapping tunnels, and scoring.
- **Persistent High Scores:** Your best score is automatically saved locally so you can try to beat it on your next session!

## File Structure
- `index.html`: The main entry point containing the game canvas and UI overlays.
- `styles.css`: Holds all the styling, including the pixelated theme, flexbox layouts, and responsive scaling.
- `game.js`: The core engine driving the game loop, map rendering, Pacman's physics, and the Ghosts' tile-center routing AI.

## How to Play

### Running Locally
You don't need any complex build tools to run this game. It runs entirely in your browser!

1. Open your terminal and navigate to this directory:
   ```bash
   cd /Users/danielmarin/html_git/html_Pacman
   ```
2. Start a simple local server (recommended to avoid CORS issues if you expand the game later):
   ```bash
   python3 -m http.server 8000
   ```
3. Open your web browser and go to:
   `http://localhost:8000`

*(Alternatively, you can just double-click the `index.html` file to open it directly in your browser!)*

### Controls
- **Desktop:** Use the `ArrowUp`, `ArrowDown`, `ArrowLeft`, and `ArrowRight` keys to navigate the maze.
- **Mobile/Tablet:** Simply swipe up, down, left, or right on the game screen to change direction.

## Credits
Developed as an interactive, modern take on the arcade classic. Enjoy!
