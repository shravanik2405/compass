/**
 * Inertial scroll configuration.
 * Tweak these values to customize how momentum scrolling feels.
 */
export type InertialScrollConfig = {
  /**
   * How quickly the scroll decelerates after release.
   * 0 = immediate stop, 1 = no friction (infinite glide).
   * Range: 0–1. Typical: 0.985–0.999.
   * - Lower (e.g. 0.99): snappier, shorter coast
   * - Higher (e.g. 0.998): smoother, longer glide
   */
  decelerationRate: number;

  /**
   * iOS: Enable bounce at scroll edges.
   */
  bounces: boolean;

  /**
   * Android: Overscroll behavior.
   * - "always": show glow/effect at edges
   * - "never": no overscroll
   * - "auto": system default
   */
  overScrollMode: "always" | "never" | "auto";

  /**
   * iOS: Disable bounce on horizontal axis (vertical-only lists).
   */
  bouncesZoom: boolean;

  /**
   * Whether to allow scroll propagation to parent (nested scroll).
   * Set false for carousels/dials that should capture all scroll.
   */
  nestedScrollEnabled: boolean;

  /**
   * When using snapToInterval: if true, stops at each snap point during momentum.
   * If false, can glide through multiple snaps in one fling.
   */
  disableIntervalMomentum: boolean;

  /** Decay deceleration (0–1). Higher = longer coast. Used by custom gesture scroll. */
  decayDeceleration: number;

  /** Spring config for smooth snap-to-stop. Higher damping = less bounce. */
  snapSpringDamping: number;
  snapSpringStiffness: number;

  /** Ease-to-target duration (ms) when useTimingForSnap is true. */
  snapDuration: number;

  /** Use withTiming (soft stop) vs withSpring for snap. */
  useTimingForSnap: boolean;
};

const DEFAULT_CONFIG: InertialScrollConfig = {
  decelerationRate: 0.998,
  bounces: false,
  overScrollMode: "never",
  bouncesZoom: false,
  nestedScrollEnabled: false,
  disableIntervalMomentum: false,
  decayDeceleration: 0.998,
  snapSpringDamping: 35,
  snapSpringStiffness: 120,
  snapDuration: 300,
  useTimingForSnap: true,
};

/** Default inertial scroll config. Override any field to tweak. */
export const INERTIAL_SCROLL_CONFIG: InertialScrollConfig = {
  ...DEFAULT_CONFIG,
  // Example overrides – uncomment and adjust as needed:
  // decelerationRate: 0.998,
  // bounces: true,
  // overScrollMode: "always",
};
