type Props = {
  className?: string;
};

const thumbnailPlaceholders = Array.from({ length: 10 }, (_, idx) => `thumb-slot-${idx}`);

export default function ProductMediaSkeleton({ className }: Props) {
  const containerClassName = ["space-y-4", className].filter(Boolean).join(" ");
  return (
    <div className={containerClassName}>
      <div className="skeleton h-80 rounded-lg" />
      <div className="overflow-x-auto pb-2 max-w-full [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100">
        <div className="flex gap-2 py-1 px-0.5 min-w-min">
          {thumbnailPlaceholders.map((key) => (
            <div key={key} className="skeleton h-16 w-16 rounded-md flex-shrink-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
