// Global game state variables.
let curBoard;
let curPlayer;
let gameOver = false;
let enPassantTarget = null;  // For en passant capture.

// Castling rights.
let whiteKingMoved = false;
let blackKingMoved = false;
let whiteKingsideRookMoved = false;
let whiteQueensideRookMoved = false;
let blackKingsideRookMoved = false;
let blackQueensideRookMoved = false;

let curHeldPiece;
let curHeldPieceStartingPosition;

function startGame() {
  const starterPosition = [
    // Black pieces (uppercase) in rows 0 & 1.
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    // White pieces (lowercase) in rows 6 & 7.
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
  ];
  // Reset castling rights.
  whiteKingMoved = blackKingMoved = false;
  whiteKingsideRookMoved = whiteQueensideRookMoved = false;
  blackKingsideRookMoved = blackQueensideRookMoved = false;
  enPassantTarget = null;
  curPlayer = 'white';
  loadPosition(starterPosition, curPlayer);
  updateTurnIndicator();
}

function loadPosition(position, playerToMove) {
  curBoard = position;
  curPlayer = playerToMove;
  const squares = document.getElementsByClassName('square');
  for (const sq of squares) {
    sq.textContent = '';
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (position[i][j] !== '.') {
        loadPiece(position[i][j], [i + 1, j + 1]);
      }
    }
  }
}

function loadPiece(piece, position) {
  const squareElement = document.getElementById(`${position[0]}${position[1]}`);
  const pieceElement = document.createElement('img');
  pieceElement.classList.add('piece');
  pieceElement.id = piece;
  pieceElement.draggable = false;
  pieceElement.src = getPieceImageSource(piece);
  squareElement.appendChild(pieceElement);
}

function getPieceImageSource(piece) {
  // White pieces are lowercase; black pieces are uppercase.
  switch (piece) {
    case 'R': return 'assets/black_rook.png';
    case 'N': return 'assets/black_knight.png';
    case 'B': return 'assets/black_bishop.png';
    case 'Q': return 'assets/black_queen.png';
    case 'K': return 'assets/black_king.png';
    case 'P': return 'assets/black_pawn.png';
    case 'r': return 'assets/white_rook.png';
    case 'n': return 'assets/white_knight.png';
    case 'b': return 'assets/white_bishop.png';
    case 'q': return 'assets/white_queen.png';
    case 'k': return 'assets/white_king.png';
    case 'p': return 'assets/white_pawn.png';
  }
}

function updateTurnIndicator() {
  const indicator = document.getElementById("turnIndicator");
  if (indicator) {
    indicator.textContent = "Turn: " + (curPlayer === 'white' ? "White" : "Black");
  }
}

function setPieceHoldEvents() {
  let mouseX, mouseY = 0;
  document.addEventListener('mousemove', function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });
  const pieces = document.getElementsByClassName('piece');
  let movePieceInterval;
  let hasIntervalStarted = false;
  for (const piece of pieces) {
    piece.addEventListener('mousedown', function(event) {
      if (gameOver) return;
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (!hasIntervalStarted) {
        piece.style.position = 'absolute';
        curHeldPiece = piece;
        const posStr = piece.parentElement.id.split('');
        curHeldPieceStartingPosition = [parseInt(posStr[0]) - 1, parseInt(posStr[1]) - 1];
        movePieceInterval = setInterval(function() {
          piece.style.top = mouseY - piece.offsetHeight / 2 + window.scrollY + 'px';
          piece.style.left = mouseX - piece.offsetWidth / 2 + window.scrollX + 'px';
        }, 1);
        hasIntervalStarted = true;
      }
    });
  }
  document.addEventListener('mouseup', function(event) {
    window.clearInterval(movePieceInterval);
    if (curHeldPiece != null) {
      const boardElement = document.querySelector('.board');
      if (
        event.clientX > boardElement.offsetLeft - window.scrollX &&
        event.clientX < boardElement.offsetLeft + boardElement.offsetWidth - window.scrollX &&
        event.clientY > boardElement.offsetTop - window.scrollY &&
        event.clientY < boardElement.offsetTop + boardElement.offsetHeight - window.scrollY
      ) {
        const mousePosX = event.clientX - boardElement.offsetLeft + window.scrollX;
        const mousePosY = event.clientY - boardElement.offsetTop + window.scrollY;
        const boardBorder = parseInt(getComputedStyle(boardElement).getPropertyValue('border-left-width').split('px')[0]);
        const xPos = Math.floor((mousePosX - boardBorder) / document.getElementsByClassName('square')[0].offsetWidth);
        const yPos = Math.floor((mousePosY - boardBorder) / document.getElementsByClassName('square')[0].offsetHeight);
        const pieceReleasePosition = [yPos, xPos];
        if (
          pieceReleasePosition[0] !== curHeldPieceStartingPosition[0] ||
          pieceReleasePosition[1] !== curHeldPieceStartingPosition[1]
        ) {
          if (validateMovement(curHeldPieceStartingPosition, pieceReleasePosition)) {
            movePiece(curHeldPiece, curHeldPieceStartingPosition, pieceReleasePosition);
          }
        }
      }
      curHeldPiece.style.position = 'static';
      curHeldPiece = null;
      curHeldPieceStartingPosition = null;
    }
    hasIntervalStarted = false;
  });
}

