/*----- classes -----*/
class Cell {
    constructor() {
        this.isHit = false;
        this.hasShip = false;
        this.shipIndex = null;
    }
}

class Player {
    constructor(name, board) {
        this.name = name;
        this.placingShips = true;
        this.shipHealth = [4,4,6,4,2];
        this.prevPlays = [];
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

const selectedTool = {
    name: null,
    coords: null
}

//Stores AI functions and states
const AI = {
    //States
    targetCell: null,
    directionsTried: [],
    currentDirection: null,

    //Places ship in cell object
    placeShip: function() {
        if (shipIndex == 5) {
            blue.placingShips = false;
            swapPlayers();
        }
        else {
            shipRotation=getRandomNumber(0, (ships[Object.keys(ships)[shipIndex]].length-1));
            selectedTool.coords = ships[Object.keys(ships)[shipIndex]][shipRotation];
            selectedTool.name = "ship";
            let computedCoords = computeCoords(selectedTool.coords, [getRandomNumber(0,9),getRandomNumber(0,9)]);
            if (isValid(computedCoords, blue)) {
                computedCoords.forEach(function(coord) {
                    blue.board[coord[0]][coord[1]].hasShip = true;
                    blue.board[coord[0]][coord[1]].shipIndex = shipIndex;
                })
                shipIndex++;
            }
        }
    },
    //Place missiles on board
    placeToBoard: function(coords) {
        if (isValid(coords, red)) {
            coords.forEach(function(coord) {
                let cell = red.board[coord[0]][coord[1]];
                cell.isHit = true;
                if (cell.hasShip) {
                    red.shipHealth[cell.shipIndex]--;
                    if (red.shipHealth[cell.shipIndex]<=0){
                        AI.targetCell = null;
                        AI.currentDirection = null;
                        AI.directionsTried = [];
                        console.log(blue.prevPlays)
                        for (let i = blue.prevPlays.length-1; i >= 0; i--) {
                            let y = blue.prevPlays[i][0][0];
                            let x = blue.prevPlays[i][0][1];
                            console.log(blue.prevPlays[i]);
                            if (red.board[y][x].hasShip 
                                && red.board[y][x].isHit 
                                && red.shipHealth[red.board[y][x].shipIndex] > 0) {
                                    AI.targetCell = [[y,x]]
                                }
                        }
                    }
                    else {
                        AI.targetCell = coords;
                        AI.directionsTried = [];
                    }
                }
                else {
                    AI.currentDirection = null;
                }
                blue.prevPlays.push(coords);
            })
            swapPlayers();
        }
        else {
        }
    },
    //Pick random spot on board and fire missile
    randomMissile: function(min, max) {
        let computedCoords = computeCoords(selectedTool.coords, [getRandomNumber(min,max),getRandomNumber(min,max)]);
        AI.placeToBoard(computedCoords);
    },
    //Walk across board
    walk: function(dir) {
        let directions = [["-1", 0],[0, 1],[1, 0],[0, "-1"]];
        let direction = [directions[dir][0],directions[dir][1]];
        let hasTried = false;
        for (let triedDir of AI.directionsTried) {
            if (triedDir.join() == direction.join()) {
                hasTried = true;
            }
        }
        AI.currentDirection = dir;
        if (hasTried) AI.currentDirection = null;
        else AI.directionsTried.push(direction);
        let computedCoords = computeCoords(AI.targetCell, direction);
        if (AI.directionsTried.length >= 4) {
            AI.targetCell = null;
            AI.currentDirection = null;
            AI.directionsTried = [];
            console.log(blue.prevPlays);
            for (let i = blue.prevPlays.length-1; i >= 0; i--) {
                let y = blue.prevPlays[i][0][0];
                let x = blue.prevPlays[i][0][1];
                console.log(x)
                console.log(y)
                console.log(blue.prevPlays[i]);
                if (red.board[y][x].hasShip 
                    && red.board[y][x].isHit 
                    && red.shipHealth[red.board[y][x].shipIndex] > 0) {
                        AI.targetCell = [[y,x]]
                    }
            }
        }
        AI.placeToBoard(computedCoords);
    }
}

/*----- app's state (variables) -----*/
let redBoard;
let red;
let blueBoard;
let blue;
let selectedPlayer = "1";
let selectedCell = null;
let currentPlayer;
let currentBoard;
let shipIndex;
let shipRotation;
let hoveredCellCoords;

/*----- cached element references -----*/
const blueBoardEl = document.querySelector("#blue-player .board");
const redBoardEl = document.querySelector("#red-player .board");
const blueRowEls = document.querySelectorAll("#blue-player .row");
const redRowEls = document.querySelectorAll("#red-player .row");
const blueCellEls = document.querySelectorAll('#blue-player .cell');
const redCellEls = document.querySelectorAll('#red-player .cell');

/*----- event listeners -----*/
function initBoardEvents(boardEl) {
    boardEl.addEventListener("mousemove", cellHovered);
    boardEl.addEventListener("click", boardClicked);
    document.addEventListener("keypress", rotateItem)
}

function killBoardEvents(boardEl) {
    boardEl.removeEventListener("mousemove", cellHovered);
    boardEl.removeEventListener("click", boardClicked);
    document.removeEventListener("keypress", rotateItem)
}

/*----- functions -----*/

//Playing the game
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
    selectedPlayer = "1";
    selectedCell = null;
    currentPlayer = "1";
    currentBoard = "red";
    compTarget = null;
    compDirection = null;
    shipIndex = 0;
    shipRotation = 0;
    hoveredCellCoords = [null, null]
    play()
}

function play() {
    //Render
    renderCells(red.board, "red", false);
    renderCells(blue.board, "blue", true);
    
    //Win check
    if (!red.shipHealth.reduce((acc,s) => acc + s, 0)) {
        alert("Blue wins");
    }
    else if (!blue.shipHealth.reduce((acc,s) => acc + s, 0)) {
        alert("Red wins");
    }

    //AI plays
    else if (currentPlayer == "-1") {
        if (blue.placingShips) {
            AI.placeShip();
        }
        else if (AI.targetCell) {
            if (AI.currentDirection) AI.walk(AI.currentDirection);
            else AI.walk(getRandomNumber(0,3));
        }
        else {
            AI.randomMissile(0,9);
        }
        play()
    }

    //Player plays
    else if (currentPlayer == "1") {
        //Check if placing ships
        if (red.placingShips) {
            //Check if all ships are placed and turn off placing ships
            if (shipIndex == 5) {
                killBoardEvents(redBoardEl)
                red.placingShips = false;
                swapPlayers();
                play();
            }
            //set selectedTool, initialize board events and end function. 
            //Player turn continues in boardClicked()
            else{
                let shipName = Object.keys(ships)[shipIndex];
                selectedTool.coords = ships[shipName][shipRotation];
                selectedTool.name = shipName;
                initBoardEvents(redBoardEl);
            }
        }
        //initialize blue board events. 
        //Player turn continues in boardClicked()
        else {
            initBoardEvents(blueBoardEl);
        }
    }
}

function boardClicked(e) {
    //Return if anything but cell clicked
    if (e.target.className != 'cell') {
        return;
    }
    else {
        selectedCell = idToArray(e.target.id);
        let computedCoords = computeCoords(selectedTool.coords, selectedCell);
        if (isValid(computedCoords, currentBoard == 'red' ? red:blue)) {
            computedCoords.forEach(function(coord, section) {
                let cell = red.board[coord[0]][coord[1]];
                if (selectedTool.name == "missile") {
                    blue.board[coord[0]][coord[1]].isHit = true;
                    if (blue.board[coord[0]][coord[1]].hasShip == true) {
                        blue.shipHealth[shipIndex]--;
                    }
                    red.prevPlays.push(computedCoords);
                }
                else {
                    cell.hasShip = true;
                    cell.shipName = selectedTool.name;
                    cell.shipSection = section;
                    cell.shipRotation = shipRotation;
                    cell.shipIndex = shipIndex;
                }
            })
            killBoardEvents(currentBoard == 'red' ? redBoardEl:blueBoardEl);
            if (red.placingShips) {
                shipIndex++;
                shipRotation=0;
            }
            else {
                swapPlayers();
            }
            play();
        }
        else {
            return;
        }
    }
}



//Getters

function idToArray(str) {
    return str.substring(0,3).split("-").map(v => parseInt(v));
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min +1)) + min;
}

