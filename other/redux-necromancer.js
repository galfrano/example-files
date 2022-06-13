const fs = require("fs");

const readLines = (text, ns) => {
  const lines = text.split('\n');
  const imports = lines.filter((line) => line.indexOf('import') === 0).join('\n')+'\n';
  const dataTypes = lines
      .filter((line) => line.indexOf(':') !== -1)
      .map((line) =>  line.replaceAll(/[\s;,]/g, '').split(':'));
  const actions = dataTypes.reduce((acc, curr) => acc+createAction(curr[0], curr[1], ns), '\n\n//ACTIONS');
  console.log(imports+actions+createMapState(dataTypes, ns)+createMapDispatch(dataTypes)+createReducer(dataTypes, ns));
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const createAction = (name, type, ns) => {
  const pascal = capitalize(name)
  return `
const set${pascal}Action = (value: ${type}) => ({
  type: '${ns}/set${pascal}',
  value,
});`
}

const createMapState = (types, ns) => {
  const interfaceTpl = (name, type) => (`  ${name}: ${type};\n`);
  const mapTpl = (name, type, ns) => (`  ${name}: state.${ns}.${name};\n`);
  return '\n\n//STATE'+types.reduce((acc, curr) => {
    return [acc[0]+interfaceTpl(curr[0], curr[1]), acc[1]+mapTpl(curr[0], curr[1], ns)];
  },
  ['\nexport interface MapState {\n',
  `\nexport const mapState = (state: ${capitalize(ns)}): MapState => ({\n`]
  ).join('}')+'})\n';
}
const createMapDispatch = (types) => {
  const interfaceTpl = (name, type) => (`  set${capitalize(name)}: (${name}: ${type}) => void;\n`);
  const mapTpl = (name, type) => (`  set${capitalize(name)}: (${name}: ${type}) => dispatch(set${capitalize(name)}Action(${name})) \n`);
  return '\n\n//DISPATCH'+types.reduce((acc, curr) => {
    return [acc[0]+interfaceTpl(curr[0], curr[1]), acc[1]+mapTpl(curr[0], curr[1])];
  },
  ['\nexport interface MapDispatch {\n',
  `\nexport const mapDispatch = (dispatch: any): MapDispatch => ({\n`]
  ).join('}')+'})\n';
}

const createReducer = (types, ns) => {
  const caseTpl = (name, type, ns) => (`    case '${ns}/set${capitalize(name)}':\n      return {\n        ...state,\n        ${name}: action.value,\n      };\n`);
  return types.reduce((acc, curr)=> {
    return acc+caseTpl(curr[0], curr[1], ns)
  }, `\nexport const ${ns}Reducer = (state = initialState, action: any) => {\n`+
      `  switch (action.type) {\n`)+`    default:\n      return state;\n  }\n};`;
}

readLines(fs.readFileSync('../rdxn-example/src/rdxn/Mixed.ts').toString(), 'mixed');
/*
//input file
import { User } from '../User/types';
export interface Mixed {
  a: number;
  b: number;
  user: User;
}
//output
import { User } from '../User/types';


//ACTIONS
const setAAction = (value: number) => ({
  type: 'mixed/setA',
  value,
});
const setBAction = (value: number) => ({
  type: 'mixed/setB',
  value,
});
const setUserAction = (value: User) => ({
  type: 'mixed/setUser',
  value,
});

//STATE
export interface MapState {
  a: number;
  b: number;
  user: User;
}
export const mapState = (state: Mixed): MapState => ({
  a: state.mixed.a;
  b: state.mixed.b;
  user: state.mixed.user;
})


//DISPATCH
export interface MapDispatch {
  setA: (a: number) => void;
  setB: (b: number) => void;
  setUser: (user: User) => void;
}
export const mapDispatch = (dispatch: any): MapDispatch => ({
  setA: (a: number) => dispatch(setAAction(a)) 
  setB: (b: number) => dispatch(setBAction(b)) 
  setUser: (user: User) => dispatch(setUserAction(user)) 
})

export const mixedReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case 'mixed/setA':
      return {
        ...state,
        a: action.value,
      };
    case 'mixed/setB':
      return {
        ...state,
        b: action.value,
      };
    case 'mixed/setUser':
      return {
        ...state,
        user: action.value,
      };
    default:
      return state;
  }
};

*/

