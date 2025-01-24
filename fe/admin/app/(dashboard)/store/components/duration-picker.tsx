import React, {useEffect} from "react";
import {ClockIcon} from "lucide-react";
import {formatDuration} from "@/lib/utils";

interface DurationPickerProps {
  defaultValue: number; // in milliseconds
  onChange: (value: number) => void;
  name: string; // 用于表单提交的名称
  disabled?: boolean; // 添加可选的 disabled 属性
}

export const DurationPicker: React.FC<DurationPickerProps> = ({defaultValue, onChange, name, disabled}) => {
  const [amount, setAmount] = React.useState(1);
  const [unit, setUnit] = React.useState('days');
  const [seconds, setSeconds] = React.useState(defaultValue);

  useEffect(() => {
    // 初始化时，根据默认值设置amount和unit
    let value = defaultValue;
    if (value >= 86400) {
      setAmount(Math.floor(value / 86400));
      setUnit('days');
    } else if (value >= 3600) {
      setAmount(Math.floor(value / 3600));
      setUnit('hours');
    } else {
      setAmount(Math.floor(value / 60));
      setUnit('minutes');
    }
    setSeconds(value);
  }, [defaultValue]);

  useEffect(() => {
    let ms = amount;
    switch (unit) {
      case 'days':
        ms *= 86400;
        break;
      case 'hours':
        ms *= 3600;
        break;
      case 'minutes':
        ms *= 60;
        break;
    }
    setSeconds(ms);
    onChange(ms);
  }, [amount, unit, onChange]);

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-[120px] rounded-lg border border-gray-300 py-2 px-3 pl-10 text-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
          disabled={disabled}
        />
        <ClockIcon
          className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400"/>
      </div>
      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        className="rounded-lg border border-gray-300 py-2 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200 bg-white"
        disabled={disabled}
      >
        <option value="days">Days</option>
        <option value="hours">Hours</option>
        <option value="minutes">Minutes</option>
      </select>
      <span className="text-sm text-gray-600">
        ({formatDuration(seconds)})
      </span>
      {/* 隐藏的input用于表单提交 */}
      <input type="hidden" name={name} value={seconds}/>
    </div>
  );
};