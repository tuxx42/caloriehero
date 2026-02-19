"use client";

import { useState, useEffect } from "react";
import { listDeliveryZones, listDeliverySlots } from "@/lib/api";
import { RefreshCw, MapPin } from "lucide-react";
import type { DeliveryZone, DeliverySlot } from "@caloriehero/shared-types";

const MOCK_ZONES: DeliveryZone[] = [
  {
    id: "00000000-0000-0000-0000-000000000030",
    name: "Haad Rin",
    lat: 9.669,
    lng: 100.066,
    radiusKm: 3,
    deliveryFee: 50,
    active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000031",
    name: "Thong Sala",
    lat: 9.736,
    lng: 100.001,
    radiusKm: 5,
    deliveryFee: 0,
    active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000032",
    name: "Ban Tai",
    lat: 9.702,
    lng: 100.028,
    radiusKm: 4,
    deliveryFee: 30,
    active: false,
  },
];

const MOCK_SLOTS: DeliverySlot[] = [
  {
    id: "00000000-0000-0000-0000-000000000040",
    date: "2026-02-20",
    startTime: "08:00",
    endTime: "10:00",
    zoneId: "00000000-0000-0000-0000-000000000031",
    capacity: 20,
    bookedCount: 14,
  },
  {
    id: "00000000-0000-0000-0000-000000000041",
    date: "2026-02-20",
    startTime: "11:00",
    endTime: "13:00",
    zoneId: "00000000-0000-0000-0000-000000000031",
    capacity: 20,
    bookedCount: 8,
  },
  {
    id: "00000000-0000-0000-0000-000000000042",
    date: "2026-02-20",
    startTime: "15:00",
    endTime: "17:00",
    zoneId: "00000000-0000-0000-0000-000000000030",
    capacity: 10,
    bookedCount: 10,
  },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DeliveryPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [loadingZones, setLoadingZones] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [zonesError, setZonesError] = useState(false);
  const [slotsError, setSlotsError] = useState(false);

  useEffect(() => {
    setLoadingZones(true);
    setZonesError(false);
    listDeliveryZones()
      .then(setZones)
      .catch(() => {
        setZones(MOCK_ZONES);
        setZonesError(true);
      })
      .finally(() => setLoadingZones(false));
  }, []);

  useEffect(() => {
    setLoadingSlots(true);
    setSlotsError(false);
    listDeliverySlots(selectedDate)
      .then(setSlots)
      .catch(() => {
        setSlots(MOCK_SLOTS);
        setSlotsError(true);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  const zoneMap = new Map(zones.map((z) => [z.id, z]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Zones</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage zones and time slots for Koh Phangan
          </p>
        </div>
      </div>

      {(zonesError || slotsError) && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          API unavailable — showing mock data
        </div>
      )}

      {/* Zones */}
      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-zinc-800">Zones</h2>
        {loadingZones ? (
          <div className="rounded-lg border border-zinc-200 bg-white py-10 text-center text-sm text-zinc-400">
            Loading zones...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-blue-50 p-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900">{zone.name}</p>
                      <p className="text-xs text-zinc-400">
                        {zone.lat.toFixed(3)}, {zone.lng.toFixed(3)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      zone.active
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {zone.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="text-zinc-500">
                    Radius: <span className="font-medium text-zinc-800">{zone.radiusKm} km</span>
                  </span>
                  <span className="text-zinc-500">
                    Fee:{" "}
                    <span className="font-medium text-zinc-800">
                      {zone.deliveryFee === 0 ? "Free" : `฿${zone.deliveryFee}`}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Slots */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">Delivery Slots</h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:border-zinc-400 focus:outline-none"
            />
            <button
              onClick={() => setSelectedDate(todayIso())}
              className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Today
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {loadingSlots ? (
            <div className="py-10 text-center text-sm text-zinc-400">Loading slots...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Zone</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Capacity</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Booked</th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-500">Availability</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => {
                  const zone = zoneMap.get(slot.zoneId);
                  const pct = Math.round((slot.bookedCount / slot.capacity) * 100);
                  const full = slot.bookedCount >= slot.capacity;
                  return (
                    <tr key={slot.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                      <td className="px-4 py-3 text-zinc-700">{slot.date}</td>
                      <td className="px-4 py-3 font-mono text-zinc-700">
                        {slot.startTime} – {slot.endTime}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {zone?.name ?? slot.zoneId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-700">
                        {slot.capacity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-700">
                        {slot.bookedCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className={`h-full rounded-full transition-all ${full ? "bg-red-500" : "bg-green-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${full ? "text-red-600" : "text-green-600"}`}>
                            {full ? "Full" : `${100 - pct}% free`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loadingSlots && slots.length === 0 && (
            <div className="py-10 text-center text-sm text-zinc-400">
              No delivery slots for {selectedDate}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
