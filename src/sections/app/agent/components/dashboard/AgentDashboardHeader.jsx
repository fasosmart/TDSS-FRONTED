import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
import { 
  Box, 
  Button, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Stack, 
  Typography 
} from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { AgentActionButton } from '../AgentActionButton';

export default function AgentDashboardHeader({ 
  user, 
  companyFilter, 
  onCompanyChange, 
  companies, 
  onRefresh, 
  onExport, 
  loading 
}) {
  return (
    <>
      {/* En-tête avec filtre et bouton d'action */}
      <Box sx={(theme) => ({ 
        mb: 4, 
        p: 3, 
        borderRadius: 1,
        boxShadow: 'none',
        backgroundColor: alpha(theme.palette.background.paper, 0.1),
        backdropFilter: 'blur(8px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      })}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" sx={{ 
              mb: 0.5, 
              fontWeight: 700, 
              letterSpacing: '-0.5px',
              color: 'text.primary',
              display: 'inline-block',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -4,
                left: 0,
                width: 40,
                height: 3,
                backgroundColor: theme => theme.palette.primary.main
              }
            }}>
              Tableau de bord
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }}>
              Bon retour, {user?.name || 'Agent'}. Voici un aperçu de vos activités.
            </Typography>
          </Box>
          
          {/* <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <FormControl 
              variant="outlined" 
              size="small" 
              sx={(theme) => ({ 
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.1),
                  '& fieldset': {
                    borderColor: alpha(theme.palette.divider, 0.3)
                  },
                  '&:hover fieldset': {
                    borderColor: alpha(theme.palette.primary.main, 0.5)
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'primary.main'
                },
                '& .MuiSelect-icon': {
                  color: 'text.secondary'
                }
              })}
            >
              <InputLabel id="company-filter-label">Entreprise</InputLabel>
              <Select
                labelId="company-filter-label"
                value={companyFilter}
                onChange={onCompanyChange}
                label="Entreprise"
                disabled={loading}
              >
                <MenuItem value="all">Toutes les entreprises</MenuItem>
                {companies.map((company, index) => (
                  <MenuItem key={index} value={company}>
                    {company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack> */}
        </Stack>
      </Box>
      
      {/* Boutons d'action secondaires */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="mdi:refresh" />}
          onClick={onRefresh}
          disabled={loading}
          sx={(theme) => ({
            borderColor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.main, 0.5) 
              : theme.palette.divider,
            color: 'primary.main',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              borderColor: 'primary.main',
              transform: 'translateY(-1px)',
              boxShadow: 1
            },
            transition: 'all 0.2s ease-in-out'
          })}
        >
          Actualiser
        </Button>
        
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<Iconify icon="mdi:file-export" />}
          onClick={onExport}
          disabled={loading}
          sx={(theme) => ({
            borderColor: alpha(theme.palette.secondary.main, 0.5),
            '&:hover': {
              bgcolor: alpha(theme.palette.secondary.main, 0.08),
              borderColor: 'secondary.main',
              transform: 'translateY(-1px)',
              boxShadow: 1
            },
            transition: 'all 0.2s ease-in-out'
          })}
        >
          Exporter
        </Button>
        
        <AgentActionButton />
      </Box>
    </>
  );
}

AgentDashboardHeader.propTypes = {
  user: PropTypes?.object,
  companyFilter: PropTypes?.string,
  onCompanyChange: PropTypes?.func,
  companies: PropTypes?.array,
  onRefresh: PropTypes?.func,
  onExport: PropTypes?.func,
  loading: PropTypes?.bool
};

AgentDashboardHeader.defaultProps = {
  companyFilter: 'all',
  companies: [],
  loading: false,
  onCompanyChange: () => {},
  onRefresh: () => {},
  onExport: () => {}
};
