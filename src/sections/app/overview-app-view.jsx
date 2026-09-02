'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import { DashboardContent } from 'src/layouts/dashboard';

import { useMockedUser } from 'src/auth/hooks';
import { useSearchParams } from 'src/routes/hooks';
import { useRouter } from 'src/routes/hooks';
import { AppWidgetSummary } from './app-widget-summary';

import { Filters } from './app-filters';
import { MultiLineChart } from './app-multilineChart';
import { ExportButtons } from './app-import-excel';
import DashboardAdmin from './app-last';
import API from 'src/utils/api';
import axios from 'src/utils/axios';
// import { allMockData } from 'src/_mock/allMockData';

// ----------------------------------------------------------------------
const allMockData = {
  2024: [
    { mois: 'Jan', declarations: 12, factures: 20, paiements: 15 },
    { mois: 'Fév', declarations: 15, factures: 25, paiements: 20 },
    { mois: 'Mars', declarations: 18, factures: 30, paiements: 22 },
    { mois: 'Avril', declarations: 22, factures: 35, paiements: 28 },
    { mois: 'Mai', declarations: 30, factures: 40, paiements: 35 },
    { mois: 'Juin', declarations: 28, factures: 38, paiements: 32 },
    { mois: 'Juil', declarations: 34, factures: 45, paiements: 40 },
    { mois: 'Août', declarations: 40, factures: 50, paiements: 42 },
    { mois: 'Sept', declarations: 38, factures: 55, paiements: 48 },
    { mois: 'Oct', declarations: 42, factures: 58, paiements: 50 },
    { mois: 'Nov', declarations: 45, factures: 60, paiements: 52 },
    { mois: 'Déc', declarations: 50, factures: 65, paiements: 55 },
  ],
  2025: [
    { mois: 'Jan', declarations: 10, factures: 10, paiements: 15 },
    { mois: 'Fév', declarations: 25, factures: 25, paiements: 25 },
    { mois: 'Mars', declarations: 18, factures: 30, paiements: 30 },
    { mois: 'Avril', declarations: 22, factures: 56, paiements: 28 },
    { mois: 'Mai', declarations: 30, factures: 12, paiements: 35 },
    { mois: 'Juin', declarations: 28, factures: 20, paiements: 36 },
    { mois: 'Juil', declarations: 34, factures: 45, paiements: 20 },
    { mois: 'Août', declarations: 40, factures: 50, paiements: 85 },
    { mois: 'Sept', declarations: 58, factures: 32, paiements: 96 },
    { mois: 'Oct', declarations: 36, factures: 10, paiements: 12 },
    { mois: 'Nov', declarations: 85, factures: 45, paiements: 54 },
    { mois: 'Déc', declarations: 100, factures: 32, paiements: 23 },
  ],
};