function movePiece(piece, startPos, endPos) {
  if (gameOver) return;
  const boardPiece = curBoard[startPos[0]][startPos[1]];
  if (boardPiece !== '.') {
    // Ensure the piece belongs to the current player.
    if ((boardPiece === boardPiece.toUpperCase() && curPlayer === 'black') ||
        (boardPiece === boardPiece.toLowerCase() && curPlayer === 'white')) {

      // Simulate the move on a copy of the board.
      let tempBoard = JSON.parse(JSON.stringify(curBoard));
      tempBoard[startPos[0]][startPos[1]] = '.';
      tempBoard[endPos[0]][endPos[1]] = boardPiece;
      if (isKingInCheckBoard(tempBoard, curPlayer)) {
        alert("Illegal move: you cannot put your own king in check.");
        return;
      }

      // --- Castling Handling ---
      if (boardPiece.toLowerCase() === 'k' && Math.abs(endPos[1] - startPos[1]) === 2) {
        if (curPlayer === 'white') {
          whiteKingMoved = true;
          if (endPos[1] === 6) { // White kingside.
            if (!validateCastling(startPos, endPos)) return;
            let rook = curBoard[7][7];
            curBoard[7][7] = '.';
            curBoard[7][5] = rook;
            let oldRookSquare = document.getElementById("88");
            let newRookSquare = document.getElementById("86");
            oldRookSquare.textContent = '';
            let rookImg = document.createElement('img');
            rookImg.classList.add('piece');
            rookImg.id = rook;
            rookImg.draggable = false;
            rookImg.src = getPieceImageSource(rook);
            newRookSquare.textContent = '';
            newRookSquare.appendChild(rookImg);
            whiteKingsideRookMoved = true;
          } else if (endPos[1] === 2) { // White queenside.
            if (!validateCastling(startPos, endPos)) return;
            let rook = curBoard[7][0];
            curBoard[7][0] = '.';
            curBoard[7][3] = rook;
            let oldRookSquare = document.getElementById("71");
            let newRookSquare = document.getElementById("74");
            oldRookSquare.textContent = '';
            let rookImg = document.createElement('img');
            rookImg.classList.add('piece');
            rookImg.id = rook;
            rookImg.draggable = false;
            rookImg.src = getPieceImageSource(rook);
            newRookSquare.textContent = '';
            newRookSquare.appendChild(rookImg);
            whiteQueensideRookMoved = true;
          }
        } else {
          blackKingMoved = true;
          if (endPos[1] === 6) { // Black kingside.
            if (!validateCastling(startPos, endPos)) return;
            let rook = curBoard[0][7];
            curBoard[0][7] = '.';
            curBoard[0][5] = rook;
            let oldRookSquare = document.getElementById("18");
            let newRookSquare = document.getElementById("16");
            oldRookSquare.textContent = '';
            let rookImg = document.createElement('img');
            rookImg.classList.add('piece');
            rookImg.id = rook;
            rookImg.draggable = false;
            rookImg.src = getPieceImageSource(rook);
            newRookSquare.textContent = '';
            newRookSquare.appendChild(rookImg);
            blackKingsideRookMoved = true;
          } else if (endPos[1] === 2) { // Black queenside.
            if (!validateCastling(startPos, endPos)) return;
            let rook = curBoard[0][0];
            curBoard[0][0] = '.';
            curBoard[0][3] = rook;
            let oldRookSquare = document.getElementById("11");
            let newRookSquare = document.getElementById("14");
            oldRookSquare.textContent = '';
            let rookImg = document.createElement('img');
            rookImg.classList.add('piece');
            rookImg.id = rook;
            rookImg.draggable = false;
            rookImg.src = getPieceImageSource(rook);
            newRookSquare.textContent = '';
            newRookSquare.appendChild(rookImg);
            blackQueensideRookMoved = true;
          }
        }
      }

      // --- En Passant Handling ---
      let isEnPassantCapture = false;
      if (boardPiece.toLowerCase() === 'p') {
        if (startPos[1] !== endPos[1] && curBoard[endPos[0]][endPos[1]] === '.') {
          isEnPassantCapture = true;
        }
      }

      // Update board array with the move.
      curBoard[startPos[0]][startPos[1]] = '.';
      curBoard[endPos[0]][endPos[1]] = boardPiece;
      
      if (isEnPassantCapture) {
        if (curPlayer === 'white') {
          curBoard[endPos[0] + 1][endPos[1]] = '.';
          const capturedSquare = document.getElementById(`${(endPos[0] + 1) + 1}${endPos[1] + 1}`);
          capturedSquare.textContent = '';
        } else {
          curBoard[endPos[0] - 1][endPos[1]] = '.';
          const capturedSquare = document.getElementById(`${(endPos[0] - 1) + 1}${endPos[1] + 1}`);
          capturedSquare.textContent = '';
        }
      }

      // Update en passant target.
      if (boardPiece.toLowerCase() === 'p' && Math.abs(endPos[0] - startPos[0]) === 2) {
        if (curPlayer === 'white')
          enPassantTarget = [startPos[0] - 1, startPos[1]];
        else
          enPassantTarget = [startPos[0] + 1, startPos[1]];
      } else {
        enPassantTarget = null;
      }

      // Update DOM for moved piece.
      const destSquare = document.getElementById(`${endPos[0] + 1}${endPos[1] + 1}`);
      destSquare.textContent = '';
      destSquare.appendChild(piece);

      // --- Pawn Promotion ---
      if (boardPiece.toLowerCase() === 'p') {
        if ((boardPiece === 'p' && endPos[0] === 0) ||
            (boardPiece === 'P' && endPos[0] === 7)) {
          promotePawn(endPos, boardPiece);
        }
      }

      // Update castling flags if a rook moves from its original square.
      if (boardPiece.toLowerCase() === 'r') {
        if (curPlayer === 'white') {
          if (startPos[0] === 7 && startPos[1] === 7) whiteKingsideRookMoved = true;
          if (startPos[0] === 7 && startPos[1] === 0) whiteQueensideRookMoved = true;
        } else {
          if (startPos[0] === 0 && startPos[1] === 7) blackKingsideRookMoved = true;
          if (startPos[0] === 0 && startPos[1] === 0) blackQueensideRookMoved = true;
        }
      }
      
      // Switch turn.
      curPlayer = (curPlayer === 'white') ? 'black' : 'white';
      updateTurnIndicator();

      // Check for check or checkmate.
      if (isKingInCheckBoard(curBoard, curPlayer)) {
        if (isCheckmate(curPlayer)) {
          alert("Checkmate! " + (curPlayer === 'white' ? "Black" : "White") + " wins!");
          gameOver = true;
        } else {
          alert("Check!");
        }
      }
    }
  }
}

