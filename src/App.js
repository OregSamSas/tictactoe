import { useState } from "react";

export const BoardCell = ({value, onClick, keynum, emphasis}) => {
  return <button className={"square" + (emphasis ? " emphasis" : "")} onClick={onClick} id={'cellbtn-' + keynum}>{value}</button>;
}

export const BoardRow = ({s, rownum, text, valuelist=[], clickFunction, highlighted}) => {
  if (valuelist.length === 0) {
    valuelist = Array(s*s).fill(null).map((_, i) => 1 + i);
  }
  const cells = Array(s).fill(null).map((_, i) => (
    <BoardCell key={i + rownum * s}
                value={(text === "enum" ? valuelist[i + rownum * s] : text)} 
                onClick={() => clickFunction(i + rownum * s)}
                keynum={i + s * rownum}
                emphasis={highlighted ? highlighted.includes(i + rownum * s) : false}/>
  ));
  return <div className="board-row">{cells}</div>;
}

export const Board = ({ dim = 3, isXturn = true, squares, onPlay, highlighted }) => {
  const rows = Array(dim).fill(null).map((_, i) => (
    <BoardRow key={'row-' + i} s={dim} rownum={i} text="enum" highlighted={highlighted}
      valuelist={squares}
      clickFunction={
        (index) => {
          const newSquares = squares.slice();
          if (!newSquares[index]) {
            newSquares[index] = isXturn ? "X" : "O";
            onPlay(newSquares);
          }
        }
    } />)
  );
  return <div className="game-board">{rows}</div>;
}

export const HistoryList = ({history, jumpTo, current}) => {
  const items = history.map((step, move) => {
    const desc = move ? `Go to move #${move}` : 'Go to game start';
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)} disabled={move === current}>{desc}</button>
      </li>
    );
  });

  return (
    <>
      <ol id="history-list">{items}</ol>
      <div className="history-navigation">
        <button disabled={current === 0} onClick={() => jumpTo(0)}>&lt;&lt;</button>
        <button disabled={current === 0} onClick={() => jumpTo(current - 1)}>&lt;</button>
        <button disabled={current === history.length - 1} onClick={() => jumpTo(current + 1)}>&gt;</button>
        <button disabled={current === history.length - 1} onClick={() => jumpTo(history.length - 1)}>&gt;&gt;</button>
      </div>
    </>
  )
}

export const Message = ({text, rbutton = undefined}) => {
  return (
    rbutton 
    ? (
      <div className="status">
        <span dangerouslySetInnerHTML={{__html: text}}></span>
        <ResetButton resetMethod={rbutton}/>
      </div>
    ) : (
      <div className="status" dangerouslySetInnerHTML={{__html: text}}></div>
    )
  );
}

export const ResetButton = ({resetMethod = () => { window.location.reload(); }}) => {
  return (
    <button onClick={resetMethod}>Reset</button>
  );
}

function findDifference(arr1, arr2) {
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return i;
    }
  }
  return null;
}

function checkDirFrom(map, pos, dim, deltaX, deltaY, winlength) {
  if (dim <= 0 || !dim) {
    dim = Math.sqrt(map.length);
  }
  const startX = pos % dim;
  const startY = Math.floor(pos / dim);
  const player = map[pos];
  let count = 1;
  let cells = [pos];
  for (let minusplus = -1; minusplus <= 1; minusplus += 2) {
    let step = 1;
    let x = startX + deltaX * minusplus;
    let y = startY + deltaY * minusplus;
    while (step < winlength) {
      x = startX + step * deltaX * minusplus;
      y = startY + step * deltaY * minusplus;
      if (x < 0 || x >= dim || y < 0 || y >= dim) {
        break;
      }
      const index = y * dim + x;
      if (map[index] === player) {
        cells.push(index);
        count++;
      } else {
        break;
      }
      step++;
    }
  }
  return cells;
}

