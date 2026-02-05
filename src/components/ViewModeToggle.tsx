import React from 'react';
import { ViewMode } from '../types';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="view-toggle">
      <button
        onClick={() => onViewModeChange('money')}
        className={viewMode === 'money' ? 'active' : ''}
        title="View in dollar values"
        aria-label="View in dollar values"
      >
        $
      </button>
      <button
        onClick={() => onViewModeChange('shares')}
        className={viewMode === 'shares' ? 'active' : ''}
        title="View in share counts"
        aria-label="View in share counts"
      >
        #
      </button>
    </div>
  );
};

export default React.memo(ViewModeToggle);
