export async function onRequestPost({ request, env }) {
  const formData = await request.formData();

  // 1. Verify Turnstile token
  const token = formData.get('cf-turnstile-response');
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: request.headers.get('CF-Connecting-IP'),
    }),
  });
  const { success } = await verify.json();
  if (!success) {
    return Response.redirect(new URL('/contact.html?status=captcha', request.url), 303);
  }

  // 2. Collect fields
  const fname       = formData.get('fname') ?? '';
  const lname       = formData.get('lname') ?? '';
  const pronouns    = formData.get('pronouns') ?? '';
  const institution = formData.get('institution') ?? '';
  const email       = formData.get('email') ?? '';
  const subject     = formData.get('subject') ?? '';
  const message     = formData.get('message') ?? '';

  const body = [
    `Name: ${fname} ${lname}${pronouns ? ` (${pronouns})` : ''}`,
    `Email: ${email}`,
    institution ? `Institution: ${institution}` : '',
    `Topic: ${subject}`,
    '',
    message,
  ].filter(Boolean).join('\n');

  // 3. Send via Web3Forms
  const w3res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_key: 'a78e54e3-d48f-4079-b7e9-1ea97785fd47',
      subject: `[CoDesign Tool] ${subject} — ${fname} ${lname}`,
      from_name: `${fname} ${lname}`,
      replyto: email,
      message: body,
    }),
  });

  if (!w3res.ok) {
    return Response.redirect(new URL('/contact.html?status=error', request.url), 303);
  }

  return Response.redirect(new URL('/contact.html?status=sent', request.url), 303);
}
