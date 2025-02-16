import { Skeleton } from "@/components/ui/skeleton";

export function MessageInboxSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-6 border-b flex justify-between items-center h-[88px]">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
        <div className="flex-1">
          {/* Thread skeletons */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Patient Header */}
        <div className="p-6 border-b flex justify-between items-center h-[88px]">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <div className="mt-4 px-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`p-4 ${i % 2 === 0 ? 'mr-auto' : 'ml-auto'} max-w-[80%]`}>
                <Skeleton className={`h-20 w-full rounded-lg`} />
              </div>
            ))}
          </div>
        </div>

        {/* Compose Area */}
        <div className="p-4 border-t flex gap-2">
          <Skeleton className="h-[100px] flex-1 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    </div>
  );
} 