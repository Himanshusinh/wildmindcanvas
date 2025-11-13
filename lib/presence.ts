/**
 * Canvas Presence Client
 * 
 * Manages user presence (cursor position, tool, selection) for real-time collaboration
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';
const CANVAS_API = `${API_BASE_URL}/api/canvas`;

export interface PresenceData {
  x: number;
  y: number;
  tool?: string;
  color?: string;
  selection?: string[];
}

export class PresenceManager {
  private projectId: string;
  private userId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private presenceData: PresenceData | null = null;

  constructor(projectId: string, userId: string) {
    this.projectId = projectId;
    this.userId = userId;
  }

  /**
   * Start sending presence updates
   */
  start(presenceData: PresenceData) {
    this.presenceData = presenceData;
    
    // Send initial presence
    this.updatePresence(presenceData);

    // Send heartbeat every 2 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.presenceData) {
        this.updatePresence(this.presenceData);
      }
    }, 2000);
  }

  /**
   * Update presence data
   */
  update(presenceData: Partial<PresenceData>) {
    this.presenceData = { ...this.presenceData, ...presenceData } as PresenceData;
    this.updatePresence(this.presenceData);
  }

  /**
   * Stop sending presence updates
   */
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Remove presence on disconnect
    this.removePresence();
  }

  private async updatePresence(data: PresenceData) {
    try {
      await fetch(`${CANVAS_API}/projects/${this.projectId}/presence`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      // Silently fail - presence is not critical
      console.warn('Failed to update presence:', error);
    }
  }

  private async removePresence() {
    try {
      await fetch(`${CANVAS_API}/projects/${this.projectId}/presence`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      // Silently fail
      console.warn('Failed to remove presence:', error);
    }
  }

  /**
   * Get all active presences for the project
   */
  async getPresences(): Promise<Array<{ uid: string; x: number; y: number; tool?: string; color?: string }>> {
    try {
      const response = await fetch(`${CANVAS_API}/projects/${this.projectId}/presence`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.data?.presences || [];
    } catch (error) {
      console.error('Failed to get presences:', error);
      return [];
    }
  }
}

