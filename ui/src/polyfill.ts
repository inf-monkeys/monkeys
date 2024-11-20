import './utils/polyfills/requestidlecallback.ts';

// @ts-ignore
'hasOwn' in Object || (Object.hasOwn = Object.call.bind(Object.hasOwnProperty));
