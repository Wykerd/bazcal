/**
 *  This file is part of Bazcal.
 *
 *  Bazcal is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Bazcal is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Bazcal.  If not, see <https://www.gnu.org/licenses/>.
 */

export class InputError extends Error {
    public line: number;
    public col: number;
    constructor (message: string, line: number, col: number) {
        super(message);
        this.line = line;
        this.col = col;
    }
}

export class InputStream {
    private pos : number = 0;
    private line : number = 1;
    private col : number = 0;
    private buffer : string;
    
    constructor (input: string) {
        this.buffer = input;
    }

    /**
     * Get the next character in the stream
     * @returns The next character
     */
    public next() : string {
        const char = this.buffer.charAt(this.pos++);
        if (char === '\n') {
            this.line++;
            this.col = 0;
        } else this.col++;
        return char;
    }

    /**
     * Get current character in stream
     * @returns The current character
     */
    public current() : string {
        return this.buffer.charAt(this.pos);
    }

    /**
     * Check if end of stream
     */
    public isEof() : boolean {
        return this.current() === '';
    }

    /**
     * Throw parse error 
     */
    public error(message : string) {
        return new InputError(`${message} (${this.line}:${this.col})`, this.line, this.col);
    }
}

export enum TokenType {
    STRING = 'str',
    NUMBER = 'num',
    FUNCTION = 'func',
    PUNCTUATION = 'punc',
    VARIABLE = 'var',
    KEYWORD = 'key',
    OPERARTOR = 'op'
}

export interface Token {
    type: TokenType,
    value: number | string
}

export const token_type_regex = {
    punctuation: /(,|;|\(|\)|{|}|\[|\])/i,
    operator: /(\+|-|\*|\/|%|=|&|\||<|>|!|\^)/i,
    digit: /[0-9]/i,
    identifier_start: /[a-z_]/i,
    identifier_next: /[a-z_0-9]/i
}

export const keywords = [ "if", "then", "else", "func", "true", "false", "include", "for", "while", "do" ];

export class TokenStream {
    public readonly input : InputStream;
    cur_tok : Token | null = null;

    constructor (input : InputStream) {
        this.input = input;
    }

    private read_while (check: (a: string) => boolean) : string {
        let str = '';
        while (!this.input.isEof() && check(this.input.current())) {
            str += this.input.next();
        }
        return str;
    }

    private skip_comment() {
        while (!this.input.isEof() && this.input.current() !== '\n') {
            this.input.next();
        }
    }

    private read_string() : Token {
        let str = '';
        let clean_exit = false;
        this.input.next(); // skip "
        while (!this.input.isEof()) {
            const char = this.input.next();
            if (char === '\\') {
                const next_char = this.input.next();;
                if (next_char === 'n') str += '\n';
                else str += next_char;
            } else if (char === '"') {
                clean_exit = true;
                break;
            } else if (char === '\n') {
                break;
            } else {
                str += char;
            }
        }

        if (!clean_exit) throw this.input.error("Unterminated string");

        return {
            type: TokenType.STRING,
            value: str
        };
    }

    private read_number() : Token {
        let float = false;
        const num_str = this.read_while(c => {
            if (c === ".") {
                if (!float) {
                    float = true
                    return true;
                }
                else return false;
            }
            return token_type_regex.digit.test(c);
        })
        return {
            type: TokenType.NUMBER,
            value: parseFloat(num_str)
        }
    }

    private read_identifier() : Token {
        const id = this.read_while(a => token_type_regex.identifier_next.test(a));
        return {
            type: keywords.includes(id) ? TokenType.KEYWORD : TokenType.VARIABLE,
            value: id
        }
    }

    private next_token () : Token | null {
        this.read_while(a => ' \n\t'.includes(a)); // skip whitespaces
        if (this.input.isEof()) return null;
        const char = this.input.current();
        // Remove comments
        if (char === '#') {
            this.skip_comment();
            return this.next_token();
        }
        // Read strings
        if (char === '"') return this.read_string();
        // Read numbers
        if (token_type_regex.digit.test(char)) return this.read_number();
        // Read identifiers
        if (token_type_regex.identifier_start.test(char)) return this.read_identifier();
        // Punctuation
        if (token_type_regex.punctuation.test(char)) return {
            type: TokenType.PUNCTUATION,
            value: this.input.next()
        };
        // Operators
        if (token_type_regex.operator.test(char)) return {
            type: TokenType.OPERARTOR,
            value: this.read_while(a => token_type_regex.operator.test(a))
        }
        throw this.input.error(`Invalid character ${char}`);
    }

