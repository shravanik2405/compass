import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { getRandomPetNames, inferPetKindFromLabel } from "@/constants/pet-names";
import { INERTIAL_SCROLL_CONFIG } from "@/constants/scroll";
import { fetchUnsplashPhotos } from "@/services/unsplash";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type PhotoItem = {
  id: string;
  uri: string;
  label: string;
};

type LayoutBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const SAMPLE_PHOTOS: PhotoItem[] = [
  {
    id: "1",
    uri: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Cat",
  },
  {
    id: "2",
    uri: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Dog",
  },
  {
    id: "3",
    uri: "https://images.unsplash.com/photo-1494256997604-768d1f608cac?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Cat",
  },
  {
    id: "4",
    uri: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Dog",
  },
  {
    id: "5",
    uri: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Cat",
  },
  {
    id: "6",
    uri: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Dog",
  },
  {
    id: "7",
    uri: "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Cat",
  },
  {
    id: "8",
    uri: "https://images.unsplash.com/photo-1583512603806-077998240c7a?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Dog",
  },
  {
    id: "9",
    uri: "https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Cat",
  },
  {
    id: "10",
    uri: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Dog",
  },
  {
    id: "11",
    uri: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Cat",
  },
  {
    id: "12",
    uri: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Dog",
  },
  {
    id: "13",
    uri: "https://images.unsplash.com/photo-1472491235688-bdc81a63246e?auto=format&fit=crop&w=1200&h=1800&q=90",
    label: "Cat",
  },
];

const withRandomPetNames = (items: PhotoItem[]) => {
  const catCount = items.filter(
    (item) => inferPetKindFromLabel(item.label) === "cat",
  ).length;
  const dogCount = items.filter(
    (item) => inferPetKindFromLabel(item.label) === "dog",
  ).length;

  const catNames = getRandomPetNames("cat", catCount);
  const dogNames = getRandomPetNames("dog", dogCount);

  let catIndex = 0;
  let dogIndex = 0;

  return items.map((item) => {
    const petKind = inferPetKindFromLabel(item.label);
    if (petKind === "dog") {
      const dogName = dogNames[dogIndex % dogNames.length];
      dogIndex += 1;
      return { ...item, label: dogName };
    }

    const catName = catNames[catIndex % catNames.length];
    catIndex += 1;
    return { ...item, label: catName };
  });
};

const SAMPLE_PHOTOS_WITH_NAMES = withRandomPetNames(SAMPLE_PHOTOS);

const ARC_SCALE = 1.9;
const MOTION_BOOST = 1.05;
const ARC_EDGE_SOFTEN = 0.98;
const IMG_ASPECT = 2 / 3; // Source images are 1200x1800

