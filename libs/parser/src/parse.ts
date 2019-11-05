import { Lexer } from 'chevrotain';
import { MappingParser } from './parser/parser';
import { astCreatorFactory, RootAstNode, ExprNodes, Node } from './ast';
import { ParseResult } from './parser/parse-result';
import { lexerDefinition } from './parser/lexer-definition';

export type ParseResolverResult = ParseResult<ExprNodes.ScopeResolver | null>;

const lexer = new Lexer(lexerDefinition);
// reuse the same parser instance.
const parserInstance = new MappingParser();
const BaseCstVisitor = parserInstance.getBaseCstVisitorConstructor();
// const BaseCstVisitor = parserInstance.getBaseCstVisitorConstructorWithDefaults();
const AstCreator = astCreatorFactory(BaseCstVisitor);

export type StartingRuleName = 'mappingExpression' | 'resolver';
export function parse<T extends Node = RootAstNode>(
  text,
  startingRule: StartingRuleName = 'mappingExpression'
): ParseResult<T> {
  const lexResult = lexer.tokenize(text);
  // setting a new input will RESET the parser instance's state.
  parserInstance.input = lexResult.tokens;
  const cst = parserInstance[startingRule]();
  let ast = null;
  if (parserInstance.errors.length === 0) {
    const astCreator = new AstCreator();
    ast = astCreator.visit(cst);
  }
  return {
    cst,
    ast,
    lexErrors: lexResult.errors,
    parseErrors: parserInstance.errors,
  };
}

export function parseResolver(text): ParseResolverResult {
  return parse(text, 'resolver');
}
