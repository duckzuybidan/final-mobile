import { db } from '@/firebase'
import { Player, sortHand } from '@/helper/game_logic'
import { useUser } from '@clerk/clerk-expo'
import AntDesign from '@expo/vector-icons/AntDesign'
import Feather from '@expo/vector-icons/Feather'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { useLocalSearchParams } from 'expo-router'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet, Button, TouchableOpacity } from 'react-native'

export default function UserSlot({
  no,
  userEmail,
  isHost,
  }:{
  no: number,
  userEmail?: string,
  isHost?: boolean,
  }){
  const {user} = useUser()
  const currentEmail = user?.emailAddresses[0].emailAddress
  const [player, setPlayer] = useState<Player>({
    email: '' , 
    hand:  [], 
    onTurn: false,
    isPass: false
  });
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]); 
  const { id } = useLocalSearchParams(); 
  const [userData, setUserData] = useState<{
        name: string,
        avatar: string,
        coins: number,
        friends: string[],
    }| null>(null)  
  const position = () => {
    switch (no) {
      case 1:
        return 'bottom-[5%] left-[45%]'
      case 2:
        return 'top-[40%] left-[5%]'
      case 3:
        return 'top-[5%] left-[45%]'
      case 4:
        return 'top-[40%] right-[5%]'
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
    return (
      <TouchableOpacity>
        <AntDesign name="adduser" size={20} color="white" />
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
  getPlayer();

  async function getPlayer(){
    const room = await getDoc(doc(db, "rooms", id as string));
    if(room.data()?.player.length===0)return
    for(let i =0;i<room.data()?.members.length;i++){
       if(room.data()?.player[i].email===userEmail){
        setPlayer(room.data()?.player[i])}
    }    
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
  const handleSort = async () => {
    const sortedCards = sortHand(player?.hand);
    const room = await getDoc(doc(db, "rooms", id as string));
    for(let i =0;i<room.data()?.members.length;i++){
      if(room.data()?.player[i].email===userEmail){ 
        updateDoc(doc(db, "rooms", id as string), {
          [`player.${i}.hand`] : sortedCards,
        });
         
      } 
   }   
    setPlayer((prevPlayer) => ({
      ...prevPlayer,
      hand: sortedCards,
    })); 
 
  }; 
    
  return (
    <View className={`absolute ${position()}`}>
         {no== 1 &&   (<View
            style={{
              flexDirection: "row",
              justifyContent: "center", // Centers the content horizontally
              paddingBottom: 100,
            }}
          >
           {/* <Button title="Sort" onPress={() => handleSort()} /> */}
            <View style={{ width: ((player?.hand.length? + 1:0) * 90) / 2 }}>
              {player?.hand.map((card, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleCardClick(index)}
                  style={[styles.cardWrapper, { left: (index * 90) / 2 }]} // Overlapping effect
                >
                  <Image
                    source={{ uri: card.image }}
                    style={[
                      styles.reactLogo,
                      selectedCardIndices.includes(index) &&
                        styles.selectedCardHighlight,
                    ]}
                  />
                </Pressable>
              ))}
            </View> 
          </View>)}
        {userEmail ? (
          <View className='relative'>
          <View className='flex flex-row space-x-1 items-center'>
            <Image source={{uri: userData?.avatar}} className='w-[40px] h-[40px] rounded-full' />
            <AddIconStatus />
          </View>
            <Text className='text-sm text-white'>{userData?.name}</Text>
            <View className='flex flex-row items-center space-x-1'>
              <Text className='text-sm text-white'>{userData?.coins}</Text>
              <Image source={require('../assets/stuff/coin.jpg')} className='rounded-full w-[16px] h-[16px]' />
            </View>
            {isHost && <View className='absolute top-0 left-0'>
              <FontAwesome5 name="crown" size={8} color="yellow" />
            </View>}
          </View>
        ) : (
          <AntDesign name="pluscircleo" size={50} color="black" />
        )}
    </View>
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
    position: "absolute", // Allows the cards to overlap
    left: 0,
  },

   
});
 