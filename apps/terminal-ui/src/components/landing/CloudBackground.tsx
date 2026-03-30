"use client";

import React, { useEffect, useRef, useState } from "react";

const BLOCKS = ['█', '▓', '▒', '░', ' '];

export const CloudBackground = () => {
    const [renderString, setRenderString] = useState("");
    const frame = useRef(0);
    const canvasRef = useRef<{ width: number, height: number }>({ width: 100, height: 40 });

    useEffect(() => {
        let animationFrameId: number;
        
        const updateGridSize = () => {
            const w = Math.floor(window.innerWidth / 10);
            const h = Math.floor(window.innerHeight / 18);
            canvasRef.current = { width: w, height: h };
        };

        window.addEventListener('resize', updateGridSize);
        updateGridSize();

        const render = () => {
            frame.current += 1;
            const t = frame.current * 0.03;
            const { width, height } = canvasRef.current;
            
            let output = "";
            for (let y = 0; y < height; y++) {
                let row = "";
                for (let x = 0; x < width; x++) {
                    const nx = (x / width - 0.5) * 2 * (width / height) * 0.8;
                    const ny = (y / height - 0.5) * 2;
                    const r = Math.sqrt(nx * nx + ny * ny);
                    const angle = Math.atan2(ny, nx);
                    
                    const spiral = Math.sin(r * 8 - angle + t * 1.5);
                    const rings = Math.sin(r * 12 - t * 2);
                    const breathing = Math.sin(t * 1.2) * 0.15 + 0.85;
                    
                    const voidEffect = ((min: number, max: number, value: number) => {
                        const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
                        return x * x * (3 - 2 * x);
                    })(0.15, 0.45, r);
                    
                    const val = (spiral * 0.5 + rings * 0.5) * breathing * voidEffect;
                    
                    let charIndex = 4;
                    if (val > 0.6) charIndex = 0;
                    else if (val > 0.3) charIndex = 1;
                    else if (val > 0.0) charIndex = 2;
                    else if (val > -0.3) charIndex = 3;
                    
                    if (r > 0.95 && Math.sin(angle * 20 + t * 4) > 0.8) charIndex = 3;
        
                    row += BLOCKS[charIndex];
                }
                output += row + "\n";
            }
            
            setRenderString(output);
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', updateGridSize);
        };
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none bg-black flex items-center justify-center">
            {/* The AsciiVortex Engine adapted for background */}
            <pre 
                className="font-mono text-[8px] leading-[8px] sm:text-[10px] sm:leading-[10px] tracking-[2px] whitespace-pre text-white/10 opacity-60 select-none pointer-events-none w-full h-full flex items-center justify-center"
                style={{ 
                    textShadow: '0px 0px 20px rgba(255,255,255,0.15)' 
                }}
            >
                {renderString}
            </pre>

            {/* Global HUD Scanlines Overlay */}
            <div className="absolute inset-0 z-[1] opacity-[0.02]"
                 style={{
                     backgroundImage: `linear-gradient(rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.05))`,
                     backgroundSize: '100% 4px, 4px 100%'
                 }}
            />

            {/* Depth Vignettes */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-[2]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-[2]" />
        </div>
    );
};
