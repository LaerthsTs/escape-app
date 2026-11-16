/**
 * Forgot password (6-digit email code) and change password, as modals.
 * Server side: convex/passwordReset.ts
 */
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTranslation } from '../i18n';
import { theme } from '../theme';

const ERRORS: Record<string, string> = {
  CODE_INVALID: 'login.codeInvalid',
  CODE_EXPIRED: 'login.codeExpired',
  TOO_MANY_ATTEMPTS: 'login.codeTooMany',
  PASSWORD_LENGTH: 'password.errLength',
  PASSWORD_UPPERCASE: 'password.errUpper',
  PASSWORD_NUMBER: 'password.errNumber',
  WRONG_PASSWORD: 'password.wrongCurrent',
};

function useErrorText() {
  const { t } = useTranslation();
  return (code: unknown) => {
    const c = typeof code === 'string' ? code : (code as any)?.data;
    return t(typeof c === 'string' && ERRORS[c] ? ERRORS[c] : 'login.somethingWentWrong');
  };
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor={theme.colors.textMuted} style={styles.input} {...props} />;
}

function Shell({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {children}
          <TouchableOpacity onPress={onClose} style={styles.linkBtn}>
            <Text style={styles.linkText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ForgotPasswordModal({ visible, kind, onClose }: { visible: boolean; kind: 'player' | 'company'; onClose: () => void }) {
  const { t, language } = useTranslation();
  const errorText = useErrorText();
  const start = useMutation(api.passwordReset.start);
  const finish = useMutation(api.passwordReset.finish);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setStep('email');
    setCode('');
    setPw('');
    setPw2('');
    onClose();
  };

  const send = async () => {
    setBusy(true);
    try {
      await start({ kind, email: email.trim().toLowerCase(), lang: language });
      setStep('code');
    } catch (e) {
      Alert.alert(t('error'), errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (pw !== pw2) return Alert.alert(t('error'), t('login.passwordsNoMatch'));
    setBusy(true);
    try {
      const r = await finish({ kind, email: email.trim().toLowerCase(), code, newPassword: pw });
      if ('error' in r) Alert.alert(t('error'), errorText(r.error));
      else {
        Alert.alert(t('success'), t('password.resetDone'));
        close();
      }
    } catch (e) {
      Alert.alert(t('error'), errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell visible={visible} onClose={close} title={t('password.resetTitle')}>
      {step === 'email' ? (
        <>
          <Text style={styles.text}>{t('password.resetSubtitle')}</Text>
          <Field value={email} onChangeText={setEmail} placeholder={t('login.email')} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <Button label={t('password.sendCode')} onPress={send} disabled={busy || !email.trim()} busy={busy} />
        </>
      ) : (
        <>
          <Text style={styles.text}>{t('password.codeSent', { email: email.trim().toLowerCase() })}</Text>
          <Field
            value={code}
            onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="000000"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            style={[styles.input, { textAlign: 'center', fontSize: 22, letterSpacing: 8 }]}
          />
          <Field value={pw} onChangeText={setPw} placeholder={t('password.new')} secureTextEntry autoCapitalize="none" />
          <Field value={pw2} onChangeText={setPw2} placeholder={t('password.repeat')} secureTextEntry autoCapitalize="none" />
          <Button label={t('password.setNew')} onPress={submit} disabled={busy || code.length !== 6 || !pw} busy={busy} />
          <TouchableOpacity onPress={send} style={styles.linkBtn}>
            <Text style={styles.linkText}>{t('login.codeResend')}</Text>
          </TouchableOpacity>
        </>
      )}
    </Shell>
  );
}

export function ChangePasswordModal({
  visible,
  onClose,
  submit,
}: {
  visible: boolean;
  onClose: () => void;
  submit: (args: { currentPassword: string; newPassword: string }) => Promise<{ ok: true } | { error: string }>;
}) {
  const { t } = useTranslation();
  const errorText = useErrorText();
  const [current, setCurrent] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setCurrent('');
    setPw('');
    setPw2('');
    onClose();
  };

  const onSave = async () => {
    if (pw !== pw2) return Alert.alert(t('error'), t('login.passwordsNoMatch'));
    setBusy(true);
    try {
      const r = await submit({ currentPassword: current, newPassword: pw });
      if ('error' in r) Alert.alert(t('error'), errorText(r.error));
      else {
        Alert.alert(t('success'), t('password.changeDone'));
        close();
      }
    } catch (e) {
      Alert.alert(t('error'), errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell visible={visible} onClose={close} title={t('password.changeTitle')}>
      <Field value={current} onChangeText={setCurrent} placeholder={t('password.current')} secureTextEntry autoCapitalize="none" />
      <Field value={pw} onChangeText={setPw} placeholder={t('password.new')} secureTextEntry autoCapitalize="none" />
      <Field value={pw2} onChangeText={setPw2} placeholder={t('password.repeat')} secureTextEntry autoCapitalize="none" />
      <Button label={t('password.changeTitle')} onPress={onSave} disabled={busy || !current || !pw} busy={busy} />
    </Shell>
  );
}

function Button({ label, onPress, disabled, busy }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean }) {
  return (
    <TouchableOpacity style={[styles.btn, disabled && { opacity: 0.5 }]} onPress={onPress} disabled={disabled} activeOpacity={0.8}>
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1D1010', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, gap: 12 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  text: { color: theme.colors.textMuted, fontSize: 14 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  btn: { backgroundColor: theme.colors.redPrimary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: theme.colors.textMuted, fontSize: 14 },
});

/**
 * Last step before deleting the account: the password, or typing DELETE
 * for Apple accounts without one (convex/users.ts deleteAccount).
 */
export function ConfirmDeleteModal({
  visible,
  needsPassword,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  needsPassword: boolean;
  onClose: () => void;
  onConfirm: (value: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const close = () => {
    setValue('');
    onClose();
  };
  return (
    <Shell visible={visible} onClose={close} title={t('profile.deleteAccountTitle')}>
      <Text style={styles.text}>{needsPassword ? t('deleteConfirm.password') : t('deleteConfirm.typeDelete')}</Text>
      <Field
        value={value}
        onChangeText={setValue}
        placeholder={needsPassword ? t('password.current') : 'DELETE'}
        secureTextEntry={needsPassword}
        autoCapitalize={needsPassword ? 'none' : 'characters'}
      />
      <Button
        label={t('profile.deleteAccountConfirm')}
        disabled={busy || !value}
        busy={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await onConfirm(value);
          } finally {
            setBusy(false);
          }
        }}
      />
    </Shell>
  );
}
