import { BehaviorSubject, Observable, Subject, combineLatest, concatAll, delay, distinct, finalize, from, interval, map, merge, of, scan, switchMap, take, takeUntil, takeWhile, tap } from "rxjs";
import { User } from "./userModel";
import { ticket } from "./ticketModel";


const numberDisplay = document.querySelector('#number-display');
const playerBoard = document.querySelector('#tickets');
let startBtn:HTMLButtonElement = document.querySelector('#start-btn');
let usernameInput:HTMLInputElement = document.querySelector('#username');
let numOfTicketsInput:HTMLInputElement = (<HTMLInputElement>document.querySelector('#numOfTickets'));
let coinsInput:HTMLInputElement = (<HTMLInputElement>document.querySelector('#coins'));
let selectMode:HTMLSelectElement = document.querySelector("#mode");

let form:HTMLElement =  document.querySelector("form");

export class BingoGame{
    public userSubject:BehaviorSubject<User>;
    public numbers:Subject<number>;
    private stopGame$:Subject<boolean>;
    public tickets$:Subject<ticket>
    private ticketId:number;

    constructor()
    {
        this.userSubject = new BehaviorSubject<User>(null);
        this.numbers = new Subject<number>();
        this.stopGame$ = new Subject();
        this.tickets$ = new Subject<ticket>();
        this.ticketId = 0;
    }

    startGame()
    {
        const coins = parseInt(coinsInput.value);
        const numOfTickets = parseInt(numOfTicketsInput.value);
        form.parentElement.removeChild(form);
        
        const generatedNumber$ = this.generateNumbers();
        this.tickets$.subscribe((ticket) => {
            console.log("ticket");
            this.drawTable(ticket);
        })
        const combined$ = combineLatest([this.tickets$, generatedNumber$]).pipe(
            map(([ticket, generatedNumbers]) => {
                const generatedNumber = generatedNumbers[generatedNumbers.length-1]
                this.drawNumber(generatedNumber);
                let listOfNumbers = ticket.listOfNumbers;
                if(selectMode.value == "2")
                {
                    listOfNumbers = listOfNumbers.filter((val:number) => val % 2 == 0);
                }
                else if(selectMode.value == "3")
                {
                    listOfNumbers = listOfNumbers.filter((val:number) => val % 2 != 0);
                }
                if(listOfNumbers.includes(generatedNumber))
                {
                    let div = playerBoard.querySelector(`#div_${generatedNumber}`);
                    div.classList.add("nadjen_bg");
                }
                return generatedNumbers;
            })
        )
        
        const subscription = combined$.subscribe((value) => {
            if(value.length >= 75)
            {
                const winTickets = document.querySelectorAll(".win");
                console.log(winTickets.length);
                //isplata para korisniku
                if(winTickets.length > 0)
                {
                    let pay = this.userSubject.value.price + (winTickets.length - numOfTickets) * coins;
                    if(selectMode.value == "2")
                    {
                        pay += coins * 1.5;
                    }
                    else if(selectMode.value == "3")
                    {
                        pay += coins * 1.5;
                    }
                    else
                    {
                        pay += coins*0.2;
                    }
                    
                    
                    const name = this.userSubject.value.username;
                    
                    
                    const user:User = {
                        username:name,
                        price:pay
                    }
                    this.userSubject.next(user);
                    alert("Zaradjeno " + pay);
                    fetch("http://localhost:3000/Users/"+name.toString(), {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body:JSON.stringify(user)
                    }).then(p => p.json()
                    .then(q => console.log(q)))
                    .catch(err => console.log(err));

                }
                else
                {
                    alert("Izgubili ste");
                    location.reload();
                }
                subscription.unsubscribe();
            }
        });


        const winningTicket$ = this.tickets$.pipe(
            switchMap((ticket) => {
                console.log(ticket);
              return generatedNumber$.pipe(
                scan((acc, generatedNumbers) => {
                    const generatedNumber = generatedNumbers[generatedNumbers.length-1]
                    let listOfNumbers = ticket.listOfNumbers;
                    if(selectMode.value == "2")
                    {
                        listOfNumbers = listOfNumbers.filter((val:number) => val % 2 == 0);
                    }
                    else if(selectMode.value == "3")
                    {
                        listOfNumbers = listOfNumbers.filter((val:number) => val % 2 != 0);
                    }
                    if (listOfNumbers.includes(generatedNumber)) {
                        acc.push(generatedNumber);
                    }
                    return acc;
                }, []),
                map((winningNumbers) => {
                    let winner;
                    if(selectMode.value == "2")
                    {
                        winner = winningNumbers.length >= 5;
                    }
                    else if(selectMode.value == "3")
                    {
                        winner = winningNumbers.length >= 5;
                    }
                    else
                    {
                        winner = winningNumbers.length >= 15;
                    }
                    if(winner)
                    {
                        const win = <HTMLDivElement>document.querySelector(`#win_${ticket.id}`);
                        ticket.win = true;
                        win.className = "win";
                    }

                    return winner;
                })
              );
            })
          ).subscribe();
          
         
    } 
    
