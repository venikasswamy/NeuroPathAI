'use client';

import { Settings, Bell, Shield, Database, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-utils';
import { useAuth } from '@/components/providers/auth-provider';

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account and application preferences" />

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-electric" /> Notifications</CardTitle>
          <CardDescription>Choose which notifications you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Assessment Due', desc: 'Get notified when an assessment is available', on: true },
            { label: 'Revision Needed', desc: 'Alert when a topic needs revision', on: true },
            { label: 'Retention Review Due', desc: 'Reminders for spaced-repetition reviews', on: true },
            { label: 'Learning Drift', desc: 'Alert when learning drift is detected', on: true },
            { label: 'Roadmap Adjustments', desc: 'Notify when your roadmap is adapted', on: true },
            { label: 'Recommended Resources', desc: 'Get resource recommendations', on: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked={item.on} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-electric" /> AI Configuration</CardTitle>
          <CardDescription>The system works with or without an LLM API key</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Intelligence Mode</p>
              <p className="text-xs text-muted-foreground">Deterministic fallback is active</p>
            </div>
            <Badge className="bg-green-100 text-green-700">Deterministic</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            All AI features use transparent rule-based logic. To enable LLM-powered features,
            add OPENAI_API_KEY to your environment variables. The app remains fully functional without it.
          </p>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-electric" /> Data & Privacy</CardTitle>
          <CardDescription>Your data is protected by Row Level Security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">Row Level Security</p>
            <p className="text-xs text-muted-foreground mt-1">All your learner data is isolated — no other user can access your records.</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">Authentication</p>
            <p className="text-xs text-muted-foreground mt-1">Powered by Supabase Auth. Your password is never stored in plain text.</p>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Settings className="w-5 h-5 text-electric" /> Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={async () => { await signOut(); }}
            className="w-full"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
