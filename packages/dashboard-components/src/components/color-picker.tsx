import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { HexColorPicker } from "react-colorful";

type Props = {
  value: string;
  onSelect: (value: string) => void;
};

/**
 * ColorPicker - A color selection component with popover
 *
 * @example
 * ```tsx
 * <ColorPicker value="#000000" onSelect={(color) => setColor(color)} />
 * ```
 *
 * @param value - The current hex color value
 * @param onSelect - Callback when a color is selected
 */
export function ColorPicker({ value, onSelect }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="size-3 transition-colors absolute top-3 left-2"
          style={{
            backgroundColor: value,
          }}
        />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto" sideOffset={14}>
        <HexColorPicker
          className="color-picker"
          color={value}
          onChange={(c) => {
            onSelect(c);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}