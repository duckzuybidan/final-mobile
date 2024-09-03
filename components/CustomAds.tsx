import { touchSound } from '@/utils/effects'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { ResizeMode, Video } from 'expo-av'
import { View, TouchableOpacity } from 'react-native'
import CustomConfirmModal from './CustomConfirmModal'
import { useState } from 'react'

export default function CustomAds({open, onClose, onFinish}: {open: boolean, onClose: () => void, onFinish: () => void}) {
    const [onModal, setOnModal] = useState(false)
    const source = () => {
        return require('@/assets/ads/1.mp4')
    }
    const handlePlaybackStatusUpdate = (status: any) => {
        if (status.didJustFinish) {
            onClose()
            onFinish()
        }
    };
    if(!open) {
        return null
    }

    return (
        <>
        <CustomConfirmModal open={onModal} onClose={() => setOnModal(false)} content={'You will not get any rewards if you cancel ads'} onConfirm={onClose}/>
        <View className='absolute w-screen h-screen justify-center items-center bg-black/50 z-10'>
            <TouchableOpacity className='absolute right-[5%] top-[5%]' onPress={() => setOnModal(true)}>
                <FontAwesome5 name="times" size={30} color="red" />
            </TouchableOpacity>
            <Video
              source={source()}
              className='w-1/2 h-1/2'
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={true}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
        </View>
        </>
    )
}