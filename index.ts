function argsTest(arg1 : string , arg2 : string) : string {
    return arg1 + arg2;
}

type functionType = Parameters<typeof argsTest>;
