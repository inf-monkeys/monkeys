declare module 'occt-import-js' {
  export interface OCCTMesh {
    attributes: {
      position: {
        array: number[];
      };
      normal?: {
        array: number[];
      };
    };
    index?: {
      array: number[];
    };
  }

  export interface OCCTResult {
    success: boolean;
    meshes: OCCTMesh[];
  }

  export interface OCCT {
    ReadStepFile(buffer: Uint8Array, config: any): OCCTResult;
  }

  export interface OCCTConfig {
    locateFile?: (file: string) => string;
  }

  export default function occtimportjs(config?: OCCTConfig): Promise<OCCT>;
}
