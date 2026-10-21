import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,foods} from '../nutrition.mjs';
test('whole meal, serving and cooked density account for added oil',()=>{const r=calculate([{grams:200,low:105,high:135},{grams:10,low:880,high:900,isOil:true}],2,250);assert.equal(r.min,298);assert.equal(r.max,360);assert.deepEqual(r.perServing,[149,180]);assert.ok(Math.abs(r.per100[0]-119.2)<1e-9);assert.equal(r.per100[1],144);});
test('oil retention only affects added oil',()=>{const r=calculate([{grams:100,low:100,high:100},{grams:10,low:900,high:900,isOil:true}],1,0,.5);assert.equal(r.min,145);assert.equal(r.per100,null);});
test('invalid numbers and reversed calorie ranges are rejected',()=>{assert.throws(()=>calculate([{grams:NaN,low:1,high:2}]));assert.throws(()=>calculate([{grams:1,low:2,high:1}]));assert.throws(()=>calculate([],0));});
test('all requested foods present and salt has zero calories',()=>{assert.equal(foods.length,28);const salt=foods.find(f=>f.name==='盐');assert.equal(salt.min,0);assert.equal(salt.max,0);});
