export interface Cache {
  get(key: string | number): any;
  set(key: string | number, value: any): any;
}

export interface ReaderOptions {
  cache?: Cache
}
