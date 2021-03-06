#!/usr/bin/env node

// Usage: node app.js <fen-string of initial boardstate>

const { Chess } = require('chess.js')
const chess = new Chess();
const stockfish = require("stockfish");
var engine = stockfish();

var start_fen;        // start position
var position;         // holds string which we send to the uci, of the form "position fen ___"
var positions = [];   // i'th entry will be the boardstate after the i'th move, as a fen string
var moves = "";       // the concatenation of all the moves made, e.g. "e2e4 e8e6 d2d3 ..."
var btime = 30000;    // time in ms left for black to make moves
var wtime = btime;    // same but for white
var current_position; // stores fen-string of current position

// send a command to the uci
function send(str)
{
    console.log("Sending: " + str);
    engine.postMessage(str);
}

// declares the winner and outputs the boardstates in positions
function logResult() {
    if (current_position.includes('w')) {
        console.log("Black wins");
    } else {
        console.log("White wins");
    }

    for (var i = 0; i < positions.length; i++) {
        console.log(positions[i]);
    }
    process.exit(); // close node instance
}

// When uci sends a message (i.e. the string variable <line>) this code is
// run. We print this message and search the message for various words to
// decide whether there is important information we need to extract. Important
// information is: 
// (i) the bestmove, i.e. the move the engine decides to play,
// (ii) the fen string of the boardstate after that move is played,
// (iii) the time taken to make the move, so we can adjust wtime and btime.
engine.onmessage = function(line)
{
    console.log("Line: " + line)
    
    if (typeof line !== "string") {
        return;
    }

    if (line.indexOf("time") > -1) { // if line contains the string "time"...
        
        // Extract the time taken to think. Note that stockfish gives us the
        // time taken to think multiple times before finding the bestmove, so
        // this variable get overwritten multiple times before being used.
        move_time = line.match(/time\s+(\S+)/);
    }

    if (line.indexOf("bestmove") > -1) { // if line contains the string "bestmove"...
        
        // Best move found so now we can subtract move_time from the time
        // white/black has left on the clock.
    if (current_position.includes('w')) { // if it is white's turn...
            wtime -= parseInt(move_time[1]);
            if (wtime < 0) {
                console.log("Game won on time");
                logResult();
            }
        } else {
            btime -= parseInt(move_time[1]);
            if (btime < 0) {
                console.log("Game won on time");
                logResult();
            }
        }

        match = line.match(/bestmove\s+(\S+)/);
        if (match) {
            if (match[1] == "(none)") { // this means checkmate has happened
                console.log("Error in app.js: should not reach this code.")
                console.log("Checkmate");
                logResult();
            } else {
                console.log("Move: " + match[1]);
                moves = moves + " " + match[1]; // store the move made, e.g. "e2e4"
                
                // Update boardstate and position variables.
                chess.move(match[1], { sloppy: true });
                current_position = chess.fen();
                positions.push(current_position);

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

(function get_position()
{
    // start_fen is the start position, which is passed as an argument when running this script.
    // e.g. on the commandline type: node app.js rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
    start_fen = "";
    for (var i = 2; i < process.argv.length; i++) {
        start_fen = start_fen + " " + process.argv[i]
    }

    // Create chess.js chess object which we use for checking for draws.
    chess.load(start_fen);
    position = "position fen " + start_fen;
    current_position = start_fen;

    // setup uci/engine
    send("uci");
    send("ucinewgame");
    
    // wait one second before starting incase uci/engine isn't ready???
    setTimeout(function() {send(position); send("go btime " + btime + " wtime " + wtime);}, 1000);
}());
