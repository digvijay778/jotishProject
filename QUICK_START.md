# Quick Start Guide

## 🚀 Getting Started

### Installation
```bash
cd jotish
npm install
npm start
```

The app will open at **http://localhost:3000**

### Demo Credentials
```
Username: testuser
Password: Test123
```

---

## 📖 Application Flow

### 1. Login Page (`/`)
- **Action**: Enter credentials and click "Sign In"
- **Expected**: Redirected to `/list`
- **Check localStorage**: Open DevTools → Application → localStorage → "authUser"

### 2. Employee List (`/list`)
- **Action**: Scroll through the list to see virtualization in action
- **Check DevTools**: Network tab → only DOM elements in viewport are rendered
- **Action**: Click any employee row
- **Expected**: Navigate to `/details/{id}`

### 3. Employee Details (`/details/:id`)
- **Phase 1 - Camera**: 
  - Click "📷 Capture Photo"
  - Grant camera permission
  - Click "Capture Photo" button
  
- **Phase 2 - Signature**:
  - Draw your signature on the canvas (mouse or touch)
  - Click "✓ Confirm & Merge" when done
  - Check browser's drawer for merged image
  
- **Phase 3 - Result**:
  - View merged photo + signature
  - Download the audit image
  - Navigate to Analytics

### 4. Analytics Page (`/analytics/:id`)
- **View**: Bar chart showing employee distribution
- **View**: Bubble chart showing salary statistics
- **View**: City statistics table
- **View**: Geospatial map visualization
- **Action**: Click "← Back to List" or logout

---

## 🔍 Code Walkthrough

### Key Architecture Files

**`src/App.jsx`** - Main routing setup
```javascript
// All routes defined here, with ProtectedRoute wrapper
```

**`src/contexts/AuthContext.jsx`** - Authentication
```javascript
// useEffect: Restore from localStorage on app load
// login(): Save to localStorage
// logout(): Clear everything
```

**`src/utils/virtualizationMath.js`** - Virtualization algorithm
```javascript
// calculateVisibleRange() - The core math
// Key formula: startIndex = Math.floor(scrollTop / itemHeight)
```

**`src/utils/imageMerging.js`** - Image processing
```javascript
// mergePhotosWithSignature() - Combines two canvases
// Uses: ctx.drawImage(), toDataURL()
```

**`src/pages/ListPage.jsx`** - Virtualized list
```javascript
// Fetches employee data from API
// Uses calculateVisibleRange() to determine what to render
// Maps visible employees and displays them with offset
```

**`src/pages/DetailsPage.jsx`** - Camera + Signature
```javascript
// startCamera() - Requests MediaDevices.getUserMedia()
// capturePhoto() - Draws video frame to canvas
// initializeSignatureCanvas() - Sets up touch/mouse drawing
// mergeAndSave() - Calls imageMerging utility
```

**`src/pages/AnalyticsPage.jsx`** - SVG charts
```javascript
// BarChart component - Pure SVG with <rect> elements
// BubbleChart component - SVG circles sized by salary
// CityDetailsTable component - HTML table
// CityMap component - SVG map with markers
```

---

## 🧪 Testing Checklist

### Authentication
- [ ] Login with correct credentials
- [ ] Logout and verify session clears
- [ ] Manually navigate to `/list` without login → redirected to `/`
- [ ] Refresh page and verify session persists (localStorage)

### Virtualization
- [ ] Open DevTools Elements tab
- [ ] Scroll employee list
- [ ] Count DOM nodes for employee rows (should be ~20-30)
- [ ] Check scroll position in DevTools console:
  ```javascript
  const listContainer = document.querySelector('.virtual-scroll-container');
  console.log(listContainer.scrollTop); // Should change on scroll
  ```

### Camera & Signature
- [ ] Grant camera permission when prompt appears
- [ ] Click "Capture Photo" button
- [ ] Verify photo appears in right canvas
- [ ] Draw on signature canvas with mouse
- [ ] Verify signature appears while drawing
- [ ] Click "Confirm & Merge"
- [ ] Verify merged image shows both photo and signature

### Image Download
- [ ] On Analytics page, click "⬇️ Download Audit Image"
- [ ] Verify file downloads as `audit-{id}-{timestamp}.jpg`
- [ ] Open downloaded file to verify it's a valid JPEG

### Responsive Design
- [ ] Resize browser window
- [ ] Verify layout adapts on mobile
- [ ] Test touch signature drawing on mobile device

---

## 🐛 The Intentional Bug

**Location**: `src/pages/DetailsPage.jsx`, line ~195

**What to Look For**:
```javascript
const initializeSignatureCanvas = () => {
  const canvas = signatureCanvasRef.current; // Captured at init time
  
  canvas.addEventListener('mousemove', (e) => {
    // This listener captures 'canvas' from above
    // If component re-renders, could reference stale canvas
  });
};
```