function promotePawn(endPos, pawn) {
  // Auto-promote pawn to queen.
  if (pawn === 'p' && endPos[0] === 0) {
    curBoard[endPos[0]][endPos[1]] = 'q';
    const square = document.getElementById(`${endPos[0] + 1}${endPos[1] + 1}`);
    square.textContent = '';
    const img = document.createElement('img');
    img.classList.add('piece');
    img.id = 'q';
    img.draggable = false;
    img.src = getPieceImageSource('q');
    square.appendChild(img);
  } else if (pawn === 'P' && endPos[0] === 7) {
    curBoard[endPos[0]][endPos[1]] = 'Q';
    const square = document.getElementById(`${endPos[0] + 1}${endPos[1] + 1}`);
    square.textContent = '';
    const img = document.createElement('img');
    img.classList.add('piece');
    img.id = 'Q';
    img.draggable = false;
    img.src = getPieceImageSource('Q');
    square.appendChild(img);
  }
}

// --- Movement Validation Functions (for UI moves) ---

function validateMovement(startPos, endPos) {
  const boardPiece = curBoard[startPos[0]][startPos[1]];
  switch (boardPiece) {
    case 'r':
    case 'R': return validateRookMovement(startPos, endPos);
    case 'n':
    case 'N': return validateKnightMovement(startPos, endPos);
    case 'b':
    case 'B': return validateBishopMovement(startPos, endPos);
    case 'q':
    case 'Q': return validateQueenMovement(startPos, endPos);
    case 'k':
    case 'K': return validateKingMovement(startPos, endPos);
    case 'p': return validatePawnMovement('white', startPos, endPos);
    case 'P': return validatePawnMovement('black', startPos, endPos);
  }
}

