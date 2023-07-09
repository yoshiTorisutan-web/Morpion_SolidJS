// Importation SolidJS et Bootstrap (index.html)
// Importation fichier CSS

import { createSignal, Component, createEffect, onCleanup } from "solid-js";
import "./index.css";

interface WinningLine {
  winner: string;
  line: Array<[number, number]>;
}

const TicTacToe: Component = () => {
  // Déclaration des états et initialisation

  const [board, setBoard] = createSignal<Array<Array<string | null>>>(
    Array(3).fill(Array(3).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = createSignal<string>("X");
  const [status, setStatus] = createSignal<string>("En cours");
  const [mode, setMode] = createSignal(3);
  const [winCountX, setWinCountX] = createSignal(0);
  const [winCountO, setWinCountO] = createSignal(0);
  const [computerName, setComputerName] = createSignal("MorpionIA");
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
  const [maxTurnTime] = createSignal(10); // Temps maximal en secondes pour chaque tour
  const [gameInProgress, setGameInProgress] = createSignal(false);

  const timerInterval = 1000; // Interval de 1 seconde pour le timer

  createEffect(() => {
    // Effet pour gérer le timer du tour

    let timer: number | undefined;

    if (gameInProgress()) {
      timer = setInterval(() => {
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
    }

    onCleanup(() => {
      clearInterval(timer);
    });
  });

  const resetTimer = () => {
    // Réinitialise les compteurs de temps des joueurs à 0

    setPlayer1Time(0);
    setPlayer2Time(0);
  };

  const handleTimeout = () => {
    // Gère le cas où le temps du joueur est écoulé

    setStatus(`Temps écoulé pour le joueur ${currentPlayer()}`);
    resetTimer();
    handleEndGame();
  };

  const winningLines: Array<Array<[number, number]>> = [
    // Liste des lignes gagnantes possibles

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

  // Vérifie s'il y a une victoire
  const checkWin = (
    newBoard: Array<Array<string | null>>
  ): WinningLine | null => {
    for (let line of winningLines) {
      let hasWinner = true;
      for (let [row, col] of line) {
        if (newBoard[row][col] !== currentPlayer()) {
          hasWinner = false;
          break;
        }
      }
      if (hasWinner) {
        return {
          winner: currentPlayer(),
          line: line.map(([row, col]) => [row, col]),
        };
      }
    }
    return null;
  };

  const checkDraw = (newBoard: Array<Array<string | null>>): boolean => {
    // Vérifie s'il y a un match nul (toutes les cases sont remplies)

    return newBoard.flat().every((cell) => cell !== null);
  };

  const handleReset = () => {
    //Réinitialise le jeu
    const newBoard = Array(mode()).fill(Array(mode()).fill(null));
    setBoard(newBoard);
    setCurrentPlayer("X");
    setStatus("En cours");
    resetTimer();
    handleResetGameHistory();
    setGameInProgress(true);
    if (isPlayerVsComputer()) {
      setPlayer2Name(computerName());
    }
  };

  const handleEndGame = () => {
    // Gère la fin du jeu

    setGameInProgress(false);
    resetTimer();
  };

  // Gère la victoire d'un joueur
  const handleWin = (winner: string) => {
    let winnerName = "";
    if (winner === player1Symbol()) {
      if (player1Symbol() === "X") {
        setWinCountX(winCountX() + 1);
        winnerName = player1Name();
      } else {
        setWinCountO(winCountO() + 1);
        winnerName = player1Name();
      }
    } else if (winner === player2Symbol()) {
      if (player2Symbol() === "X") {
        setWinCountX(winCountX() + 1);
        winnerName = player2Name();
      } else {
        setWinCountO(winCountO() + 1);
        winnerName = player2Name();
      }
    }

    if (winnerName === computerName()) {
      setStatus(`Victoire de ${winnerName}`);
    } else {
      setStatus(`Victoire de ${winnerName}`);
      resetTimer();
      handleEndGame();
    }
  };

  // Gère le clic sur une case du plateau
  const handleClick = (row: number, col: number) => () => {
    if (!gameInProgress() || status() !== "En cours") {
      return;
    }

    const newBoard = [...board().map((row) => [...row])];
    if (
      newBoard[row][col] === null &&
      status() === "En cours" &&
      (!isPlayerVsComputer() ||
        (isPlayerVsComputer() && currentPlayer() === player1Symbol()))
    ) {
      newBoard[row][col] = currentPlayer();
      setBoard(newBoard);

      // Ajouter la vérification de victoire ici
      const winningLine = checkWin(newBoard);
      if (winningLine) {
        setStatus(
          `Victoire de ${
            currentPlayer() === "X" ? player1Name() : player2Name()
          }`
        );
        handleWin(winningLine.winner);
        resetTimer();
        handleEndGame();
      } else if (checkDraw(newBoard)) {
        setStatus("Égalité");
        resetTimer();
        handleEndGame();
      } else {
        handleNextTurn();
      }

      setGameHistory([...gameHistory(), newBoard]);
    }
  };

  const handleNextTurn = () => {
    // Passe au tour suivant
    setCurrentPlayer(
      currentPlayer() === player1Symbol() ? player2Symbol() : player1Symbol()
    );
    resetTimer();

    // Vérifie si la partie est terminée
    const winningLine = checkWin(board());
    if (winningLine) {
      setStatus(`Victoire de ${winningLine.winner}`);
      handleWin(winningLine.winner);
      resetTimer();
      handleEndGame();
    } else if (checkDraw(board())) {
      setStatus("Égalité");
      resetTimer();
      handleEndGame();
    }

    // Si la partie n'est pas terminée et si c'est le tour de l'ordinateur, effectue son mouvement
    if (
      !winningLine &&
      !checkDraw(board()) &&
      isPlayerVsComputer() &&
      currentPlayer() === player2Symbol()
    ) {
      makeComputerMove(board());
    }
  };

  const makeComputerMove = (currentBoard: Array<Array<string | null>>) => {
    // Génère le mouvement de l'ordinateur

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

    const currentPlayerSymbol =
      currentPlayer() === player1Symbol() ? player1Symbol() : player2Symbol();

    availableMoves.forEach(([row, col]) => {
      // Effectuer le mouvement sur une copie temporaire du plateau
      const newBoard = [...currentBoard.map((row) => [...row])];
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
      handleNextTurn(); // Appeler handleNextTurn pour passer au tour du joueur
    }
  };

  const minimax = (
    board: Array<Array<string | null>>,
    depth: number,
    isMaximizingPlayer: boolean
  ): number => {
    // Implémentation de l'algorithme Minimax pour choisir le meilleur mouvement

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

  //Changement de mode
  const handleModeChange = (newMode: number) => {
    if (newMode !== mode()) {
      setMode(newMode);
      handleReset();
    }
  };

  const handleTogglePlayerVsComputer = () => {
    // Active/désactive le mode joueur contre ordinateur

    setIsPlayerVsComputer(!isPlayerVsComputer());
    if (!isPlayerVsComputer()) {
      setPlayer2Name(""); // Réinitialiser le nom du joueur 2 si le mode joueur contre ordinateur est désactivé
    } else {
      setPlayer2Name(computerName()); // Définir le nom de l'ordinateur comme nom du joueur 2
    }
  };

  const handleDifficultyChange = (e: Event) => {
    // Gère le changement de difficulté

    setDifficulty((e.target as HTMLSelectElement).value);
  };

  const handleUndoMove = () => {
    // Annule le dernier coup joué

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
    // Réinitialise l'historique des parties

    setGameHistory([]);
  };

  const handleResetStats = () => {
    // Réinitialise les statistiques

    setWinCountX(0);
    setWinCountO(0);
  };

  //Partie IHM du jeu du Morpion

  return (
    <div class="container">
      <h1 class="text-center my-4 mb-5">
        <b>Jeu de Morpion (Retro)</b>
      </h1>
      <div class="text-center my-4 mb-5">
        Temps joueur 1 : {player1Time()} secondes
      </div>
      <div class="text-center my-4 mb-5">
        Temps joueur 2 : {player2Time()} secondes
      </div>
      <div class="row g-0">
        <div class="col-12 col-md-12">
          {board().map((row, rowIndex) => (
            <div class="row justify-content-center">
              {row.map((cell, colIndex) => {
                const winningLine = checkWin(board());
                const isWinningCell =
                  winningLine &&
                  winningLine.line.some(
                    ([r, c]) => r === rowIndex && c === colIndex
                  );
                return (
                  <div class="col-2 col-md-2">
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
          ))}
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
        <br></br>
        <br></br>
        <h3>Mode de jeu :</h3>
        <button class="margePlayer" onClick={() => handleModeChange(3)}>
          3x3
        </button>
        <button class="margePlayer" onClick={() => handleModeChange(5)}>
          5x5
        </button>
      </div>
      <div class="d-flex justify-content-center align-items-center flex-wrap">
        <button class="margePlayer" onClick={handleReset}>
          Start
        </button>
        <button class="margePlayer" onClick={handleReset}>
          Restart
        </button>
        <button class="margePlayer" onClick={handleUndoMove}>
          Annuler le dernier coup
        </button>{" "}
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
          Joueur contre l'ordi
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
              class="margePlayer inputPlayer"
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
            </select>
          </label>
          <br />
          {!isPlayerVsComputer() && (
            <label>
              Joueur 2 :&nbsp;
              <input
                class="margePlayer inputPlayer"
                type="text"
                placeholder="Pseudo"
                value={player2Name()}
                onInput={(e) => setPlayer2Name(e.target.value)}
              />
              <select
                value={player2Symbol()}
                onInput={(e) => setPlayer2Symbol(e.target.value)}
              >
                <option value="O">O</option>
              </select>
            </label>
          )}
          {isPlayerVsComputer() && (
            <div>
              ORDI : {computerName()} ({player2Symbol()})
            </div>
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