**Why It's a Bug**:
- Event listeners persist across re-renders
- If canvas DOM is recreated, old listeners still reference old canvas
- Results in silent drawing failures or memory leaks
- Hard to catch because app doesn't crash

**The Fix** (Not Implemented):
```javascript
useEffect(() => {
  if (!signatureCanvasRef.current) return;
  const canvas = signatureCanvasRef.current;
  
  const handleMouseMove = (e) => {
    // Fresh reference on each call
  };
  
  canvas.addEventListener('mousemove', handleMouseMove);
  
  // Clean up old listeners
  return () => {
    canvas.removeEventListener('mousemove', handleMouseMove);
  };
}, [isSigningStarted]); // Proper dependency array
```

---

## 📊 Performance Monitoring

### Virtual Scrolling Performance
```javascript
// In browser console while scrolling:
const container = document.querySelector('.virtual-scroll-container');
container.addEventListener('scroll', () => {
  const rows = document.querySelectorAll('.employee-row').length;
  console.log(`Rendered rows: ${rows}`); // Should be ~20-30
});
```

### Memory Usage
- Open DevTools Memory tab
- Take heap snapshot before/after scrolling
- Verify memory doesn't increase significantly
- Virtualization = O(1) memory regardless of data size

### Render Performance
```javascript
// Check if React renders are optimized:
// In DevTools, go to Profiler tab
// Record a scroll action
// Verify only affected components re-render (not entire list)
```

---

## 🎯 Demonstrating Key Features

### For Interviews

**Question**: "How does your virtualization work?"
> Answer: Look at `virtualizationMath.js`. The key is:
> ```javascript
> startIndex = floor(scrollTop / itemHeight)
> renderCount = ceil(containerHeight / itemHeight)
> offsetY = startIndex * itemHeight
> ```
> This ensures O(1) memory regardless of dataset size.

**Question**: "How do you merge images?"
> Answer: Look at `imageMerging.js`. We create a new canvas, draw both images onto it using `ctx.drawImage()`, add metadata, and export with `toDataURL()`.

**Question**: "Describe your authentication approach."
> Answer: Context API + localStorage. On load, we check localStorage for previous session. On login, we save user to localStorage and update context. Protected routes check authentication state before rendering.

**Question**: "Tell me about that intentional bug."
> Answer: It's in the signature canvas initialization. Event listeners capture canvas references at init time, which could become stale if components re-render. The fix uses useEffect with proper dependency arrays and cleanup functions.

---

## 📱 Mobile Testing

### Camera on Mobile
- ✅ iOS Safari: Works with HTTPS (localhost won't work)
- ✅ Android Chrome: Full support on HTTP
- ✅ Android Firefox: Full support on HTTP

### Touch Signature Drawing
- Signature canvas responds to touch events
- Swipe/tap to draw on mobile devices
- No special touchscreen library needed (native events)

---

## 🔧 Troubleshooting

### App won't start
```bash
# Clear cache and reinstall
rm -r node_modules
npm cache clean --force
npm install
npm start
```

### Camera not working
- Check browser permissions (allow camera)
- Verify HTTPS (required for some browsers)
- Test on http://localhost:3000 (works on localhost)

### Signature not drawing
- Make sure mouse is down while moving
- On touch: make sure finger stays touching screen
- Check DevTools console for errors

### Virtualization not working
- Check browser console for errors
- Verify Network tab shows fewer DOM requests
- Count `.employee-row` elements (should be ~20-30)

---

## 📚 Useful Dev Tools Commands

```javascript
// Check auth status
const auth = window.__authContext; // May vary by React structure
// Or check localStorage directly:
console.log(JSON.parse(localStorage.getItem('authUser')));

// Check virtualization calculation
const scrollTop = document.querySelector('.virtual-scroll-container').scrollTop;
const itemHeight = 70;
const visibleStart = Math.floor(scrollTop / itemHeight);
console.log('Visible rows start at:', visibleStart);

// Check merged image
const mergedImage = document.querySelector('.merged-image');
console.log('Image src:', mergedImage.src.substring(0, 50) + '...');

// Verify canvas content
const canvas = document.querySelector('canvas');
console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
```

---

## ✅ Final Checklist Before Submission

- [ ] Application runs without errors
- [ ] All 4 pages accessible and functional
- [ ] Login/logout working
- [ ] Session persists on refresh
- [ ] Virtualization rendering only visible rows
- [ ] Camera captures photos
- [ ] Signature draws on canvas
- [ ] Images merge successfully
- [ ] Analytics charts display correctly
- [ ] README.md documents the intentional bug
- [ ] Git history shows meaningful commits
- [ ] Code is clear and well-commented
- [ ] No external UI libraries detected
- [ ] No external virtualization libraries detected

---

**Status**: ✅ Ready for Testing  
**Repository**: Ready for GitHub push  
**Demo**: Prepared for video walkthrough
