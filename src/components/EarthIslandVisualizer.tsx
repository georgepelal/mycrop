import React from 'react';
import { getRetroCropBlocks } from "../utils/cropSprites";

export interface EarthIslandLayer {
  id: string;
  height: number; // in blocks
  leftLabel?: React.ReactNode;
  rightLabel?: React.ReactNode;
  renderBlock: (rowIndex: number, colIndex: number) => React.ReactNode;
}

export interface EarthIslandVisualizerProps {
  cropType?: string;
  layers: EarthIslandLayer[];
  legend?: React.ReactNode;
  columns?: number;
}

export function EarthIslandVisualizer({ cropType = "Corn", layers, legend, columns = 20 }: EarthIslandVisualizerProps) {
  return (
    <div className="island-wrapper bg-gradient-to-b from-[#38bdf8] to-[#0284c7] rounded-3xl p-6 shadow-md border-4 border-slate-900 flex flex-col items-center justify-center relative overflow-hidden w-full">
      {/* Retro Sun & Clouds */}
      <div className="absolute top-8 right-16 w-12 h-12 bg-yellow-300 border-4 border-yellow-100 shadow-[0_0_30px_rgba(253,224,71,0.6)] rounded-sm animate-pulse" />
      <div className="absolute top-6 left-8 w-16 h-6 bg-white/90 rounded-sm" style={{ animation: "float 6s ease-in-out infinite" }} />
      <div className="absolute top-10 right-32 w-24 h-8 bg-white/90 rounded-sm" style={{ animation: "float 8s ease-in-out infinite reverse" }} />
      <div className="absolute top-16 left-1/3 w-20 h-6 bg-white/90 rounded-sm" style={{ animation: "float 7s ease-in-out infinite 1s" }} />

      <div className="island-container flex gap-1 sm:gap-2 lg:gap-4 items-start z-10 relative w-full justify-center pb-4 mt-2 scale-100 origin-top" style={{ "--columns": columns } as React.CSSProperties}>
        
        {/* Left labels - Depth */}
        <div className="flex flex-col items-end pt-[calc(4*var(--block-size)+4px)] lg:pt-[calc(4*var(--block-size)+6px)]">
          {layers.map((l, i) => (
            <div key={`left-${i}`} style={{ height: `calc(${l.height} * var(--block-size))` }} className="flex items-center pr-2 sm:pr-3 justify-end w-full relative group">
              {l.leftLabel}
            </div>
          ))}
          <div style={{ height: `calc(2 * var(--block-size))` }} className="flex items-center pr-2 sm:pr-3 justify-end w-full relative group">
            <span className="text-white/80 font-black text-[9px] sm:text-[10px] lg:text-xs whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Bedrock</span>
          </div>
        </div>

        <style>{`
          .island-wrapper {
            container-type: inline-size;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .island-container {
            --base-block-size: 10px;
            --block-size: calc(var(--base-block-size) * (20 / var(--columns)));
          }
          @container (min-width: 380px) { .island-container { --base-block-size: 11px; } }
          @container (min-width: 440px) { .island-container { --base-block-size: 12px; } }
          @container (min-width: 500px) { .island-container { --base-block-size: 14px; } }
          @container (min-width: 600px) { .island-container { --base-block-size: 16px; } }
          @container (min-width: 700px) { .island-container { --base-block-size: 18px; } }
        `}</style>
        
        {/* Center blocks container */}
        <div className="flex flex-col items-center shrink-0">
          {/* Retro crops layer */}
          <div className="flex flex-col items-center mb-[-2px] z-10 relative">
            {getRetroCropBlocks(cropType, columns).map((row, rIdx) => (
              <div key={`crop-row-${rIdx}`} className="flex">
                {row.map((colorClass, cIdx) => (
                  <div 
                    key={`crop-${rIdx}-${cIdx}`}
                    className={`w-[var(--block-size)] h-[var(--block-size)] shrink-0 ${
                      colorClass 
                        ? `${colorClass} border-[1px] md:border-[2px]` 
                        : "bg-transparent border-transparent"
                    }`} 
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Earth Island */}
          <div className="flex flex-col items-center bg-slate-900 p-1 lg:p-1.5 rounded-xl shadow-xl border-2 border-slate-700 relative z-0">
            {/* Grass layer */}
            <div className="flex">
              {[...Array(columns)].map((_, i) => (
                <div key={`grass-${i}`} className={`w-[var(--block-size)] h-[var(--block-size)] ${i % 2 === 0 ? 'bg-[#528a36] border-t-[#70b24b] border-l-[#70b24b] border-b-[#325720] border-r-[#325720]' : 'bg-[#4b7a32] border-t-[#66a345] border-l-[#66a345] border-b-[#2a4d1b] border-r-[#2a4d1b]'} border-[1px] md:border-[2px] shrink-0 relative overflow-hidden`}>
                  {i % 4 === 2 && <div className="absolute bottom-0 left-[20%] w-[40%] h-[40%] bg-[#3d6328] rounded-t-full" />}
                </div>
              ))}
            </div>

            {/* Configurable layers */}
            {layers.map((layer) => {
              return [...Array(layer.height)].map((_, rowIndex) => (
                <div key={`${layer.id}-${rowIndex}`} className="flex">
                  {[...Array(columns)].map((_, colIndex) => layer.renderBlock(rowIndex, colIndex))}
                </div>
              ));
            })}

            {/* Bedrock layer */}
            <div className="flex">
              {[...Array(columns)].map((_, i) => (
                <div key={`bedrock-${i}`} className={`w-[var(--block-size)] h-[var(--block-size)] ${i % 2 === 0 ? 'bg-[#505050] border-t-[#787878] border-l-[#787878] border-b-[#2a2a2a] border-r-[#2a2a2a]' : 'bg-[#4a4a4a] border-t-[#6a6a6a] border-l-[#6a6a6a] border-b-[#222222] border-r-[#222222]'} border-[1px] md:border-[2px] shrink-0 relative overflow-hidden`}>
                  {i % 3 === 0 && <div className="absolute top-[20%] left-[20%] w-[20%] h-[20%] bg-[#333] opacity-30" />}
                </div>
              ))}
            </div>
            <div className="flex">
              {[...Array(columns)].map((_, i) => (
                <div key={`bedrock-2-${i}`} className={`w-[var(--block-size)] h-[var(--block-size)] ${i % 2 !== 0 ? 'bg-[#454545] border-t-[#606060] border-l-[#606060] border-b-[#1a1a1a] border-r-[#1a1a1a]' : 'bg-[#3b3b3b] border-t-[#555555] border-l-[#555555] border-b-[#111111] border-r-[#111111]'} border-[1px] md:border-[2px] shrink-0 relative overflow-hidden`}>
                   {i % 4 === 1 && <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] bg-[#222] opacity-40" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side labels */}
        <div className="flex flex-col items-start pt-[calc(4*var(--block-size)+4px)] lg:pt-[calc(4*var(--block-size)+6px)]">
          {layers.map((l, i) => (
            <div key={`right-${i}`} style={{ height: `calc(${l.height} * var(--block-size))` }} className="flex flex-col justify-center pl-2 sm:pl-3 relative group">
              {l.rightLabel}
            </div>
          ))}
          <div style={{ height: `calc(2 * var(--block-size))` }} className="flex items-center pl-1 sm:pl-2">
            <span className="text-white/80 font-black text-[9px] sm:text-[10px] lg:text-xs drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Bedrock</span>
          </div>
        </div>

      </div>
      
      {legend && (
        <div className="mt-4 w-full">
          {legend}
        </div>
      )}
    </div>
  );
}
