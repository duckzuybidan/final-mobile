import UserSlot from "@/components/UserSlot";
import { db } from "@/firebase"; 
import { Card, Player } from "@/helper/game_logic";
import { touchSound } from "@/utils/effects";
import { useUser } from "@clerk/clerk-expo";
import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";
import {
  arrayRemove,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { View, Image, TouchableOpacity, Button, Text } from "react-native";

export default function Page() {
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const email = user?.emailAddresses[0].emailAddress;
  const [members, setMembers] = useState([]);
  const [roomInfo, setRoomInfo] = useState({
    roomId: "",
    password: "",
    host: ""
  })
  const handleOutRoom = async () => {
    touchSound();
    const room = await getDoc(doc(db, "rooms", id as string));
    if (room.data()?.host === email) {
      if (members.length === 1) {
        deleteDoc(doc(db, "rooms", id as string));
      } else {
        updateDoc(doc(db, "rooms", id as string), {
          members: arrayRemove(email as string),
          host: members[1],
        });
      }
    } else {
      updateDoc(doc(db, "rooms", id as string), {
        members: arrayRemove(email as string),
      });
    }
    updateDoc(doc(db, "users", email as string), {
      inRoomNo: "0000000",
    });
    router.back();
  };

  const handleStartGame = async () => {
    const players: Player[] = []; 
    const room = await getDoc(doc(db, "rooms", id as string));
    if (room.data()?.host !== email) return;
    
    const dealUrl =
      "https://www.deckofcardsapi.com/api/deck/"+ room.data()?.deck_id.deck_id + "/draw/?count="+members.length*13 
      const shuffleUrl =
      "https://www.deckofcardsapi.com/api/deck/"+  room.data()?.deck_id.deck_id +"/shuffle/";
    
      fetch(shuffleUrl)
    fetch(dealUrl)
      .then((response) => response.json())
      .then((data) => {
        const cardSegments = Array.from({ length: Math.ceil(data.cards.length / 13) }, (_, i) =>
        data.cards.slice(i * 13, i * 13 + 13).map((card: Card) => ({
          code: card.code,
          image: card.image,
          images: card.images,
          value: card.value,
          suit: card.suit,
        }))
      );
        for(let i = 0 ; i<members.length;i++){
          players.push({
            email: members[i],
            hand: cardSegments[i],
            onTurn: false,
            isPass: false,
          });
        } 
        updateDoc(doc(db, "rooms", id as string), {
          player : players
        });    
      })
      .catch((error) => {
        console.error("Error:", error);
      });
     
  };

  useEffect(() => {
    const fetchRoom = () => {
      onSnapshot(doc(db, "rooms", id as string), (room) => {
        const index = room.data()?.members.indexOf(email);
        setMembers(
          room
            .data()
            ?.members.slice(index)
            .concat(room.data()?.members.slice(0, index))
        );
        setRoomInfo({
          roomId: room.data()?.roomId,
          password: room.data()?.password,
          host: room.data()?.host
        })
      });
    };
    fetchRoom();
  }, [id]);
  return (
    <View className="relative w-full h-full justify-center items-center">
      <Image
        source={require("@/assets/screens/room-background.jpg")}
        className="w-full h-full"
      />
        <TouchableOpacity className="absolute" onPress={handleStartGame}>
          <View className="bg-sky-500 p-3">
            <Text className="font-semibold">Start Game</Text>
          </View>
        </TouchableOpacity>
      <TouchableOpacity
        className="absolute top-[10%] right-[5%]"
        onPress={handleOutRoom}
      >
        <Feather name="log-out" size={30} color="white" />
      </TouchableOpacity>
      {[...Array(4)].map((_, index) => {
        const member = members[index];
        return (
          <UserSlot 
            key={index} 
            no={index + 1} 
            userEmail={member} 
            isHost={roomInfo.host === member} 
          />
          );
      })}
    </View>
  );
}
