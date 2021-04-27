// New game button
var newGameBtn = document.getElementById('newgame');
var testing = true; // set true to run test code

newGameBtn.onclick = function() {
    var chessBoard = document.getElementById('chessboard');
    newGameBtn.style.display = 'none';
    chessBoard.innerHTML = '<div id="myBoard" style="width: 400px"></div><button class="button" id="startGameBtn">Start!</button>';

    var board = buildBoard();

    var startGameBtn = document.getElementById('startGameBtn');
    startGameBtn.onclick = function() {
      startGameBtn.style.display = 'none';
      var start_fen = board.fen();
      start_fen += " w - - 0 1";
      getMoves(start_fen, board);
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

function getMoves(start_fen, board) {
    var stockfish = new Worker("node_modules/stockfish/src/stockfish.js");
    const chess = new Chess(start_fen);
    var position;         // holds string which we send to the uci, of the form "position fen ___"
    var moves = "";       // the concatenation of all the moves made, e.g. "e2e4 e8e6 d2d3 ..."
    var btime = 10000;    // time in ms left for black to make moves
    var wtime = btime;    // same but for white
    var current_position;

    // send a command to the uci
    function send(str)
    {
        console.log(chess.fen());
        console.log("Sending: " + str);
        stockfish.postMessage(str);
    }

    // declares the winner and outputs the boardstates in positions
    function logResult() {
        if (current_position.includes('w')) {
            console.log("Black wins");
        } else {
            console.log("White wins");
        }
    }

    // When uci sends a message (i.e. the string variable <line>) this code is
    // run. We print this message and search the message for various words to
    // decide whether there is important information we need to extract. Important
    // information is: 
    // (i) the bestmove, i.e. the move the stockfish decides to play,
    // (ii) the fen string of the boardstate after that move is played,
    // (iii) the time taken to make the move, so we can adjust wtime and btime.
    stockfish.onmessage = function(line)
    {
        // console.log("Line: " + line.data)       
        if (typeof line.data !== "string") {
            return;
        }

        if (line.data.indexOf("time") > -1) { // if line contains the string "time"...
            
            // Extract the time taken to think. Note that stockfish gives us the
            // time taken to think multiple times before finding the bestmove, so
            // this variable get overwritten multiple times before being used.
            move_time = line.data.match(/time\s+(\S+)/);
        }

        if (line.data.indexOf("bestmove") > -1) { // if line contains the string "bestmove"...
            
            // Best move found so now we can subtract move_time from the time
            // white/black has left on the clock.
        if (current_position.includes('w')) { // if it is white's turn...
                wtime -= parseInt(move_time[1]);
                if (wtime < 0) {
                    console.log("Game won on time");
                    logResult();
                }
            } else { // it is black's turn...
                btime -= parseInt(move_time[1]);
                if (btime < 0) {
                    console.log("Game won on time");
                    logResult();
                }
            }

            match = line.data.match(/bestmove\s+(\S+)/);
            if (match) { // if line contained the string "bestmove" then...
                if (match[1] == "(none)") { // this means checkmate has happened
                    console.log("Should not reach this code.")
                    console.log("Checkmate");
                    logResult();
                } else {
                    console.log("Move: " + match[1]);
                    moves = moves + " " + match[1]; // store the move made, e.g. "e2e4"
                    
                    // Update boardstate and position variables.
                    chess.move(match[1], { sloppy: true });
                    current_position = chess.fen();

                    // Check for game over. If game is over then report the result and stop calculating.
                    if (chess.game_over()) {
                        if (chess.in_checkmate()) {
                            console.log("Checkmate");
                        } else if (chess.in_stalemate()) {
                            console.log("Stalemate");
                        } else if (chess.in_threefold_repetition()) {
                            console.log("Draw by threefold repetition");
                        } else if (chess.insufficient_material()) {
                            console.log("Draw by insufficient material");
                        } else { // 50 move rule
                            console.log("Draw by 50-move rule");
                        }
                        logResult(); // Report the result and stop the script
                    }
                    board.position(current_position);

                    // Tell stockfish the new board position after making the recommended move.
                    position = "position fen " + start_fen + " moves" + moves;
                    send(position);
                    
                    // This draws a chessboard to the console and sends a message. Importantly,
                    // it also sends a message including the boardstate as a fen string. 
                    send("d");
                    
                    // Prints an evaluation of the current score to the console, e.g. +0.5
                    send("eval");
                    
                    // Tell stockfish to search for the next move.
                    send("go btime " + btime + " wtime " + wtime);
                    return;
                }
            }
        }
    };

    // setup uci/stockfish
    send("uci");
    send("ucinewgame");

    // Create chess.js chess object which we use for checking for draws.
    position = "position fen " + start_fen;
    current_position = start_fen;

    // wait one second before starting incase uci/stockfish isn't ready???
    // await setTimeout(function() {send(position); send("go btime " + btime + " wtime " + wtime);}, 1000);
    send(position);
    send("go btime " + btime + " wtime " + wtime);
}

// // Returns a Promise that resolves after "ms" Milliseconds
// const timer = ms => new Promise(res => setTimeout(res, ms))

// // Function needs to be asynchronus so that await works
// async function playoutGame(board, moves) {
//     for (var i = 0; i < moves.length; i++) {
//         board.position(moves[i]);  // Apply i'th move
//         await timer(500);          // Wait for 500ms so the game doesn't play out too fast 
//         console.log(positions[i], moves[i]);  // See a history of boardstates/moves in the console
//     }
// }