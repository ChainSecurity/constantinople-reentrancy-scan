/* Based on https://github.com/kolinko/asterix/blob/master/asterix.py */

/*

This code tries to find contracts *potentially* vulnerable from the Constantinople Reentrancy Attack published here:
https://medium.com/chainsecurity/constantinople-enables-new-reentrancy-attack-ace4088297d9

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

/*
We try to find a CALL operation with 2300 gas (a transfer), which is then followed by a
STORE.

The variable ID being changed is returned, as we need to check if any STORE
operation needing potentially little GAS is dependent on this variable.

Return type: [bool, Set], if transfer happened & set of changed variables
*/
function find_store_after_transfer(command_or_trace, transfer_happened = false, var_changed = null) {
    var_changed = var_changed?var_changed:new Set()

    //console.log(command_or_trace)

    if (command_or_trace == null) {
        return [transfer_happened, var_changed]
    }

    // Are we iterating over multiple commands or analyzing one?
    if (opcode(command_or_trace) == null && Array.isArray(command_or_trace)) {
        trace = command_or_trace
        // assuming we have to iterate here
        for (command of trace) {
            transfer_happened = find_store_after_transfer(command, transfer_happened, var_changed)
        }
    } else {
        command = command_or_trace
        // Find transfers
        if (!transfer_happened && opcode(command) == "CALL" && (command[1][1] == 2300 || command[1] == 2300) ) { // From binance example, gas stipend is stored here, might depend on contract though
            transfer_happened = true
        // Find Store after transfer
        } else if (transfer_happened && opcode(command) == "STORE") {
            var_changed.add(command[3])
        // Find CALL after transfer - this might also change state in another contract, e.g. interaction between exchanges and tokens
        } else if (transfer_happened && opcode(command) == "CALL") {
            // track dummy variable -1 to show that external contract has been called
            var_changed.add(-1)
        } else if (transfer_happened && opcode(command) == "LOG") {
            // track dummy variable -1 to show that external contract has been called
            var_changed.add(-2)
        } else if (opcode(command) == "IF") {
            // Check conditional first
            if (Array.isArray(command[1])) {
                transfer_happened = find_store_after_transfer(command[1], transfer_happened, var_changed)[0]
            } else {
                // Do nothing, no chance of transfer inside
            }
            // Check pathes individually to make sure that a transfer in one doesn't count as one in the other
            if (Array.isArray(command[2])) {
                true_transfer_happened = find_store_after_transfer(command[2], transfer_happened, var_changed)[0]
            } else {
                true_transfer_happened = transfer_happened
            }
            if (Array.isArray(command[3])) {
                false_transfer_happened = find_store_after_transfer(command[3], transfer_happened, var_changed)[0]
            } else {
                false_transfer_happened = transfer_happened
            }
            transfer_happened = true_transfer_happened || false_transfer_happened
        } else {
            // Keep searching if we can iterate down
            //console.log("Going down")
            for (argument of command) {
                if (Array.isArray(argument)) {
                    transfer_happened = find_store_after_transfer(argument, transfer_happened, var_changed)[0]  // var_changed is mutated in-place, no need to reassign
                } else {
                    // Do nothing, the argument is a literal or something else which doesn't conform ot our expectation
                }
            }
        }
    }
    return [transfer_happened, var_changed];
}

function parse_contract(contract) {
    //console.log(JSON.stringify(contract))

    var output = Array()
    for (func of contract.functions) {
        trace = func.trace
        res = find_store_after_transfer(trace)
        if (res[1].size > 0) {
            data = JSON.stringify({
                'addr': contract.addr,
                'store_after_transfer': Array.from(res[1])
            })
            console.log(data)
            output.push(data)
        }
    }
    if (output.size > 0) {
        console.log(output)
    }
    return output
}

// ---------- LOCAL TESTING ---------------
// alternatively, uncomment below, and run the script directly
// from terminal, by calling `node showme.js`

// var fs = require("fs");
// var ndjson = require('ndjson')

// output = Array()

// stream = fs.createReadStream('eveem-data/eveem.json')
//   .pipe(ndjson.parse())
//   .on('data', function(obj) {
//     output.extend(parse_contract(JSON.parse(obj.contract)))  // Somehow the data is unneccsary nested
//   })
//   .on('end', function() {
//     console.log(output.length)
//   })


// ---------- BIGQUERY ---------------

contract = JSON.parse(contract)
return parse_contract(contract)
