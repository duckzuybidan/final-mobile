import { Audio } from "expo-av";
export const touchSound = async () => {
    const sound = new Audio.Sound();
    await sound.loadAsync(require('@/assets/audios/touch.mp3'));
    await sound.playAsync();
    sound.playFromPositionAsync(450);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await sound.unloadAsync();
}