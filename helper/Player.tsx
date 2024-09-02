import {Card, sortHand} from './game_logic';
import isValidPlay from './game_logic';

export default class Player {
    private email: string;
    private name: string;
    private hand: Card[];
    private money: number;
    private onTurn: boolean;
    private preparedCards: Card[];

    constructor(email: string, name: string, money: number) {
        this.email = email;
        this.name = name;
        this.hand = [];
        this.money = money;
        this.onTurn = true;
        this.preparedCards = [];
    }

    public endGame(): void {
        this.hand = [];
        this.onTurn = true;
        this.preparedCards = [];
    }

    public addCard(card: Card): void {
        this.hand.push(card);
    }

    public sortHand(): void {
        this.hand = sortHand(this.hand);
    }

    public playCard(): Card[] {
        this.hand = this.hand.filter(c => !this.preparedCards.includes(c));
        const playedCards = this.preparedCards;
        this.preparedCards = [];
        return playedCards;
    }

    public getOnTurn(): boolean {
        return this.onTurn;
    }

    public setOnTurn(onTurn: boolean): void {
        this.onTurn = onTurn;
    }

    public addToPreparedCards(card: Card): void {
        this.preparedCards.push(card);
    }

    public removeFromPreparedCards(card: Card): void {
        this.preparedCards = this.preparedCards.filter(c => c !== card);
    }

    public isValidPlay(onBoardCards: Card[]): boolean {
        return isValidPlay(this.preparedCards, onBoardCards);
    }

    public isEndGame(): boolean {
        return this.hand.length === 0;
    }
}