const LOOP_COPIES = 5;

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const [photos, setPhotos] = useState<PhotoItem[]>(SAMPLE_PHOTOS_WITH_NAMES);
  const [focusedName, setFocusedName] = useState(SAMPLE_PHOTOS_WITH_NAMES[0]?.label ?? "");
  const loopN = photos.length;
  const loopData = useMemo(
    () => Array.from({ length: LOOP_COPIES }, () => photos).flat(),
    [photos],
  );
  const itemFullSize = height / 9;
  const itemSize = Math.min(itemFullSize * 0.84, width * 0.336);
  const radius = Math.max((height - itemSize) / 2, itemSize) * ARC_SCALE;
  const centerY = height / 2;
  const baseX = (width - itemSize) / 2 + 16;

  const contentPadding = (height - itemFullSize) / 2;
  const initialLoopOffset = Math.floor(LOOP_COPIES / 2) * loopN * itemFullSize;
  const loopAmount = loopN * itemFullSize;
  const scrollY = useSharedValue(initialLoopOffset);
  const listRef = useRef<Animated.FlatList<PhotoItem>>(null);
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const modalOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const openProgress = useSharedValue(0);
  const imageX = useSharedValue(0);
  const imageY = useSharedValue(0);
  const imageW = useSharedValue(0);
  const imageH = useSharedValue(0);
  const dragY = useSharedValue(0);
  const originRef = useRef<LayoutBox | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPhotos = async () => {
      try {
        const fetchedPhotos = await fetchUnsplashPhotos(SAMPLE_PHOTOS.length);
        if (isMounted && fetchedPhotos.length > 0) {
          setPhotos(fetchedPhotos);
        }
      } catch (error) {
        console.warn("Failed to fetch Unsplash photos", error);
      }
    };

    loadPhotos();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setFocusedName(photos[0]?.label ?? "");
  }, [photos]);

  useEffect(() => {
    scrollY.value = initialLoopOffset;
    listRef.current?.scrollToOffset({ offset: initialLoopOffset, animated: false });
  }, [initialLoopOffset, scrollY]);

  const recenterToMiddleCopy = (offsetY: number) => {
    if (loopN === 0 || loopAmount === 0) {
      return;
    }

    const wrappedOffset = ((offsetY % loopAmount) + loopAmount) % loopAmount;
    const nextOffset = initialLoopOffset + wrappedOffset;
    if (Math.abs(nextOffset - offsetY) < 1) {
      return;
    }

    listRef.current?.scrollToOffset({ offset: nextOffset, animated: false });
    scrollY.value = nextOffset;
  };

  const updateFocusedName = useCallback(
    (rawIndex: number) => {
      if (loopN === 0) {
        return;
      }

      const normalizedIndex = ((rawIndex % loopN) + loopN) % loopN;
      const nextName = photos[normalizedIndex]?.label ?? "";
      setFocusedName((currentName) =>
        currentName === nextName ? currentName : nextName,
      );
    },
    [loopN, photos],
  );

  useAnimatedReaction(
    () => Math.round(scrollY.value / itemFullSize),
    (currentIndex, previousIndex) => {
      if (currentIndex !== previousIndex) {
        runOnJS(updateFocusedName)(currentIndex);
      }
    },
    [itemFullSize, updateFocusedName],
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const onMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    recenterToMiddleCopy(event.nativeEvent.contentOffset.y);
  };

  const onScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const velocityY = Math.abs(event.nativeEvent.velocity?.y ?? 0);
    if (velocityY < 0.05) {
      recenterToMiddleCopy(event.nativeEvent.contentOffset.y);
    }
  };

  const openModal = (item: PhotoItem, origin: LayoutBox | null) => {
    const fallbackOrigin = {
      x: (width - itemSize) / 2,
      y: (height - itemSize) / 2,
      width: itemSize,
      height: itemSize,
    };
    const safeOrigin =
      origin && origin.width > 0 && origin.height > 0 ? origin : fallbackOrigin;

    originRef.current = safeOrigin;
    setActivePhoto(item);
    setModalVisible(true);
    modalOpacity.value = 1;
    backdropOpacity.value = 0;
    openProgress.value = 0;
    dragY.value = 0;
    
    // Start from tile's actual position and size (square with rounded corners)
    imageX.value = safeOrigin.x;
    imageY.value = safeOrigin.y;
    imageW.value = safeOrigin.width;
    imageH.value = safeOrigin.height;
    
    // Don't animate backdrop during opening - keep arc visible
    // Backdrop will only show based on image size in backdropStyle
    backdropOpacity.value = 1;
    
    // Spring animation for the genie "growing" effect
    const springConfig = {
      damping: 20,
      stiffness: 85,
      mass: 0.9,
    };
    
    openProgress.value = withSpring(1, springConfig);
    // Animate position to fullscreen
    imageX.value = withSpring(0, springConfig);
    imageY.value = withSpring(0, springConfig);
    // Animate size from tile to fullscreen
    imageW.value = withSpring(width, springConfig);
    imageH.value = withSpring(height, springConfig);
  };

  const closeModal = () => {
    const origin = originRef.current;
    if (!origin) {
      modalOpacity.value = withTiming(0, { duration: 220 });
      backdropOpacity.value = withTiming(0, { duration: 220 });
      runOnJS(setModalVisible)(false);
      runOnJS(setActivePhoto)(null);
      return;
    }
    
    dragY.value = withTiming(0, { duration: 180 });
    modalOpacity.value = withTiming(1, { duration: 1 });
    backdropOpacity.value = withTiming(0, { duration: 300 });
    
    // Faster spring config for closing - compensate for shrink feeling faster
    const springConfig = {
      damping: 22,
      stiffness: 65,
      mass: 1.0,
    };
    
    // Animate position back to tile
    imageX.value = withSpring(origin.x, springConfig);
    imageY.value = withSpring(origin.y, springConfig);
    // Animate size back to tile size
    imageW.value = withSpring(origin.width, springConfig);
    imageH.value = withSpring(origin.height, springConfig, (finished) => {
      if (finished) {
        // Immediately hide modal when animation reaches tile position
        runOnJS(setModalVisible)(false);
        runOnJS(setActivePhoto)(null);
      }
    });
    openProgress.value = withSpring(0, springConfig);
  };

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const imageStyle = useAnimatedStyle(() => {
    const translateY = Math.max(dragY.value, 0);
    const dragScale = interpolate(
      translateY,
      [0, height * 0.6],
      [1, 0.86],
      Extrapolate.CLAMP,
    );
    
    // Keep rounded corners constant throughout animation
    const cornerRadius = 24;
    
    return {
      position: "absolute",
      left: imageX.value,
      top: imageY.value,
      width: imageW.value,
      height: imageH.value,
      borderRadius: cornerRadius,
      overflow: "hidden",
      transform: [{ translateY }, { scale: dragScale }],
    };
  });

  // Fixed layout size for the inner image — always at fullscreen-cover dimensions
  // so React Native always decodes at high resolution (no pixelation).
  const fullCoverW = Math.max(width, height * IMG_ASPECT);
  const fullCoverH = fullCoverW / IMG_ASPECT;

  // Transforms scale + position the full-res image to show the correct "cover"
  // crop for the current container size. The container's overflow:hidden clips it.
  const innerImageStyle = useAnimatedStyle(() => {
    const cW = imageW.value;
    const cH = imageH.value;

    // Cover scale: how much to shrink the full-res image for this container
    const containerAR = cW / cH;
    const S = IMG_ASPECT >= containerAR
      ? cH / fullCoverH   // fill-height mode (tall container, e.g. fullscreen)
      : cW / fullCoverW;  // fill-width mode  (wide container, e.g. square tile)

    // Center the image in the container (translate applied before scale,
    // so offset is in unscaled coordinate space)
    const tx = (cW - fullCoverW) / 2;
    const ty = (cH - fullCoverH) / 2;

    return {
      width: fullCoverW,
      height: fullCoverH,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: S },
      ],
    };
  });



  const backdropStyle = useAnimatedStyle(() => {
    // Backdrop only appears when image is near fullscreen
    const sizeProgress = interpolate(
      imageW.value,
      [itemSize, width * 0.85, width],
      [0, 0, 1],
      Extrapolate.CLAMP,
    );
    
    // Also fade out when dragging to close
    const dragFade = interpolate(
      Math.max(dragY.value, 0),
      [0, height * 0.6],
      [1, 0],
      Extrapolate.CLAMP,
    );
    
    return {
      opacity: backdropOpacity.value * sizeProgress * dragFade,
    };
  });

  const dragGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        dragY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      const shouldClose =
        event.translationY > height * 0.18 || event.velocityY > 1200;
      if (shouldClose) {
        runOnJS(closeModal)();
      } else {
        dragY.value = withTiming(0, { duration: 220 });
      }
    });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Animated.FlatList
        ref={listRef}
        initialScrollIndex={Math.floor(LOOP_COPIES / 2) * loopN}
        snapToInterval={itemFullSize}
        snapToAlignment="center"
        decelerationRate={INERTIAL_SCROLL_CONFIG.decelerationRate}
        bounces={INERTIAL_SCROLL_CONFIG.bounces}
        bouncesZoom={INERTIAL_SCROLL_CONFIG.bouncesZoom}
        nestedScrollEnabled={INERTIAL_SCROLL_CONFIG.nestedScrollEnabled}
        overScrollMode={INERTIAL_SCROLL_CONFIG.overScrollMode}
        disableIntervalMomentum={INERTIAL_SCROLL_CONFIG.disableIntervalMomentum}
        data={loopData}
        keyExtractor={(_, index) => `tile-${index}`}
        getItemLayout={(_, index) => ({
          length: itemFullSize,
          offset: index * itemFullSize,
          index,
        })}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={8}
        removeClippedSubviews={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingVertical: Math.max(24, contentPadding) },
        ]}
        renderItem={({ item, index }) => (
          <DialItem
            item={item}
            index={index}
            scrollY={scrollY}
            itemSize={itemSize}
            itemFullSize={itemFullSize}
            radius={radius}
            centerY={centerY}
            baseX={baseX}
            contentPadding={contentPadding}
            onPress={openModal}
          />
        )}
      />
      {!modalVisible && focusedName ? (
        <View pointerEvents="none" style={styles.focusNameLayer}>
          <Text style={styles.focusNameText}>{focusedName}</Text>
        </View>
      ) : null}
      <Modal
        transparent
        visible={modalVisible}
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View style={[styles.modalOverlay, modalStyle]}>
          <Animated.View style={[styles.modalBackdrop, backdropStyle]} />
          {activePhoto ? (
            <GestureDetector gesture={dragGesture}>
              <Animated.View style={imageStyle}>
                <Animated.Image
                  source={{ uri: activePhoto.uri }}
                  style={innerImageStyle}
                  resizeMode="cover"
                />
              </Animated.View>
            </GestureDetector>
          ) : null}
          <Pressable style={styles.modalTapLayer} onPress={closeModal} />
        </Animated.View>
      </Modal>
    </View>
  );
}

