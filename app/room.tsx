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
  const [roomInfo, setRoomInfo] = useState({
    password: "",
    host: "",
    deck_id: "",
    preRoundWinner: "",  
  })
  const [onInfo, setOnInfo] = useState(false);
  const handleOutRoom = async () => {
    try{
      touchSound();
      const room = await getDoc(doc(db, "rooms", id as string));
      if (room.data()?.host === currentEmail) {
        if (members.length === 1) {
          deleteDoc(doc(db, "rooms", id as string));
          const invitations = await getDocs(query(collection(db, "invitations"), where("roomID", "==", id)));
          invitations.forEach((invitation) => {
            deleteDoc(doc(db, "invitations", `${invitation.data().from}-${invitation.data().to}-${invitation.data().roomID}`));
          })
        } else {
          updateDoc(doc(db, "rooms", id as string), {
            members: arrayRemove(currentEmail as string),
            host: members[1],
          });
        }
      } else {
        updateDoc(doc(db, "rooms", id as string), {
          members: arrayRemove(currentEmail as string),
        });
      }
      updateDoc(doc(db, "users", currentEmail as string), {
        inRoomNo: "0000000",
      });
    } catch(error) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
        text1Style: { fontSize: 16 },
    })}
  };

  const handleStartGame = async () => {
    const players: Player[] = []; 
    if (roomInfo.host !== currentEmail) return;
    
    const dealUrl =
      "https://www.deckofcardsapi.com/api/deck/"+ roomInfo.deck_id + "/draw/?count="+members.length*13 
      const shuffleUrl =
      "https://www.deckofcardsapi.com/api/deck/"+  roomInfo.deck_id +"/shuffle/";
    
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
        for(let i = 0; i < members.length; i++){
          players.push({
            email: members[i],
            hand: cardSegments[i],
            onTurn: false,
            isPass: false, 
          });
        } 
        let turn = 0
        if(roomInfo.preRoundWinner !== undefined){
            turn = players.findIndex((player: Player) => player.email === roomInfo.preRoundWinner); 
        } 
        else if(members.length === 4){ 
            turn = cardSegments.findIndex(segment =>
            segment.some((card: { code: string; })  => card.code === "3S" )
          );
        } 
        updateDoc(doc(db, "rooms", id as string), {
          player : players, 
          onboardCard:[],
          turn:turn,
          onGameState: true     
        });    
      })
      .catch((error) => {
        console.error("Error:", error);
      });
     
  };

  useEffect(() => {
    const fetchRoom = () => {
      onSnapshot(doc(db, "rooms", id as string), (room) => {
        const index = room.data()?.members.indexOf(currentEmail);
        if(index !== -1){
          setMembers(
            room.data()?.members.slice(index).concat(room.data()?.members.slice(0, index))
          );
        }
        if(index === -1 && router.canGoBack()) {
          router.back();
        }
        setRoomInfo({
          password: room.data()?.password,
          host: room.data()?.host,
          deck_id: room.data()?.deck_id.deck_id,
          preRoundWinner:  room.data()?.preRoundWinner
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
       <TouchableOpacity className='absolute top-[10%] left-[5%]' onPressIn={() => setOnInfo(true)} onPressOut={() => setOnInfo(false)}>
          <Feather name="info" size={24} color="white" />
        </TouchableOpacity>
        {onInfo && (
          <View className="absolute flex flex-col top-[10%] left-[10%] bg-white p-3 rounded-md">
            <Text className="font-semibold">Room ID: {id}</Text>
            <Text className="font-semibold">Password: {roomInfo.password}</Text>
          </View>
        )}
        
        {roomInfo.host === currentEmail && 
          <TouchableOpacity className="absolute" onPress={handleStartGame}>
            <View className="bg-sky-500 p-3 rounded-md">
              <Text className="font-semibold">Start Game</Text>
            </View>
          </TouchableOpacity>
        } 
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
            host={roomInfo.host} 
          />
          );
      })}
      <Toast/>
    </View>
  );
}
