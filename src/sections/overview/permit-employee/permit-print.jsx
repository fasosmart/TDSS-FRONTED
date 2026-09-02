import { useState, useRef, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

import { Iconify } from 'src/components/iconify';

// Images de fond (vous devrez les héberger sur votre serveur)
const CARD_FRONT_BG = '/assets/images/permit/carte-recto.png';
const CARD_BACK_BG = '/assets/images/permit/carte-verso.png';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function WorkPermitCard({ permit, onClose, open, onPrint }) {
  const [flipped, setFlipped] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [openPrintDialog, setOpenPrintDialog] = useState(false);
  const [printMode, setPrintMode] = useState('a4');
  const cardRef = useRef(null);

  // Générer le QR code au montage
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrData = encodeURIComponent(` ${permit?.card_number}${permit?.contract_duration}`);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${qrData}&size=200x200`;
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Erreur génération QR code:', error);
      }
    };

    if (permit) {
      generateQRCode();
    }
  }, [permit]);

  const handlePreview = async () => {
    // Le QR code est déjà généré via useEffect
  };

  const handlePrintClick = async () => {
    try {
      const ok = await onPrint?.();

      if (ok) {
        onClose?.();
        setOpenPrintDialog(true);
      } else {
        onClose?.();
      }
    } catch (error) {
      console.error('Erreur lors du print click:', err);
      onClose?.();
    }
  };

  const handleConfirmPrint = () => {
    setOpenPrintDialog(false);

    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      const printDocument = printWindow.document;

      printDocument.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Carte de Permis - ${permit?.card_number || 'N/A'}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;

                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: geometricPrecision;
              }
              
              body {
                margin: 0;
                padding: 20px;
                background: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: "Bahnschrift SemiBold Condensed", Bahnschrift, Arial, sans-serif;
              }
              
              .print-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
                align-items: center;
              }
              
              .card-face {
                width: 86mm;
                height: 54mm;
                background: white;
                position: relative;
                overflow: hidden;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              .card-background {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
              
              .card-content {
                position: relative;
                width: 100%;
                height: 100%;
                z-index: 1;
              }
              
              @media print {
                @page {
                  margin: 0;
                  size: ${printMode === 'duplex' ? '86mm 54mm' : 'A4'};
                }
                
                body {
                  margin: 0 !important;
                  padding: ${printMode === 'a4' ? '15mm' : '0'} !important;
                }
                
                .print-container {
                  gap: ${printMode === 'a4' ? '10mm' : '0'} !important;
                }
                
                .card-face {
                  box-shadow: none !important;
                  ${printMode === 'a4' ? 'border: 0.5mm solid #ccc;' : ''}
                }
                
                ${printMode === 'duplex' ? '.card-front { page-break-after: always; }' : ''}
                
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${getCardFrontHTML()}
              ${getCardBackHTML()}
            </div>
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  setTimeout(() => {
                    window.close();
                  }, 500);
                }, 500);
              };
            </script>
          </body>
        </html>
      `);

      printDocument.close();
    }, 100);
  };

  function createLabelValueHTML(label, value, options = {}) {
    const {
      labelFontSize = 2.1,
      valueFontSize = 2.8,
      labelWeight = 400,
      valueWeight = 700,
      marginBottom = 1,
      uppercase = true,
      valueNoWrap = false,
    } = options;

    const displayValue = (value && (uppercase ? String(value).toUpperCase() : value)) || 'N/A';

    const shouldLimit =
      label.trim().toUpperCase() === 'FONCTION' || label.trim().toUpperCase() === 'ADRESSE';

    const limitedStyle = shouldLimit
      ? `
      max-width: 30mm;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `
      : '';

    return `
    <div style="
      margin-bottom: ${marginBottom}mm;
      color: #000;
      display: flex;
      align-items: baseline;
      line-height: 1;
     
    ">
      <span style="font-size: ${labelFontSize}mm; font-weight: ${labelWeight}; white-space: nowrap; flex-shrink: 0;">
        ${label} :
      </span>
      <span style="
        font-family: &quot;Bahnschrift SemiBold Condensed&quot;, Bahnschrift, Arial, sans-serif;
        font-stretch: condensed;
        font-size: ${valueFontSize}mm;
        font-weight: ${valueWeight};
        letter-spacing: 0;
        margin-left: 1mm;
        min-width: 0;
        ${valueNoWrap ? 'white-space: nowrap;' : ''}
       
        ${limitedStyle}
      ">
        ${displayValue}
      </span>
    </div>
  `;
  }

  function createEmployerHTML(label, value) {
    const text = (value || 'N/A').toUpperCase();
    const length = text.length;

    // Taille adaptative TRÈS LARGE
    let fontSize = 3.6; // mm (normal)

    if (length > 55) fontSize = 2.6;
    else if (length > 45) fontSize = 2.8;
    else if (length > 35) fontSize = 3.0;
    else if (length > 28) fontSize = 3.2;

    return `
    <div style="
      margin-bottom: 1mm;
      color: #000;
      font-size: 1.8mm;
      line-height: 1;
    ">
      <span style="font-weight: 400;">
        ${label} :
      </span>
      <span style="
        font-family: &quot;Bahnschrift SemiBold Condensed&quot;, Bahnschrift, Arial, sans-serif;
        font-stretch: condensed;
        font-size: ${fontSize}mm;
        font-weight: 800;
        letter-spacing: 0;
        display: inline-block;
        max-width: 38mm;
        white-space: nowrap;
        overflow: hidden;
        vertical-align: middle;
      ">
        ${text}
      </span>
    </div>
  `;
  }

  const getCardFrontHTML = () => `
      <div class="card-face card-front">
        
        <div class="card-content" style="padding: 8mm 5mm;">
          
          <!-- Photo - Position absolue en haut à gauche -->
          <div style="position: absolute; top: 19mm; left: 3.8mm; width: 20mm; height: 29mm; background: white;  overflow: hidden; display: flex; align-items: center; justify-content: center;">
            ${
              permit?.picture
                ? `<img src="${permit.picture}" alt="Photo" style="width: 100%; height: 100%; object-fit: cover;" />`
                : '<div style="color: #999; font-size: 2.5mm;">PHOTO</div>'
            }
          </div>

          <!-- Informations à droite de la photo -->
          <div style="position: absolute; top: 22mm; left: 28mm; right: 10mm;">
            <!-- NOM -->
            ${createLabelValueHTML('N° IDENTITE ', permit?.passport_number)}
            ${createLabelValueHTML('NOM ', permit?.last)}
            ${createLabelValueHTML('PRÉNOM(S) ', permit?.first)}
            ${createLabelValueHTML('NÉ(E) LE ', formatDate(permit?.birthday))}
            ${createLabelValueHTML('À ', permit?.birth_place)}
            ${createLabelValueHTML('NATIONALITÉ ', permit?.nationality)}
            ${createLabelValueHTML('SEXE ', permit?.sexe === 'male' ? 'HOMME' : 'FEMME')}
         
           
          </div>

          <!-- SIGNATURE en bas -->
         <div 
            style="
              position: absolute; 
              top: 48mm; 
              left: 4mm; 
              width: 20mm; 
              height: 6mm; 
              
              display: flex; 
              align-items: center; 
              justify-content: center; 
              overflow: hidden;
            "
          >
            ${
              permit?.signature
                ? `<img src="${permit.signature}" alt="signature"
                    style="max-height: 100%; max-width: 100%; object-fit: contain;" />`
                : `<div style="font-size: 1.8mm; color: #000; font-weight: 400;">
                    SIGNATURE DU TITULAIRE
                  </div>`
            }
          </div>


          <!-- NUMÉRO DE CARTE en haut à droite -->
          <div style="position: absolute; top: 14mm; left: 50.2mm; font-size: 3mm; font-weight: 700; color: #000;">
            N°${permit?.card_number}
          </div>
        </div>
      </div>
    `;

  const getCardBackHTML = () => `
      <div class="card-face card-back">
        
        <div class="card-content" style="padding: 8mm 5mm;">
          
          <!-- Section supérieure avec informations employeur -->
          <div style="position: absolute; top: 4mm; left: 3mm; right: 17mm;">
          <!-- EMPLOYEUR -->
          ${createLabelValueHTML('EMPLOYEUR', permit?.company_sigle)}


            <!-- ADRESSE EMPLOYEUR -->
            ${createLabelValueHTML('ADRESSE', permit?.company_address || 'N/A')}

            <!-- FONCTION -->
           ${createLabelValueHTML('FONCTION ', permit?.job?.name || 'N/A')}
            
            <!-- CATÉGORIE -->
          ${createLabelValueHTML('CATÉGORIE ', `TYPE ${getLabelPermit(permit?.category || permit?.job?.permit) || ''}`)}
            

            <!-- VALIDITÉ ET DURÉE -->
            ${createLabelValueHTML('DEBUT CONTRAT', formatDate(permit?.contract_starts_at))}
       
             <div style="display: flex; gap: 3mm; align-items: baseline;">
               <div style="flex: 0 0 50%; min-width: 0;">
                 ${createLabelValueHTML('DURÉE CONTRAT', calculateDuration(permit?.contract_starts_at, permit?.contract_duration), { marginBottom: 0, valueNoWrap: true })}
               </div>
               <div style="flex: 1; min-width: 0; padding-left: 2mm;">
                 ${createLabelValueHTML('VALIDITÉ ', formatDate(permit?.card_expires_at), { marginBottom: 0, valueNoWrap: true })}
               </div>
             </div>

       
          </div>

          <!-- Photo miniature en haut à droite -->
          <div style="position: absolute; top: 7mm; right: 27mm; width: 8mm; height: 12mm; background: white;  overflow: hidden; display: flex; align-items: center; justify-content: center;">
            ${
              permit?.picture
                ? `<img src="${permit.picture}" alt="Photo" style="width: 100%; height: 100%; object-fit: cover;" />`
                : '<div style="color: #999; font-size: 2mm;">PHOTO</div>'
            }
          </div>

          <!-- QR Code en bas à gauche -->
          <div style="position: absolute; bottom: 8mm; left: 4mm; width: 17mm; height: 17mm; background: white;  display: flex; align-items: center; justify-content: center; overflow: hidden;">
            ${
              qrCodeUrl
                ? `<img src="${qrCodeUrl}" alt="QR Code" style="width: 100%; height: 100%;" />`
                : '<div style="color: #ccc; font-size: 2mm;">QR</div>'
            }
          </div>

          <!-- NUMÉRO DE CARTE en bas à droite -->
         
          
        </div>
      </div>
    `;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateLong = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date
      .toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      .toUpperCase();
  };

  const previewTextSx = {
    fontFamily: '"Bahnschrift SemiBold Condensed", Bahnschrift, Arial, sans-serif',
    fontSize: '10.3pt',
    fontStretch: 'condensed',
    color: '#000',
    letterSpacing: 0,
    lineHeight: 1,
  };

  const LabelValue = ({ label, value, valueNoWrap = false }) => (
    <Typography
      sx={{
        ...previewTextSx,
        mb: '1.2mm',
        width: '100%',
        display: 'flex',
        alignItems: 'baseline',
        minWidth: 0,
      }}
    >
      <Box component="span" sx={{ fontWeight: 400, mr: '1mm', whiteSpace: 'nowrap' }}>
        {label} :
      </Box>
      <Box
        component="span"
        sx={{
          ...previewTextSx,
          fontWeight: 600,
          minWidth: 0,
          verticalAlign: 'middle',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: valueNoWrap ? 'nowrap' : 'normal',
        }}
        title={value}
      >
        {value || 'N/A'}
      </Box>
    </Typography>
  );

  const InlineLabelValue = ({ label, value, sx }) => (
    <Typography
      sx={{
        ...previewTextSx,
        minWidth: 0,
        display: 'flex',
        alignItems: 'baseline',
        ...sx,
      }}
    >
      <Box component="span" sx={{ fontWeight: 400, mr: '1mm', flexShrink: 0 }}>
        {label} :
      </Box>
      <Box
        component="span"
        sx={{
          ...previewTextSx,
          fontWeight: 600,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={value}
      >
        {value || 'N/A'}
      </Box>
    </Typography>
  );

  const calculateDuration = (startDate, duration) => {
    if (!startDate || !duration) return 'N/A';
    return `${duration} MOIS`;
  };

  const getLabelPermit = (type) => {
    const map = {
      'Permis A': ' A',
      'Permis B': 'B',
      'Permis C': 'C',
    };
    return type ? map[type] || String(type) : 'N/A';
  };

  // Composants pour l'aperçu (avec fond d'image)
  const CardFront = () => (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: 0,
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      }}
    >
      {/* Image de fond */}
      <Box
        component="img"
        src={CARD_FRONT_BG}
        alt="Background"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Contenu par-dessus */}
      <Box sx={{ position: 'relative', height: '100%' }}>
        {/* Photo */}
        <Box
          sx={{
            position: 'absolute',
            top: '22.8mm',
            left: '4.5mm',
            width: '23.7mm',
            height: '34.4mm',
            bgcolor: 'white',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {permit?.picture ? (
            <img
              src={permit.picture}
              alt={`${permit?.first} ${permit?.last}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Iconify icon="mdi:account" width={60} sx={{ color: 'grey.500' }} />
          )}
        </Box>

        {/* Informations */}
        <Box sx={{ position: 'absolute', top: '22.6mm', left: '33.3mm', right: '11.9mm' }}>
          <LabelValue label="N° IDENTITE " value={permit?.passport_number || 'N/A'} />
          <LabelValue label="NOM " value={permit?.last?.toUpperCase()} />

          <LabelValue label=" PRÉNOM(S) " value={permit?.first?.toUpperCase()} />
          <LabelValue label="NÉ(E) LE" value={formatDate(permit?.birthday)} />

          <LabelValue label="À " value={permit?.birth_place?.toUpperCase() || 'N/A'} />

          <LabelValue label="NATIONALITE " value={permit?.nationality?.toUpperCase() || 'N/A'} />

          <LabelValue label="SEXE " value={permit?.sexe === 'male' ? 'HOMME' : 'FEMME'} />
        </Box>

        {/* Signature */}
        <Box
          sx={{
            position: 'absolute',
            top: '57mm',
            left: '4.7mm',
            width: '23.7mm',
            height: '7.1mm',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: 30,
              // border: '1px solid #999',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {permit?.signature ? (
              <img
                src={permit.signature}
                alt="signature"
                style={{ height: '100%', objectFit: 'contain', alignSelf: 'center' }}
              />
            ) : (
              <Typography sx={{ ...previewTextSx, fontSize: '7pt', fontWeight: 600 }}>
                SIGNATURE TITULAIRE
              </Typography>
            )}
          </Box>
        </Box>

        {/* Numéro */}
        <Typography
          sx={{
            position: 'absolute',
            top: '16.6mm',
            left: '59.4mm',
            ...previewTextSx,
            fontSize: '12pt',
            fontWeight: 600,
          }}
        >
          N° {permit?.card_number}
        </Typography>
      </Box>
    </Box>
  );

  const CardBack = () => (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: 0,
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      }}
    >
      {/* Image de fond */}
      <Box
        component="img"
        src={CARD_BACK_BG}
        alt="Background"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Contenu */}
      <Box sx={{ position: 'relative', height: '100%' }}>
        {/* Photo miniature */}
        <Box
          sx={{
            position: 'absolute',
            top: '8.3mm',
            right: '32.6mm',
            width: '9.5mm',
            height: '14.2mm',
            bgcolor: 'white',
            overflow: 'hidden',
          }}
        >
          {permit?.picture ? (
            <img
              src={permit.picture}
              alt="Titulaire du permis"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Iconify icon="mdi:account" width={35} sx={{ color: 'grey.500' }} />
            </Box>
          )}
        </Box>

        {/* Informations */}
        <Box sx={{ position: 'absolute', top: '4.7mm', left: '5.9mm', right: '20.2mm' }}>
          <LabelValue label="EMPLOYEUR" value={permit?.company_sigle?.toUpperCase() || 'N/A'} />

          <LabelValue label="ADRESSE" value={permit?.company_address || 'N/A'} />
          <LabelValue label="FONCTION" value={permit?.job?.name?.toUpperCase() || 'N/A'} />
          <LabelValue
            label="CATEGORIE "
            value={`TYPE ${getLabelPermit(permit?.category || permit?.job?.permit) || ''}`}
          />
          <LabelValue label="DEBUT CONTRAT" value={formatDate(permit?.contract_starts_at)} />
          <Box sx={{ display: 'flex', gap: '3.6mm', alignItems: 'baseline', width: '100%' }}>
            <InlineLabelValue
              label="DUREE CONTRAT "
              value={calculateDuration(permit?.contract_starts_at, permit?.contract_duration)}
              sx={{ flex: '0 0 50%', minWidth: 0 }}
            />
            <InlineLabelValue
              label="VALIDITE "
              value={formatDate(permit?.card_expires_at)}
              sx={{ flex: 1, minWidth: 0, pl: '2.4mm' }}
            />
          </Box>
        </Box>

        {/* QR Code */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '9.5mm',
            left: '7.1mm',
            width: '20.2mm',
            height: '20.2mm',
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR Code" style={{ width: '100%', height: '100%' }} />
          ) : (
            <Iconify icon="mdi:qrcode" width={50} sx={{ color: 'grey.400' }} />
          )}
        </Box>

        {/* Numéro */}
        {/* <Typography
          sx={{
            position: 'absolute',
            bottom: '5mm',
            left: '8mm',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#000',
          }}
        >
          N° {permit?.card_number || permit?.reference}
        </Typography> */}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Boutons d'action */}
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<Iconify icon="mdi:eye" />}
          onClick={handlePreview}
          sx={{ fontWeight: 600 }}
        >
          Aperçu de la carte
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="mdi:printer" />}
          onClick={handlePrintClick}
          sx={{ fontWeight: 600 }}
        >
          Imprimer
        </Button>
      </Stack>

      {/* Dialog de prévisualisation */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'grey.100',
          },
        }}
      >
        <DialogContent
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              mb: 3,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Aperçu de la carte de permis
            </Typography>
            <IconButton onClick={onClose}>
              <Iconify icon="mdi:close" />
            </IconButton>
          </Box>

          {/* Carte 3D avec flip */}
          <Box
            sx={{
              perspective: '1500px',
              mb: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Box
              ref={cardRef}
              sx={{
                width: '386px',
                height: '243px',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.8s cubic-bezier(0.4, 0.2, 0.2, 1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                cursor: 'pointer',
              }}
              onClick={() => setFlipped(!flipped)}
            >
              {/* Face avant */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <CardFront />
              </Box>

              {/* Face arrière */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <CardBack />
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              p: 2,
              bgcolor: 'info.lighter',
              borderRadius: 1,
            }}
          >
            <Iconify icon="mdi:information" width={20} sx={{ color: 'info.main' }} />
            <Typography variant="body2" color="info.dark">
              Cliquez sur la carte pour la retourner et voir le verso
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={onClose} color="inherit">
            Fermer
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mdi:printer" />}
            onClick={() => {
              handlePrintClick();
            }}
          >
            Imprimer cette carte
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'options d'impression */}
      <Dialog
        open={openPrintDialog}
        onClose={() => setOpenPrintDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Options d'impression de la carte
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
              Mode d'impression
            </FormLabel>
            <RadioGroup value={printMode} onChange={(e) => setPrintMode(e.target.value)}>
              <FormControlLabel
                value="a4"
                control={<Radio />}
                label="Aperçu A4 (recto et verso sur la même page)"
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                value="duplex"
                control={<Radio />}
                label="Impression recto-verso (pour cartes réelles)"
              />
            </RadioGroup>
          </FormControl>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            {printMode === 'a4' ? (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Iconify icon="mdi:information" width={20} sx={{ color: 'info.main' }} />
                  Mode Aperçu A4
                </Typography>
                <Box component="ul" sx={{ pl: 3, m: 0, '& li': { mb: 0.5 } }}>
                  <li>Le recto et le verso s'affichent l'un au-dessus de l'autre</li>
                  <li>Parfait pour visualiser le résultat avant impression finale</li>
                  <li>Utilisez du papier A4 standard</li>
                  <li>Format carte: 86mm x 54mm</li>
                </Box>
              </>
            ) : (
              <>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Iconify icon="mdi:printer" width={20} sx={{ color: 'info.main' }} />
                  Mode Recto-Verso
                </Typography>
                <Box component="ul" sx={{ pl: 3, m: 0, '& li': { mb: 0.5 } }}>
                  <li>Chaque face sera imprimée sur une page séparée</li>
                  <li>Activez l'impression recto-verso dans les paramètres de votre imprimante</li>
                  <li>Utilisez des cartes vierges au format 86mm x 54mm</li>
                  <li>Le verso sera automatiquement inversé pour l'alignement</li>
                  <li>Les images de fond seront imprimées</li>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setOpenPrintDialog(false)} color="inherit">
            Annuler
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="mdi:printer" />}
            onClick={handleConfirmPrint}
          >
            Lancer l'impression
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
