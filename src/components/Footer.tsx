import React from 'react';

interface FooterProps {
  onShare?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onShare }) => {
  return (
    <footer
      className="max-w-[1120px] mx-auto px-5 md:px-12 pt-8 pb-10 mt-8 border-t flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-3 transition-colors duration-200"
      style={{ borderColor: 'var(--rule)' }}
    >
      <span
        className="text-xs transition-colors duration-200"
        style={{ color: 'var(--text-tertiary)' }}
      >
        All calculations run locally. No data leaves your browser.
      </span>
      <div className="flex gap-5">
        {onShare && (
          <button
            onClick={onShare}
            className="text-xs transition-colors duration-200 hover:underline"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Share Portfolio
          </button>
        )}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs transition-colors duration-200 hover:underline"
          style={{ color: 'var(--text-tertiary)' }}
        >
          GitHub
        </a>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
