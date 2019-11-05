/**
 * Mapping expressions parser
 * Based on:
 *  - https://golang.org/ref/spec
 *  - https://github.com/antlr/grammars-v4/tree/master/golang
 */
import { Parser, tokenMatcher } from 'chevrotain';
import * as Token from './tokens';
import { lexerDefinition } from './lexer-definition';

/////////////////////////////
//        TOKENS           //
////////////////////////////

// IMPORTANT:  Tokens are defined in the same file to prevent webpack/treeshaking from removing them
// as it cannot detect the tokens are being used by the parser.
// Another alternative would be to 'require' the file which will also prevent treeshaking but 'require' is causing issues
// with the current setup.
// const Token = require('./tokens');

// https://golang.org/ref/spec#Identifiers

// TODO: are all operators supported?

// OPERATOR PRECEDENCE: 4

// OPERATOR PRECEDENCE: 3

/////////////////////////////
//        PARSER           //
////////////////////////////

// disable member odering rule because the parser requires to declare properties
// instead of functions, so all the functions are properties
// tslint:disable:member-ordering
export class MappingParser extends Parser {
  constructor() {
    super(lexerDefinition, {
      recoveryEnabled: true,
      outputCst: true,
    });
    this.performSelfAnalysis();
  }

  public mappingExpression = this.RULE('mappingExpression', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.expression) },
      { ALT: () => this.SUBRULE(this.json) },
    ]);
  });

  public attrAccess = this.RULE('attrAccess', () => {
    this.SUBRULE(this.operandHead);
    this.MANY(() => this.SUBRULE(this.primaryExprTail));
  });

  public literal = this.RULE('literal', () => {
    this.OR([
      { ALT: () => this.CONSUME(Token.StringLiteral) },
      { ALT: () => this.CONSUME(Token.NumberLiteral) },
      { ALT: () => this.CONSUME(Token.True) },
      { ALT: () => this.CONSUME(Token.False) },
      { ALT: () => this.CONSUME(Token.Nullable) },
    ]);
  });

  public json = this.RULE('json', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.object) },
      { ALT: () => this.SUBRULE(this.array) },
    ]);
  });

  public expression = this.RULE('expression', () => {
    this.SUBRULE(this.baseExpr);
    this.OPTION(() => this.SUBRULE(this.ternaryExpr));
  });

  public baseExpr = this.RULE('baseExpr', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.parenExpr) },
      { ALT: () => this.SUBRULE(this.unaryExpr) },
    ]);
    this.MANY(() => this.SUBRULE1(this.binaryExprSide));
  });

  private parenExpr = this.RULE('parenExpr', () => {
    this.CONSUME(Token.LParen);
    this.SUBRULE(this.baseExpr);
    this.CONSUME(Token.RParen);
  });

  public resolver = this.RULE('resolver', () => {
    this.CONSUME1(Token.Lookup);
    this.OPTION(() => this.SUBRULE(this.resolverSelector));
  });

  private binaryExprSide = this.RULE('binaryExprSide', () => {
    this.CONSUME(Token.BinaryOp);
    this.SUBRULE(this.baseExpr);
  });

  private unaryExpr = this.RULE('unaryExpr', () => {
    return this.SUBRULE(this.primaryExpr);
  });

  private primaryExpr = this.RULE('primaryExpr', () => {
    this.SUBRULE(this.operand);
    this.MANY(() => this.SUBRULE1(this.primaryExprTail));
  });

  private primaryExprTail = this.RULE('primaryExprTail', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.selector) },
      { ALT: () => this.SUBRULE(this.index) },
      { ALT: () => this.SUBRULE(this.argumentList) },
    ]);
  });

  private operand = this.RULE('operand', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.literal) },
      { ALT: () => this.SUBRULE(this.operandHead) },
    ]);
  });

  private operandHead = this.RULE('operandHead', () => {
    this.OR([
      { ALT: () => this.CONSUME(Token.IdentifierName) },
      { ALT: () => this.SUBRULE(this.resolver) },
    ]);
  });

  private resolverSelector = this.RULE('resolverSelector', () => {
    this.CONSUME1(Token.IdentifierName);
    this.OPTION({
      // avoid ambiguity between $resolver[name] and $arrayThing[0]
      GATE: () => !tokenMatcher(this.LA(2), Token.NumberLiteral),
      DEF: () => {
        this.CONSUME(Token.LSquare);
        this.CONSUME(Token.ResolverIdentifier);
        this.CONSUME(Token.RSquare);
      },
    });
  });

  protected selector = this.RULE('selector', () => {
    this.CONSUME(Token.Dot);
    this.CONSUME(Token.IdentifierName);
  });

  protected index = this.RULE('index', () => {
    this.CONSUME(Token.LSquare);
    this.CONSUME(Token.NumberLiteral);
    this.CONSUME(Token.RSquare);
  });

  protected argumentList = this.RULE('argumentList', () => {
    this.CONSUME(Token.LParen);
    this.MANY_SEP({
      SEP: Token.Comma,
      DEF: () => this.SUBRULE(this.baseExpr),
    });
    this.CONSUME(Token.RParen);
  });

  protected ternaryExpr = this.RULE('ternaryExpr', () => {
    this.CONSUME1(Token.TernaryOper);
    this.SUBRULE1(this.baseExpr);
    this.CONSUME2(Token.Colon);
    this.SUBRULE2(this.baseExpr);
  });

  //// JSON

  protected object = this.RULE('object', () => {
    this.CONSUME(Token.LCurly);
    this.MANY_SEP({
      SEP: Token.Comma,
      DEF: () => {
        this.SUBRULE(this.objectItem);
      },
    });
    this.CONSUME(Token.RCurly);
  });

  protected objectItem = this.RULE('objectItem', () => {
    this.CONSUME(Token.DblQuoteStringLiteral);
    this.CONSUME(Token.Colon);
    this.SUBRULE(this.jsonValue);
  });

  protected array = this.RULE('array', () => {
    this.CONSUME(Token.LSquare);
    this.MANY_SEP({
      SEP: Token.Comma,
      DEF: () => {
        this.SUBRULE(this.jsonValue);
      },
    });
    this.CONSUME(Token.RSquare);
  });

  protected jsonValue = this.RULE('jsonValue', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.stringTemplate) },
      { ALT: () => this.SUBRULE(this.inlineObjectExpr) },
      { ALT: () => this.CONSUME(Token.DblQuoteStringLiteral) },
      { ALT: () => this.CONSUME(Token.NumberLiteral) },
      { ALT: () => this.SUBRULE(this.object) },
      { ALT: () => this.SUBRULE(this.array) },
      { ALT: () => this.CONSUME(Token.True) },
      { ALT: () => this.CONSUME(Token.False) },
      { ALT: () => this.CONSUME(Token.Null) },
    ]);
  });

  protected stringTemplate = this.RULE('stringTemplate', () => {
    this.CONSUME(Token.StringTemplateOpen);
    this.SUBRULE(this.expression);
    this.CONSUME(Token.StringTemplateClose);
  });

  protected inlineObjectExpr = this.RULE('inlineObjectExpr', () => {
    this.CONSUME(Token.InlineObjectExprOpen);
    this.SUBRULE(this.expression);
    this.CONSUME(Token.InlineObjectExprClose);
  });
}

// todo: get of rid of this temporary hack to fix issues for client production build
// when angular cli's optimization options are enabled the process (which is using the library "Terser") removes the name of the classes
// this causes that at runtime MappingParser.constructor.name has a value of an empty string ("") and Chevrotain depends on said constuctor.name
// during runtime (https://github.com/SAP/chevrotain/blob/21b76452faf1df0413df83d7852f7b1d6534f7a4/packages/chevrotain/src/lang/lang_extensions.ts#L15)
// Angular CLI doesn't expose by default a way to configure the optimizations it applies to the code nor we can define a `name` manually in the class
// because NodeJS will complain because `name` is a readonly property automatically defined by Javascript.
// Hence we're re-defining the class' `toString()` method so the fallback in Chevrotain's code can be used
MappingParser.toString = function() {
  return 'MappingParser';
};
