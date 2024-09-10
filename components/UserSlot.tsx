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
import { View, Text, Image, Pressable, StyleSheet, Button, TouchableOpacity, ScrollView, TextInput } from 'react-native'
import Toast from 'react-native-toast-message'
import CustomConfirmModal from './CustomConfirmModal'
import { LoadingIcon } from './LoadingIcon'
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
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
type Message = {
  fromEmail: string,
  fromAvatar: string,
  toRoom: string,
  createdAt: string,
  content: string,
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
  const[gameState,setgGameState] = useState<boolean>(false) 
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
  const [isInvitationSended, setInvitationIsSended] = useState(false)
  const [onChatBox, setOnChatBox] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const scrollRef = useRef<ScrollView>(null)
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
  const handleInvite = async (toEmail: string) => {
    setInvitationIsSended(true)
    setTimeout(() => setInvitationIsSended(false), 5000)
    try{
    const invitationRef = collection(db, "invitations");
    setDoc(doc(invitationRef, `${currentEmail}-${toEmail}-${id}`), {
      from: currentEmail,
      to: toEmail,
      roomID: id,
      createdAt: Date.now().toString()
    }, { merge: true });
    } catch(error) {
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
  const handleCardClick = (index: number) => {
    setSelectedCardIndices((prevSelectedIndices) => {
      if (prevSelectedIndices.includes(index)) {
        return prevSelectedIndices.filter((i) => i !== index);
      } else {
        return [...prevSelectedIndices, index];
      }
    });
  };
 
  const checkEndGame = () => { 
    if (player.hand.length !==0 || !gameState) return 
    const roomRef = doc(db, "rooms", id as string); 
    updateDoc(roomRef, {
      preRoundWinner : currentEmail,
      onGameState : false 
    }) 
  };  
  checkEndGame();
   
  const isTurn = async () => {
    const roomRef = doc(db, "rooms", id as string);
    const room = await getDoc(roomRef);
    const turn = room.data()?.turn;
    if (room.data()?.player[turn].email === currentEmail) {
       return true
    }return false
  };
   
  const  updateTurn = async () => {
    const roomRef = doc(db, "rooms", id as string);
    const room = await getDoc(roomRef);
    let turn = room.data()?.turn;
    turn++; 
    if(turn >= room.data()?.player.length) turn = 0; 
    updateDoc(roomRef, {
      turn: turn
    })  
    if (room.data()?.player[turn].isPass === true) {
      updateTurn();
      return;
    } 
    const passCount = room.data()?.players.filter((player: { isPass: boolean }) => player.isPass === true).length; //maybe unefine?
    if(passCount === room.data()?.player.length - 1){ 
      room.data()?.player.forEach((_: any, index: number) => {
        updateDoc(roomRef, {
          [`player.${index}.isPass`]: false
        })  
      }); 
      //  update next turn player muon play cai j cx dc 
    } 
  };
  
  const  passTurn = async () => {
    if( await isTurn() === false) return;  
    const roomRef = doc(db, "rooms", id as string);
    const room = await getDoc(roomRef);
    let turn = room.data()?.turn;
    updateDoc(roomRef, {
      [`player.${turn}.isPass`]: true
    })  
    updateTurn();
  }; 
   
  const handleCardPlay = async () => {
    if( await isTurn() === false) return;  
    const playedCards = selectedCardIndices.map((index) => player.hand[index]);  
    if(!isValidPlay(playedCards,onboardCard,true))return  
    setSelectedCardIndices([]);  
    const filteredHand = player.hand.filter((_, index) => !selectedCardIndices.includes(index));
    const roomRef = doc(db, "rooms", id as string);
    const room = await getDoc(roomRef);
    updateDoc(roomRef, {
      onboardCard: playedCards
    })  
    const roomDataPlayers = room.data()?.player;
    const newRoomDataPlayers = roomDataPlayers.map((p: Player) => {
      if (p.email === currentEmail) {
        return {
          ...p,
          hand:filteredHand,
        };
      }
      return p;
    })
    updateDoc(roomRef, { player: newRoomDataPlayers }); 
    updateTurn() 
  };
  
  const handleSort = async () => {
    if (!player.hand.length || !id) return;

    const sortedCards = sortHand(player.hand);  
    setPlayer((prevPlayer) => ({
      ...prevPlayer,
      hand: sortedCards,
    }));
    const roomRef = doc(db, "rooms", id as string);
    const room = await getDoc(roomRef);
    const roomDataPlayers = room.data()?.player;
    const newRoomDataPlayers = roomDataPlayers.map((p: Player) => {// 2 player sort cung luc -> bug
      if (p.email === currentEmail) {
        return {
          ...p,
          hand: sortedCards,
        };
      }
      return p;
    })
    updateDoc(roomRef, { player: newRoomDataPlayers }); 
  };
  const handleSendMessage = async () => {
    if(!messageText) return
    const timestamp = Date.now().toString();
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
    setMessageText('')
    setMessages([...messages as Message[], {
      fromEmail: currentEmail,
      fromAvatar: userData?.avatar,
      toRoom: id,
      createdAt: timestamp,
      content: messageText
     } as Message]);
    const messageRef = collection(db, "messages");
    setDoc(doc(messageRef, `${currentEmail}-${id}-${timestamp}`), {
      fromEmail: currentEmail,
      fromAvatar: userData?.avatar,
      toRoom: id,
      createdAt: timestamp,
      content: messageText
    })
  }
  const convertDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const options = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    };
    return date.toLocaleDateString('en-US', options as any);
  }
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
        const player = room.data()?.player.find((p: Player) => p.email === currentEmail);
        if(player){
          setPlayer(player);
        }
      }
        
      if(room.data()?.onboardCard){
        setOnboardCard(room.data()?.onboardCard);
      } 
        
      if(room.data()?.onGameState){
        setgGameState(room.data()?.onGameState);
      }  
    })  
    onSnapshot(query(collection(db, "messages"), where("toRoom", "==", id)), async (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => doc.data() as Message)
        .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
      );
      
    })
  }, []);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [onChatBox])
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
            <View className='absolute right-[20%] flex flex-col space-y-1'>
            {player?.hand.length > 0 && 
              <TouchableOpacity onPress={handleSort}>
                <View className='px-5 py-2 bg-sky-500 w-max h-max rounded-md'>
                  <Text className='text-white font-semibold'>Sort</Text>
                </View>
              </TouchableOpacity>
            }
             {selectedCardIndices.length > 0 && 
              <TouchableOpacity onPress={handleCardPlay}>
                <View className='px-5 py-2 bg-sky-500 w-max h-max rounded-md'>
                  <Text className='text-white font-semibold'>Play Card</Text>
                </View>
              </TouchableOpacity>
            } 
            </View>
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
                {isInvitationSended ? (
                  <View className='absolute right-3'>
                    <Feather name="check" size={20} color="green" />
                  </View>
                ) : (
                <TouchableOpacity className='absolute right-3' onPress={() => {
                    touchSound()
                    handleInvite(user.email)
                  }}>
                    <FontAwesome5 name="plus-square" size={20} color="black" />
                </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
          </View>
        )}
        <TouchableOpacity className='absolute bottom-[5%] left-[5%]' onPress={() => {
          touchSound()
          setOnChatBox(!onChatBox)
        }}>
          <Ionicons name="chatbox-ellipses-outline" size={24} color="white" />
        </TouchableOpacity>
        {onChatBox &&
          <View className='absolute bottom-[5%] left-[10%] flex flex-col-reverse p-3 rounded-md bg-gray-100 z-10'>
            <View className='flex flex-row space-x-1 items-center'>
              <TextInput
                className='w-[220px] p-1 bg-slate-300 rounded-md'
                value={messageText}
                onChangeText={(text) => setMessageText(text)}
              />
              <TouchableOpacity onPress={handleSendMessage}>
                <MaterialCommunityIcons name="send" size={24} color="blue" />
              </TouchableOpacity>
            </View>
            <View className='w-full h-[1px] bg-black my-1'/>
            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} className='space-y-3' style={{maxHeight: 150}}>
              {messages.map((message, index) => (
                <View className={`flex flex-row space-x-3 items-center ${message.fromEmail === currentEmail ? 'justify-end' : ''}`} key={index}>
                  {message.fromEmail !== currentEmail && <Image source={{uri: message.fromAvatar}} className='w-[24px] h-[24px] rounded-full' />}
                  <View className='p-2 bg-slate-300 rounded-md'>
                    <Text className='text-md'>{message.content}</Text>
                    <Text className='text-[6px] text-gray-500'>{convertDate(parseInt(message.createdAt))}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        }
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