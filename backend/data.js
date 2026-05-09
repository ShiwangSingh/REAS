const data = {
  alerts: [
    {
      id: '1', type: 'cctv', severity: 'high',
      title: 'Speed Camera — NH48 near Manesar',
      description: 'Speed camera active, limit 80 km/h',
      location: { lat: 28.3525, lng: 76.9350, road: 'NH48', city: 'Gurugram' },
      reportedAt: new Date(Date.now() - 12 * 60000).toISOString(),
      upvotes: 24, verified: true,
    },
    {
      id: '2', type: 'speed_breaker', severity: 'medium',
      title: 'Speed Breaker — MG Road',
      description: 'Unmarked speed breaker near metro station',
      location: { lat: 28.4595, lng: 77.0266, road: 'MG Road', city: 'Gurugram' },
      reportedAt: new Date(Date.now() - 30 * 60000).toISOString(),
      upvotes: 15, verified: true,
    },
    {
      id: '3', type: 'construction', severity: 'high',
      title: 'Road Construction — Ring Road',
      description: 'Lane closure, construction work ongoing for flyover',
      location: { lat: 28.6139, lng: 77.2090, road: 'Ring Road', city: 'Delhi' },
      reportedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      upvotes: 42, verified: true,
    },
    {
      id: '4', type: 'accident', severity: 'critical',
      title: 'Accident — Outer Ring Road',
      description: 'Multi-vehicle collision, traffic jam 2km',
      location: { lat: 28.5355, lng: 77.3910, road: 'Outer Ring Road', city: 'Noida' },
      reportedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      upvotes: 67, verified: true,
    },
    {
      id: '5', type: 'pothole', severity: 'medium',
      title: 'Pothole Cluster — Dwarka Expressway',
      description: 'Multiple potholes, drive carefully',
      location: { lat: 28.5921, lng: 77.0460, road: 'Dwarka Expressway', city: 'Delhi' },
      reportedAt: new Date(Date.now() - 45 * 60000).toISOString(),
      upvotes: 8, verified: false,
    },
    {
      id: '6', type: 'waterlogging', severity: 'critical',
      title: 'Waterlogging — ITO Junction',
      description: 'Heavy waterlogging, road partially submerged',
      location: { lat: 28.6271, lng: 77.2405, road: 'ITO Junction', city: 'Delhi' },
      reportedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      upvotes: 53, verified: true,
    },
    {
      id: '7', type: 'toll', severity: 'info',
      title: 'Toll Plaza — Kherki Daula',
      description: 'Toll charge: ₹90 for cars, ₹45 for bikes',
      location: { lat: 28.3921, lng: 77.0250, road: 'NH48', city: 'Gurugram' },
      reportedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      upvotes: 120, verified: true,
    },
    {
      id: '8', type: 'fog', severity: 'high',
      title: 'Fog Zone — GT Karnal Road',
      description: 'Visibility below 100m, drive slow',
      location: { lat: 28.7494, lng: 77.1171, road: 'GT Karnal Road', city: 'Delhi' },
      reportedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      upvotes: 31, verified: true,
    },
  ],
  stats: {
    activeAlerts: 1247,
    reportsSubmitted: 89340,
    verifiedPercent: 87,
    roadsCovered: 15430,
    trends: {
      activeAlerts: 12,
      reportsSubmitted: 8,
      verifiedPercent: 3,
      roadsCovered: -2
    }
  },
  leaderboard: [
    { id: '1', name: 'Rahul Sharma', avatar: '', reportsCount: 234, karmaScore: 4560, verified: true },
    { id: '2', name: 'Priya Patel', avatar: '', reportsCount: 198, karmaScore: 3890, verified: true },
    { id: '3', name: 'Amit Kumar', avatar: '', reportsCount: 167, karmaScore: 3420, verified: true },
    { id: '4', name: 'Sneha Gupta', avatar: '', reportsCount: 145, karmaScore: 2980, verified: true },
    { id: '5', name: 'Vikram Singh', avatar: '', reportsCount: 132, karmaScore: 2750, verified: false },
    { id: '6', name: 'Ananya Reddy', avatar: '', reportsCount: 118, karmaScore: 2340, verified: true },
    { id: '7', name: 'Arjun Nair', avatar: '', reportsCount: 105, karmaScore: 2100, verified: false },
    { id: '8', name: 'Kavita Joshi', avatar: '', reportsCount: 98, karmaScore: 1960, verified: true },
    { id: '9', name: 'Rajesh Iyer', avatar: '', reportsCount: 87, karmaScore: 1740, verified: false },
    { id: '10', name: 'Deepika Chauhan', avatar: '', reportsCount: 79, karmaScore: 1580, verified: true },
  ],
  users: [
    { id: '1', name: 'Shiwang', email: 'shiwang@example.com', karmaPoints: 120 }
  ],
  otps: {},
};

module.exports = data;
