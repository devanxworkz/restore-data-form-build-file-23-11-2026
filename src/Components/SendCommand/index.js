import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Battery,
  Bluetooth,
  Car,
  Check,
  ChevronRight,
  Cpu,
  Download,
  Lightbulb,
  Lock,
  Pause,
  Plane,
  Power,
  RefreshCw,
  RotateCcw,
  Send,
  SlidersHorizontal,
  Terminal,
  Unlock,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import './index.css';

const decToHex2 = (dec) =>
  Number(dec).toString(16).padStart(2, "0").toUpperCase();

const decToHex4 = (dec) =>
  Number(dec).toString(16).padStart(4, "0").toUpperCase();

const swapBytes = (hex) =>
  hex.match(/.{1,2}/g).reverse().join("");

// const decToHex4 = (num) =>
//   Number(num).toString(16).padStart(4, "0").toUpperCase();

// const swapBytes = (hex) =>
//   hex.slice(2, 4) + hex.slice(0, 2);

const currentToHex = (value) => {
  if (!value) return "0000";
  const scaled = Number(value) * 4;
  return swapBytes(decToHex4(scaled));
};


export default function SendCommand({ vin ,lastUpdated,location, ownerName, phoneNumber}) {
  const [mode, setMode] = useState("BASIC"); // BASIC | ADVANCED
  const [form, setForm] = useState({
  vinNumber: vin || "",
  commandType: "",        
  canMode: "",            
  value: "",
  clientId: "COMMANDCENTER",
  lineCurrent: "",
  phaseCurrent: "",
  regenMin: "",
  regenMax: "",
  canId: "",
  canData: "",
  rpm: "",
  boostDuration: "",
  boostInterval: "",
  saveCommand: false,
});

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [moduleType, setModuleType] = useState("CONTROLLER");
  const [activeModule, setActiveModule] = useState("controller");
  const [selectedCommand, setSelectedCommand] = useState(null);

  const commandLabels = {
  CAN_SET_RPM: "Set RPM/ Boost Duration/ Boos Interval",
  // CAN_STE_DURATION: "Boost Duration",
  // CAN_SET_INTRVAL: "Boost Interval",
  CAN_CURRENT: "Line Current /Phase Current /Regen Current Min and Max",
  CAN_PASH_CURRENT: "Phase Current",
  CAN_REGEN_MIN: "Regen Current Min",
  CAN_REGEN_MAX: "Regen Current Max",
  CAN_GEAR_CTRL: "Gear Controller",
  CAN_CRUISE_CTRL: "Cruise Control",

  CAN_RATED_CAPACITY: "Rated Capacity",
  CAN_REMAINING_CAPACITY: "Remaining Capacity",
  CAN_MANUAL_SOC: "Manual SOC",
  CAN_TOTAL_CHARGING_AH: "Total Charging Ah",
  CAN_TOTAL_DISCHARGING_AH: "Total Discharging Ah",
  CAN_BALANCING_CURRENT: "Balancing Current",
  CAN_CHG_TEMP_HIGH_L2: "Charging Temp High Fault – L2",
  CAN_DES_TEMP_HIGH_L2: "Discharging Temp High Fault – L2",
  CAN_CHG_OVERCURRENT_L2: "Charge Overcurrent Fault – L2",
  CAN_DISCHG_OVERCURRENT_L2: "Discharge Overcurrent Fault – L2",
  CAN_SOC_LOW_L2: "SOC Too Low Fault – L2",
  CAN_NTC_TEMP_DIFF_L2: "NTC Temperature Difference – L2",
  CAN_CHG_MOSFET: "Charging MOSFET",
  CAN_DISCHG_MOSFET: "Discharging MOSFET",
  CAN_BMS_REBOOT: "BMS Reboot",
  CAN_CELL_VOLT_DIFF_L2: "Cell Voltage Difference – L2",
  CAN_CELL_HIGH_VOLT_L2: "Cell Voltage High – L2",
  CAN_CELL_LOW_VOLT_L2: "Cell Voltage Low – L2",
  CAN_TOTAL_HIGH_VOLT_L2: "Total High Voltage – L2",
  CAN_TOTAL_LOW_VOLT_L2: "Total Low Voltage – L2",
  POWER: "Scooter Power",
  BLUETOOTH: "Bluetooth",
  AIRPLANE: "Airplane Mode",
  HANDLELOCK: "Handle Lock",
  SEATLOCK: "Seat Lock",
  LED: "LED Control",
  BOARDRESTART: "Board Restart",
  rideOSRESTART: "rideOS Restart",
  AOSPOTA: "AOSP OTA Update",
  MCUOTA: "MCU OTA Update",
  rideOSOTA: "rideOS OTA Update",
  CUSTOM_CAN_COMMAND: "Custom CAN Command",
};

const commands = {
  controller: [
    "CAN_SET_RPM",
    // "CAN_STE_DURATION",
    // "CAN_SET_INTRVAL",
    "CAN_CURRENT",
    // "CAN_PASH_CURRENT",
    // "CAN_REGEN_MIN",
    // "CAN_REGEN_MAX",
    "CAN_GEAR_CTRL",
    "CAN_CRUISE_CTRL",
  ],
  bms: [
    "CAN_RATED_CAPACITY",
    "CAN_REMAINING_CAPACITY",
    "CAN_MANUAL_SOC",
    "CAN_TOTAL_CHARGING_AH",
    "CAN_TOTAL_DISCHARGING_AH",
    "CAN_BALANCING_CURRENT",
    "CAN_CHG_TEMP_HIGH_L2",
    "CAN_DES_TEMP_HIGH_L2",
    "CAN_CHG_OVERCURRENT_L2",
    "CAN_DISCHG_OVERCURRENT_L2",
    "CAN_SOC_LOW_L2",
    "CAN_NTC_TEMP_DIFF_L2",
    "CAN_CHG_MOSFET",
    "CAN_DISCHG_MOSFET",
    "CAN_BMS_REBOOT",
    "CAN_CELL_VOLT_DIFF_L2",
    "CAN_CELL_HIGH_VOLT_L2",
    "CAN_CELL_LOW_VOLT_L2",
    "CAN_TOTAL_HIGH_VOLT_L2",
    "CAN_TOTAL_LOW_VOLT_L2",
  ],
  vcu: [
    "POWER",
    "BLUETOOTH",
    "AIRPLANE",
    "HANDLELOCK",
    "SEATLOCK",
    "LED",
    "BOARDRESTART",
    "rideOSRESTART",
    "AOSPOTA",
    "MCUOTA",
    "rideOSOTA",
  ],
  advance: ["CUSTOM_CAN_COMMAND"],
};

const validateCommand = () => {

  if (mode === "ADVANCED") {
    if (!isValidCanId(form.canId)) {
      setStatus("CAN ID must be 8 HEX chars");
      return false;
    }
    if (!isValidCanData(form.canData)) {
      setStatus("CAN DATA must be 16 HEX chars");
      return false;
    }
    return true;
  }

  if (!form.commandType) {
    setStatus("Please select a command");
    return false;
  }

  // ✅ Allow restart / OTA commands
 const restartCommands = [
 "RESTART",
 "BOARDRESTART",
 "rideOSRESTART",
 "AOSPOTA",
 "MCUOTA",
 "rideOSOTA",
 "SEATLOCK"

]
  if (restartCommands.includes(form.commandType)) {
    return true;
  }

  if (
    ["POWER","BLUETOOTH","AIRPLANE","LED"].includes(form.commandType) &&
    !form.value
  ) {
    setStatus("Please select ON or OFF");
    return false;
  }

  if (form.commandType === "CAN_RAW") {
    if (!isValidCanId(form.canId)) {
      setStatus("CAN ID must be 8 HEX chars");
      return false;
    }
    if (!isValidCanData(form.canData)) {
      setStatus("CAN DATA must be 16 HEX chars");
      return false;
    }
  }

  return true;
};

 useEffect(() => {
  setForm(prev => ({
    ...prev,
    commandType: "",
    canId: "",
    canData: ""
  }));
}, [mode]);


useEffect(() => {
  if (form.commandType !== "CAN_GEAR_CTRL") {
    setForm((prev) => ({
      ...prev,
      gear: "",
    }));
  }
}, [form.commandType]);

useEffect(() => {
  if (form.commandType !== "CAN_CRUISE_CTRL") {
    setForm((prev) => ({
      ...prev,
      cruise: "",
    }));
  }
}, [form.commandType]);


useEffect(() => {
  if (form.commandType !== "CAN_BMS_RATED_CAPACITY") {
    setForm((prev) => ({
      ...prev,
      bmsRatedCapacity: "",
    }));
  }
}, [form.commandType]);


const openConfirmPopup = (e) => {
  if (e) e.preventDefault(); // SAFE for buttons
  if (!validateCommand()) return;
  setShowConfirm(true);
};


useEffect(() => {
  if (form.commandType === "CAN_SAVE") {
    setForm(prev => ({
      ...prev,
      saveCommand: false
    }));
  }
}, [form.commandType]);


useEffect(() => {
  if (moduleType !== "CONTROLLER") {
    setForm(prev => ({
      ...prev,
      saveCommand: false
    }));
  }
}, [moduleType]);


const sendCommand = async () => {
  let backendCommandType = "CAN";
  let finalValue = "";


 const shouldSave = form.saveCommand;

  console.log("Checkbox value:", shouldSave);

  // schedule save command once
  if (shouldSave) {
    setTimeout(() => {

      const savePayload = {
        vinNumber: form.vinNumber,
        commandType: "CAN",
        value: "FFAA550103001510F8A8070000000000007387",
        clientId: "COMMANDCENTER",
      };

      console.log("💾 Sending Save Command:", savePayload);

      fetch(
        "https://sb.rivotmotors.com/scooter/command",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savePayload),
        }
      );

    }, 2000);
  }

  /* ========= ADVANCED ========= */
  if (mode === "ADVANCED") {
    if (!isValidCanId(form.canId)) {
      setStatus("CAN ID must be 8 HEX chars");
      return;
    }
    if (!isValidCanData(form.canData)) {
      setStatus("CAN DATA must be 16 HEX chars");
      return;
    }

    finalValue = `FFAA5501030015${form.canId}${form.canData}`;
  }

  /* ========= BASIC ========= */
