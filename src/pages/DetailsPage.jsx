import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mergePhotosWithSignature } from '../utils/imageMerging';
import '../css/DetailsPage.css';

export const DetailsPage = () => {
  // Get the employee ID from URL params
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Camera and media states
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isSigningStarted, setIsSigningStarted] = useState(false);
  const [isMerged, setIsMerged] = useState(false);
  const [mergedImage, setMergedImage] = useState(null);
  const [error, setError] = useState('');

  // Refs for DOM elements
  const videoRef = useRef(null);
  const photoCanvasRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const isDrawing = useRef(false);

  // Start the camera when component mounts
  useEffect(() => {
    startCamera();

    // Cleanup: stop camera when component unmounts
    return () => {
      if (cameraStream) {
        // Stop all tracks in the stream (video, audio, etc)
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize signature canvas when it appears in the DOM
  useEffect(() => {
    if (signatureCanvasRef.current && isSigningStarted) {
      initializeSignatureCanvas();
    }
  }, [isSigningStarted]);

  /**
   * Start the camera and display video stream
   * This uses the Web Camera API to access the user's device camera
   */
  const startCamera = async () => {
    try {
      setError('');

      // Request access to camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front-facing camera
        },
        audio: false
      });

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraStream(stream);
    } catch (err) {
      setError(`Camera access denied: ${err.message}`);
      console.error('Camera error:', err);
    }
  };

  /**
   * Capture a still photo from the video stream
   * Draws the current video frame to a canvas
   */
  const capturePhoto = () => {
    if (!videoRef.current || !photoCanvasRef.current) {
      setError('Camera not ready');
      return;
    }

    try {
      const context = photoCanvasRef.current.getContext('2d');

      // Set canvas dimensions to match video
      const video = videoRef.current;
      photoCanvasRef.current.width = video.videoWidth;
      photoCanvasRef.current.height = video.videoHeight;

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0);

      // Save the photo and move to signature phase
      setCapturedPhoto(true);
      setIsSigningStarted(true);

      // Stop the camera feed to show the captured photo clearly
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      setError('Failed to capture photo');
      console.error('Capture error:', err);
    }
  };

  /**
   * Initialize the signature canvas
   * Set up event listeners for drawing
   */
  const initializeSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    // Set canvas size - full viewport
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Get canvas context for drawing
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';

    // When user starts drawing (mouse or touch)
    canvas.addEventListener('mousedown', startDrawingSignature);
    canvas.addEventListener('mousemove', drawSignature);
    canvas.addEventListener('mouseup', stopDrawingSignature);
    canvas.addEventListener('mouseout', stopDrawingSignature);

    // Touch support for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawingSignature);
  };

  /**
   * Start drawing signature - user touched/clicked canvas
   */
  const startDrawingSignature = (e) => {
    isDrawing.current = true;

    // Get canvas context
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Get position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Start a new stroke
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  /**
   * Draw on signature canvas while user is dragging
   */
  const drawSignature = (e) => {
    if (!isDrawing.current) return;

    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Get position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Draw a line to the current position
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  /**
   * Stop drawing signature - user released mouse/finger
   */
  const stopDrawingSignature = () => {
    isDrawing.current = false;
  };

  /**
   * Handle touch events on mobile devices
   */
  const handleTouchStart = (e) => {
    e.preventDefault();
    isDrawing.current = true;

    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  /**
   * Handle touch move on mobile devices
   */
  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;

    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  /**
   * Clear the signature canvas if user wants to redraw
   */
  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  /**
   * Merge the photo and signature into a single image
   * This is the key step: combining two canvases into one
   */
  const mergeAndSave = () => {
    if (!photoCanvasRef.current || !signatureCanvasRef.current) {
      setError('Missing photo or signature');
      return;
    }

    try {
      // Call the merging utility with both canvases
      // This combines them into a single base64 image
      const mergedBase64 = mergePhotosWithSignature(
        photoCanvasRef.current,
        signatureCanvasRef.current,
        {
          width: 600,
          height: 800,
          layout: 'vertical'
        }
      );

      // Save the result
      setMergedImage(mergedBase64);
      setIsMerged(true);

      // In a real app, you'd send this to the server
      console.log('Merged image created successfully');
    } catch (err) {
      setError('Failed to merge images');
      console.error('Merge error:', err);
    }
  };

  /**
   * Retake photo - restart the process
   */
  const retakePhoto = () => {
    setCapturedPhoto(null);
    setIsSigningStarted(false);
    setIsMerged(false);
    setMergedImage(null);
    clearSignature();
    startCamera();
  };

  // Loading/camera phase
  if (!capturedPhoto) {
    return (
      <div className="details-page">
        <div className="details-header">
          <h1>Employee ID Verification - {id}</h1>
          <button onClick={() => { logout(); navigate('/'); }} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="camera-section">
          <div className="camera-container">
            {error ? (
              <div className="error-box">{error}</div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="camera-feed"
                  autoPlay
                  playsInline
                />
                <div className="camera-overlay">
                  <p>Position your face in the center</p>
                </div>
              </>
            )}
          </div>

          <button
            onClick={capturePhoto}
            disabled={!cameraStream || !!error}
            className="capture-btn"
          >
            📷 Capture Photo
          </button>

          <p className="instruction-text">
            Click the button when you're ready to capture your photo
          </p>
        </div>

        <button
          onClick={() => navigate('/list')}
          className="back-btn"
        >
          ← Back to List
        </button>
      </div>
    );
  }

  // Signing phase
  if (capturedPhoto && !isMerged) {
    return (
      <div className="details-page">
        <div className="details-header">
          <h1>Sign Your Name - Employee {id}</h1>
          <button onClick={() => { logout(); navigate('/'); }} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="signing-section">
          <div className="photo-and-signature-container">
            {/* Show the captured photo */}
            <div className="photo-display">
              <h3>Your Photo</h3>
              <canvas
                ref={photoCanvasRef}
                className="photo-canvas-display"
              />
            </div>

            {/* Signature canvas overlay */}
            <div className="signature-area">
              <h3>Sign Your Name Below</h3>
              <canvas
                ref={signatureCanvasRef}
                className="signature-canvas"
              />
              <p className="signature-instruction">
                Use your mouse or touch screen to sign your name
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="action-buttons">
            <button
              onClick={clearSignature}
              className="secondary-btn"
            >
              Clear Signature
            </button>

            <button
              onClick={mergeAndSave}
              className="primary-btn"
            >
              ✓ Confirm & Merge
            </button>

            <button
              onClick={retakePhoto}
              className="secondary-btn"
            >
              Retake Photo
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate('/list')}
          className="back-btn"
        >
          ← Back to List
        </button>
      </div>
    );
  }

  // Result/merged phase
  if (isMerged && mergedImage) {
    return (
      <div className="details-page">
        <div className="details-header">
          <h1>Identity Verification Complete - Employee {id}</h1>
          <button onClick={() => { logout(); navigate('/'); }} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="result-section">
          <h2>Your Audit Image</h2>
          <p className="result-description">
            This image combines your photo and signature as proof of identity verification
          </p>

          <div className="merged-image-container">
            <img
              src={mergedImage}
              alt="Merged photo and signature"
              className="merged-image"
            />
          </div>

          {/* Download link for the image */}
          <div className="action-buttons">
            <a
              href={mergedImage}
              download={`audit-${id}-${Date.now()}.jpg`}
              className="primary-btn download-btn"
            >
              ⬇️ Download Audit Image
            </a>

            <button
              onClick={() => navigate(`/analytics/${id}`)}
              className="primary-btn"
            >
              → View Analytics
            </button>

            <button
              onClick={retakePhoto}
              className="secondary-btn"
            >
              Take Another Photo
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate('/list')}
          className="back-btn"
        >
          ← Back to List
        </button>
      </div>
    );
  }

  return null;
};
