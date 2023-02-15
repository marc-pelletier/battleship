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
            [[0,0],[1,0],[2,0],[2,"-1"]],
            [[0,0],[0,"-1"],[0,"-2"],["-1","-2"]],
            [[0,0],["-1",0],["-2",0],["-2",1]]],
    zShip: [[[0,0],[0,1],[1,1],[1,2]],
            [[0,0],[1,0],[1,"-1"],[2,"-1"]],
            [[0,0],[0,"-1"],["-1","-1"],["-1","-2"]],
            [[0,0],["-1",0],["-1",1],["-2",1]]],
    sixShip: [[[0,0],[0,1],[0,2],[0,3],[0,4],[0,5]],
              [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]],
              [[0,0],[0,"-1"],[0,"-2"],[0,"-3"],[0,"-4"],[0,"-5"]],
              [[0,0],["-1",0],["-2",0],["-3",0],["-4",0],["-5",0]]],
    fourShip: [[[0,0],[0,1],[0,2],[0,3]],
              [[0,0],[1,0],[2,0],[3,0]],
              [[0,0],[0,"-1"],[0,"-2"],[0,"-3"]],
              [[0,0],["-1",0],["-2",0],["-3",0]]],
    twoShip: [[[0,0],[0,1]],
             [[0,0],[1,0]],
             [[0,0],[0,"-1"]],
             [[0,0],["-1",0]]]
}

const tools = {
    missile: [[0,0]]
}

const selectedTool = {
    name: null,
    coords: null
}

const sFX = {
    hit: new Audio('audio/hit.mp3'),
    miss: new Audio('audio/miss.mp3')
}

const gFX = {
    hit: 0,
    miss: 0,
    ships:[
        ["images/ship-front.png","images/ship-middle.png","images/ship-end.png","images/ship-front.png"], //lShip
        ["images/ship-front.png","images/ship-end.png","images/ship-front.png","images/ship-end.png"], //zShip
        ["images/ship-front.png","images/ship-middle.png","images/ship-middle.png","images/ship-middle.png","images/ship-middle.png","images/ship-end.png"], //sixShip
        ["images/ship-front.png","images/ship-middle.png","images/ship-middle.png","images/ship-end.png"], //fourShip
        ["images/2ship-front.png","images/2ship-end.png"]
    ]
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
                computedCoords.forEach(function(coord, section) {
                    let cell = blue.board[coord[0]][coord[1]];
                    cell.hasShip = true;
                    cell.shipName = selectedTool.name;
                    cell.shipSection = section;
                    cell.shipRotation = shipRotation;
                    cell.shipIndex = shipIndex;
                })
                shipIndex++;
            }
        }
        play();
    },
    //Place missiles on board
    placeToBoard: function(coords) {
        setTimeout(() => {
            if (isValid(coords, red)) {
            coords.forEach(function(coord) {
                let cell = red.board[coord[0]][coord[1]];
                cell.isHit = true;
                if (cell.hasShip) {
                    sFX.hit.cloneNode().play();
                    red.shipHealth[cell.shipIndex]--;
                    if (red.shipHealth[cell.shipIndex]<=0){
                        AI.targetCell = null;
                        AI.targetPrevHits();
                        AI.currentDirection = null;
                    }
                    else {
                        if (getRandomNumber(0,99) < 20) {
                            AI.currentDirection = null;
                        }
                        AI.targetCell = coords;
                    }
                    AI.directionsTried = [];
                    blue.prevPlays.push(coords);
                }
                else {
                    sFX.miss.cloneNode().play();
                    blue.prevPlays.push(coords);
                    AI.currentDirection = null;
                    AI.directionsTried = [];
                    swapPlayers();
                }
            })
        }
        play()
    }, 500)
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
            AI.targetPrevHits();
            AI.currentDirection = null;
            AI.directionsTried = [];
        }
        AI.placeToBoard(computedCoords)
    },
    targetPrevHits: function() {
        for (let i = blue.prevPlays.length-1; i >= 0; i--) {
            let y = blue.prevPlays[i][0][0];
            let x = blue.prevPlays[i][0][1];
            if (red.board[y][x].hasShip 
                && red.board[y][x].isHit 
                && red.shipHealth[red.board[y][x].shipIndex] > 0) {
                    AI.targetCell = [[y,x]];
                }
        }
    },
    wait: function(t) {
        let startTime = new Date().getTime();
        let currentTime = new Date().getTime();
        while (currentTime < startTime + t) currentTime = new Date().getTime();
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
    boardEl.addEventListener("click", boardClicked);
    document.addEventListener("keypress", rotateItem)
}

