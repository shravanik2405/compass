import Constants from "expo-constants";
import { useEffect, useState } from "react";

export type PhotoColor = {
  primary: string;
  secondary: string;
};

const FALLBACK: PhotoColor = { primary: "#222", secondary: "#000" };

type PhotoInput = { id: string; uri: string };

/**
 * Extracts dominant and secondary colours from each photo URI at runtime.
 * Returns an array aligned with the input — index-for-index.
 * Falls back to dark greys while loading or on error.
 * Uses dynamic import so the app runs in Expo Go (no ImageColors native module).
 */
export function useImageColors(photos: PhotoInput[]): PhotoColor[] {
  const [colors, setColors] = useState<PhotoColor[]>(
    () => photos.map(() => FALLBACK),
  );

  useEffect(() => {
    if (Constants.appOwnership === "expo") return;

    let cancelled = false;

    async function extract() {
      try {
        const { getColors } = await import("react-native-image-colors");

        const results = await Promise.all(
          photos.map(async (photo) => {
            try {
              const result = await getColors(photo.uri, {
                fallback: "#222",
                cache: true,
                key: photo.id,
              });

              if (result.platform === "android") {
                return {
                  primary: result.dominant ?? "#222",
                  secondary: result.average ?? "#000",
                };
              }
              if (result.platform === "ios") {
                return {
                  primary: result.primary ?? "#222",
                  secondary: result.secondary ?? "#000",
                };
              }
              return FALLBACK;
            } catch {
              return FALLBACK;
            }
          }),
        );

        if (!cancelled) {
          setColors(results);
        }
      } catch {
        if (!cancelled) {
          setColors(photos.map(() => FALLBACK));
        }
      }
    }

    extract();
    return () => { cancelled = true; };
  }, [photos]);

  return colors;
}
