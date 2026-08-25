'use client';

import React from 'react';
import { AVAILABLE_TAGS } from '@/lib/inbox-utils';

interface TagPipelineBarProps {
  selectedTags?: string[];
  onToggleTag: (tagKey: string) => void;
}

export default function TagPipelineBar({
  selectedTags = [],
  onToggleTag,
}: TagPipelineBarProps) {
  return (
    <div className="bg-slate-50/90 border-t border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none select-none flex-shrink-0">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
        Tags Rápidos:
      </span>
      {Object.entries(AVAILABLE_TAGS).map(([key, config]) => {
        const isSelected = selectedTags.includes(key);
        return (
          <button
            key={key}
            onClick={() => onToggleTag(key)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              isSelected
                ? `${config.bg} ${config.text} ${config.border} ring-2 ring-blue-500/20 shadow-xs scale-102`
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
