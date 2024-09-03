import UserSlot from '@/components/UserSlot'
import { useLocalSearchParams } from 'expo-router'
import { View, Image } from 'react-native'

export default function Page() {
    const {id} = useLocalSearchParams()
  return (
    <View className='relative w-full h-full justify-center items-center'>
      <Image source={require('@/assets/screens/room-background.jpg')} className='w-full h-full' />
      <UserSlot />
    </View>
  )
}