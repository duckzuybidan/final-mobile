import { db } from '@/firebase'
import isValidPlay, { Card, Player, sortHand } from '@/helper/game_logic'
import { touchSound } from '@/utils/effects'
import { useUser } from '@clerk/clerk-expo'
import AntDesign from '@expo/vector-icons/AntDesign'
import Feather from '@expo/vector-icons/Feather'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { useLocalSearchParams } from 'expo-router'
import { arrayRemove, collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet, Button, TouchableOpacity, ScrollView } from 'react-native'
import Toast from 'react-native-toast-message'
import CustomConfirmModal from './CustomConfirmModal'
import { LoadingIcon } from './LoadingIcon'
enum Status {
  pending = 'pending',
  accepted = 'accepted',
  cancel = 'cancel',
}
type User = {
  email: string,
  name: string,
  avatar: string,
  coins: number,
  friends: string[]
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
  const [userData, setUserData] = useState<User| null>(null)  
  const [isPending, setIsPending] = useState(false)
  const [onModal, setOnModal] = useState(false)
  const [friends, setFriends] = useState<User[]>([])
  const [isFriendsLoading, setIsFriendsLoading] = useState(false)
  const [onFriendList, setOnFriendList] = useState(false)
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
  useEffect(() => {
    onSnapshot(doc(db, 'rooms', id as string), (room) => {
      if(room.data()?.player){
        setPlayer(room.data()?.player.find((p: Player) => p.email === currentEmail));
      }
      if(room.data()?.onboardcard){
        setOnboardCard(room.data()?.onboardcard);
      }
    })
  }, []);

  const handleCardClick = (index: number) => {
    setSelectedCardIndices((prevSelectedIndices) => {
      if (prevSelectedIndices.includes(index)) {
        return prevSelectedIndices.filter((i) => i !== index);
      } else {
        return [...prevSelectedIndices, index];
      }
    });
  };

  const handleSort = async () => {
    if (!player.hand.length || !id) return;

    const sortedCards = sortHand(player.hand);

    const roomDoc = await getDoc(doc(db, 'rooms', id as string));
    const roomData = roomDoc.data();
    if (!roomData) return;

    const playerIndex = roomData.player.findIndex((p: Player) => p.email === currentEmail);
    if (playerIndex === -1) return;

    await updateDoc(doc(db, 'rooms', id as string), {
      [`player.${playerIndex}.hand`]: sortedCards,
    });

    setPlayer((prevPlayer) => ({
      ...prevPlayer,
      hand: sortedCards,
    }));
  };
  useEffect(() => {
    if(no !== 1) return
    const fetchFriends = async () => {
      setIsFriendsLoading(true)
      try{
        const userRef = collection(db, "users");
        const querySnapshot = await getDocs(query(userRef, where("friends", "array-contains", currentEmail)));
        const friends = querySnapshot.docs.map((res) => ({
          email: res.id,
          name: res.data().name,
          avatar: res.data().avatar,
          coins: res.data().coins,
          friends: res.data().friends
        }));
        setFriends(friends)
        setIsFriendsLoading(false)
      }
      catch(error) {
        setIsFriendsLoading(false)
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Something went wrong',
          text2Style: {fontSize: 16}
        })
      }
    }
    fetchFriends()
  }, [currentEmail])
  return (
    <>
    <CustomConfirmModal open={onModal} onClose={() => setOnModal(false)}  content={'Are you sure you want to kick this player?'} onConfirm={handleKick} />
    {no== 1 && (
      <View className='absolute w-screen h-screen'>
        <View className='absolute top-[67%] left-[10%] w-full'>
          {player?.hand.map((card, index) => (
            <Pressable
              key={index}
              onPress={() => handleCardClick(index)}
              style = {{position: "absolute", left: (index * 70)/2}}
            >
              <Image
                source={{ uri: card.image }}
                resizeMode='contain'
                className={`w-[70px] h-[70px] ${selectedCardIndices.includes(index) ? 'translate-y-[-10px]' : 'translate-y-0'}`}
              />
            </Pressable>
            ))}
            {player?.hand.length > 0 && 
              <TouchableOpacity onPress={handleSort} className='absolute right-[20%]'>
                <View className='px-5 py-2 bg-sky-500 w-max h-max rounded-md'>
                  <Text className='text-white font-semibold'>Sort</Text>
                </View>
              </TouchableOpacity>
            }
        </View>
        <TouchableOpacity className="absolute top-[20%] left-[5%]" onPress={() =>{
          touchSound();
          setOnFriendList(!onFriendList)
        }}>
          <AntDesign name="addusergroup" size={24} color="white" />
        </TouchableOpacity>
        {onFriendList && (
          <View className="absolute top-[20%] left-[10%] bg-white rounded-md p-3 z-10">
            <Text className='text-md font-semibold w-full text-center'>Invite friends</Text>
            <View className='w-full h-[1px] bg-black my-1'/>
            <ScrollView showsVerticalScrollIndicator={false} className='space-y-3' style={{maxHeight: 200}}>
            {isFriendsLoading && <LoadingIcon />}
            {friends.length === 0 && !isFriendsLoading &&
              <Text className='text-md font-semibold text-gray-600'>No friends</Text>
            }
            {friends.length > 0 && friends.map((user, index) => (
              <View className='relative w-[220px] flex flex-row items-center space-x-3 bg-slate-100 p-2 rounded-md' key={index}>
                <Image source={{uri: user.avatar}} className='w-[24px] h-[24px] rounded-full'/>
                <Text className='text-md'>{user.name}</Text>
                <TouchableOpacity className='absolute right-3' onPress={() => {
                    touchSound()
                  }}>
                    <FontAwesome5 name="plus-square" size={20} color="black" />
                  </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          </View>
        )}
      </View>
    )}
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