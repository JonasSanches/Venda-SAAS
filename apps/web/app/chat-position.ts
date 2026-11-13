export type ChatViewport = {width:number;height:number;offsetLeft:number;offsetTop:number};
export type ChatPosition = {x:number;y:number};
const inset=12;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function chatPositionPixels(position:ChatPosition,viewport:ChatViewport,button:{width:number;height:number}) {
  const availableX=Math.max(0,viewport.width-button.width-inset*2),availableY=Math.max(0,viewport.height-button.height-inset*2);
  let left=viewport.offsetLeft+inset+clamp(position.x)*availableX;
  const top=viewport.offsetTop+inset+clamp(position.y)*availableY;
  // Keep the chat clear of the persistent mobile menu in the lower-left corner.
  if(top+button.height>viewport.offsetTop+viewport.height-80 && left<viewport.offsetLeft+78 && availableX>=66) left=viewport.offsetLeft+78;
  return {left,top};
}
export function chatPositionRelative(left:number,top:number,viewport:ChatViewport,button:{width:number;height:number}):ChatPosition {
  const availableX=Math.max(0,viewport.width-button.width-inset*2),availableY=Math.max(0,viewport.height-button.height-inset*2);
  return {x:availableX?clamp((left-viewport.offsetLeft-inset)/availableX):0,y:availableY?clamp((top-viewport.offsetTop-inset)/availableY):0};
}
