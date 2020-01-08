type $And = {};

type $Or = {};

type FieldQuery = {};

export type Query<TItem> = {
  $and: $And;
  $or: $Or;
  [identifier: string]: FieldQuery;
};
