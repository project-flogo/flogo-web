import { IToken, tokenName as getTokenName } from 'chevrotain';
import { LiteralNode as JsonLiteralNode } from './json-nodes';
import { BasicLit as ExprBasicLit } from './expr-nodes';

const literalTypeMap = {
  StringLiteral: 'string',
  DblQuoteStringLiteral: 'string',
  SingleQuoteStringLiteral: 'string',
  NumberLiteral: 'number',
  True: 'boolean',
  False: 'boolean',
  Null: 'null',
};

export const makeLiteralNode = (
  nodeType: 'BasicLit' | 'jsonLiteral',
  cstToken: IToken
): JsonLiteralNode | ExprBasicLit => {
  const tokenName = getTokenName(cstToken.tokenType);
  return {
    type: nodeType as any,
    kind: literalTypeMap[tokenName],
    value: parseImage(tokenName, cstToken.image),
    raw: cstToken.image,
  };
};

function parseImage(tokenName: string, image: string) {
  switch (tokenName) {
    case 'SingleQuoteStringLiteral':
      return image.slice(1, -1);
    case 'NestedDblQuoteStringLiteral':
      return image.slice(2, -2);
    case 'Nil':
      return null;
    default:
      return JSON.parse(image);
  }
}
