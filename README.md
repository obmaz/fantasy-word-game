# Fantasy Word Game (킹왕짱 RPG)

## Overview
The Fantasy Word Game is a mobile-friendly, word guessing RPG game that challenges players to match words in a fun and engaging fantasy-themed environment. This project includes a responsive design optimized for mobile devices with a 9:16 aspect ratio.

## Project Structure
```
fantasy-word-game/
├── src/
│   ├── index.html                    # Main HTML document for the game
│   ├── styles/
│   │   ├── variables.css             # CSS variables and global styles
│   │   ├── animations.css             # Animation definitions
│   │   ├── title.css                  # Title screen styles
│   │   ├── game.css                   # Game screen styles
│   │   ├── buttons.css                # Button styles
│   │   ├── panels.css                 # Panel styles (shop, inventory, statistics)
│   │   ├── popup-common.css           # Common popup styles
│   │   ├── practice-mode-popup.css    # Practice mode popup styles
│   │   ├── battle-mode-popup.css      # Battle mode popup styles
│   │   ├── battle-mode-screen.css     # Battle mode story screen styles
│   │   └── boss-mode-screen.css       # Boss mode story screen styles
│   ├── scripts/
│   │   ├── app.js                     # Main game logic and UI management
│   │   ├── words.js                   # Word data and word-related functions
│   │   ├── items.js                   # Item data and item-related functions
│   │   └── data-loader.js             # Data loading and management
│   ├── data/
│   │   ├── game-data-1.js             # Game data set 1 (능률 보카 중등 기본)
│   │   ├── game-data-2.js             # Game data set 2 (워드 마스터 중등 고난도)
│   │   ├── items-data.js              # Item definitions and properties
│   │   └── background_music.mp3       # Background music file
│   └── images/
│       ├── battle_mode/               # Battle mode game images
│       │   ├── background.webp        # Game battle background
│       │   ├── hero.webp              # Hero character image
│       │   ├── monster_1.webp         # Monster sprite 1
│       │   ├── monster_2.webp         # Monster sprite 2
│       │   ├── monster_3.webp          # Monster sprite 3
│       │   ├── boss_mode_popup.webp # Story screen background (used for all modes: practice, battle, boss)
│       │   ├── battle_mode_select_popup.webp    # Battle mode settings popup
│       │   └── practice_mode_select_popup .webp # Practice mode settings popup
│       ├── title/                     # Title screen images
│       │   ├── title.webp             # Title screen background
│       │   ├── title_header_1.webp    # Title header image 1
│       │   ├── title_header_2.webp    # Title header image 2
│       │   ├── title_header_3.webp    # Title header image 3
│       │   ├── title_header_4.webp    # Title header image 4
│       │   ├── practice_mode_btn.webp      # Practice mode button
│       │   ├── battle_mode_btn.webp   # Battle mode button
│       │   ├── boss_mode_btn.webp     # Boss mode button
│       │   ├── shop_btn.webp          # Shop button
│       │   ├── inventory_btn.webp     # Inventory button
│       │   ├── statistics_btn.webp    # Statistics button
│       │   ├── settings_btn.webp      # Settings button
│       │   ├── exit_btn.webp          # Exit button
│       │   ├── apply_btn.webp         # Apply button
│       │   └── factory_reset_btn.webp # Factory reset button
│       └── backup/                    # Backup images
│           └── battle_start_btn.webp
├── .gitignore
├── package.json
└── README.md
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
3. Select a game data set from the dropdown (능률 보카 중등 기본 or 워드 마스터 중등 고난도).
4. Choose a game mode and enjoy the game!

## Features

### Multiple Game Modes
- **Practice Mode (연습 모드)**: Practice with selected days and difficulty levels
- **Battle Mode (배틀 모드)**: Face enemies from all days in random order with configurable question types (objective, mixed, subjective)
- **Boss Mode (보스 모드 / 무한의 전장)**: Endless boss battles for high scores

### Gameplay Features
- Word matching gameplay with Korean-English translations
- Multiple question types:
  - **Objective (객관식)**: Multiple choice questions
  - **Subjective (주관식)**: Type the answer (boss battles)
  - **Mixed (혼합형)**: Combination of both types
- Boss battles requiring typed answers
- Skill system (힌트/Hint, 필살기/Ultimate)
- Gold and inventory management
- Shop system to purchase items
- Equipment system with durability
- Statistics tracking

### UI Features
- Responsive design optimized for mobile devices (9:16 aspect ratio)
- Image-based UI with precise button mapping
- Real-time gold and timer display
- Vibration feedback on mobile devices
- Background music with loop playback
- Back button navigation support
- Multiple game data sets support

## How to Play

### Starting the Game
1. **Select Game Data Set:**
   - Choose from the dropdown on the title screen
   - Available sets: "능률 보카 중등 기본" or "워드 마스터 중등 고난도"

2. **Select Game Mode:**
   - **Practice Mode**: Choose a specific day and difficulty level
   - **Battle Mode**: Configure question type and difficulty
   - **Boss Mode**: Start endless boss battles immediately

3. **Configure Adventure Settings (Practice/Battle Mode):**
   - Select "모험 지역" (Adventure Area) - the day/story to play
   - Select "난이도" (Difficulty) - number of monsters (5, 10, or 20)
   - **Battle Mode only**: Select question type (객관식/혼합형/주관식)
   - Click "시작하기" (Start) to begin

4. **Gameplay:**
   - **Normal Monsters**: You will be given a word or meaning and must choose the correct translation from multiple options
   - **Boss Monsters**: You will be given a meaning and must type the correct word in the input field
   - Answer correctly to defeat monsters and earn gold
   - Answer incorrectly to take damage (your durability decreases)

5. **Skills:**
   - **힌트 (Hint)**: Get a hint for the current question
   - **필살기 (Ultimate)**: Automatically answer the current question correctly

6. **Shop and Inventory:**
   - Visit the shop to purchase items with gold
   - Manage your inventory and equip items
   - Items have durability that decreases with use

7. **Statistics:**
   - View your game statistics including solved problems, correct answers, and accuracy rate

8. **Win Condition:**
   - Defeat all monsters in the selected difficulty level
   - Boss battles give higher rewards than normal monsters

## Game Modes

### Practice Mode (연습 모드)
- Practice with specific days and difficulty levels
- Choose any day from the available catalog
- Configure difficulty (5, 10, or 20 monsters)
- Perfect for focused learning on specific word sets

### Battle Mode (배틀 모드)
- Face enemies from all days in random order
- Test your knowledge across all learned words
- Configurable question types:
  - **Objective (객관식)**: Only multiple choice questions
  - **Mixed (혼합형)**: Combination of multiple choice and typing (50% each, alternating)
  - **Subjective (주관식)**: Only typing questions (boss battles)
- More challenging as you don't know what's coming next

### Boss Mode (보스 모드 / 무한의 전장)
- Endless boss battles
- All questions are boss-type (require typing)
- Compete for high scores
- No limit on how many bosses you can defeat

## Boss Battles
- **Practice Mode**: At least 20% of questions are boss battles, with a minimum of one boss battle per game
- **Battle Mode**: Boss battle frequency depends on question type:
  - Objective mode: No boss battles (all multiple choice)
  - Mixed mode: 50% boss battles (alternating with multiple choice)
  - Subjective mode: All questions are boss battles
- Boss battles require typing the answer instead of choosing from multiple options
- Defeating a boss gives higher gold rewards than normal monsters
- In Boss Mode, all questions are boss battles

## Technical Details

### CSS Architecture
- **Modular CSS**: Styles are separated into multiple files for better organization
- **Mode-specific styles**: Each game mode has its own CSS file for popup and screen styles
- **Common styles**: Shared styles are in `popup-common.css`
- **CSS Variables**: Global variables defined in `variables.css`

### Image-Based UI
- The game uses image-based UI elements with precise button mapping
- Button positions are calculated relative to background images
- Supports different layouts for different game modes
- All images are in WebP format for optimal performance

### Data Management
- **Multiple Data Sets**: Support for multiple game data sets (game-data-1.js, game-data-2.js)
- **Dynamic Loading**: Data loader manages switching between data sets
- **Decoy Words**: Multiple-choice distractors are dynamically generated
- **Story Data**: Each day has unique story content (title, intro, win messages)

### Mobile Optimization
- Optimized for mobile devices with touch controls
- Vibration feedback on damage (mobile devices)
- Responsive design that adapts to different screen sizes
- Background music with autoplay support
- Back button navigation support

### Data Storage
- Game progress is saved to localStorage
- Gold, inventory, equipment, and statistics are persisted between sessions
- Last selected day and difficulty are remembered

## File Organization

### Styles
- `variables.css`: CSS variables and global styles
- `animations.css`: Animation keyframes and transitions
- `title.css`: Title screen layout and styling
- `game.css`: Game screen layout and battle arena
- `buttons.css`: Button styles for all game modes
- `panels.css`: Shop, inventory, and statistics panel styles
- `popup-common.css`: Common popup overlay and container styles
- Mode-specific popup/screen CSS files for each game mode

### Scripts
- `app.js`: Main game logic, UI management, and game flow
- `words.js`: Word data processing and day catalog management
- `items.js`: Item definitions and inventory management
- `data-loader.js`: Data set loading and switching logic

### Data
- `game-data-1.js`: First game data set (능률 보카 중등 기본)
- `game-data-2.js`: Second game data set (워드 마스터 중등 고난도)
- `items-data.js`: Item definitions, shop items, and equipment data

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the ISC License.
