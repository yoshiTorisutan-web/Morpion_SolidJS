import { createSignal, Component, createEffect, onCleanup } from "solid-js";
import "./index.css";

interface WinningLine {
  winner: string;
  line: Array<[number, number]>;
}

const TicTacToe: Component = () => {
  const [board, setBoard] = createSignal<Array<Array<string | null>>>(
    Array(3).fill(Array(3).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = createSignal<string>("X");
  const [status, setStatus] = createSignal<string>("En cours");
  const [winCountX, setWinCountX] = createSignal(0);
  const [winCountO, setWinCountO] = createSignal(0);
  const [player1Name, setPlayer1Name] = createSignal("");
  const [player2Name, setPlayer2Name] = createSignal("");
  const [player1Symbol, setPlayer1Symbol] = createSignal("X");
  const [player2Symbol, setPlayer2Symbol] = createSignal("O");
  const [isPlayerVsComputer, setIsPlayerVsComputer] = createSignal(false); // Nouvelle fonctionnalité : Mode joueur contre ordinateur
  const [difficulty, setDifficulty] = createSignal("easy"); // Nouvelle fonctionnalité : Difficulté réglable
  const [gameHistory, setGameHistory] = createSignal<
    Array<Array<Array<string | null>>>
  >([]);

  const [player1Time, setPlayer1Time] = createSignal(0);
  const [player2Time, setPlayer2Time] = createSignal(0);

  const [maxTurnTime] = createSignal(30);

  const timerInterval = 1000;

  createEffect(() => {
    const timer = setInterval(() => {
      if (currentPlayer() === "X") {
        setPlayer1Time(player1Time() + 1);
        if (player1Time() >= maxTurnTime()) {
          handleTimeout();
        }
      } else {
        setPlayer2Time(player2Time() + 1);
        if (player2Time() >= maxTurnTime()) {
          handleTimeout();
        }
      }
    }, timerInterval);

    onCleanup(() => {
      clearInterval(timer);
    });
  });

  const resetTimer = () => {
    setPlayer1Time(0);
    setPlayer2Time(0);
  };

  const handleTimeout = () => {
    setStatus(`Temps écoulé pour le joueur ${currentPlayer()}`);
    resetTimer();

    // Arrêter le jeu en cours
    setCurrentPlayer(""); // Définir un joueur vide pour empêcher les clics supplémentaires
    setStatus("Jeu terminé - Temps écoulé");
  };

  const winningLines: Array<Array<[number, number]>> = [
    [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
    ],
    [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    [
      [0, 2],
      [1, 1],
      [2, 0],
    ],
  ];

  const checkWin = (
    newBoard: Array<Array<string | null>>
  ): WinningLine | null => {
    for (let line of winningLines) {
      const [row1, col1] = line[0];
      const [row2, col2] = line[1];
      const [row3, col3] = line[2];

      if (
        newBoard[row1][col1] &&
        newBoard[row1][col1] === newBoard[row2][col2] &&
        newBoard[row1][col1] === newBoard[row3][col3]
      ) {
        return {
          winner: newBoard[row1][col1] as string,
          line: line.map(([row, col]) => [row, col]),
        };
      }
    }
    return null;
  };

  const checkDraw = (newBoard: Array<Array<string | null>>): boolean => {
    return newBoard.flat().every((cell) => cell !== null);
  };

  const handleReset = () => {
    setBoard(Array(3).fill(Array(3).fill(null)));
    setCurrentPlayer("X");
    setStatus("En cours");
    resetTimer();
    handleResetGameHistory();
  };

  const handleWin = (winner: string) => {
    if (winner === player1Symbol()) {
      setWinCountX(winCountX() + 1);
    } else if (winner === player2Symbol()) {
      setWinCountO(winCountO() + 1);
    }
  };

  const handleClick = (row: number, col: number) => () => {
    const newBoard = [...board().map((row) => [...row])];
    if (newBoard[row][col] === null && status() === "En cours") {
      newBoard[row][col] = currentPlayer();
      setBoard(newBoard);
      const winningLine = checkWin(newBoard);
      if (winningLine) {
        setStatus(
          `Victoire de ${
            currentPlayer() === "X" ? player1Name() : player2Name()
          }`
        );
        handleWin(winningLine.winner);
        resetTimer();
      } else if (checkDraw(newBoard)) {
        setStatus("Égalité");
        resetTimer();
      } else {
        handleNextTurn();
      }

      setGameHistory([...gameHistory(), newBoard]);
    }
  };

  const handleNextTurn = () => {
    setCurrentPlayer(currentPlayer() === "X" ? "O" : "X");
    resetTimer();
    if (isPlayerVsComputer() && currentPlayer() === player2Symbol()) {
      makeComputerMove(board());
    }
  };

  const currentPlayerSymbol =
    currentPlayer() === "X" ? player1Symbol() : player2Symbol();

  const makeComputerMove = (currentBoard: Array<Array<string | null>>) => {
    const availableMoves: Array<[number, number]> = [];

    // Trouver tous les mouvements disponibles sur le plateau
    currentBoard.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === null) {
          availableMoves.push([rowIndex, colIndex]);
        }
      });
    });

    // Choisir le meilleur mouvement en fonction de la difficulté
    let bestScore = -Infinity;
    let bestMove: [number, number] | null = null;

    availableMoves.forEach(([row, col]) => {
      // Effectuer le mouvement sur une copie temporaire du plateau
      const newBoard = board().map((row) => [...row]);
      newBoard[row][col] = currentPlayerSymbol;

      // Calculer le score du mouvement en utilisant l'algorithme Minimax
      const score = minimax(newBoard, 0, false);

      // Mettre à jour le meilleur mouvement
      if (score > bestScore) {
        bestScore = score;
        bestMove = [row, col];
      }
    });

    // Mettre à jour le plateau avec le meilleur mouvement de l'ordinateur
    if (bestMove) {
      const newBoard = [...currentBoard.map((row) => [...row])];
      newBoard[bestMove[0]][bestMove[1]] = currentPlayerSymbol;
      setBoard(newBoard);
    }
  };

  const minimax = (
    board: Array<Array<string | null>>,
    depth: number,
    isMaximizingPlayer: boolean
  ): number => {
    const result = checkWin(board);

    if (result) {
      // Si le jeu est terminé, retourner le score en fonction du gagnant
      if (result.winner === player1Symbol()) {
        return -1;
      } else if (result.winner === player2Symbol()) {
        return 1;
      } else {
        return 0;
      }
    }

    if (checkDraw(board)) {
      // Si le jeu est un match nul, retourner un score neutre
      return 0;
    }

    if (isMaximizingPlayer) {
      // Si c'est le tour du joueur, maximiser le score
      let bestScore = -Infinity;

      board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell === null) {
            // Essayer chaque mouvement possible
            const newBoard = [...board.map((row) => [...row])];
            newBoard[rowIndex][colIndex] = player2Symbol();

            // Récursivement, appeler minimax pour le tour du joueur adverse
            const score = minimax(newBoard, depth + 1, false);
            bestScore = Math.max(score, bestScore);
          }
        });
      });

      return bestScore;
    } else {
      // Si c'est le tour de l'ordinateur, minimiser le score
      let bestScore = Infinity;

      board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell === null) {
            // Essayer chaque mouvement possible
            const newBoard = [...board.map((row) => [...row])];
            newBoard[rowIndex][colIndex] = player1Symbol();

            // Récursivement, appeler minimax pour le tour du joueur adverse
            const score = minimax(newBoard, depth + 1, true);
            bestScore = Math.min(score, bestScore);
          }
        });
      });

      return bestScore;
    }
  };

  const handleTogglePlayerVsComputer = () => {
    setIsPlayerVsComputer(!isPlayerVsComputer());
    if (!isPlayerVsComputer()) {
      setPlayer2Name(""); // Réinitialiser le nom du joueur 2 si le mode joueur contre ordinateur est désactivé
    }
  };

  const handleDifficultyChange = (e: Event) => {
    setDifficulty((e.target as HTMLSelectElement).value);
  };

  const handleUndoMove = () => {
    const history = gameHistory();
    if (history.length > 0) {
      const updatedHistory = history.slice(0, -1);
      const prevBoard = updatedHistory[updatedHistory.length - 1];
      setBoard(prevBoard.map((row) => [...row]));
      setGameHistory(updatedHistory);
      setStatus("En cours");
      setCurrentPlayer(currentPlayer() === "X" ? "O" : "X");
    }
  };

  const handleResetGameHistory = () => {
    setGameHistory([]);
  };

  const handleResetStats = () => {
    setWinCountX(0);
    setWinCountO(0);
  };

  return (
    <div class="container">
      <h1 class="text-center my-4 mb-5">
        <b>Jeu de Morpion</b>
      </h1>
      <div class="text-center my-4 mb-5">
        Temps joueur 1 : {player1Time()} secondes
      </div>
      <div class="text-center my-4 mb-5">
        Temps joueur 2 : {player2Time()} secondes
      </div>
      <div class="row g-0">
        <div class="col-12 col-md-12">
          <div class="row">
            {board().map((row, rowIndex) => (
              <div class="col-4 col-md-12">
                <div class="row">
                  {row.map((cell, colIndex) => {
                    const winningLine = checkWin(board());
                    const isWinningCell =
                      winningLine &&
                      winningLine.line.some(
                        ([r, c]) => r === rowIndex && c === colIndex
                      );
                    return (
                      <div class="col-4">
                        <button
                          class={`btn styleBtn m-2 ${cell ? "disabled" : ""} ${
                            isWinningCell ? "winning-cell" : ""
                          }`}
                          style={{
                            width: "100%",
                            height: "100px",
                          }}
                          onClick={handleClick(rowIndex, colIndex)}
                          disabled={!!cell}
                        >
                          {cell}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div class="text-center mt-5 mb-5">
        <h2>
          Statut : <b>{status()}</b>
        </h2>
        <div>
          Victoires de {player1Name()} : {winCountX()}
          <br /> Victoires de {player2Name()} : {winCountO()}
        </div>
      </div>
      <div class="d-flex justify-content-center align-items-center flex-wrap">
        <button class="margePlayer" onClick={handleUndoMove}>
          Annuler le dernier coup
        </button>{" "}
        <button class="margePlayer" onClick={handleReset}>
          Recommencer
        </button>
        {/* Nouvelle fonctionnalité : Annuler le dernier coup */}
        <button class="margePlayer" onClick={handleResetStats}>
          Réinitialiser les statistiques
        </button>{" "}
        {/* Nouvelle fonctionnalité : Réinitialiser les statistiques */}
        <label>
          <input
            class="margeCheckbox mt-3"
            type="checkbox"
            checked={isPlayerVsComputer()}
            onChange={handleTogglePlayerVsComputer}
          />
          Joueur contre ordinateur
        </label>
        {isPlayerVsComputer() && (
          <select value={difficulty()} onChange={handleDifficultyChange}>
            <option value="easy">Facile</option>
            <option value="medium">Moyen</option>
            <option value="hard">Difficile</option>
          </select>
        )}
      </div>
      <div class="d-flex justify-content-center align-items-center flex-wrap">
        <form>
          <label>
            Joueur 1 :&nbsp&nbsp
            <input
              class="margePlayer"
              type="text"
              placeholder="Pseudo"
              value={player1Name()}
              onInput={(e) => setPlayer1Name(e.target.value)}
            />
            <select
              value={player1Symbol()}
              onInput={(e) => setPlayer1Symbol(e.target.value)}
            >
              <option value="X">X</option>
              <option value="O">O</option>
            </select>
          </label>
          <br />
          {!isPlayerVsComputer() && ( // Afficher le joueur 2 uniquement si le mode joueur contre ordinateur est désactivé
            <label>
              Joueur 2 :&nbsp
              <input
                class="margePlayer"
                type="text"
                placeholder="Pseudo"
                value={player2Name()}
                onInput={(e) => setPlayer2Name(e.target.value)}
              />
              <select
                value={player2Symbol()}
                onInput={(e) => setPlayer2Symbol(e.target.value)}
              >
                <option value="X">X</option>
                <option value="O">O</option>
              </select>
            </label>
          )}
        </form>
        <div class="text-center mt-5 mb-5">
          <p>© Copyright - Tristan BOSSARD</p>
        </div>
      </div>
    </div>
  );
};

export default TicTacToe;
