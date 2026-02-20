import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface SystemSettings {
  // General
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  darkMode: boolean;
  compactView: boolean;
  // Security
  twoFactorAuth: boolean;
  strongPasswordPolicy: boolean;
  sessionTimeout: boolean;
  sessionLength: number;
  maxLoginAttempts: number;
  // Notifications
  emailNewUser: boolean;
  emailAssetChanges: boolean;
  emailMaintenance: boolean;
  notifyBackup: boolean;
  notifyErrors: boolean;
  // Integrations
  googleMapsEnabled: boolean;
  googleMapsApiKey: string;
  slackEnabled: boolean;
  slackWebhookUrl: string;
  emailServiceEnabled: boolean;
  smtpServer: string;
  smtpPort: number;
}

const defaultSettings: SystemSettings = {
  siteName: 'Asset Manager',
  siteDescription: 'Asset Management System',
  supportEmail: 'support@assetmanager.com',
  darkMode: true,
  compactView: false,
  twoFactorAuth: true,
  strongPasswordPolicy: true,
  sessionTimeout: true,
  sessionLength: 60,
  maxLoginAttempts: 5,
  emailNewUser: true,
  emailAssetChanges: true,
  emailMaintenance: true,
  notifyBackup: true,
  notifyErrors: true,
  googleMapsEnabled: true,
  googleMapsApiKey: 'AIza...',
  slackEnabled: false,
  slackWebhookUrl: 'https://hooks.slack.com/services/...',
  emailServiceEnabled: true,
  smtpServer: 'smtp.example.com',
  smtpPort: 587,
};

export default function SystemSettingsTab() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [activeSubTab, setActiveSubTab] = useState('general');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('system_settings');
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('system_settings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
      <TabsList className="bg-muted/50">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
      </TabsList>

      {/* General Settings */}
      <TabsContent value="general">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Manage system-wide settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Site Name</Label>
                <Input
                  value={settings.siteName}
                  onChange={(e) => updateSetting('siteName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Site Description</Label>
                <Input
                  value={settings.siteDescription}
                  onChange={(e) => updateSetting('siteDescription', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => updateSetting('supportEmail', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Display Settings</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Enable dark mode by default</p>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Compact View</p>
                  <p className="text-sm text-muted-foreground">Use compact view for tables and lists</p>
                </div>
                <Switch
                  checked={settings.compactView}
                  onCheckedChange={(checked) => updateSetting('compactView', checked)}
                />
              </div>
            </div>

            <Button onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security Settings */}
      <TabsContent value="security">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Configure security and access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Strong Password Policy</p>
                  <p className="text-sm text-muted-foreground">Enforce complex password requirements</p>
                </div>
                <Switch
                  checked={settings.strongPasswordPolicy}
                  onCheckedChange={(checked) => updateSetting('strongPasswordPolicy', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
                </div>
                <Switch
                  checked={settings.sessionTimeout}
                  onCheckedChange={(checked) => updateSetting('sessionTimeout', checked)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Session Settings</h3>
              <div className="space-y-2">
                <Label>Session Length (minutes)</Label>
                <Input
                  type="number"
                  value={settings.sessionLength}
                  onChange={(e) => updateSetting('sessionLength', parseInt(e.target.value) || 60)}
                  className="max-w-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Login Attempts</Label>
                <Input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value) || 5)}
                  className="max-w-xs"
                />
              </div>
            </div>

            <Button onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Notification Settings */}
      <TabsContent value="notifications">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure system notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Email Notifications</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New User Registration</p>
                  <p className="text-sm text-muted-foreground">Send email when a new user registers</p>
                </div>
                <Switch
                  checked={settings.emailNewUser}
                  onCheckedChange={(checked) => updateSetting('emailNewUser', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Asset Status Changes</p>
                  <p className="text-sm text-muted-foreground">Send email when asset status changes</p>
                </div>
                <Switch
                  checked={settings.emailAssetChanges}
                  onCheckedChange={(checked) => updateSetting('emailAssetChanges', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Alerts</p>
                  <p className="text-sm text-muted-foreground">Send email for maintenance reminders</p>
                </div>
                <Switch
                  checked={settings.emailMaintenance}
                  onCheckedChange={(checked) => updateSetting('emailMaintenance', checked)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">System Notifications</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Backup Completion</p>
                  <p className="text-sm text-muted-foreground">Notify when system backup completes</p>
                </div>
                <Switch
                  checked={settings.notifyBackup}
                  onCheckedChange={(checked) => updateSetting('notifyBackup', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">System Errors</p>
                  <p className="text-sm text-muted-foreground">Notify on critical system errors</p>
                </div>
                <Switch
                  checked={settings.notifyErrors}
                  onCheckedChange={(checked) => updateSetting('notifyErrors', checked)}
                />
              </div>
            </div>

            <Button onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Integrations Settings */}
      <TabsContent value="integrations">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Manage external integrations and APIs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google Maps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Google Maps API</p>
                  <p className="text-sm text-muted-foreground">Enable Google Maps integration</p>
                </div>
                <Switch
                  checked={settings.googleMapsEnabled}
                  onCheckedChange={(checked) => updateSetting('googleMapsEnabled', checked)}
                />
              </div>
              {settings.googleMapsEnabled && (
                <div className="space-y-2">
                  <Label>Google Maps API Key</Label>
                  <Input
                    type="password"
                    value={settings.googleMapsApiKey}
                    onChange={(e) => updateSetting('googleMapsApiKey', e.target.value)}
                    className="max-w-md"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Slack */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Slack Notifications</p>
                  <p className="text-sm text-muted-foreground">Send notifications to Slack</p>
                </div>
                <Switch
                  checked={settings.slackEnabled}
                  onCheckedChange={(checked) => updateSetting('slackEnabled', checked)}
                />
              </div>
              {settings.slackEnabled && (
                <div className="space-y-2">
                  <Label>Slack Webhook URL</Label>
                  <Input
                    type="password"
                    value={settings.slackWebhookUrl}
                    onChange={(e) => updateSetting('slackWebhookUrl', e.target.value)}
                    className="max-w-md"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Email Service */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Service</p>
                  <p className="text-sm text-muted-foreground">Configure email service integration</p>
                </div>
                <Switch
                  checked={settings.emailServiceEnabled}
                  onCheckedChange={(checked) => updateSetting('emailServiceEnabled', checked)}
                />
              </div>
              {settings.emailServiceEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>SMTP Server</Label>
                    <Input
                      value={settings.smtpServer}
                      onChange={(e) => updateSetting('smtpServer', e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => updateSetting('smtpPort', parseInt(e.target.value) || 587)}
                      className="max-w-xs"
                    />
                  </div>
                </>
              )}
            </div>

            <Button onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
