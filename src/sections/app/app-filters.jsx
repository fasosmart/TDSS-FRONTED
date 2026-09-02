import { useState } from 'react';
import { Select, MenuItem, Button, FormControl, InputLabel, Stack } from '@mui/material';
import { toast } from 'sonner';
import MonthSelect from './month-select';

export function Filters({ onFilterChange }) {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [months, setMonths] = useState([]);
  const [type, setType] = useState('all');
  const [company, setCompany] = useState('Toutes');
  const [country, setCountry] = useState('');

  const handleChange = () => {
    onFilterChange({ year, months, type });
    toast.info(
      `Filtres appliqués :\nAnnée : ${year}\nMois : ${months.join(', ')}\nType : ${type} `,
      {
        duration: 5000,
        style: {
          whiteSpace: 'pre-line',
        },
      }
    );
  };

  const allMonths = [
    'Jan',
    'Fév',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juil',
    'Août',
    'Sept',
    'Oct',
    'Nov',
    'Déc',
  ];

  const allCompanies = [
    'Toutes', // Option for all companies
    'Entreprise A',
    'Entreprise B',
    'Entreprise C',
    'Entreprise D',
    'Entreprise E',
    'Entreprise F',
    'Entreprise G',
    'Entreprise H',
    'Entreprise I',
    'Entreprise J',
    'Entreprise K',
    'Entreprise L',
    'Entreprise M',
    'Entreprise N',
    'Entreprise O',
    'Entreprise P',
    'Entreprise Q',
    'Entreprise R',
    'Entreprise S',
    'Entreprise T',
    'Entreprise U',
    'Entreprise V',
    'Entreprise W',
    'Entreprise X',
    'Entreprise Y',
    'Entreprise Z',
  ];

  const countryname = [
    'France',
    'Belgique',
    'Suisse',
    'Luxembourg',
    'Canada',
    'Guinée',
    'Mali',
    "Côte d'Ivoire",
    'Sénégal',
    'Togo',
    'Bénin',
    'Burkina Faso',
    'Niger',
    'Tchad',
    'Cameroun',
    'Gabon',
    'République Centrafricaine',
    'Congo-Brazzaville',
    'Congo-Kinshasa',
    'Rwanda',
    'Burundi',
    'Tanzanie',
    'Ouganda',
    'Kenya',
    'Somalie',
    'Éthiopie',
    'Djibouti',
    'Erythrée',
    'Soudan',
    'Soudan du Sud',
    'Angola',
    'Namibie',
    'Botswana',
    'Afrique du Sud',
    'Lesotho',
    'Eswatini',
    'Mozambique',
    'Zambie',
    'Chine',
    'Japon',
    'Corée du Sud',
    'Inde',
    'Pakistan',
    'Bangladesh',
    'Sri Lanka',
    'Maldives',
    'Népal',
    'Bhoutan',
    'Afghanistan',
  ];

  const currentYear = new Date().getFullYear();
  const startYear = 2023;

  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
      {/* Entreprise (TextField) */}
      {/* <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel id="company-label">Entreprise</InputLabel>
        <Select
          labelId="company-label"
          value={company}
          onChange={e => setCompany(e.target.value)}
          label="Entreprise"
        >
          { allCompanies.map((company, index) => (
                <MenuItem key={index} value={company}>{company}</MenuItem>
            ))}
        </Select>
      </FormControl> */}

      {/* Pays (TextField) */}
      {/* <FormControl size="small">
        <InputLabel id="country-label">Pays</InputLabel>
        <Select
            labelId="country-label"
            value={country}
            onChange={e => setCountry(e.target.value)}
            label="Pays"
        >
            { countryname.map((country, index) => (
                <MenuItem key={index} value={country}>{country}</MenuItem>
            ))}
        </Select>
      </FormControl> */}

      {/* Année */}

      <FormControl size="small">
        <InputLabel id="year-label">Année</InputLabel>
        <Select
          labelId="year-label"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          label="Année"
        >
          {Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).map((y) => (
            <MenuItem key={y} value={y.toString()}>
              {y}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Mois (MultiSelect Autocomplete) */}
      <MonthSelect months={months} setMonths={setMonths} allMonths={allMonths} />

      {/* Type */}
      <FormControl size="small">
        <InputLabel id="type-label">Type</InputLabel>
        <Select
          labelId="type-label"
          value={type}
          onChange={(e) => setType(e.target.value)}
          label="Type"
        >
          <MenuItem value="all">Toutes</MenuItem>
          <MenuItem value="declarations">Déclarations</MenuItem>
          <MenuItem value="factures">Factures</MenuItem>
          <MenuItem value="paiements">Paiements</MenuItem>
        </Select>
      </FormControl>

      {/* Bouton Appliquer */}
      <Button
        variant="contained"
        size="small"
        onClick={handleChange}
        sx={{ textTransform: 'none' }}
      >
        Appliquer
      </Button>
    </Stack>
  );
}
