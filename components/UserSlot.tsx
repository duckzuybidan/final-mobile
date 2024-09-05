import { db } from '@/firebase'
import { Player, sortHand } from '@/helper/game_logic'
import AntDesign from '@expo/vector-icons/AntDesign'
import { useLocalSearchParams } from 'expo-router'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet, Button } from 'react-native'

export default function UserSlot({no, userEmail}: {no: number, userEmail?: string}) {
  const [player, setPlayer] = useState<Player>(  
     {email: '' , 
    hand:  [], 
    onTurn: false,
    isPass: false,});
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]); 
 const { id } = useLocalSearchParams(); 
 const [userData, setUserData] = useState<{
        name: string,
        avatar: string,
        coins: number,
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
  useEffect(() => {
    if(!userEmail) return
    const fetchUser = async () => {
      const fetchUser = await getDoc(doc(db, "users", userEmail))
      setUserData(fetchUser.data() as any)
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
           <Button title="Sort" onPress={() => handleSort()} />
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
          <Image source={{uri: userData?.avatar}} className='w-[50px] h-[50px] rounded-full' />
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
 