    public next() : Token | null {
        const tok = this.cur_tok;
        this.cur_tok = null;
        return tok || this.next_token();
    }

    public current() : Token | null {
        return this.cur_tok || (this.cur_tok = this.next_token())
    }

    public isEof() : boolean {
        return this.current() === null;
    }
}

export interface ASTNode {
    type: string;
    [key: string]: any;
}

export const PRECEDENCE : { [key:string]: number } = {
    "=": 1,
    "||": 2,
    "&&": 3,
    "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
    "+": 10, "-": 10,
    "*": 20, "/": 20, "%": 20, "**": 20, "^": 20
};

export const ASSIGN_OPERATORS = [ '=', /*'+=', '-=', '^=', '~=', '|='*/ ];

export class Parser {
    public readonly stream : TokenStream;

    constructor (stream : TokenStream) {
        this.stream = stream;
        this.parse_expression = this.parse_expression.bind(this);
    }

    private is_punc(val?: string) : Token | false {
        const tok = this.stream.current();
        return tok && tok.type === TokenType.PUNCTUATION && (!val || tok.value === val) ? tok : false;
    }

    private is_op(val?: string) : Token | false {
        const tok = this.stream.current();
        return tok && tok.type === TokenType.OPERARTOR && (!val || tok.value === val) ? tok : false;
    }

    private is_type(type: TokenType) {
        return this.stream.current()?.type === type;
    }

    private unexpected() {
        return this.stream.input.error('Unexpected token: ' + JSON.stringify(this.stream.current()));
    }

    private unexpected_eof() {
        return this.stream.input.error('Unexpected EOF');
    }

    private list_nstart (end: string, delim: string, parser: () => ASTNode) : ASTNode[] {
        const items : ASTNode[] = [];
        while (!this.stream.isEof()) {
            if (this.is_punc(end)) {
                this.stream.next();
                return items;
            }
            items.push(parser());
            if (this.is_punc(end)) {
                this.stream.next();
                return items;
            }
            if (this.is_punc(delim)) {
                this.stream.next();
                continue;
            }
            throw this.unexpected();
        }
        throw this.unexpected_eof();
    }

    private list (start : string, end: string, delim: string, parser: () => ASTNode) : ASTNode[] {
        if (!this.is_punc(start)) throw this.unexpected();
        this.stream.next();
        return this.list_nstart(end, delim, parser);
    }

    private parse_func (is_named: boolean = false) : ASTNode {
        const tok = this.stream.current();
        
        // anon func
        if (this.is_punc("(")) {
            const params = this.list("(", ")", ",", () => { 
                if (this.stream.current()?.type !== TokenType.VARIABLE) throw this.unexpected()
                const tok = this.stream.current();
                if (!tok) throw this.unexpected_eof();
                this.stream.next();
                return tok;
            }).map(tok => tok.value);

            const body = this.parse_expression();

            return {
                type: 'func',
                params,
                body
            }
        }

        // named func
        if (this.is_type(TokenType.VARIABLE) && !is_named) {
            this.stream.next();
            // convert to an assignment.
            return {
                type: 'assign',
                operator: '=',
                left: { type: 'var', value: tok?.value},
                right: this.parse_func(true)
            }
        }

        throw this.unexpected();
    }

    private parse_sequence() : ASTNode {
        const seq = this.list_nstart("}", ";", this.parse_expression);
        if (seq.length === 0) return {
            type: 'bool',
            value: false
        } 
        if (seq.length === 1) return seq[0];
        return {
            type: 'sequence',
            seq
        }
    }

    private parse_assignment (left: ASTNode) : ASTNode {
        const tok = this.stream.current();
        if (!tok) throw Error('Called parse_assignment on empty token stream');
        this.stream.next();
        return {
            type: 'assign',
            operator: tok.value,
            left,
            right: this.parse_expression()
        };
    }

    private parse_binary (left: ASTNode, prec: number) : ASTNode {
        const op = this.stream.current();
        if (op) {
            const op_prec = PRECEDENCE[op.value];
            if (op_prec > prec) {
                this.stream.next();
                var right = this.parse_binary(this.parse_expression(), op_prec);
                var binary = {
                    type: "binary",
                    operator: op.value,
                    left,
                    right
                };
                return this.parse_binary(binary, prec);
            }
        }
        return left;
    }

    private parse_call(func: ASTNode) {
        const args = this.list("(", ")", ",", this.parse_expression);
        return {
            type: 'call',
            args: args,
            func
        }
    }

