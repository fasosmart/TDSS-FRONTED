import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { inputBaseClasses } from '@mui/material/InputBase';
import TextField from '@mui/material/TextField';
import { useState, forwardRef, useCallback } from 'react';
import PhoneNumberInput from 'react-phone-number-input/input';

import { Iconify } from '../iconify';
import { CountryListPopover } from './list';
import { getCountryCode } from './utils';
import { parsePhoneNumber } from 'react-phone-number-input';

// ----------------------------------------------------------------------

export const PhoneInput = forwardRef(
  (
    {
      sx,
      size,
      value,
      label,
      onChange,
      placeholder,
      disableSelect,
      variant = 'outlined',
      country: inputCountryCode,
      ...other
    },
    ref
  ) => {
    const defaultCountryCode = getCountryCode(value, inputCountryCode ?? 'GN');

    const [searchCountry, setSearchCountry] = useState('');

    const [selectedCountry, setSelectedCountry] = useState(defaultCountryCode);

    const hasLabel = !!label;

  function toE164(rawValue, countryCode = 'GN') {
  try {
    const phone = parsePhoneNumber(rawValue, countryCode);
    return phone ? phone.number : undefined; // format E.164
  } catch {
    return undefined;
  }
}

    // const cleanValue = value?.replace(/[\s-]+/g, '');
    const cleanValue = toE164(value, selectedCountry);

    const handleClear = useCallback(() => {
      onChange('');
    }, [onChange]);

  

    return (
      <Box
        sx={{
          '--popover-button-mr': '12px',
          '--popover-button-height': '22px',
          '--popover-button-width': variant === 'standard' ? '48px' : '60px',
          position: 'relative',
          [`& .${inputBaseClasses.input}`]: {
            pl: 'calc(var(--popover-button-width) + var(--popover-button-mr))',
          },
          ...sx,
        }}
      >
        {!disableSelect && (
          <CountryListPopover
            searchCountry={searchCountry}
            countryCode={selectedCountry}
            onClickCountry={(inputValue) => setSelectedCountry(inputValue)}
            onSearchCountry={(inputValue) => setSearchCountry(inputValue)}
            sx={{
              pl: variant === 'standard' ? 0 : 1.5,
              ...(variant === 'standard' &&
                hasLabel && {
                mt: size === 'small' ? '16px' : '20px',
              }),
              ...((variant === 'filled' || variant === 'outlined') && {
                mt: size === 'small' ? '8px' : '16px',
              }),
              ...(variant === 'filled' &&
                hasLabel && {
                mt: size === 'small' ? '21px' : '25px',
              }),
            }}
          />
        )}

        <PhoneNumberInput
          ref={ref}
          size={size}
          label={label}
          value={cleanValue}
          variant={variant}
          onChange={onChange}
          hiddenLabel={!label}
          country={selectedCountry}
          inputComponent={CustomInput}
          InputLabelProps={{ shrink: true }}
          placeholder={placeholder ?? 'Entrer votre numero de telephone'}
          InputProps={{
            endAdornment: cleanValue && (
              <InputAdornment position="end">
                <IconButton size="small" edge="end" onClick={handleClear}>
                  <Iconify width={16} icon="mingcute:close-line" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          {...other}
        />
      </Box>
    );
  }
);

// ----------------------------------------------------------------------

const CustomInput = forwardRef(({ ...props }, ref) => <TextField inputRef={ref} {...props} />);
