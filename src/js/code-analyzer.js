import * as esprima from 'esprima';
let dataForTable=[];
let line;
let parse;

const parseCode = (codeToParse) => {
    parse =  esprima.parseScript(codeToParse);
    dataForTable=[];
    line=1;

    return parse;
};

export {parseCode};
export {getParseData};
export {dataForTable};
export {bodyParse};



function getParseData(parse) {
    try {
        FunctionDeclaration(parse);
        findBodyType((parse.body)[0].body);
    }
    catch (e) {
        return 'wrong input!';
    }
}
function findBodyType(parsedObj) {
    if (parsedObj.body) {
        for (let i = 0; i < parsedObj.body.length; i++) {
            findType(parsedObj.body[i]);
        }

    } else
        findType(parsedObj);
}


function bodyParse(parse) {
    try {
        for (let i = 0; i < (parse.body).length; i++) {
            findType((parse.body)[i]);
        }
    }  catch (e) {
        return 'wrong input!';
    }
}



function pushLineToQ (line,type,name,condition,value){
    dataForTable.push({ 'line': line, 'type': type, 'name': name, 'condition' : condition, 'value': value} )  ;
}

function findType(parsedObj) {
    let type = parsedObj.type;
    if (type == ('VariableDeclaration'))
        VariableDeclaration(parsedObj);
    else if (type == ('ExpressionStatement'))
        ExpressionStatement(parsedObj);
    else findComplexType(parsedObj);
}

function findComplexType(parsedObj) {
    let type = parsedObj.type;
    if(type==('WhileStatement'))
        WhileStatement(parsedObj);
    else if(type==('ForStatement'))
        forStatement(parsedObj);
    else if(type==('IfStatement'))
        IfStatement(parsedObj);
    else/* if(type==('ReturnStatement'))*/
        ReturnStatement(parsedObj);
    /*  else return 0;*/
}
function FunctionDeclaration (parsedCode){
    // if(parsedCode.body.length==0) return '';
    let funName = (parsedCode.body)[0].id.name;
    pushLineToQ(line,'function declaration',funName,'','');
    for(let i=0;i<(parsedCode.body)[0].params.length; i++)
    { //if there are params
        let param=(parsedCode.body)[0].params[i];
        pushLineToQ(line,'variable declaration' , param.name, '','');
    }
    line++;
}

function ReturnStatement(parsedObj){
    let val =  parseExpression(parsedObj.argument);
    pushLineToQ(line,'return statement' , '', '',val);
    line++;
}

function IfStatement(parsedObj){
    let condition=  parseExpression(parsedObj.test);
    pushLineToQ(line,'if statement','',condition,'');
    line++;
    let body =parsedObj.consequent;
    // findType((body));
    findBodyType(body);
    if(parsedObj.alternate){
        if(parsedObj.alternate.type=='IfStatement') {
            elseIfStatement(parsedObj.alternate);
        }
        else{elseStatement(parsedObj.alternate);}
    }
    else return;

}
function elseIfStatement(parsedObj) {
    let condition=  parseExpression(parsedObj.test);
    pushLineToQ(line,'else if statement','',condition,'');
    line++;
    let body =parsedObj.consequent;
    // findType((body));
    findBodyType(body);
    if(parsedObj.alternate) {
        if (parsedObj.alternate.type == 'IfStatement')
            elseIfStatement(parsedObj.alternate);
        else/* if (parsedObj.alternate.type != 'IfStatement')*/ elseStatement(parsedObj.alternate);
    }
}

function elseStatement(parsedObj) {
    pushLineToQ(line,'else statement','','','');
    line++;
    //findType((parsedObj));
    //findType((parsedObj));
    findBodyType(parsedObj);
}

function forStatement(parsedObj) {
    let part1,part2,part3;
    if (parsedObj.init.type == 'AssignmentExpression') {
        let name = parsedObj.init.left.name; let right = parsedObj.init.right;
        right = parseExpression(right); part1 = name+''+parsedObj.init.operator+''+right; }
    else /*if (parsedObj.init.type == 'VariableDeclaration')*/{
        let name = parsedObj.init.declarations[0].id.name; let right = parsedObj.init.declarations[0].init;
        right = parseExpression(right); part1 = name + '=' + right; }
    part2= parseExpression(parsedObj.test);
    if(parsedObj.update.type=='UpdateExpression'){
        let name = parsedObj.update.argument.name; let op = parsedObj.update.operator; part3=name+''+op; }
    else/*if(parsedObj.update.type=='AssignmentExpression')*/{
        let name = parsedObj.update.left.name; let right = parsedObj.update.right;
        right = parseExpression(right); part3=name+''+parsedObj.update.operator+''+right; }
    let condition=part1+';'+part2+';'+part3; pushLineToQ(line,'for statement','',condition,'');
    line++;
    findBodyType(parsedObj.body);
}


function WhileStatement(parsedObj) {
    let condition = parseExpression(parsedObj.test);
    pushLineToQ(line, 'while statement', '', condition, '');
    line++;
    findBodyType(parsedObj.body);
}
function VariableDeclaration (parsedObj){
    let val;
    for(let i=0;i<parsedObj.declarations.length; i++) {
        let VC = parsedObj.declarations[i];
        if(VC.init) {
            val = parseExpression(VC.init);
        }
        else {
            val='';
        }
        pushLineToQ(line, 'variable declaration', VC.id.name,'',val);
    }
    line++;
}

function ExpressionStatement (parsedObj){
    if(parsedObj.expression.type=='AssignmentExpression') {
        let name = parsedObj.expression.left.name;
        let right = parsedObj.expression.right;
        right = parseExpression(right);
        pushLineToQ(line,'assignment expression',name,'',right);
    }
    else/* if(parsedObj.expression.type=='UpdateExpression') */{
        let name = parsedObj.expression.argument.name;
        let op = parsedObj.expression.operator;
        pushLineToQ(line,'update expression',name,'',name+''+op);
    }
    line++;
}

function parseExpression(exp) {
    if (exp.type == ('BinaryExpression'))
        return parseBinary(exp);
    else {
        return simpleExpression(exp);
    }
}
function simpleExpression(exp){
    if(exp.type=='Identifier') {
        return exp.name;
    }
    else if(exp.type=='Literal') {
        return exp.value;
    }
    else if(exp.type=='UnaryExpression')
        return exp.operator+''+exp.argument.value;

    else/*if(exp.type=='MemberExpression')*/ {
        return exp.object.name + '[' + parseExpression(exp.property) + ']';
    }
    /* else return;*/
}

function parseBinary(binary) {
    let leftExp = binary.left;
    if (leftExp.type == ('BinaryExpression'))
        leftExp = '(' + parseBinary(leftExp)+')';
    else {
        leftExp = simpleExpression(leftExp);
    }
    let rigthExp = binary.right;
    if (rigthExp.type == ('BinaryExpression'))
        rigthExp = '(' + parseBinary(rigthExp)+')';
    else {
        rigthExp = simpleExpression(rigthExp);
    }
    return leftExp + '' + binary.operator + '' + rigthExp;
}



