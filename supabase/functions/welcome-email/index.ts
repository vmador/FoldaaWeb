import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * welcome-email
 * 
 * This function handles the high-fidelity welcome email for Foldaa.
 * Uses the proxy URL from the Vercel app to ensure high-compatibility header visibility.
 */

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { record } = payload;
    
    if (!record || !record.email) {
      return new Response(JSON.stringify({ error: 'Missing email' }), { status: 400 });
    }

    const { email, raw_user_meta_data } = record;
    const fullName = raw_user_meta_data?.full_name || email.split('@')[0];
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Config error' }), { status: 500 });
    }

    // Using the new Vercel proxy URL for the header image
    const headerImgUrl = "https://foldaa-terminal-ui.vercel.app/api/welcome-header";
    const logoUrl = "https://foldaa-terminal-ui.vercel.app/icon.svg";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Inter', -apple-system, sans-serif; background-color: #ffffff; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; color: #000000; }
    .container { max-width: 600px; margin: 20px auto; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; }
    
    .header-img {
      width: 100% !important;
      height: auto !important;
      display: block;
    }

    .content {
      padding: 60px 48px;
    }

    .logo-tiny {
      width: 28px;
      height: 28px;
      margin-bottom: 48px;
    }
    
    .header-label {
      font-size: 11px;
      color: #888888;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      font-weight: 600;
    }

    .title {
      font-size: 40px;
      font-weight: 700;
      margin-bottom: 28px;
      line-height: 1.1;
      letter-spacing: -0.04em;
      color: #000000;
    }
    
    .subtitle {
      font-size: 17px;
      color: #000000;
      margin-bottom: 64px;
      line-height: 1.6;
    }

    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 32px;
      color: #000000;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .feature-card {
      margin-bottom: 36px;
    }

    .feature-title {
      font-size: 17px;
      font-weight: 700;
      margin: 0 0 10px 0;
      color: #000000;
    }

    .feature-description {
      font-size: 14px;
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #ffffff; color: #000000; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header-img { width: 100%; border-radius: 8px; margin-bottom: 32px; display: block; }
    .logo { width: 40px; height: 40px; margin-bottom: 24px; }
    h1 { font-size: 29px; font-weight: 500; margin-bottom: 16px; letter-spacing: -0.02em; }
    p { font-size: 16px; line-height: 1.6; color: #666666; margin-bottom: 24px; }
    .cta-button { display: inline-block; background-color: #000000; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 15px; }
    .section { margin-top: 48px; border-top: 1px solid #eeeeee; padding-top: 32px; }
    .section-title { font-size: 14px; font-weight: 600; text-transform: uppercase; color: #000000; margin-bottom: 16px; letter-spacing: 0.05em; }
    .feature { margin-bottom: 24px; }
    .feature-title { font-size: 16px; font-weight: 500; color: #000000; margin-bottom: 4px; }
    .feature-desc { font-size: 14px; color: #666666; }
    .footer { margin-top: 64px; padding-top: 32px; border-top: 1px solid #eeeeee; text-align: center; }
    .footer-text { font-size: 14px; color: #999999; margin-bottom: 8px; }
    .footer-link { color: #000000; text-decoration: none; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
      <h1 class="title">Nice to meet you,<br>${fullName}.</h1>
      <p class="subtitle">Foldaa turn your web projects into a PWA app in seconds.</p>
      
      <div class="section-title">PLATFORM FEATURES</div>

      <!-- SECTION 1: DEPLOYMENTS -->
      <div class="feature-card">
        <h3 class="feature-title">🚀 Deployments</h3>
        <p class="feature-description">
          Turn any web URL into a high-performance edge application. With instant SSL and global CDN delivery, your terminal interfaces are live in milliseconds.
        </p>
      </div>

      <!-- SECTION 2: MARKETPLACE -->
      <div class="feature-card">
        <h3 class="feature-title">💎 Marketplace</h3>
        <p class="feature-description">
          Sell your apps. Enlist your projects or full terminal applications in the Foldaa Marketplace to reach a global audience and turn your code into revenue.
        </p>
      </div>

      <!-- SECTION 3: BUILD ON MAC -->
      <div class="feature-card">
        <h3 class="feature-title">💻 Build On Mac</h3>
        <p class="feature-description">
          Native experiences. Generate high-fidelity macOS and iOS wrappers (.dmg / .ipa) for your applications with a single click using our cloud build engine.
        </p>
      </div>
      
      <div class="cta-container">
        <a href="https://app.foldaa.com" class="cta-button">Launch your App</a>
      </div>

      <div class="footer">
        <strong>Need help?</strong> Reply to this transmission or visit <a href="https://foldaa.com" class="link">foldaa.com</a><br><br>
        FOLDAA SYSTEMS OPERATING ENGINE &copy; 2026<br>
        <span style="letter-spacing: 0.05em;">HIGH-FIDELITY TERMINAL INFRASTRUCTURE</span>
      </div>
    </div>
  </div>
</body>
</html>
`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Foldaa ፨ <welcome@notifications.foldaa.com>',
        to: email,
        subject: `፨ Welcome to Foldaa, ${fullName}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: 'Resend error', data }), { status: res.status });

    return new Response(JSON.stringify({ message: 'Proxied design welcome email sent', id: data.id }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
