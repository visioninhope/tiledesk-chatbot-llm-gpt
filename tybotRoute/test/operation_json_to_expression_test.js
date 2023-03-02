var assert = require('assert');
const exp = require('constants');
const { TiledeskExpression } = require('../TiledeskExpression');


//require TiledeskMath as TiledeskMathClass and alias it as TiledeskMathClass
const { TiledeskMath } = require('../TiledeskMath');


describe('JSON operation to expression without math function and without variables', function() {

    describe('JSON math operation to expression', function() {
        it('should be Number("2") - Number("1")', function() {
            const operators = ["subtractAsNumber"];
            const operands = [
                {
                    value: "2",
                    isVariable: false
                },
                {
                    value: "1",
                    isVariable: false
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);

            assert.equal(expression, 'Number("2") - Number("1")');
        });
        
        it('should be Number(Number("2") + Number("1")) - Number("5")', function() {
            const operators = ["addAsNumber", "subtractAsNumber"];
            const operands = [
                {
                    value: "2",
                    isVariable: false
                },
                {
                    value: "1",
                    isVariable: false
                },
                {
                    value: "5",
                    isVariable: false
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number(Number("2") + Number("1")) - Number("5")');
        });
    
        it('should be Number((Number("5") - Number("3"))) / Number("4")', function() {
            const operators = ["subtractAsNumber", "divideAsNumber"];
            const operands = [
                {
                    value: "5",
                    isVariable: false
                },
                {
                    value: "3",
                    isVariable: false
                },
                {
                    value: "4",
                    isVariable: false
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number(Number("5") - Number("3")) / Number("4")');
        });
    
        it('should be Number(Number(Number(Number("5") - Number("3")) / Number("4"))) * Number("7")) - Number("3")', function() {
            const operators = ["subtractAsNumber", "divideAsNumber", "multiplyAsNumber", "subtractAsNumber"];
            const operands = [
                {
                    value: "5",
                    isVariable: false
                },
                {
                    value: "3",
                    isVariable: false
                },
                {
                    value: "4",
                    isVariable: false
                },
                {
                    value: "7",
                    isVariable: false
                },
                {
                    value: "3",
                    isVariable: false
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number(Number(Number(Number("5") - Number("3")) / Number("4")) * Number("7")) - Number("3")');
        });
    })

    describe('JSON string operation to expression', function() {
        it('should be String("hello") + String("world")', function() {
            const operators = ["addAsString"];
            const operands = [
                {
                    value: "hello",
                    isVariable: false
                },
                {
                    value: "world",
                    isVariable: false
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'String("hello") + String("world")');
        });

        it('should be String(String("hello") + String("world")) + String("!!!")', function() {
            const operators = ["addAsString", "addAsString"];
            const operands = [
                {
                    value: "hello",
                    isVariable: false
                },
                {
                    value: "world",
                    isVariable: false
                },
                {
                    value: "!!!",
                    isVariable: false
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'String(String("hello") + String("world")) + String("!!!")');
        });
    });

    describe('JSON string operation to expression with variables', function() {
   
        it('should be String("hello") + String($data.name)', function() {
            const operators = ["addAsString"];
            const operands = [
                {
                    value: "hello",
                    isVariable: false
                },
                {
                    value: "name",
                    isVariable: true
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'String("hello") + String($data.name)');
        });


        it('should be String(String("hello") + String("world")) + String($data.special)', function() {
            const operators = ["addAsString", "addAsString"];
            const operands = [
                {
                    value: "hello",
                    isVariable: false
                },
                {
                    value: "world",
                    isVariable: false
                },
                {
                    value: "special",
                    isVariable: true
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'String(String("hello") + String("world")) + String($data.special)');
        });
    });

    describe('JSON string operation to expression with variables and function', function() {
        it('String(String(String("HELLO").toLowerCase()) + String(String($data.name).toUpperCase())) + String($data.special)', function() {
            const operators = ["addAsString", "addAsString"];
            const operands = [
                {
                    value: "HELLO",
                    isVariable: false,
                    function: "lowerCaseAsString"
                },
                {
                    value: "name",
                    isVariable: true,
                    function: "upperCaseAsString"
                },
                {
                    value: "special",
                    isVariable: true
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'String(String(String("HELLO").toLowerCase()) + String(String($data.name).toUpperCase())) + String($data.special)');
        });
    });

    describe('JSON string operation to result with variables and function', function() {
        it('should be String(String(String("HELLO").toLowerCase()) + String(String($data.name).toUpperCase())) + String($data.special)', function() {
            const operators = ["addAsString", "addAsString"];
            const operands = [
                {
                    value: "HELLO",
                    isVariable: false,
                    function: "lowerCaseAsString"
                },
                {
                    value: "name",
                    isVariable: true,
                    function: "upperCaseAsString"
                },
                {
                    value: "special",
                    isVariable: true
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            const result = new TiledeskExpression().evaluateJavascriptExpression(expression, {name: "Francesco", special: "!!!"});
            console.log("result:", result);
            assert.equal(result, 'helloFRANCESCO!!!');
        });
    });


    describe('JSON string operation to result with variables', function() {
        it('should be String("hello") + String($data.name)', function() {
            const operators = ["addAsString"];
            const operands = [
                {
                    value: "hello",
                    isVariable: false
                },
                {
                    value: "name",
                    isVariable: true
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            const result = new TiledeskExpression().evaluateJavascriptExpression(expression, {name: "world"});
            console.log("result:", result);
            assert.equal(result, 'helloworld');
        });

        it('should be String(String("hello") + String("world")) + String($data.special)', function() {
            const operators = ["addAsString", "addAsString"];
            const operands = [
                {
                    value: "hello",
                    isVariable: false
                },
                {
                    value: "world",
                    isVariable: false
                },
                {
                    value: "special",
                    isVariable: true
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            const result = new TiledeskExpression().evaluateJavascriptExpression(expression, {special: "!!!"});
            console.log("result:", result);
            assert.equal(result, 'helloworld!!!');
        });
    });

    describe('JSON math operation to expression with math function and without variables', function() {
        it('should be Number(Number(Number(Number(TiledeskMath.round(Number("5.5"))) - Number("3")) / Number(TiledeskMath.abs(Number("-4"))))) * Number("7")) - Number("3")', function() {
            const operators = ["subtractAsNumber", "divideAsNumber", "multiplyAsNumber", "subtractAsNumber"];
            const operands = [
                {
                    value: "5.5",
                    isVariable: false,
                    function: "roundAsNumber"
                },
                {
                    value: "3",
                    isVariable: false
                },
                {
                    value: "-4",
                    isVariable: false,
                    function: "absAsNumber"
                },
                {
                    value: "7",
                    isVariable: false
                },
                {
                    value: "3",
                    isVariable: false
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number(Number(Number(Number(TiledeskMath.round(Number("5.5"))) - Number("3")) / Number(TiledeskMath.abs(Number("-4")))) * Number("7")) - Number("3")');
        });

        it('should be Number(Number(TiledeskMath.floor(Number("1.123")) + Number("2")) / Number(TiledeskMath.round("2.1"))', function() {
            const operators = ["addAsNumber", "divideAsNumber"];
            const operands = [
                {
                    value: "1.123",
                    isVariable: false,
                    function: "floorAsNumber"
                },
                {
                    value: "2",
                    isVariable: false
                },
                {
                    value: "2.1",
                    isVariable: false,
                    function: "roundAsNumber"
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number(Number(TiledeskMath.floor(Number("1.123"))) + Number("2")) / Number(TiledeskMath.round(Number("2.1")))');
        });
    });

    describe('JSON math operation to expression with math function and variables', function() {
        it('should be Number($data.score) + Number("12")', function() {
            const operators = ["addAsNumber"];
            const operands = [
                {
                    value: "score",
                    isVariable: true
                },
                {
                    value: "12",
                    isVariable: false
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number($data.score) + Number("12")');
        });
    
        it('should be Number(Number($data.score) + Number("12")) - Number("5")', function() {
            const operators = ["addAsNumber", "subtractAsNumber"];
            const operands = [
                {
                    value: "score",
                    isVariable: true
                },
                {
                    value: "12",
                    isVariable: false
                },
                {
                    value: "5",
                    isVariable: false
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number(Number($data.score) + Number("12")) - Number("5")');
        });

        it('should be Number(Number(Number(Number(TiledeskMath.round(Number($data.score))) - Number("3")) / Number(TiledeskMath.abs(Number("-4"))))) * Number("7")) - Number($data.tot)', function() {
            const operators = ["subtractAsNumber", "divideAsNumber", "multiplyAsNumber", "subtractAsNumber"];
            const operands = [
                {
                    value: "score",
                    isVariable: true,
                    function: "roundAsNumber"
                },
                {
                    value: "3",
                    isVariable: false
                },
                {
                    value: "-4",
                    isVariable: false,
                    function: "absAsNumber"
                },
                {
                    value: "7",
                    isVariable: false
                },
                {
                    value: "tot",
                    isVariable: true
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number(Number(Number(Number(TiledeskMath.round(Number($data.score))) - Number("3")) / Number(TiledeskMath.abs(Number("-4")))) * Number("7")) - Number($data.tot)');
        });
    });

    describe('JSON math operation to result without variables', function() {
        it('should be 8', function() {
            const operators = ["addAsNumber"];
            const operands = [
                {
                    value: "5",
                    isVariable: false
                },
                {
                    value: "3",
                    isVariable: false
                }
            ];
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number("5") + Number("3")');
            const result = new TiledeskExpression().evaluateJavascriptExpression(expression, {});
            console.log("result:", result);
            assert.equal(result, 8);
        });
        
        it('should be 0.5', function() {
            const operators = ["subtractAsNumber", "divideAsNumber", "multiplyAsNumber", "subtractAsNumber"];
            const operands = [
                {
                    value: "5",
                    isVariable: false
                },
                {
                    value: "3",
                    isVariable: false
                },
                {
                    value: "4",
                    isVariable: false
                },
                {
                    value: "7",
                    isVariable: false
                },
                {
                    value: "3",
                    isVariable: false
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number(Number(Number(Number("5") - Number("3")) / Number("4")) * Number("7")) - Number("3")');
            const result = new TiledeskExpression().evaluateJavascriptExpression(expression, {});
            console.log("result:", result);
            assert.equal(result, 0.5);
        });
    });

    describe('JSON math operation to result with variables', function() {
        it('should be 8', function() {
            const operators = ["addAsNumber"];
            const operands = [
                {
                    value: "score",
                    isVariable: true
                },
                {
                    value: "3",
                    isVariable: false
                }
            ];
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number($data.score) + Number("3")');
            const result = new TiledeskExpression().evaluateJavascriptExpression(expression, {score: 5});
            console.log("result:", result);
            assert.equal(result, 8);
        });
        
        it('should be 0.5', function() {
            const operators = ["subtractAsNumber", "divideAsNumber", "multiplyAsNumber", "subtractAsNumber"];
            const operands = [
                {
                    value: "score",
                    isVariable: true
                },
                {
                    value: "3",
                    isVariable: false
                },
                {
                    value: "4",
                    isVariable: false
                },
                {
                    value: "7",
                    isVariable: false
                },
                {
                    value: "tot",
                    isVariable: true
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number(Number(Number(Number($data.score) - Number("3")) / Number("4")) * Number("7")) - Number($data.tot)');
            const result = new TiledeskExpression().evaluateJavascriptExpression(expression, {score: 5, tot: 3});
            console.log("result:", result);
            assert.equal(result, 0.5);
        });
        it('should be -11.34', function() {
            const operators = ["subtractAsNumber"];
            const operands = [
                {
                    value: "score",
                    isVariable: true
                },
                {
                    value: "tot",
                    isVariable: true
                }
            ];
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number($data.score) - Number($data.tot)');
            const result = new TiledeskExpression().evaluateJavascriptExpression(expression, {score: 5, tot: 16.34});
            console.log("result:", result);
            assert.equal(result, -11.34);
        });
    });

    describe('JSON math operation to result with variables and math functions', function() {
        it('should be 8', function() {
            const operators = ["addAsNumber"];
            const operands = [
                {
                    value: "score",
                    isVariable: true,
                    function: "roundAsNumber"
                },
                {
                    value: "3",
                    isVariable: false
                }
            ];
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number(TiledeskMath.round(Number($data.score))) + Number("3")');
            const result = new TiledeskExpression().evaluateJavascriptExpression(expression, {score: 5.2, 'TiledeskMath': TiledeskMath});
            console.log("result:", result);
            assert.equal(result, 8);
        });
        it('should be 0.5', function() {
            const operators = ["subtractAsNumber", "divideAsNumber", "multiplyAsNumber", "subtractAsNumber"];
            const operands = [
                {
                    value: "score",
                    isVariable: true,
                    function: "roundAsNumber"
                },
                {
                    value: "3",
                    isVariable: false
                },
                {
                    value: "4",
                    isVariable: false
                },
                {
                    value: "7",
                    isVariable: false
                },
                {
                    value: "tot",
                    isVariable: true
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number(Number(Number(Number(TiledeskMath.round(Number($data.score))) - Number("3")) / Number("4")) * Number("7")) - Number($data.tot)');
            const result = new TiledeskExpression().evaluateJavascriptExpression(expression, {score: 5.2, tot: 3, 'TiledeskMath': TiledeskMath});
            console.log("result:", result);
            assert.equal(result, 0.5);
        });
        it('should be 0.5', function() {
            const operators = ["subtractAsNumber", "divideAsNumber", "multiplyAsNumber", "subtractAsNumber"];
            const operands = [
                {
                    value: "score",
                    isVariable: true,
                    function: "roundAsNumber"
                },
                {
                    value: "3",
                    isVariable: false
                },
                {
                    value: "-4",
                    isVariable: false,
                    function: "absAsNumber"
                },
                {
                    value: "7",
                    isVariable: false
                },
                {
                    value: "tot",
                    isVariable: true
                }
            ];
    
            const expression = TiledeskExpression.JSONOperationToExpression(operators, operands);
            console.log("expression:", expression);
            assert.equal(expression, 'Number(Number(Number(Number(TiledeskMath.round(Number($data.score))) - Number("3")) / Number(TiledeskMath.abs(Number("-4")))) * Number("7")) - Number($data.tot)');
            const result = new TiledeskExpression().evaluateJavascriptExpression(expression, {score: 5.2, tot: 3, 'TiledeskMath': TiledeskMath});
            console.log("result:", result);
            assert.equal(result, 0.5);
        });
    });        
});