const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Handle redirect routes
    if (pathname.startsWith('/redirect/whatsapp')) {
        const cta = parsedUrl.query.cta || 'contato';
        const messages = {
            'links-orcamentos': 'Olá! Gostaria de solicitar um orçamento para ensaios, casamentos ou campanhas.',
            'mentoria-online': 'Olá! Tenho interesse na mentoria online.',
            'mentoria-sp': 'Olá! Tenho interesse na mentoria presencial em São Paulo.',
            'mentoria-ny': 'Olá! Tenho interesse na mentoria em Nova York.',
            'links-consultoria': 'Olá! Tenho interesse na consultoria 1:1.',
            'presets-pack': 'Olá! Tenho interesse nos presets profissionais.',
            'curso-mobile': 'Olá! Tenho interesse no curso de Fotografia com Celular.'
        };
        const message = encodeURIComponent(messages[cta] || 'Olá! Gostaria de mais informações.');
        const whatsappNumber = '5511999999999'; // ATUALIZE COM O NÚMERO REAL
        res.writeHead(302, { 'Location': `https://wa.me/${whatsappNumber}?text=${message}` });
        res.end();
        return;
    }

    // Serve static files
    if (pathname === '/') pathname = '/index.html';
    
    const filePath = path.join(ROOT_DIR, pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
