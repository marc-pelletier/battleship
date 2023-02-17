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
        this.targetCell = null;
        this.directionsTried = [];
        this.currentDirection = null;
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
    miss: new Audio('audio/miss.mp3'),
    ship: new Audio('audio/ship.mp3'),
    click: new Audio('audio/click.wav')
}

const gFX = {
    hit: 0,
    miss: 0,
    ships:[
        ["images/ship-front.png","images/ship-middle.png","images/ship-end.png","images/lship-tagalongs.png"], //lShip
        ["images/ship-front.png","images/zship-middle-upper.png","images/zship-middle-lower.png","images/ship-end.png"], //zShip
        ["images/ship-front.png","images/ship-middle.png","images/ship-middle.png","images/ship-middle.png","images/ship-middle.png","images/ship-end.png"], //sixShip
        ["images/ship-front.png","images/ship-middle.png","images/ship-middle.png","images/ship-end.png"], //fourShip
        ["images/2ship-front.png","images/2ship-end.png"]
    ]
}

//Stores AI functions and states
const AI = {
    //Places ship in cell object
    placeShip: function() {
        if (shipIndex == 5) {
            player.placingShips = false;
            swapPlayers();
        }
        else {
            shipRotation=getRandomNumber(0, (ships[Object.keys(ships)[shipIndex]].length-1));
            selectedTool.coords = ships[Object.keys(ships)[shipIndex]][shipRotation];
            selectedTool.name = "ship";
            let computedCoords = computeCoords(selectedTool.coords, [getRandomNumber(0,9),getRandomNumber(0,9)]);
            if (isValid(computedCoords, player)) {
                computedCoords.forEach(function(coord, section) {
                    let cell = player.board[coord[0]][coord[1]];
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
            coords.forEach(function(coord) {
                let cell = enemy.board[coord[0]][coord[1]];
                cell.isHit = true;
                if (cell.hasShip) {
                    let hitSound = sFX.hit.cloneNode();
                    hitSound.volume = volumeSlider.value;
                    hitSound.play();
                    enemy.shipHealth[cell.shipIndex]--;
                    if (enemy.shipHealth[cell.shipIndex]<=0){
                        player.targetCell = null;
                        AI.targetPrevHits();
                        player.currentDirection = null;
                    }
                    else {
                        if (getRandomNumber(0,99) < 20) {
                            player.currentDirection = null;
                        }
                        player.targetCell = coords;
                    }
                    player.directionsTried = [];
                    player.prevPlays.push(coords);
                }
                else {
                    let missSound = sFX.miss.cloneNode();
                    missSound.volume = volumeSlider.value;
                    missSound.play();
                    player.prevPlays.push(coords);
                    player.currentDirection = null;
                    player.directionsTried = [];
                    swapPlayers();
                }
            })
        play()
    }, getRandomNumber(400, 1200))
    },
    //Pick random spot on board and fire missile
    randomMissile: function(min, max) {
        let computedCoords = computeCoords(selectedTool.coords, [getRandomNumber(min,max),getRandomNumber(min,max)]);
        if (isValid(computedCoords, enemy)) AI.placeToBoard(computedCoords);
        else AI.randomMissile(0,9);
    },
    //Walk across board
    walk: function(dir) {
        let directions = [["-1", 0],[0, 1],[1, 0],[0, "-1"]];
        let direction = [directions[dir][0],directions[dir][1]];
        let hasTried = false;
        for (let triedDir of player.directionsTried) {
            if (triedDir.join() == direction.join()) {
                hasTried = true;
            }
        }
        player.currentDirection = dir;
        if (hasTried) player.currentDirection = null;
        else player.directionsTried.push(direction);
        let computedCoords = computeCoords(player.targetCell, direction);
        if (player.directionsTried.length >= 4) {
            AI.targetPrevHits();
            player.currentDirection = null;
            player.directionsTried = [];
        }
        if (isValid(computedCoords, enemy)) AI.placeToBoard(computedCoords);
        else AI.walk(getRandomNumber(0,3));
    },
    //Looks for previous hits on ships and finds the earliest hit with valid surrounding directions available
    targetPrevHits: function() {
        for (let i = player.prevPlays.length-1; i >= 0; i--) {
            let y = player.prevPlays[i][0][0];
            let x = player.prevPlays[i][0][1];
            let yPos = y+1;
            let yNeg = y-1;
            let xPos = x+1;
            let xNeg = x-1;
            if (enemy.board[y][x].hasShip == true
                && enemy.board[y][x].isHit == true
                && enemy.shipHealth[enemy.board[y][x].shipIndex] > 0
                && (isValid([[yPos,x]], enemy)
                || isValid([[yNeg,x]], enemy)
                || isValid([[y,xPos]], enemy)
                || isValid([[y,xNeg]], enemy))) {
                    player.targetCell = [[y,x]];
                }
        }
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
let player;
let enemy;
let playerBoardEl;
let enemyBoardEl;

/*----- cached element references -----*/
const blueCellEls = document.querySelectorAll('#blue-player .cell');
const redCellEls = document.querySelectorAll('#red-player .cell');
const volumeSlider = document.getElementById("sound-slider");
const restartBtn = document.querySelectorAll(".restart");
const resumeBtn = document.querySelectorAll(".resume");
const overlayEl = document.getElementById("overlay");
const menuBtn = document.getElementById("menubtn");
const menuEl = document.getElementById("menu");
const winscreenEl = document.getElementById("win-screen");
const winMessage = document.querySelector("#win-screen h3");
const selectScreenEl = document.getElementById("select-screen");
const selectBtn = document.querySelectorAll(".select-button");

/*----- event listeners -----*/
function initBoardEvents(boardEl) {
    boardEl.addEventListener("click", boardClicked);
    document.addEventListener("keypress", rotateItem)
    document.addEventListener("wheel", rotateItem)
}

function killBoardEvents(boardEl) {
    boardEl.removeEventListener("click", boardClicked);
    document.removeEventListener("keypress", rotateItem)
    document.removeEventListener("wheel", rotateItem)
}

function initHoverEvents(boardEl) {
    boardEl.addEventListener("mousemove", cellHovered);
}

function killHoverEvents(boardEl) {
    boardEl.removeEventListener("mousemove", cellHovered);
    renderHover(null);
}

restartBtn[0].addEventListener("click", () => {
    sFX.click.play();
    menuEl.classList.add("hidden");
    selectScreenEl.classList.remove("hidden");
})

resumeBtn[0].addEventListener("click", () => {
    sFX.click.play();
    overlayEl.classList.add("hidden");
    menuEl.classList.add("hidden");
})

restartBtn[1].addEventListener("click", () => {
    sFX.click.play();
    winscreenEl.classList.add("hidden");
    selectScreenEl.classList.remove("hidden");
})

resumeBtn[1].addEventListener("click", () => {
    sFX.click.play();
    overlayEl.classList.add("hidden");
    winscreenEl.classList.add("hidden");
})

menuBtn.addEventListener("click", () => {
    sFX.click.play();
    overlayEl.classList.remove("hidden");
    menuEl.classList.remove("hidden");
})

selectBtn[0].addEventListener("click", () => {
    sFX.click.play();
    selectScreenEl.classList.add("hidden");
    overlayEl.classList.add("hidden");
    initialize("1");
})

selectBtn[1].addEventListener("click", () => {
    sFX.click.play();
    selectScreenEl.classList.add("hidden");
    overlayEl.classList.add("hidden");
    initialize("-1");
})

selectBtn[2].addEventListener("click", () => {
    sFX.click.play();
    selectScreenEl.classList.add("hidden");
    overlayEl.classList.add("hidden");
    initialize("0");
})

/*----- functions -----*/

//Playing the game

//initialize game board
function initialize(p) {
    for (cell of blueCellEls) {
        cell.classList.remove("rotate90")
        cell.classList.remove("rotate180")
        cell.classList.remove("rotate270")
    }
    for (cell of redCellEls) {
        cell.classList.remove("rotate90")
        cell.classList.remove("rotate180")
        cell.classList.remove("rotate270")
    }
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
    selectedPlayer = p;
    currentPlayer = p;
    red = new Player("1", redBoard, selectedPlayer == "1" ? false:true);
    blue = new Player("-1", blueBoard, selectedPlayer == "-1" ? false:true);
    if (selectedPlayer == "1") {
        player = red;
        enemy = blue;
        playerBoardEl = document.querySelector("#red-player .board");
        enemyBoardEl = document.querySelector("#blue-player .board");
        currentBoard = "red";
    }
    else if (selectedPlayer == "-1"){
        player = blue;
        enemy = red;
        playerBoardEl = document.querySelector("#blue-player .board");
        enemyBoardEl = document.querySelector("#red-player .board");
        currentBoard = "blue";
    }
    else {
        player = red;
        enemy = blue;
        playerBoardEl = document.querySelector("#red-player .board");
        enemyBoardEl = document.querySelector("#blue-player .board");
        currentBoard = "red";
        currentPlayer = 1;
    }
    selectedCell = null;
    compTarget = null;
    compDirection = null;
    shipIndex = 0;
    shipRotation = 0;
    hoveredCellCoords = [null, null]
    killBoardEvents(playerBoardEl);
    killHoverEvents(playerBoardEl);
    killBoardEvents(enemyBoardEl);
    killHoverEvents(enemyBoardEl);
    play()
}


//Runs at the end of every turn or when the AI picks an invalid location 
function play() {
    //Render
    if (selectedPlayer == "1") {
        renderCells(red.board, "red", false)
        renderCells(blue.board, "blue", true)
    }
    else if (selectedPlayer == "-1") {
        renderCells(red.board, "red", true)
        renderCells(blue.board, "blue", false)
    }
    else {
        renderCells(red.board, "red", false)
        renderCells(blue.board, "blue", false)
    }
    
    //Win check
    if (!red.shipHealth.reduce((acc,s) => acc + s, 0)) {
        winMessage.textContent = "Blue has won!"
        overlayEl.classList.remove("hidden");
        winscreenEl.classList.remove("hidden");
        killBoardEvents(playerBoardEl);
        killBoardEvents(enemyBoardEl);
        renderCells(blue.board, "blue", false);
    }
    else if (!blue.shipHealth.reduce((acc,s) => acc + s, 0)) {
        winMessage.textContent = "Red has won!"
        overlayEl.classList.remove("hidden");
        winscreenEl.classList.remove("hidden");
        killBoardEvents(playerBoardEl)
        killBoardEvents(enemyBoardEl)
        renderCells(blue.board, "blue", false);
    }

    //AI plays
    else if (currentPlayer == "-1") {
        if (selectedPlayer == currentPlayer) humanPlays(); 
        else compPlays();
    }

    //Player plays
    else if (currentPlayer == "1") {
        if (selectedPlayer == currentPlayer) humanPlays(); 
        else compPlays();
    }

    else {
        compPlays();
    }
}

function compPlays() {
    if (player.placingShips) {
        AI.placeShip();
    }
    else if (player.targetCell) {
        if (player.currentDirection) AI.walk(player.currentDirection);
        else AI.walk(getRandomNumber(0,3));
    }
    else {
        AI.randomMissile(0,9);
    }
}

function humanPlays() {
    //Check if placing ships
    if (player.placingShips) {
        //Check if all ships are placed and turn off placing ships
        if (shipIndex == 5) {
            killBoardEvents(playerBoardEl);
            killHoverEvents(playerBoardEl);
            selectedPlayer == "1" ? currentBoard = "blue": currentBoard = "red"
            initHoverEvents(enemyBoardEl);
            player.placingShips = false;
            swapPlayers();
            play();
        }
        //set selectedTool, initialize board events and end function 
        //Player turn continues in boardClicked()
        else{
            let shipName = Object.keys(ships)[shipIndex];
            selectedTool.coords = ships[shipName][shipRotation];
            selectedTool.name = shipName;
            initBoardEvents(playerBoardEl);
            initHoverEvents(playerBoardEl);
        }
    }
    //initialize blue board events. 
    //Player turn continues in boardClicked()
    else {
        initBoardEvents(enemyBoardEl);
    }
}


function boardClicked(e) {
    //Return if anything but cell clicked
    if (e.target.className != 'cell') {
        return;
    }
    //else place selected tool to board, swap players, and play() again
    //or place ships if placingShips is true
    else {
        selectedCell = idToArray(e.target.id);
        let computedCoords = computeCoords(selectedTool.coords, selectedCell);
        if (isValid(computedCoords, currentBoard == 'red' ? red:blue)) {
            computedCoords.forEach(function(coord, section) {
                if (selectedTool.name == "missile") {
                    enemy.board[coord[0]][coord[1]].isHit = true;
                    if (enemy.board[coord[0]][coord[1]].hasShip == true) {
                        let hitSound = sFX.hit.cloneNode();
                        hitSound.volume = volumeSlider.value;
                        hitSound.play();
                        enemy.shipHealth[enemy.board[coord[0]][coord[1]].shipIndex]--;
                    }
                    else{
                        let missSound = sFX.miss.cloneNode();
                        missSound.volume = volumeSlider.value;
                        missSound.play();
                        swapPlayers();
                    }
                }
                else {
                    let cell = player.board[coord[0]][coord[1]];
                    cell.hasShip = true;
                    cell.shipName = selectedTool.name;
                    cell.shipSection = section;
                    cell.shipRotation = shipRotation;
                    cell.shipIndex = shipIndex;
                    let shipSound = sFX.ship.cloneNode();
                    shipSound.volume = volumeSlider.value;
                    shipSound.play();
                }
            })
            if (player.placingShips) {
                if (shipIndex == 5) swapPlayers();
                shipIndex++;
                shipRotation=0;
            }
            killBoardEvents(enemyBoardEl);
            killBoardEvents(playerBoardEl);
            play();
        }
        else {
            return;
        }
    }
}



//Getters

//returns cell ids as arrays
function idToArray(str) {
    return str.substring(0,3).split("-").map(v => parseInt(v));
}

//returns a random number
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min +1)) + min;
}

//checks if coordinates are valid to place item on given players board
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

//returns the coordinates of the item or ship plus the selected coordinates
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

//swaps players
function swapPlayers() {
    selectedTool.coords = tools.missile;
    selectedTool.name = "missile";
    selectedCell = null;
    currentPlayer = currentPlayer*-1;
    currentPlayer == 1 ? player = red : player = blue;
    currentPlayer == 1 ? enemy = blue : enemy = red;
    currentPlayer == 1 ? playerBoardEl = document.querySelector("#red-player .board") : playerBoardEl = document.querySelector("#blue-player .board");
    currentPlayer == 1 ? enemyBoardEl = document.querySelector("#blue-player .board") : enemyBoardEl = document.querySelector("#red-player .board");
    compTarget = null;
    compDirection = null;
    shipIndex = 0;
    shipRotation = 0;
    hoveredCellCoords = [null, null];
}

//runs the hovered cell through renderHover 
function cellHovered(e) {
    if (e.target.className != 'cell') {
        return;
    }
    hoveredCellCoords = idToArray(e.target.id);
    renderHover(hoveredCellCoords);
}

//rotates items
function rotateItem(e) {
    if (e.key == 'r') {
        if (player.placingShips) {
            shipRotation++;
            if (shipRotation == ships[Object.keys(ships)[shipIndex]].length) shipRotation=0;
            selectedTool.coords = ships[Object.keys(ships)[shipIndex]][shipRotation];
            renderHover(hoveredCellCoords);
        }
    }
    else if (Math.sign(e.deltaY) == '1') {
        if (player.placingShips) {
            shipRotation++;
            if (shipRotation == ships[Object.keys(ships)[shipIndex]].length) shipRotation = 0;
            selectedTool.coords = ships[Object.keys(ships)[shipIndex]][shipRotation];
            renderHover(hoveredCellCoords);
        }
    }
    else if (Math.sign(e.deltaY) == '-1') {
        if (player.placingShips) {
            shipRotation--;
            if (shipRotation < 0) shipRotation = ships[Object.keys(ships)[shipIndex]].length-1;
            selectedTool.coords = ships[Object.keys(ships)[shipIndex]][shipRotation];
            renderHover(hoveredCellCoords);
        }
    }
}



//Render

//renders item to hovered cell
function renderHover(coords) {
    if (coords == null) {
        redCellEls.forEach(function(cell) {
            cell.style.backgroundColor = 'transparent'
        });
        blueCellEls.forEach(function(cell) {
            cell.style.backgroundColor = 'transparent'
        });
        return;
    }
    redCellEls.forEach(function(cell) {
        cell.style.backgroundColor = 'transparent'
    });
    blueCellEls.forEach(function(cell) {
        cell.style.backgroundColor = 'transparent'
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

//renders ships, hits and misses
function renderCells(board, playerName, hiddenEls) {
    for (let y=0; y<10; y++) {
        for (let x=0; x<10; x++) {
            let cellEl = document.getElementById(`${x}-${y} ${playerName}`);
            let cell = board[x][y];
            if (board[x][y].hasShip && board[x][y].isHit) {
                if (enemy.shipHealth[enemy.board[x][y].shipIndex] <= 0
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

//renders ships
function renderShips(cellEl, cell) {
    cellEl.style.backgroundImage = 'url("'+gFX.ships[cell.shipIndex][cell.shipSection]+'")';
    if (cell.shipRotation == 1) cellEl.classList.add("rotate90");
    else if (cell.shipRotation == 2) cellEl.classList.add("rotate180");
    else if (cell.shipRotation == 3) cellEl.classList.add("rotate270");
}