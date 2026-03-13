/**
 * Virtualization Utility
 * 
 * This module contains the math and logic for rendering only visible rows
 * in a large dataset. Instead of rendering all 10,000 rows, we only render
 * the ones in the viewport + a buffer for smooth scrolling.
 * 
 * Key Concept: Virtual Scrolling
 * - We maintain a list of ALL data in memory
 * - But only render rows that are currently visible (+ buffer)
 * - This dramatically improves performance for large datasets
 */

/**
 * Calculate which rows to render based on scroll position
 * 
 * Arguments:
 * - scrollTop: current vertical scroll position in pixels
 * - containerHeight: height of the scrollable container in pixels  
 * - itemHeight: height of each row in pixels
 * - itemCount: total number of items/rows in the dataset
 * - bufferSize: number of items to render above/below viewport (for smooth scrolling)
 * 
 * Returns: object with:
 * - startIndex: index of first row to render
 * - endIndex: index of last row to render
 * - offsetY: how many pixels to offset the virtual list from top
 */
export const calculateVisibleRange = ({
  scrollTop,
  containerHeight,
  itemHeight,
  itemCount,
  bufferSize = 5
}) => {
  // Calculate which row is at the top of the visible area
  // Divide scroll position by row height to get row index
  const visibleStartIndex = Math.floor(scrollTop / itemHeight);

  // Calculate how many rows fit in the visible container
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  // Calculate which row is at the bottom of the visible area
  const visibleEndIndex = visibleStartIndex + visibleCount;

  // Add buffer rows above for smooth upward scrolling
  // This prevents blank space when scrolling up rapidly
  const startIndex = Math.max(0, visibleStartIndex - bufferSize);

  // Add buffer rows below for smooth downward scrolling
  // This prevents blank space when scrolling down rapidly
  const endIndex = Math.min(itemCount, visibleEndIndex + bufferSize);

  // Calculate the pixel offset from the top
  // This is where we position the virtual list container
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    offsetY,
    visibleCount,
    // Additional info useful for rendering
    totalHeight: itemCount * itemHeight
  };
};

/**
 * Get a slice of items to render
 * 
 * This is a simple helper that extracts the items we need to render
 * from the full dataset.
 */
export const getVisibleItems = (allItems, startIndex, endIndex) => {
  return allItems.slice(startIndex, endIndex);
};

/**
 * Virtual list container style calculator
 * 
 * This calculates the CSS style properties needed to position
 * the virtual list correctly within the viewport.
 */
export const getVirtualContainerStyle = (offsetY, estimatedHeight) => {
  return {
    transform: `translateY(${offsetY}px)`,
    willChange: 'transform', // Hint to browser for optimization
    height: estimatedHeight ? `${estimatedHeight}px` : 'auto'
  };
};

/**
 * Virtual scroll wrapper style
 * 
 * Creates a full-height container with the height of all items
 * This allows the scrollbar to reflect the true size of the list.
 */
export const getScrollWrapperStyle = (totalHeight) => {
  return {
    height: `${totalHeight}px`,
    position: 'relative'
  };
};
