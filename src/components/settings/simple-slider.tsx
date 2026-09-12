import { useMemo, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

type SimpleSliderProps = {
  value: number; // 0~1
  onChange: (value: number) => void;
};

const GREEN = '#699447';
const KNOB_SIZE = 20;

// 별도 슬라이더 라이브러리(react-native-community/slider 등)가 설치돼 있지 않고,
// 지금은 기기 셸이 막혀 npm install도 할 수 없는 상태라 PanResponder로 직접 구현했다
// (메인 화면의 스와이프 제스처도 같은 방식으로 이미 PanResponder를 쓰고 있어 새 의존성 없이 통일됨).
export function SimpleSlider({ value, onChange }: SimpleSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  function handleLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  function updateFromX(x: number) {
    if (trackWidth <= 0) return;
    const ratio = Math.min(1, Math.max(0, x / trackWidth));
    onChange(ratio);
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => updateFromX(event.nativeEvent.locationX),
        onPanResponderMove: (event) => updateFromX(event.nativeEvent.locationX),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trackWidth, onChange],
  );

  const knobLeft = trackWidth * value - KNOB_SIZE / 2;

  return (
    <View style={styles.wrap} onLayout={handleLayout} {...panResponder.panHandlers}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value * 100}%` }]} />
      </View>
      <View style={[styles.knob, { left: Math.max(0, Math.min(trackWidth - KNOB_SIZE, knobLeft)) }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: KNOB_SIZE + 8,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E9E9E9',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: GREEN,
  },
  knob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#FEFEFE',
    borderWidth: 2,
    borderColor: GREEN,
    top: 3,
  },
});