function isValid(coords, player) {
    for (let i=0;i<coords.length;i++) {
        if (coords[i].some(coord => coord > 9) 
        || coords[i].some(coord => coord < 0)
        || player.placingShips && player.board[coords[i][0]][coords[i][1]].hasShip
        || player.board[coords[i][0]][coords[i][1]].isHit) {
            return false;
        }
    }
    return true;
}

function computeCoords(item, coords) {
    let newCoords = [];
    newCoords = item.map(
        function(section) {
            return [parseInt(section[0]) + parseInt(coords[0]),
            parseInt(section[1]) + parseInt(coords[1])];
        }
    )
    return newCoords;
}



//Setters

function swapPlayers() {
    selectedTool.coords = tools.missile;
    selectedTool.name = "missile";
    selectedCell = null;
    currentPlayer = currentPlayer*-1;
    currentBoard = currentPlayer == 1 ? "blue":"red";
    compTarget = null;
    compDirection = null;
    shipIndex = 0;
    shipRotation = 0;
    hoveredCellCoords = [null, null];
}

function cellHovered(e) {
    hoveredCellCoords = idToArray(e.target.id);
    renderHover(hoveredCellCoords);
}

function rotateItem(e) {
    if (e.key == 'r') {
        if (red.placingShips) {
            shipRotation++;
            if (shipRotation == ships[Object.keys(ships)[shipIndex]].length) shipRotation=0;
            selectedTool.coords = ships[Object.keys(ships)[shipIndex]][shipRotation];
            renderHover(hoveredCellCoords);
        }
    }
}



