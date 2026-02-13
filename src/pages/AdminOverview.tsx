import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '@/components/TopNav';
import MetricCard from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import SystemAlerts from '@/components/SystemAlerts';
import UserManagementTab from '@/components/admin/UserManagementTab';
import SystemSettingsTab from '@/components/admin/SystemSettingsTab';
import { Users, Box, Activity, Clock, ShieldAlert } from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AdminOverview() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const { data: assets = [] } = useAssets();
  const { data: workOrders = [] } = useWorkOrders();
  const { data: users = [] } = useUsers();

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'User Management' },
    { id: 'settings', label: 'System Settings' },
  ];

  // Calculate real metrics
  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const totalAssets = assets.length;
    const activeUsers = users.filter((u) => u.is_active).length;
    const pendingApprovals = workOrders.filter(
      (wo) => wo.status === 'Open' && wo.priority === 'Critical'
    ).length;

    return {
      totalUsers,
      totalAssets,
      activeUsers,
      pendingApprovals,
    };
  }, [users, assets, workOrders]);

  // Redirect non-admins to dashboard
  useEffect(() => {
    if (role && role !== 'admin') {
      toast.error('Access denied. Admin Overview is only accessible to administrators.');
      navigate('/dashboard');
    }
  }, [role, navigate]);

  // Show access denied if not admin
  if (role && role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                Admin Overview is only accessible to administrators.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
          <p className="text-muted-foreground">System-wide management and controls</p>
        </div>

        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`dashboard-tab ${activeTab === tab.id ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Users"
                value={metrics.totalUsers.toString()}
                change={`${metrics.activeUsers} active`}
                changeType="positive"
                icon={Users}
              />
              <MetricCard
                title="Total Assets"
                value={metrics.totalAssets.toString()}
                change="All categories"
                changeType="positive"
                icon={Box}
              />
              <MetricCard
                title="Active Sessions"
                value={metrics.activeUsers.toString()}
                change="Currently online"
                changeType="positive"
                icon={Activity}
              />
              <MetricCard
                title="Pending Approvals"
                value={metrics.pendingApprovals.toString()}
                change={metrics.pendingApprovals > 0 ? 'Needs attention' : 'All clear'}
                changeType={metrics.pendingApprovals > 0 ? 'negative' : 'positive'}
                icon={Clock}
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="User Growth" subtitle="User registration over time" type="line" />
              <ChartCard title="Asset Registration" subtitle="Asset growth over time" type="asset-growth" />
            </section>

            <SystemAlerts />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <UserManagementTab />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <SystemSettingsTab />
          </div>
        )}
      </main>
    </div>
  );
}
