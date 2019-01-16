/*

    Script for finding self-destructs in a contract.

*/
/*

    Helper functions for the management of Eveem traces.

    This is a partial port of trace.py and helpers.py from 

        https://github.com/kolinko/showmewhatyougot

    Many edge cases were not ported here. If you wish to do serious
    work with it, please refer to the original files, and improve here :)

*/


Array.prototype.extend = function (other_array) {
    /* You should include a test to check whether other_array really is an array */
    other_array.forEach(function(v) {this.push(v)}, this);
}

function opcode(exp) {
    if (typeof exp == "object") {
        return exp[0]
    } else {
        return null
    }
}

function is_zero(exp) {
    return ['ISZERO', exp]
}

function simplify(exp) {
    if ((opcode(exp) == 'ISZERO') && (opcode(exp[1]) == 'ISZERO')) {
        return simplify(exp[1][1])
    } else {

        if ((typeof x == 'object') || (typeof x == 'array')) {
            res = []
            for (x of exp) {
                res.push(simplify(x))
            }
            return res
        
        } else {
            return exp
        
        }
    }
}

function walk_trace(trace, f, knows_true=null) {
    res = [];
    knows_true = knows_true?knows_true:[];

    line_number = 0;

    for (line of trace) {
        line_number += 1;

        res.extend(f(line, knows_true, trace.slice(line_number)))
        
        if (opcode(line) == 'IF') {

            condition = line[1]
            if_true = line[2]
            if_false = line[3]

            res = res.concat(walk_trace(if_true, f, knows_true.concat([condition])))
            res = res.concat(walk_trace(if_false, f, knows_true.concat([is_zero(condition)])))

            break
        }
    }
    return res
}

functions = JSON.parse(contract).functions;

// alternatively, uncomment below, and run the script directly
// from terminal, by calling `node showme.js`

//var fs = require("fs");
//functions = JSON.parse(fs.readFileSync("test.json")).functions

/*

    For more information about the Eveem.org API, and the trace format,
    check out showme example here:
    https://github.com/kolinko/showmewhatyougot

    The stuff below is a port of fragments of the `showme` demo.

*/

function find_stores(line, knows_true, remainder) {



}

function flatten(exp) {

    if ((typeof exp == 'object') || (typeof exp == 'array')) {
        try {
            var res = []

            for (x of exp) {
                var flattened_x = flatten(x); //JSON.parse(JSON.stringify(flatten(x)));
                for (f of flattened_x) {
                    res.push(f)
                }

            }

            return res
        } catch(err) {
            return [exp]

        }
    
    } else {

        return [ exp ]
    
    }

}

//console.log(flatten([['a','b'],'c']))

//return

function find_calls(line, knows_true, remainder) {
    /*
        For every line, check if it's a SELFDESTRUCT line.

        If it is, check which conditions (in knows_true) have had to
        be met. If neither one of those conditions checks for caller,
        return empty array.
    */

    if (opcode(line) != 'CALL') {
        return Array()
    }

    if ((line[1] == 2300) || (line[1][1] == 2300)) {
        if (flatten(remainder).includes('STORE')) {
            return [ 'yes' ]
        } else {
            return Array()
        }
    } else {
        return Array()
    }

}

/*
    
    Main.

    For every function in the contract, check the trace for destructs.
    If it has any matching the criteria, add it to the output.

*/

output = Array()

for (func of functions) {
	trace = func.trace
	res = walk_trace(trace, find_calls)
	if (res.length > 0) {
		console.log(func.color_name)
		console.log(res)
		output.push(JSON.stringify({
			'func_name': func.name,
			'print': func.print,
			'res': res
		}))
	}
}

return output

/*

    The returned output is used in the resulting SELECT in asterix.py

*/