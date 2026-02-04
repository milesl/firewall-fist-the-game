# FIREWALL FIST - Browser Game Brief & Technical Specification

## Project Overview
A retro Streets of Rage style beat-'em-up browser game based on the Firewall Fist film concept, where IT engineer Lee physically fights cyber criminals in a single mission MVP.

---

## Design Brief

### Core Concept
Lee, mild-mannered infrastructure engineer, must defend Sprint's data centre from the ROOT_CAUSE hacking collective using his ancient martial art "The Way of the Thousand Packets."

### Visual Style
- **Aesthetic**: Late 80s/early 90s arcade beat-'em-up (Streets of Rage, Final Fight)
- **Art Style**: Pixel art with retro CRT effects
- **Colour Palette**: Cyber-punk inspired - neon pinks, cyans, purples against dark backgrounds
- **Character Design**: Based on uploaded images - brown/tan gi uniform with yellow/gold trim, black gloves, glasses, ginger/red hair
- **Environment**: Data centre setting with server racks, cable trays, blinking lights

### Gameplay Loop (MVP)
1. **Single Level**: Inside Sprint data centre
2. **Wave-based Combat**: Enemies spawn in groups
3. **Simple Controls**: Move, punch, kick, special move
4. **Win Condition**: Defeat all hackers (3-4 waves)
5. **Lose Condition**: Health reaches zero

### Tone & Humour
- Self-aware absurdity (physically fighting cyber criminals)
- Tech industry in-jokes (enemies named after attack types)
- Serious martial arts action with ridiculous premise
- UI displays tech jargon mixed with combat stats

---

## Technical Specification

### Technology Stack
- **Core**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Graphics**: HTML5 Canvas API
- **Audio**: Web Audio API (optional for MVP)
- **No dependencies** - completely self-contained single file

### Game Architecture

#### File Structure
```
firewall-fist-game.html (single file containing all code)
├── HTML structure
├── CSS styling (embedded)
├── JavaScript game engine (embedded)
└── Base64 encoded assets (if needed)
```

#### Core Systems

**1. Game State Manager**
```javascript
GameState {
    - MENU
    - PLAYING
    - PAUSED
    - GAME_OVER
    - VICTORY
}
```

**2. Player System**
- Position (x, y, z-depth for 3D plane)
- Health (100 HP)
- Actions: idle, walk, punch, kick, special
- Facing direction
- Animation frame tracking
- Hitbox collision

**3. Enemy System**
- Enemy types:
  - **DDoS Drone**: Weak, swarms in groups, simple AI
  - **SQL Injector**: Medium strength, ranged attack
  - **Phisher**: Fast movement, grab attacks
  - **Boss - Zero Day**: Final enemy, multiple phases
- AI behaviour: Approach player, attack within range, retreat when hit
- Spawn waves with delay between groups

**4. Combat System**
- Hit detection (rectangle collision)
- Damage calculation
- Knockback physics
- Invincibility frames after hit
- Combo counter

**5. Rendering System**
- Camera/viewport (fixed side-view)
- Layered rendering (background → enemies → player → UI)
- Sprite animation (frame-based)
- Particle effects (punch impacts, explosions)

**6. Input System**
- Keyboard controls:
  - Arrow keys / WASD: Movement
  - Z / J: Punch
  - X / K: Kick  
  - C / L: Special move
  - Enter: Pause
  - Space: Start game

### Visual Specifications

#### Canvas Resolution
- Base resolution: 800x600 (4:3 aspect, scaled to fit viewport)
- Pixel-perfect rendering with integer scaling

#### Character Sprites
- Player sprite: 64x64 pixels
- Enemy sprites: 48x48 to 64x64 pixels
- Simple pixel art (procedurally drawn or basic shapes)
- Animation frames: 4-6 per action

#### UI Elements
- **HUD**: Top bar showing health, score, wave number
- **Retro CRT effects**: Scanlines, slight colour aberration
- **Arcade-style text**: Pixelated font, neon colours
- **"Insert Coin" style messaging**

#### Background
- Data centre environment
- Server racks (parallax layers)
- Blinking LEDs
- Cable management in ceiling
- Raised floor grid pattern

### Performance Targets
- 60 FPS on modern browsers
- < 500KB total file size
- Instant loading (no external assets)
- Mobile-friendly (responsive canvas scaling)

