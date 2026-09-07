/** Rolling per-run budget. Waiting is not counted as model inference time. */
export class RequestPacer {
  private starts: number[] = [];
  constructor(
    private limit = 12,
    private windowMs = 60000,
  ) {}
  async acquire(stopped: () => boolean): Promise<boolean> {
    while (!stopped()) {
      const now = Date.now();
      this.starts = this.starts.filter((at) => now - at < this.windowMs);
      if (this.starts.length < this.limit) {
        this.starts.push(now);
        return true;
      }
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          Math.min(200, this.windowMs - (now - this.starts[0])),
        ),
      );
    }
    return false;
  }
}
