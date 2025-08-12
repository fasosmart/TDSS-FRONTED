import React, { useState, useEffect, useCallback } from 'react';
import { paths } from 'src/routes/paths';
import {
  Box,
  Table,
  Stack,
  Button,
  Dialog,
  Switch,
  Toolbar,
  TableRow,
  Checkbox,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  TableFooter,
  Autocomplete,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import axios from 'src/utils/axios';
import API from 'src/utils/api';
import { Iconify } from 'src/components/iconify';
import { useRouter } from 'src/routes/hooks';
import { toast } from 'sonner';
import { EmployeeQuickEditForm } from './employe-quick-edit-form';

const fixedCategories = [
  { label: 'Tous', value: 'All' },
  { label: 'Cadres', value: 'Cadre' },
  { label: 'Agent', value: 'Agent de maitrise' },
  { label: 'Ouvrier', value: 'Ouvrier' },
];

const FilteredTable = ({ declaration, printMode = false }) => {
  const [selected, setSelected] = useState([]);
  const [filter, setFilter] = useState('All');
  const [dense, setDense] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [options, setOptions] = useState([]); // Liste des déclarations
  const [selectedDeclaration, setSelectedDeclaration] = useState(null); // Déclaration sélectionnée
  const [isDialogOpen, setIsDialogOpen] = useState(false); // État pour la boîte de dialogue
  const [loading, setLoading] = useState(false);
  const [employee, setEmployee] = useState([]); // Liste des employés
  // État pour l'ouverture du formulaire d'édition rapide
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isDialogSup, setIsDialogSup] = useState(false); // État pour la boîte de dialogue

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const router = useRouter();

  // Calcul des lignes selon le filtre
  const rows =
    filter === 'All' ? employee : employee?.filter((row) => row?.job?.category === filter);

  const isSelected = (slug) => selected.includes(slug);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows?.map((row) => row?.slug);
      setSelected(newSelected);
    } else {
      setSelected([]);
    }
  };

  const handleSelectRow = (event, slug) => {
    event.stopPropagation();
    setSelected((prevSelected) => {
      if (prevSelected.includes(slug)) {
        return prevSelected.filter((selectedId) => selectedId !== slug);
      }
      return [...prevSelected, slug];
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

 const handleViewDetailsEmploye = (employee) => {
    const employeeSlug = employee?.employee_slug || employee?.slug;

    if (!employeeSlug) {
      console.error("Aucun slug d'employé trouvé pour cet employé");
      toast.error("Impossible d'accéder aux détails de l'employé");
      return;
    }

    router.push(paths.dashboard.employee.details(employeeSlug));
  };
  useEffect(() => {
    const fetchDeclarations = async () => {
      setLoading(true);
      try {
        const offset = page * rowsPerPage;
        const params = {
          limit: 1000,
          offset: offset,
          status: 'unsubmitted',
        };
        const response = await axios.get(API.listDeclarations(), { params });
        const declarations = response.data.results
          .filter((d) => d.reference !== declaration?.reference)
          .map((declaration) => ({
            value: declaration?.reference,
           label: `${declaration?.number ?? ''} - ${declaration?.company ?? ''} `,

          }));
        setOptions(declarations);
      } catch (error) {
        console.error('Erreur lors de la récupération des déclarations :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeclarations();
  }, [declaration, printMode]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!declaration || !declaration?.slug) {
        toast("La déclaration n'est pas définie.");
        return;
      }
      setLoading(true);
      try {
        const params = {
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        };
        const response = await axios.get(API.Employe(declaration?.slug), { params });
        const employees = response.data.results;
        setEmployee(employees);
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des employés :', error);
      } finally {
        setLoading(false);
      }
    };

    if (declaration && declaration?.slug) {
      fetchEmployees();
    }
  }, [declaration, page, rowsPerPage]);

  const handleMove = useCallback(async () => {
    if (!declaration || !declaration?.slug) {
      toast("La déclaration n'est pas définie.");
      return;
    }
    try {
      const payload = {
        selected_slugs: selected,
        target_reference: selectedDeclaration?.value,
      };

      const response = await axios.post(API.move(declaration?.slug), payload);
      if (response.status === 200) {
        toast.success('Déplacement effectué avec succès !');
        setEmployee((prevData) => prevData.filter((row) => !selected.includes(row?.slug)));
        setSelected([]);
        setIsDialogOpen(false);
        // router.push(paths.dashboard.declaration.list);
      }
    } catch (error) {
      console.error('Erreur lors du déplacement :', error);
      const errorMessage = error.error || error.details || error.message;
      toast.error(`Erreur : ${errorMessage}`);
    }
  }, [declaration, selected, selectedDeclaration, router]);

  const handleDeleteRows = async () => {
    try {
      const slugs = {
        slugs: selected,
      };
      const response = await axios.post(API.DeleteEmploye(declaration?.slug), slugs);
      if (response.status === 200) {
        setEmployee((prevData) => prevData.filter((row) => !selected.includes(row?.slug)));
        setSelected([]);
        setIsDialogSup(false);
        toast.success('Suppression reussie!');
        window.location.reload();
      } else {
        console.error('Erreur lors de la suppression:', response.error);
        toast.error(`Erreur : ${response.error}`);
      }
    } catch (error) {
      console.error('Erreur réseau ou serveur:', error);

      const errorMessage = error.error || error.details || error.message;
      toast.error(`Erreur : ${errorMessage}`);
    }
  };

  // Gestion de l'ouverture du formulaire d'édition rapide
  const openQuickEdit = (emp) => {
    setCurrentEmployee(emp);
    setQuickEditOpen(true);
  };

  const closeQuickEdit = () => {
    setQuickEditOpen(false);
    setCurrentEmployee(null);
  };

  const handleUpdateRow = useCallback((updatedEmployee) => {
    setEmployee((prevData) =>
      prevData.map((row) => (row?.slug === updatedEmployee?.slug ? updatedEmployee : row))
    );
  }, []);

  return (
    <>
      {/* Barre de menu pour les filtres */}
      <Toolbar
        sx={{
          pl: 2,
          pr: 2,
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: selected.length > 0 ? 'rgba(0, 0, 255, 0.1)' : 'inherit',
        }}
      >
        {selected.length > 0 ? (
          <Typography variant="subtitle1" color="primary">
            {selected?.length} sélectionné(s)
          </Typography>
        ) : (
          <Typography variant="h6" />
        )}

        {selected.length > 0 && (
          <Stack direction="row" spacing={2}>
            <Tooltip title="Déplacer">
              <IconButton color="primary" onClick={() => setIsDialogOpen(true)}>
                <Iconify icon="iconamoon:send-fill" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton color="primary" onClick={() => setIsDialogSup(true)}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
        {/* Boîte de dialogue */}
        <Dialog fullWidth open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <DialogTitle>Déplacer</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 4 }}>
              Êtes-vous sûr de vouloir déplacer <strong>{selected?.length}</strong> personnes ?
            </Typography>
            <Autocomplete
              options={options}
              getOptionLabel={(option) => (option?.label ? option?.label.toString() : '')}
              loading={loading}
              value={selectedDeclaration}
              onChange={(event, newValue) => setSelectedDeclaration(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Rechercher ou sélectionner une déclaration"
                  placeholder="Taper pour rechercher"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                handleMove();
                setIsDialogOpen(false);
              }}
            >
              Déplacer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Boîte de dialogue de suppression */}
        <Dialog open={isDialogSup} onClose={() => setIsDialogSup(false)}>
          <DialogTitle>Supprimer</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Êtes-vous sûr de vouloir suprimer <strong>{selected?.length}</strong> employés ?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogSup(false)}>Annuler</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleDeleteRows();
                setIsDialogSup(false);
              }}
            >
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
      {/* Tableau */}
      <TableContainer>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            backgroundColor: printMode ? 'transparent' : 'transparent',
            padding: 1,
            marginBottom: 5,
          }}
        >
          {fixedCategories?.map((cat) => {
            const count =
              cat.value === 'All'
                ? pagination?.count
                : employee.filter((emp) => emp?.job?.category === cat.value).length;
            return (
              <Button
                key={cat.value}
                variant={filter === cat?.value ? 'contained' : 'text'}
                size="small"
                onClick={() => setFilter(cat?.value)}
                sx={{ flexDirection: 'column', alignItems: 'center', minWidth: 80 }}
              >
                <Typography variant="body1">{cat?.label}</Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                >
                  {count}
                </Typography>
              </Button>
            );
          })}
        </Box>

        <Table size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                {declaration?.status === 'unsubmitted' && (
                  <Checkbox
                    indeterminate={selected?.length > 0 && selected?.length < rows?.length}
                    checked={rows?.length > 0 && selected.length === rows?.length}
                    onChange={handleSelectAllClick}
                  />
                )}
              </TableCell>
              <TableCell>Numéro du passeport</TableCell>
              <TableCell>Nom & Prénom</TableCell>
              <TableCell>N° Téléphone</TableCell>
              <TableCell>Fonction</TableCell>
              <TableCell>Permis</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              // ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <React.Fragment key={`${row?.id}-${row?.slug}`}>
                  <TableRow hover selected={isSelected(row?.slug)} onClick={() =>handleViewDetailsEmploye(row)} style={{ cursor: 'pointer' }}>
                    <TableCell padding="checkbox" >
                      {declaration?.status === 'unsubmitted' && (
                        <Checkbox
                          color="primary"
                          checked={isSelected(row.slug)}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSelectRow(event, row?.slug);
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{row?.passport_number}</TableCell>
                    <TableCell>
                      <ListItemText
                        onClick={(event) => {
                          event.stopPropagation();
                          openQuickEdit(row);
                        }}
                        style={{ cursor: 'pointer' }}
                        primary={row.last}
                        secondary={row.first}
                        slotProps={{
                          primary: { typography: 'body2', noWrap: true },
                          secondary: { mt: 0.5, component: 'span', typography: 'body2' },
                        }}
                      />
                    </TableCell>
                    <TableCell>{row?.phone}</TableCell>
                    <TableCell>{row?.job?.name}</TableCell>
                    <TableCell>{row?.job?.permit}</TableCell>
                  </TableRow>
                  {declaration?.status === 'unsubmitted' && (
                    <EmployeeQuickEditForm
                      currentEmployee={row}
                      open={quickEditOpen && currentEmployee?.slug === row?.slug}
                      onClose={closeQuickEdit}
                      onUpdateRow={handleUpdateRow}
                      dec_slug={declaration.slug}
                    />
                  )}
                </React.Fragment>
              ))}
          </TableBody>
          {!printMode && (
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  count={pagination.count}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
      {!printMode && (
        <Box sx={{ p: 2 }}>
          <FormControlLabel
            control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} />}
            label="Dense"
          />
        </Box>
      )}
    </>
  );
};

export default FilteredTable;
