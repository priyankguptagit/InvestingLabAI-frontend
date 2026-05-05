"use client";

import { useState } from "react";

export default function PriceRangeSlider() {
  // State for Day Range (Top Slider)
  const [dayRange, setDayRange] = useState([12166.60]);
  const dayMin = 11999.87;
  const dayMax = 12248.15;

  // State for 52-Week Range (Bottom Slider)
  const [yearRange, setYearRange] = useState([12166.60]);
  const yearMin = 10440.64;
  const yearMax = 15265.42;

  // Helper to calculate percentage based on specific min/max
  const getPercent = (value: number, min: number, max: number) => {
    return Math.round(((value - min) / (max - min)) * 100);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm h-full font-sans transition-colors duration-300">

      {/* Header */}
      <h3 className="font-bold text-slate-800 dark:text-white mb-6">Snapshot</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Prev Close</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">12,051.48</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Open</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">12,000.21</p>
        </div>

        {/* ==============================================
            SLIDER 1: Day Low / High Range (Dynamic)
           ============================================== */}
        <div className="col-span-2 mt-2">
          <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-white mb-2">
            <span>{dayMin.toLocaleString()}</span>
            <span>{dayMax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-2">
            <span>Day Low</span>
            <span>Day High</span>
          </div>

          <div className="relative w-full h-8 flex items-center">
            {/* Track */}
            <div className="absolute w-full h-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 dark:bg-purple-500 transition-all duration-75 ease-out"
                style={{ width: `${getPercent(dayRange[0], dayMin, dayMax)}%` }}
              ></div>
            </div>

            {/* Thumb Visual */}
            <div
              className="absolute w-0.5 h-3.5 bg-slate-800 dark:bg-slate-200 z-10 transition-all duration-75 ease-out pointer-events-none"
              style={{ left: `${getPercent(dayRange[0], dayMin, dayMax)}%`, top: '8px' }}
            ></div>

            {/* Input */}
            <input
              type="range"
              min={dayMin}
              max={dayMax}
              step="0.01"
              value={dayRange[0]}
              onChange={(e) => setDayRange([Number(e.target.value)])}
              className="absolute w-full h-full opacity-0 cursor-pointer z-20"
            />

            {/* Value Label */}
            <div
              className="absolute top-6 text-sm font-bold text-slate-800 dark:text-white transition-all duration-75 ease-out transform -translate-x-1/2"
              style={{ left: `${getPercent(dayRange[0], dayMin, dayMax)}%` }}
            >
              {dayRange[0].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* ==============================================
            SLIDER 2: 52 Week Low / High Range (Dynamic)
           ============================================== */}
        <div className="col-span-2 mt-6">
          <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-white mb-2">
            <span>{yearMin.toLocaleString()}</span>
            <span>{yearMax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-2">
            <span>52 Week Low</span>
            <span>52 Week High</span>
          </div>

          <div className="relative w-full h-8 flex items-center">
            {/* Track */}
            <div className="absolute w-full h-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 dark:bg-purple-500 transition-all duration-75 ease-out"
                style={{ width: `${getPercent(yearRange[0], yearMin, yearMax)}%` }}
              ></div>
            </div>

            {/* Thumb Visual */}
            <div
              className="absolute w-0.5 h-3.5 bg-slate-800 dark:bg-slate-200 z-10 transition-all duration-75 ease-out pointer-events-none"
              style={{ left: `${getPercent(yearRange[0], yearMin, yearMax)}%`, top: '8px' }}
            ></div>

            {/* Input */}
            <input
              type="range"
              min={yearMin}
              max={yearMax}
              step="0.01"
              value={yearRange[0]}
              onChange={(e) => setYearRange([Number(e.target.value)])}
              className="absolute w-full h-full opacity-0 cursor-pointer z-20"
            />

            {/* Value Label */}
            <div
              className="absolute top-6 text-sm font-bold text-slate-800 dark:text-white transition-all duration-75 ease-out transform -translate-x-1/2"
              style={{ left: `${getPercent(yearRange[0], yearMin, yearMax)}%` }}
            >
              {yearRange[0].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-2 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Trade Time</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">05:16 PM</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Trade Date</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">01/27/23</p>
        </div>
      </div>

    </div>
  );
}