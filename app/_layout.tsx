import { useEffect, useState } from 'react';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import { Audio, ResizeMode, Video } from 'expo-av';
import { Stack } from 'expo-router';
import { Image, View } from 'react-native';
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!
const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key)
      if (item) {
        console.log(`${key} was used 🔐 \n`)
      } else {
        console.log('No values stored under key: ' + key)
      }
      return item
    } catch (error) {
      console.error('SecureStore get item error: ', error)
      await SecureStore.deleteItemAsync(key)
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value)
    } catch (err) {
      return
    }
  },
}
if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  )
}
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const sound = new Audio.Sound();

  useEffect(() => {
    async function prepare() {
      try {
        await sound.loadAsync(require('@/assets/audios/splash.mp3'));
        await sound.playAsync();
        await new Promise((resolve) => setTimeout(resolve, 4500));
        setIsReady(true);
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, []);

  

  return (
    <>
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        {!isReady ? (
          <View className='relative flex w-screen h-screen items-center justify-center'>
            <Video
              source={require('@/assets/screens/splash.mp4')}
              className='w-full h-full rotate-90 scale-[3]'
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={true}
              isLooping={true}
            />
            <Image
              source={require('@/assets/screens/splash.png')}
              className='w-[180px] h-[180px] absolute'
              resizeMode='contain'
            />
          </View>
        ) : (
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="friends" options={{ headerShown: false }} />
          </Stack>
        )}
      </ClerkLoaded>
    </ClerkProvider>
    </>
  );
}



