import {
  LockIcon,
  CreditCardIcon,
  CookingIcon,
  CheckIcon,
  TruckIcon,
  PackageIcon,
  CloseIcon,
} from "../icons/Icons";
import type { SVGProps } from "react";

const STEPS: { key: string; label: string; Icon: React.FC<SVGProps<SVGSVGElement>> }[] = [
  { key: "pending_payment", label: "Payment", Icon: CreditCardIcon },
  { key: "paid", label: "Paid", Icon: CheckIcon },
  { key: "preparing", label: "Preparing", Icon: CookingIcon },
  { key: "ready", label: "Ready", Icon: PackageIcon },
  { key: "delivering", label: "Delivering", Icon: TruckIcon },
  { key: "delivered", label: "Delivered", Icon: LockIcon },
];

interface OrderTimelineProps {
  currentStatus: string;
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  if (currentStatus === "cancelled") {
    return (
      <div className="text-center py-4">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          <CloseIcon className="w-4 h-4" />
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
            {/* Icon + Line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-white border-2 border-gray-300 text-gray-300"
                } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
              >
                <step.Icon className="w-3.5 h-3.5" />
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-0.5 h-6 ${
                    idx < currentIdx ? "bg-emerald-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>

            {/* Label */}
            <span
              className={`text-sm pt-1 ${
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