function validateBishopMovement(startPos, endPos) {
  if (endPos[0] - endPos[1] === startPos[0] - startPos[1] ||
      endPos[0] + endPos[1] === startPos[0] + startPos[1]) {
    if (!validatePathIsBlocked(startPos, endPos)) return false;
    return true;
  }
  return false;
}

function validateRookMovement(startPos, endPos) {
  if (endPos[0] === startPos[0] || endPos[1] === startPos[1]) {
    if (!validatePathIsBlocked(startPos, endPos)) return false;
    return true;
  }
  return false;
}

function validateKingMovement(startPos, endPos) {
  let dx = endPos[0] - startPos[0];
  let dy = endPos[1] - startPos[1];
  // Handle castling move.
  if (Math.abs(dy) === 2 && dx === 0) {
    return validateCastling(startPos, endPos);
  }
  if ([-1, 0, 1].includes(dx) && [-1, 0, 1].includes(dy)) {
    if (isFriendlyPieceOnEndingPosition(endPos)) return false;
    return true;
  }
  return false;
}

function validateQueenMovement(startPos, endPos) {
  if (endPos[0] - endPos[1] === startPos[0] - startPos[1] ||
      endPos[0] + endPos[1] === startPos[0] + startPos[1] ||
      endPos[0] === startPos[0] || endPos[1] === startPos[1]) {
    if (!validatePathIsBlocked(startPos, endPos)) return false;
    return true;
  }
  return false;
}

function validatePawnMovement(pawnColor, startPos, endPos) {
  let direction = (pawnColor === 'black') ? 1 : -1;
  let isCapture = false;
  // Check diagonal move.
  if (endPos[0] === startPos[0] + direction &&
      [startPos[1] - 1, startPos[1] + 1].includes(endPos[1])) {
    if (isEnemyPieceOnEndingPosition(endPos) ||
       (enPassantTarget && enPassantTarget[0] === endPos[0] && enPassantTarget[1] === endPos[1]))
      isCapture = true;
  }
  let isFirstMove = false;
  if ((pawnColor === 'white' && startPos[0] === 6) ||
      (pawnColor === 'black' && startPos[0] === 1)) {
    isFirstMove = true;
  }
  if (((endPos[0] === startPos[0] + direction ||
       (endPos[0] === startPos[0] + direction * 2 && isFirstMove)) &&
       endPos[1] === startPos[1]) || isCapture) {
    if (isFriendlyPieceOnEndingPosition(endPos)) return false;
    else if (!isCapture && isEnemyPieceOnEndingPosition(endPos)) return false;
    return true;
  }
  return false;
}

function validateKnightMovement(startPos, endPos) {
  const dx = Math.abs(endPos[0] - startPos[0]);
  const dy = Math.abs(endPos[1] - startPos[1]);
  if ((dx === 2 && dy === 1) || (dx === 1 && dy === 2)) {
    if (isFriendlyPieceOnEndingPosition(endPos)) return false;
    return true;
  }
  return false;
}

function validatePathIsBlocked(startPos, endPos) {
  const xDiff = endPos[0] - startPos[0];
  const yDiff = endPos[1] - startPos[1];
  const xDir = (xDiff === 0) ? 0 : (xDiff > 0 ? 1 : -1);
  const yDir = (yDiff === 0) ? 0 : (yDiff > 0 ? 1 : -1);
  let x = startPos[0] + xDir;
  let y = startPos[1] + yDir;
  while (x !== endPos[0] || y !== endPos[1]) {
    const square = document.getElementById(`${x+1}${y+1}`);
    if (square.children.length > 0) return false;
    x += xDir;
    y += yDir;
  }
  if (isFriendlyPieceOnEndingPosition(endPos)) return false;
  return true;
}

