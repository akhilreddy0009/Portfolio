const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Menu elements
const menuOverlay = document.getElementById("menuOverlay");
const playBtn = document.getElementById("playBtn");
const scoresBtn = document.getElementById("scoresBtn");
const scoresPanel = document.getElementById("scoresPanel");
const scoresList = document.getElementById("scoresList");
const backBtn = document.getElementById("backBtn");

// Load assets
const bg = new Image();
bg.src = "assets/background.png";

const birdImg = new Image();
birdImg.src = "assets/bird_sprite.png";

const topPipeImg = new Image();
topPipeImg.src = "assets/top_pipe.png";

const bottomPipeImg = new Image();
bottomPipeImg.src = "assets/bottom_pipe.png";

// ===== Bird sprite animation setup =====
const birdX = 100;
const birdSize = 40;

// Change this if your sprite sheet has different frames
const birdFrameCount = 1; // assumes 3 frames horizontally
let birdFrameIndex = 0;
let birdFrameTimer = 0;
const birdFrameInterval = 6; // frames between switches

let birdSpriteReady = false;
let birdFrameWidth = 0;

birdImg.onload = () => {
  birdSpriteReady = true;
  birdFrameWidth = birdImg.width / birdFrameCount;
  // Draw once in case background not yet drawn
  ctx.drawImage(
    birdImg,
    0,
    0,
    birdFrameWidth,
    birdImg.height,
    birdX,
    150,
    birdSize,
    birdSize
  );
};

// Game variables
let birdY = 150;
let velocity = 0;
const gravity = 0.5;

let pipes = [];
let score = 0;
let gameStarted = false;
let gameOver = false;
let gamePaused = false;
let inMenu = true; // true when menu overlay is active
let speed = 2; // pipe speed, increases with score

// ===== High score handling =====
function getScores() {
  return JSON.parse(localStorage.getItem("scores")) || [];
}

function resetGame() {
  birdY = 150;
  velocity = 0;
  score = 0;
  speed = 2;
  pipes = [
    {
      x: canvas.width,
      height: Math.floor(Math.random() * 200) + 100,
      scored: false,
    },
  ];
}

function saveScore(name, score) {
  const scores = getScores();
  scores.push({ name, score });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem("scores", JSON.stringify(scores.slice(0, 5)));
}

function showHighScoresCanvas() {
  const scores = getScores();
  ctx.font = "18px monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("High Scores:", canvas.width / 2, canvas.height / 2 + 110);

  scores.forEach((entry, i) => {
    ctx.fillText(
      `${i + 1}. ${entry.name}: ${entry.score}`,
      canvas.width / 2,
      canvas.height / 2 + 135 + i * 20
    );
  });
  ctx.textAlign = "left";
}

