import {Card, sortHand} from './game_logic';
export default class Player {
    private email: string;
    private name: string;
    private hand: Card[];
    private money: number;

    constructor(email: string, name: string, money: number) {
        this.email = email;
        this.name = name;
        this.hand = [];
        this.money = money;
    }

    public addCard(card: Card): void {
        this.hand.push(card);
    }

    public sortHand(): void {
        this.hand = sortHand(this.hand);
    }
}