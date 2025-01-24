'use client';

import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Toaster} from '@/components/ui/toaster';
import {useToast} from '@/components/hooks/use-toast';
import {useState, useEffect} from 'react';

interface LoginFormProps {
  login: (formData: FormData) => Promise<{ error: string } | undefined>;
}

export function LoginForm({login}: LoginFormProps) {
  const {toast} = useToast();
  const [captchaUrl, setCaptchaUrl] = useState('');

  const refreshCaptcha = async () => {
    try {
      const response = await fetch('/api/captcha');
      const data = await response.json();
      setCaptchaUrl(data.svg);
    } catch (error) {
      console.error('Failed to load captcha:', error);
    }
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  return (
    <div className="min-h-screen flex justify-center items-start md:items-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Please enter your username and password
          </CardDescription>
        </CardHeader>
        <form
          action={async (formData: FormData) => {
            const result = await login(formData);
            if (result?.error) {
              toast({
                variant: "destructive",
                title: "Error",
                description: result.error,
              });
              refreshCaptcha();
            }
          }}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">UserName</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                placeholder="Please enter your username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Please enter your password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="captcha">Verification Code</Label>
              <div className="flex gap-2">
                <Input
                  id="captcha"
                  name="captcha"
                  type="text"
                  required
                  className="flex-1"
                  placeholder="Enter verification code"
                  maxLength={4}
                />
                <div 
                  className="w-[100px] h-[40px] border rounded cursor-pointer overflow-hidden"
                  onClick={refreshCaptcha}
                >
                  {captchaUrl && (
                    <img 
                      src={captchaUrl} 
                      alt="captcha" 
                      className="w-full h-full"
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
      <Toaster/>
    </div>
  );
} 