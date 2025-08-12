import { useState } from 'react';
import { Menu, IconButton, MenuItem, Typography, Box } from '@mui/material';
import { Iconify } from 'src/components/iconify';

export const CURRENCIES = {
  XOF: { code: 'GNF', symbol: 'Fg', formatter: 'fGNF' },
  EUR: { code: 'EUR', symbol: '€', formatter: 'fEuro' },
  GNF: { code: 'US DOLLAR', symbol: '$', formatter: 'fCurrency' }
};

export function CurrencySelector({ value, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (newCurrency) => {
    onChange(newCurrency);
    handleClose();
  };

  const currentCurrency = CURRENCIES[value] || CURRENCIES.XOF;

  return (
    <Box>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ 
          ml: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          px: 1.5,
          py: 0.5
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {currentCurrency.code} ({currentCurrency.symbol})
        </Typography>
        <Iconify 
          icon={open ? "eva:chevron-up-fill" : "eva:chevron-down-fill"} 
          width={20} 
          sx={{ ml: 0.5 }} 
        />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {Object.values(CURRENCIES).map((currency) => (
          <MenuItem 
            key={currency.code} 
            onClick={() => handleSelect(currency.code)}
            selected={currency.code === value}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {currency.code} - {currency.symbol}
              </Typography>
              {currency.code === value && (
                <Iconify icon="eva:checkmark-fill" width={20} />
              )}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}