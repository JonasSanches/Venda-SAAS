import { test } from "node:test";
import assert from "node:assert/strict";
import { whatsappPhone, orderMessage } from "./order-message.ts";
test("normalizes Brazilian phone numbers without guessing incomplete numbers",()=>{
 assert.equal(whatsappPhone("(11) 98765-4321"),"5511987654321");
 assert.equal(whatsappPhone("+55 11 98765-4321"),"5511987654321");
 assert.equal(whatsappPhone("(11) 2345-6789"),"551123456789");
 assert.equal(whatsappPhone("1234"),null);
});
test("includes customer, destination, quantities and both prices",()=>{
 const text=orderMessage({company:"BR Color",customer:"Ana",address:"Rua A",unit:"Ozanan",seller:"Natiel",items:[{name:"Pedrafix",price:20,quantity:3}]});
 for(const part of ["Ozanan","Natiel","Ana","Rua A","Pedrafix","3 un.","20,00","60,00"]) assert.ok(text.includes(part));
});
