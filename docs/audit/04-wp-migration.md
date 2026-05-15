# Audit 04 — WordPress Media Library Migration

**Data:** 2026-05-15
**Worker:** t_b1c1d8c0 (run 4)
**Credenciais usadas:** nathan@digitalcopilot.app / gLL(EgAChT$p2w$pUr^!^kiN

---

## Resultado

| Métrica | Valor |
|---------|-------|
| Total de itens na biblioteca | 2534 |
| Páginas API REST | 26 |
| Itens com metadados extraídos | 1587 |
| Imagens filtradas (excluindo bulk Guia Poses Pessoal) | 1394 |
| Imagens baixadas com sucesso | 1238 |
| Itens com erro (URLs Unicode inválidas no servidor) | 7 |

## Arquivos Relevantes Encontrados

### Fotos de Caroline Moschei
- `caroline-moschei-verso-e-reverso-header.png` — header hero
- `foto-caroline-moschei.jpg` — foto principal
- `foto-caroline-moschei-section-preco.jpg` — foto seção preço
- `Caroline-Moschei-22-scaled.jpg` + `.webp` — foto editorial
- `Caroline-Moschei-5-scaled.jpg` + `.webp` — foto editorial

### Depoimentos de Alunos
- `Depoimentos-Alunos-Workshop-Presencial-Fotografia-Caroline-Moschei-1 a 8.webp` — screenshots de feedback
- `jenniffer-avatar.jpg` — foto de aluna Jenniffer
- `img-47.jpg` — foto de aluna adicional
- `aluna_1.webp`, `aluna_3.webp`, `aluna_5.webp` — fotos de alunas
- `Aluna-Alana-2-1-11zon-scaled.webp` — foto aluna Alana
- `Aluna-Gabriela-Garcia-WS-1-2-11zon.webp` — foto aluna Gabriela Garcia
- `Aluna-Samanta-Pistori-*.webp` (6 arquivos) — fotos aluna Samanta Pistori
- `Fotos-alunos-Verso-e-Reverso-Caroline-Moschei-2.jpg` — foto de aluna em ensaio
- `Fotos-alunos-Verso-e-Reverso-Caroline-Moschei-5.jpg` — foto de aluna em ensaio

### Guias de Poses
- `guia-corporativo-desktop.png` — cover guia corporativo
- `banner-header-guia-de-poses-pessoal.png` — cover guia pessoal
- `guia-iluminacao-scaled.png` — cover guia iluminação
- `combo-guia-de-poses.png` — capa combo 4 guias
- Bulk `Guia_de_Poses_Pessoal_e_Criativo_*.png` — 50+ imagens internas (NÃO baixadas individualmente, poupando espaço)

### SVGs e Ícones Originais
- `logo-verso-e-reverso-horizontal-dark.svg` — logo Verso & Reverso
- `icon-header-iluminacao-1.svg`, `icon-header-cores-1.svg`, etc. — ícones dos pilares

## Inventário completo
Disponível em: `docs/audit/04a-wp-media-inventory.json`

## Erros (7 URLs com caracteres Unicode)
Arquivos com `×`, `é`, `á`, `ó`, `í` no nome — retornam 404 no servidor WP (possivelmente removidos ou renomeados).

## Alerta de Segurança (documentado)
Plugin `leopard-offload` detectado em discovery anterior (docs/03-vps-structure.md) com SSRF probe.
**Ação:** ignorado durante migração conforme instrução da task. Nenhuma interação com o plugin durante este run.
