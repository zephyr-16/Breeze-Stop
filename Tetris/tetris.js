    const canvas =
      document.getElementById("game");

    const ctx =
      canvas.getContext("2d");

    const nextCanvas =
      document.getElementById("next");

    const nextCtx =
      nextCanvas.getContext("2d");

    /*
      Larger internal playfield.
    */
    const COLS = 10;
    const ROWS = 20;
    const BLOCK = 36;

    /* =========================================================
       UI
    ========================================================= */

    const scoreEl =
      document.getElementById("score");

    const linesEl =
      document.getElementById("lines");

    const levelEl =
      document.getElementById("level");

    const overlay =
      document.getElementById("overlay");

    const overlayTitle =
      document.getElementById("overlayTitle");

    const overlaySubtitle =
      document.getElementById("overlaySubtitle");

    const overlayButton =
      document.getElementById("overlayButton");

    const startControls =
      document.getElementById("startControls");

    /* =========================================================
       COLORS
    ========================================================= */

    const colors = {

      I: "#00e5ff",

      O: "#ffe600",

      T: "#c451ff",

      S: "#39dc67",

      Z: "#ff4558",

      J: "#467cff",

      L: "#ff9b27"

    };

    /* =========================================================
       TETRIS PIECES
    ========================================================= */

    const pieces = {

      I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],

      O: [
        [1, 1],
        [1, 1]
      ],

      T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ],

      S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ],

      Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
      ],

      J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
      ],

      L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
      ]

    };

    /* =========================================================
       GAME STATE
    ========================================================= */

    let board;

    let player;

    let nextPiece;

    let score = 0;

    let lines = 0;

    let level = 1;

    let dropCounter = 0;

    let dropInterval = 800;

    let lastTime = 0;

    let gameStarted = false;

    let gameOver = false;

    let paused = false;

    /* =========================================================
       CREATE BOARD
    ========================================================= */

    function createBoard() {

      return Array.from(
        {
          length: ROWS
        },

        () =>
          Array(COLS).fill(null)
      );
    }

    /* =========================================================
       RANDOM PIECE
    ========================================================= */

    function randomPiece() {

      const types =
        Object.keys(pieces);

      const type =
        types[
          Math.floor(
            Math.random() *
            types.length
          )
        ];

      return {

        type,

        matrix:
          pieces[type].map(
            row => [...row]
          ),

        x: 0,

        y: 0

      };
    }

    /* =========================================================
       SPAWN PIECE
    ========================================================= */

    function spawnPiece() {

      player =
        nextPiece ||
        randomPiece();

      nextPiece =
        randomPiece();

      player.x =
        Math.floor(COLS / 2) -
        Math.floor(
          player.matrix[0].length /
          2
        );

      player.y = 0;

      if (
        collides(
          board,
          player
        )
      ) {

        showGameOver();
      }

      drawNext();
    }

    /* =========================================================
       COLLISION
    ========================================================= */

    function collides(
      board,
      piece
    ) {

      for (
        let y = 0;
        y < piece.matrix.length;
        y++
      ) {

        for (
          let x = 0;
          x < piece.matrix[y].length;
          x++
        ) {

          if (
            !piece.matrix[y][x]
          ) {
            continue;
          }

          const boardX =
            piece.x + x;

          const boardY =
            piece.y + y;

          if (
            boardX < 0 ||
            boardX >= COLS ||
            boardY >= ROWS
          ) {

            return true;
          }

          if (
            boardY >= 0 &&
            board[boardY][boardX]
          ) {

            return true;
          }
        }
      }

      return false;
    }

    /* =========================================================
       MERGE PIECE INTO BOARD
    ========================================================= */

    function merge() {

      player.matrix.forEach(
        (row, y) => {

          row.forEach(
            (value, x) => {

              if (value) {

                board[
                  player.y + y
                ][
                  player.x + x
                ] =
                  player.type;
              }

            }
          );
        }
      );
    }

    /* =========================================================
       CLEAR COMPLETED LINES
    ========================================================= */

    function clearLines() {

      let cleared = 0;

      outer:
      for (
        let y = ROWS - 1;
        y >= 0;
        y--
      ) {

        for (
          let x = 0;
          x < COLS;
          x++
        ) {

          if (!board[y][x]) {

            continue outer;
          }
        }

        board.splice(
          y,
          1
        );

        board.unshift(
          Array(COLS).fill(null)
        );

        cleared++;

        y++;
      }

      if (cleared > 0) {

        const points = [
          0,
          100,
          300,
          500,
          800
        ];

        score +=
          points[cleared] *
          level;

        lines += cleared;

        level =
          Math.floor(
            lines / 10
          ) + 1;

        dropInterval =
          Math.max(
            100,
            800 -
              (level - 1) *
              65
          );

        updateStats();
      }
    }

    /* =========================================================
       MOVE
    ========================================================= */

    function movePlayer(
      direction
    ) {

      if (
        !gameStarted ||
        gameOver ||
        paused
      ) {

        return;
      }

      player.x += direction;

      if (
        collides(
          board,
          player
        )
      ) {

        player.x -= direction;
      }
    }

    /* =========================================================
       DROP
    ========================================================= */

    function playerDrop() {

      if (
        !gameStarted ||
        gameOver ||
        paused
      ) {

        return;
      }

      player.y++;

      if (
        collides(
          board,
          player
        )
      ) {

        player.y--;

        merge();

        clearLines();

        spawnPiece();
      }

      dropCounter = 0;
    }

    /* =========================================================
       ROTATION
    ========================================================= */

    function rotateMatrix(
      matrix
    ) {

      return matrix.map(
        (_, index) =>
          matrix
            .map(
              row => row[index]
            )
            .reverse()
      );
    }

    function playerRotate() {

      if (
        !gameStarted ||
        gameOver ||
        paused
      ) {

        return;
      }

      const oldMatrix =
        player.matrix;

      const oldX =
        player.x;

      player.matrix =
        rotateMatrix(
          player.matrix
        );

      let offset = 1;

      while (
        collides(
          board,
          player
        )
      ) {

        player.x += offset;

        offset =
          -(
            offset +
            (
              offset > 0
                ? 1
                : -1
            )
          );

        if (
          Math.abs(offset) >
          player.matrix[0].length
        ) {

          player.matrix =
            oldMatrix;

          player.x =
            oldX;

          return;
        }
      }
    }

    /* =========================================================
       PIXEL BLOCK
    ========================================================= */

    function drawPixelBlock(
      context,
      x,
      y,
      color,
      size
    ) {

      const px =
        x * size;

      const py =
        y * size;

      /*
        Dark pixel outline
      */
      context.fillStyle =
        "#03050a";

      context.fillRect(
        px,
        py,
        size,
        size
      );

      /*
        Main color
      */
      context.fillStyle =
        color;

      context.fillRect(
        px + 3,
        py + 3,
        size - 6,
        size - 6
      );

      /*
        Pixel highlight
      */
      context.fillStyle =
        "rgba(255,255,255,0.34)";

      context.fillRect(
        px + 5,
        py + 5,
        size - 11,
        5
      );

      context.fillRect(
        px + 5,
        py + 10,
        5,
        size - 15
      );

      /*
        Pixel shadow
      */
      context.fillStyle =
        "rgba(0,0,0,0.30)";

      context.fillRect(
        px + 7,
        py + size - 9,
        size - 14,
        5
      );

      context.fillRect(
        px + size - 9,
        py + 7,
        5,
        size - 14
      );
    }

    /* =========================================================
       DRAW MATRIX
    ========================================================= */

    function drawMatrix(
      context,
      matrix,
      offset,
      size
    ) {

      matrix.forEach(
        (row, y) => {

          row.forEach(
            (value, x) => {

              if (value) {

                drawPixelBlock(
                  context,

                  x +
                    offset.x,

                  y +
                    offset.y,

                  colors[value],

                  size
                );
              }

            }
          );
        }
      );
    }

    /* =========================================================
       GRID
    ========================================================= */

    function drawGrid() {

      ctx.strokeStyle =
        "rgba(120,145,180,0.08)";

      ctx.lineWidth = 1;

      for (
        let x = 0;
        x <= COLS;
        x++
      ) {

        ctx.beginPath();

        ctx.moveTo(
          x * BLOCK,
          0
        );

        ctx.lineTo(
          x * BLOCK,
          canvas.height
        );

        ctx.stroke();
      }

      for (
        let y = 0;
        y <= ROWS;
        y++
      ) {

        ctx.beginPath();

        ctx.moveTo(
          0,
          y * BLOCK
        );

        ctx.lineTo(
          canvas.width,
          y * BLOCK
        );

        ctx.stroke();
      }
    }

    /* =========================================================
       DRAW BOARD
    ========================================================= */

    function drawBoard() {

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.fillStyle =
        "#080c13";

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      drawGrid();

      board.forEach(
        (row, y) => {

          row.forEach(
            (value, x) => {

              if (value) {

                drawPixelBlock(
                  ctx,
                  x,
                  y,
                  colors[value],
                  BLOCK
                );
              }

            }
          );
        }
      );

      if (
        player &&
        gameStarted &&
        !gameOver
      ) {

        drawMatrix(
          ctx,

          player.matrix,

          {
            x: player.x,
            y: player.y
          },

          BLOCK
        );
      }
    }

    /* =========================================================
       NEXT PIECE
    ========================================================= */

    function drawNext() {

      nextCtx.clearRect(
        0,
        0,
        nextCanvas.width,
        nextCanvas.height
      );

      nextCtx.fillStyle =
        "#080c13";

      nextCtx.fillRect(
        0,
        0,
        nextCanvas.width,
        nextCanvas.height
      );

      if (!nextPiece) {
        return;
      }

      const size = 28;

      const width =
        nextPiece.matrix[0].length *
        size;

      const height =
        nextPiece.matrix.length *
        size;

      const offset = {

        x:
          Math.floor(
            (
              nextCanvas.width -
              width
            ) /
            2 /
            size
          ),

        y:
          Math.floor(
            (
              nextCanvas.height -
              height
            ) /
            2 /
            size
          )
      };

      drawMatrix(
        nextCtx,

        nextPiece.matrix,

        offset,

        size
      );
    }

    /* =========================================================
       UPDATE STATS
    ========================================================= */

    function updateStats() {

      scoreEl.textContent =
        score;

      linesEl.textContent =
        lines;

      levelEl.textContent =
        level;
    }

    /* =========================================================
       START SCREEN
    ========================================================= */

    function showStartScreen() {

      overlay.classList.add(
        "show"
      );

      overlayTitle.textContent =
        "PIXEL TETRIS";

      overlaySubtitle.textContent =
        "Stack the blocks, clear lines, and beat your high score.";

      startControls.style.display =
        "grid";

      overlayButton.textContent =
        "START GAME";
    }

    /* =========================================================
       GAME OVER
    ========================================================= */

    function showGameOver() {

      gameOver = true;

      overlay.classList.add(
        "show"
      );

      overlayTitle.textContent =
        "GAME OVER";

      overlaySubtitle.innerHTML =
        `Final Score:
         <strong>${score}</strong>`;

      startControls.style.display =
        "none";

      overlayButton.textContent =
        "PLAY AGAIN";
    }

    /* =========================================================
       PAUSE
    ========================================================= */

    function togglePause() {

      if (
        !gameStarted ||
        gameOver
      ) {

        return;
      }

      paused = !paused;

      if (paused) {

        overlay.classList.add(
          "show"
        );

        overlayTitle.textContent =
          "PAUSED";

        overlaySubtitle.textContent =
          "Press an arrow key or Resume to continue.";

        startControls.style.display =
          "none";

        overlayButton.textContent =
          "RESUME";

      } else {

        overlay.classList.remove(
          "show"
        );
      }
    }

    /* =========================================================
       START / RESTART
    ========================================================= */

    function startGame() {

      board =
        createBoard();

      score = 0;

      lines = 0;

      level = 1;

      dropCounter = 0;

      dropInterval = 800;

      gameOver = false;

      paused = false;

      gameStarted = true;

      nextPiece =
        randomPiece();

      updateStats();

      spawnPiece();

      overlay.classList.remove(
        "show"
      );

      drawBoard();
    }

    /* =========================================================
       KEYBOARD CONTROLS
    ========================================================= */

    document.addEventListener(
      "keydown",
      event => {

        const key =
          event.key;

        const arrowKeys = [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown"
        ];

        if (
          arrowKeys.includes(key)
        ) {

          event.preventDefault();
        }

        /*
          Start game using any arrow key.
        */
        if (!gameStarted) {

          if (
            arrowKeys.includes(key)
          ) {

            startGame();

            return;
          }
        }

        /*
          Resume with an arrow key.
        */
        if (paused) {

          if (
            arrowKeys.includes(key)
          ) {

            togglePause();
          }

          return;
        }

        switch (key) {

          case "ArrowLeft":

            movePlayer(-1);

            break;

          case "ArrowRight":

            movePlayer(1);

            break;

          case "ArrowUp":

            playerRotate();

            break;

          case "ArrowDown":

            playerDrop();

            break;
        }
      }
    );

    /* =========================================================
       BUTTONS
    ========================================================= */

    overlayButton.addEventListener(
      "click",
      () => {

        if (
          !gameStarted ||
          gameOver
        ) {

          startGame();

        } else if (paused) {

          togglePause();
        }
      }
    );

    document
      .getElementById(
        "restartButton"
      )
      .addEventListener(
        "click",
        startGame
      );

    /* =========================================================
       GAME LOOP
    ========================================================= */

    function update(
      time = 0
    ) {

      const deltaTime =
        time - lastTime;

      lastTime = time;

      if (
        gameStarted &&
        !gameOver &&
        !paused
      ) {

        dropCounter +=
          deltaTime;

        if (
          dropCounter >
          dropInterval
        ) {

          playerDrop();
        }
      }

      drawBoard();

      requestAnimationFrame(
        update
      );
    }

    /* =========================================================
       INITIALIZE
    ========================================================= */

    board =
      createBoard();

    nextPiece =
      randomPiece();

    updateStats();

    drawNext();

    drawBoard();

    showStartScreen();

    requestAnimationFrame(
      update
    );
