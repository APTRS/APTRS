import { Radio, ListItem, ListItemPrefix} from "@material-tailwind/react";
interface ScoreRadioButtonProps {
  name: string;
  label: string;
  value: string;
  scoreData: Record<string, string | number | null >;
  onChange: ( name: string, value: string) => void;
}

export function ScoreRadioButton({ name, label, value, scoreData, onChange }: ScoreRadioButtonProps) {
  const isChecked = scoreData[name] === value;
  return (
    <ListItem
      className="p-0"
      placeholder="Score Radio Button ListItem"
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
    >
      <label
        htmlFor={`${name}-${value}`}
        className="flex text-sm w-full cursor-pointer items-center px-3 py-2"
      >
        <ListItemPrefix
          className="mr-3"
          placeholder="ListItem Prefix"
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <Radio
            name={`${name}-${value}`}
            color="blue"
            id={`${name}-${value}`}
            value={value}
            ripple={false}
            className="hover:before:opacity-0 dark:text-white"
            crossOrigin=""
            checked={isChecked}
            onChange={() => onChange(name, value)}
            containerProps={{
              className: "p-0",
            }}
            placeholder="Radio Button"
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />
        </ListItemPrefix>
        <span className="dark:text-white">{label}</span>
      </label>
    </ListItem>
  );
}

export default ScoreRadioButton;
