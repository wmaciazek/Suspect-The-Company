'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import AdvisorAvatar from './AdvisorAvatar';

export default function InvestmentAdvisor({ advice, onPlayComplete }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMouthShape, setCurrentMouthShape] = useState(0);
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const mouthUpdateIntervalRef = useRef(null);

  // Pozostały kod pozostaje bez zmian...
  
  // Przygotuj tekst do mowy z porady inwestycyjnej
  useEffect(() => {
    if (advice && advice.ai_insights) {
      // Przygotuj skróconą wersję porady do syntezatora mowy
      const fullText = advice.ai_insights;
      
      // Znajdź najważniejsze sekcje porady
      let summaryText = '';
      
      // Szukaj ogólnej oceny
      const assessmentMatch = fullText.match(/(?:Ogólna ocena|Ocena)(?:\s*:?\s*)([^\.]+)\./i);
      if (assessmentMatch && assessmentMatch[1]) {
        summaryText += `Ogólna ocena dla spółki ${advice.ticker}: ${assessmentMatch[1]}. `;
      }
      
      // Szukaj perspektywy krótkoterminowej
      const shortTermMatch = fullText.match(/(?:Perspektywa krótkoterminowa|Krótkoterminowo)(?:\s*:?\s*)([^\.]+)\./i);
      if (shortTermMatch && shortTermMatch[1]) {
        summaryText += `Perspektywa krótkoterminowa: ${shortTermMatch[1]}. `;
      }
      
      // Szukaj rekomendacji
      const recommendationMatch = fullText.match(/(?:Rekomendacja|Podsumowanie)(?:\s*:?\s*)([^\.]+)\./i);
      if (recommendationMatch && recommendationMatch[1]) {
        summaryText += `Rekomendacja: ${recommendationMatch[1]}.`;
      }
      
      // Jeśli nie znaleziono żadnych sekcji, użyj pierwszych dwóch zdań
      if (!summaryText) {
        const sentences = fullText.split('.');
        if (sentences.length >= 2) {
          summaryText = `${sentences[0]}. ${sentences[1]}.`;
        } else {
          summaryText = fullText;
        }
      }
      
      // Dodaj wprowadzenie
      const finalText = `Witaj! Jestem Twoim wirtualnym doradcą inwestycyjnym. Oto moja analiza dla spółki ${advice.ticker}. ${summaryText}`;
      setText(finalText);
      setIsReady(true);
    }
  }, [advice]);
  
  // Funkcja generowania mowy za pomocą Web Speech API
  const generateSpeech = () => {
    // Kod obsługi Web Speech API pozostaje bez zmian...
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('Synteza mowy niedostępna');
      return;
    }
    
    setIsPlaying(true);
    setIsSpeaking(true);
    
    // Zatrzymaj poprzednią mowę, jeśli istnieje
    window.speechSynthesis.cancel();
    
    // Utwórz nową instancję mowy
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Znajdź polski głos
    const voices = window.speechSynthesis.getVoices();
    const polishVoice = voices.find(voice => voice.lang.includes('pl'));
    
    // Ustaw głos - preferuj polski, jeśli dostępny
    if (polishVoice) {
      utterance.voice = polishVoice;
    }
    
    utterance.lang = 'pl-PL';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Obsługa zdarzeń
    utterance.onstart = () => {
      // Rozpocznij animację poruszania ustami w sposób losowy
      mouthUpdateIntervalRef.current = setInterval(() => {
        // Losowy kształt ust podczas mówienia (1-14, omijamy 0, które jest ciszą)
        setCurrentMouthShape(Math.floor(Math.random() * 14) + 1);
      }, 150);
    };
    
    utterance.onend = () => {
      if (mouthUpdateIntervalRef.current) {
        clearInterval(mouthUpdateIntervalRef.current);
      }
      setCurrentMouthShape(0);
      setIsSpeaking(false);
      setIsPlaying(false);
      if (onPlayComplete) onPlayComplete();
    };
    
    utterance.onerror = (event) => {
      console.error('Błąd syntezy mowy:', event.error);
      if (mouthUpdateIntervalRef.current) {
        clearInterval(mouthUpdateIntervalRef.current);
      }
      setCurrentMouthShape(0);
      setIsSpeaking(false);
      setIsPlaying(false);
    };
    
    // Rozpocznij mowę
    window.speechSynthesis.speak(utterance);
  };

  // Obsługa zatrzymania mowy
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    if (mouthUpdateIntervalRef.current) {
      clearInterval(mouthUpdateIntervalRef.current);
    }
    
    setCurrentMouthShape(0);
    setIsSpeaking(false);
    setIsPlaying(false);
  };

  // Czyszczenie przy odmontowaniu komponentu
  useEffect(() => {
    return () => {
      if (mouthUpdateIntervalRef.current) {
        clearInterval(mouthUpdateIntervalRef.current);
      }
      
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="relative bg-gray-750 rounded-lg border border-gray-700 overflow-hidden">
      <div className="h-[400px] relative">
        <Canvas shadows>
          <color attach="background" args={['#1e293b']} />
          
          {/* Ustawienie kamery wyżej i skierowanej w dół */}
          <PerspectiveCamera 
            makeDefault 
            position={[0, 6, 8]} // Ustawienie kamery wyżej i dalej od modelu
            fov={50} 
            near={0.1} 
            far={1000}
            rotation={[-0.4, 0, 0]} // Lekkie pochylenie kamery w dół
          />
          
          {/* Lepsze oświetlenie */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          <directionalLight position={[-5, 10, 5]} intensity={0.5} />
          <directionalLight position={[0, 10, -5]} intensity={0.3} />
          <spotLight 
            position={[0, 10, 2]} 
            intensity={0.8} 
            angle={0.6} 
            penumbra={1} 
            castShadow
          />
          
          {/* Renderuj oryginalny model */}
          <AdvisorAvatar isSpeaking={isSpeaking} visemeId={currentMouthShape} />
          
          {/* OrbitControls z bardziej ograniczonymi opcjami */}
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate={true} // Pozwól na ręczne obracanie dla testów
            target={[0, -1, 0]} // Punkt, na który patrzy kamera - skierowany na środek modelu
            minPolarAngle={Math.PI / 6} // Ograniczenie widoku z góry
            maxPolarAngle={Math.PI / 3} // Ograniczenie widoku z dołu
            minAzimuthAngle={-Math.PI / 6} // Ograniczenie obrotu w lewo
            maxAzimuthAngle={Math.PI / 6} // Ograniczenie obrotu w prawo
          />
          
          {/* Dodaj płaszczyznę jako podłogę dla lepszego efektu wizualnego */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </Canvas>
        
        {/* Przyciski pozostają bez zmian */}
        {!isPlaying && isReady && (
          <button 
            onClick={generateSpeech}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Odtwórz poradę głosową
          </button>
        )}
        
        {isPlaying && (
          <button 
            onClick={stopSpeaking}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            Zatrzymaj
          </button>
        )}
      </div>
    </div>
  );
}