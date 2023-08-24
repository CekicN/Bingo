import { BehaviorSubject, Observable, Subject, combineLatest, concatAll, delay, distinct, from, interval, map, merge, of, scan, switchMap, take, takeUntil, takeWhile, tap } from "rxjs";
import { User } from "./userModel";
import { ticket } from "./ticketModel";


const numberDisplay = document.querySelector('#number-display');
const playerBoard = document.querySelector('#players');
export class BingoGame{
    public userSubject:BehaviorSubject<User>;
    public numbers:Subject<number>;
    private stopGame$:Subject<boolean>;
    public tickets$:Subject<ticket>

    constructor()
    {
        this.userSubject = new BehaviorSubject<User>(null);
        this.numbers = new Subject<number>();
        this.stopGame$ = new Subject();
        this.tickets$ = new Subject<ticket>();
    }

    startGame()
    {
        const generatedNumber$ = this.generateNumbers();
        generatedNumber$.pipe(
            takeUntil(this.stopGame$),
            take(75)
            )
        this.tickets$.subscribe((ticket) => {
            console.log("ticket");
            this.drawTable(ticket);
        })
        combineLatest([this.tickets$, generatedNumber$]).pipe(
            map(([ticket, generatedNumbers]) => {
                const generatedNumber = generatedNumbers[generatedNumbers.length-1]
                this.drawNumber(generatedNumber);
                if(ticket.listOfNumbers.includes(generatedNumber))
                {
                    let div = playerBoard.querySelector(`#div_${generatedNumber}`);
                    div.classList.add("nadjen_bg");
                }
            })
        ).subscribe();

        const winningTicket$ = this.tickets$.pipe(
            switchMap((ticket) => {
                console.log(ticket);
              return generatedNumber$.pipe(
                scan((acc, generatedNumbers) => {
                    const generatedNumber = generatedNumbers[generatedNumbers.length-1]
                    if (ticket.listOfNumbers.includes(generatedNumber)) {
                        acc.push(generatedNumber);
                    }
                    return acc;
                }, []),
                map((winningNumbers) => {
                    const winner = winningNumbers.length >= 15;
                    if(winner)
                    {
                        console.log(winner, ticket);
                    }

                    return winner;
                })
              );
            })
          ).subscribe();
          
          
          
          
          

        this.userSubject.subscribe((user) => {
           
            

            // let winner = new BehaviorSubject<number>(0);
            // winner.subscribe((num) => {
            //   if(num === 15)
            //   {
            //     this.stopGame();
            //   }
            // })
          })
    } 
    
    stopGame()
    {
        this.stopGame$.next(true);
    }
    generateNumberForTicket():ticket
    {
        let listOfNumbers:number[] = [];

        for(let i = 0; i< 25; i++)
        {
            listOfNumbers.push(Math.floor(Math.random() * 90 + 1));
        }
        const ticket:ticket={
            listOfNumbers
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
    drawNumber(number:number)
    {   
        let item = numberDisplay.querySelector(".numberItem");
        numberDisplay.removeChild(item);
        var div = document.createElement('div');
        div.textContent = number.toString();
        div.className = "numberItem";
        numberDisplay.appendChild(div);
    }
    generateNumbers()
    {
        const numberGenerator$ = interval(500).pipe(
            map(() => Math.floor(Math.random() * 90 + 1)),
            distinct(),
            scan((acc, curr) => {
                if (acc.includes(curr)) {
                return acc;
                }
                return [...acc, curr];
            }, [])
          );
        return numberGenerator$;
    }
    drawTable(ticket:ticket)
    {
        let d = document.createElement("div");
        d.className = "player-board"
        playerBoard.appendChild(d);

        ticket.listOfNumbers.forEach((n) => {
            let div = document.createElement('div');
            div.textContent = n.toString();
            div.className = "userNumber"
            div.id = `div_${n}`
            d.appendChild(div);
        })
    }
}