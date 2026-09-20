const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101/api";

export async function request<T>(path:string, token?:string, init?:RequestInit):Promise<T>{
  let branchId="";
  if(typeof window!=="undefined")try{branchId=JSON.parse(localStorage.getItem("varejo-session")??"{}").tenant?.branch?.id??"";}catch{}
  const response=await fetch(`${API}${path}`,{...init,headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`} : {}),...(branchId?{"X-Branch-Id":branchId}:{}),...init?.headers}});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(Array.isArray(body.message)?body.message.join(", "):(body.message??"Operação não concluída"));
  return body;
}
