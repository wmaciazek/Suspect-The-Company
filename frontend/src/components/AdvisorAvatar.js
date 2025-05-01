'use client';

import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// Ścieżka do modelu 3D
const MODEL_PATH = '/models/Mancandy.glb';

export default function AdvisorAvatar({ isSpeaking, visemeId }) {
  const group = useRef();
  
  // Załaduj model 3D
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions } = useAnimations(animations, group);
  
  useEffect(() => {
    if (!scene) return;
    
    // Ustawienie materiałów jako dwustronne
    scene.traverse((node) => {
      if (node.isMesh) {
        node.material.side = THREE.DoubleSide;
        node.frustumCulled = false;
      }
    });
    
    // Wypisz w konsoli strukturę modelu (pomocne do debugowania)
    console.log('Model structure:', scene);
    
  }, [scene]);

  // Mapowanie ID viseme na kształt ust modelu
  const visemeToBlendShape = {
    0: 'viseme_sil', // Silence
    1: 'viseme_PP', 
    2: 'viseme_FF',
    // ... pozostałe kształty ust, dostosuj do twojego modelu
  };

  // Efekt do animacji mówienia
  useEffect(() => {
    if (!scene || !scene.morphTargetDictionary) return;
    
    // Wypisz dostępne blend shapes (pomocne do debugowania)
    console.log('Available blend shapes:', scene.morphTargetDictionary);
    
    // Reset wszystkich blend shapes
    Object.keys(scene.morphTargetDictionary || {}).forEach(key => {
      if (scene.morphTargetInfluences) {
        const idx = scene.morphTargetDictionary[key];
        scene.morphTargetInfluences[idx] = 0;
      }
    });
    
    // Ustaw aktywny blend shape dla viseme
    if (isSpeaking && visemeToBlendShape[visemeId] && scene.morphTargetDictionary) {
      const blendShapeName = visemeToBlendShape[visemeId];
      if (scene.morphTargetDictionary[blendShapeName] !== undefined) {
        const idx = scene.morphTargetDictionary[blendShapeName];
        if (scene.morphTargetInfluences) {
          scene.morphTargetInfluences[idx] = 1.0;
        }
      }
    }
    
    // Odtwórz animację gdy mówi
    if (actions && Object.keys(actions).length > 0) {
      // Wypisz dostępne animacje (pomocne do debugowania)
      console.log('Available animations:', Object.keys(actions));
      
      const idleAction = actions['Idle'] || Object.values(actions)[0];
      const talkAction = actions['Talk'] || Object.values(actions)[0];
      
      if (isSpeaking) {
        idleAction?.fadeOut(0.5);
        talkAction?.reset().fadeIn(0.5).play();
      } else {
        talkAction?.fadeOut(0.5);
        idleAction?.reset().fadeIn(0.5).play();
      }
    }
  }, [isSpeaking, visemeId, scene, actions]);

  return (
    <group ref={group}>
      <primitive 
        object={scene} 
        scale={1.0} // Zmniejszam skalę, aby model był lepiej widoczny
        position={[0, -3, 0]} // Przesuwam model w dół, aby był widoczny dla kamery patrzającej z góry
        rotation={[0, 0, 0]} 
      />
    </group>
  );
}

// Preładowanie modelu dla lepszej wydajności
useGLTF.preload(MODEL_PATH);