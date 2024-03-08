export interface Credential {
  type: string;
  id: string;
}

export interface InputParametersType {
  /**
   * block 类型，需要依赖此数据作为 HTTP URL、参数传递的依据
   */
  __customBlockName?: string;

  /**
   * 对应的 credential
   */
  credential?: Credential;

  /**
   * 具体的请求数据
   */
  [x: string]: any;
}
