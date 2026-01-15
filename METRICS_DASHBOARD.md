# Metrics Dashboard - Substitute Finder Admin

## Overview
The new Metrics Dashboard provides comprehensive analytics on substitute job fulfillment activity, giving administrators insights into system usage and user performance.

## Features

### 📊 Summary Cards
- **Total Jobs Filled**: Complete count of assigned substitute positions
- **Active Substitutes**: Number of users who have filled jobs or submitted applications  
- **Total Applications**: Sum of all job applications submitted
- **Jobs Posted**: Total number of substitute positions created

### 🏆 Top Performers Chart
- Visual bar chart showing the top 10 substitute performers
- Color-coded rankings (Gold 🥇, Silver 🥈, Bronze 🥉)
- Sortable by number of jobs filled
- Responsive design with progress bars

### 📈 Activity Over Time Chart
- 30-day timeline view of system activity
- Three metrics tracked per day:
  - Jobs Posted (Blue bars)
  - Jobs Filled (Green bars) 
  - Applications Submitted (Yellow bars)
- Weekend highlighting for context
- Hover tooltips with detailed daily statistics

### 📋 Detailed User Statistics Table
- **Filterable and sortable** data table using existing GenericReportTable
- User-level metrics including:
  - Username
  - Jobs Filled (with visual progress bars)
  - Applications Submitted
  - Jobs Created  
  - Success Rate (jobs filled / applications ratio)
- **Export functionality** - Download data as CSV
- Real-time filtering capabilities

## Technical Implementation

### Backend Changes
- **New GraphQL Query**: `jobMetricsOverTime(days: Int)`
- **Enhanced Resolver**: Added time-based aggregation in `jobResolvers.js`
- **New Type Definition**: `JobMetricsData` for time-based metrics
- **Existing Query Utilization**: Leverages existing `userJobStats` aggregation

### Frontend Components  
- **New Page**: `/client/src/pages/admin/settings/MetricsPage.js`
- **Styling**: Custom CSS with responsive design and animations
- **Reused Components**: Leverages existing `GenericReportTable` for consistency
- **Navigation Integration**: Added to admin sidebar with graph icon

### Data Sources
- **User Statistics**: MongoDB aggregation from Users and Jobs collections
- **Time-based Metrics**: Daily aggregation over configurable time periods
- **Real-time Updates**: Automatically refreshes with new data

## Usage

1. **Access**: Navigate to Admin → Metrics in the admin dashboard
2. **View Summary**: Review high-level metrics in the summary cards
3. **Analyze Performance**: Check top performers and their job completion rates
4. **Track Trends**: Use the time-based chart to identify usage patterns
5. **Filter Data**: Use table filters to find specific users or date ranges
6. **Export Results**: Download detailed statistics as CSV for reporting

## Performance Considerations
- Efficient MongoDB aggregation queries
- 30-day default window to balance detail with performance
- Responsive design for mobile admin access
- Optimized re-rendering with React.useMemo hooks

## Future Enhancements
- Configurable time ranges (7, 30, 90 days)
- Additional chart types (pie charts for distribution)
- Email report scheduling
- Advanced filtering options
- User engagement metrics
- Trend analysis and projections