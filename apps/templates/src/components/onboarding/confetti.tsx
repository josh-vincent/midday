"use client";

import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationVelocity: number;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'triangle';
}

interface ConfettiProps {
  active?: boolean;
  duration?: number;
  particleCount?: number;
  className?: string;
}

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
];

export function Confetti({ 
  active = true, 
  duration = 3000, 
  particleCount = 50,
  className = ""
}: ConfettiProps) {
  const [particles, setParticles] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(active);

  useEffect(() => {
    if (!active) return;

    // Generate initial particles
    const newParticles: ConfettiPiece[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        velocityX: (Math.random() - 0.5) * 10,
        velocityY: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationVelocity: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle',
      });
    }
    setParticles(newParticles);

    // Animation timer
    const animationInterval = setInterval(() => {
      setParticles(currentParticles => 
        currentParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          rotation: particle.rotation + particle.rotationVelocity,
          velocityY: particle.velocityY + 0.3, // gravity
        })).filter(particle => particle.y < window.innerHeight + 50)
      );
    }, 16); // ~60fps

    // Stop after duration
    const stopTimer = setTimeout(() => {
      setIsActive(false);
      clearInterval(animationInterval);
      setParticles([]);
    }, duration);

    return () => {
      clearInterval(animationInterval);
      clearTimeout(stopTimer);
    };
  }, [active, duration, particleCount]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div 
      className={`fixed inset-0 pointer-events-none z-50 overflow-hidden ${className}`}
      style={{ perspective: '1000px' }}
    >
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            transform: `rotate(${particle.rotation}deg)`,
            transition: 'none',
          }}
        >
          {particle.shape === 'circle' && (
            <div
              className="rounded-full"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
              }}
            />
          )}
          {particle.shape === 'square' && (
            <div
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
              }}
            />
          )}
          {particle.shape === 'triangle' && (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${particle.size / 2}px solid transparent`,
                borderRight: `${particle.size / 2}px solid transparent`,
                borderBottom: `${particle.size}px solid ${particle.color}`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Simpler confetti burst component
export function ConfettiBurst({ trigger = false, className = "" }: { trigger?: boolean; className?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsPlaying(true);
      const timer = setTimeout(() => setIsPlaying(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return <Confetti active={isPlaying} className={className} />;
}

// Hook for triggering confetti programmatically
export function useConfetti() {
  const [trigger, setTrigger] = useState(false);

  const fire = () => {
    setTrigger(false);
    setTimeout(() => setTrigger(true), 50);
  };

  return { trigger, fire };
}