import React, { useEffect, useState, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Battery,
  BatteryCharging,
  Bike,
  Calendar,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  CircleGauge,
  CircuitBoard,
  Clock,
  Code,
  Columns,
  Cpu,
  Database,
  Gauge,
  Hash,
  Lock,
  MapPin,
  Plug,
  PlugZap,
  Power,
  RefreshCw,
  Route,
  Search,
  Settings,
  Signal,
  Thermometer,
  Timer,
  User,
  X,
  Zap,
} from "lucide-react";
import "./index.css";
const savedTableState = {};

// ---------------------------------------------------------------------
// Custom Date + Time selector (same behavior/UI as the one in RealTimeChart)
// ---------------------------------------------------------------------
const pad2 = (n) => String(n).padStart(2, "0");
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEK_DAYS = ["S","M","T","W","T","F","S"];
const HOUR_CLOCK = [12,1,2,3,4,5,6,7,8,9,10,11];
const MINUTE_CLOCK = ["00","05","10","15","20","25","30","35","40","45","50","55"];

function snapMinute(m) {
  const snapped = Math.round(m / 5) * 5;
  return snapped >= 60 ? 55 : snapped;
}

// Visual analog clock face used for both hour and minute selection.
// Supports precise tap and drag selection across all positions.
function ClockFace({ total, labels, selectedIndex, selectedLabel, onSelectIndex }) {
  const faceRef = useRef(null);
  const draggingRef = useRef(false);
  const r = 0.40;
  const PX = 210;

  const indexFromEvent = (e) => {
    const rect = faceRef.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const angleA = Math.atan2(dy, dx);
    let index = Math.round(((angleA + Math.PI / 2) / (Math.PI * 2)) * total);
    index = ((index % total) + total) % total;
    return index;
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    onSelectIndex(indexFromEvent(e));
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    onSelectIndex(indexFromEvent(e));
  };
  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  const selAngle = (selectedIndex / total) * 2 * Math.PI - Math.PI / 2;
  const cx = PX / 2;
  const cy = PX / 2;
  const endX = cx + r * PX * Math.cos(selAngle);
  const endY = cy + r * PX * Math.sin(selAngle);

  return (
    <div
      ref={faceRef}
      className="relative w-[min(46vw,210px)] sm:w-[min(62vw,210px)] h-[min(46vw,210px)] sm:h-[min(62vw,210px)] mx-auto select-none touch-none cursor-pointer"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="slider"
      aria-label="Clock"
      aria-valuenow={selectedIndex}
      aria-valuemin={0}
      aria-valuemax={total - 1}
      aria-valuetext={selectedLabel}
    >
      {/* outer circle */}
      <div className="absolute inset-0 rounded-full border border-white/15 bg-white/5 pointer-events-none" />
      {/* clock hand */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 210 210">
        <line x1={cx} y1={cy} x2={endX} y2={endY} stroke="#FF9913" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {/* center dot */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 sm:w-2 sm:h-2 rounded-full bg-[#FF9913] pointer-events-none" />
      {/* visible guide labels */}
      {labels.map((lb) => {
        if (lb.index === selectedIndex) return null;
        const ang = (lb.index / total) * 2 * Math.PI - Math.PI / 2;
        return (
          <span
            key={lb.index}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-[11px] sm:text-sm font-semibold text-white pointer-events-none"
            style={{ left: `${50 + r * 100 * Math.cos(ang)}%`, top: `${50 + r * 100 * Math.sin(ang)}%` }}
          >
            {lb.text}
          </span>
        );
      })}
      {/* orange selected circle following the hand */}
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-[#FF9913] text-black text-[10px] sm:text-sm font-semibold flex items-center justify-center pointer-events-none"
        style={{ left: `${50 + r * 100 * Math.cos(selAngle)}%`, top: `${50 + r * 100 * Math.sin(selAngle)}%` }}
      >
        {selectedLabel}
      </span>
    </div>
  );
}

// Parse it as UTC and render it in the browser's local time zone so the
// column matches the vehicle owner's clock.

const formatTimeCell = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const str = String(value);
  const hasTz = /(Z|[+-]\d{2}:\d{2})$/.test(str);
  const hasT = str.includes("T");
  const iso = hasT ? str : str.replace(" ", "T") + (hasTz ? "" : "Z");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

// ---------------------------------------------------------------------
// Per-column icons (keys match the telemetry_history payload)
// ---------------------------------------------------------------------
const columnIconMap = {
  // Vehicle & movement
  speed_kmph: Gauge,
  odometer: Gauge,
  trip_km: Route,
  current_rider: User,
  tire_pressure: CircleGauge,
  lat_long: MapPin,
  time: Clock,
  range_km: Route,
  last_trip: Route,
  day_km: CalendarDays,

  // Temperature
  controller_mos_temp: Thermometer,
  motor_temp: Thermometer,
  bms_mos_temp: Thermometer,
  ntc: Thermometer,
  vcu_temp: Thermometer,

  // Electrical & battery
  current_consumption: Zap,
  bat_voltage: Battery,
  remaining_cap_ah: BatteryCharging,
  in_ah: ArrowDown,
  in_ah_charger: Plug,
  in_ah_regen: RefreshCw,
  out_ah: ArrowUp,
  soc: BatteryCharging,
  apu_soc: Battery,
  apu_voltage: Zap,
  bms_soc: Battery,
  bms_remaining_cap: BatteryCharging,
  max_total_voltage: Zap,
  single_min_max_voltage: Activity,
  allowable_charging_current: Zap,
  cell_1_3: Battery,
  cell_4_6: Battery,
  cell_7_9: Battery,
  cell_10_12: Battery,
  cell_13_15: Battery,
  cell_16_18: Battery,
  cell_19_21: Battery,
  cell_22_23: Battery,

  // Vehicle electronics
  ev_power_state: Power,
  data: Database,
  bms_mos: CircuitBoard,
  charging_status: PlugZap,
  uptime: Timer,
  gear: Settings,
  reco_engine: Cpu,
  handle_lock: Lock,

  // Software & communication
  software_versions: Code,
  sim_info: Signal, // lucide-react has no SimCard export
  controller_errors: AlertTriangle,
  bms_errors: AlertTriangle,
};

// Fallback for any future/unknown field so every column still gets an icon.
const getColumnIcon = (col) => {
  if (columnIconMap[col]) return columnIconMap[col];
  const key = String(col || "").toLowerCase();
  if (key.includes("temp") || key.includes("ntc")) return Thermometer;
  if (key.includes("error") || key.includes("fault")) return AlertTriangle;
  if (key.includes("voltage") || key.includes("volt")) return Zap;
  if (key.includes("soc") || key.includes("cap") || key.startsWith("cell_"))
    return Battery;
  if (key.includes("ah")) return ArrowDown;
  if (key.includes("time") || key.includes("uptime")) return Clock;
  if (key.includes("km") || key.includes("trip") || key.includes("range"))
    return Route;
  if (key.includes("mos")) return CircuitBoard;
  if (key.includes("lock")) return Lock;
  if (key.includes("id")) return Hash;
  return Hash;
};

// Shared preferred column widths. The same <colgroup> drives <thead> and
// <tbody>, so a heading can never drift from the cells underneath it, no
// matter how many columns are visible.
const columnWidthMap = {
  time: 180,
  lat_long: 180,
  current_rider: 170,
  software_versions: 210,
  sim_info: 200,
  data: 200,
  tire_pressure: 160,
  single_min_max_voltage: 180,
  allowable_charging_current: 200,
  current_consumption: 180,
  controller_mos_temp: 180,
  remaining_cap_ah: 170,
  bms_remaining_cap: 170,
  in_ah_charger: 165,
  in_ah_regen: 160,
  bms_mos_temp: 160,
  controller_errors: 180,
};

const getColumnWidth = (col) => columnWidthMap[col] || 150;

// ---------------------------------------------------------------------
// Default Tabledata range: the last 30 minutes.
// Values use the same local `YYYY-MM-DDTHH:mm` format the picker produces.
// ---------------------------------------------------------------------
const DEFAULT_RANGE_MINUTES = 30;

const toLocalDateTimeInput = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const getDefaultRange = () => {
  const end = new Date();
  // Date arithmetic handles midnight and month/year rollover correctly.
  const start = new Date(end.getTime() - DEFAULT_RANGE_MINUTES * 60 * 1000);
  return {
    start: toLocalDateTimeInput(start),
    end: toLocalDateTimeInput(end),
  };
};

// Individual clickable field (START / END) that opens the picker.
function CustomDateTimeField({ label, value, onOpen }) {
  const d = new Date(value);
  let displayDate = "--";
  let displayTime = "";
  if (!isNaN(d.getTime())) {
    const h = d.getHours();
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const per = h >= 12 ? "PM" : "AM";
    displayDate = `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
    displayTime = `${pad2(h12)}:${pad2(d.getMinutes())} ${per}`;
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-11 w-full items-center gap-2 rounded-md border border-[#303030] bg-[#101010] px-3 text-left transition-colors hover:border-[#FF9913]/60 focus:outline-none focus:border-[#FF9913] sm:w-auto sm:min-w-[206px]"
    >
      <Calendar
        className="h-4 w-4 shrink-0 text-[#FF9913]"
        strokeWidth={1.8}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs leading-none text-[#8A8A8A]">
          {label}
        </span>
        <span className="mt-1 flex items-baseline gap-1.5 whitespace-nowrap text-sm leading-none text-white">
          {displayDate && displayDate !== "--" ? (
            <>
              <span>{displayDate}</span>
              <span className="text-[#5E5E5E]">·</span>
              <span className="tabular-nums text-[#D6D6D6]">
                {displayTime}
              </span>
            </>
          ) : (
            "--"
          )}
        </span>
      </span>
    
    </button>
  );
}

// the same YYYY-MM-DDTHH:mm (local) format the app uses.

function CustomDateTimePicker({ label, value, onApply, onClose }) {
  const parseValue = () => {
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      const now = new Date();
      const h = now.getHours();
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        date: now.getDate(),
        hour12: h % 12 === 0 ? 12 : h % 12,
        minute: snapMinute(now.getMinutes()),
        period: h >= 12 ? "PM" : "AM",
      };
    }
    const h = d.getHours();
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      date: d.getDate(),
      hour12: h % 12 === 0 ? 12 : h % 12,
      minute: snapMinute(d.getMinutes()),
      period: h >= 12 ? "PM" : "AM",
    };
  };

  const initial = parseValue();
  const [viewMonth, setViewMonth] = useState(() => new Date(initial.year, initial.month, 1));
  const [selYear, setSelYear] = useState(initial.year);
  const [selMonth, setSelMonth] = useState(initial.month);
  const [selDate, setSelDate] = useState(initial.date);
  const [selHour12, setSelHour12] = useState(initial.hour12);
  const [selMinute, setSelMinute] = useState(initial.minute);
  const [selPeriod, setSelPeriod] = useState(initial.period);
  const [timeMode, setTimeMode] = useState("hour");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const today = new Date();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, fromOther: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, fromOther: false });
  while (cells.length % 7 !== 0) cells.push({ day: nextDay(cells), fromOther: true });

  function nextDay() {
    return cells[cells.length - 1].fromOther ? cells[cells.length - 1].day + 1 : 1;
  }

  const goPrevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const goNextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  const selectDate = (day, fromOther) => {
    let y = year, m = month;
    if (fromOther) {
      if (day > 15) { m = month - 1; } else { m = month + 1; }
      if (m < 0) { m = 11; y = year - 1; }
      if (m > 11) { m = 0; y = year + 1; }
    }
    setSelYear(y);
    setSelMonth(m);
    setSelDate(day);
    setViewMonth(new Date(y, m, 1));
  };

  const handleHour = (h) => {
    setSelHour12(h);
    setTimeMode("minute");
  };

  const handleHourIndex = (idx) => {
    handleHour(idx === 0 ? 12 : idx);
  };

  const handleDone = () => {
    const h24 = (selHour12 % 12) + (selPeriod === "PM" ? 12 : 0);
    const dateStr = `${selYear}-${pad2(selMonth + 1)}-${pad2(selDate)}T${pad2(h24)}:${pad2(selMinute)}`;
    onApply(dateStr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${label} date and time`}
        className="relative w-full max-w-full sm:w-auto sm:max-w-2xl mx-2 sm:mx-0 bg-[#141414] border border-[#303030] rounded-2xl sm:rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.65)] px-2.5 pb-2.5 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:p-5 max-h-[calc(100dvh-2rem)] sm:max-h-[92vh] flex flex-col sm:block overflow-hidden sm:overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3 shrink-0">
          <h3 className="text-[11px] sm:text-base font-Kanit tracking-wider text-[#FF9913] break-words pr-2">
            {label} Date &amp; Time
          </h3>
          <button type="button" onClick={onClose} aria-label="Close picker"
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition shrink-0">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Current selection */}
        <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2 mb-2 sm:mb-4 px-0.5 sm:px-1 shrink-0">
          <span className="text-sm sm:text-lg font-Kanit text-white">
            {selDate} {MONTH_SHORT[selMonth]} {selYear}
          </span>
          <span className="text-sm sm:text-lg font-Kanit text-[#ffffff] flex items-center">
            <button
              type="button"
              onClick={() => setTimeMode("hour")}
              aria-label="Select hour"
              className={`px-1 rounded transition ${timeMode === "hour" ? "bg-[#FF9913] text-black" : "hover:text-[#FF9913]"}`}
            >
              {selHour12}
            </button>
            <span>:</span>
            <button
              type="button"
              onClick={() => setTimeMode("minute")}
              aria-label="Select minute"
              className={`px-1 rounded transition ${timeMode === "minute" ? "bg-[#FF9913] text-black" : "hover:text-[#FF9913]"}`}
            >
              {pad2(selMinute)}
            </button>
            <span className="ml-1">{selPeriod}</span>
          </span>
        </div>

        {/* Calendar + Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-1 min-h-0 overflow-y-auto py-0.5 sm:py-0 sm:flex-none sm:min-h-0 sm:overflow-visible">
          {/* Calendar */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <button type="button" onClick={goPrevMonth} aria-label="Previous month"
                className="text-[#FF9913] hover:bg-[#FF9913]/10 rounded-lg p-1 transition">
                <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
              <div className="text-[11px] sm:text-sm font-semibold text-white">
                {MONTH_FULL[month]} {year}
              </div>
              <button type="button" onClick={goNextMonth} aria-label="Next month"
                className="text-[#FF9913] hover:bg-[#FF9913]/10 rounded-lg p-1 transition">
                <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center mb-1">
              {WEEK_DAYS.map((d, i) => (
                <div key={i} className="text-[9px] sm:text-[11px] text-gray-400">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {cells.map((c, i) => {
                const isSelected = !c.fromOther && c.day === selDate && month === selMonth && year === selYear;
                const isToday = !c.fromOther && c.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDate(c.day, c.fromOther)}
                    aria-label={`${c.day} ${MONTH_FULL[month]} ${year}`}
                    className={`h-6 sm:h-9 w-full rounded-lg text-[11px] sm:text-sm transition flex items-center justify-center
                      ${c.fromOther ? "text-gray-600" : "text-white hover:bg-white/10"}
                      ${isSelected ? "bg-[#FF9913] text-black font-bold" : ""}
                      ${isToday && !isSelected ? "ring-1 ring-[#FF9913]/60" : ""}`}
                  >
                    {c.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time */}
          <div className="w-full">
            <div className="mb-1.5 sm:mb-2 text-center text-[11px] sm:text-sm font-Kanit text-white">
              {timeMode === "hour" ? "Select Hour" : "Select Minute"}
            </div>
            {timeMode === "hour" ? (
              <ClockFace
                total={12}
                labels={HOUR_CLOCK.map((h, i) => ({ text: String(h), index: i }))}
                selectedIndex={selHour12 % 12}
                selectedLabel={String(selHour12)}
                onSelectIndex={handleHourIndex}
              />
            ) : (
              <ClockFace
                total={60}
                labels={MINUTE_CLOCK.map((m, i) => ({ text: m, index: i * 5 }))}
                selectedIndex={selMinute}
                selectedLabel={pad2(selMinute)}
                onSelectIndex={setSelMinute}
              />
            )}
            <div className="mt-2 sm:mt-3 flex justify-center gap-1.5 sm:gap-2">
              <button type="button" onClick={() => setSelPeriod("AM")}
                aria-pressed={selPeriod === "AM"}
                className={`px-2.5 py-0.5 sm:px-4 sm:py-1.5 rounded-lg text-[11px] sm:text-sm font-Kanit transition border ${
                  selPeriod === "AM"
                    ? "bg-[#FF9913] text-black border-[#FF9913] "
                    : "text-white border-white/20 hover:border-[#FF9913]/60"}`}>
                AM
              </button>
              <button type="button" onClick={() => setSelPeriod("PM")}
                aria-pressed={selPeriod === "PM"}
                className={`px-2.5 py-0.5 sm:px-4 sm:py-1.5 rounded-lg text-[11px] sm:text-sm font-Kanit transition border ${
                  selPeriod === "PM"
                    ? "bg-[#FF9913] text-black border-[#FF9913] "
                    : "text-white border-white/20 hover:border-[#FF9913]/60"}`}>
                PM
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-2.5 sm:mt-5 flex justify-end gap-2.5 sm:gap-3 shrink-0 pt-1">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-sm text-white border border-[#303030] hover:border-[#FF9913]/60 hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleDone}
            className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-sm text-black bg-[#FF9913] hover:bg-[#FFB347] transition-colors inline-flex items-center gap-1">
            <Check className="w-3 h-3 sm:w-4 sm:h-4" /> Done
          </button>
        </div>
        <div className="h-0 sm:hidden" style={{ height: "env(safe-area-inset-bottom)" }} />
      </div>
    </div>
  );
}

export default function Tabledata({ vin }) {
  const saved = useRef(savedTableState[vin] || null);
  // Computed once per mount: re-renders never recompute or overwrite it.
  const defaultRangeRef = useRef(null);
  if (!defaultRangeRef.current) {
    defaultRangeRef.current = getDefaultRange();
  }
  const initialDraftStart =
    (saved.current && saved.current.draftStart) ||
    defaultRangeRef.current.start;
  const initialDraftEnd =
    (saved.current && saved.current.draftEnd) || defaultRangeRef.current.end;
  const [loading, setLoading] = useState(saved.current ? false : true);
  const [allvin, setAllvin] = useState(saved.current ? saved.current.allvin : null);
  const [realtimeData, setRealtimeData] = useState(saved.current ? saved.current.realtimeData : []);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(saved.current ? saved.current.page : 0);
  const [start, setStart] = useState(saved.current ? saved.current.start : "");
  const [end, setEnd] = useState(saved.current ? saved.current.end : "");
  const [draftStart, setDraftStart] = useState(initialDraftStart);
  const [draftEnd, setDraftEnd] = useState(initialDraftEnd);
  const [columns, setColumns] = useState(saved.current ? saved.current.columns : []); // all column names
  const [selectedColumns, setSelectedColumns] = useState(saved.current ? saved.current.selectedColumns : ["time","speed_kmph"]); // selected columns
  const [showDropdown, setShowDropdown] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // null | 'start' | 'end'
  const [isOnLast, setIsOnLast] = useState(saved.current ? saved.current.isOnLast : false);
  const [infoOpen, setInfoOpen] = useState(false);

  const dropdownRef = useRef(null);
  const hasMountedRef = useRef(false);
  const loadedOnceRef = useRef(false);
  const prevVinRef = useRef(vin);
  const limit = 500;

  const allVinLabels = {
    // Current API keys
    vin: "VIN",
    owner_name: "Owner name",
    phone: "Phone number",
    model: "Vehicle model",
    colour: "Colour",
    purchase_date: "Purchase date",
    plate_num: "Plate number",
    serialnum: "Serial number",
    note: "Note",
    controller_id: "Controller ID",
    motor_id: "Motor ID",
    bms_id: "BMS ID",
    charger_id: "Charger ID",
    comfortkey_id: "comfortKey ID",
    fronttpms_id: "Front TPMS ID",
    reartpms_id: "Rear TPMS ID",
    time: "Last updated",
    // Legacy aliases (kept so other API shapes still label correctly)
    vinnumber: "VIN",
    ownername: "Owner name",
    phonenumber: "Phone number",
    controllerid: "Controller ID",
    motorid: "Motor ID",
    bmsid: "BMS ID",
    chargerid: "Charger ID",
    rideosversion: "rideOS Version",
    smartkeyid: "comfortKey ID",
    odo: "Odometer (km)",
    chargingstate: "Charging status",
    handlelockstate: "Handle lock status",
    seatlockstate: "Seat lock status",
    bmsmosstates: "BMS mosfet status",
    riders: "Current rider",
    bmslifecycles: "BMS life cycles",
    lat_long: "Location",
  };

const realtimeLabels = {
  // Vehicle & movement
  speed_kmph: "Speed (km/h)",
  trip_km: "Trip (km)",
  current_rider: "Current rider",
  tire_pressure: "Tire pressure",
  lat_long: "Location",
  time: "Timestamp",
  range_km: "Range (km)",
  last_trip: "Last trip",
  day_km: "Day (km)",
  odometer: "Odometer (km)",

  // Temperature
  controller_mos_temp: "Controller MOS temp",
  motor_temp: "Motor temp",
  bms_mos_temp: "BMS MOS temp",
  ntc: "NTC temp",
  vcu_temp: "VCU temp",

  // Electrical & battery
  current_consumption: "Current consumption",
  bat_voltage: "Battery voltage (V)",
  remaining_cap_ah: "Remaining capacity (Ah)",
  in_ah: "In Ah",
  in_ah_charger: "In Ah by charger",
  in_ah_regen: "In Ah by regen",
  out_ah: "Out Ah",
  soc: "SOC (%)",
  apu_soc: "APU SOC (%)",
  apu_voltage: "APU voltage",
  bms_soc: "BMS SOC (%)",
  bms_remaining_cap: "BMS remaining cap",
  max_total_voltage: "Max total voltage",
  single_min_max_voltage: "Cell min/max voltage",
  allowable_charging_current: "Allowable charging current",
  cell_1_3: "Cell 1-3",
  cell_4_6: "Cell 4-6",
  cell_7_9: "Cell 7-9",
  cell_10_12: "Cell 10-12",
  cell_13_15: "Cell 13-15",
  cell_16_18: "Cell 16-18",
  cell_19_21: "Cell 19-21",
  cell_22_23: "Cell 22-23",

  // Vehicle electronics
  ev_power_state: "EV power state",
  data: "Data",
  bms_mos: "BMS mosfet",
  charging_status: "Charging status",
  uptime: "Uptime",
  gear: "Gear",
  reco_engine: "Reco engine",
  handle_lock: "Handle lock",

  // Software & communication
  software_versions: "Software versions",
  sim_info: "SIM info",
  controller_errors: "Controller errors",
  bms_errors: "BMS errors",

  // Legacy aliases (kept for other API shapes)
  tripkm: "Trip (km)",
  controllermostemp: "Controller mosfet temperature",
  motortemp: "Motor temperature",
  bmsmostemp: "BMS mosfet temperature",
  currentconsumption: "Current consumption",
  batvoltage: "Battery voltage (V)",
  remainingcapacity_ah: "Remaining capacity (Ah)",
  inah: "In Ah",
  inah_by_charger: "In Ah by charger",
  inah_by_regen: "In Ah by regen",
  outah: "Out Ah",
  currentrider: "Current rider",
  tirepressure: "Tire pressure",
  apusoc: "APU SOC (%)",
};

const handleSelectAll = () => {
  if (selectedColumns.length === columns.length) {
    // If already all selected → unselect all
    setSelectedColumns([]);
  } else {
    // Select all columns
    setSelectedColumns(columns);
  }
};

  const fetchData = async (currentPage = 0, s = start, e = end) => {
    if (!vin) return;
    setLoading(true);
    setError(null);

    try {
      const offset = currentPage * limit;
      let url = ` https://cc.rivotmotors.com/vehicles/${vin}?limit=${limit}&offset=${offset}`;
      if (s && e) {
        url += `&start=${encodeURIComponent(s)}&end=${encodeURIComponent(e)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

const scooter = data.all_scooters || {};
      const rows = Array.isArray(data.telemetry_history)
        ? data.telemetry_history
        : [];

      if (data.status === "success") {
        loadedOnceRef.current = true;
        setAllvin(scooter);
        setRealtimeData(rows);

        if (rows.length > 0) {
          const cols = Object.keys(rows[0]).filter((col) => col !== "vin");
          setColumns(cols);
          if (selectedColumns.length === 0) setSelectedColumns(cols);
        }
      } else {
        setError(scooter.message || data.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const handleClickOutside = (event) => {
    // If the dropdown is open AND the click target is outside the dropdown and button
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


useEffect(() => {
  if (!vin) return;
  if (!loadedOnceRef.current) return;
  savedTableState[vin] = {
    page,
    start,
    end,
    draftStart,
    draftEnd,
    isOnLast,
    realtimeData,
    allvin,
    columns,
    selectedColumns,
  };
}, [vin, page, start, end, draftStart, draftEnd, isOnLast, realtimeData, allvin, columns, selectedColumns]);


useEffect(() => {
  if (!vin) return;
  const snap = savedTableState[vin];
  if (prevVinRef.current !== vin) {
    prevVinRef.current = vin;
    if (snap) {
      setPage(snap.page);
      setIsOnLast(snap.isOnLast);
      setStart(snap.start);
      setEnd(snap.end);
      setDraftStart(snap.draftStart);
      setDraftEnd(snap.draftEnd);
      setAllvin(snap.allvin);
      setRealtimeData(snap.realtimeData);
      setColumns(snap.columns);
      setSelectedColumns(snap.selectedColumns);
    } else {
      setPage(0);
      setIsOnLast(false);
      setStart("");
      setEnd("");
      setDraftStart("");
      setDraftEnd("");
      fetchData(0);
    }
    return;
  }
  if (!snap) {
    setPage(0);
    fetchData(0);
  }

}, [vin]);


 useEffect(() => {
  return () => {
    hasMountedRef.current = false;
  };
 }, []);


 useEffect(() => {
  if (!hasMountedRef.current) {
    hasMountedRef.current = true;
    return;
  }
  if (!vin) return;
  fetchData(page);
}, [page]);


  const handleNext = () => {
    const nextPage = page + 1;
    setIsOnLast(false);
    setPage(nextPage);
    fetchData(nextPage);
  };

  const handlePrev = () => {
    if (page === 0) return;
    const prevPage = page - 1;
    setIsOnLast(false);
    setPage(prevPage);
    fetchData(prevPage);
  };

  const handleFilter = () => {
    setIsOnLast(false);
    setStart(draftStart);
    setEnd(draftEnd);
    setPage(0);
    fetchData(0, draftStart, draftEnd);
  };

  const handleRefresh = () => {
    setStart("");
    setEnd("");
    setDraftStart("");
    setDraftEnd("");
    setIsOnLast(false);
    setPage(0);
    fetchData(0, "", "");
  };

  // Lightweight probe: does the given page contain at least one row?
  const probeExists = async (targetPage) => {
    if (!vin) return false;
    const offset = targetPage * limit;
    let url = ` https://cc.rivotmotors.com/vehicles/${vin}?limit=1&offset=${offset}`;
    if (start && end) {
      url += `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    }
    const res = await fetch(url);
    const data = await res.json();
   return (
      data.status === "success" &&
      Array.isArray(data.telemetry_history) &&
      data.telemetry_history.length > 0
    );
  };

  // Actually locate the LAST non-empty page (exponential probe + binary search)
  // then navigate to it through the existing [page] effect.
  const handleLast = async () => {
    if (!vin) return;
    setLoading(true);
    try {
      let low = 0;
      let high = 1;
      while (await probeExists(high)) {
        low = high;
        high *= 2;
      }
      while (high - low > 1) {
        const mid = Math.floor((low + high) / 2);
        if (await probeExists(mid)) low = mid;
        else high = mid;
      }
      const lastPage = low;
      setIsOnLast(true);
      setPage(lastPage);
      fetchData(lastPage);
    } finally {
      setLoading(false);
    }
  };

  const handleFirst = () => {
    setIsOnLast(false);
    setPage(0);
  };

  const handleColumnSelect = (col) => {
    setSelectedColumns((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : [...prev, col]
    );
  };

 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!vin) return <p className="text-orange-400">Please enter a VIN number.</p>;
  if (loading) return <p className="text-orange-400">Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="px-5 py-4 w-full max-w-[95vw] mx-auto text-white  min-h-screen overflow-x-hidden">

      {allvin && (
        <section className="overflow-hidden rounded-[10px] border border-[#303030] bg-[#141414]">
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              infoOpen ? "border-b border-[#262626]" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <Bike
                className="h-[18px] w-[18px] text-[#FF9913]"
                strokeWidth={1.8}
              />
              <h2 className="text-lg text-white">Vehicle Information</h2>
            </div>
            <button
              type="button"
              onClick={() => setInfoOpen((prev) => !prev)}
              aria-expanded={infoOpen}
              aria-controls="vehicle-information-details"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#FF9913]/50 bg-[#1B1B1B] px-3 text-sm text-[#FF9913] transition-colors hover:border-[#FF9913] hover:bg-[#222222] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF9913]"
            >
              <span>{infoOpen ? "Hide" : "Show"}</span>
              {infoOpen ? (
                <ChevronUp className="h-4 w-4" strokeWidth={1.8} />
              ) : (
                <ChevronDown className="h-4 w-4" strokeWidth={1.8} />
              )}
            </button>
          </div>

          {infoOpen && (
            <div
              id="vehicle-information-details"
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            >
              {Object.entries(allvin)
                .filter(([key]) => key !== "telemetry_history")
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex min-w-0 items-baseline justify-between gap-3 border-b border-[#242424] px-4 py-2.5"
                  >
                    <span className="shrink-0 text-sm text-[#FF9913]">
                      {allVinLabels[key] || key}
                    </span>
                    <span
                      className="min-w-0 truncate whitespace-nowrap text-right text-sm text-[#D6D6D6]"
                      title={
                        Array.isArray(value) ? value.join(", ") : value ?? "-"
                      }
                    >
                      {key === "rideosversion"
                        ? (Array.isArray(value) ? value.join(", ") : value)
                            .split(",")
                            .join(", ")
                        : key === "time"
                        ? formatTimeCell(value)
                        : Array.isArray(value)
                        ? value.join(", ")
                        : value ?? "-"}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </section>
      )}
      {/* ==== Unified Date & Time + table control toolbar ==== */}
      <div className="mt-4 mb-4 rounded-[10px] border border-[#303030] bg-[#141414] px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:flex-nowrap xl:items-center">
          <div className="flex shrink-0 items-center gap-2">
            <CalendarClock
              className="h-[18px] w-[18px] text-[#FF9913]"
              strokeWidth={1.8}
            />
            <span className="whitespace-nowrap text-sm text-[#FF9913]">
              Date &amp; Time
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap">
            <CustomDateTimeField
              value={draftStart}
              onOpen={() => setPickerTarget("start")}
            />

            <span
              aria-hidden="true"
              className="hidden h-px w-4 shrink-0 bg-[#3A3A3A] sm:block"
            />

            <CustomDateTimeField
              
              value={draftEnd}
              onOpen={() => setPickerTarget("end")}
            />

            <button
              type="button"
              onClick={handleFilter}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-[#FF9913] px-5 text-sm text-black transition-colors hover:bg-[#FFB347] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9913] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414] sm:w-auto"
            >
              <Search className="h-4 w-4" strokeWidth={2} />
              Load
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end xl:ml-auto xl:flex-nowrap">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-[#303030] bg-[#1B1B1B] px-3 text-sm text-[#E6E6E6] transition-colors hover:border-[#FF9913]/60 hover:text-white"
            >
              <RefreshCw
                className="h-4 w-4 text-[#FF9913]"
                strokeWidth={1.8}
              />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handlePrev}
              disabled={page === 0}
              className={`inline-flex h-11 items-center gap-2 rounded-md border px-3 text-sm transition-colors ${
                page === 0
                  ? "cursor-not-allowed border-[#242424] bg-[#141414] text-[#5E5E5E]"
                  : "border-[#303030] bg-[#1B1B1B] text-[#E6E6E6] hover:border-[#FF9913]/60 hover:text-white"
              }`}
            >
              <ChevronLeft
                className={`h-4 w-4 ${
                  page === 0 ? "text-[#5E5E5E]" : "text-[#FF9913]"
                }`}
                strokeWidth={1.8}
              />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[#FF9913] px-4 text-sm text-black transition-colors hover:bg-[#FFB347]"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* === Historical table === */}
      <section className="overflow-hidden rounded-[10px] border border-[#303030] bg-[#101010]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626] px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="flex items-center gap-2 text-lg text-white">
              <Clock
                className="h-[18px] w-[18px] text-[#FF9913]"
                strokeWidth={1.8}
              />
              Historical table
            </h2>

            {/* Select Columns */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown((prev) => !prev)}
                aria-expanded={showDropdown}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-[#303030] bg-[#1B1B1B] px-3 text-sm text-[#E6E6E6] transition-colors hover:border-[#FF9913]/60 hover:text-white"
              >
                <Columns
                  className="h-4 w-4 text-[#FF9913]"
                  strokeWidth={1.8}
                />
                <span className="whitespace-nowrap">Select Columns</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[#8A8A8A] transition-transform ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showDropdown && (
                <div className="tabledata-scroll absolute left-0 z-50 mt-2 max-h-72 w-72 overflow-y-auto rounded-md border border-[#303030] bg-[#141414] p-2">
                  <label className="flex cursor-pointer items-center gap-2 border-b border-[#262626] px-2 pb-2 text-sm text-[#E6E6E6]">
                    <input
                      type="checkbox"
                      checked={selectedColumns.length === columns.length}
                      onChange={handleSelectAll}
                      className="h-3.5 w-3.5 accent-[#FF9913]"
                    />
                    Select all
                  </label>
                  <div className="pt-1">
                    {columns.map((col) => (
                      <label
                        key={col}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[#B8B8B8] transition-colors hover:bg-[#1F1F1F] hover:text-white"
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(col)}
                          onChange={() => handleColumnSelect(col)}
                          className="h-3.5 w-3.5 accent-[#FF9913]"
                        />
                        <span className="truncate">
                          {realtimeLabels[col] || col}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#8A8A8A]">
            <span>{realtimeData.length} rows</span>
            <span className="h-3 w-px bg-[#303030]" />
            <span>{selectedColumns.length} columns</span>
          </div>
        </div>

        <div className="tabledata-scroll max-h-[520px] overflow-auto">
          <table className="w-full min-w-max border-collapse text-sm">
            {/* One shared column grid for header and body */}
            <colgroup>
              {selectedColumns.map((col) => (
                <col
                  key={col}
                  style={{ width: `${getColumnWidth(col)}px` }}
                />
              ))}
            </colgroup>

            <thead>
              <tr>
                {selectedColumns.map((col) => {
                  const Icon = getColumnIcon(col);
                  return (
                    <th
                      key={col}
                      scope="col"
                      className="sticky top-0 z-10 whitespace-nowrap border-b border-[#303030] bg-[#1B1B1B] px-4 py-2.5 text-left align-middle"
                    >
                      <span className="group inline-flex items-center gap-1.5 text-sm text-[#DEDEDE]">
                        <Icon
                          className="h-[15px] w-[15px] shrink-0 text-[#FF9913]"
                          strokeWidth={1.8}
                        />
                        {realtimeLabels[col] || col}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {realtimeData.length === 0 ? (
                <tr>
                  <td
                    colSpan={selectedColumns.length || 1}
                    className="px-4 py-16 text-center text-sm text-[#7F7F7F]"
                  >
                    No data available for this range
                  </td>
                </tr>
              ) : (
                realtimeData.map((row, index) => (
                  <tr
                    key={index}
                    className={`transition-colors ${
                      index % 2 === 0 ? "bg-[#101010]" : "bg-[#141414]"
                    } hover:bg-[#1B1B1B]`}
                  >
                    {selectedColumns.map((key) => {
                      const raw = row[key];
                      const isEmpty =
                        raw === null || raw === undefined || raw === "";
                      return (
                        <td
                          key={key}
                          className={`whitespace-nowrap border-b border-[#242424] px-4 py-2.5 text-left align-middle text-sm tabular-nums ${
                            isEmpty ? "text-[#6E6E6E]" : "text-[#E8E8E8]"
                          }`}
                        >
                          {Array.isArray(raw)
                            ? raw.join(", ")
                            : key === "time"
                            ? formatTimeCell(raw)
                            : isEmpty
                            ? "-"
                            : raw}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#262626] px-4 py-2.5 text-xs text-[#8A8A8A]">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Showing{" "}
              <span className="text-[#E6E6E6]">
                {realtimeData.length === 0 ? 0 : page * limit + 1}
                {"–"}
                {page * limit + realtimeData.length}
              </span>
            </span>
            <span className="hidden h-3 w-px bg-[#303030] sm:block" />
            <span>
              Rows per page: <span className="text-[#E6E6E6]">{limit}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFirst}
              disabled={page === 0}
              title="First page"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#303030] bg-[#1B1B1B] text-[#C9C9C9] transition-colors ${
                page === 0
                  ? "cursor-not-allowed text-[#4F4F4F]"
                  : "hover:border-[#FF9913]/60 hover:text-white"
              }`}
            >
              <ChevronsLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={handlePrev}
              disabled={page === 0}
              title="Previous page"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#303030] bg-[#1B1B1B] text-[#C9C9C9] transition-colors ${
                page === 0
                  ? "cursor-not-allowed text-[#4F4F4F]"
                  : "hover:border-[#FF9913]/60 hover:text-white"
              }`}
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>

            <span className="inline-flex h-7 min-w-[52px] items-center justify-center rounded-md border border-[#FF9913]/50 bg-[#1B1B1B] px-2 text-xs text-[#FF9913]">
              {page + 1}
            </span>

            <button
              type="button"
              onClick={handleNext}
              title="Next page"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#303030] bg-[#1B1B1B] text-[#C9C9C9] transition-colors hover:border-[#FF9913]/60 hover:text-white"
            >
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={handleLast}
              disabled={!(start && end) || isOnLast}
              title="Last page"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#303030] bg-[#1B1B1B] text-[#C9C9C9] transition-colors ${
                !(start && end) || isOnLast
                  ? "cursor-not-allowed text-[#4F4F4F]"
                  : "hover:border-[#FF9913]/60 hover:text-white"
              }`}
            >
              <ChevronsRight className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </section>

{/* Custom Date & Time picker modals */}
      {pickerTarget === "start" && (
        <CustomDateTimePicker
         
          value={draftStart}
          onApply={(newStart) => {
            setDraftStart(newStart);
          }}
          onClose={() => setPickerTarget(null)}
        />
      )}
      {pickerTarget === "end" && (
        <CustomDateTimePicker
          
          value={draftEnd}
          onApply={(newEnd) => {
            setDraftEnd(newEnd);
          }}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}
