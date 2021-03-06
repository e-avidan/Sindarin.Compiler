import moo from "moo";
import nearley from "nearley";

class SkippingLexer implements nearley.Lexer {
  lexer: moo.Lexer;
  skip: Set<string>;

  constructor(lexer: moo.lexer) {
    this.lexer = lexer;
    this.skip = new Set(["WS", "COMMENT"]);
  }

  next() {
    do {
      const token = this.lexer.next();
      if (!(token && this.skip.has(token.type))) {
        return token;
      }
    } while (true);
  }

  reset(...args) {
    this.lexer.reset(...args);
  }
  formatError(...args) {
    return this.lexer.formatError(...args);
  }
  save(...args) {
    return this.lexer.save(...args);
  }
  has(...args) {
    return this.lexer.has(...args);
  }
}

class Parser extends nearley.Parser {
  lexer: nearley.Lexer;
  initial: any;

  constructor(grammar: any) {
    super(Parser.prepare(grammar));
    this.initial = this.save();
  }

  static prepare(grammar: any) {
    const rigid = grammar.Rigid || [];
    for (const rule of grammar.ParserRules) {
      rule.postprocess = rigid.includes(rule.name)
        ? (data: any[]) => this.unfold(data, rule.name)
        : rule.symbols.length === 1
        ? (data: any[]) => data[0]
        : (data: any[]) => Object.assign(data, { type: rule.name });
    }
    return grammar;
  }

  parse(program: string) {
    this.restart();
    this.feed(program);
    return this.finish();
  }

  restart() {
    this.restore(this.initial);
  }

  reportError(token: any) {
    return this.lexer.formatError(token, "Syntax error");
  }

  static unfold(data: any[], type: string) {
    function* iter() {
      for (const d of data) {
        if (d.type === type) {
          yield* d;
        } else {
          yield d;
        }
      }
    }
    return Object.assign([...iter()], { type });
  }
}

export { Parser, SkippingLexer };
