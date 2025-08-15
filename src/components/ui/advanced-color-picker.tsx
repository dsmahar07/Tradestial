'use client';

import * as React from 'react';
import { RiSipLine } from '@remixicon/react';
import {
  ColorArea as AriaColorArea,
  ColorAreaProps as AriaColorAreaProps,
  ColorField as AriaColorField,
  ColorPicker as AriaColorPicker,
  ColorSlider as AriaColorSlider,
  ColorSliderProps as AriaColorSliderProps,
  ColorSwatch as AriaColorSwatch,
  ColorSwatchPicker as AriaColorSwatchPicker,
  ColorSwatchPickerItem as AriaColorSwatchPickerItem,
  ColorSwatchPickerItemProps as AriaColorSwatchPickerItemProps,
  ColorSwatchPickerProps as AriaColorSwatchPickerProps,
  ColorSwatchProps as AriaColorSwatchProps,
  ColorThumb as AriaColorThumb,
  ColorThumbProps as AriaColorThumbProps,
  SliderTrack as AriaSliderTrack,
  SliderTrackProps as AriaSliderTrackProps,
  ColorPickerStateContext,
  composeRenderProps,
  parseColor,
  Input as AriaInput,
  getColorChannels,
} from 'react-aria-components';
import type { ColorSpace } from 'react-aria-components';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ColorField = AriaColorField;
const ColorPicker = AriaColorPicker;

function ColorSlider({ className, ...props }: AriaColorSliderProps) {
  return (
    <AriaColorSlider
      className={composeRenderProps(className, (className) =>
        cn('py-1', className),
      )}
      {...props}
    />
  );
}

function ColorArea({ className, ...props }: AriaColorAreaProps) {
  return (
    <AriaColorArea
      className={composeRenderProps(className, (className) =>
        cn('h-[232px] w-full rounded-lg', className),
      )}
      {...props}
    />
  );
}

function SliderTrack({ className, style, ...props }: AriaSliderTrackProps) {
  return (
    <AriaSliderTrack
      className={composeRenderProps(className, (className) =>
        cn('h-2 w-full rounded-full', className),
      )}
      style={({ defaultStyle }) => ({
        ...style,
        background: `${defaultStyle.background},
          repeating-conic-gradient(
            #fff 0 90deg,
            rgba(0,0,0,.3) 0 180deg) 
          0% -25%/6px 6px`,
      })}
      {...props}
    />
  );
}

function ColorThumb({ className, ...props }: AriaColorThumbProps) {
  return (
    <AriaColorThumb
      className={composeRenderProps(className, (className) =>
        cn('z-50 size-3 rounded-full ring-2 ring-stroke-white-0', className),
      )}
      {...props}
    />
  );
}

function ColorSwatchPicker({
  className,
  ...props
}: AriaColorSwatchPickerProps) {
  return (
    <AriaColorSwatchPicker
      className={composeRenderProps(className, (className) =>
        cn('flex w-full flex-wrap gap-1', className),
      )}
      {...props}
    />
  );
}

function ColorSwatchPickerItem({
  className,
  ...props
}: AriaColorSwatchPickerItemProps) {
  return (
    <AriaColorSwatchPickerItem
      className={composeRenderProps(className, (className) =>
        cn(
          'group/swatch-item cursor-pointer p-1 focus:outline-none',
          className,
        ),
      )}
      {...props}
    />
  );
}

function ColorSwatch({ className, style, ...props }: AriaColorSwatchProps) {
  return (
    <AriaColorSwatch
      className={composeRenderProps(className, (className) =>
        cn(
          'size-4 rounded-full border-stroke-white-0 group-data-[selected=true]/swatch-item:border-2 group-data-[selected=true]/swatch-item:ring-[1.5px]',
          className,
        ),
      )}
      style={({ defaultStyle }) => ({
        ...style,
        background: `${defaultStyle.background},
        repeating-conic-gradient(
          #fff 0 90deg,
          rgba(0,0,0,.3) 0 180deg) 
        0% -25%/6px 6px`,
      })}
      {...props}
    />
  );
}

const EyeDropperButton = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ ...rest }, forwardedRef) => {
  const state = React.useContext(ColorPickerStateContext)!;

  // eslint-disable-next-line
  // @ts-ignore
  if (typeof EyeDropper === 'undefined') {
    return null;
  }

  return (
    <button
      ref={forwardedRef}
      aria-label='Eye dropper'
      onClick={() => {
        // eslint-disable-next-line
        // @ts-ignore
        new EyeDropper()
          .open()
          .then((result: { sRGBHex: string }) =>
            state.setColor(parseColor(result.sRGBHex)),
          );
      }}
      {...rest}
    />
  );
});
EyeDropperButton.displayName = 'EyeDropperButton';



