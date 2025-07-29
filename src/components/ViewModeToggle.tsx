import React from 'react';
import { ViewMode } from '../types';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="flex bg-gray-800/50 rounded-md p-0.5 border border-gray-700">
      <button
        onClick={() => onViewModeChange('money')}
        className={`px-2 py-1 text-sm rounded transition-all duration-200 flex items-center gap-1 ${
          viewMode === 'money'
            ? 'bg-blue-500/20 text-blue-400 shadow-sm'
            : 'text-gray-500 hover:text-gray-400'
        }`}
        title="Money view"
      >
        💵
      </button>
      <button
        onClick={() => onViewModeChange('shares')}
        className={`px-2 py-1 text-sm rounded transition-all duration-200 flex items-center gap-1 ${
          viewMode === 'shares'
            ? 'bg-blue-500/20 text-blue-400 shadow-sm'
            : 'text-gray-500 hover:text-gray-400'
        }`}
        title="Shares view"
      >
        #
      </button>
    </div>
  );
};

export default ViewModeToggle;