    stopGame()
    {
        this.stopGame$.next(true);
    }
    generateNumberForTicket():ticket
    {
        let listOfNumbers:number[] = [];
        let i = 0;
        while(i < 25)
        {
            listOfNumbers.push(Math.floor(Math.random() * 90 + 1));
            i++;
        }
        const ticket:ticket={
            id:this.ticketId++,
            listOfNumbers,
            win:false
        }
        return ticket;
    }

    addTicket()
    {
        this.tickets$.next(this.generateNumberForTicket());
    }

    logUser(name:String, price_:number)
    {
        this.tickets$.pipe()
        let user:User = {
            username: name,
            price: price_
        };
        fetch("http://localhost:3000/Users/"+name.toString()).then(p => {
            if(p.ok)
            {
                p.json().then(q => {
                    user = q
                    this.userSubject.next(user);
                })
                
            }
            else
            {
               try{
                    fetch("http://localhost:3000/Users", {
                        method:'POST',
                        headers: {
                            'Accept':'application/json',
                            'Content-Type': 'application/json'
                        },
                        body:JSON.stringify(user)
                    })
                    .then(p => {
                        if(p.clone().ok)
                        {
                            p.clone().json().then(q => {
                                user = q;
                                this.userSubject.next(user);
                                
                            })
                        }
                    })
                    
                }
                catch(error)
                {
                    console.error("ERROR", error);
                }

            }
            })
    }
    generateNumbers()
    {
        const numberGenerator$ = interval(100).pipe(
            map(() => Math.floor(Math.random() * 90 + 1)),
            distinct(),
            scan((acc, curr) => {
                if (acc.includes(curr)) {
                return acc;
                }
                return [...acc, curr];
            }, []),
            take(75)
          );
        return numberGenerator$;
    }
    drawNumber(number:number)
    {   
        let item = numberDisplay.querySelector(".numberItem");
        numberDisplay.removeChild(item);
        var div = document.createElement('div');
        div.textContent = number.toString();
        div.className = "numberItem";
        numberDisplay.appendChild(div);
    }
    drawTable(ticket:ticket)
    {
        
        let table = createDiv(playerBoard, "table");

        let d = createDiv(table, "player-board");

        let checkWin = createDiv(table, "checkWin");
        checkWin.id = `win_${ticket.id}`;

        ticket.listOfNumbers.forEach((n) => {
            let div = document.createElement('div');
            div.textContent = n.toString();
            div.className = "userNumber"
            div.id = `div_${n}`
            d.appendChild(div);
        })
    }
}

function createDiv(parent:Element, className:string)
{
    let d = document.createElement("div");
    d.className = className;
    parent.appendChild(d);   
    return d;
}