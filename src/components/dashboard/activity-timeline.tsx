import { FileText, Mic, CheckCircle2 } from "lucide-react";
import { Text } from "@/components/ui/typography";
import { formatDistanceToNow } from "date-fns";

export interface ActivityItem {
  type: "document" | "answer" | "session";
  title: string;
  timestamp: Date;
  score?: number;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "document":
        return <FileText className="w-4 h-4" />;
      case "answer":
        return <FileText className="w-4 h-4" />;
      case "session":
        return <Mic className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-3">
      {activities.map((activity, idx) => (
        <div key={idx} className="flex items-start gap-3 text-sm">
          <div className="mt-0.5 text-muted-foreground">
            {getIcon(activity.type)}
          </div>
          <div className="flex-1 space-y-0.5">
            <Text>{activity.title}</Text>
            <Text variant="small" className="text-muted-foreground">
              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
            </Text>
          </div>
          {activity.score && (
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              {activity.score}%
            </div>
          )}
        </div>
      ))}
      {activities.length === 0 && (
        <Text variant="muted" className="text-center py-4">
          No recent activity yet.
        </Text>
      )}
    </div>
  );
}
