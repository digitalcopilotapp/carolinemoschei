# SUB-2: VPS Snapshot — carolinemoschei.com

**Data:** 2026-05-15  
**Servidor:** day.digitalcopilot.app (Hostinger VPS, OpenLiteSpeed)  
**Acesso:** SSH root via ~/.ssh/daylangaro_deploy  
**Modo:** READ-ONLY — apenas ls/find/rsync-pull

---

## Localização no VPS

```
/home/carolinemoschei.com/
└── public_html/           ← webroot WordPress
    ├── index.php
    ├── wp-admin/          (11MB)
    ├── wp-includes/       (56MB)
    └── wp-content/        (44GB total!)
        ├── themes/
        ├── plugins/
        └── uploads/       (5.1GB)
```

Snapshot local em: `/home/hermes/projects/carolinemoschei/vps-snapshot/`

---

## Stack Tecnológico

| Item | Valor |
|------|-------|
| CMS | WordPress 6.9.1 |
| Tema ativo | Hello Elementor 3.4.4 |
| Page builder | Elementor 3.35.5 + Elementor Pro 3.32.1 |
| URL do site | http://carolinemoschei.com |
| DB Host | localhost:3306 |
| Table prefix | wp_ |
| WP_CACHE | false |
| PHP | CyberPanel managed |

---

## Plugins Ativos

| Plugin | Versão | Função |
|--------|--------|--------|
| elementor | 3.35.5 | Page builder |
| elementor-pro | 3.32.1 | Elementor Pro features |
| happy-elementor-addons | 3.20.1 | Widgets extras |
| fluentform | 6.1.4 | Formulários |
| fluentformpro | 6.1.3 | Formulários Pro |
| all-in-one-wp-migration | 7.101 | Backup/migração |
| duplicator | 1.5.14 | Duplicação/backup |
| backupbuddy | 9.1.14 | Backup completo |
| updraftplus | 2.25.8.0 | Backup na nuvem |
| insert-headers-and-footers | 2.3.1 | Scripts globais |
| pretty-link | — | Link management |
| akismet | — | Anti-spam |
| wordfence | — | Segurança |
| CyberSMTP | — | Email via CyberPanel |
| wpconsent-cookies-banner-privacy-suite | 1.1.0 | LGPD/cookies |
| header-footer-code-manager | — | Código cabeçalho/rodapé |

---

## Tokens Visuais (Elementor Global Kit — post-6)

### Paleta de Cores

| Nome | Hex | Descrição |
|------|-----|-----------|
| Primary | `#7D4E49` | Rose/terracota escuro |
| Secondary | `#F5ECE4` | Creme claro (fundo) |
| Text | `#8C6562` | Rose acinzentado |
| Accent | `#B16E67` | Coral/terracota médio |
| Accent + opacidade | `#7D4E4954` | Primary 33% opacidade |
| Links | `#80514D` | Rose escuro |
| Page transition | `#FFBC7D` | Pêssego/laranja quente |
| Base text | `#0A0A0A` | Preto quase total |

### Tipografia

| Papel | Família | Peso |
|-------|---------|------|
| Primary (headings) | "Monik Font" | 600 |
| Secondary | "Monik Font" | 400 |
| Text (corpo) | "sweet-sans-pro" | 400 |
| Accent | "sweet-sans-pro" | 500 |

**Observação:** "Monik" é uma fonte custom carregada via @font-face (não é Google Font). "sweet-sans-pro" é da Adobe Fonts.

### Layout

- Max-width container: **1232px**
- Widgets spacing: 0px (sem gap padrão entre widgets)
- `h1.entry-title`: controlado por CSS var

---

## Páginas WordPress

| ID | Título | Status | Última modificação |
|----|--------|--------|-------------------|
| 123 | Verso & Reverso Caroline Moschei | publish | 2024-12-01 |
| 12933 | Caroline Moschei - Inicial | publish | 2025-08-21 |
| 13487 | Academy | publish | 2025-08-20 |
| 13461 | Presets New Version | publish | 2025-08-19 |
| 13037 | ART-Sessions | publish | 2025-08-28 |
| 13648 | Guia de Fotografia Corporativo | publish | 2025-11-12 |
| 13512 | Guia de Fotografia de Gestantes | publish | 2025-11-12 |
| 13505 | Verso & Reverso Caroline Moschei | publish | 2025-11-12 |
| 13015 | Workshop Presencial - Setembro 2025 | publish | 2025-11-12 |
| 13805 | Guia de Iluminação de Estúdio | publish | 2025-11-12 |
| 13887 | Verso & Reverso Black November | draft | 2025-11-06 |

**Homepage atual:** ID 123 — "Verso & Reverso Caroline Moschei"

---

## Estrutura de Conteúdo (Uploads)

Uploads ativos de **2022 até 2026/05**, total de 5.1GB:
- Anos presentes: 2022, 2023, 2024, 2025, 2026
- Elementor CSS/screenshots gerados
- Template kits Elementor importados
- Smush WebP cache

---

## CAPI / Meta Pixel

Webhook configurado em `/home/carolinemoschei.com/public_html/webhook.carolinemoschei.site/`:
- **Pixel ID:** 1559920731501893
- **Access token:** (omitido — credencial sensível)
- Arquivos: capi-config.json, logs/, track/

---

## ⚠️ Alerta de Segurança

O diretório `wp-content/uploads/leopard-wordpress-offload/` contém entradas suspeitas que sugerem um escaneamento SSRF (Server-Side Request Forgery) ou probe de segurança:

```
evil.com, oast.pro, alibaba.interact.sh, viet.cgovn.cc, vietgov0.cc, 
wlanquna.club, 2tlgc6830ecd5arvijrpsqmzqbd.com, 100.100.100.200 (AWS metadata),
192.168.0.1_443 (internal network probe)
```

**Recomendação:** Nathan deve verificar se o plugin Leopard WordPress Offload (não listado como ativo) foi removido e se há histórico de acesso não autorizado. Wordfence pode ter mais logs.

---

## Conclusão SUB-2

- Stack confirmada: **WordPress + Elementor Pro** (construtor visual, não código customizado)
- Design system: paleta rose/terracota + fontes Monik + sweet-sans-pro
- Site ativo desde 2022, múltiplos produtos de fotografia
- Backup múltiplo (BackupBuddy + UpdraftPlus + AI1WM + Duplicator) — Nathan claramente cuida dos backups
- **Questão aberta:** o WeTransfer deve conter um backup/export do site para migração/redesign
