# Fantasy Word Game (킹왕짱 RPG)

## Overview
The Fantasy Word Game is a mobile-friendly, word guessing RPG game that challenges players to match words in a fun and engaging fantasy-themed environment. This project includes a responsive design optimized for mobile devices with a 9:16 aspect ratio.

## Project Structure
```
fantasy-word-game
├── src
│   ├── index.html              # Main HTML document for the game
│   ├── styles
│   │   └── style.css           # Styles for the game
│   ├── scripts
│   │   ├── app.js              # Main game logic and UI management
│   │   ├── words.js            # Word data and word-related functions
│   │   └── items.js            # Item data and item-related functions
│   ├── data
│   │   ├── game-data.js        # Story data for different days and modes
│   │   ├── items-data.js      # Item definitions and properties
│   │   └── background_music.mp3 # Background music file
│   ├── images                  # Game assets (backgrounds, buttons, characters)
│   │   ├── title.jpg           # Title screen background
│   │   ├── start.png           # Adventure start screen
│   │   ├── boss_battle.jpg     # Boss battle start screen
│   │   ├── day_select.png      # Adventure settings popup
│   │   ├── background.jpg      # Game battle background
│   │   └── ...                 # Other game images
│   └── README.md               # Project documentation
```

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, etc.)
- Basic understanding of HTML, CSS, and JavaScript

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd fantasy-word-game
   ```

### Running the Game
1. Open `src/index.html` in your web browser.
2. The game will start with the title screen.
3. Enjoy the game!

## Features
- **Multiple Game Modes:**
  - **Story Mode (스토리 모드)**: Progress through 60 different days with unique stories
  - **Chaos Rift (혼돈의 균열)**: Face enemies from all days in random order
  - **Boss Rush (무한의 전장)**: Endless boss battles for high scores

- **Gameplay Features:**
  - Word matching gameplay with Korean-English translations
  - Boss battles requiring typed answers
  - Skill system (힌트/Hint, 필살기/Ultimate)
  - Gold and inventory management
  - Shop system to purchase items
  - Equipment system with durability

- **UI Features:**
  - Responsive design optimized for mobile devices
  - Image-based UI with precise button mapping
  - Real-time gold and timer display
  - Vibration feedback on mobile devices
  - Background music with loop playback
  - Back button navigation support

## How to Play

### Starting the Game
1. **Select Game Mode:**
   - **Story Mode**: Choose a specific day (1-60) and difficulty
   - **Chaos Rift**: Face random enemies from all days
   - **Boss Rush**: Endless boss battles

2. **Configure Adventure Settings:**
   - Select "모험 지역" (Adventure Area) - the day/story to play
   - Select "난이도" (Difficulty) - number of monsters (5, 10, or 20)
   - Click "시작하기" (Start) to begin

3. **Gameplay:**
   - **Normal Monsters**: You will be given a word or meaning and must choose the correct translation from multiple options
   - **Boss Monsters**: You will be given a meaning and must type the correct word in the input field
   - Answer correctly to defeat monsters and earn gold
   - Answer incorrectly to take damage (your durability decreases)

4. **Skills:**
   - **힌트 (Hint)**: Get a hint for the current question
   - **필살기 (Ultimate)**: Automatically answer the current question correctly

5. **Shop and Inventory:**
   - Visit the shop to purchase items with gold
   - Manage your inventory and equip items
   - Items have durability that decreases with use

6. **Win Condition:**
   - Defeat all monsters in the selected difficulty level
   - Boss battles give higher rewards than normal monsters

## Game Modes

### Story Mode (스토리 모드)
- Progress through 60 unique days, each with its own story
- Each day has a specific theme and narrative
- Unlock new content as you progress

### Chaos Rift (혼돈의 균열)
- Face enemies from all days in random order
- Test your knowledge across all learned words
- More challenging as you don't know what's coming next

### Boss Rush (무한의 전장)
- Endless boss battles
- All questions are boss-type (require typing)
- Compete for high scores
- No limit on how many bosses you can defeat

## Boss Battles
- At least 20% of questions in each game are boss battles, with a minimum of one boss battle per game
- Boss battles require typing the answer instead of choosing from multiple options
- Defeating a boss gives higher gold rewards than normal monsters
- In Boss Rush mode, all questions are boss battles

## Technical Details

### Image-Based UI
- The game uses image-based UI elements with precise button mapping
- Button positions are calculated relative to background images
- Supports different layouts for different game modes

### Mobile Optimization
- Optimized for mobile devices with touch controls
- Vibration feedback on damage (mobile devices)
- Responsive design that adapts to different screen sizes
- Background music with autoplay support

### Data Storage
- Game progress is saved to localStorage
- Gold, inventory, and equipment are persisted between sessions

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
