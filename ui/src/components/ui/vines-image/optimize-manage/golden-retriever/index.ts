import { mutate } from 'swr';

import IndexedDBStore from './indexed-db-store.ts';

export default class GoldenRetriever {
  IndexedDBStore: IndexedDBStore;

  constructor() {
    this.IndexedDBStore = new IndexedDBStore();

    this.restoreBlobs();
  }

  restoreBlobs = (): void => {
    Promise.all([this.loadFileBlobsFromIndexedDB()]).then((resultingArrayOfObjects) => {
      const cacheUrls = Object.fromEntries(
        Object.entries(resultingArrayOfObjects[0]).map(([key, value]) => [key, URL.createObjectURL(value)]),
      );
      void mutate('vines-preview-image-urls', cacheUrls, false);
    });
  };

  async loadFileBlobsFromIndexedDB(): ReturnType<IndexedDBStore['list']> {
    return this.IndexedDBStore.list()
      .then((blobs) => {
        const numberOfFilesRecovered = Object.keys(blobs).length;

        if (numberOfFilesRecovered > 0) {
          console.log(
            `[Vines-GoldenRetriever] Successfully recovered ${numberOfFilesRecovered} images from IndexedDB!`,
          );

          return blobs;
        }
        return {};
      })
      .catch((err) => {
        console.log('[Vines-GoldenRetriever] Failed to recover blobs from IndexedDB', err);
        return {};
      });
  }

  addFile = (fileId: string, blob: Blob): void => {
    void this.IndexedDBStore.put(fileId, blob);
  };

  renewFile = (fileId: string): void => {
    void this.IndexedDBStore.renew(fileId);
  };
}
