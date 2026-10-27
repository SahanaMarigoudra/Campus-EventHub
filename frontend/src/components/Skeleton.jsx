export function CardSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <div className="h-1.5 skeleton w-full -mt-6 -mx-6 mb-4 rounded-none" />
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-3/4">
          <div className="skeleton h-5 w-24 rounded-full" />
          <div className="skeleton h-6 w-full" />
          <div className="skeleton h-6 w-3/4" />
        </div>
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-4 w-4/5" />
      </div>
      <div className="space-y-2 pt-1">
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-4 w-3/4" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="skeleton h-14 rounded-lg" />
        <div className="skeleton h-14 rounded-lg" />
        <div className="skeleton h-14 rounded-lg" />
      </div>
      <div className="skeleton h-10 rounded-xl" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 7 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card p-6 space-y-3">
      <div className="skeleton h-5 w-1/2" />
      <div className="skeleton h-8 w-1/3" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  );
}
