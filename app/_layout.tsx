import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureResponderEvent, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TouchPoint, TouchVisualizer } from "@/components/touch-visualizer";

const MINIVER_TTF =
  "https://cdn.jsdelivr.net/fontsource/fonts/miniver@latest/latin-400-normal.ttf";

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    Miniver: MINIVER_TTF,
  });
  const [touches, setTouches] = useState<TouchPoint[]>([]);
  const touchIdRef = useRef(0);
  const clearTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const showTouches = Platform.OS === "ios";

  useEffect(() => {
    return () => {
      clearTimersRef.current.forEach((timer) => clearTimeout(timer));
      clearTimersRef.current = [];
    };
  }, []);

  const onTouchEndCapture = useCallback(
    (event: GestureResponderEvent) => {
      if (!showTouches) {
        return;
      }

      const changedTouches = event.nativeEvent.changedTouches ?? [];
      if (changedTouches.length === 0) {
        return;
      }

      const nextTouches = changedTouches.map((touch) => ({
        id: ++touchIdRef.current,
        x: touch.pageX,
        y: touch.pageY,
      }));

      setTimeout(() => {
        setTouches((current) => [...current, ...nextTouches]);

        nextTouches.forEach((touch) => {
          const timer = setTimeout(() => {
            setTouches((current) => current.filter((item) => item.id !== touch.id));
          }, 380);

          clearTimersRef.current.push(timer);
        });
      }, 0);
    },
    [showTouches],
  );

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container} onTouchEndCapture={onTouchEndCapture}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
        {showTouches ? <TouchVisualizer touches={touches} /> : null}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