function killBoardEvents(boardEl) {
    boardEl.removeEventListener("click", boardClicked);
    document.removeEventListener("keypress", rotateItem)
}

function initHoverEvents(boardEl) {
    boardEl.addEventListener("mousemove", cellHovered);
}

function killHoverEvents(boardEl) {
    boardEl.removeEventListener("mousemove", cellHovered);
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
        killBoardEvents(redBoardEl)
        killBoardEvents(blueBoardEl)
        renderCells(blue.board, "blue", false);
    }
    else if (!blue.shipHealth.reduce((acc,s) => acc + s, 0)) {
        alert("Red wins");
        killBoardEvents(redBoardEl)
        killBoardEvents(blueBoardEl)
        renderCells(blue.board, "blue", false);
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
    }

    //Player plays
    else if (currentPlayer == "1") {
        //Check if placing ships
        if (red.placingShips) {
            //Check if all ships are placed and turn off placing ships
            if (shipIndex == 5) {
                killBoardEvents(redBoardEl);
                killHoverEvents(redBoardEl);
                currentBoard = "blue"
                initHoverEvents(blueBoardEl);
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
                initHoverEvents(redBoardEl);
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
                        sFX.hit.cloneNode().play();
                        blue.shipHealth[blue.board[coord[0]][coord[1]].shipIndex]--;
                    }
                    else{
                        sFX.miss.cloneNode().play();
                        swapPlayers();
                    }
                }
                else {
                    cell.hasShip = true;
                    cell.shipName = selectedTool.name;
                    cell.shipSection = section;
                    cell.shipRotation = shipRotation;
                    cell.shipIndex = shipIndex;
                }
            })
            if (red.placingShips) {
                if (shipIndex == 5) swapPlayers();
                shipIndex++;
                shipRotation=0;
            }
            killBoardEvents(blueBoardEl);
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
    compTarget = null;
    compDirection = null;
    shipIndex = 0;
    shipRotation = 0;
    hoveredCellCoords = [null, null];
}

function cellHovered(e) {
    if (e.target.className != 'cell') {
        return;
    }
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
            let cellEl = document.getElementById(`${x}-${y} ${playerName}`);
            let cell = board[x][y];
            if (board[x][y].hasShip && board[x][y].isHit) {
                if (blue.shipHealth[blue.board[x][y].shipIndex] <= 0
                    || !hiddenEls) {
                        renderShips(cellEl, cell)
                    }
                cellEl.innerHTML = '<img src="images/hit.png">';
            }
            else if (board[x][y].hasShip && !hiddenEls) {
                renderShips(cellEl, cell);
            }
            else if (board[x][y].isHit) {
                cellEl.innerHTML = '<img src="images/miss.png">';
            }
            else {
                cellEl.innerHTML = '';
                cellEl.style.backgroundImage = '';
            }
        }
    }
}

function renderShips(cellEl, cell) {
    cellEl.style.backgroundImage = 'url("'+gFX.ships[cell.shipIndex][cell.shipSection]+'")';
    if (cell.shipRotation == 1) cellEl.classList.add("rotate90");
    else if (cell.shipRotation == 2) cellEl.classList.add("rotate180");
    else if (cell.shipRotation == 3) cellEl.classList.add("rotate270");
}

initialize();