function calculateWinner(squares, dim, winlength) {
  for (let i = 0; i < squares.length; i++) {
    if (squares[i]) {
      const horiz = checkDirFrom(squares, i, dim, 1, 0, winlength);
      const vert = checkDirFrom(squares, i, dim, 0, 1, winlength);
      const diag1 = checkDirFrom(squares, i, dim, 1, 1, winlength);
      const diag2 = checkDirFrom(squares, i, dim, 1, -1, winlength);
      if (horiz.length >= winlength || vert.length >= winlength || diag1.length >= winlength || diag2.length >= winlength) {
        return {player: squares[i], cells: horiz.length >= winlength ? horiz : vert.length >= winlength ? vert : diag1.length >= winlength ? diag1 : diag2};
      }
    }
  }
  if (!squares.includes(null)) {
    return {player: "Draw", cells: Array.from(Array(squares.length).keys())};
  }
  return null;
}

export default function GameApp() {
  const [boardSize, setBoardSize] = useState(2);
  const [isXnext, setIsXnext] = useState(true);
  const [history, setHistory] = useState([Array(boardSize ** 2).fill(null)]);
  const [moveNumber, setMoveNumber] = useState(0);
  const [lastMove, setLastMove] = useState(null);
  const [winner, setWinner] = useState(null);
  const [uiPhase, setUiPhase] = useState("selecting");

  let currentGameMap = history[moveNumber];
  const goalLengths = [2, 3, 4, 4, 4, 5, 5, 5, 5];
  const boardDimOptions = [2, 3, 4, 5, 6, 10];

  const handlePlay = (newSquares) => {
    if (winner) {
      if (history.length === moveNumber + 1) {
        alert(`Game over! Player ${winner.player} has already won.`);
        return;
      } else {
        setWinner(null);
      }
    }
    setHistory(history.slice(0, moveNumber + 1).concat([newSquares]));
    setIsXnext(!isXnext);
    setMoveNumber(moveNumber + 1);
    let thisMove = findDifference(currentGameMap, newSquares)
    setLastMove(thisMove);
    document.getElementById('cellbtn-' + thisMove.toString()).classList.add('clicked');
    console.log(document.getElementById('cellbtn-' + thisMove.toString()));
    const win = calculateWinner(newSquares, boardSize, goalLengths[boardSize - 2]);
    if (win) {
      setWinner(win);
      setUiPhase("gameover");
    }
  }

  const jumpToMove = (move) => {
    setMoveNumber(move);
    setIsXnext((move % 2) === 0);
    if (move === 0) {
      setLastMove(null);
      return;
    }
    setLastMove(findDifference(history[move - 1], history[move]));
  }

  const selectBoardSize = (size) => {
    setBoardSize(size);
    setUiPhase("playing");
    setHistory([Array(size ** 2).fill(null)]);
    setMoveNumber(0);
    setIsXnext(true);
    setLastMove(null);
    setWinner(null);
  }

  let description = "A simple logic <small>(?)</small> game";
  switch (uiPhase) {
    case "selecting":
      description+= ", select a board size to begin.";
      break;
    case "playing":
      description+= `, place X and O in turn, collect ${goalLengths[boardSize - 2]} in a row, a column, or diagonally to win.`;
      break;
    case "gameover":
      description+= ". The game is over. You can reset or select a new board size. Or go back to a previous move and continue playing.";
      break;
    default:
      break;
  }

  return (
    <>
      <h1>Welcome to our Tic-Tac-Toe game!</h1>
      <p className="description" dangerouslySetInnerHTML={{__html: description}}></p>
      <div className="game">
        {uiPhase=="selecting" ? (
        <div>
          <h3>Select Board Size</h3>
          {boardDimOptions.map((size) => (
            <button key={size} onClick={() => { selectBoardSize(size); }}>{size}x{size}</button>
          ))}
        </div>
        ) : (
        <>
          <div id="left-panel">
            <h4>Current Board: <button onClick={() => setUiPhase("selecting")}>{`${boardSize}x${boardSize}`}</button></h4>
            {winner ? <Message text={winner.player === "Draw" ? "It's a draw!" : `Player ${winner.player} wins!`} rbutton={() => {
              selectBoardSize(boardSize);
            }} />
              : <Message text={
              `Next player: <b>${isXnext ? "X" : "O"}</b>`} />}
            <Board dim={boardSize} isXturn={isXnext} squares={currentGameMap} onPlay={handlePlay} highlighted={winner && history.length === moveNumber + 1 ? winner.cells : [lastMove]} />
          </div>
          <div className="game-info">
            <h3>Game History</h3>
            <HistoryList history={history} jumpTo={jumpToMove} current={moveNumber} />
          </div>
        </>
        )}
      </div>
    </>
  );
}