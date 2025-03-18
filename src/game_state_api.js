const API_BASE = '/api';

export class GameStateApi {
    constructor() {
        this.lastUpdateTime = 0;
        this.updateInterval = 100; // Update every 100ms
        this.isEnabled = false;
    }

    async logGameState(state) {
        if (!this.isEnabled) {
            return; // Skip if logging is not enabled
        }

        const currentTime = Date.now();
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return; // Skip if too soon since last update
        }

        try {
            const response = await fetch(`${API_BASE}/game-state`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timestamp: currentTime,
                    position: state.position,
                    rotation: state.rotation,
                    controls: state.controls,
                    currentStep: state.currentStep
                })
            });

            const data = await response.json();
            if (!data.success) {
                console.error('Failed to log game state:', data.error);
            }
        } catch (error) {
            console.error('Error logging game state:', error);
        }

        this.lastUpdateTime = currentTime;
    }

    setUpdateInterval(interval) {
        this.updateInterval = interval;
    }

    enable() {
        this.isEnabled = true;
        this.lastUpdateTime = 0; // Reset the last update time
    }

    disable() {
        this.isEnabled = false;
    }
} 