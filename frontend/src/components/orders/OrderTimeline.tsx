const STEPS = [
  { key: "pending_payment", label: "Payment" },
  { key: "paid", label: "Paid" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "delivering", label: "Delivering" },
  { key: "delivered", label: "Delivered" },
];

interface OrderTimelineProps {
  currentStatus: string;
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  if (currentStatus === "cancelled") {
    return (
      <div className="text-center py-4">
        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          Order Cancelled
        </span>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="space-y-0">
      {STEPS.map((step, idx) => {
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={step.key} className="flex items-start gap-3">
            {/* Dot + Line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                  isDone
                    ? "bg-emerald-500 border-emerald-500"
                    : "bg-white border-gray-300"
                } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
              />
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-0.5 h-8 ${
                    idx < currentIdx ? "bg-emerald-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>

            {/* Label */}
            <span
              className={`text-sm pt-0.5 ${
                isDone ? "text-gray-900 font-medium" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
