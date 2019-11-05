// identifier = letter { letter | unicode_digit }
import { createToken, IToken, tokenMatcher, Lexer, TokenType } from 'chevrotain';
import { UnicodeCategory } from './unicode';

export const IdentifierName = createToken({
  name: 'IdentifierName',
  label: 'Identifier',
  // TODO: should we change this regex for manual parsing to avoid perf issues?
  pattern: new RegExp(
    `[_${UnicodeCategory.Letter}][_${UnicodeCategory.Letter}${
      UnicodeCategory.DecimalDigit
    }]*`
  ),
});
export const True = createToken({
  name: 'True',
  label: 'true',
  pattern: /true/,
});
export const False = createToken({
  name: 'False',
  label: 'false',
  pattern: /false/,
});
export const Nullable = createToken({
  name: 'Nullable',
  label: 'Nullable',
  pattern: Lexer.NA,
});
export const Null = createToken({
  name: 'Null',
  label: 'null',
  longer_alt: IdentifierName,
  categories: Nullable,
  pattern: /null/,
});
export const Nil = createToken({
  name: 'Nil',
  label: 'nil',
  longer_alt: IdentifierName,
  categories: Nullable,
  pattern: /nil/,
});
export const LCurly = createToken({
  name: 'LCurly',
  label: '{',
  pattern: /{/,
});
export const RCurly = createToken({
  name: 'RCurly',
  label: '}',
  pattern: /}/,
});
export const LParen = createToken({
  name: 'LParen',
  label: '(',
  pattern: /\(/,
});
export const RParen = createToken({
  name: 'RParen',
  label: ')',
  pattern: /\)/,
});
export const LSquare = createToken({
  name: 'LSquare',
  label: '[',
  pattern: /\[/,
});
export const RSquare = createToken({
  name: 'RSquare',
  label: ']',
  pattern: /]/,
});
export const Dot = createToken({
  name: 'Dot',
  label: '.',
  pattern: /\./,
});
export const Comma = createToken({
  name: 'Comma',
  label: ',',
  pattern: /,/,
});
export const TernaryOper = createToken({
  name: 'TernaryOper',
  label: '?',
  pattern: /\?/,
});
export const Colon = createToken({
  name: 'Colon',
  label: ':',
  pattern: /:/,
});
export const StringLiteral = createToken({
  name: 'StringLiteral',
  label: 'StringLiteral',
  pattern: Lexer.NA,
});
export const DblQuoteStringLiteral = createToken({
  name: 'DblQuoteStringLiteral',
  label: 'StringLiteral',
  categories: StringLiteral,
  pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
});
export const SingleQuoteStringLiteral = createToken({
  name: 'SingleQuoteStringLiteral',
  label: 'StringLiteral',
  categories: StringLiteral,
  pattern: /'(?:[^\\']|\\(?:[bfnrtv'\\/]|u[0-9a-fA-F]{4}))*'/,
});
export const NestedDblQuoteStringLiteral = createToken({
  name: 'NestedDblQuoteStringLiteral',
  label: 'StringLiteral',
  categories: StringLiteral,
  pattern: /\\"(?:[^\\\\"]|\\\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*\\"/,
});

function matchStringTemplateOpen(text: string, startOffset?: number, tokens?: IToken[]) {
  if (tokens.length <= 2) {
    return null;
  }
  const isLexingJson = tokens.find((token, index, tokenArr) => {
    const prevToken = index - 1 >= 0 ? tokenArr[index - 1] : null;
    return (
      prevToken && tokenMatcher(token, Colon) && tokenMatcher(prevToken, StringLiteral)
    );
  });
  if (!isLexingJson) {
    return null;
  }
  return /^"{{/.exec(text.substr(startOffset));
}

export const StringTemplateOpen = createToken({
  name: 'StringTemplateOpen',
  label: 'Open String template ("{{)',
  pattern: { exec: matchStringTemplateOpen },
  line_breaks: false,
  push_mode: 'string_template',
});
export const StringTemplateClose = createToken({
  name: 'StringTemplateClose',
  label: 'Closing StringTemplate (}}")',
  pattern: /}}"/,
  pop_mode: true,
});
export const InlineObjectExprOpen = createToken({
  name: 'InlineObjectExprOpen',
  label: 'Open inline object expression',
  pattern: /"=/,
  push_mode: 'inline_object_expr',
});
export const InlineObjectExprClose = createToken({
  name: 'InlineObjectExprClose',
  label: 'Close inline object expression',
  pattern: /"/,
  pop_mode: true,
});
export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  label: 'NumberLiteral',
  pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
});
export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  label: 'Whitespace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
  line_breaks: true,
});
export const Lookup = createToken({
  name: 'Lookup',
  label: '$',
  pattern: /\$/,
});
const RESOLVER_PATTERN = new RegExp(
  `[_${UnicodeCategory.Letter}][_\.${UnicodeCategory.Letter}${
    UnicodeCategory.DecimalDigit
  }]*`
);

function matchResolverIdentifier(text: string, startOffset?: number, tokens?: IToken[]) {
  if (tokens.length < 3) {
    return null;
  }
  const lastTokenIdx = tokens.length - 1;
  const isLexingResolver =
    tokenMatcher(tokens[lastTokenIdx], LSquare) &&
    tokenMatcher(tokens[lastTokenIdx - 1], IdentifierName) &&
    tokenMatcher(tokens[lastTokenIdx - 2], Lookup);
  if (isLexingResolver) {
    return RESOLVER_PATTERN.exec(text.substr(startOffset));
  }
  return null;
}

export const ResolverIdentifier = createToken({
  name: 'ResolverIdentifier',
  label: 'ResolverIdentifier',
  pattern: { exec: matchResolverIdentifier },
  line_breaks: false,
});
export const BinaryOp = createToken({
  name: 'BinaryOp',
  label: 'Binary operator',
  pattern: Lexer.NA,
});
// OPERATOR PRECEDENCE: 5 (greatest)
export const MulOp = createToken({
  name: 'MulOp',
  pattern: /\*|\/|%|<<|>>|&/,
  categories: BinaryOp,
});
// TODO: are all operators supported?
export const AddOp = createToken({
  name: 'AddOp',
  pattern: /[+\-]/,
  categories: BinaryOp,
});
// TODO: are all operators supported?
export const RelOp = createToken({
  name: 'RelOp',
  pattern: /==|!=|<=|>=|<|>/,
  categories: BinaryOp,
});
// OPERATOR PRECEDENCE: 2
export const LogicalAnd = createToken({
  name: 'LogicalAnd',
  pattern: /&&/,
  categories: BinaryOp,
});
// OPERATOR PRECEDENCE: 1
export const LogicalOr = createToken({
  name: 'LogicalOr',
  pattern: /\|\|/,
  categories: BinaryOp,
});
