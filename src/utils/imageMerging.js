/**
 * Image Merging Utility
 * 
 * This module handles combining the captured photo with the signature
 * to create a single "Audit Image" that proves identity verification.
 * 
 * The process:
 * 1. Take the photo from camera (blob/base64)
 * 2. Take the signature from canvas
 * 3. Draw them together onto a new canvas
 * 4. Export as a single image (base64 or blob)
 */

/**
 * Merge a photo with a signature canvas
 * 
 * Arguments:
 * - photoCanvas: HTMLCanvasElement containing the captured photo
 * - signatureCanvas: HTMLCanvasElement containing the handwritten signature
 * - options: { width, height, layout } 
 * 
 * Returns: Base64 encoded image string
 */
export const mergePhotosWithSignature = (
  photoCanvas,
  signatureCanvas,
  options = {}
) => {
  const {
    width = 600,
    height = 800,
    layout = 'vertical' // 'vertical' or 'horizontal'
  } = options;

  // Create a new canvas for the merged result
  const mergedCanvas = document.createElement('canvas');
  const ctx = mergedCanvas.getContext('2d');

  // Set the merged canvas size
  mergedCanvas.width = width;
  mergedCanvas.height = height;

  // Fill background with white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  if (layout === 'vertical') {
    // Layout: Photo on top, signature on bottom
    drawPhotoOnTop(ctx, photoCanvas, width, height);
    drawSignatureOnBottom(ctx, signatureCanvas, width, height);
  } else if (layout === 'horizontal') {
    // Layout: Photo on left, signature on right
    drawPhotoOnLeft(ctx, photoCanvas, width, height);
    drawSignatureOnRight(ctx, signatureCanvas, width, height);
  }

  // Add metadata/border
  addAuditBorder(ctx, width, height);

  // Convert merged canvas to base64 string
  return mergedCanvas.toDataURL('image/jpeg', 0.9);
};

/**
 * Draw the photo on the top half of the canvas
 * (vertical layout helper)
 */
const drawPhotoOnTop = (ctx, photoCanvas, width, height) => {
  const photoHeight = height * 0.65; // Photo takes 65% of height
  
  // Draw the photo with a border
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, photoHeight - 20);

  // Draw the photo image
  ctx.drawImage(photoCanvas, 10, 10, width - 20, photoHeight - 20);
};

/**
 * Draw the signature on the bottom half of the canvas
 * (vertical layout helper)
 */
const drawSignatureOnBottom = (ctx, signatureCanvas, width, height) => {
  const photoHeight = height * 0.65;
  const signatureY = photoHeight + 10;
  const signatureHeight = height - signatureY - 10;

  // Add a label for the signature
  ctx.fillStyle = '#333';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Signature', 20, signatureY + 25);

  // Draw signature box border
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, signatureY + 35, width - 20, signatureHeight - 40);

  // Draw the signature image
  ctx.drawImage(signatureCanvas, 10, signatureY + 35, width - 20, signatureHeight - 40);
};

/**
 * Draw the photo on the left half of the canvas
 * (horizontal layout helper)
 */
const drawPhotoOnLeft = (ctx, photoCanvas, width, height) => {
  const photoWidth = width * 0.5; // Photo takes 50% of width

  // Draw border
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, photoWidth - 20, height - 20);

  // Draw the photo
  ctx.drawImage(photoCanvas, 10, 10, photoWidth - 20, height - 20);
};

/**
 * Draw the signature on the right half of the canvas
 * (horizontal layout helper)
 */
const drawSignatureOnRight = (ctx, signatureCanvas, width, height) => {
  const photoWidth = width * 0.5;
  const signatureX = photoWidth + 10;

  // Add a label
  ctx.fillStyle = '#333';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Signature', signatureX, 35);

  // Draw border
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 2;
  ctx.strokeRect(signatureX, 10, width - signatureX - 10, height - 20);

  // Draw the signature
  ctx.drawImage(signatureCanvas, signatureX, 50, width - signatureX - 20, height - 60);
};

/**
 * Add audit metadata and border to the merged image
 */
const addAuditBorder = (ctx, width, height) => {
  // Draw outer border
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  // Add timestamp at the bottom
  const timestamp = new Date().toLocaleString();
  ctx.fillStyle = '#666';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Audit Image - ${timestamp}`, width / 2, height - 8);
};

/**
 * Convert a blob to base64
 * Useful for converting camera image to base64
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert base64 to canvas
 * Used when you want to draw a base64 image onto canvas
 */
export const base64ToCanvas = (base64String) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      resolve(canvas);
    };
    
    img.onerror = reject;
    img.src = base64String;
  });
};
