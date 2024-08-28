import { useEffect, useRef, useState } from 'react';
import { Audio, ResizeMode, Video } from 'expo-av';
import { Stack } from 'expo-router';
import { Image, View } from 'react-native';
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const sound = new Audio.Sound();
  const videoRef = useRef(null);

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
      {!isReady ? (
        <View className='relative flex w-screen h-screen items-center justify-center'>
          <Video
            ref={videoRef}
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
        </Stack>
      )}
    </>
  );
}



