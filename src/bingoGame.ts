import { BehaviorSubject, Subject, concatAll, delay, distinct, from, interval, map, of, scan, take, tap } from "rxjs";
import { User } from "./userModel";


const numberDisplay = document.querySelector('#number-display');

export class BingoGame{
    public userSubject:Subject<User>;
    public numbers:Subject<number>;
    numberGenerator$:any!;
    constructor()
    {
        this.userSubject = new Subject<User>();
        this.numbers = new Subject<number>();
    }

    startGame()
    {
        this.generateNumbers().pipe(take(75)).subscribe((number) => {
            let lastNum = number.at(number.length-1);
            this.numbers.next(lastNum);
            this.drawNumber(lastNum);
        })

        return of(null);
    } 
    unsubscribe()
    {
        this.numberGenerator$.unsubscribe();
    }

    generateNumberForUser():number[]
    {
        let listOfNumbers:number[] = [];

        for(let i = 0; i< 25; i++)
        {
            listOfNumbers.push(Math.floor(Math.random() * 90 + 1));
        }

        return listOfNumbers;
    }

    logUser(name:String, price_:number)
    {
        let user:User = {
            username: name,
            price: price_,
            listOfNumbers:[]
        };
        fetch("http://localhost:3000/Users/"+name.toString()).then(p => {
            if(p.ok)
            {
                p.json().then(q => {
                    user = q
                    user.listOfNumbers = this.generateNumberForUser();
                    console.log("Ima user")
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
                                console.log(p.json());
                                console.log(q);
                                user = q;
                                user.listOfNumbers = this.generateNumberForUser();
                                console.log("Nema user")
                                
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
        numberGenerator$ = interval(100).pipe(
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
}