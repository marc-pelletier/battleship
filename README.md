# Battleship

Battleship is a two player strategy game that became popular during World War 1. It was traditionally played on grid paper marked 'A' through 'J' across and '1' through '10' down. The two players take turns guessing random places on the enemies grid until they hit a ship. Once you hit a ship, you are able to keep guessing until your next miss. You win the game by sinking all of the opposing players ships. 

My battleship game includes a simple AI to act as the other player. It will fire at random cells on the board until it hits a ship. When it hits a ship it will move in a random direction until that ship is destroyed or there are no more valid directions to move. It will then cycle through it's previous plays until it finds a hit cell with a valid direction open next to it. 

## Screenshots
![Placing Ships](Screenshot%202023-02-16%20at%2011-50-15%20Battleship.png)
![Playing Game](Screenshot%202023-02-16%20at%2011-50-57%20Battleship.png)
![Ship Sunk](Screenshot%202023-02-16%20at%2011-49-41%20Battleship.png)

## Technologies used

This game uses HTML, CSS and Javascript


## Getting Started 


### Playing the game
[Click here](https://marc-pelletier.github.io/battleship/) to open the github pages deployment. Start the game by choosing a player. If you would like to watch two computer players play, click neither.

At the start of the game, you will be asked to place your ships. Rotate your ships by using the mouse wheel or pressing your 'R' key. Place your ships in your desired location by clicking on your board. You will see a green highlight for valid placements and a red highlight for invalid placements. 

After all ships are placed, the computer player will place their ships on their board at random locations and with random rotations. 

When it is your turn again, simply click a cell on the other players board to shoot at that location. You will see a green highlight to let you know which cell on their board you are selecting. If you hit a ship, you can immediately go again. If you miss, it swaps to the other players turn. 

### Menu
Open the menu by hitting the square menu button in the top right corner.
Adjust audio by moving the slider up or down.
Start a new game by pressing the 'New Game' menu button.
Resume your current game by pressing the 'Resume Game' menu button.

## Next steps:
- Add in points system
- Add in other tools such as radar or mine
- Find better sound effects 
- Make better assets