    private parse_if() {
        const cond = this.parse_expression();
        if (!this.is_punc('{')) {
            if (this.is_type(TokenType.KEYWORD) && this.stream.current()?.value === 'then') this.stream.next();
            else throw this.unexpected();
        }
        const then = this.parse_expression();
        const ret: ASTNode = {
            type: 'if',
            cond,
            then
        };
        if (this.is_type(TokenType.KEYWORD) && this.stream.current()?.value === 'else') {
            this.stream.next();
            ret.else = this.parse_expression();
        }
        return ret;
    }

    private parse_while() : ASTNode {
        if (!this.is_punc("(")) throw this.unexpected();
        this.stream.next();
        const cond = this.parse_expression();
        if (this.is_punc(')')) this.stream.next();
        else throw this.unexpected();
        if (!this.is_punc('{')) {
            if (this.is_type(TokenType.KEYWORD) && this.stream.current()?.value === 'do') this.stream.next();
            else throw this.unexpected();
        }
        const loop = this.parse_expression();
        return {
            type: 'while',
            cond,
            loop
        };
    }

    private parse_for () : ASTNode {
        if (!this.is_punc("(")) throw this.unexpected();
        this.stream.next();
        const counter = this.parse_expression();
        if (this.is_punc(';')) this.stream.next();
        else throw this.unexpected();
        const cond = this.parse_expression();
        if (this.is_punc(';')) this.stream.next();
        else throw this.unexpected();
        const inc = this.parse_expression();
        if (this.is_punc(')')) this.stream.next();
        else throw this.unexpected();
        if (!this.is_punc('{')) {
            if (this.is_type(TokenType.KEYWORD) && this.stream.current()?.value === 'do') this.stream.next();
            else throw this.unexpected();
        }
        const loop = this.parse_expression();
        return {
            type: 'for',
            counter,
            cond,
            inc,
            loop
        };
    }

    private parse_expression () : ASTNode {
        const tok = this.stream.current();

        this.stream.next();

        const next_tok = this.stream.current();

        if (!tok) throw this.unexpected_eof();

        if (next_tok) {
            // this is a method call
            if ((tok.type === TokenType.VARIABLE) && this.is_punc("(")) {
                const exp = this.parse_call(tok);
                if (this.is_op()) return this.parse_binary(exp, 0);
                return exp;
            }
            
            // this is a function declaration
            if (tok.type === TokenType.KEYWORD && tok.value === 'func') return this.parse_func();

            // this is sequence
            if (tok.type === TokenType.PUNCTUATION && tok.value === '{') return this.parse_sequence();

            // this is an if-else block
            if (tok.type === TokenType.KEYWORD && tok.value === 'if') return this.parse_if();

            // this is an assignment
            if (this.is_op() && (ASSIGN_OPERATORS.includes('' + next_tok.value))) return this.parse_assignment(tok);

            // this is an binary expression
            if (this.is_op()) return this.parse_binary(tok, 0);

            // this is an encapculated expression
            if (tok.type === TokenType.PUNCTUATION && tok.value === '(') {
                const expr = this.parse_expression();
                if (this.is_punc(")")) this.stream.next();
                if (this.is_op()) return this.parse_binary(expr, 0);
                if (this.is_punc("(") && expr.type === 'func') return this.parse_call(expr);
                return expr;
            }

            if (tok.type === TokenType.KEYWORD) {
                switch (tok.value) {
                    // booleans
                    case 'false':
                    case 'true':
                        return {
                            type: 'bool',
                            value: tok.value === 'true'
                        }
                    
                    case 'include':
                        if (next_tok.type === TokenType.STRING) {
                            this.stream.next();
                            return {
                                type: 'include',
                                value: next_tok.value
                            }
                        } else throw this.unexpected();
                    
                    case 'for':
                        return this.parse_for();

                    case 'while':
                        return this.parse_while();

                    default:
                        break;
                }
            }
        }

        return tok;
    }

    public parse() : ASTNode[] {
        const seq : ASTNode[] = [];

        while (!this.stream.isEof()) {
            seq.push(this.parse_expression());
            if (!this.is_punc(";")) throw this.stream.input.error('Expected semi colon but got ' + JSON.stringify(this.stream.current()));
            this.stream.next();
        }

        return seq;
    }
}

export class Environment {
    private vars: any;
    private parent: Environment | undefined;

    constructor (parent?: Environment) {
        this.vars = {};
        this.parent = parent;
        this.find = this.find.bind(this);
    }

    public child() {
        return new Environment(this);
    }

    public find(name: string) {
        let scope : Environment | undefined = this;
        while (scope) {
            if (scope.vars.hasOwnProperty(name)) return scope;
            scope = scope.parent;
        }
    }

