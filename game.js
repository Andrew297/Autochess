// New game button
var newGameBtn = document.getElementById('newgame');
var testing = true; // set true to run test code

var stockfish = new Worker("node_modules/stockfish/src/stockfish.js");

stockfish.onmessage = function(line) {
  console.log("Line: " + line.data);
  if (typeof line !== "string") {
      return;
  }
}


newGameBtn.onclick = function() {
    var chessBoard = document.getElementById('chessboard');
    newGameBtn.style.display = 'none';
    chessBoard.innerHTML = '<div id="myBoard" style="width: 400px"></div><button class="button" id="startGameBtn">Start!</button>';

    var board = buildBoard();

    var startGameBtn = document.getElementById('startGameBtn');
    startGameBtn.onclick = function() {
      startGameBtn.style.display = 'none';
      var start_fen = board.fen();
      console.log(start_fen);

    };
};

function buildBoard() {
    var board = Chessboard('myBoard', {
        draggable: true,
        dropOffBoard: 'trash',
        sparePieces: true
    })
    return board;
}