function updateHighScoresPanel() {
  const scores = getScores();
  scoresList.innerHTML = "";
  if (scores.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No scores yet. Play a game!";
    scoresList.appendChild(li);
    return;
  }
  scores.forEach((entry, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${entry.name} — ${entry.score}`;
    scoresList.appendChild(li);
  });
}

// ===== Menu control =====
function showMenu() {
  inMenu = true;
  gameStarted = false;
  gameOver = false;
  gamePaused = false;
  menuOverlay.style.display = "flex";
  scoresPanel.style.display = "none";
}

function hideMenu() {
  inMenu = false;
  menuOverlay.style.display = "none";
}

function startGame() {
  hideMenu();
  resetGame();
  gameStarted = true;
  gameOver = false;
  gamePaused = false;
  requestAnimationFrame(draw);
}

// Button events
playBtn.addEventListener("click", () => {
  startGame();
});

scoresBtn.addEventListener("click", () => {
  updateHighScoresPanel();
  scoresPanel.style.display = "block";
});

backBtn.addEventListener("click", () => {
  scoresPanel.style.display = "none";
});

// ===== Input handling =====
document.addEventListener("keydown", (e) => {
  // Space: jump / start / restart
  if (e.code === "Space") {
    // If we are in the menu, start the game
    if (inMenu) {
      startGame();
      return;
    }

    // Restart if game over or not yet started
    if (!gameStarted || gameOver) {
      if (gameOver) {
        const playerName = prompt("Enter your name:");
        if (playerName) {
          saveScore(playerName, score);
        }
      }
      resetGame();
      gameStarted = true;
      gameOver = false;
      gamePaused = false;
      requestAnimationFrame(draw);
    }

    // Jump only if not paused or over
    if (!gameOver && !gamePaused) {
      velocity = -8;
    }
  }

  // P: pause / unpause
  if (e.code === "KeyP" && gameStarted && !gameOver) {
    gamePaused = !gamePaused;
    if (!gamePaused) {
      requestAnimationFrame(draw);
    } else {
      // Draw one frame with "Paused" overlay
      draw();
    }
  }
});

// ===== Draw the bird (sprite animation) =====
function drawBird() {
  if (!birdSpriteReady || birdFrameWidth === 0) {
    // Fallback just in case
    ctx.drawImage(birdImg, birdX, birdY, birdSize, birdSize);
    return;
  }

  // Advance animation only when game is running
  if (!gamePaused && !gameOver && gameStarted) {
    birdFrameTimer++;
    if (birdFrameTimer >= birdFrameInterval) {
      birdFrameTimer = 0;
      birdFrameIndex = (birdFrameIndex + 1) % birdFrameCount;
    }
  }

  const sx = birdFrameIndex * birdFrameWidth;
  ctx.drawImage(
    birdImg,
    sx,
    0,
    birdFrameWidth,
    birdImg.height,
    birdX,
    birdY,
    birdSize,
    birdSize
  );
}

// ===== Main draw loop =====
function draw() {
  // Background
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // If game hasn't started and we're not in menu, show text start screen
  if (!gameStarted && !gameOver && !inMenu) {
    ctx.fillStyle = "#00ffff";
    ctx.font = "28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Press SPACE to Start", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "left";
    return;
  }

  // ===== Update game state (if not paused or over) =====
  if (!gamePaused && !gameOver && gameStarted) {
    // Bird physics
    velocity += gravity;
    birdY += velocity;

    // Clamp top
    if (birdY < 0) {
      birdY = 0;
      velocity = 0;
    }

    // Pipes movement and logic
    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];

      // Move pipe
      p.x -= speed;

      // Score when bird passes pipe
      if (!p.scored && p.x + 60 < birdX) {
        score++;
        p.scored = true;

        // Increase difficulty every 5 points
        if (score % 5 === 0 && speed < 6) {
          speed += 0.5;
        }
      }

      // Collision detection
      const inXRange = birdX + birdSize > p.x && birdX < p.x + 60;
      const inGap = birdY > p.height && birdY + birdSize < p.height + 120;

      if (inXRange && !inGap) {
        gameOver = true;
        gameStarted = false;
      }

      // Remove off-screen pipes
      if (p.x + 60 < 0) {
        pipes.splice(i, 1);
        i--;
      }
    }

    // Add new pipes when last pipe is far enough left
    const lastPipe = pipes[pipes.length - 1];
    if (lastPipe && lastPipe.x < canvas.width - 220) {
      pipes.push({
        x: canvas.width,
        height: Math.floor(Math.random() * 200) + 100,
        scored: false,
      });
    }

    // Ground collision (bottom of canvas)
    const ground = canvas.height - birdSize;
    if (birdY > ground) {
      birdY = ground;
      gameOver = true;
      gameStarted = false;
    }
  }

  // ===== Rendering =====
  // Draw pipes
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    // Top pipe
    ctx.drawImage(topPipeImg, p.x, 0, 60, p.height);
    // Bottom pipe
    ctx.drawImage(
      bottomPipeImg,
      p.x,
      p.height + 120,
      60,
      canvas.height - p.height - 120
    );
  }

  // Draw bird (animated)
  drawBird();

  // Score
  ctx.fillStyle = "#ffffff";
  ctx.font = "24px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 10, 35);

  // Paused overlay
  if (gamePaused && !gameOver && gameStarted) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00ffff";
    ctx.font = "28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    ctx.font = "16px monospace";
    ctx.fillText("Press P to Resume", canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = "left";
    return; // don't continue loop while paused
  }

  // Game Over screen
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff4444";
    ctx.font = "32px monospace";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = "24px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 15);

    ctx.font = "18px monospace";
    ctx.fillText("Press SPACE to Restart", canvas.width / 2, canvas.height / 2 + 50);

    showHighScoresCanvas();
    ctx.textAlign = "left";
    return;
  }

  // Continue loop
  if (gameStarted && !gamePaused) {
    requestAnimationFrame(draw);
  }
}

// ===== Initial setup once background loads =====
bg.onload = () => {
  resetGame();
  showMenu(); // Start with menu visible
  draw();
};
