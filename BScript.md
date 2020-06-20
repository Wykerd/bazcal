# BScript

The scripting language used in Bazcal.

BScript is a purely functional programing language at the moment. See below for usage reference.

See section **Builtins** for list of built in functions available in bazcal inplimentation of bscript

# Reference

## Variables

BScript uses dynamically typed variables just like javascript or python.

Variable names must start with a character matching the regex `/[a-z_]/i` and subequent characters must follow the regex `/[a-z_0-9]/i`

Variables can be assigned a value with an `=` operator, other operator support may come at a later date.

## Expressions

Everything in BScript is expressions.

## Sequences

Sequences are also seen as expressions, the last value returned by a sequence of expressions is the return value of the sequence. For example:

```
a = {
    1;
    2 + 3;
    4 > 2;
};

# a will be equal to true
```

## If expressions

If statements are simple and follow the format `if <expression> then <expression> else <expression>` or in the case of a sequence of expressions the then can be omitted `if <expression> { <expressions> } else <expression>`

The expression evaluted is the returned value of the if expression. This means you can use if expressions simularly to ternary operators

```
a = if 1 > 2 then "cool" else "uncool";
# a has a value of "uncool"
```

## Functions

### Defining functions

Functions are defined by using the keyword `func`, like in other intepreted languages there are two types of functions, anonymous and named functions. 

Anonymous functions are defined by the keyword `func` followed by a parameter list starting with `(` seperated by `,` and ending with `)` then follows an expression to evaluate. For example:

```
func (a, b) if a > b then a else b; # Single expression
```

```
# Sequence of expressions
func (a, b) {
    a_bigger = a > b;
    if a_bigger then "a is bigger" else "b is bigger";
}; 
```

Named functions are defined by the keyword `func` followed by the name and parameter list starting with `(` seperated by `,` and ending with `)` then follows an expression to evaluate. For example:
```
func add (a, b) a + b;
```

You can also define named variables by assigning them to a variable:
```
add = func (a, b) a + b;
```

The last expression evaluated by the function is the return value

### Calling functions

Functions are called using the format `<function_name>()` you can also create self calling functions by encapsulating the function in brackets like so `(func (a) a * a)(2)`

## Strings 

Strings are introduced via the double qoutes.

Escape characters available:
- "\"" for "
- "\n" for new line

## Numbers

**Note** The current interpreter doen't suport defining negative numbers so to do this you must use this hack for now `0-2` to get negative number, in this case `-2`

# Builtins

## Global variables

`arguments`

Array of string of all the arguments passed after name.

## Javascript Object Helpers

`func get_property(obj, key)`

Returns the value of a property of a object use it to access array indexes or object properties

`func typeof(obj, key)`

Returns the type of a varable

## Array Helpers

`func len (array)`

Returns array.length, can be used on strings aswell.

`func map (array, map_func)`

Wrapper around javascript array.map, go look it up. Calls `array.map(map_func)` internally.

`func join (array, join)`

Create string from array. Joins the values of a array of strings with the value of join. Calls `array.join(join)` internally.

`func sort (array, sort_func)`

Wrapper around javascript array.sort, go look it up. Calls `array.sort(sort_func)` internally.

`func filter (array, filter_func)`

Wrapper around javascript array.filter, go look it up. Calls `array.filter(filter_func)` internally.

`func slice (array, start, end)`

Wrapper around javascript array.slice, go look it up. Calls `array.slice(start, end)` internally.

## Number Helpers

`func parse_num(str)`

Parses number from string. Can also parse strings like "1m", "1mil", "1k".

## Bazcal API

`func advise (balance, count, time, include_stability)`

Function used internally by builtin bazcal functions to get best flips

count, time and include_stability variables have default values 6, 5 and true

Returns array of javascript objects. You must use the array builtin functions to manipulate and use arrays.

Items have properties

- name: item id (string)
- evolume: volume to buy (number)
- invested: total coins to invest (number)
- pinvested: percentage of balance invested (string)
- eprofit: evolume * profit, total predicted profit (number)
- pprofit: percentage of profit (string)
- gradient: product.sell - product.sell_ema [if value > 0 then price trending upward] (number)

`func default_advise_formatter (array)`

Formats array items using the default formatter used by bazcal. See example below:

```
1: Enchanted Eye of Ender
Quantity: 481
Invested: 1.99M (46.4%)
Estimated Profit: 962.66K (48.3%)
Sell price trend: Product sell value increasing

...
```

`func raw_advise (balance, time, include_stability)`

Has same defaults as `advise`

Returns unsorted and unfiltered array of items.

See advice for properties avaiable on item objects.

