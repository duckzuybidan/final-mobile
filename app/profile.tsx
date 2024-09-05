import { View, Text, TouchableOpacity, TextInput, Image } from 'react-native'
import { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore'
import {db} from '@/firebase'
import { Poppins_600SemiBold, useFonts } from '@expo-google-fonts/poppins';
import { LoadingIcon } from '@/components/LoadingIcon'
import AntDesign from '@expo/vector-icons/AntDesign'
import { touchSound } from '@/utils/effects'
import * as ImagePicker from 'expo-image-picker';
import Toast from "react-native-toast-message";
export default function Page() {
    const { email } = useLocalSearchParams()
    const [isLoading, setIsLoading] = useState(true)
    const [onEditName, setOnEditName] = useState(false)
    const [userData, setUserData] = useState<{
        name: string,
        avatar: string,
        coins: number,
        friends: string[]
    }| null>(null)
    const [fontsLoaded] = useFonts({
        Poppins_600SemiBold
    })
    useEffect(() => {
        const fetchUser = async () => {
            const fetchUser = await getDoc(doc(db, "users", email as string));
            setUserData(fetchUser.data() as any)
        }
        fetchUser()
    }, [email])
    useEffect(() => {
        if(userData && fontsLoaded){
            setIsLoading(false)
        }

    }, [userData, fontsLoaded])
    if(isLoading){
        return (
            <View className='flex-1 justify-center items-center bg-gray-700'>
                <LoadingIcon />
            </View>
        )
    }
    const editName = () => {
        touchSound();
        setOnEditName(!onEditName)
    }
    const onCaptureImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.75,
          base64: true,
        });
    
        if (!result.canceled) {
          const base64 = `data:image/png;base64,${result.assets[0].base64}`;
          setUserData({...userData as any, avatar: base64})
        }
    };
    const handleSave = async () => {
        touchSound();
        try {
            const userRef = collection(db, "users");
            await updateDoc(doc(userRef, email as string), {
                name: userData?.name,
                avatar: userData?.avatar,
            });
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Profile updated successfully',
                text2Style: {fontSize: 16}
            })
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong',
                text2Style: {fontSize: 16}
            })
        }
    }
    return (
        <View className='flex-1 justify-center items-center bg-gray-700'>
            <View className='bg-slate-300 w-max h-max p-3 flex flex-col items-center space-y-3 rounded-md'>
                <TouchableOpacity onPress={onCaptureImage}>
                    <Image source={{uri: userData?.avatar}} className='w-[48px] h-[48px] rounded-full'/>
                </TouchableOpacity>
                <View className='flex flex-col space-y-1'>
                    <Text style={{fontFamily: 'Poppins_600SemiBold'}}>Email</Text>
                    <View className='w-[300px] h-[36px] bg-white rounded-lg flex justify-center px-2'>
                        <Text className='text-slate-500'>{email}</Text>
                    </View>
                </View>
                <View className='flex flex-col space-y-1'>
                    <Text style={{fontFamily: 'Poppins_600SemiBold'}}>Name</Text>
                    <View className='relative w-[300px] h-[36px] bg-white rounded-lg flex justify-center px-2'>
                        {onEditName ? (
                            <TextInput
                                value={userData?.name}
                                onChangeText={(text) => {
                                    if(text.length > 0 && text.length < 30){
                                        setUserData({...userData as any, name: text})
                                    }
                                }}
                                className='text-black'
                            />
                        ) : (
                            <Text className='text-slate-500'>{userData?.name}</Text>
                        )}
                        <TouchableOpacity className='absolute right-[5%] top-[30%]' onPress={editName}>
                            <AntDesign name="edit" size={17} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity className='py-2 px-4 bg-green-400 rounded-lg' onPress={handleSave}>
                    <Text style={{fontFamily: 'Poppins_600SemiBold'}}>Save</Text>
                </TouchableOpacity>
            </View>
            <Toast/>
        </View>
    )
}