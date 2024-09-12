import UserSlot from "@/components/UserSlot";
import { db } from "@/firebase";
import { Card, Player } from "@/helper/game_logic";
import { touchSound } from "@/utils/effects";
import { useUser } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";
import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { View, Image, TouchableOpacity, Button, Text } from "react-native";
import Toast from "react-native-toast-message";

export default function Page() {
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const currentEmail = user?.emailAddresses[0].emailAddress;
  const [members, setMembers] = useState([]);
  const [turn, setTurn] = useState<boolean[]>([]);
 
  const [roomInfo, setRoomInfo] = useState({
    password: "",
    host: "",
    deck_id: "",
    preRoundWinner: "",
  });
  const [remain, setRemain] = useState<number[]>([]);

  const [onInfo, setOnInfo] = useState(false);
  const [gameState, setGameState] = useState(0);
  const [onboardCard, setOnboardCard] = useState<Card[]>([]);
  const [players, setPlayer] = useState<Player>({
    email: "",
    hand: [],
    onTurn: false,
    isPass: false,
  });
  const handleOutRoom = async () => {
    try {
      touchSound();
      updateDoc(doc(db, "users", currentEmail as string), {
        inRoomNo: "0000000",
      });
      const room = await getDoc(doc(db, "rooms", id as string));
      if (room.data()?.host === currentEmail) {
          updateDoc(doc(db, "rooms", id as string), {
            members: arrayRemove(currentEmail as string),
            host: members[1],
          });
      } else {
        updateDoc(doc(db, "rooms", id as string), {
          members: arrayRemove(currentEmail as string),
          
        });
      }

      if (room.data()?.preRoundWinner === currentEmail) {
        updateDoc(doc(db, "rooms", id as string), {
          preRoundWinner: "",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Something went wrong",
        text1Style: { fontSize: 16 },
      });
    }
    router.back();
  };

  const handleStartGame = async () => {
    const players: Player[] = [];

    if (members.length < 2) {
      Toast.show({
        type: "error",
        text1: "Not enough players",
      });
      return 
    }
    for (let i = 0; i < members.length; i++) {
      const userRef = doc(db, "users", members[i] as string);
      const user = await getDoc(userRef);
      if (user.data()?.coins < 30) {
        Toast.show({
          type: "error",
          text1: "There is player has not enough coin to play",
        });
        return;
      }
    }
    const roomRef = doc(db, "rooms", id as string);
    const room = await getDoc(roomRef);
    const dealUrl =
      "https://www.deckofcardsapi.com/api/deck/new/draw/?count=" +
      members.length * 13;

    fetch(dealUrl)
      .then((response) => response.json())
      .then((data) => {
        const cardSegments = Array.from(
          { length: Math.ceil(data.cards.length / 13) },
          (_, i) =>
            data.cards.slice(i * 13, i * 13 + 13).map((card: Card) => ({
              code: card.code,
              image: card.image,
              images: card.images,
              value: card.value,
              suit: card.suit,
            }))
        );
        for (let i = 0; i < members.length; i++) {
          players.push({
            email: members[i],
            hand: cardSegments[i],
            onTurn: false,
            isPass: false,
          });
        }
        let turn = 0;
      
        if (
          room.data()?.preRoundWinner !== undefined &&
          room.data()?.preRoundWinner !== ""
        ) {
          turn = players.findIndex(
            (player: Player) => player.email ===  room.data()?.preRoundWinner
          );
        } else if (members.length === 4) {
          turn = cardSegments.findIndex((segment) =>
            segment.some((card: { code: string }) => card.code === "3S")
          );
        }
        updateDoc(doc(db, "rooms", id as string), {
          player: players,
          onboardCard: [],
          turn: turn,
          onGameState: 1,
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  useEffect(() => {
    const fetchRoom = () => {
      onSnapshot(doc(db, "rooms", id as string), async (room) => {
        if (room.exists()) {
          if(room.data()?.members.length > 0) {
            let index = room.data()?.members.indexOf(currentEmail);
            if (index !== -1) {
              setMembers(
                room
                  .data()
                  ?.members.slice(index)
                  .concat(room.data()?.members.slice(0, index))
              );
            }
            if (index === -1 && router.canGoBack()) {
              router.back();
            }
          }
          else {
            deleteDoc(doc(db, "rooms", id as string));
            const invitations = await getDocs(
              query(collection(db, "invitations"), where("roomID", "==", id))
            );
            invitations.forEach((invitation) => {
              deleteDoc(doc(db, "invitations", invitation.id));
            });
            const messages = await getDocs(
              query(collection(db, "messages"), where("toRoom", "==", id))
            );
            messages.forEach((message) => {
              deleteDoc(doc(db, "messages", message.id));
            });
          }
          setRoomInfo({
            password: room.data()?.password,
            host: room.data()?.host,
            deck_id: room.data()?.deck_id.deck_id,
            preRoundWinner: room.data()?.preRoundWinner,
          });
        }
      });
    };
    fetchRoom();
  }, [id]);

  useEffect(() => {
    onSnapshot(doc(db, "rooms", id as string), (room) => {
      setGameState(room.data()?.onGameState);
      const players = room.data()?.player;
      if (players) {
        const player = room
          .data()
          ?.player.find((p: Player) => p.email === currentEmail);
        if (player) {
          setPlayer(player);
        }
        const turn = room.data()?.turn;
        const turnList: boolean[] = []; 
        const remainList:number[] = []; 
        const index = room.data()?.members.indexOf(currentEmail);
        let menbers2:any  
        if (index !== -1) {
          menbers2 = (
            room
              .data()
              ?.members.slice(index)
              .concat(room.data()?.members.slice(0, index))
          );
        } 
        for (let i = 0; i < room.data()?.player.length; i++) {
          if (room.data()?.members[turn] === menbers2[i]) {
            turnList.push(true);  
          } else turnList.push(false);
          const p = room
          .data()
          ?.player.find((player: Player) => player.email === menbers2[i]); 
          if(p.hand)remainList.push(p.hand.length) 
          else remainList.push(0)
          
        }
        setTurn(turnList); 
        setRemain(remainList) 
      }
     
      if (room.data()?.onboardCard) {
        setOnboardCard(room.data()?.onboardCard);
      }
    });
  }, [ ]);

  const checkEndGame = async () => {
    if (!gameState) return;
    const roomRef = doc(db, "rooms", id as string);
    const room = await getDoc(roomRef);
    if (
      room.data()?.player.some((player: Player) => player.hand.length === 0) ===
        false ||
      gameState === 0   
    )
      return; 
    if (currentEmail === roomInfo.host) {
      const winner = room
        .data()
        ?.player.find((player: Player) => player.hand.length === 0);
       
      updateDoc(roomRef, {
        preRoundWinner: winner.email,
        onGameState: 0,
         
        onboardCard: [],
      });
    }
    const winner = room
      .data()
      ?.player.find((player: Player) => player.hand.length === 0); 
    if (currentEmail === winner.email) {
      Toast.show({
        type: "info",
        text1:
          "You just win " + (room.data()?.player.length - 1) * 30 + " coins",
        visibilityTime: 2000,
      });
    } else {
      Toast.show({
        type: "info",
        text1: "You just lose 30 coins",
        visibilityTime: 2000,
      });
    }

    const userRef = doc(db, "users", currentEmail as string);
    const user = await getDoc(userRef);
    if (currentEmail === winner.email) { 
      updateDoc(doc(db, "users", currentEmail as string), {
        coins: user.data()?.coins + (room.data()?.player.length - 1) * 30,
      });
    } else { 
      updateDoc(doc(db, "users", currentEmail as string), {
        coins: user.data()?.coins - 30,
      });
    }
  };
  useEffect(() => {
  checkEndGame()
  },[remain]);   
   return (
    <View className="relative w-full h-full justify-center items-center">
      <Image
        source={require("@/assets/screens/room-background.jpg")}
        className="w-full h-full"
      />
      <TouchableOpacity
        className="absolute top-[10%] left-[5%]"
        onPressIn={() => setOnInfo(true)}
        onPressOut={() => setOnInfo(false)}
      >
        <Feather name="info" size={24} color="white" />
      </TouchableOpacity>
      {onInfo && (
        <View className="absolute flex flex-col top-[10%] left-[10%] bg-white p-3 rounded-md">
          <Text className="font-semibold">Room ID: {id}</Text>
          <Text className="font-semibold">Password: {roomInfo.password}</Text>
        </View>
      )}

      {roomInfo.host === currentEmail && gameState === 0 && (
        <TouchableOpacity className="absolute" onPress={handleStartGame}>
          <View className="bg-sky-500 p-3 rounded-md">
            <Text className="font-semibold">Start Game</Text>
          </View>
        </TouchableOpacity>
      )}
      <View className="absolute left-[20%] top-[40%] h-full w-full">
        {gameState === 1 &&
          onboardCard.map((card, index) => (
            <Image
              key={index}
              source={{ uri: card.image }}
              resizeMode="contain"
              style={{ position: "absolute", left: (index * 60) / 2 }}
              className={`w-[60px] h-[60px]`}
            />
          ))}
      </View>
      <TouchableOpacity
        className="absolute top-[10%] right-[5%]"
        onPress={handleOutRoom}
      >
        <Feather name="log-out" size={30} color="white" />
      </TouchableOpacity>
      <UserSlot
        no={1}
        userEmail={members[0]}
        host={roomInfo.host}
        player={players}
        gameState={gameState}
        onboardCard={onboardCard}
        isTurn={turn[0]}
        remain ={remain[0]}
      />
      <UserSlot
        no={2}
        userEmail={members[1]}
        host={roomInfo.host}
        player={players}
        gameState={gameState}
        onboardCard={onboardCard}
        isTurn={turn[1]}
        remain ={remain[1]}
      />
      <UserSlot
        no={3}
        userEmail={members[2]}
        host={roomInfo.host}
        player={players}
        gameState={gameState}
        onboardCard={onboardCard}
        isTurn={turn[2]}
        remain ={remain[2]}
      />
      <UserSlot
        no={4}
        userEmail={members[3]}
        host={roomInfo.host}
        player={players}
        gameState={gameState}
        onboardCard={onboardCard}
        isTurn={turn[3]}
        remain ={remain[3]}
      />
      <Toast />
    </View>
  );
}
