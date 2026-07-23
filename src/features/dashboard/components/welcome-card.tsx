import { Briefcase, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GreetingLine } from "./greeting-line";

type WelcomeCardProps = {
  name: string;
  designation: string;
  officeName: string;
  className?: string;
};

export function WelcomeCard({
  name,
  designation,
  officeName,
  className,
}: WelcomeCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-3">
        <GreetingLine name={name} />
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="size-4" />
            {designation}
          </span>
          {officeName && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {officeName}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