else {
  backendCommandType = form.commandType;

  const simpleCommands = [
    "POWER",
    "BLUETOOTH",
    "AIRPLANE",
    "HANDLELOCK",
    "SEATLOCK",
    "LED"
  ];

  if (simpleCommands.includes(form.commandType)) {
    backendCommandType = form.commandType;
    finalValue = form.value;
  }
const restartCommands = [
 "RESTART",
 "BOARDRESTART",
 "rideOSRESTART",
 "AOSPOTA",
 "MCUOTA",
 "rideOSOTA",
 "SEATLOCK"
];

if (restartCommands.includes(form.commandType)) {
  finalValue = "1";
}

if (form.commandType === "CAN_SAVE") {
  backendCommandType = "CAN";

  finalValue = "FFAA550103001510F8A8070000000000007387";
}

  if (form.commandType === "CAN_RAW") {
    backendCommandType = "CAN";
    finalValue = `FFAA5501030015${form.canId}${form.canData}`;
  }
                  
if (form.commandType === "CAN_SET_RPM") {
  backendCommandType = "CAN";

  // RPM must come from user
  const rpm = Number(form.rpm);

  // ✅ Defaults
  const duration = form.boostDuration
    ? Number(form.boostDuration)
    : 5;

  const interval = form.boostInterval
    ? Number(form.boostInterval)
    : 30;

  // ✅ Conversions (safe)
  const rpmHex = swapBytes(decToHex4(rpm));
  const durationHex = decToHex2(duration);
  const intervalHex = decToHex2(interval);

  finalValue = `FFAA550103001510FCA807${rpmHex}00000000${durationHex}${intervalHex}`;
}

  if (form.commandType === "CAN_STE_DURATION") {
  backendCommandType = "CAN";

  // ✅ SAFE DEFAULTS
  const rpm = form.rpm ? Number(form.rpm) : 3600;
  const duration = Number(form.boostDuration); // user input expected
  const interval = form.boostInterval ? Number(form.boostInterval) : 30;

  // ✅ CONVERSIONS
  const rpmHex = swapBytes(decToHex4(rpm));
  const durationHex = decToHex2(duration);
  const intervalHex = decToHex2(interval);

  finalValue = `FFAA550103001510FCA807${rpmHex}00000000${durationHex}${intervalHex}`;
}

  if (form.commandType === "CAN_SET_INTRVAL") {
  backendCommandType = "CAN";

  // ✅ SAFE DEFAULTS
  const rpm = form.rpm ? Number(form.rpm) : 3600;
  const duration = form.boostDuration ? Number(form.boostDuration) : 5;
  const interval = Number(form.boostInterval); // required

  // ✅ CONVERSIONS (now always safe)
  const rpmHex = swapBytes(decToHex4(rpm));
  const durationHex = decToHex2(duration);
  const intervalHex = decToHex2(interval);

  finalValue = `FFAA550103001510FCA807${rpmHex}00000000${durationHex}${intervalHex}`;
}

if (form.commandType === "CAN_CURRENT") {
  backendCommandType = "CAN";

  // Fixed parts
  const HEADER = "FFAA5501030015";
  const CAN_ID = "10FBA807";

  // ✅ Apply defaults safely
  const lineCurrent = form.lineCurrent
    ? Number(form.lineCurrent)
    : 0;

  const phaseCurrent = form.phaseCurrent
    ? Number(form.phaseCurrent)
    : 300;

  const regenMin = form.regenMin
    ? Number(form.regenMin)
    : 30;

  const regenMax = form.regenMax
    ? Number(form.regenMax)
    : 40;

  // Convert to CAN hex
  const lineHex = currentToHex(lineCurrent);
  const regenMinHex = currentToHex(regenMin);
  const phaseHex = currentToHex(phaseCurrent);
  const regenMaxHex = currentToHex(regenMax);

  // Payload (little-endian packed)
  const payload = `${lineHex}${regenMinHex}${phaseHex}${regenMaxHex}`;

  finalValue = `${HEADER}${CAN_ID}${payload}`;
}

if (form.commandType === "CAN_PASH_CURRENT") {
  backendCommandType = "CAN";

  // Fixed parts
  const HEADER = "FFAA5501030015";
  const CAN_ID = "10FBA807";

  // ✅ Apply defaults safely
  const lineCurrent = form.lineCurrent
    ? Number(form.lineCurrent)
    : 100;

  const phaseCurrent = form.phaseCurrent
    ? Number(form.phaseCurrent)
    : 0;

  const regenMin = form.regenMin
    ? Number(form.regenMin)
    : 30;

  const regenMax = form.regenMax
    ? Number(form.regenMax)
    : 40;

  // Convert to CAN hex
  const lineHex = currentToHex(lineCurrent);
  const regenMinHex = currentToHex(regenMin);
  const phaseHex = currentToHex(phaseCurrent);
  const regenMaxHex = currentToHex(regenMax);
  // Payload (little-endian packed)
  const payload = `${lineHex}${regenMinHex}${phaseHex}${regenMaxHex}`;

  finalValue = `${HEADER}${CAN_ID}${payload}`;
}

if (form.commandType === "CAN_REGEN_MIN") {
  backendCommandType = "CAN";

  // Fixed parts
  const HEADER = "FFAA5501030015";
  const CAN_ID = "10FBA807";

  // ✅ Apply defaults safely
  const lineCurrent = form.lineCurrent
    ? Number(form.lineCurrent)
    : 100;

  const phaseCurrent = form.phaseCurrent
    ? Number(form.phaseCurrent)
    : 300;

  const regenMin = form.regenMin
    ? Number(form.regenMin)
    : 0;

  const regenMax = form.regenMax
    ? Number(form.regenMax)
    : 40;
  // Convert to CAN hex
  const lineHex = currentToHex(lineCurrent);
  const regenMinHex = currentToHex(regenMin);
  const phaseHex = currentToHex(phaseCurrent);
  const regenMaxHex = currentToHex(regenMax);

  // Payload (little-endian packed)
  const payload = `${lineHex}${regenMinHex}${phaseHex}${regenMaxHex}`;

  finalValue = `${HEADER}${CAN_ID}${payload}`;
}

if (form.commandType === "CAN_REGEN_MAX") {
  backendCommandType = "CAN";

  // Fixed parts
  const HEADER = "FFAA5501030015";
  const CAN_ID = "10FBA807";

  // ✅ Apply defaults safely
  const lineCurrent = form.lineCurrent
    ? Number(form.lineCurrent)
    : 100;

  const phaseCurrent = form.phaseCurrent
    ? Number(form.phaseCurrent)
    : 300;

  const regenMin = form.regenMin
    ? Number(form.regenMin)
    : 30;

  const regenMax = form.regenMax
    ? Number(form.regenMax)
    : 0;

  // Convert to CAN hex
  const lineHex = currentToHex(lineCurrent);
  const regenMinHex = currentToHex(regenMin);
  const phaseHex = currentToHex(phaseCurrent);
  const regenMaxHex = currentToHex(regenMax);

  // Payload (little-endian packed)
  const payload = `${lineHex}${regenMinHex}${phaseHex}${regenMaxHex}`;

  finalValue = `${HEADER}${CAN_ID}${payload}`;
}

if (form.commandType === "CAN_GEAR_CTRL") {
  backendCommandType = "CAN";

  const HEADER = "FFAA5501030015";
  const CAN_ID = "10F8A807"; 
                  
  const gearMap = {
    NEUTRAL: "040001020E007387",
    FORWARD: "050001020E007387",
    BACKWARD: "060001020E007387",
  };

  if (!form.gear || !gearMap[form.gear]) {
    setStatus("Please select gear mode");
    return;
  }

  finalValue = `${HEADER}${CAN_ID}${gearMap[form.gear]}`;
}

if (form.commandType === "CAN_CRUISE_CTRL") {
  backendCommandType = "CAN";

  const HEADER = "FFAA5501030015";
  const CAN_ID = "10F8A807";

  const cruiseMap = {
    ON: "040001020E007387", 
    OFF: "0400010200007387",
  };

  if (!form.cruise || !cruiseMap[form.cruise]) {
    setStatus("Please select Cruise ON or OFF");
    return;
  }

  finalValue = `${HEADER}${CAN_ID}${cruiseMap[form.cruise]}`;
}

if (form.commandType === "CAN_RATED_CAPACITY") {
  backendCommandType = "CAN";

  if (!form.capacityValue) {
    setStatus("Please enter rated capacity");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16060180";

  // 60 × 1000 = 60000 → EA60
  const decimalValue = Number(form.capacityValue) * 1000;
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  const CAN_DATA = `0000${hexValue}00000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_REMAINING_CAPACITY") {
  backendCommandType = "CAN";

  if (!form.remainingCapacityValue) {
    setStatus("Please enter remaining capacity");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16080180";

  const decimalValue = Number(form.remainingCapacityValue) * 1000;
  let hexValue = decimalValue.toString(16).toUpperCase();
  hexValue = hexValue.padStart(8, "0");

  const CAN_DATA = `${hexValue}00000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_TOTAL_DISCHARGING_AH") {
  backendCommandType = "CAN";

  if (!form.totalDischargingAh) {
    setStatus("Please enter total discharging Ah");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "160C0180";

  // Step 1: multiply by 1000
  const decimalValue = Number(form.totalDischargingAh) * 1000;

  // Step 2: decimal → hex
  let hexValue = decimalValue.toString(16).toUpperCase();

  // Step 3: LEFT padding → first 4 bytes (8 hex chars)
  hexValue = hexValue.padStart(8, "0");

  // Step 4: value in first 4 bytes, rest zero
  const CAN_DATA = hexValue + "00000000";

  finalValue = HEADER + CAN_ID + CAN_DATA;
}

if (form.commandType === "CAN_BALANCING_CURRENT") {
  backendCommandType = "CAN";

  if (!form.balanceCurrent) {
    setStatus("Please enter balancing current");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16120180";

  // 1A → ×10 → 10 → 0A
  const decimalValue = Number(form.balanceCurrent) * 10;

  const hexValue = Math.round(decimalValue)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0"); // FIRST 2 BYTES ONLY

  const CAN_DATA = `${hexValue}000000000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_CHG_TEMP_HIGH_L2") {
  backendCommandType = "CAN";

  if (!form.tempValue) {
    setStatus("Please enter temperature value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16860180"; // keep same as spec

  // temperature + offset
  const adjustedTemp = Number(form.tempValue) + 40;

  // decimal → hex (1 byte)
  const hexTemp = adjustedTemp
    .toString(16)
    .toUpperCase()
    .padStart(2, "0");

  // FF 02 21 00 XX 00 00 00
  const CAN_DATA = `FF022100${hexTemp}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_DES_TEMP_HIGH_L2") {
  backendCommandType = "CAN";

  if (!form.tempValue) {
    setStatus("Please enter temperature value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16870180"; // keep same as spec
                  
  // temperature + offset
  const adjustedTemp = Number(form.tempValue) + 40;

  // decimal → hex (1 byte)
  const hexTemp = adjustedTemp
    .toString(16)
    .toUpperCase()
    .padStart(2, "0");

  // FF 02 21 00 XX 00 00 00
  const CAN_DATA = `FF022100${hexTemp}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_CHG_OVERCURRENT_L2") {
  backendCommandType = "CAN";

  if (!form.overCurrent) {
    setStatus("Please enter overcurrent value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16840180"; 

  // 90A → 90×10 = 900 → +30000 = 30900
  const decimalValue = 30000 + Number(form.overCurrent) * 10;

  // 30900 → 78B4
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  // LEFT → RIGHT placement (NO swap)
  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_DISCHG_OVERCURRENT_L2") {
  backendCommandType = "CAN";

  if (!form.overCurrent) {
    setStatus("Please enter discharge overcurrent value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16850180";

  // 90A → 90×10 = 900 → 30000 - 900 = 29100
  const decimalValue = 30000 - Number(form.overCurrent) * 10;
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

  if (form.commandType === "CAN_MANUAL_SOC") {
  backendCommandType = "CAN";

  if (!form.manualSoc) {
    setStatus("Please enter SOC value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "161E0180";

  // 90% → 90×10 = 900 → 0x0384
  const decimalValue = Number(form.manualSoc) * 10;
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0"); // first 2 bytes

  // XX XX 00 00 00 00 00 00
  const CAN_DATA = `${hexValue}000000000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_SOC_LOW_L2") {
  backendCommandType = "CAN";

  if (!form.socValue) {
    setStatus("Please enter SOC value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "168C0180";

  // 7% → 7×10 = 70 → 0x46
  const decimalValue = Number(form.socValue) * 10;

  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0"); // byte-4 & byte-5

  // FF 02 21 00 XX 00 00 00
  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}


if (form.commandType === "CAN_CHG_MOSFET") {
  backendCommandType = "CAN";

  if (!form.mosfetState) {
    setStatus("Please select ON or OFF");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "162A0180";

  const CAN_DATA =
    form.mosfetState === "ON"
      ? "0101020304050607"
      : "0001020304050607";

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_DISCHG_MOSFET") {
  backendCommandType = "CAN";

  if (!form.mosfetState) {
    setStatus("Please select ON or OFF");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "162C0180";

  const CAN_DATA =
    form.mosfetState === "ON"
      ? "0101020304050607"
      : "0001020304050607"; // ✅ NO SPACES

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_BMS_REBOOT") {
  backendCommandType = "CAN";
                  
  const HEADER = "FFAA5501030015";
  const CAN_ID = "163A0180";  
  const CAN_DATA = "0000000000000000";

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}


if (form.commandType === "CAN_CELL_VOLT_DIFF_L2") {
  backendCommandType = "CAN";

  if (!form.voltDiff) {
    setStatus("Please enter voltage difference value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "168A0180";

  // 9 × 1000 = 9000 → 2328
  const decimalValue = Number(form.voltDiff) * 1000;
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  // Replace ONLY 4th & 5th byte
  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}


if (form.commandType === "CAN_CELL_HIGH_VOLT_L2") {
  backendCommandType = "CAN";

  if (!form.cellHighVolt) {
    setStatus("Please enter cell high voltage value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16800180";

  // 3.69 × 1000 = 3690 → 0E6A
  const decimalValue = Math.round(Number(form.cellHighVolt) * 1000);
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  // Replace ONLY 4th & 5th byte
  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_CELL_LOW_VOLT_L2") {
  backendCommandType = "CAN";

  if (!form.cellLowVolt) {
    setStatus("Please enter cell low voltage value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16820180";

  // 2.5 × 1000 = 2500 → 09C4
  const decimalValue = Math.round(Number(form.cellLowVolt) * 1000);
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}


if (form.commandType === "CAN_TOTAL_HIGH_VOLT_L2") {
  backendCommandType = "CAN";

  if (!form.totalHighVolt) {
    setStatus("Please enter total high voltage value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16810180";

  // 86V → 860 → 035C → 5C03 (little endian)
  const decimalValue = Math.round(Number(form.totalHighVolt) * 10);

  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  const valueLE = swapBytes(hexValue);

  // FF 02 21 [LSB MSB] 00 00 00
  const CAN_DATA = `FF0221${valueLE}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_TOTAL_LOW_VOLT_L2") {
  backendCommandType = "CAN";

  if (!form.totalLowVolt) {
    setStatus("Please enter total low voltage value");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16830180";

  // 52 × 10 = 520 → 01FE
  const decimalValue = Number(form.totalLowVolt) * 10;
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  const CAN_DATA = `FF0221${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_NTC_TEMP_DIFF_L2") {
  backendCommandType = "CAN";

  if (!form.ntcTempDiff) {
    setStatus("Please enter NTC temperature difference");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "168B0180";

  // 50 → 32
  const hexValue = Number(form.ntcTempDiff)
    .toString(16)
    .toUpperCase()
    .padStart(2, "0");

  const CAN_DATA = `FF022100${hexValue}000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_TOTAL_CHARGING_AH") {
  backendCommandType = "CAN";

  if (!form.totalChargingAh) {
    setStatus("Please enter total charging Ah");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "160A0180";

  // Multiply by 1000
  const decimalValue = Number(form.totalChargingAh) * 1000;

  // Decimal → HEX
  let hexValue = decimalValue.toString(16).toUpperCase();

  // Make exactly 8 HEX chars (4 bytes)
  hexValue = hexValue.padStart(8, "0");

  // CAN DATA: first 4 bytes value, rest zero
  const CAN_DATA = `${hexValue}00000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}

if (form.commandType === "CAN_BMS_RATED_CAPACITY") {
  backendCommandType = "CAN";

  if (!form.bmsRatedCapacity) {
    setStatus("Please enter rated capacity");
    return;
  }

  const HEADER = "FFAA5501030015";
  const CAN_ID = "16060180";

  // 60 → 60000 → EA60
  const decimalValue = Number(form.bmsRatedCapacity) * 1000;
  const hexValue = decimalValue
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  const CAN_DATA = `0000${hexValue}00000000`;

  finalValue = `${HEADER}${CAN_ID}${CAN_DATA}`;
}
  }

  /* ========= API (FOR BOTH MODES) ========= */
  console.log("CommandType from form:", form.commandType);
console.log("Backend CommandType:", backendCommandType);

  const payload = {
    vinNumber: form.vinNumber,
    commandType: backendCommandType,
    value: finalValue,
    clientId: "COMMANDCENTER",
  };

  console.log("🚀 Sending payload:", payload);

  setLoading(true);
  setStatus("Sending command...");

   try {
    const res = await fetch(
      "https://sb.rivotmotors.com/scooter/command",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setStatus(res.ok ? "Command sent successfully" : "Command failed");

  } catch (err) {
    setStatus("Network error");
  } finally {
    setLoading(false);
  }
};







  useEffect(() => {
    if (vin) {
      setForm((prev) => ({ ...prev, vinNumber: vin }));
    }
  }, [vin]);

  // Auto-set AIRPLANE value
  useEffect(() => {
    if (form.commandType === "AIRPLANE") {
      setForm((prev) => ({ ...prev, value: "1" }));
    }
  }, [form.commandType]);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const setValue = (val) => {
    setForm((prev) => ({ ...prev, value: val }));
  };

  /* ================= VALIDATIONS ================= */
  const isHex = (val) => /^[0-9A-F]+$/.test(val);
  const isValidCanId = (id) => id.length === 8 && isHex(id);
  const isValidCanData = (data) => data.length === 16 && isHex(data);

  const handleRestart = async () => {
  const payload = {
    vinNumber: form.vinNumber,
    commandType: "RESTART",
    value: "1",
    clientId: "COMMANDCENTER",
  };

  setLoading(true);
  setStatus("Restarting vehicle...");

  try {
    const res = await fetch(
      "https://sb.rivotmotors.com/scooter/command",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    setStatus(res.ok ? "Vehicle restart command sent" : "Restart failed");
  } catch (err) {
    console.error(err);
    setStatus("Network error");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (mode === "ADVANCED") return;

  if (
    form.commandType !== "CAN_RAW" &&
    form.commandType !== "CAN_SET_RPM"
  ) {
    setForm(prev => ({
      ...prev,
      canId: "",
      canData: "",
    }));
  }
}, [form.commandType, mode]);


const clearField = (field) => {
  setForm((prev) => ({ ...prev, [field]: "" }));
};

  const handleHexInput = (e, maxLength) => {
  const value = e.target.value
    .toUpperCase()
    .replace(/[^0-9A-F]/g, ""); // allow HEX only

  if (value.length <= maxLength) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));
  }
};

useEffect(() => {
  if (!status) return;

  const timer = setTimeout(() => {
    setStatus("");
  }, 3000); // ⏱ 4 seconds (you can change to 3000 or 5000)

  return () => clearTimeout(timer);
}, [status]);


  /* ================= REDESIGNED COMMAND UI ================= */

  const rootRef = useRef(null);
  const [frameHeight, setFrameHeight] = useState(null);

  /* Fill the available area inside <main> so the page fits one screen without
     hardcoding the header or sidebar dimensions. */
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let frame = 0;

    const measure = () => {
      const parent = el.parentElement;
      const parentStyle = parent ? window.getComputedStyle(parent) : null;
      const parentPaddingBottom = parentStyle
        ? parseFloat(parentStyle.paddingBottom) || 0
        : 0;

      const next = Math.max(
        560,
        Math.floor(
          window.innerHeight -
            el.getBoundingClientRect().top -
            parentPaddingBottom
        )
      );

      setFrameHeight((prev) => (prev === next ? prev : next));
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(measure);
      });
    };

    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

    let observer;
    if (typeof ResizeObserver !== "undefined" && el.parentElement) {
      observer = new ResizeObserver(schedule);
      observer.observe(el.parentElement);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      observer?.disconnect();
    };
  }, []);

  /* Number field configuration for every BMS numeric command. */
  const bmsFieldConfig = {
    CAN_RATED_CAPACITY: {
      field: "capacityValue",
      label: "Rated Capacity",
      unit: "Ah",
      placeholder: "e.g. 60",
      step: 1,
      min: 0,
    },
    CAN_REMAINING_CAPACITY: {
      field: "remainingCapacityValue",
      label: "Remaining Capacity",
      unit: "Ah",
      placeholder: "e.g. 80",
      step: 1,
      min: 0,
    },
    CAN_MANUAL_SOC: {
      field: "manualSoc",
      label: "Manual SOC",
      unit: "%",
      placeholder: "e.g. 90",
      step: 1,
      min: 0,
      max: 100,
    },
    CAN_TOTAL_CHARGING_AH: {
      field: "totalChargingAh",
      label: "Total Charging Ah",
      unit: "Ah",
      placeholder: "e.g. 60",
      step: 1,
      min: 0,
    },
    CAN_TOTAL_DISCHARGING_AH: {
      field: "totalDischargingAh",
      label: "Total Discharging Ah",
      unit: "Ah",
      placeholder: "e.g. 60",
      step: 1,
      min: 0,
    },
    CAN_BALANCING_CURRENT: {
      field: "balanceCurrent",
      label: "Balancing Current",
      unit: "A",
      placeholder: "e.g. 1.5",
      step: 0.1,
      min: 0,
    },
    CAN_CHG_TEMP_HIGH_L2: {
      field: "tempValue",
      label: "Charging Temp High Fault – L2",
      unit: "°C",
      placeholder: "e.g. 90",
      step: 1,
    },
    CAN_DES_TEMP_HIGH_L2: {
      field: "tempValue",
      label: "Discharging Temp High Fault – L2",
      unit: "°C",
      placeholder: "e.g. 90",
      step: 1,
    },
    CAN_CHG_OVERCURRENT_L2: {
      field: "overCurrent",
      label: "Charge Overcurrent Fault – L2",
      unit: "A",
      placeholder: "e.g. 90",
      step: 1,
      min: 0,
    },
    CAN_DISCHG_OVERCURRENT_L2: {
      field: "overCurrent",
      label: "Discharge Overcurrent Fault – L2",
      unit: "A",
      placeholder: "e.g. 90",
      step: 1,
      min: 0,
    },
    CAN_SOC_LOW_L2: {
      field: "socValue",
      label: "SOC Too Low Fault – L2",
      unit: "%",
      placeholder: "e.g. 7",
      step: 1,
      min: 0,
      max: 100,
    },
    CAN_NTC_TEMP_DIFF_L2: {
      field: "ntcTempDiff",
      label: "NTC Temperature Difference – L2",
      unit: "°C",
      placeholder: "e.g. 50",
      step: 1,
      min: 0,
    },
    CAN_CELL_VOLT_DIFF_L2: {
      field: "voltDiff",
      label: "Cell Voltage Difference – L2",
      unit: "mV",
      placeholder: "e.g. 90",
      step: 1,
      min: 0,
    },
    CAN_CELL_HIGH_VOLT_L2: {
      field: "cellHighVolt",
      label: "Cell Voltage High – L2",
      unit: "V",
      placeholder: "e.g. 3.69",
      step: 0.01,
      min: 0,
    },
    CAN_CELL_LOW_VOLT_L2: {
      field: "cellLowVolt",
      label: "Cell Voltage Low – L2",
      unit: "V",
      placeholder: "e.g. 2.5",
      step: 0.01,
      min: 0,
    },
    CAN_TOTAL_HIGH_VOLT_L2: {
      field: "totalHighVolt",
      label: "Total High Voltage – L2",
      unit: "V",
      placeholder: "e.g. 86",
      step: 1,
      min: 0,
    },
    CAN_TOTAL_LOW_VOLT_L2: {
      field: "totalLowVolt",
      label: "Total Low Voltage – L2",
      unit: "V",
      placeholder: "e.g. 52",
      step: 1,
      min: 0,
    },
  };

  const bmsGroups = [
    {
      title: "Battery Capacity",
      commands: [
        "CAN_RATED_CAPACITY",
        "CAN_REMAINING_CAPACITY",
        "CAN_MANUAL_SOC",
      ],
    },
    {
      title: "Charging and Discharging",
      commands: [
        "CAN_TOTAL_CHARGING_AH",
        "CAN_TOTAL_DISCHARGING_AH",
        "CAN_BALANCING_CURRENT",
      ],
    },
    {
      title: "Temperature Protection",
      commands: [
        "CAN_CHG_TEMP_HIGH_L2",
        "CAN_DES_TEMP_HIGH_L2",
        "CAN_NTC_TEMP_DIFF_L2",
      ],
    },
    {
      title: "Current and SOC Protection",
      commands: [
        "CAN_CHG_OVERCURRENT_L2",
        "CAN_DISCHG_OVERCURRENT_L2",
        "CAN_SOC_LOW_L2",
      ],
    },
    {
      title: "MOSFET Control",
      commands: ["CAN_CHG_MOSFET", "CAN_DISCHG_MOSFET"],
    },
    {
      title: "Cell Voltage Protection",
      commands: [
        "CAN_CELL_VOLT_DIFF_L2",
        "CAN_CELL_HIGH_VOLT_L2",
        "CAN_CELL_LOW_VOLT_L2",
        "CAN_TOTAL_HIGH_VOLT_L2",
        "CAN_TOTAL_LOW_VOLT_L2",
      ],
    },
    {
      title: "System Operations",
      commands: ["CAN_BMS_REBOOT"],
    },
  ];

  const vcuGroups = [
    {
      title: "Power and Connectivity",
      commands: ["POWER", "BLUETOOTH", "AIRPLANE"],
    },
    {
      title: "Access and Lighting",
      commands: ["HANDLELOCK", "SEATLOCK", "LED"],
    },
    {
      title: "System and Updates",
      commands: [
        "BOARDRESTART",
        "rideOSRESTART",
        "AOSPOTA",
        "MCUOTA",
        "rideOSOTA",
      ],
    },
  ];

  const moduleMeta = {
    controller: {
      label: "CONTROLLER",
      title: "Controller",
      icon: Cpu,
      blurb: "Motor controller tuning",
    },
    bms: {
      label: "BMS",
      title: "Battery Management",
      icon: Battery,
      blurb: "Pack protection and capacity",
    },
    vcu: {
      label: "VCU",
      title: "Vehicle Control Unit",
      icon: Car,
      blurb: "Vehicle level functions",
    },
    advance: {
      label: "ADVANCE",
      title: "Advanced CAN",
      icon: Terminal,
      blurb: "Raw CAN frame builder",
    },
  };

  const navGroups = {
    controller: [
      { title: "Drive and Current", commands: commands.controller },
    ],
    bms: bmsGroups,
    vcu: vcuGroups,
    advance: [{ title: "Raw CAN", commands: commands.advance }],
  }[activeModule] || [];

  const commandDescriptions = {
    CAN_SET_RPM:
      "Configure the motor RPM and the boost window applied during acceleration.",
    CAN_CURRENT:
      "Set the line, phase and regen current limits enforced by the controller.",
    CAN_GEAR_CTRL:
      "Select the drive direction mapped to the controller gear input.",
    CAN_CRUISE_CTRL: "Enable or disable the cruise control function.",
    CAN_RATED_CAPACITY: "Nominal capacity of the battery pack.",
    CAN_REMAINING_CAPACITY:
      "Remaining capacity currently reported by the battery pack.",
    CAN_MANUAL_SOC: "Force the BMS state of charge to a manual value.",
    CAN_TOTAL_CHARGING_AH:
      "Lifetime ampere-hour counter for energy charged into the pack.",
    CAN_TOTAL_DISCHARGING_AH:
      "Lifetime ampere-hour counter for energy drawn from the pack.",
    CAN_BALANCING_CURRENT:
      "Cell balancing current applied by the battery management system.",
    CAN_CHG_TEMP_HIGH_L2:
      "Level 2 charging temperature high fault threshold.",
    CAN_DES_TEMP_HIGH_L2:
      "Level 2 discharging temperature high fault threshold.",
    CAN_CHG_OVERCURRENT_L2:
      "Level 2 charge overcurrent fault threshold.",
    CAN_DISCHG_OVERCURRENT_L2:
      "Level 2 discharge overcurrent fault threshold.",
    CAN_SOC_LOW_L2: "Level 2 state of charge low fault threshold.",
    CAN_NTC_TEMP_DIFF_L2:
      "Maximum allowed temperature difference between NTC sensors.",
    CAN_CHG_MOSFET: "Switch the charging MOSFET on or off.",
    CAN_DISCHG_MOSFET: "Switch the discharging MOSFET on or off.",
    CAN_BMS_REBOOT:
      "Reboot the battery management system. The pack will briefly go offline.",
    CAN_CELL_VOLT_DIFF_L2:
      "Level 2 cell voltage difference fault threshold.",
    CAN_CELL_HIGH_VOLT_L2:
      "Level 2 single cell high voltage fault threshold.",
    CAN_CELL_LOW_VOLT_L2:
      "Level 2 single cell low voltage fault threshold.",
    CAN_TOTAL_HIGH_VOLT_L2: "Level 2 total pack high voltage threshold.",
    CAN_TOTAL_LOW_VOLT_L2: "Level 2 total pack low voltage threshold.",
    POWER: "Turn the scooter power rail on or off.",
    BLUETOOTH: "Enable or disable the vehicle Bluetooth radio.",
    AIRPLANE: "Enable or disable airplane mode on the vehicle.",
    HANDLELOCK: "Lock or unlock the handlebar lock.",
    SEATLOCK: "Release the seat lock.",
    LED: "Switch the vehicle LED lighting on or off.",
    BOARDRESTART: "Restart the vehicle control board.",
    rideOSRESTART: "Restart the rideOS operating system.",
    AOSPOTA: "Trigger an AOSP over-the-air update.",
    MCUOTA: "Trigger an MCU over-the-air update.",
    rideOSOTA: "Trigger a rideOS over-the-air update.",
    CUSTOM_CAN_COMMAND:
      "Send a raw CAN frame to the vehicle with a custom CAN ID and payload.",
  };

  const activeMeta = moduleMeta[activeModule] || moduleMeta.controller;
  const ActiveModuleIcon = activeMeta.icon;
  const commandTitle =
    commandLabels[selectedCommand] || selectedCommand || "";
  const commandDescription =
    commandDescriptions[selectedCommand] || "Send this command to the vehicle.";
  const navCount = navGroups.reduce(
    (total, group) => total + group.commands.length,
    0
  );

  const statusTone = status.includes("success")
    ? "is-success"
    : status.includes("fail") || status.includes("error")
    ? "is-error"
    : "is-info";

  /* Presentation-only readiness check; validation itself stays in validateCommand. */
  const commandReady = (() => {
    if (mode === "ADVANCED") {
      return form.canId.length === 8 && form.canData.length === 16;
    }

    const cmd = form.commandType;
    if (!cmd) return false;

    if (cmd === "CAN_GEAR_CTRL") return Boolean(form.gear);
    if (cmd === "CAN_CRUISE_CTRL") return Boolean(form.cruise);
    if (
      ["POWER", "BLUETOOTH", "AIRPLANE", "LED", "HANDLELOCK"].includes(cmd)
    ) {
      return Boolean(form.value);
    }
    if (["CAN_CHG_MOSFET", "CAN_DISCHG_MOSFET"].includes(cmd)) {
      return Boolean(form.mosfetState);
    }

    const bmsField = bmsFieldConfig[cmd];
    if (bmsField) {
      const raw = form[bmsField.field];
      return raw !== undefined && raw !== null && String(raw).trim() !== "";
    }

    return true;
  })();

  const switchModule = (module) => {
    setActiveModule(module);
    setSelectedCommand(null);
    setShowConfirm(false);
    setStatus("");
    setMode(module === "advance" ? "ADVANCED" : "BASIC");
    setModuleType(module === "advance" ? "ADVANCE" : module.toUpperCase());
  };

  const selectCommand = (cmd) => {
    setSelectedCommand(cmd);
    setForm((prev) => ({ ...prev, commandType: cmd }));
    setShowConfirm(false);
    setStatus("");
  };

  const sliderFill = (value, min, max) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || max === min) return "0%";
    const percent = ((numeric - min) / (max - min)) * 100;
    return `${Math.min(100, Math.max(0, percent))}%`;
  };

  const renderSlider = ({
    title,
    hint,
    value,
    unit,
    min,
    max,
    step = 1,
    accent = "#FF9913",
    onChange,
  }) => (
    <div className="rvsc-card" key={title}>
      <div className="rvsc-cardhead">
        <div>
          <div className="rvsc-cardtitle">{title}</div>
          <div className="rvsc-cardhint">{hint}</div>
        </div>
        <div className="rvsc-value" style={{ color: accent }}>
          {value}
          <span className="rvsc-unit">{unit}</span>
        </div>
      </div>

      <input
        type="range"
        className="rvsc-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          "--rvsc-accent": accent,
          "--rvsc-fill": sliderFill(value, min, max),
        }}
      />

      <div className="rvsc-range">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );

  const renderOption = ({
    value,
    label,
    description,
    glyph,
    active,
    onSelect,
  }) => (
    <button
      key={value}
      type="button"
      className={`rvsc-option${active ? " is-active" : ""}`}
      onClick={onSelect}
      aria-pressed={active}
    >
      <span className="rvsc-option-icon">{glyph}</span>
      <span className="rvsc-option-label">{label}</span>
      <span className="rvsc-option-desc">{description}</span>
      {active ? <Check size={15} className="rvsc-option-check" /> : null}
    </button>
  );

  const renderSummaryCard = ({ title, hint, badge, rows }) => (
    <div className="rvsc-card">
      <div className="rvsc-cardhead">
        <div>
          <div className="rvsc-cardtitle">{title}</div>
          <div className="rvsc-cardhint">{hint}</div>
        </div>
        <span className="rvsc-unitbadge">{badge}</span>
      </div>

      <div className="rvsc-inforows">
        {rows.map(([label, value]) => (
          <div className="rvsc-kv" key={label}>
            <span className="rvsc-k">{label}</span>
            <span className="rvsc-v mono">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInfoCard = (extraRows = []) =>
    renderSummaryCard({
      title: "Command details",
      hint: "Context for this transmission.",
      badge: "INFO",
      rows: [
        ["Module", activeMeta.title],
        ["Command", form.commandType || selectedCommand || "—"],
        ...extraRows,
        ["Vehicle", vin || "N/A"],
        ["Delivery", "Live vehicle channel"],
      ],
    });

  const renderNumberField = (cmd) => {
    const cfg = bmsFieldConfig[cmd];
    if (!cfg) return null;

    return (
      <div className="rvsc-card">
        <div className="rvsc-cardhead">
          <div>
            <div className="rvsc-cardtitle">{cfg.label}</div>
            <div className="rvsc-cardhint">
              {commandDescriptions[cmd] || "Enter the configuration value."}
            </div>
          </div>
          <span className="rvsc-unitbadge">{cfg.unit}</span>
        </div>

        <div className="rvsc-split">
          <div className="rvsc-split-main">
            <div className="rvsc-inputwrap">
              <input
                type="number"
                className="rvsc-input rvsc-inputunit rvsc-biginput"
                step={cfg.step ?? "any"}
                min={cfg.min}
                max={cfg.max}
                placeholder={cfg.placeholder}
                value={form[cfg.field] || ""}
                onChange={(e) =>
                  setForm({ ...form, [cfg.field]: e.target.value })
                }
                required
              />
              <span className="rvsc-inputsuffix">{cfg.unit}</span>
            </div>

            <div className="rvsc-fieldhint">
              <span>Value in {cfg.unit}</span>
              <span className="rvsc-charcount">
                {cfg.max !== undefined
                  ? `${cfg.min ?? 0} – ${cfg.max} ${cfg.unit}`
                  : `Step ${cfg.step ?? "any"}`}
              </span>
            </div>
          </div>

          <div className="rvsc-inforows rvsc-split-side">
            <div className="rvsc-kv">
              <span className="rvsc-k">Module</span>
              <span className="rvsc-v">{activeMeta.title}</span>
            </div>
            <div className="rvsc-kv">
              <span className="rvsc-k">Command</span>
              <span className="rvsc-v mono">
                {form.commandType || cmd}
              </span>
            </div>
            <div className="rvsc-kv">
              <span className="rvsc-k">Unit</span>
              <span className="rvsc-v">{cfg.unit}</span>
            </div>
            <div className="rvsc-kv">
              <span className="rvsc-k">Vehicle</span>
              <span className="rvsc-v mono">{vin || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActionCard = ({ icon, title, text, warning }) => (
    <div className="rvsc-grid rvsc-cols-2">
      <div className="rvsc-action">
        <span className="rvsc-actionicon">{icon}</span>
        <div>
          <div className="rvsc-actiontitle">{title}</div>
          <div className="rvsc-actiontext">{text}</div>
          {warning ? (
            <span className="rvsc-warn">
              <AlertTriangle size={13} />
              {warning}
            </span>
          ) : null}
        </div>
      </div>

      {renderInfoCard([["Required", "Confirmation"]])}
    </div>
  );

  const renderConfig = () => {
    const cmd = selectedCommand;

    /* ---------- ADVANCE ---------- */
    if (cmd === "CUSTOM_CAN_COMMAND") {
      return (
        <>
          <div className="rvsc-grid rvsc-cols-2">
            <div className="rvsc-card">
              <div className="rvsc-cardhead">
                <div>
                  <div className="rvsc-cardtitle">CAN ID</div>
                  <div className="rvsc-cardhint">
                    8 hexadecimal characters
                  </div>
                </div>
                <span className="rvsc-unitbadge">HEX</span>
              </div>
              <input
                className="rvsc-input rvsc-mono"
                name="canId"
                value={form.canId}
                maxLength={8}
                placeholder="10FCA807"
                onChange={(e) => handleHexInput(e, 8)}
              />
              <div className="rvsc-fieldhint">
                <span>Frame identifier</span>
                <span className="rvsc-charcount">{form.canId.length}/8</span>
              </div>
            </div>

            <div className="rvsc-card">
              <div className="rvsc-cardhead">
                <div>
                  <div className="rvsc-cardtitle">CAN DATA</div>
                  <div className="rvsc-cardhint">
                    16 hexadecimal characters
                  </div>
                </div>
                <span className="rvsc-unitbadge">HEX</span>
              </div>
              <input
                className="rvsc-input rvsc-mono"
                name="canData"
                value={form.canData}
                maxLength={16}
                placeholder="0000000000000000"
                onChange={(e) => handleHexInput(e, 16)}
              />
              <div className="rvsc-fieldhint">
                <span>Payload bytes</span>
                <span className="rvsc-charcount">
                  {form.canData.length}/16
                </span>
              </div>
            </div>
          </div>

          <div className="rvsc-preview">
            <div className="rvsc-preview-label">Payload preview</div>
            <code>{`FFAA5501030015${form.canId}${form.canData}`}</code>
          </div>

          <div className="rvsc-grid rvsc-cols-2 rvsc-gap">
            {renderSummaryCard({
              title: "Frame structure",
              hint: "Segments combined into the transmitted payload.",
              badge: "HEX",
              rows: [
                ["Header", "FFAA5501030015"],
                ["CAN ID", form.canId || "—"],
                ["CAN DATA", form.canData || "—"],
              ],
            })}
            {renderInfoCard([["Encoding", "Hexadecimal"]])}
          </div>
        </>
      );
    }

    /* ---------- CONTROLLER ---------- */
    if (cmd === "CAN_SET_RPM") {
      return (
        <>
          <div className="rvsc-grid rvsc-cols-3">
            {renderSlider({
            title: "Set RPM",
            hint: "Set Max RPM",
            value: form.rpm || 300,
            unit: "RPM",
            min: 0,
            max: 3600,
            step: 1,
            accent: "#38bdf8",
            onChange: (value) => setForm({ ...form, rpm: value }),
          })}
          {renderSlider({
            title: "Boost Duration",
            hint: "Set boost duration time",
            value: form.boostDuration || 5,
            unit: "sec",
            min: 5,
            max: 10,
            step: 1,
            accent: "#22c55e",
            onChange: (value) =>
              setForm({ ...form, boostDuration: value }),
          })}
          {renderSlider({
            title: "Boost Interval",
            hint: "Set boost interval between",
            value: form.boostInterval || 30,
            unit: "sec",
            min: 30,
            max: 60,
            step: 1,
            accent: "#facc15",
            onChange: (value) =>
              setForm({ ...form, boostInterval: value }),
          })}
          </div>

          <div className="rvsc-grid rvsc-cols-2 rvsc-gap">
            {renderSummaryCard({
              title: "Boost cycle",
              hint: "Window the controller applies while accelerating.",
              badge: "SUMMARY",
              rows: [
                ["Max RPM", `${form.rpm || 300} RPM`],
                ["Duration", `${form.boostDuration || 5} sec`],
                ["Interval", `${form.boostInterval || 30} sec`],
              ],
            })}
            {renderInfoCard([["Required", "RPM, duration, interval"]])}
          </div>
        </>
      );
    }

    if (cmd === "CAN_CURRENT") {
      return (
        <>
          <div className="rvsc-section">
            <div className="rvsc-sectionhead">
              <span className="rvsc-sectiontitle">Current limits</span>
            </div>
            <div className="rvsc-grid rvsc-cols-2">
              {renderSlider({
                title: "Line Current",
                hint: "Set line current",
                value: Number(form.lineCurrent || 0),
                unit: "A",
                min: 0,
                max: 100,
                step: 1,
                accent: "#38bdf8",
                onChange: (value) =>
                  setForm({ ...form, lineCurrent: Number(value) }),
              })}
              {renderSlider({
                title: "Phase Current",
                hint: "Set phase current",
                value: Number(form.phaseCurrent || 0),
                unit: "A",
                min: 0,
                max: 300,
                step: 1,
                accent: "#22d3ee",
                onChange: (value) =>
                  setForm({ ...form, phaseCurrent: Number(value) }),
              })}
            </div>
          </div>

          <div className="rvsc-section">
            <div className="rvsc-sectionhead">
              <span className="rvsc-sectiontitle">
                Regen current window
              </span>
            </div>
            <div className="rvsc-grid rvsc-cols-2">
              {renderSlider({
                title: "Regen Current Min",
                hint: "Minimum regen current",
                value: Number(form.regenMin || 0),
                unit: "A",
                min: 0,
                max: 80,
                step: 1,
                accent: "#22c55e",
                onChange: (value) =>
                  setForm({ ...form, regenMin: Number(value) }),
              })}
              {renderSlider({
                title: "Regen Current Max",
                hint: "Maximum regen current",
                value: Number(form.regenMax || 0),
                unit: "A",
                min: 0,
                max: 80,
                step: 1,
                accent: "#facc15",
                onChange: (value) =>
                  setForm({ ...form, regenMax: Number(value) }),
              })}
            </div>
          </div>

          <div className="rvsc-grid rvsc-cols-2 rvsc-gap">
            {renderSummaryCard({
              title: "Current summary",
              hint: "Limits currently staged for this command.",
              badge: "SUMMARY",
              rows: [
                ["Line", `${Number(form.lineCurrent || 0)} A`],
                ["Phase", `${Number(form.phaseCurrent || 0)} A`],
                [
                  "Regen window",
                  `${Number(form.regenMin || 0)} – ${Number(form.regenMax || 0)} A`,
                ],
              ],
            })}
            {renderInfoCard([["Required", "Line, phase, regen"]])}
          </div>
        </>
      );
    }

    if (cmd === "CAN_GEAR_CTRL") {
      return (
        <div className="rvsc-grid rvsc-cols-2">
          <div className="rvsc-options rvsc-stack">
            {renderOption({
              value: "FORWARD",
              label: "Forward",
              description: "Drive the vehicle forward",
              glyph: <ArrowUp size={17} />,
              active: form.gear === "FORWARD",
              onSelect: () => setForm({ ...form, gear: "FORWARD" }),
            })}
            {renderOption({
              value: "NEUTRAL",
              label: "Neutral",
              description: "Disengage the drive",
              glyph: <Pause size={17} />,
              active: form.gear === "NEUTRAL",
              onSelect: () => setForm({ ...form, gear: "NEUTRAL" }),
            })}
            {renderOption({
              value: "BACKWARD",
              label: "Backward",
              description: "Drive the vehicle in reverse",
              glyph: <ArrowDown size={17} />,
              active: form.gear === "BACKWARD",
              onSelect: () => setForm({ ...form, gear: "BACKWARD" }),
            })}
          </div>
          {renderInfoCard([["Required", "Gear selection"]])}
        </div>
      );
    }

    if (cmd === "CAN_CRUISE_CTRL") {
      return (
        <div className="rvsc-grid rvsc-cols-2">
          <div className="rvsc-options rvsc-stack">
            {renderOption({
              value: "ON",
              label: "Cruise ON",
              description: "Enable cruise control",
              glyph: <Power size={17} />,
              active: form.cruise === "ON",
              onSelect: () => setForm({ ...form, cruise: "ON" }),
            })}
            {renderOption({
              value: "OFF",
              label: "Cruise OFF",
              description: "Disable cruise control",
              glyph: <Power size={17} />,
              active: form.cruise === "OFF",
              onSelect: () => setForm({ ...form, cruise: "OFF" }),
            })}
          </div>
          {renderInfoCard([["Required", "ON / OFF selection"]])}
        </div>
      );
    }

    /* ---------- BMS ---------- */
    if (["CAN_CHG_MOSFET", "CAN_DISCHG_MOSFET"].includes(cmd)) {
      const isCharging = cmd === "CAN_CHG_MOSFET";
      return (
        <div className="rvsc-grid rvsc-cols-2">
          <div className="rvsc-options rvsc-stack">
            {renderOption({
              value: "ON",
              label: "ON",
              description: isCharging
                ? "Enable the charging MOSFET"
                : "Enable the discharging MOSFET",
              glyph: <Power size={17} />,
              active: form.mosfetState === "ON",
              onSelect: () => setForm({ ...form, mosfetState: "ON" }),
            })}
            {renderOption({
              value: "OFF",
              label: "OFF",
              description: isCharging
                ? "Disable the charging MOSFET"
                : "Disable the discharging MOSFET",
              glyph: <Power size={17} />,
              active: form.mosfetState === "OFF",
              onSelect: () => setForm({ ...form, mosfetState: "OFF" }),
            })}
          </div>
          {renderInfoCard([["Required", "MOSFET state"]])}
        </div>
      );
    }

    if (cmd === "CAN_BMS_REBOOT") {
      return renderActionCard({
        icon: <RefreshCw size={18} />,
        title: "Reboot battery management system",
        text: "The BMS will restart and telemetry will pause briefly while it comes back online.",
        warning: "Requires confirmation before sending",
      });
    }

    if (bmsFieldConfig[cmd]) {
      return renderNumberField(cmd);
    }

    /* ---------- VCU ---------- */
    if (["POWER", "BLUETOOTH", "AIRPLANE", "LED"].includes(cmd)) {
      const glyphs = {
        POWER: <Power size={17} />,
        BLUETOOTH: <Bluetooth size={17} />,
        AIRPLANE: <Plane size={17} />,
        LED: <Lightbulb size={17} />,
      };
      const noun =
        cmd === "POWER"
          ? "scooter power"
          : cmd === "BLUETOOTH"
          ? "Bluetooth"
          : cmd === "AIRPLANE"
          ? "airplane mode"
          : "LED lighting";

      return (
        <div className="rvsc-grid rvsc-cols-2">
          <div className="rvsc-options rvsc-stack">
            {renderOption({
              value: "1",
              label: "ON",
              description: `Turn ${noun} on`,
              glyph: glyphs[cmd],
              active: form.value === "1",
              onSelect: () => setValue("1"),
            })}
            {renderOption({
              value: "0",
              label: "OFF",
              description: `Turn ${noun} off`,
              glyph: glyphs[cmd],
              active: form.value === "0",
              onSelect: () => setValue("0"),
            })}
          </div>
          {renderInfoCard([["Required", "ON / OFF selection"]])}
        </div>
      );
    }

    if (cmd === "HANDLELOCK") {
      return (
        <div className="rvsc-grid rvsc-cols-2">
          <div className="rvsc-options rvsc-stack">
            {renderOption({
              value: "0",
              label: "LOCK",
              description: "Engage the handle lock",
              glyph: <Lock size={17} />,
              active: form.value === "0",
              onSelect: () => setValue("0"),
            })}
            {renderOption({
              value: "1",
              label: "UNLOCK",
              description: "Release the handle lock",
              glyph: <Unlock size={17} />,
              active: form.value === "1",
              onSelect: () => setValue("1"),
            })}
          </div>
          {renderInfoCard([["Required", "Lock state"]])}
        </div>
      );
    }

    if (cmd === "SEATLOCK") {
      return renderActionCard({
        icon: <Unlock size={18} />,
        title: "Release seat lock",
        text: "Sends the seat unlock command to the vehicle.",
        warning: "Requires confirmation before sending",
      });
    }

    if (["BOARDRESTART", "rideOSRESTART"].includes(cmd)) {
      const isBoard = cmd === "BOARDRESTART";
      return renderActionCard({
        icon: isBoard ? <RefreshCw size={18} /> : <RotateCcw size={18} />,
        title: isBoard ? "Restart vehicle control board" : "Restart rideOS",
        text: isBoard
          ? "The control board will reboot. The vehicle will be unavailable for a short period."
          : "The rideOS operating system will restart on the vehicle.",
        warning: "Requires confirmation before sending",
      });
    }

    if (["AOSPOTA", "MCUOTA", "rideOSOTA"].includes(cmd)) {
      return renderActionCard({
        icon: <Download size={18} />,
        title: commandLabels[cmd] || cmd,
        text:
          cmd === "AOSPOTA"
            ? "Triggers the AOSP over-the-air update pipeline on the vehicle."
            : cmd === "MCUOTA"
            ? "Triggers the MCU over-the-air update pipeline on the vehicle."
            : "Triggers the rideOS over-the-air update pipeline on the vehicle.",
        warning: "Requires confirmation before sending",
      });
    }

    return null;
  };

  const uiCss = `
.rvsc-root{display:flex;flex-direction:column;gap:14px;min-height:0;overflow:hidden;color:#e9e9ea;font-family:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;}
.rvsc-topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.rvsc-tabs{display:flex;gap:6px;padding:5px;background:#0b0b0b;border:1px solid #1e1e1e;border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.03);}
.rvsc-tab{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border:0;border-radius:10px;background:transparent;color:#8b8b90;font-size:12px;font-weight:700;letter-spacing:.08em;cursor:pointer;transition:background .18s,color .18s,box-shadow .18s;}
.rvsc-tab:hover{color:#d8d8db;background:#141414;}
.rvsc-tab.is-active{background:linear-gradient(135deg,#FF9913,#ffb64d);color:#121212;box-shadow:0 6px 18px rgba(255,153,19,.28);}
.rvsc-vehiclechip{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:#0b0b0b;border:1px solid #1e1e1e;border-radius:12px;font-size:12px;color:#9b9ba1;max-width:100%;overflow:hidden;}
.rvsc-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,.8);flex:0 0 auto;}
.rvsc-chip-label{letter-spacing:.12em;font-size:10px;color:#6d6d74;font-weight:700;}
.rvsc-chip-vin{color:#f2f2f3;font-weight:600;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rvsc-chip-sep{width:1px;height:14px;background:#242424;}
.rvsc-chip-owner{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rvsc-status{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;font-size:12.5px;font-weight:600;border:1px solid transparent;}
.rvsc-status.is-success{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.35);color:#4ade80;}
.rvsc-status.is-error{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.35);color:#f87171;}
.rvsc-status.is-info{background:rgba(255,153,19,.1);border-color:rgba(255,153,19,.35);color:#ffb64d;}
.rvsc-shell{display:flex;gap:14px;flex:1;min-height:0;}
.rvsc-nav{display:flex;flex-direction:column;width:27%;min-width:250px;max-width:340px;min-height:0;background:linear-gradient(180deg,#0c0c0c,#080808);border:1px solid #1d1d1d;border-radius:16px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,.35);}
.rvsc-navhead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px;border-bottom:1px solid #1a1a1a;background:#0a0a0a;}
.rvsc-navtitle{font-size:13px;font-weight:700;color:#f3f3f4;}
.rvsc-navsub{margin-top:2px;font-size:10.5px;color:#6f6f76;letter-spacing:.08em;text-transform:uppercase;font-weight:600;}
.rvsc-navicon{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9px;background:rgba(255,153,19,.12);color:#FF9913;border:1px solid rgba(255,153,19,.3);flex:0 0 auto;}
.rvsc-navscroll{flex:1;min-height:0;overflow-y:auto;padding:10px;}
.rvsc-navgroup{margin-bottom:12px;}
.rvsc-grouptitle{padding:6px 8px;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#5f5f66;}
.rvsc-navitem{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;padding:10px 11px;margin-bottom:3px;border-radius:9px;border:1px solid transparent;background:transparent;color:#a6a6ad;font-size:12.5px;font-weight:500;cursor:pointer;transition:background .15s,color .15s,border-color .15s;}
.rvsc-navitem:hover{background:#121212;border-color:#1f1f1f;color:#e8e8ea;}
.rvsc-navitem.is-active{background:rgba(255,153,19,.12);border-color:rgba(255,153,19,.45);color:#ffb64d;font-weight:600;}
.rvsc-navitem.is-active svg{color:#FF9913;}
.rvsc-main{display:flex;flex-direction:column;flex:1;min-width:0;min-height:0;background:radial-gradient(1200px 400px at 0% 0%,rgba(255,153,19,.06),transparent 60%),#0b0b0b;border:1px solid #1d1d1d;border-radius:16px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,.35);}
.rvsc-mainhead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid #1a1a1a;background:rgba(255,255,255,.012);flex-wrap:wrap;}
.rvsc-eyebrow{font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#FF9913;margin-bottom:6px;}
.rvsc-h2{margin:0;font-size:19px;font-weight:700;color:#f5f5f6;letter-spacing:-.01em;}
.rvsc-desc{margin:6px 0 0;font-size:12.5px;line-height:1.5;color:#87878e;max-width:640px;}
.rvsc-code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;font-weight:600;letter-spacing:.06em;color:#c9c9cf;background:#111;border:1px solid #242424;border-radius:7px;padding:5px 8px;white-space:nowrap;}
.rvsc-mainscroll{flex:1;min-height:0;overflow-y:auto;padding:20px;}
.rvsc-footer{display:flex;flex-direction:column;align-items:stretch;gap:10px;padding:14px 20px;border-top:1px solid #1a1a1a;background:#090909;}
.rvsc-footnote{font-size:11.5px;color:#66666d;line-height:1.4;}
.rvsc-send{display:inline-flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:13px 22px;border:0;border-radius:12px;background:linear-gradient(135deg,#FF9913,#ffb64d);color:#141414;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;box-shadow:0 10px 26px rgba(255,153,19,.25);transition:transform .15s,box-shadow .15s,filter .15s;}
.rvsc-send:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 14px 30px rgba(255,153,19,.32);filter:brightness(1.03);}
.rvsc-send:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;}
.rvsc-grid{display:grid;gap:14px;}
.rvsc-cols-1{grid-template-columns:1fr;}
.rvsc-cols-2{grid-template-columns:repeat(2,minmax(0,1fr));}
.rvsc-cols-3{grid-template-columns:repeat(3,minmax(0,1fr));}
.rvsc-gap{margin-top:14px;}
.rvsc-section{margin-bottom:18px;}
.rvsc-sectionhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;}
.rvsc-sectiontitle{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#7a7a82;}
.rvsc-card{background:linear-gradient(180deg,#111111,#0d0d0d);border:1px solid #202020;border-radius:14px;padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.28);min-width:0;}
.rvsc-split{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:20px;align-items:start;}
.rvsc-split-main{min-width:0;}
.rvsc-split-side{padding-left:20px;border-left:1px dashed #222;align-self:stretch;}
.rvsc-biginput{font-size:17px;font-weight:600;padding:14px 64px 14px 16px;}
.rvsc-cardhead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;}
.rvsc-cardtitle{font-size:13.5px;font-weight:600;color:#f0f0f1;}
.rvsc-cardhint{margin-top:3px;font-size:11.5px;color:#77777f;line-height:1.4;}
.rvsc-value{display:flex;align-items:baseline;gap:5px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:20px;font-weight:700;line-height:1;white-space:nowrap;}
.rvsc-unit{font-size:10.5px;font-weight:700;color:#6b6b73;letter-spacing:.08em;}
.rvsc-slider{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:99px;background:#262626;outline:none;cursor:pointer;}
.rvsc-slider::-webkit-slider-runnable-track{height:4px;border-radius:99px;background:linear-gradient(90deg,var(--rvsc-accent,#FF9913) 0%,var(--rvsc-accent,#FF9913) var(--rvsc-fill,50%),#262626 var(--rvsc-fill,50%),#262626 100%);}
.rvsc-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;margin-top:-6px;border-radius:50%;background:#fff;border:3px solid var(--rvsc-accent,#FF9913);box-shadow:0 0 0 4px rgba(255,153,19,.12);cursor:pointer;}
.rvsc-slider::-moz-range-track{height:4px;border-radius:99px;background:#262626;}
.rvsc-slider::-moz-range-progress{height:4px;border-radius:99px;background:var(--rvsc-accent,#FF9913);}
.rvsc-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid var(--rvsc-accent,#FF9913);cursor:pointer;}
.rvsc-range{display:flex;justify-content:space-between;margin-top:8px;font-size:10.5px;color:#5c5c63;font-family:ui-monospace,monospace;}
.rvsc-input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:10px;background:#080808;border:1px solid #262626;color:#f2f2f3;font-size:13.5px;outline:none;transition:border-color .15s,box-shadow .15s;}
.rvsc-input::placeholder{color:#4f4f56;}
.rvsc-input:focus{border-color:rgba(255,153,19,.7);box-shadow:0 0 0 3px rgba(255,153,19,.12);background:#0a0a0a;}
.rvsc-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.08em;text-transform:uppercase;}
.rvsc-fieldhint{display:flex;justify-content:space-between;gap:10px;margin-top:8px;font-size:11px;color:#66666d;}
.rvsc-charcount{font-family:ui-monospace,monospace;color:#8a8a92;}
.rvsc-inputwrap{position:relative;}
.rvsc-inputunit{padding-right:64px;}
.rvsc-inputsuffix{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:700;color:#6b6b73;letter-spacing:.08em;pointer-events:none;}
.rvsc-unitbadge{font-size:10px;font-weight:800;letter-spacing:.1em;color:#FF9913;background:rgba(255,153,19,.1);border:1px solid rgba(255,153,19,.3);padding:4px 8px;border-radius:6px;white-space:nowrap;}
.rvsc-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}
.rvsc-options.is-2{grid-template-columns:repeat(2,minmax(0,1fr));}
.rvsc-options.rvsc-stack{grid-template-columns:1fr;}
.rvsc-inforows{margin-top:2px;}
.rvsc-inforows .rvsc-kv:last-child{border-bottom:0;}
.rvsc-option{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:16px;border-radius:14px;background:#0f0f0f;border:1px solid #232323;color:#c9c9cf;text-align:left;cursor:pointer;transition:border-color .15s,background .15s,transform .15s;}
.rvsc-option:hover{border-color:#333;background:#131313;transform:translateY(-1px);}
.rvsc-option.is-active{border-color:rgba(255,153,19,.65);background:rgba(255,153,19,.1);color:#ffb64d;box-shadow:0 0 0 1px rgba(255,153,19,.2) inset;}
.rvsc-option-icon{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:#161616;border:1px solid #282828;color:#d0d0d5;}
.rvsc-option.is-active .rvsc-option-icon{background:rgba(255,153,19,.16);border-color:rgba(255,153,19,.45);color:#FF9913;}
.rvsc-option-label{font-size:13px;font-weight:600;color:inherit;}
.rvsc-option-desc{font-size:11px;color:#6f6f77;line-height:1.4;}
.rvsc-option-check{position:absolute;top:12px;right:12px;color:#FF9913;}
.rvsc-action{display:flex;align-items:flex-start;gap:14px;padding:18px;border-radius:14px;background:linear-gradient(180deg,#141414,#0e0e0e);border:1px solid #232323;}
.rvsc-actionicon{display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:11px;background:rgba(255,153,19,.12);border:1px solid rgba(255,153,19,.35);color:#FF9913;flex:0 0 auto;}
.rvsc-actiontitle{font-size:14px;font-weight:600;color:#f2f2f3;}
.rvsc-actiontext{margin-top:4px;font-size:12px;line-height:1.55;color:#81818a;}
.rvsc-warn{display:inline-flex;align-items:center;gap:7px;margin-top:12px;padding:7px 11px;border-radius:8px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.28);color:#f87171;font-size:11.5px;font-weight:600;}
.rvsc-preview{margin-top:14px;padding:14px 16px;border-radius:12px;background:#070707;border:1px dashed #2a2a2a;}
.rvsc-preview-label{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#616169;}
.rvsc-preview code{display:block;margin-top:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;letter-spacing:.06em;color:#ffb64d;word-break:break-all;}
.rvsc-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px;text-align:center;}
.rvsc-emptyicon{display:flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:18px;background:#111;border:1px solid #242424;color:#FF9913;}
.rvsc-emptytitle{font-size:15px;font-weight:600;color:#e6e6e8;}
.rvsc-emptytext{font-size:12.5px;color:#77777f;max-width:320px;line-height:1.6;}
.rvsc-navscroll::-webkit-scrollbar,.rvsc-mainscroll::-webkit-scrollbar{width:8px;}
.rvsc-navscroll::-webkit-scrollbar-track,.rvsc-mainscroll::-webkit-scrollbar-track{background:transparent;}
.rvsc-navscroll::-webkit-scrollbar-thumb,.rvsc-mainscroll::-webkit-scrollbar-thumb{background:#1f1f1f;border-radius:99px;}
.rvsc-navscroll::-webkit-scrollbar-thumb:hover,.rvsc-mainscroll::-webkit-scrollbar-thumb:hover{background:#2c2c2c;}
.rvsc-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:18px;z-index:9999;}
.rvsc-modal{width:100%;max-width:470px;border-radius:16px;background:linear-gradient(180deg,#121212,#0b0b0b);border:1px solid #2a2a2a;box-shadow:0 30px 80px rgba(0,0,0,.7);overflow:hidden;}
.rvsc-modalhead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 20px;border-bottom:1px solid #1c1c1c;}
.rvsc-modaltitle{margin:0;font-size:15px;font-weight:700;color:#f4f4f5;}
.rvsc-modalsub{margin-top:4px;font-size:11.5px;color:#7c7c84;}
.rvsc-iconbtn{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;background:#141414;border:1px solid #262626;color:#a0a0a8;cursor:pointer;}
.rvsc-iconbtn:hover{color:#fff;border-color:#3a3a3a;}
.rvsc-modalbody{padding:18px 20px;display:grid;gap:2px;}
.rvsc-kv{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;font-size:12.5px;padding:8px 0;border-bottom:1px dashed #1c1c1c;}
.rvsc-kv:last-child{border-bottom:0;}
.rvsc-k{color:#6f6f77;font-weight:600;letter-spacing:.04em;text-transform:uppercase;font-size:10.5px;}
.rvsc-v{color:#e7e7e9;text-align:right;word-break:break-word;font-weight:500;}
.rvsc-v.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;}
.rvsc-modalfoot{display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid #1c1c1c;background:#090909;}
.rvsc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 18px;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer;border:1px solid #2a2a2a;background:#141414;color:#c9c9cf;transition:background .15s,border-color .15s,transform .15s;}
.rvsc-btn:hover{background:#1b1b1b;color:#fff;}
.rvsc-btn.is-primary{border-color:transparent;background:linear-gradient(135deg,#FF9913,#ffb64d);color:#141414;box-shadow:0 8px 22px rgba(255,153,19,.25);}
.rvsc-btn:disabled{opacity:.5;cursor:not-allowed;}
@media (max-width:1180px){.rvsc-cols-3{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media (max-width:900px){
.rvsc-root{overflow-y:auto;overflow-x:hidden;}
.rvsc-shell{flex-direction:column;}
.rvsc-nav{width:100%;max-width:none;min-width:0;max-height:250px;}
.rvsc-main{min-height:420px;}
.rvsc-cols-2,.rvsc-cols-3{grid-template-columns:1fr;}
.rvsc-options,.rvsc-options.is-2{grid-template-columns:1fr;}
.rvsc-split{grid-template-columns:1fr;gap:14px;}
.rvsc-split-side{padding-left:0;padding-top:12px;border-left:0;border-top:1px dashed #222;}
.rvsc-footer{flex-direction:column;align-items:stretch;gap:10px;}
.rvsc-tabs{flex-wrap:wrap;}
.rvsc-tab{flex:1 1 auto;justify-content:center;padding:9px 12px;font-size:11px;}
.rvsc-topbar{flex-direction:column;align-items:stretch;}
.rvsc-vehiclechip{justify-content:flex-start;flex-wrap:wrap;}
.rvsc-send{width:100%;}
}
`;

  return (
    <>
      <style>{uiCss}</style>

      <div
        ref={rootRef}
        className="rvsc-root"
        style={{ height: frameHeight ? `${frameHeight}px` : "auto" }}
      >
        {/* ---------- MODULE TABS + VEHICLE CONTEXT ---------- */}
        <div className="rvsc-topbar">
          <div className="rvsc-tabs" role="tablist" aria-label="Command modules">
            {["controller", "bms", "vcu", "advance"].map((module) => {
              const Meta = moduleMeta[module];
              const Icon = Meta.icon;
              const isActive = activeModule === module;

              return (
                <button
                  key={module}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`rvsc-tab${isActive ? " is-active" : ""}`}
                  onClick={() => switchModule(module)}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{Meta.label}</span>
                </button>
              );
            })}
          </div>

          <div className="rvsc-vehiclechip">
            <span className="rvsc-dot" />
            <span className="rvsc-chip-label">VIN</span>
            <span className="rvsc-chip-vin" title={vin || ""}>
              {vin || "No vehicle selected"}
            </span>
            {ownerName ? (
              <>
                <span className="rvsc-chip-sep" />
                <span className="rvsc-chip-owner" title={ownerName}>
                  {ownerName}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {status ? (
          <div className={`rvsc-status ${statusTone}`} role="status">
            {status}
          </div>
        ) : null}

        <div className="rvsc-shell">
          {/* ---------- COMMAND NAVIGATION ---------- */}
          <aside className="rvsc-nav">
            <div className="rvsc-navhead">
              <div>
                <div className="rvsc-navtitle">{activeMeta.title}</div>
                <div className="rvsc-navsub">{navCount} commands</div>
              </div>
              <span className="rvsc-navicon">
                <ActiveModuleIcon size={17} />
              </span>
            </div>

            <div className="rvsc-navscroll">
              {navGroups.map((group) => (
                <div className="rvsc-navgroup" key={group.title}>
                  <div className="rvsc-grouptitle">{group.title}</div>

                  {group.commands.map((cmd) => (
                    <button
                      key={cmd}
                      type="button"
                      className={`rvsc-navitem${
                        selectedCommand === cmd ? " is-active" : ""
                      }`}
                      onClick={() => selectCommand(cmd)}
                    >
                      <span>{commandLabels[cmd] || cmd}</span>
                      {selectedCommand === cmd ? (
                        <ChevronRight size={14} />
                      ) : null}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          {/* ---------- COMMAND CONFIGURATION ---------- */}
          <section className="rvsc-main">
            {!selectedCommand ? (
              <div className="rvsc-empty">
                <span className="rvsc-emptyicon">
                  <SlidersHorizontal size={24} />
                </span>
                <div className="rvsc-emptytitle">Select a command</div>
                <div className="rvsc-emptytext">
                  Choose a command from the {activeMeta.title.toLowerCase()}{" "}
                  panel to configure its parameters and send it to the vehicle.
                </div>
              </div>
            ) : (
              <>
                <div className="rvsc-mainhead">
                  <div>
                    <div className="rvsc-eyebrow">{activeMeta.title}</div>
                    <h2 className="rvsc-h2">{commandTitle}</h2>
                    <p className="rvsc-desc">{commandDescription}</p>
                  </div>
                  <span className="rvsc-code">
                    {selectedCommand === "CUSTOM_CAN_COMMAND"
                      ? "CUSTOM_CAN_COMMAND"
                      : form.commandType || selectedCommand}
                  </span>
                </div>

                <div className="rvsc-mainscroll">{renderConfig()}</div>

                <div className="rvsc-footer">
                  <span className="rvsc-footnote">
                    {vin
                      ? "Command is delivered over the live vehicle channel."
                      : "Select a vehicle before sending a command."}
                  </span>
                  <button
                    type="button"
                    className="rvsc-send"
                    onClick={openConfirmPopup}
                    disabled={loading || !commandReady}
                  >
                    <Send size={16} />
                    {loading ? "Sending..." : "Send Command"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* ---------- CONFIRMATION ---------- */}
      {showConfirm ? (
        <div
          className="rvsc-overlay"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(false);
          }}
        >
          <div className="rvsc-modal">
            <div className="rvsc-modalhead">
              <div>
                <h3 className="rvsc-modaltitle">Confirm command</h3>
                <div className="rvsc-modalsub">
                  {commandTitle} · {activeMeta.label}
                </div>
              </div>
              <button
                type="button"
                className="rvsc-iconbtn"
                onClick={() => setShowConfirm(false)}
                aria-label="Close confirmation"
              >
                <X size={15} />
              </button>
            </div>

            <div className="rvsc-modalbody">
              <div className="rvsc-kv">
                <span className="rvsc-k">VIN</span>
                <span className="rvsc-v mono">{vin || "N/A"}</span>
              </div>
              <div className="rvsc-kv">
                <span className="rvsc-k">Owner</span>
                <span className="rvsc-v">{ownerName || "N/A"}</span>
              </div>
              <div className="rvsc-kv">
                <span className="rvsc-k">Phone</span>
                <span className="rvsc-v">{phoneNumber || "N/A"}</span>
              </div>
              <div className="rvsc-kv">
                <span className="rvsc-k">Location</span>
                <span className="rvsc-v mono">
                  {location ? `${location.lat}, ${location.lng}` : "N/A"}
                </span>
              </div>
            </div>

            <div className="rvsc-modalfoot">
              <button
                type="button"
                className="rvsc-btn"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rvsc-btn is-primary"
                disabled={loading}
                onClick={() => {
                  setShowConfirm(false);
                  sendCommand();
                }}
              >
                <Send size={14} />
                {loading ? "Sending..." : "Send Command"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