const colorSwatches = [
  '#717784',
  '#335CFF', 
  '#FF8447',
  '#FB3748',
  '#1FC16B',
  '#F6B51E',
  '#7D52F4',
  '#47C2FF',
];

// Advanced Color Picker Component
interface AdvancedColorPickerProps {
  value: any;
  onChange: (color: any) => void;
  className?: string;
}

function AdvancedColorPickerComponent({
  value,
  onChange,
  className
}: AdvancedColorPickerProps) {
  const [space, setSpace] = React.useState<ColorSpace | 'hex'>('hsl');

  return (
    <div className={cn('flex w-[320px] flex-col gap-3 rounded-xl bg-white dark:bg-[#171717] p-4 shadow-2xl border border-zinc-200 dark:border-zinc-700', className)}>
      <ColorPicker value={value} onChange={onChange}>
        <ColorArea
          colorSpace='hsl'
          xChannel='saturation'
          yChannel='lightness'
          className="h-48 w-full rounded-lg border border-zinc-200 dark:border-zinc-700"
        >
          <ColorThumb className='ring-2 ring-white dark:ring-zinc-800 w-4 h-4 rounded-full bg-white shadow-lg border-2 border-white' />
        </ColorArea>

        <div className="space-y-2">
          <ColorSlider colorSpace='hsl' channel='hue' className="relative">
            <SliderTrack className="h-4 w-full rounded-md relative overflow-hidden" />
            <ColorThumb className='absolute top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg border-2 border-white z-10' />
          </ColorSlider>

          <ColorSlider colorSpace='hsl' channel='alpha' className="relative">
            <SliderTrack className="h-4 w-full rounded-md relative overflow-hidden" />
            <ColorThumb className='absolute top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg border-2 border-white z-10' />
          </ColorSlider>
        </div>

        <div className='flex flex-col items-start gap-2'>
          <select
            value={space}
            onChange={(e) => setSpace(e.target.value as ColorSpace | 'hex')}
            className="text-xs border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value='hex'>HEX</option>
            <option value='rgb'>RGB</option>
            <option value='hsl'>HSL</option>
            <option value='hsb'>HSB</option>
          </select>

          <div className='flex w-full gap-1'>
            <Button
              size="sm"
              variant="outline"
              className="rounded-r-none focus-visible:z-10 hover:z-10 px-2"
              asChild
            >
              <EyeDropperButton>
                <RiSipLine className="w-4 h-4" />
              </EyeDropperButton>
            </Button>
            <div className='flex gap-1 flex-1'>
              {space === 'hex' ? (
                <ColorField className="flex-1">
                  <AriaInput 
                    className="w-full px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </ColorField>
              ) : (
                getColorChannels(space).map((channel, index) => (
                  <ColorField key={channel} colorSpace={space} channel={channel} className="flex-1">
                    <AriaInput 
                      aria-label={channel.toString()}
                      className="w-full px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </ColorField>
                ))
              )}
              <ColorField channel='alpha' className="flex-1">
                <AriaInput 
                  aria-label='Alpha'
                  className="w-full px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </ColorField>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 -mx-4 px-4">
          <div className='flex flex-col gap-2'>
            <div className='text-xs text-zinc-600 dark:text-zinc-400'>
              Recommended Colors
            </div>
            <ColorSwatchPicker className="grid grid-cols-8 gap-1">
              {colorSwatches.map((color) => (
                <ColorSwatchPickerItem key={color} color={color}>
                  <ColorSwatch 
                    className="w-6 h-6 rounded-md border border-zinc-200 dark:border-zinc-600 cursor-pointer hover:scale-110 transition-transform"
                  />
                </ColorSwatchPickerItem>
              ))}
            </ColorSwatchPicker>
          </div>
        </div>
      </ColorPicker>
    </div>
  );
}

// Modal-style Advanced Color Picker for backwards compatibility
interface ModalAdvancedColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onColorSelect: (color: string) => void;
  currentColor?: string;
  title?: string;
}

function AdvancedColorPicker({
  isOpen,
  onClose,
  onColorSelect,
  currentColor = '#3b82f6',
  title = 'Choose Color'
}: ModalAdvancedColorPickerProps) {
  if (!isOpen) return null;

  const handleColorChange = (color: any) => {
    onColorSelect(color.toString('hex'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative">
        <div className="flex items-center justify-between mb-4 px-4 pt-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <AdvancedColorPickerComponent 
          value={parseColor(currentColor)} 
          onChange={handleColorChange}
        />
      </div>
    </div>
  );
}



export {
  ColorPicker as Root,
  ColorField as Field,
  ColorArea as Area,
  ColorSlider as Slider,
  SliderTrack,
  ColorThumb as Thumb,
  ColorSwatchPicker as SwatchPicker,
  ColorSwatchPickerItem as SwatchPickerItem,
  ColorSwatch as Swatch,
  EyeDropperButton,
  AdvancedColorPicker,
  AdvancedColorPickerComponent,
};