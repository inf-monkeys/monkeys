// @ts-ignore
ReadableStream.prototype.values ??= function ({ preventCancel = false } = {}) {
  const reader = this.getReader();
  return {
    async next() {
      try {
        const result = await reader.read();
        if (result.done) {
          reader.releaseLock();
        }
        return result;
      } catch (e) {
        reader.releaseLock();
        throw e;
      }
    },
    async return(value: any) {
      if (!preventCancel) {
        const cancelPromise = reader.cancel(value);
        reader.releaseLock();
        await cancelPromise;
      } else {
        reader.releaseLock();
      }
      return { done: true, value };
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
};

// @ts-ignore
ReadableStream.prototype[Symbol.asyncIterator] ??= ReadableStream.prototype.values;
