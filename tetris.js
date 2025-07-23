if (
  window.STARTPAGE_CONFIG &&
  window.STARTPAGE_CONFIG.fun &&
  window.STARTPAGE_CONFIG.fun.tetris === false
) {
  const tetrisEl = document.getElementById("tetris-container") || document.querySelector(".tetris-container");
  if (tetrisEl) tetrisEl.style.display = "none";
} else {
  document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const canvas = document.getElementById("tetris"),
      context = canvas.getContext("2d");
    context.scale(20, 20);
    const previewCanvas = document.getElementById("preview"),
      previewContext = previewCanvas.getContext("2d");
    previewContext.scale(20, 20);
    const holdCanvas = document.getElementById("hold"),
      holdContext = holdCanvas.getContext("2d");
    holdContext.scale(20, 20);

    const createMatrix = (w, h) => Array.from({ length: h }, () => Array(w).fill(0));
    const arena = createMatrix(10, 20);

    // Piece Definitions with 4x4 or 3x3 matrices ---
    const PIECES = {
      'I': {
        matrix: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        // SRS reference point for I piece: 1-indexed (2,2) cell in a 4x4 grid
        // For our 0-indexed matrix, this means relative to the 2nd row, 2nd column of the 4x4.
        // If the piece is [0][0] at player.pos, its SRS pivot is at player.pos.x + 1.5, player.pos.y + 1.5
      },
      'J': {
        matrix: [
          [2, 0, 0],
          [2, 2, 2],
          [0, 0, 0],
        ],
        // SRS reference point for J,L,S,T,Z: (1,1) of their 3x3 bounding box
        // For our 0-indexed matrix, this means relative to the 1st row, 1st column of the 3x3.
        // If the piece is [0][0] at player.pos, its SRS pivot is at player.pos.x + 1, player.pos.y + 1
      },
      'L': {
        matrix: [
          [0, 0, 3],
          [3, 3, 3],
          [0, 0, 0],
        ],
      },
      'O': {
        matrix: [
          [4, 4],
          [4, 4],
        ],
      },
      'S': {
        matrix: [
          [0, 5, 5],
          [5, 5, 0],
          [0, 0, 0],
        ],
      },
      'T': {
        matrix: [
          [0, 6, 0],
          [6, 6, 6],
          [0, 0, 0],
        ],
      },
      'Z': {
        matrix: [
          [7, 7, 0],
          [0, 7, 7],
          [0, 0, 0],
        ],
      },
    };

    function createPiece(type) {
      // Deep clone the matrix so rotations don't affect the original PIECES definition
      return PIECES[type].matrix.map(row => [...row]);
    }


    const colors = [
      null,
      "#00f6ff",
      "#007cff",
      "#ff8300",
      "#ffe700",
      "#00ff7f",
      "#aa00ff",
      "#ff1a1a",
    ];

    let bag = [];
    function refillBag() {
      bag = ["I", "J", "L", "O", "S", "T", "Z"].sort(() => Math.random() - 0.5);
    }
    function getNextPieceType() {
      if (!bag.length) refillBag();
      return bag.pop();
    }
    let nextPieceType = getNextPieceType();

    const player = { pos: { x: 0, y: 0 }, matrix: null, type: null, rotationState: 0, lockDelayTimer: 0, lockResetCount: 0 };
    let holdPiece = null,
      holdUsed = false;

    const BLOCK_SIZE_MULTIPLIER = 0.9;
    const BLOCK_OFFSET = (1 - BLOCK_SIZE_MULTIPLIER) / 2;
    const CORNER_RADIUS = 0.1;

    function drawMatrix(ctx, matrix, offset) {
      matrix.forEach((row, y) =>
        row.forEach((val, x) => {
          if (val) {
            ctx.fillStyle = colors[val];
            ctx.beginPath();
            ctx.roundRect(
              x + offset.x + BLOCK_OFFSET,
              y + offset.y + BLOCK_OFFSET,
              BLOCK_SIZE_MULTIPLIER,
              BLOCK_SIZE_MULTIPLIER,
              CORNER_RADIUS
            );
            ctx.fill();
          }
        })
      );
    }

    function drawGhost() {
      let ghostY = player.pos.y;
      while (!collide(arena, { matrix: player.matrix, pos: { x: player.pos.x, y: ghostY + 1 } }))
        ghostY++;
      context.save();
      context.globalAlpha = 0.3;

      let pieceColorIndex = 0;
      for (let r = 0; r < player.matrix.length; r++) {
          for (let c = 0; c < player.matrix[r].length; c++) {
              if (player.matrix[r][c] !== 0) {
                  pieceColorIndex = player.matrix[r][c];
                  break;
              }
          }
          if (pieceColorIndex !== 0) {
              break;
          }
      }

      context.fillStyle = colors[pieceColorIndex] || '#CCCCCC';
      player.matrix.forEach((row, y) =>
          row.forEach((val, x) => {
              if (val) {
                  context.beginPath();
                  context.roundRect(
                      x + player.pos.x + BLOCK_OFFSET,
                      y + ghostY + BLOCK_OFFSET,
                      BLOCK_SIZE_MULTIPLIER,
                      BLOCK_SIZE_MULTIPLIER,
                      CORNER_RADIUS
                  );
                  context.fill();
              }
          })
      );
      context.restore();
    }

    function drawCentered(ctx, matrix, boxWidth, boxHeight, type) {
      const bounds = getMatrixBounds(matrix);
      const pieceWidth = bounds.width;
      const pieceHeight = bounds.height;
      const pieceMinX = bounds.minX;
      const pieceMinY = bounds.minY;

      // Calculate offset to center the actual blocks of the piece within the box.
      const targetCenterX = boxWidth / 2;
      const targetCenterY = boxHeight / 2;

      const currentPieceCenterX = pieceMinX + pieceWidth / 2;
      const currentPieceCenterY = pieceMinY + pieceHeight / 2;

      const finalOffsetX = targetCenterX - currentPieceCenterX;
      const finalOffsetY = targetCenterY - currentPieceCenterY;

      matrix.forEach((row, y) =>
        row.forEach((val, x) => {
          if (val) {
            ctx.fillStyle = colors[val];
            ctx.beginPath();
            ctx.roundRect(
              x + finalOffsetX + BLOCK_OFFSET,
              y + finalOffsetY + BLOCK_OFFSET,
              BLOCK_SIZE_MULTIPLIER,
              BLOCK_SIZE_MULTIPLIER,
              CORNER_RADIUS
            );
            ctx.fill();
          }
        })
      );
    }

    function drawClearEffect(ctx) {
      if (shakeTimer > 0 && clearedLines.length) {
        ctx.save();
        let phase = shakeTimer > 5 ? 1 : -1;
        let offsetX = phase * (Math.random() * 0.25 + 0.15);
        let offsetY = phase * (Math.random() * 0.25 + 0.15);
        ctx.save();
        ctx.translate(offsetX, offsetY);
        arena.forEach((row, y) =>
            row.forEach((val, x) => {
                if (val) {
                    ctx.fillStyle = colors[val];
                    ctx.beginPath();
                    ctx.roundRect(
                        x + BLOCK_OFFSET,
                        y + BLOCK_OFFSET,
                        BLOCK_SIZE_MULTIPLIER,
                        BLOCK_SIZE_MULTIPLIER,
                        CORNER_RADIUS
                    );
                    ctx.fill();
                }
            })
        );
        ctx.restore();
      } else {
          arena.forEach((row, y) =>
              row.forEach((val, x) => {
                  if (val) {
                      ctx.fillStyle = colors[val];
                      ctx.beginPath();
                      ctx.roundRect(
                          x + BLOCK_OFFSET,
                          y + BLOCK_OFFSET,
                          BLOCK_SIZE_MULTIPLIER,
                          BLOCK_SIZE_MULTIPLIER,
                          CORNER_RADIUS
                      );
                      ctx.fill();
                  }
              }
          ));
      }
    }

    function draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawClearEffect(context);
      drawGhost();
      drawMatrix(context, player.matrix, player.pos);
    }

    function collide(arena, p) {
      const m = p.matrix,
        o = p.pos;
      for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
          if (
            m[y][x] !== 0 && // If block exists in piece matrix
            (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0 // And it's not out of bounds or colliding with filled arena
          ) {
            return true;
          }
        }
      }
      return false;
    }

    function merge(arena, p) {
      p.matrix.forEach((row, y) =>
        row.forEach((val, x) => {
          if (val) arena[y + p.pos.y][x + p.pos.x] = val;
        })
      );
    }

    // --- SRS Kick Tables ---
    // Standard kick data for J, L, S, T, Z pieces (non-I)
    // Indexed by [current_rotation_state][next_rotation_state_diff]
    // 0: 0->R (0 to 1)
    // 1: R->0 (1 to 0)
    // 2: R->2 (1 to 2)
    // 3: 2->R (2 to 1)
    // 4: 2->L (2 to 3)
    // 5: L->2 (3 to 2)
    // 6: L->0 (3 to 0)
    // 7: 0->L (0 to 3)
    const srsKicks = {
      // 0 -> R (state 0 to state 1)
      '0_1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
      // R -> 0 (state 1 to state 0)
      '1_0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
      // R -> 2 (state 1 to state 2)
      '1_2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
      // 2 -> R (state 2 to state 1)
      '2_1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
      // 2 -> L (state 2 to state 3)
      '2_3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
      // L -> 2 (state 3 to state 2)
      '3_2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
      // L -> 0 (state 3 to state 0)
      '3_0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
      // 0 -> L (state 0 to state 3)
      '0_3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    };

    // I-piece specific kick data
    const srsKicksI = {
      // 0 -> R
      '0_1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
      // R -> 0
      '1_0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
      // R -> 2
      '1_2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
      // 2 -> R
      '2_1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
      // 2 -> L
      '2_3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
      // L -> 2
      '3_2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
      // L -> 0
      '3_0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
      // 0 -> L
      '0_3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    };

    // Handles SRS kicks
    function rotateMatrixSRS(matrix, dir, currentRotationState, pieceType) {
        const originalMatrix = matrix.map(row => [...row]); // Deep copy for reverting
        const originalPos = { x: player.pos.x, y: player.pos.y };

        // 1. Perform the raw matrix rotation
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < y; x++) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        dir > 0 ? matrix.forEach((r) => r.reverse()) : matrix.reverse();

        // 2. Determine new rotation state
        let newRotationState = (currentRotationState + dir + 4) % 4; // +4 to handle negative results for %

        // 3. Get kick tests based on piece type and rotation transition
        const kicks = (pieceType === 'I') ? srsKicksI : srsKicks;
        const kickKey = `${currentRotationState}_${newRotationState}`;
        const testOffsets = kicks[kickKey];

        if (!testOffsets) {
            console.warn(`No SRS kick data for transition ${kickKey} for piece ${pieceType}.`);
            // Fallback to original state if no kick data found
            player.matrix = originalMatrix;
            player.pos = originalPos;
            return false;
        }

        // 4. Attempt each kick test
        for (let i = 0; i < testOffsets.length; i++) {
            const [offsetX, offsetY] = testOffsets[i];
            player.pos.x = originalPos.x + offsetX;
            player.pos.y = originalPos.y - offsetY;

            if (!collide(arena, { matrix: player.matrix, pos: player.pos })) {
                player.rotationState = newRotationState;
                return true;
            }
        }

        // 5. If all tests fail, revert to original state
        player.matrix = originalMatrix;
        player.pos = originalPos;
        return false;
    }

    function getMatrixBounds(matrix) {
      let minX = matrix[0].length,
        maxX = 0,
        minY = matrix.length,
        maxY = 0;
      for (let y = 0; y < matrix.length; y++)
        for (let x = 0; x < matrix[y].length; x++)
          if (matrix[y][x]) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
      return { minX, minY, width: maxX - minX + 1, height: maxY - minY + 1 };
    }
    function isGrounded() {
      return collide(arena, { matrix: player.matrix, pos: { x: player.pos.x, y: player.pos.y + 1 } });
    }

    function updatePreview() {
      previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      const m = createPiece(nextPieceType);
      const boxW = previewCanvas.width / 20;
      const boxH = previewCanvas.height / 20;
      drawCentered(previewContext, m, boxW, boxH, nextPieceType); // Pass nextPieceType for correct drawing, but no custom offset needed
    }
    function updateHold() {
      holdContext.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
      if (!holdPiece) return;
      const m = createPiece(holdPiece);
      const boxW = holdCanvas.width / 20;
      const boxH = holdCanvas.height / 20;
      drawCentered(holdContext, m, boxW, boxH, holdPiece);
    }

    const DAS = 167,
      ARR = 33,
      softDropFactor = 30,
      LOCK_DELAY = 500,
      HARD_DROP_LOCK_DURATION = 100;

    const MAX_LOCK_RESETS = 15;

    const inputState = {
      left: { pressed: false, startTime: 0, lastTime: 0 },
      right: { pressed: false, startTime: 0, lastTime: 0 },
      down: { pressed: false, startTime: 0, lastTime: 0 },
      rotateLeft: { pressed: false },
      rotateRight: { pressed: false },
      hardDrop: { pressed: false },
    };
    let hardDropLock = 0;
    let lastDirectionKey = null;

    document.addEventListener("keydown", (e) => {
      if (gamePaused) return;
      switch (e.keyCode) {
        case 37: // Left key for moving left
          if (!inputState.left.pressed) {
            inputState.left.pressed = true;
            inputState.left.startTime = inputState.left.lastTime = performance.now();
            lastDirectionKey = 'left';
            playerMove(-1);
          }
          break;
        case 39: // Right key for moving right
          if (!inputState.right.pressed) {
            inputState.right.pressed = true;
            inputState.right.startTime = inputState.right.lastTime = performance.now();
            lastDirectionKey = 'right';
            playerMove(1);
          }
          break;
        case 40: // Down key for soft drop
          if (!inputState.down.pressed) {
            inputState.down.pressed = true;
            inputState.down.startTime = inputState.down.lastTime = performance.now();
          }
          break;
        case 32: // Space key for hard drop
          if (!inputState.hardDrop.pressed) {
            inputState.hardDrop.pressed = true;
            if (performance.now() >= hardDropLock) playerHardDrop();
          }
          break;
        case 90: // Z key for rotate left
          if (!inputState.rotateLeft.pressed) {
            inputState.rotateLeft.pressed = true;
            if (rotateMatrixSRS(player.matrix, -1, player.rotationState, player.type)) {
              playRotateAudio();
              player.lockDelayTimer = 0;
              player.lockResetCount++;
            }
          }
          break;
        case 88: // X key for rotate right
          if (!inputState.rotateRight.pressed) {
            inputState.rotateRight.pressed = true;
            if (rotateMatrixSRS(player.matrix, 1, player.rotationState, player.type)) {
              playRotateAudio();
              player.lockDelayTimer = 0;
              player.lockResetCount++;
            }
          }
          break;
        case 67: // C key for hold
          playerHold();
          break;
      }
    });

    document.addEventListener("keyup", (e) => {
      if (gamePaused) return;
      switch (e.keyCode) {
        case 37:
          inputState.left.pressed = false;
          if (lastDirectionKey === 'left' && inputState.right.pressed) {
            lastDirectionKey = 'right';
          } else if (!inputState.right.pressed) {
            lastDirectionKey = null;
          }
          break;
        case 39:
          inputState.right.pressed = false;
          if (lastDirectionKey === 'right' && inputState.left.pressed) {
            lastDirectionKey = 'left';
          } else if (!inputState.left.pressed) {
            lastDirectionKey = null;
          }
          break;
        case 40:
          inputState.down.pressed = false;
          break;
        case 32:
          inputState.hardDrop.pressed = false;
          break;
        case 90:
          inputState.rotateLeft.pressed = false;
          break;
        case 88:
          inputState.rotateRight.pressed = false;
          break;
      }
    });

    function processInput() {
      const now = performance.now();
      let currentMoveDirection = 0;

      if (lastDirectionKey === 'left' && inputState.left.pressed) {
        currentMoveDirection = -1;
      } else if (lastDirectionKey === 'right' && inputState.right.pressed) {
        currentMoveDirection = 1;
      }

      if (currentMoveDirection === -1) {
        if (now - inputState.left.startTime >= DAS && now - inputState.left.lastTime >= ARR) {
          playerMove(-1);
          inputState.left.lastTime = now;
        }
      } else if (currentMoveDirection === 1) {
        if (now - inputState.right.startTime >= DAS && now - inputState.right.lastTime >= ARR) {
          playerMove(1);
          inputState.right.lastTime = now;
        }
      }
    }

    function playerMove(offset) {
      player.pos.x += offset;
      if (collide(arena, player)) {
        player.pos.x -= offset;
      } else {
        playMoveAudio();
        // Reset lockDelayTimer AND increment lockResetCount
        player.lockDelayTimer = 0;
        player.lockResetCount++;
      }
    }

    function playerDrop() {
      player.pos.y++;
      if (collide(arena, player)) {
        player.pos.y--;
        return false;
      }
      dropCounter = 0;
      return true;
    }

    function playerHardDrop() {
        while (!collide(arena, { matrix: player.matrix, pos: { x: player.pos.x, y: player.pos.y + 1 } }))
            player.pos.y++;

        const linesWillClear = willClearLines(arena, player.matrix, player.pos);
        merge(arena, player);

        if (!linesWillClear) {
            playPlaceAudio();
        }

        playerReset();
        holdUsed = false;
        arenaSweep();
        dropCounter = 0;
        hardDropLock = performance.now() + HARD_DROP_LOCK_DURATION;
    }

    function playerHold() {
      if (holdUsed) return;
      playHoldAudio();
      holdUsed = true;
      if (!holdPiece) {
        holdPiece = player.type;
        playerReset();
      } else {
        const temp = player.type;
        player.type = holdPiece;
        holdPiece = temp;
        // Ensure new piece from hold starts with rotationState 0 ---
        player.matrix = createPiece(player.type);
        player.rotationState = 0;
        player.pos.y = 0;
        player.pos.x =
          ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
      }
      updateHold();
    }
    function playerReset() {
      hardDropLock = performance.now() + HARD_DROP_LOCK_DURATION;
      player.type = nextPieceType;
      player.matrix = createPiece(player.type);
      player.pos.y = 0;
      player.pos.x =
        ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
      player.rotationState = 0;
      nextPieceType = getNextPieceType();
      updatePreview();
      player.lockResetCount = 0;
      if (collide(arena, player)) {
        arena.forEach((row) => row.fill(0));
        holdPiece = null;
        updateHold();
      }
    }
    function willClearLines(currentArena, pieceMatrix, piecePos) {
        const tempArena = currentArena.map(row => [...row]);

        pieceMatrix.forEach((row, y) =>
            row.forEach((val, x) => {
                if (val) tempArena[y + piecePos.y][x + piecePos.x] = val;
            })
        );

        for (let y = tempArena.length - 1; y >= 0; y--) {
            let rowFull = true;
            for (let x = 0; x < tempArena[y].length; x++) {
                if (tempArena[y][x] === 0) {
                    rowFull = false;
                    break;
                }
            }
            if (rowFull) {
                return true;
            }
        }
        return false;
    }

    let clearedLines = [],
      shakeTimer = 0;
    function arenaSweep() {
      clearedLines = [];
      outer: for (let y = arena.length - 1; y >= 0; y--) {
        for (let x = 0; x < arena[y].length; x++)
          if (arena[y][x] === 0) continue outer;
        clearedLines.push(y);
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        y++;
      }
      if (clearedLines.length) {
        shakeTimer = 10;
        playClearAudio();
        if (window.showNullShockFace) window.showNullShockFace(clearedLines.length);
      }
    }

    const placeAudio = new Audio("assets/place.wav");
    const moveAudio = new Audio("assets/move.wav");
    const rotateAudio = new Audio("assets/rotate.wav");
    const holdAudio = new Audio("assets/hold.wav");
    const clearAudio = new Audio("assets/clear.wav");

    function primeAudio() {
          const allAudio = [placeAudio, moveAudio, rotateAudio, holdAudio, clearAudio];

          allAudio.forEach((audio) => {
            audio.volume = 1;

            const tempVolume = audio.volume;
            audio.volume = 0;

            audio
              .play()
              .then(() => {
                audio.pause();
                audio.currentTime = 0;
                audio.volume = tempVolume;
              })
              .catch((e) => {
                console.error(`Failed to prime audio ${audio.src}:`, e);
                audio.volume = tempVolume;
              });
          });
          window.removeEventListener("keydown", primeAudio);
          window.removeEventListener("mousedown", primeAudio);
        }
    window.addEventListener("keydown", primeAudio);
    window.addEventListener("mousedown", primeAudio);

    function playPlaceAudio() {
      placeAudio.currentTime = 0;
      placeAudio.play();
    }
    function playMoveAudio() {
      moveAudio.currentTime = 0;
      moveAudio.play();
    }
    function playRotateAudio() {
      rotateAudio.currentTime = 0;
      rotateAudio.play();
    }
    function playHoldAudio() {
      holdAudio.currentTime = 0;
      holdAudio.play();
    }
    function playClearAudio() {
      clearAudio.currentTime = 0;
      clearAudio.play();
    }

    let dropCounter = 0,
      dropInterval = 1000,
      lastTime = 0;
    let animationFrameId = null;
    let gameStarted = false;
    let gamePaused = true;

    function startGame() {
      if (!gameStarted) {
        refillBag();
        nextPieceType = getNextPieceType();
        playerReset();
        gameStarted = true;
      }
      gamePaused = false;
      lastTime = performance.now();
      update();
    }
    function pauseGame() {
      gamePaused = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
    function update(time = 0) {
      if (gamePaused) return;
      processInput();
      const deltaTime = time - lastTime;
      lastTime = time;
      dropCounter += deltaTime;
      const curDropInterval = inputState.down.pressed
        ? dropInterval / softDropFactor
        : dropInterval;
      if (dropCounter > curDropInterval) {
        const dropSuccessful = playerDrop();
        if (dropSuccessful && inputState.down.pressed) {
          playMoveAudio();
        }
      }
      if (isGrounded()) {
          player.lockDelayTimer += deltaTime;
          if (player.lockDelayTimer >= LOCK_DELAY || player.lockResetCount >= MAX_LOCK_RESETS) {
              const linesWillClear = willClearLines(arena, player.matrix, player.pos);

              merge(arena, player);

              if (!linesWillClear) {
                  playPlaceAudio();
              }

              playerReset();
              holdUsed = false;
              arenaSweep();
              dropCounter = 0;
              player.lockDelayTimer = 0;
              hardDropLock = performance.now() + HARD_DROP_LOCK_DURATION;
          }
      } else {
          if (player.lockDelayTimer > 0 || player.lockResetCount > 0) {
              player.lockDelayTimer = 0;
              player.lockResetCount = 0;
          }
      }
      if (shakeTimer > 0) shakeTimer--;
      draw();
      animationFrameId = requestAnimationFrame(update);
    }

    const tetrisContainer = document.getElementById("tetris-container");
    const tetrisHandle = document.getElementById("tetris-handle");
    tetrisContainer.classList.add("closed");
    pauseGame();

    tetrisHandle.addEventListener("click", (e) => {
      if (e.detail === 0) return;
      const wasClosed = tetrisContainer.classList.contains("closed");
      tetrisContainer.classList.toggle("closed");
      if (wasClosed) startGame();
      else pauseGame();
    });
    tetrisHandle.addEventListener("mouseenter", () => {
      if (tetrisContainer.classList.contains("closed"))
        tetrisContainer.classList.add("hovered");
    });
    tetrisHandle.addEventListener("mouseleave", () => {
      tetrisContainer.classList.remove("hovered");
    });
  }); // End DOMContentLoaded
}