    public get (name: string) {
        const scope = this.find(name);
        if (scope) return scope.vars[name];
        throw new Error(`Runtime error: Undefined variable ${name}`);
    }

    public set (name : string, value : any) {
        const scope = this.find(name);
        return (scope ? scope : this).vars[name] = value;
    }

    public def (name : string, value: any) {
        return this.vars[name] = value;
    }

    private make_func(exp: ASTNode) {
        const scope = this.child();
        return function () {
            const names = exp.params;
            for (let i = 0; i < names.length; i++) 
                scope.def(names[i], i < arguments.length ? arguments[i] : false);
            return scope.evaluate(exp.body);
        } 
    }

    private apply_op(op : any, a: any, b: any) {
        function num(x: any) {
            if (typeof x != "number")
                throw new Error("Runtime error: Expected number but got " + x + " " + typeof x);
            return x;
        }
        function div(x: any) {
            if (num(x) == 0)
                throw new Error("Runtime error: Divide by zero");
            return x;
        }
        switch (op) {
            case "+"  : return a + b;
            case "-"  : return num(a) - num(b);
            case "*"  : return num(a) * num(b);
            case "/"  : return num(a) / div(b);
            case "%"  : return num(a) % div(b);
            case "&&" : return a !== false && b;
            case "||" : return a !== false ? a : b;
            case "<"  : return num(a) < num(b);
            case ">"  : return num(a) > num(b);
            case "<=" : return num(a) <= num(b);
            case ">=" : return num(a) >= num(b);
            case "==" : return a === b;
            case "!=" : return a !== b;
            case "**" : return Math.pow(num(a), num(a));
            case "^"  : return num(a) ^ num(b);
        }
        throw new Error("Runtime error: Can't apply operator " + op);
    }

    public evaluate(exp: ASTNode) : any {
        switch (exp.type) {
            case "num":
            case "str":
            case "bool":
                return exp.value;
            case "var":
                return this.get(exp.value);
            case "assign":
                if (exp.left.type !== 'var') throw new Error(`Runtime error: Cannot assign value to ${JSON.stringify(exp.left)}`);
                return this.set(exp.left.value, this.evaluate(exp.right))
            case "binary":
                return this.apply_op(exp.operator,
                    this.evaluate(exp.left),
                    this.evaluate(exp.right));
            case "func":
                return this.make_func(exp);
            case "if":
                const cond = this.evaluate(exp.cond);
                if (cond) return this.evaluate(exp.then);
                return exp.else ? this.evaluate(exp.else) : false;
            case "call":
                const func : any = this.evaluate(exp.func);
                return func.apply(null, exp.args.map((arg : any) => this.evaluate(arg))) // remove this to keep function in scope
            case "sequence":
                {
                    let val = false;
                    exp.seq.forEach((e: any) => {
                        val = this.evaluate(e)
                    });
                    return val;
                }
            case "for":
                {
                    let val = false;
                    let counter = this.evaluate(exp.counter.right);

                    while (true) {
                        const scope = this.child();
                        scope.def(exp.counter.left.value, counter);
                        const continue_loop = scope.evaluate(exp.cond);
                        if (!continue_loop) break;
                        val = scope.evaluate(exp.loop);
                        counter = scope.evaluate(exp.inc);
                    }

                    return val;
                }
            case "while":
                {
                    let val = false;

                    while (true) {
                        const scope = this.child();
                        const continue_loop = scope.evaluate(exp.cond);
                        if (!continue_loop) break;
                        val = scope.evaluate(exp.loop);
                    }

                    return val;
                }
            default:
                throw new Error('Runtime error: Cannot handle expression of type ' + exp.type)
        }
    }
}

export async function StaticallyLink (ast: ASTNode[], loader: (name: string) => Promise<ASTNode[]>) {
    for (let i = 0; i < ast.length; i++) {
        const node = ast[i];
        if (node.type === 'include') {
            const lib = await loader(node.value);
            ast.splice(i, 1, ...lib);
        }
    }
    return ast;
}

export function PrettyInputError (input: string, error: InputError) {
    const pre_line = input.split('\n')[error.line - 2];
    const line = input.split('\n')[error.line - 1];
    let ptr = '';
    for (let i = 0; i < error.col - 1; i++) {
        ptr += ' ';
    }
    ptr += `^ ${error.message}`;
    return `${pre_line}\n${line}\n${ptr}`
}

export function DiscordPrettyError (input: string, error: InputError) {
    const lines = PrettyInputError(input, error).split('\n');
    return `+ ${lines[0]}\n+ ${lines[1]}\n- ${lines[2]}`;
}