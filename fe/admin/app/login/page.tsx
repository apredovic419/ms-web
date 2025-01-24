import {signIn} from '@/lib/auth';
import {LoginForm} from './login-form';
import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';

export default function LoginPage() {
  async function login(formData: FormData): Promise<{ error: string } | undefined> {
    'use server';

    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const captcha = formData.get('captcha') as string;

    if (!captcha) {
      return {
        error: 'Please enter the captcha'
      };
    }

    try {
      const cookieStore = await cookies();
      const captchaCookie = cookieStore.get('captcha');

      // 删除验证码cookie，确保验证码只能使用一次
      cookieStore.set('captcha', '', {
        maxAge: 0,
        path: '/',
        sameSite: 'strict',
        secure: (process.env.COOKIE_SECURE || 'true') === 'true',
      });

      if (!captchaCookie?.value) {
        return {
          error: 'Captcha expired, please refresh the captcha'
        };
      }

      if (captchaCookie.value.toLowerCase() !== captcha.toLowerCase()) {
        return {
          error: 'Captcha error'
        };
      }
    } catch (error) {
      console.error('Captcha verification error:', error);
      return {
        error: 'Captcha verification failed, please try again'
      };
    }

    let result: any;

    try {
      result = await signIn('credentials', {
        username,
        password,
        redirect: false
      });
    } catch (error) {
      return {
        error: 'Login failed, please contact the administrator'
      };
    }

    if (!result) {
      return {
        error: 'Login failed, please contact the administrator'
      };
    }

    if (result.error) {
      return {
        error: 'Username or password is incorrect'
      };
    }
    redirect('/');
  }

  return <LoginForm login={login}/>;
}
