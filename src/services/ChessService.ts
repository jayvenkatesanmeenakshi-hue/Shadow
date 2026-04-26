/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChessGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time?: number;
  rated: boolean;
  white: { username: string, rating: number };
  black: { username: string, rating: number };
}

export class ChessService {
  private static BASE_URL = 'https://api.chess.com/pub/player';

  static async getCurrentGames(username: string): Promise<ChessGame[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/${username}/games`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.games || [];
    } catch (error) {
      console.error('Error fetching current games:', error);
      return [];
    }
  }

  static async getRecentGames(username: string): Promise<ChessGame[]> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      const response = await fetch(`${this.BASE_URL}/${username}/games/${year}/${month}`);
      if (!response.ok) return [];
      const data = await response.json();
      // Returns games from the current month, sorted by end_time desc
      const games = (data.games || []) as ChessGame[];
      return games.sort((a, b) => (b.end_time || 0) - (a.end_time || 0));
    } catch (error) {
      console.error('Error fetching recent games:', error);
      return [];
    }
  }
}