export function OverviewAppView() {
  const { user } = useMockedUser();

  const searchParams = useSearchParams();
  const router = useRouter();

  const theme = useTheme();

  const [filteredData, setFilteredData] = useState();
  const [currentType, setCurrentType] = useState('all');
  const [statistiquesCards, setStatistiquesCards] = useState();
  const [data, setData] = useState();
  const [lastData, setLastData] = useState(); // Utiliser les données mockées par défaut
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
  const [currentCompany, setCurrentCompany] = useState('all');
  const [currentCountry, setCurrentCountry] = useState('all');

  const handleFilterChange = async ({ year, months, type, company, country }) => {
    try {
      // Appel au backend avec l'année sélectionnée
      const response = await axios.get(API.dashboardAdmin(), {
        params: { year },
      });

      const rawData = response.data?.statistiques_sharts;
      const transformed = transformBackendData(rawData); // Convertir pour le frontend

      // Appliquer le filtre mois côté frontend
      const filtered =
        months.length > 0 ? transformed.filter((d) => months.includes(d.mois)) : transformed;

      // Mise à jour des states
      setFilteredData(filtered);
      setCurrentType(type);
      setCurrentYear(year);
      setCurrentCompany(company);
      setCurrentCountry(country);
      setData((prev) => ({ ...prev, [year]: transformed })); // Caching si besoin
    } catch (error) {
      console.error('Erreur lors du filtrage des données:', error);
    }
  };

  const moisLabels = [
    '',
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

  function transformBackendData(rawData) {
    const result = [];
    for (let i = 1; i <= 12; i++) {
      result.push({
        mois: moisLabels[i],
        declarations: rawData.declarations?.[i] ?? 0,
        factures: rawData.factures?.[i] ?? 0,
        paiements: rawData.payments?.[i] ?? 0,
      });
    }
    return result;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API.dashboardAdmin());
        // Assuming the response data is structured as expected
        const { data } = response;
        // Process the data as needed
        console.log('Dashboard Admin Data:', data);
        setStatistiquesCards(data.statistiques_cards); // Assuming the data contains statistiquesCards
        const transformedData = transformBackendData(data.statistiques_sharts);
        setLastData(response?.data?.declaration_facture_payment_list);
        setData((prev) => ({ ...prev, [currentYear]: transformedData }));
        setFilteredData(transformedData);
        // You can set the data to state or do something with it
      } catch (error) {
        console.error('Error fetching dashboard admin data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 5, p: 3, borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Tableau de Bord Administrateur
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bienvenue, <strong>{user?.name}</strong> — {user?.type_name}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <AppWidgetSummary
            title="Employés"
            percent={2.6}
            total={statistiquesCards?.total_employer}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [15, 18, 12, 51, 68, 11, 39, 37],
            }}
          />
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <AppWidgetSummary
            title="Declarations"
            percent={0.2}
            total={statistiquesCards?.total_declarations}
            chart={{
              colors: [theme.vars.palette.info.main],
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [20, 41, 63, 33, 28, 35, 50, 46],
            }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <AppWidgetSummary
            title=" Factures"
            percent={2.6}
            total={statistiquesCards?.number_of_facture}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [15, 18, 12, 51, 68, 11, 39, 37],
            }}
          />
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <AppWidgetSummary
            title="Paiements"
            percent={-0.1}
            total={statistiquesCards?.number_of_payement}
            chart={{
              colors: [theme.vars.palette.success.main],
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [18, 19, 31, 8, 16, 37, 12, 33],
            }}
          />
        </Grid>

        <Grid size={{ xs: 6, md: 12 }}>
          <Card>
            <Box
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                borderRadius: 1,
              }}
            >
              <Filters onFilterChange={handleFilterChange} />
              <MultiLineChart data={filteredData} type={currentType} company={currentCompany} />
              <ExportButtons
                data={filteredData}
                type={currentType}
                company={currentCompany}
                year={currentYear}
              />
            </Box>
          </Card>
        </Grid>

        {/*
         <Grid size={{ xs: 6, md: 4 }}>
          <AppCurrentDownload
            title="Permis Delivrés"
            subheader=""
            chart={{
              series: [
                { label: 'Permis A', value: 12244 },
                { label: 'Permis B', value: 53345 },
                { label: 'Permis C', value: 44313 },
              ],
            }}
          />
        </Grid> */}

        {/* <Grid size={{ xs: 6, md: 8 }}>
          <AppAreaInstalled
            title="Nombre Total Permis declarés"
            subheader="(+43%) Depuis l'année dernière"
            chart={{
              categories: [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
              ],
              series: [
                {
                  name: '2023',
                  data: [
                    { name: 'Permis A', data: [12, 10, 18, 22, 20, 12, 8, 21, 20, 14, 15, 16] },
                    { name: 'Permis B', data: [12, 10, 18, 22, 20, 12, 8, 21, 20, 14, 15, 16] },
                    { name: 'Permis C', data: [12, 10, 18, 22, 20, 12, 8, 21, 20, 14, 15, 16] },
                  ],
                },
                {
                  name: '2024',
                  data: [
                    { name: 'Permis A', data: [6, 18, 14, 9, 20, 6, 22, 19, 8, 22, 8, 17] },
                    { name: 'Permis B', data: [6, 18, 14, 9, 20, 6, 22, 19, 8, 22, 8, 17] },
                    { name: 'Permis C', data: [6, 18, 14, 9, 20, 6, 22, 19, 8, 22, 8, 17] },
                  ],
                },
                {
                  name: '2025',
                  data: [
                    { name: 'Permis A', data: [6, 20, 15, 18, 7, 24, 6, 10, 12, 17, 18, 10] },
                    { name: 'Permis B', data: [6, 20, 15, 18, 7, 24, 6, 10, 12, 17, 18, 10] },
                    { name: 'Permis C', data: [6, 20, 15, 18, 7, 24, 6, 10, 12, 17, 18, 10] },
                  ],
                },
              ],
            }}
          />
        </Grid> */}

        <Grid size={{ xs: 6, md: 12 }}>
          <DashboardAdmin lastData={lastData} />
        </Grid>

        {/*
        <Grid size={{ xs: 6, md: 4 }}>
          <AppTopRelated title="Entreprises" list={_appRelated} />
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <AppTopInstalledCountries title="Pays" list={_appInstalled} />
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <AppTopAuthors title="Utilisateurs" list={_appAuthors} />
        </Grid> */}

        {/* <Grid size={{ xs: 6, md: 4 }}>
          <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
            <AppWidget
              title="Conversion"
              total={38566}
              icon="solar:user-rounded-bold"
              chart={{ series: 48 }}
            />

            <AppWidget
              title="Applications"
              total={55566}
              icon="fluent:mail-24-filled"
              chart={{
                series: 75,
                colors: [theme.vars.palette.info.light, theme.vars.palette.info.main],
              }}
              sx={{ bgcolor: 'info.dark', [`& .${svgColorClasses.root}`]: { color: 'info.light' } }}
            />
          </Box>
        </Grid> */}
      </Grid>
    </DashboardContent>
  );
}
