declare module "sift" {
  function sift(query:Object):(value:any, index:number, array:any[]) => boolean;
  namespace sift {
  }
  export = sift;
}