// --- Missing Function Added ---
// This function checks if the destination square contains an enemy piece based on curPlayer.
function isEnemyPieceOnEndingPosition(endPos) {
  const destSquare = document.getElementById(`${endPos[0] + 1}${endPos[1] + 1}`);
  if (destSquare.children.length > 0) {
    const destPiece = destSquare.querySelector('.piece').id;
    if ((destPiece === destPiece.toUpperCase() && curPlayer === 'white') ||
        (destPiece === destPiece.toLowerCase() && curPlayer === 'black'))
      return true;
  }
  return false;
}

function isFriendlyPieceOnEndingPosition(endPos) {
  const destSquare = document.getElementById(`${endPos[0] + 1}${endPos[1] + 1}`);
  if (destSquare.children.length > 0) {
    const destPiece = destSquare.querySelector('.piece').id;
    if ((destPiece === destPiece.toUpperCase() && curPlayer === 'black') ||
        (destPiece === destPiece.toLowerCase() && curPlayer === 'white'))
      return true;
  }
  return false;
}

// --- Board-Based Simulation Functions (for check/checkmate) ---

function isSameColor(piece1, piece2) {
  if (piece1 === '.' || piece2 === '.') return false;
  return (piece1 === piece1.toUpperCase() && piece2 === piece2.toUpperCase()) ||
         (piece1 === piece1.toLowerCase() && piece2 === piece2.toLowerCase());
}

function validateMovementOnBoard(board, start, end, piece) {
  if (board[end[0]][end[1]] !== '.' && isSameColor(piece, board[end[0]][end[1]])) {
    return false;
  }
  const type = piece.toUpperCase();
  switch (type) {
    case 'R': return validateRookMovementOnBoard(board, start, end);
    case 'N': return validateKnightMovementOnBoard(board, start, end);
    case 'B': return validateBishopMovementOnBoard(board, start, end);
    case 'Q': return validateQueenMovementOnBoard(board, start, end);
    case 'K': return validateKingMovementOnBoard(board, start, end);
    case 'P': return validatePawnMovementOnBoard(board, start, end, piece);
    default: return false;
  }
}

function validateRookMovementOnBoard(board, start, end) {
  if (start[0] !== end[0] && start[1] !== end[1]) return false;
  if (!validatePathIsClearOnBoard(board, start, end)) return false;
  return true;
}

function validateBishopMovementOnBoard(board, start, end) {
  if (Math.abs(start[0] - end[0]) !== Math.abs(start[1] - end[1])) return false;
  if (!validatePathIsClearOnBoard(board, start, end)) return false;
  return true;
}

function validateQueenMovementOnBoard(board, start, end) {
  if (start[0] === end[0] || start[1] === end[1] ||
      Math.abs(start[0] - end[0]) === Math.abs(start[1] - end[1])) {
    if (!validatePathIsClearOnBoard(board, start, end)) return false;
    return true;
  }
  return false;
}

function validateKnightMovementOnBoard(board, start, end) {
  const dx = Math.abs(start[0] - end[0]);
  const dy = Math.abs(start[1] - end[1]);
  return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
}

function validateKingMovementOnBoard(board, start, end) {
  const dx = Math.abs(start[0] - end[0]);
  const dy = Math.abs(start[1] - end[1]);
  return dx <= 1 && dy <= 1;
}

function validatePawnMovementOnBoard(board, start, end, piece) {
  const direction = (piece === piece.toUpperCase()) ? 1 : -1;
  if (end[0] === start[0] + direction && Math.abs(end[1] - start[1]) === 1) return true;
  if (end[1] === start[1] && end[0] === start[0] + direction && board[end[0]][end[1]] === '.') return true;
  if (end[1] === start[1] &&
      ((piece === 'P' && start[0] === 1) || (piece === 'p' && start[0] === 6)) &&
      end[0] === start[0] + 2 * direction &&
      board[start[0] + direction][start[1]] === '.' &&
      board[end[0]][end[1]] === '.') return true;
  return false;
}

