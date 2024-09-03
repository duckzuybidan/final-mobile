import { db } from '@/firebase'
import AntDesign from '@expo/vector-icons/AntDesign'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { View, Text, Image } from 'react-native'

export default function UserSlot({no, userEmail}: {no: number, userEmail?: string}) {
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
  return (
    <View className={`absolute ${position()}`}>
        {userEmail ? (
          <Image source={{uri: userData?.avatar}} className='w-[50px] h-[50px] rounded-full' />
        ) : (
          <AntDesign name="pluscircleo" size={50} color="black" />
        )}
    </View>
  )
}