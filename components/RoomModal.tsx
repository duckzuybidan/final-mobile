
import { db } from '@/firebase'
import { touchSound } from '@/utils/effects'
import { router } from 'expo-router'
import { arrayUnion, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import Toast from 'react-native-toast-message'

export default function RoomModal({open, onClose, type, email}: {open: boolean, onClose: (roomNo?: string) => void, type: 'create' | 'join', email: string}) {
    const [formData, setFormData] = useState({
        roomId: '',
        password: ''
    })
    const handleCreateRoom = async () => {
        if(formData.roomId.length === 0 || formData.password.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Room ID and Password are required'
            })
            return
        }
        const checked = await getDoc(doc(db, "rooms", formData.roomId))
        if(checked.exists()) {
            Toast.show({
                type: 'error',
                text1: 'Room ID already exists'
            })
            return
        }
        const roomRef = collection(db, "rooms");
        setDoc(doc(roomRef, formData.roomId), {
            members: [email],
            password: formData.password,
            host: email
        })
        const userRef = collection(db, "users");
        updateDoc(doc(userRef, email), {
            inRoomNo: formData.roomId
        })
        router.push(`/room?id=${formData.roomId}`)
        setFormData({roomId: '', password: ''})
        onClose(formData.roomId)
    }
    const handleJoinRoom = async () => {
        const checked = await getDoc(doc(db, "rooms", formData.roomId))
        if(!checked.exists()) {
            Toast.show({
                type: 'error',
                text1: 'Room ID does not exist'
            })
            return
        }
        if(formData.password !== checked.data()?.password) {
            Toast.show({
                type: 'error',
                text1: 'Password is incorrect'
            })
            return
        }
        const roomRef = doc(db, "rooms", formData.roomId)
        updateDoc(roomRef, {
            members: arrayUnion(email)
        })
        const userRef = collection(db, "users");
        updateDoc(doc(userRef, email), {
            inRoomNo: formData.roomId
        })
        router.push(`/room?id=${formData.roomId}`)
        setFormData({roomId: '', password: ''})
        onClose(formData.roomId)
    }
    if(!open) {
        return null
    }
    return (
        <View className='absolute w-screen h-screen justify-center items-center bg-black/50 z-20'>
            <View className='relative bg-slate-300 p-3 flex flex-col space-y-3 rounded-lg w-1/2'>
                <Text className='w-full text-center text-xl font-medium'>{type === 'create' ? 'Create Room' : 'Join Room'}</Text>
                <View className='w-full h-[1px] bg-black'/>
                <View className='flex flex-col space-y-1'>
                    <Text className='font-medium'>{type === 'create' ? 'Enter Room ID(maximum 6 digits)' : 'Enter Room ID'}</Text>
                    <TextInput 
                        className='bg-white rounded-lg px-2 h-[36px]' 
                        keyboardType='numeric'
                        value={formData.roomId}
                        onChangeText={(text) => {
                            if(text.length <= 6) {
                                setFormData({...formData, roomId: text})
                            }
                        }}
                    />
                </View>
                <View className='flex flex-col space-y-1'>
                    <Text className='font-medium'>Password</Text>
                    <TextInput 
                        className='bg-white rounded-lg px-2 h-[36px]' 
                        keyboardType='numeric'
                        value={formData.password}
                        onChangeText={(text) => setFormData({...formData, password: text})}
                    />
                </View>
                <View className='w-full h-[1px] bg-black'/>
                <View className='flex flex-row space-x-3 w-full items-center justify-around'>
                    <TouchableOpacity className='p-3 bg-red-500 rounded-lg' onPress={() => {
                        touchSound()
                        onClose()
                    }}>
                        <Text className='text-white text-center font-semibold'>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className='p-3 bg-green-500 rounded-lg' onPress={() => {
                        touchSound()
                        if(type === 'create') {
                            handleCreateRoom()
                        } else {
                            handleJoinRoom()
                        }
                    }}>
                        <Text className='text-black text-center font-semibold'>{type === 'create' ? 'Create' : 'Join'} Room</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <Toast />
        </View>
    )
}
