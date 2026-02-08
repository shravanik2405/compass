import React from "react";
import { StyleSheet } from "react-native";
import {
  Canvas,
  Circle,
  RadialGradient,
  Blur,
  vec,
  interpolateColors,
} from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import type { PhotoColor } from "@/hooks/use-image-colors";

type AmbientGlowProps = {
  scrollY: SharedValue<number>;
  colors: PhotoColor[];
  itemFullSize: number;
  centerY: number;
  width: number;
  height: number;
};

export function AmbientGlow({
  scrollY,
  colors,
  itemFullSize,
  centerY,
  width,
  height,
}: AmbientGlowProps) {
  const n = colors.length;

  // Build flat arrays of primary colour strings for Skia interpolation.
  // Add a duplicate of index-0 at the end so the wrap-around interpolation
  // between the last and first colour is smooth.
  const primaryStops = React.useMemo(
    () => colors.map((c) => c.primary).concat(colors[0]?.primary ?? "#222"),
    [colors],
  );
  const secondaryStops = React.useMemo(
    () => colors.map((c) => c.secondary).concat(colors[0]?.secondary ?? "#000"),
    [colors],
  );
  const indexInputRange = React.useMemo(
    () => Array.from({ length: n + 1 }, (_, i) => i),
    [n],
  );

  // ── Tuning knobs ──────────────────────────────────────────────────────
  // cx: horizontal centre of the glow – 0.55 puts it behind the arc's
  //     focused tile, which sits slightly right of screen centre.
  const cx = width * 0.55;
  // glowRadius: how far the glow reaches – 35% of screen height feels
  //     ambient without flooding the whole background.
  const glowRadius = height * 0.35;
  // blur sigma: higher = softer. 50 gives a dreamy atmospheric spread.
  const BLUR_SIGMA = 50;
  // canvas opacity: overall intensity. 0.55 keeps it subtle on dark bg.
  const CANVAS_OPACITY = 0.55;
  // gradient stops: core colour at 0, secondary at 0.4, transparent at 1.
  const GRADIENT_POSITIONS: [number, number, number] = [0, 0.4, 1];
  // ─────────────────────────────────────────────────────────────────────

  // Derive the fractional focused-index from scrollY (UI-thread)
  const focusedIndex = useDerivedValue(() => {
    const raw = scrollY.value / itemFullSize;
    // Map the looped offset into [0, n) range
    return ((raw % n) + n) % n;
  });

  // Cross-fade primary colour
  const primaryColor = useDerivedValue(() => {
    return interpolateColors(
      focusedIndex.value,
      indexInputRange,
      primaryStops,
    );
  });

  // Cross-fade secondary colour (used as the mid-ring of the gradient)
  const secondaryColor = useDerivedValue(() => {
    return interpolateColors(
      focusedIndex.value,
      indexInputRange,
      secondaryStops,
    );
  });

  // Transparent black for the outer edge
  const transparent = "rgba(0,0,0,0)";

  return (
    <Canvas
      style={[StyleSheet.absoluteFill, { opacity: CANVAS_OPACITY }]}
      pointerEvents="none"
    >
      {/* Main glow circle */}
      <Circle cx={cx} cy={centerY} r={glowRadius}>
        <RadialGradient
          c={vec(cx, centerY)}
          r={glowRadius}
          colors={[primaryColor, secondaryColor, transparent]}
          positions={GRADIENT_POSITIONS}
        />
        <Blur blur={BLUR_SIGMA} />
      </Circle>
    </Canvas>
  );
}
