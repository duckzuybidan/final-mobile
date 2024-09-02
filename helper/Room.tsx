import {Card, sortHand} from './game_logic';
import Player from './Player';

export default class Room {
    private id: string;
    private name: string;
    private status: string;
    private players: Player[];
    private deck: Card[];
    private onBoardCards: Card[];
    private currentPlayer: number;
    private prevWinner: number;

    constructor(name: string, createPlayer: Player) {
        this.id = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        this.name = name;
        this.status = 'waiting';
        this.players = [createPlayer];
        this.deck = [];
        this.onBoardCards = [];
        this.currentPlayer = 0;
        this.prevWinner = -1;
    }

    public addPlayer(player: Player): void {
        this.players.push(player);
    }

    public removePlayer(player: Player): void {
        this.players = this.players.filter(p => p !== player);
    }

    private generateDeck() {
        
    }

    private shuffleDeck(): void {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    private dealCards(): void {
        let curr = 0;
        while (this.deck.length > 0) {
            const currCard = this.deck.pop();
            if (currCard) {
                this.players[curr].addCard(currCard);
            } else {
                return;
            }
            curr = (curr + 1) % this.players.length;
        }
    }

    public startGame(): void {
        this.status = 'playing';
        this.generateDeck();
        this.shuffleDeck();
        this.dealCards();
        for (const player of this.players) {
            player.sortHand();
            player.setOnTurn(true);
        }
    }

    public isValidPlay(): boolean {
        if (this.onBoardCards// khong phai 2, doi 2, 3 doi thong, 4 doi thong, tu quy
        ) {
            return this.players[this.currentPlayer].isValidPlay(this.onBoardCards);
        }
        // neu la 2, doi 2, 3 doi thong, 4 doi thong, tu quy thi tu tu roi code tiep, nho xet xem player co onTurn hay khong
        return true;        
    }

    private nextPlayer(currPlayer: Player): void {
        if (this.onBoardCards// .isTwo, isPairOfTwo, is 3 doi thong, 4 doi thong, tu quy
        ) {
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
            return;
        }
        while (this.players[this.currentPlayer].getOnTurn() === false) {
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        }
        if (this.players[this.currentPlayer] === currPlayer) {
            this.onBoardCards = [];
        }
        for (const player of this.players) {
            player.setOnTurn(true);
        }
    }

    public skipTurn(): void {
        this.players[this.currentPlayer].setOnTurn(false);
        this.nextPlayer(this.players[this.currentPlayer]);
    }

    public playCard(): void {
        const playedCards = this.players[this.currentPlayer].playCard();
        this.onBoardCards = playedCards;
        this.nextPlayer(this.players[this.currentPlayer]);
    }
}