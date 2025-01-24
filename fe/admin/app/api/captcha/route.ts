import {NextResponse} from 'next/server';

function generateCaptcha(length: number = 4) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 生成SVG验证码
function generateCaptchaSvg(text: string) {
  const width = 100;
  const height = 40;
  
  // 生成随机干扰线的点
  const getRandomPoints = () => {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  };

  // 生成SVG
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      ${Array(3).fill(0).map(() => 
        `<path d="${getRandomPoints()}" stroke="gray" stroke-width="1" />`
      ).join('')}
      <text x="50%" y="50%" dy=".35em" text-anchor="middle" 
        font-family="Arial" font-size="24" fill="black">
        ${text}
      </text>
    </svg>
  `;

  return svg;
}

export async function GET() {
  const code = generateCaptcha();
  const svg = generateCaptchaSvg(code);

  // 设置验证码到session
  const response = NextResponse.json(
    { svg: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` },
    { status: 200 }
  );
  
  // 设置验证码到cookie，10分钟有效
  response.cookies.set('captcha', code, {
    httpOnly: true,
    secure: (process.env.COOKIE_SECURE || 'true') === 'true',
    sameSite: 'strict',
    path: '/',
    maxAge: 600
  });

  return response;
}