import { db } from '@/firebase'
import { touchSound } from '@/utils/effects'
import { useLocalSearchParams } from 'expo-router'
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native'
import Toast from 'react-native-toast-message'
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { LoadingIcon } from '@/components/LoadingIcon'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import Entypo from '@expo/vector-icons/Entypo';
import CustomConfirmModal from '@/components/CustomConfirmModal'
enum Mode {
  addFriend,
  seeFriends,
  requests,
}
enum Status {
  pending = 'pending',
  accepted = 'accepted',
  cancel = 'cancel',
}
type User = {
  email: string,
  name: string,
  avatar: string,
  coins: number,
  friends: string[]
}
export default function Page() {
  const { email } = useLocalSearchParams()
  const [mode, setMode] = useState<Mode>(Mode.seeFriends)
  const [findEmail, setFindEmail] = useState('')
  const [findUserData, setFindUserData] = useState<User| null>(null)
  const [isFinding, setIsFinding] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [requests, setRequests] = useState<User[]>([])
  const [isRequestsLoading, setIsRequestsLoading] = useState(false)
  const [friends, setFriends] = useState<User[]>([])
  const [isFriendsLoading, setIsFriendsLoading] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState('')
  const [onModal, setOnModal] = useState(false)
  const handleSearch = async () => {
    touchSound()
    if(email === findEmail) {
      Toast.show({
        type: 'error',
        text1: 'You can not add yourself',
      })
      return
    }
    setIsFinding(true)
    setFindUserData(null)
    try {
      const user = await getDoc(doc(db, 'users', findEmail))
      if (!user.exists()) {
        Toast.show({
          type: 'error',
          text1: 'User not found',
        })
        setIsFinding(false)
        return
      }
      setFindUserData({
        email: user.id,
        name: user.data()?.name,
        avatar: user.data()?.avatar,
        coins: user.data()?.coins,
        friends: user.data()?.friends
      })
      const requestRef = await getDoc(doc(db, 'friend_requests', `${email}-${findEmail}`))
      if(requestRef.exists() && requestRef.data()?.status === Status.pending) {
        setIsPending(true)
      }
      setIsFinding(false)
      setFindEmail('')
      
    }
    catch(error) {
      setIsFinding(false)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong',
        text2Style: {fontSize: 16}
      })
    }
  }
  const handleCancel = async () => {
    touchSound()
    try{
      setIsPending(false)
      const requestRef = collection(db, "friend_requests");
      await updateDoc(doc(requestRef, `${email}-${findUserData?.email}`), {
        createdAt: Date.now().toString(),
        status: Status.cancel
      });
    }
    catch(error) {
      setIsPending(true)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong',
        text2Style: {fontSize: 16}
      })
    }
  }
  const handleAddFriend = async () => {
    touchSound()
    try {
      setIsPending(true)
      const requestRef = collection(db, "friend_requests");
      await setDoc(doc(requestRef, `${email}-${findUserData?.email}`), {
        from: email,
        to: findUserData?.email,
        createdAt: Date.now().toString(),
        status: Status.pending
      }, { merge: true });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Friend request sent',
        text2Style: {fontSize: 16}
      })
    
    } 
    catch (error) {
      setIsPending(false)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong',
        text2Style: {fontSize: 16}
      })
    }
  }
  const AddIconStatus = () => {
    if(findUserData?.friends.includes(email as string)) {
      return (
        <View className='absolute right-3'>
          <Feather name="user-check" size={20} color="green" />
        </View>
      )
    }
    if(isPending) {
      return (
        <TouchableOpacity className='absolute right-3' onPress={handleCancel}>
          <Feather name="user-x" size={20} color="black" />
        </TouchableOpacity>
      )
    }
    return (
      <TouchableOpacity className='absolute right-3' onPress={handleAddFriend}>
        <AntDesign name="adduser" size={20} color="black" />
      </TouchableOpacity>
    )
  }
  const handleAcceptRequest = async (user: User) => {
    touchSound()
    try{
      setRequests(requests.filter((user) => user.email !== user.email))
      setFriends([...friends, {email: user.email, name: user.name, avatar: user.avatar, coins: user.coins, friends: user.friends}])
      const requestRef = collection(db, "friend_requests");
      updateDoc(doc(requestRef, `${user.email}-${email}`), {
        createAt: Date.now().toString(),
        status: Status.accepted
      });
      const userRef = collection(db, "users");
      updateDoc(doc(userRef, user.email), {
        friends: arrayUnion(email)
      });
      updateDoc(doc(userRef, email as string), {
        friends: arrayUnion(user.email)
      });
    }
    catch(error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong',
        text2Style: {fontSize: 16}
      })
    }
  }
  const handleDeclineRequest = async (fromEmail: string) => {
    touchSound()
    try{
      setRequests(requests.filter((user) => user.email !== fromEmail))
      const requestRef = collection(db, "friend_requests");
      updateDoc(doc(requestRef, `${fromEmail}-${email}`), {
        status: Status.cancel,
        createAt: Date.now().toString()
      });
    }
    catch(error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong',
        text2Style: {fontSize: 16}
      })
    }
  }
  const handleUnfriend = async (selectedEmail: string) => {
    try{
      setFriends(friends.filter((user) => user.email !== selectedEmail))
      const userRef = collection(db, "users");
      updateDoc(doc(userRef, selectedEmail), {
        friends: arrayRemove(email as string)
      });
      updateDoc(doc(userRef, email as string), {
        friends: arrayRemove(selectedEmail)
      });
    }
    catch(error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong',
        text2Style: {fontSize: 16}
      })
    }
  }
  useEffect(() => {
    const fetchFriendRequests = async () => {
      setIsRequestsLoading(true)
      try{
        const friendRequestsRef = collection(db, "friend_requests");
        onSnapshot(query(friendRequestsRef, where("to", "==", email)), async (querySnapshot) => {
          const requestEmails = querySnapshot.docs.map((res) => {
            if(res.data().status === Status.pending){
              return res.data().from
            }
            return null
          }).filter((res) => res !== null)
          const fetchUsers = async (emails: string[]) => {
            const promises = emails.map(async (email) => {
              const user = await getDoc(doc(db, 'users', email))
              if(user.exists()){
                return {
                  email: user.id,
                  name: user.data()?.name,
                  avatar: user.data()?.avatar,
                  coins: user.data()?.coins,
                  friends: user.data()?.friends
                }
              }
              return null
            })
            const users = await Promise.all(promises)
            return users.filter((res) => res !== null)
          }
          const users = await fetchUsers(requestEmails)
          setRequests(users)
          setIsRequestsLoading(false)
        }); 
        
      }
      catch(error) {
        setIsRequestsLoading(false)
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Something went wrong',
          text2Style: {fontSize: 16}
        })
      }
    }
    fetchFriendRequests()
  }, [email])
  useEffect(() => {
    const fetchFriends = async () => {
      setIsFriendsLoading(true)
      try{
        const userRef = collection(db, "users");
        const querySnapshot = await getDocs(query(userRef, where("friends", "array-contains", email)));
        const friends = querySnapshot.docs.map((res) => ({
          email: res.id,
          name: res.data().name,
          avatar: res.data().avatar,
          coins: res.data().coins,
          friends: res.data().friends
        }));
        setFriends(friends)
        setIsFriendsLoading(false)
      }
      catch(error) {
        setIsFriendsLoading(false)
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Something went wrong',
          text2Style: {fontSize: 16}
        })
      }
    }
    fetchFriends()
  }, [email])
  return (
    <>
    <CustomConfirmModal
      open={onModal} 
      onClose={() => setOnModal(false)}
      content={'Are you sure want to unfriend this user?'} 
      onConfirm={() => handleUnfriend(selectedEmail)}
     />
    <View className='flex-1 justify-center items-center bg-gray-700'>
      <View className='bg-slate-300 w-max h-max p-3 flex flex-col items-center rounded-md space-y-3'>
        <View className='w-full flex flex-row'>
          <TouchableOpacity 
          className={`${mode === Mode.seeFriends ? 'bg-slate-100' : 'bg-slate-300'} p-1 rounded-lg`} 
          onPress={() => {
            touchSound()
            setMode(Mode.seeFriends)
          }}>
            <Text className='text-xl font-bold'>Friend list</Text>
          </TouchableOpacity>
          <View className='w-[2px] h-full bg-slate-500 mx-3'/>
          <TouchableOpacity 
          className={`${mode === Mode.addFriend ? 'bg-slate-100' : 'bg-slate-300'} p-1 rounded-lg`}
          onPress={() => {
            touchSound()
            setMode(Mode.addFriend)
          }}>
            <Text className='text-xl font-bold'>Add friend</Text>
          </TouchableOpacity>
          <View className='w-[2px] h-full bg-slate-500 mx-3'/>
          <TouchableOpacity 
          className={`${mode === Mode.requests ? 'bg-slate-100' : 'bg-slate-300'} p-1 rounded-lg`}
          onPress={() => {
            touchSound()
            setMode(Mode.requests)
          }}>
            <Text className='text-xl font-bold'>Requests</Text>
          </TouchableOpacity>
        </View>
        <View className='w-[350px] h-[2px] bg-slate-500'/>
        {mode === Mode.addFriend && 
          <View className='flex flex-col items-center space-y-3'>
            <TextInput 
              className='w-[300px] h-[48px] bg-slate-100 rounded-md p-3' 
              placeholder='Email address' 
              value={findEmail}
              onChangeText={(text) => setFindEmail(text)}
              keyboardType='email-address'
            />
            {isFinding && !findUserData &&
              <View className='m-2'>
                <LoadingIcon />
              </View>
            }
            {findUserData && 
              <View className='relative w-[350px] flex flex-row items-center space-x-3 bg-sky-500 p-3 rounded-md'>
                <Image source={{uri: findUserData.avatar}} className='w-[24px] h-[24px] rounded-full'/>
                <Text className='text-md'>{findUserData.name}</Text>
                <AddIconStatus />
              </View>
            }
            <TouchableOpacity className='p-3 bg-green-400 rounded-lg' onPress={handleSearch}>
              <Text className='text-xl font-bold'>Search</Text>
            </TouchableOpacity>
          </View>
        }
        {mode === Mode.requests && 
          <ScrollView showsVerticalScrollIndicator={false} className='space-y-3' style={{maxHeight: 150}}>
            {isRequestsLoading && <LoadingIcon />}
            {requests.length === 0 && !isRequestsLoading &&
              <Text className='text-xl font-semibold text-gray-600'>No requests</Text>
            }
            {requests.length > 0 && requests.map((user, index) => (
              <View className='relative w-[350px] flex flex-row items-center space-x-3 bg-slate-100 p-3 rounded-md' key={index}>
                <Image source={{uri: user.avatar}} className='w-[24px] h-[24px] rounded-full'/>
                <Text className='text-md'>{user.name}</Text>
                <View className='absolute right-3 flex flex-row space-x-3'>
                  <TouchableOpacity onPress={() => handleAcceptRequest(user)}>
                    <Entypo name="check" size={20} color="green" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeclineRequest(user.email)}>
                    <FontAwesome5 name="times" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        }
        {mode === Mode.seeFriends &&
          <ScrollView showsVerticalScrollIndicator={false} className='space-y-3' style={{maxHeight: 200}}>
          {isFriendsLoading && <LoadingIcon />}
          {friends.length === 0 && !isFriendsLoading &&
            <Text className='text-xl font-semibold text-gray-600'>No friends</Text>
          }
          {friends.length > 0 && friends.map((user, index) => (
            <View className='relative w-[350px] flex flex-row items-center space-x-3 bg-slate-100 p-3 rounded-md' key={index}>
              <Image source={{uri: user.avatar}} className='w-[24px] h-[24px] rounded-full'/>
              <Text className='text-md'>{user.name}</Text>
              <View className='absolute right-3'>
                <TouchableOpacity onPress={() => {
                  touchSound()
                  setOnModal(true)
                  setSelectedEmail(user.email)
                }}>
                  <AntDesign name="deleteuser" size={20} color="black" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        }
      </View>
      <Toast />
    </View>
    </>
  )
}