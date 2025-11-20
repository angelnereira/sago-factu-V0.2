'use client';

/**
 * HKA Credentials Form
 * Formulario para configurar credenciales HKA
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Info } from 'lucide-react';
import { updateHkaCredentials } from '@/app/actions/settings/update-hka-credentials.action';
import { testHkaConnection } from '@/app/actions/settings/test-hka-connection.action';

interface HkaCredentialsFormProps {
  initialData?: {
    tokenUser: string;
    environment: 'DEMO' | 'PROD';
  };
}

export function HkaCredentialsForm({ initialData }: HkaCredentialsFormProps) {
  const [tokenUser, setTokenUser] = useState(initialData?.tokenUser || '');
  const [tokenPassword, setTokenPassword] = useState('');
  const [environment, setEnvironment] = useState<'DEMO' | 'PROD'>(
    initialData?.environment || 'DEMO'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleSave = async () => {
    setSaveMessage(null);
    setTestResult(null);

    if (!tokenUser.trim()) {
      setSaveMessage({ type: 'error', text: 'Token User is required' });
      return;
    }

    if (!tokenPassword.trim()) {
      setSaveMessage({ type: 'error', text: 'Token Password is required' });
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateHkaCredentials({
        tokenUser: tokenUser.trim(),
        tokenPassword: tokenPassword.trim(),
        environment,
      });

      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Credentials saved successfully' });
        setTokenPassword(''); // Clear password after save
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save credentials' });
      }
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    setSaveMessage(null);
    setIsTesting(true);

    try {
      const result = await testHkaConnection();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>HKA Credentials</CardTitle>
        <CardDescription>
          Configure your HKA (The Factory HKA) credentials for electronic invoicing in Panama.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment */}
        <div className="space-y-2">
          <Label htmlFor="environment">Environment</Label>
          <Select value={environment} onValueChange={(val) => setEnvironment(val as 'DEMO' | 'PROD')}>
            <SelectTrigger id="environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DEMO">Demo (Testing)</SelectItem>
              <SelectItem value="PROD">Production</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Use Demo for testing. Switch to Production when ready for real invoicing.
          </p>
        </div>

        {/* Token User */}
        <div className="space-y-2">
          <Label htmlFor="tokenUser">Token User</Label>
          <Input
            id="tokenUser"
            type="text"
            placeholder="Enter your HKA Token User"
            value={tokenUser}
            onChange={(e) => setTokenUser(e.target.value)}
          />
        </div>

        {/* Token Password */}
        <div className="space-y-2">
          <Label htmlFor="tokenPassword">Token Password</Label>
          <Input
            id="tokenPassword"
            type="password"
            placeholder="Enter your HKA Token Password"
            value={tokenPassword}
            onChange={(e) => setTokenPassword(e.target.value)}
          />
          {initialData && !tokenPassword && (
            <p className="text-sm text-muted-foreground">
              Leave blank to keep existing password
            </p>
          )}
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your credentials are encrypted and stored securely. They are only used to communicate
            with HKA services.
          </AlertDescription>
        </Alert>

        {/* Save Message */}
        {saveMessage && (
          <Alert variant={saveMessage.type === 'error' ? 'destructive' : 'default'}>
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>{saveMessage.text}</AlertDescription>
          </Alert>
        )}

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">{testResult.message}</p>
                {testResult.details && (
                  <div className="text-sm text-muted-foreground">
                    {testResult.details.foliosDisponibles !== undefined && (
                      <p>Available Folios: {testResult.details.foliosDisponibles}</p>
                    )}
                    {testResult.details.environment && (
                      <p>Environment: {testResult.details.environment}</p>
                    )}
                    {testResult.details.responseTime && (
                      <p>Response Time: {testResult.details.responseTime}ms</p>
                    )}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving || isTesting}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Credentials
          </Button>

          {initialData && (
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || isSaving}
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