//Render

function renderHover(coords) {
    redCellEls.forEach(function(cell) {
        cell.style.backgroundColor = 'white'
    });
    blueCellEls.forEach(function(cell) {
        cell.style.backgroundColor = 'white'
    });
    let computedCoords = computeCoords(selectedTool.coords, coords);
    if (isValid(computedCoords, currentBoard == 'red' ? red:blue)) {
        for (i=0;i<computedCoords.length;i++) {
            document.getElementById(`${computedCoords[i][0]}-${computedCoords[i][1]} ${currentBoard}`).style.backgroundColor = 'lightgreen'
        }
    }
    else{
        for (i=0;i<computedCoords.length;i++) {
            if (document.getElementById(`${computedCoords[i][0]}-${computedCoords[i][1]} ${currentBoard}`)) {
                document.getElementById(`${computedCoords[i][0]}-${computedCoords[i][1]} ${currentBoard}`).style.backgroundColor = 'salmon'
            }
        }
    }
}

function renderCells(board, playerName, hiddenEls) {
    for (let y=0; y<10; y++) {
        for (let x=0; x<10; x++) {
            if (board[x][y].hasShip && board[x][y].isHit) {
                document.getElementById(`${x}-${y} ${playerName}`).textContent = 'H';
            }
            else if (board[x][y].hasShip && !hiddenEls) {
                document.getElementById(`${x}-${y} ${playerName}`).textContent = 'S';
            }
            else if (board[x][y].isHit) {
                document.getElementById(`${x}-${y} ${playerName}`).textContent = 'M';
            }
        }
    }
}

initialize();