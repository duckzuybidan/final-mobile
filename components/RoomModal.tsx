import { db } from "@/firebase";
import { Player } from "@/helper/game_logic";
import { touchSound } from "@/utils/effects";
import { router } from "expo-router";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import Toast from "react-native-toast-message";

export default function RoomModal({
  open,
  onClose,
  type,
  email,
}: {
  open: boolean;
  onClose: (roomNo?: string) => void;
  type: "create" | "join";
  email: string;
}) {
  const [formData, setFormData] = useState({
    roomId: "",
    password: "",
  });
  const [deckId, setDeckId] = useState<any>({});
  const handleCreateRoom = async () => {
    try {
      if (formData.roomId.length === 0 || formData.password.length === 0) {
        Toast.show({
          type: "error",
          text1: "Room ID and Password are required",
        });
        return;
      }
      const checked = await getDoc(doc(db, "rooms", formData.roomId));
      if (checked.exists()) {
        Toast.show({
          type: "error",
          text1: "Room ID already exists",
        });
        return;
      }
      const roomRef = collection(db, "rooms");
      setDoc(doc(roomRef, formData.roomId), {
        members: [email],
        password: formData.password,
        host: email,
        deck_id: deckId,
        onGameState: 0, 
        turn:0 
      });
      const userRef = collection(db, "users");
      updateDoc(doc(userRef, email), {
        inRoomNo: formData.roomId,
      });
      router.push(`/room?id=${formData.roomId}`);
      setFormData({ roomId: "", password: "" });
      onClose(formData.roomId);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Something went wrong",
        text1Style: { fontSize: 16 },
      })
    }
  };
  const handleJoinRoom = async () => {
    try {
    const checked = await getDoc(doc(db, "rooms", formData.roomId));
    if (!checked.exists()) {
      Toast.show({
        type: "error",
        text1: "Room ID does not exist",
      });
      return;
    }
    if (formData.password !== checked.data()?.password) {
      Toast.show({
        type: "error",
        text1: "Password is incorrect",
      });
      return;
    }
    if(checked.data()?.members.length >= 4) {
      Toast.show({
        type: "error",
        text1: "Room is full",
      });
      return;
    }
    const roomRef = doc(db, "rooms", formData.roomId);
    if(!checked.data().player){
      updateDoc(roomRef, {
        members: arrayUnion(email),
      });
    }
    else{
      updateDoc(roomRef, {
        members: checked.data().player.map((p: Player) => p.email),
      });
    }
    const userRef = collection(db, "users");
    updateDoc(doc(userRef, email), {
      inRoomNo: formData.roomId,
    });
    router.push(`/room?id=${formData.roomId}`);
    setFormData({ roomId: "", password: "" });
    onClose(formData.roomId);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Something went wrong",
        text1Style: { fontSize: 16 },
      })
    }
  };
  useEffect(() => {
    if(type === "join") return
    fetch("https://www.deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setDeckId(data)
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  },[])
  if (!open) {
    return null;
  }
  return (
    <View className="absolute w-screen h-screen justify-center items-center bg-black/50 z-20">
      <View className="relative bg-slate-300 p-3 flex flex-col space-y-3 rounded-lg w-1/2">
        <Text className="w-full text-center text-xl font-medium">
          {type === "create" ? "Create Room" : "Join Room"}
        </Text>
        <View className="w-full h-[1px] bg-black" />
        <View className="flex flex-col space-y-1">
          <Text className="font-medium">
            {type === "create"
              ? "Enter Room ID(maximum 6 digits)"
              : "Enter Room ID"}
          </Text>
          <TextInput
            className="bg-white rounded-lg px-2 h-[36px]"
            value={formData.roomId}
            onChangeText={(text) => {
              if (text.length <= 6) {
                setFormData({ ...formData, roomId: text });
              }
            }}
          />
        </View>
        <View className="flex flex-col space-y-1">
          <Text className="font-medium">Password</Text>
          <TextInput
            className="bg-white rounded-lg px-2 h-[36px]"
            value={formData.password}
            onChangeText={(text) =>
              setFormData({ ...formData, password: text })
            }
          />
        </View>
        <View className="w-full h-[1px] bg-black" />
        <View className="flex flex-row space-x-3 w-full items-center justify-around">
          <TouchableOpacity
            className="p-3 bg-red-500 rounded-lg"
            onPress={() => {
              touchSound();
              onClose();
            }}
          >
            <Text className="text-white text-center font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="p-3 bg-green-500 rounded-lg"
            onPress={() => {
              touchSound();
              if (type === "create") {
                handleCreateRoom();
              } else {
                handleJoinRoom();
              }
            }}
          >
            <Text className="text-black text-center font-semibold">
              {type === "create" ? "Create" : "Join"} Room
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Toast />
    </View>
  );
}
