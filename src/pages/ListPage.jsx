import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { calculateVisibleRange, getVisibleItems } from '../utils/virtualizationMath';
import '../css/ListPage.css';

export const ListPage = () => {
  // State management
  const [employees, setEmployees] = useState([]); // All employee data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Virtual scrolling state
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ startIndex: 0, endIndex: 0 });

  // Refs for performance
  const scrollContainerRef = useRef(null);
  const itemHeight = 70; // Height of each row in pixels
  const containerHeight = 600; // Height of the scrollable viewport
  const bufferSize = 5; // Extra rows to render above/below viewport

  // Auth and navigation
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Fetch employee data from the API
  // This runs once on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Call the backend API with the required credentials
        const response = await fetch(
          'https://backend.jotish.in/backend_dev/gettabledata.php',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: 'test',
              password: '123456'
            })
          }
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // The API returns data in various formats, handle them
        // Some APIs return { employees: [...] }, others return [...] directly
        const employeeList = Array.isArray(data) ? data : data.employees || data.data || [];

        if (!Array.isArray(employeeList) || employeeList.length === 0) {
          setError('No employee data found');
          return;
        }

        // Add unique IDs if they don't exist
        // This is needed for React keys and navigation
        const enrichedEmployees = employeeList.map((emp, idx) => ({
          ...emp,
          id: emp.id || idx,
          uniqueKey: emp.id || `emp-${idx}`
        }));

        setEmployees(enrichedEmployees);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        setError(`Failed to load employees: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Calculate visible range whenever scroll position or data changes
  useEffect(() => {
    const range = calculateVisibleRange({
      scrollTop,
      containerHeight,
      itemHeight,
      itemCount: employees.length,
      bufferSize
    });

    setVisibleRange(range);
  }, [scrollTop, employees.length]);

  // Handle scroll events
  // We update scrollTop which triggers the visible range calculation
  const handleScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Get the rows we need to render
  const visibleEmployees = getVisibleItems(
    employees,
    visibleRange.startIndex,
    visibleRange.endIndex
  );

  // Navigate to the employee details page
  const handleSelectEmployee = (employeeId) => {
    navigate(`/details/${employeeId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="list-page">
        <div className="page-header">
          <h1>Employee List</h1>
          <button onClick={() => { logout(); navigate('/'); }} className="logout-btn">
            Logout
          </button>
        </div>
        <div className="loading-state">Loading employees...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="list-page">
        <div className="page-header">
          <h1>Employee List</h1>
          <button onClick={() => { logout(); navigate('/'); }} className="logout-btn">
            Logout
          </button>
        </div>
        <div className="error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="list-page">
      <div className="page-header">
        <h1>Employee List ({employees.length} total)</h1>
        <button onClick={() => { logout(); navigate('/'); }} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="list-info">
        <p>
          Showing {visibleRange.startIndex + 1} - {Math.min(visibleRange.endIndex, employees.length)} 
          of {employees.length} employees
        </p>
        <p className="tech-note">
          💡 Virtualized: Only {visibleRange.endIndex - visibleRange.startIndex} rows rendered 
          (buffer: {bufferSize})
        </p>
      </div>

      {/* 
        Virtual scroll container
        This div has a fixed height and overflow-y: auto
        It scrolls, but only the visible items are rendered
      */}
      <div
        ref={scrollContainerRef}
        className="virtual-scroll-container"
        onScroll={handleScroll}
      >
        {/* 
          Invisible wrapper with the full height of all items
          This makes the scrollbar proportional to the full dataset
        */}
        <div style={{ height: employees.length * itemHeight }}>
          {/* 
            Virtual list container
            We position it based on scroll, so it appears to scroll smoothly
          */}
          <div
            className="virtual-list-content"
            style={{
              transform: `translateY(${visibleRange.offsetY}px)`,
              willChange: 'transform'
            }}
          >
            {/* Render only the visible rows */}
            {visibleEmployees.map((employee, idx) => {
              // Get the actual index in the full dataset
              const actualIndex = visibleRange.startIndex + idx;

              return (
                <div
                  key={employee.uniqueKey}
                  className="employee-row"
                  onClick={() => handleSelectEmployee(employee.id || actualIndex)}
                >
                  {/* Row number */}
                  <div className="row-number">{actualIndex + 1}</div>

                  {/* Employee details - flex layout */}
                  <div className="employee-details">
                    {/* Name */}
                    <div className="employee-name">
                      {employee.name || employee.employee_name || 'Unknown'}
                    </div>

                    {/* Salary - right aligned */}
                    <div className="employee-salary">
                      {employee.salary ? `₹${Number(employee.salary).toLocaleString()}` : 'N/A'}
                    </div>
                  </div>

                  {/* City info */}
                  <div className="employee-city">
                    {employee.city || 'N/A'}
                  </div>

                  {/* Arrow indicator */}
                  <div className="row-arrow">→</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer with instructions */}
      <div className="list-footer">
        <p>Click on any employee to view their profile and complete identity verification</p>
      </div>
    </div>
  );
};