### Animation Frame Rates
- Player animations: 12 FPS (5 frames per second sprite change)
- Enemy animations: 8-10 FPS
- Particle effects: 60 FPS

### Collision Detection
- Rectangle-based (AABB - Axis-Aligned Bounding Box)
- Z-depth sorting for 3D plane illusion
- Attack hitboxes larger than character sprite

### Audio (Optional for MVP)
- 8-bit style sound effects
- Retro synth background music
- Generated using Web Audio API (no external files)

---

## MVP Feature List

### Must Have (Core MVP)
- [ ] Single playable level
- [ ] Player character with movement and 2 attacks
- [ ] 1-2 basic enemy types
- [ ] Wave-based enemy spawning (3 waves minimum)
- [ ] Health system and game over state
- [ ] Basic collision detection
- [ ] Score tracking
- [ ] Start screen and victory screen
- [ ] Retro visual styling (CRT effects, neon colours)

### Should Have (Enhanced MVP)
- [ ] 3 enemy types with different behaviours
- [ ] Special move with cooldown
- [ ] Combo system
- [ ] Boss enemy
- [ ] More polished animations
- [ ] Particle effects
- [ ] Sound effects

### Could Have (Future Iterations)
- [ ] Multiple levels
- [ ] Power-ups
- [ ] High score system (localStorage)
- [ ] Mobile touch controls
- [ ] Background music
- [ ] More enemy varieties
- [ ] Story cutscenes

### Won't Have (Out of Scope)
- Multiplayer
- Save games
- Level editor
- External asset loading

---

## Enemy Design Specifications

### DDoS Drone
- **Appearance**: Small, hunched figure with laptop
- **Behaviour**: Swarms, weak attacks, dies in 1-2 hits
- **Special**: Spawns in groups of 3-4
- **Attack**: Quick jab (low damage)

### SQL Injector  
- **Appearance**: Medium build, hoodie, typing gesture
- **Behaviour**: Keeps distance, ranged attacks
- **Special**: Throws "code packets" from range
- **Attack**: Projectile (medium damage)

### Zero Day Boss
- **Appearance**: Larger, more detailed, dramatic pose
- **Behaviour**: Multiple attack patterns, teleports
- **Special**: Phase 2 at 50% health - becomes faster
- **Attack**: Combo attacks, area effect

---

## Tech Jokes & Easter Eggs

### Enemy Names (Display on Defeat)
- "404 - HACKER NOT FOUND"
- "CONNECTION TERMINATED"
- "PACKET DROPPED"
- "ACCESS DENIED"

### UI Messages
- "FIREWALL STATUS: ACTIVE"
- "PACKETS SECURED: [score]"
- "BANDWIDTH: [health bar]"
- "PING: OPTIMAL"

### Special Move Names
- "FORCE QUIT FIST"
- "BANDWIDTH BREAKER"
- "THE THOUSAND PACKETS STRIKE"

---

## Development Phases

### Phase 1: Core Engine (Foundation)
- Canvas setup and game loop
- Basic player movement
- Camera/viewport system
- Input handling

### Phase 2: Combat System
- Player attack animations
- Hit detection
- Health system
- Basic enemy AI

### Phase 3: Content & Polish
- Multiple enemy types
- Wave system
- Victory/defeat states
- Visual effects and polish

### Phase 4: Juice & Feel
- Screen shake
- Hit pause
- Particle effects
- Sound effects
- CRT post-processing

---

## Success Criteria

The MVP will be considered successful if it:
1. Loads instantly in browser (no external dependencies)
2. Provides 2-3 minutes of engaging gameplay
3. Captures retro beat-'em-up feel
4. Makes the "Firewall Fist" joke land
5. Has polished, distinctive retro aesthetic
6. Runs smoothly at 60 FPS
7. Is genuinely fun to play through once

---

## Questions to Resolve

1. **Art style detail level**: How detailed should pixel art be? Simple geometric shapes vs hand-drawn sprites?
2. **Difficulty balance**: Should MVP be easy to complete or provide challenge?
3. **Animation priority**: Which animations are most important for feel?
4. **Sound**: Include simple sound effects in MVP or purely visual?
5. **Mobile support**: Should MVP include touch controls or keyboard only?