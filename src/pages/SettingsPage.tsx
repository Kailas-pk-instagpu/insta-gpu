import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useDeletionRequestStore } from '@/shared/lib/store';
import { ROLE_LABELS, TwoFAMethod } from '@/shared/types/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Shield, Smartphone, Mail, KeyRound, Check, Copy, AlertTriangle, User, Lock, Camera, MapPin, Eye, EyeOff, Bell, Settings2, Trash2, PlugZap, UserMinus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import E2LinkIntegrationPanel from '@/features/settings/E2LinkIntegrationPanel';
import VMwareHorizonIntegrationPanel from '@/features/settings/VMwareHorizonIntegrationPanel';

const MOCK_TOTP_SECRET = 'JBSWY3DPEHPK3PXP';
const MOCK_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/GPUCloud:user@example.com?secret=${MOCK_TOTP_SECRET}&issuer=GPUCloud`;

// --- 2FA Setup (unchanged logic) ---
function TwoFASetup() {
  const { user, enable2FA, disable2FA } = useAuthStore();
  const [selectedMethod, setSelectedMethod] = useState<TwoFAMethod>(null);
  const [step, setStep] = useState<'select' | 'setup' | 'verify'>('select');
  const [verifyCode, setVerifyCode] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!user) return null;

  const handleDisable = () => {
    disable2FA();
    toast.success('Two-factor authentication has been disabled');
    setStep('select');
    setSelectedMethod(null);
    setVerifyCode('');
  };

  const handleVerify = () => {
    if (verifyCode.length !== 6 || !/^\d+$/.test(verifyCode)) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      enable2FA(selectedMethod, selectedMethod === 'sms' ? phone : undefined);
      toast.success(`2FA enabled via ${selectedMethod === 'authenticator' ? 'Google Authenticator' : selectedMethod === 'sms' ? 'SMS' : 'Email'}`);
      setStep('select');
      setSelectedMethod(null);
      setVerifyCode('');
      setIsVerifying(false);
    }, 1000);
  };

  const methodLabel: Record<string, string> = {
    authenticator: 'Google Authenticator',
    sms: 'SMS',
    email: 'Email',
  };

  if (user.is2FAEnabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
          <Check className="h-5 w-5 text-success shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">Two-factor authentication is enabled</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Method: <Badge variant="secondary" className="ml-1 text-xs">{methodLabel[user.twoFAMethod!] || 'Unknown'}</Badge>
            </p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDisable}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Disable 2FA
        </Button>
      </div>
    );
  }

  if (step === 'select') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Choose how you'd like to receive verification codes:</p>
        <div className="grid gap-3">
          {([
            { method: 'authenticator' as TwoFAMethod, icon: KeyRound, title: 'Google Authenticator', desc: 'Use an authenticator app to generate codes.' },
            { method: 'sms' as TwoFAMethod, icon: Smartphone, title: 'SMS', desc: 'Receive codes via text message.' },
            { method: 'email' as TwoFAMethod, icon: Mail, title: 'Email', desc: 'Receive codes via email.' },
          ]).map(({ method, icon: Icon, title, desc }) => (
            <button
              key={method}
              onClick={() => { setSelectedMethod(method); setStep('setup'); }}
              className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-left group"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => { setStep('select'); setVerifyCode(''); }}>
          ← Back
        </Button>
        {selectedMethod === 'authenticator' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Step 1: Scan QR Code</h4>
              <p className="text-xs text-muted-foreground">Open Google Authenticator and scan this QR code:</p>
            </div>
            <div className="flex justify-center p-4 bg-card rounded-lg w-fit mx-auto border border-border">
              <img src={MOCK_QR_URL} alt="2FA QR Code" className="w-[180px] h-[180px]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Or enter this secret key manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono tracking-widest">{MOCK_TOTP_SECRET}</code>
                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(MOCK_TOTP_SECRET); toast.info('Secret copied'); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Step 2: Enter Verification Code</h4>
              <p className="text-xs text-muted-foreground mb-2">Enter the 6-digit code from your authenticator app:</p>
              <Input value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-[0.5em] font-mono max-w-[200px]" maxLength={6} />
            </div>
          </div>
        )}
        {selectedMethod === 'sms' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Step 1: Enter Your Phone Number</h4>
              <p className="text-xs text-muted-foreground mb-2">We'll send a verification code to this number:</p>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" className="max-w-[280px]" />
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info('Verification code sent! (Demo: use any 6 digits)')} disabled={phone.length < 8}>
              <Smartphone className="h-4 w-4 mr-2" /> Send Code
            </Button>
            <div>
              <h4 className="font-medium text-sm mb-1">Step 2: Enter Verification Code</h4>
              <Input value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-[0.5em] font-mono max-w-[200px]" maxLength={6} />
            </div>
          </div>
        )}
        {selectedMethod === 'email' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Step 1: Confirm Your Email</h4>
              <p className="text-xs text-muted-foreground mb-2">We'll send a verification code to:</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info('Verification code sent! (Demo: use any 6 digits)')}>
              <Mail className="h-4 w-4 mr-2" /> Send Code
            </Button>
            <div>
              <h4 className="font-medium text-sm mb-1">Step 2: Enter Verification Code</h4>
              <Input value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-[0.5em] font-mono max-w-[200px]" maxLength={6} />
            </div>
          </div>
        )}
        <Button onClick={handleVerify} disabled={verifyCode.length !== 6 || isVerifying} className="mt-2">
          <Shield className="h-4 w-4 mr-2" />
          {isVerifying ? 'Verifying...' : 'Enable 2FA'}
        </Button>
      </div>
    );
  }

  return null;
}

// --- Vertical Tab Item ---
const baseTabs = [
  { id: 'profile', label: 'Profile Settings', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: PlugZap, roles: ['super_admin'] as string[] },
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'account', label: 'Account', icon: UserMinus, roles: ['cafe_owner'] as string[] },
] as const;

type TabId = typeof baseTabs[number]['id'];

export default function SettingsPage() {
  const { user, theme, toggleTheme, updateProfile, changePassword } = useAuthStore();
  const { createRequest, hasPendingForUser } = useDeletionRequestStore();
  const [showDeleteSelf, setShowDeleteSelf] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [integrationTab, setIntegrationTab] = useState<'e2link' | 'horizon'>('e2link');
  const tabs = baseTabs.filter(t => !('roles' in t) || (t.roles as string[]).includes(user?.role ?? ''));

  // Deep-link support: e.g. /settings#integrations opens the matching tab.
  // Sub-tab deep-link: /settings#integrations/horizon selects the Horizon panel.
  useEffect(() => {
    const applyHash = () => {
      const raw = window.location.hash.replace('#', '');
      if (!raw) return;
      const [tab, sub] = raw.split('/') as [TabId, string | undefined];
      if (tab && tabs.some(t => t.id === tab)) setActiveTab(tab);
      if (tab === 'integrations' && (sub === 'e2link' || sub === 'horizon')) {
        setIntegrationTab(sub);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [logoPreview, setLogoPreview] = useState(user?.logoUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  if (!user) return null;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { toast.error('Valid email is required'); return; }
    setIsSaving(true);
    setTimeout(() => {
      updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim(), logoUrl: logoPreview || undefined });
      toast.success('Profile updated successfully');
      setIsSaving(false);
    }, 500);
  };

  const handleChangePassword = () => {
    if (!currentPassword) { toast.error('Enter your current password'); return; }
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    const result = changePassword(currentPassword, newPassword);
    if (result.success) {
      toast.success('Password changed successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } else {
      toast.error(result.error || 'Failed to change password');
    }
  };

  const handleDownloadData = () => {
    if (!user) return;
    const doc = new jsPDF();
    const left = 15;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Personal Data Export', left, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleString()}`, left, y);
    doc.setTextColor(0);
    y += 10;

    doc.setDrawColor(200);
    doc.line(left, y, 195, y);
    y += 10;

    const section = (title: string) => {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(title, left, y);
      y += 7;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
    };

    const row = (label: string, value: string) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, left, y);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(value || '—', 130);
      doc.text(lines, left + 45, y);
      y += 7 * lines.length;
    };

    section('Account Information');
    row('User ID', user.id);
    row('Full Name', user.name);
    row('Email', user.email);
    row('Role', ROLE_LABELS[user.role]);
    row('Phone', user.phone || '—');
    row('Address', user.address || '—');
    row('Account Created', user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—');
    y += 4;

    section('Security');
    row('2FA Enabled', user.is2FAEnabled ? 'Yes' : 'No');
    row('2FA Method', user.twoFAMethod || '—');
    y += 4;

    section('Preferences');
    row('Theme', theme === 'dark' ? 'Dark' : 'Light');

    y += 8;
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setTextColor(120);
    const footer = doc.splitTextToSize(
      'This document contains personal data associated with your account. Keep it confidential.',
      180
    );
    doc.text(footer, left, y);

    doc.save(`personal-data-${user.email}-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Personal data downloaded');
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile, security, and preferences</p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[520px]">
          {/* Vertical Tabs Sidebar */}
          <div className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/30 p-3 md:p-4">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap w-full text-left',
                    activeTab === id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-5 md:p-8 overflow-y-auto">
            {/* ===== PROFILE TAB ===== */}
            {activeTab === 'profile' && (() => {
              const fields = [
                { key: 'Full name', filled: !!name.trim() },
                { key: 'Email address', filled: !!email.trim() && /\S+@\S+\.\S+/.test(email) },
                { key: 'Mobile number', filled: !!phone.trim() },
                { key: 'Residential address', filled: !!address.trim() },
                { key: 'Profile photo', filled: !!logoPreview },
                { key: 'Two-factor authentication', filled: user.is2FAEnabled },
              ];
              const completed = fields.filter(f => f.filled).length;
              const percent = Math.round((completed / fields.length) * 100);
              const missing = fields.filter(f => !f.filled).map(f => f.key);
              const tone =
                percent === 100 ? 'text-emerald-500'
                : percent >= 60 ? 'text-primary'
                : 'text-amber-500';
              return (
              <div className="space-y-8">
                {/* Profile completion meter */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-semibold">Profile completion</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {percent === 100
                          ? 'All set — your profile is complete.'
                          : `Add ${missing.join(', ')} to reach 100%.`}
                      </p>
                    </div>
                    <span className={cn('text-2xl font-bold tabular-nums transition-colors', tone)}>
                      {percent}%
                    </span>
                  </div>
                  <Progress value={percent} className="h-2" />
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {completed} of {fields.length} fields completed
                  </p>
                </div>

                {/* Avatar centered */}
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center cursor-pointer group shadow-md"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-muted-foreground">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <Camera className="h-6 w-6 text-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => fileInputRef.current?.click()}>
                      Upload New
                    </Button>
                    {logoPreview && (
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setLogoPreview('')}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Avatar
                      </Button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
                </div>

                <Separator />

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-name">Full Name *</Label>
                    <Input id="profile-name" value={name} onChange={e => setName(e.target.value)} placeholder="First name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-email">Email Address *</Label>
                    <Input id="profile-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-phone">Mobile Number</Label>
                    <Input id="profile-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-role">Role</Label>
                    <Input id="profile-role" value={ROLE_LABELS[user.role]} disabled className="bg-muted" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-address" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Residential Address
                  </Label>
                  <Textarea id="profile-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address, city, state, zip..." rows={2} className="resize-none" />
                </div>

                <div className="flex justify-center pt-2">
                  <Button className="gradient-primary text-primary-foreground px-10" onClick={handleSaveProfile} disabled={isSaving || !name.trim() || !email.trim()}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
              );
            })()}

            {/* ===== PASSWORD TAB ===== */}
            {activeTab === 'password' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <h2 className="text-lg font-semibold">Change Password</h2>
                  <p className="text-sm text-muted-foreground mt-1">Update your account password for security</p>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-pw">Current Password</Label>
                    <div className="relative">
                      <Input id="current-pw" type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-pw">New Password</Label>
                    <div className="relative">
                      <Input id="new-pw" type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowNewPw(!showNewPw)}>
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-pw">Confirm New Password</Label>
                    <Input id="confirm-pw" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
                  </div>
                </div>
                <div className="flex justify-center pt-2">
                  <Button className="gradient-primary text-primary-foreground px-10" onClick={handleChangePassword} disabled={!currentPassword || !newPassword || !confirmPassword}>
                    <Lock className="h-4 w-4 mr-2" /> Change Password
                  </Button>
                </div>
              </div>
            )}

            {/* ===== NOTIFICATIONS TAB ===== */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <h2 className="text-lg font-semibold">Notification Preferences</h2>
                  <p className="text-sm text-muted-foreground mt-1">Choose what notifications you receive</p>
                </div>
                <Separator />
                <div className="space-y-4">
                  {[
                    { label: 'Email Notifications', desc: 'Receive important updates via email' },
                    { label: 'Push Notifications', desc: 'Get real-time alerts in your browser' },
                    { label: 'System Alerts', desc: 'Critical system and security alerts' },
                    { label: 'Activity Summary', desc: 'Weekly summary of your account activity' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <Switch defaultChecked={i < 3} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== SECURITY TAB ===== */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
                  <p className="text-sm text-muted-foreground mt-1">Add an extra layer of security to your account</p>
                </div>
                <Separator />
                <TwoFASetup />
              </div>
            )}

            {/* ===== INTEGRATIONS TAB (Super Admin only) ===== */}
            {activeTab === 'integrations' && user.role === 'super_admin' && (
              <div className="space-y-6">
                <div className="inline-flex p-1 rounded-lg bg-muted border border-border/60">
                  {([
                    { id: 'e2link' as const, label: 'E2Link' },
                    { id: 'horizon' as const, label: 'VMware Horizon' },
                  ]).map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setIntegrationTab(id)}
                      className={cn(
                        'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                        integrationTab === id
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {integrationTab === 'e2link' ? <E2LinkIntegrationPanel /> : <VMwareHorizonIntegrationPanel />}
              </div>
            )}

            {/* ===== GENERAL TAB ===== */}
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <h2 className="text-lg font-semibold">Preferences</h2>
                  <p className="text-sm text-muted-foreground mt-1">Customize your experience</p>
                </div>
                <Separator />
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/50">
                  <div>
                    <p className="text-sm font-medium">Dark Mode</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Toggle between light and dark theme</p>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>

                <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/40 border border-border/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Download Personal Data</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Export your account information and preferences as a PDF</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownloadData} className="shrink-0">
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                </div>
              </div>
            )}

            {/* ===== ACCOUNT TAB (Cafe Owner only) ===== */}
            {activeTab === 'account' && user.role === 'cafe_owner' && (() => {
              const pending = hasPendingForUser(user.id);
              return (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="text-lg font-semibold">Account</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage account-level actions for your profile</p>
                  </div>
                  <Separator />
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-destructive/10 text-destructive shrink-0">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submit a request to permanently delete your account. The Super Admin must approve before your account is removed. This action cannot be undone once approved.
                        </p>
                      </div>
                    </div>
                    {pending ? (
                      <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 border border-warning/20 rounded-md px-3 py-2">
                        <AlertTriangle className="h-4 w-4" />
                        Your deletion request is pending review by Super Admin.
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => { setDeleteReason(''); setShowDeleteSelf(true); }}
                      >
                        <UserMinus className="h-4 w-4 mr-2" /> Request Account Deletion
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </Card>

      {/* Self-deletion request dialog (Cafe Owner) */}
      <AlertDialog open={showDeleteSelf} onOpenChange={(o) => { if (!o) setDeleteReason(''); setShowDeleteSelf(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Account Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              You're requesting deletion of your own account. The Super Admin will review and approve before it is permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Reason</Label>
            <Textarea
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              placeholder="Tell the Super Admin why you want to delete your account..."
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleteReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!user) return;
                if (hasPendingForUser(user.id)) {
                  toast.error('You already have a pending deletion request');
                  setShowDeleteSelf(false);
                  return;
                }
                createRequest({
                  targetUserId: user.id,
                  targetName: user.name,
                  targetEmail: user.email,
                  targetRole: user.role,
                  isSelf: true,
                  requestedById: user.id,
                  requestedByName: user.name,
                  requestedByRole: user.role,
                  reason: deleteReason.trim(),
                });
                toast.success('Your deletion request has been sent to Super Admin');
                setShowDeleteSelf(false);
                setDeleteReason('');
              }}
            >
              Submit Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

