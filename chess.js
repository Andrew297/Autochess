// New game button
var newGame = document.getElementById('newgame');

newGame.onclick = function() {
    var chessBoard = document.getElementById('chessboard');
    newGame.style.display = 'none';
    chessBoard.innerHTML = '<div id="myBoard" style="width: 400px"></div>';

    startGame();
};

function startGame() {
  
  var board = Chessboard('myBoard', {
    draggable: true,
    dropOffBoard: 'trash',
    sparePieces: true
  })
}
