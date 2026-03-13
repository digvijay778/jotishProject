import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../css/AnalyticsPage.css';

export const AnalyticsPage = () => {
  // Get employee ID from URL
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // State for employee data
  const [employeeData, setEmployeeData] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [cityStats, setCityStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch employee data on mount
  useEffect(() => {
    fetchEmployeeData();
  }, []);

  // Calculate city statistics once employees are loaded
  useEffect(() => {
    if (allEmployees.length > 0) {
      calculateCityStats();
    }
  }, [allEmployees]);

  /**
   * Fetch employee data from the API
   */
  const fetchEmployeeData = async () => {
    try {
      setIsLoading(true);
      setError('');

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
        throw new Error('Failed to fetch employee data');
      }

      const data = await response.json();
      const employeeList = Array.isArray(data) ? data : data.employees || data.data || [];

      // Enrich with IDs
      const enriched = employeeList.map((emp, idx) => ({
        ...emp,
        id: emp.id || idx
      }));

      setAllEmployees(enriched);

      // Find the current employee
      const currentEmployee = enriched.find(emp => emp.id == id) || enriched[0];
      setEmployeeData(currentEmployee);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load employee data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calculate statistics grouped by city
   * This prepares data for the SVG charts
   */
  const calculateCityStats = () => {
    // Group employees by city
    const citiesMap = {};

    allEmployees.forEach(emp => {
      const city = emp.city || 'Unknown';
      if (!citiesMap[city]) {
        citiesMap[city] = {
          name: city,
          count: 0,
          totalSalary: 0,
          employees: []
        };
      }

      citiesMap[city].count += 1;
      citiesMap[city].totalSalary += Number(emp.salary) || 0;
      citiesMap[city].employees.push(emp);
    });

    // Convert to array and sort by count
    const statsArray = Object.values(citiesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 cities

    setCityStats(statsArray);
  };

  if (isLoading) {
    return (
      <div className="analytics-page">
        <div className="page-header">
          <h1>Employee Analytics</h1>
        </div>
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="page-header">
          <h1>Employee Analytics</h1>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Employee Analytics Dashboard</h1>
        <button onClick={() => { logout(); navigate('/'); }} className="logout-btn">
          Logout
        </button>
      </div>

      {/* Current employee info */}
      {employeeData && (
        <div className="employee-card">
          <h2>Current Employee: {employeeData.name || employeeData.employee_name || 'Unknown'}</h2>
          <p>City: {employeeData.city || 'N/A'} | Salary: ₹{Number(employeeData.salary).toLocaleString()}</p>
        </div>
      )}

      {/* Analytics Grid */}
      <div className="analytics-grid">
        {/* Bar Chart - Distribution by City */}
        <div className="chart-container">
          <h3>Employee Distribution by City</h3>
          <BarChart data={cityStats} />
        </div>

        {/* Circle Chart - Average Salary by City */}
        <div className="chart-container">
          <h3>Salary Statistics (Average) by City</h3>
          <CircleChart data={cityStats} />
        </div>

        {/* City Details Table */}
        <div className="chart-container full-width">
          <h3>City Details</h3>
          <CityDetailsTable data={cityStats} />
        </div>

        {/* Map visualization */}
        <div className="chart-container full-width">
          <h3>Geographic Distribution</h3>
          <CityMap data={cityStats} />
        </div>
      </div>

      {/* Navigation */}
      <div className="analytics-footer">
        <button onClick={() => navigate('/list')} className="back-btn">
          ← Back to List
        </button>
      </div>
    </div>
  );
};

/**
 * Bar Chart Component
 * Uses raw SVG to display employee count by city
 */
const BarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  // Chart dimensions
  const width = 500;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 60, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Find max value for scaling
  const maxCount = Math.max(...data.map(d => d.count));
  const barWidth = chartWidth / data.length;

  return (
    <svg width={width} height={height} className="chart-svg">
      {/* Title background */}
      <defs>
        <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Y-axis */}
      <line
        x1={margin.left}
        y1={margin.top}
        x2={margin.left}
        y2={height - margin.bottom}
        stroke="#ddd"
        strokeWidth={2}
      />

      {/* X-axis */}
      <line
        x1={margin.left}
        y1={height - margin.bottom}
        x2={width - margin.right}
        y2={height - margin.bottom}
        stroke="#ddd"
        strokeWidth={2}
      />

      {/* Grid lines and bars */}
      {data.map((city, idx) => {
        const xPos = margin.left + idx * barWidth + barWidth / 2;
        const barHeight = (city.count / maxCount) * chartHeight;
        const yPos = height - margin.bottom - barHeight;

        return (
          <g key={idx}>
            {/* Bar */}
            <rect
              x={margin.left + idx * barWidth + barWidth * 0.1}
              y={yPos}
              width={barWidth * 0.8}
              height={barHeight}
              fill="url(#barGradient)"
              rx={4}
            />

            {/* Value label on top of bar */}
            <text
              x={xPos}
              y={yPos - 8}
              textAnchor="middle"
              fontSize="12"
              fill="#333"
              fontWeight="500"
            >
              {city.count}
            </text>

            {/* City label */}
            <text
              x={xPos}
              y={height - margin.bottom + 30}
              textAnchor="middle"
              fontSize="11"
              fill="#666"
              transform={`rotate(-45, ${xPos}, ${height - margin.bottom + 30})`}
            >
              {city.name}
            </text>
          </g>
        );
      })}

      {/* Y-axis label */}
      <text x={15} y={30} fontSize="12" fill="#666">
        Count
      </text>

      {/* Y-axis ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map((tick, idx) => {
        const yPos = height - margin.bottom - tick * chartHeight;
        const value = Math.round(tick * maxCount);

        return (
          <g key={idx}>
            <line
              x1={margin.left - 5}
              y1={yPos}
              x2={margin.left}
              y2={yPos}
              stroke="#ddd"
            />
            <text
              x={margin.left - 10}
              y={yPos + 4}
              textAnchor="end"
              fontSize="11"
              fill="#666"
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/**
 * Circle/Bubble Chart Component
 * Shows average salary by city with bubble size
 */
const CircleChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  // Calculate average salary per city
  const citiesWithAvg = data.map(city => ({
    ...city,
    avgSalary: Math.round(city.totalSalary / city.count)
  }));

  // Find min and max for scaling
  const maxSalary = Math.max(...citiesWithAvg.map(d => d.avgSalary));
  const minSalary = Math.min(...citiesWithAvg.map(d => d.avgSalary));

  const width = 500;
  const height = 300;
  const padding = 40;
  const maxRadius = 35;

  return (
    <svg width={width} height={height} className="chart-svg">
      <defs>
        <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#27ae60', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Grid background */}
      <rect width={width} height={height} fill="#fafafa" />

      {/* Plot circles */}
      {citiesWithAvg.map((city, idx) => {
        // Distribute circles across the canvas
        const cols = Math.ceil(Math.sqrt(citiesWithAvg.length));
        const col = idx % cols;
        const row = Math.floor(idx / cols);

        const cellWidth = (width - padding * 2) / cols;
        const cellHeight = (height - padding * 2) / (Math.ceil(citiesWithAvg.length / cols));

        const x = padding + cellWidth * col + cellWidth / 2;
        const y = padding + cellHeight * row + cellHeight / 2;

        // Size bubble based on salary
        const salaryRange = maxSalary - minSalary || 1;
        const radiusPct = (city.avgSalary - minSalary) / salaryRange;
        const radius = 15 + radiusPct * maxRadius;

        return (
          <g key={idx}>
            {/* Circle */}
            <circle
              cx={x}
              cy={y}
              r={radius}
              fill="url(#circleGradient)"
              opacity="0.8"
            />

            {/* City name */}
            <text
              x={x}
              y={y - 5}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="white"
            >
              {city.name}
            </text>

            {/* Average salary */}
            <text
              x={x}
              y={y + 8}
              textAnchor="middle"
              fontSize="10"
              fill="white"
            >
              ₹{Math.round(city.avgSalary / 1000)}K
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <text x={padding} y={height - 10} fontSize="11" fill="#666">
        Size = Average Salary
      </text>
    </svg>
  );
};

/**
 * City Details Table Component
 * Shows detailed statistics for each city
 */
const CityDetailsTable = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  return (
    <div className="table-container">
      <table className="details-table">
        <thead>
          <tr>
            <th>City</th>
            <th>Employees</th>
            <th>Total Salary</th>
            <th>Average Salary</th>
          </tr>
        </thead>
        <tbody>
          {data.map((city, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'even' : 'odd'}>
              <td><strong>{city.name}</strong></td>
              <td>{city.count}</td>
              <td>₹{city.totalSalary.toLocaleString()}</td>
              <td>₹{Math.round(city.totalSalary / city.count).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * City Map Component
 * Shows approximate geographic positions of cities
 * This is a simplified map using SVG without a library
 */
const CityMap = ({ data }) => {
  // Simplified city coordinates (approximate lat/lon in normalized space)
  // These are NOT real coordinates - just for visualization
  // In a real app, you'd use a proper geocoding service
  const cityCoordinates = {
    'Bangalore': { x: 0.6, y: 0.7 },
    'Delhi': { x: 0.5, y: 0.3 },
    'Mumbai': { x: 0.3, y: 0.5 },
    'Hyderabad': { x: 0.6, y: 0.6 },
    'Chennai': { x: 0.65, y: 0.8 },
    'Pune': { x: 0.4, y: 0.55 },
    'Kolkata': { x: 0.75, y: 0.4 },
    'Ahmedabad': { x: 0.25, y: 0.45 },
    'Jaipur': { x: 0.35, y: 0.35 },
    'Indore': { x: 0.45, y: 0.5 }
  };

  const mapWidth = 600;
  const mapHeight = 400;
  const padding = 40;
  const chartWidth = mapWidth - padding * 2;
  const chartHeight = mapHeight - padding * 2;

  // Find max employee count for scaling markers
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <svg width={mapWidth} height={mapHeight} className="chart-svg map-svg">
      {/* Map background */}
      <rect
        x={padding}
        y={padding}
        width={chartWidth}
        height={chartHeight}
        fill="#e8f4f8"
        stroke="#999"
        strokeWidth={1}
      />

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((line, idx) => (
        <g key={idx}>
          {/* Vertical lines */}
          <line
            x1={padding + line * chartWidth}
            y1={padding}
            x2={padding + line * chartWidth}
            y2={padding + chartHeight}
            stroke="#ddd"
            strokeWidth={0.5}
          />

          {/* Horizontal lines */}
          <line
            x1={padding}
            y1={padding + line * chartHeight}
            x2={padding + chartWidth}
            y2={padding + line * chartHeight}
            stroke="#ddd"
            strokeWidth={0.5}
          />
        </g>
      ))}

      {/* City markers */}
      {data.map((city, idx) => {
        const coords = cityCoordinates[city.name];

        if (!coords) {
          return null;
        }

        const x = padding + coords.x * chartWidth;
        const y = padding + coords.y * chartHeight;

        // Marker size based on employee count
        const markerSize = 8 + (city.count / maxCount) * 15;

        return (
          <g key={idx}>
            {/* Marker circle */}
            <circle
              cx={x}
              cy={y}
              r={markerSize}
              fill="#667eea"
              opacity="0.7"
              stroke="#333"
              strokeWidth="2"
            />

            {/* Employee count in marker */}
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="white"
            >
              {city.count}
            </text>

            {/* City label */}
            <text
              x={x}
              y={y + markerSize + 15}
              textAnchor="middle"
              fontSize="10"
              fill="#333"
              fontWeight="500"
            >
              {city.name}
            </text>
          </g>
        );
      })}

      {/* Map border */}
      <rect
        x={padding}
        y={padding}
        width={chartWidth}
        height={chartHeight}
        fill="none"
        stroke="#666"
        strokeWidth={2}
      />

      {/* Legend */}
      <text x={padding} y={mapHeight - 10} fontSize="11" fill="#666">
        Circle size = Number of employees
      </text>
    </svg>
  );
};
