import { db } from '@/firebase'
import { Card, Player, sortHand } from '@/helper/game_logic'
import { touchSound } from '@/utils/effects'
import { useUser } from '@clerk/clerk-expo'
import AntDesign from '@expo/vector-icons/AntDesign'
import Feather from '@expo/vector-icons/Feather'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { useLocalSearchParams } from 'expo-router'
import { arrayRemove, collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet, Button, TouchableOpacity } from 'react-native'
import Toast from 'react-native-toast-message'
import CustomConfirmModal from './CustomConfirmModal'
enum Status {
  pending = 'pending',
  accepted = 'accepted',
  cancel = 'cancel',
}
export default function UserSlot({
  no,
  userEmail,
  host,
  }:{
  no: number,
  userEmail?: string,
  host: string
  }){
  const {user} = useUser()
  const currentEmail = user?.emailAddresses[0].emailAddress
  const [player, setPlayer] = useState<Player>({
    email: '' , 
    hand:  [], 
    onTurn: false,
    isPass: false
  });
  const [onboardCard,setOnboardCard] = useState<Card[]>([]) 
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]); 
  const { id } = useLocalSearchParams(); 
  const [userData, setUserData] = useState<{
        name: string,
        avatar: string,
        coins: number,
        friends: string[],
    }| null>(null)  
  const [isPending, setIsPending] = useState(false)
  const [onModal, setOnModal] = useState(false)
  const position = () => {
    switch (no) {
      case 1:
        return 'bottom-[1%] left-[45%]'
      case 2:
        return 'top-[40%] left-[5%]'
      case 3:
        return 'top-[5%] left-[45%]'
      case 4:
        return 'top-[40%] right-[5%]'
    }
  }
  const handleCancel = async () => {
    touchSound()
    try{
      setIsPending(false)
      const requestRef = collection(db, "friend_requests");
      await updateDoc(doc(requestRef, `${currentEmail}-${userEmail}`), {
        status: Status.cancel
      });
    }
    catch(error) {
      setIsPending(true)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong',
        text2Style: {fontSize: 16}
      })
    }
  }
  const handleAddFriend = async () => {
    touchSound()
    try {
      setIsPending(true)
      const requestRef = collection(db, "friend_requests");
      await setDoc(doc(requestRef, `${currentEmail}-${userEmail}`), {
        from: currentEmail,
        to: userEmail,
        status: Status.pending
      }, { merge: true });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Friend request sent',
        text2Style: {fontSize: 16}
      })
    
    } 
    catch (error) {
      setIsPending(false)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong',
        text2Style: {fontSize: 16}
      })
    }
  }
  const handleKick = async () => {
    try{
      updateDoc(doc(db, "rooms", id as string), {
        members: arrayRemove(userEmail)
      })    
      updateDoc(doc(db, "users", userEmail as string), {
        inRoomNo: "0000000"
      })
    }
    catch(error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong',
        text2Style: {fontSize: 16}
      })
    }
  }
  useEffect(() => { 
    const fetchPlayerData = async () => {
      const roomDoc = await getDoc(doc(db, 'rooms', id as string));
      const roomData = roomDoc.data();
      if (!roomData) return;

      const playerData = roomData.player.find((p: Player) => p.email === currentEmail);
      if (playerData) {
        setPlayer(playerData);
      }
    };
     
    const fetchOnboardCard = async () => {
      const roomDoc = await getDoc(doc(db, 'rooms', id as string));
      const roomData = roomDoc.data();
      if (!roomData) return;

      const onboardCard = roomData.onboardcard ;
      if (onboardCard) {
        setOnboardCard(onboardCard);
      }
    }; 
    fetchPlayerData();
    fetchOnboardCard(); 
  } );

  const handleCardClick = (index: number) => {
    setSelectedCardIndices((prevSelectedIndices) => {
      if (prevSelectedIndices.includes(index)) {
        return prevSelectedIndices.filter((i) => i !== index);
      } else {
        return [...prevSelectedIndices, index];
      }
    });
  };

  const handleSort = useCallback(async () => {
    if (!player.hand.length || !id) return;

    const sortedCards = sortHand(player.hand);

    const roomDoc = await getDoc(doc(db, 'rooms', id as string));
    const roomData = roomDoc.data();
    if (!roomData) return;

    const playerIndex = roomData.player.findIndex((p: Player) => p.email === userEmail);
    if (playerIndex === -1) return;

    await updateDoc(doc(db, 'rooms', id as string), {
      [`player.${playerIndex}.hand`]: sortedCards,
    });

    setPlayer((prevPlayer) => ({
      ...prevPlayer,
      hand: sortedCards,
    }));
  }, [player.hand, ]);
  const AddIconStatus = () => {
    if(no === 1) return 
    if(userData?.friends.includes(currentEmail as string)) {
      return (
        <View>
          <Feather name="user-check" size={20} color="green" />
        </View>
      )
    }
    if(isPending) {
      return (
        <TouchableOpacity onPress={handleCancel}>
          <Feather name="user-x" size={20} color="white" />
        </TouchableOpacity>
      )
    }
    return (
      <TouchableOpacity onPress={handleAddFriend}>
        <AntDesign name="adduser" size={20} color="white" />
      </TouchableOpacity>
    )
  }
  const KickIcon = () => {
    if(no === 1) return
    if(host !== currentEmail) return
    return (
      <TouchableOpacity onPress={() => {
        touchSound()
        setOnModal(true)
      }}>
        <FontAwesome5 name="user-alt-slash" size={16} color="red" />
      </TouchableOpacity>
    )
  }
  useEffect(() => {
    if(!userEmail) return
    const fetchUser = async () => {
      onSnapshot(doc(db, "users", userEmail), (doc) => {
        setUserData(doc.data() as any)
      })
    }
    fetchUser()
  }, [userEmail])
  return (
    <>
    <CustomConfirmModal open={onModal} onClose={() => setOnModal(false)}  content={'Are you sure you want to kick this player?'} onConfirm={handleKick} />
    {no== 1 && (
      <View className='absolute w-screen h-screen'>
        <View className='absolute bottom-[42%] left-[10%]'>
          {player?.hand.map((card, index) => (
            <Pressable
              key={index}
              onPress={() => handleCardClick(index)}
              style={[styles.cardWrapper, { left: (index * 70) / 2 }]}
            >
              <Image
                source={{ uri: card.image }}
                  style={[
                  styles.reactLogo,
                  selectedCardIndices.includes(index) &&
                  styles.selectedCardHighlight,
                  ]}
                className='scale-[0.6]'
              />
            </Pressable>
            ))}
        </View>
        <TouchableOpacity onPress={handleSort} className='absolute right-[15%] bottom-[24%]'>
          <View className='px-5 py-2 bg-sky-500 w-max h-max rounded-md'>
            <Text className='text-white font-semibold'>Sort</Text>
          </View>
        </TouchableOpacity>
      </View>)}
    <View className={`absolute ${position()}`}>
        {userEmail ? (
          <View className={`relative ${no === 1 && 'flex flex-row items-center space-x-2'}`}>
            <View className='flex flex-row space-x-2 items-center'>
              <Image source={{uri: userData?.avatar}} className='w-[40px] h-[40px] rounded-full' />
              <KickIcon />
            </View>
            <View>
            <Text className='text-sm text-white'>{userData?.name}</Text>
            <View className='flex flex-row items-center space-x-1'>
              <Text className='text-sm text-white'>{userData?.coins}</Text>
              <Image source={require('../assets/stuff/coin.jpg')} className='rounded-full w-[16px] h-[16px]' />
              <AddIconStatus />
            </View>
            </View>
            {(host === userEmail) && <View className='absolute top-0 left-0'>
              <FontAwesome5 name="crown" size={8} color="yellow" />
            </View>}
          </View>
        ) : (
          <AntDesign name="pluscircleo" size={50} color="black" />
        )}
    </View>
    </>
  )
}
const styles = StyleSheet.create({
  reactLogo: {
    width: 90,
    aspectRatio: 0.7,
    borderWidth: 0.1,
    borderRadius: 10,
    borderColor: "black",
  },
  selectedCardHighlight: {
    borderColor: "blue",
    borderWidth: 4,
  },
  
  
   
  cardWrapper: {
    position: "absolute", 
    left: 0,
  },

   
});
 