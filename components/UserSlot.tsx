import AntDesign from '@expo/vector-icons/AntDesign'
import { View, Text } from 'react-native'

export default function UserSlot() {
  return (
    <View className='absolute top-[40%] left-[20%]'>
        <AntDesign name="pluscircleo" size={50} color="black" />
    </View>
  )
}