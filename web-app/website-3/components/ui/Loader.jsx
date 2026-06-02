'use client';

/**
 * Comic-style Loader Component
 * Comes in 3 sizes: sm, md, lg
 * Matches the comic/graffiti theme of Pratishtha
 */
export default function Loader({ size = 'md', text = '', className = '' }) {
  const sizeConfig = {
    sm: { dots: 'w-2.5 h-2.5', gap: 'gap-1.5', text: 'text-xs', wrapper: '' },
    md: { dots: 'w-4 h-4', gap: 'gap-2', text: 'text-sm', wrapper: '' },
    lg: { dots: 'w-6 h-6', gap: 'gap-3', text: 'text-base', wrapper: 'py-8' },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={`flex flex-col items-center justify-center ${config.wrapper} ${className}`}>
      <div className={`flex items-center ${config.gap}`}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`${config.dots} rounded-full border-2 border-black inline-block`}
            style={{
              animation: `comicBounce 0.6s ease-in-out ${i * 0.15}s infinite`,
              background: ['#FFE75C', '#FF6B6B', '#4ECDC4'][i],
              boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
            }}
          />
        ))}
      </div>
      {text && (
        <p className={`mt-3 font-black ${config.text} text-gray-700 comic-style-text tracking-wider`}>
          {text}
        </p>
      )}

      <style jsx>{`
        @keyframes comicBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}
