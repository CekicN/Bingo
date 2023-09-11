import { BehaviorSubject } from "rxjs";

export interface ticket{
    id:number,
    listOfNumbers:Number[],
    win:BehaviorSubject<boolean>,
    counter:number
}