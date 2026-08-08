'use client';
import { Iconify } from 'src/components/iconify';
import { useTabs } from 'src/hooks/use-tabs';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { useCallback, useEffect, useState } from 'react';
import API from 'src/utils/api';
import { toast } from 'src/components/snackbar';
import axios from 'src/utils/axios';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import { usePermissions } from 'src/auth/hooks';

import { EmployeeCover } from '../../employee/employee-cover';

import { PermitEmployeeDoc } from '../permit-employee-doc';
import { PermitEmloyeeInfo } from '../permit-employee-info';
import { PermitDeclaration } from '../permit-employee-dec';
import { PermitJob } from '../permit-job';
import { PermitInfo } from '../info-permit';
import { PermitToolbar } from '../permit-toolbar';
import { PlanAfricanisation } from '../plan-africanisation';
import { BiometricData } from '../permit-biometrie';

const TABS_PERMITS = [
  { value: 'info', label: 'Info Permit', icon: <Iconify icon="solar:user-id-bold" width={24} /> },

  { value: 'details', label: 'Détails', icon: <Iconify icon="solar:user-id-bold" width={24} /> },
  {
    value: 'declaration',
    label: 'Déclarations',
    icon: <Iconify icon="solar:document-add-bold" width={24} />,
  },

  {
    value: 'doc',
    label: 'Documents',
    icon: <Iconify icon="mdi:file" width={24} />,
  },
  {
    value: 'plan',
    label: 'Plan de panafricanisation',
    icon: <Iconify icon="mdi:earth" width={24} />,
  },
  {
    value: 'biometrie',
    label: 'Biometrie',
    icon: <Iconify icon="solar:user-id-bold" width={24} />,
  },
];

export function PermitDetailView({ slug }) {
  const tabs = useTabs('info');
  const { can } = usePermissions();
  const canCorrect = can('can_correct_declaration_employee');
  const [loading, setLoading] = useState(true);

  const [permit, setPermit] = useState();
  const [abis, setAbis] = useState();
  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState();
  const [job, setJob] = useState();
  const [declarations, setDeclarations] = useState([]);
  const [error, setError] = useState(null);

  const displayedTabs = TABS_PERMITS;

  const fecthPermit = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API.detailPermitEmployee(slug));
      setPermit(response.data);
      setJob(response.data.job);
      setDocuments(response.data.documents);
      setDeclarations(response.data.declarations);
    } catch (error) {
      const errorMessage = error.data || error.details || error.message || error.detail;
      setError(errorMessage);
      toast.error(error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fecthPermit();
  }, [fecthPermit]);

  useEffect(() => {
    if (permit) {
      setStatus(permit.status);
    }
  }, [permit]);

  const handleDocumentUploaded = () => {
    fecthPermit();
  };

  const handleDocumentUpdated = (updatedDoc) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => (doc.slug === updatedDoc.slug ? updatedDoc : doc))
    );
  };

  const handleUpdatePlan = (updatedPlan) => {
    setPermit((prev) => ({
      ...prev,
      africanization_plan: updatedPlan, // 🔥 met à jour uniquement cette partie
    }));
  };

  const handleUpdate = (updatedData) => {
    setPermit((prev) => ({ ...prev, ...updatedData }));
  };

  const [rejectReasons, setRejectReasons] = useState([]);

  useEffect(() => {
    if (!canCorrect) return;

    const fetchRejectReasons = async () => {
      try {
        const response = await axios.get(API.listRejectReasons());
        setRejectReasons(response.data.results);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRejectReasons();
  }, [canCorrect]);

  const handleChangeStatus = useCallback((newStatus) => {
    setStatus(newStatus);
  }, []);

  return (
    <DashboardContent>
      <Box sx={{ mb: { xs: 1, md: 1 } }}>
        <CustomBreadcrumbs
          heading="Détails"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Permits', href: paths.dashboard.permit.root },
            { name: 'Détails Permis' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <PermitToolbar
          permit={permit}
          currentStatus={status}
          rejectReasons={rejectReasons}
          onChangeStatus={handleChangeStatus}
        />
      </Box>
      <Card sx={{ mb: 3, height: 290, position: 'relative' }}>
        <EmployeeCover
          role={permit?.last}
          name={permit?.first}
          avatarUrl={permit?.picture}
          coverUrl={permit?.picture}
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
      {tabs.value === 'details' && (
        <PermitEmloyeeInfo info={permit} onSyncSuccess={fecthPermit} />
      )}

      {tabs.value === 'doc' && (
        <PermitEmployeeDoc
          documents={documents}
          employee={permit}
          onDocumentUploaded={handleDocumentUploaded}
          onDocumentUpdated={handleDocumentUpdated}
          type={permit?.type}
        />
      )}

      {tabs.value === 'declaration' && (
        <PermitDeclaration
          declaration_number={permit?.declaration_number}
          declaration_slug={permit?.declaration_slug}
          type={permit?.type_display}
        />
      )}

      {tabs.value === 'info' && (
        <PermitInfo
          permit={permit?.job?.permit}
          created_at={permit?.created_on}
          expired_at={permit?.card_expires_at}
          status={status}
          permits={permit}
        />
      )}
      {tabs.value === 'plan' && (
        <PlanAfricanisation
          info={permit?.africanization_plan}
          employeeId={permit?.slug}
          employeeName={`${permit?.first} ${permit?.last}`}
          isExpatriate={
            permit &&
            !['guinéen', 'guineen', 'guinéenne', 'guineenne'].includes(
              permit?.nationality?.toLowerCase().trim()
            ) &&
            permit?.country?.toLowerCase().trim() !== 'guinée'
          }
          onUpdate={handleUpdatePlan}
        />
      )}

      {tabs?.value === 'biometrie' && (
        <BiometricData
          picture={permit?.picture}
          signature={permit?.signature}
          employee_slug={permit?.employee_slug}
          fingerprints_picture={permit?.fingerprints_picture}
          onUpdate={handleUpdate}
          status={permit?.status}
          abisLastRetrievedAt={permit?.abis_last_retrieved_at}
        />
      )}
    </DashboardContent>
  );
}
