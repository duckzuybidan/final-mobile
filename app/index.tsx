import { useAuth, useClerk, useOAuth } from "@clerk/clerk-expo";
import { Image, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { touchSound } from "@/utils/effects";
import * as Linking from 'expo-linking';
import { useEffect, useState } from "react";
import {db} from '@/firebase'
import { collection, doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { LoadingIcon } from "@/components/LoadingIcon";
import Feather from '@expo/vector-icons/Feather';
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useRouter } from "expo-router";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import CustomConfirmModal from "@/components/CustomConfirmModal";
import CustomAds from "@/components/CustomAds";
import RoomModal from "@/components/RoomModal";
import { useNavigationState } from "@react-navigation/native";
enum Strategy {
  Google = 'oauth_google',
}
type RoomModal = {
  open: boolean,
  type: 'create' | 'join'
}
export default function Page() {
  const routeName = useNavigationState(state => state.routes[state.index].name);
  const [isLoading, setIsLoading] = useState(false);
  const [onMenu, setOnMenu] = useState(false);
  const { signOut, session } = useClerk();
  const { user } = useUser();
  const {isSignedIn} = useAuth()
  const { startOAuthFlow: googleAuth} = useOAuth({strategy: "oauth_google"});
  const redirectUrl = Linking.createURL('/');
  const [coins, setCoins] = useState<number | null>(null)
  const [onModal, setOnModal] = useState(false)
  const [onAds, setOnAds] = useState(false)
  const [roomModal, setRoomModal] = useState<RoomModal>({
    open: false,
    type: 'create'
  })
  const [inRoomNo, setInRoomNo] = useState<string | null>(null)
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
 const handleSignOut = () => {
  touchSound();
  setCoins(null)
  setInRoomNo(null)
  signOut(session?.id as any);
 }
 const handleWatchAd = () => {
  touchSound();
  setOnAds(true)
 }
 const handleFinishAds = () => {
  if(coins){
    setCoins(coins + 30)
    setDoc(doc(db, "users", user?.emailAddresses[0].emailAddress!), {
      coins: coins + 30
    }, { merge: true });
   }
 }
 useEffect(() => {
  const putUserToDB = async () => {
    if(isSignedIn){
      setIsLoading(false)
      const checked = await getDoc(doc(db, "users", user?.emailAddresses[0].emailAddress!));
          if(checked.exists()){
            setCoins(checked.data().coins)
            onSnapshot(doc(db, "users", user?.emailAddresses[0].emailAddress!), (doc) => {
              setInRoomNo(doc.data()?.inRoomNo)
            })
            return
          }
          const userRef = collection(db, "users");
          await setDoc(doc(userRef, user?.emailAddresses[0].emailAddress!), {
            name: user?.fullName,
            coins: 500,
            friends: [],
            avatar: user?.imageUrl,
            inRoomNo: "0000000"
          }, { merge: true });
    }
  }
  putUserToDB()
 }, [isSignedIn])
  return (
  <>
    <RoomModal 
      open={roomModal.open} 
      onClose={(roomNo?: string) => {
        setRoomModal({...roomModal, open: false})
        roomNo && setInRoomNo(roomNo)
      }} 
      type={roomModal.type} email={user?.emailAddresses[0].emailAddress!}
    />
    <CustomConfirmModal open={onModal} onClose={() => setOnModal(false)} content="Watch an ad to get 30 coins?" onConfirm={handleWatchAd}/>
    <CustomAds 
      open={onAds} 
      onClose={() => setOnAds(false)} 
      onFinish={handleFinishAds}
    />
    <View className="relative flex-1 justify-center items-center gap-y-3">
      <StatusBar barStyle="light-content" />
      <Image source={require('@/assets/screens/background.jpg')} 
        resizeMode="cover"
        className="absolute h-full w-full"
      />
      <SignedIn>
        <View className="relative w-full h-full flex justify-center items-center">
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
          <View className="absolute top-[15%] left-[5%] flex flex-row space-x-2 items-center">
            {coins ? (
              <Text className="text-white font-semibold text-2xl">{coins}</Text> 
            ) : (
              <Text className="text-white font-semibold text-2xl">---</Text>
            )}
            <Image source={require('@/assets/stuff/coin.jpg')} className="w-6 h-6 rounded-full"/>
            <TouchableOpacity onPress={() => {
              touchSound();
              setOnModal(true)
            }}>
              <AntDesign name="pluscircle" size={17} color="white" />
            </TouchableOpacity>
          </View>
          <>
            {!inRoomNo && <LoadingIcon/>}
            {inRoomNo && (inRoomNo !== "0000000" ? (
              <TouchableOpacity 
              className="bg-sky-500 rounded-md p-3 flex flex-row items-center"
              onPress={() => {
                touchSound(); 
                router.push(`/room?id=${inRoomNo}`)}}
            >
              <Text className="text-white text-xl font-semibold">You are in room {inRoomNo}</Text>
            </TouchableOpacity>
            ): (
            <View className="flex flex-col items-center space-y-2">
            <TouchableOpacity 
              className="bg-red-500 rounded-md p-3 flex flex-row items-center"
              onPress={() => {
                touchSound(); 
                setRoomModal({...roomModal, open: true, type: 'create'})}}
            >
              <Text className="text-white text-xl font-semibold">Create Room</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="bg-green-500 rounded-md p-3 flex flex-row items-center"
              onPress={() => {
                touchSound();
                setRoomModal({...roomModal, open: true, type: 'join'})}}
            >
              <Text className="text-black text-xl font-semibold">Join Room</Text>
            </TouchableOpacity>
            </View>
            ))}
          </>
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
    </>
  );
}