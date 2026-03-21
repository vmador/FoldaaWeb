'use client';

import React, { useEffect, useRef, useState } from 'react';

const WIDTH = 80;
const HEIGHT = 18;
// Block characters from most dense to least dense
const BLOCKS = ['█', '▓', '▒', '░', ' '];

export default function AsciiVortexAnimation({ status, onExploded }: { status?: string, onExploded?: () => void }) {
  const [renderString, setRenderString] = useState("");
  const frame = useRef(0);
  const explosionFrame = useRef(0);
  const [isExploding, setIsExploding] = useState(false);
  const hasTriggeredExplosion = useRef(false);

  // Robust status tracking
  useEffect(() => {
    if (status === 'ready' && !isExploding && !hasTriggeredExplosion.current) {
      console.log("💥 Triggering vortex explosion...");
      setIsExploding(true);
      hasTriggeredExplosion.current = true;
    }
  }, [status, isExploding]);

  // Safety fallback: if we've been exploding for too long, force completion
  useEffect(() => {
    if (isExploding) {
        const timer = setTimeout(() => {
            console.log("⚠️ Explosion safety timeout reached, forcing completion");
            if (onExploded) onExploded();
        }, 3000); // reduced to 3s to be snappier
        return () => clearTimeout(timer);
    }
  }, [isExploding, onExploded]);

  useEffect(() => {
    let animationFrameId: number;
    
    const render = () => {
      frame.current += 1;
      const t = frame.current * 0.05;
      
      let output = "";
      
      if (isExploding) {
          explosionFrame.current += 1;
          const et = explosionFrame.current;
          
          // Explosion duration: 30 frames @ ~60fps = 0.5s.
          // Let's make it a bit longer (60 frames = 1s) for better feel
          if (et > 60) {
              if (onExploded) {
                  console.log("✅ Explosion sequence complete");
                  onExploded();
              }
              return;
          }

          for (let y = 0; y < HEIGHT; y++) {
              let row = "";
              for (let x = 0; x < WIDTH; x++) {
                const nx = (x / WIDTH - 0.5) * 2 * (WIDTH / HEIGHT) * 0.5;
                const ny = (y / HEIGHT - 0.5) * 2;
                const r = Math.sqrt(nx * nx + ny * ny);
                
                // Expanding shockwave - sync with et (0 to 60)
                const wavePos = (et / 60) * 1.5; 
                const dist = Math.abs(r - wavePos);
                
                let char = ' ';
                if (dist < 0.08) char = '█';
                else if (dist < 0.15) char = '▓';
                else if (dist < 0.3 && r < wavePos) char = Math.random() > 0.5 ? '░' : '▒';
                
                row += char;
              }
              output += row + "\n";
          }
      } else {
          for (let y = 0; y < HEIGHT; y++) {
            let row = "";
            for (let x = 0; x < WIDTH; x++) {
              const nx = (x / WIDTH - 0.5) * 2 * (WIDTH / HEIGHT) * 0.5;
              const ny = (y / HEIGHT - 0.5) * 2;
              const r = Math.sqrt(nx * nx + ny * ny);
              const angle = Math.atan2(ny, nx);
              
              const spiral = Math.sin(r * 10 - angle + t * 2);
              const rings = Math.sin(r * 15 - t * 3);
              const breathing = Math.sin(t * 1.5) * 0.2 + 0.8;
              
              const voidEffect = ((min: number, max: number, value: number) => {
                const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
                return x * x * (3 - 2 * x);
              })(0.1, 0.4, r);
              
              const val = (spiral * 0.5 + rings * 0.5) * breathing * voidEffect;
              
              let charIndex = 4;
              if (val > 0.6) charIndex = 0;
              else if (val > 0.3) charIndex = 1;
              else if (val > 0.0) charIndex = 2;
              else if (val > -0.3) charIndex = 3;
              
              if (r > 0.9 && Math.sin(angle * 20 + t * 5) > 0.8) charIndex = 3;
    
              row += BLOCKS[charIndex];
            }
            output += row + "\n";
          }
      }
      
      setRenderString(output);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isExploding, onExploded]);

  return (
    <div className="flex flex-col w-full bg-black rounded-[10px] border border-[#222] relative overflow-hidden group mb-4">
      <div className="flex justify-between w-full px-4 py-2 border-b border-[#222] bg-[#0A0A0B]">
        <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isExploding ? 'bg-white animate-ping' : 'bg-fuchsia-500 animate-pulse'}`}></span>
            <span className="text-zinc-400 text-[10px] font-mono tracking-widest uppercase">
                {isExploding ? 'UNPACKING BUNDLE...' : 'CONSTRUCTING ASSETS...'}
            </span>
        </div>
        <span className="text-fuchsia-400 text-[10px] font-mono tracking-widest">
            {isExploding ? 'READY' : 'MAC APP BUILD IN PROGRESS'}
        </span>
      </div>
      
      <div className="relative w-full h-[150px] overflow-hidden bg-black flex items-center justify-center">
        <pre className={`${isExploding ? 'text-white' : 'text-fuchsia-500'} font-mono text-[8px] leading-[8px] sm:text-[10px] sm:leading-[10px] tracking-[2px] whitespace-pre overflow-hidden select-none pointer-events-none w-full h-full p-2 flex items-center justify-center`} style={{ textShadow: isExploding ? '0px 0px 12px rgba(255, 255, 255, 0.8)' : '0px 0px 8px rgba(217, 70, 239, 0.4)' }}>
            {renderString}
        </pre>
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] pointer-events-none opacity-60" />
      </div>
    </div>
  );
}
