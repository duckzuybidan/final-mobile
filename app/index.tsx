import { useAuth, useClerk, useOAuth } from "@clerk/clerk-expo";
import { Image, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { touchSound } from "@/utils/effects";
import * as Linking from 'expo-linking';
import { useEffect, useState } from "react";
import {db} from '@/firebase'
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { LoadingIcon } from "@/components/LoadingIcon";
import Feather from '@expo/vector-icons/Feather';
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
enum Strategy {
  Google = 'oauth_google',
}
export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [onMenu, setOnMenu] = useState(false);
  const { signOut, session } = useClerk();
  const { user } = useUser();
  const {isSignedIn} = useAuth()
  const { startOAuthFlow: googleAuth} = useOAuth({strategy: "oauth_google"});
  const redirectUrl = Linking.createURL('/');
  const onSelectAuth = async (strategy: Strategy) => {
    const selectedAuth = {
      [Strategy.Google]: googleAuth,
    }[strategy];
    try {
      const { createdSessionId, setActive } = await selectedAuth({
        redirectUrl
      });
      if (createdSessionId) {
        setIsLoading(true)
        setActive?.({ session: createdSessionId });
      }
    } catch (err) {
      console.error('OAuth error', err);
    }
  };
 const handleSignIn = async (strategy: Strategy) => {
  touchSound();
  await onSelectAuth(strategy);
  
 }
 const handleMenu = () => {
   touchSound();
   setOnMenu(!onMenu)
 }
 const handleSignOut = async () => {
  touchSound();
  await signOut(session?.id as any);
 }
 useEffect(() => {
  const putUserToDB = async () => {
    if(isSignedIn){
      setIsLoading(false)
      const checked = await getDoc(doc(db, "users", user?.emailAddresses[0].emailAddress!));
          if(checked.exists()){
            return
          }
          const userRef = collection(db, "users");
          await setDoc(doc(userRef, user?.emailAddresses[0].emailAddress!), {
            name: user?.fullName,
            coins: 0,
            friends: [],
            avatar: user?.imageUrl
          }, { merge: true });
    }
  }
  putUserToDB()
 }, [isSignedIn])
  return (
    <View className="relative flex-1 justify-center items-center gap-y-3">
      <StatusBar barStyle="light-content" />
      <Image source={require('@/assets/screens/background.jpg')} 
        resizeMode="cover"
        className="absolute h-full w-full"
      />
      <SignedIn>
        <View className="relative w-full h-full">
          <TouchableOpacity className="absolute top-[10%] right-[5%]" onPress={handleMenu}>
            <Feather name="menu" size={25} color="white"/>
          </TouchableOpacity>
          {onMenu && <View className="bg-slate-100 absolute top-[17%] right-[5%] p-2 rounded-lg space-y-2">
            <TouchableOpacity 
              onPress={() => {
                touchSound();
                router.push(`/profile?email=${user?.emailAddresses[0].emailAddress}`);
              }}>
              <View className="flex flex-row items-center">
                <Feather name="user" size={17} color="black" />
                <Text className="ml-2 text-black font-semibold">Profile</Text>
              </View>
            </TouchableOpacity>
            <View className="bg-black w-full h-[1px]"/>
            <TouchableOpacity
             onPress={() => {
              touchSound();
              router.push(`/friends?email=${user?.emailAddresses[0].emailAddress}`);
            }}>
              <View className="flex flex-row items-center">
                <FontAwesome5 name="user-friends" size={17} color="black" />
                <Text className="ml-2 text-black font-semibold">Friends</Text>
              </View>
            </TouchableOpacity>
            <View className="bg-black w-full h-[1px]"/>
            <TouchableOpacity onPress={handleSignOut}>
              <View className="flex flex-row items-center">
                <AntDesign name="logout" size={17} color="red" />
                <Text className="ml-2 text-black font-semibold">Log out</Text>
              </View>
            </TouchableOpacity>
          </View>}
        </View>
      </SignedIn>
      <SignedOut>
        {isLoading && <LoadingIcon />}
        {!isLoading && <TouchableOpacity 
          className="bg-blue-500 rounded-md p-3 flex flex-row items-center"
          onPress={() => handleSignIn(Strategy.Google)}
        >
          <Image source={require('@/assets/logos/google.png')} className="w-6 h-6 mr-2 round-lg" />
          <Text className="text-white text-xl font-semibold">Continue with Google</Text>
        </TouchableOpacity>}
      </SignedOut>
    </View>
  );
}