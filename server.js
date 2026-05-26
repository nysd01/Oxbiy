// Load .env in local development (dotenv is a no-op if the file doesn't exist)
require('dotenv').config();

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Minimal HTML escaping to prevent injection in email body
const esc = (s) =>
    String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM || 'OXBIY <noreply@oxbiy.com>',
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

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('Resend API error:', response.status, JSON.stringify(err));
            return res.status(500).json({ error: 'Email sending failed', detail: err });
        }

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
