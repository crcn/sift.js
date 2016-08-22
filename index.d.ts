declare module sift {
    export interface ISiftQueries {

    }

    export interface ISifter<T> extends Function {

    }

    export type ISiftQuery = RegExp|ISiftQueries;

    interface Sift {
        <T>(query: T): ISifter<T>;
        <T>(query: ISiftQuery, target?: T, rawSelector?: any): T;
        indexOf(query: any, target: any, rawSelector: any): any;
        use(options: any): any;
    }
}

declare module "sift" {
    var f: sift.Sift;
    export = f;
}
