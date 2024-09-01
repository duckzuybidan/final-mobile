import AntDesign from "@expo/vector-icons/AntDesign";
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export const LoadingIcon = () => {
    const rotateValue = useRef(new Animated.Value(0)).current;
  
    useEffect(() => {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
  
      rotateAnimation.start();
  
      return () => rotateAnimation.stop();
    }, [rotateValue]);
  
    const rotate = rotateValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
  
    return (
      <Animated.View style={{ transform: [{ rotate }] }}>
        <AntDesign name="loading1" size={50} color="white" />
      </Animated.View>
    );
  };