'use client';
import { useEffect, useState, useCallback } from 'react';
import API from 'src/utils/api';
import axios from 'src/utils/axios';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import { paths } from 'src/routes/paths';
import { useTabs } from 'src/hooks/use-tabs';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { EmployeeCover } from '../employee-cover';
import { EmployeeInfo } from '../employee-info';
import { EmployeeDeclarations } from '../employee-declaration';
import { EmployeeJob } from '../employee-job';
import { EmployeeDoc } from '../employee-doc';
import { BiometricData } from '../../permit-employee/permit-biometrie';
import { DetailNotFoundView } from 'src/sections/error';

const TABS_ENTREPRISE = [
  { value: 'profile', label: 'Infos', icon: <Iconify icon="solar:user-id-bold" width={24} /> },
  { value: 'fonction', label: 'Fonction', icon: <Iconify icon="mdi:briefcase" width={24} /> },
  {
    value: 'declaration',
    label: 'Declarations',
    icon: <Iconify icon="solar:document-add-bold" width={24} />,
  },
  {
    value: 'doc',
    label: 'Documents',
    icon: <Iconify icon="mdi:file" width={24} />,
  },
  {
    value: 'biometrie',
    label: 'Biometrie',
    icon: <Iconify icon="mdi:fingerprint" width={24} />,
  },
];

export function EmployeeDetailsView({ slug }) {
  const [employee, setEmployee] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [declarations, setDeclarations] = useState([]);
  const [job, setJob] = useState([]);
  const [documents, setDocuments] = useState([]);

  const tabs = useTabs('profile');

  // Recuperation des donnees du profil

  const fetchEmployee = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API.detailsEmployee(slug));

      setEmployee(response.data);
      setJob(response.data.jobs);
      setDocuments(response.data.documents);

      const { declarations: employeeDeclarations } = response.data;

      setDeclarations(Array.isArray(employeeDeclarations) ? employeeDeclarations : []);
    } catch (err) {
      if (err?.status === 404) {
        setNotFound(true);
      } else {
        setError(err.message || 'Erreur lors du chargement des donnees.');
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleDocumentUploaded = () => {
    fetchEmployee();
  };

  const displayedTabs = TABS_ENTREPRISE;

  if (loading) return <div>Chargement...</div>;
  if (notFound)
    return (
      <DashboardContent>
        <DetailNotFoundView title="Employé introuvable" href={paths.dashboard.employee.list} />
      </DashboardContent>
    );
  if (error) return <div>{error}</div>;

  return (
    <DashboardContent>
      <Box sx={{ mb: { xs: 3, md: 5 } }}>
        <CustomBreadcrumbs
          heading="Details Employe"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Employes', href: paths.dashboard.employee.list },
            { name: employee?.first },
          ]}
        />
      </Box>

      <Card sx={{ mb: 3, height: 290, position: 'relative' }}>
        <EmployeeCover
          role={employee?.last}
          name={employee?.first}
          avatarUrl={employee?.picture}
          coverUrl={employee?.picture}
        />
        <Box
          display="flex"
          justifyContent={{ xs: 'center', md: 'flex-end' }}
          sx={{
            width: 1,
            bottom: 0,
            zIndex: 8,
            px: { md: 3 },
            position: 'absolute',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs value={tabs.value} onChange={tabs.onChange}>
            {displayedTabs.map((tab) => (
              <Tab key={tab.value} value={tab.value} icon={tab.icon} label={tab.label} />
            ))}
          </Tabs>
        </Box>
      </Card>

      {tabs.value === 'profile' && (
        <EmployeeInfo info={employee} onSyncSuccess={fetchEmployee} />
      )}
      {tabs.value === 'declaration' && (
        <EmployeeDeclarations declarations={declarations} loading={loading} employee={employee} />
      )}
      {tabs.value === 'fonction' && <EmployeeJob info={job} />}
      {tabs.value === 'doc' && (
        <EmployeeDoc
          documents={documents}
          employee={employee}
          onDocumentUploaded={handleDocumentUploaded}
        />
      )}
      {tabs.value === 'biometrie' && (
        <BiometricData
          picture={employee?.picture}
          signature={employee?.signature}
          fingerprints_picture={employee?.fingerprints_picture}
          employee_slug={employee?.slug}
          status={employee?.status}
          onUpdate={fetchEmployee}
          // ABIS désactivé 
          // abisLastRetrievedAt={employee?.abis_last_retrieved_at}
        />
      )}
    </DashboardContent>
  );
}

