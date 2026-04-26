/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { UserStats, DetectiveCase } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export class SimulationService {
  static async generateCase(type: 'daily' | 'weekly' | 'monthly', stats: UserStats): Promise<Partial<DetectiveCase>> {
    const discipline = ['logic', 'observation', 'strategy', 'discipline'][Math.floor(Math.random() * 4)] as any;
    const difficultyMap = { daily: 'medium', weekly: 'high', monthly: 'legendary' };
    const difficulty = difficultyMap[type] as any;

    const prompt = `
      Create a highly immersive, detailed detective role-play scenario for an intelligence training simulator.
      THEME: Shadow Archetype (Cold, deductive, hyper-intelligent, noir-influenced).
      TYPE: ${type}
      PRIMARY DISCIPLINE: ${discipline}
      DIFFICULTY: ${difficulty}
      USER LEVEL: ${stats.level}

      The scenario should be atmospheric and complex.
      Include:
      - Environmental descriptions (lighting, weather, smell, sound).
      - Character details (micro-expressions, clothing, habits).
      - Subtle technical or psychological hints.

      TASK:
      1. Provide a COMMAND TITLE for the case.
      2. Provide a DETAILED SCENARIO: A mysterious situation requiring deep deduction.
      3. Provide 4-6 COVERT CLUES: Specific, nuanced details found at the scene or through investigation.
      4. Provide a HIDDEN_TRUTH: The absolute reality of what happened (to be used for evaluation).

      FORMAT (JSON):
      {
        "title": "string",
        "scenario": "string (multiline/long)",
        "clues": ["string"],
        "hiddenTruth": "string"
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json" 
        }
      });

      const text = response.text;
      const data = JSON.parse(text || '{}');
      
      return {
        type,
        title: data.title,
        scenario: data.scenario,
        clues: data.clues,
        hiddenTruth: data.hiddenTruth,
        discipline,
        difficulty,
        xpReward: type === 'daily' ? 100 : type === 'weekly' ? 500 : 2000,
        status: 'available'
      };
    } catch (error) {
      console.error("Case Generation Error:", error);
      throw error;
    }
  }

  static async evaluateDeduction(caseScenario: DetectiveCase, userDeduction: string): Promise<{ score: number, evaluation: string }> {
    const prompt = `
      Evaluate a user's deduction in a detective simulation against the ABSOLUTE TRUTH.
      
      SCENARIO: ${caseScenario.scenario}
      HIDDEN TRUTH (THE ACTUAL EVENTS): ${caseScenario.hiddenTruth}
      
      PRIMARY DISCIPLINE: ${caseScenario.discipline}
      DIFFICULTY: ${caseScenario.difficulty}
      USER DEDUCTION: "${userDeduction}"

      ROLE: Cold, analytical AI evaluator (Shadow Protocol).
      CRITERIA: 
      1. Alignment with the HIDDEN TRUTH.
      2. Logical use of provided clues.
      3. Strategic depth of reasoning.

      FORMAT (JSON):
      {
        "score": number (0-100),
        "evaluation": "Provide a brief (2-3 sentences), tactical assessment. Be sharp and professional."
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json" 
        }
      });

      const text = response.text;
      return JSON.parse(text || '{"score": 0, "evaluation": "Analysis failed."}');
    } catch (error) {
      console.error("Evaluation Error:", error);
      return { score: 0, evaluation: "Uplink disrupted. Manual assessment required." };
    }
  }
}
