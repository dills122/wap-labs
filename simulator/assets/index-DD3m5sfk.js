(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(r){if(r.ep)return;r.ep=!0;const o=t(r);fetch(r.href,o)}})();class ve{__destroy_into_raw(){const e=this.__wbg_ptr;return this.__wbg_ptr=0,Ye.unregister(this),e}free(){const e=this.__destroy_into_raw();s.__wbg_wmlengine_free(e,0)}activeCardId(){let e,t;try{const o=s.wmlengine_activeCardId(this.__wbg_ptr);var n=o[0],r=o[1];if(o[3])throw n=0,r=0,h(o[2]);return e=n,t=r,$(n,r)}finally{s.__wbindgen_free(e,t,1)}}advanceTimeMs(e){const t=s.wmlengine_advanceTimeMs(this.__wbg_ptr,e);if(t[1])throw h(t[0])}baseUrl(){let e,t;try{const n=s.wmlengine_baseUrl(this.__wbg_ptr);return e=n[0],t=n[1],$(n[0],n[1])}finally{s.__wbindgen_free(e,t,1)}}clearExternalNavigationIntent(){s.wmlengine_clearExternalNavigationIntent(this.__wbg_ptr)}clearScriptEntryPoints(){s.wmlengine_clearScriptEntryPoints(this.__wbg_ptr)}clearScriptUnits(){s.wmlengine_clearScriptUnits(this.__wbg_ptr)}clearTraceEntries(){s.wmlengine_clearTraceEntries(this.__wbg_ptr)}contentType(){let e,t;try{const n=s.wmlengine_contentType(this.__wbg_ptr);return e=n[0],t=n[1],$(n[0],n[1])}finally{s.__wbindgen_free(e,t,1)}}executeScriptRef(e){const t=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),n=u,r=s.wmlengine_executeScriptRef(this.__wbg_ptr,t,n);if(r[2])throw h(r[1]);return h(r[0])}executeScriptRefCall(e,t,n){const r=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),o=u,a=_(t,s.__wbindgen_malloc,s.__wbindgen_realloc),l=u,d=s.wmlengine_executeScriptRefCall(this.__wbg_ptr,r,o,a,l,n);if(d[2])throw h(d[1]);return h(d[0])}executeScriptRefFunction(e,t){const n=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),r=u,o=_(t,s.__wbindgen_malloc,s.__wbindgen_realloc),a=u,l=s.wmlengine_executeScriptRefFunction(this.__wbg_ptr,n,r,o,a);if(l[2])throw h(l[1]);return h(l[0])}executeScriptUnit(e){const t=Je(e,s.__wbindgen_malloc),n=u,r=s.wmlengine_executeScriptUnit(this.__wbg_ptr,t,n);if(r[2])throw h(r[1]);return h(r[0])}externalNavigationIntent(){const e=s.wmlengine_externalNavigationIntent(this.__wbg_ptr);let t;return e[0]!==0&&(t=$(e[0],e[1]).slice(),s.__wbindgen_free(e[0],e[1]*1,1)),t}externalNavigationRequestPolicy(){const e=s.wmlengine_externalNavigationRequestPolicy(this.__wbg_ptr);if(e[2])throw h(e[1]);return h(e[0])}focusedLinkIndex(){return s.wmlengine_focusedLinkIndex(this.__wbg_ptr)>>>0}getVar(e){const t=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),n=u,r=s.wmlengine_getVar(this.__wbg_ptr,t,n);let o;return r[0]!==0&&(o=$(r[0],r[1]).slice(),s.__wbindgen_free(r[0],r[1]*1,1)),o}handleKey(e){const t=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),n=u,r=s.wmlengine_handleKey(this.__wbg_ptr,t,n);if(r[1])throw h(r[0])}invokeScriptRef(e){const t=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),n=u,r=s.wmlengine_invokeScriptRef(this.__wbg_ptr,t,n);if(r[2])throw h(r[1]);return h(r[0])}invokeScriptRefCall(e,t,n){const r=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),o=u,a=_(t,s.__wbindgen_malloc,s.__wbindgen_realloc),l=u,d=s.wmlengine_invokeScriptRefCall(this.__wbg_ptr,r,o,a,l,n);if(d[2])throw h(d[1]);return h(d[0])}invokeScriptRefFunction(e,t){const n=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),r=u,o=_(t,s.__wbindgen_malloc,s.__wbindgen_realloc),a=u,l=s.wmlengine_invokeScriptRefFunction(this.__wbg_ptr,n,r,o,a);if(l[2])throw h(l[1]);return h(l[0])}lastScriptDialogRequests(){const e=s.wmlengine_lastScriptDialogRequests(this.__wbg_ptr);if(e[2])throw h(e[1]);return h(e[0])}lastScriptExecutionErrorCategory(){const e=s.wmlengine_lastScriptExecutionErrorCategory(this.__wbg_ptr);let t;return e[0]!==0&&(t=$(e[0],e[1]).slice(),s.__wbindgen_free(e[0],e[1]*1,1)),t}lastScriptExecutionErrorClass(){const e=s.wmlengine_lastScriptExecutionErrorClass(this.__wbg_ptr);let t;return e[0]!==0&&(t=$(e[0],e[1]).slice(),s.__wbindgen_free(e[0],e[1]*1,1)),t}lastScriptExecutionOk(){const e=s.wmlengine_lastScriptExecutionOk(this.__wbg_ptr);return e===16777215?void 0:e!==0}lastScriptExecutionTrap(){const e=s.wmlengine_lastScriptExecutionTrap(this.__wbg_ptr);let t;return e[0]!==0&&(t=$(e[0],e[1]).slice(),s.__wbindgen_free(e[0],e[1]*1,1)),t}lastScriptRequiresRefresh(){const e=s.wmlengine_lastScriptRequiresRefresh(this.__wbg_ptr);return e===16777215?void 0:e!==0}lastScriptTimerRequests(){const e=s.wmlengine_lastScriptTimerRequests(this.__wbg_ptr);if(e[2])throw h(e[1]);return h(e[0])}loadDeck(e){const t=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),n=u,r=s.wmlengine_loadDeck(this.__wbg_ptr,t,n);if(r[1])throw h(r[0])}loadDeckContext(e,t,n,r){const o=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),a=u,l=_(t,s.__wbindgen_malloc,s.__wbindgen_realloc),d=u,w=_(n,s.__wbindgen_malloc,s.__wbindgen_realloc),b=u;var m=N(r)?0:_(r,s.__wbindgen_malloc,s.__wbindgen_realloc),k=u;const x=s.wmlengine_loadDeckContext(this.__wbg_ptr,o,a,l,d,w,b,m,k);if(x[1])throw h(x[0])}navigateBack(){return s.wmlengine_navigateBack(this.__wbg_ptr)!==0}navigateToCard(e){const t=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),n=u,r=s.wmlengine_navigateToCard(this.__wbg_ptr,t,n);if(r[1])throw h(r[0])}registerScriptEntryPoint(e,t,n){const r=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),o=u,a=_(t,s.__wbindgen_malloc,s.__wbindgen_realloc),l=u;s.wmlengine_registerScriptEntryPoint(this.__wbg_ptr,r,o,a,l,n)}registerScriptUnit(e,t){const n=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),r=u,o=Je(t,s.__wbindgen_malloc),a=u;s.wmlengine_registerScriptUnit(this.__wbg_ptr,n,r,o,a)}render(){const e=s.wmlengine_render(this.__wbg_ptr);if(e[2])throw h(e[1]);return h(e[0])}setVar(e,t){const n=_(e,s.__wbindgen_malloc,s.__wbindgen_realloc),r=u,o=_(t,s.__wbindgen_malloc,s.__wbindgen_realloc),a=u;return s.wmlengine_setVar(this.__wbg_ptr,n,r,o,a)!==0}setViewportCols(e){s.wmlengine_setViewportCols(this.__wbg_ptr,e)}traceEntries(){const e=s.wmlengine_traceEntries(this.__wbg_ptr);if(e[2])throw h(e[1]);return h(e[0])}constructor(){const e=s.wmlengine_wasm_new();return this.__wbg_ptr=e>>>0,Ye.register(this,this.__wbg_ptr,this),this}}Symbol.dispose&&(ve.prototype[Symbol.dispose]=ve.prototype.free);function St(){return{__proto__:null,"./wavenav_engine_bg.js":{__proto__:null,__wbg_Error_83742b46f01ce22d:function(e,t){return Error($(e,t))},__wbg_String_8564e559799eccda:function(e,t){const n=String(t),r=_(n,s.__wbindgen_malloc,s.__wbindgen_realloc),o=u;A().setInt32(e+4,o,!0),A().setInt32(e+0,r,!0)},__wbg___wbindgen_bigint_get_as_i64_447a76b5c6ef7bda:function(e,t){const n=t,r=typeof n=="bigint"?n:void 0;A().setBigInt64(e+8,N(r)?BigInt(0):r,!0),A().setInt32(e+0,!N(r),!0)},__wbg___wbindgen_boolean_get_c0f3f60bac5a78d1:function(e){const t=e,n=typeof t=="boolean"?t:void 0;return N(n)?16777215:n?1:0},__wbg___wbindgen_debug_string_5398f5bb970e0daa:function(e,t){const n=ye(t),r=_(n,s.__wbindgen_malloc,s.__wbindgen_realloc),o=u;A().setInt32(e+4,o,!0),A().setInt32(e+0,r,!0)},__wbg___wbindgen_in_41dbb8413020e076:function(e,t){return e in t},__wbg___wbindgen_is_bigint_e2141d4f045b7eda:function(e){return typeof e=="bigint"},__wbg___wbindgen_is_function_3c846841762788c1:function(e){return typeof e=="function"},__wbg___wbindgen_is_object_781bc9f159099513:function(e){const t=e;return typeof t=="object"&&t!==null},__wbg___wbindgen_jsval_eq_ee31bfad3e536463:function(e,t){return e===t},__wbg___wbindgen_jsval_loose_eq_5bcc3bed3c69e72b:function(e,t){return e==t},__wbg___wbindgen_number_get_34bb9d9dcfa21373:function(e,t){const n=t,r=typeof n=="number"?n:void 0;A().setFloat64(e+8,N(r)?0:r,!0),A().setInt32(e+0,!N(r),!0)},__wbg___wbindgen_string_get_395e606bd0ee4427:function(e,t){const n=t,r=typeof n=="string"?n:void 0;var o=N(r)?0:_(r,s.__wbindgen_malloc,s.__wbindgen_realloc),a=u;A().setInt32(e+4,a,!0),A().setInt32(e+0,o,!0)},__wbg___wbindgen_throw_6ddd609b62940d55:function(e,t){throw new Error($(e,t))},__wbg_call_e133b57c9155d22c:function(){return _e(function(e,t){return e.call(t)},arguments)},__wbg_done_08ce71ee07e3bd17:function(e){return e.done},__wbg_entries_e8a20ff8c9757101:function(e){return Object.entries(e)},__wbg_get_326e41e095fb2575:function(){return _e(function(e,t){return Reflect.get(e,t)},arguments)},__wbg_get_a8ee5c45dabc1b3b:function(e,t){return e[t>>>0]},__wbg_get_unchecked_329cfe50afab7352:function(e,t){return e[t>>>0]},__wbg_instanceof_ArrayBuffer_101e2bf31071a9f6:function(e){let t;try{t=e instanceof ArrayBuffer}catch{t=!1}return t},__wbg_instanceof_Map_f194b366846aca0c:function(e){let t;try{t=e instanceof Map}catch{t=!1}return t},__wbg_instanceof_Uint8Array_740438561a5b956d:function(e){let t;try{t=e instanceof Uint8Array}catch{t=!1}return t},__wbg_isArray_33b91feb269ff46e:function(e){return Array.isArray(e)},__wbg_isSafeInteger_ecd6a7f9c3e053cd:function(e){return Number.isSafeInteger(e)},__wbg_iterator_d8f549ec8fb061b1:function(){return Symbol.iterator},__wbg_length_b3416cf66a5452c8:function(e){return e.length},__wbg_length_ea16607d7b61445b:function(e){return e.length},__wbg_new_5f486cdf45a04d78:function(e){return new Uint8Array(e)},__wbg_new_a70fbab9066b301f:function(){return new Array},__wbg_new_ab79df5bd7c26067:function(){return new Object},__wbg_next_11b99ee6237339e3:function(){return _e(function(e){return e.next()},arguments)},__wbg_next_e01a967809d1aa68:function(e){return e.next},__wbg_prototypesetcall_d62e5099504357e6:function(e,t,n){Uint8Array.prototype.set.call($t(e,t),n)},__wbg_set_282384002438957f:function(e,t,n){e[t>>>0]=n},__wbg_set_6be42768c690e380:function(e,t,n){e[t]=n},__wbg_value_21fc78aab0322612:function(e){return e.value},__wbindgen_cast_0000000000000001:function(e){return e},__wbindgen_cast_0000000000000002:function(e){return e},__wbindgen_cast_0000000000000003:function(e,t){return $(e,t)},__wbindgen_cast_0000000000000004:function(e){return BigInt.asUintN(64,e)},__wbindgen_init_externref_table:function(){const e=s.__wbindgen_externrefs,t=e.grow(4);e.set(0,void 0),e.set(t+0,void 0),e.set(t+1,null),e.set(t+2,!0),e.set(t+3,!1)}}}}const Ye=typeof FinalizationRegistry>"u"?{register:()=>{},unregister:()=>{}}:new FinalizationRegistry(i=>s.__wbg_wmlengine_free(i>>>0,1));function Ct(i){const e=s.__externref_table_alloc();return s.__wbindgen_externrefs.set(e,i),e}function ye(i){const e=typeof i;if(e=="number"||e=="boolean"||i==null)return`${i}`;if(e=="string")return`"${i}"`;if(e=="symbol"){const r=i.description;return r==null?"Symbol":`Symbol(${r})`}if(e=="function"){const r=i.name;return typeof r=="string"&&r.length>0?`Function(${r})`:"Function"}if(Array.isArray(i)){const r=i.length;let o="[";r>0&&(o+=ye(i[0]));for(let a=1;a<r;a++)o+=", "+ye(i[a]);return o+="]",o}const t=/\[object ([^\]]+)\]/.exec(toString.call(i));let n;if(t&&t.length>1)n=t[1];else return toString.call(i);if(n=="Object")try{return"Object("+JSON.stringify(i)+")"}catch{return"Object"}return i instanceof Error?`${i.name}: ${i.message}
${i.stack}`:n}function $t(i,e){return i=i>>>0,D().subarray(i/1,i/1+e)}let O=null;function A(){return(O===null||O.buffer.detached===!0||O.buffer.detached===void 0&&O.buffer!==s.memory.buffer)&&(O=new DataView(s.memory.buffer)),O}function $(i,e){return i=i>>>0,Rt(i,e)}let H=null;function D(){return(H===null||H.byteLength===0)&&(H=new Uint8Array(s.memory.buffer)),H}function _e(i,e){try{return i.apply(this,e)}catch(t){const n=Ct(t);s.__wbindgen_exn_store(n)}}function N(i){return i==null}function Je(i,e){const t=e(i.length*1,1)>>>0;return D().set(i,t/1),u=i.length,t}function _(i,e,t){if(t===void 0){const l=z.encode(i),d=e(l.length,1)>>>0;return D().subarray(d,d+l.length).set(l),u=l.length,d}let n=i.length,r=e(n,1)>>>0;const o=D();let a=0;for(;a<n;a++){const l=i.charCodeAt(a);if(l>127)break;o[r+a]=l}if(a!==n){a!==0&&(i=i.slice(a)),r=t(r,n,n=a+i.length*3,1)>>>0;const l=D().subarray(r+a,r+n),d=z.encodeInto(i,l);a+=d.written,r=t(r,n,a,1)>>>0}return u=a,r}function h(i){const e=s.__wbindgen_externrefs.get(i);return s.__externref_table_dealloc(i),e}let se=new TextDecoder("utf-8",{ignoreBOM:!0,fatal:!0});se.decode();const At=2146435072;let we=0;function Rt(i,e){return we+=e,we>=At&&(se=new TextDecoder("utf-8",{ignoreBOM:!0,fatal:!0}),se.decode(),we=e),se.decode(D().subarray(i,i+e))}const z=new TextEncoder;"encodeInto"in z||(z.encodeInto=function(i,e){const t=z.encode(i);return e.set(t),{read:i.length,written:t.length}});let u=0,s;function It(i,e){return s=i.exports,O=null,H=null,s.__wbindgen_start(),s}async function Tt(i,e){if(typeof Response=="function"&&i instanceof Response){if(typeof WebAssembly.instantiateStreaming=="function")try{return await WebAssembly.instantiateStreaming(i,e)}catch(r){if(i.ok&&t(i.type)&&i.headers.get("Content-Type")!=="application/wasm")console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",r);else throw r}const n=await i.arrayBuffer();return await WebAssembly.instantiate(n,e)}else{const n=await WebAssembly.instantiate(i,e);return n instanceof WebAssembly.Instance?{instance:n,module:i}:n}function t(n){switch(n){case"basic":case"cors":case"default":return!0}return!1}}async function Lt(i){if(s!==void 0)return s;i!==void 0&&(Object.getPrototypeOf(i)===Object.prototype?{module_or_path:i}=i:console.warn("using deprecated parameters for the initialization function; pass a single object instead")),i===void 0&&(i=new URL(""+new URL("wavenav_engine_bg-571Fmujv.wasm",import.meta.url).href,import.meta.url));const e=St();(typeof i=="string"||typeof Request=="function"&&i instanceof Request||typeof URL=="function"&&i instanceof URL)&&(i=fetch(i));const{instance:t,module:n}=await Tt(await i,e);return It(t)}const Ze=16,Pt=8,et="http://local.test/deck.wml",tt="text/vnd.wap.wml";async function Ot(i,e){await Lt();const t=new ve;t.setViewportCols(20),nt(t),t.loadDeckContext(e,et,tt);function n(){const r=i.getContext("2d");if(!r)return;r.clearRect(0,0,i.width,i.height),r.font='14px "IBM Plex Mono", monospace',r.textBaseline="top";const o=t.render();for(const a of o.draw){const l=a.x*Pt,d=a.y*Ze;if(a.type==="text"){r.fillStyle="#111",r.fillText(a.text,l,d);continue}a.type==="link"&&(a.focused&&(r.fillStyle="#c8ddff",r.fillRect(0,d-1,i.width,Ze+2)),r.fillStyle=a.focused?"#10274d":"#0b3d91",r.fillText(a.text,l,d))}}return n(),{loadDeck(r){t.loadDeckContext(r,et,tt),nt(t),n()},pressKey(r){t.handleKey(r),n()},advanceTimeMs(r){t.advanceTimeMs(r),n()},navigateBack(){const r=t.navigateBack();return n(),r},snapshot(){const r=t;return{activeCardId:t.activeCardId(),focusedLinkIndex:t.focusedLinkIndex(),baseUrl:t.baseUrl(),contentType:t.contentType(),nextCardVar:t.getVar("nextCard"),externalNavigationIntent:t.externalNavigationIntent(),externalNavigationRequestPolicy:r.externalNavigationRequestPolicy?.()??void 0,lastScriptExecutionOk:t.lastScriptExecutionOk(),lastScriptExecutionTrap:t.lastScriptExecutionTrap(),lastScriptExecutionErrorClass:r.lastScriptExecutionErrorClass?.()??void 0,lastScriptExecutionErrorCategory:r.lastScriptExecutionErrorCategory?.()??void 0,lastScriptRequiresRefresh:t.lastScriptRequiresRefresh()}},clearExternalNavigationIntent(){t.clearExternalNavigationIntent()},getVar(r){return t.getVar(r)},setVar(r,o){return t.setVar(r,o)},executeScriptUnit(r){return t.executeScriptUnit(r)},registerScriptUnit(r,o){t.registerScriptUnit(r,o)},clearScriptUnits(){t.clearScriptUnits()},registerScriptEntryPoint(r,o,a){t.registerScriptEntryPoint(r,o,a)},clearScriptEntryPoints(){t.clearScriptEntryPoints()},invokeScriptRef(r){const o=t.invokeScriptRef(r);return(o.effects.requiresRefresh||o.effects.navigationIntent.type!=="none")&&n(),o},invokeScriptRefFunction(r,o){const a=t.invokeScriptRefFunction(r,o);return(a.effects.requiresRefresh||a.effects.navigationIntent.type!=="none")&&n(),a},invokeScriptRefCall(r,o,a){const l=t.invokeScriptRefCall(r,o,a);return(l.effects.requiresRefresh||l.effects.navigationIntent.type!=="none")&&n(),l},executeScriptRef(r){return t.executeScriptRef(r)},executeScriptRefFunction(r,o){return t.executeScriptRefFunction(r,o)},executeScriptRefCall(r,o,a){return t.executeScriptRefCall(r,o,a)},lastScriptExecutionTrap(){return t.lastScriptExecutionTrap()},lastScriptExecutionOk(){return t.lastScriptExecutionOk()},lastScriptExecutionErrorClass(){return t.lastScriptExecutionErrorClass?.()},lastScriptExecutionErrorCategory(){return t.lastScriptExecutionErrorCategory?.()},lastScriptRequiresRefresh(){return t.lastScriptRequiresRefresh()},traceEntries(){return t.traceEntries()},clearTraceEntries(){t.clearTraceEntries()},render:n,getEngine(){return t}}}function nt(i){i.clearScriptUnits(),i.clearScriptEntryPoints(),i.registerScriptUnit("calc.wmlsc",new Uint8Array([1,4,1,5,2,0])),i.registerScriptEntryPoint("calc.wmlsc","main",0),i.registerScriptUnit("wmlbrowser-demo.wmlsc",new Uint8Array([3,8,110,101,120,116,67,97,114,100,3,5,35,110,101,120,116,32,2,2,3,5,35,110,101,120,116,32,3,1,0,32,4,0,0,3,8,110,101,120,116,67,97,114,100,32,1,1,0,3,8,110,101,120,116,67,97,114,100,32,11,0,32,2,2,0,3,8,110,101,120,116,67,97,114,100,3,11,98,101,102,111,114,101,82,101,115,101,116,32,2,2,32,10,0,32,4,0,0])),i.registerScriptEntryPoint("wmlbrowser-demo.wmlsc","main",0),i.registerScriptEntryPoint("wmlbrowser-demo.wmlsc","back",31),i.registerScriptEntryPoint("wmlbrowser-demo.wmlsc","readNext",35),i.registerScriptEntryPoint("wmlbrowser-demo.wmlsc","readCurrentCard",49),i.registerScriptEntryPoint("wmlbrowser-demo.wmlsc","newContextPrev",66),i.registerScriptUnit("wavescript-fixtures.wmlsc",new Uint8Array([3,8,110,101,120,116,67,97,114,100,3,7,117,112,100,97,116,101,100,32,2,2,0,3,5,35,110,101,120,116,32,3,1,3,0,32,3,1,0,3,20,110,101,120,116,46,119,109,108,63,102,114,111,109,61,115,99,114,105,112,116,32,3,1,0,3,5,35,110,101,120,116,32,3,1,32,4,0,0,32,4,0,3,5,35,110,101,120,116,32,3,1,0])),i.registerScriptEntryPoint("wavescript-fixtures.wmlsc","refreshOnly",0),i.registerScriptEntryPoint("wavescript-fixtures.wmlsc","goCancel",23),i.registerScriptEntryPoint("wavescript-fixtures.wmlsc","externalGo",39),i.registerScriptEntryPoint("wavescript-fixtures.wmlsc","goThenPrev",63),i.registerScriptEntryPoint("wavescript-fixtures.wmlsc","prevThenGo",77)}const oe=[{key:"acceptErrorRollback",label:"Accept Error Rollback",description:"Demonstrates deterministic rollback when accept-task navigation targets are invalid.",goal:"Verify failed accept go action does not partially mutate runtime state.",workItems:["R0-02"],specItems:["WML-18","WML-R-017"],testingAc:['Enter "To broken accept" then Enter again.',"Confirm action fails and activeCardId remains accept-broken.","Press Back and confirm activeCardId returns to home."],wml:`<wml>
  <card id="home">
    <p>Rollback demo.</p>
    <a href="#accept-broken">To broken accept</a>
  </card>

  <card id="accept-broken">
    <do type="accept"><go href="#missing"/></do>
    <p>Accept action should fail and keep this card active.</p>
  </card>
</wml>
`},{key:"acceptNoopOrdering",label:"Accept Noop Ordering",description:"Exercises accept-task ordering with explicit noop behavior alongside go/prev/refresh flows.",goal:"Verify noop is deterministic and does not mutate navigation/history while other accept actions retain expected behavior.",workItems:["R0-02"],specItems:["WML-18","WML-R-012","WML-R-015","WML-R-017"],testingAc:['Enter "Accept go" then Enter again; activeCardId should become target.','Return home, enter "Accept prev" then Enter again; activeCardId should become home.','Enter "Accept refresh" then Enter; activeCardId should stay accept-refresh.','Enter "Accept noop" then Enter; activeCardId should stay accept-noop and history depth should not change.'],wml:`<wml>
  <card id="home">
    <a href="#accept-go">Accept go</a>
    <a href="#accept-prev">Accept prev</a>
    <a href="#accept-refresh">Accept refresh</a>
    <a href="#accept-noop">Accept noop</a>
  </card>

  <card id="accept-go">
    <do type="accept"><go href="#target"/></do>
    <p>Enter should run accept go.</p>
  </card>

  <card id="accept-prev">
    <do type="accept"><prev/></do>
    <p>Enter should run accept prev.</p>
  </card>

  <card id="accept-refresh">
    <do type="accept"><refresh/></do>
    <p>Enter should run accept refresh.</p>
  </card>

  <card id="accept-noop">
    <do type="accept"><noop/></do>
    <p>Enter should run accept noop without state mutation.</p>
  </card>

  <card id="target">
    <p>Reached via accept go.</p>
  </card>
</wml>
`},{key:"actionsDoOnevent",label:"Do + Onevent Actions",description:"Demonstrates accept softkey action and onenterforward event chaining through runtime action handling.",goal:"Verify runtime executes card-level action/event href intents without host-side semantics.",workItems:["W0-01"],specItems:["RQ-WMLS-018"],testingAc:["Load the example and press Enter on the first card; activeCardId should move from home to trigger.","Confirm onenterforward on trigger executes immediately and activeCardId becomes final.","Confirm externalNavigationIntent remains (none) through the flow."],wml:`<wml>
  <card id="home">
    <do type="accept">
      <go href="#trigger"/>
    </do>
    <p>Press Enter to run the accept action.</p>
  </card>
  <card id="trigger">
    <onevent type="onenterforward">
      <go href="#final"/>
    </onevent>
    <p>This card should auto-forward to final.</p>
  </card>
  <card id="final">
    <p>Final card reached via onenterforward.</p>
    <a href="#home">Back home</a>
  </card>
</wml>
`},{key:"actionsPrevTaskModel",label:"Prev Task Model",description:"Demonstrates deterministic `<prev/>` handling for accept and intrinsic card-entry events.",goal:"Verify task-model `prev` actions are executed consistently in runtime-owned action/event plumbing.",workItems:["A5-02"],specItems:["WML-R-012","WML-R-015"],testingAc:['Press Enter on "To middle" and then Enter again; activeCardId should return to home (accept prev).','From home, Enter "To middle", then Enter "To next".',"Press Back once; activeCardId should become home because middle runs onenterbackward prev."],wml:`<wml>
  <card id="home">
    <p>Prev task demo.</p>
    <a href="#mid-accept">To middle (accept prev)</a>
    <a href="#mid-back">To middle (onenterbackward prev)</a>
  </card>

  <card id="mid-accept">
    <do type="accept"><prev/></do>
    <p>No links on this card; Enter should invoke accept prev.</p>
  </card>

  <card id="mid-back">
    <onevent type="onenterbackward"><prev/></onevent>
    <a href="#next">To next</a>
  </card>

  <card id="next">
    <p>Use host Back to trigger onenterbackward prev in mid-back.</p>
  </card>
</wml>
`},{key:"actionsRefreshRollback",label:"Refresh + Rollback",description:"Demonstrates task-model `<refresh/>` execution and rollback behavior when entry-task actions fail.",goal:"Verify refresh does not mutate navigation state and failed onenterforward actions leave invoking card current.",workItems:["A5-02"],specItems:["WML-R-012","WML-R-015","WML-R-017"],testingAc:['Press Enter on "To refresh card", then Enter again; activeCardId should stay refresh-card.',"Press Back; activeCardId should return to home.",'Press Down then Enter on "Broken forward entry"; load should fail and activeCardId should remain home.'],wml:`<wml>
  <card id="home">
    <p>Refresh + rollback demo.</p>
    <a href="#refresh-card">To refresh card</a>
    <a href="#broken-forward">Broken forward entry</a>
  </card>

  <card id="refresh-card">
    <do type="accept"><refresh/></do>
    <p>Enter invokes refresh and stays on this card.</p>
  </card>

  <card id="broken-forward">
    <onevent type="onenterforward"><go href="#missing"/></onevent>
    <p>This card should never become active because entry action fails.</p>
  </card>
</wml>
`},{key:"actionsTaskOrderRollback",label:"Task Order + Rollback",description:"Exercises accept-task ordering for go/prev/refresh and failure rollback when task navigation targets are invalid.",goal:"Validate deterministic action trace ordering and no partial state mutation on failed task actions.",workItems:["A5-02"],specItems:["WML-R-012","WML-R-015","WML-R-017"],testingAc:['Enter "Accept go" then Enter again; activeCardId should become target.','Back to home, enter "Accept prev" then Enter again; activeCardId should become home.','Enter "Accept refresh" then Enter; activeCardId should stay accept-refresh.','Enter "Accept broken" then Enter; action should error and activeCardId should remain accept-broken.'],wml:`<wml>
  <card id="home">
    <a href="#accept-go">Accept go</a>
    <a href="#accept-prev">Accept prev</a>
    <a href="#accept-refresh">Accept refresh</a>
    <a href="#accept-broken">Accept broken</a>
  </card>

  <card id="accept-go">
    <do type="accept"><go href="#target"/></do>
    <p>Enter should run accept go.</p>
  </card>

  <card id="accept-prev">
    <do type="accept"><prev/></do>
    <p>Enter should run accept prev.</p>
  </card>

  <card id="accept-refresh">
    <do type="accept"><refresh/></do>
    <p>Enter should run accept refresh.</p>
  </card>

  <card id="accept-broken">
    <do type="accept"><go href="#missing"/></do>
    <p>Enter should fail and keep this card active.</p>
  </card>

  <card id="target">
    <p>Reached via accept go.</p>
  </card>
</wml>
`},{key:"basic",label:"Basic Navigation",description:"Baseline navigation deck with one fragment link and one external link.",goal:"Verify fragment transitions mutate active card while external links only emit host intent.",workItems:["A2-01","A2-02"],specItems:["WML-R-006","WML-R-007"],testingAc:['Load the example and press Enter on "Go to next card"; activeCardId should become next.','Press Enter on "Return home"; activeCardId should become home.','Move focus to "External link" and press Enter; activeCardId should remain home.',"Confirm runtime-state shows externalNavigationIntent as http://example.com/other.wml."],wml:`<wml>
  <card id="home">
    <p>WaveNav Host Harness</p>
    <p>Use ArrowUp / ArrowDown / Enter.</p>
    <a href="#next">Go to next card</a>
    <br/>
    <a href="http://example.com/other.wml">External link (emits host intent)</a>
  </card>
  <card id="next">
    <p>Second card loaded.</p>
    <a href="#home">Return home</a>
  </card>
</wml>
`},{key:"cardEntryForwardBackward",label:"Card Entry Forward+Backward",description:"Demonstrates deterministic re-entry behavior when a card defines both onenterforward and onenterbackward handlers.",goal:"Confirm forward entry and backward re-entry actions trigger at the expected navigation boundaries.",workItems:["A2-03"],specItems:["WML-R-008"],testingAc:['Press Enter on "Enter transit"; activeCardId should become next because transit runs onenterforward.',"Press Back once; activeCardId should become rewind because transit runs onenterbackward on re-entry.","Confirm runtime trace shows ACTION_BACK and subsequent ACTION_FRAGMENT for rewind."],wml:`<wml>
  <card id="home">
    <p>Start card.</p>
    <a href="#transit">Enter transit</a>
  </card>
  <card id="transit">
    <onevent type="onenterforward">
      <go href="#next"/>
    </onevent>
    <onevent type="onenterbackward">
      <go href="#rewind"/>
    </onevent>
    <p>Transit card should not remain active after either entry event.</p>
  </card>
  <card id="next">
    <p>Reached from onenterforward.</p>
  </card>
  <card id="rewind">
    <p>Reached from onenterbackward.</p>
    <a href="#home">Return home</a>
  </card>
</wml>
`},{key:"externalNavigationIntent",label:"External Navigation Intent",description:"Focused demo of external intent emission for relative and absolute links.",goal:"Validate URL intent resolution and confirm fragment behavior remains separate.",workItems:["A2-02"],specItems:["WML-R-007"],testingAc:['Press Enter on "Relative external link" and confirm activeCardId stays home.',"Confirm externalNavigationIntent resolves to the base directory plus next.wml?from=home.",'Press Down then Enter on "Absolute external link" and confirm intent is exactly https://example.org/absolute.','Press Down then Enter on "Internal fragment link" and confirm activeCardId becomes details.'],wml:`<wml>
  <card id="home">
    <p>External intent demo</p>
    <p>Enter on first link emits host intent only.</p>
    <a href="next.wml?from=home">Relative external link</a>
    <br/>
    <a href="https://example.org/absolute">Absolute external link</a>
    <br/>
    <a href="#details">Internal fragment link</a>
  </card>
  <card id="details">
    <p>Fragment navigation still changes active card.</p>
    <a href="#home">Back home</a>
  </card>
</wml>
`},{key:"fieldOpenwave2011Navigation",label:"Field Example (Openwave 2011)",description:"Real-world style multi-card sample used to exercise parser ordering and fragment navigation.",goal:"Ensure source ordering, inline link parsing, and card transitions stay deterministic on legacy-like content.",workItems:["A1-03","A2-01"],specItems:["WML-R-002","WML-R-006"],testingAc:["Load the deck and verify activeCardId starts at main.",'Press Enter on "Here" and confirm activeCardId transitions to content.',"Use Down and Enter on one of the external service links and verify activeCardId remains content.","Confirm runtime-state externalNavigationIntent updates when entering an external service link."],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//OPENWAVE.COM//DTD WML 1.3//EN"
"http://www.openwave.com/dtd/wml13.dtd">
<wml>
  <card id="main" title="Wireless Programming">
    <p align="center" mode="wrap">
      Welcome to our <em>Online Mobile Course</em><br/>
      <big><strong>Wireless Programming</strong></big>
    </p>
    <p>To Continue Click <a href="#content">Here</a></p>
  </card>
  <card id="content" title="Services">
    <p>
      List of our services<br/>
      <a href="dictionary.wml">WAP Dictionary</a><br/>
      <a href="Lectures.wml">WAP Lectures</a><br/>
      <a href="Quizes.wml">WAP Quizes</a><br/>
      <a href="Assignments.wml">WAP Assignments</a><br/>
      <a href="FAQ.wml">WAP FAQ</a><br/>
    </p>
  </card>
</wml>
`},{key:"historyBackProcessOrder",label:"History Back Process Order",description:"Exercises multi-step fragment navigation and deterministic back traversal order.",goal:"Verify back traversal replays prior card order without skipping or mutating unrelated state.",workItems:["R0-02","R0-03"],specItems:["WML-18","WML-07","WML-R-008"],testingAc:["Navigate home -> level-1 -> level-2 using Enter.","Press Back once and confirm activeCardId is level-1.","Press Back again and confirm activeCardId is home.","Press Back on home and confirm no-op behavior with activeCardId still home."],wml:`<wml>
  <card id="home">
    <p>History process-order demo.</p>
    <a href="#level-1">To level 1</a>
  </card>

  <card id="level-1">
    <p>Level 1 card.</p>
    <a href="#level-2">To level 2</a>
  </card>

  <card id="level-2">
    <p>Level 2 card.</p>
    <a href="#home">Return home via link</a>
  </card>
</wml>
`},{key:"historyBackStack",label:"History Back Stack",description:"Exercises fragment navigation history and host-triggered back navigation.",goal:"Verify runtime pushes history on fragment transitions and pops deterministically through navigateBack.",workItems:["A2-03"],specItems:["WML-R-008"],testingAc:['Load the deck and press Enter on "Go to next"; activeCardId should become next.',"Press Back; activeCardId should return to home.","Press Back again and confirm status reports history empty with activeCardId still home."],wml:`<wml>
  <card id="home">
    <p>History baseline demo.</p>
    <a href="#next">Go to next</a>
  </card>
  <card id="next">
    <p>Second card reached by fragment navigation.</p>
    <a href="#home">Return home via link</a>
  </card>
</wml>
`},{key:"missingFragment",label:"Missing Fragment Error",description:"Negative navigation case where a fragment target is absent.",goal:"Verify missing fragment transitions fail deterministically without mutating runtime state.",workItems:["A2-01"],specItems:["WML-R-006"],testingAc:["Load the deck and confirm activeCardId is home.",'Press Enter on "Broken target".',"Confirm status shows a key error and activeCardId remains home.","Confirm focusedLinkIndex remains stable after the failed navigation."],wml:`<wml>
  <card id="home">
    <p>Missing fragment test</p>
    <a href="#missing">Broken target</a>
  </card>
</wml>
`},{key:"onenterbackwardReentry",label:"OnEnterBackward Reentry",description:"Demonstrates card re-entry behavior when navigateBack lands on a card with onenterbackward.",goal:"Verify backward navigation triggers onenterbackward deterministically before the user resumes input.",workItems:["A2-03"],specItems:["WML-R-008"],testingAc:['Press Enter on "To middle", then Enter on "To next"; activeCardId should become next.',"Press Back once; activeCardId should become rewind (not middle) because mid defines onenterbackward.","Confirm runtime trace includes ACTION_BACK followed by ACTION_FRAGMENT for rewind."],wml:`<wml>
  <card id="home">
    <p>Start card.</p>
    <a href="#mid">To middle</a>
  </card>
  <card id="mid">
    <onevent type="onenterbackward">
      <go href="#rewind"/>
    </onevent>
    <p>Middle card runs backward-entry action.</p>
    <a href="#next">To next</a>
  </card>
  <card id="next">
    <p>Reached from middle.</p>
  </card>
  <card id="rewind">
    <p>Reached via onenterbackward.</p>
    <a href="#home">Return home</a>
  </card>
</wml>
`},{key:"parserRobustness",label:"Parser Robustness",description:"Includes unsupported tags and valid card content to assert parser resilience.",goal:"Confirm unsupported tags are ignored while valid nodes remain functional and navigable.",workItems:["A1-01","A1-03"],specItems:["WML-R-001","WML-R-020"],testingAc:["Load the deck and verify it renders without load errors.","Confirm activeCardId starts at home despite the unsupported <cardinal> node.",'Press Enter on "Next" and confirm transition to next works.','Press Enter on "Back" and confirm transition to home works.'],wml:`<wml>
  <cardinal id="noise">Ignore me</cardinal>
  <card id="home">
    <p>Hello <a href="#next">Next</a></p>
  </card>
  <card id="next">
    <p>Still works.</p>
    <a href="#home">Back</a>
  </card>
</wml>
`},{key:"scriptLinkExecution",label:"Script Link Execution",description:"Runs a registered script unit through a script href and exposes execution outcome in runtime state.",goal:"Validate runtime routes script href actions into engine VM execution path.",workItems:["W0-01","W0-03"],specItems:["RQ-WMLS-001","RQ-WMLS-008"],testingAc:['Load the example and press Enter on "Run calc script"; activeCardId should stay home.',"Confirm runtime-state lastScriptExecutionOk becomes true.","Confirm runtime-state lastScriptExecutionTrap remains (none)."],wml:`<wml>
  <card id="home">
    <p>Script action execution demo.</p>
    <a href="script:calc.wmlsc#main">Run calc script</a>
    <br/>
    <a href="#done">Continue</a>
  </card>
  <card id="done">
    <p>Script executed in previous card.</p>
    <a href="#home">Back</a>
  </card>
</wml>
`},{key:"timerHostClockLifecycle",label:"Timer Host Clock Lifecycle",description:"Demonstrates host-driven deterministic timer ticking for non-zero `<timer value>` expiry.",goal:"Verify auto tick advances runtime clock and ontimer dispatch transitions cards without manual key input.",workItems:["A5-03"],specItems:["WML-R-014"],testingAc:['Select this example and press Enter on "Start timed card".',"Enable Auto Tick with 100ms step and wait until the card transitions.","Confirm activeCardId transitions from timed to done and trace contains TIMER_TICK, TIMER_EXPIRE, and ACTION_ONTIMER."],wml:`<wml>
  <card id="home">
    <a href="#timed">Start timed card</a>
  </card>
  <card id="timed">
    <timer value="15"/>
    <onevent type="ontimer"><go href="#done"/></onevent>
    <p>Auto tick should move this card after 1.5 seconds.</p>
  </card>
  <card id="done">
    <p>Timer completed through host clock lifecycle.</p>
  </card>
</wml>
`},{key:"timerOntimerImmediate",label:"Timer Ontimer Immediate",description:'Demonstrates immediate ontimer dispatch for `<timer value="0"/>` at card-entry boundaries.',goal:"Verify runtime-owned timer dispatch executes ontimer action deterministically on entry.",workItems:["A5-03"],specItems:["WML-R-014"],testingAc:['Press Enter on "To timed" from home.',"Confirm activeCardId becomes next immediately (timed card should not remain active).","Confirm trace includes TIMER_START and ACTION_ONTIMER before the final ACTION_FRAGMENT to next."],wml:`<wml>
  <card id="home">
    <a href="#timed">To timed</a>
  </card>
  <card id="timed">
    <timer value="0"/>
    <onevent type="ontimer"><go href="#next"/></onevent>
    <p>Timed card should auto-advance.</p>
  </card>
  <card id="next">
    <p>Reached via ontimer dispatch.</p>
  </card>
</wml>
`},{key:"wavescriptGoCancel",label:"WaveScript Go Cancel",description:'Exercises go-cancel behavior where go("") clears pending navigation intent in the same invocation.',goal:"Verify deferred navigation cancellation semantics are deterministic.",workItems:["W0-04"],specItems:["RQ-WMLS-018"],testingAc:['On home card, press Enter on "Script go then cancel".',"Confirm activeCardId remains home after invocation.","Confirm runtime-state externalNavigationIntent remains (none)."],wml:`<wml>
  <card id="home">
    <p>go("#next") then go("") in one script invocation.</p>
    <a href="script:wavescript-fixtures.wmlsc#goCancel">Script go then cancel</a>
  </card>
  <card id="next">
    <p>If you can read this from the script link, cancellation regressed.</p>
    <a href="#home">Back</a>
  </card>
</wml>
`},{key:"wavescriptNavOrder",label:"WaveScript Navigation Order",description:"Demonstrates last-call-wins behavior for go/prev ordering inside a single script invocation.",goal:"Confirm ordering rules stay deterministic as compatibility fixtures evolve.",workItems:["W0-04"],specItems:["RQ-WMLS-018"],testingAc:['Press Enter on "go then prev" and confirm activeCardId stays home.','Press Down then Enter on "prev then go" and confirm activeCardId becomes next.','On next card, press Enter on "Script external go" and confirm externalNavigationIntent is populated.'],wml:`<wml>
  <card id="home">
    <p>Navigation ordering matrix.</p>
    <a href="script:wavescript-fixtures.wmlsc#goThenPrev">go then prev</a>
    <br/>
    <a href="script:wavescript-fixtures.wmlsc#prevThenGo">prev then go</a>
  </card>
  <card id="next">
    <p>Reached via prev-then-go ordering.</p>
    <a href="script:wavescript-fixtures.wmlsc#externalGo">Script external go</a>
    <br/>
    <a href="#home">Back home</a>
  </card>
</wml>
`},{key:"wavescriptRefreshPolicy",label:"WaveScript Refresh Policy",description:"Verifies setVar-driven refresh signaling without navigation side effects.",goal:"Confirm requiresRefresh policy is surfaced while active card remains stable.",workItems:["W0-04"],specItems:["RQ-WMLS-017","RQ-WMLS-021"],testingAc:['On home card, press Enter on "Script setVar only".',"Confirm activeCardId remains home and focusedLinkIndex remains stable.","Confirm runtime-state nextCardVar becomes updated and lastScriptRequiresRefresh becomes true."],wml:`<wml>
  <card id="home">
    <p>Refresh policy demo (no navigation).</p>
    <a href="script:wavescript-fixtures.wmlsc#refreshOnly">Script setVar only</a>
  </card>
</wml>
`},{key:"wmlbrowserContextFidelity",label:"WMLBrowser Context Fidelity",description:"Exercises getCurrentCard and newContext semantics, including context reset side effects and prev suppression.",goal:"Validate that current-card lookup and newContext resets align with WMLScript context semantics in host-visible flows.",workItems:["R0-03","W0-07"],specItems:["RQ-WMLS-019","RQ-WMLS-020"],testingAc:['On home card, press Enter on "Read current card into nextCard" and confirm runtime-state nextCardVar becomes #home.','Follow "Go to next card" then activate "Run newContext + prev"; activeCardId should remain next and nextCardVar should clear.',"Press browser Back after newContext and verify history is cleared for prior card context (no return to home via engine history)."],wml:`<wml>
  <card id="home">
    <p>WMLBrowser context semantics demo.</p>
    <a href="script:wmlbrowser-demo.wmlsc#readCurrentCard">Read current card into nextCard</a>
    <a href="#next">Go to next card</a>
  </card>
  <card id="next">
    <p>newContext should clear vars/history and ignore prev in same script.</p>
    <a href="script:wmlbrowser-demo.wmlsc#newContextPrev">Run newContext + prev</a>
    <a href="script:wmlbrowser-demo.wmlsc#readCurrentCard">Read current card into nextCard</a>
  </card>
</wml>
`},{key:"wmlbrowserVarNav",label:"WMLBrowser Var + Nav",description:"Exercises script-host bindings for setVar/getVar and deferred go/prev navigation effects.",goal:"Validate WMLBrowser subset semantics at the engine-owned post-invocation boundary.",workItems:["W0-04"],specItems:["RQ-WMLS-017","RQ-WMLS-018"],testingAc:['On home card, press Enter on "Script setVar + go"; activeCardId should become next.',"Confirm runtime-state nextCardVar becomes #next after the script runs.",'On next card, press Enter on "Script prev"; activeCardId should return to home.'],wml:`<wml>
  <card id="home">
    <p>WMLBrowser var/nav subset demo.</p>
    <a href="script:wmlbrowser-demo.wmlsc#main">Script setVar + go</a>
  </card>
  <card id="next">
    <p>Navigation came from script go().</p>
    <a href="script:wmlbrowser-demo.wmlsc#back">Script prev</a>
  </card>
</wml>
`},{key:"wrapStress",label:"Long Token Wrap",description:"Long unbroken token fixture for deterministic wrapping checks.",goal:"Detect layout regressions in char-width wrapping and ensure navigation remains usable.",workItems:["A3-01"],specItems:["WML-R-004"],testingAc:["Load the deck and confirm the long token wraps consistently in the canvas viewport.","Reload the same deck multiple times and verify visual wrapping does not drift.",'Press Enter on "Continue" and confirm activeCardId transitions to next.','Press Enter on "Back" and confirm return to home.'],wml:`<wml>
  <card id="home">
    <p>supercalifragilisticpseudopneumonoultramicroscopicsilicovolcanoconiosis</p>
    <a href="#next">Continue</a>
  </card>
  <card id="next">
    <p>Wrap test complete.</p>
    <a href="#home">Back</a>
  </card>
</wml>
`}];function Nt(i){return i==="ArrowUp"?"up":i==="ArrowDown"?"down":i==="Enter"?"enter":null}function ae(i){let e=!1;const t=()=>{i.container.classList.toggle(i.collapsedClass,e),i.toggleButton.textContent=e?"Expand":"Collapse",i.toggleButton.setAttribute("aria-expanded",String(!e))};return{apply:t,toggle:()=>{e=!e,t()}}}function Mt(i,e){i.textContent=[`activeCardId: ${e.activeCardId}`,`focusedLinkIndex: ${e.focusedLinkIndex}`,`baseUrl: ${e.baseUrl}`,`contentType: ${e.contentType}`,`nextCardVar: ${e.nextCardVar??"(none)"}`,`externalNavigationIntent: ${e.externalNavigationIntent??"(none)"}`,`lastScriptExecutionOk: ${e.lastScriptExecutionOk??"(none)"}`,`lastScriptExecutionTrap: ${e.lastScriptExecutionTrap??"(none)"}`,`lastScriptExecutionErrorClass: ${e.lastScriptExecutionErrorClass??"(none)"}`,`lastScriptExecutionErrorCategory: ${e.lastScriptExecutionErrorCategory??"(none)"}`,`lastScriptRequiresRefresh: ${e.lastScriptRequiresRefresh??"(none)"}`].join(`
`)}class Bt{logs=new Map;sequence=1;activeExampleKey;output;constructor(e,t){this.output=e,this.activeExampleKey=t}setActiveExample(e){this.activeExampleKey=e,this.renderActive()}append(e,t){const n=new Date().toLocaleTimeString("en-CA",{hour12:!1}),r=t?`activeCardId=${t.activeCardId} focus=${t.focusedLinkIndex} intent=${t.externalNavigationIntent??"(none)"}`:"",o=`${String(this.sequence).padStart(4,"0")} ${n} | ${e}${r?` | ${r}`:""}`;this.sequence+=1;const a=this.logs.get(this.activeExampleKey)??[];a.push(o),this.logs.set(this.activeExampleKey,a),this.output.textContent=a.join(`
`)}clearActive(){this.logs.set(this.activeExampleKey,[]),this.renderActive()}renderActive(){const e=this.logs.get(this.activeExampleKey)??[];this.output.textContent=e.length>0?e.join(`
`):"No events yet for this example."}exportActive(e){const t=this.logs.get(this.activeExampleKey)??[];if(t.length===0)return null;const n=new Date().toISOString();return e==="json"?{filename:`wavenav-event-log-${this.activeExampleKey}.json`,mimeType:"application/json;charset=utf-8",payload:JSON.stringify({exampleKey:this.activeExampleKey,exportedAt:n,events:t},null,2)}:{filename:`wavenav-event-log-${this.activeExampleKey}.txt`,mimeType:"text/plain;charset=utf-8",payload:[`exampleKey: ${this.activeExampleKey}`,`exportedAt: ${n}`,"",...t].join(`
`)}}}function rt(i,e){const t=[...e.workItems,...e.specItems];i.title.textContent=`${e.label} (${e.key})`,i.coverage.textContent=`Coverage: ${t.join(", ")}`,i.description.textContent=`Description: ${e.description}`,i.goal.textContent=`Goal: ${e.goal}`,i.testingAc.replaceChildren();for(const n of e.testingAc){const r=document.createElement("li");r.textContent=n,i.testingAc.appendChild(r)}}function ft(i){const e=new Blob([i.payload],{type:i.mimeType}),t=URL.createObjectURL(e),n=document.createElement("a");n.href=t,n.download=i.filename,document.body.appendChild(n),n.click(),n.remove(),URL.revokeObjectURL(t)}const ce=globalThis,Ee=ce.ShadowRoot&&(ce.ShadyCSS===void 0||ce.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ke=Symbol(),it=new WeakMap;let gt=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==ke)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(Ee&&e===void 0){const n=t!==void 0&&t.length===1;n&&(e=it.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&it.set(t,e))}return e}toString(){return this.cssText}};const Ut=i=>new gt(typeof i=="string"?i:i+"",void 0,ke),Ft=(i,...e)=>{const t=i.length===1?i[0]:e.reduce((n,r,o)=>n+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+i[o+1],i[0]);return new gt(t,i,ke)},Wt=(i,e)=>{if(Ee)i.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const n=document.createElement("style"),r=ce.litNonce;r!==void 0&&n.setAttribute("nonce",r),n.textContent=t.cssText,i.appendChild(n)}},ot=Ee?i=>i:i=>i instanceof CSSStyleSheet?(e=>{let t="";for(const n of e.cssRules)t+=n.cssText;return Ut(t)})(i):i;const{is:Dt,defineProperty:qt,getOwnPropertyDescriptor:Vt,getOwnPropertyNames:jt,getOwnPropertySymbols:Kt,getPrototypeOf:Ht}=Object,de=globalThis,at=de.trustedTypes,zt=at?at.emptyScript:"",Gt=de.reactiveElementPolyfillSupport,G=(i,e)=>i,xe={toAttribute(i,e){switch(e){case Boolean:i=i?zt:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,e){let t=i;switch(e){case Boolean:t=i!==null;break;case Number:t=i===null?null:Number(i);break;case Object:case Array:try{t=JSON.parse(i)}catch{t=null}}return t}},_t=(i,e)=>!Dt(i,e),st={attribute:!0,type:String,converter:xe,reflect:!1,useDefault:!1,hasChanged:_t};Symbol.metadata??=Symbol("metadata"),de.litPropertyMetadata??=new WeakMap;let W=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=st){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&qt(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){const{get:r,set:o}=Vt(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get:r,set(a){const l=r?.call(this);o?.call(this,a),this.requestUpdate(e,l,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??st}static _$Ei(){if(this.hasOwnProperty(G("elementProperties")))return;const e=Ht(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(G("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(G("properties"))){const t=this.properties,n=[...jt(t),...Kt(t)];for(const r of n)this.createProperty(r,t[r])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[n,r]of t)this.elementProperties.set(n,r)}this._$Eh=new Map;for(const[t,n]of this.elementProperties){const r=this._$Eu(t,n);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const n=new Set(e.flat(1/0).reverse());for(const r of n)t.unshift(ot(r))}else e!==void 0&&t.push(ot(e));return t}static _$Eu(e,t){const n=t.attribute;return n===!1?void 0:typeof n=="string"?n:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Wt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){const n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&n.reflect===!0){const o=(n.converter?.toAttribute!==void 0?n.converter:xe).toAttribute(t,n.type);this._$Em=e,o==null?this.removeAttribute(r):this.setAttribute(r,o),this._$Em=null}}_$AK(e,t){const n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){const o=n.getPropertyOptions(r),a=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:xe;this._$Em=r;const l=a.fromAttribute(t,o.type);this[r]=l??this._$Ej?.get(r)??l,this._$Em=null}}requestUpdate(e,t,n,r=!1,o){if(e!==void 0){const a=this.constructor;if(r===!1&&(o=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??_t)(o,t)||n.useDefault&&n.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:o},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),o!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),r===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[r,o]of this._$Ep)this[r]=o;this._$Ep=void 0}const n=this.constructor.elementProperties;if(n.size>0)for(const[r,o]of n){const{wrapped:a}=o,l=this[r];a!==!0||this._$AL.has(r)||l===void 0||this.C(r,void 0,o,l)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(n=>n.hostUpdate?.()),this.update(t)):this._$EM()}catch(n){throw e=!1,this._$EM(),n}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};W.elementStyles=[],W.shadowRootOptions={mode:"open"},W[G("elementProperties")]=new Map,W[G("finalized")]=new Map,Gt?.({ReactiveElement:W}),(de.reactiveElementVersions??=[]).push("2.1.2");const Se=globalThis,ct=i=>i,le=Se.trustedTypes,lt=le?le.createPolicy("lit-html",{createHTML:i=>i}):void 0,wt="$lit$",L=`lit$${Math.random().toFixed(9).slice(2)}$`,bt="?"+L,Qt=`<${bt}>`,B=document,X=()=>B.createComment(""),Y=i=>i===null||typeof i!="object"&&typeof i!="function",Ce=Array.isArray,Xt=i=>Ce(i)||typeof i?.[Symbol.iterator]=="function",be=`[ 	
\f\r]`,K=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,dt=/-->/g,pt=/>/g,P=RegExp(`>|${be}(?:([^\\s"'>=/]+)(${be}*=${be}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ut=/'/g,ht=/"/g,vt=/^(?:script|style|textarea|title)$/i,Yt=i=>(e,...t)=>({_$litType$:i,strings:e,values:t}),Jt=Yt(1),q=Symbol.for("lit-noChange"),y=Symbol.for("lit-nothing"),mt=new WeakMap,M=B.createTreeWalker(B,129);function yt(i,e){if(!Ce(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return lt!==void 0?lt.createHTML(e):e}const Zt=(i,e)=>{const t=i.length-1,n=[];let r,o=e===2?"<svg>":e===3?"<math>":"",a=K;for(let l=0;l<t;l++){const d=i[l];let w,b,m=-1,k=0;for(;k<d.length&&(a.lastIndex=k,b=a.exec(d),b!==null);)k=a.lastIndex,a===K?b[1]==="!--"?a=dt:b[1]!==void 0?a=pt:b[2]!==void 0?(vt.test(b[2])&&(r=RegExp("</"+b[2],"g")),a=P):b[3]!==void 0&&(a=P):a===P?b[0]===">"?(a=r??K,m=-1):b[1]===void 0?m=-2:(m=a.lastIndex-b[2].length,w=b[1],a=b[3]===void 0?P:b[3]==='"'?ht:ut):a===ht||a===ut?a=P:a===dt||a===pt?a=K:(a=P,r=void 0);const x=a===P&&i[l+1].startsWith("/>")?" ":"";o+=a===K?d+Qt:m>=0?(n.push(w),d.slice(0,m)+wt+d.slice(m)+L+x):d+L+(m===-2?l:x)}return[yt(i,o+(i[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),n]};class J{constructor({strings:e,_$litType$:t},n){let r;this.parts=[];let o=0,a=0;const l=e.length-1,d=this.parts,[w,b]=Zt(e,t);if(this.el=J.createElement(w,n),M.currentNode=this.el.content,t===2||t===3){const m=this.el.content.firstChild;m.replaceWith(...m.childNodes)}for(;(r=M.nextNode())!==null&&d.length<l;){if(r.nodeType===1){if(r.hasAttributes())for(const m of r.getAttributeNames())if(m.endsWith(wt)){const k=b[a++],x=r.getAttribute(m).split(L),R=/([.?@])?(.*)/.exec(k);d.push({type:1,index:o,name:R[2],strings:x,ctor:R[1]==="."?tn:R[1]==="?"?nn:R[1]==="@"?rn:pe}),r.removeAttribute(m)}else m.startsWith(L)&&(d.push({type:6,index:o}),r.removeAttribute(m));if(vt.test(r.tagName)){const m=r.textContent.split(L),k=m.length-1;if(k>0){r.textContent=le?le.emptyScript:"";for(let x=0;x<k;x++)r.append(m[x],X()),M.nextNode(),d.push({type:2,index:++o});r.append(m[k],X())}}}else if(r.nodeType===8)if(r.data===bt)d.push({type:2,index:o});else{let m=-1;for(;(m=r.data.indexOf(L,m+1))!==-1;)d.push({type:7,index:o}),m+=L.length-1}o++}}static createElement(e,t){const n=B.createElement("template");return n.innerHTML=e,n}}function V(i,e,t=i,n){if(e===q)return e;let r=n!==void 0?t._$Co?.[n]:t._$Cl;const o=Y(e)?void 0:e._$litDirective$;return r?.constructor!==o&&(r?._$AO?.(!1),o===void 0?r=void 0:(r=new o(i),r._$AT(i,t,n)),n!==void 0?(t._$Co??=[])[n]=r:t._$Cl=r),r!==void 0&&(e=V(i,r._$AS(i,e.values),r,n)),e}class en{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??B).importNode(t,!0);M.currentNode=r;let o=M.nextNode(),a=0,l=0,d=n[0];for(;d!==void 0;){if(a===d.index){let w;d.type===2?w=new Z(o,o.nextSibling,this,e):d.type===1?w=new d.ctor(o,d.name,d.strings,this,e):d.type===6&&(w=new on(o,this,e)),this._$AV.push(w),d=n[++l]}a!==d?.index&&(o=M.nextNode(),a++)}return M.currentNode=B,r}p(e){let t=0;for(const n of this._$AV)n!==void 0&&(n.strings!==void 0?(n._$AI(e,n,t),t+=n.strings.length-2):n._$AI(e[t])),t++}}class Z{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=y,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=V(this,e,t),Y(e)?e===y||e==null||e===""?(this._$AH!==y&&this._$AR(),this._$AH=y):e!==this._$AH&&e!==q&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Xt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==y&&Y(this._$AH)?this._$AA.nextSibling.data=e:this.T(B.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:n}=e,r=typeof n=="number"?this._$AC(e):(n.el===void 0&&(n.el=J.createElement(yt(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{const o=new en(r,this),a=o.u(this.options);o.p(t),this.T(a),this._$AH=o}}_$AC(e){let t=mt.get(e.strings);return t===void 0&&mt.set(e.strings,t=new J(e)),t}k(e){Ce(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let n,r=0;for(const o of e)r===t.length?t.push(n=new Z(this.O(X()),this.O(X()),this,this.options)):n=t[r],n._$AI(o),r++;r<t.length&&(this._$AR(n&&n._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const n=ct(e).nextSibling;ct(e).remove(),e=n}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}}class pe{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,o){this.type=1,this._$AH=y,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=o,n.length>2||n[0]!==""||n[1]!==""?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=y}_$AI(e,t=this,n,r){const o=this.strings;let a=!1;if(o===void 0)e=V(this,e,t,0),a=!Y(e)||e!==this._$AH&&e!==q,a&&(this._$AH=e);else{const l=e;let d,w;for(e=o[0],d=0;d<o.length-1;d++)w=V(this,l[n+d],t,d),w===q&&(w=this._$AH[d]),a||=!Y(w)||w!==this._$AH[d],w===y?e=y:e!==y&&(e+=(w??"")+o[d+1]),this._$AH[d]=w}a&&!r&&this.j(e)}j(e){e===y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class tn extends pe{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===y?void 0:e}}class nn extends pe{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==y)}}class rn extends pe{constructor(e,t,n,r,o){super(e,t,n,r,o),this.type=5}_$AI(e,t=this){if((e=V(this,e,t,0)??y)===q)return;const n=this._$AH,r=e===y&&n!==y||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,o=e!==y&&(n===y||r);r&&this.element.removeEventListener(this.name,this,n),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class on{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){V(this,e)}}const an=Se.litHtmlPolyfillSupport;an?.(J,Z),(Se.litHtmlVersions??=[]).push("3.3.2");const sn=(i,e,t)=>{const n=t?.renderBefore??e;let r=n._$litPart$;if(r===void 0){const o=t?.renderBefore??null;n._$litPart$=r=new Z(e.insertBefore(X(),o),o,void 0,t??{})}return r._$AI(i),r};const $e=globalThis;class Q extends W{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=sn(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}Q._$litElement$=!0,Q.finalized=!0,$e.litElementHydrateSupport?.({LitElement:Q});const cn=$e.litElementPolyfillSupport;cn?.({LitElement:Q});($e.litElementVersions??=[]).push("4.2.2");class ln extends Q{static properties={entries:{attribute:!1},exportFormat:{state:!0},kindFilter:{state:!0},cardFilter:{state:!0},trapsOnly:{state:!0}};static styles=Ft`
    .trace-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .trace-actions button {
      font-size: 0.75rem;
      padding: 6px 10px;
      background: #1552a1;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .trace-export-label {
      font-size: 0.78rem;
      align-self: center;
    }

    #trace-export-format {
      border: 1px solid #d8d2c3;
      border-radius: 8px;
      background: #fff;
      font-size: 0.78rem;
      padding: 6px 8px;
    }

    .trace-filters {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .trace-filters label,
    .trace-presets-label {
      font-size: 0.78rem;
    }

    .trace-filters button {
      font-size: 0.72rem;
      padding: 5px 8px;
      background: #1552a1;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .trace-filters input[type='text'] {
      border: 1px solid #d8d2c3;
      border-radius: 8px;
      background: #fff;
      font-size: 0.78rem;
      padding: 6px 8px;
      min-width: 120px;
    }

    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .trace-traps-only {
      min-width: 0;
    }

    .engine-trace {
      margin: 0;
      min-height: 120px;
      max-height: 220px;
      overflow: auto;
      border: 1px solid #d8d2c3;
      border-radius: 8px;
      padding: 10px;
      background: #fcfcfc;
      font-size: 0.74rem;
      line-height: 1.45;
      font-family: 'IBM Plex Mono', Consolas, monospace;
      white-space: pre-wrap;
    }
  `;entries=[];exportFormat="txt";kindFilter="";cardFilter="";trapsOnly=!1;render(){const e=this.getFilteredEntries(),t=e.length===0?"No engine trace entries yet.":e.map(n=>{const r=n.active_card_id??"(none)",o=n.external_navigation_intent??"(none)",a=typeof n.script_ok=="boolean"?String(n.script_ok):"(none)",l=n.script_trap??"(none)";return`${n.seq.toString().padStart(4,"0")} ${n.kind} detail="${n.detail}" card=${r} focus=${n.focused_link_index} intent=${o} scriptOk=${a} trap=${l}`}).join(`
`);return Jt`
      <div class="trace-actions">
        <button type="button" @click=${this.onClearClicked}>Clear Engine Trace</button>
        <label class="trace-export-label" for="trace-export-format">Export as</label>
        <select
          id="trace-export-format"
          .value=${this.exportFormat}
          @change=${this.onExportFormatChanged}
        >
          <option value="txt">Text (.txt)</option>
          <option value="json">JSON (.json)</option>
        </select>
        <button type="button" @click=${this.onExportClicked}>Export Engine Trace</button>
      </div>
      <div class="trace-filters">
        <span class="trace-presets-label">Presets</span>
        <button type="button" @click=${()=>this.applyPreset("all")}>All</button>
        <button type="button" @click=${()=>this.applyPreset("scripts")}>Scripts</button>
        <button type="button" @click=${()=>this.applyPreset("navigation")}>Navigation</button>
        <button type="button" @click=${()=>this.applyPreset("traps")}>Traps</button>
        <label for="trace-filter-kind">Kind</label>
        <input
          id="trace-filter-kind"
          type="text"
          placeholder="e.g. ACTION_SCRIPT"
          .value=${this.kindFilter}
          @input=${this.onKindFilterChanged}
        />
        <label for="trace-filter-card">Card</label>
        <input
          id="trace-filter-card"
          type="text"
          placeholder="e.g. home"
          .value=${this.cardFilter}
          @input=${this.onCardFilterChanged}
        />
        <label class="checkbox-row trace-traps-only" for="trace-filter-traps">
          <input
            id="trace-filter-traps"
            type="checkbox"
            .checked=${this.trapsOnly}
            @change=${this.onTrapsOnlyChanged}
          />
          Traps only
        </label>
      </div>
      <pre class="engine-trace">${t}</pre>
    `}getFilteredEntries(){const e=this.kindFilter.trim().toLowerCase(),t=this.cardFilter.trim().toLowerCase();return this.entries.filter(n=>{if(this.trapsOnly&&!n.script_trap||e&&!n.kind.toLowerCase().includes(e))return!1;const r=n.active_card_id??"";return!(t&&!r.toLowerCase().includes(t))})}onClearClicked=()=>{this.dispatchEvent(new CustomEvent("trace-clear-requested"))};onExportFormatChanged=e=>{const t=e.target;this.exportFormat=t.value==="json"?"json":"txt"};onExportClicked=()=>{const e=this.getFilteredEntries(),t=this.exportFormat;if(e.length===0){this.dispatchEvent(new CustomEvent("trace-exported",{detail:{outcome:"empty",format:t,count:0}}));return}const n=new Date().toISOString(),r=t==="json"?{filename:"wavenav-engine-trace.json",mimeType:"application/json",payload:JSON.stringify({exportedAt:n,entries:e},null,2)}:{filename:"wavenav-engine-trace.txt",mimeType:"text/plain",payload:[`exportedAt: ${n}`,`entryCount: ${e.length}`,"",...e.map(o=>{const a=o.active_card_id??"(none)",l=o.external_navigation_intent??"(none)",d=typeof o.script_ok=="boolean"?String(o.script_ok):"(none)",w=o.script_trap??"(none)";return`${o.seq.toString().padStart(4,"0")} ${o.kind} detail="${o.detail}" card=${a} focus=${o.focused_link_index} intent=${l} scriptOk=${d} trap=${w}`})].join(`
`)};ft(r),this.dispatchEvent(new CustomEvent("trace-exported",{detail:{outcome:"exported",format:t,count:e.length}}))};applyPreset(e){e==="all"?(this.kindFilter="",this.cardFilter="",this.trapsOnly=!1):e==="scripts"?(this.kindFilter="ACTION_SCRIPT",this.cardFilter="",this.trapsOnly=!1):e==="navigation"?(this.kindFilter="ACTION_",this.cardFilter="",this.trapsOnly=!1):(this.kindFilter="",this.cardFilter="",this.trapsOnly=!0),this.dispatchEvent(new CustomEvent("trace-preset-applied",{detail:{preset:e}}))}onKindFilterChanged=e=>{const t=e.target;this.kindFilter=t.value};onCardFilterChanged=e=>{const t=e.target;this.cardFilter=t.value};onTrapsOnlyChanged=e=>{const t=e.target;this.trapsOnly=t.checked}}customElements.define("runtime-inspector-panel",ln);const dn=250,pn=100,un=new Set([100,250,500,1e3]);async function hn(){const i=document.querySelector("#wap-screen"),e=document.querySelector("#deck-input"),t=document.querySelector("#reload-deck"),n=document.querySelector("#example-select"),r=document.querySelector(".editor-wrap"),o=document.querySelector("#toggle-editor"),a=document.querySelector("#live-reload"),l=document.querySelector("#press-back"),d=document.querySelector("#press-up"),w=document.querySelector("#press-down"),b=document.querySelector("#press-enter"),m=document.querySelector("#tick-100ms"),k=document.querySelector("#tick-1s"),x=document.querySelector("#auto-tick-step"),R=document.querySelector("#toggle-auto-tick"),Ae=document.querySelector("#clear-intent"),Re=document.querySelector("#copy-intent"),Ie=document.querySelector("#probe-execute-script"),Te=document.querySelector("#probe-invoke-script"),Le=document.querySelector(".event-log-wrap"),ue=document.querySelector("#toggle-event-log"),Pe=document.querySelector("#clear-event-log"),Oe=document.querySelector("#event-log-export-format"),Ne=document.querySelector("#export-event-log"),Me=document.querySelector(".trace-wrap"),he=document.querySelector("#toggle-trace"),U=document.querySelector("#runtime-inspector"),f=document.querySelector("#status"),Be=document.querySelector("#runtime-state"),Ue=document.querySelector("#event-log"),Fe=document.querySelector(".example-meta"),me=document.querySelector("#toggle-example-meta"),We=document.querySelector("#example-title"),De=document.querySelector("#example-coverage"),qe=document.querySelector("#example-description"),Ve=document.querySelector("#example-goal"),je=document.querySelector("#example-testing-ac");if(!i||!e||!t||!n||!r||!o||!a||!l||!d||!w||!b||!m||!k||!x||!R||!Ae||!Re||!Ie||!Te||!Le||!ue||!Pe||!Oe||!Ne||!Me||!he||!U||!f||!Be||!Ue||!Fe||!me||!We||!De||!qe||!Ve||!je)throw new Error("Host sample DOM not found");n.replaceChildren();for(const c of oe){const p=document.createElement("option");p.value=c.key,p.textContent=c.label,n.appendChild(p)}if(oe.length===0)throw new Error("No examples available. Run: pnpm run examples:generate");const xt=new Map(oe.map(c=>[c.key,c])),F=oe[0];n.value=F.key,e.value=F.wml;const S=await Ot(i,e.value);f.textContent=`Loaded example: ${F.key}`;let ee=F.key;const Ke={title:We,coverage:De,description:qe,goal:Ve,testingAc:je},He=ae({container:Fe,toggleButton:me,collapsedClass:"is-collapsed"}),ze=ae({container:r,toggleButton:o,collapsedClass:"is-collapsed"}),Ge=ae({container:Le,toggleButton:ue,collapsedClass:"is-collapsed"}),Qe=ae({container:Me,toggleButton:he,collapsedClass:"is-collapsed"}),j=new Bt(Ue,F.key);U.addEventListener("trace-clear-requested",()=>{S.clearTraceEntries(),U.entries=S.traceEntries(),f.textContent="Cleared engine trace.",g("TRACE_CLEARED")}),U.addEventListener("trace-exported",c=>{const p=c.detail;if(p.outcome==="empty"){f.textContent="No engine trace entries to export.",g("TRACE_EXPORT_SKIPPED (empty)");return}f.textContent=`Exported ${p.count} engine trace entr${p.count===1?"y":"ies"} as ${p.format}.`,g(`TRACE_EXPORTED (${p.format})`)}),U.addEventListener("trace-preset-applied",c=>{const p=c.detail;f.textContent=`Applied trace preset: ${p.preset}`,g(`TRACE_PRESET (${p.preset})`)});const E=()=>{const c=S.snapshot();return Mt(Be,c),U.entries=S.traceEntries(),c},g=(c,p)=>j.append(c,p),fe=(c,p)=>{try{S.loadDeck(e.value);const v=E();f.textContent=`${c} Active card: ${v.activeCardId}`,g(`LOAD (${p})`,v)}catch(v){f.textContent=`Load error: ${String(v)}`;const C=E();g(`LOAD_ERROR (${p}) ${String(v)}`,C)}},te=c=>{try{S.pressKey(c);const p=E();f.textContent=`Key "${c}" applied. Active card: ${p.activeCardId}`,g(`KEY ${c}`,p)}catch(p){f.textContent=`Key error (${c}): ${String(p)}`;const v=E();g(`KEY_ERROR ${c} ${String(p)}`,v)}};let I=pn;x.value=String(I);let T=null;const ne=()=>{const c=T!==null;R.setAttribute("aria-pressed",c?"true":"false"),R.textContent=c?`Auto Tick: On (${I}ms)`:"Auto Tick: Off"},re=c=>{if(T&&(clearInterval(T),T=null,ne(),c)){const p=E();f.textContent=c,g("AUTO_TICK_STOP",p)}};let ie=null;const Et=()=>{a.checked&&(ie&&clearTimeout(ie),ie=setTimeout(()=>{fe("Live reload complete.","live-reload"),ie=null},dn))};n.addEventListener("change",()=>{const c=n.value,p=xt.get(c);p&&(ee=c,j.setActiveExample(c),e.value=p.wml,rt(Ke,p),g("EXAMPLE_SELECTED"),fe(`Loaded example: ${c}.`,"example-select"))}),me.addEventListener("click",()=>He.toggle()),o.addEventListener("click",()=>ze.toggle()),ue.addEventListener("click",()=>Ge.toggle()),he.addEventListener("click",()=>Qe.toggle()),t.addEventListener("click",()=>{fe("Deck reloaded.","manual-reload")}),e.addEventListener("input",Et),d.addEventListener("click",()=>te("up")),w.addEventListener("click",()=>te("down")),b.addEventListener("click",()=>te("enter"));const ge=(c,p="manual")=>{try{const v=S.snapshot().activeCardId;S.advanceTimeMs(c);const C=E();if(p==="manual"){f.textContent=`Advanced timer clock by ${c}ms. Active card: ${C.activeCardId}`,g(`TICK ${c}ms`,C);return}C.activeCardId!==v&&(f.textContent=`Auto tick advanced card: ${v} -> ${C.activeCardId}`,g(`AUTO_TICK_NAV ${v}->${C.activeCardId}`,C))}catch(v){const C=E();if(p==="auto"){re(),f.textContent=`Auto tick error (${c}ms): ${String(v)}`,g(`AUTO_TICK_ERROR ${c}ms ${String(v)}`,C);return}f.textContent=`Tick error (${c}ms): ${String(v)}`,g(`TICK_ERROR ${c}ms ${String(v)}`,C)}},Xe=()=>{if(T)return;T=setInterval(()=>ge(I,"auto"),I),ne();const c=E();f.textContent=`Auto tick started (${I}ms).`,g("AUTO_TICK_START",c)};m.addEventListener("click",()=>ge(100)),k.addEventListener("click",()=>ge(1e3)),x.addEventListener("change",()=>{const c=Number.parseInt(x.value,10);if(!un.has(c)){x.value=String(I);return}if(I=c,T){re(),Xe();return}ne()}),R.addEventListener("click",()=>{if(T){re(`Auto tick stopped (${I}ms).`);return}Xe()}),l.addEventListener("click",()=>{const c=S.navigateBack(),p=E();f.textContent=c?`Back applied. Active card: ${p.activeCardId}`:"Back ignored (history empty).",g(c?"BACK":"BACK_EMPTY",p)}),Ae.addEventListener("click",()=>{S.clearExternalNavigationIntent();const c=E();f.textContent="External navigation intent cleared.",g("INTENT_CLEARED",c)}),Re.addEventListener("click",async()=>{const c=S.snapshot(),p=c.externalNavigationIntent;if(!p){f.textContent="No external intent to copy.",g("INTENT_COPY_SKIPPED (none)",c);return}try{await navigator.clipboard.writeText(p),f.textContent="External intent URL copied.",g("INTENT_COPIED",c)}catch(v){f.textContent=`Copy intent failed: ${String(v)}`,g(`INTENT_COPY_ERROR ${String(v)}`,c)}}),Ie.addEventListener("click",()=>{try{const c=S.executeScriptRefFunction("wavescript-fixtures.wmlsc","externalGo"),p=E();f.textContent=`executeScriptRefFunction externalGo => ok=${c.ok}; intent=${p.externalNavigationIntent??"(none)"}`,g("SCRIPT_PROBE_EXECUTE externalGo",p)}catch(c){const p=E();f.textContent=`executeScriptRefFunction error: ${String(c)}`,g(`SCRIPT_PROBE_EXECUTE_ERROR ${String(c)}`,p)}}),Te.addEventListener("click",()=>{try{const c=S.invokeScriptRefFunction("wavescript-fixtures.wmlsc","externalGo"),p=E();f.textContent=`invokeScriptRefFunction externalGo => nav=${c.effects.navigationIntent.type}; intent=${p.externalNavigationIntent??"(none)"}`,g("SCRIPT_PROBE_INVOKE externalGo",p)}catch(c){const p=E();f.textContent=`invokeScriptRefFunction error: ${String(c)}`,g(`SCRIPT_PROBE_INVOKE_ERROR ${String(c)}`,p)}}),Pe.addEventListener("click",()=>{j.clearActive(),f.textContent=`Cleared event log for example: ${ee}`}),Ne.addEventListener("click",()=>{const c=Oe.value==="json"?"json":"txt",p=j.exportActive(c);if(!p){f.textContent=`No events to export for example: ${ee}`,g("EVENT_LOG_EXPORT_SKIPPED (empty)");return}ft(p),f.textContent=`Exported event log for example: ${ee}`,g("EVENT_LOG_EXPORTED")}),window.addEventListener("keydown",c=>{if(c.target===e)return;const p=Nt(c.key);p&&(c.preventDefault(),te(p))}),window.addEventListener("beforeunload",()=>{re()}),rt(Ke,F),He.apply(),ze.apply(),Ge.apply(),Qe.apply(),ne();const kt=E();g("BOOT"),g("INITIAL_LOAD",kt),j.renderActive()}hn().catch(i=>{const e=document.querySelector("#status");e&&(e.textContent=`Boot error: ${String(i)}`)});
