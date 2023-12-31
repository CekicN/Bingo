import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, combineLatestAll, concatAll, concatMap, delay, distinct, finalize, from, fromEvent, interval, map, merge, mergeMap, of, scan, switchMap, take, takeUntil, takeWhile, tap, withLatestFrom } from "rxjs";
import { User } from "./userModel";
import { ticket } from "./ticketModel";


const numberDisplay = document.querySelector('#number-display');
const playerBoard = document.querySelector('#tickets');
const numberList = document.querySelector('#numberList');

let startBtn:HTMLButtonElement = document.querySelector('#start-btn');
let resetBtn:HTMLButtonElement = document.querySelector('#reset');

let usernameInput:HTMLInputElement = document.querySelector('#username');
let numOfTicketsInput:HTMLInputElement = (<HTMLInputElement>document.querySelector('#numOfTickets'));
let coinsInput:HTMLInputElement = (<HTMLInputElement>document.querySelector('#coins'));
let selectMode:HTMLSelectElement = document.querySelector("#mode");
let form:HTMLElement =  document.querySelector("form");

function checkNumberWithTickets(number:number, tickets:ticket) {
    return tickets.listOfNumbers.includes(number);
}
export class BingoGame{
    public userSubject:BehaviorSubject<User>;
    public numbers:Subject<number>;
    private stopGame$:Subject<boolean>;
    public tickets:any[]
    private ticketId:number;
    private generatedNumbers:number[];
    constructor()
    {
        this.userSubject = new BehaviorSubject<User>(null);
        this.numbers = new Subject<number>();
        this.stopGame$ = new Subject();
        this.generatedNumbers = []
        this.tickets = [];
        this.ticketId = 0;
    }

    startGame()
    {
        
        const coins = parseInt(coinsInput.value);
        const numOfTickets = parseInt(numOfTicketsInput.value);
        form.parentElement.removeChild(form);

        const resetBtn$ = fromEvent(resetBtn, 'click');

        const generatedNumber$ = this.generateNumbers();

        merge(generatedNumber$, resetBtn$).pipe(
            takeUntil(this.stopGame$)
            ).subscribe({
            next: (val) => {
                if(Array.isArray(val))
                {
                    const generatedNumber = val[val.length-1]
                    this.drawNumber(generatedNumber);
                }
                else
                {
                    this.stopGame();
                }
            },
            complete: () => {
                
                const winTickets = document.querySelectorAll(".win");
                
                //isplata para korisniku
                let pay = this.userSubject.value.price;
                const name = this.userSubject.value.username;
                if(winTickets.length > 0)
                {
                    pay += (winTickets.length - numOfTickets) * coins;
                    pay += selectMode.value == "1" ? numOfTickets*coins*0.5 : numOfTickets*coins * 1.5;
                    alert(`Zaradili ste i imate ${pay}`);
                }
                else
                {
                    pay -= coins*numOfTickets;
                    alert(`Izgubili ste, imate ${pay}`);
                }
                const user:User = {
                    username:name,
                    price:pay
                }

                this.userSubject.next(user);
                fetch("http://localhost:3000/Users/"+name.toString(), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body:JSON.stringify(user)
                }).then(p => p.json()
                .then(q => console.log(q)))
                .catch(err => console.log(err));
            }
        })

        this.addTicket(generatedNumber$);
          
         
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
            win:new BehaviorSubject(false),
            counter:0
        }
        return ticket;
    }

    addTicket(obs:Observable<number[]>)
    {
        const numOfTickets = parseInt(numOfTicketsInput.value);
        const mode = selectMode.value == "1" ? 15 : 10;
        for(let i = 0; i < numOfTickets; i++)
        {
            const ticket = this.generateNumberForTicket()
            this.drawTable(ticket);
            const subscription = obs.subscribe((val) => {
                const generatedNumber = val[val.length-1]

                let listOfNumbers = ticket.listOfNumbers;
                if (selectMode.value == "2") {
                    listOfNumbers = listOfNumbers.filter((val: number) => val % 2 == 0);
                } else if (selectMode.value == "3") {
                    listOfNumbers = listOfNumbers.filter((val: number) => val % 2 != 0);
                }
                if (listOfNumbers.includes(generatedNumber)) {
                    
                    let ticketDiv:HTMLDivElement = playerBoard.querySelector(`#ticket_${ticket.id}`);
                    let div = ticketDiv.querySelector(`.div_${generatedNumber}`);
                    div.classList.add("nadjen_bg");
                    
                    ticket.counter++
                    
                    if(ticket.counter == mode)
                    {
                        ticket.win.next(true);   
                    }
                }
            })

            const winnerSubscription = ticket.win.subscribe((value) => {
                if(value == true)
                {
                    const win = <HTMLDivElement>document.querySelector(`#win_${ticket.id}`);
                    win.className = "win";
                    const sub = this.tickets.find(val => val.ticket == ticket).subscription as Subscription;
                    sub.unsubscribe();
                }
            })
            this.tickets.push({ticket, subscription});
        }
    }

    logUser(name:String, price_:number)
    {
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
        const numberGenerator$ = new Observable<number[]>(observer => {
            interval(100).pipe(
            map(() => Math.floor(Math.random() * 90 + 1)),
            distinct(),
            scan((acc, curr) => {
                if (acc.includes(curr)) {
                return acc;
                }
                return [...acc, curr];
            }, []),
            take(75)
          ).subscribe((val) => {
                observer.next(val);
                //console.log(observer);
                if(val.length >= 75)
                { 
                    this.stopGame();
                    observer.complete();
                }
            });
        })

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


        let listItem = createDiv(numberList, "listItem")
        listItem.textContent = number.toString();
    }
    drawTable(ticket:ticket)
    {
        
        let table = createDiv(playerBoard, "table");

        let d = createDiv(table, "player-board");
        d.id = `ticket_${ticket.id}`;
        let checkWin = createDiv(table, "checkWin");
        checkWin.id = `win_${ticket.id}`;

        ticket.listOfNumbers.forEach((n) => {
            let div = document.createElement('div');
            div.textContent = n.toString();
            div.className = "userNumber"
            div.classList.add(`div_${n}`);
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