import { BehaviorSubject, Observable, combineLatest, concatAll, concatMap, delay, from, fromEvent, interval, map, mapTo, mergeMap, of, range, scan, take, tap, toArray } from "rxjs";
import { User } from "./userModel";
import { BingoGame } from "./bingoGame";

let startBtn:HTMLButtonElement = document.querySelector('#start-btn');
let usernameInput:HTMLInputElement = document.querySelector('#username');
let numOfTicketsInput:HTMLInputElement = (<HTMLInputElement>document.querySelector('#numOfTickets'));
let bingo = new BingoGame();
startBtn.addEventListener('click', () => {

  bingo.startGame();

  bingo.logUser(usernameInput.value, 100);

  let numOfTickets:number = parseInt(numOfTicketsInput.value);
  for(let i = 0; i < numOfTickets; i++)
  {
    bingo.addTicket();
  }
})



