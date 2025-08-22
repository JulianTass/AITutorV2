// src/components/CameraCapture.js
import React, { useRef, useState, useCallback } from 'react';

const CameraCapture = ({ onPhotoCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraStarted(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera not available. You can upload a photo instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraStarted(false);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        onPhotoCapture(file, canvas.toDataURL('image/jpeg'));
      }
      setIsCapturing(false);
      stopCamera();
      onClose();
    }, 'image/jpeg', 0.9);
  }, [onPhotoCapture, onClose, stopCamera]);

  const processFile = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onPhotoCapture(file, e.target.result);
        stopCamera();
        onClose();
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file');
    }
  }, [onPhotoCapture, onClose, stopCamera]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'black',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>Capture or Upload Geometry Problem</h3>
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ×
        </button>
      </div>

      {/* Main Content Area */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {error || !cameraStarted ? (
          /* Upload Area */
          <div style={{
            color: 'white',
            textAlign: 'center',
            padding: '40px',
            border: isDragging ? '3px dashed #28a745' : '2px dashed #666',
            borderRadius: '12px',
            backgroundColor: isDragging ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255,255,255,0.05)',
            width: '80%',
            maxWidth: '500px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
            <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>
              {isDragging ? 'Drop your image here!' : 'Upload Geometry Problem'}
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#ccc' }}>
              {error || 'Drag and drop an image here, or click to browse'}
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={triggerFileInput}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Choose File
              </button>
              
              {error && (
                <button
                  onClick={startCamera}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  Try Camera
                </button>
              )}
            </div>
            
            <p style={{ margin: '16px 0 0 0', fontSize: '14px', color: '#999' }}>
              Supports: JPG, PNG, GIF, WebP
            </p>
          </div>
        ) : (
          /* Camera View */
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={true}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            
            {/* Frame Guide */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px dashed white',
              width: '80%',
              height: '60%',
              borderRadius: '8px',
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                fontSize: '14px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '4px 8px',
                borderRadius: '4px',
                whiteSpace: 'nowrap'
              }}>
                Center the geometry problem in this frame
              </div>
            </div>
          </>
        )}

        {/* Drag overlay */}
        {isDragging && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(40, 167, 69, 0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '24px',
            color: 'white',
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}>
            Drop image to upload
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{
        padding: '20px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Always show upload option */}
        <button
          onClick={triggerFileInput}
          style={{
            padding: '12px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📁 Upload Photo
        </button>

        {/* Camera capture button - only show if camera is working */}
        {cameraStarted && !error && (
          <button
            onClick={capturePhoto}
            disabled={isCapturing}
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              border: '4px solid white',
              backgroundColor: isCapturing ? '#ccc' : '#ff4444',
              cursor: isCapturing ? 'not-allowed' : 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isCapturing ? (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <div style={{
                width: '50px',
                height: '50px',
                backgroundColor: 'white',
                borderRadius: '50%'
              }} />
            )}
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CameraCapture;