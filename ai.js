/**
 * @file ai.js
 * @author Devin Arena
 * @since 12/5/2019
 * @description Calculates probabilities and generates the 
 *              next best move based on a probability map.
 */

class AI {
  /**
   * Default constructor for AI, takes minesweeper instance as an object.
   * Initializes the probability map and defaults all times to 0.5.
   * 
   * @param {minesweeper.js} game the minesweeper.js instance
   */
  constructor(game) {
    this.game = game;
    // init probability map
    this.probabilityMap = new Array(this.game.board.length);
    for (let i = 0; i < this.probabilityMap.length; i++) {
      this.probabilityMap[i] = new Array(this.game.board[i].length);
      for (let j = 0; j < this.probabilityMap[i].length; j++) {
        this.probabilityMap[i][j] = 0.5; // default to 0.5 (schrodingers mine)
      }
    }
  }

  /**
   * Calculates the next best move based on the probability map.
   */
  nextMove = () => {
    this.calculateProbabilities(); // calculate probability map
    let board = this.game.board; // to avoid this.game.board a bunch
    // check all the board tiles
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        // check if not revealed and not flagged (if it is, its a normal tile)
        if (!board[i][j].revealed && !board[i][j].flagged) {
          // if we know its a mine, flag it
          if (this.probabilityMap[i][j] === 1) {
            board[i][j].flag();
            return;
          }
          // if we know its not a mine, reveal it 
          else if (this.probabilityMap[i][j] === 0) {
            board[i][j].reveal();
            return;
          }
        }
      }
    }
    // if we have no decent move, check if we won
    this.game.checkWin();
    // if we did win, don't try to make a random move (prevents infinite loop)
    if (this.game.won)
      return;
    // WORST CASE SCENARIO: we guess the best probability tile 
    // or just a random tile if all have the same probability
    let min = 0.5;
    let posY = Math.floor(Math.random() * board.length);
    let posX = Math.floor(Math.random() * board[posY].length);
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (this.probabilityMap[i][j] >= 0 && this.probabilityMap[i][j] < min) {
          min = this.probabilityMap[i][j];
          posY = i;
          posX = j;
        }
      }
    }
    board[posY][posX].reveal();
  };

  /**
   * Calculates the probability map.
   */
  calculateProbabilities = () => {
    let board = this.game.board; // to avoid this.game.board a bunch
    // for every tile on the board
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board.length; j++) {
        let t = board[i][j];
        // if this tile is revealed, see if we have any guaranteed tiles around it
        if (t.revealed) {
          this.probabilityMap[i][j] = -1; // -1 to ignore
          // if this tile is satisfied already
          if (t.isSatisfied()) {
            // see if any adjacent unrevealed tiles can be determined as not a mine
            t.getAdjacentUnrevealedTiles().forEach(adj => {
              // if we're a satisfied tile, this tile can't be a mine (0)
              if (!adj.flagged) this.probabilityMap[adj.x][adj.y] = 0;
            });
          } else {
            // if not satisfied try and find some guaranteed mines
            let adj = t.getAdjacentUnrevealedTiles(); // grab adjacent tiles
            adj.forEach(a => {
              // if the number of adjacent tiles is the number of mines, all remaining
              // adjacent tiles must be mines, otherwise, each mine has a (NUMBER - ADJACENT_FLAGS) / ADJACENT chance to be
              // a mine, this is a reduction, but works very well (if there are 4 unrevealed mines and the
              // number is 3, each mine has ~75% chance of being a mine, so another set of tiles might be a better guess)
              if (!a.flagged && this.probabilityMap[a.x][a.y] > 0 && this.probabilityMap[a.x][a.y] < 1) {
                if (t.number >= adj.length)
                  this.probabilityMap[a.x][a.y] = 1;
                else
                  this.probabilityMap[a.x][a.y] = Math.round((t.number - t.getAdjacentFlags().length) / Math.max(adj.length, 1) * 100) / 100;
              }
            });
          }
        }
      }
    }
  };
}
