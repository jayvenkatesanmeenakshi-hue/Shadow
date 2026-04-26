/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { JournalTopic, JournalEntry, UserStats } from '../types';

// AI Studio automatically injects GEMINI_API_KEY into the process environment.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export class IntelligenceService {
  static async generateShadowReport(stats: UserStats, topics: JournalTopic[], entries: JournalEntry[]) {
    // Construct the context
    const context = entries.map(e => {
      const topicName = topics.find(t => t.id === e.topicId)?.name || 'Unknown';
      return `[Date: ${e.date}, Topic: ${topicName}] Deduction: ${e.deductions}`;
    }).join('\n');

    const prompt = `
      You are an tactical intelligence evaluator for an individual operating under the "Shadow" archetype (inspired by high-intelligence characters like Kira or Light Yagami).
      Analyze the following deductive journal entries and user stats to provide a tactical evaluation report.

      USER STATS:
      - Level: ${stats.level} (Beginner to Shadow)
      - XP: ${stats.xp}
      - Total Successful Missions: ${stats.completedCount}
      - Intelligence Disciplines: Logic (${stats.categories.logic}), Observation (${stats.categories.observation}), Strategy (${stats.categories.strategy}), Discipline (${stats.categories.discipline})

      JOURNAL ENTRIES:
      ${context}

      TASK:
      1. Analyze the depth of observation, logical connections, and strategic foresight in the entries.
      2. Provide a "Tactical Evaluation" (brief executive summary of their intelligence progress).
      3. Identify "Dominant Disciplines" and "Cognitive Vulnerabilities".
      4. Suggest "Next Level Operations" to sharpen their intellect.
      5. Estimate a "Shadow Percentile" (0-100%) how close they are to the master-level thinking of the Shadow archetype.

      FORMAT:
      Return your analysis in clear sections using tactical, cold, and professional language.
      End with "SHADOW_PERCENTILE: [Number]"
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      const text = response.text || '';
      
      // Parse percentile
      const percentileMatch = text.match(/SHADOW_PERCENTILE:\s*(\d+)/i);
      const percentile = percentileMatch ? parseInt(percentileMatch[1]) : 50;

      return {
        text: text.replace(/SHADOW_PERCENTILE:\s*\d+/i, '').trim(),
        percentile: Math.min(Math.max(percentile, 1), 99) // Keep within 1-99 for style
      };
    } catch (error) {
      console.error("Intelligence Analysis Error:", error);
      throw error;
    }
  }
}
