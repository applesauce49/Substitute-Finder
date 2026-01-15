import React from "react";
import { useQuery } from "@apollo/client";
import { createColumnHelper } from "@tanstack/react-table";
import { QUERY_USER_JOB_STATS, QUERY_JOB_METRICS_OVER_TIME } from "../../../utils/graphql/jobs/queries";
import { GenericReportTable } from "../../../components/reporting/GenericReportTable/GenericReportTable";
import "./MetricsPage.css";

export function MetricsPage() {
    const { data, loading, error } = useQuery(QUERY_USER_JOB_STATS);
    const { data: timeData, loading: timeLoading, error: timeError } = useQuery(QUERY_JOB_METRICS_OVER_TIME, {
        variables: { days: 30 }
    });

    const userStats = React.useMemo(() => {
        return data?.userJobStats || [];
    }, [data]);

    const timeMetrics = React.useMemo(() => {
        return timeData?.jobMetricsOverTime || [];
    }, [timeData]);

    // Calculate metrics for the charts
    const metrics = React.useMemo(() => {
        if (!userStats.length) return null;
        
        const totalJobsCreated = userStats.reduce((sum, user) => sum + user.createdCount, 0);
        const totalJobsAssigned = userStats.reduce((sum, user) => sum + user.assignedCount, 0);
        const totalApplications = userStats.reduce((sum, user) => sum + user.appliedCount, 0);
        const maxAssigned = Math.max(...userStats.map(user => user.assignedCount));
        
        // Get top performers
        const topSubstitutes = [...userStats]
            .filter(user => user.assignedCount > 0)
            .sort((a, b) => b.assignedCount - a.assignedCount)
            .slice(0, 10);
        
        return {
            totalJobsCreated,
            totalJobsAssigned,
            totalApplications,
            maxAssigned,
            topSubstitutes,
            activeUsers: userStats.filter(u => u.assignedCount > 0 || u.appliedCount > 0).length,
            totalUsers: userStats.length
        };
    }, [userStats]);

    // Transform data for the table
    const tableData = React.useMemo(() => {
        return userStats.map(user => ({
            ...user,
            totalJobs: user.assignedCount,
            efficiency: user.appliedCount > 0 ? ((user.assignedCount / user.appliedCount) * 100).toFixed(1) : '0.0'
        }));
    }, [userStats]);

    const columnHelper = React.useMemo(() => createColumnHelper(), []);

    const columns = React.useMemo(() => [
        columnHelper.accessor("username", {
            header: "User",
            filterFn: "includesString"
        }),
        columnHelper.accessor("assignedCount", {
            header: "Jobs Filled",
            meta: { type: "number" },
            cell: info => {
                const value = info.getValue();
                return (
                    <div className="d-flex align-items-center">
                        <span className="me-2 fw-bold">{value}</span>
                        {metrics && metrics.maxAssigned > 0 && (
                            <div 
                                className="progress-bar-mini" 
                                style={{
                                    width: '50px',
                                    height: '8px',
                                    backgroundColor: '#e9ecef',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}
                            >
                                <div
                                    style={{
                                        width: `${(value / metrics.maxAssigned) * 100}%`,
                                        height: '100%',
                                        backgroundColor: value > 0 ? '#28a745' : '#6c757d',
                                        borderRadius: '4px',
                                        transition: 'width 0.3s ease'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                );
            }
        }),
        columnHelper.accessor("appliedCount", {
            header: "Applications Submitted",
            meta: { type: "number" }
        }),
        columnHelper.accessor("createdCount", {
            header: "Jobs Created",
            meta: { type: "number" }
        }),
        columnHelper.accessor("efficiency", {
            header: "Success Rate",
            cell: info => `${info.getValue()}%`,
            meta: { type: "number" }
        })
    ], [columnHelper, metrics]);

    const filterFns = React.useMemo(() => ({
        includesString: (row, columnId, filterValue) => {
            const rowValue = row.getValue(columnId);
            return String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase());
        }
    }), []);

    // Export function for CSV download
    const exportToCSV = React.useCallback(() => {
        const csvContent = [
            ['Username', 'Jobs Filled', 'Applications Submitted', 'Jobs Created', 'Success Rate'],
            ...tableData.map(user => [
                user.username,
                user.assignedCount,
                user.appliedCount,
                user.createdCount,
                user.efficiency + '%'
            ])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `substitute-metrics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }, [tableData]);

    if (loading || timeLoading) return <div className="d-flex justify-content-center p-4"><div className="spinner-border" role="status"></div></div>;
    if (error || timeError) return <div className="alert alert-danger">Error loading metrics: {(error || timeError)?.message}</div>;
    if (!metrics) return <div className="alert alert-info">No data available</div>;

    return (
        <div className="metrics-page">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2><i className="bi bi-graph-up me-2"></i>Job Fulfillment Metrics</h2>
                <small className="text-muted">Real-time substitute job statistics</small>
            </div>

            {/* Summary Cards */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card metrics-card">
                        <div className="card-body text-center">
                            <div className="metrics-icon text-primary mb-2">
                                <i className="bi bi-briefcase-fill fs-2"></i>
                            </div>
                            <h3 className="card-title">{metrics.totalJobsAssigned}</h3>
                            <p className="card-text text-muted">Total Jobs Filled</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card metrics-card">
                        <div className="card-body text-center">
                            <div className="metrics-icon text-success mb-2">
                                <i className="bi bi-people-fill fs-2"></i>
                            </div>
                            <h3 className="card-title">{metrics.activeUsers}</h3>
                            <p className="card-text text-muted">Active Substitutes</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card metrics-card">
                        <div className="card-body text-center">
                            <div className="metrics-icon text-info mb-2">
                                <i className="bi bi-hand-index-fill fs-2"></i>
                            </div>
                            <h3 className="card-title">{metrics.totalApplications}</h3>
                            <p className="card-text text-muted">Total Applications</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card metrics-card">
                        <div className="card-body text-center">
                            <div className="metrics-icon text-warning mb-2">
                                <i className="bi bi-plus-circle-fill fs-2"></i>
                            </div>
                            <h3 className="card-title">{metrics.totalJobsCreated}</h3>
                            <p className="card-text text-muted">Jobs Posted</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Performers Chart */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-trophy-fill text-warning me-2"></i>
                                Top Substitute Performers
                            </h5>
                        </div>
                        <div className="card-body">
                            {metrics.topSubstitutes.length > 0 ? (
                                <div className="bar-chart">
                                    {metrics.topSubstitutes.map((user, index) => (
                                        <div key={user._id} className="bar-item mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="fw-medium">
                                                    {index === 0 && <i className="bi bi-trophy-fill text-warning me-1"></i>}
                                                    {index === 1 && <i className="bi bi-award-fill text-muted me-1"></i>}
                                                    {index === 2 && <i className="bi bi-award-fill text-orange me-1" style={{color: '#cd7f32'}}></i>}
                                                    {user.username}
                                                </span>
                                                <span className="badge bg-primary">{user.assignedCount} jobs</span>
                                            </div>
                                            <div className="progress" style={{ height: '20px' }}>
                                                <div
                                                    className="progress-bar bg-gradient"
                                                    role="progressbar"
                                                    style={{
                                                        width: `${(user.assignedCount / metrics.maxAssigned) * 100}%`,
                                                        backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#28a745'
                                                    }}
                                                    aria-valuenow={user.assignedCount}
                                                    aria-valuemin="0"
                                                    aria-valuemax={metrics.maxAssigned}
                                                >
                                                    <span className="fw-bold text-dark px-2">{user.assignedCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <i className="bi bi-inbox fs-1"></i>
                                    <p>No substitute activity yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Time-based Activity Chart */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-graph-up me-2"></i>
                                Activity Over Time (Last 30 Days)
                            </h5>
                        </div>
                        <div className="card-body">
                            {timeMetrics.length > 0 ? (
                                <div className="time-chart">
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="chart-container">
                                                {timeMetrics.map((day, index) => {
                                                    const maxValue = Math.max(...timeMetrics.map(d => Math.max(d.jobsPosted, d.jobsAssigned, d.totalApplications)));
                                                    const date = new Date(day.date);
                                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                                    
                                                    return (
                                                        <div 
                                                            key={day.date} 
                                                            className={`chart-bar ${isWeekend ? 'weekend' : ''}`}
                                                            title={`${date.toLocaleDateString()}\nJobs Posted: ${day.jobsPosted}\nJobs Filled: ${day.jobsAssigned}\nApplications: ${day.totalApplications}`}
                                                        >
                                                            <div className="bar-group">
                                                                <div 
                                                                    className="bar bar-posted" 
                                                                    style={{ height: `${(day.jobsPosted / maxValue) * 100}px` }}
                                                                    data-value={day.jobsPosted}
                                                                ></div>
                                                                <div 
                                                                    className="bar bar-assigned" 
                                                                    style={{ height: `${(day.jobsAssigned / maxValue) * 100}px` }}
                                                                    data-value={day.jobsAssigned}
                                                                ></div>
                                                                <div 
                                                                    className="bar bar-applications" 
                                                                    style={{ height: `${(day.totalApplications / maxValue) * 100}px` }}
                                                                    data-value={day.totalApplications}
                                                                ></div>
                                                            </div>
                                                            <div className="chart-label">
                                                                {date.getDate()}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="chart-legend mt-3">
                                        <div className="d-flex justify-content-center gap-4">
                                            <div className="legend-item">
                                                <span className="legend-color bar-posted"></span>
                                                <span>Jobs Posted</span>
                                            </div>
                                            <div className="legend-item">
                                                <span className="legend-color bar-assigned"></span>
                                                <span>Jobs Filled</span>
                                            </div>
                                            <div className="legend-item">
                                                <span className="legend-color bar-applications"></span>
                                                <span>Applications</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <i className="bi bi-graph-down fs-1"></i>
                                    <p>No activity data in the last 30 days</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-table me-2"></i>
                                Detailed User Statistics
                            </h5>
                        </div>
                        <div className="card-body p-0">
                            <GenericReportTable
                                title=""
                                data={tableData}
                                columns={columns}
                                filterFns={filterFns}
                                initialFilters={[]}
                                toolbarRight={
                                    <div className="d-flex gap-2 align-items-center">
                                        <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={exportToCSV}
                                            title="Export to CSV"
                                        >
                                            <i className="bi bi-download me-1"></i>
                                            Export
                                        </button>
                                        <span className="badge bg-light text-dark">
                                            {tableData.length} users
                                        </span>
                                        <span className="badge bg-success text-white">
                                            {metrics.activeUsers} active
                                        </span>
                                    </div>
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}