type DialItemProps = {
  item: PhotoItem;
  index: number;
  scrollY: SharedValue<number>;
  itemSize: number;
  itemFullSize: number;
  radius: number;
  centerY: number;
  baseX: number;
  contentPadding: number;
  onPress: (item: PhotoItem, origin: LayoutBox | null) => void;
};

function DialItem({
  item,
  index,
  scrollY,
  itemSize,
  itemFullSize,
  radius,
  centerY,
  baseX,
  contentPadding,
  onPress,
}: DialItemProps) {
  const cardRef = useRef<View>(null);
  const X_MULT = 1.15; // reduce to tighten edges, increase to widen

  // const animatedStyle = useAnimatedStyle(() => {
  //   const itemCenterY = index * itemFullSize + contentPadding;
  //   const relativeY = itemCenterY - scrollY.value;
  //   const offsetFromCenter = relativeY - centerY + itemSize / 2;
  //   const boostedOffset = offsetFromCenter * MOTION_BOOST;
  //   const safeRadius = radius * ARC_EDGE_SOFTEN;
  //   const clamped = Math.min(Math.max(boostedOffset, -safeRadius), safeRadius);
  //   const arcAngle = clamped / safeRadius;
  //   const x =
  //     (radius - Math.sqrt(Math.max(radius * radius - clamped * clamped, 0))) *
  //     1.35;
  //   const progress = Math.min(Math.abs(boostedOffset) / safeRadius, 1);

  //   const opacity = interpolate(
  //     progress,
  //     [0, 0.5, 1],
  //     [1, 0.7, 0.35],
  //     Extrapolate.CLAMP,
  //   );
  //   const rotate = arcAngle;

  //   return {
  //     transform: [
  //       { translateX: baseX - x },
  //       { rotateZ: `${rotate}rad` },
  //     ],
  //     opacity,
  //   };
  // });
  const animatedStyle = useAnimatedStyle(() => {
    // Calculate distance from center
    const itemCenterY =
      index * itemFullSize + contentPadding + itemFullSize / 2;

    const relativeY = itemCenterY - scrollY.value;
    const offsetFromCenter = relativeY - centerY;

    const boostedOffset = offsetFromCenter * MOTION_BOOST;
    const safeRadius = radius * ARC_EDGE_SOFTEN;

    // Clamp for progress calculation
    const clamped = Math.min(Math.max(boostedOffset, -safeRadius), safeRadius);

    // Only horizontal arc offset - no Y correction for uniform spacing
    const xOnArc = safeRadius * (1 - Math.cos(clamped / safeRadius)) * X_MULT;

    const progress = Math.min(Math.abs(clamped) / safeRadius, 1);

    const opacity = interpolate(
      progress,
      [0, 0.6, 1],
      [1, 0.75, 0.4],
      Extrapolate.CLAMP,
    );

    // Stronger shadow at center for elevation
    const shadowOpacity = interpolate(
      progress,
      [0, 0.5, 1],
      [0.6, 0.45, 0.35],
      Extrapolate.CLAMP,
    );
    const shadowRadius = interpolate(
      progress,
      [0, 0.5, 1],
      [24, 20, 14],
      Extrapolate.CLAMP,
    );
    const shadowOffsetHeight = interpolate(
      progress,
      [0, 0.5, 1],
      [16, 14, 10],
      Extrapolate.CLAMP,
    );

    return {
      transform: [
        { translateX: baseX - xOnArc },
      ],
      opacity,
      shadowColor: "#000",
      shadowOpacity,
      shadowRadius,
      shadowOffset: { width: 0, height: shadowOffsetHeight },
    };
  });

  const dimStyle = useAnimatedStyle(() => {
    const itemCenterY =
      index * itemFullSize + contentPadding + itemFullSize / 2;

    const relativeY = itemCenterY - scrollY.value;
    const offsetFromCenter = relativeY - centerY;
    const distanceFromCenter = Math.min(
      Math.abs(offsetFromCenter) / itemFullSize,
      1,
    );

    const overlayOpacity = interpolate(
      distanceFromCenter,
      [0, 0.5, 1],
      [0, 0.24, 0.6],
      Extrapolate.CLAMP,
    );

    return { opacity: overlayOpacity };
  });

  return (
    <View style={[styles.itemWrap, { height: itemFullSize }]}>
      <Pressable
        onPress={() => {
          cardRef.current?.measureInWindow((x, y, width, height) => {
            onPress(item, { x, y, width, height });
          });
        }}
      >
        <Animated.View
          ref={cardRef}
          style={[
            styles.card,
            animatedStyle,
            { width: itemSize, height: itemSize },
          ]}
        >
          <Image source={{ uri: item.uri }} style={styles.image} />
          <Animated.View pointerEvents="none" style={[styles.dim, dimStyle]} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  itemWrap: {
    justifyContent: "center",
  },
  focusNameLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 2,
  },
  focusNameText: {
    color: "#ffffff",
    fontFamily: "Miniver",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  labelWrap: {
    position: "absolute",
    left: 16,
    bottom: 16,
    right: 16,
  },
  labelPill: {
    height: 6,
    width: 56,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  modalTapLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  modalImage: {
    position: "absolute",
    top: 0,
    left: 0,
  },

});
