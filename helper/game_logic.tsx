interface Card {
    code: string;
    image: string;
    images: {
      svg: string;
      png: string;
    };
    value: number;
    suit: string;
  }
  const cardValues: { [key: string]: number } = {
    '3': 1, '4': 2, '5': 3, '6': 4, '7': 5,
    '8': 6, '9': 7, '10': 8, 'JACK': 9,
    'QUEEN': 10, 'KING': 11, 'ACE': 12, '2': 13
  };
  

  const suitOrder: { [key: string]: number } = {
    'SPADES': 1, 'CLUBS': 2, 'DIAMONDS': 3, 'HEARTS': 4
  }; 
function isStraight(cards: Card[]): boolean {
    if (cards.length < 3) return false;

    // Sort cards by value
    const sortedCards = cards.sort((a: { value: number; suit: string ; }, b: { value: number; suit: string ; }) => {
        const valueScoreA = cardValues[a.value];
        const valueScoreB = cardValues[b.value];
    
        if (valueScoreA !== valueScoreB) {
          return valueScoreA - valueScoreB;
        }
    
        const suitScoreA = suitOrder[a.suit];
        const suitScoreB = suitOrder[b.suit];
        return suitScoreA - suitScoreB;
      });
    
      for (let i = 1; i < sortedCards.length; i++) {
        if (cardValues[sortedCards[i].value]  !== cardValues[sortedCards[i-1].value] + 1) {
            return false;
        }
    }
    return true;
}

function isPair(cards: Card[]): boolean {
    return cards.length === 2 && cards[0].value === cards[1].value;
}

function isThreeOfAKind(cards: Card[]): boolean {
    return cards.length === 3 && cards[0].value === cards[1].value && cards[1].value === cards[2].value;
}

function isFourOfAKind(cards: Card[]): boolean {
    return cards.length === 4 && cards[0].value === cards[1].value && cards[1].value === cards[2].value && cards[2].value === cards[3].value;
}

 
export default function isValidPlay(cards: Card[],onBoardCards: Card[]): boolean {
     if(onBoardCards.length===0&&(isPair(cards)||isThreeOfAKind(cards)||isFourOfAKind(cards)||isStraight(cards)||cards.length===1)) return true;
     if(onBoardCards.length===1&&cards.length===1&&compareCards(cards[0],onBoardCards[0]))return true;
     if(isPair(cards)&&isPair(onBoardCards)&&compareCards(cards[0],onBoardCards[0])) return true;
     if(isThreeOfAKind(cards)&&isThreeOfAKind(onBoardCards)&&compareCards(cards[0],onBoardCards[0])) return true;
     if(isFourOfAKind(cards)&&isFourOfAKind(onBoardCards)&&compareCards(cards[0],onBoardCards[0])) return true; 
    if(isStraight(cards)&&onBoardCards.length===cards.length&&compareCards(cards[length-1],onBoardCards[length-1])) return true;
    return false; 
}
export const sortHand = (hand: Card[]) => {
    
  
    return hand.sort((a: { value: number; suit: string ; }, b: { value: number; suit: string ; }) => {
      const valueScoreA = cardValues[a.value];
      const valueScoreB = cardValues[b.value];
  
      if (valueScoreA !== valueScoreB) {
        return valueScoreA - valueScoreB;
      }
  
      const suitScoreA = suitOrder[a.suit];
      const suitScoreB = suitOrder[b.suit];
      return suitScoreA - suitScoreB;
    });
};  
function compareCards(cards: Card ,onBoardCards: Card ): boolean {
    const valueScoreA = cardValues[cards.value];
    const valueScoreB = cardValues[onBoardCards.value];

    if (valueScoreA !== valueScoreB) {
      return valueScoreA > valueScoreB;
    }

    const suitScoreA = suitOrder[cards.suit];
    const suitScoreB = suitOrder[onBoardCards.suit];
    return suitScoreA > suitScoreB;
}
 