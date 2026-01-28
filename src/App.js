import { useState } from "react";

export const BoardCell = ({value, onClick, keynum, emphasis}) => {
  return <button className={"square" + (emphasis ? " emphasis" : "")} onClick={onClick} id={'cellbtn-' + keynum}>{value}</button>;
}

export const BoardRow = ({s, rownum, text, valuelist=[], clickFunction, lastMove}) => {
  if (valuelist.length === 0) {
    valuelist = Array(s*s).fill(null).map((_, i) => 1 + i);
  }
  const cells = Array(s).fill(null).map((_, i) => (
    <BoardCell key={i + rownum * s}
                value={(text === "enum" ? valuelist[i + rownum * s] : text)} 
                onClick={() => clickFunction(i + rownum * s)}
                keynum={i + s * rownum}
                emphasis={lastMove === i + rownum * s}/>
  ));
  return <div className="board-row">{cells}</div>;
}

export const Board = ({ dim = 3, isXturn = true, squares, onPlay, lastMove }) => {
  const rows = Array(dim).fill(null).map((_, i) => (
    <BoardRow key={'row-' + i} s={dim} rownum={i} text="enum" lastMove={lastMove}
      valuelist={squares}
      clickFunction={
        (index) => {
          const newSquares = squares.slice();
          if (!newSquares[index]) newSquares[index] = isXturn ? "X" : "O";
          onPlay(newSquares);
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
      <button disabled={current === 0} onClick={() => jumpTo(current - 1)}>&lt;</button>
      <button disabled={current === history.length - 1} onClick={() => jumpTo(current + 1)}>&gt;</button>
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
  for (let minusplus = -1; minusplus <= 1; minusplus += 2) {
    let step = 1;
    while (step < winlength) {
      const x = startX + step * deltaX * minusplus;
      const y = startY + step * deltaY * minusplus;
      if (x < 0 || x >= dim || y < 0 || y >= dim) {
        break;
      }
      const index = y * dim + x;
      if (map[index] === player) {
        count++;
      } else {
        break;
      }
      step++;
    }
  }
  return count;
}

function calculateWinner(squares, dim, winlength) {
  for (let i = 0; i < squares.length; i++) {
    if (squares[i]) {
      const horiz = checkDirFrom(squares, i, dim, 1, 0, winlength);
      const vert = checkDirFrom(squares, i, dim, 0, 1, winlength);
      const diag1 = checkDirFrom(squares, i, dim, 1, 1, winlength);
      const diag2 = checkDirFrom(squares, i, dim, 1, -1, winlength);
      if (horiz >= winlength || vert >= winlength || diag1 >= winlength || diag2 >= winlength) {
        return squares[i];
      }
    }
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

  const handlePlay = (newSquares) => {
    if (winner) {
      alert(`Game over! Player ${winner} has already won.`);
      return;
    }
    setHistory(history.slice(0, moveNumber + 1).concat([newSquares]));
    setIsXnext(!isXnext);
    setMoveNumber(moveNumber + 1);
    setLastMove(findDifference(currentGameMap, newSquares));
    const win = calculateWinner(newSquares, boardSize, [2, 3, 4, 4, 5, 5][boardSize - 2]);
    if (win) {
      setWinner(win);
      alert(`Player ${win} wins!`);
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

  const boardDimOptions = [2, 3, 4, 5, 6];

  return (
    <>
      <h1>Welcome to our Tic-Tac-Toe game!</h1>
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
            {winner ? <Message text={`Player ${winner} wins!`} rbutton={() => {
              selectBoardSize(boardSize);
            }} />
              : <Message text={
              `Next player: <b>${isXnext ? "X" : "O"}</b>`} />}
            <Board dim={boardSize} isXturn={isXnext} squares={currentGameMap} onPlay={handlePlay} lastMove={lastMove} />
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