function validatePathIsClearOnBoard(board, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const xStep = (dx === 0) ? 0 : dx / Math.abs(dx);
  const yStep = (dy === 0) ? 0 : dy / Math.abs(dy);
  let x = start[0] + xStep;
  let y = start[1] + yStep;
  while (x !== end[0] || y !== end[1]) {
    if (board[x][y] !== '.') return false;
    x += xStep;
    y += yStep;
  }
  return true;
}

function isKingInCheckBoard(board, kingColor) {
  const kingPos = findKingPositionOnBoard(board, kingColor);
  if (!kingPos) return false;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece !== '.' && isEnemyPieceOnBoard(piece, kingColor)) {
        if (validateMovementOnBoard(board, [i, j], kingPos, piece)) return true;
      }
    }
  }
  return false;
}

function findKingPositionOnBoard(board, kingColor) {
  const kingChar = kingColor === 'black' ? 'K' : 'k';
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (board[i][j] === kingChar) return [i, j];
    }
  }
  return null;
}

function isEnemyPieceOnBoard(piece, kingColor) {
  if (piece === '.') return false;
  return (kingColor === 'black') ? (piece === piece.toLowerCase()) : (piece === piece.toUpperCase());
}

function isFriendlyPieceOnBoard(piece, kingColor) {
  if (piece === '.') return false;
  return (kingColor === 'black') ? (piece === piece.toUpperCase()) : (piece === piece.toLowerCase());
}

function isCheckmate(kingColor) {
  if (!isKingInCheckBoard(curBoard, kingColor)) return false;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = curBoard[i][j];
      if (piece !== '.' && isFriendlyPieceOnBoard(piece, kingColor)) {
        for (let m = 0; m < 8; m++) {
          for (let n = 0; n < 8; n++) {
            if (validateMovementOnBoard(curBoard, [i, j], [m, n], piece)) {
              const tempBoard = JSON.parse(JSON.stringify(curBoard));
              tempBoard[m][n] = piece;
              tempBoard[i][j] = '.';
              if (!isKingInCheckBoard(tempBoard, kingColor)) return false;
            }
          }
        }
      }
    }
  }
  return true;
}

// --- Castling Validation Functions ---
function validateCastling(startPos, endPos) {
  if (curPlayer === 'white') {
    if (!(startPos[0] === 7 && startPos[1] === 4)) return false;
    if (whiteKingMoved) return false;
    if (endPos[1] === 6) {
      if (whiteKingsideRookMoved) return false;
      if (curBoard[7][5] !== '.' || curBoard[7][6] !== '.') return false;
      if (isSquareAttacked([7,4], 'white') ||
          isSquareAttacked([7,5], 'white') ||
          isSquareAttacked([7,6], 'white')) return false;
      return true;
    } else if (endPos[1] === 2) {
      if (whiteQueensideRookMoved) return false;
      if (curBoard[7][1] !== '.' || curBoard[7][2] !== '.' || curBoard[7][3] !== '.') return false;
      if (isSquareAttacked([7,4], 'white') ||
          isSquareAttacked([7,3], 'white') ||
          isSquareAttacked([7,2], 'white')) return false;
      return true;
    }
  } else {
    if (!(startPos[0] === 0 && startPos[1] === 4)) return false;
    if (blackKingMoved) return false;
    if (endPos[1] === 6) {
      if (blackKingsideRookMoved) return false;
      if (curBoard[0][5] !== '.' || curBoard[0][6] !== '.') return false;
      if (isSquareAttacked([0,4], 'black') ||
          isSquareAttacked([0,5], 'black') ||
          isSquareAttacked([0,6], 'black')) return false;
      return true;
    } else if (endPos[1] === 2) {
      if (blackQueensideRookMoved) return false;
      if (curBoard[0][1] !== '.' || curBoard[0][2] !== '.' || curBoard[0][3] !== '.') return false;
      if (isSquareAttacked([0,4], 'black') ||
          isSquareAttacked([0,3], 'black') ||
          isSquareAttacked([0,2], 'black')) return false;
      return true;
    }
  }
  return false;
}

function isSquareAttacked(square, friendlyColor) {
  for (let i = 0; i < 8; i++){
    for (let j = 0; j < 8; j++){
      let piece = curBoard[i][j];
      if (piece !== '.' && !isFriendlyPieceOnBoard(piece, friendlyColor)) {
        if (validateMovementOnBoard(curBoard, [i, j], square, piece)) {
          return true;
        }
      }
    }
  }
  return false;
}

startGame();
setPieceHoldEvents();
