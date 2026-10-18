(() => {
  const COLS = 20;
  const ROWS = 20;
  const TICK_MS = 110;

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayHint = document.getElementById("overlay-hint");
  const startBtn = document.getElementById("start-btn");
  const scoreEl = document.getElementById("score");
  const highEl = document.getElementById("high");

  const cell = canvas.width / COLS;
  const DIRS = {
    up: { x: 0, y: -1, opposite: "down" },
    down: { x: 0, y: 1, opposite: "up" },
    left: { x: -1, y: 0, opposite: "right" },
    right: { x: 1, y: 0, opposite: "left" },
  };

  let snake;
  let dir;
  let queuedDir;
  let food;
  let score;
  let high = Number(localStorage.getItem("snake-high") || 0);
  let running = false;
  let paused = false;
  let timer = null;

  highEl.textContent = String(high);

  function reset() {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ];
    dir = "right";
    queuedDir = "right";
    score = 0;
    scoreEl.textContent = "0";
    placeFood();
  }

  function placeFood() {
    const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
    const empty = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const key = `${x},${y}`;
        if (!occupied.has(key)) empty.push({ x, y });
      }
    }
    food = empty[Math.floor(Math.random() * empty.length)];
  }

  function setDir(next) {
    if (!DIRS[next]) return;
    const current = queuedDir;
    if (DIRS[next].opposite === current) return;
    queuedDir = next;
  }

  function step() {
    if (!running || paused) return;
    dir = queuedDir;
    const head = snake[0];
    const next = { x: head.x + DIRS[dir].x, y: head.y + DIRS[dir].y };

    const hitWall = next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS;
    const hitSelf = snake.some((p) => p.x === next.x && p.y === next.y);
    if (hitWall || hitSelf) {
      gameOver();
      return;
    }

    snake.unshift(next);
    if (food && next.x === food.x && next.y === food.y) {
      score += 10;
      scoreEl.textContent = String(score);
      if (score > high) {
        high = score;
        highEl.textContent = String(high);
        localStorage.setItem("snake-high", String(high));
      }
      if (snake.length === COLS * ROWS) {
        win();
        return;
      }
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function drawGrid() {
    ctx.fillStyle = "#101814";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(61, 214, 140, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * cell + 0.5, 0);
      ctx.lineTo(i * cell + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let i = 1; i < ROWS; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, i * cell + 0.5);
      ctx.lineTo(canvas.width, i * cell + 0.5);
      ctx.stroke();
    }
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function draw() {
    drawGrid();
    if (food) {
      ctx.fillStyle = "#ff6b6b";
      roundRect(food.x * cell + 5, food.y * cell + 5, cell - 10, cell - 10, 8);
      ctx.fill();
    }
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? "#7dffb3" : "#3dd68c";
      roundRect(seg.x * cell + 2, seg.y * cell + 2, cell - 4, cell - 4, 7);
      ctx.fill();
    });
  }

  function showOverlay(title, hint, buttonText) {
    overlayTitle.textContent = title;
    overlayHint.textContent = hint;
    startBtn.textContent = buttonText;
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startLoop() {
    if (timer) clearInterval(timer);
    timer = setInterval(step, TICK_MS);
  }

  function startGame() {
    reset();
    running = true;
    paused = false;
    hideOverlay();
    draw();
    startLoop();
  }

  function togglePause() {
    if (!running) {
      startGame();
      return;
    }
    paused = !paused;
    if (paused) {
      showOverlay("已暂停", "按空格继续", "继续");
    } else {
      hideOverlay();
    }
  }

  function gameOver() {
    running = false;
    paused = false;
    if (timer) clearInterval(timer);
    draw();
    showOverlay("游戏结束", `本局分数 ${score}`, "再来一局");
  }

  function win() {
    running = false;
    paused = false;
    if (timer) clearInterval(timer);
    draw();
    showOverlay("全屏吃满", `满分 ${score}`, "再来一局");
  }

  const keyMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    a: "left",
    s: "down",
    d: "right",
    W: "up",
    A: "left",
    S: "down",
    D: "right",
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      togglePause();
      return;
    }
    const next = keyMap[event.key];
    if (!next) return;
    event.preventDefault();
    if (!running) startGame();
    setDir(next);
  });

  startBtn.addEventListener("click", () => {
    if (running && paused) {
      paused = false;
      hideOverlay();
      return;
    }
    startGame();
  });

  document.querySelectorAll(".pad button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.getAttribute("data-dir");
      if (!running) startGame();
      setDir(next);
    });
  });

  reset();
  draw();
})();
