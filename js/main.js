/*----- classes -----*/
class Cell {
    constructor() {
        this.isHit = false;
        this.hasShip = false;
    }
}

class Player {
    constructor(name, board) {
        this.name = name;
        this.placingShips = true;
        this.shipHealth = [4,4,6,4,2];
        this.prevPlays = [];
        this.shipCoords = {};
        this.board = board;
    }
}

/*----- constants -----*/
const ships = {
    lShip: [[[0,0],[0,1],[0,2],[1,2]],
            [[0,1],[1,1],[2,0],[2,1]],
            [[0,0],[1,0],[1,1],[1,2]],
            [[0,0],[0,1],[1,1],[2,1]]],
    zShip: [[[0,0],[0,1],[1,1],[1,2]],
            [[0,1],[1,0],[1,1],[2,0]]],
    sixShip: [[[0,0],[0,1],[0,2],[0,3],[0,4],[0,5]],
              [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]]],
    fourShip: [[[0,0],[0,1],[0,2],[0,3]],
               [[0,0],[1,0],[2,0],[3,0]]],
    twoShip: [[[0,0],[0,1]],
              [[0,0],[1,0]]]
}

const tools = {
    missile: [[0,0]]
}

/*----- app's state (variables) -----*/
let redBoard;
let red;
let blueBoard;
let blue;
let selected;
let selectedPlayer = "1";
let selectedCell = null;
let currentPlayer;
let currentBoard;
let compTarget;
let compDirection;
let shipIndex;

/*----- cached element references -----*/
const blueBoardEl = document.querySelector("#blue-player .board");
const redBoardEl = document.querySelector("#red-player .board");
const blueRowEls = document.querySelectorAll("#blue-player .row");
const redRowEls = document.querySelectorAll("#red-player .row");
const blueCellEls = document.querySelectorAll('#blue-player .cell');
const redCellEls = document.querySelectorAll('#red-player .cell');

/*----- event listeners -----*/
function initBoardEvents(board) {
    board.addEventListener("mouseover", renderHover);
    board.addEventListener("click", boardClicked);
}

function killBoardEvents(board) {
    board.removeEventListener("mouseover", renderHover);
    board.removeEventListener("click", boardClicked);
}

/*----- functions -----*/

function initialize() {
    redBoard = [];
    for (let x=0;x<10;x++) {
        redBoard.push([]);
        for (let y=0;y<10;y++) {
            redBoard[x].push(new Cell());
        }
    }
    blueBoard = [];
    for (let x=0;x<10;x++) {
        blueBoard.push([]);
        for (let y=0;y<10;y++) {
            blueBoard[x].push(new Cell());
        }
    }
    red = new Player("1", redBoard);
    blue = new Player("-1", blueBoard);
    selectedTool = null;
    selectedPlayer = "1";
    selectedCell = null;
    currentPlayer = "1";
    currentBoard = "red";
    compTarget = null;
    compDirection = null;
    shipIndex = 0;
    play()
}

function play() {
    //render
    renderCells(red.board, "red");

    //kill events
    
    //win check

    if (currentPlayer == "-1") {
        // Comp turn
    }

    else if (currentPlayer == "1") {
        //Check for placing ships
        if (red.placingShips) {
            selectedTool = ships[Object.keys(ships)[shipIndex]][0];
            console.log(selectedTool)
            initBoardEvents(redBoardEl);
            //boardClicked will continue human players turn
            shipIndex++;
            if (shipIndex == 5) {
                red.placingShips = false;
            }
        }
    }
}

function boardClicked(e) {
    if (e.target.className != 'cell') {
        return;
    }
    else {
        let str = e.target.id;
        str = str.substring(0,3);
        selectedCell = str.split("-");
        console.log(selectedCell);
        let computedCoords = computeCoords(selectedTool, selectedCell);
        if (isValid(computedCoords)) {
            computedCoords.forEach(function(coord) {
                red.board[coord[0]][coord[1]].hasShip = true;
            })
            killBoardEvents(currentBoard == 'red' ? redBoardEl:blueBoardEl);
            play();
        }
        else {
        }
    }
}

function isValid(coords, board) {
    let valid = false;

    for (let i=0;i<coords.length;i++) {
        valid = !coords[i].some(coord => coord > 9);
    }
    return valid;
}

function computeCoords(item, coords) {
    //console.log("coords are " + coords);
    //console.log(item)
    let newCoords = [];
    newCoords = item.map(
        function(section) {
            return [section[0] + parseInt(coords[0]),
            section[1] + parseInt(coords[1])];
        }
    )
    return newCoords;
}

function renderHover(e) {
    redCellEls.forEach(function(cell) {
        cell.style.backgroundColor = 'white'
    });
    blueCellEls.forEach(function(cell) {
        cell.style.backgroundColor = 'white'
    });
    let coords = e.target.id.substring(0, 3).split('-');
    let computedCoords = computeCoords(selectedTool, coords);
    if (isValid(computedCoords)) {
        for (i=0;i<computedCoords.length;i++) {
            document.getElementById(`${computedCoords[i][0]}-${computedCoords[i][1]} ${currentBoard}`).style.backgroundColor = 'lightgreen'
        }
    }
    else{
        for (i=0;i<computedCoords.length;i++) {
            if (document.getElementById(`${computedCoords[i][0]}-${computedCoords[i][1]} ${currentBoard}`)) {
                document.getElementById(`${computedCoords[i][0]}-${computedCoords[i][1]} ${currentBoard}`).style.backgroundColor = 'lightcoral'
            }
        }
    }
}

function renderCells(board, playerName, hiddenEls) {
    for (let y=0; y<10; y++) {
        for (let x=0; x<10; x++) {
            if (board[x][y].hasShip) {
                document.getElementById(`${x}-${y} ${playerName}`).style.backgroundColor = 'grey';
            }
        }
    }
}

initialize();