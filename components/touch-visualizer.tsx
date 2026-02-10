import React from "react";
import { StyleSheet, View } from "react-native";

export type TouchPoint = {
  id: number;
  x: number;
  y: number;
};

type TouchVisualizerProps = {
  touches: TouchPoint[];
};

export function TouchVisualizer({ touches }: TouchVisualizerProps) {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      {touches.map((touch) => (
        <View
          key={touch.id}
          style={[
            styles.ripple,
            {
              left: touch.x - 16,
              top: touch.y - 16,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  ripple: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.95)",
  },
});
