type Args = Record<string | number, any>;

const VariableREGEXP = /\{([0-9a-zA-Z_]+)\}/g;

export function format(string: string, ...args: any[]): string {
  let argsObject: Args;

  if (args.length === 1 && typeof args[0] === 'object') {
    argsObject = args[0];
  } else {
    argsObject = args.reduce<Args>((acc, curr, index) => {
      acc[index] = curr;
      return acc;
    }, {});
  }

  return string.replace(VariableREGEXP, (match, i, index) => {
    if (string[index - 1] === '{' && string[index + match.length] === '}') {
      return i;
    } else {
      const result = argsObject.hasOwnProperty(i) ? argsObject[i] : null;
      return result === null || result === undefined ? '' : result;
    }
  });
}
