import React, { createContext, useContext, useRef, useState } from 'react';
import { Animated } from 'react-native';

const DRAWER_WIDTH = 260;

interface DrawerContextType {
  openDrawer: () => void;
  closeDrawer: () => void;
  translateX: Animated.Value;
  overlayOpacity: Animated.Value;
  isOpen: boolean;
}

const DrawerContext = createContext<DrawerContextType | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = () => {
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setIsOpen(false));
  };

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, translateX, overlayOpacity, isOpen }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error('useDrawer must be used within DrawerProvider');
  return ctx;
}

export const DRAWER_WIDTH_CONST = DRAWER_WIDTH;
