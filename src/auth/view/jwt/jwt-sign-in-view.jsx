'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { useSearchParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import { FormHead } from '../../components/form-head';
import { signInWithPassword } from '../../context/jwt';
import { useAuthContext } from '../../hooks';

// ----------------------------------------------------------------------

export const SignInSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: "l'email est obligatoire" })
    .email({ message: "l'email doit être un email valide!" }),
  password: zod
    .string()
    .min(1, { message: 'Mot de passe obligatoire!' })
    .min(8, { message: 'le mot de passe doit avoir au moins 8 characters!' }),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const searchParams = useSearchParams();
  const activated = searchParams.get('activated');

  const router = useRouter();
  const { checkUserSession } = useAuthContext();
  const [errorMsg, setErrorMsg] = useState('');
  const password = useBoolean();

  const defaultValues = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMsg(''); // Réinitialise le message d'erreur
      await signInWithPassword({ email: data.email, password: data.password });
      await checkUserSession?.();
      // dans JwtSignInView → onSubmit
      if (activated) {
        window.location.href = `${paths.dashboard.root}?activated=true`;
        return;
      }

      // si pas d’activation on redirige simplement
      router.push(paths.dashboard.root);
    } catch (error) {
      const raw = typeof error === 'string' ? error : error?.message || '';
      const friendly = /no active account/i.test(raw)
        ? 'Identifiant ou mot de passe incorrect.'
        : raw || 'Échec de la connexion.';
      setErrorMsg(friendly);
    }
  });

  const {
    register,
    formState: { errors },
  } = methods;

  const renderForm = (
    <Box gap={3} display="flex" flexDirection="column">
      <Field.Text
        name="email"
        label="Email"
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message}
        InputLabelProps={{ shrink: true }}
      />

      <Box gap={1.5} display="flex" flexDirection="column">
        <Link
          component={RouterLink}
          href={paths.auth.jwt.resetPassword}
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          Mot de passe oublié?
        </Link>

        <Field.Text
          name="password"
          label="Mot de passe"
          placeholder="8+ characters"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          type={password.value ? 'text' : 'password'}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={password.onToggle} edge="end">
                  <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Sign in..."
      >
        Connectez-vous
      </LoadingButton>
    </Box>
  );

  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: 'auto',
        mt: 4,
        p: 4,
        border: '1px solid #e0e0e0', // Bordure légère
        borderRadius: 2,
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', // Ombre subtile
        backgroundColor: 'background.paper',
      }}
    >
      <FormHead
        title="Connexion"
        description={
          <>
            {activated
              ? '✅ Votre compte a été activé avec succès !'
              : "Vous ne pouvez pas accéder à cette plateforme si vous n'avez pas de compte."}
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Utilisez votre mail et votre mot de passe pour vous connecter.
      </Alert>

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>
    </Box>
  );
}
