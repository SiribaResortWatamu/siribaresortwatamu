"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { AdminField } from "@/components/admin/form";
import type { SafariItineraryDay } from "@/lib/types";

export interface DraftDay {
  key: string;
  title: string;
  description: string;
  activities: string;
  accommodation: string;
  meals: string;
}

/**
 * Dynamic day-by-day itinerary editor.
 *
 * There is no fixed maximum: "Add Day" appends Day 4, Day 5 and so on, and
 * the arrows reorder them. Day numbers are always derived from position, so
 * they cannot drift out of sequence. The whole list is submitted as JSON in
 * one hidden field.
 */
export function ItineraryBuilder({ days }: { days: SafariItineraryDay[] }) {
  const [items, setItems] = useState<DraftDay[]>(() =>
    days.length > 0
      ? days.map((day) => ({
          key: day.id,
          title: day.title ?? "",
          description: day.description ?? "",
          activities: (day.activities ?? []).join("\n"),
          accommodation: day.accommodation ?? "",
          meals: day.meals ?? "",
        }))
      : [blankDay()],
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const update = (key: string, patch: Partial<DraftDay>) =>
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );

  const move = (index: number, delta: number) =>
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const remove = (key: string) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((i) => i.key !== key)));

  // Empty days are dropped so an accidental "Add Day" costs nothing.
  const payload = items
    .filter((item) => item.title.trim())
    .map((item, index) => ({
      day_number: index + 1,
      display_order: index + 1,
      title: item.title.trim(),
      description: item.description.trim() || null,
      activities: item.activities
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      accommodation: item.accommodation.trim() || null,
      meals: item.meals.trim() || null,
    }));

  return (
    <div className="space-y-3">
      <input type="hidden" name="itinerary" value={JSON.stringify(payload)} />

      {items.map((item, index) => {
        const isCollapsed = collapsed[item.key];

        return (
          <div key={item.key} className="rounded-xl border border-line bg-sand/40">
            <div className="flex items-center gap-3 px-4 py-3">
              <GripVertical size={15} strokeWidth={1.5} className="shrink-0 text-ink-muted" />

              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean font-display text-xs font-semibold text-white">
                {index + 1}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                }
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm font-medium">
                  {item.title.trim() || `Day ${index + 1} — untitled`}
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-1">
                <IconButton
                  label="Move up"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUp size={15} strokeWidth={1.75} />
                </IconButton>
                <IconButton
                  label="Move down"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown size={15} strokeWidth={1.75} />
                </IconButton>
                <IconButton
                  label="Remove day"
                  disabled={items.length === 1}
                  danger
                  onClick={() => remove(item.key)}
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </IconButton>
              </div>
            </div>

            {!isCollapsed && (
              <div className="space-y-4 border-t border-line px-4 py-4">
                <AdminField label="Day title" required>
                  <input
                    className="input"
                    value={item.title}
                    placeholder="Arrival and afternoon game drive"
                    onChange={(e) => update(item.key, { title: e.target.value })}
                  />
                </AdminField>

                <AdminField label="Description">
                  <textarea
                    className="textarea"
                    rows={4}
                    value={item.description}
                    placeholder="What happens on this day, in a paragraph or two."
                    onChange={(e) => update(item.key, { description: e.target.value })}
                  />
                </AdminField>

                <AdminField label="Activities" hint="one per line">
                  <textarea
                    className="textarea"
                    rows={3}
                    value={item.activities}
                    placeholder={"Sunrise game drive\nVisit to Aruba Dam"}
                    onChange={(e) => update(item.key, { activities: e.target.value })}
                  />
                </AdminField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label="Accommodation">
                    <input
                      className="input"
                      value={item.accommodation}
                      placeholder="Ashnil Aruba Lodge or similar"
                      onChange={(e) => update(item.key, { accommodation: e.target.value })}
                    />
                  </AdminField>

                  <AdminField label="Meals">
                    <input
                      className="input"
                      value={item.meals}
                      placeholder="Breakfast, lunch, dinner"
                      onChange={(e) => update(item.key, { meals: e.target.value })}
                    />
                  </AdminField>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => setItems((prev) => [...prev, blankDay()])}
        className="btn btn-outline btn-sm w-full border-dashed"
      >
        <Plus size={15} strokeWidth={2} />
        Add Day
      </button>

      <p className="text-xs text-ink-muted">
        Days are numbered by their position — reorder them and the numbering follows.
        A day with no title is not saved.
      </p>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-30 ${
        danger
          ? "text-ink-muted hover:bg-[#fbe1dc] hover:text-[#a3402c]"
          : "text-ink-muted hover:bg-sand-deep hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function blankDay(): DraftDay {
  return {
    key: `new-${Math.random().toString(36).slice(2, 10)}`,
    title: "",
    description: "",
    activities: "",
    accommodation: "",
    meals: "",
  };
}
