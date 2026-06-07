export const ECOSYSTEM_PACKAGES = [
  /^@angular($|\/)/,
  /^@angular-devkit($|\/)/,
  /^@angular-eslint($|\/)/,
  /^@nx($|\/)/,
  /^nx$/,
  /^@schematics\/angular$/,
  /^typescript$/,
  /^rxjs$/,
  /^zone\.js$/,
];

export const BUILD_CHAIN_PACKAGES = [
  /^@typescript-eslint($|\/)/,
  /^eslint($|-|\/)/,
  /^prettier$/,
  /^stylelint($|-|\/)/,
  /^karma($|-|\/)/,
  /^jasmine($|-|\/)/,
  /^@types\/jasmine$/,
  /^webpack($|-|\/)/,
  /^@angular-builders($|\/)/,
  /^@commitlint($|\/)/,
  /^semantic-release$/,
  /^@semantic-release($|\/)/,
];

export const MINOR_ALLOWLIST = new Set([
  '@types/lodash',
  '@types/uuid',
  'downsample',
  'flag-icons',
  'immer',
  'lodash',
  'material-design-icons',
  'ts-simple-nameof',
  'typescript-guid',
  'uuid',
]);

export function isBlockedAutomaticPackage(packageName) {
  return [...ECOSYSTEM_PACKAGES, ...BUILD_CHAIN_PACKAGES].some((rule) =>
    rule.test(packageName),
  );
}

export function isAllowedMinorPackage(packageName) {
  return MINOR_ALLOWLIST.has(packageName);
}
