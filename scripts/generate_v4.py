#!/usr/bin/env python3
"""
Generate v4 static HTML pages from -novo.html GitHub layout files.
- Fixes all relative asset paths to absolute
- Keeps all design/content intact
- Adds noindex (already present)
- Maps: novo → v4 filename
"""
import re, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = os.path.join(BASE, 'pages')

# Map: source -novo.html → output -v4.html
PAGE_MAP = {
    'links-novo.html':                        'links-v4.html',
    'presets-novo.html':                      'presets-v4.html',
    'guia-iluminacao-novo.html':              'guia-iluminacao-v4.html',
    'guia-fotografia-corporativa-novo.html':  'guia-fotografia-corporativa-v4.html',
    'wsp-2026-novo.html':                     'wsp-2026-v4.html',
    'curso-photoshop-novo.html':              'ws-photoshop-v4.html',
    'curso-de-fotografia-de-celular-novo.html': 'curso-fotografia-celular-v4.html',
    'verso-reverso-novo.html':                'verso-e-reverso-v4.html',
}

# Relative path → absolute path fixes
PATH_FIXES = [
    (r'href="\.\./styles/site-theme\.css"',        'href="/styles/site-theme.css"'),
    (r'src="\.\./scripts/site-interactions\.js"',  'src="/scripts/site-interactions.js"'),
    (r'href="\.\./scripts/site-interactions\.js"', 'href="/scripts/site-interactions.js"'),
    (r'src="\.\./assets/',                         'src="/assets/'),
    (r'srcset="\.\./assets/',                      'srcset="/assets/'),
    (r'href="\.\./assets/',                        'href="/assets/'),
    (r'href="\.\./styles\.css"',                   'href="/styles.css"'),
    (r'href="\.\./verso-reverso\.css"',            'href="/verso-reverso.css"'),
    # /pages/X.html → /X
    (r'href="/pages/orcamentos\.html"',            'href="/orcamentos"'),
    (r'href="/pages/wsp-2026\.html"',              'href="/wsp-2026"'),
    (r'href="/pages/funil/funil\.css"',            'href="/pages/funil/funil.css"'),
    # ./X.html → /X (relative same-dir links)
    (r'href="\./links\.html"',                     'href="/links"'),
    (r'href="\./presets\.html"',                   'href="/presets"'),
    (r'href="\./guia-iluminacao\.html"',           'href="/guia-iluminacao"'),
    (r'href="\./guia-fotografia-corporativa\.html"','href="/guia-fotografia-corporativa"'),
    (r'href="\./curso-photoshop\.html"',           'href="/curso-photoshop"'),
    (r'href="\./curso-de-fotografia-de-celular\.html"', 'href="/curso-de-fotografia-de-celular"'),
    (r'href="\./verso-reverso\.html"',             'href="/verso-e-reverso"'),
    (r'href="\./wsp-2026\.html"',                  'href="/wsp-2026"'),
    (r'href="\./orcamentos\.html"',                'href="/orcamentos"'),
]

# Also fix data-site-header injection: replace with real minimal header/nav
HEADER_HTML = '''<header class="site-header">
  <div class="site-header__inner">
    <a href="/" class="site-header__logo" aria-label="Caroline Moschei - Início">
      <img src="/assets/images/logo-caroline-moschei.png" alt="Caroline Moschei" loading="eager" width="140" height="40" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span style="display:none;font-family:'Monik',serif;font-size:1.1rem;letter-spacing:0.08em;color:var(--color-ink-primary)">Caroline Moschei</span>
    </a>
    <button class="site-header__hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="site-nav">
      <span></span><span></span><span></span>
    </button>
    <nav id="site-nav" class="site-header__nav" aria-label="Menu principal">
      <a href="/links">Links</a>
      <a href="/verso-e-reverso">Verso &amp; Reverso</a>
      <a href="/presets">Presets</a>
      <a href="/guia-iluminacao">Iluminação</a>
      <a href="/guia-fotografia-corporativa">Fotografia Corporativa</a>
      <a href="/curso-photoshop">Photoshop</a>
      <a href="/curso-de-fotografia-de-celular">Cel. Fotografia</a>
      <a href="/wsp-2026">Workshop 2026</a>
      <a href="/orcamentos">Orçamentos</a>
    </nav>
  </div>
</header>'''

def transform(html: str, source: str) -> str:
    for pattern, replacement in PATH_FIXES:
        html = re.sub(pattern, replacement, html)

    # data-site-header stays as is — site-interactions.js injects it

    # Remove Black November outdated banner (from links page)
    html = re.sub(
        r'<!--\s*black\s*november[^>]*-->.*?<!--\s*/black[^>]*-->',
        '', html, flags=re.IGNORECASE | re.DOTALL
    )

    return html


def main():
    created = []
    for src_name, dst_name in PAGE_MAP.items():
        src_path = os.path.join(PAGES, src_name)
        dst_path = os.path.join(PAGES, dst_name)

        if not os.path.exists(src_path):
            print(f'SKIP (not found): {src_name}')
            continue

        with open(src_path, 'r', encoding='utf-8') as f:
            html = f.read()

        html = transform(html, src_name)

        with open(dst_path, 'w', encoding='utf-8') as f:
            f.write(html)

        size = os.path.getsize(dst_path)
        print(f'OK  {dst_name}  ({size:,} bytes)')
        created.append(dst_name)

    print(f'\nCreated {len(created)} v4 pages.')
    return created

if __name__ == '__main__':
    main()
