import {Card, sortHand} from './game_logic';
import isValidPlay from './game_logic';
import Player from './Player';

class Room {
    private id: string;
    private name: string;
    private status: string;
    private players: Player[];
    private deck: Card[];
    private onBoardCards: Card[];
    private currentPlayer: number;

    constructor(name: string, createPlayer: Player) {
        this.id = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        this.name = name;
        this.status = 'waiting';
        this.players = [createPlayer];
        this.deck = [];
        this.onBoardCards = [];
        this.currentPlayer = 0;
    }

    public addPlayer(player: Player): void {
        this.players.push(player);
    }

    public removePlayer(player: Player): void {
        this.players = this.players.filter(p => p !== player);
    }

    public generateDeck(){
        
    }

    public shuffleDeck(): void {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    public dealCards(): void {
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
        }
    }
}