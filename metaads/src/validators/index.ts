import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const validatorTools: Tool[] = [
  {
    name: 'validate_ad_content',
    description: 'Valida conteúdo de anúncio contra políticas da Meta antes de criar o criativo',
    inputSchema: {
      type: 'object',
      properties: {
        primary_text: { type: 'string', description: 'Texto principal do anúncio' },
        headline: { type: 'string', description: 'Título' },
        description: { type: 'string', description: 'Descrição' },
        special_ad_category: { type: 'string', description: 'Categoria especial da campanha (se aplicável)' },
        targeting: { type: 'object', description: 'Targeting spec para validar restrições de categoria especial' },
      },
    },
  },
];

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

const PROHIBITED_PATTERNS = [
  { pattern: /antes\s+e\s+depois/i, msg: 'Imagens/referências "antes e depois" podem violar políticas de saúde/beleza' },
  { pattern: /garanti[dr]?[oa]?\b/i, msg: 'Evite "garantido" — pode ser considerado afirmação enganosa' },
  { pattern: /100%\s*(eficaz|eficiente|comprovad)/i, msg: 'Afirmações de 100% eficácia podem violar políticas' },
  { pattern: /emagrec/i, msg: 'Referências a emagrecimento requerem cuidado com políticas de saúde' },
  { pattern: /cura\b/i, msg: 'Afirmações de cura são proibidas em anúncios de saúde' },
  { pattern: /renda\s+extra|ganhe\s+dinheiro|fique\s+rico/i, msg: 'Afirmações de renda podem violar políticas financeiras' },
];

const SPECIAL_AD_TARGETING_RESTRICTIONS: Record<string, string[]> = {
  HOUSING: [
    'Targeting por idade deve ser 18-65+',
    'Targeting por gênero não permitido',
    'Targeting por CEP não permitido (raio mínimo de 25km)',
  ],
  CREDIT: [
    'Targeting por idade deve ser 18-65+',
    'Targeting por gênero não permitido',
    'Targeting por CEP não permitido (raio mínimo de 25km)',
  ],
  EMPLOYMENT: [
    'Targeting por idade deve ser 18-65+',
    'Targeting por gênero não permitido',
    'Targeting por CEP não permitido (raio mínimo de 25km)',
  ],
};

function validateAdContent(args: Record<string, unknown>): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const primaryText = (args.primary_text as string) || '';
  const headline = (args.headline as string) || '';
  const description = (args.description as string) || '';
  const allText = `${primaryText} ${headline} ${description}`;

  if (primaryText.length > 125) warnings.push(`Texto principal: ${primaryText.length} chars (recomendado: 125)`);
  if (headline.length > 40) warnings.push(`Headline: ${headline.length} chars (recomendado: 40)`);
  if (description.length > 30) warnings.push(`Descrição: ${description.length} chars (recomendado: 30)`);

  for (const { pattern, msg } of PROHIBITED_PATTERNS) {
    if (pattern.test(allText)) warnings.push(msg);
  }

  const category = args.special_ad_category as string;
  if (category && category !== 'NONE') {
    const restrictions = SPECIAL_AD_TARGETING_RESTRICTIONS[category];
    if (restrictions) {
      const targeting = args.targeting as Record<string, unknown> | undefined;
      if (targeting) {
        if (targeting.age_min && (targeting.age_min as number) !== 18) {
          errors.push(`Categoria ${category}: idade mínima deve ser 18`);
        }
        if (targeting.age_max && (targeting.age_max as number) !== 65) {
          errors.push(`Categoria ${category}: idade máxima deve ser 65+`);
        }
        if (targeting.genders && JSON.stringify(targeting.genders) !== '[0]') {
          errors.push(`Categoria ${category}: targeting por gênero não é permitido`);
        }
      }
      warnings.push(`Categoria especial ${category} — restrições: ${restrictions.join('; ')}`);
    }
  }

  return { valid: errors.length === 0, warnings, errors };
}

export async function handleValidatorTool(_name: string, args: Record<string, unknown>): Promise<string> {
  const result = validateAdContent(args);
  return JSON.stringify(result, null, 2);
}
