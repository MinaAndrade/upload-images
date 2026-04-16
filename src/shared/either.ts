export type Left<T> = {
    left: T;
    right: never;
};

export type Right<U> = {
    left: never;
    right: U;
};

export type Either<T, U> = Left<T> | Right<U>;

export const isLeft = <T, U>(either: Either<T, U>): either is Left<T> => {
    return either.left !== undefined;
}

export const isRight = <T, U>(either: Either<T, U>): either is Right<U> => {
    return either.right !== undefined;
}

export const unwrapEither = <T, U>(either: Either<T, U>): T | U => {
    if (isLeft(either)) {
        return either.left;
    }

    // aqui é garantido que é Right
    return either.right;
};

export const makeLeft = <T>(value: T): Left<T> => ({ left: value, right: undefined as never });

export const makeRight = <U>(value: U): Right<U> => ({ right: value, left: undefined as never });