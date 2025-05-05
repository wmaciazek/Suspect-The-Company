'use client';

import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_PATH = '/models/Mancandy.glb';

export default function AdvisorAvatar({ isSpeaking, visemeId }) {
  const group = useRef();
  
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions } = useAnimations(animations, group);
  
  useEffect(() => {
    if (!scene) return;
    
    scene.traverse((node) => {
      if (node.isMesh) {
        node.material.side = THREE.DoubleSide;
        node.frustumCulled = false;
      }
    });
    
    console.log('Model structure:', scene);
    
  }, [scene]);

  const visemeToBlendShape = {
    0: 'viseme_sil', 
    1: 'viseme_PP', 
    2: 'viseme_FF',
  };

  useEffect(() => {
    if (!scene || !scene.morphTargetDictionary) return;
    
    Object.keys(scene.morphTargetDictionary || {}).forEach(key => {
      if (scene.morphTargetInfluences) {
        const idx = scene.morphTargetDictionary[key];
        scene.morphTargetInfluences[idx] = 0;
      }
    });
    
    if (isSpeaking && visemeToBlendShape[visemeId] && scene.morphTargetDictionary) {
      const blendShapeName = visemeToBlendShape[visemeId];
      if (scene.morphTargetDictionary[blendShapeName] !== undefined) {
        const idx = scene.morphTargetDictionary[blendShapeName];
        if (scene.morphTargetInfluences) {
          scene.morphTargetInfluences[idx] = 1.0;
        }
      }
    }
    
    if (actions && Object.keys(actions).length > 0) {
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
        scale={1.0} 
        position={[0, -3, 0]} 
        rotation={[0, 0, 0]} 
      />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);