import React from 'react';
import ReactCrop from 'react-image-crop';

const WizardStepCrop = ({ 
  crop, 
  onChange, 
  onComplete, 
  imgRef, 
  src, 
  onLoad, 
  disabled,
  category,
  rotation = 0,
}) => {
  return (
    <div
      className="cw-canvas-wrapper"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '20px',
      }}
    >
      <div
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: 'center center',
          // Let the image dictate its own size — no forced dimensions
          display: 'inline-flex',
        }}
      >
        <ReactCrop
          crop={crop}
          onChange={onChange}
          onComplete={onComplete}
          disabled={disabled}
        >
          <img
            ref={imgRef}
            src={src}
            onLoad={onLoad}
            crossOrigin="anonymous"
            loading="eager"
            fetchPriority="high"
            alt="Receipt"
            style={{
              opacity: disabled ? 0.8 : 1,
              transition: 'opacity 0.3s ease',
              // Fit within the viewport without stretching
              maxWidth: '480px',
              maxHeight: '72vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </ReactCrop>
      </div>
    </div>
  );
};

export default WizardStepCrop;
