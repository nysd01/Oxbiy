require('dotenv').config();

const express   = require('express');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const esc = (s) =>
    String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5,                    // max 5 submissions per IP per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many messages sent. Please try again later.' },
});

app.post('/api/contact', contactLimiter, async (req, res) => {
    const { name, email, phone, message } = req.body || {};

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const from = process.env.EMAIL_FROM || 'OXBIY <noreply@oxbiy.com>';

    try {
        // --- Notification email to the team ---
        const notifyRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to: ['help-support@oxbiy.com'],
                reply_to: email,
                subject: `New message from ${esc(name)} — OXBIY website`,
                html: `
                    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
                        <h2 style="color:#0d6efd;border-bottom:2px solid #0d6efd;padding-bottom:8px;">
                            New Contact Form Submission
                        </h2>
                        <p><strong>Name:</strong> ${esc(name)}</p>
                        <p><strong>Email:</strong>
                            <a href="mailto:${esc(email)}" style="color:#0d6efd;">${esc(email)}</a>
                        </p>
                        ${phone ? `<p><strong>Phone:</strong> ${esc(phone)}</p>` : ''}
                        <p><strong>Message:</strong></p>
                        <blockquote style="border-left:4px solid #0d6efd;padding:8px 16px;margin:0;
                            background:#f8f9fa;border-radius:0 4px 4px 0;color:#333;">
                            ${esc(message).replace(/\n/g, '<br>')}
                        </blockquote>
                        <hr style="border:none;border-top:1px solid #dee2e6;margin-top:24px;">
                        <small style="color:#6c757d;">Sent via OXBIY website contact form</small>
                    </div>
                `,
            }),
        });

        if (!notifyRes.ok) {
            const err = await notifyRes.json().catch(() => ({}));
            console.error('Resend API error:', notifyRes.status, JSON.stringify(err));
            return res.status(500).json({ error: 'Email sending failed', detail: err });
        }

        // --- Auto-reply to the sender (fire-and-forget) ---
        fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to: [email],
                subject: 'We received your message — OXBIY',
                html: `
                    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
                        <div style="text-align:center;padding:32px 0 24px;">
                            <img src="https://oxbiy.com/assets/img/logo.png"
                                 alt="OXBIY" style="height:64px;">
                        </div>
                        <h2 style="color:#0d6efd;text-align:center;margin-bottom:8px;">
                            Thanks for reaching out, ${esc(name)}!
                        </h2>
                        <p style="color:#555;text-align:center;margin-bottom:32px;">
                            We've received your message and will get back to you
                            <strong>within 24 hours</strong>.
                        </p>
                        <div style="background:#f8f9fa;border-radius:8px;padding:16px 20px;
                            border-left:4px solid #0d6efd;margin-bottom:32px;">
                            <p style="margin:0;color:#666;font-size:0.9rem;">
                                <em>"${esc(message).replace(/\n/g, '<br>')}"</em>
                            </p>
                        </div>
                        <p style="color:#555;">
                            In the meantime, explore our work at
                            <a href="https://oxbiy.com" style="color:#0d6efd;">oxbiy.com</a>.
                        </p>
                        <hr style="border:none;border-top:1px solid #dee2e6;margin:24px 0;">
                        <p style="color:#999;font-size:0.8rem;text-align:center;">
                            OXBIY — Building Empires in the Digital Age<br>
                            <a href="mailto:help-support@oxbiy.com" style="color:#0d6efd;">
                                help-support@oxbiy.com
                            </a>
                        </p>
                    </div>
                `,
            }),
        }).catch(err => console.error('Auto-reply error:', err));

        res.json({ ok: true });
    } catch (err) {
        console.error('Contact handler error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 404 fallback
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'dist', '404.html'));
});

app.listen(PORT, () => console.log(`OXBIY server running on port ${PORT}`));
