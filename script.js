document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const setupScreen = document.getElementById('setup-screen');
    const gameScreen = document.getElementById('game-screen');
    const playerOptionButtons = document.querySelectorAll('.player-option-btn');
    const board = document.getElementById('board');
    const playerTurnDisplay = document.getElementById('player-turn');
    const rollDiceBtn = document.getElementById('roll-dice-btn');
    const diceElement = document.getElementById('dice');
    const gameMessage = document.getElementById('game-message');

    // --- Game State ---
    let playerCount = 0;
    let currentPlayerIndex = 0;
    let players = [];
    let diceValue = 0;
    let canRollDice = true;

    // --- Game Configuration ---
    const COLORS = ['red', 'green', 'yellow', 'blue'];
    const HOME_BASES = {
        red: [0, 1, 2, 3],
        green: [4, 5, 6, 7],
        yellow: [8, 9, 10, 11],
        blue: [12, 13, 14, 15]
    };
    const START_POSITIONS = { red: 0, green: 13, yellow: 26, blue: 39 };
    const HOME_PATH_STARTS = { red: 52, green: 58, yellow: 64, blue: 70 };
    const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];

    // Path coordinates [row, col] for each step on the board
    // This is the 52-step main path
    const PATH = [
        // Red to Green
        [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
        [5, 6], [4, 6], [3, 6], [2, 6], [1, 6],
        [0, 6], [0, 7], [0, 8],
        // Green to Yellow
        [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
        [6, 9], [6, 10], [6, 11], [6, 12], [6, 13],
        [6, 14], [7, 14], [8, 14],
        // Yellow to Blue
        [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
        [9, 8], [10, 8], [11, 8], [12, 8], [13, 8],
        [14, 8], [14, 7], [14, 6],
        // Blue to Red
        [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
        [8, 5], [8, 4], [8, 3], [8, 2], [8, 1],
        [8, 0], [7, 0], [6, 0]
    ];
    const HOME_STRETCH = {
        red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
        green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
        yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
        blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]]
    };

    // --- Event Listeners ---
    playerOptionButtons.forEach(button => {
        button.addEventListener('click', () => {
            playerCount = parseInt(button.dataset.players);
            startGame();
        });
    });

    rollDiceBtn.addEventListener('click', rollDice);

    // --- Game Logic Functions ---

    /**
     * Initializes the game board and player states.
     */
    function startGame() {
        setupScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        createBoard();
        initializePlayers();
        renderBoard();
        updatePlayerTurnDisplay();
    }

    /**
     * Creates the visual grid for the Ludo board.
     */
    function createBoard() {
        board.innerHTML = ''; // Clear the board
        const safeSpotCoords = SAFE_SPOTS.map(i => PATH[i]);

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.style.gridRow = r + 1;
                cell.style.gridColumn = c + 1;

                // Home Bases
                if (r < 6 && c < 6) cell.classList.add('home-base', 'red');
                if (r < 6 && c > 8) cell.classList.add('home-base', 'green');
                if (r > 8 && c < 6) cell.classList.add('home-base', 'blue');
                if (r > 8 && c > 8) cell.classList.add('home-base', 'yellow');

                // Home Spots (the white circles)
                if ((r === 1 || r === 4) && (c === 1 || c === 4)) cell.classList.add('home-spot'); // Red
                if ((r === 1 || r === 4) && (c === 10 || c === 13)) cell.classList.add('home-spot'); // Green
                if ((r === 10 || r === 13) && (c === 1 || c === 4)) cell.classList.add('home-spot'); // Blue
                if ((r === 10 || r === 13) && (c === 10 || c === 13)) cell.classList.add('home-spot'); // Yellow

                // Main Path
                const isPath = PATH.some(p => p[0] === r && p[1] === c);
                if (isPath) {
                    cell.classList.add('path');
                }

                // Home Stretches
                const isRedHome = HOME_STRETCH.red.some(p => p[0] === r && p[1] === c);
                const isGreenHome = HOME_STRETCH.green.some(p => p[0] === r && p[1] === c);
                const isBlueHome = HOME_STRETCH.blue.some(p => p[0] === r && p[1] === c);
                const isYellowHome = HOME_STRETCH.yellow.some(p => p[0] === r && p[1] === c);
                if (isRedHome) cell.classList.add('home-path', 'red');
                if (isGreenHome) cell.classList.add('home-path', 'green');
                if (isBlueHome) cell.classList.add('home-path', 'blue');
                if (isYellowHome) cell.classList.add('home-path', 'yellow');

                // Safe Spots (stars)
                const isSafe = safeSpotCoords.some(p => p[0] === r && p[1] === c);
                if (isSafe) {
                    cell.classList.add('safe');
                }
                
                // Start cells
                if (r === 6 && c === 1) cell.classList.add('start', 'red');
                if (r === 1 && c === 8) cell.classList.add('start', 'green');
                if (r === 8 && c === 13) cell.classList.add('start', 'yellow');
                if (r === 13 && c === 6) cell.classList.add('start', 'blue');

                board.appendChild(cell);
            }
        }
        const centerGoal = document.createElement('div');
        centerGoal.classList.add('center-goal');
        board.appendChild(centerGoal);
    }

    /**
     * Sets up the player objects and their pieces.
     */
    function initializePlayers() {
        players = [];
        for (let i = 0; i < playerCount; i++) {
            const color = COLORS[i];
            const player = {
                color: color,
                pieces: [
                    { id: `${color}-1`, position: -1, inHome: true }, // -1 means in home base
                    { id: `${color}-2`, position: -1, inHome: true },
                    { id: `${color}-3`, position: -1, inHome: true },
                    { id: `${color}-4`, position: -1, inHome: true },
                ],
                hasWon: false
            };
            players.push(player);
        }
    }

    /**
     * Renders all pieces on the board based on their current state.
     */
    function renderBoard() {
        document.querySelectorAll('.piece').forEach(p => p.remove()); // Clear only the pieces
        const cellSize = 600 / 15;

        players.forEach((player, playerIndex) => {
            player.pieces.forEach((piece, pieceIndex) => {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', player.color);
                pieceElement.id = piece.id;

                let top, left;

                if (piece.position === -1) { // In home base
                    const homeSpotCoords = getHomeSpotCoords(player.color, pieceIndex);
                    top = homeSpotCoords.top;
                    left = homeSpotCoords.left;
                } else if (piece.position >= 100) { // Finished
                    const goalCoords = getGoalCoords(player.color, pieceIndex);
                    top = goalCoords.top;
                    left = goalCoords.left;
                } else if (piece.position >= 52) { // In home stretch
                    const homePathIndex = piece.position - HOME_PATH_STARTS[player.color];
                    const [row, col] = HOME_STRETCH[player.color][homePathIndex];
                    top = row * cellSize + (cellSize - (cellSize * 0.7)) / 2;
                    left = col * cellSize + (cellSize - (cellSize * 0.7)) / 2;
                } else { // On main path
                    const pathIndex = (START_POSITIONS[player.color] + piece.position) % 52;
                    const [row, col] = PATH[pathIndex];
                    top = row * cellSize + (cellSize - (cellSize * 0.7)) / 2;
                    left = col * cellSize + (cellSize - (cellSize * 0.7)) / 2;
                }

                pieceElement.style.top = `${top}px`;
                pieceElement.style.left = `${left}px`;

                pieceElement.addEventListener('click', () => onPieceClick(playerIndex, pieceIndex));
                board.appendChild(pieceElement);
            });
        });
        highlightMovablePieces();
    }
    
    // Helper functions for piece positioning
    function getHomeSpotCoords(color, pieceIndex) {
        const cellSize = 600 / 15;
        const baseOffset = {
            red: { top: 0, left: 0 },
            green: { top: 0, left: 9 * cellSize },
            blue: { top: 9 * cellSize, left: 0 },
            yellow: { top: 9 * cellSize, left: 9 * cellSize }
        };
        const spotOffset = [
            { top: 1 * cellSize, left: 1 * cellSize },
            { top: 1 * cellSize, left: 4 * cellSize },
            { top: 4 * cellSize, left: 1 * cellSize },
            { top: 4 * cellSize, left: 4 * cellSize }
        ];
        return {
            top: baseOffset[color].top + spotOffset[pieceIndex].top,
            left: baseOffset[color].left + spotOffset[pieceIndex].left
        };
    }

    function getGoalCoords(color, pieceIndex) {
        const cellSize = 600 / 15;
        const center = 7 * cellSize;
        const offsets = {
            red: { top: center - cellSize, left: center },
            green: { top: center, left: center + cellSize },
            yellow: { top: center + cellSize, left: center },
            blue: { top: center, left: center - cellSize }
        };
        return {
            top: offsets[color].top + (Math.random() - 0.5) * 10,
            left: offsets[color].left + (Math.random() - 0.5) * 10
        };
    }


    /**
     * Handles the dice roll action.
     */
    function rollDice() {
        if (!canRollDice) return;

        diceValue = Math.floor(Math.random() * 6) + 1;
        diceElement.textContent = diceValue;
        diceElement.dataset.value = diceValue;
        gameMessage.textContent = `You rolled a ${diceValue}!`;

        canRollDice = false;
        rollDiceBtn.disabled = true;

        const currentPlayer = players[currentPlayerIndex];
        const movablePieces = getMovablePieces(currentPlayer, diceValue);

        if (movablePieces.length === 0) {
            gameMessage.textContent += " No movable pieces. Switching player.";
            setTimeout(switchPlayer, 1000);
        } else {
            highlightMovablePieces();
        }
    }

    /**
     * Determines which pieces the current player can move.
     */
    function getMovablePieces(player, roll) {
        const movable = [];
        player.pieces.forEach((piece, index) => {
            if (piece.position >= 100) return; // Finished piece

            if (piece.position === -1 && roll === 6) {
                movable.push(index); // Can move out of home
            } else if (piece.position !== -1) {
                // Check if move is valid (not overshooting the goal)
                const homePathStart = HOME_PATH_STARTS[player.color];
                const currentPos = piece.position;
                if (currentPos >= 52) { // In home stretch
                    // A move is valid if it doesn't overshoot the final home spot (the 6th spot)
                    if (currentPos + roll <= homePathStart + 6) {
                        movable.push(index);
                    }
                } else {
                    movable.push(index);
                }
            }
        });
        return movable;
    }

    /**
     * Adds a visual indicator to pieces that can be moved.
     */
    function highlightMovablePieces() {
        document.querySelectorAll('.piece.movable').forEach(p => p.classList.remove('movable'));
        if (canRollDice) return;

        const currentPlayer = players[currentPlayerIndex];
        const movablePieces = getMovablePieces(currentPlayer, diceValue);
        movablePieces.forEach(pieceIndex => {
            const pieceId = currentPlayer.pieces[pieceIndex].id;
            document.getElementById(pieceId)?.classList.add('movable');
        });
    }

    /**
     * Handles a click on a player's piece.
     */
    function onPieceClick(playerIndex, pieceIndex) {
        if (playerIndex !== currentPlayerIndex || canRollDice) {
            return;
        }

        const player = players[playerIndex];
        const piece = player.pieces[pieceIndex];
        const movablePieces = getMovablePieces(player, diceValue);

        if (movablePieces.includes(pieceIndex)) {
            movePiece(playerIndex, pieceIndex, diceValue);
        } else {
            gameMessage.textContent = "This piece cannot be moved.";
        }
    }

    /**
     * Executes the movement of a piece.
     */
    function movePiece(playerIndex, pieceIndex, roll) {
        const player = players[playerIndex];
        const piece = player.pieces[pieceIndex];

        if (piece.position === -1 && roll === 6) {
            piece.position = 0; // Move to start
        } else {
            const currentPos = piece.position;
            const turnOffPoint = 51; // Relative position on the main path after which a piece enters its home stretch.
            
            // Check if piece is about to enter home stretch
            if (currentPos < 52 && currentPos <= turnOffPoint && currentPos + roll > turnOffPoint) {
                const stepsToTurnOff = turnOffPoint - currentPos;
                const stepsIntoHome = roll - stepsToTurnOff - 1;
                piece.position = HOME_PATH_STARTS[player.color] + stepsIntoHome;
            } else if (currentPos >= 52) { // Already in home stretch
                piece.position += roll;
            } else { // Normal move
                piece.position = (piece.position + roll);
            }
        }
        
        const homePathStart = HOME_PATH_STARTS[player.color];
        // Check for finishing
        // The 6th spot in the home stretch is the goal. A piece's position becomes homePathStart + 6 to finish.
        if (piece.position === homePathStart + 6) {
            piece.position = 100; // Mark as finished
        } else {
             // Check for collisions (sending opponent piece home)
            if (piece.position < 52) {
                const absolutePos = (piece.position + START_POSITIONS[player.color]) % 52;
                if (!SAFE_SPOTS.includes(absolutePos)) {
                    players.forEach((otherPlayer, otherPlayerIndex) => {
                        if (otherPlayer.color === player.color) return;
                        otherPlayer.pieces.forEach(otherPiece => {
                            if (otherPiece.position < 52 && otherPiece.position !== -1) {
                                const otherAbsolutePos = (otherPiece.position + START_POSITIONS[otherPlayer.color]) % 52;
                                if (absolutePos === otherAbsolutePos) {
                                    otherPiece.position = -1; // Send back to home
                                    gameMessage.textContent = `Sent a ${otherPlayer.color} piece home!`;
                                }
                            }
                        });
                    });
                }
            }
        }

        renderBoard();
        checkForWin(player);

        if (diceValue !== 6) {
            setTimeout(switchPlayer, 500);
        } else {
            canRollDice = true;
            rollDiceBtn.disabled = false;
            gameMessage.textContent = "Rolled a 6! Roll again.";
            highlightMovablePieces();
        }
    }

    /**
     * Switches the turn to the next active player.
     */
    function switchPlayer() {
        currentPlayerIndex = (currentPlayerIndex + 1) % playerCount;
        
        // Skip players who have already won
        while(players[currentPlayerIndex].hasWon) {
            currentPlayerIndex = (currentPlayerIndex + 1) % playerCount;
        }

        canRollDice = true;
        rollDiceBtn.disabled = false;
        diceValue = 0;
        diceElement.textContent = '';
        updatePlayerTurnDisplay();
        highlightMovablePieces();
        gameMessage.textContent = `It's ${players[currentPlayerIndex].color}'s turn.`;
    }

    /**
     * Checks if a player has won the game.
     */
    function checkForWin(player) {
        if (player.pieces.every(p => p.position === 100)) {
            player.hasWon = true;
            gameMessage.textContent = `${player.color.toUpperCase()} has won the game!`;
            
            const activePlayers = players.filter(p => !p.hasWon);
            if (activePlayers.length <= 1) {
                endGame();
            }
        }
    }

    /**
     * Ends the game and declares the winner(s).
     */
    function endGame() {
        rollDiceBtn.disabled = true;
        const winner = players.find(p => p.hasWon);
        gameMessage.textContent = `Game Over! ${winner.color.toUpperCase()} is the winner!`;
    }

    /**
     * Updates the UI element showing the current player's turn.
     */
    function updatePlayerTurnDisplay() {
        const currentPlayer = players[currentPlayerIndex];
        if (!currentPlayer) return;
        playerTurnDisplay.textContent = `${currentPlayer.color.toUpperCase()}'s Turn`;
        playerTurnDisplay.style.backgroundColor = `var(--${currentPlayer.color})`;
    }
});
