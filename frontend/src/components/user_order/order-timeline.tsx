import { CheckCircle2, Circle } from "lucide-react"
import { Card } from "@/components/ui/card"

interface TimelineItem {
  status: string
  label: string
  time: string
  completed: boolean
}

export default function OrderTimeline({ timeline }: { timeline: TimelineItem[] }) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-6 text-foreground">Lịch sử đơn hàng</h3>
      <div className="space-y-0">
        {timeline.map((item, index) => (
          <div key={index} className="flex gap-4 pb-6 last:pb-0">
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {item.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              {index < timeline.length - 1 && (
                <div className={`w-0.5 h-12 mt-2 ${item.completed ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>

            {/* Timeline content */}
            <div className="flex-1 pt-0.5">
              <p className={`font-semibold ${item.completed ? "text-foreground" : "text-muted-foreground"}`}>
                {item.label}
              </p>
              <p className={`text-sm mt-1 ${item.completed ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
