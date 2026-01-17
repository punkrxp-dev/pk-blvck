import fs from 'fs/promises';
import path from 'path';
import { log } from '../../utils/logger';

const PROMPTS_DIR = path.join(process.cwd(), 'server/ai/prompts');

export async function loadPrompt(templateName: string): Promise<string> {
  try {
    const filename = templateName.endsWith('.md') ? templateName : `${templateName}.md`;
    const filePath = path.join(PROMPTS_DIR, filename);

    // Check if file exists
    await fs.access(filePath);

    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    log(
      `Failed to load prompt template: ${templateName} - ${error instanceof Error ? error.message : 'Unknown error'}`,
      'prompts',
      'error'
    );
    // Fallback to a generic prompt if file not found to prevent crash
    return `Analyze the following lead: {{EMAIL}} {{MESSAGE}}`;
  }
}

export async function loadPersona(personaName: string): Promise<any> {
  try {
    const filePath = path.join(PROMPTS_DIR, 'personas.json');
    const content = await fs.readFile(filePath, 'utf-8');
    const personas = JSON.parse(content);
    return personas[personaName];
  } catch (error) {
    log(
      `Failed to load persona: ${personaName} - ${error instanceof Error ? error.message : 'Unknown error'}`,
      'prompts',
      'error'
    );
    return null;
  }
}
