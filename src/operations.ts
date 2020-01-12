import {
  BaseOperation,
  EqualsOperation,
  Options,
  createTester,
  Tester,
  Operation,
  createQueryOperation
} from "./core";

const $eq = (params: any, options: Options) =>
  new EqualsOperation(params, options);

class $Ne extends BaseOperation<any> {
  private _test: Tester;
  init() {
    this._test = createTester(this.params, this.options.compare);
  }
  reset() {
    super.reset();
    this.success = true;
  }
  next(item: any) {
    if (this._test(item)) {
      this.done = true;
      this.success = false;
    }
  }
}

const $ne = (params: any, options: Options) => new $Ne(params, options);

class $Nin extends BaseOperation<any[]> {
  private _ops: Operation[];
  init() {
    this._ops = this.params.map(query =>
      createQueryOperation(query, this.options)
    );
  }
  reset() {
    super.reset();
    for (let i = 0, { length } = this._ops; i < length; i++) {
      this._ops[i].reset();
    }
  }
  next(item: any) {
    console.log(item, this.params);
  }
}

const $nin = (params: any, options: Options) => new $Nin(params, options);

/*

const eq = new $Neq([1, 2, 3]);
eq.reset();
eq.next([4, 5, 6]);
eq.stopped; // false
eq.next([1, 2, 3]);
eq.stopped; // true
eq.success; // false

*/

export type Query = {
  $eq?: any;
  $ne?: any;
  [identifier: string]: Query;
};

export const creators = {
  $eq,
  $ne,
  $nin
};
