import {test} from "node:test";
import assert from "node:assert/strict";
import {chatPositionPixels,chatPositionRelative} from "./chat-position.ts";
const screen={width:390,height:740,offsetLeft:0,offsetTop:0},button={width:58,height:54};
test("keeps the entire button inside the visible screen",()=>{
 for(const pos of [{x:-1,y:-1},{x:1,y:1},{x:10,y:10}]){const p=chatPositionPixels(pos,screen,button);assert.ok(p.left>=0&&p.top>=0&&p.left+button.width<=screen.width&&p.top+button.height<=screen.height)}
});
test("bounds dragged positions and respects a shifted visible viewport",()=>{
 const v={width:320,height:400,offsetLeft:5,offsetTop:100};
 assert.deepEqual(chatPositionRelative(-100,900,v,button),{x:0,y:1});
 const p=chatPositionPixels({x:1,y:1},v,button);assert.ok(p.left+button.width<=v.offsetLeft+v.width&&p.top+button.height<=v.offsetTop+v.height);
});
