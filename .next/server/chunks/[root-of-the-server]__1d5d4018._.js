module.exports=[70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},24361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},76223,e=>{"use strict";var t=e.i(47909),r=e.i(74017),n=e.i(96250),a=e.i(59756),i=e.i(61916),s=e.i(14444),o=e.i(37092),l=e.i(69741),u=e.i(16795),d=e.i(87718),c=e.i(95169),p=e.i(47587),m=e.i(66012),f=e.i(70101),h=e.i(26937),g=e.i(10372),x=e.i(93695);e.i(52474);var w=e.i(220),v=e.i(89171),R=e.i(69411),C=e.i(89960);async function A(e){var t,r,n;let a,i,s,o=new R.default,l=(t=e,a=(0,C.v4)(),i=t.titulo||"Curso SCORM",`<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${a}" version="1.0" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 http://www.imsproject.org/xsd/imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 http://www.adlnet.org/xsd/adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="${a}">
    <organization identifier="${a}">
      <title>${i}</title>
      <item identifier="item1" identifierref="resource1">
        <title>${i}</title>
        <adlcp:masteryscore>80</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm.js"/>
    </resource>
  </resources>
</manifest>`);return o.file("imsmanifest.xml",l),Object.entries((r=e,(s={})["index.html"]=(n=r,`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${n.titulo||"Curso SCORM"}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            background: #f4f4f4;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 20px;
        }
        .unit {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .unit h3 {
            margin-top: 0;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${n.titulo||"Curso SCORM"}</h1>
        <p><strong>Descri\xe7\xe3o:</strong> ${n.descricao||"Sem descrição"}</p>
        <p><strong>Carga Hor\xe1ria:</strong> ${n.cargaHoraria||"Não especificada"}</p>
        <p><strong>Instrutor:</strong> ${n.instrutor||"Não especificado"}</p>
    </div>
    
    <div class="content">
        <h2>Conte\xfado do Curso</h2>
        ${n.unidades?.map((e,t)=>`
            <div class="unit">
                <h3>Unidade ${t+1}: ${e.titulo||"Sem título"}</h3>
                ${e.conteudo?.map(e=>`
                    <div>
                        <h4>${e.titulo||e.tipo}</h4>
                        <p>${e.conteudo||""}</p>
                    </div>
                `).join("")||"<p>Nenhum conteúdo disponível</p>"}
            </div>
        `).join("")||"<p>Nenhuma unidade disponível</p>"}
    </div>
    
    <script src="scorm.js"></script>
</body>
</html>`),s["scorm.js"]=`// SCORM 1.2 API Implementation
var API = null;
var API_1484_11 = null;

function findAPI(win) {
    var findAttempts = 0;
    var findAttemptLimit = 7;
    var traceMsgPrefix = "findAPI: ";
    
    while ((win.API_1484_11 == null) && (win.API == null) && (win.parent != null) && (win.parent != win)) {
        findAttempts++;
        if (findAttempts > findAttemptLimit) {
            return null;
        }
        win = win.parent;
    }
    
    if (win.API_1484_11 != null) {
        return win.API_1484_11;
    } else if (win.API != null) {
        return win.API;
    } else {
        return null;
    }
}

function getAPI() {
    if ((API == null) && (window.parent != null)) {
        API = findAPI(window.parent);
    }
    
    if (API == null) {
        API = findAPI(window.top);
    }
    
    return API;
}

// Initialize SCORM
function initializeSCORM() {
    var api = getAPI();
    if (api == null) {
        console.log("SCORM API not found");
        return false;
    }
    
    try {
        var result = api.Initialize("");
        if (result == "true") {
            console.log("SCORM initialized successfully");
            return true;
        } else {
            console.log("SCORM initialization failed: " + result);
            return false;
        }
    } catch (error) {
        console.log("SCORM initialization error: " + error);
        return false;
    }
}

// Set completion status
function setCompletionStatus(status) {
    var api = getAPI();
    if (api == null) return false;
    
    try {
        var result = api.SetValue("cmi.completion_status", status);
        if (result == "true") {
            console.log("Completion status set to: " + status);
            return true;
        } else {
            console.log("Failed to set completion status: " + result);
            return false;
        }
    } catch (error) {
        console.log("Error setting completion status: " + error);
        return false;
    }
}

// Set success status
function setSuccessStatus(status) {
    var api = getAPI();
    if (api == null) return false;
    
    try {
        var result = api.SetValue("cmi.success_status", status);
        if (result == "true") {
            console.log("Success status set to: " + status);
            return true;
        } else {
            console.log("Failed to set success status: " + result);
            return false;
        }
    } catch (error) {
        console.log("Error setting success status: " + error);
        return false;
    }
}

// Commit changes
function commitSCORM() {
    var api = getAPI();
    if (api == null) return false;
    
    try {
        var result = api.Commit("");
        if (result == "true") {
            console.log("SCORM data committed successfully");
            return true;
        } else {
            console.log("Failed to commit SCORM data: " + result);
            return false;
        }
    } catch (error) {
        console.log("Error committing SCORM data: " + error);
        return false;
    }
}

// Terminate SCORM
function terminateSCORM() {
    var api = getAPI();
    if (api == null) return false;
    
    try {
        var result = api.Terminate("");
        if (result == "true") {
            console.log("SCORM terminated successfully");
            return true;
        } else {
            console.log("Failed to terminate SCORM: " + result);
            return false;
        }
    } catch (error) {
        console.log("Error terminating SCORM: " + error);
        return false;
    }
}

// Initialize when page loads
window.addEventListener('load', function() {
    if (initializeSCORM()) {
        // Set initial status
        setCompletionStatus("incomplete");
        setSuccessStatus("unknown");
        
        // Mark as complete when user finishes reading
        window.addEventListener('beforeunload', function() {
            setCompletionStatus("completed");
            setSuccessStatus("passed");
            commitSCORM();
            terminateSCORM();
        });
    }
});`,s)).forEach(([e,t])=>{o.file(e,t)}),await o.generateAsync({type:"nodebuffer"})}async function S(e){try{let{curso:t}=await e.json();if(!t)return v.NextResponse.json({error:"Dados do curso são obrigatórios"},{status:400});let r=await A(t);return new v.NextResponse(r,{headers:{"Content-Type":"application/zip","Content-Disposition":`attachment; filename="${t.titulo.replace(/[^a-zA-Z0-9]/g,"_")}_SCORM.zip"`}})}catch(e){return console.error("Erro ao gerar SCORM:",e),v.NextResponse.json({error:"Erro ao gerar pacote SCORM"},{status:500})}}async function y(){return new v.NextResponse(null,{status:200,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"}})}e.s(["OPTIONS",()=>y,"POST",()=>S],698);var O=e.i(698);let P=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/generate-scorm/route",pathname:"/api/generate-scorm",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/generate-scorm/route.ts",nextConfigOutput:"",userland:O}),{workAsyncStorage:E,workUnitAsyncStorage:I,serverHooks:M}=P;function b(){return(0,n.patchFetch)({workAsyncStorage:E,workUnitAsyncStorage:I})}async function _(e,t,n){P.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let v="/api/generate-scorm/route";v=v.replace(/\/index$/,"")||"/";let R=await P.prepare(e,t,{srcPage:v,multiZoneDraftMode:!1});if(!R)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:C,params:A,nextConfig:S,parsedUrl:y,isDraftMode:O,prerenderManifest:E,routerServerContext:I,isOnDemandRevalidate:M,revalidateOnlyGenerated:b,resolvedPathname:_,clientReferenceManifest:T,serverActionsManifest:N}=R,j=(0,l.normalizeAppPath)(v),$=!!(E.dynamicRoutes[j]||E.routes[_]),k=async()=>((null==I?void 0:I.render404)?await I.render404(e,t,y,!1):t.end("This page could not be found"),null);if($&&!O){let e=!!E.routes[_],t=E.dynamicRoutes[j];if(t&&!1===t.fallback&&!e){if(S.experimental.adapterPath)return await k();throw new x.NoFallbackError}}let q=null;!$||P.isDev||O||(q="/index"===(q=_)?"/":q);let H=!0===P.isDev||!$,U=$&&!H;N&&T&&(0,s.setReferenceManifestsSingleton)({page:v,clientReferenceManifest:T,serverActionsManifest:N,serverModuleMap:(0,o.createServerModuleMap)({serverActionsManifest:N})});let D=e.method||"GET",z=(0,i.getTracer)(),F=z.getActiveScopeSpan(),L={params:A,prerenderManifest:E,renderOpts:{experimental:{authInterrupts:!!S.experimental.authInterrupts},cacheComponents:!!S.cacheComponents,supportsDynamicResponse:H,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:S.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n)=>P.onRequestError(e,t,n,I)},sharedContext:{buildId:C}},K=new u.NodeNextRequest(e),B=new u.NodeNextResponse(t),V=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let s=async e=>P.handle(V,L).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=z.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${D} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t)}else e.updateName(`${D} ${v}`)}),o=!!(0,a.getRequestMeta)(e,"minimalMode"),l=async a=>{var i,l;let u=async({previousCacheEntry:r})=>{try{if(!o&&M&&b&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await s(a);e.fetchMetrics=L.renderOpts.fetchMetrics;let l=L.renderOpts.pendingWaitUntil;l&&n.waitUntil&&(n.waitUntil(l),l=void 0);let u=L.renderOpts.collectedTags;if(!$)return await (0,m.sendResponse)(K,B,i,L.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,f.toNodeOutgoingHttpHeaders)(i.headers);u&&(t[g.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==L.renderOpts.collectedRevalidate&&!(L.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&L.renderOpts.collectedRevalidate,n=void 0===L.renderOpts.collectedExpire||L.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:L.renderOpts.collectedExpire;return{value:{kind:w.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await P.onRequestError(e,t,{routerKind:"App Router",routePath:v,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:M})},I),t}},d=await P.handleResponse({req:e,nextConfig:S,cacheKey:q,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:E,isRoutePPREnabled:!1,isOnDemandRevalidate:M,revalidateOnlyGenerated:b,responseGenerator:u,waitUntil:n.waitUntil,isMinimalMode:o});if(!$)return null;if((null==d||null==(i=d.value)?void 0:i.kind)!==w.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",M?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),O&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let c=(0,f.fromNodeOutgoingHttpHeaders)(d.value.headers);return o&&$||c.delete(g.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||c.get("Cache-Control")||c.set("Cache-Control",(0,h.getCacheControlHeader)(d.cacheControl)),await (0,m.sendResponse)(K,B,new Response(d.value.body,{headers:c,status:d.value.status||200})),null};F?await l(F):await z.withPropagatedContext(e.headers,()=>z.trace(c.BaseServerSpan.handleRequest,{spanName:`${D} ${v}`,kind:i.SpanKind.SERVER,attributes:{"http.method":D,"http.target":e.url}},l))}catch(t){if(t instanceof x.NoFallbackError||await P.onRequestError(e,t,{routerKind:"App Router",routePath:j,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:M})}),$)throw t;return await (0,m.sendResponse)(K,B,new Response(null,{status:500})),null}}e.s(["handler",()=>_,"patchFetch",()=>b,"routeModule",()=>P,"serverHooks",()=>M,"workAsyncStorage",()=>E,"workUnitAsyncStorage",()=>I],76223)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__1d5d4018._.js.map