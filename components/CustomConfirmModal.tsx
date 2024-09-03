import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { touchSound } from '@/utils/effects'

export default function CustomConfirmModal(
    {open, onClose, title, content, onConfirm}:
    {open: boolean, onClose: () => void, title? : string, content: string, onConfirm: () => void}) {
    if(!open) {
        return null
    }
    const confirm = () => {
        touchSound()
        onClose()
        onConfirm()
    }
    return (
        <View className='absolute w-screen h-screen justify-center items-center bg-black/50 z-20'>
            <View className='bg-white p-3 flex flex-col space-y-3 rounded-lg w-1/2'>
                <Text className='text-lg font-medium'>{content}</Text>
                <View className='w-full h-[1px] bg-black'/> 
                <View className='flex flex-row space-x-3 justify-around'>
                    <TouchableOpacity className='w-1/3 p-2 bg-red-500 rounded-lg' onPress={() => {
                        touchSound()
                        onClose()
                    }}>
                        <Text className='text-white text-center font-semibold'>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className='w-1/3 p-2 bg-green-500 rounded-lg' onPress={confirm}>
                        <Text className='text-black text-center font-semibold'>Confirm</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}