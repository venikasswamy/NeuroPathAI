'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Trash2, ClipboardCheck, RefreshCw, AlertTriangle, Target, BookOpen, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader, EmptyState, LoadingState } from '@/components/shared/page-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Notification, NotificationType } from '@/types';

const ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  assessment_due: ClipboardCheck,
  revision_needed: AlertTriangle,
  retention_review: RefreshCw,
  roadmap_adjustment: Target,
  learning_drift: AlertTriangle,
  upcoming_milestone: Target,
  recommended_resource: BookOpen,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data || []) as Notification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    await load();
  }

  async function markAllRead() {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    toast.success('All notifications marked as read');
    await load();
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id);
    await load();
  }

  if (loading) return <LoadingState message="Loading notifications..." />;

  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unread.length} unread notification${unread.length !== 1 ? 's' : ''}`}
        action={unread.length > 0 ? (
          <Button onClick={markAllRead} variant="outline" size="sm">
            <Check className="w-4 h-4 mr-2" /> Mark All Read
          </Button>
        ) : undefined}
      />

      <Card>
        <CardContent className="pt-6">
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((n) => {
                const Icon = ICONS[n.type as NotificationType] || Bell;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${!n.read ? 'bg-electric/5 border-l-2 border-l-electric' : ''}`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${!n.read ? 'text-electric' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-electric" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {n.link && (
                        <Link href={n.link}>
                          <Button size="sm" variant="ghost">View</Button>
                        </Link>
                      )}
                      {!n.read && (
                        <Button size="sm" variant="ghost" onClick={() => markAsRead(n.id)}>
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteNotification(n.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Bell} title="No notifications" description="You're all caught up! Notifications will appear here when there's something to review." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
