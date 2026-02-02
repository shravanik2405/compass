import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
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
    uri: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
    label: "Trail",
  },
  {
    id: "2",
    uri: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80",
    label: "Summit",
  },
  {
    id: "3",
    uri: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=80",
    label: "Dune",
  },
  {
    id: "4",
    uri: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=80",
    label: "Lake",
  },
  {
    id: "5",
    uri: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80",
    label: "Night",
  },
  {
    id: "6",
    uri: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=80",
    label: "Forest",
  },
  {
    id: "7",
    uri: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80",
    label: "Ridge",
  },
  {
    id: "8",
    uri: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80",
    label: "Desert",
  },
  {
    id: "9",
    uri: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
    label: "Canyon",
  },
  {
    id: "10",
    uri: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80",
    label: "Peak",
  },
  {
    id: "11",
    uri: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=80",
    label: "Oasis",
  },
  {
    id: "12",
    uri: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=80",
    label: "River",
  },
  {
    id: "13",
    uri: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80",
    label: "Ocean",
  },
];

const ARC_SCALE = 1.2;
const MOTION_BOOST = 1.05;
const ARC_EDGE_SOFTEN = 0.98;

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const scrollY = useSharedValue(0);
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const modalOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const imageX = useSharedValue(0);
  const imageY = useSharedValue(0);
  const imageW = useSharedValue(0);
  const imageH = useSharedValue(0);
  const dragY = useSharedValue(0);
  const originRef = useRef<LayoutBox | null>(null);

  const itemSize = Math.min(width * 0.3, 160);
  const itemSpacing = Math.round(itemSize * 0.22);
  const itemFullSize = itemSize + itemSpacing;
  const radius = Math.max((height - itemSize) / 2, itemSize) * ARC_SCALE;
  const centerY = height / 2;
  const baseX = (width - itemSize) / 2 + 16;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const contentPadding = (height - itemSize) / 2;

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
    modalOpacity.value = 0;
    backdropOpacity.value = 0;
    dragY.value = 0;
    imageX.value = safeOrigin.x;
    imageY.value = safeOrigin.y;
    imageW.value = safeOrigin.width;
    imageH.value = safeOrigin.height;
    modalOpacity.value = withTiming(1, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    backdropOpacity.value = withTiming(1, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    imageX.value = withTiming(0, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
    imageY.value = withTiming(0, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
    imageW.value = withTiming(width, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
    imageH.value = withTiming(height, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
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
    backdropOpacity.value = withTiming(0, {
      duration: 260,
      easing: Easing.inOut(Easing.cubic),
    });
    imageX.value = withTiming(origin.x, {
      duration: 320,
      easing: Easing.inOut(Easing.cubic),
    });
    imageY.value = withTiming(origin.y, {
      duration: 320,
      easing: Easing.inOut(Easing.cubic),
    });
    imageW.value = withTiming(origin.width, {
      duration: 320,
      easing: Easing.inOut(Easing.cubic),
    });
    imageH.value = withTiming(
      origin.height,
      {
        duration: 320,
        easing: Easing.inOut(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          modalOpacity.value = withTiming(
            0,
            { duration: 180, easing: Easing.in(Easing.cubic) },
            (done) => {
              if (done) {
                runOnJS(setModalVisible)(false);
                runOnJS(setActivePhoto)(null);
              }
            },
          );
        }
      },
    );
  };

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const imageStyle = useAnimatedStyle(() => {
    const translateY = Math.max(dragY.value, 0);
    const scale = interpolate(
      translateY,
      [0, height * 0.6],
      [1, 0.86],
      Extrapolate.CLAMP,
    );
    return {
      position: "absolute",
      left: imageX.value,
      top: imageY.value,
      width: imageW.value,
      height: imageH.value,
      transform: [{ translateY }, { scale }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const fade = interpolate(
      Math.max(dragY.value, 0),
      [0, height * 0.6],
      [1, 0],
      Extrapolate.CLAMP,
    );
    return {
      opacity: backdropOpacity.value * fade,
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
        data={SAMPLE_PHOTOS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
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
                <Image
                  source={{ uri: activePhoto.uri }}
                  style={styles.modalImage}
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
  scrollY: Animated.SharedValue<number>;
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
  const animatedStyle = useAnimatedStyle(() => {
    const itemCenterY = index * itemFullSize + contentPadding;
    const relativeY = itemCenterY - scrollY.value;
    const offsetFromCenter = relativeY - centerY + itemSize / 2;
    const boostedOffset = offsetFromCenter * MOTION_BOOST;
    const safeRadius = radius * ARC_EDGE_SOFTEN;
    const clamped = Math.min(Math.max(boostedOffset, -safeRadius), safeRadius);
    const arcAngle = clamped / safeRadius;
    const arcY = safeRadius * Math.sin(arcAngle);
    const arcDelta = arcY - clamped;
    const x =
      (radius - Math.sqrt(Math.max(radius * radius - clamped * clamped, 0))) *
      1.35;
    const progress = Math.min(Math.abs(boostedOffset) / safeRadius, 1);

    const opacity = interpolate(
      progress,
      [0, 0.6, 1],
      [1, 0.8, 0.5],
      Extrapolate.CLAMP,
    );
    const rotate = interpolate(
      boostedOffset,
      [-radius, 0, radius],
      [-0.35, 0, 0.35],
      Extrapolate.CLAMP,
    );

    return {
      transform: [
        { translateY: arcDelta },
        { translateX: baseX - x },
        { rotateZ: `${rotate}rad` },
      ],
      opacity,
    };
  });

  const dimStyle = useAnimatedStyle(() => {
    const itemCenterY = index * itemFullSize + contentPadding;
    const relativeY = itemCenterY - scrollY.value;
    const offsetFromCenter = relativeY - centerY + itemSize / 2;
    const boostedOffset = offsetFromCenter * MOTION_BOOST;
    const progress = Math.min(
      Math.abs(boostedOffset) / (radius * 0.7 * ARC_EDGE_SOFTEN),
      1,
    );
    const overlayOpacity = interpolate(
      progress,
      [0, 0.5, 1],
      [0, 0.6, 0.75],
      Extrapolate.CLAMP,
    );
    return {
      opacity: overlayOpacity,
    };
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
    backgroundColor: "#000",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  modalTapLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  modalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
