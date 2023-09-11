import { BehaviorSubject, Observable, combineLatest, concatAll, concatMap, delay, from, fromEvent, interval, map, mapTo, mergeMap, of, range, scan, take, tap, toArray } from "rxjs";
import { User } from "./userModel";
import { BingoGame } from "./bingoGame";

const numberDisplay:HTMLDivElement = document.querySelector('#number-display');
let startBtn:HTMLButtonElement = document.querySelector('#start-btn');
let resetBtn:HTMLButtonElement = document.querySelector('#reset');
let usernameInput:HTMLInputElement = document.querySelector('#username');
let numOfTicketsInput:HTMLInputElement = (<HTMLInputElement>document.querySelector('#numOfTickets'));

numberDisplay.style.display = "none";
resetBtn.style.display = "none";
let bingo = new BingoGame();

let cb:boolean = false;
let username:boolean = false;

async function startGame()
{
  await inputUsername();
  await isChecked();

  if(cb && username)
  {
    numberDisplay.style.display = "flex";
    resetBtn.style.display = "block";
    
    bingo.startGame();

    bingo.logUser(usernameInput.value, 100);
  }
}
function isChecked()
{
  return new Promise<void>((resolve) => {
      const checkBox = document.getElementById('checkbox') as HTMLInputElement;
      checkBox.addEventListener('click', () => {
          if (checkBox.checked) {
              cb = true;
          } else {
              cb = false;
          }
          resolve();
      });
  });
}

function inputUsername()
{
  return new Promise<void>((resolve) => {
    console.log(usernameInput);
    usernameInput.addEventListener('input', () => {
        if(usernameInput.value != "")
        {
          username = true;
        }
        else
        {
          username = false;
        }
        resolve();
    });
});
}

document.addEventListener('DOMContentLoaded', () => {
  startGame();
});



