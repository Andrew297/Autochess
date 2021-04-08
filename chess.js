var config = {
  draggable: true,
  position: 'start'
}
var board = Chessboard('myBoard', config)

function clickShowPositionBtn () {
  console.log('Current position as an Object:')
  console.log(board.position())

  console.log('Current position as a FEN string:')
  console.log(board.fen())
}

$('#showPositionBtn').on('click', clickShowPositionBtn)
