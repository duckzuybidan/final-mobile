export interface Card {
  code: string;
  image: string;
  images: {
    svg: string;
    png: string;
  };
  value: number;
  suit: string;
}

export interface Player {
  email: string;
  hand: Card[];
  onTurn: boolean;
  isPass: boolean;
}

const cardValues: { [key: string]: number } = {
  '3': 1,
  '4': 2,
  '5': 3,
  '6': 4,
  '7': 5,
  '8': 6,
  '9': 7,
  '10': 8,
  'JACK': 9,
  'QUEEN': 10,
  'KING': 11,
  'ACE': 12,
  '2': 13
};

const suitOrder: { [key: string]: number } = {
  'SPADES': 1,
  'CLUBS': 2,
  'DIAMONDS': 3,
  'HEARTS': 4
};

function isStraight(cards: Card[]): boolean {
  if (cards.length < 3) return false;

  for (let i = 1; i < cards.length; i++) {
    if (cardValues[cards[i].value] !== cardValues[cards[i - 1].value] + 1) {
      return false;
    }
  }
  if (cards[cards.length - 1].value === 13) return false;
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

function isNPairStraight(cards: Card[], n: number): boolean {
  if (cards.length !== n * 2) return false;
  for (let i = 0; i < n; i++) {
    if (cards[2 * i].value !== cards[2 * i + 1].value) return false;
  }
  for (let i = 0; i < n - 1; i++) {
    if (cardValues[cards[2 * i].value] !== cardValues[cards[2 * i + 2].value] - 1) return false;
  }
  if (cards[cards.length - 1].value === 13) return false;
  return true;
}

export default function isValidPlay(_cards: Card[], _onBoardCards: Card[], isReTurn: boolean): boolean {
  const cards = sortHand(_cards);
  const onBoardCards = sortHand(_onBoardCards);
  if (isReTurn && (isPair(cards) || isThreeOfAKind(cards) || isFourOfAKind(cards) || isStraight(cards) ||
  cards.length === 1 || isNPairStraight(cards, 3) || isNPairStraight(cards, 4)))
    return true;

  if (onBoardCards.length === 1 && onBoardCards[0].value === 13 && (isNPairStraight(cards, 3) ||
  isNPairStraight(cards, 4) || isFourOfAKind(cards)))
    return true;

  if (onBoardCards.length === 0 && (isPair(cards) || isThreeOfAKind(cards) || isFourOfAKind(cards) || isStraight(cards) ||
  cards.length === 1 || isNPairStraight(cards, 3) || isNPairStraight(cards, 4)))
    return true;

  if (onBoardCards.length === 1 && cards.length === 1 && compareCards(cards[0], onBoardCards[0]))
    return true;

  if (isPair(cards) && isPair(onBoardCards) && compareCards(cards[1], onBoardCards[1]))
    return true;

  if (isThreeOfAKind(cards) && isThreeOfAKind(onBoardCards) && compareCards(cards[2], onBoardCards[2]))
    return true;

  if (isFourOfAKind(cards) && isFourOfAKind(onBoardCards) && compareCards(cards[3], onBoardCards[3]))
    return true;

  if (isStraight(cards) && onBoardCards.length === cards.length && isStraight(onBoardCards) &&
  compareCards(cards[cards.length - 1], onBoardCards[onBoardCards.length - 1]))
    return true;

  if (isNPairStraight(cards, 3) && isNPairStraight(onBoardCards, 3) && compareCards(cards[5], onBoardCards[5]))
    return true;

  if (isNPairStraight(cards, 4) && isNPairStraight(onBoardCards, 4) && compareCards(cards[7], onBoardCards[7]))
    return true;

  if (isPair(onBoardCards) && onBoardCards[0].value === 13 && (isNPairStraight(cards, 4) || isFourOfAKind(cards)))
    return true;

  if (isNPairStraight(onBoardCards, 3) && (isNPairStraight(cards, 4) || isFourOfAKind(cards)))
    return true;

  if (isFourOfAKind(onBoardCards) && isNPairStraight(cards, 4))
    return true;

  return false;
}

export const sortHand = (hand: Card[]) => {
  return hand.sort((a: { value: number; suit: string }, b: { value: number; suit: string }) => {
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

function compareCards(cards: Card, onBoardCards: Card): boolean {
  const valueScoreA = cardValues[cards.value];
  const valueScoreB = cardValues[onBoardCards.value];

  if (valueScoreA !== valueScoreB) {
    return valueScoreA > valueScoreB;
  }

  const suitScoreA = suitOrder[cards.suit];
  const suitScoreB = suitOrder[onBoardCards.suit];
  return suitScoreA > suitScoreB;
}

function hasMatchingSubset(cards: Card[], n: number, checkFunction: (cards: Card[]) => boolean): boolean {
  const subset : Card[] = [];
  function backtrack(start: number): boolean {
    if (subset.length === n) {
      return checkFunction(subset);
    }

    for (let i = start; i < cards.length; i++) {
      subset.push(cards[i]);
      if (backtrack(i + 1))
        return true;
      subset.pop();
    }
    return false;
  }
  return backtrack(0);
}

export function isGoAhead(_cards: Card[], isFirstGame: boolean): boolean {//tới trắng, đ bk dịch :)))
  const cards = sortHand(_cards);
  if (isFirstGame) {
    if (hasMatchingSubset(cards, 4, (subset) => {// tứ quý 3
      return isFourOfAKind(subset) && subset[0].value === 1;
    }))
      return true;

    if (hasMatchingSubset(cards, 6, (subset) => {// 3 đôi thông có 3 bích
      return isNPairStraight(subset, 3) && subset[0].value === 1 && subset[0].suit === 'SPADES';
    }))
      return true;

    if (hasMatchingSubset(cards, 8, (subset) => {// 4 đôi thông có 3 bích
      return isNPairStraight(subset, 4) && subset[0].value === 1 && subset[0].suit === 'SPADES';
    }))
      return true;

    if (hasMatchingSubset(cards, 9, (subset) => {// 3 sám cô
      return isThreeOfAKind(subset.slice(0, 3)) && isThreeOfAKind(subset.slice(3, 6)) && isThreeOfAKind(subset.slice(6, 9));
    }))
      return true;

    if (hasMatchingSubset(cards, 12, (subset) => {// 4 sám cô
      return isFourOfAKind(subset.slice(0, 3)) && isFourOfAKind(subset.slice(3, 6)) && isFourOfAKind(subset.slice(6, 9)) && isFourOfAKind(subset.slice(9, 12));
    }))
      return true;

    if (hasMatchingSubset(cards, 12, (subset) => {// 3 tứ quý
      return isFourOfAKind(subset.slice(0, 4)) && isFourOfAKind(subset.slice(4, 8)) && isFourOfAKind(subset.slice(8, 12));
    }))
      return true;
    return false;
  } else {
    if (hasMatchingSubset(cards, 4, (subset) => {// tứ quý 2
      return isFourOfAKind(subset) && subset[0].value === 13;
    }))
      return true;
    
    if (hasMatchingSubset(cards, 10, (subset) => {// 5 đôi thông
      return isNPairStraight(subset, 5);
    }))
      return true;

    if (hasMatchingSubset(cards, 12, (subset) => {// 6 đôi
      for (let i = 0; i < 6; i++) {
        if (subset[2 * i].value !== subset[2 * i + 1].value) return false;
      }
      return true;
    }))
      return true;

    if (isStraight(cards.slice(0, 12)))// sảnh rồng
      return true
    
    var isFullRed = true;
    var isFullBlack = true;
    for (let i = 0; i < 13; i++) {
      if (cards[i].suit === 'SPADES' || cards[i].suit === 'CLUBS') isFullRed = false;
      if (cards[i].suit === 'DIAMONDS' || cards[i].suit === 'HEARTS') isFullBlack = false;
    }
    return isFullRed || isFullBlack;
  }
}
