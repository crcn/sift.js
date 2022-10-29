// Thank you https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object/58436959#58436959

type Key = string | number | symbol;

type Join<L extends Key | undefined, R extends Key | undefined> = L extends
  | string
  | number
  ? R extends string | number
    ? `${L}.${R}`
    : L
  : R extends string | number
  ? R
  : undefined;

type Union<
  L extends unknown | undefined,
  R extends unknown | undefined
> = L extends undefined
  ? R extends undefined
    ? undefined
    : R
  : R extends undefined
  ? L
  : L | R;

export type DotPath<
  T extends object,
  Prev extends Key | undefined = undefined,
  Path extends Key | undefined = undefined,
  PrevTypes extends object = T
> = string &
  {
    [K in keyof T]: T[K] extends PrevTypes | T // T[K] is a type alredy checked?
      ? //  Return all previous paths.
        Union<Union<Prev, Path>, Join<Path, K>>
      : // T[K] is an object?.
      T[K] extends object
      ? // Continue extracting
        DotPath<T[K], Union<Prev, Path>, Join<Path, K>, PrevTypes | T>
      : // Return all previous paths, including current key.
        Union<Union<Prev, Path>, Join<Path, K>>;
  }[keyof T];
