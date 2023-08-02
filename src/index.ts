import { BehaviorSubject, Observable, combineLatest, concatAll, concatMap, delay, from, fromEvent, interval, map, mapTo, mergeMap, of, range, scan, take, tap, toArray } from "rxjs";
import { User } from "./userModel";
import { BingoGame } from "./bingoGame";

let startBtn:HTMLButtonElement = document.querySelector('#start-btn');
const numberDisplay = document.querySelector('#number-display');
const playerBoard = document.querySelector('#players');
let usernameInput:HTMLInputElement = document.querySelector('#username');
let bingo = new BingoGame();
startBtn.addEventListener('click', () => {
  bingo.userSubject.subscribe((user) => {
    console.log("Pocelo")
    drawTable(user);
    
    let winner = new BehaviorSubject<number>(0);
    winner.subscribe((num) => {
      if(num === 15)
      {
        bingo.numbers.unsubscribe();
        console.log("UNSUBSCRIBE")
      }
    })

    bingo.numbers.subscribe((num) => {
      if(user.listOfNumbers.indexOf(num) != -1)
      {
        let div = playerBoard.querySelector(`#div_${num}`);
        div.classList.add("nadjen_bg");
        winner.next(winner.value + 1);
      }
    })
  })


  if(startBtn != null && usernameInput != null)
  {
    startBtn.parentElement.removeChild(startBtn);
    usernameInput.parentElement.removeChild(usernameInput);
  }

  bingo.logUser(usernameInput.value, 100);

    bingo.startGame();
})

function drawTable(user:User)
{
  let d = document.createElement("div");
  d.className = "player-board"
  playerBoard.appendChild(d);

  let usernameText:HTMLElement = document.querySelector('h3')
  usernameText.innerText = user.username.toString();

  user.listOfNumbers.forEach((n) => {
    let div = document.createElement('div');
    div.textContent = n.toString();
    div.className = "userNumber"
    div.id = `div_${n}`
    d.appendChild(div);
  })
}

