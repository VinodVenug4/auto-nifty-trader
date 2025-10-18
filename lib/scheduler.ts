// Trading scheduler for automated entry/exit
export class TradingScheduler {
  private entryTimer: NodeJS.Timeout | null = null;
  private exitTimer: NodeJS.Timeout | null = null;
  private onEntry: () => void;
  private onExit: () => void;

  constructor(onEntry: () => void, onExit: () => void) {
    this.onEntry = onEntry;
    this.onExit = onExit;
  }

  // Schedule trades for today
  scheduleToday() {
    const now = new Date();
    const entryTime = new Date();
    const exitTime = new Date();

    // Set entry time to 09:20 AM IST
    entryTime.setHours(9, 20, 0, 0);
    
    // Set exit time to 15:00 PM IST  
    exitTime.setHours(15, 0, 0, 0);

    // If entry time has passed, schedule for next day
    if (now > entryTime) {
      entryTime.setDate(entryTime.getDate() + 1);
      exitTime.setDate(exitTime.getDate() + 1);
    }

    // Schedule entry
    const entryDelay = entryTime.getTime() - now.getTime();
    if (entryDelay > 0) {
      this.entryTimer = setTimeout(() => {
        this.onEntry();
      }, entryDelay);
    }

    // Schedule exit
    const exitDelay = exitTime.getTime() - now.getTime();
    if (exitDelay > 0) {
      this.exitTimer = setTimeout(() => {
        this.onExit();
      }, exitDelay);
    }

    return {
      entryTime: entryTime.toLocaleTimeString(),
      exitTime: exitTime.toLocaleTimeString()
    };
  }

  // Clear all scheduled trades
  clearSchedule() {
    if (this.entryTimer) {
      clearTimeout(this.entryTimer);
      this.entryTimer = null;
    }
    if (this.exitTimer) {
      clearTimeout(this.exitTimer);
      this.exitTimer = null;
    }
  }

  // Get next scheduled times
  getNextTimes() {
    const now = new Date();
    const entryTime = new Date();
    const exitTime = new Date();

    entryTime.setHours(9, 20, 0, 0);
    exitTime.setHours(15, 0, 0, 0);

    if (now > entryTime) {
      entryTime.setDate(entryTime.getDate() + 1);
    }
    if (now > exitTime) {
      exitTime.setDate(exitTime.getDate() + 1);
    }

    return {
      nextEntry: entryTime.toLocaleString(),
      nextExit: exitTime.toLocaleString()
    };
  }
}