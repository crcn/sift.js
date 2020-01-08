type $And = any;

type $Or = any;

type FieldQuery = any;

type $Eq = any;

export type Query<TItem> = {
  $and?: $And;
  $or?: $Or;
  $eq?: $Eq;
  [identifier: string]: FieldQuery;
};
