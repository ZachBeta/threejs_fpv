# Player Name Feature Changes

## Overview
These changes add support for tracking different players in the game state system.

## Database Changes (`db.js`)
```javascript
// Add playerName to state snapshots query
export const getStateSnapshots = (options = {}) => {
  // ... existing code ...
  if (queryFilter.playerName) {
    sqlQuery += ' AND json_extract(data, "$.playerName") = ?';
    params.push(queryFilter.playerName);
  }
  // ... existing code ...
};

// Update clearAllData to support player filtering
export const clearAllData = (playerName = null) => {
  try {
    const db = getDatabase();
    db.prepare('DELETE FROM state_snapshots WHERE json_extract(data, "$.type") = ? AND (? IS NULL OR json_extract(data, "$.playerName") = ?)').run('game_state', playerName, playerName);
    return { success: true };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, error: error.message };
  }
};
```

## Game State API Changes (`game_state_api.js`)
```javascript
export class GameStateApi {
    constructor(playerName = "human in the loop") {
        this.lastUpdateTime = 0;
        this.updateInterval = 100;
        this.isEnabled = false;
        this.playerName = playerName;
    }

    async logGameState(state) {
        // ... existing code ...
        body: JSON.stringify({
            ...state,
            playerName: this.playerName
        })
        // ... existing code ...
    }
}
```

## Server Endpoint Changes (`server.js`)
```javascript
// Update game states endpoint to support player filtering
app.get('/api/game-states', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) || 100 : 100;
    const player = req.query.player;
    const states = getLatestGameStates(limit, player);
    res.json({ success: true, states });
  } catch (error) {
    console.error('Error getting game states:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update clear logs endpoint to support player filtering
app.post('/api/clear-logs', (req, res) => {
  try {
    const playerName = req.body.playerName;
    const result = clearAllData(playerName);
    res.json(result);
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Implementation Notes
1. All game state operations now support filtering by player name
2. Default player name is "human in the loop"
3. Clear operations can be scoped to specific players
4. API endpoints updated to support player filtering

## Testing Requirements
1. Add tests for player name filtering in state queries
2. Verify clear operations respect player scope
3. Ensure API endpoints handle player name parameters correctly
4. Test default player name behavior 